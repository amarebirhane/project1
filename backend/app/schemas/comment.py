from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class CommentBase(BaseModel):
    content: str
    source_type: str
    source_id: int

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str

class UserMini(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True

class CommentResponse(CommentBase):
    id: int
    user_id: int
    user: UserMini
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
