from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List, Optional
from datetime import datetime, timedelta

from ...core.database import get_db
from ...crud.report import report as report_crud
from ...crud.user import user as user_crud
from ...schemas.report import ReportCreate, ReportUpdate, ReportOut
from ...models.user import User, UserRole
from ...models.report import ReportType, ReportStatus
from ...api.deps import get_current_active_user, require_min_role
from ...services.report import ReportService

router = APIRouter()


@router.get("", response_model=List[ReportOut])
def read_reports(
    skip: int = 0,
    limit: int = 100,
    report_type: Optional[ReportType] = Query(None),
    status: Optional[ReportStatus] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get reports with optional filtering"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Admins can see all reports
        if report_type:
            reports = report_crud.get_by_type(db, report_type, skip, limit)
        elif status:
            reports = report_crud.get_by_status(db, status, skip, limit)
        else:
            reports = report_crud.get_multi(db, skip, limit)
    elif current_user.role == UserRole.MANAGER:
        # Managers can see their own reports and public reports
        user_reports = report_crud.get_by_user(db, current_user.id, 0, 1000)
        public_reports = report_crud.get_public(db, 0, 1000)
        
        all_reports = user_reports + public_reports
        
        # Apply filters
        if report_type:
            all_reports = [r for r in all_reports if r.type == report_type]
        if status:
            all_reports = [r for r in all_reports if r.status == status]
        
        reports = all_reports[skip:skip + limit]
    elif current_user.role == UserRole.ACCOUNTANT:
        # Accountants can view revenue reports and financial reports
        # Get all reports that are revenue-related or public
        all_reports = report_crud.get_multi(db, 0, 1000)
        # Filter to show revenue reports, financial reports, and public reports
        revenue_report_types = [ReportType.REVENUE_REPORT, ReportType.FINANCIAL_SUMMARY, ReportType.PROFIT_LOSS]
        accountant_reports = [
            r for r in all_reports 
            if r.type in revenue_report_types or r.is_public or r.created_by_id == current_user.id
        ]
        
        # Apply filters
        if report_type:
            accountant_reports = [r for r in accountant_reports if r.type == report_type]
        if status:
            accountant_reports = [r for r in accountant_reports if r.status == status]
        
        reports = accountant_reports[skip:skip + limit]
    else:
        # Regular users can only see their own reports
        if report_type:
            all_reports = report_crud.get_by_type(db, report_type, 0, 1000)
        elif status:
            all_reports = report_crud.get_by_status(db, status, 0, 1000)
        else:
            all_reports = report_crud.get_multi(db, 0, 1000)
        
        user_reports = [r for r in all_reports if r.created_by_id == current_user.id]
        reports = user_reports[skip:skip + limit]
    
    return reports


@router.get("/{report_id}", response_model=ReportOut)
def read_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific report"""
    report = report_crud.get(db, id=report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can see their own reports and public reports
            if report.created_by_id != current_user.id and not report.is_public:
                raise HTTPException(status_code=403, detail="Not enough permissions")
        elif current_user.role == UserRole.ACCOUNTANT:
            # Accountants can see revenue reports, financial reports, and public reports
            revenue_report_types = [ReportType.REVENUE_REPORT, ReportType.FINANCIAL_SUMMARY, ReportType.PROFIT_LOSS]
            if report.type not in revenue_report_types and not report.is_public and report.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            # Regular users can only see their own reports
            if report.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return report


@router.post("", response_model=ReportOut)
def create_report(
    report_data: ReportCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new report request"""
    # Check if user can create this type of report
    if report_data.type in [ReportType.AUDIT_REPORT] and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions for this report type")
    
    report = report_crud.create(db, obj_in=report_data, created_by_id=current_user.id)
    
    # Add background task to generate report
    background_tasks.add_task(ReportService.generate_report, report.id)
    
    return report


@router.put("/{report_id}", response_model=ReportOut)
def update_report(
    report_id: int,
    report_update: ReportUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update report metadata"""
    report = report_crud.get(db, id=report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if report.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Cannot update status directly
    if report_update.status is not None:
        raise HTTPException(status_code=400, detail="Cannot update report status directly")
    
    return report_crud.update(db, db_obj=report, obj_in=report_update)


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete report"""
    report = report_crud.get(db, id=report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if report.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    report_crud.delete(db, id=report_id)
    return {"message": "Report deleted successfully"}


@router.post("/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download report file and increment download count"""
    report = report_crud.get(db, id=report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can download their own reports and public reports
            if report.created_by_id != current_user.id and not report.is_public:
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            # Regular users can only download their own reports
            if report.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if report.status != ReportStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Report is not ready for download")
    
    if not report.file_url:
        raise HTTPException(status_code=400, detail="Report file not available")
    
    # Increment download count
    report_crud.increment_download(db, report_id)
    
    return {
        "download_url": report.file_url,
        "file_size": report.file_size,
        "filename": f"{report.title}_{report.id}.pdf"
    }


@router.get("/types/available")
def get_available_report_types(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available report types based on user role"""
    all_types = [
        {"type": ReportType.FINANCIAL_SUMMARY, "name": "Financial Summary", "description": "Overview of financial performance"},
        {"type": ReportType.REVENUE_REPORT, "name": "Revenue Report", "description": "Detailed revenue analysis"},
        {"type": ReportType.EXPENSE_REPORT, "name": "Expense Report", "description": "Detailed expense analysis"},
        {"type": ReportType.PROFIT_LOSS, "name": "Profit & Loss", "description": "P&L statement"},
        {"type": ReportType.CASH_FLOW, "name": "Cash Flow", "description": "Cash flow analysis"},
        {"type": ReportType.BUDGET_VS_ACTUAL, "name": "Budget vs Actual", "description": "Budget comparison"},
    ]
    
    # Add admin-only reports
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        all_types.append({
            "type": ReportType.AUDIT_REPORT, 
            "name": "Audit Report", 
            "description": "System audit logs"
        })
    
    return {"report_types": all_types}


@router.post("/{report_id}/regenerate")
def regenerate_report(
    report_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Regenerate an existing report"""
    report = report_crud.get(db, id=report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if report.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    if report.status == ReportStatus.GENERATING:
        raise HTTPException(status_code=400, detail="Report is already being generated")
    
    # Reset status and regenerate
    report_crud.update(db, db_obj=report, obj_in=ReportUpdate(status=ReportStatus.GENERATING))
    background_tasks.add_task(ReportService.generate_report, report.id)
    
    return {"message": "Report regeneration started"}
