from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date
from enum import Enum

class ExchangeRateSource(str, Enum):
    MANUAL = "manual"
    API = "api"
    BANK = "bank"
    CENTRAL_BANK = "central_bank"

class CurrencyBase(BaseModel):
    code: str
    name: str
    symbol: str
    decimal_places: int = 2
    is_base_currency: bool = False
    is_active: bool = True

class CurrencyCreate(CurrencyBase):
    pass

class CurrencyUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    symbol: Optional[str] = None
    decimal_places: Optional[int] = None
    is_base_currency: Optional[bool] = None
    is_active: Optional[bool] = None

class Currency(CurrencyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExchangeRateBase(BaseModel):
    from_currency_id: int
    to_currency_id: int
    rate: float
    effective_date: date
    source: str = "manual"

class ExchangeRateCreate(ExchangeRateBase):
    pass

class ExchangeRate(ExchangeRateBase):
    id: int
    created_at: datetime
    
    # We add nested currency objects for display
    from_currency: Currency
    to_currency: Currency

    class Config:
        from_attributes = True
