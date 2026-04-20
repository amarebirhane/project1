from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import and_, or_ # type: ignore[import-untyped]
from typing import Optional, List
from datetime import datetime, timezone
from ..models.approval import ApprovalWorkflow, ApprovalComment, ApprovalStatus, ApprovalType
from ..schemas.approval import ApprovalCreate, ApprovalUpdate, ApprovalCommentCreate


class CRUDApproval:
    def get(self, db: Session, id: int) -> Optional[ApprovalWorkflow]:
        return db.query(ApprovalWorkflow).filter(ApprovalWorkflow.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[ApprovalWorkflow]:
        return db.query(ApprovalWorkflow).offset(skip).limit(limit).all()

    def get_by_requester(self, db: Session, requester_id: int, skip: int = 0, limit: int = 100) -> List[ApprovalWorkflow]:
        return db.query(ApprovalWorkflow).filter(ApprovalWorkflow.requester_id == requester_id).offset(skip).limit(limit).all()

    def get_by_approver(self, db: Session, approver_id: int, skip: int = 0, limit: int = 100) -> List[ApprovalWorkflow]:
        return db.query(ApprovalWorkflow).filter(ApprovalWorkflow.approver_id == approver_id).offset(skip).limit(limit).all()

    def get_by_status(self, db: Session, status: ApprovalStatus, skip: int = 0, limit: int = 100) -> List[ApprovalWorkflow]:
        return db.query(ApprovalWorkflow).filter(ApprovalWorkflow.status == status).offset(skip).limit(limit).all()

    def get_pending(self, db: Session, approver_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[ApprovalWorkflow]:
        query = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.status == ApprovalStatus.PENDING)
        if approver_id:
            query = query.filter(ApprovalWorkflow.approver_id == approver_id)
        return query.offset(skip).limit(limit).all()

    def get_by_revenue_entry(self, db: Session, revenue_entry_id: int) -> Optional[ApprovalWorkflow]:
        """Find approval workflow by revenue entry ID"""
        return db.query(ApprovalWorkflow).filter(
            ApprovalWorkflow.revenue_entry_id == revenue_entry_id
        ).first()

    def get_by_expense_entry(self, db: Session, expense_entry_id: int) -> Optional[ApprovalWorkflow]:
        """Find approval workflow by expense entry ID"""
        return db.query(ApprovalWorkflow).filter(
            ApprovalWorkflow.expense_entry_id == expense_entry_id
        ).first()

    def create(self, db: Session, obj_in: ApprovalCreate, requester_id: int) -> ApprovalWorkflow:
        db_obj = ApprovalWorkflow(
            title=obj_in.title,
            description=obj_in.description,
            type=obj_in.type,
            requester_id=requester_id,
            revenue_entry_id=obj_in.revenue_entry_id,
            expense_entry_id=obj_in.expense_entry_id,
            priority=obj_in.priority,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ApprovalWorkflow, obj_in: ApprovalUpdate) -> ApprovalWorkflow:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def approve(self, db: Session, id: int, approver_id: int) -> ApprovalWorkflow:
        obj = db.query(ApprovalWorkflow).get(id)
        obj.status = ApprovalStatus.APPROVED
        obj.approver_id = approver_id
        obj.approved_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(obj)
        return obj

    def reject(self, db: Session, id: int, approver_id: int, rejection_reason: str) -> ApprovalWorkflow:
        obj = db.query(ApprovalWorkflow).get(id)
        obj.status = ApprovalStatus.REJECTED
        obj.approver_id = approver_id
        obj.rejection_reason = rejection_reason
        db.commit()
        db.refresh(obj)
        return obj

    def cancel(self, db: Session, id: int) -> ApprovalWorkflow:
        obj = db.query(ApprovalWorkflow).get(id)
        obj.status = ApprovalStatus.CANCELLED
        db.commit()
        db.refresh(obj)
        return obj

    def delete(self, db: Session, id: int) -> ApprovalWorkflow:
        obj = db.query(ApprovalWorkflow).get(id)
        db.delete(obj)
        db.commit()
        return obj


class CRUDApprovalComment:
    def get(self, db: Session, id: int) -> Optional[ApprovalComment]:
        return db.query(ApprovalComment).filter(ApprovalComment.id == id).first()

    def get_by_workflow(self, db: Session, workflow_id: int) -> List[ApprovalComment]:
        return db.query(ApprovalComment).filter(ApprovalComment.workflow_id == workflow_id).all()

    def create(self, db: Session, obj_in: ApprovalCommentCreate, user_id: int) -> ApprovalComment:
        db_obj = ApprovalComment(
            workflow_id=obj_in.workflow_id,
            user_id=user_id,
            comment=obj_in.comment,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> ApprovalComment:
        obj = db.query(ApprovalComment).get(id)
        db.delete(obj)
        db.commit()
        return obj


approval = CRUDApproval()
approval_comment = CRUDApprovalComment()