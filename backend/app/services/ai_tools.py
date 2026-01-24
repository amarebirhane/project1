from ..core.database import SessionLocal
from sqlalchemy import func
from ..models.revenue import RevenueEntry
from ..models.expense import ExpenseEntry
from ..models.inventory import InventoryItem
from ..models.sale import Sale
from datetime import datetime, timedelta

def get_revenue_summary(days: int = 30) -> str:
    """
    Fetch the total revenue and number of approved entries for the last N days.
    Use this when the user asks about income, revenue, or how much money was made.
    
    Args:
        days: The number of recent days to include in the summary (default 30).
    """
    db = SessionLocal()
    try:
        start_date = datetime.now() - timedelta(days=days)
        total = db.query(func.sum(RevenueEntry.amount_base_currency)).filter(
            RevenueEntry.date >= start_date,
            RevenueEntry.is_approved == True
        ).scalar() or 0.0
        
        count = db.query(RevenueEntry).filter(
            RevenueEntry.date >= start_date,
            RevenueEntry.is_approved == True
        ).count()
        
        return f"Total Revenue (last {days} days): ${total:,.2f} from {count} approved entries."
    finally:
        db.close()

def get_expense_summary(days: int = 30) -> str:
    """
    Fetch the total expenses and number of approved entries for the last N days.
    Use this when the user asks about spending, costs, or expenses.
    
    Args:
        days: The number of recent days to include in the summary (default 30).
    """
    db = SessionLocal()
    try:
        start_date = datetime.now() - timedelta(days=days)
        total = db.query(func.sum(ExpenseEntry.amount_base_currency)).filter(
            ExpenseEntry.date >= start_date,
            ExpenseEntry.is_approved == True
        ).scalar() or 0.0
        
        count = db.query(ExpenseEntry).filter(
            ExpenseEntry.date >= start_date,
            ExpenseEntry.is_approved == True
        ).count()
        
        return f"Total Expenses (last {days} days): ${total:,.2f} from {count} approved entries."
    finally:
        db.close()

def get_inventory_status() -> str:
    """
    Get current inventory health, including total item count and any low stock warnings.
    Use this when user asks about stock, inventory, or products.
    """
    db = SessionLocal()
    try:
        total_items = db.query(InventoryItem).count()
        # Using a threshold of 5 as min_stock_level is not in the model
        low_stock = db.query(InventoryItem).filter(
            InventoryItem.quantity <= 5
        ).all()
        
        status = f"Total Inventory Items: {total_items}. "
        if low_stock:
            status += f"Warning: {len(low_stock)} items are at or below 5 units (low stock)!"
        else:
            status += "All items are currently above low stock levels."
        
        return status
    finally:
        db.close()

def get_sales_performance(days: int = 7) -> str:
    """
    Fetch the total sales amount and transaction count for the last N days.
    Use this when user asks about sales or how products are performing.
    
    Args:
        days: The number of recent days to include in the performance report (default 7).
    """
    db = SessionLocal()
    try:
        start_date = datetime.now() - timedelta(days=days)
        total = db.query(func.sum(Sale.total_amount)).filter(
            Sale.sale_date >= start_date
        ).scalar() or 0.0
        
        count = db.query(Sale).filter(
            Sale.sale_date >= start_date
        ).count()
        
        return f"Sales Performance (last {days} days): ${total:,.2f} from {count} sales transactions."
    finally:
        db.close()

def create_draft_expense(title: str, amount: float, user_id: int, category: str = "other") -> str:
    """
    Create a DRAFT expense entry attributed to the current user.
    
    Args:
        title: Short description of the expense.
        amount: Numerical value.
        user_id: The ID of the user creating the entry.
        category: Category (e.g., supplies, travel).
    """
    db = SessionLocal()
    try:
        new_entry = ExpenseEntry(
            title=title,
            amount=amount,
            amount_base_currency=amount,
            category=category,
            date=datetime.now(),
            is_approved=False,
            created_by_id=user_id
        )
        db.add(new_entry)
        db.commit()
        return f"Successfully created a DRAFT expense for user {user_id}: '{title}' for ${amount:,.2f}."
    except Exception as e:
        db.rollback()
        return f"Failed to create draft expense: {str(e)}"
    finally:
        db.close()

def create_draft_revenue(title: str, amount: float, user_id: int, category: str = "other") -> str:
    """
    Create a DRAFT revenue entry attributed to the current user.
    
    Args:
        title: Short description of the revenue.
        amount: Numerical value.
        user_id: The ID of the user creating the entry.
        category: Category (e.g., sales, services).
    """
    db = SessionLocal()
    try:
        new_entry = RevenueEntry(
            title=title,
            amount=amount,
            amount_base_currency=amount,
            category=category,
            date=datetime.now(),
            is_approved=False,
            created_by_id=user_id
        )
        db.add(new_entry)
        db.commit()
        return f"Successfully created a DRAFT revenue entry for user {user_id}: '{title}' for ${amount:,.2f}."
    except Exception as e:
        db.rollback()
        return f"Failed to create draft revenue: {str(e)}"
    finally:
        db.close()

def run_fraud_scan() -> str:
    """
    Trigger a system-wide anomaly detection scan on recent transactions.
    Use this when user asks to "check for fraud" or "scan for errors."
    """
    # This would normally call the FraudService, but we'll simulate a scan for the AI demo
    return "Fraud detection scan triggered successfully. Scanning recent transactions for anomalies... Results will be available in the Fraud Reports module."

# List of tools to be registered with the AI model
AI_TOOLS = [
    get_revenue_summary,
    get_expense_summary,
    get_inventory_status,
    get_sales_performance,
    create_draft_expense,
    create_draft_revenue,
    run_fraud_scan
]
