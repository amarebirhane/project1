from fastapi import APIRouter, Depends, HTTPException, status, Query # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import and_ # type: ignore[import-untyped]
from typing import List, Optional
import logging

from ...core.database import get_db
from ...crud.notification import notification as notification_crud
from ...crud.user import user as user_crud
from ...schemas.notification import NotificationOut, NotificationUpdate, NotificationPreferencesUpdate, NotificationPreferencesOut
from ...models.user import User, UserRole
from ...models.notification import Notification
from ...api.deps import get_current_active_user, require_min_role

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[NotificationOut])
def read_notifications(
    skip: int = 0,
    limit: int = 1000000,
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get notifications with advanced role-based access:
    - Admin/Super Admin: See all notifications
    - Finance Admin/Manager: See their own and subordinates' notifications
    - Accountant: Own notifications + sales made by employees (subordinates of manager)
    - Employee: Own notifications + internal items created by their Finance Admin (manager)
    """
    try:
        from ...models.notification import NotificationType
        from sqlalchemy import or_
        
        # Check for pending approvals and notify approvers periodically
        try:
            from ...services.notification_service import NotificationService
            from ...crud.approval import approval as approval_crud
            
            if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
                pending_approvals = approval_crud.get_pending(db, current_user.id, 0, 1000000)
                if pending_approvals:
                    NotificationService.notify_pending_approvals(
                        db=db,
                        approver_id=current_user.id,
                        pending_count=len(pending_approvals)
                    )
        except Exception as e:
            logger.warning(f"Failed to check pending approvals: {str(e)}")
        
        query = db.query(Notification)
        
        # Baseline: Users only see their own notifications.
        # Role-based broadcasting is handled at creation time by NotificationService.
        # This prevents duplication where a manager sees both their own alert and their subordinate's success message.
        query = db.query(Notification).filter(Notification.user_id == current_user.id)
            
        # Apply shared filters
        if unread_only:
            query = query.filter(Notification.is_read == False)
            
        notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()
        return notifications
        
    except Exception as e:
        logger.error(f"Error fetching notifications for user {current_user.id}: {str(e)}", exc_info=True)
        return []


@router.post("/check-pending-approvals")
def check_pending_approvals(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Trigger a check for pending approvals and generate notifications"""
    try:
        from ...services.notification_service import NotificationService
        from ...crud.approval import approval as approval_crud
        from ...models.user import UserRole
        
        # Only check for managers, finance admins, and admins
        if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            # Use query to get pending count efficiently
            pending_approvals = approval_crud.get_pending(db, current_user.id, 0, 1000)
            
            if pending_approvals:
                NotificationService.notify_pending_approvals(
                    db=db,
                    approver_id=current_user.id,
                    pending_count=len(pending_approvals)
                )
        
        return {"message": "Pending approvals check completed"}
    except Exception as e:
        logger.error(f"Error checking pending approvals for user {current_user.id}: {str(e)}", exc_info=True)
        # Return success to avoid frontend errors for background tasks
        return {"message": "Check completed with errors"}


@router.get("/unread/count")
def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications with advanced role-based access:
    - Admin/Super Admin: Count all unread
    - Finance Admin/Manager: Count for self and subordinates
    - Accountant: Own + sales by employees
    - Employee: Own + items by manager
    """
    try:
        from ...models.notification import NotificationType
        from sqlalchemy import or_
        
        # Only count notifications directly assigned to the current user
        query = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
            
        count = query.count()
        return {"unread_count": count}
    except Exception as e:
        logger.error(f"Error fetching unread notification count for user {current_user.id}: {str(e)}", exc_info=True)
        return {"unread_count": 0}


@router.get("/preferences", response_model=dict)
def get_notification_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's notification preferences"""
    try:
        from ...schemas.notification import NotificationPreferencesOut, QuietHours
        from datetime import datetime
        
        # Default preferences structure matching frontend
        default_preferences = {
            "notificationPreferences": {
                "claims": {"email": True, "sms": False, "app": True, "push": True},
                "appointments": {"email": True, "sms": True, "app": True, "push": True},
                "messages": {"email": True, "sms": False, "app": True, "push": True},
                "billing": {"email": True, "sms": False, "app": True, "push": False},
                "policy": {"email": True, "sms": False, "app": True, "push": False},
                "marketing": {"email": False, "sms": False, "app": False, "push": False},
                "system": {"email": True, "sms": False, "app": True, "push": False}
            },
            "doNotDisturb": False,
            "quietHours": {"enabled": False, "startTime": "22:00", "endTime": "08:00"}
        }
        
        # Get user's preferences from database
        if current_user.notification_preferences:
            user_prefs = current_user.notification_preferences
            # Merge with defaults to ensure all fields are present
            result = {
                "notificationPreferences": {
                    **default_preferences["notificationPreferences"],
                    **(user_prefs.get("notificationPreferences", {}) or {})
                },
                "doNotDisturb": user_prefs.get("doNotDisturb", False),
                "quietHours": {
                    **default_preferences["quietHours"],
                    **(user_prefs.get("quietHours", {}) or {})
                },
                "lastUpdated": user_prefs.get("lastUpdated")
            }
            return result
        
        return {
            **default_preferences,
            "lastUpdated": None
        }
    except Exception as e:
        logger.error(f"Unexpected error in get_notification_preferences: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notification preferences: {str(e)}"
        )


@router.put("/preferences", response_model=dict)
def update_notification_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's notification preferences"""
    try:
        from datetime import datetime
        
        # Validate and structure the preferences
        notification_prefs = {
            "notificationPreferences": preferences.get("notificationPreferences", {}),
            "doNotDisturb": preferences.get("doNotDisturb", False),
            "quietHours": preferences.get("quietHours", {
                "enabled": False,
                "startTime": "22:00",
                "endTime": "08:00"
            }),
            "lastUpdated": datetime.now(timezone.utc).isoformat()
        }
        
        # Update user's notification preferences
        current_user.notification_preferences = notification_prefs
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Notification preferences updated successfully",
            "preferences": notification_prefs
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in update_notification_preferences: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification preferences: {str(e)}"
        )


@router.delete("/cleanup")
def cleanup_notifications(
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Clean up expired notifications (super admin only)"""
    try:
        count = notification_crud.cleanup_expired(db)
        return {"message": f"Cleaned up {count} expired notifications"}
    except Exception as e:
        logger.error(f"Unexpected error in cleanup_notifications: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup notifications: {str(e)}"
        )


@router.get("/{notification_id}", response_model=NotificationOut)
def read_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific notification with role-based access:
    - Admin/Super Admin: Can access any notification
    - Finance Admin/Manager: Can access notifications for themselves and subordinates
    - Others: Can only access their own notifications
    """
    try:
        notification = notification_crud.get(db, id=notification_id)
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Admin/Super Admin can access any notification
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return notification
        
        # Self access - always allowed
        if notification.user_id == current_user.id:
            return notification
        
        # Finance Admin/Manager can access notifications for their subordinates
        # IMPORTANT: They should ONLY see accountants and employees, NOT other Finance Admins/Managers
        if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
            valid_subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            if notification.user_id in valid_subordinate_ids:
                return notification
        
        # If we reach here, user doesn't have permission
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in read_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notification: {str(e)}"
        )


@router.put("/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update notification (mark as read/unread) with role-based access:
    - Admin/Super Admin: Can update any notification
    - Finance Admin/Manager: Can update notifications for themselves and subordinates
    - Others: Can only update their own notifications
    """
    try:
        notification = notification_crud.get(db, id=notification_id)
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Admin/Super Admin can update any notification
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return notification_crud.update(db, db_obj=notification, obj_in=notification_update)
        
        # Self access - always allowed
        if notification.user_id == current_user.id:
            return notification_crud.update(db, db_obj=notification, obj_in=notification_update)
        
        # Finance Admin/Manager can update notifications for their subordinates
        # IMPORTANT: They should ONLY see accountants and employees, NOT other Finance Admins/Managers
        if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
            valid_subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            if notification.user_id in valid_subordinate_ids:
                return notification_crud.update(db, db_obj=notification, obj_in=notification_update)
        
        # If we reach here, user doesn't have permission
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification: {str(e)}"
        )


@router.post("/{notification_id}/mark-read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read with role-based access:
    - Admin/Super Admin: Can mark any notification as read
    - Finance Admin/Manager: Can mark notifications for themselves and subordinates as read
    - Others: Can only mark their own notifications as read
    """
    try:
        notification = notification_crud.get(db, id=notification_id)
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Admin/Super Admin can mark any notification as read
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            notification_crud.mark_as_read(db, notification_id)
            return {"message": "Notification marked as read"}
        
        # Self access - always allowed
        if notification.user_id == current_user.id:
            notification_crud.mark_as_read(db, notification_id)
            return {"message": "Notification marked as read"}
        
        # Finance Admin/Manager can mark notifications for their subordinates as read
        # IMPORTANT: They should ONLY see accountants and employees, NOT other Finance Admins/Managers
        if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
            valid_subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            if notification.user_id in valid_subordinate_ids:
                notification_crud.mark_as_read(db, notification_id)
                return {"message": "Notification marked as read"}
        
        # If we reach here, user doesn't have permission
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in mark_notification_as_read: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification as read: {str(e)}"
        )


@router.post("/mark-all-read")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    try:
        count = notification_crud.mark_all_as_read(db, current_user.id)
        return {"message": f"Marked {count} notifications as read"}
    except Exception as e:
        logger.error(f"Unexpected error in mark_all_notifications_as_read: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark all notifications as read: {str(e)}"
        )


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete notification with role-based access:
    - Admin/Super Admin: Can delete any notification
    - Finance Admin/Manager: Can delete notifications for themselves and subordinates
    - Others: Can only delete their own notifications
    """
    try:
        notification = notification_crud.get(db, id=notification_id)
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Admin/Super Admin can delete any notification
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            notification_crud.delete(db, notification_id)
            return {"message": "Notification deleted successfully"}
        
        # Self access - always allowed
        if notification.user_id == current_user.id:
            notification_crud.delete(db, notification_id)
            return {"message": "Notification deleted successfully"}
        
        # Finance Admin/Manager can delete notifications for their subordinates
        if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            subordinate_ids = [sub.id for sub in subordinates]
            if notification.user_id in subordinate_ids:
                notification_crud.delete(db, notification_id)
                return {"message": "Notification deleted successfully"}
        
        # If we reach here, user doesn't have permission
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in delete_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete notification: {str(e)}"
        )


@router.post("/create-broadcast")
def create_broadcast_notification(
    title: str,
    message: str,
    target_roles: List[UserRole] = Query(...),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Create broadcast notification for users with specific roles (admin only)"""
    try:
        from ...models.notification import NotificationType, NotificationPriority
        
        # Get all users with target roles
        users = []
        for role in target_roles:
            try:
                role_users = db.query(User).filter(User.role == role, User.is_active == True).all()
                users.extend(role_users)
            except Exception as e:
                logger.error(f"Error fetching users for role {role}: {str(e)}", exc_info=True)
                # Continue with other roles even if one fails
        
        # Remove duplicates
        user_ids = list(set([user.id for user in users]))
        
        if not user_ids:
            return {
                "message": "No active users found for the specified roles",
                "target_roles": target_roles,
                "recipients": 0
            }
        
        # Create notifications for all target users
        notifications = notification_crud.create_for_users(
            db=db,
            user_ids=user_ids,
            title=title,
            message=message,
            notification_type=NotificationType.SYSTEM_ALERT,
            priority=NotificationPriority.HIGH
        )
        
        return {
            "message": f"Broadcast notification sent to {len(notifications)} users",
            "target_roles": target_roles,
            "recipients": len(notifications)
        }
    except Exception as e:
        logger.error(f"Unexpected error in create_broadcast_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create broadcast notification: {str(e)}"
        )


@router.post("/create")
def create_notification(
    user_ids: List[int] = Query(..., description="List of user IDs to notify"),
    title: str = Query(..., description="Notification title"),
    message: str = Query(..., description="Notification message"),
    notification_type: str = Query("system_alert", description="Notification type"),
    priority: str = Query("medium", description="Notification priority: low, medium, high, urgent"),
    action_url: Optional[str] = Query(None, description="Optional action URL"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create custom notification for any event - generic endpoint for pushing notifications for anything"""
    try:
        from ...models.notification import NotificationType, NotificationPriority
        from ...services.notification_service import NotificationService
        
        # Validate notification type
        try:
            notif_type = NotificationType(notification_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid notification type. Allowed: {[e.value for e in NotificationType]}"
            )
        
        # Validate priority
        try:
            notif_priority = NotificationPriority(priority.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Allowed: low, medium, high, urgent"
            )
        
        # Verify users exist
        from ...crud.user import user as user_crud
        valid_user_ids = []
        for user_id in user_ids:
            user = user_crud.get(db, id=user_id)
            if user and user.is_active:
                valid_user_ids.append(user_id)
        
        if not valid_user_ids:
            raise HTTPException(
                status_code=400,
                detail="No valid active users found for the provided user IDs"
            )
        
        # Create notifications
        notifications = NotificationService.notify_custom(
            db=db,
            user_ids=valid_user_ids,
            title=title,
            message=message,
            notification_type=notif_type,
            priority=notif_priority,
            action_url=action_url
        )
        
        return {
            "message": f"Notifications created successfully",
            "notifications_sent": len(notifications),
            "recipients": valid_user_ids
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in create_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create notification: {str(e)}"
        )


@router.post("/create-by-role")
def create_notification_by_role(
    roles: List[str] = Query(..., description="List of user roles to notify"),
    title: str = Query(..., description="Notification title"),
    message: str = Query(..., description="Notification message"),
    notification_type: str = Query("system_alert", description="Notification type"),
    priority: str = Query("medium", description="Notification priority: low, medium, high, urgent"),
    action_url: Optional[str] = Query(None, description="Optional action URL"),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Create notifications for all users with specific roles"""
    try:
        from ...models.notification import NotificationType, NotificationPriority
        from ...models.user import UserRole
        from ...services.notification_service import NotificationService
        
        # Validate notification type
        try:
            notif_type = NotificationType(notification_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid notification type. Allowed: {[e.value for e in NotificationType]}"
            )
        
        # Validate priority
        try:
            notif_priority = NotificationPriority(priority.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority. Allowed: low, medium, high, urgent"
            )
        
        # Convert role strings to UserRole enum
        user_roles = []
        for role_str in roles:
            try:
                role = UserRole(role_str.lower())
                user_roles.append(role)
            except ValueError:
                logger.warning(f"Invalid role: {role_str}, skipping")
        
        if not user_roles:
            raise HTTPException(
                status_code=400,
                detail="No valid roles provided"
            )
        
        # Create notifications
        NotificationService.notify_by_role(
            db=db,
            roles=user_roles,
            title=title,
            message=message,
            notification_type=notif_type,
            priority=notif_priority,
            action_url=action_url
        )
        
        return {
            "message": f"Notifications sent to users with roles: {[r.value for r in user_roles]}",
            "target_roles": [r.value for r in user_roles]
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in create_notification_by_role: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create notifications: {str(e)}"
        )