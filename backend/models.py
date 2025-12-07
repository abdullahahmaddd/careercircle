from pydantic import BaseModel, Field, EmailStr, BeforeValidator, ConfigDict
from typing import Optional, Annotated, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid

# Helper for ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    hashed_password: str
    has_completed_first_application: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class UserResponse(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    has_completed_first_application: bool
    created_at: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ResumeType(str, Enum):
    MASTER = "master"
    VERSION = "version"

class ResumeBase(BaseModel):
    name: str
    content: Dict[str, Any] = Field(default_factory=dict)
    type: ResumeType = ResumeType.MASTER
    source_master_id: Optional[str] = None
    job_description_id: Optional[str] = None

class ResumeCreate(ResumeBase):
    pass

class ResumeUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    type: Optional[ResumeType] = None
    source_master_id: Optional[str] = None
    job_description_id: Optional[str] = None

class ResumeInDB(ResumeBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_modified_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class ResumeResponse(ResumeInDB):
    pass

class JobStatus(str, Enum):
    WISHLIST = "wishlist"
    APPLIED = "applied"
    INTERVIEWING = "interviewing"
    OFFER = "offer"
    REJECTED = "rejected"

class JobEntryBase(BaseModel):
    role_title: str
    status: JobStatus = JobStatus.WISHLIST
    application_deadline: Optional[datetime] = None
    jd_text: Optional[str] = None
    parsed_jd: Optional[Dict[str, Any]] = None

class JobEntryCreate(JobEntryBase):
    pass

class JobEntryUpdate(BaseModel):
    role_title: Optional[str] = None
    status: Optional[JobStatus] = None
    application_deadline: Optional[datetime] = None
    jd_text: Optional[str] = None
    parsed_jd: Optional[Dict[str, Any]] = None

class JobEntry(JobEntryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PlaylistBase(BaseModel):
    name: str

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistInDB(PlaylistBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    job_entries: List[JobEntry] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class PlaylistResponse(PlaylistInDB):
    pass
class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    author_name: str
    text: str
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SharedResume(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resume_owner_id: str
    resume_owner_name: str
    version_resume: Dict[str, Any]
    shared_date: datetime = Field(default_factory=datetime.utcnow)
    comments: List[Comment] = Field(default_factory=list)

class PodMember(BaseModel):
    id: str
    name: str
    email: EmailStr

class PodBase(BaseModel):
    name: str

class PodCreate(PodBase):
    pass

class PodInDB(PodBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    owner_id: str
    members: List[PodMember] = Field(default_factory=list)
    shared_resumes: List[SharedResume] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class PodResponse(PodInDB):
    pass

class PodInvite(BaseModel):
    email: EmailStr

class CommentCreate(BaseModel):
    text: str
    location: Optional[str] = None

class ShareResumeRequest(BaseModel):
    resume_id: str