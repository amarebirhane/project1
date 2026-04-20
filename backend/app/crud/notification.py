from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import and_, or_, desc  # type: ignore[import-untyped]
from typing import Optional, List
from datetime import datetime, timezone
from ..models.notification import Notification, NotificationType, NotificationPriority
from ..schemas.notification import NotificationCreate, NotificationUpdate


class CRUDNotification:
    def get(self, db: Session, id: int) -> Optional[Notification]:
        return db.query(Notification).filter(Notification.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

    def get_unread(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).filter(
            and_(Notification.user_id == user_id, Notification.is_read == False)
        ).order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

    def get_by_type(self, db: Session, notification_type: NotificationType, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).filter(Notification.type == notification_type).order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

    def get_by_priority(self, db: Session, priority: NotificationPriority, skip: int = 0, limit: int = 100) -> List[Notification]:
        return db.query(Notification).filter(Notification.priority == priority).order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

    def get_unread_count(self, db: Session, user_id: int) -> int:
        try:
            return db.query(Notification).filter(
                and_(Notification.user_id == user_id, Notification.is_read == False)
            ).count()
        except Exception as e:
            # Log error and return 0 as safe default
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting unread count for user {user_id}: {str(e)}", exc_info=True)
            return 0

    def create(self, db: Session, obj_in: NotificationCreate) -> Notification:
        db_obj = Notification(
            user_id=obj_in.user_id,
            title=obj_in.title,
            message=obj_in.message,
            type=obj_in.type,
            priority=obj_in.priority,
            action_url=obj_in.action_url,
            expires_at=obj_in.expires_at,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def create_for_users(self, db: Session, user_ids: List[int], title: str, message: str, 
                         notification_type: NotificationType, priority: NotificationPriority = NotificationPriority.MEDIUM,
                         action_url: Optional[str] = None, expires_at: Optional[datetime] = None) -> List[Notification]:
        notifications = []
        for user_id in user_ids:
            db_obj = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                action_url=action_url,
                expires_at=expires_at,
            )
            db.add(db_obj)
            notifications.append(db_obj)
        
        db.commit()
        for notification in notifications:
            db.refresh(notification)
        
        return notifications

    def update(self, db: Session, db_obj: Notification, obj_in: NotificationUpdate) -> Notification:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def mark_as_read(self, db: Session, id: int) -> Notification:
        obj = db.query(Notification).get(id)
        obj.is_read = True
        obj.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(obj)
        return obj

    def mark_all_as_read(self, db: Session, user_id: int) -> int:
        """Mark all notifications for a user as read and return count of updated records"""
        unread_notifications = db.query(Notification).filter(
            and_(Notification.user_id == user_id, Notification.is_read == False)
        ).all()
        
        count = len(unread_notifications)
        for notification in unread_notifications:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
        
        db.commit()
        return count

    def delete(self, db: Session, id: int) -> Notification:
        obj = db.query(Notification).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def cleanup_expired(self, db: Session) -> int:
        """Delete expired notifications and return count of deleted records"""
        expired_notifications = db.query(Notification).filter(
            and_(Notification.expires_at < datetime.now(timezone.utc), Notification.expires_at.isnot(None))
        ).all()
        
        count = len(expired_notifications)
        for notification in expired_notifications:
            db.delete(notification)
        
        db.commit()
        return count


notification = CRUDNotification()
