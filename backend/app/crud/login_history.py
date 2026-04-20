# app/crud/login_history.py
from typing import List, Optional
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import desc # type: ignore[import-untyped]
from datetime import datetime, timezone

from ..models.login_history import LoginHistory


def create(
    db: Session,
    user_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    device: Optional[str] = None,
    location: Optional[str] = None,
    success: bool = True,
    failure_reason: Optional[str] = None
) -> LoginHistory:
    """Create a new login history entry"""
    login_entry = LoginHistory(
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        device=device,
        location=location,
        success=success,
        failure_reason=failure_reason
    )
    db.add(login_entry)
    db.commit()
    db.refresh(login_entry)
    return login_entry


def get_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[LoginHistory]:
    """Get login history for a specific user"""
    return (
        db.query(LoginHistory)
        .filter(LoginHistory.user_id == user_id)
        .order_by(desc(LoginHistory.login_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_recent_failed_attempts(
    db: Session,
    user_id: int,
    hours: int = 24
) -> List[LoginHistory]:
    """Get recent failed login attempts for a user"""
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    return (
        db.query(LoginHistory)
        .filter(
            LoginHistory.user_id == user_id,
            LoginHistory.success == False,
            LoginHistory.login_at >= cutoff
        )
        .order_by(desc(LoginHistory.login_at))
        .all()
    )

