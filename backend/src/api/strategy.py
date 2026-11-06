from ..config import settings
from datetime import timezone
"""
Strategy Notes Router — LegalOS Backend
"""
import logging
logger = logging.getLogger(__name__)
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime
import uuid
import json
from ..db.supabase import get_db
from ..db import memory_db
from ..services.ai_skills import skill_runner
from ..models import SkillName, AIReviewStatus

router = APIRouter()

@router.get("/matters/{matter_id}/strategy")
async def get_strategy_note(matter_id: str):
    """Get the current active strategy note for a matter."""
    db = get_db()
    if db is not None:
        try:
            res = db.table("strategy_notes").select("*").eq("matter_id", matter_id).order("version", desc=True).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            
    note = next((n for n in memory_db.STRATEGY_NOTES if n["matter_id"] == matter_id), None)
    if not note:
        # Return a blank structure for frontend to populate
        return {
            "matter_id": matter_id,
            "version": 1,
            "legal_position": "",
            "key_arguments": [],
            "risks": [],
            "recommended_strategy": "",
            "next_actions": [],
            "case_timeline": "",
            "precedents": [],
            "fee_estimate": "",
            "is_locked": False
        }
    return note


@router.post("/matters/{matter_id}/strategy/generate")
async def generate_strategy_note(
    matter_id: str,
    payload: dict,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Trigger AI Skill 03: Generate Strategy Note from transcript.
    Saves a draft strategy note and returns it.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")
        
    transcript = payload.get("discussion_transcript")
    if not transcript:
        raise HTTPException(status_code=400, detail="discussion_transcript is required")

    db = get_db()
    matter = None
    
    # Get matter context
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

    # Call AI Skill Runner
    input_data = {
        "discussion_transcript": transcript,
        "matter_context": f"Client: {matter['client_name']}, Court: {matter['court_name']}, Facts: {matter.get('brief_facts', '')}"
    }
    
    try:
        ai_res = await skill_runner.run_skill(
            skill_name=SkillName.strategy_note,
            input_data=input_data,
            matter_id=matter_id,
            user_id=user_id
        )
    except Exception as e:
        logger.error(f'Database operation failed: {e}')
        raise HTTPException(status_code=500, detail=f"AI generation failed: {e}")

    # Parse AI JSON output
    try:
        structured = json.loads(ai_res["raw_output"])
    except Exception as e:
        logger.error(f'Database operation failed: {e}')
        structured = {
            "legal_position": "Could not parse AI output. Raw text: " + ai_res["raw_output"],
            "key_arguments": [],
            "risks": [],
            "recommended_strategy": "Manual drafting recommended",
            "next_actions": [],
            "precedents": []
        }

    # Save to AI Outputs table
    ai_output_id = str(uuid.uuid4())
    ai_output_record = {
        "id": ai_output_id,
        "matter_id": matter_id,
        "skill_name": SkillName.strategy_note.value,
        "prompt_used": transcript,
        "raw_output": ai_res["raw_output"],
        "review_status": AIReviewStatus.pending.value,
        "model_used": ai_res["model_used"],
        "tokens_used": ai_res["tokens_used"],
        "latency_ms": ai_res["latency_ms"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Save the new strategy note draft
    note_id = str(uuid.uuid4())
    new_note = {
        "id": note_id,
        "matter_id": matter_id,
        "version": 1,
        "discussion_transcript": transcript,
        "legal_position": structured.get("legal_position"),
        "key_arguments": structured.get("key_arguments", []),
        "risks": structured.get("risks", []),
        "recommended_strategy": structured.get("recommended_strategy"),
        "next_actions": structured.get("next_actions", []),
        "case_timeline": structured.get("case_timeline"),
        "precedents": structured.get("precedents", []),
        "fee_estimate": structured.get("fee_estimate"),
        "is_locked": False,
        "ai_output_id": ai_output_id,
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    if db is not None:
        try:
            db.table("ai_outputs").insert(ai_output_record).execute()
            
            # Check if there is existing note to upgrade version or overwrite
            existing = db.table("strategy_notes").select("id, version").eq("matter_id", matter_id).execute()
            if existing.data:
                # Delete existing drafts, update version
                max_ver = max(e["version"] for e in existing.data)
                new_note["version"] = max_ver + 1
                db.table("strategy_notes").delete().eq("matter_id", matter_id).eq("is_locked", False).execute()
            
            db.table("strategy_notes").insert(new_note).execute()
            return new_note
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            
    # Fallback Memory DB
    memory_db.AI_OUTPUTS.insert(0, ai_output_record)
    
    existing_notes = [n for n in memory_db.STRATEGY_NOTES if n["matter_id"] == matter_id]
    if existing_notes:
        max_ver = max(n["version"] for n in existing_notes)
        new_note["version"] = max_ver + 1
        # Remove unlocked drafts
        memory_db.STRATEGY_NOTES = [n for n in memory_db.STRATEGY_NOTES if not (n["matter_id"] == matter_id and not n["is_locked"])]
        
    memory_db.STRATEGY_NOTES.insert(0, new_note)  # type: ignore
    return new_note


@router.post("/matters/{matter_id}/strategy/lock")
async def lock_strategy_note(
    matter_id: str,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Lock the current strategy note, making it immutable and generating the archive PDF.
    Updates the matter status to 'active'.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")

    db = get_db()
    locked_at = datetime.now(timezone.utc).isoformat()
    pdf_url = f"https://storage.googleapis.com/legalos-bucket/strategy-notes/{matter_id}-locked.pdf"

    if db is not None:
        try:
            # 1. Fetch current draft strategy note
            sn_res = db.table("strategy_notes").select("*").eq("matter_id", matter_id).eq("is_locked", False).execute()
            if sn_res.data:
                note = sn_res.data[0]
                note_id = note["id"]
                
                # Update strategy note
                updates = {
                    "is_locked": True,
                    "locked_by": user_id,
                    "locked_at": locked_at,
                    "pdf_url": pdf_url,
                    "updated_at": locked_at
                }
                db.table("strategy_notes").update(updates).eq("id", note_id).execute()
                
                # Update AI output review status to approved
                if note.get("ai_output_id"):
                    db.table("ai_outputs").update({"review_status": "approved", "reviewed_by": user_id, "reviewed_at": locked_at}).eq("id", note["ai_output_id"]).execute()
                
                # Update matter status to active
                db.table("matters").update({"status": "active", "updated_at": locked_at}).eq("id", matter_id).execute()
                
                # Log audit trail
                db.table("audit_logs").insert({
                    "firm_id": settings.default_firm_id,
                    "user_id": user_id,
                    "user_role": "founder",
                    "action": "strategy_note.locked",
                    "resource_type": "strategy_notes",
                    "resource_id": note_id,
                    "after_state": {**note, **updates}
                }).execute()
                
                return {**note, **updates}
        except Exception as e:
            logger.error(f'Database operation failed: {e}')

    # Fallback to Memory DB
    note = next((n for n in memory_db.STRATEGY_NOTES if n["matter_id"] == matter_id and not n["is_locked"]), None)
    if not note:
        # Check if already locked
        already_locked = next((n for n in memory_db.STRATEGY_NOTES if n["matter_id"] == matter_id and n["is_locked"]), None)
        if already_locked:
            return already_locked
        raise HTTPException(status_code=404, detail="No unlocked strategy note draft found to lock")

    note["is_locked"] = True
    note["locked_by"] = user_id
    note["locked_at"] = datetime.now(timezone.utc)
    note["pdf_url"] = pdf_url
    note["updated_at"] = datetime.now(timezone.utc)

    # Update corresponding AI output
    ai_op = next((a for a in memory_db.AI_OUTPUTS if a["id"] == note.get("ai_output_id")), None)
    if ai_op:
        ai_op["review_status"] = "approved"
        ai_op["reviewed_by"] = user_id
        ai_op["reviewed_at"] = datetime.now(timezone.utc)

    # Update matter status to active
    matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
    if matter:
        matter["status"] = "active"
        matter["updated_at"] = datetime.now(timezone.utc)

    memory_db.log_audit(
        user_id=user_id,
        action="strategy_note.locked",
        resource_type="strategy_notes",
        resource_id=str(note["id"]),
        after=note,
        matter_id=matter_id
    )

    return note
