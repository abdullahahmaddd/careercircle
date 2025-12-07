from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from backend.database import get_database
import logging
from backend.models import (
    PlaylistCreate, PlaylistResponse, PlaylistInDB, 
    JobEntryCreate, JobEntryUpdate, JobEntry, UserInDB
)
from backend.routes.auth import get_current_user
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[PlaylistResponse])
async def list_playlists(current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    playlists_cursor = db.playlists.find({"user_id": str(current_user.id)})
    playlists = await playlists_cursor.to_list(length=100)
    return playlists

@router.post("/", response_model=PlaylistResponse)
async def create_playlist(playlist: PlaylistCreate, current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    
    playlist_in_db = PlaylistInDB(
        user_id=str(current_user.id),
        name=playlist.name,
        job_entries=[]
    )
    
    new_playlist = await db.playlists.insert_one(playlist_in_db.model_dump(by_alias=True, exclude={"id"}))
    created_playlist = await db.playlists.find_one({"_id": new_playlist.inserted_id})
    return PlaylistInDB(**created_playlist)

@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(playlist_id: str, current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    result = await db.playlists.delete_one({"_id": ObjectId(playlist_id), "user_id": str(current_user.id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return

@router.post("/{playlist_id}/entries", response_model=PlaylistResponse)
async def add_job_entry(
    playlist_id: str,
    job_entry: JobEntryCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    logger.info(f"Adding job entry to playlist {playlist_id} for user {current_user.id}")
    logger.info(f"Job Entry Payload: {job_entry}")
    db = get_database()

    target_playlist_id = None
    if playlist_id == "default-playlist":
        # Find the user's first playlist or create a default one
        existing_playlist = await db.playlists.find_one({"user_id": str(current_user.id)})
        if existing_playlist:
            target_playlist_id = existing_playlist["_id"]
        else:
            # Create a default playlist
            new_default_playlist = PlaylistInDB(
                user_id=str(current_user.id),
                name="My Job Search",
                job_entries=[]
            )
            insert_result = await db.playlists.insert_one(
                new_default_playlist.model_dump(by_alias=True, exclude={"id"})
            )
            target_playlist_id = insert_result.inserted_id
    else:
        if not ObjectId.is_valid(playlist_id):
            raise HTTPException(status_code=400, detail="Invalid playlist ID")
        target_playlist_id = ObjectId(playlist_id)
    
    # Create the new job entry object
    new_entry = JobEntry(
        role_title=job_entry.role_title,
        status=job_entry.status,
        application_deadline=job_entry.application_deadline,
        jd_text=job_entry.jd_text,
        parsed_jd=job_entry.parsed_jd
    )
    
    # Convert Pydantic model to dict, ensuring datetime/uuid compatibility if needed
    entry_dict = new_entry.model_dump()
    # Pydantic's model_dump might leave datetime objects, which Mongo handles, but let's be sure about what we're pushing
    logger.info(f"Pushing new entry: {entry_dict}")

    result = await db.playlists.update_one(
        {"_id": target_playlist_id, "user_id": str(current_user.id)},
        {"$push": {"job_entries": entry_dict}}
    )
    
    logger.info(f"Update result matched: {result.matched_count}, modified: {result.modified_count}")

    if result.modified_count == 0:
        # Check if playlist exists to differentiate between "not found" and "no change"
        playlist = await db.playlists.find_one({"_id": target_playlist_id, "user_id": str(current_user.id)})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
            
    updated_playlist = await db.playlists.find_one({"_id": target_playlist_id})
    return PlaylistInDB(**updated_playlist)

@router.patch("/{playlist_id}/entries/{entry_id}", response_model=PlaylistResponse)
async def update_job_entry(
    playlist_id: str,
    entry_id: str,
    entry_update: JobEntryUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    logger.info(f"Updating job entry {entry_id} in playlist {playlist_id}")
    logger.info(f"Update payload: {entry_update}")
    db = get_database()
    
    # Verify playlist ownership
    playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id), "user_id": str(current_user.id)})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Construct update data dynamically based on provided fields
    update_fields = {}
    if entry_update.role_title is not None:
        update_fields["job_entries.$.role_title"] = entry_update.role_title
    if entry_update.status is not None:
        update_fields["job_entries.$.status"] = entry_update.status
    if entry_update.application_deadline is not None:
        update_fields["job_entries.$.application_deadline"] = entry_update.application_deadline
    if entry_update.jd_text is not None:
        update_fields["job_entries.$.jd_text"] = entry_update.jd_text
    if entry_update.parsed_jd is not None:
        update_fields["job_entries.$.parsed_jd"] = entry_update.parsed_jd
        
    if not update_fields:
        logger.info("No fields to update")
        return PlaylistInDB(**playlist)

    logger.info(f"Update fields: {update_fields}")

    # Perform the update
    # Note: We match by playlist ID and the entry ID within the array
    result = await db.playlists.update_one(
        {"_id": ObjectId(playlist_id), "user_id": str(current_user.id), "job_entries.id": entry_id},
        {"$set": update_fields}
    )
    
    logger.info(f"Update result matched: {result.matched_count}, modified: {result.modified_count}")

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job entry not found in playlist")

    updated_playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id)})
    return PlaylistInDB(**updated_playlist)

@router.delete("/{playlist_id}/entries/{entry_id}", response_model=PlaylistResponse)
async def delete_job_entry(
    playlist_id: str,
    entry_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    logger.info(f"Deleting job entry {entry_id} from playlist {playlist_id}")
    db = get_database()
    
    result = await db.playlists.update_one(
        {"_id": ObjectId(playlist_id), "user_id": str(current_user.id)},
        {"$pull": {"job_entries": {"id": entry_id}}}
    )
    
    logger.info(f"Delete result matched: {result.matched_count}, modified: {result.modified_count}")

    if result.modified_count == 0:
        # Check if playlist exists
        playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id), "user_id": str(current_user.id)})
        if not playlist:
            raise HTTPException(status_code=404, detail="Playlist not found")
        # If playlist exists but nothing modified, it means entry wasn't found
        raise HTTPException(status_code=404, detail="Job entry not found")
        
    updated_playlist = await db.playlists.find_one({"_id": ObjectId(playlist_id)})
    return PlaylistInDB(**updated_playlist)