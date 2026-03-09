# app/api/v1/inventory.py
"""
Inventory Management API
Role-based access control:
- Finance Admin: Full access (can see buying_price, expense_amount, profit)
- Accountant: Can view items (name, selling_price, stock) and sales
- Employee: Can view items (name, selling_price, stock) and make sales
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from fastapi.encoders import jsonable_encoder
from ...schemas.responses import GenericResponse, ErrorResponse
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List, Optional
from datetime import datetime
import logging

from ...core.database import get_db
from ...api.deps import get_current_active_user
from ...models.user import User, UserRole
from ...crud.inventory import inventory as inventory_crud
from ...crud.user import user as user_crud
from ...schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemOut, 
    InventoryItemPublicOut, InventoryAuditLogOut
)
from ...utils.audit import AuditLogger, AuditAction
from ...api.v1.auth import get_client_info
from ...utils.encryption import encrypt_value, decrypt_value
from ...core.security import verify_password
from pydantic import BaseModel # type: ignore[import-untyped]
from ...services.ml_auto_learn import record_new_data, trigger_auto_learn_background

router = APIRouter()
logger = logging.getLogger(__name__)


def _is_finance_admin(user_role: UserRole) -> bool:
    """Check if user has finance admin privileges"""
    # First, try direct enum comparison (most efficient)
    if isinstance(user_role, UserRole):
        if user_role in [UserRole.FINANCE_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]:
            return True
        # Also check by value
        if user_role.value in ['finance_manager', 'finance_admin', 'admin', 'super_admin', 'manager']:
            return True
    
    # Normalize the role to a string for comparison
    role_str = None
    
    # Handle enum instances
    if isinstance(user_role, UserRole):
        role_str = user_role.value
    # Handle objects with .value attribute
    elif hasattr(user_role, 'value'):
        role_str = str(user_role.value)
    # Handle plain strings
    else:
        role_str = str(user_role)
    
    # Normalize to lowercase for comparison
    role_str = role_str.lower() if role_str else ''
    
    # Check against allowed roles (including manager)
    allowed_roles = ['finance_manager', 'finance_admin', 'admin', 'super_admin', 'manager']
    return role_str in allowed_roles


def _filter_item_by_role(item: dict, user_role: UserRole) -> dict:
    """
    Filter inventory item fields based on user role.
    Finance Admin sees all fields, others see only public fields.
    """
    if _is_finance_admin(user_role):
        # Finance Admin sees everything including cost fields
        return item
    else:
        # Employee and Accountant see only public fields
        # But we need to include required fields for the response model
        public_fields = [
            'id', 'item_name', 'selling_price', 'quantity', 
            'description', 'category', 'sku', 'is_active',
            'created_at', 'updated_at', 'created_by_id', 'last_modified_by_id',
            # Finance admin fields as None for non-finance admins
            'buying_price', 'expense_amount', 'total_cost', 
            'profit_per_unit', 'profit_margin'
        ]
        filtered = {k: v for k, v in item.items() if k in public_fields}
        # Set finance admin fields to None for non-finance admins
        for field in ['buying_price', 'expense_amount', 'total_cost', 'profit_per_unit', 'profit_margin']:
            if field not in filtered:
                filtered[field] = None
        return filtered


@router.post("/items", response_model=GenericResponse[InventoryItemOut], status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_data: InventoryItemCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new inventory item (Finance Admin only)"""
    # Check permissions with detailed error message
    if not _is_finance_admin(current_user.role):
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
            detail=f"Only Finance Admin or Manager can create inventory items. Your role: {role_value}. Required roles: finance_manager, manager, admin, or super_admin"
        )

    # Create item
    item = inventory_crud.create(db, item_data, current_user.id)
    
    # Send notification about inventory creation
    try:
        from ...services.notification_service import NotificationService
        NotificationService.notify_inventory_created(
            db=db,
            item_id=item.id,
            item_name=item.item_name,
            quantity=item.quantity,
            created_by_id=current_user.id,
            background_tasks=background_tasks
        )
    except Exception as e:
        logger.warning(f"Notification failed for inventory creation: {str(e)}")
    
    # Return with role-based filtering
    item_dict = {
        'id': item.id,
        'item_name': item.item_name,
        'buying_price': item.buying_price,
        'expense_amount': item.expense_amount,
        'total_cost': item.total_cost,
        'selling_price': item.selling_price,
        'quantity': item.quantity,
        'description': item.description,
        'category': item.category,
        'sku': item.sku,
        'is_active': item.is_active,
        'created_at': item.created_at,
        'updated_at': item.updated_at,
        'created_by_id': item.created_by_id,
        'last_modified_by_id': item.last_modified_by_id,
        'profit_per_unit': item.calculate_profit_per_unit(),
        'profit_margin': item.calculate_profit_margin(),
    }
    
    # Trigger auto-learning for inventory
    try:
        record_new_data("inventory", count=1)
        background_tasks.add_task(trigger_auto_learn_background, "inventory")
    except Exception as e:
        logger.warning(f"Auto-learning trigger failed for inventory creation: {str(e)}")
    
    # Log inventory item creation
    try:
        ip_address, user_agent = get_client_info(request)
        AuditLogger.log_create(
            db=db,
            user_id=current_user.id,
            resource_type="inventory",
            resource_id=item.id,
            new_values={
                "item_name": item.item_name,
                "selling_price": item.selling_price,
                "quantity": item.quantity,
                "sku": item.sku
            },
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as audit_err:
        logger.warning(f"Audit logging failed for inventory creation: {str(audit_err)}")

    return GenericResponse(message="Inventory item created successfully", data=_filter_item_by_role(item_dict, current_user.role))


@router.get("/items", response_model=GenericResponse[List[InventoryItemOut]])
def get_inventory_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get inventory items (role-based visibility)"""
    # Filter by user role before fetching
    user_ids = None
    if current_user.role == UserRole.FINANCE_ADMIN:
        # Finance Admin: See only their own items and their subordinates' items
        # IMPORTANT: Only include accountants and employees, NOT other Finance Admins
        from ...crud.user import user as user_crud
        try:
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
            valid_subordinate_ids = [
                sub.id for sub in subordinates 
                if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            ]
            user_ids = [current_user.id] + valid_subordinate_ids
        except Exception as e:
            logger.error(f"Error fetching hierarchy for Finance Admin: {str(e)}")
            user_ids = [current_user.id]
    elif current_user.role == UserRole.ACCOUNTANT:
        # Accountant: See items from their Finance Admin (manager) and their Finance Admin's team
        from ...crud.user import user as user_crud
        manager_id = current_user.manager_id
        if manager_id:
            try:
                subordinates = user_crud.get_hierarchy(db, manager_id)
                # Filter to ONLY include accountants and employees (exclude other Finance Admins/Managers)
                valid_subordinate_ids = [
                    sub.id for sub in subordinates 
                    if sub.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
                ]
                user_ids = [manager_id] + valid_subordinate_ids
            except Exception as e:
                logger.error(f"Error fetching Finance Admin hierarchy for accountant: {str(e)}")
                user_ids = [manager_id] if manager_id else [current_user.id]
        else:
            user_ids = [current_user.id]
    elif current_user.role == UserRole.EMPLOYEE:
        # Employee: See items created by their Finance Admin (manager) AND their own items
        # This allows employees to sell items that Finance Admin created
        from ...crud.user import user as user_crud
        manager_id = current_user.manager_id
        if manager_id:
            # Include: Finance Admin (manager) + employee themselves
            user_ids = [manager_id, current_user.id]
        else:
            # Employee has no manager - only see their own items
            user_ids = [current_user.id]
    elif current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Admin/Super Admin: See all items
        user_ids = None
    else:
        # Other roles: See only their own items
        user_ids = [current_user.id]
    
    # Get all items first (we'll filter by user_ids if needed)
    all_items = inventory_crud.get_multi(
        db, skip=0, limit=10000,  # Get all items, we'll filter and paginate after
        category=category, is_active=is_active, search=search
    )
    
    # Filter items by user_ids if specified
    if user_ids is not None:
        all_items = [item for item in all_items if item.created_by_id in user_ids]
    
    # Apply pagination after filtering
    items = all_items[skip:skip + limit]
    
    # Filter items based on role (field visibility)
    result = []
    for item in items:
        item_dict = {
            'id': item.id,
            'item_name': item.item_name,
            'buying_price': item.buying_price,
            'expense_amount': item.expense_amount,
            'total_cost': item.total_cost,
            'selling_price': item.selling_price,
            'quantity': item.quantity,
            'description': item.description,
            'category': item.category,
            'sku': item.sku,
            'is_active': item.is_active,
            'created_at': item.created_at,
            'updated_at': item.updated_at,
            'created_by_id': item.created_by_id,
            'last_modified_by_id': item.last_modified_by_id,
        }
        
        # Add profit fields only for Finance Admin
        if _is_finance_admin(current_user.role):
            item_dict['profit_per_unit'] = item.calculate_profit_per_unit()
            item_dict['profit_margin'] = item.calculate_profit_margin()
        
        filtered_item = _filter_item_by_role(item_dict, current_user.role)
        result.append(filtered_item)
    
    return GenericResponse(data=result)


@router.get("/items/{item_id}", response_model=GenericResponse[InventoryItemOut])
def get_inventory_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific inventory item (role-based visibility)"""
    item = inventory_crud.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item_dict = {
        'id': item.id,
        'item_name': item.item_name,
        'buying_price': item.buying_price,
        'expense_amount': item.expense_amount,
        'total_cost': item.total_cost,
        'selling_price': item.selling_price,
        'quantity': item.quantity,
        'description': item.description,
        'category': item.category,
        'sku': item.sku,
        'is_active': item.is_active,
        'created_at': item.created_at,
        'updated_at': item.updated_at,
        'created_by_id': item.created_by_id,
        'last_modified_by_id': item.last_modified_by_id,
    }
    
    if _is_finance_admin(current_user.role):
        item_dict['profit_per_unit'] = item.calculate_profit_per_unit()
        item_dict['profit_margin'] = item.calculate_profit_margin()
    
    return GenericResponse(data=_filter_item_by_role(item_dict, current_user.role))


@router.put("/items/{item_id}", response_model=GenericResponse[InventoryItemOut])
def update_inventory_item(
    item_id: int,
    item_update: InventoryItemUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update inventory item (role-based permissions)"""
    item = inventory_crud.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check permissions for cost fields
    if not _is_finance_admin(current_user.role):
        # Employees and Accountants can only update certain fields
        allowed_fields = ['selling_price', 'quantity', 'description', 'category', 'sku']
        update_data = item_update.dict(exclude_unset=True)
        restricted_fields = ['buying_price', 'expense_amount']
        
        if any(field in update_data for field in restricted_fields):
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to modify cost fields"
            )
    
    # Track changes for notification
    changes = []
    if item_update.quantity is not None and item_update.quantity != item.quantity:
        changes.append(f"quantity: {item.quantity} → {item_update.quantity}")
    if item_update.selling_price is not None and item_update.selling_price != item.selling_price:
        changes.append(f"selling price: ${item.selling_price:,.2f} → ${item_update.selling_price:,.2f}")
    if item_update.item_name is not None and item_update.item_name != item.item_name:
        changes.append(f"name: {item.item_name} → {item_update.item_name}")
    
    # Update item
    updated_item = inventory_crud.update(db, item, item_update, current_user.id)
    
    # Send notification about inventory update
    try:
        from ...services.notification_service import NotificationService
        NotificationService.notify_inventory_updated(
            db=db,
            item_id=updated_item.id,
            item_name=updated_item.item_name,
            updated_by_id=current_user.id,
            changes=changes if changes else None,
            background_tasks=background_tasks
        )
        
        # Check for low stock after update
        if updated_item.quantity is not None and updated_item.quantity <= 10:  # Threshold for low stock
            # Target identifying relevant recipients hierarchically
            recipient_ids = []
            
            # 1. The manager of the current user (if they are Finance Admin/Manager)
            if current_user.manager_id:
                manager = db.query(User).filter(User.id == current_user.manager_id).first()
                if manager and manager.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER] and manager.is_active:
                    recipient_ids.append(manager.id)
            
            # 2. The current user themselves if they are Finance Admin/Manager
            if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
                recipient_ids.append(current_user.id)
            
            # 3. Limited set of global Admins (max 3)
            global_admins = db.query(User).filter(
                User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                User.is_active == True
            ).limit(3).all()
            for admin in global_admins:
                if admin.id not in recipient_ids:
                    recipient_ids.append(admin.id)
            
            if recipient_ids:
                NotificationService.notify_inventory_low(
                    db=db,
                    item_id=updated_item.id,
                    item_name=updated_item.item_name,
                    current_quantity=updated_item.quantity,
                    min_quantity=10,
                    user_ids=recipient_ids,
                    background_tasks=background_tasks
                )
    except Exception as e:
        logger.warning(f"Notification failed for inventory update: {str(e)}")
    
    # Trigger auto-learning for inventory on update (if data changed)
    try:
        # Count as new data point if quantity or price changed
        update_dict = item_update.dict(exclude_unset=True)
        relevant_fields = ['quantity', 'selling_price', 'buying_price', 'expense_amount']
        if any(field in update_dict for field in relevant_fields):
            record_new_data("inventory", count=1)
            background_tasks.add_task(trigger_auto_learn_background, "inventory")
    except Exception as e:
        logger.warning(f"Auto-learning trigger failed for inventory update: {str(e)}")
    
    # Return with role-based filtering
    item_dict = {
        'id': updated_item.id,
        'item_name': updated_item.item_name,
        'buying_price': updated_item.buying_price,
        'expense_amount': updated_item.expense_amount,
        'total_cost': updated_item.total_cost,
        'selling_price': updated_item.selling_price,
        'quantity': updated_item.quantity,
        'description': updated_item.description,
        'category': updated_item.category,
        'sku': updated_item.sku,
        'is_active': updated_item.is_active,
        'created_at': updated_item.created_at,
        'updated_at': updated_item.updated_at,
        'created_by_id': updated_item.created_by_id,
        'last_modified_by_id': updated_item.last_modified_by_id,
    }
    
    # Add profit fields only for Finance Admin
    if _is_finance_admin(current_user.role):
        item_dict['profit_per_unit'] = updated_item.calculate_profit_per_unit()
        item_dict['profit_margin'] = updated_item.calculate_profit_margin()
    
    # Log inventory item update
    try:
        ip_address, user_agent = get_client_info(request)
        # We can extract old values from 'item' and new values from 'updated_item' if we want more detail
        AuditLogger.log_update(
            db=db,
            user_id=current_user.id,
            resource_type="inventory",
            resource_id=updated_item.id,
            old_values={"item_name": item.item_name, "quantity": item.quantity, "selling_price": item.selling_price},
            new_values={"item_name": updated_item.item_name, "quantity": updated_item.quantity, "selling_price": updated_item.selling_price},
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as audit_err:
        logger.warning(f"Audit logging failed for inventory update: {str(audit_err)}")

    return GenericResponse(message="Inventory item updated successfully", data=_filter_item_by_role(item_dict, current_user.role))


@router.get("/items/{item_id}/audit", response_model=GenericResponse[List[InventoryAuditLogOut]])
def get_item_audit_logs(
    item_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get audit logs for an inventory item (Finance Admin only)"""
    if not _is_finance_admin(current_user.role):
        raise HTTPException(
            status_code=403,
            detail="Only Finance Admin can view audit logs"
        )
    
    item = inventory_crud.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    logs = inventory_crud.get_audit_logs(db, item_id, skip=skip, limit=limit)
    return GenericResponse(data=logs)


@router.get("/items/low-stock/list", response_model=GenericResponse)
def get_low_stock_items(
    threshold: int = Query(10, ge=0),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get items with low stock (Finance Admin only)"""
    if not _is_finance_admin(current_user.role):
        raise HTTPException(
            status_code=403,
            detail="Only Finance Admin can view low stock items"
        )
    
    items = inventory_crud.get_low_stock_items(db, threshold)
    
    result = []
    for item in items:
        item_dict = {
            'id': item.id,
            'item_name': item.item_name,
            'selling_price': item.selling_price,
            'quantity': item.quantity,
            'category': item.category,
            'sku': item.sku,
        }
        result.append(item_dict)
    
    return GenericResponse(data=result)


@router.get("/summary", response_model=GenericResponse)
def get_inventory_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get inventory summary (Finance Admin, Admin, Super Admin, and Manager)
    
    - Admin/Super Admin: See all inventory
    - Finance Admin/Manager: See only inventory created by them or their subordinates
    """
    try:
        # Allow Finance Admin, Admin, Super Admin, and Manager roles
        allowed_roles = [
            UserRole.FINANCE_ADMIN, 
            UserRole.ADMIN, 
            UserRole.SUPER_ADMIN, 
            UserRole.MANAGER
        ]
        
        if current_user.role not in allowed_roles:
            role_value = str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role)
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Only Finance Admin, Admin, Super Admin, or Manager can view inventory summary. Your role: {role_value}"
            )
        
        # Admin and Super Admin see all inventory
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return GenericResponse(data=inventory_crud.get_total_value(db))
        
        # Finance Admin and Manager see only their team's inventory
        # Get all subordinates in the hierarchy
        from ...crud.user import user as user_crud
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        subordinate_ids.append(current_user.id)  # Include themselves
        
        # Get inventory summary filtered by created_by_id
        return GenericResponse(data=inventory_crud.get_total_value_by_users(db, subordinate_ids))
    except HTTPException:
        # Re-raise HTTP exceptions (like 403)
        raise
    except Exception as e:
        # Log the error and return a 500 error
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching inventory summary for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch inventory summary: {str(e)}"
        )


class DeleteInventoryItemRequest(BaseModel):
    password: str


class ActivateDeactivateInventoryItemRequest(BaseModel):
    password: str


@router.post("/items/{item_id}/activate", response_model=GenericResponse)
def activate_inventory_item(
    item_id: int,
    activate_request: ActivateDeactivateInventoryItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Activate inventory item - requires password verification (Finance Admin only)"""
    # Check permissions
    if not _is_finance_admin(current_user.role):
        raise HTTPException(
            status_code=403,
            detail="Only Finance Admin can activate inventory items"
        )
    
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
    
    # Verify password before activation
    if not activate_request.password or not activate_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to activate an inventory item."
        )
    
    # Verify password
    password_to_verify = activate_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to activate this inventory item."
        )
    
    # Check if item exists
    item = inventory_crud.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Activate the item
    updated_item = inventory_crud.update(db, item, InventoryItemUpdate(is_active=True), current_user.id)
    
    return GenericResponse(message="Inventory item activated successfully")


@router.post("/items/{item_id}/deactivate", response_model=GenericResponse)
def deactivate_inventory_item(
    item_id: int,
    deactivate_request: ActivateDeactivateInventoryItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Deactivate inventory item - requires password verification (Finance Admin only)"""
    # Check permissions
    if not _is_finance_admin(current_user.role):
        raise HTTPException(
            status_code=403,
            detail="Only Finance Admin can deactivate inventory items"
        )
    
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
    
    # Verify password before deactivation
    if not deactivate_request.password or not deactivate_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to deactivate an inventory item."
        )
    
    # Verify password
    password_to_verify = deactivate_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to deactivate this inventory item."
        )
    
    # Check if item exists
    item = inventory_crud.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Deactivate the item
    updated_item = inventory_crud.update(db, item, InventoryItemUpdate(is_active=False), current_user.id)
    
    return GenericResponse(message="Inventory item deactivated successfully")


@router.post("/items/{item_id}/delete", response_model=GenericResponse)
def delete_inventory_item(
    item_id: int,
    delete_request: DeleteInventoryItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete inventory item - requires password verification (Finance Admin only)"""
    # Check permissions
    if not _is_finance_admin(current_user.role):
        raise HTTPException(
            status_code=403,
            detail="Only Finance Admin can delete inventory items"
        )
    
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
            detail="Password is required to delete an inventory item."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this inventory item."
        )
    
    # Check if item exists
    item = inventory_crud.get(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    # Check if item has associated sales
    from ...models.sale import Sale
    sales_count = db.query(Sale).filter(Sale.item_id == item_id).count()
    if sales_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete item with {sales_count} associated sale(s). Please deactivate the item instead."
        )
    
    # Delete the item
    deleted = inventory_crud.delete(db, item_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=500, detail="Failed to delete inventory item")
    
    # Log inventory item deletion
    try:
        # We don't have request easily available here, but we can try to get it if we add it to params
        AuditLogger.log_delete(
            db=db,
            user_id=current_user.id,
            resource_type="inventory",
            resource_id=item_id,
            old_values={"item_name": item.item_name}
        )
    except Exception as audit_err:
        logger.warning(f"Audit logging failed for inventory deletion: {str(audit_err)}")

    return GenericResponse(message="Inventory item deleted successfully")

