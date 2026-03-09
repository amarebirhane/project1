# app/api/v1/budgeting.py
"""
Budgeting & Forecasting (FP&A) API
Provides endpoints for budget management, scenario planning, forecasting, and variance analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import json
import logging
from pydantic import BaseModel  # type: ignore
from ...schemas.responses import GenericResponse, ErrorResponse

logger = logging.getLogger(__name__)

from ...core.database import get_db
from ...core.security import verify_password
from ...api.deps import get_current_active_user
from ...models.user import User, UserRole
from ...models.budget import BudgetStatus, BudgetType, BudgetPeriod
from ...crud.budget import budget, budget_item, budget_scenario, forecast, budget_variance
from ...schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetOut,
    BudgetItemCreate, BudgetItemUpdate, BudgetItemOut,
    BudgetScenarioCreate, BudgetScenarioUpdate, BudgetScenarioOut,
    ForecastCreate, ForecastUpdate, ForecastOut,
    BudgetVarianceOut, ScenarioComparisonRequest, BudgetValidationResult,
    CustomTrainingRequest, CustomForecastRequest
)
from ...services.budgeting import BudgetingService
from ...services.forecasting import ForecastingService
from ...services.ml_forecasting import MLForecastingService
from ...services.variance import VarianceAnalysisService

router = APIRouter()


# ============================================================================
# BUDGET MANAGEMENT
# ============================================================================

@router.post("/budgets", response_model=GenericResponse[BudgetOut], status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new budget"""
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions to create budgets")
    
    # Create budget
    budget_dict = budget_data.dict(exclude={"items"})
    budget_dict["created_by_id"] = current_user.id
    
    new_budget = budget.create(db, budget_dict)
    
    # Add budget items
    items_data = budget_data.items or []
    for item_data in items_data:
        item_dict = item_data.dict()
        item_dict["budget_id"] = new_budget.id
        if item_dict.get("monthly_amounts"):
            item_dict["monthly_amounts"] = json.dumps(item_dict["monthly_amounts"])
        budget_item.create(db, item_dict)
    
    # Calculate totals
    totals = budget.calculate_totals(db, new_budget.id)
    budget.update(db, new_budget.id, totals)
    
    db.refresh(new_budget)
    return GenericResponse(message="Budget created successfully", data=new_budget)


@router.post("/budgets/from-template", response_model=GenericResponse[BudgetOut], status_code=status.HTTP_201_CREATED)
def create_budget_from_template(
    template_name: str = Query(..., description="Template name"),
    name: Optional[str] = Query(None),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    department: Optional[str] = Query(None),
    project: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a budget from a predefined template"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    new_budget = BudgetingService.create_budget_from_template(
        db, template_name, current_user.id, start_date_dt, end_date_dt,
        name=name, department=department, project=project
    )
    
    db.refresh(new_budget)
    return GenericResponse(message="Budget created from template successfully", data=new_budget)


@router.get("/budgets", response_model=GenericResponse[List[BudgetOut]])
def get_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all budgets"""
    budgets = budget.get_all(
        db, skip, limit, current_user.id, current_user.role, status, department
    )
    return GenericResponse(data=budgets)


@router.get("/budgets/{budget_id}", response_model=GenericResponse[BudgetOut])
def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific budget by ID"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if budget_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return GenericResponse(data=budget_obj)


@router.put("/budgets/{budget_id}", response_model=GenericResponse[BudgetOut])
def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if budget_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = budget_update.dict(exclude_unset=True)
    updated_budget = budget.update(db, budget_id, update_data)
    
    # Recalculate totals if items changed
    if update_data:
        totals = budget.calculate_totals(db, budget_id)
        budget.update(db, budget_id, totals)
    
    return GenericResponse(message="Budget updated successfully", data=updated_budget)


@router.delete("/budgets/{budget_id}", response_model=GenericResponse, status_code=status.HTTP_200_OK)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if budget_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    budget.delete(db, budget_id)
    return GenericResponse(message="Budget deleted successfully")


class DeleteBudgetRequest(BaseModel):
    password: str

@router.post("/budgets/{budget_id}/delete")
def delete_budget_with_password(
    budget_id: int,
    delete_request: DeleteBudgetRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a budget - requires password verification"""
    # Reload current user from database to ensure we have the password hash
    db_user_for_auth = db.query(User).filter(User.id == current_user.id).first()
    if not db_user_for_auth:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    # Validate that password hash exists
    if not db_user_for_auth.hashed_password:
        raise HTTPException(
            status_code=500,
            detail="User password hash not found. Please contact administrator."
        )
    
    # Verify password before deletion
    if not delete_request.password or not delete_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to delete a budget."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this budget."
        )
    
    # Check budget exists
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if budget_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete the budget
    budget.delete(db, budget_id)
    return GenericResponse(message="Budget deleted successfully")


@router.post("/budgets/{budget_id}/validate", response_model=GenericResponse[BudgetValidationResult])
def validate_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Validate budget items and totals"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    result = BudgetingService.validate_budget_items(db, budget_id)
    
    # Update totals if valid
    if result["valid"]:
        budget.update(db, budget_id, {
            "total_revenue": result["revenue_total"],
            "total_expenses": result["expense_total"],
            "total_profit": result["profit"]
        })
    
    return GenericResponse(message="Budget validation completed", data=result)


# ============================================================================
# BUDGET ITEMS
# ============================================================================

@router.post("/budgets/{budget_id}/items", response_model=GenericResponse[BudgetItemOut], status_code=status.HTTP_201_CREATED)
def create_budget_item(
    budget_id: int,
    item_data: BudgetItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add an item to a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    item_dict = item_data.dict()
    item_dict["budget_id"] = budget_id
    if item_dict.get("monthly_amounts"):
        item_dict["monthly_amounts"] = json.dumps(item_dict["monthly_amounts"])
    
    new_item = budget_item.create(db, item_dict)
    
    # Recalculate totals
    totals = budget.calculate_totals(db, budget_id)
    budget.update(db, budget_id, totals)
    
    return GenericResponse(message="Budget item added successfully", data=new_item)


@router.get("/budgets/{budget_id}/items", response_model=GenericResponse[List[BudgetItemOut]])
def get_budget_items(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all items for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    items = budget_item.get_by_budget(db, budget_id)
    return GenericResponse(data=items)


@router.put("/budgets/{budget_id}/items/{item_id}", response_model=GenericResponse[BudgetItemOut])
def update_budget_item(
    budget_id: int,
    item_id: int,
    item_update: BudgetItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a budget item"""
    item_obj = budget_item.get(db, item_id)
    if not item_obj or item_obj.budget_id != budget_id:
        raise HTTPException(status_code=404, detail="Budget item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    if update_data.get("monthly_amounts"):
        update_data["monthly_amounts"] = json.dumps(update_data["monthly_amounts"])
    
    updated_item = budget_item.update(db, item_id, update_data)
    
    # Recalculate totals
    totals = budget.calculate_totals(db, budget_id)
    budget.update(db, budget_id, totals)
    
    return GenericResponse(message="Budget item updated successfully", data=updated_item)


@router.delete("/budgets/{budget_id}/items/{item_id}", response_model=GenericResponse, status_code=status.HTTP_200_OK)
def delete_budget_item(
    budget_id: int,
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a budget item"""
    item_obj = budget_item.get(db, item_id)
    if not item_obj or item_obj.budget_id != budget_id:
        raise HTTPException(status_code=404, detail="Budget item not found")
    
    budget_item.delete(db, item_id)
    
    # Recalculate totals
    totals = budget.calculate_totals(db, budget_id)
    budget.update(db, budget_id, totals)
    
    return GenericResponse(message="Budget item deleted successfully")


class DeleteBudgetItemRequest(BaseModel):
    password: str

@router.post("/budgets/{budget_id}/items/{item_id}/delete")
def delete_budget_item_with_password(
    budget_id: int,
    item_id: int,
    delete_request: DeleteBudgetItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a budget item - requires password verification"""
    # Reload current user from database to ensure we have the password hash
    db_user_for_auth = db.query(User).filter(User.id == current_user.id).first()
    if not db_user_for_auth:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    # Validate that password hash exists
    if not db_user_for_auth.hashed_password:
        raise HTTPException(
            status_code=500,
            detail="User password hash not found. Please contact administrator."
        )
    
    # Verify password before deletion
    if not delete_request.password or not delete_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to delete a budget item."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this budget item."
        )
    
    # Check item exists
    item_obj = budget_item.get(db, item_id)
    if not item_obj or item_obj.budget_id != budget_id:
        raise HTTPException(status_code=404, detail="Budget item not found")
    
    # Delete the budget item
    budget_item.delete(db, item_id)
    
    # Recalculate totals
    totals = budget.calculate_totals(db, budget_id)
    budget.update(db, budget_id, totals)
    
    return GenericResponse(message="Budget item deleted successfully")


# ============================================================================
# SCENARIO PLANNING
# ============================================================================

@router.post("/budgets/{budget_id}/scenarios", response_model=GenericResponse[BudgetScenarioOut], status_code=status.HTTP_201_CREATED)
def create_scenario(
    budget_id: int,
    scenario_data: BudgetScenarioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a scenario for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Calculate scenario totals
    scenario_calc = BudgetingService.calculate_scenario(
        db, budget_id, scenario_data.dict()
    )
    
    # Create scenario
    scenario_dict = scenario_data.dict()
    scenario_dict["budget_id"] = budget_id
    scenario_dict["created_by_id"] = current_user.id
    if scenario_dict.get("adjustments"):
        scenario_dict["adjustments"] = json.dumps(scenario_dict["adjustments"])
    scenario_dict.update({
        "total_revenue": scenario_calc["total_revenue"],
        "total_expenses": scenario_calc["total_expenses"],
        "total_profit": scenario_calc["total_profit"]
    })
    
    new_scenario = budget_scenario.create(db, scenario_dict)
    
    # Parse adjustments JSON string to dictionary for response
    if new_scenario.adjustments and isinstance(new_scenario.adjustments, str):
        try:
            new_scenario.adjustments = json.loads(new_scenario.adjustments)
        except (json.JSONDecodeError, TypeError):
            new_scenario.adjustments = None
    
    return GenericResponse(message="Scenario created successfully", data=new_scenario)


@router.get("/budgets/{budget_id}/scenarios", response_model=GenericResponse[List[BudgetScenarioOut]])
def get_scenarios(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all scenarios for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    scenarios = budget_scenario.get_by_budget(db, budget_id)
    
    # Parse adjustments JSON string to dictionary for each scenario
    for scenario in scenarios:
        if scenario.adjustments and isinstance(scenario.adjustments, str):
            try:
                scenario.adjustments = json.loads(scenario.adjustments)
            except (json.JSONDecodeError, TypeError):
                scenario.adjustments = None
    
    return GenericResponse(data=scenarios)


@router.post("/budgets/{budget_id}/scenarios/compare", response_model=GenericResponse)
def compare_scenarios(
    budget_id: int,
    comparison_request: ScenarioComparisonRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Compare multiple scenarios side by side"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    comparison = BudgetingService.compare_scenarios(
        db, budget_id, comparison_request.scenario_ids
    )
    return GenericResponse(data=comparison)


# ============================================================================
# FORECASTING
# ============================================================================

@router.post("/forecasts", response_model=GenericResponse[ForecastOut], status_code=status.HTTP_201_CREATED)
def create_forecast(
    forecast_data: ForecastCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new forecast"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    forecast_dict = forecast_data.dict()
    forecast_dict["created_by_id"] = current_user.id
    
    # Generate forecast data based on method
    method = forecast_dict["method"]
    forecast_type = forecast_dict["forecast_type"]
    start_date = forecast_dict["start_date"]
    end_date = forecast_dict["end_date"]
    method_params = forecast_dict.get("method_params", {})
    historical_start = forecast_dict.get("historical_start_date", start_date - timedelta(days=365))
    historical_end = forecast_dict.get("historical_end_date", start_date)
    
    if method == "moving_average":
        forecast_values = ForecastingService.generate_moving_average_forecast(
            db, forecast_type, start_date, end_date, historical_start, historical_end,
            window=method_params.get("window", 3),
            user_id=current_user.id,
            user_role=current_user.role
        )
    elif method == "linear_growth":
        forecast_values = ForecastingService.generate_linear_growth_forecast(
            db, forecast_type, start_date, end_date, historical_start, historical_end,
            growth_rate=method_params.get("growth_rate", 0.05),
            user_id=current_user.id,
            user_role=current_user.role
        )
    elif method == "trend":
        forecast_values = ForecastingService.generate_trend_forecast(
            db, forecast_type, start_date, end_date, historical_start, historical_end,
            user_id=current_user.id,
            user_role=current_user.role
        )
    # AI/ML Methods
    elif method == "arima" and forecast_type == "expense":
        try:
            periods = (end_date - start_date).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                "expense", "arima", start_date, end_date, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except Exception as e:
            logger.error(f"ARIMA forecast failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"ARIMA forecast failed: {str(e)}")
    elif method == "prophet":
        try:
            periods = (end_date - start_date).days
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                forecast_type, "prophet", start_date, end_date, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except Exception as e:
            logger.error(f"Prophet forecast failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Prophet forecast failed: {str(e)}")
    elif method == "xgboost":
        try:
            periods = (end_date - start_date).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                forecast_type, "xgboost", start_date, end_date, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except Exception as e:
            logger.error(f"XGBoost forecast failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"XGBoost forecast failed: {str(e)}")
    elif method == "lstm":
        try:
            periods = (end_date - start_date).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                forecast_type, "lstm", start_date, end_date, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except Exception as e:
            logger.error(f"LSTM forecast failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"LSTM forecast failed: {str(e)}")
    elif method == "linear_regression" and forecast_type == "expense":
        try:
            periods = (end_date - start_date).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                "expense", "linear_regression", start_date, end_date, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except Exception as e:
            logger.error(f"Linear Regression forecast failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Linear Regression forecast failed: {str(e)}")
    elif method == "sarima" and forecast_type == "inventory":
        try:
            periods = (end_date - start_date).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                "inventory", "sarima", start_date, end_date, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except Exception as e:
            logger.error(f"SARIMA forecast failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"SARIMA forecast failed: {str(e)}")
    else:
        forecast_values = []
    
    forecast_dict["forecast_data"] = json.dumps(forecast_values) if forecast_values else None
    if forecast_dict.get("method_params"):
        forecast_dict["method_params"] = json.dumps(forecast_dict["method_params"])
    
    new_forecast = forecast.create(db, forecast_dict)
    
    # Parse JSON strings back to dicts for response
    if new_forecast.method_params and isinstance(new_forecast.method_params, str):
        new_forecast.method_params = json.loads(new_forecast.method_params)
    if new_forecast.forecast_data and isinstance(new_forecast.forecast_data, str):
        new_forecast.forecast_data = json.loads(new_forecast.forecast_data)
    
    return GenericResponse(message="Forecast generated and saved successfully", data=new_forecast)


@router.get("/forecasts/preview", response_model=GenericResponse[List])
def preview_forecast(
    forecast_type: str = Query(..., regex="^(revenue|expense|profit|all)$"),
    method: str = Query(..., regex="^(moving_average|linear_growth|trend|arima|prophet|xgboost|lstm|linear_regression|sarima)$"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    historical_start_date: Optional[str] = Query(None),
    historical_end_date: Optional[str] = Query(None),
    window: Optional[int] = Query(3),
    growth_rate: Optional[float] = Query(0.05),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a forecast preview without saving to database"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
        hist_start = datetime.fromisoformat(historical_start_date) if historical_start_date else start_date_dt - timedelta(days=365)
        hist_end = datetime.fromisoformat(historical_end_date) if historical_end_date else start_date_dt
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    forecast_values = []
    
    if method == "moving_average":
        forecast_values = ForecastingService.generate_moving_average_forecast(
            db, forecast_type, start_date_dt, end_date_dt, hist_start, hist_end,
            window=window,
            user_id=current_user.id,
            user_role=current_user.role
        )
    elif method == "linear_growth":
        forecast_values = ForecastingService.generate_linear_growth_forecast(
            db, forecast_type, start_date_dt, end_date_dt, hist_start, hist_end,
            growth_rate=growth_rate,
            user_id=current_user.id,
            user_role=current_user.role
        )
    elif method == "trend":
        forecast_values = ForecastingService.generate_trend_forecast(
            db, forecast_type, start_date_dt, end_date_dt, hist_start, hist_end,
            user_id=current_user.id,
            user_role=current_user.role
        )
    # AI/ML Methods
    elif method == "arima":
        try:
            periods = (end_date_dt - start_date_dt).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                forecast_type, "arima", start_date_dt, end_date_dt, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail=f"ARIMA model for {forecast_type} not found. Please train the model in Settings > AI Models.")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"ARIMA forecast failed: {str(e)}")
    elif method == "prophet":
        try:
            periods = (end_date_dt - start_date_dt).days
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                forecast_type, "prophet", start_date_dt, end_date_dt, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail=f"Prophet model for {forecast_type} not found. Please train the model in Settings > AI Models.")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Prophet forecast failed: {str(e)}")
    elif method == "xgboost":
        try:
            periods = (end_date_dt - start_date_dt).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                forecast_type, "xgboost", start_date_dt, end_date_dt, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail=f"XGBoost model for {forecast_type} not found. Please train the model in Settings > AI Models.")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"XGBoost forecast failed: {str(e)}")
    elif method == "lstm":
        try:
            periods = (end_date_dt - start_date_dt).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                forecast_type, "lstm", start_date_dt, end_date_dt, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail=f"LSTM model for {forecast_type} not found. Please train the model in Settings > AI Models.")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"LSTM forecast failed: {str(e)}")
    elif method == "linear_regression":
        try:
            periods = (end_date_dt - start_date_dt).days // 30
            forecast_values = MLForecastingService.generate_forecast_with_trained_model(
                forecast_type, "linear_regression", start_date_dt, end_date_dt, current_user.id, periods,
                db=db, user_role=current_user.role
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail=f"Linear Regression model for {forecast_type} not found. Please train the model in Settings > AI Models.")
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Linear Regression forecast failed: {str(e)}")
    
    return GenericResponse(data=forecast_values)


@router.get("/forecasts", response_model=GenericResponse[List[ForecastOut]])
def get_forecasts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all forecasts"""
    forecasts = forecast.get_all(db, skip, limit, current_user.id, current_user.role)
    # Parse JSON strings back to dicts for response
    for f in forecasts:
        if f.method_params and isinstance(f.method_params, str):
            f.method_params = json.loads(f.method_params)
        if f.forecast_data and isinstance(f.forecast_data, str):
            f.forecast_data = json.loads(f.forecast_data)
    return GenericResponse(data=forecasts)


@router.get("/forecasts/{forecast_id}", response_model=GenericResponse[ForecastOut])
def get_forecast(
    forecast_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific forecast by ID"""
    forecast_obj = forecast.get(db, forecast_id)
    if not forecast_obj:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if forecast_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Parse JSON strings back to dicts for response
    if forecast_obj.method_params and isinstance(forecast_obj.method_params, str):
        forecast_obj.method_params = json.loads(forecast_obj.method_params)
    if forecast_obj.forecast_data and isinstance(forecast_obj.forecast_data, str):
        forecast_obj.forecast_data = json.loads(forecast_obj.forecast_data)
    
    return GenericResponse(data=forecast_obj)


@router.put("/forecasts/{forecast_id}", response_model=GenericResponse[ForecastOut])
def update_forecast(
    forecast_id: int,
    forecast_data: ForecastUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a forecast"""
    forecast_obj = forecast.get(db, forecast_id)
    if not forecast_obj:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # Check permissions - must match get_forecast permissions to prevent escalation
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if forecast_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Prepare update data
    update_dict = forecast_data.dict(exclude_unset=True)
    
    # If forecast_data is provided, serialize it
    if "forecast_data" in update_dict and update_dict["forecast_data"]:
        update_dict["forecast_data"] = json.dumps(update_dict["forecast_data"])
    
    # Update the forecast
    updated_forecast = forecast.update(db, forecast_id, update_dict)
    
    # Parse JSON strings back to dicts for response
    if updated_forecast.method_params and isinstance(updated_forecast.method_params, str):
        updated_forecast.method_params = json.loads(updated_forecast.method_params)
    if updated_forecast.forecast_data and isinstance(updated_forecast.forecast_data, str):
        updated_forecast.forecast_data = json.loads(updated_forecast.forecast_data)
    
    return GenericResponse(message="Forecast updated successfully", data=updated_forecast)


# ============================================================================
# AI/ML MODEL TRAINING
# ============================================================================

@router.post("/ml/train/all", response_model=GenericResponse)
def train_all_models(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train all AI/ML models for all metrics"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    try:
        results = MLForecastingService.train_all_models(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role
        )
        return GenericResponse(
            status="success",
            message="Model training completed",
            data=results
        )
    except ValueError as e:
        logger.error(f"Model training failed (validation error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except ImportError as e:
        logger.error(f"Model training failed (dependency error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Model training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/ml/train/expenses/arima", response_model=GenericResponse)
def train_expenses_arima(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    order: str = Query("1,1,1", description="ARIMA order (p,d,q)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train ARIMA model for expenses"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
        order_tuple = tuple(map(int, order.split(',')))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date or order format")
    
    try:
        result = MLForecastingService.train_arima_expenses(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role, order_tuple
        )
        return GenericResponse(message="ARIMA training completed", data=result)
    except (ValueError, ImportError) as e:
        logger.error(f"ARIMA training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"ARIMA training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/ml/train/expenses/prophet", response_model=GenericResponse)
def train_expenses_prophet(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train Prophet model for expenses"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    try:
        result = MLForecastingService.train_prophet_expenses(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role
        )
        return GenericResponse(message="Prophet training completed", data=result)
    except ImportError as e:
        # Prophet dependency/installation errors - return 400 (client error)
        logger.error(f"Prophet training failed (import error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        # Data validation errors - return 400 (client error)
        logger.error(f"Prophet training failed (validation error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Other errors - return 500 (server error)
        logger.error(f"Prophet training failed: {str(e)}", exc_info=True)
        error_msg = str(e)
        # Provide helpful message for common Prophet issues
        if 'stan' in error_msg.lower() or 'cmdstan' in error_msg.lower():
            error_msg = "Prophet stan_backend error. This is a known issue on Windows/Python 3.12. Try using alternative models (ARIMA, XGBoost, LSTM) instead."
        raise HTTPException(status_code=500, detail=f"Training failed: {error_msg}")


@router.post("/ml/train/expenses/linear-regression", response_model=GenericResponse)
def train_expenses_linear_regression(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train Linear Regression model for expenses"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    try:
        result = MLForecastingService.train_linear_regression_expenses(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role
        )
        return GenericResponse(message="Linear Regression training completed", data=result)
    except (ValueError, ImportError) as e:
        logger.error(f"Linear Regression training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Linear Regression training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/ml/train/revenue/prophet", response_model=GenericResponse)
def train_revenue_prophet(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train Prophet model for revenue"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    try:
        result = MLForecastingService.train_prophet_revenue(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role
        )
        return GenericResponse(message="Prophet revenue training completed", data=result)
    except ImportError as e:
        # Prophet dependency/installation errors - return 400 (client error)
        logger.error(f"Prophet training failed (import error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        # Data validation errors - return 400 (client error)
        logger.error(f"Prophet training failed (validation error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Other errors - return 500 (server error)
        logger.error(f"Prophet training failed: {str(e)}", exc_info=True)
        error_msg = str(e)
        # Provide helpful message for common Prophet issues
        if 'stan' in error_msg.lower() or 'cmdstan' in error_msg.lower():
            error_msg = "Prophet stan_backend error. This is a known issue on Windows/Python 3.12. Try using alternative models (ARIMA, XGBoost, LSTM) instead."
        raise HTTPException(status_code=500, detail=f"Training failed: {error_msg}")


@router.post("/ml/train/revenue/xgboost", response_model=GenericResponse)
def train_revenue_xgboost(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train XGBoost model for revenue"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    try:
        result = MLForecastingService.train_xgboost_revenue(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role
        )
        return GenericResponse(message="XGBoost revenue training completed", data=result)
    except (ValueError, ImportError) as e:
        logger.error(f"XGBoost revenue training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"XGBoost revenue training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/ml/train/revenue/lstm", response_model=GenericResponse)
def train_revenue_lstm(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    epochs: int = Query(50, ge=1, le=500),
    batch_size: int = Query(32, ge=1, le=128),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train LSTM model for revenue"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    try:
        result = MLForecastingService.train_lstm_revenue(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role,
            epochs=epochs, batch_size=batch_size
        )
        return GenericResponse(message="LSTM revenue training completed", data=result)
    except (ValueError, ImportError) as e:
        logger.error(f"LSTM revenue training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"LSTM revenue training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/ml/train/inventory/sarima", response_model=GenericResponse)
def train_inventory_sarima(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    order: str = Query("1,1,1", description="ARIMA order (p,d,q)"),
    seasonal_order: str = Query("1,1,1,12", description="Seasonal order (P,D,Q,s)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train SARIMA model for inventory"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
        order_tuple = tuple(map(int, order.split(',')))
        seasonal_order_tuple = tuple(map(int, seasonal_order.split(',')))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date or order format")
    
    try:
        result = MLForecastingService.train_sarima_inventory(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role,
            order_tuple, seasonal_order_tuple
        )
        return GenericResponse(message="SARIMA inventory training completed", data=result)
    except (ValueError, ImportError) as e:
        logger.error(f"SARIMA training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"SARIMA training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/ml/train/inventory/xgboost", response_model=GenericResponse)
def train_inventory_xgboost(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train XGBoost model for inventory"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    try:
        result = MLForecastingService.train_xgboost_inventory(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role
        )
        return GenericResponse(message="XGBoost inventory training completed", data=result)
    except (ValueError, ImportError) as e:
        logger.error(f"XGBoost inventory training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"XGBoost inventory training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.post("/ml/train/inventory/lstm", response_model=GenericResponse)
def train_inventory_lstm(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    epochs: int = Query(50, ge=1, le=500),
    batch_size: int = Query(32, ge=1, le=128),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Train LSTM model for inventory"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=403, detail="Only admins can train models")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    try:
        result = MLForecastingService.train_lstm_inventory(
            db, start_date_dt, end_date_dt, current_user.id, current_user.role,
            epochs=epochs, batch_size=batch_size
        )
        return GenericResponse(message="LSTM inventory training completed", data=result)
    except (ValueError, ImportError) as e:
        logger.error(f"LSTM inventory training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"LSTM inventory training failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.get("/ml/auto-learn/status", response_model=GenericResponse)
def get_auto_learn_status(
    current_user: User = Depends(get_current_active_user),
):
    """Get auto-learning status and statistics"""
    try:
        from ...services.ml_auto_learn import get_auto_learn_status, get_training_statistics
        status = get_auto_learn_status()
        stats = get_training_statistics()
        return GenericResponse(
            data={
                "status": status,
                "statistics": stats
            }
        )
    except Exception as e:
        logger.error(f"Failed to get auto-learn status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get auto-learn status: {str(e)}")


@router.post("/ml/auto-learn/trigger/{metric}", response_model=GenericResponse)
def trigger_auto_learn_manual(
    metric: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger auto-learning for a specific metric
    
    This endpoint allows admins to manually trigger model retraining.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only admins and finance admins can manually trigger auto-learning"
        )
    
    if metric not in ["expense", "revenue", "inventory"]:
        raise HTTPException(status_code=400, detail=f"Invalid metric: {metric}. Must be 'expense', 'revenue', or 'inventory'")
    
    try:
        from ...services.ml_auto_learn import trigger_auto_learn
        result = trigger_auto_learn(metric, db=db, force=True)
        
        if result:
            return GenericResponse(
                message=f"Auto-learning triggered for {metric}",
                data={
                    "status": "success",
                    "metric": metric,
                    "models_trained": len(result.get('trained_models', [])),
                    "best_model": result.get('best_model_type'),
                    "best_rmse": result.get('best_model', {}).get('rmse') if result.get('best_model') else None,
                    "model_saved": result.get('model_saved', False),
                    "details": result
                }
            )
        else:
            return GenericResponse(
                message="Auto-learning skipped",
                data={
                    "status": "skipped",
                    "metric": metric,
                    "message": "Auto-learning conditions not met (not enough data or too soon since last training)"
                }
            )
    except Exception as e:
        logger.error(f"Failed to trigger auto-learn for {metric}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Auto-learning failed: {str(e)}")


@router.get("/ml/models", response_model=GenericResponse)
def list_trained_models(
    metric: Optional[str] = Query(None, description="Filter by metric (expense, revenue, inventory)"),
    current_user: User = Depends(get_current_active_user),
):
    """List all trained ML models"""
    try:
        models = MLForecastingService.get_trained_models(metric=metric)
        
        # Format response
        formatted_models = []
        for key, info in models.items():
            formatted_models.append({
                "model_key": key,
                "metric": info.get('metric'),
                "model_type": info.get('model_type'),
                "model_path": info.get('model_path'),
                "exists": info.get('exists', False),
                "trained_at": info.get('trained_at'),
                "metrics": info.get('metrics', {}),
                "source": info.get('source', 'unknown')
            })
        
        return GenericResponse(
            data={
                "total_models": len(formatted_models),
                "models": formatted_models
            }
        )
    except Exception as e:
        logger.error(f"Failed to list trained models: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list models: {str(e)}")


@router.get("/ml/scheduler/status", response_model=GenericResponse)
def get_scheduler_status(
    current_user: User = Depends(get_current_active_user),
):
    """Get ML training scheduler status and scheduled jobs"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only admins and finance admins can view scheduler status"
        )
    
    try:
        from ...services.ml_scheduler import get_scheduler_status
        return GenericResponse(data=get_scheduler_status())
    except Exception as e:
        logger.error(f"Failed to get scheduler status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get scheduler status: {str(e)}")


@router.post("/ml/forecast/with-advice", response_model=GenericResponse)
def generate_forecast_with_advice(
    metric: str = Query(..., description="Metric to forecast (expense, revenue, inventory)"),
    model_type: str = Query(..., description="Model type (arima, sarima, prophet, xgboost, lstm, linear_regression)"),
    periods: int = Query(12, ge=1, le=60, description="Number of periods to forecast"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate forecast with AI-powered advice and recommendations
    
    This endpoint uses the enhanced ML forecasting service to generate forecasts
    along with actionable advice, alerts, and trend analysis.
    """
    if metric not in ["expense", "revenue", "inventory"]:
        raise HTTPException(status_code=400, detail="Invalid metric. Must be 'expense', 'revenue', or 'inventory'")
    
    if model_type not in ["arima", "sarima", "prophet", "xgboost", "lstm", "linear_regression"]:
        raise HTTPException(status_code=400, detail="Invalid model type")
    
    try:
        # Calculate forecast dates
        end_date = datetime.now(timezone.utc)
        start_date = end_date + timedelta(days=1)
        forecast_end = start_date + timedelta(days=periods * 30)  # Assuming monthly periods
        
        # Check if generate_forecast_with_advice method exists
        if hasattr(MLForecastingService, 'generate_forecast_with_advice'):
            result = MLForecastingService.generate_forecast_with_advice(
                metric=metric,
                model_type=model_type,
                periods=periods,
                db=db,
                user_role=current_user.role,
                user_id=current_user.id if current_user.role != UserRole.ADMIN else None
            )
        else:
            # Fallback to standard forecast
            forecast_data = MLForecastingService.generate_forecast_from_trained(
                metric=metric,
                model_type=model_type,
                periods=periods,
                db=db,
                user_role=current_user.role,
                user_id=current_user.id if current_user.role != UserRole.ADMIN else None
            )
            result = {
                "forecast": forecast_data,
                "advice": [],
                "alerts": [],
                "summary": "Forecast generated successfully",
                "trend_analysis": {}
            }
        
        return GenericResponse(
            message="Forecast with advice generated successfully",
            data={
                "status": "success",
                "metric": metric,
                "model_type": model_type,
                "periods": periods,
                "forecast": result.get("forecast", []),
                "advice": result.get("advice", []),
                "alerts": result.get("alerts", []),
                "summary": result.get("summary", ""),
                "trend_analysis": result.get("trend_analysis", {})
            }
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=f"Trained model not found. Please train a model first: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to generate forecast with advice: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")


@router.post("/ml/train/custom", response_model=GenericResponse)
def train_from_custom_data(
    training_request: CustomTrainingRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Train an AI/ML model from user-provided custom data
    
    Users can provide any time series data (dates and values) to train a model.
    The data can be for any metric they want to forecast (sales, custom metrics, etc.).
    """
    # Check permissions - allow managers, finance admins, and admins
    if current_user.role not in [
        UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only managers, finance admins, and admins can train custom models"
        )
    
    try:
        # Convert data points to the format expected by the service
        data_points = [{"date": point.date, "value": point.value} for point in training_request.data]
        
        # Parse optional parameters
        arima_order = None
        if training_request.arima_order:
            try:
                parts = [int(x.strip()) for x in training_request.arima_order.split(',')]
                if len(parts) == 3:
                    arima_order = tuple(parts)
            except:
                raise HTTPException(status_code=400, detail="Invalid ARIMA order format. Use 'p,d,q' (e.g., '1,1,1')")
        
        sarima_order = None
        if training_request.sarima_order:
            try:
                parts = [int(x.strip()) for x in training_request.sarima_order.split(',')]
                if len(parts) == 3:
                    sarima_order = tuple(parts)
            except:
                raise HTTPException(status_code=400, detail="Invalid SARIMA order format. Use 'p,d,q' (e.g., '1,1,1')")
        
        sarima_seasonal_order = None
        if training_request.sarima_seasonal_order:
            try:
                parts = [int(x.strip()) for x in training_request.sarima_seasonal_order.split(',')]
                if len(parts) == 4:
                    sarima_seasonal_order = tuple(parts)
            except:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid SARIMA seasonal order format. Use 'P,D,Q,s' (e.g., '1,1,1,12')"
                )
        
        # Train the model
        result = MLForecastingService.train_from_custom_data(
            data_points=data_points,
            model_type=training_request.model_type,
            metric_name=training_request.metric_name,
            period=training_request.period,
            user_id=current_user.id,
            arima_order=arima_order,
            sarima_order=sarima_order,
            sarima_seasonal_order=sarima_seasonal_order,
            epochs=training_request.epochs or 50,
            batch_size=training_request.batch_size or 32
        )
        
        return GenericResponse(message="Custom training completed", data=result)
        
    except ImportError as e:
        logger.error(f"Custom training failed (import error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        logger.error(f"Custom training failed (validation error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Custom training failed: {str(e)}", exc_info=True)
        error_msg = str(e)
        # Provide helpful message for common Prophet issues
        if 'stan' in error_msg.lower() or 'cmdstan' in error_msg.lower():
            error_msg = "Prophet stan_backend error. This is a known issue on Windows/Python 3.12. Try using alternative models (ARIMA, XGBoost, LSTM) instead."
        raise HTTPException(status_code=500, detail=f"Training failed: {error_msg}")


@router.post("/ml/forecast/custom", response_model=GenericResponse)
def train_and_forecast_from_custom_data(
    forecast_request: CustomForecastRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Train a model from user-provided data and generate a forecast immediately
    
    This endpoint allows users to input any time series data, train a model on it,
    and get a forecast in a single request. Perfect for quick forecasting from custom data.
    
    The model can optionally be saved for future use.
    """
    # Check permissions - allow managers, finance admins, and admins
    if current_user.role not in [
        UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only managers, finance admins, and admins can create custom forecasts"
        )
    
    try:
        # Parse dates
        try:
            forecast_start = datetime.fromisoformat(forecast_request.forecast_start_date.replace('Z', '+00:00'))
            if forecast_start.tzinfo is None:
                forecast_start = forecast_start.replace(tzinfo=timezone.utc)
            forecast_end = datetime.fromisoformat(forecast_request.forecast_end_date.replace('Z', '+00:00'))
            if forecast_end.tzinfo is None:
                forecast_end = forecast_end.replace(tzinfo=timezone.utc)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)")
        
        if forecast_end <= forecast_start:
            raise HTTPException(status_code=400, detail="Forecast end date must be after start date")
        
        # Convert data points to the format expected by the service
        data_points = [{"date": point.date, "value": point.value} for point in forecast_request.training_data]
        
        # Parse optional parameters
        arima_order = None
        if forecast_request.arima_order:
            try:
                parts = [int(x.strip()) for x in forecast_request.arima_order.split(',')]
                if len(parts) == 3:
                    arima_order = tuple(parts)
            except:
                raise HTTPException(status_code=400, detail="Invalid ARIMA order format. Use 'p,d,q' (e.g., '1,1,1')")
        
        sarima_order = None
        if forecast_request.sarima_order:
            try:
                parts = [int(x.strip()) for x in forecast_request.sarima_order.split(',')]
                if len(parts) == 3:
                    sarima_order = tuple(parts)
            except:
                raise HTTPException(status_code=400, detail="Invalid SARIMA order format. Use 'p,d,q' (e.g., '1,1,1')")
        
        sarima_seasonal_order = None
        if forecast_request.sarima_seasonal_order:
            try:
                parts = [int(x.strip()) for x in forecast_request.sarima_seasonal_order.split(',')]
                if len(parts) == 4:
                    sarima_seasonal_order = tuple(parts)
            except:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid SARIMA seasonal order format. Use 'P,D,Q,s' (e.g., '1,1,1,12')"
                )
        
        # Train and forecast
        result = MLForecastingService.train_and_forecast_from_custom_data(
            data_points=data_points,
            model_type=forecast_request.model_type,
            metric_name=forecast_request.metric_name,
            forecast_start_date=forecast_start,
            forecast_end_date=forecast_end,
            period=forecast_request.period,
            user_id=current_user.id if forecast_request.save_model else None,
            save_model=forecast_request.save_model,
            arima_order=arima_order,
            sarima_order=sarima_order,
            sarima_seasonal_order=sarima_seasonal_order,
            epochs=forecast_request.epochs or 50,
            batch_size=forecast_request.batch_size or 32
        )
        
        return GenericResponse(
            message="Custom forecast generated successfully",
            data={
                "status": "success",
                "message": f"Forecast generated successfully from {len(data_points)} data points",
                "training_metrics": result.get("training_result", {}),
                "forecast": result.get("forecast_data", []),
                "forecast_summary": {
                    "total_periods": len(result.get("forecast_data", [])),
                    "total_forecasted_value": sum(point.get("forecasted_value", 0) for point in result.get("forecast_data", [])),
                    "average_per_period": sum(point.get("forecasted_value", 0) for point in result.get("forecast_data", [])) / len(result.get("forecast_data", [])) if result.get("forecast_data") else 0
                },
                "model_saved": forecast_request.save_model,
                "model_path": result.get("model_path")
            }
        )
        
    except ImportError as e:
        logger.error(f"Custom forecast failed (import error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        logger.error(f"Custom forecast failed (validation error): {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Custom forecast failed: {str(e)}", exc_info=True)
        error_msg = str(e)
        # Provide helpful message for common Prophet issues
        if 'stan' in error_msg.lower() or 'cmdstan' in error_msg.lower():
            error_msg = "Prophet stan_backend error. This is a known issue on Windows/Python 3.12. Try using alternative models (ARIMA, XGBoost, LSTM, Linear Regression) instead."
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {error_msg}")


@router.delete("/forecasts/{forecast_id}", response_model=GenericResponse, status_code=status.HTTP_200_OK)
def delete_forecast(
    forecast_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a forecast"""
    forecast_obj = forecast.get(db, forecast_id)
    if not forecast_obj:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if forecast_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    forecast.delete(db, forecast_id)
    return GenericResponse(message="Forecast deleted successfully")


class DeleteForecastRequest(BaseModel):
    password: str

@router.post("/forecasts/{forecast_id}/delete")
def delete_forecast_with_password(
    forecast_id: int,
    delete_request: DeleteForecastRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a forecast - requires password verification"""
    # Reload current user from database to ensure we have the password hash
    db_user_for_auth = db.query(User).filter(User.id == current_user.id).first()
    if not db_user_for_auth:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    # Validate that password hash exists
    if not db_user_for_auth.hashed_password:
        raise HTTPException(
            status_code=500,
            detail="User password hash not found. Please contact administrator."
        )
    
    # Verify password before deletion
    if not delete_request.password or not delete_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to delete a forecast."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this forecast."
        )
    
    # Check forecast exists
    forecast_obj = forecast.get(db, forecast_id)
    if not forecast_obj:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if forecast_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete the forecast
    forecast.delete(db, forecast_id)
    return GenericResponse(message="Forecast deleted successfully")


# ============================================================================
# VARIANCE ANALYSIS
# ============================================================================

@router.post("/budgets/{budget_id}/variance", response_model=GenericResponse[BudgetVarianceOut], status_code=status.HTTP_201_CREATED)
def calculate_variance(
    budget_id: int,
    period_start: str = Query(..., description="Period start date (YYYY-MM-DD)"),
    period_end: str = Query(..., description="Period end date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Calculate variance between budget and actuals for a period"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    try:
        period_start_dt = datetime.fromisoformat(period_start)
        period_end_dt = datetime.fromisoformat(period_end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    variance = VarianceAnalysisService.calculate_variance(
        db, budget_id, period_start_dt, period_end_dt,
        current_user.id, current_user.role
    )
    return GenericResponse(message="Variance calculated successfully", data=variance)


@router.get("/budgets/{budget_id}/variance", response_model=GenericResponse[List[BudgetVarianceOut]])
def get_variance_history(
    budget_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get variance history for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    variances = budget_variance.get_by_budget(db, budget_id, skip, limit)
    return GenericResponse(data=variances)


@router.get("/budgets/{budget_id}/variance/summary", response_model=GenericResponse)
def get_variance_summary(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get variance summary for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    summary = VarianceAnalysisService.get_variance_summary(db, budget_id)
    return GenericResponse(data=summary)

