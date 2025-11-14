# app/models/expense.py
from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class ExpenseCategory(str, enum.Enum):
    SALARY = "salary"
    RENT = "rent"
    UTILITIES = "utilities"
    MARKETING = "marketing"
    EQUIPMENT = "equipment"
    TRAVEL = "travel"
    SUPPLIES = "supplies"
    INSURANCE = "insurance"
    TAXES = "taxes"
    OTHER = "other"


class ExpenseEntry(Base):
    __tablename__ = "expense_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    amount = Column(Float, nullable=False)
    category = Column(String, default=ExpenseCategory.OTHER)
    vendor = Column(String)
    date = Column(DateTime(timezone=True), nullable=False)
    is_recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    attachment_url = Column(String, nullable=True)
    receipt_url = Column(String, nullable=True)

    # Foreign Keys
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # -----------------------------------------------------------------
    # RELATIONSHIPS – EXPLICIT foreign_keys + back_populates
    # -----------------------------------------------------------------
    created_by = relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_expense_entries"  # ← matches User.created_expense_entries
    )

    approved_by = relationship(
        "User",
        foreign_keys=[approved_by_id],
        back_populates="approved_expense_entries"  # ← matches User.approved_expense_entries
    )

    approval_workflows = relationship(
        "ApprovalWorkflow",
        back_populates="expense_entry",
        cascade="all, delete-orphan"
    )