
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from .ai_chat import ai_chat_service
from .notification_service import NotificationService
from .fraud_detection import fraud_detection_service
from .budgeting import BudgetingService
from ..core.database import SessionLocal
from ..models.notification import NotificationType, NotificationPriority
from ..models.user import User, UserRole
from ..models.budget import Budget, BudgetStatus
from ..models.inventory import InventoryItem

logger = logging.getLogger(__name__)

class ProactiveAgentService:
    """
    Service that coordinates proactive system scans and 
    uses AI to generate "Daily Insights" for users.
    """

    @staticmethod
    async def run_daily_insight_scan():
        """
        Main entry point for the daily proactive scan.
        Should be triggered by Celery.
        """
        db = SessionLocal()
        try:
            # 1. Identify critical issues
            issues = []
            
            # A. Fraud/Anomaly Scan
            new_flags = fraud_detection_service.scan_for_fraud(db)
            if new_flags > 0:
                issues.append(f"Detected {new_flags} new suspicious transactions that need review.")
            
            # B. Budget Overrun Scan
            overruns = ProactiveAgentService._scan_budgets(db)
            issues.extend(overruns)
            
            # C. Low Stock Scan
            low_stock_items = db.query(InventoryItem).filter(InventoryItem.quantity <= 5).all()
            if low_stock_items:
                issues.append(f"{len(low_stock_items)} inventory items are running low on stock.")

            if not issues:
                logger.info("No critical issues found during proactive scan.")
                return

            # 2. Use AI to generate a human-friendly summary
            insight_summary = await ProactiveAgentService._generate_ai_summary(issues)
            
            # 3. Notify Admins/Managers
            admins = db.query(User).filter(User.role.in_([UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER])).all()
            for admin in admins:
                NotificationService.create_notification(
                    db=db,
                    user_id=admin.id,
                    title="Daily AI Insight 🤖",
                    message=insight_summary,
                    notification_type=NotificationType.SYSTEM_ALERT,
                    priority=NotificationPriority.HIGH,
                    action_url="/dashboard",
                    send_email=True
                )
            
            logger.info("Proactive AI scan completed and notifications sent.")
        except Exception as e:
            logger.error(f"Proactive scan failed: {str(e)}", exc_info=True)
        finally:
            db.close()

    @staticmethod
    def _scan_budgets(db: Session) -> List[str]:
        """Scans all active budgets for overruns."""
        overruns = []
        active_budgets = db.query(Budget).filter(Budget.status == BudgetStatus.ACTIVE).all()
        for bud in active_budgets:
            if bud.total_expenses > bud.total_revenue and bud.total_revenue > 0: # Simple check
                overruns.append(f"Budget '{bud.name}' has exceeded its revenue targets with ${bud.total_expenses:,.2f} in spending.")
            elif bud.total_expenses > 10000: # Threshold example
                 overruns.append(f"High spending detected in budget '{bud.name}': ${bud.total_expenses:,.2f}.")
        return overruns

    @staticmethod
    async def _generate_ai_summary(issues: List[str]) -> str:
        """Uses Gemini to turn technical issues into a friendly insight."""
        prompt = f"""
        You are the FMS Proactive AI Assistant. I have scanned the system and found the following data issues:
        {chr(10).join(['- ' + i for i in issues])}
        
        Please synthesize these into a single, professional, and ACTIONABLE 'Daily Insight' message.
        - Start with a friendly summary.
        - Be concise but reassuring.
        - Focus on what the user should do next.
        - Limit to 3-4 sentences.
        """
        
        try:
            # We bypass the standard chat history for this automated summary
            summary = await ai_chat_service.generate_response(prompt, history=[])
            return summary
        except Exception as e:
            logger.error(f"AI summary generation failed: {e}")
            return "Financial System Update: Multiple items require your attention, including budget variances and inventory levels. Please check the dashboard for details."

proactive_agent_service = ProactiveAgentService()
