"""
Comprehensive notification service for pushing notifications for any event
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
import logging

from fastapi import BackgroundTasks
from ..core.database import SessionLocal
from .email import EmailService
from ..crud.notification import notification as notification_crud
from ..crud.user import user as user_crud
from ..crud.expense import expense as expense_crud
from ..crud.revenue import revenue as revenue_crud
from ..models.notification import NotificationType, NotificationPriority
from ..models.user import User, UserRole
from ..schemas.notification import NotificationCreate

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating and managing notifications for any event"""
    
    @staticmethod
    def _dispatch(
        user_id: int,
        title: str,
        message: str,
        notification_type: NotificationType,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None,
        db: Optional[Session] = None
    ):
        """
        Internal dispatcher for notifications.
        Can run synchronously or asynchronously via BackgroundTasks.
        """
        if background_tasks:
            background_tasks.add_task(
                NotificationService._execute_dispatch,
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                action_url=action_url,
                send_email=send_email
            )
        else:
            # Run synchronously
            if not db:
                with SessionLocal() as new_db:
                    NotificationService._execute_dispatch(
                        user_id=user_id,
                        title=title,
                        message=message,
                        notification_type=notification_type,
                        priority=priority,
                        action_url=action_url,
                        send_email=send_email,
                        db=new_db
                    )
            else:
                NotificationService._execute_dispatch(
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    priority=priority,
                    action_url=action_url,
                    send_email=send_email,
                    db=db
                )

    @staticmethod
    def _execute_dispatch(
        user_id: int,
        title: str,
        message: str,
        notification_type: NotificationType,
        priority: NotificationPriority,
        action_url: Optional[str],
        send_email: bool,
        db: Optional[Session] = None
    ):
        """Actual execution of notification creation and email sending"""
        # If no DB provided (usually when called via background_tasks), create a fresh one
        should_close_db = False
        if db is None:
            db = SessionLocal()
            should_close_db = True
            
        try:
            # 1. Duplicate Prevention Check (In-App)
            # Don't create identical notifications for the same user/url within 5 minutes
            from ..models.notification import Notification
            five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
            
            existing = db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.title == title,
                Notification.action_url == action_url,
                Notification.created_at >= five_minutes_ago
            ).first()
            
            if existing:
                logger.debug(f"Skipping duplicate notification for user {user_id}: {title}")
                return

            # 2. Create In-App Notification
            notification_data = NotificationCreate(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                action_url=action_url
            )
            db_notification = notification_crud.create(db, obj_in=notification_data)
            
            # 3. Optionally Send Email
            if send_email:
                user = user_crud.get(db, id=user_id)
                if user and user.email:
                    email_sent = EmailService.send_system_notification(
                        to_email=user.email,
                        title=title,
                        message=message
                    )
                    if email_sent:
                        db_notification.is_email_sent = True
                        db.add(db_notification)
                        db.commit()
            
            # 4. Broadcast via WebSocket
            try:
                import asyncio
                # Use a helper to avoid circular imports and handle async in sync context if needed
                # However, NotificationService methods are mostly called in sync contexts or BackgroundTasks
                # Actually, our WebSocket manager is async. 
                # If we are in a background task (async), we can await.
                # If we are in a sync context, we might need an event loop or another background task.
                # Let's check how _execute_dispatch is called.
                
                notification_dict = {
                    "id": db_notification.id,
                    "title": db_notification.title,
                    "message": db_notification.message,
                    "type": db_notification.type.value if hasattr(db_notification.type, 'value') else db_notification.type,
                    "priority": db_notification.priority.value if hasattr(db_notification.priority, 'value') else db_notification.priority,
                    "action_url": db_notification.action_url,
                    "created_at": db_notification.created_at.isoformat() if db_notification.created_at else datetime.now(timezone.utc).isoformat(),
                    "is_read": False
                }
                
                from ..core.websocket import manager
                # Since _execute_dispatch might be called from a sync context (SessionLocal), 
                # but we are in a FastAPI app which has an event loop.
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(manager.send_personal_message(notification_dict, user_id))
                    else:
                        asyncio.run(manager.send_personal_message(notification_dict, user_id))
                except RuntimeError:
                    # No event loop
                    asyncio.run(manager.send_personal_message(notification_dict, user_id))
                    
            except Exception as ws_err:
                logger.error(f"Failed to broadcast via WebSocket: {str(ws_err)}")
                        
        except Exception as e:
            logger.error(f"Dispatch failed for user {user_id}: {str(e)}", exc_info=True)
        finally:
            if should_close_db:
                db.close()

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Optional[Any]:
        """Create a single notification for a user"""
        NotificationService._dispatch(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority,
            action_url=action_url,
            send_email=send_email,
            background_tasks=background_tasks,
            db=db
        )
        return None # We return None as it might be async now
    
    @staticmethod
    def notify_expense_created(
        db: Session,
        expense_id: int,
        expense_title: str,
        amount: float,
        created_by_id: int,
        requires_approval: bool = True,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify relevant users when an expense is created"""
        # Notify the creator
        NotificationService.create_notification(
            db=db,
            user_id=created_by_id,
            title="Expense Created",
            message=f"Your expense '{expense_title}' (${amount:,.2f}) has been created successfully.",
            notification_type=NotificationType.SYSTEM_ALERT,
            priority=NotificationPriority.LOW,
            action_url=f"/expenses/{expense_id}",
            background_tasks=background_tasks
        )
        
        # If requires approval, notify approvers
        if requires_approval:
            approvers = NotificationService._get_approvers(db, created_by_id)
            # Filter out creator from approvers to avoid duplicate (different title) notifications
            approvers = [a for a in approvers if a.id != created_by_id]
            for approver in approvers:
                NotificationService.create_notification(
                    db=db,
                    user_id=approver.id,
                    title="Expense Approval Required",
                    message=f"New expense '{expense_title}' (${amount:,.2f}) requires your approval.",
                    notification_type=NotificationType.APPROVAL_REQUEST,
                    priority=NotificationPriority.HIGH,
                    action_url=f"/approvals?expense_id={expense_id}",
                    send_email=True, # Critical notification
                    background_tasks=background_tasks
                )

        # Notify subordinates if creator is a Finance Admin or Manager
        if creator and creator.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, creator.id)
            subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            for sub_id in subordinate_ids:
                if sub_id != created_by_id:
                    NotificationService.create_notification(
                        db=db,
                        user_id=sub_id,
                        title="New Expense Record",
                        message=f"A new expense '{expense_title}' (${amount:,.2f}) has been recorded by {creator.full_name or creator.username}.",
                        notification_type=NotificationType.SYSTEM_ALERT,
                        priority=NotificationPriority.LOW,
                        action_url=f"/expenses/{expense_id}",
                        background_tasks=background_tasks
                    )
    
    @staticmethod
    def notify_expense_updated(
        db: Session,
        expense_id: int,
        expense_title: str,
        updated_by_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when an expense is updated"""
        try:
            # Get the expense to find the owner
            expense = expense_crud.get(db, id=expense_id)
            if not expense:
                return

            notify_user_id = expense.created_by_id
            
            # Don't notify self
            if notify_user_id == updated_by_id:
                return

            updater = user_crud.get(db, id=updated_by_id)
            updater_name = updater.full_name or updater.username if updater else "An admin"

            NotificationService.create_notification(
                db=db,
                user_id=notify_user_id,
                title="Expense Updated",
                message=f"Your expense '{expense_title}' has been updated by {updater_name}.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url=f"/expenses/{expense_id}",
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.error(f"Failed to send expense update notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_expense_approved(
        db: Session,
        expense_id: int,
        expense_title: str,
        approver_id: int,
        requester_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when an expense is approved"""
        NotificationService.create_notification(
            db=db,
            user_id=requester_id,
            title="Expense Approved",
            message=f"Your expense '{expense_title}' has been approved.",
            notification_type=NotificationType.APPROVAL_DECISION,
            priority=NotificationPriority.MEDIUM,
            action_url=f"/expenses/{expense_id}",
            send_email=True,
            background_tasks=background_tasks
        )

    @staticmethod
    def notify_revenue_created(
        db: Session,
        revenue_id: int,
        revenue_title: str,
        amount: float,
        created_by_id: int,
        requires_approval: bool = True,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify relevant users when revenue is created"""
        # Notify the creator
        NotificationService.create_notification(
            db=db,
            user_id=created_by_id,
            title="Revenue Created",
            message=f"Your revenue entry '{revenue_title}' (${amount:,.2f}) has been created successfully.",
            notification_type=NotificationType.SYSTEM_ALERT,
            priority=NotificationPriority.LOW,
            action_url=f"/revenue/{revenue_id}",
            background_tasks=background_tasks
        )
        
        # If requires approval, notify approvers
        if requires_approval:
            approvers = NotificationService._get_approvers(db, created_by_id)
            # Filter out creator from approvers to avoid duplicate (different title) notifications
            approvers = [a for a in approvers if a.id != created_by_id]
            for approver in approvers:
                NotificationService.create_notification(
                    db=db,
                    user_id=approver.id,
                    title="Revenue Approval Required",
                    message=f"New revenue entry '{revenue_title}' (${amount:,.2f}) requires your approval.",
                    notification_type=NotificationType.APPROVAL_REQUEST,
                    priority=NotificationPriority.HIGH,
                    action_url=f"/approvals?revenue_id={revenue_id}",
                    send_email=True,
                    background_tasks=background_tasks
                )

        # Notify subordinates if creator is a Finance Admin or Manager
        if creator and creator.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, creator.id)
            subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            for sub_id in subordinate_ids:
                if sub_id != created_by_id:
                    NotificationService.create_notification(
                        db=db,
                        user_id=sub_id,
                        title="New Revenue Record",
                        message=f"A new revenue entry '{revenue_title}' (${amount:,.2f}) has been recorded by {creator.full_name or creator.username}.",
                        notification_type=NotificationType.SYSTEM_ALERT,
                        priority=NotificationPriority.LOW,
                        action_url=f"/revenue/{revenue_id}",
                        background_tasks=background_tasks
                    )
    
    @staticmethod
    def notify_revenue_updated(
        db: Session,
        revenue_id: int,
        revenue_title: str,
        updated_by_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when revenue is updated"""
        try:
            # Get the revenue to find the owner
            revenue = revenue_crud.get(db, id=revenue_id)
            if not revenue:
                return

            notify_user_id = revenue.created_by_id
            
            # Don't notify self
            if notify_user_id == updated_by_id:
                return

            updater = user_crud.get(db, id=updated_by_id)
            updater_name = updater.full_name or updater.username if updater else "An admin"

            NotificationService.create_notification(
                db=db,
                user_id=notify_user_id,
                title="Revenue Updated",
                message=f"Your revenue entry '{revenue_title}' has been updated by {updater_name}.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url=f"/revenue/{revenue_id}",
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.error(f"Failed to send revenue update notification: {str(e)}", exc_info=True)
    
    # Removed duplicate notify_sale_created method
    
    @staticmethod
    def notify_sale_posted(
        db: Session,
        sale_id: int,
        item_name: str,
        total_amount: float,
        posted_by_id: int,
        sold_by_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when a sale is posted to ledger"""
        # Notify the person who posted
        NotificationService.create_notification(
            db=db,
            user_id=posted_by_id,
            title="Sale Posted to Ledger",
            message=f"Sale for {item_name} (${total_amount:,.2f}) has been posted to the accounting ledger.",
            notification_type=NotificationType.SALE_POSTED,
            priority=NotificationPriority.MEDIUM,
            action_url=f"/sales/accounting",
            background_tasks=background_tasks
        )
        
        # Notify the original seller if different
        if sold_by_id != posted_by_id:
            NotificationService.create_notification(
                db=db,
                user_id=sold_by_id,
                title="Sale Posted to Ledger",
                message=f"Your sale for {item_name} (${total_amount:,.2f}) has been posted to the accounting ledger.",
                notification_type=NotificationType.SALE_POSTED,
                priority=NotificationPriority.MEDIUM,
                action_url=f"/sales/accounting",
                background_tasks=background_tasks
            )

    @staticmethod
    def notify_budget_exceeded(
        db: Session,
        budget_id: int,
        budget_name: str,
        user_id: int,
        category_name: str = None,
        spent_amount: float = 0.0,
        budget_amount: float = 0.0,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when a budget is exceeded"""
        exceeded_amount = spent_amount - budget_amount if spent_amount > budget_amount else 0.0
        category_text = f" for '{category_name}'" if category_name else ""
        
        NotificationService.create_notification(
            db=db,
            user_id=user_id,
            title="Budget Exceeded",
            message=f"Budget '{budget_name}'{category_text} has been exceeded. Spent: ${spent_amount:,.2f} / Budget: ${budget_amount:,.2f}.",
            notification_type=NotificationType.BUDGET_EXCEEDED,
            priority=NotificationPriority.HIGH,
            action_url=f"/budgets/{budget_id}",
            send_email=True,
            background_tasks=background_tasks
        )
    
    @staticmethod
    def notify_forecast_created(
        db: Session,
        forecast_id: int,
        forecast_name: str,
        created_by_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        # Notify the creator
        NotificationService.create_notification(
            db=db,
            user_id=created_by_id,
            title="Forecast Created",
            message=f"Forecast '{forecast_name}' has been created successfully.",
            notification_type=NotificationType.SYSTEM_ALERT,
            priority=NotificationPriority.LOW,
            action_url=f"/forecast/{forecast_id}",
            background_tasks=background_tasks
        )

        # Notify subordinates if creator is a Finance Admin or Manager
        creator = user_crud.get(db, id=created_by_id)
        if creator and creator.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, creator.id)
            subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            for sub_id in subordinate_ids:
                if sub_id != created_by_id:
                    NotificationService.create_notification(
                        db=db,
                        user_id=sub_id,
                        title="New Forecast Record",
                        message=f"A new forecast '{forecast_name}' has been created by {creator.full_name or creator.username}.",
                        notification_type=NotificationType.SYSTEM_ALERT,
                        priority=NotificationPriority.LOW,
                        action_url=f"/forecast/{forecast_id}",
                        background_tasks=background_tasks
                    )
    
    @staticmethod
    def notify_ml_training_completed(
        db: Session,
        success_count: int = 0,
        error_count: int = 0,
        user_id: Optional[int] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when ML model training completes"""
        notify_users = []
        if user_id:
            notify_users.append(user_id)
        else:
            # Notify admins and finance admins by default
            admins = db.query(User).filter(
                User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]),
                User.is_active == True
            ).all()
            notify_users.extend([u.id for u in admins])

        title = "ML Training Complete"
        message = f"Market Analysis models retrained: {success_count} success, {error_count} errors."
        
        for uid in set(notify_users):
            NotificationService.create_notification(
                db=db,
                user_id=uid,
                title=title,
                message=message,
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.MEDIUM if error_count == 0 else NotificationPriority.HIGH,
                action_url="/ml-training",
                send_email=error_count > 0,
                background_tasks=background_tasks
            )
    
    @staticmethod
    def notify_inventory_low(
        db: Session,
        item_id: int,
        item_name: str,
        current_quantity: int,
        min_quantity: int,
        user_ids: List[int],
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when inventory is low"""
        for user_id in user_ids:
            NotificationService.create_notification(
                db=db,
                user_id=user_id,
                title="Low Inventory Alert",
                message=f"Inventory item '{item_name}' is low: {current_quantity} remaining (minimum: {min_quantity}).",
                notification_type=NotificationType.INVENTORY_LOW,
                priority=NotificationPriority.HIGH,
                action_url=f"/inventory/manage?item_id={item_id}",
                send_email=True,
                background_tasks=background_tasks
            )
    
    @staticmethod
    def notify_inventory_created(
        db: Session,
        item_id: int,
        item_name: str,
        quantity: int,
        created_by_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when inventory item is created"""
        # Notify the creator
        NotificationService.create_notification(
            db=db,
            user_id=created_by_id,
            title="Inventory Item Created",
            message=f"Inventory item '{item_name}' (Quantity: {quantity}) has been created successfully.",
            notification_type=NotificationType.INVENTORY_UPDATED,
            priority=NotificationPriority.LOW,
            action_url=f"/inventory/manage?item_id={item_id}",
            background_tasks=background_tasks
        )
        
        # Notify relevant stakeholders
        creator = user_crud.get(db, id=created_by_id)
        notify_ids = []
        if creator and creator.manager_id:
            notify_ids.append(creator.manager_id)
        
        # Notify subordinates if creator is a Finance Admin or Manager
        if creator and creator.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, creator.id)
            # Notify accountants and employees under them
            subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE,]
            ]
            notify_ids.extend(subordinate_ids)

        is_admin_creator = creator.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        if not is_admin_creator:
            # If no specific stakeholders identified (manager or subordinates), 
            # notify a few admins for general awareness
            if not notify_ids:
                admins = db.query(User).filter(
                    User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                    User.is_active == True,
                    User.id != created_by_id
                ).limit(5).all()
                notify_ids.extend([admin.id for admin in admins])
        
        # Ensure creator is NOT in the stakeholder loop
        final_notify_ids = {tid for tid in notify_ids if tid != created_by_id}
        
        for target_id in final_notify_ids:
            NotificationService.create_notification(
                db=db,
                user_id=target_id,
                title="New Inventory Item",
                message=f"A new inventory item '{item_name}' has been added by {creator.full_name or creator.username}.",
                notification_type=NotificationType.INVENTORY_UPDATED,
                priority=NotificationPriority.LOW,
                action_url=f"/inventory/manage?item_id={item_id}",
                background_tasks=background_tasks
            )

    @staticmethod
    def notify_inventory_updated(
        db: Session,
        item_id: int,
        item_name: str,
        updated_by_id: int,
        changes: List[str] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when inventory item is updated"""
        try:
            # Get the item to find the owner
            item = inventory_crud.get(db, id=item_id)
            if not item:
                return

            notify_user_id = item.created_by_id
            
            # Don't notify self
            if notify_user_id == updated_by_id:
                return

            updater = user_crud.get(db, id=updated_by_id)
            updater_name = updater.full_name or updater.username if updater else "An admin"
            changes_text = ", ".join(changes) if changes else "updated"

            NotificationService.create_notification(
                db=db,
                user_id=notify_user_id,
                title="Inventory Item Updated",
                message=f"Your inventory item '{item_name}' has been {changes_text} by {updater_name}.",
                notification_type=NotificationType.INVENTORY_UPDATED,
                priority=NotificationPriority.LOW,
                action_url=f"/inventory/manage?item_id={item_id}",
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.error(f"Failed to send inventory update notification: {str(e)}", exc_info=True)

    @staticmethod
    def notify_sale_created(
        db: Session,
        sale_id: int,
        item_name: str,
        quantity: int,
        total_amount: float,
        created_by_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when a sale is created"""
        # Notify the creator
        NotificationService.create_notification(
            db=db,
            user_id=created_by_id,
            title="Sale Created",
            message=f"Sale for {quantity}x {item_name} (${total_amount:,.2f}) has been created successfully.",
            notification_type=NotificationType.SALE_CREATED,
            priority=NotificationPriority.MEDIUM,
            action_url=f"/sales/accounting?sale_id={sale_id}",
            background_tasks=background_tasks
        )
        
        creator = user_crud.get(db, id=created_by_id)
        notify_ids = []
        if creator and creator.manager_id:
            notify_ids.append(creator.manager_id)
            
            # Notifying other accountants in the team for awareness
            team_accountants = db.query(User).filter(
                User.role == UserRole.ACCOUNTANT,
                User.manager_id == creator.manager_id,
                User.is_active == True,
                User.id != created_by_id
            ).all()
            notify_ids.extend([acc.id for acc in team_accountants])
        
        # Notify subordinates if creator is a Finance Admin or Manager
        if creator and creator.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, creator.id)
            subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            notify_ids.extend(subordinate_ids)
        
        is_admin_creator = creator and creator.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
        if not is_admin_creator:
            # If no specific stakeholders identified, notify a few admins
            if not notify_ids:
                admins = db.query(User).filter(
                    User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                    User.is_active == True,
                    User.id != created_by_id
                ).limit(5).all()
                notify_ids.extend([admin.id for admin in admins])
        
        unique_ids = {tid for tid in notify_ids if tid != created_by_id}

        for target_id in list(unique_ids):
            NotificationService.create_notification(
                db=db,
                user_id=target_id,
                title="New Sale Pending",
                message=f"New sale for {quantity}x {item_name} (${total_amount:,.2f}) is pending posting to ledger.",
                notification_type=NotificationType.SALE_CREATED,
                priority=NotificationPriority.HIGH,
                action_url=f"/sales/accounting?sale_id={sale_id}",
                send_email=True,
                background_tasks=background_tasks
            )

    @staticmethod
    def notify_sale_posted_legacy(
        db: Session,
        sale_id: int,
        item_name: str,
        total_amount: float,
        posted_by_id: int,
        sold_by_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when a sale is posted to ledger"""
        # Redirect to the new one or keep it if needed. Actually it's duplicate of 559.
        return NotificationService.notify_sale_posted(db, sale_id, item_name, total_amount, posted_by_id, sold_by_id, background_tasks)
    
    @staticmethod
    def notify_pending_approvals(
        db: Session,
        approver_id: int,
        pending_count: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify approvers about pending approvals"""
        if pending_count > 0:
            # For this specific case, we might still want to check for existing unread notifications
            # and update the message instead of creating a new one (central dispatcher handles exact duplicates,
            # but here the "pending count" might change).
            from ..models.notification import Notification
            
            existing = db.query(Notification).filter(
                Notification.user_id == approver_id,
                Notification.type == NotificationType.APPROVAL_REQUEST,
                Notification.is_read == False,
                Notification.title == "Pending Approvals"
            ).order_by(Notification.created_at.desc()).first()
            
            message = f"You have {pending_count} pending approval{'s' if pending_count > 1 else ''} requiring your attention."
            
            if existing:
                if existing.message != message:
                    existing.message = message
                    existing.created_at = datetime.now(timezone.utc)
                    db.add(existing)
                    db.commit()
            else:
                NotificationService.create_notification(
                    db=db,
                    user_id=approver_id,
                    title="Pending Approvals",
                    message=message,
                    notification_type=NotificationType.APPROVAL_REQUEST,
                    priority=NotificationPriority.HIGH,
                    action_url="/approvals",
                    send_email=True,
                    background_tasks=background_tasks
                )

    @staticmethod
    def notify_user_created(
        db: Session,
        new_user_id: int,
        new_user_email: str,
        new_user_role: UserRole,
        created_by_id: int,
        created_by_name: str,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when a new user is created"""
        # Notify the newly created user
        NotificationService.create_notification(
            db=db,
            user_id=new_user_id,
            title="Welcome to the System",
            message=f"Your account has been created by {created_by_name}. Welcome aboard!",
            notification_type=NotificationType.SYSTEM_ALERT,
            priority=NotificationPriority.MEDIUM,
            action_url="/users/me",
            send_email=True,
            background_tasks=background_tasks
        )
        
        # Notify admins about new user creation
        admins = db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
            User.is_active == True,
            User.id != created_by_id
        ).all()
        
        for admin in admins:
            NotificationService.create_notification(
                db=db,
                user_id=admin.id,
                title="New User Created",
                message=f"A new {new_user_role.value} user '{new_user_email}' has been created by {created_by_name}.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url=f"/users/{new_user_id}",
                background_tasks=background_tasks
            )

    @staticmethod
    def notify_user_updated(
        db: Session,
        updated_user_id: int,
        updated_user_email: str,
        updated_by_id: int,
        updated_by_name: str,
        changes: List[str] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when a user is updated"""
        changes_text = ", ".join(changes) if changes else "your profile"
        NotificationService.create_notification(
            db=db,
            user_id=updated_user_id,
            title="Profile Updated",
            message=f"Your account has been updated by {updated_by_name}. Changes: {changes_text}.",
            notification_type=NotificationType.SYSTEM_ALERT,
            priority=NotificationPriority.LOW,
            action_url="/users/me",
            background_tasks=background_tasks
        )

    @staticmethod
    def notify_expense_rejected(
        db: Session,
        expense_id: int,
        expense_title: str,
        rejected_by_id: int,
        requester_id: int,
        rejection_reason: str = None,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when an expense is rejected"""
        reason_text = f" Reason: {rejection_reason}" if rejection_reason else ""
        NotificationService.create_notification(
            db=db,
            user_id=requester_id,
            title="Expense Rejected",
            message=f"Your expense '{expense_title}' has been rejected.{reason_text}",
            notification_type=NotificationType.APPROVAL_DECISION,
            priority=NotificationPriority.HIGH,
            action_url=f"/expenses/{expense_id}",
            send_email=True,
            background_tasks=background_tasks
        )

    @staticmethod
    def notify_revenue_approved(
        db: Session,
        revenue_id: int,
        revenue_title: str,
        approver_id: int,
        requester_id: int,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when revenue is approved"""
        NotificationService.create_notification(
            db=db,
            user_id=requester_id,
            title="Revenue Approved",
            message=f"Your revenue entry '{revenue_title}' has been approved.",
            notification_type=NotificationType.APPROVAL_DECISION,
            priority=NotificationPriority.MEDIUM,
            action_url=f"/revenue/{revenue_id}",
            send_email=True,
            background_tasks=background_tasks
        )

    @staticmethod
    def notify_revenue_rejected(
        db: Session,
        revenue_id: int,
        revenue_title: str,
        rejected_by_id: int,
        requester_id: int,
        rejection_reason: str = None,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when revenue is rejected"""
        reason_text = f" Reason: {rejection_reason}" if rejection_reason else ""
        NotificationService.create_notification(
            db=db,
            user_id=requester_id,
            title="Revenue Rejected",
            message=f"Your revenue entry '{revenue_title}' has been rejected.{reason_text}",
            notification_type=NotificationType.APPROVAL_DECISION,
            priority=NotificationPriority.HIGH,
            action_url=f"/revenue/{revenue_id}",
            send_email=True,
            background_tasks=background_tasks
        )

    @staticmethod
    def notify_approval_decision(
        db: Session,
        approval_id: int,
        approval_title: str,
        decision: str,
        approver_id: int,
        requester_id: int,
        rejection_reason: str = None,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify when an approval workflow is decided"""
        if decision.lower() == "approved":
            title = "Approval Granted"
            message = f"Your approval request '{approval_title}' has been approved."
            priority = NotificationPriority.MEDIUM
        else:
            title = "Approval Rejected"
            reason_text = f" Reason: {rejection_reason}" if rejection_reason else ""
            message = f"Your approval request '{approval_title}' has been rejected.{reason_text}"
            priority = NotificationPriority.HIGH
        
        NotificationService.create_notification(
            db=db,
            user_id=requester_id,
            title=title,
            message=message,
            notification_type=NotificationType.APPROVAL_DECISION,
            priority=priority,
            action_url=f"/approvals/{approval_id}",
            send_email=True,
            background_tasks=background_tasks
        )

    @staticmethod
    def notify_custom(
        db: Session,
        user_ids: List[int],
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Create custom notifications for any event"""
        for user_id in user_ids:
            NotificationService.create_notification(
                db=db,
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                action_url=action_url,
                send_email=send_email,
                background_tasks=background_tasks
            )

    @staticmethod
    def notify_by_role(
        db: Session,
        roles: List[UserRole],
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        send_email: bool = False,
        background_tasks: Optional[BackgroundTasks] = None
    ):
        """Notify all users with specific roles"""
        users = db.query(User).filter(
            User.role.in_(roles),
            User.is_active == True
        ).all()
        
        for user in users:
            NotificationService.create_notification(
                db=db,
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                action_url=action_url,
                send_email=send_email,
                background_tasks=background_tasks
            )
    
    @staticmethod
    def _get_approvers(db: Session, requester_id: int) -> List[User]:
        """Get list of approvers for a requester - prioritized by hierarchy"""
        try:
            requester = user_crud.get(db, id=requester_id)
            if not requester:
                return []
            
            approvers = []
            
            # 1. Primary Approver: The direct manager
            if requester.manager_id:
                manager = user_crud.get(db, id=requester.manager_id)
                if manager and manager.is_active:
                    approvers.append(manager)
            
            # 2. Secondary Approvers: Global Admins (limited)
            # SKIP if the requester is already an Admin or Super Admin to avoid noise
            is_admin_requester = requester.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
            
            if not is_admin_requester:
                admins = db.query(User).filter(
                    User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                    User.is_active == True,
                    User.id != requester_id
                ).limit(3).all()
                approvers.extend(admins)
            
            # 3. Fallback: If no manager and no admins (and not an admin themselves), include a few Finance Admins
            if not approvers and not is_admin_requester:
                finance_admins = db.query(User).filter(
                    User.role == UserRole.FINANCE_ADMIN,
                    User.is_active == True,
                    User.id != requester_id
                ).limit(3).all()
                approvers.extend(finance_admins)
            
            # Remove duplicates and ensure uniqueness
            id_to_user = {u.id: u for u in approvers}
            return list(id_to_user.values())
        except Exception as e:
            logger.error(f"Failed to get approvers: {str(e)}", exc_info=True)
            return []

