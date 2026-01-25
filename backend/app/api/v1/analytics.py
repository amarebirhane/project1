"""
Advanced Analytics API
Provides real-time insights, KPIs, trends, and customizable reporting
"""

from fastapi import APIRouter, Depends, HTTPException, Query # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import Optional
from datetime import datetime, timedelta, timezone

from ...core.database import get_db
from ...api.deps import get_current_active_user
from ...models.user import User, UserRole
from ...services.analytics import analytics
from ...crud.inventory import inventory as inventory_crud
from ...crud.sale import sale as sale_crud
from ...crud.user import user as user_crud
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/kpis")
def get_advanced_kpis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    period: str = Query("month", regex="^(week|month|quarter|year|custom)$"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get advanced KPI metrics with comparisons and growth rates
    Supports week, month, quarter, year, or custom date ranges
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions to view analytics")

    # Calculate date range
    end_date_dt = datetime.now(timezone.utc)
    
    if period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="Custom period requires start_date and end_date")
        try:
            start_date_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            end_date_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    elif period == "week":
        start_date_dt = end_date_dt - timedelta(days=7)
    elif period == "month":
        start_date_dt = end_date_dt - timedelta(days=30)
    elif period == "quarter":
        start_date_dt = end_date_dt - timedelta(days=90)
    elif period == "year":
        start_date_dt = end_date_dt - timedelta(days=365)
    else:
        start_date_dt = end_date_dt - timedelta(days=30)

    kpis = analytics.calculate_advanced_kpis(
        db, start_date_dt, end_date_dt, 
        user_id=current_user.id, 
        user_role=current_user.role,
        category=category
    )

    return kpis


@router.get("/trends")
def get_trend_analysis(
    metric: str = Query("profit", regex="^(revenue|expenses|profit)$"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    period: str = Query("month", regex="^(week|month|quarter|year|custom)$"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get trend analysis with predictions
    Analyzes historical data and provides trend direction and predictions
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions to view analytics")

    # Calculate date range
    end_date_dt = datetime.now(timezone.utc)
    
    if period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="Custom period requires start_date and end_date")
        try:
            start_date_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            end_date_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    elif period == "week":
        start_date_dt = end_date_dt - timedelta(days=14)  # 2 weeks for trend
    elif period == "month":
        start_date_dt = end_date_dt - timedelta(days=60)  # 2 months
    elif period == "quarter":
        start_date_dt = end_date_dt - timedelta(days=180)  # 2 quarters
    elif period == "year":
        start_date_dt = end_date_dt - timedelta(days=730)  # 2 years
    else:
        start_date_dt = end_date_dt - timedelta(days=60)

    trend_data = analytics.get_trend_analysis(
        db, start_date_dt, end_date_dt, metric,
        user_id=current_user.id,
        user_role=current_user.role,
        category=category
    )

    return trend_data


@router.get("/time-series")
def get_time_series_data(
    interval: str = Query("day", regex="^(day|week|month|quarter|year)$"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    period: str = Query("month", regex="^(week|month|quarter|year|custom)$"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get time-series data for revenue, expenses, and profit
    Perfect for chart visualizations
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions to view analytics")

    # Calculate date range
    end_date_dt = datetime.now(timezone.utc)
    
    if period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="Custom period requires start_date and end_date")
        try:
            start_date_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            end_date_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    elif period == "week":
        start_date_dt = end_date_dt - timedelta(days=7)
    elif period == "month":
        start_date_dt = end_date_dt - timedelta(days=30)
    elif period == "quarter":
        start_date_dt = end_date_dt - timedelta(days=90)
    elif period == "year":
        start_date_dt = end_date_dt - timedelta(days=365)
    else:
        start_date_dt = end_date_dt - timedelta(days=30)

    time_series = analytics.get_time_series_data(
        db, start_date_dt, end_date_dt, interval,
        user_id=current_user.id,
        user_role=current_user.role,
        category=category
    )

    return time_series


@router.get("/category-breakdown")
def get_category_breakdown(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    period: str = Query("month", regex="^(week|month|quarter|year|custom)$"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed category breakdown for revenue and expenses
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions to view analytics")

    # Calculate date range
    end_date_dt = datetime.now(timezone.utc)
    
    if period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="Custom period requires start_date and end_date")
        try:
            start_date_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            end_date_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    elif period == "week":
        start_date_dt = end_date_dt - timedelta(days=7)
    elif period == "month":
        start_date_dt = end_date_dt - timedelta(days=30)
    elif period == "quarter":
        start_date_dt = end_date_dt - timedelta(days=90)
    elif period == "year":
        start_date_dt = end_date_dt - timedelta(days=365)
    else:
        start_date_dt = end_date_dt - timedelta(days=30)

    breakdown = analytics.get_category_breakdown(
        db, start_date_dt, end_date_dt,
        user_id=current_user.id,
        user_role=current_user.role
    )

    return breakdown


@router.get("/overview")
def get_analytics_overview(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    period: str = Query("month", regex="^(week|month|quarter|year|custom)$"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive analytics overview
    Includes KPIs, trends, time-series, and category breakdown
    """
    try:
        # Check permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            raise HTTPException(status_code=403, detail="Not enough permissions to view analytics")

        # Calculate date range
        end_date_dt = datetime.now(timezone.utc)
        
        if period == "custom":
            if not start_date or not end_date:
                raise HTTPException(status_code=400, detail="Custom period requires start_date and end_date")
            try:
                start_date_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                end_date_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        elif period == "week":
            start_date_dt = end_date_dt - timedelta(days=7)
        elif period == "month":
            start_date_dt = end_date_dt - timedelta(days=30)
        elif period == "quarter":
            start_date_dt = end_date_dt - timedelta(days=90)
        elif period == "year":
            start_date_dt = end_date_dt - timedelta(days=365)
        else:
            start_date_dt = end_date_dt - timedelta(days=30)

        # Get all analytics data
        kpis = analytics.calculate_advanced_kpis(
            db, start_date_dt, end_date_dt,
            user_id=current_user.id,
            user_role=current_user.role,
            category=category
        )

        # Determine interval based on period
        # Use monthly intervals for year and quarter periods for better visualization
        if period == "year" or period == "quarter":
            interval = "month"
        elif period == "month":
            interval = "day"  # Frontend will filter to show every 5th day
        elif period == "week":
            interval = "day"
        elif period == "custom":
            # For custom periods, determine interval based on date range
            days_diff = (end_date_dt - start_date_dt).days
            if days_diff > 180:  # More than 6 months, use monthly
                interval = "month"
            elif days_diff > 30:  # More than 1 month, use weekly
                interval = "week"
            else:
                interval = "day"
        else:
            interval = "day"
        
        time_series = analytics.get_time_series_data(
            db, start_date_dt, end_date_dt, interval,
            user_id=current_user.id,
            user_role=current_user.role,
            category=category
        )

        category_breakdown = analytics.get_category_breakdown(
            db, start_date_dt, end_date_dt,
            user_id=current_user.id,
            user_role=current_user.role
        )

        profit_trend = analytics.get_trend_analysis(
            db, start_date_dt, end_date_dt, "profit",
            user_id=current_user.id,
            user_role=current_user.role,
            category=category
        )

        # Get inventory summary (if user has permission)
        inventory_summary = None
        try:
            if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
                if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
                    inventory_summary = inventory_crud.get_total_value(db)
                else:
                    # Finance Admin and Manager see only their team's inventory
                    subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
                    subordinate_ids.append(current_user.id)
                    inventory_summary = inventory_crud.get_total_value_by_users(db, subordinate_ids)
        except Exception as e:
            logger.warning(f"Error fetching inventory summary: {str(e)}")
            inventory_summary = None

        # Get sales summary (if user has permission)
        sales_summary = None
        try:
            if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT]:
                # Filter by user role for Finance Admin/Manager
                user_ids = None
                if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
                    subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
                    subordinate_ids.append(current_user.id)
                    user_ids = subordinate_ids
                
                sales_summary = sale_crud.get_sales_summary(
                    db, 
                    start_date=start_date_dt, 
                    end_date=end_date_dt,
                    user_ids=user_ids
                )
        except Exception as e:
            logger.warning(f"Error fetching sales summary: {str(e)}")
            sales_summary = None

        return {
            "period": {
                "start_date": start_date_dt.isoformat(),
                "end_date": end_date_dt.isoformat(),
                "period_type": period
            },
            "kpis": kpis,
            "time_series": time_series,
            "category_breakdown": category_breakdown,
            "trends": {
                "profit": profit_trend
            },
            "inventory": inventory_summary,
            "sales": sales_summary
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_analytics_overview for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load analytics overview: {str(e)}"
        )

