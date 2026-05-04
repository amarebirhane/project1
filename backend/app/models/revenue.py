# app/models/revenue.py
from sqlalchemy import ( # type: ignore[import-untyped]
    Column, Integer, String, Float, DateTime,
    ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
import enum

from ..core.database import Base


class RevenueCategory(str, enum.Enum):
    SALES = "sales"
    SERVICES = "services"
    INVESTMENT = "investment"
    RENTAL = "rental"
    OTHER = "other"


class RevenueEntry(Base):
    __tablename__ = "revenue_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    amount = Column(Float, nullable=False)  # Amount in transaction currency
    category = Column(String, default=RevenueCategory.OTHER)
    source = Column(String)
    date = Column(DateTime(timezone=True), nullable=False)
    
    # Multi-currency support
    currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=True)
    exchange_rate = Column(Float, nullable=True)  # Rate used for conversion
    amount_base_currency = Column(Float, nullable=True)  # Amount in base currency
    
    # Tax support
    tax_rate_id = Column(Integer, ForeignKey("tax_rates.id"), nullable=True)
    tax_amount = Column(Float, default=0.0, nullable=False)
    amount_before_tax = Column(Float, nullable=True)  # Amount excluding tax
    is_recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    attachment_url = Column(String, nullable=True)

    # Foreign Keys
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # -----------------------------------------------------------------
    # RELATIONSHIPS – EXPLICIT foreign_keys + back_populates
    # -----------------------------------------------------------------
    created_by = relationship(
        "User",
        foreign_keys=[created_by_id],
        back_populates="created_revenue_entries"  # ← matches User.created_revenue_entries
    )

    approved_by = relationship(
        "User",
        foreign_keys=[approved_by_id],
        back_populates="approved_revenue_entries"  # ← matches User.approved_revenue_entries
    )

    approval_workflows = relationship(
        "ApprovalWorkflow",
        back_populates="revenue_entry",
        cascade="all, delete-orphan"
    )
    
    # Multi-currency and tax relationships
    currency = relationship("Currency", back_populates="revenue_entries")
    tax_rate = relationship("TaxRate")