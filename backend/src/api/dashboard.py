"""
Dashboard Router — LegalOS Backend
"""
import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, Header, HTTPException
from typing import Optional, List, Dict, Any, cast
from datetime import datetime, date
from ..db.supabase import get_db
from ..db import memory_db

router = APIRouter()

@router.get("/dashboard/summary")
async def get_dashboard_summary(user_id: Optional[str] = Header(None, alias="X-User-Id")):
    """
    Get aggregated dashboard stats depending on user role.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")

    db = get_db()
    
    # 1. Fetch user role
    role = "founder"
    user_email = ""
    user: Optional[Dict[str, Any]] = next((u for u in memory_db.USERS if u["id"] == user_id), None)
    if db and not user:
        try:
            res = db.table("users").select("*").eq("id", user_id).execute()
            if res.data:
                user = cast(Dict[str, Any], res.data[0])
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            
    if user:
        role = user.get("role", "founder")
        user_email = user.get("email", "")

    # 2. Fetch all raw data for calculations
    matters: List[Dict[str, Any]] = []
    hearings: List[Dict[str, Any]] = []
    ai_outputs: List[Dict[str, Any]] = []
    invoices: List[Dict[str, Any]] = []

    if db is not None:
        try:
            # Matters
            m_res = db.table("matters").select("*").execute()
            matters = cast(List[Dict[str, Any]], m_res.data) if m_res.data else []
            
            # Hearings
            h_res = db.table("hearings").select("*").execute()
            hearings = cast(List[Dict[str, Any]], h_res.data) if h_res.data else []
            
            # AI outputs
            ai_res = db.table("ai_outputs").select("*").execute()
            ai_outputs = cast(List[Dict[str, Any]], ai_res.data) if ai_res.data else []
            
            # Invoices
            inv_res = db.table("invoices").select("*").execute()
            invoices = cast(List[Dict[str, Any]], inv_res.data) if inv_res.data else []
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            # Fallback
            matters = list(memory_db.MATTERS)
            hearings = list(memory_db.HEARINGS)
            ai_outputs = list(memory_db.AI_OUTPUTS)
            invoices = list(memory_db.INVOICES)
    else:
        matters = list(memory_db.MATTERS)
        hearings = list(memory_db.HEARINGS)
        ai_outputs = list(memory_db.AI_OUTPUTS)
        invoices = list(memory_db.INVOICES)

    # 3. Calculate statistics
    is_founder_role = role in ["founder", "admin"]
    
    # Filter matters by assignment if associate or client
    if role == "associate":
        matters_assigned = [m for m in matters if m["assigned_associate_id"] == user_id]
        hearings_assigned = [h for h in hearings if any(m["id"] == h["matter_id"] for m in matters_assigned)]
    elif role == "client":
        matters_assigned = [m for m in matters if m["client_email"] == user_email]
        hearings_assigned = [h for h in hearings if any(m["id"] == h["matter_id"] for m in matters_assigned)]
    else:
        matters_assigned = matters
        hearings_assigned = hearings

    # Today's hearings count
    today_str = date.today().isoformat()
    today_hearings = []
    for h in hearings_assigned:
        h_date = h.get("hearing_date")
        if isinstance(h_date, datetime):
            h_date_str = h_date.date().isoformat()
        else:
            # parsed string from DB
            h_date_str = str(h_date).split("T")[0]
        if h_date_str == today_str:
            today_hearings.append(h)
            
    today_hearings_count = len(today_hearings)

    # AI Queue count (pending reviews)
    pending_ai_count = len([a for a in ai_outputs if a["review_status"] == "pending"])

    if is_founder_role:
        # Outstanding amount in INR (milestones sent/overdue)
        outstanding_amt = sum(inv["amount"] for inv in invoices if inv["status"] in ["sent", "overdue"])
        active_matters_count = len([m for m in matters if m["status"] not in ["closed_won", "closed_lost", "closed_settled", "archived"]])
        
        stats = [
            {"label": "Active Matters", "value": str(active_matters_count), "change": "+3 this week", "up": True, "color": "#4F46E5"},
            {"label": "Today's Hearings", "value": str(today_hearings_count), "change": "2 in HC, 1 NCLT", "up": True, "color": "#06B6D4"},
            {"label": "AI Queue", "value": str(pending_ai_count), "change": "Awaiting your review", "up": False, "color": "#D97706"},
            {"label": "Outstanding (₹)", "value": f"₹{outstanding_amt/100000:.1f}L" if outstanding_amt >= 100000 else f"₹{outstanding_amt:,.0f}", "change": "+₹2.5L this month", "up": True, "color": "#10B981"},
        ]
    else:
        # Junior associate stats
        my_matters_count = len([m for m in matters_assigned if m["status"] not in ["closed_won", "closed_lost", "closed_settled", "archived"]])
        drafts_pending = len([a for a in ai_outputs if a["review_status"] == "pending" and any(m["id"] == a["matter_id"] for m in matters_assigned)])
        
        stats = [
            {"label": "My Matters", "value": str(my_matters_count), "change": "3 with upcoming hearings", "up": True, "color": "#4F46E5"},
            {"label": "Today's Hearings", "value": str(today_hearings_count), "change": "1 HC, 1 District Court", "up": True, "color": "#06B6D4"},
            {"label": "Drafts Pending", "value": str(drafts_pending), "change": "Awaiting Founder review", "up": False, "color": "#D97706"},
            {"label": "Tasks Due", "value": "6", "change": "3 overdue", "up": False, "color": "#EF4444"},
        ]

    recent_activity = []
    if db is not None:
        try:
            audit_res = db.table("audit_logs").select("*").order("created_at", desc=True).limit(6).execute()
            recent_activity = audit_res.data or []
            # Resolve user names
            for log in recent_activity:
                u = next((u for u in memory_db.USERS if u["id"] == log["user_id"]), None)
                if not u:
                    try:
                        u_res = db.table("users").select("full_name").eq("id", log["user_id"]).execute()
                        u = u_res.data[0] if u_res.data else None
                    except Exception:
                        pass
                cast(Dict[str, Any], log)["user_name"] = u["full_name"] if u else "Unknown"
        except Exception as e:
            logger.error(f'Failed to fetch audit logs: {e}')
            recent_activity = memory_db.AUDIT_LOGS[:6]
    else:
        recent_activity = memory_db.AUDIT_LOGS[:6]

    return {
        "role": role,
        "stats": stats,
        "recent_activity": recent_activity
    }


@router.get("/dashboard/hearings/today")
async def get_today_hearings(user_id: Optional[str] = Header(None, alias="X-User-Id")):
    """Get all hearings listed for today."""
    db = get_db()
    hearings = []
    
    if db is not None:
        try:
            res = db.table("hearings").select("*").execute()
            hearings = cast(List[Dict[str, Any]], res.data) if res.data else []
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            hearings = list(memory_db.HEARINGS)
    else:
        hearings = list(memory_db.HEARINGS)

    today_str = date.today().isoformat()
    today_hearings = []
    
    for h in hearings:
        h_date = h.get("hearing_date")
        if isinstance(h_date, datetime):
            h_date_str = h_date.date().isoformat()
        else:
            h_date_str = str(h_date).split("T")[0]
            
        if h_date_str == today_str:
            # Fetch matter details
            matter_id = h["matter_id"]
            matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
            if db and not matter:
                try:
                    m_res = db.table("matters").select("*").eq("id", matter_id).execute()
                    if m_res.data:
                        matter = m_res.data[0]
                except Exception as e:
                    logger.error(f'Database operation failed: {e}')
            cast(Dict[str, Any], h)["matter"] = matter
            today_hearings.append(h)
            
    return today_hearings


@router.get("/dashboard/ai-queue")
async def get_ai_queue(user_id: Optional[str] = Header(None, alias="X-User-Id")):
    """Get pending AI reviews."""
    db = get_db()
    ai_outputs = []
    
    if db is not None:
        try:
            res = db.table("ai_outputs").select("*").eq("review_status", "pending").execute()
            ai_outputs = res.data or []
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            ai_outputs = [a for a in memory_db.AI_OUTPUTS if a["review_status"] == "pending"]
    else:
        ai_outputs = [a for a in memory_db.AI_OUTPUTS if a["review_status"] == "pending"]

    # Attach matter details to each item
    for item in ai_outputs:
        matter_id = item["matter_id"]
        matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
        if db and not matter:
            try:
                m_res = db.table("matters").select("*").eq("id", matter_id).execute()
                if m_res.data:
                    matter = cast(Dict[str, Any], m_res.data[0])
            except Exception as e:
                logger.error(f'Database operation failed: {e}')
        cast(Dict[str, Any], item)["matter"] = matter

    return ai_outputs
