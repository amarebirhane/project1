from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from ..models.banking import TransactionStatus

# --- Bank Transaction Schemas ---

class BankTransactionBase(BaseModel):
    date: datetime
    description: str
    amount: float
    external_id: Optional[str] = None
    
class BankTransactionCreate(BankTransactionBase):
    bank_account_id: int

class BankTransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    journal_entry_id: Optional[int] = None

class BankTransaction(BankTransactionBase):
    id: int
    bank_account_id: int
    status: TransactionStatus
    journal_entry_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Bank Account Schemas ---

class BankAccountBase(BaseModel):
    bank_name: str
    account_number_last4: str
    account_name: str
    currency_code: str = "USD"
    gl_account_id: Optional[int] = None
    is_active: bool = True

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BaseModel):
    bank_name: Optional[str] = None
    account_name: Optional[str] = None
    gl_account_id: Optional[int] = None
    is_active: Optional[bool] = None

class BankAccount(BankAccountBase):
    id: int
    last_synced_at: Optional[datetime] = None
    created_at: datetime
    created_by_id: int
    
    class Config:
        from_attributes = True
# --- Money Transfer Schemas ---

class MoneyTransferCreate(BaseModel):
    source_account_id: int
    amount: float
    bank_code: str
    account_number: str
    beneficiary_name: str
    reference: Optional[str] = None

class MoneyTransferResponse(BaseModel):
    status: str
    message: str
    transaction_id: Optional[int] = None
    external_reference: Optional[str] = None
