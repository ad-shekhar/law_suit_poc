"""
JWT Authentication Middleware — LegalOS Backend
Provides get_current_user dependency for FastAPI routes.
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Header, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from ..config import settings
from ..db import memory_db

logger = logging.getLogger(__name__)

# ─── Password Hashing ─────────────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


# ─── JWT Token ────────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """
    Create a signed JWT access token.
    Payload: { sub: user_id, email, role, firm_id, exp }
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    Returns the payload dict or None on failure.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode failed: {e}")
        return None


# ─── FastAPI Dependency ───────────────────────────────────────────────────────

async def get_current_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
) -> str:
    """
    FastAPI dependency. Extracts user_id from:
    1. Bearer JWT token in Authorization header (preferred)
    2. X-User-Id header (fallback for backwards compatibility)

    Returns user_id string. Raises 401 if neither is present or token is invalid.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer "):]
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                return user_id
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if x_user_id:
        return x_user_id

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Provide Authorization: Bearer <token> or X-User-Id header.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_optional_user_id(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
) -> Optional[str]:
    """
    Same as get_current_user_id but returns None instead of raising 401.
    Use for endpoints that work with or without auth.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer "):]
        payload = decode_token(token)
        if payload:
            return payload.get("sub")
        return None
    return x_user_id
