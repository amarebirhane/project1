# app/crud/budget.py
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import and_, or_, func # type: ignore[import-untyped]
from typing import List, Optional
from datetime import datetime, timezone

from ..models.budget import Budget, BudgetItem, BudgetScenario, Forecast, BudgetVariance
from ..models.user import UserRole


class BudgetCRUD:
    """CRUD operations for Budget model"""
    
    @staticmethod
    def create(db: Session, budget_data: dict) -> Budget:
        """Create a new budget"""
        budget = Budget(**budget_data)
        db.add(budget)
        db.commit()
        db.refresh(budget)
        return budget
    
    @staticmethod
    def get(db: Session, budget_id: int) -> Optional[Budget]:
        """Get a budget by ID"""
        return db.query(Budget).filter(Budget.id == budget_id).first()
    
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        status: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[Budget]:
        """Get all budgets with optional filters"""
        query = db.query(Budget)
        
        # Role-based filtering
        if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            # Admins see all budgets
            pass
        elif user_role == UserRole.MANAGER:
            # Managers see their own and their team's budgets
            query = query.filter(Budget.created_by_id == user_id)
        else:
            # Regular users see only their own budgets
            query = query.filter(Budget.created_by_id == user_id)
        
        if status:
            query = query.filter(Budget.status == status)
        
        if department:
            query = query.filter(Budget.department == department)
        
        return query.order_by(Budget.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, budget_id: int, update_data: dict) -> Optional[Budget]:
        """Update a budget"""
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            return None
        
        for key, value in update_data.items():
            setattr(budget, key, value)
        
        budget.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(budget)
        return budget
    
    @staticmethod
    def delete(db: Session, budget_id: int) -> bool:
        """Delete a budget"""
        budget = db.query(Budget).filter(Budget.id == budget_id).first()
        if not budget:
            return False
        
        db.delete(budget)
        db.commit()
        return True
    
    @staticmethod
    def calculate_totals(db: Session, budget_id: int) -> dict:
        """Calculate total revenue, expenses, and profit for a budget"""
        items = db.query(BudgetItem).filter(BudgetItem.budget_id == budget_id).all()
        
        total_revenue = sum(item.amount for item in items if item.type.value == "revenue")
        total_expenses = sum(item.amount for item in items if item.type.value == "expense")
        total_profit = total_revenue - total_expenses
        
        return {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "total_profit": total_profit
        }


class BudgetItemCRUD:
    """CRUD operations for BudgetItem model"""
    
    @staticmethod
    def create(db: Session, item_data: dict) -> BudgetItem:
        """Create a new budget item"""
        item = BudgetItem(**item_data)
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    
    @staticmethod
    def get(db: Session, item_id: int) -> Optional[BudgetItem]:
        """Get a budget item by ID"""
        return db.query(BudgetItem).filter(BudgetItem.id == item_id).first()
    
    @staticmethod
    def get_by_budget(db: Session, budget_id: int) -> List[BudgetItem]:
        """Get all items for a budget"""
        return db.query(BudgetItem).filter(BudgetItem.budget_id == budget_id).all()
    
    @staticmethod
    def update(db: Session, item_id: int, update_data: dict) -> Optional[BudgetItem]:
        """Update a budget item"""
        item = db.query(BudgetItem).filter(BudgetItem.id == item_id).first()
        if not item:
            return None
        
        for key, value in update_data.items():
            setattr(item, key, value)
        
        item.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(item)
        return item
    
    @staticmethod
    def delete(db: Session, item_id: int) -> bool:
        """Delete a budget item"""
        item = db.query(BudgetItem).filter(BudgetItem.id == item_id).first()
        if not item:
            return False
        
        db.delete(item)
        db.commit()
        return True


class BudgetScenarioCRUD:
    """CRUD operations for BudgetScenario model"""
    
    @staticmethod
    def create(db: Session, scenario_data: dict) -> BudgetScenario:
        """Create a new budget scenario"""
        scenario = BudgetScenario(**scenario_data)
        db.add(scenario)
        db.commit()
        db.refresh(scenario)
        return scenario
    
    @staticmethod
    def get(db: Session, scenario_id: int) -> Optional[BudgetScenario]:
        """Get a scenario by ID"""
        return db.query(BudgetScenario).filter(BudgetScenario.id == scenario_id).first()
    
    @staticmethod
    def get_by_budget(db: Session, budget_id: int) -> List[BudgetScenario]:
        """Get all scenarios for a budget"""
        return db.query(BudgetScenario).filter(BudgetScenario.budget_id == budget_id).all()
    
    @staticmethod
    def update(db: Session, scenario_id: int, update_data: dict) -> Optional[BudgetScenario]:
        """Update a scenario"""
        scenario = db.query(BudgetScenario).filter(BudgetScenario.id == scenario_id).first()
        if not scenario:
            return None
        
        for key, value in update_data.items():
            setattr(scenario, key, value)
        
        scenario.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(scenario)
        return scenario
    
    @staticmethod
    def delete(db: Session, scenario_id: int) -> bool:
        """Delete a scenario"""
        scenario = db.query(BudgetScenario).filter(BudgetScenario.id == scenario_id).first()
        if not scenario:
            return False
        
        db.delete(scenario)
        db.commit()
        return True


class ForecastCRUD:
    """CRUD operations for Forecast model"""
    
    @staticmethod
    def create(db: Session, forecast_data: dict) -> Forecast:
        """Create a new forecast"""
        forecast = Forecast(**forecast_data)
        db.add(forecast)
        db.commit()
        db.refresh(forecast)
        return forecast
    
    @staticmethod
    def get(db: Session, forecast_id: int) -> Optional[Forecast]:
        """Get a forecast by ID"""
        return db.query(Forecast).filter(Forecast.id == forecast_id).first()
    
    @staticmethod
    def get_all(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None
    ) -> List[Forecast]:
        """Get all forecasts with optional filters"""
        query = db.query(Forecast)
        
        # Role-based filtering
        if user_role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            query = query.filter(Forecast.created_by_id == user_id)
        
        return query.order_by(Forecast.created_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update(db: Session, forecast_id: int, update_data: dict) -> Optional[Forecast]:
        """Update a forecast"""
        forecast = db.query(Forecast).filter(Forecast.id == forecast_id).first()
        if not forecast:
            return None
        
        for key, value in update_data.items():
            setattr(forecast, key, value)
        
        forecast.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(forecast)
        return forecast
    
    @staticmethod
    def delete(db: Session, forecast_id: int) -> bool:
        """Delete a forecast"""
        forecast = db.query(Forecast).filter(Forecast.id == forecast_id).first()
        if not forecast:
            return False
        
        db.delete(forecast)
        db.commit()
        return True


class BudgetVarianceCRUD:
    """CRUD operations for BudgetVariance model"""
    
    @staticmethod
    def create(db: Session, variance_data: dict) -> BudgetVariance:
        """Create a new budget variance record"""
        variance = BudgetVariance(**variance_data)
        db.add(variance)
        db.commit()
        db.refresh(variance)
        return variance
    
    @staticmethod
    def get_by_budget(
        db: Session,
        budget_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[BudgetVariance]:
        """Get all variance records for a budget"""
        return (
            db.query(BudgetVariance)
            .filter(BudgetVariance.budget_id == budget_id)
            .order_by(BudgetVariance.period_start.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    @staticmethod
    def get_latest(db: Session, budget_id: int) -> Optional[BudgetVariance]:
        """Get the latest variance record for a budget"""
        return (
            db.query(BudgetVariance)
            .filter(BudgetVariance.budget_id == budget_id)
            .order_by(BudgetVariance.calculated_at.desc())
            .first()
        )


# Create instances
budget = BudgetCRUD()
budget_item = BudgetItemCRUD()
budget_scenario = BudgetScenarioCRUD()
forecast = ForecastCRUD()
budget_variance = BudgetVarianceCRUD()

