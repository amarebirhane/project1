# app/schemas/responses.py
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")

class BaseResponse(BaseModel):
    success: bool = True
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status_code: int = 200

class GenericResponse(BaseResponse, Generic[T]):
    message: Optional[str] = None
    data: Optional[T] = None

class ErrorResponse(BaseResponse):
    success: bool = False
    message: str
    error_code: Optional[str] = None
    details: Optional[Any] = None
    status_code: int = 400
