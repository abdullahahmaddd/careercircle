from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
import uuid

from backend.models import (
    UserInDB, PodCreate, PodResponse, PodInDB, PodInvite, 
    ShareResumeRequest, CommentCreate, SharedResume, Comment, PodMember
)
from backend.database import get_database
from backend.routes.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[PodResponse])
async def list_pods(current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    # Find pods where user is owner OR a member
    query = {
        "$or": [
            {"owner_id": str(current_user.id)},
            {"members.id": str(current_user.id)} 
        ]
    }
    
    pods = await db.pods.find(query).to_list(length=100)
    return [PodInDB(**pod) for pod in pods]

@router.post("/", response_model=PodResponse)
async def create_pod(pod: PodCreate, current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    
    # Add owner to members list automatically
    owner_member = PodMember(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email
    )

    pod_data = {
        "owner_id": str(current_user.id),
        "owner_name": current_user.name,
        "name": pod.name,
        "members": [owner_member.model_dump()],
        "shared_resumes": [],
        "created_at": datetime.utcnow()
    }
    
    new_pod = await db.pods.insert_one(pod_data)
    created_pod = await db.pods.find_one({"_id": new_pod.inserted_id})
    
    return PodInDB(**created_pod)

@router.post("/{pod_id}/invite", response_model=PodResponse)
async def invite_member(pod_id: str, invite: PodInvite, current_user: UserInDB = Depends(get_current_user)):
    if not ObjectId.is_valid(pod_id):
        raise HTTPException(status_code=400, detail="Invalid pod ID")
        
    db = get_database()
    
    pod = await db.pods.find_one({"_id": ObjectId(pod_id)})
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
    
    # Check if current user is owner or member
    is_owner = pod["owner_id"] == str(current_user.id)
    is_member = any(m["id"] == str(current_user.id) for m in pod.get("members", []))
    
    if not (is_owner or is_member):
         raise HTTPException(status_code=403, detail="Not authorized to invite to this pod")

    # Check if user to invite exists
    invited_user = await db.users.find_one({"email": invite.email})
    if not invited_user:
        raise HTTPException(status_code=404, detail="User with this email not found")
        
    # Check if already a member or owner
    if any(m["email"] == invite.email for m in pod.get("members", [])) or pod["owner_id"] == str(invited_user["_id"]):
        raise HTTPException(status_code=400, detail="User already in pod")

    new_member = PodMember(
        id=str(invited_user["_id"]),
        name=invited_user["name"],
        email=invited_user["email"]
    )
    
    await db.pods.update_one(
        {"_id": ObjectId(pod_id)},
        {"$push": {"members": new_member.model_dump()}}
    )
    
    updated_pod = await db.pods.find_one({"_id": ObjectId(pod_id)})
    return PodInDB(**updated_pod)

@router.post("/{pod_id}/share", response_model=PodResponse)
async def share_resume(pod_id: str, share_req: ShareResumeRequest, current_user: UserInDB = Depends(get_current_user)):
    if not ObjectId.is_valid(pod_id):
        raise HTTPException(status_code=400, detail="Invalid pod ID")
        
    db = get_database()
    
    # Verify pod access
    pod = await db.pods.find_one({"_id": ObjectId(pod_id)})
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
        
    is_owner = pod["owner_id"] == str(current_user.id)
    is_member = any(m["id"] == str(current_user.id) for m in pod.get("members", []))
    
    if not (is_owner or is_member):
         raise HTTPException(status_code=403, detail="Not authorized to share to this pod")

    # Fetch resume
    if not ObjectId.is_valid(share_req.resume_id):
        raise HTTPException(status_code=400, detail="Invalid resume ID")

    resume = await db.resumes.find_one({"_id": ObjectId(share_req.resume_id), "user_id": str(current_user.id)})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found or not owned by you")

    # Create SharedResume
    shared_resume = SharedResume(
        resume_owner_id=str(current_user.id),
        resume_owner_name=current_user.name,
        version_resume=resume.get("content", {}),
        comments=[]
    )
    
    await db.pods.update_one(
        {"_id": ObjectId(pod_id)},
        {"$push": {"shared_resumes": shared_resume.model_dump()}}
    )
    
    updated_pod = await db.pods.find_one({"_id": ObjectId(pod_id)})
    return PodInDB(**updated_pod)

@router.post("/{pod_id}/shared/{shared_resume_id}/comments", response_model=PodResponse)
async def add_comment(
    pod_id: str, 
    shared_resume_id: str, 
    comment: CommentCreate, 
    current_user: UserInDB = Depends(get_current_user)
):
    if not ObjectId.is_valid(pod_id):
        raise HTTPException(status_code=400, detail="Invalid pod ID")
        
    db = get_database()
    
    pod = await db.pods.find_one({"_id": ObjectId(pod_id)})
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")

    is_owner = pod["owner_id"] == str(current_user.id)
    is_member = any(m["id"] == str(current_user.id) for m in pod.get("members", []))
    
    if not (is_owner or is_member):
         raise HTTPException(status_code=403, detail="Not authorized")

    new_comment = Comment(
        author_id=str(current_user.id),
        author_name=current_user.name,
        text=comment.text,
        location=comment.location
    )
    
    result = await db.pods.update_one(
        {"_id": ObjectId(pod_id), "shared_resumes.id": shared_resume_id},
        {"$push": {"shared_resumes.$.comments": new_comment.model_dump()}}
    )
    
    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="Shared resume not found in this pod")

    updated_pod = await db.pods.find_one({"_id": ObjectId(pod_id)})
    return PodInDB(**updated_pod)

@router.delete("/{pod_id}/shared/{shared_resume_id}/comments/{comment_id}", response_model=PodResponse)
async def delete_comment(
    pod_id: str, 
    shared_resume_id: str, 
    comment_id: str, 
    current_user: UserInDB = Depends(get_current_user)
):
    if not ObjectId.is_valid(pod_id):
        raise HTTPException(status_code=400, detail="Invalid pod ID")
        
    db = get_database()
    
    query = {
        "_id": ObjectId(pod_id), 
        "shared_resumes.id": shared_resume_id,
    }
    
    result = await db.pods.update_one(
        query,
        {"$pull": {"shared_resumes.$.comments": {"id": comment_id, "author_id": str(current_user.id)}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Could not delete comment. Either not found or you are not the author.")

    updated_pod = await db.pods.find_one({"_id": ObjectId(pod_id)})
    return PodInDB(**updated_pod)