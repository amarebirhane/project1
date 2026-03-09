# app/models/refresh_token.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey # type: ignore[import-untyped]
from sqlalchemy.orm import relationship # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
from ..core.database import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_ip = Column(String, nullable=True)
    
    user = relationship("User")
