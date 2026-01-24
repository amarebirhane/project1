from pydantic import BaseModel
from typing import List, Dict, Optional

class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    current_page: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
