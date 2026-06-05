from ..config import settings
from datetime import timezone
"""
AI Skills Router — LegalOS Backend
Handles running generic AI skills and reviewing draft AI outputs.
"""
import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List, cast, Dict, Any
from datetime import datetime
import uuid
import json
from ..db.supabase import get_db
from ..db import memory_db
from ..services.ai_skills import skill_runner
from ..models import SkillName, AIReviewStatus

router = APIRouter()

@router.get("/ai-skills/queue")
async def get_review_queue():
    """List all pending AI draft outputs across all matters."""
    db = get_db()
    queue: List[Dict[str, Any]] = []
    
    if db:
        try:
            res = db.table("ai_outputs").select("*").eq("review_status", "pending").execute()
            queue = cast(List[Dict[str, Any]], res.data or [])
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            queue = [a for a in memory_db.AI_OUTPUTS if a["review_status"] == "pending"]
    else:
        queue = [a for a in memory_db.AI_OUTPUTS if a["review_status"] == "pending"]

    # Attach matter context
    for item in queue:
        matter_id = item["matter_id"]
        matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
        if db and not matter:
            try:
                m_res = db.table("matters").select("*").eq("id", matter_id).execute()
                if m_res.data:
                    matter = m_res.data[0]
            except Exception as e:
                logger.error(f'Database operation failed: {e}')
        item["matter"] = matter
        
    return queue


@router.post("/ai-skills/run")
async def run_ai_skill(
    payload: dict,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Run an arbitrary AI skill. Saves the result as a pending review and returns it.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")

    skill_str = payload.get("skill_name")
    input_data = payload.get("input_data", {})
    matter_id = payload.get("matter_id")

    if not skill_str or not matter_id:
        raise HTTPException(status_code=400, detail="skill_name and matter_id are required")

    try:
        skill_name = SkillName(skill_str)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid skill name: {skill_str}")

    db = get_db()
    
    # Run the skill
    try:
        ai_res = await skill_runner.run_skill(
            skill_name=skill_name,
            input_data=input_data,
            matter_id=matter_id,
            user_id=user_id
        )
    except Exception as e:
        logger.error(f'Database operation failed: {e}')
        raise HTTPException(status_code=500, detail=f"AI execution failed: {e}")

    # Generate record
    ai_output_id = str(uuid.uuid4())
    record = {
        "id": ai_output_id,
        "matter_id": matter_id,
        "skill_name": skill_name.value,
        "prompt_used": json.dumps(input_data),
        "raw_output": ai_res["raw_output"],
        "review_status": "pending",
        "reviewed_by": None,
        "reviewed_at": None,
        "final_output": None,
        "review_notes": None,
        "model_used": ai_res["model_used"],
        "tokens_used": ai_res["tokens_used"],
        "latency_ms": ai_res["latency_ms"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if db:
        try:
            db.table("ai_outputs").insert(record).execute()
            
            # Log audit trail
            db.table("audit_logs").insert({
                "firm_id": settings.default_firm_id,
                "user_id": user_id,
                "user_role": "associate",
                "action": f"ai_skill.run:{skill_name.value}",
                "resource_type": "ai_outputs",
                "resource_id": ai_output_id,
                "after_state": record
            }).execute()
            
            return record
        except Exception as e:
            logger.error(f'Database operation failed: {e}')

    # Fallback to Memory
    memory_db.AI_OUTPUTS.insert(0, record)
    memory_db.log_audit(
        user_id=user_id,
        action=f"ai_skill.run:{skill_name.value}",
        resource_type="ai_outputs",
        resource_id=ai_output_id,
        after=record,
        matter_id=matter_id
    )

    return record


@router.post("/ai-skills/{output_id}/review")
async def review_ai_output(
    output_id: str,
    payload: dict,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Approve, Reject or Modify a draft AI output.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")

    status = payload.get("review_status")
    final_output = payload.get("final_output")
    review_notes = payload.get("review_notes", "")

    if not status or status not in ["approved", "rejected", "modified"]:
        raise HTTPException(status_code=400, detail="review_status must be 'approved', 'rejected', or 'modified'")

    db = get_db()
    reviewed_at = datetime.now(timezone.utc).isoformat()

    if db:
        try:
            res = db.table("ai_outputs").select("*").eq("id", output_id).execute()
            if res.data:
                db_item = cast(Dict[str, Any], res.data[0])
                updates = {
                    "review_status": status,
                    "reviewed_by": user_id,
                    "reviewed_at": reviewed_at,
                    "final_output": final_output or db_item["raw_output"],
                    "review_notes": review_notes
                }
                db.table("ai_outputs").update(updates).eq("id", output_id).execute()
                
                # If modified or approved, we might trigger side-effects like updating strategy notes, hearings etc.
                # E.g. if skill_name is client_update, we approve the hearing's update
                skill_name_val = db_item["skill_name"]
                matter_id = db_item["matter_id"]

                # Side effects:
                if skill_name_val == SkillName.client_update_email.value and status in ["approved", "modified"]:
                    # Try to find recent hearing and set approved
                    h_res = db.table("hearings").select("*").eq("matter_id", matter_id).order("created_at", desc=True).limit(1).execute()
                    if h_res.data:
                        hearing_item = cast(Dict[str, Any], h_res.data[0])
                        db.table("hearings").update({
                            "client_update_approved": True,
                            "client_update_sent_at": reviewed_at,
                            "client_update_draft": final_output or db_item["raw_output"]
                        }).eq("id", hearing_item["id"]).execute()

                # Audit Log
                db.table("audit_logs").insert({
                    "firm_id": settings.default_firm_id,
                    "user_id": user_id,
                    "user_role": "founder",
                    "action": f"ai_output.{status}",
                    "resource_type": "ai_outputs",
                    "resource_id": output_id,
                    "before_state": db_item,
                    "after_state": {**db_item, **updates}
                }).execute()

                return {**db_item, **updates}
        except Exception as e:
            logger.error(f'Database operation failed: {e}')

    raw_mem_item = next((a for a in memory_db.AI_OUTPUTS if a["id"] == output_id), None)
    if not raw_mem_item:
        raise HTTPException(status_code=404, detail="AI Output draft not found")
    mem_item = cast(Dict[str, Any], raw_mem_item)
    before = dict(mem_item)
    mem_item["review_status"] = status
    mem_item["reviewed_by"] = user_id
    mem_item["reviewed_at"] = datetime.now(timezone.utc)
    mem_item["final_output"] = final_output or mem_item["raw_output"]
    mem_item["review_notes"] = review_notes

    # Side-effect: Client update approval link
    if mem_item["skill_name"] == SkillName.client_update_email.value and status in ["approved", "modified"]:
        # Find latest hearing for this matter
        h = next((hearing for hearing in memory_db.HEARINGS if hearing["matter_id"] == mem_item["matter_id"]), None)
        if h:
            h["client_update_approved"] = True
            h["client_update_sent_at"] = datetime.now(timezone.utc)
            h["client_update_draft"] = final_output or mem_item["raw_output"]

    memory_db.log_audit(
        user_id=user_id,
        action=f"ai_output.{status}",
        resource_type="ai_outputs",
        resource_id=output_id,
        before=before,
        after=mem_item,
        matter_id=mem_item["matter_id"]
    )

    return mem_item
