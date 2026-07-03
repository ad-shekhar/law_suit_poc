from ..config import settings
from datetime import timezone
"""
Hearings Router — LegalOS Backend
"""
import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List
from datetime import datetime
import uuid
import json
from ..db.supabase import get_db
from ..db import memory_db
from ..services.ai_skills import skill_runner
from ..models import SkillName, AIReviewStatus

router = APIRouter()

@router.get("/hearings")
async def list_all_hearings():
    """List all hearings across all matters."""
    db = get_db()
    hearings = []
    
    if db is not None:
        try:
            res = db.table("hearings").select("*").order("hearing_date", desc=True).execute()
            hearings = res.data or []
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            hearings = list(memory_db.HEARINGS)
    else:
        hearings = list(memory_db.HEARINGS)

    # Attach matter context
    for h in hearings:
        matter_id = h["matter_id"]
        matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
        if db is not None and not matter:
            try:
                m_res = db.table("matters").select("*").eq("id", matter_id).execute()
                if m_res.data:
                    matter = m_res.data[0]
            except Exception as e:
                logger.error(f'Database operation failed: {e}')
        h["matter"] = matter  # type: ignore
        
    return hearings


@router.get("/matters/{matter_id}/hearings")
async def get_matter_hearings(matter_id: str):
    """Get hearings for a specific matter."""
    db = get_db()
    hearings = []
    
    if db is not None:
        try:
            res = db.table("hearings").select("*").eq("matter_id", matter_id).order("hearing_date", desc=True).execute()
            hearings = res.data or []
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            hearings = [h for h in memory_db.HEARINGS if h["matter_id"] == matter_id]
    else:
        hearings = [h for h in memory_db.HEARINGS if h["matter_id"] == matter_id]
        
    return hearings


@router.post("/matters/{matter_id}/hearings")
async def log_hearing(
    matter_id: str,
    payload: dict,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Log a hearing (Path C) and automatically trigger AI Skill 12 to draft client update.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")

    db = get_db()
    matter = None
    
    if db is not None:
        try:
            res = db.table("matters").select("*").eq("id", matter_id).execute()
            if res.data:
                matter = res.data[0]
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            
    if not matter:
        matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
        
    if not matter:
        raise HTTPException(status_code=404, detail="Matter not found")

    user_name = "Arjun Sharma"
    user = next((u for u in memory_db.USERS if u["id"] == user_id), None)
    if user:
        user_name = user["full_name"]

    # 1. Draft Client Update Email using AI Skill 12
    h_date_str = payload.get("hearing_date", datetime.now(timezone.utc).isoformat())
    order_sum = payload.get("order_summary", "The court heard arguments and adjourned the matter.")
    next_step = payload.get("next_steps", "Prepare rejoinder.")
    next_date_val = payload.get("adjourned_to", "")

    ai_input = {
        "client_name": matter["client_name"],
        "date": h_date_str.split("T")[0],
        "court_name": matter["court_name"],
        "judge_name": payload.get("judge_name", "Hon'ble Judge"),
        "order_summary": order_sum,
        "next_steps": next_step,
        "next_date": next_date_val.split("T")[0] if next_date_val else "Not fixed",
        "advocate_name": user_name
    }

    try:
        ai_res = await skill_runner.run_skill(
            skill_name=SkillName.client_update_email,
            input_data=ai_input,
            matter_id=matter_id,
            user_id=user_id
        )
        # Parse output
        raw_out = json.loads(ai_res["raw_output"])
        client_update_draft = f"Subject: {raw_out.get('subject')}\n\n{raw_out.get('body')}"
    except Exception as e:
        logger.error(f'Database operation failed: {e}')
        client_update_draft = f"Subject: Update on your matter\n\nDear {matter['client_name']},\n\n" \
                              f"Today's hearing in the {matter['court_name']} was completed. Summary: {order_sum}."

    hearing_id = str(uuid.uuid4())
    new_hearing = {
        "id": hearing_id,
        "matter_id": matter_id,
        "hearing_date": h_date_str,
        "court_room": payload.get("court_room"),
        "judge_name": payload.get("judge_name"),
        "bench_composition": payload.get("bench_composition"),
        "path_type": "C",
        "order_summary": order_sum,
        "outcome": payload.get("outcome"),
        "next_steps": next_step,
        "adjourned_to": next_date_val or None,
        "raw_order_url": payload.get("raw_order_url"),
        "order_text": payload.get("order_text"),
        "client_update_draft": client_update_draft,
        "client_update_approved": False,
        "client_update_sent_at": None,
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if db is not None:
        try:
            db.table("hearings").insert(new_hearing).execute()
            
            # Save client email update draft to ai_outputs table
            ai_output_rec = {
                "matter_id": matter_id,
                "skill_name": SkillName.client_update_email.value,
                "raw_output": client_update_draft,
                "review_status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            db.table("ai_outputs").insert(ai_output_rec).execute()
            
            # Update matter status
            new_status = "hearing_scheduled"
            if new_hearing["adjourned_to"]:
                new_status = "hearing_scheduled"
            elif new_hearing["outcome"]:
                new_status = "order_received"
            db.table("matters").update({"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", matter_id).execute()

            # Audit log
            db.table("audit_logs").insert({
                "firm_id": settings.default_firm_id,
                "user_id": user_id,
                "user_role": "associate",
                "action": "hearing.logged",
                "resource_type": "hearings",
                "resource_id": hearing_id,
                "after_state": new_hearing
            }).execute()

            return new_hearing
        except Exception as e:
            logger.error(f'Database operation failed: {e}')

    # Fallback to Memory
    memory_db.HEARINGS.insert(0, new_hearing)
    
    # Save client email draft to pending AI Outputs
    memory_db.AI_OUTPUTS.insert(0, {
        "id": f"ai-op-{str(uuid.uuid4())[:8]}",
        "matter_id": matter_id,
        "skill_name": SkillName.client_update_email.value,
        "raw_output": client_update_draft,
        "review_status": "pending",
        "created_at": datetime.now(timezone.utc)
    })
    
    # Update matter status
    new_status = "hearing_scheduled"
    if new_hearing["adjourned_to"]:
        new_status = "hearing_scheduled"
    elif new_hearing["outcome"]:
        new_status = "order_received"
    if matter:
        matter["status"] = new_status
        matter["updated_at"] = datetime.now(timezone.utc)

    memory_db.log_audit(
        user_id=user_id,
        action="hearing.logged",
        resource_type="hearings",
        resource_id=hearing_id,
        after=new_hearing,
        matter_id=matter_id
    )

    return new_hearing


@router.post("/hearings/{hearing_id}/client-update/approve")
async def approve_client_update(
    hearing_id: str,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Approve and mark the client update email as sent.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")

    db = get_db()
    sent_time = datetime.now(timezone.utc).isoformat()

    if db is not None:
        try:
            res = db.table("hearings").select("*").eq("id", hearing_id).execute()
            if res.data:
                hearing = res.data[0]
                updates = {
                    "client_update_approved": True,
                    "client_update_sent_at": sent_time
                }
                db.table("hearings").update(updates).eq("id", hearing_id).execute()
                
                # Log audit trail
                db.table("audit_logs").insert({
                    "firm_id": settings.default_firm_id,
                    "user_id": user_id,
                    "user_role": "founder",
                    "action": "client_update.approved",
                    "resource_type": "hearings",
                    "resource_id": hearing_id,
                    "after_state": {**hearing, **updates}
                }).execute()
                
                return {**hearing, **updates}
        except Exception as e:
            logger.error(f'Database operation failed: {e}')

    # Fallback to Memory
    h = next((hearing for hearing in memory_db.HEARINGS if hearing["id"] == hearing_id), None)
    if not h:
        raise HTTPException(status_code=404, detail="Hearing not found")
        
    h["client_update_approved"] = True
    h["client_update_sent_at"] = datetime.now(timezone.utc)

    # Find and update corresponding AI Output review status to approved
    for op in memory_db.AI_OUTPUTS:
        if op["matter_id"] == h["matter_id"] and op["skill_name"] == SkillName.client_update_email.value and op["review_status"] == "pending":
            op["review_status"] = "approved"
            op["reviewed_by"] = user_id
            op["reviewed_at"] = datetime.now(timezone.utc)

    memory_db.log_audit(
        user_id=user_id,
        action="client_update.approved",
        resource_type="hearings",
        resource_id=hearing_id,
        after=h,
        matter_id=h["matter_id"]
    )

    return h
