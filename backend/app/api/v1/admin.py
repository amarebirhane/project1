from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import text, and_, desc # type: ignore[import-untyped]
from sqlalchemy.exc import IntegrityError # type: ignore[import-untyped]
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import logging

from ...core.database import get_db
from ...core.security import verify_password
from pydantic import BaseModel # type: ignore[import-untyped]

logger = logging.getLogger(__name__)
from ...crud.user import user as user_crud, role as role_crud
from ...crud.audit import audit_log as audit_crud
from ...crud.notification import notification as notification_crud
from ...crud.report import report as report_crud
from ...crud.revenue import revenue as revenue_crud
from ...crud.expense import expense as expense_crud
from ...crud.approval import approval as approval_crud
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role
from ...services.backup import BackupService
from ...services.email import EmailService
from ...schemas.user import RoleCreate, RoleUpdate, RoleOut, RoleWithStats

router = APIRouter()


DEFAULT_ROLE_DESCRIPTIONS = {
    UserRole.SUPER_ADMIN: "Super administrators with unrestricted access.",
    UserRole.ADMIN: "Administrators who can manage users and finances.",
    UserRole.FINANCE_ADMIN: "Finance managers overseeing accounting teams.",
    UserRole.MANAGER: "Department managers responsible for approvals.",
    UserRole.ACCOUNTANT: "Accountants who prepare financial entries.",
    UserRole.EMPLOYEE: "Employees who can submit their own transactions.",
}

DEFAULT_ROLE_PERMISSIONS = {
    UserRole.SUPER_ADMIN: ["*"],
    UserRole.ADMIN: [
        "users:create", "users:update", "users:delete",
        "finance:approve", "settings:update"
    ],
    UserRole.FINANCE_ADMIN: ["finance:create", "finance:approve", "users:view"],
    UserRole.MANAGER: ["finance:review", "approvals:review"],
    UserRole.ACCOUNTANT: ["finance:create", "finance:update"],
    UserRole.EMPLOYEE: ["finance:create"],
}


def _normalize_role_name(raw_name: str) -> str:
    normalized = "_".join(raw_name.strip().lower().split())
    return normalized


def _normalize_permissions(permissions: Optional[List[str]]) -> List[str]:
    if not permissions:
        return []
    cleaned: List[str] = []
    for perm in permissions:
        if not perm:
            continue
        value = perm.strip()
        if value and value not in cleaned:
            cleaned.append(value)
    return cleaned


def _ensure_default_roles(db: Session) -> None:
    """Seed the roles table with baseline records if empty."""
    existing = {role.name for role in role_crud.get_multi(db, skip=0, limit=100)}
    for role_enum in UserRole:
        if role_enum.value not in existing:
            payload = RoleCreate(
                name=role_enum.value,
                description=DEFAULT_ROLE_DESCRIPTIONS.get(role_enum),
                permissions=DEFAULT_ROLE_PERMISSIONS.get(role_enum, []),
            )
            role_crud.create(db, payload)


# GET /hierarchy
@router.get("/hierarchy")
def get_hierarchy(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get organizational hierarchy"""
    # Build hierarchy tree
    all_users = db.query(User).filter(User.is_active == True).all()
    
    hierarchy = []
    for user in all_users:
        manager_name = None
        if user.manager_id:
            manager = db.query(User).filter(User.id == user.manager_id).first()
            if manager:
                manager_name = manager.full_name or manager.username
        
        hierarchy.append({
            "id": user.id,
            "name": user.full_name or user.username,
            "email": user.email,
            "role": user.role.value,
            "manager_id": user.manager_id,
            "manager_name": manager_name,
            "department": user.department,
            "subordinates": []
        })
    
    # Build tree structure
    def build_tree(users_list, manager_id=None):
        children = []
        for user in users_list:
            if user["manager_id"] == manager_id:
                user["subordinates"] = build_tree(users_list, user["id"])
                children.append(user)
        return children
    
    tree = build_tree(hierarchy, None)
    
    return {
        "hierarchy": tree,
        "flat_list": hierarchy
    }


# GET /roles
@router.get("/roles", response_model=List[RoleWithStats])
def get_roles(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get all available roles with user counts"""
    _ensure_default_roles(db)
    db_roles = role_crud.get_multi(db, skip=0, limit=500)
    response: List[RoleWithStats] = []
    for db_role in db_roles:
        try:
            enum_role = UserRole(db_role.name)
            user_count = db.query(User).filter(User.role == enum_role, User.is_active == True).count()
        except ValueError:
            user_count = 0

        response.append(RoleWithStats(
            id=db_role.id,
            name=db_role.name,
            description=db_role.description,
            permissions=db_role.permissions or [],
            created_at=db_role.created_at,
            updated_at=db_role.updated_at,
            user_count=user_count,
            permission_count=len(db_role.permissions or []),
        ))
    return response


@router.post("/roles", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
def create_role(
    role_in: RoleCreate,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Create a new role definition"""
    normalized_name = _normalize_role_name(role_in.name)
    if not normalized_name:
        raise HTTPException(status_code=400, detail="Role name is required")

    if role_crud.get_by_name(db, normalized_name):
        raise HTTPException(status_code=400, detail="Role with this name already exists")

    payload = role_in.model_copy(update={
        "name": normalized_name,
        "permissions": _normalize_permissions(role_in.permissions),
    })

    try:
        new_role = role_crud.create(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Role name must be unique")
    return new_role


@router.put("/roles/{role_id}", response_model=RoleOut)
def update_role(
    role_id: int,
    role_update: RoleUpdate,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Update an existing role definition"""
    db_role = role_crud.get(db, role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    update_payload = role_update.model_copy(update={})
    if role_update.name:
        normalized_name = _normalize_role_name(role_update.name)
        if normalized_name != db_role.name and role_crud.get_by_name(db, normalized_name):
            raise HTTPException(status_code=400, detail="Role with this name already exists")
        update_payload = update_payload.model_copy(update={"name": normalized_name})

    if role_update.permissions is not None:
        update_payload = update_payload.model_copy(update={
            "permissions": _normalize_permissions(role_update.permissions)
        })

    updated_role = role_crud.update(db, db_role, update_payload)
    return updated_role


class DeleteRoleRequest(BaseModel):
    password: str


@router.post("/roles/{role_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_role_verified(
    role_id: int,
    delete_request: DeleteRoleRequest,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete a role definition with password verification"""
    # Verify password
    if not verify_password(delete_request.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid password. Verification failed."
        )

    db_role = role_crud.get(db, role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Check if role is in use
    try:
        enum_role = UserRole(db_role.name)
        assigned_count = db.query(User).filter(User.role == enum_role).count()
    except ValueError:
        assigned_count = 0

    if assigned_count:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete role '{db_role.name}' because it is assigned to {assigned_count} user(s)."
        )

    # Protect default roles from deletion
    if db_role.name in [r.value for r in UserRole]:
        raise HTTPException(
            status_code=400,
            detail="System default roles cannot be deleted."
        )

    role_crud.delete(db, role_id)
    return None


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete a role definition if it is not in use"""
    db_role = role_crud.get(db, role_id)
    if not db_role:
        raise HTTPException(status_code=404, detail="Role not found")

    try:
        enum_role = UserRole(db_role.name)
        assigned_count = db.query(User).filter(User.role == enum_role).count()
    except ValueError:
        assigned_count = 0

    if assigned_count:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a role that is assigned to users"
        )

    role_crud.delete(db, role_id)
    return None


# GET /permissions
@router.get("/permissions", response_model=List[str])
def get_permissions(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
):
    """Get all available system permissions"""
    all_perms = set()
    for perms in DEFAULT_ROLE_PERMISSIONS.values():
        for p in perms:
            if p != "*":
                all_perms.add(p)
    return sorted(list(all_perms))


@router.get("/system/stats")
def get_system_stats(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get system statistics"""
    try:
        # User statistics
        try:
            total_users = db.query(User).count()
            active_users = db.query(User).filter(User.is_active == True).count()
        except Exception as e:
            logger.error(f"Error fetching user statistics: {str(e)}")
            total_users = 0
            active_users = 0
        
        # Role distribution
        role_stats = {}
        try:
            for role in UserRole:
                try:
                    count = db.query(User).filter(User.role == role).count()
                    role_stats[role.value] = count
                except Exception as e:
                    logger.warning(f"Error counting users for role {role.value}: {str(e)}")
                    role_stats[role.value] = 0
        except Exception as e:
            logger.error(f"Error fetching role distribution: {str(e)}")

        # Financial snapshot (last 30 days)
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=30)
        try:
            total_revenue = revenue_crud.get_total_by_period(db, start_date, end_date) or 0
        except Exception as e:
            logger.error(f"Error fetching revenue total: {str(e)}")
            total_revenue = 0
        
        try:
            total_expenses = expense_crud.get_total_by_period(db, start_date, end_date) or 0
        except Exception as e:
            logger.error(f"Error fetching expense total: {str(e)}")
            total_expenses = 0
        
        try:
            pending_approvals = len(approval_crud.get_pending(db))
        except Exception as e:
            logger.error(f"Error fetching pending approvals: {str(e)}")
            pending_approvals = 0
        
        net_profit = total_revenue - total_expenses
        
        # Database statistics
        try:
            # Get table sizes (PostgreSQL specific)
            if "postgresql" in str(db.bind.url):
                try:
                    table_stats = db.execute(text("""
                        SELECT 
                            schemaname,
                            tablename,
                            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                        FROM pg_tables 
                        WHERE schemaname = 'public'
                        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                    """)).fetchall()
                    
                    db_stats = {
                        "tables": [
                            {
                                "name": row.tablename,
                                "size": row.size,
                                "size_bytes": row.size_bytes
                            }
                            for row in table_stats
                        ]
                    }
                except Exception as e:
                    logger.warning(f"Error fetching PostgreSQL table stats: {str(e)}")
                    db_stats = {"message": "Detailed table stats only available for PostgreSQL", "error": str(e)}
            else:
                # For other databases, provide basic info
                db_stats = {"message": "Detailed table stats only available for PostgreSQL"}
        except Exception as e:
            logger.error(f"Error in database statistics: {str(e)}")
            db_stats = {"error": str(e)}
        
        # Recent activity
        try:
            recent_audits = audit_crud.get_multi(db, skip=0, limit=10)
        except Exception as e:
            logger.warning(f"Error fetching recent audits: {str(e)}")
            recent_audits = []
        
        try:
            recent_reports = report_crud.get_recent(db, days=7, skip=0, limit=10)
        except Exception as e:
            logger.warning(f"Error fetching recent reports: {str(e)}")
            recent_reports = []
        
        # Basic DB health check
        try:
            db.execute(text("SELECT 1"))
            system_health = "healthy"
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            system_health = "unhealthy"

        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "by_role": role_stats
            },
            "financials": {
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "net_profit": net_profit
            },
            "pending_approvals": pending_approvals,
            "system_health": system_health,
            "database": db_stats,
            "activity": {
                "recent_audits": len(recent_audits),
                "recent_reports": len(recent_reports)
            },
            "timestamp": datetime.now(timezone.utc)
        }
    except Exception as e:
        logger.error(f"Unexpected error in get_system_stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve system statistics: {str(e)}"
        )


@router.get("/audit/logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: int = Query(None),
    action: str = Query(None),
    resource_type: str = Query(None),
    search: str = Query(None),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get audit logs with filtering (Admin only)"""
    from ...models.audit import AuditLog, AuditAction
    
    # Build query with combined filters (allow multiple filters to work together)
    query = db.query(AuditLog)
    filters = []
    
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    
    if action:
        try:
            action_enum = AuditAction(action)
            filters.append(AuditLog.action == action_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid action")
    
    if resource_type:
        filters.append(AuditLog.resource_type == resource_type)
    
    if search:
        search_term = f"%{search}%"
        query = query.join(User).filter(
            (User.full_name.ilike(search_term)) | 
            (User.email.ilike(search_term)) |
            (User.username.ilike(search_term))
        )
    
    if start_date:
        filters.append(AuditLog.created_at >= start_date)
    
    if end_date:
        filters.append(AuditLog.created_at <= end_date)
    
    # Apply filters
    if filters:
        query = query.filter(and_(*filters))
    
    # Order by created_at descending and apply pagination
    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    
    # Get unique user IDs to fetch users in batch (optimize user loading)
    user_ids = list(set([log.user_id for log in logs]))
    users_dict = {}
    for uid in user_ids:
        user = user_crud.get(db, uid)
        if user:
            users_dict[uid] = {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
            }
    
    # Format response with user information
    result = []
    for log in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action.value if hasattr(log.action, 'value') else str(log.action),
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        
        # Add user information from pre-fetched dictionary
        if log.user_id in users_dict:
            log_dict["user"] = users_dict[log.user_id]
        
        result.append(log_dict)
    
    return result


@router.post("/backup/create")
def create_backup(
    background_tasks: BackgroundTasks,
    include_files: bool = Query(False),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Create system backup (admin, finance_admin, or super_admin only)"""
    # Add backup task to background
    background_tasks.add_task(BackupService.create_backup, include_files)
    
    return {"message": "Backup started in background"}


@router.get("/backup/list")
def list_backups(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """List available backups (admin, finance_admin, or super_admin only)"""
    backups = BackupService.list_backups()
    return {"backups": backups}


@router.post("/backup/restore")
def restore_backup(
    backup_name: str,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Restore from backup (admin, finance_admin, or super_admin only)"""
    # This is a dangerous operation - should require additional confirmation
    result = BackupService.restore_backup(backup_name)
    return {"message": f"Backup restore completed: {result}"}


class DeleteBackupRequest(BaseModel):
    password: str

@router.post("/backup/{backup_name}/delete")
def delete_backup(
    backup_name: str,
    delete_request: DeleteBackupRequest,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete a backup - requires password verification (admin, finance_admin, or super_admin only)"""
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
            detail="Password is required to delete a backup."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this backup."
        )
    
    result = BackupService.delete_backup(backup_name)
    if result:
        return {"message": f"Backup deleted successfully: {backup_name}"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete backup: {backup_name}"
        )


@router.post("/maintenance/cleanup")
def cleanup_system(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Clean up old data (super admin only)"""
    # Clean up old audit logs
    audit_count = audit_crud.cleanup_old(db, days)
    
    # Clean up expired notifications
    notification_count = notification_crud.cleanup_expired(db)
    
    # Clean up old reports
    report_count = report_crud.cleanup_expired(db)
    
    return {
        "message": "System cleanup completed",
        "cleaned": {
            "audit_logs": audit_count,
            "notifications": notification_count,
            "reports": report_count
        }
    }


@router.post("/notifications/broadcast")
def broadcast_system_notification(
    title: str,
    message: str,
    target_roles: List[UserRole] = Query(...),
    priority: str = Query("medium", regex="^(low|medium|high|urgent)$"),
    send_email: bool = Query(False),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Send system-wide notification (admin only)"""
    from ...models.notification import NotificationType, NotificationPriority
    
    # Get all users with target roles
    users = []
    for role in target_roles:
        role_users = db.query(User).filter(User.role == role, User.is_active == True).all()
        users.extend(role_users)
    
    # Remove duplicates
    user_ids = list(set([user.id for user in users]))
    
    # Create notifications
    priority_map = {
        "low": NotificationPriority.LOW,
        "medium": NotificationPriority.MEDIUM,
        "high": NotificationPriority.HIGH,
        "urgent": NotificationPriority.URGENT
    }
    
    notifications = notification_crud.create_for_users(
        db=db,
        user_ids=user_ids,
        title=title,
        message=message,
        notification_type=NotificationType.SYSTEM_ALERT,
        priority=priority_map[priority]
    )
    
    # Send emails if requested
    if send_email:
        background_tasks = BackgroundTasks()
        for user in users:
            if user.email:
                background_tasks.add_task(
                    EmailService.send_system_notification,
                    user.email,
                    title,
                    message
                )
    
    return {
        "message": f"System notification sent to {len(notifications)} users",
        "target_roles": [role.value for role in target_roles],
        "recipients": len(notifications),
        "email_sent": send_email
    }


@router.get("/health")
def system_health_check(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Check system health"""
    health_status = {
        "database": "unknown",
        "timestamp": datetime.now(timezone.utc),
        "services": {}
    }
    
    # Check database connection
    try:
        db.execute(text("SELECT 1"))
        health_status["database"] = "healthy"
    except Exception as e:
        health_status["database"] = f"unhealthy: {str(e)}"
    
    # Check other services (add more as needed)
    # For now, just check if we can import services
    try:
        from ...services.email import EmailService
        health_status["services"]["email"] = "available"
    except ImportError:
        health_status["services"]["email"] = "unavailable"
    
    try:
        from ...services.backup import BackupService
        health_status["services"]["backup"] = "available"
    except ImportError:
        health_status["services"]["backup"] = "unavailable"
    
    return health_status


@router.post("/users/export")
def export_users(
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Export users data (admin only)"""
    users = user_crud.get_multi(db, skip=0, limit=10000)
    
    if format == "csv":
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "id", "email", "username", "full_name", "role", 
            "department", "is_active", "created_at"
        ])
        
        # Data
        for user in users:
            writer.writerow([
                user.id, user.email, user.username, user.full_name,
                user.role.value, user.department, user.is_active, user.created_at
            ])
        
        output.seek(0)
        return {"data": output.getvalue(), "filename": "users_export.csv"}
    
    else:  # JSON
        import json
        
        users_data = []
        for user in users:
            users_data.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role.value,
                "department": user.department,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat()
            })
        
        return {"data": json.dumps(users_data, indent=2), "filename": "users_export.json"}


@router.get("/settings")
def get_system_settings(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get system settings (admin or higher)"""
    from ...core.config import settings
    
    return {
        "app_name": settings.APP_NAME,
        "debug": settings.DEBUG,
        "version": settings.VERSION,
        "database_configured": bool(settings.DATABASE_URL),
        "email_configured": bool(settings.SMTP_HOST and settings.SMTP_USER),
        "redis_configured": bool(settings.REDIS_URL),
        "s3_configured": bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_BUCKET_NAME)
    }
