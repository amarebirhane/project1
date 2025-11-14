# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    ACCOUNTANT = "accountant"
    EMPLOYEE = "employee"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    role = Column(SAEnum(UserRole), default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    manager = relationship("User", remote_side=[id], back_populates="subordinates")
    subordinates = relationship("User", back_populates="manager")

    # -----------------------------------------------------------------
    # Hierarchy
    # -----------------------------------------------------------------
    manager = relationship("User", remote_side=[id], back_populates="subordinates")
    subordinates = relationship("User", back_populates="manager")

    # -----------------------------------------------------------------
    # Reports
    # -----------------------------------------------------------------
    created_reports = relationship(
        "Report",
        foreign_keys="Report.created_by_id",
        back_populates="created_by_user",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------------------
    # REVENUE & EXPENSE ENTRIES
    # -----------------------------------------------------------------
    created_revenue_entries = relationship(
        "RevenueEntry",
        foreign_keys="RevenueEntry.created_by_id",
        back_populates="created_by",
        cascade="all, delete-orphan"
    )
    approved_revenue_entries = relationship(
        "RevenueEntry",
        foreign_keys="RevenueEntry.approved_by_id",
        back_populates="approved_by"
    )

    created_expense_entries = relationship(
        "ExpenseEntry",
        foreign_keys="ExpenseEntry.created_by_id",
        back_populates="created_by",
        cascade="all, delete-orphan"
    )
    approved_expense_entries = relationship(
        "ExpenseEntry",
        foreign_keys="ExpenseEntry.approved_by_id",
        back_populates="approved_by"
    )

    # -----------------------------------------------------------------
    # APPROVAL WORKFLOWS & COMMENTS
    # -----------------------------------------------------------------
    requested_workflows = relationship(
        "ApprovalWorkflow",
        foreign_keys="ApprovalWorkflow.requester_id",
        back_populates="requester",
        cascade="all, delete-orphan"
    )
    assigned_workflows = relationship(
        "ApprovalWorkflow",
        foreign_keys="ApprovalWorkflow.approver_id",
        back_populates="approver"
    )
    approval_comments = relationship(
        "ApprovalComment",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # -----------------------------------------------------------------
    # Audit / Notification
    # -----------------------------------------------------------------
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

    # -----------------------------------------------------------------
    # Backward-compatibility
    # -----------------------------------------------------------------
    @property
    def revenue_entries(self):
        return self.created_revenue_entries

    @property
    def expense_entries(self):
        return self.created_expense_entries