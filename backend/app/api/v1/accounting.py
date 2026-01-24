from typing import List, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...models.account import Account, AccountType
from ...models.journal_entry import AccountingJournalEntry, JournalEntryLine, JournalEntryStatus
from ...models.currency import Currency, ExchangeRate
from ...schemas import account as account_schema
from ...schemas import journal_entry as journal_entry_schema
from ...schemas import currency as currency_schema

router = APIRouter()

# ------------------------------------------------------------------
# Accounts
# ------------------------------------------------------------------

@router.get("/accounts", response_model=List[account_schema.Account])
def get_accounts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Retrieve all accounts.
    """
    accounts = db.query(Account).offset(skip).limit(limit).all()
    return accounts

@router.post("/accounts", response_model=account_schema.Account)
def create_account(
    account_in: account_schema.AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Create a new account.
    """
    # Check if code exists
    existing_account = db.query(Account).filter(Account.code == account_in.code).first()
    if existing_account:
        raise HTTPException(
            status_code=400,
            detail="Account with this code already exists"
        )
        
    db_account = Account(
        **account_in.dict(),
        created_by_id=current_user.id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@router.put("/accounts/{account_id}", response_model=account_schema.Account)
def update_account(
    account_id: int,
    account_in: account_schema.AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Update an existing account.
    """
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    update_data = account_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)
        
    db.commit()
    db.refresh(db_account)
    return db_account

@router.delete("/accounts/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Delete an account. System accounts cannot be deleted.
    """
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    if db_account.is_system_account:
        raise HTTPException(
            status_code=400,
            detail="System accounts cannot be deleted"
        )
        
    # Check for linked journal entries
    has_entries = db.query(JournalEntryLine).filter(JournalEntryLine.account_id == account_id).first()
    if has_entries:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete account with linked journal entries. Deactivate it instead."
        )
        
    db.delete(db_account)
    db.commit()
    return {"message": "Account deleted successfully"}

# ------------------------------------------------------------------
# Journal Entries
# ------------------------------------------------------------------

@router.get("/journal-entries", response_model=List[journal_entry_schema.JournalEntry])
def get_journal_entries(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: JournalEntryStatus = None,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Retrieve journal entries.
    """
    query = db.query(AccountingJournalEntry)
    if status:
        query = query.filter(AccountingJournalEntry.status == status)
        
    entries = query.order_by(AccountingJournalEntry.entry_date.desc()).offset(skip).limit(limit).all()
    
    # Populate nested Account objects for lines
    # (FastAPI/Pydantic validation config 'from_attributes=True' handles this if relationships are set up,
    # but for flat display we might want to ensure lines load)
    return entries

@router.post("/journal-entries", response_model=journal_entry_schema.JournalEntry)
def create_journal_entry(
    entry_in: journal_entry_schema.JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Create a new journal entry (Draft).
    """
    # Generate Entry Number
    today_str = datetime.now().strftime("%Y%m%d")
    count = db.query(func.count(AccountingJournalEntry.id)).scalar() or 0
    entry_number = f"JE-{today_str}-{count + 1:04d}"
    
    # Create Header
    db_entry = AccountingJournalEntry(
        entry_number=entry_number,
        entry_date=entry_in.entry_date,
        description=entry_in.description,
        reference_type=entry_in.reference_type,
        reference_id=entry_in.reference_id,
        status=JournalEntryStatus.DRAFT,
        created_by_id=current_user.id
    )
    db.add(db_entry)
    db.flush() # Get ID
    
    # Create Lines
    for line in entry_in.lines:
        db_line = JournalEntryLine(
            journal_entry_id=db_entry.id,
            account_id=line.account_id,
            debit_amount=line.debit_amount,
            credit_amount=line.credit_amount,
            description=line.description or entry_in.description
        )
        db.add(db_line)
        
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.post("/journal-entries/{entry_id}/post", response_model=journal_entry_schema.JournalEntry)
def post_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Post a draft journal entry to the ledger.
    """
    entry = db.query(AccountingJournalEntry).filter(AccountingJournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
        
    if entry.status != JournalEntryStatus.DRAFT:
        raise HTTPException(status_code=400, detail=f"Cannot post entry with status {entry.status}")
        
    entry.status = JournalEntryStatus.POSTED
    entry.posted_at = datetime.utcnow()
    entry.posted_by_id = current_user.id
    
    db.commit()
    db.refresh(entry)
    return entry

# ------------------------------------------------------------------
# Currencies
# ------------------------------------------------------------------

@router.get("/currencies", response_model=List[currency_schema.Currency])
def get_currencies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Retrieve all currencies.
    """
    query = db.query(Currency)
    if active_only:
        query = query.filter(Currency.is_active == True)
    return query.offset(skip).limit(limit).all()

@router.post("/currencies", response_model=currency_schema.Currency)
def create_currency(
    currency_in: currency_schema.CurrencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Create a new currency. Only Admin.
    """
    existing = db.query(Currency).filter(Currency.code == currency_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Currency already exists")
    
    if currency_in.is_base_currency:
        # Reset other base currencies
        db.query(Currency).update({Currency.is_base_currency: False})
        
    db_currency = Currency(**currency_in.dict())
    db.add(db_currency)
    db.commit()
    db.refresh(db_currency)
    return db_currency

@router.put("/currencies/{currency_id}", response_model=currency_schema.Currency)
def update_currency(
    currency_id: int,
    currency_in: currency_schema.CurrencyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Update currency details.
    """
    db_currency = db.query(Currency).filter(Currency.id == currency_id).first()
    if not db_currency:
        raise HTTPException(status_code=404, detail="Currency not found")
        
    update_data = currency_in.dict(exclude_unset=True)
    
    if update_data.get("is_base_currency"):
        # Reset other base currencies
        db.query(Currency).update({Currency.is_base_currency: False})
        
    for field, value in update_data.items():
        setattr(db_currency, field, value)
        
    db.commit()
    db.refresh(db_currency)
    return db_currency

@router.delete("/currencies/{currency_id}")
def delete_currency(
    currency_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ADMIN))
):
    """
    Delete a currency.
    """
    db_currency = db.query(Currency).filter(Currency.id == currency_id).first()
    if not db_currency:
        raise HTTPException(status_code=404, detail="Currency not found")
        
    if db_currency.is_base_currency:
        raise HTTPException(status_code=400, detail="Cannot delete base currency")
        
    db.delete(db_currency)
    db.commit()
    return {"message": "Currency deleted"}

# ------------------------------------------------------------------
# Exchange Rates
# ------------------------------------------------------------------

@router.get("/exchange-rates", response_model=List[currency_schema.ExchangeRate])
def get_exchange_rates(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    from_currency: str = None,
    to_currency: str = None,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Retrieve exchange rates.
    """
    query = db.query(ExchangeRate)
    
    if from_currency:
        query = query.join(Currency, ExchangeRate.from_currency_id == Currency.id).filter(Currency.code == from_currency)
    if to_currency:
        query = query.join(Currency, ExchangeRate.to_currency_id == Currency.id).filter(Currency.code == to_currency)
        
    return query.order_by(ExchangeRate.effective_date.desc()).offset(skip).limit(limit).all()

@router.post("/exchange-rates", response_model=currency_schema.ExchangeRate)
def create_exchange_rate(
    rate_in: currency_schema.ExchangeRateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Add a new exchange rate.
    """
    db_rate = ExchangeRate(
        **rate_in.dict(),
        created_by_id=current_user.id
    )
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate

@router.delete("/exchange-rates/{rate_id}")
def delete_exchange_rate(
    rate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Remove an exchange rate.
    """
    db_rate = db.query(ExchangeRate).filter(ExchangeRate.id == rate_id).first()
    if not db_rate:
        raise HTTPException(status_code=404, detail="Exchange rate not found")
        
    db.delete(db_rate)
    db.commit()
    return {"message": "Exchange rate deleted"}
