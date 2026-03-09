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
from ...models.tax import TaxType, TaxRate
from ...schemas import account as account_schema
from ...schemas import journal_entry as journal_entry_schema
from ...schemas import currency as currency_schema
from ...schemas import tax as tax_schema
from ...schemas.responses import GenericResponse, ErrorResponse

router = APIRouter()

# ------------------------------------------------------------------
# Accounts
# ------------------------------------------------------------------

@router.get("/accounts", response_model=GenericResponse[List[account_schema.Account]])
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
    return GenericResponse(data=accounts)

@router.post("/accounts", response_model=GenericResponse[account_schema.Account])
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
    return GenericResponse(message="Account created successfully", data=db_account)

@router.put("/accounts/{account_id}", response_model=GenericResponse[account_schema.Account])
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
    return GenericResponse(message="Account updated successfully", data=db_account)

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
    return GenericResponse(message="Account deleted successfully")

# ------------------------------------------------------------------
# Journal Entries
# ------------------------------------------------------------------

@router.get("/journal-entries", response_model=GenericResponse[List[journal_entry_schema.JournalEntry]])
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
    return GenericResponse(data=entries)

@router.post("/journal-entries", response_model=GenericResponse[journal_entry_schema.JournalEntry])
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
    return GenericResponse(message="Journal entry created successfully", data=db_entry)

@router.post("/journal-entries/{entry_id}/post", response_model=GenericResponse[journal_entry_schema.JournalEntry])
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
    return GenericResponse(message="Journal entry posted successfully", data=entry)

@router.put("/journal-entries/{entry_id}", response_model=GenericResponse[journal_entry_schema.JournalEntry])
def update_journal_entry(
    entry_id: int,
    entry_in: journal_entry_schema.JournalEntryCreate, # Using Create schema because we want full lines list
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Update a draft journal entry.
    """
    db_entry = db.query(AccountingJournalEntry).filter(AccountingJournalEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    if db_entry.status != JournalEntryStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft entries can be updated")

    # Update header
    db_entry.entry_date = entry_in.entry_date
    db_entry.description = entry_in.description
    db_entry.reference_type = entry_in.reference_type
    db_entry.reference_id = entry_in.reference_id

    # Update lines (delete and recreate for simplicity in manual entries)
    db.query(JournalEntryLine).filter(JournalEntryLine.journal_entry_id == entry_id).delete()
    
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
    return GenericResponse(message="Journal entry updated successfully", data=db_entry)

@router.delete("/journal-entries/{entry_id}")
def delete_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Delete a draft journal entry.
    """
    db_entry = db.query(AccountingJournalEntry).filter(AccountingJournalEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    if db_entry.status != JournalEntryStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft entries can be deleted")

    db.query(JournalEntryLine).filter(JournalEntryLine.journal_entry_id == entry_id).delete()
    db.delete(db_entry)
    db.commit()
    return GenericResponse(message="Journal entry deleted successfully")

@router.post("/journal-entries/{entry_id}/reverse", response_model=GenericResponse[journal_entry_schema.JournalEntry])
def reverse_journal_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Reverse a posted journal entry.
    """
    original = db.query(AccountingJournalEntry).filter(AccountingJournalEntry.id == entry_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    if original.status != JournalEntryStatus.POSTED:
        raise HTTPException(status_code=400, detail="Only posted entries can be reversed")

    # Create Reversal Entry
    today_str = datetime.now().strftime("%Y%m%d")
    count = db.query(func.count(AccountingJournalEntry.id)).scalar() or 0
    reversal_number = f"REV-{today_str}-{count + 1:04d}"

    reversal_entry = AccountingJournalEntry(
        entry_number=reversal_number,
        entry_date=datetime.utcnow(),
        description=f"Reversal of {original.entry_number}",
        reference_type="REVERSAL",
        reference_id=original.id,
        status=JournalEntryStatus.POSTED,
        created_by_id=current_user.id,
        posted_at=datetime.utcnow(),
        posted_by_id=current_user.id
    )
    db.add(reversal_entry)
    db.flush()

    # Create Reversal Lines (swapping debit and credit)
    for line in original.lines:
        rev_line = JournalEntryLine(
            journal_entry_id=reversal_entry.id,
            account_id=line.account_id,
            debit_amount=line.credit_amount,
            credit_amount=line.debit_amount,
            description=f"Reverse: {line.description}"
        )
        db.add(rev_line)

    # Mark original as REVERSED
    original.status = JournalEntryStatus.REVERSED
    original.reversed_at = datetime.utcnow()
    original.reversed_by_id = current_user.id
    original.reversal_entry_id = reversal_entry.id

    db.commit()
    db.refresh(reversal_entry)
    return GenericResponse(message="Journal entry reversed successfully", data=reversal_entry)

# ------------------------------------------------------------------
# Currencies
# ------------------------------------------------------------------

@router.get("/currencies", response_model=GenericResponse[List[currency_schema.Currency]])
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

@router.post("/currencies", response_model=GenericResponse[currency_schema.Currency])
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
    return GenericResponse(message="Currency created successfully", data=db_currency)

@router.put("/currencies/{currency_id}", response_model=GenericResponse[currency_schema.Currency])
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
    return GenericResponse(message="Currency updated successfully", data=db_currency)

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
    return GenericResponse(message="Currency deleted successfully")

# ------------------------------------------------------------------
# Exchange Rates
# ------------------------------------------------------------------

@router.get("/exchange-rates", response_model=GenericResponse[List[currency_schema.ExchangeRate]])
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
        
    return GenericResponse(data=query.order_by(ExchangeRate.effective_date.desc()).offset(skip).limit(limit).all())

@router.post("/exchange-rates", response_model=GenericResponse[currency_schema.ExchangeRate])
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
    return GenericResponse(message="Exchange rate created successfully", data=db_rate)

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
    return GenericResponse(message="Exchange rate deleted successfully")

# ------------------------------------------------------------------
# Tax Types
# ------------------------------------------------------------------

@router.get("/taxes/types", response_model=GenericResponse[List[tax_schema.TaxType]])
def get_tax_types(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Retrieve all tax types.
    """
    query = db.query(TaxType)
    if active_only:
        query = query.filter(TaxType.is_active == True)
    return query.offset(skip).limit(limit).all()

@router.post("/taxes/types", response_model=GenericResponse[tax_schema.TaxType])
def create_tax_type(
    tax_type_in: tax_schema.TaxTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Create a new tax type.
    """
    # Check if code exists
    existing = db.query(TaxType).filter(TaxType.code == tax_type_in.code).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Tax type with this code already exists"
        )
    
    db_tax_type = TaxType(**tax_type_in.dict())
    db.add(db_tax_type)
    db.commit()
    db.refresh(db_tax_type)
    return db_tax_type

@router.put("/taxes/types/{tax_type_id}", response_model=GenericResponse[tax_schema.TaxType])
def update_tax_type(
    tax_type_id: int,
    tax_type_in: tax_schema.TaxTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Update an existing tax type.
    """
    db_tax_type = db.query(TaxType).filter(TaxType.id == tax_type_id).first()
    if not db_tax_type:
        raise HTTPException(status_code=404, detail="Tax type not found")
    
    # Check if code is being changed and if it conflicts
    update_data = tax_type_in.dict(exclude_unset=True)
    if "code" in update_data and update_data["code"] != db_tax_type.code:
        existing = db.query(TaxType).filter(TaxType.code == update_data["code"]).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Tax type with this code already exists"
            )
    
    for field, value in update_data.items():
        setattr(db_tax_type, field, value)
    
    db.commit()
    db.refresh(db_tax_type)
    return db_tax_type

@router.delete("/taxes/types/{tax_type_id}")
def delete_tax_type(
    tax_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Delete a tax type. Cannot delete if tax rates exist.
    """
    db_tax_type = db.query(TaxType).filter(TaxType.id == tax_type_id).first()
    if not db_tax_type:
        raise HTTPException(status_code=404, detail="Tax type not found")
    
    # Check for linked tax rates
    has_rates = db.query(TaxRate).filter(TaxRate.tax_type_id == tax_type_id).first()
    if has_rates:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete tax type with linked tax rates. Deactivate it instead."
        )
    
    db.delete(db_tax_type)
    db.commit()
    return GenericResponse(message="Tax type deleted successfully")

# ------------------------------------------------------------------
# Tax Rates
# ------------------------------------------------------------------

@router.get("/taxes/rates", response_model=GenericResponse[List[tax_schema.TaxRate]])
def get_tax_rates(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    tax_type_id: int = None,
    active_only: bool = False,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Retrieve all tax rates.
    """
    query = db.query(TaxRate)
    if tax_type_id:
        query = query.filter(TaxRate.tax_type_id == tax_type_id)
    if active_only:
        query = query.filter(TaxRate.is_active == True)
    
    return GenericResponse(data=query.order_by(TaxRate.effective_from.desc()).offset(skip).limit(limit).all())

@router.post("/taxes/rates", response_model=GenericResponse[tax_schema.TaxRate])
def create_tax_rate(
    tax_rate_in: tax_schema.TaxRateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Create a new tax rate.
    """
    # Verify tax type exists
    tax_type = db.query(TaxType).filter(TaxType.id == tax_rate_in.tax_type_id).first()
    if not tax_type:
        raise HTTPException(status_code=404, detail="Tax type not found")
    
    # If this is set as default, unset other defaults for this tax type
    if tax_rate_in.is_default:
        db.query(TaxRate).filter(
            TaxRate.tax_type_id == tax_rate_in.tax_type_id,
            TaxRate.is_default == True
        ).update({TaxRate.is_default: False})
    
    db_tax_rate = TaxRate(
        **tax_rate_in.dict(),
        created_by_id=current_user.id
    )
    db.add(db_tax_rate)
    db.commit()
    db.refresh(db_tax_rate)
    return db_tax_rate

@router.put("/taxes/rates/{tax_rate_id}", response_model=GenericResponse[tax_schema.TaxRate])
def update_tax_rate(
    tax_rate_id: int,
    tax_rate_in: tax_schema.TaxRateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Update an existing tax rate.
    """
    db_tax_rate = db.query(TaxRate).filter(TaxRate.id == tax_rate_id).first()
    if not db_tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    update_data = tax_rate_in.dict(exclude_unset=True)
    
    # Verify tax type exists if being changed
    if "tax_type_id" in update_data:
        tax_type = db.query(TaxType).filter(TaxType.id == update_data["tax_type_id"]).first()
        if not tax_type:
            raise HTTPException(status_code=404, detail="Tax type not found")
    
    # If setting as default, unset other defaults for this tax type
    if update_data.get("is_default"):
        tax_type_id = update_data.get("tax_type_id", db_tax_rate.tax_type_id)
        db.query(TaxRate).filter(
            TaxRate.tax_type_id == tax_type_id,
            TaxRate.is_default == True,
            TaxRate.id != tax_rate_id
        ).update({TaxRate.is_default: False})
    
    for field, value in update_data.items():
        setattr(db_tax_rate, field, value)
    
    db.commit()
    db.refresh(db_tax_rate)
    return db_tax_rate

@router.delete("/taxes/rates/{tax_rate_id}")
def delete_tax_rate(
    tax_rate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Delete a tax rate.
    """
    db_tax_rate = db.query(TaxRate).filter(TaxRate.id == tax_rate_id).first()
    if not db_tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    db.delete(db_tax_rate)
    db.commit()
    return GenericResponse(message="Tax rate deleted successfully")
