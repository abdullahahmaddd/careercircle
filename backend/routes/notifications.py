from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, Field
from enum import Enum

from backend.models import UserInDB
from backend.routes.auth import get_current_user
from backend.database import get_database

router = APIRouter()


class NotificationType(str, Enum):
    POD_INVITE = "pod_invite"
    RESUME_COMMENT = "resume_comment"
    RESUME_SHARED = "resume_shared"


class NotificationCreate(BaseModel):
    user_id: str
    type: NotificationType
    message: str
    metadata: dict = Field(default_factory=dict)


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    message: str
    metadata: dict
    is_read: bool
    created_at: datetime


async def create_notification(
    user_id: str,
    notification_type: NotificationType,
    message: str,
    metadata: dict = None
):
    """Helper function to create a notification."""
    db = get_database()
    notification = {
        "user_id": user_id,
        "type": notification_type.value,
        "message": message,
        "metadata": metadata or {},
        "is_read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get user's notifications."""
    db = get_database()
    
    query = {"user_id": str(current_user.id)}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query).sort("created_at", -1).to_list(length=50)
    
    result = []
    for n in notifications:
        result.append(NotificationResponse(
            id=str(n["_id"]),
            user_id=n["user_id"],
            type=n["type"],
            message=n["message"],
            metadata=n.get("metadata", {}),
            is_read=n["is_read"],
            created_at=n["created_at"]
        ))
    
    return result


@router.get("/unread-count")
async def get_unread_count(current_user: UserInDB = Depends(get_current_user)):
    """Get count of unread notifications."""
    db = get_database()
    count = await db.notifications.count_documents({
        "user_id": str(current_user.id),
        "is_read": False
    })
    return {"count": count}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Mark a notification as read."""
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    
    db = get_database()
    
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": str(current_user.id)},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    
    return NotificationResponse(
        id=str(notification["_id"]),
        user_id=notification["user_id"],
        type=notification["type"],
        message=notification["message"],
        metadata=notification.get("metadata", {}),
        is_read=notification["is_read"],
        created_at=notification["created_at"]
    )


@router.post("/mark-all-read")
async def mark_all_as_read(current_user: UserInDB = Depends(get_current_user)):
    """Mark all notifications as read."""
    db = get_database()
    
    await db.notifications.update_many(
        {"user_id": str(current_user.id), "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "All notifications marked as read"}
