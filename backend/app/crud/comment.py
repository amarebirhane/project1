import re
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.comment import Comment
from ..models.user import User
from ..models.notification import NotificationType, NotificationPriority
from ..schemas.comment import CommentCreate, CommentUpdate
from ..services.notification_service import NotificationService

class CRUDComment:
    def get_comments(self, db: Session, source_type: str, source_id: int) -> List[Comment]:
        return db.query(Comment).filter(
            Comment.source_type == source_type,
            Comment.source_id == source_id
        ).order_by(desc(Comment.created_at)).all()

    def create(self, db: Session, obj_in: CommentCreate, user_id: int) -> Comment:
        db_obj = Comment(
            content=obj_in.content,
            source_type=obj_in.source_type,
            source_id=obj_in.source_id,
            user_id=user_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Detect mentions
        self._process_mentions(db, db_obj, user_id)
        
        return db_obj

    def _process_mentions(self, db: Session, comment: Comment, commenter_id: int):
        # Extract @username from content
        usernames = re.findall(r"@(\w+)", comment.content)
        if not usernames:
            return

        commenter = db.query(User).filter(User.id == commenter_id).first()
        commenter_name = commenter.username if commenter else "Someone"

        # Find mentioned users
        mentioned_users = db.query(User).filter(User.username.in_(usernames)).all()
        
        for user in mentioned_users:
            if user.id == commenter_id: # Self-mention optimization
                continue
                
            # Create notification
            resource_name = "Revenue" if "revenue" in comment.source_type else "Expense"
            action_url = f"/{comment.source_type.replace('_entries','')}/{comment.source_id}"
            
            NotificationService.create_notification(
                db=db,
                user_id=user.id,
                title="✨ New Mention in Comment",
                message=f"{commenter_name} mentioned you in a comment on {resource_name} #{comment.source_id}.",
                notification_type=NotificationType.COMMENT_MENTION,
                priority=NotificationPriority.MEDIUM,
                action_url=action_url,
                send_email=True
            )

comment_crud = CRUDComment()
