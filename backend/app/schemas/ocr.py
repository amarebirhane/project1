from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime

class LineItem(BaseModel):
    description: str
    sku: Optional[str] = None
    quantity: Optional[float] = 1.0
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    category: Optional[str] = None

class ReceiptData(BaseModel):
    merchant_name: Optional[str] = None
    date: Optional[str] = None
    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    currency: str = "USD"
    category: Optional[str] = None
    items: List[LineItem] = []
    
    # Validation flags
    is_receipt: bool = False
    confidence_score: float = 0.0

class AnalyzedDocument(BaseModel):
    filename: str
    document_type: str  # "receipt", "invoice", "other"
    extracted_data: ReceiptData
    raw_text: Optional[str] = None
