from fastapi import APIRouter, Depends, HTTPException, status, Query # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from ...core.database import get_db
from ...crud.revenue import revenue as revenue_crud
from ...crud.expense import expense as expense_crud
from ...crud.user import user as user_crud
from ...crud.approval import approval as approval_crud
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user
from ...schemas.responses import GenericResponse, ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/overview")
def get_dashboard_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard overview with key metrics"""
    try:
        # Default to last 30 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            # Full overview for admins only
            # Accountants should only see their own data (handled in else block)
            try:
                total_revenue = revenue_crud.get_total_by_period(db, start_date, end_date)
            except Exception as e:
                logger.error(f"Error fetching total revenue: {str(e)}")
                total_revenue = 0.0
            
            try:
                total_expenses = expense_crud.get_total_by_period(db, start_date, end_date)
            except Exception as e:
                logger.error(f"Error fetching total expenses: {str(e)}")
                total_expenses = 0.0
            
            profit = total_revenue - total_expenses
            
            try:
                revenue_summary_list = revenue_crud.get_summary_by_category(db, start_date, end_date)
                # Convert list to dict format for consistency
                revenue_summary = {item['category']: item['total'] for item in revenue_summary_list} if isinstance(revenue_summary_list, list) else revenue_summary_list
            except Exception as e:
                logger.error(f"Error fetching revenue summary by category: {str(e)}")
                revenue_summary = {}
            
            try:
                expense_summary_list = expense_crud.get_summary_by_category(db, start_date, end_date)
                # Convert list to dict format for consistency
                expense_summary = {item['category']: item['total'] for item in expense_summary_list} if isinstance(expense_summary_list, list) else expense_summary_list
            except Exception as e:
                logger.error(f"Error fetching expense summary by category: {str(e)}")
                expense_summary = {}
            
            try:
                pending_approvals = len(approval_crud.get_pending(db))
            except Exception as e:
                logger.error(f"Error fetching pending approvals: {str(e)}")
                pending_approvals = 0
            
            return GenericResponse(
                data={
                    "period": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "days": 30
                    },
                    "financials": {
                        "total_revenue": total_revenue,
                        "total_expenses": total_expenses,
                        "profit": profit,
                        "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
                    },
                    "revenue_by_category": revenue_summary,
                    "expenses_by_category": expense_summary,
                    "pending_approvals": pending_approvals
                }
            )
    
        elif current_user.role == UserRole.FINANCE_ADMIN:
            # Finance Admin overview - includes ONLY their own data AND their subordinates' data (accountants and employees)
            # They CANNOT see other finance admins' data
            try:
                subordinates = user_crud.get_hierarchy(db, current_user.id)
                # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
                valid_subordinate_ids = [
                    sub.id for sub in subordinates 
                    if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
                ]
                # Include: Finance Admin themselves + their team (accountants and employees only)
                subordinate_ids = [current_user.id] + valid_subordinate_ids
            except Exception as e:
                logger.error(f"Error fetching user hierarchy for Finance Admin {current_user.id}: {str(e)}")
                subordinate_ids = [current_user.id]  # Fallback to just themselves
            
            # Get all revenue and expenses for the period
            try:
                all_revenue = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
            except Exception as e:
                logger.error(f"Error fetching revenue entries for Finance Admin: {str(e)}")
                all_revenue = []
            
            try:
                all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
            except Exception as e:
                logger.error(f"Error fetching expense entries for Finance Admin: {str(e)}")
                all_expenses = []
            
            # Filter for team members only (subordinates)
            team_revenue = [r for r in all_revenue if r.created_by_id in subordinate_ids]
            team_expenses = [e for e in all_expenses if e.created_by_id in subordinate_ids]
            
            total_revenue = sum(float(r.amount) for r in team_revenue)
            total_expenses = sum(float(e.amount) for e in team_expenses)
            profit = total_revenue - total_expenses
            
            # Calculate revenue and expense summaries by category for team only
            revenue_summary = {}
            for rev in team_revenue:
                category = rev.category or 'Uncategorized'
                revenue_summary[category] = revenue_summary.get(category, 0) + float(rev.amount)
            
            expense_summary = {}
            for exp in team_expenses:
                category = exp.category or 'Uncategorized'
                expense_summary[category] = expense_summary.get(category, 0) + float(exp.amount)
            
            # Get pending approvals for their team only
            try:
                all_pending = approval_crud.get_pending(db)
                team_pending = [p for p in all_pending if p.requester_id in subordinate_ids]
            except Exception as e:
                logger.error(f"Error fetching pending approvals for Finance Admin: {str(e)}")
                team_pending = []
            
            return GenericResponse(
                data={
                    "period": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "days": 30
                    },
                    "financials": {
                        "total_revenue": total_revenue,
                        "total_expenses": total_expenses,
                        "profit": profit,
                        "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
                    },
                    "revenue_by_category": revenue_summary,
                    "expenses_by_category": expense_summary,
                    "team_stats": {
                        "team_size": len(subordinate_ids),
                        "pending_approvals": len(team_pending)
                    }
                }
            )
    
        elif current_user.role == UserRole.MANAGER:
            # Manager overview - includes their team's data
            try:
                subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
                subordinate_ids.append(current_user.id)
            except Exception as e:
                logger.error(f"Error fetching user hierarchy for Manager {current_user.id}: {str(e)}")
                subordinate_ids = [current_user.id]  # Fallback to just themselves
            
            # Get all revenue and expenses for the period
            try:
                all_revenue = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
            except Exception as e:
                logger.error(f"Error fetching revenue entries for Manager: {str(e)}")
                all_revenue = []
            
            try:
                all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
            except Exception as e:
                logger.error(f"Error fetching expense entries for Manager: {str(e)}")
                all_expenses = []
            
            # Filter for team members
            team_revenue = [r for r in all_revenue if r.created_by_id in subordinate_ids]
            team_expenses = [e for e in all_expenses if e.created_by_id in subordinate_ids]
            
            total_revenue = sum(float(r.amount) for r in team_revenue)
            total_expenses = sum(float(e.amount) for e in team_expenses)
            profit = total_revenue - total_expenses
            
            # Get pending approvals for their team
            try:
                all_pending = approval_crud.get_pending(db)
                team_pending = [p for p in all_pending if p.requester_id in subordinate_ids]
            except Exception as e:
                logger.error(f"Error fetching pending approvals for Manager: {str(e)}")
                team_pending = []
            
            return GenericResponse(
                data={
                    "period": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "days": 30
                    },
                    "financials": {
                        "total_revenue": total_revenue,
                        "total_expenses": total_expenses,
                        "profit": profit,
                        "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
                    },
                    "team_stats": {
                        "team_size": len(subordinate_ids),
                        "pending_approvals": len(team_pending)
                    }
                }
            )
    
        elif current_user.role == UserRole.ACCOUNTANT:
            # Accountant overview - includes ONLY their own data
            # Accountants do NOT see Finance Admin's data, other accountants' data, or employees' data
            subordinate_ids = [current_user.id]  # Only themselves
            
            # Get all revenue and expenses for the period
            try:
                all_revenue = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
            except Exception as e:
                logger.error(f"Error fetching revenue entries for Accountant: {str(e)}")
                all_revenue = []
            
            try:
                all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
            except Exception as e:
                logger.error(f"Error fetching expense entries for Accountant: {str(e)}")
                all_expenses = []
            
            # Filter for team members only (subordinates + themselves)
            team_revenue = [r for r in all_revenue if r.created_by_id in subordinate_ids]
            team_expenses = [e for e in all_expenses if e.created_by_id in subordinate_ids]
            
            total_revenue = sum(float(r.amount) for r in team_revenue)
            total_expenses = sum(float(e.amount) for e in team_expenses)
            
            # Include sales revenue from posted sales (sales are included in sales summary endpoint separately)
            # The frontend will combine this with sales revenue from getSalesSummary
            profit = total_revenue - total_expenses
            
            # Calculate revenue and expense summaries by category for team only
            revenue_summary = {}
            for rev in team_revenue:
                category = rev.category or 'Uncategorized'
                revenue_summary[category] = revenue_summary.get(category, 0) + float(rev.amount)
            
            expense_summary = {}
            for exp in team_expenses:
                category = exp.category or 'Uncategorized'
                expense_summary[category] = expense_summary.get(category, 0) + float(exp.amount)
            
            # Get pending approvals for their team only (from subordinates and themselves)
            try:
                all_pending = approval_crud.get_pending(db)
                team_pending = [p for p in all_pending if p.requester_id in subordinate_ids]
            except Exception as e:
                logger.error(f"Error fetching pending approvals for Accountant: {str(e)}")
                team_pending = []
            
            return GenericResponse(
                data={
                    "period": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "days": 30
                    },
                    "financials": {
                        "total_revenue": total_revenue,
                        "total_expenses": total_expenses,
                        "profit": profit,
                        "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
                    },
                    "revenue_by_category": revenue_summary,
                    "expenses_by_category": expense_summary,
                    "team_stats": {
                        "team_size": len(subordinate_ids),
                        "pending_approvals": len(team_pending)
                    }
                }
            )
        
        else:
            # Regular user/Employee overview - only their own data
            try:
                user_revenue = revenue_crud.get_by_user(db, current_user.id, 0, 1000)
            except Exception as e:
                logger.error(f"Error fetching user revenue entries: {str(e)}")
                user_revenue = []
            
            try:
                user_expenses = expense_crud.get_by_user(db, current_user.id, 0, 1000)
            except Exception as e:
                logger.error(f"Error fetching user expense entries: {str(e)}")
                user_expenses = []
            
            # Filter by date range - handle None dates gracefully
            user_revenue_period = []
            for r in user_revenue:
                try:
                    if r.date and start_date <= r.date <= end_date:
                        user_revenue_period.append(r)
                except (TypeError, AttributeError):
                    # Skip entries with invalid dates
                    logger.warning(f"Skipping revenue entry {r.id} due to invalid date")
                    continue
            
            user_expenses_period = []
            for e in user_expenses:
                try:
                    if e.date and start_date <= e.date <= end_date:
                        user_expenses_period.append(e)
                except (TypeError, AttributeError):
                    # Skip entries with invalid dates
                    logger.warning(f"Skipping expense entry {e.id} due to invalid date")
                    continue
            
            total_revenue = sum(float(r.amount) for r in user_revenue_period)
            total_expenses = sum(float(e.amount) for e in user_expenses_period)
            profit = total_revenue - total_expenses
            
            # Get their pending approvals
            try:
                user_pending = approval_crud.get_by_requester(db, current_user.id)
                pending_count = len([p for p in user_pending if p.status.value == "pending"])
            except Exception as e:
                logger.error(f"Error fetching user pending approvals: {str(e)}")
                pending_count = 0
            
            return GenericResponse(
                data={
                    "period": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "days": 30
                    },
                    "financials": {
                        "total_revenue": total_revenue,
                        "total_expenses": total_expenses,
                        "profit": profit,
                        "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
                    },
                    "personal_stats": {
                        "revenue_entries": len(user_revenue_period),
                        "expense_entries": len(user_expenses_period),
                        "pending_approvals": pending_count
                    }
                }
            )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_dashboard_overview for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard overview: {str(e)}"
        )


@router.get("/kpi")
@router.get("/kpis")
def get_kpi_metrics(
    period: str = Query("month", regex="^(week|month|quarter|year)$"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get KPI metrics for different time periods"""
    try:
        # Calculate date range based on period
        end_date = datetime.utcnow()
        
        if period == "week":
            start_date = end_date - timedelta(days=7)
            prev_start = end_date - timedelta(days=14)
            prev_end = start_date
        elif period == "month":
            start_date = end_date - timedelta(days=30)
            prev_start = end_date - timedelta(days=60)
            prev_end = start_date
        elif period == "quarter":
            start_date = end_date - timedelta(days=90)
            prev_start = end_date - timedelta(days=180)
            prev_end = start_date
        else:  # year
            start_date = end_date - timedelta(days=365)
            prev_start = end_date - timedelta(days=730)
            prev_end = start_date
        
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        # Current period metrics
        try:
            current_revenue = revenue_crud.get_total_by_period(db, start_date, end_date)
            current_expenses = expense_crud.get_total_by_period(db, start_date, end_date)
        except Exception as e:
            logger.error(f"Error fetching current period metrics: {str(e)}", exc_info=True)
            current_revenue = 0.0
            current_expenses = 0.0
        
        current_profit = current_revenue - current_expenses
        
        # Previous period metrics for comparison
        try:
            prev_revenue = revenue_crud.get_total_by_period(db, prev_start, prev_end)
            prev_expenses = expense_crud.get_total_by_period(db, prev_start, prev_end)
        except Exception as e:
            logger.error(f"Error fetching previous period metrics: {str(e)}", exc_info=True)
            prev_revenue = 0.0
            prev_expenses = 0.0
        
        prev_profit = prev_revenue - prev_expenses
        
        # Calculate growth percentages
        revenue_growth = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        expense_growth = ((current_expenses - prev_expenses) / prev_expenses * 100) if prev_expenses > 0 else 0
        profit_growth = ((current_profit - prev_profit) / prev_profit * 100) if prev_profit != 0 else 0
        
        return GenericResponse(
            data={
                "period": period,
                "current_period": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "revenue": current_revenue,
                    "expenses": current_expenses,
                    "profit": current_profit
                },
                "previous_period": {
                    "start_date": prev_start,
                    "end_date": prev_end,
                    "revenue": prev_revenue,
                    "expenses": prev_expenses,
                    "profit": prev_profit
                },
                "growth": {
                    "revenue_growth_percent": revenue_growth,
                    "expense_growth_percent": expense_growth,
                    "profit_growth_percent": profit_growth
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_kpi_metrics: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve KPI metrics: {str(e)}"
        )


@router.get("/recent-activity")
def get_recent_activity(
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get recent activity for the current user"""
    try:
        activities = []
        
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            # Admins can see all activities
            # Accountants should only see their own activities (handled in else block)
            # Get recent revenue entries from all users (sorted by created_at desc)
            try:
                all_revenue = revenue_crud.get_multi(db, 0, limit * 3)
            except Exception as e:
                logger.error(f"Error fetching revenue entries for recent activity: {str(e)}")
                all_revenue = []
            
            try:
                all_expenses = expense_crud.get_multi(db, 0, limit * 3)
            except Exception as e:
                logger.error(f"Error fetching expense entries for recent activity: {str(e)}")
                all_expenses = []
            
            try:
                all_approvals = approval_crud.get_multi(db, 0, limit * 3)
            except Exception as e:
                logger.error(f"Error fetching approval entries for recent activity: {str(e)}")
                all_approvals = []
            
            # Sort revenue and expenses by created_at descending
            try:
                all_revenue_sorted = sorted(all_revenue, key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)
            except Exception as e:
                logger.error(f"Error sorting revenue entries: {str(e)}")
                all_revenue_sorted = all_revenue
            
            try:
                all_expenses_sorted = sorted(all_expenses, key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)
            except Exception as e:
                logger.error(f"Error sorting expense entries: {str(e)}")
                all_expenses_sorted = all_expenses
            
            try:
                all_approvals_sorted = sorted(all_approvals, key=lambda x: x.created_at if x.created_at else datetime.min, reverse=True)
            except Exception as e:
                logger.error(f"Error sorting approval entries: {str(e)}")
                all_approvals_sorted = all_approvals
            
            # Add all revenue entries
            try:
                for rev in all_revenue_sorted[:limit]:
                    try:
                        activities.append({
                            "type": "revenue",
                            "id": rev.id,
                            "title": rev.title if hasattr(rev, 'title') and rev.title else f"Revenue #{rev.id}",
                            "amount": float(rev.amount) if hasattr(rev, 'amount') and rev.amount else 0,
                            "date": rev.created_at if hasattr(rev, 'created_at') else None,
                            "status": "approved" if (hasattr(rev, 'is_approved') and rev.is_approved) else "pending"
                        })
                    except Exception as e:
                        logger.warning(f"Error processing revenue entry {rev.id if hasattr(rev, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding revenue entries to activities: {str(e)}")
            
            # Add all expense entries
            try:
                for exp in all_expenses_sorted[:limit]:
                    try:
                        activities.append({
                            "type": "expense",
                            "id": exp.id,
                            "title": exp.title if hasattr(exp, 'title') and exp.title else f"Expense #{exp.id}",
                            "amount": float(exp.amount) if hasattr(exp, 'amount') and exp.amount else 0,
                            "date": exp.created_at if hasattr(exp, 'created_at') else None,
                            "status": "approved" if (hasattr(exp, 'is_approved') and exp.is_approved) else "pending"
                        })
                    except Exception as e:
                        logger.warning(f"Error processing expense entry {exp.id if hasattr(exp, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding expense entries to activities: {str(e)}")
            
            # Add all approval requests
            try:
                for appr in all_approvals_sorted[:limit]:
                    try:
                        status_value = "pending"
                        if hasattr(appr, 'status'):
                            if hasattr(appr.status, 'value'):
                                status_value = appr.status.value
                            else:
                                status_value = str(appr.status)
                        
                        activities.append({
                            "type": "approval",
                            "id": appr.id,
                            "title": appr.title if hasattr(appr, 'title') and appr.title else f"Approval Request #{appr.id}",
                            "amount": None,
                            "date": appr.created_at if hasattr(appr, 'created_at') else None,
                            "status": status_value
                        })
                    except Exception as e:
                        logger.warning(f"Error processing approval entry {appr.id if hasattr(appr, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding approval entries to activities: {str(e)}")
        
        elif current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
            # Finance Admin/Manager: See only their team's activities (subordinates: accountants and employees)
            # IMPORTANT: Only include accountants and employees, NOT other Finance Admins/Managers
            try:
                subordinates = user_crud.get_hierarchy(db, current_user.id)
                # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
                valid_subordinate_ids = [
                    sub.id for sub in subordinates 
                    if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
                ]
                # Include: Finance Admin/Manager themselves + their team (accountants and employees only)
                subordinate_ids = [current_user.id] + valid_subordinate_ids
            except Exception as e:
                logger.error(f"Error fetching user hierarchy: {str(e)}")
                subordinate_ids = [current_user.id]
            
            # Get all revenue and expenses for the period
            try:
                all_revenue = revenue_crud.get_multi(db, 0, limit * 2)
            except Exception as e:
                logger.error(f"Error fetching revenue entries for manager: {str(e)}")
                all_revenue = []
            
            try:
                all_expenses = expense_crud.get_multi(db, 0, limit * 2)
            except Exception as e:
                logger.error(f"Error fetching expense entries for manager: {str(e)}")
                all_expenses = []
            
            try:
                all_approvals = approval_crud.get_pending(db)
            except Exception as e:
                logger.error(f"Error fetching pending approvals for manager: {str(e)}")
                all_approvals = []
            
            # Filter for team members
            try:
                team_revenue = [r for r in all_revenue if hasattr(r, 'created_by_id') and r.created_by_id in subordinate_ids]
                team_expenses = [e for e in all_expenses if hasattr(e, 'created_by_id') and e.created_by_id in subordinate_ids]
                team_approvals = [a for a in all_approvals if hasattr(a, 'requester_id') and a.requester_id in subordinate_ids]
            except Exception as e:
                logger.error(f"Error filtering team activities: {str(e)}")
                team_revenue = []
                team_expenses = []
                team_approvals = []
            
            # Add team revenue entries
            try:
                for rev in team_revenue[:limit]:
                    try:
                        activities.append({
                            "type": "revenue",
                            "id": rev.id,
                            "title": rev.title if hasattr(rev, 'title') and rev.title else f"Revenue #{rev.id}",
                            "amount": float(rev.amount) if hasattr(rev, 'amount') and rev.amount else 0,
                            "date": rev.created_at if hasattr(rev, 'created_at') else None,
                            "status": "approved" if (hasattr(rev, 'is_approved') and rev.is_approved) else "pending"
                        })
                    except Exception as e:
                        logger.warning(f"Error processing team revenue entry {rev.id if hasattr(rev, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding team revenue entries: {str(e)}")
            
            # Add team expense entries
            try:
                for exp in team_expenses[:limit]:
                    try:
                        activities.append({
                            "type": "expense",
                            "id": exp.id,
                            "title": exp.title if hasattr(exp, 'title') and exp.title else f"Expense #{exp.id}",
                            "amount": float(exp.amount) if hasattr(exp, 'amount') and exp.amount else 0,
                            "date": exp.created_at if hasattr(exp, 'created_at') else None,
                            "status": "approved" if (hasattr(exp, 'is_approved') and exp.is_approved) else "pending"
                        })
                    except Exception as e:
                        logger.warning(f"Error processing team expense entry {exp.id if hasattr(exp, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding team expense entries: {str(e)}")
            
            # Add team approval requests
            try:
                for appr in team_approvals[:limit]:
                    try:
                        status_value = "pending"
                        if hasattr(appr, 'status'):
                            if hasattr(appr.status, 'value'):
                                status_value = appr.status.value
                            else:
                                status_value = str(appr.status)
                        
                        activities.append({
                            "type": "approval",
                            "id": appr.id,
                            "title": appr.title if hasattr(appr, 'title') and appr.title else f"Approval Request #{appr.id}",
                            "amount": None,
                            "date": appr.created_at if hasattr(appr, 'created_at') else None,
                            "status": status_value
                        })
                    except Exception as e:
                        logger.warning(f"Error processing team approval entry {appr.id if hasattr(appr, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding team approval entries: {str(e)}")
        
        elif current_user.role == UserRole.ACCOUNTANT:
            # Accountant: See ONLY their own activities
            # Accountants do NOT see Finance Admin's activities, other accountants' activities, or employees' activities
            accessible_user_ids = [current_user.id]  # Only themselves
            
            # Get all revenue and expenses for the period
            try:
                all_revenue = revenue_crud.get_multi(db, 0, limit * 2)
            except Exception as e:
                logger.error(f"Error fetching revenue entries for accountant: {str(e)}")
                all_revenue = []
            
            try:
                all_expenses = expense_crud.get_multi(db, 0, limit * 2)
            except Exception as e:
                logger.error(f"Error fetching expense entries for accountant: {str(e)}")
                all_expenses = []
            
            try:
                all_approvals = approval_crud.get_pending(db)
            except Exception as e:
                logger.error(f"Error fetching pending approvals for accountant: {str(e)}")
                all_approvals = []
            
            # Filter for accessible users only (Accountant + employees)
            try:
                team_revenue = [r for r in all_revenue if hasattr(r, 'created_by_id') and r.created_by_id in accessible_user_ids]
                team_expenses = [e for e in all_expenses if hasattr(e, 'created_by_id') and e.created_by_id in accessible_user_ids]
                team_approvals = [a for a in all_approvals if hasattr(a, 'requester_id') and a.requester_id in accessible_user_ids]
            except Exception as e:
                logger.error(f"Error filtering accountant activities: {str(e)}")
                team_revenue = []
                team_expenses = []
                team_approvals = []
            
            # Add team revenue entries
            try:
                for rev in team_revenue[:limit]:
                    try:
                        activities.append({
                            "type": "revenue",
                            "id": rev.id,
                            "title": rev.title if hasattr(rev, 'title') and rev.title else f"Revenue #{rev.id}",
                            "amount": float(rev.amount) if hasattr(rev, 'amount') and rev.amount else 0,
                            "date": rev.created_at if hasattr(rev, 'created_at') else None,
                            "status": "approved" if (hasattr(rev, 'is_approved') and rev.is_approved) else "pending"
                        })
                    except Exception as e:
                        logger.warning(f"Error processing accountant revenue entry {rev.id if hasattr(rev, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding accountant revenue entries: {str(e)}")
            
            # Add team expense entries
            try:
                for exp in team_expenses[:limit]:
                    try:
                        activities.append({
                            "type": "expense",
                            "id": exp.id,
                            "title": exp.title if hasattr(exp, 'title') and exp.title else f"Expense #{exp.id}",
                            "amount": float(exp.amount) if hasattr(exp, 'amount') and exp.amount else 0,
                            "date": exp.created_at if hasattr(exp, 'created_at') else None,
                            "status": "approved" if (hasattr(exp, 'is_approved') and exp.is_approved) else "pending"
                        })
                    except Exception as e:
                        logger.warning(f"Error processing accountant expense entry {exp.id if hasattr(exp, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding accountant expense entries: {str(e)}")
            
            # Add team approval requests
            try:
                for appr in team_approvals[:limit]:
                    try:
                        status_value = "pending"
                        if hasattr(appr, 'status'):
                            if hasattr(appr.status, 'value'):
                                status_value = appr.status.value
                            else:
                                status_value = str(appr.status)
                        
                        activities.append({
                            "type": "approval",
                            "id": appr.id,
                            "title": appr.title if hasattr(appr, 'title') and appr.title else f"Approval Request #{appr.id}",
                            "amount": None,
                            "date": appr.created_at if hasattr(appr, 'created_at') else None,
                            "status": status_value
                        })
                    except Exception as e:
                        logger.warning(f"Error processing accountant approval entry {appr.id if hasattr(appr, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding accountant approval entries: {str(e)}")
        
        else:
            # Regular users can only see their own activities
            # Get recent revenue entries
            try:
                recent_revenue = revenue_crud.get_by_user(db, current_user.id, 0, limit)
            except Exception as e:
                logger.error(f"Error fetching user revenue entries: {str(e)}")
                recent_revenue = []
            
            # Get recent expense entries  
            try:
                recent_expenses = expense_crud.get_by_user(db, current_user.id, 0, limit)
            except Exception as e:
                logger.error(f"Error fetching user expense entries: {str(e)}")
                recent_expenses = []
            
            # Get recent approval requests
            try:
                recent_approvals = approval_crud.get_by_requester(db, current_user.id, 0, limit)
            except Exception as e:
                logger.error(f"Error fetching user approval requests: {str(e)}")
                recent_approvals = []
            
            # Add user's revenue entries
            try:
                for rev in recent_revenue[:limit]:
                    try:
                        activities.append({
                            "type": "revenue",
                            "id": rev.id,
                            "title": rev.title if hasattr(rev, 'title') and rev.title else f"Revenue #{rev.id}",
                            "amount": float(rev.amount) if hasattr(rev, 'amount') and rev.amount else 0,
                            "date": rev.created_at if hasattr(rev, 'created_at') else None,
                            "status": "approved" if (hasattr(rev, 'is_approved') and rev.is_approved) else "pending"
                        })
                    except Exception as e:
                        logger.warning(f"Error processing user revenue entry {rev.id if hasattr(rev, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding user revenue entries: {str(e)}")
            
            # Add user's expense entries
            try:
                for exp in recent_expenses[:limit]:
                    try:
                        activities.append({
                            "type": "expense",
                            "id": exp.id,
                            "title": exp.title if hasattr(exp, 'title') and exp.title else f"Expense #{exp.id}",
                            "amount": float(exp.amount) if hasattr(exp, 'amount') and exp.amount else 0,
                            "date": exp.created_at if hasattr(exp, 'created_at') else None,
                            "status": "approved" if (hasattr(exp, 'is_approved') and exp.is_approved) else "pending"
                        })
                    except Exception as e:
                        logger.warning(f"Error processing user expense entry {exp.id if hasattr(exp, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding user expense entries: {str(e)}")
            
            # Add user's approval requests
            try:
                for appr in recent_approvals[:limit]:
                    try:
                        status_value = "pending"
                        if hasattr(appr, 'status'):
                            if hasattr(appr.status, 'value'):
                                status_value = appr.status.value
                            else:
                                status_value = str(appr.status)
                        
                        activities.append({
                            "type": "approval",
                            "id": appr.id,
                            "title": appr.title if hasattr(appr, 'title') and appr.title else f"Approval Request #{appr.id}",
                            "amount": None,
                            "date": appr.created_at if hasattr(appr, 'created_at') else None,
                            "status": status_value
                        })
                    except Exception as e:
                        logger.warning(f"Error processing user approval entry {appr.id if hasattr(appr, 'id') else 'unknown'}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error adding user approval entries: {str(e)}")
        
        # Sort by date descending
        try:
            activities.sort(key=lambda x: x["date"] if x["date"] else datetime.min, reverse=True)
        except Exception as e:
            logger.error(f"Error sorting activities: {str(e)}")
            # If sorting fails, just return activities as-is
        
        return GenericResponse(data=activities[:limit])
    
    except Exception as e:
        logger.error(f"Unexpected error in get_recent_activity: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching recent activity: {str(e)}"
        )
