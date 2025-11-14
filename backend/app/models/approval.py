# app/models/approval.py
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text,
    Boolean, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


# -------------------------------------------------------------------------
# 1. ENUMS
# -------------------------------------------------------------------------
class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ApprovalType(str, enum.Enum):
    REVENUE = "revenue"
    EXPENSE = "expense"
    REPORT = "report"


# -------------------------------------------------------------------------
# 2. APPROVAL WORKFLOW
# -------------------------------------------------------------------------
class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    type = Column(SAEnum(ApprovalType), nullable=False)
    status = Column(SAEnum(ApprovalStatus), default=ApprovalStatus.PENDING)
    
    # Foreign Keys
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    revenue_entry_id = Column(Integer, ForeignKey("revenue_entries.id"), nullable=True)
    expense_entry_id = Column(Integer, ForeignKey("expense_entries.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high, urgent

    # -----------------------------------------------------------------
    # RELATIONSHIPS – ALL AMBIGUOUS FKs HAVE EXPLICIT foreign_keys
    # -----------------------------------------------------------------
    # 1. Who requested this workflow?
    requester = relationship(
        "User",
        foreign_keys=[requester_id],
        back_populates="requested_workflows"
    )

    # 2. Who is approving it?
    approver = relationship(
        "User",
        foreign_keys=[approver_id],
        back_populates="assigned_workflows"
    )

    # 3. Linked revenue/expense entries
    revenue_entry = relationship(
        "RevenueEntry",
        foreign_keys=[revenue_entry_id],
        back_populates="approval_workflows"
    )
    expense_entry = relationship(
        "ExpenseEntry",
        foreign_keys=[expense_entry_id],
        back_populates="approval_workflows"
    )

    # 4. Comments
    comments = relationship(
        "ApprovalComment",
        back_populates="workflow",
        cascade="all, delete-orphan"
    )


# -------------------------------------------------------------------------
# 3. APPROVAL COMMENT
# -------------------------------------------------------------------------
class ApprovalComment(Base):
    __tablename__ = "approval_comments"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("approval_workflows.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    workflow = relationship("ApprovalWorkflow", back_populates="comments")
    user = relationship("User", back_populates="approval_comments")