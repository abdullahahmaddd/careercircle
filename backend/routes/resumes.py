from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId
from backend.models import UserInDB, ResumeCreate, ResumeUpdate, ResumeResponse, ResumeInDB
from backend.database import get_database
from backend.routes.auth import get_current_user
from backend.resume_parser import parse_resume

router = APIRouter()

@router.post("/parse")
async def parse_resume_endpoint(file: UploadFile = File(...), current_user: UserInDB = Depends(get_current_user)):
    content = await file.read()
    try:
        parsed_data = await parse_resume(content, file.filename)
        return parsed_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log the full error here if logging is set up
        raise HTTPException(status_code=500, detail="An unexpected error occurred during resume parsing")

@router.get("/", response_model=List[ResumeResponse])
async def list_resumes(current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    resumes = await db.resumes.find({"user_id": str(current_user.id)}).to_list(length=100)
    return [ResumeInDB(**resume) for resume in resumes]

@router.post("/", response_model=ResumeResponse)
async def create_resume(resume: ResumeCreate, current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    
    resume_data = resume.model_dump()
    resume_data["user_id"] = str(current_user.id)
    resume_data["created_at"] = datetime.utcnow()
    resume_data["last_modified_at"] = datetime.utcnow()
    
    new_resume = await db.resumes.insert_one(resume_data)
    created_resume = await db.resumes.find_one({"_id": new_resume.inserted_id})
    
    return ResumeInDB(**created_resume)

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: str, current_user: UserInDB = Depends(get_current_user)):
    if not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=400, detail="Invalid resume ID")
        
    db = get_database()
    resume = await db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": str(current_user.id)})
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    return ResumeInDB(**resume)

@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(resume_id: str, resume_update: ResumeUpdate, current_user: UserInDB = Depends(get_current_user)):
    if not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=400, detail="Invalid resume ID")
        
    db = get_database()
    
    # Check existence and ownership
    existing_resume = await db.resumes.find_one({"_id": ObjectId(resume_id), "user_id": str(current_user.id)})
    if not existing_resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    update_data = resume_update.model_dump(exclude_unset=True)
    if not update_data:
        return ResumeInDB(**existing_resume)
        
    update_data["last_modified_at"] = datetime.utcnow()
    
    await db.resumes.update_one(
        {"_id": ObjectId(resume_id)},
        {"$set": update_data}
    )
    
    updated_resume = await db.resumes.find_one({"_id": ObjectId(resume_id)})
    return ResumeInDB(**updated_resume)

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(resume_id: str, current_user: UserInDB = Depends(get_current_user)):
    if not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=400, detail="Invalid resume ID")
        
    db = get_database()
    result = await db.resumes.delete_one({"_id": ObjectId(resume_id), "user_id": str(current_user.id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    return None