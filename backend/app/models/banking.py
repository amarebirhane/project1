from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    MATCHED = "matched"
    POSTED = "posted"
    IGNORED = "ignored"

class BankAccount(Base):
    """
    Represents a real-world bank account linked to an internal GL Account
    """
    __tablename__ = "banking_accounts"

    id = Column(Integer, primary_key=True, index=True)
    bank_name = Column(String(100), nullable=False)
    account_number_last4 = Column(String(4), nullable=False)
    account_name = Column(String(100), nullable=False)
    currency_code = Column(String(3), ForeignKey("currencies.code"), default="USD")
    
    # Link to internal GL account (Asset)
    gl_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    gl_account = relationship("Account")
    transactions = relationship("BankTransaction", back_populates="bank_account", cascade="all, delete-orphan")
    currency = relationship("Currency")

class BankTransaction(Base):
    """
    Raw transaction feed from the bank (via CSV/API)
    """
    __tablename__ = "banking_transactions"

    id = Column(Integer, primary_key=True, index=True)
    bank_account_id = Column(Integer, ForeignKey("banking_accounts.id"), nullable=False)
    
    external_id = Column(String(255), unique=True, index=True, nullable=True) # ID from bank
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    description = Column(String(500), nullable=False)
    amount = Column(Float, nullable=False) # Positive = Deposit, Negative = Withdrawal
    
    # Status
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING, index=True)
    
    # Matched Journal Entry
    journal_entry_id = Column(Integer, ForeignKey("accounting_journal_entries.id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    bank_account = relationship("BankAccount", back_populates="transactions")
    journal_entry = relationship("AccountingJournalEntry")
    creator = relationship("User")
