from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from backend.models import UserCreate, UserLogin, UserResponse, UserInDB, Token, TokenData
from backend.utils import get_password_hash, verify_password, create_access_token
from backend.database import get_database
from backend.config import get_settings
from bson import ObjectId
from pydantic import BaseModel

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
    has_completed_first_application: bool

@router.patch("/me", response_model=UserResponse)
async def update_user_me(update_data: UserUpdate, current_user: UserInDB = Depends(get_current_user)):
    db = get_database()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"has_completed_first_application": update_data.has_completed_first_application}}
    )
    
    # Fetch updated user to return
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    return UserInDB(**updated_user)