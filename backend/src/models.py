"""
LegalOS — Database Models (Pydantic schemas matching Supabase tables)
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    admin = "admin"              # Firm admin — manages users, billing, settings
    founder = "founder"          # Senior Advocate / Founding Partner — full access, all approvals
    senior_associate = "senior_associate"  # Senior Associate — can generate, limited approvals
    associate = "associate"      # Junior Associate — drafts, hearing logs, uploads
    paralegal = "paralegal"      # Paralegal / Clerk — data entry, document uploads
    client = "client"            # Client — read-only matter status portal


class MatterStatus(str, Enum):
    intake = "intake"
    active = "active"
    pending_docs = "pending_docs"
    hearing_scheduled = "hearing_scheduled"
    arguments_pending = "arguments_pending"
    reserved_for_orders = "reserved_for_orders"
    order_received = "order_received"
    closed_won = "closed_won"
    closed_lost = "closed_lost"
    closed_settled = "closed_settled"
    archived = "archived"


class CaseType(str, Enum):
    civil_suit = "civil_suit"
    criminal = "criminal"
    arbitration = "arbitration"
    ibc_insolvency = "ibc_insolvency"
    constitutional = "constitutional"
    company_law = "company_law"
    tax = "tax"
    real_estate = "real_estate"
    intellectual_property = "intellectual_property"
    employment = "employment"
    family = "family"
    advisory = "advisory"
    other = "other"


class CourtType(str, Enum):
    supreme_court = "supreme_court"
    high_court = "high_court"
    district_court = "district_court"
    nclt = "nclt"
    nclat = "nclat"
    ncdrc = "ncdrc"
    arbitral_tribunal = "arbitral_tribunal"
    itat = "itat"
    drat = "drat"
    other = "other"


class HearingPathType(str, Enum):
    path_a = "A"   # ECourts API automated
    path_b = "B"   # Order sheet upload
    path_c = "C"   # Manual entry


class AIReviewStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    modified = "modified"


class InvoiceStatus(str, Enum):
    draft = "draft"
    pending_approval = "pending_approval"
    approved = "approved"
    sent = "sent"
    paid = "paid"
    overdue = "overdue"
    cancelled = "cancelled"


class SkillName(str, Enum):
    matter_intake_extraction = "skill_01_matter_intake"
    preliminary_research = "skill_02_preliminary_research"
    strategy_note = "skill_03_strategy_note"
    engagement_letter = "skill_04_engagement_letter"
    document_query = "skill_05_document_query"
    deviation_flagging = "skill_06_deviation_flagging"
    arguments_brief = "skill_07_arguments_brief"
    legal_memo = "skill_08_legal_memo"
    hearing_summary = "skill_09_hearing_summary"
    order_analysis = "skill_10_order_analysis"
    invoice_generation = "skill_11_invoice_generation"
    client_update_email = "skill_12_client_update"
    matter_close_summary = "skill_13_matter_close"


# ─── Core Models ─────────────────────────────────────────────────────────────

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    firm_id: str
    email: EmailStr
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Firm(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    subscription_tier: str = "poc"
    logo_url: Optional[str] = None
    settings: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Matter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    firm_id: str
    matter_number: str  # e.g. LOS-2024-001
    client_name: str
    client_email: Optional[EmailStr] = None
    client_phone: Optional[str] = None
    case_type: CaseType
    court: CourtType
    court_name: str  # e.g. "Delhi High Court — Division Bench"
    case_number: Optional[str] = None
    filing_number: Optional[str] = None
    status: MatterStatus = MatterStatus.intake
    assigned_founder_id: str
    assigned_associate_id: Optional[str] = None
    opposing_counsel: Optional[str] = None
    opposing_party: Optional[str] = None
    relief_sought: Optional[str] = None
    brief_facts: Optional[str] = None
    tags: list[str] = Field(default_factory=list)
    is_confidential: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StrategyNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matter_id: str
    version: int = 1
    discussion_transcript: Optional[str] = None
    
    # Structured content (AI generates these)
    legal_position: Optional[str] = None
    key_arguments: list[str] = Field(default_factory=list)
    risks: list[dict] = Field(default_factory=list)  # [{risk, mitigation, severity}]
    recommended_strategy: Optional[str] = None
    next_actions: list[str] = Field(default_factory=list)
    case_timeline: Optional[str] = None
    precedents: list[str] = Field(default_factory=list)
    
    # Lifecycle
    is_locked: bool = False
    locked_by: Optional[str] = None
    locked_at: Optional[datetime] = None
    pdf_url: Optional[str] = None
    ai_output_id: Optional[str] = None
    
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Hearing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matter_id: str
    hearing_date: datetime
    court_room: Optional[str] = None
    judge_name: Optional[str] = None
    bench_composition: Optional[str] = None
    path_type: HearingPathType = HearingPathType.path_c
    
    # What happened
    order_summary: Optional[str] = None
    outcome: Optional[str] = None
    next_steps: Optional[str] = None
    adjourned_to: Optional[datetime] = None
    
    # Documents
    raw_order_url: Optional[str] = None
    order_text: Optional[str] = None
    
    # Client update
    client_update_draft: Optional[str] = None
    client_update_approved: bool = False
    client_update_sent_at: Optional[datetime] = None
    
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matter_id: str
    document_type: str  # order, petition, affidavit, contract, etc.
    display_name: str
    file_url: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    embedding_status: str = "pending"  # pending, processing, done, failed
    chunk_count: int = 0
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AIOutput(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matter_id: str
    skill_name: SkillName
    prompt_used: Optional[str] = None
    raw_output: str
    review_status: AIReviewStatus = AIReviewStatus.pending
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    final_output: Optional[str] = None
    review_notes: Optional[str] = None
    model_used: str = "gemini-1.5-flash"
    tokens_used: int = 0
    latency_ms: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matter_id: str
    invoice_number: str  # e.g. LOS-INV-2024-001
    milestone_name: str
    description: Optional[str] = None
    amount: float  # Base amount in INR
    gst_rate: float = 18.0  # 18% GST default
    gst_amount: float = 0.0
    total_amount: float = 0.0
    status: InvoiceStatus = InvoiceStatus.draft
    draft_html: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    payment_reference: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    matter_id: Optional[str] = None
    firm_id: str
    user_id: str
    user_role: UserRole
    action: str  # e.g. "strategy_note.locked", "ai_output.approved"
    resource_type: str
    resource_id: Optional[str] = None
    before_state: Optional[dict] = None
    after_state: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
