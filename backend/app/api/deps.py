# app/api/deps.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError

from ..core.database import get_db, SessionLocal
from ..core.security import verify_token
from ..crud.user import user as user_crud
from ..models.user import User, UserRole


# ------------------------------------------------------------------
# OAuth2 Scheme
# ------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


# ------------------------------------------------------------------
# Get Current User
# ------------------------------------------------------------------
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = verify_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = user_crud.get(db, id=int(user_id))
    if user is None:
        raise credentials_exception
    return user


# ------------------------------------------------------------------
# Get Current Active User
# ------------------------------------------------------------------
async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# ------------------------------------------------------------------
# Get Current Superuser
# ------------------------------------------------------------------
async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user


# ------------------------------------------------------------------
# Role-Based Access Control
# ------------------------------------------------------------------
def require_role(required_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        hierarchy = {
            UserRole.EMPLOYEE: 0,
            UserRole.ACCOUNTANT: 1,
            UserRole.MANAGER: 2,
            UserRole.ADMIN: 3,
            UserRole.SUPER_ADMIN: 4,
        }
        if hierarchy.get(current_user.role, -1) < hierarchy.get(required_role, -1):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker


def require_min_role(min_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        hierarchy = {
            UserRole.EMPLOYEE: 0,
            UserRole.ACCOUNTANT: 1,
            UserRole.MANAGER: 2,
            UserRole.ADMIN: 3,
            UserRole.SUPER_ADMIN: 4,
        }
        if hierarchy.get(current_user.role, -1) < hierarchy.get(min_role, -1):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker


# ------------------------------------------------------------------
# Can Access User Data (Hierarchy Check)
# ------------------------------------------------------------------
def can_access_user_data(target_user_id: int):
    def checker(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> User:
        # 1. Self-access
        if current_user.id == target_user_id:
            return current_user

        # 2. Manager sees direct subordinates
        if current_user.role == UserRole.MANAGER:
            subs = user_crud.get_subordinates(db, manager_id=current_user.id)
            if any(u.id == target_user_id for u in subs):
                return current_user

        # 3. Admin/Super Admin sees everyone
        if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this user's data"
        )
    return checker