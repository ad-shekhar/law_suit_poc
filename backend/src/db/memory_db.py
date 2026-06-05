from ..config import settings
from datetime import timezone
"""
In-Memory Mock Database — LegalOS Backend
Used as a fallback when Supabase is not configured yet.
"""
import logging
logger = logging.getLogger(__name__)
from datetime import datetime, timedelta
import uuid
import threading

# ─── SEED DATA ────────────────────────────────────────────────────────────────

FIRMS = [
    {
        "id": settings.default_firm_id,
        "name": "LegalOS Practice",
        "slug": "legalos-practice",
        "subscription_tier": "poc",
        "logo_url": None,
        "settings": {}
    }
]

USERS = [
    {
        "id": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "firm_id": settings.default_firm_id,
        "email": "founder@legalos.dev",
        "full_name": "Arjun Sharma",
        "role": "founder",
        "avatar_url": None,
        "is_active": True
    },
    {
        "id": "b2d6e07b-15ce-55af-9d49-90d1b7c8e6b6",
        "firm_id": settings.default_firm_id,
        "email": "senior@legalos.dev",
        "full_name": "Priya Menon",
        "role": "senior_associate",
        "avatar_url": None,
        "is_active": True
    },
    {
        "id": "c3e7f18c-26df-66b0-ae5a-01e2c8d9f7c7",
        "firm_id": settings.default_firm_id,
        "email": "associate@legalos.dev",
        "full_name": "Riya Singh",
        "role": "associate",
        "avatar_url": None,
        "is_active": True
    },
    {
        "id": "d4f8g29d-37eg-77c1-bf6b-12f3d9e0f8d8",
        "firm_id": settings.default_firm_id,
        "email": "paralegal@legalos.dev",
        "full_name": "Vinay Gupta",
        "role": "paralegal",
        "avatar_url": None,
        "is_active": True
    },
    {
        "id": "e5g9h0ae-48fh-88d2-c07c-23f4eaf1f9e9",
        "firm_id": settings.default_firm_id,
        "email": "client@legalos.dev",
        "full_name": "Rajesh Kumar",
        "role": "client",
        "avatar_url": None,
        "is_active": True
    },
    {
        "id": "f6h0i1bf-59gi-99e3-d18d-34g5fbg2faea",
        "firm_id": settings.default_firm_id,
        "email": "admin@legalos.dev",
        "full_name": "Admin User",
        "role": "admin",
        "avatar_url": None,
        "is_active": True
    }
]

MATTERS = [
    {
        "id": "m1-rajesh-kumar",
        "firm_id": settings.default_firm_id,
        "matter_number": "LOS-2024-001",
        "client_name": "Rajesh Kumar Enterprises Pvt. Ltd.",
        "client_email": "rajesh@rkenterprises.com",
        "client_phone": "+91-9876543210",
        "case_type": "civil_suit",
        "court": "high_court",
        "court_name": "Delhi High Court",
        "case_number": "CS(COMM) 142/2024",
        "filing_number": "F-49182/2024",
        "status": "active",
        "assigned_founder_id": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "assigned_associate_id": "c3e7f18c-26df-66b0-ae5a-01e2c8d9f7c7",
        "opposing_counsel": "S.K. Mehta & Associates",
        "opposing_party": "ABC Infrastructure Ltd.",
        "relief_sought": "Recovery of ₹2.5 Crore with interest under Section 37 of the Arbitration Act",
        "brief_facts": "Client entered into a construction contract dated March 15, 2022 with the opposing party. The opposing party defaulted on payments totaling ₹2.5 Cr despite multiple reminders. An arbitration clause (Clause 23) exists in the agreement.",
        "tags": ["arbitration", "recovery", "construction"],
        "is_confidential": False,
        "created_at": datetime.now(timezone.utc) - timedelta(days=30),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=2)
    },
    {
        "id": "m2-priya-estates",
        "firm_id": settings.default_firm_id,
        "matter_number": "LOS-2024-002",
        "client_name": "Priya Estates Ltd",
        "client_email": "contact@priyaestates.com",
        "client_phone": "+91-9123456789",
        "case_type": "ibc_insolvency",
        "court": "nclt",
        "court_name": "NCLT Principal Bench",
        "case_number": "CP(IB) 88/2024",
        "filing_number": "F-10293/2024",
        "status": "arguments_pending",
        "assigned_founder_id": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "assigned_associate_id": "b2d6e07b-15ce-55af-9d49-90d1b7c8e6b6",
        "opposing_counsel": "G.D. Goenka Advocates",
        "opposing_party": "Defaulter Corp Ltd",
        "relief_sought": "Admission of Section 9 IBC application for ₹4.8 Crore operational debt",
        "brief_facts": "Default in supply of construction raw material. Demand notice under Section 8 served. No notice of dispute received.",
        "tags": ["IBC", "NCLT", "insolvency"],
        "is_confidential": False,
        "created_at": datetime.now(timezone.utc) - timedelta(days=45),
        "updated_at": datetime.now(timezone.utc) - timedelta(hours=4)
    }
]

STRATEGY_NOTES = [
    {
        "id": "s1-note",
        "matter_id": "m1-rajesh-kumar",
        "version": 1,
        "discussion_transcript": "Client wants to enforce the arbitration award immediately. We need to prepare the execution petition under Section 36 of the Arbitration Act. Make sure we also look for any interim relief under Section 9 if there is a risk of them moving assets.",
        "legal_position": "Client holds a valid and enforceable arbitral award dated January 10, 2024. Post-2015 amendment, enforcement is a ministerial act. The opposing party's window to file under Section 34 expires March 10, 2024.",
        "key_arguments": [
            "Award is a decree — enforcement proceedings under Section 36 are maintainable",
            "No automatic stay on filing of Section 34 petition post-2015 amendment",
            "Separate application under Section 9 for attachment of assets recommended"
        ],
        "risks": [
            {"risk": "S.34 challenge filed before enforcement", "severity": "medium", "mitigation": "File S.36 execution immediately; oppose any stay application"},
            {"risk": "Assets transferred before attachment", "severity": "high", "mitigation": "Emergency S.9 application for interim injunction this week"}
        ],
        "recommended_strategy": "Two-track: (1) File execution petition under S.36 immediately. (2) File S.9 application for attachment of identified assets as protective measure.",
        "next_actions": [
            "File S.36 execution petition by this week",
            "Asset search: CERSAI + MCA21 for properties/shares"
        ],
        "case_timeline": "Week 1: Filing → Week 2-4: Service + First hearing → Month 2-3: Arguments on stay application",
        "precedents": ["Hindustan Construction — enforcement as ministerial act", "BCCI v. Kochi — no automatic stay"],
        "fee_estimate": "₹5,00,000",
        "is_locked": True,
        "locked_by": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "locked_at": datetime.now(timezone.utc) - timedelta(days=25),
        "pdf_url": "https://storage.googleapis.com/legalos-bucket/strategy-notes/LOS-2024-001-v1.pdf",
        "ai_output_id": "ai-op-1",
        "created_by": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "created_at": datetime.now(timezone.utc) - timedelta(days=25),
        "updated_at": datetime.now(timezone.utc) - timedelta(days=25)
    }
]

HEARINGS = [
    {
        "id": "h1",
        "matter_id": "m1-rajesh-kumar",
        "hearing_date": datetime.now(timezone.utc) + timedelta(hours=2), # upcoming today
        "court_room": "Court 3, Item 12",
        "judge_name": "Justice A. Sharma",
        "bench_composition": "Single Bench",
        "path_type": "C",
        "order_summary": "Upcoming hearing on enforcement petition.",
        "outcome": None,
        "next_steps": None,
        "adjourned_to": None,
        "raw_order_url": None,
        "order_text": None,
        "client_update_draft": None,
        "client_update_approved": False,
        "client_update_sent_at": None,
        "created_by": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "created_at": datetime.now(timezone.utc) - timedelta(days=5)
    },
    {
        "id": "h2",
        "matter_id": "m2-priya-estates",
        "hearing_date": datetime.now(timezone.utc) + timedelta(hours=5), # upcoming today
        "court_room": "Court 4, Item 28",
        "judge_name": "Presiding Member",
        "bench_composition": "Division Bench",
        "path_type": "C",
        "order_summary": "Upcoming arguments on admission.",
        "outcome": None,
        "next_steps": None,
        "adjourned_to": None,
        "raw_order_url": None,
        "order_text": None,
        "client_update_draft": None,
        "client_update_approved": False,
        "client_update_sent_at": None,
        "created_by": "b2d6e07b-15ce-55af-9d49-90d1b7c8e6b6",
        "created_at": datetime.now(timezone.utc) - timedelta(days=10)
    }
]

INVOICES = [
    {
        "id": "inv1",
        "matter_id": "m1-rajesh-kumar",
        "invoice_number": "LOS-INV-2024-001",
        "milestone_name": "Retainer Fee",
        "description": "Retainer fee upon execution of engagement letter",
        "amount": 200000.0,
        "gst_rate": 18.0,
        "gst_amount": 36000.0,
        "total_amount": 236000.0,
        "status": "paid",
        "draft_html": "<div>Retainer Invoice Draft</div>",
        "approved_by": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "approved_at": datetime.now(timezone.utc) - timedelta(days=20),
        "sent_at": datetime.now(timezone.utc) - timedelta(days=20),
        "due_date": datetime.now(timezone.utc) - timedelta(days=10),
        "paid_at": datetime.now(timezone.utc) - timedelta(days=15),
        "payment_reference": "TXN9182038102",
        "created_at": datetime.now(timezone.utc) - timedelta(days=20)
    },
    {
        "id": "inv2",
        "matter_id": "m1-rajesh-kumar",
        "invoice_number": "LOS-INV-2024-002",
        "milestone_name": "Filing of Execution Petition",
        "description": "Milestone billing for filing petition under Section 36",
        "amount": 150000.0,
        "gst_rate": 18.0,
        "gst_amount": 27000.0,
        "total_amount": 177000.0,
        "status": "sent",
        "draft_html": "<div>Filing Invoice Draft</div>",
        "approved_by": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "approved_at": datetime.now(timezone.utc) - timedelta(days=5),
        "sent_at": datetime.now(timezone.utc) - timedelta(days=5),
        "due_date": datetime.now(timezone.utc) + timedelta(days=10),
        "paid_at": None,
        "payment_reference": None,
        "created_at": datetime.now(timezone.utc) - timedelta(days=6)
    }
]

AI_OUTPUTS = [
    {
        "id": "ai-op-1",
        "matter_id": "m1-rajesh-kumar",
        "skill_name": "skill_03_strategy_note",
        "prompt_used": "Generate strategy note for Rajesh Kumar matter...",
        "raw_output": '{"legal_position": "Client holds a valid arbitral award...", "key_arguments": ["Award is a decree"], "risks": [{"risk": "Stay order", "severity": "medium", "mitigation": "oppose stay"}]}',
        "review_status": "approved",
        "reviewed_by": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "reviewed_at": datetime.now(timezone.utc) - timedelta(days=25),
        "final_output": '{"legal_position": "Client holds a valid arbitral award...", "key_arguments": ["Award is a decree"], "risks": [{"risk": "Stay order", "severity": "medium", "mitigation": "oppose stay"}]}',
        "review_notes": "Looks perfect.",
        "model_used": "gemini-1.5-flash",
        "tokens_used": 1420,
        "latency_ms": 1900,
        "created_at": datetime.now(timezone.utc) - timedelta(days=25)
    },
    {
        "id": "ai-op-2",
        "matter_id": "m1-rajesh-kumar",
        "skill_name": "skill_04_engagement_letter",
        "prompt_used": "Draft engagement letter...",
        "raw_output": '{"letter_html": "<div>Draft Letter</div>"}',
        "review_status": "pending",
        "reviewed_by": None,
        "reviewed_at": None,
        "final_output": None,
        "review_notes": None,
        "model_used": "gemini-1.5-flash",
        "tokens_used": 900,
        "latency_ms": 1100,
        "created_at": datetime.now(timezone.utc) - timedelta(hours=2)
    }
]

AUDIT_LOGS = [
    {
        "id": "al-1",
        "matter_id": "m1-rajesh-kumar",
        "firm_id": settings.default_firm_id,
        "user_id": "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
        "user_role": "founder",
        "action": "strategy_note.locked",
        "resource_type": "strategy_notes",
        "resource_id": "s1-note",
        "before_state": {},
        "after_state": {"is_locked": True},
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0",
        "metadata": {},
        "created_at": datetime.now(timezone.utc) - timedelta(days=25)
    }
]

DOCUMENTS = []


# ─── HELPER METHODS (CRUD operations on Memory DB) ───────────────────────────

def log_audit(user_id: str, action: str, resource_type: str, resource_id: str, before=None, after=None, matter_id=None):
    user = next((u for u in USERS if u["id"] == user_id), None)
    role = user["role"] if user else "associate"
    log = {
        "id": f"al-{str(uuid.uuid4())[:8]}",
        "matter_id": matter_id,
        "firm_id": settings.default_firm_id,
        "user_id": user_id,
        "user_role": role,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "before_state": before or {},
        "after_state": after or {},
        "ip_address": "127.0.0.1",
        "user_agent": "Python/FastAPI",
        "metadata": {},
        "created_at": datetime.now(timezone.utc)
    }
    with db_lock:
        AUDIT_LOGS.insert(0, log)
    return log
