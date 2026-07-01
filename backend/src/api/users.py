"""
Users Router — LegalOS Backend
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from ..config import settings
from ..db.supabase import get_db
from ..db import memory_db
from ..models import User, UserRole
from ..middleware.auth import verify_password, create_access_token, get_password_hash

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Pre-hashed demo password (demo1234) ─────────────────────────────────────
# Generated once. All demo users share this password hash.
_DEMO_HASH = get_password_hash("demo1234")

# Attach password hash to each demo user record (in-memory only)
for _u in memory_db.USERS:
    _u.setdefault("password_hash", _DEMO_HASH)


# ─── Request/Response Models ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/users/login")
async def login(req: LoginRequest):
    """
    Authenticate user. Returns a signed JWT token + user profile.
    Works against Supabase or in-memory fallback.
    """
    db = get_db()
    user = None

    # 1. Try Supabase
    if db:
        try:
            res = db.table("users").select("*").eq("email", req.email).execute()
            if res.data and len(res.data) > 0:
                user = res.data[0]
        except Exception as e:
            logger.error(f"Supabase login lookup failed: {e}")

    # 2. Fallback to memory_db
    if not user:
        user = next((u for u in memory_db.USERS if u["email"] == req.email), None)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. Verify password
    # For Supabase users that don't have a password_hash yet, accept settings.default_password
    password_hash = user.get("password_hash")
    if password_hash:
        if not verify_password(req.password, password_hash):
            raise HTTPException(status_code=400, detail="Invalid credentials")
    else:
        # Supabase row without hash yet — accept default demo password during POC
        if req.password != settings.default_password:
            raise HTTPException(status_code=400, detail="Invalid credentials")

    # 4. Issue JWT
    token = create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user.get("role", "associate"),
        "firm_id": user.get("firm_id", settings.default_firm_id),
        "name": user.get("full_name", ""),
    })

    # 5. Return token + sanitized user (strip password hash)
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    if "name" not in safe_user and "full_name" in safe_user:
        safe_user["name"] = safe_user["full_name"]
    return {"token": token, "user": safe_user}


@router.get("/users", response_model=List[dict])
async def list_users():
    """List all users in the firm (strips password hashes)."""
    db = get_db()
    if db:
        try:
            res = db.table("users").select("*").execute()
            return res.data
        except Exception as e:
            logger.error(f"Failed to list users from Supabase: {e}")

    return [{k: v for k, v in u.items() if k != "password_hash"} for u in memory_db.USERS]


@router.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get user by ID."""
    db = get_db()
    if db:
        try:
            res = db.table("users").select("*").eq("id", user_id).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            logger.error(f"Supabase get_user failed: {e}")

    user = next((u for u in memory_db.USERS if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {k: v for k, v in user.items() if k != "password_hash"}
