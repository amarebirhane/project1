from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...schemas import payroll as schemas
from ...models.payroll import EmployeeProfile, PayrollPeriod, Payslip, EmploymentStatus, PayrollStatus
from ...services.payroll import payroll_service

router = APIRouter()

# Employee Management
@router.post("/employees", response_model=schemas.EmployeeProfile)
def create_employee_profile(
    profile_in: schemas.EmployeeProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """
    Register a new employee for payroll.
    """
    db_profile = EmployeeProfile(**profile_in.dict())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.get("/employees", response_model=List[schemas.EmployeeProfile])
def list_employees(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    List all employees.
    """
    return db.query(EmployeeProfile).offset(skip).limit(limit).all()

# Payroll Periods
@router.post("/periods", response_model=schemas.PayrollPeriod)
def create_payroll_period(
    period_in: schemas.PayrollPeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """
    Create a new payroll period.
    """
    db_period = PayrollPeriod(
        **period_in.dict(),
        created_by_id=current_user.id,
        status=PayrollStatus.DRAFT
    )
    db.add(db_period)
    db.commit()
    db.refresh(db_period)
    return db_period

@router.get("/periods", response_model=List[schemas.PayrollPeriod])
def list_periods(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    List all payroll periods.
    """
    return db.query(PayrollPeriod).offset(skip).limit(limit).all()

@router.post("/periods/{period_id}/generate", response_model=schemas.PayrollPeriod)
def generate_payslips(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """
    Generate payslips for all active employees in a period.
    """
    period = payroll_service.generate_period_payslips(db, period_id)
    if not period:
        raise HTTPException(status_code=400, detail="Could not generate payslips. Period might not be in DRAFT status.")
    return period

@router.post("/periods/{period_id}/approve", response_model=schemas.PayrollPeriod)
def approve_payroll(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """
    Approve payroll and generate journal entries.
    """
    period = payroll_service.approve_payroll(db, period_id, current_user.id)
    if not period:
        raise HTTPException(status_code=400, detail="Could not approve payroll.")
    return period

@router.post("/periods/{period_id}/disburse", response_model=schemas.PayrollPeriod)
def disburse_payroll(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """
    Initiate transfers for all approved payslips in a payroll period.
    """
    period = payroll_service.disburse_payroll(db, period_id)
    if not period:
        raise HTTPException(status_code=400, detail="Could not disburse payroll. Period might not be in APPROVED status.")
    return period

@router.get("/periods/{period_id}/payslips", response_model=List[schemas.Payslip])
def list_payslips(
    period_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    List all payslips for a specific period.
    """
    return db.query(Payslip).filter(Payslip.period_id == period_id).all()
