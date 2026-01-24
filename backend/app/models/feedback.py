# app/models/feedback.py
"""
User Feedback Model
Stores user feedback with ratings and messages
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class FeedbackStatus(str, enum.Enum):
    """Status of feedback"""
    NEW = "new"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class FeedbackCategory(str, enum.Enum):
    """Category of feedback"""
    GENERAL = "general"
    UI_UX = "ui_ux"
    PERFORMANCE = "performance"
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"
    OTHER = "other"


class Feedback(Base):
    """
    User Feedback
    Stores user ratings and feedback messages
    """
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    
    # User (nullable for anonymous feedback)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # Feedback content
    rating = Column(Integer, nullable=False)  # 1-5 stars
    message = Column(Text, nullable=False)
    category = Column(String(50), default=FeedbackCategory.GENERAL, nullable=False)
    
    # Status and admin response
    status = Column(String(20), default=FeedbackStatus.NEW, nullable=False, index=True)
    admin_notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="feedback_submitted")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])

    def __repr__(self):
        user_str = f"User {self.user_id}" if self.user_id else "Anonymous"
        return f"<Feedback {self.id}: {self.rating}★ from {user_str}>"
