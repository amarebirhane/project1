# app/api/v1/users.py
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks, Request
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from pydantic import BaseModel # type: ignore[import-untyped]
import logging

from ...core.database import get_db
from ...crud.user import user as user_crud
from ...crud import login_history as login_history_crud
from ...schemas.user import UserCreate, UserOut, UserUpdate, UserChangePassword, UserPermissionsUpdate, AdminResetPasswordRequest
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role
from ...core.security import verify_password
from ...schemas.responses import GenericResponse, ErrorResponse
from ...core.i18n import _
from fastapi.encoders import jsonable_encoder

logger = logging.getLogger(__name__)


router = APIRouter()


# ------------------------------------------------------------------
# 2FA Endpoints (must come before /me route for proper routing)
# ------------------------------------------------------------------
class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code_url: str
    manual_entry_key: str

class TwoFactorVerifyRequest(BaseModel):
    code: str

class TwoFactorStatusResponse(BaseModel):
    enabled: bool

@router.get("/me/2fa/status", response_model=TwoFactorStatusResponse)
def get_2fa_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current 2FA status"""
    return GenericResponse(data={"enabled": current_user.is_2fa_enabled or False})

@router.post("/me/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate 2FA secret and QR code for setup"""
    import pyotp # type: ignore[import-untyped]
    from urllib.parse import quote
    
    from ...core.config import settings
    
    # Generate a new secret
    secret = pyotp.random_base32()
    
    # Create TOTP object
    totp = pyotp.TOTP(secret)
    
    # Generate provisioning URI
    issuer_name = settings.APP_NAME or "Finance Management System"
    account_name = current_user.email or current_user.username
    provisioning_uri = totp.provisioning_uri(
        name=account_name,
        issuer_name=issuer_name
    )
    
    # Generate QR code URL using online service (fallback if qrcode library not available)
    # Using QR Server API (free, no auth required)
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={quote(provisioning_uri)}"
    
    # Store secret temporarily (not enabled yet - user needs to verify first)
    current_user.otp_secret = secret
    current_user.is_2fa_enabled = False  # Not enabled until verified
    db.commit()
    db.refresh(current_user)
    
    return GenericResponse(
        message="2FA setup initiated",
        data={
            "secret": secret,
            "qr_code_url": qr_code_url,
            "manual_entry_key": secret
        }
    )

@router.post("/me/2fa/verify", response_model=GenericResponse)
def verify_2fa(
    verify_data: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Verify 2FA code and enable 2FA"""
    import pyotp # type: ignore[import-untyped]
    
    if not current_user.otp_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated. Please setup 2FA first.")
    
    # Verify the code
    totp = pyotp.TOTP(current_user.otp_secret)
    if not totp.verify(verify_data.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Enable 2FA
    current_user.is_2fa_enabled = True
    db.commit()
    db.refresh(current_user)
    
    return GenericResponse(message="2FA enabled successfully", data={"enabled": True})

class TwoFactorDisableRequest(BaseModel):
    current_password: str

@router.post("/me/2fa/disable", response_model=GenericResponse)
def disable_2fa(
    password_data: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Disable 2FA (requires password verification)"""
    from ...core.security import verify_password
    
    # Verify password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Disable 2FA and clear secret
    current_user.is_2fa_enabled = False
    current_user.otp_secret = None
    db.commit()
    db.refresh(current_user)
    
    return GenericResponse(message="2FA disabled successfully", data={"enabled": False})


# ------------------------------------------------------------------
# IP Restriction Endpoints (must come before /me route for proper routing)
# ------------------------------------------------------------------
class IPRestrictionStatusResponse(BaseModel):
    enabled: bool
    allowed_ips: List[str]

class IPRestrictionUpdateRequest(BaseModel):
    enabled: bool

class AddIPRequest(BaseModel):
    ip_address: str

@router.get("/me/ip-restriction", response_model=IPRestrictionStatusResponse)
def get_ip_restriction_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get IP restriction status and allowed IPs"""
    import json
    allowed_ips = []
    if current_user.allowed_ips:
        try:
            allowed_ips = json.loads(current_user.allowed_ips)
            if not isinstance(allowed_ips, list):
                allowed_ips = []
        except (json.JSONDecodeError, ValueError):
            # Fallback to comma-separated string
            allowed_ips = [ip.strip() for ip in current_user.allowed_ips.split(',') if ip.strip()]
    
    return GenericResponse(
        data={
            "enabled": current_user.ip_restriction_enabled or False,
            "allowed_ips": allowed_ips
        }
    )
@router.put("/me/ip-restriction", response_model=GenericResponse[IPRestrictionStatusResponse])
def update_ip_restriction(
    ip_data: IPRestrictionUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Enable or disable IP restriction"""
    current_user.ip_restriction_enabled = ip_data.enabled
    db.commit()
    db.refresh(current_user)
    
    import json
    allowed_ips = []
    if current_user.allowed_ips:
        try:
            allowed_ips = json.loads(current_user.allowed_ips)
            if not isinstance(allowed_ips, list):
                allowed_ips = []
        except (json.JSONDecodeError, ValueError):
            allowed_ips = [ip.strip() for ip in current_user.allowed_ips.split(',') if ip.strip()]
    
    return GenericResponse(
        message="IP restriction updated",
        data={
            "enabled": current_user.ip_restriction_enabled,
            "allowed_ips": allowed_ips
        }
    )

@router.post("/me/ip-restriction/allowed-ips", response_model=IPRestrictionStatusResponse)
def add_allowed_ip(
    ip_request: AddIPRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add an IP address to the allowed list"""
    import json
    import re
    
    # Validate IP address format (IPv4 or IPv4 CIDR)
    ip_pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$'
    if not re.match(ip_pattern, ip_request.ip_address):
        raise HTTPException(status_code=400, detail="Invalid IP address format")
    
    # Get current allowed IPs
    allowed_ips = []
    if current_user.allowed_ips:
        try:
            allowed_ips = json.loads(current_user.allowed_ips)
            if not isinstance(allowed_ips, list):
                allowed_ips = []
        except (json.JSONDecodeError, ValueError):
            allowed_ips = [ip.strip() for ip in current_user.allowed_ips.split(',') if ip.strip()]
    
    # Add IP if not already in list
    if ip_request.ip_address not in allowed_ips:
        allowed_ips.append(ip_request.ip_address)
        current_user.allowed_ips = json.dumps(allowed_ips)
        db.commit()
        db.refresh(current_user)
    else:
        raise HTTPException(status_code=400, detail="IP address already in allowed list")
    
    return GenericResponse(
        message="IP address added successfully",
        data={
            "enabled": current_user.ip_restriction_enabled or False,
            "allowed_ips": allowed_ips
        }
    )
@router.delete("/me/ip-restriction/allowed-ips/{ip_address:path}", response_model=GenericResponse[IPRestrictionStatusResponse])
def remove_allowed_ip(
    ip_address: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove an IP address from the allowed list"""
    import json
    from urllib.parse import unquote
    
    # Decode URL-encoded IP address
    ip_address = unquote(ip_address)
    
    # Get current allowed IPs
    allowed_ips = []
    if current_user.allowed_ips:
        try:
            allowed_ips = json.loads(current_user.allowed_ips)
            if not isinstance(allowed_ips, list):
                allowed_ips = []
        except (json.JSONDecodeError, ValueError):
            allowed_ips = [ip.strip() for ip in current_user.allowed_ips.split(',') if ip.strip()]
    
    # Remove IP if exists
    if ip_address in allowed_ips:
        allowed_ips.remove(ip_address)
        current_user.allowed_ips = json.dumps(allowed_ips) if allowed_ips else None
        db.commit()
        db.refresh(current_user)
    else:
        raise HTTPException(status_code=404, detail="IP address not found in allowed list")
    
    return {
        "enabled": current_user.ip_restriction_enabled or False,
        "allowed_ips": allowed_ips
    }


# GET /me/verification-history
@router.get("/me/verification-history", response_model=List[dict])
def get_verification_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get verification/login history for current user"""
    try:
        # Get login history from database
        login_history = login_history_crud.get_by_user(db, current_user.id, skip=0, limit=limit)
        
        # Format history entries
        history = []
        for entry in login_history:
            history.append({
                "id": str(entry.id),
                "device": entry.device or "Unknown Device",
                "location": entry.location or "Unknown",
                "ip": entry.ip_address or "Unknown",
                "date": entry.login_at.isoformat() if entry.login_at else "",
                "success": entry.success
            })
        
        return GenericResponse(
            message="Verification history retrieved",
            data=history
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching verification history for user {current_user.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch verification history: {str(e)}"
        )

# GET /me
@router.get("/me", response_model=GenericResponse[UserOut])
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return GenericResponse(data=UserOut.from_orm(current_user))

# PUT /me
@router.get("/me", response_model=GenericResponse[UserOut])
@router.put("/me", response_model=GenericResponse[UserOut])
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if user_update.role is not None:
        raise HTTPException(status_code=403, detail="Cannot change your own role")
    if user_update.is_active is not None:
        raise HTTPException(status_code=403, detail="Cannot change your own active status")

    updated_user = user_crud.update(db, db_obj=current_user, obj_in=user_update)
    return GenericResponse(message="Profile updated successfully", data=UserOut.from_orm(updated_user))


@router.post("/me/profile-image", response_model=UserOut)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload and set profile image for current user"""
    import os
    import uuid
    from ...core.config import settings

    # 1. Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )

    # 2. Setup upload directory
    upload_dir = os.path.join("uploads", "profile_images")
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)

    # 3. Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
    unique_filename = f"{current_user.id}_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # 4. Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            # Limit file size to 5MB
            if len(content) > 5 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="File too large. Maximum size 5MB.")
            buffer.write(content)
    except Exception as e:
        logger.error(f"Failed to save profile image: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save image")

    # 5. Update user in database
    # Construct public URL (this depends on main.py mounting /uploads)
    url = f"/uploads/profile_images/{unique_filename}"
    
    # Optional: Delete old image if it exists
    if current_user.profile_image_url:
        old_path = current_user.profile_image_url.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception as e:
                logger.warning(f"Failed to delete old profile image {old_path}: {str(e)}")

    current_user.profile_image_url = url
    db.commit()
    db.refresh(current_user)

    return current_user


@router.delete("/me/profile-image", response_model=UserOut)
async def delete_profile_image(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove profile image for current user"""
    import os
    
    if not current_user.profile_image_url:
        raise HTTPException(status_code=400, detail="No profile image to remove")

    # Delete the physical file
    file_path = current_user.profile_image_url.lstrip("/")
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.error(f"Failed to delete profile image file {file_path}: {str(e)}")

    # Clear field in database
    current_user.profile_image_url = None
    db.commit()
    db.refresh(current_user)

    return current_user


# ------------------------------------------------------------------
# POST /me/change-password
# ------------------------------------------------------------------
class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/me/change-password", response_model=GenericResponse)
def change_password(
    password_data: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change user password"""
    from ...core.security import verify_password, get_password_hash
    
    # Verify current password if provided (it's optional now as per user request)
    if password_data.current_password:
        if not verify_password(password_data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    db.refresh(current_user)
    
    locale = getattr(request.state, "locale", "en")
    return GenericResponse(message=_("PASSWORD_CHANGED_SUCCESS", locale))


@router.post("/admin-reset-password", response_model=GenericResponse)
def admin_reset_password(
    reset_data: AdminResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Administrative password reset.
    Allowed for:
    - SUPER_ADMIN/ADMIN: Can reset anyone except SUPER_ADMIN (only SUPER_ADMIN can reset SUPER_ADMIN)
    - FINANCE_ADMIN/MANAGER: Can only reset their subordinates (accountants and employees)
    """
    from ...core.security import get_password_hash
    
    # 1. Look up target user by email or username
    target_user = db.query(User).filter(
        (User.email == reset_data.username_or_email) | (User.username == reset_data.username_or_email)
    ).first()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 2. RBAC & Hierarchy Checks
    has_permission = False
    
    if current_user.role == UserRole.SUPER_ADMIN:
        has_permission = True
    elif current_user.role == UserRole.ADMIN:
        # Admin cannot reset Super Admin
        if target_user.role != UserRole.SUPER_ADMIN:
            has_permission = True
    elif current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        # Check if target is a subordinate
        if target_user.manager_id == current_user.id:
            # Only allow resetting accountants and employees
            if target_user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]:
                has_permission = True
    
    if not has_permission:
        raise HTTPException(status_code=403, detail="Insufficient permissions to reset this user's password")
        
    # 3. Update password
    target_user.hashed_password = get_password_hash(reset_data.new_password)
    db.commit()
    
    # 4. Success message
    locale = getattr(request.state, "locale", "en")
    return GenericResponse(message=_("ADMIN_PASSWORD_RESET_SUCCESS", locale, username=target_user.username))


# ------------------------------------------------------------------
# User Management Endpoints
# ------------------------------------------------------------------
# GET / (List users - manager and above)
# ------------------------------------------------------------------
@router.get("", response_model=GenericResponse[List[UserOut]])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.MANAGER))
):
    """List users with role-based filtering:
    - Admin/Super Admin: See all users
    - Finance Admin/Manager: See only their subordinates (accountants and employees), NOT other finance admins/managers
    """
    # Admin and Super Admin can see all users
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        users = user_crud.get_multi(db, skip=skip, limit=limit)
        return GenericResponse(data=users)
    
    # Finance Admin and Manager can only see their subordinates (accountants and employees)
    # They CANNOT see other finance admins or managers
    if current_user.role in [UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        # Get all subordinates in the hierarchy
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        subordinate_ids.append(current_user.id)  # Include themselves
        
        # Get all users and filter by subordinate IDs
        # Also filter to only include accountants and employees (exclude other finance admins/managers)
        all_users = user_crud.get_multi(db, skip=0, limit=10000)  # Get all to filter
        filtered_users = [
            user for user in all_users 
            if user.id in subordinate_ids 
            and user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        ]
        
        # Apply pagination
        return GenericResponse(data=filtered_users[skip:skip + limit])
    
    return GenericResponse(data=[])


# ------------------------------------------------------------------
# GET /{user_id}
# ------------------------------------------------------------------
@router.get("/{user_id}/subordinates", response_model=GenericResponse[List[UserOut]])
def read_user_subordinates(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return direct subordinates for a user."""
    target_user = user_crud.get(db, id=user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    is_self = current_user.id == user_id
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    # Allow accountants and employees to get their manager's (Finance Admin's) subordinates
    is_subordinate_viewing_manager = (
        current_user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE] and 
        current_user.manager_id == user_id
    )

    if not (is_self or is_admin or is_subordinate_viewing_manager):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return GenericResponse(data=user_crud.get_subordinates(db, user_id))


@router.get("/{user_id}", response_model=GenericResponse[UserOut])
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Self
    if current_user.id == user_id:
        return user

    # Manager and Finance Admin see subordinates
    if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
        subs = user_crud.get_hierarchy(db, current_user.id)
        if user_id not in [s.id for s in subs]:
            raise HTTPException(status_code=403, detail="Not in your hierarchy")

    # Admin/Super Admin sees all
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return GenericResponse(data=UserOut.from_orm(user))


# ------------------------------------------------------------------
# POST / (Admin creates any user)
# ------------------------------------------------------------------
@router.post("", response_model=GenericResponse[UserOut], status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.ADMIN))
):
    """Admin creates any user (including managers and finance admins)"""
    if current_user.role == UserRole.SUPER_ADMIN:
        pass  # Can create anyone
    elif current_user.role == UserRole.ADMIN:
        # Admin can create: FINANCE_ADMIN, MANAGER, ACCOUNTANT, EMPLOYEE
        # But NOT SUPER_ADMIN (only super admin can create super admin)
        allowed_roles = [UserRole.FINANCE_ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        
        if user_in.role == UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Only super admin can create super admin users")
        
        # Check if role is in allowed list
        if user_in.role not in allowed_roles:
            role_str = user_in.role.value if isinstance(user_in.role, UserRole) else str(user_in.role)
            raise HTTPException(
                status_code=403, 
                detail=f"Admins can only create finance_admin, manager, accountant, or employee. Attempted role: {role_str}"
            )
        
        if user_in.manager_id:
            manager = user_crud.get(db, user_in.manager_id)
            if not manager or manager.role != UserRole.MANAGER:
                raise HTTPException(status_code=400, detail="manager_id must be a valid manager")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        user = user_crud.create(db=db, obj_in=user_in)
        
        # Send welcome notification (email-heavy)
        try:
            from ...services.notification_service import NotificationService
            NotificationService.notify_user_created(
                db=db,
                new_user_id=user.id,
                new_user_email=user.email,
                created_by_id=current_user.id,
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.warning(f"Notification failed for user creation: {str(e)}")
            
        return GenericResponse(message="User created successfully", data=UserOut.from_orm(user), status_code=201)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ------------------------------------------------------------------
# POST /subordinates (Manager creates accountant/employee)
# ------------------------------------------------------------------
@router.post("/subordinates", response_model=GenericResponse[UserOut], status_code=status.HTTP_201_CREATED)
def create_subordinate(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.MANAGER))
):
    """Manager or Finance Admin creates accountant or employee under them"""
    if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
        if user_in.role not in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]:
            raise HTTPException(status_code=403, detail="Managers can only create accountant or employee")
        user_in.manager_id = current_user.id  # Force assignment
    elif current_user.role == UserRole.ADMIN:
        if user_in.role != UserRole.MANAGER:
            raise HTTPException(status_code=403, detail="Admins can only create managers via /subordinates")
        if user_in.manager_id:
            manager = user_crud.get(db, user_in.manager_id)
            if not manager or manager.role != UserRole.MANAGER:
                raise HTTPException(status_code=400, detail="manager_id must be a valid manager")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        user = user_crud.create(db=db, obj_in=user_in)
        
        # Send welcome notification (email-heavy)
        try:
            from ...services.notification_service import NotificationService
            NotificationService.notify_user_created(
                db=db,
                new_user_id=user.id,
                new_user_email=user.email,
                created_by_id=current_user.id,
                background_tasks=background_tasks
            )
        except Exception as e:
            logger.warning(f"Notification failed for subordinate creation: {str(e)}")
            
        return GenericResponse(message="Subordinate created successfully", data=UserOut.from_orm(user), status_code=201)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ------------------------------------------------------------------
# PUT /{user_id}
# ------------------------------------------------------------------
@router.put("/{user_id}", response_model=GenericResponse[UserOut])
def update_user(
    user_id: int,
    user_update: UserUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_user = user_crud.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Super Admin protection
    if db_user.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot modify super admin")

    # Admin and Super Admin can update any user
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        updated_user = user_crud.update(db, db_obj=db_user, obj_in=user_update)
        
        # Send notification about user update
        try:
            from ...services.notification_service import NotificationService
            changes = []
            if user_update.email and user_update.email != db_user.email:
                changes.append("email")
            if user_update.role and user_update.role != db_user.role:
                changes.append("role")
            if user_update.is_active is not None and user_update.is_active != db_user.is_active:
                changes.append("active status")
            
            if changes:
                NotificationService.notify_user_updated(
                    db=db,
                    updated_user_id=updated_user.id,
                    updated_user_email=updated_user.email,
                    updated_by_id=current_user.id,
                    updated_by_name=current_user.full_name or current_user.username,
                    changes=changes,
                    background_tasks=background_tasks
                )
        except Exception as e:
            logger.warning(f"Notification failed for user update: {str(e)}")
        
        return updated_user
    
    # Finance Manager (Manager or Finance Admin) can update their subordinates (accountants and employees)
    if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
        # Check if target user is a subordinate
        is_subordinate = db_user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        is_my_subordinate = db_user.manager_id == current_user.id
        
        if is_subordinate and is_my_subordinate:
            # Prevent managers from changing role or manager_id to avoid hierarchy issues
            if user_update.role is not None and user_update.role != db_user.role:
                raise HTTPException(status_code=403, detail="Cannot change user role")
            if user_update.manager_id is not None and user_update.manager_id != current_user.id:
                raise HTTPException(status_code=403, detail="Cannot change manager assignment")
    updated_user = user_crud.update(db, db_obj=db_user, obj_in=user_update)
    return GenericResponse(message="User updated successfully", data=UserOut.from_orm(updated_user))


# ------------------------------------------------------------------
# POST /{user_id}/delete - Delete user with password verification
# ------------------------------------------------------------------
class DeleteUserRequest(BaseModel):
    password: str

@router.post("/{user_id}/delete")
def delete_user(
    user_id: int,
    delete_request: DeleteUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
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
            detail="Password is required to delete a user."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this user."
        )

    db_user = user_crud.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Super Admin protection
    if db_user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot delete super admin")

    # Admin protection - prevent deleting admin users
    if db_user.role == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot delete admin users")

    # Admin and Super Admin can delete any user (except other admins/super admins)
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        user_crud.delete(db, id=user_id)
        return GenericResponse(message="User deleted successfully")
    
    # Finance Manager (Manager or Finance Admin) can delete their subordinates (accountants and employees)
    if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
        # Check if target user is a subordinate
        is_subordinate = db_user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        is_my_subordinate = db_user.manager_id == current_user.id
        
        if is_subordinate and is_my_subordinate:
            user_crud.delete(db, id=user_id)
            return GenericResponse(message="User deleted successfully")
        else:
            raise HTTPException(status_code=403, detail="You can only delete your subordinates (accountants and employees)")
    
    # Other roles cannot delete users
    raise HTTPException(status_code=403, detail="Insufficient permissions")


# ------------------------------------------------------------------
# POST /{user_id}/deactivate
# ------------------------------------------------------------------
class ActivateDeactivateUserRequest(BaseModel):
    password: str

@router.post("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    deactivate_request: ActivateDeactivateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
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
            detail="Password is required to deactivate a user."
        )
    
    # Verify password
    password_to_verify = deactivate_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to deactivate this user."
        )

    db_user = user_crud.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    if db_user.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot deactivate super admin")

    # Admin and Super Admin can deactivate any user
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        user_crud.update(db, db_obj=db_user, obj_in=UserUpdate(is_active=False))
        return {"message": "User deactivated successfully"}
    
    # Finance Manager (Manager or Finance Admin) can deactivate their subordinates
    if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
        is_subordinate = db_user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        is_my_subordinate = db_user.manager_id == current_user.id
        
        if is_subordinate and is_my_subordinate:
            user_crud.update(db, db_obj=db_user, obj_in=UserUpdate(is_active=False))
            return {"message": "User deactivated successfully"}
        else:
            raise HTTPException(status_code=403, detail="You can only deactivate your subordinates (accountants and employees)")
    
    raise HTTPException(status_code=403, detail="Insufficient permissions")


# ------------------------------------------------------------------
# POST /{user_id}/activate
# ------------------------------------------------------------------
@router.post("/{user_id}/activate")
def activate_user(
    user_id: int,
    activate_request: ActivateDeactivateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
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
            detail="Password is required to activate a user."
        )
    
    # Verify password
    password_to_verify = activate_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to activate this user."
        )

    db_user = user_crud.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Admin and Super Admin can activate any user
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        user_crud.update(db, db_obj=db_user, obj_in=UserUpdate(is_active=True))
        return {"message": "User activated successfully"}
    
    # Finance Manager (Manager or Finance Admin) can activate their subordinates
    if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
        is_subordinate = db_user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        is_my_subordinate = db_user.manager_id == current_user.id
        
        if is_subordinate and is_my_subordinate:
            user_crud.update(db, db_obj=db_user, obj_in=UserUpdate(is_active=True))
            return {"message": "User activated successfully"}
        else:
            raise HTTPException(status_code=403, detail="You can only activate your subordinates (accountants and employees)")
    
    raise HTTPException(status_code=403, detail="Insufficient permissions")


# ------------------------------------------------------------------
# GET /{user_id}/permissions - Get user permissions
# ------------------------------------------------------------------
@router.get("/{user_id}/permissions")
def get_user_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user permissions. Only admins and finance admins can view permissions."""
    try:
        db_user = user_crud.get(db, id=user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Admin and Super Admin can view any user's permissions
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return {"permissions": db_user.permissions or []}
        
        # Finance Manager (Manager or Finance Admin) can view their subordinates' permissions
        if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
            is_subordinate = db_user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            is_my_subordinate = db_user.manager_id == current_user.id
            
            if is_subordinate and is_my_subordinate:
                return {"permissions": db_user.permissions or []}
            else:
                raise HTTPException(status_code=403, detail="You can only view permissions for your subordinates (accountants and employees)")
        
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_user_permissions for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user permissions: {str(e)}"
        )


# ------------------------------------------------------------------
# PUT /{user_id}/permissions - Update user permissions
# ------------------------------------------------------------------
@router.put("/{user_id}/permissions")
def update_user_permissions(
    user_id: int,
    permissions_update: UserPermissionsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user permissions. Only admins and finance admins can update permissions."""
    try:
        db_user = user_crud.get(db, id=user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Super Admin protection
        if db_user.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=403, detail="Cannot modify super admin permissions")
        
        # Admin and Super Admin can update any user's permissions
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            user_crud.update(db, db_obj=db_user, obj_in=UserUpdate(permissions=permissions_update.permissions))
            return {"message": "Permissions updated successfully", "permissions": permissions_update.permissions}
        
        # Finance Manager (Manager or Finance Admin) can update their subordinates' permissions
        if current_user.role in [UserRole.MANAGER, UserRole.FINANCE_ADMIN]:
            is_subordinate = db_user.role in [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
            is_my_subordinate = db_user.manager_id == current_user.id
            
            if is_subordinate and is_my_subordinate:
                user_crud.update(db, db_obj=db_user, obj_in=UserUpdate(permissions=permissions_update.permissions))
                return {"message": "Permissions updated successfully", "permissions": permissions_update.permissions}
            else:
                raise HTTPException(status_code=403, detail="You can only update permissions for your subordinates (accountants and employees)")
        
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_user_permissions for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user permissions: {str(e)}"
        )
