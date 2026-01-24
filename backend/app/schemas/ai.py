from pydantic import BaseModel
from typing import List, Dict, Optional

class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str
    image_data: Optional[str] = None  # Base64 encoded image

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    current_page: Optional[str] = None
    user_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
