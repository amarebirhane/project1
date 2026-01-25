"""
Advanced Analytics Service
Provides real-time insights, KPIs, trends, and predictive analysis
"""

from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import func, and_, extract # type: ignore[import-untyped]
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from collections import defaultdict
import statistics

from ..crud.revenue import revenue as revenue_crud
from ..crud.expense import expense as expense_crud
from ..crud.user import user as user_crud
from ..models.user import UserRole


class AnalyticsService:
    """Advanced analytics and KPI calculations"""

    @staticmethod
    def _normalize_date_for_comparison(date: datetime, reference_date: datetime) -> datetime:
        """Normalize a date to match the timezone awareness of a reference date"""
        if reference_date.tzinfo is not None and date.tzinfo is None:
            # If reference is timezone-aware but date is naive, assume UTC
            return date.replace(tzinfo=timezone.utc)
        elif reference_date.tzinfo is None and date.tzinfo is not None:
            # If reference is naive but date is aware, make date naive
            return date.replace(tzinfo=None)
        return date

    @staticmethod
    def get_time_series_data(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        interval: str = "day",
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        category: Optional[str] = None
    ) -> Dict[str, List]:
        """
        Get time-series data for revenue and expenses
        interval: 'day', 'week', 'month', 'quarter', 'year'
        """
        revenue_data = []
        expense_data = []
        profit_data = []
        labels = []

        # Determine date grouping
        current = start_date
        date_map = defaultdict(lambda: {"revenue": 0, "expense": 0})

        # Get all revenue entries in range - ONLY APPROVED entries
        if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            all_revenue = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            # Filter to only include approved entries
            all_revenue = [r for r in all_revenue if r.is_approved == True]
            all_expenses = [e for e in all_expenses if e.is_approved == True]
        elif user_role == UserRole.MANAGER or user_role == UserRole.FINANCE_ADMIN:
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
            all_revenue_all = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            all_expenses_all = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            # Filter by subordinate AND approved status
            all_revenue = [r for r in all_revenue_all if r.created_by_id in subordinate_ids and r.is_approved == True]
            all_expenses = [e for e in all_expenses_all if e.created_by_id in subordinate_ids and e.is_approved == True]
        else:
            all_revenue = revenue_crud.get_by_user(db, user_id, 0, 10000)
            all_expenses = expense_crud.get_by_user(db, user_id, 0, 10000)
            # Filter by date range AND approved status
            # Normalize dates for comparison to handle timezone-aware/naive mismatches
            all_revenue = [
                r for r in all_revenue 
                if start_date <= AnalyticsService._normalize_date_for_comparison(r.date, start_date) <= end_date 
                and r.is_approved == True
            ]
            all_expenses = [
                e for e in all_expenses 
                if start_date <= AnalyticsService._normalize_date_for_comparison(e.date, start_date) <= end_date 
                and e.is_approved == True
            ]

        # Group by interval - ONLY from approved entries
        if category:
            all_revenue = [r for r in all_revenue if (r.category.value if hasattr(r.category, 'value') else str(r.category)) == category]
            all_expenses = [e for e in all_expenses if (e.category.value if hasattr(e.category, 'value') else str(e.category)) == category]

        for entry in all_revenue:
            date_key = AnalyticsService._get_interval_key(entry.date, interval)
            date_map[date_key]["revenue"] += float(entry.amount)

        for entry in all_expenses:
            date_key = AnalyticsService._get_interval_key(entry.date, interval)
            date_map[date_key]["expense"] += float(entry.amount)

        # Generate labels and data
        current = start_date
        while current <= end_date:
            date_key = AnalyticsService._get_interval_key(current, interval)
            labels.append(AnalyticsService._format_label(current, interval))
            
            revenue_val = date_map.get(date_key, {}).get("revenue", 0)
            expense_val = date_map.get(date_key, {}).get("expense", 0)
            profit_val = revenue_val - expense_val

            revenue_data.append(revenue_val)
            expense_data.append(expense_val)
            profit_data.append(profit_val)

            # Move to next interval
            current = AnalyticsService._next_interval(current, interval)

        return {
            "labels": labels,
            "revenue": revenue_data,
            "expenses": expense_data,
            "profit": profit_data,
            "interval": interval
        }

    @staticmethod
    def _get_interval_key(date: datetime, interval: str) -> str:
        """Get grouping key for date based on interval"""
        if interval == "day":
            return date.strftime("%Y-%m-%d")
        elif interval == "week":
            year, week, _ = date.isocalendar()
            return f"{year}-W{week:02d}"
        elif interval == "month":
            return date.strftime("%Y-%m")
        elif interval == "quarter":
            quarter = (date.month - 1) // 3 + 1
            return f"{date.year}-Q{quarter}"
        elif interval == "year":
            return str(date.year)
        return date.strftime("%Y-%m-%d")

    @staticmethod
    def _format_label(date: datetime, interval: str) -> str:
        """Format date label for display"""
        if interval == "day":
            return date.strftime("%b %d")
        elif interval == "week":
            year, week, _ = date.isocalendar()
            return f"Week {week}, {year}"
        elif interval == "month":
            return date.strftime("%b %Y")
        elif interval == "quarter":
            quarter = (date.month - 1) // 3 + 1
            return f"Q{quarter} {date.year}"
        elif interval == "year":
            return str(date.year)
        return date.strftime("%Y-%m-%d")

    @staticmethod
    def _next_interval(date: datetime, interval: str) -> datetime:
        """Get next interval date - preserves timezone awareness"""
        if interval == "day":
            return date + timedelta(days=1)
        elif interval == "week":
            return date + timedelta(weeks=1)
        elif interval == "month":
            if date.month == 12:
                # Use replace to preserve timezone awareness automatically
                return date.replace(year=date.year + 1, month=1)
            else:
                return date.replace(month=date.month + 1)
        elif interval == "quarter":
            return date + timedelta(days=90)
        elif interval == "year":
            # Use replace to preserve timezone awareness automatically
            return date.replace(year=date.year + 1)
        return date + timedelta(days=1)

    @staticmethod
    def calculate_advanced_kpis(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        category: Optional[str] = None
    ) -> Dict:
        """Calculate advanced KPIs and metrics"""
        # Previous period for comparison
        period_days = (end_date - start_date).days
        prev_end_date = start_date
        prev_start_date = start_date - timedelta(days=period_days)

        # Get current period data
        if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            current_revenue = revenue_crud.get_total_by_period(db, start_date, end_date)
            current_expenses = expense_crud.get_total_by_period(db, start_date, end_date)
            prev_revenue = revenue_crud.get_total_by_period(db, prev_start_date, prev_end_date)
            prev_expenses = expense_crud.get_total_by_period(db, prev_start_date, prev_end_date)
        elif user_role == UserRole.MANAGER or user_role == UserRole.FINANCE_ADMIN:
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
            all_revenue_curr = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            all_expenses_curr = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            all_revenue_prev = revenue_crud.get_by_date_range(db, prev_start_date, prev_end_date, 0, 10000)
            all_expenses_prev = expense_crud.get_by_date_range(db, prev_start_date, prev_end_date, 0, 10000)
            
            # Filter by subordinate AND approved status
            current_revenue = sum(float(r.amount) for r in all_revenue_curr if r.created_by_id in subordinate_ids and r.is_approved == True)
            current_expenses = sum(float(e.amount) for e in all_expenses_curr if e.created_by_id in subordinate_ids and e.is_approved == True)
            prev_revenue = sum(float(r.amount) for r in all_revenue_prev if r.created_by_id in subordinate_ids and r.is_approved == True)
            prev_expenses = sum(float(e.amount) for e in all_expenses_prev if e.created_by_id in subordinate_ids and e.is_approved == True)
        else:
            all_revenue_curr = revenue_crud.get_by_user(db, user_id, 0, 10000)
            all_expenses_curr = expense_crud.get_by_user(db, user_id, 0, 10000)
            all_revenue_prev = revenue_crud.get_by_user(db, user_id, 0, 10000)
            all_expenses_prev = expense_crud.get_by_user(db, user_id, 0, 10000)
            
            # Filter by date range AND approved status
            current_revenue = sum(
                float(r.amount) for r in all_revenue_curr 
                if start_date <= AnalyticsService._normalize_date_for_comparison(r.date, start_date) <= end_date 
                and r.is_approved == True
                and (not category or (r.category.value if hasattr(r.category, 'value') else str(r.category)) == category)
            )
            current_expenses = sum(
                float(e.amount) for e in all_expenses_curr 
                if start_date <= AnalyticsService._normalize_date_for_comparison(e.date, start_date) <= end_date 
                and e.is_approved == True
                and (not category or (e.category.value if hasattr(e.category, 'value') else str(e.category)) == category)
            )
            prev_revenue = sum(
                float(r.amount) for r in all_revenue_prev 
                if prev_start_date <= AnalyticsService._normalize_date_for_comparison(r.date, prev_start_date) <= prev_end_date 
                and r.is_approved == True
                and (not category or (r.category.value if hasattr(r.category, 'value') else str(r.category)) == category)
            )
            prev_expenses = sum(
                float(e.amount) for e in all_expenses_prev 
                if prev_start_date <= AnalyticsService._normalize_date_for_comparison(e.date, prev_start_date) <= prev_end_date 
                and e.is_approved == True
                and (not category or (e.category.value if hasattr(e.category, 'value') else str(e.category)) == category)
            )

        current_profit = current_revenue - current_expenses
        prev_profit = prev_revenue - prev_expenses

        # Calculate growth rates
        revenue_growth = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        expense_growth = ((current_expenses - prev_expenses) / prev_expenses * 100) if prev_expenses > 0 else 0
        profit_growth = ((current_profit - prev_profit) / prev_profit * 100) if prev_profit != 0 else 0

        # Calculate profit margin
        profit_margin = (current_profit / current_revenue * 100) if current_revenue > 0 else 0

        # Calculate expense ratio
        expense_ratio = (current_expenses / current_revenue * 100) if current_revenue > 0 else 0

        # Calculate daily averages
        days = period_days if period_days > 0 else 1
        avg_daily_revenue = current_revenue / days
        avg_daily_expenses = current_expenses / days
        avg_daily_profit = current_profit / days

        return {
            "current_period": {
                "revenue": float(current_revenue),
                "expenses": float(current_expenses),
                "profit": float(current_profit),
                "profit_margin": float(profit_margin),
                "expense_ratio": float(expense_ratio),
                "avg_daily_revenue": float(avg_daily_revenue),
                "avg_daily_expenses": float(avg_daily_expenses),
                "avg_daily_profit": float(avg_daily_profit),
            },
            "previous_period": {
                "revenue": float(prev_revenue),
                "expenses": float(prev_expenses),
                "profit": float(prev_profit),
            },
            "growth": {
                "revenue_growth_percent": float(revenue_growth),
                "expense_growth_percent": float(expense_growth),
                "profit_growth_percent": float(profit_growth),
            },
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": period_days
            }
        }

    @staticmethod
    def get_trend_analysis(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        metric: str = "profit",
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        category: Optional[str] = None
    ) -> Dict:
        """Analyze trends and provide predictions"""
        # Get historical data points
        period_days = (end_date - start_date).days
        num_points = min(12, max(4, period_days // 7))  # 4-12 data points

        interval_days = period_days // num_points if num_points > 0 else period_days
        data_points = []

        for i in range(num_points):
            point_start = start_date + timedelta(days=i * interval_days)
            point_end = min(point_start + timedelta(days=interval_days), end_date)

            if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
                revenue = revenue_crud.get_total_by_period(db, point_start, point_end)
                expenses = expense_crud.get_total_by_period(db, point_start, point_end)
            elif user_role == UserRole.MANAGER or user_role == UserRole.FINANCE_ADMIN:
                subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
                all_rev = revenue_crud.get_by_date_range(db, point_start, point_end, 0, 10000)
                all_exp = expense_crud.get_by_date_range(db, point_start, point_end, 0, 10000)
                # Filter by subordinate AND approved status
                revenue = sum(float(r.amount) for r in all_rev if r.created_by_id in subordinate_ids and r.is_approved == True)
                expenses = sum(float(e.amount) for e in all_exp if e.created_by_id in subordinate_ids and e.is_approved == True)
            else:
                all_rev = revenue_crud.get_by_user(db, user_id, 0, 10000)
                all_exp = expense_crud.get_by_user(db, user_id, 0, 10000)
                # Filter by date range AND approved status
                revenue = sum(float(r.amount) for r in all_rev if point_start <= r.date <= point_end and r.is_approved == True and (not category or (r.category.value if hasattr(r.category, 'value') else str(r.category)) == category))
                expenses = sum(float(e.amount) for e in all_exp if point_start <= e.date <= point_end and e.is_approved == True and (not category or (e.category.value if hasattr(e.category, 'value') else str(e.category)) == category))

            if metric == "revenue":
                value = float(revenue)
            elif metric == "expenses":
                value = float(expenses)
            else:  # profit
                value = float(revenue - expenses)

            data_points.append({
                "date": point_end.isoformat(),
                "value": value
            })

        # Calculate trend direction
        if len(data_points) >= 2:
            first_half = [p["value"] for p in data_points[:len(data_points)//2]]
            second_half = [p["value"] for p in data_points[len(data_points)//2:]]
            
            first_avg = statistics.mean(first_half) if first_half else 0
            second_avg = statistics.mean(second_half) if second_half else 0
            
            trend_direction = "increasing" if second_avg > first_avg else "decreasing" if second_avg < first_avg else "stable"
            trend_strength = abs((second_avg - first_avg) / first_avg * 100) if first_avg > 0 else 0
        else:
            trend_direction = "stable"
            trend_strength = 0

        # Simple linear regression for prediction
        predicted_value = None
        if len(data_points) >= 2:
            values = [p["value"] for p in data_points]
            n = len(values)
            x = list(range(n))
            x_avg = statistics.mean(x)
            y_avg = statistics.mean(values)
            
            numerator = sum((x[i] - x_avg) * (values[i] - y_avg) for i in range(n))
            denominator = sum((x[i] - x_avg) ** 2 for i in range(n))
            
            if denominator != 0:
                slope = numerator / denominator
                next_x = n
                predicted_value = y_avg + slope * (next_x - x_avg)

        return {
            "metric": metric,
            "data_points": data_points,
            "trend": {
                "direction": trend_direction,
                "strength": float(trend_strength),
            },
            "prediction": {
                "next_value": float(predicted_value) if predicted_value else None,
                "confidence": "medium" if len(data_points) >= 4 else "low"
            }
        }

    @staticmethod
    def get_category_breakdown(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None
    ) -> Dict:
        """Get detailed category breakdown"""
        if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            revenue_summary = revenue_crud.get_summary_by_category(db, start_date, end_date)
            expense_summary = expense_crud.get_summary_by_category(db, start_date, end_date)
        elif user_role == UserRole.MANAGER or user_role == UserRole.FINANCE_ADMIN:
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
            all_revenue = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            # Filter by subordinate AND approved status
            team_revenue = [r for r in all_revenue if r.created_by_id in subordinate_ids and r.is_approved == True]
            team_expenses = [e for e in all_expenses if e.created_by_id in subordinate_ids and e.is_approved == True]
            
            # Manual category grouping
            revenue_by_cat = defaultdict(lambda: {"total": 0, "count": 0})
            expense_by_cat = defaultdict(lambda: {"total": 0, "count": 0})
            
            for r in team_revenue:
                cat = r.category.value if hasattr(r.category, 'value') else str(r.category)
                revenue_by_cat[cat]["total"] += float(r.amount)
                revenue_by_cat[cat]["count"] += 1
            
            for e in team_expenses:
                cat = e.category.value if hasattr(e.category, 'value') else str(e.category)
                expense_by_cat[cat]["total"] += float(e.amount)
                expense_by_cat[cat]["count"] += 1
            
            revenue_summary = [{"category": k, "total": v["total"], "count": v["count"]} 
                             for k, v in revenue_by_cat.items()]
            expense_summary = [{"category": k, "total": v["total"], "count": v["count"]} 
                             for k, v in expense_by_cat.items()]
        else:
            all_revenue = revenue_crud.get_by_user(db, user_id, 0, 10000)
            all_expenses = expense_crud.get_by_user(db, user_id, 0, 10000)
            # Filter by date range AND approved status
            user_revenue = [
                r for r in all_revenue 
                if start_date <= AnalyticsService._normalize_date_for_comparison(r.date, start_date) <= end_date 
                and r.is_approved == True
            ]
            user_expenses = [
                e for e in all_expenses 
                if start_date <= AnalyticsService._normalize_date_for_comparison(e.date, start_date) <= end_date 
                and e.is_approved == True
            ]
            
            revenue_by_cat = defaultdict(lambda: {"total": 0, "count": 0})
            expense_by_cat = defaultdict(lambda: {"total": 0, "count": 0})
            
            for r in user_revenue:
                cat = r.category.value if hasattr(r.category, 'value') else str(r.category)
                revenue_by_cat[cat]["total"] += float(r.amount)
                revenue_by_cat[cat]["count"] += 1
            
            for e in user_expenses:
                cat = e.category.value if hasattr(e.category, 'value') else str(e.category)
                expense_by_cat[cat]["total"] += float(e.amount)
                expense_by_cat[cat]["count"] += 1
            
            revenue_summary = [{"category": k, "total": v["total"], "count": v["count"]} 
                             for k, v in revenue_by_cat.items()]
            expense_summary = [{"category": k, "total": v["total"], "count": v["count"]} 
                             for k, v in expense_by_cat.items()]

        return {
            "revenue_by_category": revenue_summary,
            "expenses_by_category": expense_summary
        }


analytics = AnalyticsService()

