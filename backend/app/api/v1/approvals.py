from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List, Optional 
from pydantic import BaseModel # type: ignore[import-untyped]
import logging

from ...core.database import get_db

logger = logging.getLogger(__name__)
from ...crud.approval import approval as approval_crud, approval_comment
from ...crud.user import user as user_crud
from ...schemas.approval import ApprovalCreate, ApprovalUpdate, ApprovalOut, ApprovalCommentCreate, ApprovalCommentOut
from ...models.user import User, UserRole
from ...models.approval import ApprovalStatus, ApprovalType
from ...api.deps import get_current_active_user, require_min_role
from ...core.security import verify_password

router = APIRouter()


@router.get("", response_model=List[ApprovalOut])
def read_approvals(
    skip: int = 0,
    limit: int = 100,
    status: Optional[ApprovalStatus] = Query(None),
    type: Optional[ApprovalType] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get approval workflows with optional filtering"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Admins can see all approvals
        if status:
            approvals = approval_crud.get_by_status(db, status, skip, limit)
        elif type:
            approvals = [a for a in approval_crud.get_multi(db, 0, 1000) if a.type == type]
            approvals = approvals[skip:skip + limit]
        else:
            approvals = approval_crud.get_multi(db, skip, limit)
    elif current_user.role == UserRole.MANAGER:
        # Managers can see approvals they requested and need to approve
        requested_approvals = approval_crud.get_by_requester(db, current_user.id, 0, 1000)
        to_approve = approval_crud.get_pending(db, current_user.id, 0, 1000)
        
        all_approvals = requested_approvals + to_approve
        
        # Apply filters
        if status:
            all_approvals = [a for a in all_approvals if a.status == status]
        if type:
            all_approvals = [a for a in all_approvals if a.type == type]
        
        # Sort by created date
        all_approvals.sort(key=lambda x: x.created_at, reverse=True)
        approvals = all_approvals[skip:skip + limit]
    else:
        # Regular users can only see their own approval requests
        if status:
            approvals = approval_crud.get_by_status(db, status, 0, 1000)
        elif type:
            approvals = [a for a in approval_crud.get_multi(db, 0, 1000) if a.type == type]
        else:
            approvals = approval_crud.get_multi(db, 0, 1000)
        
        user_approvals = [a for a in approvals if a.requester_id == current_user.id]
        approvals = user_approvals[skip:skip + limit]
    
    return approvals


@router.get("/{approval_id}", response_model=ApprovalOut)
def read_approval(
    approval_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific approval workflow"""
    approval = approval_crud.get(db, id=approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval workflow not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can see their own requests and requests they need to approve
            if (approval.requester_id != current_user.id and 
                approval.approver_id != current_user.id and
                approval.status != ApprovalStatus.PENDING):
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            # Regular users can only see their own requests
            if approval.requester_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return approval


@router.post("", response_model=ApprovalOut)
def create_approval(
    approval_data: ApprovalCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new approval workflow"""
    try:
        # Users can create approval requests for their revenue/expense entries
        if approval_data.revenue_entry_id:
            from ...crud.revenue import revenue as revenue_crud
            revenue_entry = revenue_crud.get(db, approval_data.revenue_entry_id)
            if not revenue_entry:
                raise HTTPException(status_code=404, detail="Revenue entry not found")
            if revenue_entry.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
            if revenue_entry.is_approved:
                raise HTTPException(status_code=400, detail="Revenue entry already approved")
        
        if approval_data.expense_entry_id:
            from ...crud.expense import expense as expense_crud
            expense_entry = expense_crud.get(db, approval_data.expense_entry_id)
            if not expense_entry:
                raise HTTPException(status_code=404, detail="Expense entry not found")
            if expense_entry.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
            if expense_entry.is_approved:
                raise HTTPException(status_code=400, detail="Expense entry already approved")
        
        approval = approval_crud.create(db, obj_in=approval_data, requester_id=current_user.id)
        return approval
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in create_approval: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create approval: {str(e)}"
        )


@router.put("/{approval_id}", response_model=ApprovalOut)
def update_approval(
    approval_id: int,
    approval_update: ApprovalUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update approval workflow"""
    approval = approval_crud.get(db, id=approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval workflow not found")
    
    # Check permissions - only requester can update title/description
    if approval.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only requester can update approval details")
    
    # Cannot update status directly
    if approval_update.status is not None:
        raise HTTPException(status_code=400, detail="Cannot update status directly. Use approve/reject endpoints.")
    
    return approval_crud.update(db, db_obj=approval, obj_in=approval_update)


@router.post("/{approval_id}/approve")
def approve_approval(
    approval_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Approve an approval workflow"""
    approval = approval_crud.get(db, id=approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval workflow not found")
    
    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Approval is not pending")
    
    # Check if user can approve (manager of requester or admin)
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Manager can approve if requester is their subordinate
        subordinates = user_crud.get_hierarchy(db, current_user.id)
        subordinate_ids = [sub.id for sub in subordinates]
        if approval.requester_id not in subordinate_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions to approve this request")
    
    # Approve the workflow
    approved_approval = approval_crud.approve(db, approval_id, current_user.id)
    
    # Also approve the associated revenue/expense entry
    if approved_approval.revenue_entry_id:
        from ...crud.revenue import revenue as revenue_crud
        revenue_crud.approve(db, approved_approval.revenue_entry_id, current_user.id)
    
    if approved_approval.expense_entry_id:
        from ...crud.expense import expense as expense_crud
        expense_crud.approve(db, approved_approval.expense_entry_id, current_user.id)
    
    # Send notification about approval decision
    try:
        from ...services.notification_service import NotificationService
        NotificationService.notify_approval_decision(
            db=db,
            approval_id=approval_id,
            approval_title=approved_approval.title,
            decision="approved",
            approver_id=current_user.id,
            requester_id=approved_approval.requester_id,
            background_tasks=background_tasks
        )
    except Exception as e:
        logger.warning(f"Notification failed for approval: {str(e)}")
    
    return {"message": "Approval approved successfully"}


class RejectApprovalRequest(BaseModel):
    rejection_reason: str
    password: str

@router.post("/{approval_id}/reject")
def reject_approval(
    approval_id: int,
    reject_request: RejectApprovalRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Reject an approval workflow - requires password verification"""
    # Reload current user from database to ensure we have the password hash
    db_user_for_auth = db.query(User).filter(User.id == current_user.id).first()
    if not db_user_for_auth:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    # Validate that password hash exists
    if not db_user_for_auth.hashed_password:
        raise HTTPException(
            status_code=500,
            detail="User password hash not found. Please contact administrator."
        )
    
    # Verify password before rejection
    if not reject_request.password or not reject_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to reject an approval."
        )
    
    # Verify password
    password_to_verify = reject_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to reject this approval."
        )
    
    approval = approval_crud.get(db, id=approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval workflow not found")
    
    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Approval is not pending")
    
    # Check if user can reject (manager of requester or admin)
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Manager can reject if requester is their subordinate
        subordinates = user_crud.get_hierarchy(db, current_user.id)
        subordinate_ids = [sub.id for sub in subordinates]
        if approval.requester_id not in subordinate_ids:
            raise HTTPException(status_code=403, detail="Not enough permissions to reject this request")
    
    rejected_approval = approval_crud.reject(db, approval_id, current_user.id, reject_request.rejection_reason)
    
    # Send notification about rejection
    try:
        from ...services.notification_service import NotificationService
        NotificationService.notify_approval_decision(
            db=db,
            approval_id=approval_id,
            approval_title=rejected_approval.title,
            decision="rejected",
            approver_id=current_user.id,
            requester_id=rejected_approval.requester_id,
            rejection_reason=reject_request.rejection_reason,
            background_tasks=background_tasks
        )
    except Exception as e:
        logger.warning(f"Notification failed for approval rejection: {str(e)}")
    
    return {"message": "Approval rejected successfully"}


@router.post("/{approval_id}/cancel")
def cancel_approval(
    approval_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel an approval workflow"""
    approval = approval_crud.get(db, id=approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval workflow not found")
    
    # Only requester can cancel
    if approval.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only requester can cancel approval")
    
    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cannot cancel approval that is not pending")
    
    approval_crud.cancel(db, approval_id)
    return {"message": "Approval cancelled successfully"}


@router.get("/{approval_id}/comments", response_model=List[ApprovalCommentOut])
def get_approval_comments(
    approval_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comments for an approval workflow"""
    approval = approval_crud.get(db, id=approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval workflow not found")
    
    # Check permissions (same as viewing approval)
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            if (approval.requester_id != current_user.id and 
                approval.approver_id != current_user.id and
                approval.status != ApprovalStatus.PENDING):
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            if approval.requester_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    comments = approval_comment.get_by_workflow(db, approval_id)
    return comments


@router.post("/{approval_id}/comments", response_model=ApprovalCommentOut)
def create_approval_comment(
    approval_id: int,
    comment_data: ApprovalCommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add comment to approval workflow"""
    approval = approval_crud.get(db, id=approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval workflow not found")
    
    # Check permissions (same as viewing approval)
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            if (approval.requester_id != current_user.id and 
                approval.approver_id != current_user.id and
                approval.status != ApprovalStatus.PENDING):
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            if approval.requester_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    comment_data.workflow_id = approval_id
    comment = approval_comment.create(db, obj_in=comment_data, user_id=current_user.id)
    return comment


@router.get("/pending/my-requests", response_model=List[ApprovalOut])
def get_my_pending_requests(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's pending approval requests"""
    approvals = approval_crud.get_by_requester(db, current_user.id, skip, limit)
    pending_approvals = [a for a in approvals if a.status == ApprovalStatus.PENDING]
    return pending_approvals


@router.get("/pending/to-approve", response_model=List[ApprovalOut])
def get_pending_to_approve(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Get approvals pending for current user to approve"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Admins can see all pending approvals
        approvals = approval_crud.get_pending(db, skip, limit)
    else:
        # Managers can see pending approvals from their subordinates
        all_pending = approval_crud.get_pending(db, 0, 1000)
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        manager_pending = [a for a in all_pending if a.requester_id in subordinate_ids]
        approvals = manager_pending[skip:skip + limit]
    
    return approvals