from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum # type: ignore[import-untyped]
from sqlalchemy.orm import relationship # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
import enum

from ..core.database import Base


class NotificationType(str, enum.Enum):
    APPROVAL_REQUEST = "approval_request"
    APPROVAL_DECISION = "approval_decision"
    REPORT_READY = "report_ready"
    SYSTEM_ALERT = "system_alert"
    DEADLINE_REMINDER = "deadline_reminder"
    BUDGET_EXCEEDED = "budget_exceeded"
    EXPENSE_CREATED = "expense_created"
    EXPENSE_UPDATED = "expense_updated"
    EXPENSE_APPROVED = "expense_approved"
    REVENUE_CREATED = "revenue_created"
    REVENUE_UPDATED = "revenue_updated"
    REVENUE_APPROVED = "revenue_approved"
    SALE_CREATED = "sale_created"
    SALE_POSTED = "sale_posted"
    FORECAST_CREATED = "forecast_created"
    ML_TRAINING_COMPLETE = "ml_training_complete"
    INVENTORY_LOW = "inventory_low"
    INVENTORY_UPDATED = "inventory_updated"
    COMMENT_MENTION = "comment_mention"


class NotificationPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    is_read = Column(Boolean, default=False)
    is_email_sent = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="notifications")
