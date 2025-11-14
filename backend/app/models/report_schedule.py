# app/models/report_schedule.py
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    frequency = Column(String, nullable=False)  # daily, weekly, monthly, etc.
    day_of_week = Column(Integer, nullable=True)  # 0=Mon, 6=Sun
    day_of_month = Column(Integer, nullable=True)  # 1-31
    month = Column(Integer, nullable=True)  # 1-12
    next_run = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    report = relationship("Report", back_populates="schedules")