# app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from jose import JWTError, jwt # type: ignore[import-untyped]
from fastapi import HTTPException, status # type: ignore[import-untyped]
import secrets
import pyotp # type: ignore[import-untyped]
import bcrypt # type: ignore[import-untyped]

from .config import settings


# ------------------------------------------------------------------
# BCRYPT: Safe password hashing (72-byte limit enforced)
# ------------------------------------------------------------------
# Use bcrypt directly to avoid passlib's internal bug detection issues
BCRYPT_ROUNDS = 12


def _safe_password_bytes(password: str) -> bytes:
    """
    bcrypt only accepts passwords ≤ 72 bytes.
    This function safely truncates UTF-8 bytes to 72 max,
    ensuring we don't break multi-byte UTF-8 sequences.
    Returns bytes for direct use with bcrypt.
    """
    if not password:
        return b""
    
    encoded = password.encode("utf-8")
    if len(encoded) <= 72:
        return encoded
    
    # Truncate to 72 bytes, but ensure we don't break UTF-8 sequences
    truncated = encoded[:72]
    # Remove any incomplete UTF-8 sequences at the end
    # UTF-8 continuation bytes start with 10xxxxxx (0b10000000 = 0x80)
    while truncated and (truncated[-1] & 0b11000000) == 0b10000000:
        truncated = truncated[:-1]
    
    return truncated


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        # Ensure password is within 72-byte limit
        safe_pwd_bytes = _safe_password_bytes(plain_password)
        
        # Convert hashed_password to bytes if it's a string
        if isinstance(hashed_password, str):
            hashed_password_bytes = hashed_password.encode("utf-8")
        else:
            hashed_password_bytes = hashed_password
        
        # Use bcrypt directly
        return bcrypt.checkpw(safe_pwd_bytes, hashed_password_bytes)
    except (ValueError, TypeError) as e:
        # Handle bcrypt-specific errors (e.g., invalid hash format)
        return False
    except Exception as e:
        # Log unexpected errors but don't expose them
        # In production, you might want to log this
        return False


def get_password_hash(password: str) -> str:
    """Generate password hash with 72-byte safety."""
    try:
        # Ensure password is within 72-byte limit
        safe_pwd_bytes = _safe_password_bytes(password)
        
        # Generate salt and hash using bcrypt directly
        salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        hashed = bcrypt.hashpw(safe_pwd_bytes, salt)
        
        # Return as string (bcrypt hashes are ASCII-safe)
        return hashed.decode("utf-8")
    except (ValueError, TypeError) as e:
        # If there's an error with the password, hash an empty string as fallback
        # This should rarely happen due to _safe_password_bytes, but handle it anyway
        salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        hashed = bcrypt.hashpw(b"", salt)
        return hashed.decode("utf-8")
    except Exception as e:
        # For any other unexpected error, raise it
        raise


# ------------------------------------------------------------------
# JWT & Tokens
# ------------------------------------------------------------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
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


def generate_refresh_token() -> str:
    """Generate a long-lived refresh token."""
    return secrets.token_urlsafe(64)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> tuple[str, datetime]:
    """
    Create a refresh token and return its value and expiration date.
    We'll return a random string (opaque token) for better security + expiration date.
    """
    token = generate_refresh_token()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    return token, expire
