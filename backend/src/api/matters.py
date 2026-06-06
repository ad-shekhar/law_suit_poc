from ..config import settings
from datetime import timezone
"""
Matters Router — LegalOS Backend
"""
import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, HTTPException, Query, Header
from typing import List, Optional
from datetime import datetime
import uuid
from ..db.supabase import get_db
from ..db import memory_db
from ..models import Matter, MatterStatus, CaseType, CourtType

router = APIRouter()

@router.get("/matters")
async def list_matters(
    status: Optional[str] = None,
    case_type: Optional[str] = None,
    court: Optional[str] = None,
    search: Optional[str] = None,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    List matters with filtering and search.
    If X-User-Id header is passed and user has 'client' or 'associate' role, list only their assigned matters.
    """
    db = get_db()
    
    # 1. Check user role if user_id is provided
    role = "admin"
    if user_id:
        user = next((u for u in memory_db.USERS if u["id"] == user_id), None)
        if db and not user:
            try:
                res = db.table("users").select("*").eq("id", user_id).execute()
                if res.data:
                    user = res.data[0]
            except Exception as e:
                logger.error(f'Database operation failed: {e}')
        if user:
            role = user["role"]

    # 2. Query Database
    if db:
        try:
            query = db.table("matters").select("*")
            
            # Apply filters
            if status:
                query = query.eq("status", status)
            if case_type:
                query = query.eq("case_type", case_type)
            if court:
                query = query.eq("court", court)
                
            # Role restrictions
            if role == "client" and user_id:
                # Clients only see their own email matched cases
                if user:
                    query = query.eq("client_email", user["email"])
            elif role == "associate" and user_id:
                query = query.eq("assigned_associate_id", user_id)
                
            res = query.execute()
            data = res.data or []
            
            # Simple manual text search filtering on result data (easier than complex postgres text search in free tier)
            if search:
                s = search.lower()
                data = [
                    m for m in data 
                    if s in m["client_name"].lower() 
                    or s in m["matter_number"].lower() 
                    or (m["case_number"] and s in m["case_number"].lower())
                    or (m["court_name"] and s in m["court_name"].lower())
                ]
            return data
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            # Fallback to memory
            pass

    # 3. Fallback to Memory DB
    data = list(memory_db.MATTERS)
    
    # Apply Role restrictions
    if user_id and role == "client":
        user = next((u for u in memory_db.USERS if u["id"] == user_id), None)
        if user:
            data = [m for m in data if m["client_email"] == user["email"]]
    elif user_id and role == "associate":
        data = [m for m in data if m["assigned_associate_id"] == user_id]
        
    # Apply Filters
    if status:
        data = [m for m in data if m["status"] == status]
    if case_type:
        data = [m for m in data if m["case_type"] == case_type]
    if court:
        data = [m for m in data if m["court"] == court]
    if search:
        s = search.lower()
        data = [
            m for m in data 
            if s in m["client_name"].lower() 
            or s in m["matter_number"].lower() 
            or (m.get("case_number") and s in m["case_number"].lower())
            or (m.get("court_name") and s in m["court_name"].lower())
        ]
        
    return data


@router.get("/matters/{matter_id}")
async def get_matter(matter_id: str):
    """Get detail of a specific matter."""
    db = get_db()
    if db:
        try:
            res = db.table("matters").select("*").eq("id", matter_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            
    matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
    return matter


@router.post("/matters")
async def create_matter(matter: dict, user_id: Optional[str] = Header(None, alias="X-User-Id")):
    """Create a new matter."""
    # Generate auto-incrementing/custom matter number
    year = datetime.now(timezone.utc).year
    
    db = get_db()
    count = 0
    if db:
        try:
            res = db.table("matters").select("id").execute()
            count = len(res.data) if res.data else 0
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            count = len(memory_db.MATTERS)
    else:
        count = len(memory_db.MATTERS)
        
    matter_number = f"LOS-{year}-{count + 101:03d}"
    
    # Assign default founder and fields
    new_id = matter.get("id") or str(uuid.uuid4())
    new_matter = {
        "id": new_id,
        "firm_id": settings.default_firm_id,
        "matter_number": matter_number,
        "client_name": matter.get("client_name", "New Client"),
        "client_email": matter.get("client_email"),
        "client_phone": matter.get("client_phone"),
        "case_type": matter.get("case_type", "civil_suit"),
        "court": matter.get("court", "high_court"),
        "court_name": matter.get("court_name", "Delhi High Court"),
        "case_number": matter.get("case_number"),
        "filing_number": matter.get("filing_number"),
        "status": matter.get("status", "intake"),
        "assigned_founder_id": matter.get("assigned_founder_id") or user_id or "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "assigned_associate_id": matter.get("assigned_associate_id") or "c3e7f18c-26df-66b0-ae5a-01e2c8d9f7c7",
        "opposing_counsel": matter.get("opposing_counsel"),
        "opposing_party": matter.get("opposing_party"),
        "relief_sought": matter.get("relief_sought"),
        "brief_facts": matter.get("brief_facts"),
        "tags": matter.get("tags", []),
        "is_confidential": matter.get("is_confidential", False),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if db:
        try:
            db.table("matters").insert(new_matter).execute()
            if user_id:
                # Log action to audit
                audit_log = {
                    "firm_id": settings.default_firm_id,
                    "user_id": user_id,
                    "user_role": "founder",
                    "action": "matter.created",
                    "resource_type": "matters",
                    "resource_id": new_id,
                    "after_state": new_matter
                }
                db.table("audit_logs").insert(audit_log).execute()
            return new_matter
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            # Fall back to memory insert
            pass
            
    memory_db.MATTERS.insert(0, new_matter)
    if user_id:
        memory_db.log_audit(
            user_id=user_id,
            action="matter.created",
            resource_type="matters",
            resource_id=new_id,
            after=new_matter,
            matter_id=new_id
        )
    return new_matter


@router.patch("/matters/{matter_id}")
async def update_matter_status(
    matter_id: str,
    payload: dict,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """Update matter properties (such as status)."""
    db = get_db()
    before_state = {}
    
    if db:
        try:
            # Fetch current
            res = db.table("matters").select("*").eq("id", matter_id).execute()
            if res.data:
                before_state = res.data[0]
                
            payload["updated_at"] = datetime.now(timezone.utc).isoformat()
            update_res = db.table("matters").update(payload).eq("id", matter_id).execute()
            if update_res.data:
                updated = update_res.data[0]
                if user_id:
                    db.table("audit_logs").insert({
                        "firm_id": settings.default_firm_id,
                        "user_id": user_id,
                        "user_role": "founder",
                        "action": "matter.updated",
                        "resource_type": "matters",
                        "resource_id": matter_id,
                        "before_state": before_state,
                        "after_state": updated
                    }).execute()
                return updated
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            
    # Fallback to Memory
    matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")
        
    before_state = dict(matter)
    for k, v in payload.items():
        matter[k] = v
    matter["updated_at"] = datetime.now(timezone.utc)
    
    if user_id:
        memory_db.log_audit(
            user_id=user_id,
            action="matter.updated",
            resource_type="matters",
            resource_id=matter_id,
            before=before_state,
            after=matter,
            matter_id=matter_id
        )
        
    return matter
