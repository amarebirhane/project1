# app/api/v1/auth.py
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from ...core.database import get_db
from ...core.config import settings
from ...core.security import verify_password, create_access_token, get_password_hash
from ...models.user import User, UserRole

import pyotp


# ------------------------------------------------------------------
# OTP Utilities
# ------------------------------------------------------------------
def generate_otp_secret() -> str:
    return pyotp.random_base32()

def generate_otp(secret: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.now()

def verify_otp(secret: str, otp_code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(otp_code, valid_window=1)


# ------------------------------------------------------------------
# Pydantic Schemas
# ------------------------------------------------------------------
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


# ------------------------------------------------------------------
# OAuth2 Scheme
# ------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ------------------------------------------------------------------
# Dependency: Get current active user
# ------------------------------------------------------------------
async def get_current_active_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


# ------------------------------------------------------------------
# CRUD Helper
# ------------------------------------------------------------------
class UserCRUD:
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        user = UserCRUD.get_by_username(db, username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def create(db: Session, obj_in: UserCreate) -> User:
        if UserCRUD.get_by_email(db, obj_in.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if UserCRUD.get_by_username(db, obj_in.username):
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed = get_password_hash(obj_in.password)
        db_user = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=hashed,
            full_name=obj_in.full_name,
            phone=obj_in.phone,
            department=obj_in.department,
            role=obj_in.role,
            is_active=True,
            is_verified=True,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


user_crud = UserCRUD()


# ------------------------------------------------------------------
# Router
# ------------------------------------------------------------------
# router = APIRouter(prefix="/auth", tags=["Authentication"])
# ------------------------------------------------------------------
# Router – REMOVE prefix="/auth"
# ------------------------------------------------------------------
router = APIRouter(tags=["Authentication"])  # ← NO PREFIX HERE

# ------------------------------------------------------------------
# LOGIN (OAuth2 form-data) – CRITICAL FOR test_hierarchy.py
# ------------------------------------------------------------------
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = user_crud.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ------------------------------------------------------------------
# REGISTER
# ------------------------------------------------------------------
@router.post("/register", response_model=UserOut, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = user_crud.create(db, user_data)
    return UserOut.from_orm(user)


# ------------------------------------------------------------------
# LOGIN with JSON
# ------------------------------------------------------------------
@router.post("/login-json", response_model=dict)
def login_json(user_data: UserLogin, db: Session = Depends(get_db)):
    user = user_crud.authenticate(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
        }
    }


# ------------------------------------------------------------------
# OTP Endpoints
# ------------------------------------------------------------------
@router.post("/generate-otp", response_model=dict)
def generate_otp_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not current_user.otp_secret:
        current_user.otp_secret = generate_otp_secret()
        db.commit()
        db.refresh(current_user)

    otp_code = generate_otp(current_user.otp_secret)
    return {"otp_code": otp_code, "message": "OTP generated"}


@router.post("/verify-otp", response_model=dict)
def verify_otp_endpoint(
    otp_code: str,
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.otp_secret:
        raise HTTPException(status_code=400, detail="OTP not configured")
    if not verify_otp(current_user.otp_secret, otp_code):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    return {"message": "OTP verified"}


# ------------------------------------------------------------------
# ME
# ------------------------------------------------------------------
@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# ------------------------------------------------------------------
# LOGOUT (client-side)
# ------------------------------------------------------------------
@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}