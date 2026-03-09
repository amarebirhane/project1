# app/api/v1/sales.py
"""
Sales Management API
Role-based access control:
- Employee: Can create sales (sell items)
- Accountant: Can view all sales from Finance Admin and Employee, post journal entries, approve sales for revenue recording
- Finance Admin: Can view all sales and profit information
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from fastapi.encoders import jsonable_encoder
from ...schemas.responses import GenericResponse, ErrorResponse
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List, Optional
from datetime import datetime
import logging

from ...core.database import get_db

logger = logging.getLogger(__name__)
from ...api.deps import get_current_active_user
from ...models.user import User, UserRole
from ...models.sale import Sale, SaleStatus, JournalEntry
from ...crud.sale import sale as sale_crud
from ...crud.inventory import inventory as inventory_crud
from ...schemas.sale import (
    SaleCreate, SaleOut, SalePostRequest, JournalEntryOut, 
    SalesSummaryOut, ReceiptOut
)
from ...utils.audit import AuditLogger, AuditAction
from ...api.v1.auth import get_client_info
from ...services.ml_auto_learn import record_new_data, trigger_auto_learn_background
from ...services.invoice_service import invoice_service

router = APIRouter()


def _format_sale_output(sale: Sale, current_user: User) -> dict:
    """Format sale output with role-based field visibility"""
    sale_dict = {
        'id': sale.id,
        'item_id': sale.item_id,
        'item_name': sale.item.item_name if sale.item else 'Unknown',
        'quantity_sold': sale.quantity_sold,
        'selling_price': sale.selling_price,
        'total_sale': sale.total_sale,
        'status': sale.status,
        'receipt_number': sale.receipt_number,
        'customer_name': sale.customer_name,
        'customer_email': sale.customer_email,
        'notes': sale.notes,
        'sold_by_id': sale.sold_by_id,
        'sold_by_name': sale.sold_by.full_name if sale.sold_by else None,
        'posted_by_id': sale.posted_by_id,
        'posted_by_name': sale.posted_by.full_name if sale.posted_by else None,
        'posted_at': sale.posted_at,
        'created_at': sale.created_at,
        'updated_at': sale.updated_at,
    }
    
    # Finance Admin can see cost information (if needed in future)
    # For now, all roles see the same sale information
    return sale_dict


def _can_create_sale(user_role: UserRole) -> bool:
    """Check if user can create sales"""
    # Handle enum instances
    if isinstance(user_role, UserRole):
        if user_role in [UserRole.EMPLOYEE, UserRole.ACCOUNTANT, UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return True
        # Also check by value
        if user_role.value in ['employee', 'accountant', 'finance_manager', 'finance_admin', 'admin', 'super_admin']:
            return True
    
    # Normalize the role to a string for comparison
    role_str = None
    if isinstance(user_role, UserRole):
        role_str = user_role.value
    elif hasattr(user_role, 'value'):
        role_str = str(user_role.value)
    else:
        role_str = str(user_role)
    
    # Normalize to lowercase for comparison
    role_str = role_str.lower() if role_str else ''
    
    return role_str in ['employee', 'accountant', 'finance_manager', 'finance_admin', 'admin', 'super_admin']


@router.post("", response_model=GenericResponse[SaleOut], status_code=status.HTTP_201_CREATED)
def create_sale(
    sale_data: SaleCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new sale (Employee, Accountant, Finance Admin, Admin, Super Admin)"""
    # Check permissions
    if not _can_create_sale(current_user.role):
        # Get role value for error message
        role_value = None
        if isinstance(current_user.role, UserRole):
            role_value = current_user.role.value
        elif hasattr(current_user.role, 'value'):
            role_value = str(current_user.role.value)
        else:
            role_value = str(current_user.role)
        
        raise HTTPException(
            status_code=403,
            detail=f"Only employees, accountants, finance admins, or admins can create sales. Your role: {role_value}"
        )
    
    try:
        sale = sale_crud.create(db, sale_data, current_user.id)
        
        # Send notification about sale creation
        try:
            from ...services.notification_service import NotificationService
            # Get item name for notification
            from ...models.inventory import InventoryItem
            item = db.query(InventoryItem).filter(InventoryItem.id == sale.item_id).first()
            item_name = item.item_name if item else f"Item #{sale.item_id}"
            
            NotificationService.notify_sale_created(
                db=db,
                sale_id=sale.id,
                item_name=item_name,
                quantity=sale.quantity_sold,
                total_amount=float(sale.total_sale),
                created_by_id=current_user.id,
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.warning(f"Notification failed for sale creation: {str(e)}")
        
        # Trigger auto-learning for inventory (sale changes quantity)
        try:
            record_new_data("inventory", count=1)
            background_tasks.add_task(trigger_auto_learn_background, "inventory")
        except Exception as e:
            logger.warning(f"Auto-learning trigger failed for sale creation: {str(e)}")
        
        # Log sale creation
        try:
            ip_address, user_agent = get_client_info(request=None) # We don't have request in this dependency yet, but we can pass None or try to get it
            AuditLogger.log_create(
                db=db,
                user_id=current_user.id,
                resource_type="sale",
                resource_id=sale.id,
                new_values={
                    "item_id": sale.item_id,
                    "quantity": sale.quantity_sold,
                    "total_amount": float(sale.total_sale),
                    "receipt_number": sale.receipt_number
                }
            )
        except Exception as audit_err:
            logger.warning(f"Audit logging failed for sale creation: {str(audit_err)}")

        return _format_sale_output(sale, current_user)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in create_sale: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create sale: {str(e)}"
        )


@router.get("", response_model=GenericResponse[List[SaleOut]])
def get_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[SaleStatus] = Query(None),
    item_id: Optional[int] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get sales with role-based filtering:
    - Admin/Super Admin: See all sales
    - Finance Admin/Manager: See their own sales and their team's sales (subordinates)
    - Accountant: See sales from their subordinates (employees) for approval purposes
    - Employee: See only their own sales
    """
    try:
        # Parse dates
        start_date_dt = None
        end_date_dt = None
        if start_date:
            try:
                start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
        if end_date:
            try:
                end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
        
        # Filter by user role
        sold_by_id = None
        user_ids = None
        
        if current_user.role == UserRole.EMPLOYEE:
            # Employees can only see their own sales
            sold_by_id = current_user.id
        elif current_user.role == UserRole.ACCOUNTANT:
            # Accountant: See sales made by employees from their Finance Admin's team
            # This allows accountants to post sales made by employees
            from ...crud.user import user as user_crud
            manager_id = current_user.manager_id
            if manager_id:
                try:
                    # Get the Finance Admin's subordinates (employees)
                    subordinates = user_crud.get_hierarchy(db, manager_id)
                    # Filter to ONLY include employees (exclude accountants and Finance Admins)
                    employee_ids = [
                        sub.id for sub in subordinates 
                        if sub.role == UserRole.EMPLOYEE
                    ]
                    # Include: Accountant themselves + employees from Finance Admin's team
                    user_ids = [current_user.id] + employee_ids
                except Exception as e:
                    logger.error(f"Error fetching Finance Admin hierarchy for accountant: {str(e)}")
                    user_ids = [current_user.id]  # Fallback to just themselves
            else:
                # Accountant has no manager - only see their own sales
                user_ids = [current_user.id]
        elif current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            # Finance Admin/Manager: See only their team's sales (subordinates)
            # IMPORTANT: Only include accountants and employees, NOT other Finance Admins/Managers
            from ...crud.user import user as user_crud
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
            valid_subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            user_ids = [current_user.id] + valid_subordinate_ids
        
        # If user_ids is set, we need to filter by multiple user IDs
        # Fetch all matching sales and filter by user_ids in Python
        if user_ids is not None:
            # For accountants with no subordinates, return empty list
            if len(user_ids) == 0:
                sales = []
            else:
                # Fetch all sales matching the filters (without sold_by_id restriction)
                all_sales = sale_crud.get_multi(
                    db, skip=0, limit=10000, status=status,
                    sold_by_id=None, item_id=item_id,
                    start_date=start_date_dt, end_date=end_date_dt
                )
                # Filter by user_ids (subordinates for accountants, subordinates + themselves for finance admins)
                sales = [s for s in all_sales if s.sold_by_id in user_ids]
                # Apply pagination
                sales = sales[skip:skip+limit]
        else:
            # For single user (Employee) or Admin (no filter)
            sales = sale_crud.get_multi(
                db, skip=skip, limit=limit, status=status,
                sold_by_id=sold_by_id, item_id=item_id,
                start_date=start_date_dt, end_date=end_date_dt
            )
        
        return GenericResponse(data=[_format_sale_output(s, current_user) for s in sales])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_sales for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch sales: {str(e)}"
        )


@router.get("/{sale_id}", response_model=GenericResponse[SaleOut])
def get_sale(
    sale_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific sale"""
    try:
        sale = sale_crud.get(db, sale_id)
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        # Check permissions
        if current_user.role == UserRole.EMPLOYEE and sale.sold_by_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own sales"
            )
        elif current_user.role == UserRole.ACCOUNTANT:
            # Accountants can view all sales from Finance Admin, Manager, and Employee
            seller = db.query(User).filter(User.id == sale.sold_by_id).first()
            if seller and seller.role not in [UserRole.FINANCE_ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]:
                raise HTTPException(
                    status_code=403,
                    detail="You can only view sales from Finance Admin, Manager, and Employee"
                )
        
        return _format_sale_output(sale, current_user)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_sale: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve sale: {str(e)}"
        )


@router.post("/{sale_id}/post", response_model=SaleOut)
def post_sale(
    sale_id: int,
    post_data: SalePostRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Post a sale to ledger (approve sale for revenue calculation)
    
    Role-based access control:
    - Admin/Super Admin: Can approve all sales
    - Finance Admin/Manager: Can approve their own sales and their subordinates' (accountant and employee) sales
    - Accountant: Can approve sales from their subordinates (employees) only, not their own
    - Only POSTED sales are included in revenue and net profit calculations
    """
    try:
        # First, get the sale to check who made it
        sale = sale_crud.get(db, sale_id)
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        # Get the user who made the sale
        seller = db.query(User).filter(User.id == sale.sold_by_id).first()
        if not seller:
            raise HTTPException(status_code=404, detail="Seller not found")
        
        sold_by_id = sale.sold_by_id
        
        # Admin and Super Admin can approve all sales
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            pass  # Allow all sales
        # Finance Admin/Manager can approve their own sales and their subordinates' sales
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
            
            if sold_by_id not in subordinate_ids:
                raise HTTPException(
                    status_code=403,
                    detail="You can only approve sales made by yourself or your subordinates (accountants and employees)"
                )
        # Accountant can approve sales from Finance Admin, Manager, and Employee for revenue posting
        elif current_user.role == UserRole.ACCOUNTANT:
            # Narrow down allowed sales to only their manager and manager's other subordinates (employees)
            # This prevents accountants from seeing/approving sales from unrelated Finance Admins
            manager_id = current_user.manager_id
            if not manager_id:
                raise HTTPException(
                    status_code=403,
                    detail="Accountants must have a manager assigned to approve sales."
                )
            
            # Use user_crud.get_hierarchy to find eligible subordinates of the same manager
            try:
                from ...crud.user import user as user_crud
                subordinates = user_crud.get_hierarchy(db, manager_id)
                employee_ids = [sub.id for sub in subordinates if sub.role == UserRole.EMPLOYEE]
                allowed_user_ids = [manager_id] + employee_ids
            except Exception as e:
                logger.error(f"Error fetching hierarchy for Accountant's manager: {str(e)}")
                allowed_user_ids = [manager_id]
            
            # Accountant cannot approve their own sales
            if sold_by_id == current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Accountants cannot approve their own sales. Only sales from their Finance Admin and departmental Employees can be approved."
                )
            
            # Check if sale was made by an allowed user (manager or manager's employee)
            if sold_by_id not in allowed_user_ids:
                raise HTTPException(
                    status_code=403,
                    detail="You can only approve sales made by your manager (Finance Admin) or departmental employees. Access to other Finance Admins' sales is restricted."
                )
        else:
            # Other roles cannot approve sales
            raise HTTPException(
                status_code=403,
                detail="Only accountants, finance admins, managers, or admins can post sales to ledger"
            )
        
        sale = sale_crud.post_sale(db, sale_id, post_data, current_user.id)
        
        # Send notification about sale posting
        try:
            from ...services.notification_service import NotificationService
            # Get item name for notification
            from ...models.inventory import InventoryItem
            item = db.query(InventoryItem).filter(InventoryItem.id == sale.item_id).first()
            item_name = item.item_name if item else f"Item #{sale.item_id}"
            
            NotificationService.notify_sale_posted(
                db=db,
                sale_id=sale.id,
                item_name=item_name,
                total_amount=float(sale.total_sale),
                posted_by_id=current_user.id,
                sold_by_id=sale.sold_by_id,
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.warning(f"Notification failed for sale posting: {str(e)}")
        
        # Log sale posting
        try:
            AuditLogger.log_approve(
                db=db,
                user_id=current_user.id,
                resource_type="sale",
                resource_id=sale.id
            )
        except Exception as audit_err:
            logger.warning(f"Audit logging failed for sale posting: {str(audit_err)}")

        # Trigger auto-learning for inventory on sale posting
        try:
            record_new_data("inventory", count=1)
            background_tasks.add_task(trigger_auto_learn_background, "inventory")
        except Exception as e:
            logger.warning(f"Auto-learning trigger failed for sale posting: {str(e)}")

        return _format_sale_output(sale, current_user)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in post_sale: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to post sale to ledger: {str(e)}"
        )


@router.post("/{sale_id}/cancel", response_model=SaleOut)
def cancel_sale(
    sale_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a sale (Finance Admin only)"""
    try:
        if current_user.role not in [UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Only Finance Admin can cancel sales"
            )
        
        sale = sale_crud.cancel_sale(db, sale_id, current_user.id)
        # Log sale cancellation
        try:
            AuditLogger.log_action(
                db=db,
                user_id=current_user.id,
                action=AuditAction.REJECT,
                resource_type="sale",
                resource_id=sale.id,
                new_values={"status": SaleStatus.CANCELLED}
            )
        except Exception as audit_err:
            logger.warning(f"Audit logging failed for sale cancellation: {str(audit_err)}")

        # Trigger auto-learning for inventory on cancellation (restores quantity)
        try:
            record_new_data("inventory", count=1)
            background_tasks.add_task(trigger_auto_learn_background, "inventory")
        except Exception as e:
            logger.warning(f"Auto-learning trigger failed for sale cancellation: {str(e)}")

        return _format_sale_output(sale, current_user)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in cancel_sale: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel sale: {str(e)}"
        )


@router.get("/summary/overview", response_model=SalesSummaryOut)
def get_sales_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get sales summary (Accountant, Finance Admin, Admin, Super Admin, and Manager)"""
    # Allow Accountant, Finance Admin, Admin, Super Admin, and Manager roles
    allowed_roles = [UserRole.ACCOUNTANT, UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]
    
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Access denied. Your role '{current_user.role.value if hasattr(current_user.role, 'value') else current_user.role}' does not have permission to view sales summary. Required roles: accountant, finance_admin, admin, super_admin, or manager."
        )
    
    try:
        # Parse dates
        start_date_dt = None
        end_date_dt = None
        if start_date:
            try:
                start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format (e.g., YYYY-MM-DDTHH:MM:SS)")
        if end_date:
            try:
                end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format (e.g., YYYY-MM-DDTHH:MM:SS)")
        
        # Filter by user role:
        # - Admin/Super Admin: See all sales
        # - Finance Admin/Manager: See only their team's sales (subordinates + themselves)
        # - Accountant: See sales from themselves and their subordinates (employees)
        user_ids = None
        if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
            # Get all subordinates in the hierarchy
            from ...crud.user import user as user_crud
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
            subordinate_ids.append(current_user.id)  # Include themselves
            user_ids = subordinate_ids
        elif current_user.role == UserRole.ACCOUNTANT:
            # Accountant: See sales made by employees from their Finance Admin's team
            # This allows accountants to post sales made by employees
            from ...crud.user import user as user_crud
            manager_id = current_user.manager_id
            if manager_id:
                try:
                    # Get the Finance Admin's subordinates (employees)
                    subordinates = user_crud.get_hierarchy(db, manager_id)
                    # Filter to ONLY include employees (exclude accountants and Finance Admins)
                    employee_ids = [
                        sub.id for sub in subordinates 
                        if sub.role == UserRole.EMPLOYEE
                    ]
                    # Include: Accountant themselves + employees from Finance Admin's team
                    user_ids = [current_user.id] + employee_ids
                except Exception as e:
                    logger.error(f"Error fetching Finance Admin hierarchy for accountant sales summary: {str(e)}")
                    user_ids = [current_user.id]  # Fallback to just themselves
            else:
                # Accountant has no manager - only see their own sales
                user_ids = [current_user.id]
        
        summary = sale_crud.get_sales_summary(db, start_date_dt, end_date_dt, user_ids=user_ids)
        return summary
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sales summary for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching sales summary: {str(e)}"
        )


@router.get("/receipt/{sale_id}", response_model=ReceiptOut)
def get_receipt(
    sale_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get receipt for a sale"""
    sale = sale_crud.get_receipt(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Check permissions
    if current_user.role == UserRole.EMPLOYEE and sale.sold_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only view receipts for your own sales"
        )
    
    return {
        'receipt_number': sale.receipt_number or f"RCP-{sale.id}",
        'sale_id': sale.id,
        'item_name': sale.item.item_name if sale.item else 'Unknown',
        'quantity_sold': sale.quantity_sold,
        'selling_price': sale.selling_price,
        'total_sale': sale.total_sale,
        'customer_name': sale.customer_name,
        'customer_email': sale.customer_email,
        'sold_by_name': sale.sold_by.full_name if sale.sold_by else None,
        'created_at': sale.created_at,
    }


@router.get("/journal-entries/list", response_model=List[JournalEntryOut])
def get_journal_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get journal entries (Accountant, Finance Admin, Manager, and Admin)"""
    if current_user.role not in [UserRole.ACCOUNTANT, UserRole.FINANCE_ADMIN, UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Only accountants, finance admins, managers, and admins can view journal entries"
        )
    
    # Parse dates
    start_date_dt = None
    end_date_dt = None
    if start_date:
        try:
            start_date_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    if end_date:
        try:
            end_date_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    entries = sale_crud.get_journal_entries(db, skip=skip, limit=limit, start_date=start_date_dt, end_date=end_date_dt)
    
    result = []
    for entry in entries:
        result.append({
            'id': entry.id,
            'sale_id': entry.sale_id,
            'entry_date': entry.entry_date,
            'description': entry.description,
            'debit_account': entry.debit_account,
            'debit_amount': entry.debit_amount,
            'credit_account': entry.credit_account,
            'credit_amount': entry.credit_amount,
            'reference_number': entry.reference_number,
            'notes': entry.notes,
            'posted_by_id': entry.posted_by_id,
            'posted_by_name': entry.posted_by.full_name if entry.posted_by else None,
            'posted_at': entry.posted_at,
        })
    
    return result


@router.get("/{sale_id}/einvoice")
def get_sale_einvoice(
    sale_id: int,
    format: str = Query("json", enum=["json", "xml"]),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate E-Invoice for a sale in JSON or UBL XML format.
    """
    sale = sale_crud.get(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Check permissions (same as get_sale)
    if current_user.role == UserRole.EMPLOYEE and sale.sold_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if format == "xml":
        from fastapi.responses import Response
        xml_content = invoice_service.generate_ubl_xml(sale)
        return Response(content=xml_content, media_type="application/xml")
    else:
        return invoice_service.generate_json_einvoice(sale)

