# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
import secrets
import pyotp

from .config import settings


# ------------------------------------------------------------------
# BCRYPT: Safe password hashing (72-byte limit enforced)
# ------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _safe_password(password: str) -> str:
    """
    bcrypt only accepts passwords ≤ 72 bytes.
    This function safely truncates UTF-8 bytes to 72 max.
    """
    encoded = password.encode("utf-8")
    if len(encoded) > 72:
        encoded = encoded[:72]
    return encoded.decode("utf-8", "ignore")  # ignore invalid bytes


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(_safe_password(plain_password), hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash with 72-byte safety."""
    return pwd_context.hash(_safe_password(password))


# ------------------------------------------------------------------
# JWT & Tokens
# ------------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> dict:
    """Verify JWT token and return payload."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ------------------------------------------------------------------
# OTP & Secure Tokens
# ------------------------------------------------------------------
def generate_otp_secret() -> str:
    """Generate a new OTP secret."""
    return pyotp.random_base32()


def generate_otp(secret: str) -> str:
    """Generate OTP code for given secret."""
    return pyotp.TOTP(secret).now()


def verify_otp(secret: str, token: str) -> bool:
    """Verify OTP token against secret."""
    return pyotp.TOTP(secret).verify(token, valid_window=1)


def generate_password_reset_token() -> str:
    """Generate secure password reset token."""
    return secrets.token_urlsafe(32)


def generate_api_key() -> str:
    """Generate API key for external integrations."""
    return secrets.token_urlsafe(40)