from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum # type: ignore[import-untyped]
from sqlalchemy.orm import relationship # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
import enum

from ..core.database import Base


class AuditAction(str, enum.Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    APPROVE = "approve"
    REJECT = "reject"
    EXPORT = "export"
    VIEW = "view"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(Enum(AuditAction), nullable=False)
    resource_type = Column(String, nullable=False)  # user, revenue, expense, report, etc.
    resource_id = Column(Integer, nullable=True)
    old_values = Column(Text, nullable=True)  # JSON string of old values
    new_values = Column(Text, nullable=True)  # JSON string of new values
    ip_address = Column(String)
    user_agent = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="audit_logs")
