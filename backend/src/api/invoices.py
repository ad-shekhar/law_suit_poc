"""
Invoices Router — LegalOS Backend
"""
import logging
import uuid
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header

from ..config import settings
from ..db.supabase import get_db
from ..db import memory_db
from ..services.ai_skills import skill_runner
from ..models import SkillName, InvoiceStatus

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/invoices")
async def list_all_invoices():
    """List all invoices in the firm."""
    db = get_db()
    invoices = []
    
    if db:
        try:
            res = db.table("invoices").select("*").order("created_at", desc=True).execute()
            invoices = res.data or []
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            invoices = list(memory_db.INVOICES)
    else:
        invoices = list(memory_db.INVOICES)

    # Attach matter details
    for inv in invoices:
        matter_id = inv["matter_id"]
        matter = next((m for m in memory_db.MATTERS if m["id"] == matter_id), None)
        if db and not matter:
            try:
                m_res = db.table("matters").select("*").eq("id", matter_id).execute()
                if m_res.data:
                    matter = m_res.data[0]
            except Exception as e:
                logger.error(f'Database operation failed: {e}')
        inv["matter"] = matter
        
    return invoices


@router.get("/matters/{matter_id}/invoices")
async def get_matter_invoices(matter_id: str):
    """Get invoices for a specific matter."""
    db = get_db()
    invoices = []
    
    if db:
        try:
            res = db.table("invoices").select("*").eq("matter_id", matter_id).order("created_at", desc=True).execute()
            invoices = res.data or []
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            invoices = [inv for inv in memory_db.INVOICES if inv["matter_id"] == matter_id]
    else:
        invoices = [inv for inv in memory_db.INVOICES if inv["matter_id"] == matter_id]
        
    return invoices


@router.post("/matters/{matter_id}/invoices")
async def create_invoice(
    matter_id: str,
    payload: dict,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Create a milestone and generate an AI invoice draft.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")

    amount = float(payload.get("amount", 0))
    milestone_name = payload.get("milestone_name", "Consultation Fee")
    description = payload.get("description", "")
    gst_rate = 18.00
    gst_amount = amount * (gst_rate / 100.0)
    total_amount = amount + gst_amount

    db = get_db()
    count = 0
    if db:
        try:
            res = db.table("invoices").select("id").execute()
            count = len(res.data) if res.data else 0
        except Exception as e:
            logger.error(f'Database operation failed: {e}')
            count = len(memory_db.INVOICES)
    else:
        count = len(memory_db.INVOICES)

    invoice_number = f"LOS-INV-{datetime.now(timezone.utc).year}-{count + 101:03d}"

    # Call AI Skill 11 to generate invoice HTML layout
    ai_input = {
        "invoice_details": f"Invoice Number: {invoice_number}, Milestone: {milestone_name}, Amount: {amount}, GST: {gst_amount}, Total: {total_amount}"
    }
    
    try:
        ai_res = await skill_runner.run_skill(
            skill_name=SkillName.invoice_generation,
            input_data=ai_input,
            matter_id=matter_id,
            user_id=user_id
        )
        raw_out = json.loads(ai_res["raw_output"])
        draft_html = raw_out.get("invoice_html", "<div>Fallback Invoice Draft</div>")
    except Exception as e:
        logger.error(f'Database operation failed: {e}')
        draft_html = f"<div><h3>LegalOS Invoice</h3><p>Invoice No: {invoice_number}</p><p>{milestone_name}</p><p>Amount: ₹{amount}</p><p>GST @ 18%: ₹{gst_amount}</p><p>Total: ₹{total_amount}</p></div>"

    invoice_id = str(uuid.uuid4())
    new_invoice = {
        "id": invoice_id,
        "matter_id": matter_id,
        "invoice_number": invoice_number,
        "milestone_name": milestone_name,
        "description": description,
        "amount": amount,
        "gst_rate": gst_rate,
        "gst_amount": gst_amount,
        "total_amount": total_amount,
        "status": "draft",
        "draft_html": draft_html,
        "approved_by": None,
        "approved_at": None,
        "sent_at": None,
        "due_date": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
        "paid_at": None,
        "payment_reference": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if db:
        try:
            db.table("invoices").insert(new_invoice).execute()
            
            # Log audit trail
            db.table("audit_logs").insert({
                "firm_id": settings.default_firm_id,
                "user_id": user_id,
                "user_role": "founder",
                "action": "invoice.created",
                "resource_type": "invoices",
                "resource_id": invoice_id,
                "after_state": new_invoice
            }).execute()
            
            return new_invoice
        except Exception as e:
            logger.error(f'Database operation failed: {e}')

    # Fallback to Memory
    memory_db.INVOICES.insert(0, new_invoice)
    memory_db.log_audit(
        user_id=user_id,
        action="invoice.created",
        resource_type="invoices",
        resource_id=invoice_id,
        after=new_invoice,
        matter_id=matter_id
    )

    return new_invoice


@router.post("/invoices/{invoice_id}/approve")
async def approve_invoice(
    invoice_id: str,
    user_id: Optional[str] = Header(None, alias="X-User-Id")
):
    """
    Approve an invoice draft and change status to 'sent' or 'approved'.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")

    db = get_db()
    approved_at = datetime.now(timezone.utc).isoformat()

    if db:
        try:
            res = db.table("invoices").select("*").eq("id", invoice_id).execute()
            if res.data:
                inv = res.data[0]
                updates = {
                    "status": "sent",
                    "approved_by": user_id,
                    "approved_at": approved_at,
                    "sent_at": approved_at
                }
                db.table("invoices").update(updates).eq("id", invoice_id).execute()
                
                # Log audit trail
                db.table("audit_logs").insert({
                    "firm_id": settings.default_firm_id,
                    "user_id": user_id,
                    "user_role": "founder",
                    "action": "invoice.approved",
                    "resource_type": "invoices",
                    "resource_id": invoice_id,
                    "after_state": {**inv, **updates}
                }).execute()
                
                return {**inv, **updates}
        except Exception as e:
            logger.error(f'Database operation failed: {e}')

    # Fallback to Memory
    inv = next((i for i in memory_db.INVOICES if i["id"] == invoice_id), None)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    inv["status"] = "sent"
    inv["approved_by"] = user_id
    inv["approved_at"] = datetime.now(timezone.utc)
    inv["sent_at"] = datetime.now(timezone.utc)

    memory_db.log_audit(
        user_id=user_id,
        action="invoice.approved",
        resource_type="invoices",
        resource_id=invoice_id,
        after=inv,
        matter_id=inv["matter_id"]
    )

    return inv
