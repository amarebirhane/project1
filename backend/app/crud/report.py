from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import and_, or_, desc # type: ignore[import-untyped]
from typing import Optional, List
from datetime import datetime, timedelta, timezone
from ..models.report import Report, ReportType, ReportStatus
from ..schemas.report import ReportCreate, ReportUpdate


class CRUDReport:
    def get(self, db: Session, id: int) -> Optional[Report]:
        return db.query(Report).filter(Report.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[Report]:
        return db.query(Report).offset(skip).limit(limit).all()

    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Report]:
        return db.query(Report).filter(Report.created_by_id == user_id).offset(skip).limit(limit).all()

    def get_by_type(self, db: Session, report_type: ReportType, skip: int = 0, limit: int = 100) -> List[Report]:
        return db.query(Report).filter(Report.type == report_type).offset(skip).limit(limit).all()

    def get_by_status(self, db: Session, status: ReportStatus, skip: int = 0, limit: int = 100) -> List[Report]:
        return db.query(Report).filter(Report.status == status).offset(skip).limit(limit).all()

    def get_public(self, db: Session, skip: int = 0, limit: int = 100) -> List[Report]:
        return db.query(Report).filter(Report.is_public == True).offset(skip).limit(limit).all()

    def get_recent(self, db: Session, days: int = 30, skip: int = 0, limit: int = 100) -> List[Report]:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        return db.query(Report).filter(
            Report.created_at >= cutoff_date
        ).order_by(desc(Report.created_at)).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: ReportCreate, created_by_id: int) -> Report:
        db_obj = Report(
            title=obj_in.title,
            description=obj_in.description,
            type=obj_in.type,
            status=ReportStatus.GENERATING,
            parameters=obj_in.parameters,
            is_public=obj_in.is_public,
            created_by_id=created_by_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Report, obj_in: ReportUpdate) -> Report:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def mark_completed(self, db: Session, id: int, file_url: str, file_size: int) -> Report:
        obj = db.query(Report).get(id)
        obj.status = ReportStatus.COMPLETED
        obj.file_url = file_url
        obj.file_size = file_size
        obj.generated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(obj)
        return obj

    def mark_failed(self, db: Session, id: int) -> Report:
        obj = db.query(Report).get(id)
        obj.status = ReportStatus.FAILED
        db.commit()
        db.refresh(obj)
        return obj

    def increment_download(self, db: Session, id: int) -> Report:
        obj = db.query(Report).get(id)
        obj.download_count += 1
        db.commit()
        db.refresh(obj)
        return obj

    def delete(self, db: Session, id: int) -> Report:
        obj = db.query(Report).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def cleanup_expired(self, db: Session) -> int:
        """Delete expired reports and return count of deleted records"""
        expired_reports = db.query(Report).filter(
            and_(Report.expires_at < datetime.now(timezone.utc), Report.expires_at.isnot(None))
        ).all()
        
        count = len(expired_reports)
        for report in expired_reports:
            db.delete(report)
        
        db.commit()
        return count


report = CRUDReport()
