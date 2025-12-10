from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from backend.models import UserCreate, UserLogin, UserResponse, UserInDB, Token, TokenData
from backend.utils import get_password_hash, verify_password, create_access_token
from backend.utils.email_service import send_email
from backend.database import get_database
from backend.config import get_settings
from bson import ObjectId
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import secrets

router = APIRouter()
settings = get_settings()

# We point to the login endpoint for Swagger UI support
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    db = get_database()
    user = await db.users.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception
    return UserInDB(**user)

@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    db = get_database()
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    
    # Insert into DB (exclude id since Mongo creates it)
    await db.users.insert_one(user_in_db.model_dump(by_alias=True, exclude={"id"}))
    
    # Create token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user['email']})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

class UserUpdate(BaseModel):
    name: Optional[str] = None
    has_completed_first_application: Optional[bool] = None

@router.patch("/me", response_model=UserResponse)
async def update_user_me(update_data: UserUpdate, current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    
    # Build update dict with only provided fields
    update_fields = {}
    if update_data.name is not None:
        update_fields["name"] = update_data.name
    if update_data.has_completed_first_application is not None:
        update_fields["has_completed_first_application"] = update_data.has_completed_first_application
    
    if not update_fields:
        return current_user  # Nothing to update
    
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_fields}
    )
    
    # Fetch updated user to return
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return UserInDB(**updated_user)


# ==================== Password Management ====================

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Change password for authenticated user."""
    # Verify current password
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    # Update password
    db = get_database()
    new_hashed_password = get_password_hash(request.new_password)
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    return {"message": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset. Generates a reset token."""
    db = get_database()
    user = await db.users.find_one({"email": request.email})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If this email exists, a reset link has been sent."}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_expiry = datetime.utcnow() + timedelta(hours=1)
    
    # Store reset token in database
    await db.users.update_one(
        {"email": request.email},
        {"$set": {
            "reset_token": reset_token,
            "reset_token_expiry": reset_expiry
        }}
    )
    
    # Send password reset email
    frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    subject = "Reset your CareerCircle password"
    body_text = f"""
Hi {user['name']},

You requested a password reset for your CareerCircle account.
Click the link below to reset your password:

{reset_link}

If you didn't request this, please ignore this email.

Best,
The CareerCircle Team
"""
    body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hi <strong>{user['name']}</strong>,</p>
        <p>You requested a password reset for your CareerCircle account.</p>
        <a href="{reset_link}" class="button">Reset Password</a>
        <p>Or copy and paste this link: {reset_link}</p>
        <p>If you didn't request this, please ignore this email.</p>
    </div>
</body>
</html>
"""
    
    await send_email(request.email, subject, body_text, body_html)
    
    return {
        "message": "If this email exists, a reset link has been sent."
    }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using a reset token."""
    db = get_database()
    
    # Find user with this reset token
    user = await db.users.find_one({"reset_token": request.token})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is expired
    token_expiry = user.get("reset_token_expiry")
    if not token_expiry or datetime.utcnow() > token_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one."
        )
    
    # Validate new password
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters"
        )
    
    # Update password and clear reset token
    new_hashed_password = get_password_hash(request.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"hashed_password": new_hashed_password},
            "$unset": {"reset_token": "", "reset_token_expiry": ""}
        }
    )
    
    return {"message": "Password has been reset successfully. You can now log in."}