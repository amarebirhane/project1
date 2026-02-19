from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Request
import logging
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...models.banking import BankAccount, BankTransaction
from ...schemas import banking as banking_schema
from ...services.banking import banking_service
from ...services.forecasting import forecasting_service
from ...services.bank_feed_service import bank_feed_service
from ...services.chapa_service import chapa_service
from ...crud.user import user as user_crud # Added for hierarchy check

router = APIRouter()
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Bank Accounts
# ------------------------------------------------------------------

@router.get("/accounts", response_model=List[banking_schema.BankAccount])
def get_bank_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List connected bank accounts with hierarchy-based filtering"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        return db.query(BankAccount).all()
        
    # Get hierarchy for the current user
    subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
    allowed_ids = subordinate_ids + [current_user.id]
    
    return db.query(BankAccount).filter(BankAccount.created_by_id.in_(allowed_ids)).all()

@router.get("/banks", response_model=List[dict])
def get_supported_banks(
    current_user: User = Depends(deps.get_current_active_user)
):
    """List supported Ethiopian banks from Chapa, with fallback"""
    banks = chapa_service.get_banks()
    if not banks:
        # Fallback to common Ethiopian banks if Chapa service is inactive/empty
        return [
            {"id": "cbe", "name": "Commercial Bank of Ethiopia", "code": "CBE"},
            {"id": "awash", "name": "Awash Bank", "code": "AWASH"},
            {"id": "dashen", "name": "Dashen Bank", "code": "DASHEN"},
            {"id": "abyssinia", "name": "Bank of Abyssinia", "code": "BOA"},
            {"id": "hibret", "name": "Hibret Bank", "code": "HIBRET"},
            {"id": "coop", "name": "Cooperative Bank of Oromia", "code": "COOP"},
            {"id": "zemen", "name": "Zemen Bank", "code": "ZEMEN"},
            {"id": "nib", "name": "Nib International Bank", "code": "NIB"},
            {"id": "wegagen", "name": "Wegagen Bank", "code": "WEGAGEN"},
            {"id": "berhan", "name": "Berhan Bank", "code": "BERHAN"}
        ]
    return banks

@router.post("/accounts", response_model=banking_schema.BankAccount)
def create_bank_account(
    account_in: banking_schema.BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Connect a new bank account"""
    # Any active user can connect a bank account; they will be the owner/creator.
    db_account = BankAccount(
        **account_in.dict(),
        created_by_id=current_user.id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

# ------------------------------------------------------------------
# CSV Upload & Feed
# ------------------------------------------------------------------

@router.post("/upload-statement", response_model=List[banking_schema.BankTransaction])
async def upload_bank_statement(
    bank_account_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """Upload CSV bank statement"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    try:
        # Verify access to the bank account
        account = db.query(BankAccount).filter(BankAccount.id == bank_account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Bank account not found")
            
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
            allowed_ids = subordinate_ids + [current_user.id]
            if account.created_by_id not in allowed_ids:
                raise HTTPException(status_code=403, detail="You do not have access to this bank account")

        content = await file.read()
        transactions = banking_service.process_csv_upload(db, bank_account_id, content, current_user.id)
        return transactions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")

@router.get("/transactions", response_model=List[banking_schema.BankTransaction])
def get_transactions(
    bank_account_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get bank transactions with access control"""
    # Verify access to the bank account
    account = db.query(BankAccount).filter(BankAccount.id == bank_account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
        
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        allowed_ids = subordinate_ids + [current_user.id]
        
        if account.created_by_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="You do not have access to this bank account")
            
    return db.query(BankTransaction).filter(
        BankTransaction.bank_account_id == bank_account_id
    ).offset(skip).limit(limit).all()

# ------------------------------------------------------------------
# Simulation & Automation
# ------------------------------------------------------------------

@router.post("/simulate-fetch", response_model=List[banking_schema.BankTransaction])
def simulate_bank_fetch(
    bank_account_id: int,
    count: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Manually trigger a simulated bank API fetch (polling simulation) with access control
    """
    account = db.query(BankAccount).filter(BankAccount.id == bank_account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
        
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        allowed_ids = subordinate_ids + [current_user.id]
        if account.created_by_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="You do not have access to this bank account")
            
    return bank_feed_service.simulate_polling_sync(db, bank_account_id, count, current_user.id)

@router.post("/webhook/simulator")
def simulate_bank_webhook(
    bank_account_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Simulate an incoming bank webhook with access control
    """
    account = db.query(BankAccount).filter(BankAccount.id == bank_account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
        
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        allowed_ids = subordinate_ids + [current_user.id]
        if account.created_by_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="You do not have access to this bank account")
            
    tx = bank_feed_service.process_mock_webhook(db, bank_account_id, payload, current_user.id)
    if not tx:
        raise HTTPException(status_code=400, detail="Failed to process simulated webhook")
    return tx

@router.post("/chapa/webhook")
async def chapa_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle incoming webhooks from Chapa.
    Verifies authenticity and processes transaction updates.
    """
    payload_bytes = await request.body()
    payload_str = payload_bytes.decode('utf-8')
    signature = request.headers.get("x-chapa-signature")
    
    if not signature:
        raise HTTPException(status_code=401, detail="Missing Chapa signature")
        
    if not chapa_service.verify_webhook(payload_str, signature):
        logger.warning(f"Invalid Chapa webhook signature: {signature}")
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    import json
    try:
        data = json.loads(payload_str)
        # Delegate processing to bank_feed_service
        tx = bank_feed_service.process_chapa_webhook(db, data)
        return {"status": "success", "transaction_id": tx.id if tx else None}
    except Exception as e:
        logger.error(f"Error processing Chapa webhook: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# ------------------------------------------------------------------
# Cash Flow Forecasting
# ------------------------------------------------------------------

@router.get("/forecast")
def get_cash_flow_forecast(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get cash flow forecast using ML (Linear Regression on historical data)
    """
    forecast = forecasting_service.get_cash_flow_forecast(db, days)
    return {
        "days_ahead": days,
        "forecast": forecast
    }
@router.post("/transfer", response_model=banking_schema.MoneyTransferResponse)
def initiate_money_transfer(
    transfer_in: banking_schema.MoneyTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Initiate a money transfer via Chapa with access control
    """
    # Verify access to the source bank account
    account = db.query(BankAccount).filter(BankAccount.id == transfer_in.source_account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Source bank account not found")
        
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        allowed_ids = subordinate_ids + [current_user.id]
        if account.created_by_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="You do not have access to the source bank account")
            
    return banking_service.initiate_transfer(db, transfer_in, current_user.id)
