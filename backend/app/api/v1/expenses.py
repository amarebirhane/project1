from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List, Optional
from datetime import datetime
import logging

from ...core.database import get_db

logger = logging.getLogger(__name__)
from ...crud.expense import expense as expense_crud
from ...crud.user import user as user_crud
from ...crud.approval import approval as approval_crud
from ...schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut, ExpenseSummary
from ...models.user import User, UserRole
from ...models.approval import ApprovalStatus
from ...api.deps import get_current_active_user, require_min_role
from ...core.security import verify_password
from pydantic import BaseModel # type: ignore[import-untyped]
from ...utils.audit import AuditLogger, AuditAction
from ...api.v1.auth import get_client_info

router = APIRouter()


@router.get("", response_model=List[ExpenseOut])
def read_expense_entries(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    category: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get expense entries with optional filtering"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Admins can see all entries
        # For reports, allow fetching all data by using a very high limit
        effective_limit = limit if limit <= 10000 else 10000
        if start_date and end_date:
            entries = expense_crud.get_by_date_range(db, start_date, end_date, skip, effective_limit)
        elif category:
            entries = expense_crud.get_by_category(db, category, skip, effective_limit)
        elif vendor:
            entries = expense_crud.get_by_vendor(db, vendor, skip, effective_limit)
        else:
            entries = expense_crud.get_multi(db, skip, effective_limit)
    elif current_user.role == UserRole.FINANCE_ADMIN:
        # Finance Admin: See only their own entries and their subordinates' entries
        # IMPORTANT: Only include accountants and employees, NOT other Finance Admins
        from ...crud.user import user as user_crud
        try:
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
            valid_subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            subordinate_ids = [current_user.id] + valid_subordinate_ids
        except Exception as e:
            logger.error(f"Error fetching hierarchy for Finance Admin: {str(e)}")
            subordinate_ids = [current_user.id]
        
        if start_date and end_date:
            all_entries = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        elif category:
            all_entries = expense_crud.get_by_category(db, category, 0, 1000)
        elif vendor:
            all_entries = expense_crud.get_by_vendor(db, vendor, 0, 1000)
        else:
            all_entries = expense_crud.get_multi(db, 0, 1000)
        
        entries = [entry for entry in all_entries if entry.created_by_id in subordinate_ids]
        entries = entries[skip:skip + limit]
    elif current_user.role == UserRole.MANAGER:
        # Managers can see their own entries and their subordinates' entries
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        subordinate_ids.append(current_user.id)
        
        if start_date and end_date:
            all_entries = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        elif category:
            all_entries = expense_crud.get_by_category(db, category, 0, 1000)
        elif vendor:
            all_entries = expense_crud.get_by_vendor(db, vendor, 0, 1000)
        else:
            all_entries = expense_crud.get_multi(db, 0, 1000)
        
        entries = [entry for entry in all_entries if entry.created_by_id in subordinate_ids]
        entries = entries[skip:skip + limit]
    elif current_user.role == UserRole.ACCOUNTANT:
        # Accountant: See ONLY their own entries
        # Accountants do NOT see Finance Admin's entries, other accountants' entries, or employees' entries
        subordinate_ids = [current_user.id]  # Only themselves
        
        if start_date and end_date:
            all_entries = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        elif category:
            all_entries = expense_crud.get_by_category(db, category, 0, 1000)
        elif vendor:
            all_entries = expense_crud.get_by_vendor(db, vendor, 0, 1000)
        else:
            all_entries = expense_crud.get_multi(db, 0, 1000)
        
        entries = [entry for entry in all_entries if entry.created_by_id in subordinate_ids]
        entries = entries[skip:skip + limit]
    else:
        # Regular users can only see their own entries
        if start_date and end_date:
            all_entries = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        elif category:
            all_entries = expense_crud.get_by_category(db, category, 0, 1000)
        elif vendor:
            all_entries = expense_crud.get_by_vendor(db, vendor, 0, 1000)
        else:
            all_entries = expense_crud.get_multi(db, 0, 1000)
        
        entries = [entry for entry in all_entries if entry.created_by_id == current_user.id]
        entries = entries[skip:skip + limit]
    
    return entries


@router.get("/{expense_id}", response_model=ExpenseOut)
def read_expense_entry(
    expense_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific expense entry"""
    try:
        entry = expense_crud.get(db, id=expense_id)
        if entry is None:
            raise HTTPException(status_code=404, detail="Expense entry not found")
        
        # Check permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            if current_user.role == UserRole.MANAGER:
                # Managers can see entries of their subordinates
                try:
                    subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
                except Exception as e:
                    logger.error(f"Error fetching subordinates for user {current_user.id}: {str(e)}", exc_info=True)
                    subordinate_ids = []
                if entry.created_by_id not in subordinate_ids + [current_user.id]:
                    raise HTTPException(status_code=403, detail="Not enough permissions")
            elif current_user.role == UserRole.ACCOUNTANT:
                # Accountants can see ONLY their own entries
                # Accountants do NOT see Finance Admin's entries, other accountants' entries, or employees' entries
                if entry.created_by_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Not enough permissions")
            else:
                # Regular users can only see their own entries
                if entry.created_by_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Not enough permissions")
        
        return entry
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in read_expense_entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve expense entry: {str(e)}"
        )


@router.post("", response_model=ExpenseOut)
def create_expense_entry(
    expense_data: ExpenseCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new expense entry"""
    try:
        expense = expense_crud.create(db, obj_in=expense_data, created_by_id=current_user.id)
        
        # Send notification (in background, doesn't block response)
        try:
            from ...services.notification_service import NotificationService
            NotificationService.notify_expense_created(
                db=db,
                expense_id=expense.id,
                expense_title=expense_data.description or f"Expense #{expense.id}",
                amount=expense_data.amount,
                created_by_id=current_user.id,
                requires_approval=not expense.is_approved,
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.warning(f"Notification failed for expense creation: {str(e)}")
        
        # Trigger auto-learning for expenses (in background, doesn't block response)
        try:
            from ...services.ml_auto_learn import record_new_data, trigger_auto_learn_background
            record_new_data("expense", count=1)
            # Trigger auto-learning in background (won't slow down the API response)
            background_tasks.add_task(trigger_auto_learn_background, "expense")
        except Exception as e:
            # Don't fail the request if auto-learning fails
            logger.warning(f"Auto-learning trigger failed for expense: {str(e)}")

        # Check for budget limits (background)
        try:
            from ...services.budgeting import BudgetingService
            background_tasks.add_task(
                BudgetingService.check_and_notify_exceeded_budgets,
                db=db,
                expense_entry=expense
            )
        except Exception as e:
            logger.warning(f"Budget check failed: {str(e)}")
        
        # Log expense entry creation
        try:
            AuditLogger.log_create(
                db=db,
                user_id=current_user.id,
                resource_type="expense",
                resource_id=expense.id,
                new_values={"amount": float(expense.amount), "description": expense.description}
            )
        except Exception as audit_err:
            logger.warning(f"Audit logging failed for expense creation: {str(audit_err)}")

        return expense
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in create_expense_entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create expense entry: {str(e)}"
        )


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense_entry(
    expense_id: int,
    expense_update: ExpenseUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update expense entry"""
    try:
        entry = expense_crud.get(db, id=expense_id)
        
        # Send notification (in background, doesn't block response)
        try:
            from ...services.notification_service import NotificationService
            NotificationService.notify_expense_updated(
                db=db,
                expense_id=expense_id,
                expense_title=entry.description or f"Expense #{expense_id}",
                updated_by_id=current_user.id,
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.warning(f"Notification failed for expense update: {str(e)}")
        
        # Trigger auto-learning for expenses on update (if data changed)
        try:
            from ...services.ml_auto_learn import record_new_data, trigger_auto_learn_background
            # Count as new data point if amount or date changed
            update_dict = expense_update.dict(exclude_unset=True)
            if 'amount' in update_dict or 'date' in update_dict:
                record_new_data("expense", count=1)
                background_tasks.add_task(trigger_auto_learn_background, "expense")
        except Exception as e:
            logger.warning(f"Auto-learning trigger failed for expense update: {str(e)}")
            
        # Check for budget limits on update (background)
        try:
            from ...services.budgeting import BudgetingService
            background_tasks.add_task(
                BudgetingService.check_and_notify_exceeded_budgets,
                db=db,
                expense_entry=entry
            )
        except Exception as e:
            logger.warning(f"Budget check failed: {str(e)}")

        if entry is None:
            raise HTTPException(status_code=404, detail="Expense entry not found")
        
        # Check permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            if current_user.role == UserRole.MANAGER:
                # Managers can update entries of their subordinates
                try:
                    subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
                except Exception as e:
                    logger.error(f"Error fetching subordinates for user {current_user.id}: {str(e)}", exc_info=True)
                    subordinate_ids = []
                if entry.created_by_id not in subordinate_ids + [current_user.id]:
                    raise HTTPException(status_code=403, detail="Not enough permissions")
            elif current_user.role == UserRole.ACCOUNTANT:
                # Accountants can update their own entries and their subordinates' entries
                try:
                    subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
                except Exception as e:
                    logger.error(f"Error fetching subordinates for accountant {current_user.id}: {str(e)}", exc_info=True)
                    subordinate_ids = []
                if entry.created_by_id not in subordinate_ids + [current_user.id]:
                    raise HTTPException(status_code=403, detail="Not enough permissions")
            else:
                # Regular users can only update their own entries
                if entry.created_by_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Not enough permissions")
        
        # Cannot update approved entries unless admin or finance manager
        if entry.is_approved and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            raise HTTPException(status_code=400, detail="Cannot update approved entry")
        
        # Log expense entry update
        try:
            AuditLogger.log_update(
                db=db,
                user_id=current_user.id,
                resource_type="expense",
                resource_id=entry.id,
                old_values={"amount": float(entry.amount), "description": entry.description},
                new_values=expense_update.dict(exclude_unset=True)
            )
        except Exception as audit_err:
            logger.warning(f"Audit logging failed for expense update: {str(audit_err)}")

        return expense_crud.update(db, db_obj=entry, obj_in=expense_update)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_expense_entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update expense entry: {str(e)}"
        )


class DeleteExpenseRequest(BaseModel):
    password: str

@router.post("/{expense_id}/delete")
def delete_expense_entry(
    expense_id: int,
    delete_request: DeleteExpenseRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete expense entry - requires password verification"""
    try:
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
        
        # Verify password before deletion
        if not delete_request.password or not delete_request.password.strip():
            raise HTTPException(
                status_code=400,
                detail="Password is required to delete an expense entry."
            )
        
        # Verify password
        password_to_verify = delete_request.password.strip()
        if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
            raise HTTPException(
                status_code=403, 
                detail="Invalid password. Please verify your password to delete this expense entry."
            )
        
        entry = expense_crud.get(db, id=expense_id)
        if entry is None:
            raise HTTPException(status_code=404, detail="Expense entry not found")
        
        # Check permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            if current_user.role == UserRole.MANAGER:
                # Managers can delete entries of their subordinates
                try:
                    subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
                except Exception as e:
                    logger.error(f"Error fetching subordinates for user {current_user.id}: {str(e)}", exc_info=True)
                    subordinate_ids = []
                if entry.created_by_id not in subordinate_ids + [current_user.id]:
                    raise HTTPException(status_code=403, detail="Not enough permissions")
            else:
                # Regular users can only delete their own entries
                if entry.created_by_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Not enough permissions")
        
        # Cannot delete approved entries unless admin or finance manager
        if entry.is_approved and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            raise HTTPException(status_code=400, detail="Cannot delete approved entry")
        
        # Log expense entry deletion
        try:
            AuditLogger.log_delete(
                db=db,
                user_id=current_user.id,
                resource_type="expense",
                resource_id=expense_id,
                old_values={"amount": float(entry.amount), "description": entry.description}
            )
        except Exception as audit_err:
            logger.warning(f"Audit logging failed for expense deletion: {str(audit_err)}")

        expense_crud.delete(db, id=expense_id)
        return {"message": "Expense entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in delete_expense_entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete expense entry: {str(e)}"
        )


@router.post("/{expense_id}/approve")
def approve_expense_entry(
    expense_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Approve expense entry
    
    Role-based access control:
    - Admin/Super Admin: Can approve all expense entries
    - Finance Admin/Manager: Can approve their own entries and their subordinates' (accountant and employee) entries
    - Accountant: Can approve entries from their subordinates (employees) only, not their own
    """
    try:
        entry = expense_crud.get(db, id=expense_id)
        if entry is None:
            raise HTTPException(status_code=404, detail="Expense entry not found")
        
        if entry.is_approved:
            raise HTTPException(status_code=400, detail="Entry already approved")
        
        created_by_id = entry.created_by_id
        
        # Admin and Super Admin can approve all expense entries
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            pass  # Allow all entries
        # Finance Admin/Manager can approve their own entries and their subordinates' entries
        elif current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            from ...crud.user import user as user_crud
            try:
                # Get all subordinates (accountants and employees)
                subordinates = user_crud.get_hierarchy(db, current_user.id)
                subordinate_ids = [sub.id for sub in subordinates]
            except Exception as e:
                logger.error(f"Error fetching subordinates for user {current_user.id}: {str(e)}", exc_info=True)
                subordinate_ids = []
            subordinate_ids.append(current_user.id)  # Include themselves
            
            if created_by_id not in subordinate_ids:
                raise HTTPException(
                    status_code=403,
                    detail="You can only approve expense entries created by yourself or your subordinates (accountants and employees)"
                )
        # Accountant can only approve entries from their subordinates (employees), not their own
        elif current_user.role == UserRole.ACCOUNTANT:
            from ...crud.user import user as user_crud
            try:
                # Get subordinates (employees only)
                subordinates = user_crud.get_hierarchy(db, current_user.id)
                subordinate_ids = [sub.id for sub in subordinates]
            except Exception as e:
                logger.error(f"Error fetching subordinates for accountant {current_user.id}: {str(e)}", exc_info=True)
                subordinate_ids = []
            
            # Accountant cannot approve their own entries
            if created_by_id == current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Accountants cannot approve their own expense entries. Only entries from employees can be approved."
                )
            
            # Check if entry was created by a subordinate (employee)
            if created_by_id not in subordinate_ids:
                raise HTTPException(
                    status_code=403,
                    detail="You can only approve expense entries created by your subordinates (employees)"
                )
        else:
            # Other roles cannot approve expense entries
            raise HTTPException(
                status_code=403,
                detail="Only accountants, finance admins, managers, or admins can approve expense entries"
            )
        
        expense_crud.approve(db, id=expense_id, approved_by_id=current_user.id)
        
        # Send notification about expense approval
        try:
            from ...services.notification_service import NotificationService
            expense_title = entry.description or f"Expense #{expense_id}"
            NotificationService.notify_expense_approved(
                db=db,
                expense_id=expense_id,
                expense_title=expense_title,
                approver_id=current_user.id,
                requester_id=created_by_id,
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.warning(f"Notification failed for expense approval: {str(e)}")
        
        # Log expense entry approval
        try:
            AuditLogger.log_approve(
                db=db,
                user_id=current_user.id,
                resource_type="expense",
                resource_id=expense_id
            )
        except Exception as audit_err:
            logger.warning(f"Audit logging failed for expense approval: {str(audit_err)}")

        return {"message": "Expense entry approved successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in approve_expense_entry: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve expense entry: {str(e)}"
        )


class RejectRequest(BaseModel):
    reason: str
    password: str


@router.post("/{expense_id}/reject")
def reject_expense_entry(
    expense_id: int,
    reject_request: RejectRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Reject expense entry by rejecting its approval workflow (manager and above)"""
    entry = expense_crud.get(db, id=expense_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    
    if entry.is_approved:
        raise HTTPException(status_code=400, detail="Entry already approved")
    
    # Find the approval workflow for this expense entry, create one if it doesn't exist
    approval_workflow = approval_crud.get_by_expense_entry(db, expense_id)
    if approval_workflow is None:
        # Auto-create approval workflow if it doesn't exist
        from ...schemas.approval import ApprovalCreate
        from ...models.approval import ApprovalType
        
        approval_data = ApprovalCreate(
            title=entry.title or f"Expense Entry #{expense_id}",
            description=entry.description or f"Expense entry for {entry.title}",
            type=ApprovalType.EXPENSE,
            expense_entry_id=expense_id
        )
        approval_workflow = approval_crud.create(db, obj_in=approval_data, requester_id=entry.created_by_id)
    
    if approval_workflow.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Approval workflow is not pending")
    
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
            detail="Password is required to reject an expense entry."
        )
    
    # Verify password
    password_to_verify = reject_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to reject this expense entry."
        )
    
    # Check permissions - manager can reject if requester is their subordinate
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            subordinate_ids = [sub.id for sub in subordinates]
            if approval_workflow.requester_id not in subordinate_ids:
                raise HTTPException(status_code=403, detail="Not enough permissions to reject this request")
        else:
            raise HTTPException(status_code=403, detail="Not enough permissions to reject expense entries")
    
    # Reject the approval workflow
    approval_crud.reject(db, approval_workflow.id, current_user.id, reject_request.reason)
    
    # Send notification about expense rejection
    try:
        from ...services.notification_service import NotificationService
        expense_title = entry.description or f"Expense #{expense_id}"
        NotificationService.notify_expense_rejected(
            db=db,
            expense_id=expense_id,
            expense_title=expense_title,
            rejected_by_id=current_user.id,
            requester_id=entry.created_by_id,
            rejection_reason=reject_request.reason,
            background_tasks=background_tasks
        )
    except Exception as e:
        logger.warning(f"Notification failed for expense rejection: {str(e)}")
    
    # Log expense entry rejection
    try:
        AuditLogger.log_action(
            db=db,
            user_id=current_user.id,
            action=AuditAction.REJECT,
            resource_type="expense",
            resource_id=expense_id,
            new_values={"reason": reject_request.reason}
        )
    except Exception as audit_err:
        logger.warning(f"Audit logging failed for expense rejection: {str(audit_err)}")

    return {"message": "Expense entry rejected successfully"}


@router.get("/summary/total")
def get_expense_total(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get total expenses for a period"""
    # Allow admin, super_admin, finance_manager, and manager roles
    allowed_roles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    total = expense_crud.get_total_by_period(db, start_date, end_date)
    return {"total": float(total), "start_date": start_date.isoformat(), "end_date": end_date.isoformat()}


@router.get("/summary/by-category")
def get_expense_summary_by_category(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get expense summary by category for a period"""
    # Allow admin, super_admin, finance_admin, and manager roles
    allowed_roles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    summary = expense_crud.get_summary_by_category(db, start_date, end_date)
    # Convert category enum to string and ensure total is a float
    result = []
    for item in summary:
        category = item["category"]
        # Handle enum category
        if hasattr(category, "value"):
            category_str = category.value
        elif isinstance(category, str):
            category_str = category
        else:
            category_str = str(category)
        
        result.append({
            "category": category_str,
            "total": float(item["total"]) if item["total"] is not None else 0.0,
            "count": int(item["count"]) if item["count"] is not None else 0
        })
    return result


@router.get("/summary/by-vendor", response_model=List[ExpenseSummary])
def get_expense_summary_by_vendor(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get expense summary by vendor for a period"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    summary = expense_crud.get_summary_by_vendor(db, start_date, end_date)
    return summary


@router.get("/pending-approval", response_model=List[ExpenseOut])
def get_pending_approval(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Get expense entries pending approval"""
    entries = expense_crud.get_pending_approval(db, skip, limit)
    
    # Filter based on hierarchy for managers
    if current_user.role == UserRole.MANAGER:
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        entries = [entry for entry in entries if entry.created_by_id in subordinate_ids]
    
    return entries