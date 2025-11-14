# app/models/report.py
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Text, Boolean, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class ReportType(str, enum.Enum):
    FINANCIAL_SUMMARY = "financial_summary"
    REVENUE_REPORT = "revenue_report"
    EXPENSE_REPORT = "expense_report"
    PROFIT_LOSS = "profit_loss"
    CASH_FLOW = "cash_flow"
    BUDGET_VS_ACTUAL = "budget_vs_actual"
    AUDIT_REPORT = "audit_report"


class ReportStatus(str, enum.Enum):
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    SCHEDULED = "scheduled"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    type = Column(SAEnum(ReportType), nullable=False)
    status = Column(SAEnum(ReportStatus), default=ReportStatus.GENERATING)
    parameters = Column(Text)  # JSON string
    file_url = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    generated_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_public = Column(Boolean, default=False)
    download_count = Column(Integer, default=0)

    # -----------------------------------------------------------------
    # RELATIONSHIPS – EXPLICIT foreign_keys + back_populates
    # -----------------------------------------------------------------
    created_by_user = relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_reports"
    )

    schedules = relationship(
        "ReportSchedule",
        back_populates="report",
        cascade="all, delete-orphan"
    )