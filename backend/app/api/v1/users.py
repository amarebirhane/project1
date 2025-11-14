# app/api/v1/users.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...crud.user import user as user_crud
from ...schemas.user import UserCreate, UserOut, UserUpdate
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role


router = APIRouter()


# ------------------------------------------------------------------
# GET /me
# ------------------------------------------------------------------
@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# ------------------------------------------------------------------
# PUT /me
# ------------------------------------------------------------------
@router.put("/me", response_model=UserOut)
def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if user_update.role is not None:
        raise HTTPException(status_code=403, detail="Cannot change your own role")
    if user_update.is_active is not None:
        raise HTTPException(status_code=403, detail="Cannot change your own active status")

    return user_crud.update(db, db_obj=current_user, obj_in=user_update)


# ------------------------------------------------------------------
# GET / (List users - manager and above)
# ------------------------------------------------------------------
@router.get("/", response_model=List[UserOut])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.MANAGER))
):
    return user_crud.get_multi(db, skip=skip, limit=limit)


# ------------------------------------------------------------------
# GET /{user_id}
# ------------------------------------------------------------------
@router.get("/{user_id}", response_model=UserOut)
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

    # Manager sees subordinates
    if current_user.role == UserRole.MANAGER:
        subs = user_crud.get_hierarchy(db, current_user.id)
        if user_id not in [s.id for s in subs]:
            raise HTTPException(status_code=403, detail="Not in your hierarchy")

    # Admin/Super Admin sees all
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return user


# ------------------------------------------------------------------
# POST / (Admin creates any user)
# ------------------------------------------------------------------
@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.ADMIN))
):
    """Admin creates any user (including managers)"""
    if current_user.role == UserRole.SUPER_ADMIN:
        pass  # Can create anyone
    elif current_user.role == UserRole.ADMIN:
        if user_in.role not in [UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.EMPLOYEE]:
            raise HTTPException(status_code=403, detail="Admins can only create manager, accountant, or employee")
        if user_in.manager_id:
            manager = user_crud.get(db, user_in.manager_id)
            if not manager or manager.role != UserRole.MANAGER:
                raise HTTPException(status_code=400, detail="manager_id must be a valid manager")
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return user_crud.create(db=db, obj_in=user_in)


# ------------------------------------------------------------------
# POST /subordinates (Manager creates accountant/employee)
# ------------------------------------------------------------------
@router.post("/subordinates", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_subordinate(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.MANAGER))
):
    """Manager creates accountant or employee under them"""
    if current_user.role == UserRole.MANAGER:
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

    return user_crud.create(db=db, obj_in=user_in)


# ------------------------------------------------------------------
# PUT /{user_id}
# ------------------------------------------------------------------
@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.ADMIN))
):
    db_user = user_crud.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot modify super admin")

    return user_crud.update(db, db_obj=db_user, obj_in=user_update)


# ------------------------------------------------------------------
# DELETE /{user_id}
# ------------------------------------------------------------------
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN))
):
    db_user = user_crud.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user_crud.delete(db, id=user_id)
    return {"message": "User deleted successfully"}


# ------------------------------------------------------------------
# POST /{user_id}/deactivate
# ------------------------------------------------------------------
@router.post("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.ADMIN))
):
    db_user = user_crud.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot deactivate super admin")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user_crud.update(db, db_obj=db_user, obj_in=UserUpdate(is_active=False))
    return {"message": "User deactivated successfully"}


# ------------------------------------------------------------------
# POST /{user_id}/activate
# ------------------------------------------------------------------
@router.post("/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_min_role(UserRole.ADMIN))
):
    db_user = user_crud.get(db, id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    user_crud.update(db, db_obj=db_user, obj_in=UserUpdate(is_active=True))
    return {"message": "User activated successfully"}