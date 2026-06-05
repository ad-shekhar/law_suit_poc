from ..config import settings
"""
Users Router — LegalOS Backend
"""
import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from src.db.supabase import get_db
from src.db import memory_db
from src.models import User, UserRole

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/users/login")
async def login(req: LoginRequest):
    """
    Simulated or Supabase Login.
    """
    db = get_db()
    if db:
        try:
            # Query from Supabase users table
            res = db.table("users").select("*").eq("email", req.email).execute()
            if res.data and len(res.data) > 0:
                # In real life, password hash would be checked. For POC, we allow demo1234
                if req.password == settings.default_password:
                    return res.data[0]
                else:
                    raise HTTPException(status_code=400, detail="Invalid credentials")
            else:
                raise HTTPException(status_code=404, detail="User not found")
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            # Fallback to memory db if Supabase fails
            pass
            
    # Fallback to Memory DB
    user = next((u for u in memory_db.USERS if u["email"] == req.email), None)
    if user:
        if req.password == settings.default_password:
            return user
        else:
            raise HTTPException(status_code=400, detail="Invalid credentials")
    raise HTTPException(status_code=404, detail="User not found")


@router.get("/users", response_model=List[dict])
async def list_users():
    """List all users in the firm."""
    db = get_db()
    if db:
        try:
            res = db.table("users").select("*").execute()
            return res.data
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
    return memory_db.USERS


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
            logger.error(f'Database operation failed: {e}')
            
    user = next((u for u in memory_db.USERS if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
