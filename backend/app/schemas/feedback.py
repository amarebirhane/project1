# app/schemas/feedback.py
"""
Feedback Pydantic Schemas
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class FeedbackBase(BaseModel):
    """Base feedback schema"""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    message: str = Field(..., min_length=1, max_length=2000, description="Feedback message")
    category: Optional[str] = Field(default="general", description="Feedback category")


class FeedbackCreate(FeedbackBase):
    """Schema for creating feedback"""
    pass


class FeedbackUpdate(BaseModel):
    """Schema for updating feedback (admin only)"""
    status: Optional[str] = Field(None, description="Feedback status")
    admin_notes: Optional[str] = Field(None, max_length=2000, description="Admin response notes")


class Feedback(FeedbackBase):
    """Full feedback response schema"""
    id: int
    user_id: Optional[int] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by_id: Optional[int] = None
    
    # Nested user info (if available)
    user: Optional[dict] = None
    reviewed_by: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)


class FeedbackStats(BaseModel):
    """Feedback statistics"""
    total_feedback: int
    average_rating: float
    rating_distribution: dict  # {1: count, 2: count, ...}
    status_breakdown: dict  # {new: count, reviewed: count, ...}
    recent_feedback_count: int  # Last 7 days
