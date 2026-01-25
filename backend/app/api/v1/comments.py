from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ...core.database import get_db
from ..deps import get_current_user
from ...models.user import User
from ...schemas.comment import CommentCreate, CommentResponse
from ...crud.comment import comment_crud

router = APIRouter()

@router.post("/", response_model=CommentResponse)
def create_comment(
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Post a new comment on a specific resource"""
    return comment_crud.create(db, obj_in=comment_in, user_id=current_user.id)

@router.get("/{source_type}/{source_id}", response_model=List[CommentResponse])
def get_comments(
    source_type: str,
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all comments for a specific resource"""
    return comment_crud.get_comments(db, source_type=source_type, source_id=source_id)
