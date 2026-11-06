from datetime import timezone
"""
Audit Logs Router — LegalOS Backend
"""
import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, HTTPException, Query, Header
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any, cast
import io
import csv
from datetime import datetime, timezone
from ..db.supabase import get_db
from ..db import memory_db

router = APIRouter()

@router.get("/audit")
async def list_audit_logs(
    matter_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    List audit logs with optional filters.
    """
    db = get_db()
    logs: List[Dict[str, Any]] = []

    if db is not None:
        try:
            query = db.table("audit_logs").select("*").order("created_at", desc=True)
            if matter_id:
                query = query.eq("matter_id", matter_id)
            if action:
                query = query.eq("action", action)
            query = query.limit(limit)
            
            res = query.execute()
            logs = cast(List[Dict[str, Any]], res.data or [])
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            logs = cast(List[Dict[str, Any]], list(memory_db.AUDIT_LOGS))
    else:
        logs = cast(List[Dict[str, Any]], list(memory_db.AUDIT_LOGS))

    # Filter memory logs if database query failed or wasn't run
    if db is None:
        if matter_id:
            logs = [log for log in logs if log.get("matter_id") == matter_id]
        if action:
            logs = [log for log in logs if log.get("action") == action]
        logs = logs[:limit]

    # Resolve user details for display
    for log in logs:
        u_id = log["user_id"]
        user = next((u for u in memory_db.USERS if u["id"] == u_id), None)
        if db is not None and not user:
            try:
                u_res = db.table("users").select("*").eq("id", u_id).execute()
                if u_res.data:
                    user = cast(Dict[str, Any], u_res.data[0])
            except Exception as e:
                logger.error(f'Database operation failed: {e}')
        log["user_name"] = user["full_name"] if user else "Unknown User"
        log["user_email"] = user["email"] if user else "unknown@legalos.dev"

    return logs


@router.get("/audit/export")
async def export_audit_logs(
    matter_id: Optional[str] = None,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Export audit logs as a downloadable CSV stream.
    """
    db = get_db()
    logs: List[Dict[str, Any]] = []

    if db is not None:
        try:
            query = db.table("audit_logs").select("*").order("created_at", desc=True)
            if matter_id:
                query = query.eq("matter_id", matter_id)
            res = query.execute()
            logs = cast(List[Dict[str, Any]], res.data or [])
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            logs = cast(List[Dict[str, Any]], list(memory_db.AUDIT_LOGS))
    else:
        logs = cast(List[Dict[str, Any]], list(memory_db.AUDIT_LOGS))

    if db is None and matter_id:
        logs = [log for log in logs if log.get("matter_id") == matter_id]

    # Resolve user details
    for log in logs:
        u_id = log["user_id"]
        user = next((u for u in memory_db.USERS if u["id"] == u_id), None)
        log["user_name"] = user["full_name"] if user else "Unknown User"
        log["user_email"] = user["email"] if user else "unknown@legalos.dev"

    # Create CSV memory stream
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Log ID", 
        "Timestamp", 
        "User Name", 
        "User Email", 
        "User Role", 
        "Action Performed", 
        "Resource Type", 
        "Resource ID", 
        "IP Address"
    ])
    
    for log in logs:
        writer.writerow([
            log["id"],
            log["created_at"],
            log["user_name"],
            log["user_email"],
            log["user_role"],
            log["action"],
            log["resource_type"],
            log["resource_id"],
            log.get("ip_address", "127.0.0.1")
        ])
    
    output.seek(0)
    
    # Stream the file back
    filename = f"legalos_audit_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
