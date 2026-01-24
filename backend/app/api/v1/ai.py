from typing import List, Any, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...schemas import fraud as schemas
from ...schemas.ai import ChatRequest, ChatResponse
from ...services.fraud_detection import fraud_detection_service
from ...services.scenario_modeling import scenario_service
from ...models.fraud import FraudFlag, FraudFlagStatus

router = APIRouter()

@router.post("/fraud/scan", response_model=Dict[str, Any])
def run_fraud_scan(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """
    Trigger a manual fraud detection scan.
    Requires Finance Admin role.
    """
    flag_count = fraud_detection_service.scan_for_fraud(db)
    return {"message": "Scan completed", "new_flags_found": flag_count}

@router.get("/fraud", response_model=List[schemas.FraudFlagSchema])
def list_fraud_flags(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    List all flagged transactions.
    """
    return db.query(FraudFlag).offset(skip).limit(limit).all()

@router.put("/fraud/{flag_id}", response_model=schemas.FraudFlagSchema)
def update_fraud_flag(
    flag_id: int,
    flag_in: schemas.FraudFlagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """
    Update the status of a fraud flag (Confirm/Dismiss).
    """
    flag = db.query(FraudFlag).filter(FraudFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Fraud flag not found")
        
    flag.status = flag_in.status or flag.status
    flag.review_comments = flag_in.review_comments
    flag.reviewed_by_id = current_user.id
    flag.reviewed_at = datetime.now()
    
    db.commit()
    db.refresh(flag)
    return flag

@router.post("/simulate", response_model=schemas.ScenarioSimulationResponse)
async def run_simulation(
    request: schemas.ScenarioSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Run a 'What If' financial simulation.
    """
    result = await scenario_service.simulate_scenario(
        db=db,
        months=request.period_months,
        revenue_multiplier=request.revenue_multiplier,
        expense_multiplier=request.expense_multiplier,
        revenue_offset=request.fixed_revenue_offset,
        expense_offset=request.fixed_expense_offset
    )
    return result

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Chat with the AI Financial Assistant.
    """
    from ...services.ai_chat import ai_chat_service
    response_text = await ai_chat_service.generate_response(
        request.message, 
        request.history,
        current_page=request.current_page,
        user_id=current_user.id,
        image_data=request.image_data
    )
    return {"response": response_text}
