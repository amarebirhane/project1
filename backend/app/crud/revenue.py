from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import and_, or_, func # type: ignore[import-untyped]
from typing import Optional, List
from datetime import datetime, timezone
from ..models.revenue import RevenueEntry, RevenueCategory
from ..schemas.revenue import RevenueCreate, RevenueUpdate
from ..utils.permissions import check_permission


class CRUDRevenue:
    def get(self, db: Session, id: int) -> Optional[RevenueEntry]:
        return db.query(RevenueEntry).filter(RevenueEntry.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[RevenueEntry]:
        return db.query(RevenueEntry).offset(skip).limit(limit).all()

    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[RevenueEntry]:
        return db.query(RevenueEntry).filter(RevenueEntry.created_by_id == user_id).offset(skip).limit(limit).all()

    def get_by_date_range(self, db: Session, start_date: datetime, end_date: datetime, skip: int = 0, limit: int = 100) -> List[RevenueEntry]:
        return db.query(RevenueEntry).filter(
            and_(RevenueEntry.date >= start_date, RevenueEntry.date <= end_date)
        ).offset(skip).limit(limit).all()

    def get_by_category(self, db: Session, category: RevenueCategory, skip: int = 0, limit: int = 100) -> List[RevenueEntry]:
        return db.query(RevenueEntry).filter(RevenueEntry.category == category).offset(skip).limit(limit).all()

    def get_total_by_period(self, db: Session, start_date: datetime, end_date: datetime) -> float:
        """Get total revenue for period - ONLY approved entries"""
        result = db.query(func.sum(RevenueEntry.amount)).filter(
            and_(
                RevenueEntry.date >= start_date,
                RevenueEntry.date <= end_date,
                RevenueEntry.is_approved == True  # Only include approved revenue
            )
        ).scalar()
        return result or 0.0

    def get_summary_by_category(self, db: Session, start_date: datetime, end_date: datetime) -> List[dict]:
        """Get revenue summary by category - ONLY approved entries"""
        result = db.query(
            RevenueEntry.category,
            func.sum(RevenueEntry.amount).label('total'),
            func.count(RevenueEntry.id).label('count')
        ).filter(
            and_(
                RevenueEntry.date >= start_date,
                RevenueEntry.date <= end_date,
                RevenueEntry.is_approved == True  # Only include approved revenue
            )
        ).group_by(RevenueEntry.category).all()
        
        return [
            {"category": row.category, "total": row.total, "count": row.count}
            for row in result
        ]

    def create(self, db: Session, obj_in: RevenueCreate, created_by_id: int) -> RevenueEntry:
        db_obj = RevenueEntry(
            title=obj_in.title,
            description=obj_in.description,
            amount=float(obj_in.amount),
            category=obj_in.category,
            source=obj_in.source,
            date=obj_in.date,
            is_recurring=obj_in.is_recurring,
            recurring_frequency=obj_in.recurring_frequency,
            attachment_url=obj_in.attachment_url,
            created_by_id=created_by_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: RevenueEntry, obj_in: RevenueUpdate) -> RevenueEntry:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'amount' and value is not None:
                setattr(db_obj, field, float(value))
            else:
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> RevenueEntry:
        obj = db.query(RevenueEntry).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def approve(self, db: Session, id: int, approved_by_id: int) -> RevenueEntry:
        obj = db.query(RevenueEntry).get(id)
        if not obj:
            return None
            
        obj.is_approved = True
        obj.approved_by_id = approved_by_id
        obj.approved_at = datetime.now(timezone.utc)
        
        # --- Cohesive Accounting Integration ---
        from ..services.accounting_service import accounting_service
        from ..models.account import AccountType
        from ..models.journal_entry import ReferenceType

        # 1. Get Accounts (Dynamically)
        revenue_acc = accounting_service.get_account_for_category(
            db, "revenue", obj.category.lower() if obj.category else "other", "4000", "General Revenue", AccountType.REVENUE
        )
        debit_acc = accounting_service.get_account_for_category(
            db, "banking", "default", "1010", "Cash at Bank", AccountType.ASSET
        )

        # 2. Create Journal Entry
        lines = [
            {"account_id": debit_acc.id, "debit": float(obj.amount), "credit": 0.0, "description": f"Revenue Recv: {obj.title}"},
            {"account_id": revenue_acc.id, "debit": 0.0, "credit": float(obj.amount), "description": f"Revenue Category: {obj.category}"}
        ]

        accounting_service.create_journal_entry(
            db=db,
            description=f"Revenue Approval - {obj.title}",
            reference_type=ReferenceType.REVENUE,
            reference_id=obj.id,
            lines=lines,
            created_by_id=approved_by_id
        )
        # --------------------------------------

        db.commit()
        db.refresh(obj)
        return obj

    def get_pending_approval(self, db: Session, skip: int = 0, limit: int = 100) -> List[RevenueEntry]:
        return db.query(RevenueEntry).filter(RevenueEntry.is_approved == False).offset(skip).limit(limit).all()


revenue = CRUDRevenue()
