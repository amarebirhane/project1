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
from ...schemas import account as account_schema
from ...schemas import journal_entry as journal_entry_schema

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
