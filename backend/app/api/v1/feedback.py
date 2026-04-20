# app/api/v1/feedback.py
"""
Feedback API Endpoints
Allows users to submit feedback and admins to manage it
"""
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...models.feedback import Feedback, FeedbackStatus, FeedbackCategory
from ...schemas import feedback as feedback_schema
from ...core.email import email_service

router = APIRouter()


def send_feedback_notification(
    feedback_id: int,
    rating: int,
    message: str,
    category: str = "general",
    user_email: str = None
):
    """
    Background task to send email notification to admins
    Uses SMTP email service
    """
    try:
        email_service.send_feedback_notification(
            feedback_id=feedback_id,
            rating=rating,
            message=message,
            category=category,
            user_email=user_email
        )
    except Exception as e:
        # Log error but don't fail the feedback submission
        print(f"[ERROR] Failed to send feedback notification: {str(e)}")


@router.post("/", response_model=feedback_schema.Feedback, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    feedback_in: feedback_schema.FeedbackCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(deps.get_current_user_optional)
):
    """
    Submit new feedback.
    Can be submitted by authenticated users or anonymously.
    """
    # Create feedback
    db_feedback = Feedback(
        user_id=current_user.id if current_user else None,
        rating=feedback_in.rating,
        message=feedback_in.message,
        category=feedback_in.category or FeedbackCategory.GENERAL,
        status=FeedbackStatus.NEW
    )
    
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    # Send notification in background
    background_tasks.add_task(
        send_feedback_notification,
        db_feedback.id,
        db_feedback.rating,
        db_feedback.message,
        db_feedback.category,
        current_user.email if current_user else None
    )
    
    return db_feedback


@router.get("/", response_model=List[feedback_schema.Feedback])
def get_all_feedback(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    rating_filter: Optional[int] = None,
    category_filter: Optional[str] = None,
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Get all feedback.
    Admin only - feedback is not publicly visible.
    Supports filtering by status, rating, and category.
    """
    query = db.query(Feedback)
    
    # Apply filters
    if status_filter:
        query = query.filter(Feedback.status == status_filter)
    if rating_filter:
        query = query.filter(Feedback.rating == rating_filter)
    if category_filter:
        query = query.filter(Feedback.category == category_filter)
    
    # Order by most recent first
    feedback_list = query.order_by(Feedback.created_at.desc()).offset(skip).limit(limit).all()
    
    return feedback_list


@router.get("/stats", response_model=feedback_schema.FeedbackStats)
def get_feedback_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Get feedback statistics.
    Admin only.
    """
    # Total feedback
    total = db.query(func.count(Feedback.id)).scalar() or 0
    
    # Average rating
    avg_rating = db.query(func.avg(Feedback.rating)).scalar() or 0.0
    
    # Rating distribution
    rating_dist = {}
    for i in range(1, 6):
        count = db.query(func.count(Feedback.id)).filter(Feedback.rating == i).scalar() or 0
        rating_dist[str(i)] = count
    
    # Status breakdown
    status_breakdown = {}
    for status_val in [FeedbackStatus.NEW, FeedbackStatus.REVIEWED, FeedbackStatus.RESOLVED, FeedbackStatus.ARCHIVED]:
        count = db.query(func.count(Feedback.id)).filter(Feedback.status == status_val).scalar() or 0
        status_breakdown[status_val.value] = count
    
    # Recent feedback (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_count = db.query(func.count(Feedback.id)).filter(
        Feedback.created_at >= seven_days_ago
    ).scalar() or 0
    
    return {
        "total_feedback": total,
        "average_rating": round(float(avg_rating), 2),
        "rating_distribution": rating_dist,
        "status_breakdown": status_breakdown,
        "recent_feedback_count": recent_count
    }


@router.get("/{feedback_id}", response_model=feedback_schema.Feedback)
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Get specific feedback by ID.
    Admin only.
    """
    feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return feedback


@router.put("/{feedback_id}", response_model=feedback_schema.Feedback)
def update_feedback(
    feedback_id: int,
    feedback_in: feedback_schema.FeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Update feedback status and admin notes.
    Admin only.
    """
    db_feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    update_data = feedback_in.model_dump(exclude_unset=True)
    
    # Track when feedback was reviewed
    if "status" in update_data and update_data["status"] != FeedbackStatus.NEW:
        if db_feedback.status == FeedbackStatus.NEW:
            db_feedback.reviewed_at = datetime.now(timezone.utc)
            db_feedback.reviewed_by_id = current_user.id
    
    # Apply updates
    for field, value in update_data.items():
        setattr(db_feedback, field, value)
    
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@router.delete("/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Delete feedback.
    Admin only.
    """
    db_feedback = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    db.delete(db_feedback)
    db.commit()
    return {"message": "Feedback deleted successfully"}
