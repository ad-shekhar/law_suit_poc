# LegalOS — Next Phases Roadmap
> **For Agent Use**: This document is a sequenced, actionable plan. Each phase is self-contained with exact files to create/modify, implementation details, and acceptance criteria. Phases must be completed in order due to dependencies.

---

## Pre-Work Checklist (Before Starting Any Phase)

Before picking up any phase, verify these are true:
```bash
# 1. Backend runs without errors
cd backend && uvicorn main:app --reload --port 8000
# → Visit http://localhost:8000/api/docs — should show all routes

# 2. Frontend runs
cd frontend && npm run dev
# → Visit http://localhost:3000 — login with founder@legalos.dev / demo1234

# 3. No import errors in backend
cd backend && python -c "from src.api import matters, dashboard, strategy, hearings, invoices, users, ai_skills, audit; print('OK')"

# 4. Check branch
git branch  # should be on feature/poc
```

**Known bugs to fix immediately** (if not already fixed):
1. `memory_db.py` line ~333: `db_lock` is used but never defined. Add `import threading; db_lock = threading.Lock()` near the top of the file after imports.
2. `models.py` line 6: `from datetime import datetime, timezone, timezone` — remove duplicate `timezone`.
3. `matters.py`, `hearings.py`, `dashboard.py`, `invoices.py`, `strategy.py`, `users.py` all use `from src.db.supabase import get_db` (absolute import). Change to `from ..db.supabase import get_db` for consistency (or add `src` to `pyrightconfig.extraPaths`).

---

## Phase 2 — Real Authentication & User Management
**Priority**: 🔴 Critical (blocks everything else from being production-ready)  
**Estimated time**: 2-3 days  
**Dependencies**: None (can start immediately)

### Goal
Replace the current fake sessionStorage-only auth with real Supabase Auth (JWT tokens). Add proper auth middleware to the backend.

### Step 2.1 — Backend: JWT Auth Middleware

**File to create**: `backend/src/middleware/auth.py`
```python
# Implementation:
# - FastAPI Depends() function that reads Authorization: Bearer <token> header
# - Verifies JWT using supabase service role key OR python-jose
# - Extracts user_id from token claims
# - Returns user_id to the route handler
# - Falls back to X-User-Id header if no Bearer token (for backwards compatibility during transition)
```

**File to modify**: `backend/main.py`
- Import and apply the auth middleware
- Make auth optional for `/api/health` and `/api/v1/users/login`

**Packages needed** (already in requirements.txt):
- `python-jose[cryptography]`
- `passlib[bcrypt]`

### Step 2.2 — Backend: Real User Login Endpoint

**File to modify**: `backend/src/api/users.py`

Current `/users/login` does a plain memory_db lookup. Replace with:
```python
# POST /api/v1/users/login
# 1. Lookup user by email in Supabase (or memory_db fallback)
# 2. Verify password with passlib bcrypt
# 3. Generate JWT with python-jose:
#    payload = { "sub": user_id, "email": email, "role": role, "firm_id": firm_id, "exp": datetime.utcnow() + timedelta(hours=24) }
# 4. Return: { "token": jwt_token, "user": { id, email, full_name, role, firm_id } }
```

**Demo users**: The 6 demo users in `memory_db.py` need hashed passwords. Add a `password_hash` field to each user dict using `passlib.hash.bcrypt.hash("demo1234")`.

### Step 2.3 — Frontend: Update Auth Flow

**File to modify**: `frontend/src/app/auth/login/page.tsx`
- Store JWT token in `sessionStorage` alongside the user object
- Create a `sessionStorage` key `legalos_token` for the JWT

**File to modify**: `frontend/src/lib/api.ts`
- Update `getHeaders()` to send `Authorization: Bearer <token>` if `legalos_token` exists
- Keep `X-User-Id` header as fallback during transition period

### Step 2.4 — Frontend: Password Reset Flow

**File to create**: `frontend/src/app/auth/reset-password/page.tsx`
- Email input form
- Calls `POST /api/v1/users/request-password-reset`
- Shows "Check your email" confirmation

### Acceptance Criteria
- [ ] Login with `founder@legalos.dev / demo1234` works and returns a JWT
- [ ] JWT is verified on every protected API call
- [ ] Invalid/expired JWT returns 401 Unauthorized
- [ ] Page refresh doesn't lose the user session
- [ ] All 6 demo users can log in

---

## Phase 3 — Supabase Database Wiring
**Priority**: 🔴 Critical (required for real data persistence)  
**Estimated time**: 1-2 days  
**Dependencies**: Phase 2 (auth) must be done first  
**Pre-condition**: Must have a Supabase project created and `SUPABASE_URL` + `SUPABASE_ANON_KEY` in `.env`

### Goal
Apply the schema to Supabase and verify all API routes read/write real data instead of memory fallback.

### Step 3.1 — Apply Schema to Supabase

```bash
# Option A: Supabase CLI
cd backend
supabase db reset  # if using local supabase
# OR paste schema.sql into Supabase Dashboard → SQL Editor

# Option B: Python migration script
# File to create: backend/scripts/migrate.py
```

**File to create**: `backend/scripts/migrate.py`
```python
# 1. Connect to Supabase using service role key
# 2. Read and execute backend/src/db/schema.sql
# 3. Print success/failure for each statement
# 4. Handle "already exists" gracefully
# Run: python -m scripts.migrate
```

### Step 3.2 — Seed Demo Data to Supabase

**File to create**: `backend/scripts/seed.py`
```python
# 1. Import all seed data from memory_db.py (FIRMS, USERS, MATTERS, etc.)
# 2. Upsert each record to Supabase tables
# 3. Handle datetime serialization (convert datetime objects to ISO strings)
# 4. Run: python -m scripts.seed
```

**Important**: The seed data in `memory_db.py` uses Python `datetime` objects for timestamps. Supabase needs ISO 8601 strings. The `seed.py` script must convert them.

### Step 3.3 — Fix `supabase.py` to Use Service Role Key

**File to modify**: `backend/src/db/supabase.py`
- For server-side operations, use `SUPABASE_SERVICE_ROLE_KEY` instead of anon key
- Anon key should only be used for client-facing auth flows
- Add a second client `supabase_admin_client` using service role key for write operations

### Step 3.4 — Verify All Routes Work with Real DB

Test each route manually or write a test:
```bash
# Test matters
curl -X GET http://localhost:8000/api/v1/matters -H "X-User-Id: a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5"
# Should return matters from Supabase, not memory_db

# Test create matter
curl -X POST http://localhost:8000/api/v1/matters \
  -H "Content-Type: application/json" \
  -H "X-User-Id: a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5" \
  -d '{"client_name": "Test Client", "case_type": "civil_suit", "court": "high_court", "court_name": "Delhi High Court"}'
# Should return new matter and persist in Supabase
```

### Step 3.5 — Add Supabase Row-Level Security (RLS)

**File to modify**: `backend/src/db/schema.sql` (add RLS policies at end)
```sql
-- Enable RLS on all tables
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Founders see all matters in their firm
CREATE POLICY "founders_see_all_matters" ON matters
  FOR SELECT USING (
    firm_id = (SELECT firm_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('founder', 'admin')
  );

-- Associates see only assigned matters
CREATE POLICY "associates_see_assigned_matters" ON matters
  FOR SELECT USING (
    assigned_associate_id = auth.uid()
    OR assigned_founder_id = auth.uid()
  );
```

### Acceptance Criteria
- [ ] `python -m scripts.migrate` applies schema without errors
- [ ] `python -m scripts.seed` inserts all seed data
- [ ] `GET /api/v1/matters` returns data from Supabase (not memory_db fallback)
- [ ] New matters created via frontend persist across backend restarts
- [ ] `supabase_client` is `None` only when env keys are blank

---

## Phase 4 — Matter Intake AI Workflow (End-to-End)
**Priority**: 🟠 High (core product value prop)  
**Estimated time**: 2-3 days  
**Dependencies**: Phases 2 + 3

### Goal
Wire up Skill 01 (Matter Intake) as a complete end-to-end flow: paste email → AI extracts fields → human reviews → matter is created.

### Step 4.1 — Enable Real Gemini Calls

**File to modify**: `backend/.env`
```env
GEMINI_API_KEY=your-actual-key-from-aistudio.google.com
AI_MOCK_MODE=False
```

**Verify Gemini is working:**
```bash
cd backend && python -c "
from src.services.ai_skills import skill_runner
import asyncio
result = asyncio.run(skill_runner.run_skill('matter_intake_extraction', {'input_text': 'Test email'}, 'test-matter', 'test-user'))
print(result)
"
```

### Step 4.2 — Frontend: Matter Intake Page

**File to create**: `frontend/src/app/dashboard/matters/intake/page.tsx`

This page has two sections:

**Section A: Email Paste Area**
```tsx
// Textarea where user pastes client email/text
// "Extract with AI" button
// Calls: api.runAiSkill("skill_01_matter_intake", null, { input_text: emailText })
// Shows loading spinner during extraction (1.5s mock or real Gemini)
```

**Section B: Extracted Fields Review (appears after AI runs)**
```tsx
// Pre-populated form with extracted fields:
// - client_name, client_email, client_phone (editable)
// - case_type (dropdown: civil_suit, criminal, arbitration, ibc_insolvency, etc.)
// - court (dropdown: supreme_court, high_court, district_court, nclt, etc.)
// - court_name (text input)
// - opposing_party (text input)
// - relief_sought (textarea)
// - brief_facts (textarea)
// - suggested_tags (tag chips — editable)
// AI confidence score badge (shows 0.92 etc.)
// "Create Matter" button → calls api.createMatter(formData)
// "Discard" button → clears and goes back
```

**File to modify**: `frontend/src/lib/api.ts`
- Add `extractMatterFromEmail(emailText: string)` that calls `runAiSkill` with the right params
- Add `getMatterIntakeOutput(outputId: string)` to poll for the AI output if needed

### Step 4.3 — Backend: Matter Intake as Dedicated Endpoint

**File to modify**: `backend/src/api/matters.py`
- Add `POST /api/v1/matters/intake` endpoint:
```python
# 1. Accept { email_text: str, user_id: str }
# 2. Call skill_runner.run_skill(SkillName.matter_intake_extraction, {"input_text": email_text}, matter_id="new", user_id=user_id)
# 3. Save the AI output to ai_outputs table with review_status="pending"
# 4. Return the AI output record (frontend shows the extracted fields for review)
```

### Step 4.4 — Wire the Review-to-Create Flow

The current flow needs: AI output → human reviews → matter is created.

**File to modify**: `backend/src/api/ai_skills.py`
- When an AI output with `skill_name = "skill_01_matter_intake"` is approved, automatically create a matter from `final_output`:
```python
# In review_ai_output() function, after setting status = "approved":
if skill_name_val == SkillName.matter_intake_extraction.value and status == "approved":
    parsed = json.loads(final_output or raw_output)
    # Call create matter logic with parsed fields
    new_matter = await create_matter_from_intake(parsed, user_id, db)
```

### Acceptance Criteria
- [ ] Pasting an email and clicking "Extract with AI" shows populated form fields in < 30 seconds
- [ ] User can edit any extracted field before confirming
- [ ] Clicking "Create Matter" creates a matter and redirects to matter detail page
- [ ] The AI output is logged in the audit trail as `ai_skill.run:skill_01_matter_intake`
- [ ] The approved AI output shows `review_status: "approved"` in the AI review queue

---

## Phase 5 — Strategy Note Complete Workflow
**Priority**: 🟠 High (flagship AI feature)  
**Estimated time**: 2-3 days  
**Dependencies**: Phases 2 + 3

### Goal
Complete the strategy note workflow: founder has a client discussion → pastes transcript → AI generates structured strategy → founder reviews/edits → locks note → exports to PDF.

### Step 5.1 — Strategy Note UI on Matter Detail

**File to check/modify**: `frontend/src/app/dashboard/matters/[id]/page.tsx`

The matter detail page should have a dedicated "Strategy Note" tab/section with:
```tsx
// Tab: "Strategy Note"
// If no strategy note exists:
//   - Textarea: "Paste discussion transcript here"
//   - Button: "Generate Strategy Note with AI" 
//   - Calls: api.generateStrategy(matterId, transcript)
// If strategy note exists (review_status = "pending"):
//   - Shows "Pending Review" badge
//   - Link to AI Review Queue
// If strategy note exists (is_locked = false):
//   - Editable fields: legal_position, key_arguments (list), risks (table), recommended_strategy, next_actions, fee_estimate
//   - "Lock Strategy Note" button (founder/admin only)
// If strategy note exists (is_locked = true):
//   - Read-only view of all fields
//   - Lock badge: "Locked by [name] on [date]"
//   - "Export PDF" button
//   - "Unlock" button (founder/admin only — adds audit log entry)
```

### Step 5.2 — Backend: Strategy Lock/Unlock Audit

**File to modify**: `backend/src/api/strategy.py`
- Ensure `POST /matters/{id}/strategy/lock` also logs to audit table with `action: "strategy_note.locked"`
- Add `POST /matters/{id}/strategy/unlock` endpoint with audit log `action: "strategy_note.unlocked"`

### Step 5.3 — PDF Export

**File to modify**: `backend/src/api/strategy.py`
- Add `GET /matters/{matter_id}/strategy/export-pdf` endpoint
- Uses WeasyPrint (already in requirements.txt) to generate a PDF from HTML template
- HTML template should include: firm name, matter number, client name, date, all strategy fields, lock timestamp, "Human Generated, AI Assisted" footer
- Returns `Content-Type: application/pdf` response with `Content-Disposition: attachment; filename="LOS-XXXX-strategy-note.pdf"`

**File to create**: `backend/src/templates/strategy_note.html` (Jinja2 template)

### Step 5.4 — Dual-Record Pattern

Per the architecture decision, strategy notes should have:
1. Structured record in `strategy_notes` table (already exists)
2. PDF stored in Supabase Storage → URL saved in `strategy_notes.pdf_url`

**File to modify**: `backend/src/api/strategy.py`
- After generating PDF, upload to Supabase Storage bucket `strategy-notes/`
- Save the public URL to `strategy_notes.pdf_url`

### Acceptance Criteria
- [ ] Pasting a discussion transcript and clicking "Generate" produces a structured strategy note in < 30 seconds
- [ ] All strategy fields are editable before locking
- [ ] Only founders/admins can lock the note
- [ ] Locking creates an audit log entry
- [ ] "Export PDF" generates a professionally formatted PDF and downloads it
- [ ] Locked notes cannot be modified without unlocking (and audit logging the unlock)

---

## Phase 6 — Document Upload & RAG Pipeline
**Priority**: 🟡 Medium (enables Skills 05, 06, 07, 08)  
**Estimated time**: 3-4 days  
**Dependencies**: Phase 3 (Supabase must be live)

### Goal
Enable document uploads (PDFs, DOCX) and build the embedding/RAG pipeline so AI can answer questions about specific matter documents.

### Step 6.1 — Backend: File Upload Endpoint

**File to modify**: `backend/src/api/` — add new router or add to `matters.py`
```python
# POST /api/v1/matters/{matter_id}/documents
# Accepts: multipart/form-data with fields: file, document_type, display_name
# 1. Validate file type (PDF, DOCX, PNG, JPG)
# 2. Upload file to Supabase Storage bucket "documents/{matter_id}/"
# 3. Get public URL
# 4. Create record in documents table: { matter_id, document_type, display_name, file_url, file_size, mime_type, embedding_status: "pending" }
# 5. Trigger background embedding task (or queue it)
# 6. Return document record

# GET /api/v1/matters/{matter_id}/documents
# Returns list of all documents for a matter
```

**Packages needed** (already in requirements.txt): `aiofiles`, `pypdf`, `pillow`

### Step 6.2 — Text Extraction Pipeline

**File to create**: `backend/src/services/document_processor.py`
```python
# def extract_text_from_pdf(file_path: str) -> str:
#   Uses pypdf to extract text from each page
#   Returns concatenated text

# def chunk_text(text: str, chunk_size: int = 2000, overlap: int = 400) -> list[str]:
#   Splits text into overlapping chunks
#   chunk_size: ~2000 chars for court orders, ~5000 for contracts
#   overlap: 20% of chunk_size to preserve context across boundaries

# def embed_chunks(chunks: list[str]) -> list[list[float]]:
#   Uses Google text-embedding-004 (via langchain-google-genai)
#   Returns list of embedding vectors

# async def process_document(document_id: str, file_url: str):
#   Full pipeline: download → extract → chunk → embed → store
#   Updates document.embedding_status: "processing" → "done" / "failed"
#   Updates document.chunk_count
```

### Step 6.3 — Vector Storage in Supabase (pgvector)

**File to modify**: `backend/src/db/schema.sql`
```sql
-- Add pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add document_chunks table
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(768),  -- text-embedding-004 produces 768-dim vectors
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_matter ON document_chunks(matter_id);
-- pgvector index for cosine similarity search
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Step 6.4 — Skill 05: Document Query (RAG)

**File to modify**: `backend/src/services/ai_skills.py`
- Add prompt for `SkillName.document_query` to `SKILL_PROMPTS`
- The `_run_gemini()` method for document_query needs to:
  1. Embed the query string using text-embedding-004
  2. Vector search `document_chunks` for top-K similar chunks
  3. Build prompt with context chunks + question
  4. Call Gemini to generate answer with citations

```python
SKILL_PROMPTS[SkillName.document_query] = """You are a legal research assistant.
Based ONLY on the provided document excerpts, answer the question.
If the answer is not in the provided excerpts, say "Not found in provided documents."
Cite the specific document and approximate location for each claim.

Question: {query}

Document Excerpts:
{context_chunks}

IMPORTANT: Do not make up information not present in the excerpts."""
```

### Step 6.5 — Frontend: Documents Page

**File to modify**: `frontend/src/app/dashboard/documents/page.tsx`
- Currently a placeholder — build it out with:
  - File upload dropzone (drag & drop or click to browse)
  - Document type selector (petition, order, contract, notice, other)
  - List of uploaded documents per matter
  - Embedding status indicator (pending/processing/done/failed)
  - "Query Documents" search box (calls Skill 05)

### Acceptance Criteria
- [ ] User can upload a PDF to a matter
- [ ] Document appears in the list with "Processing" status
- [ ] After processing, status changes to "Done" and chunk_count is set
- [ ] "Query Documents" returns an AI answer with document citations
- [ ] Documents are stored in Supabase Storage (not local disk)
- [ ] Failed embeddings show "Failed" status with error info in logs

---

## Phase 7 — Hearing Management (Full Workflow)
**Priority**: 🟡 Medium  
**Estimated time**: 2-3 days  
**Dependencies**: Phases 2, 3

### Goal
Complete the hearing workflow: log hearing → AI generates client update email → founder approves → email is sent (or staged for sending).

### Step 7.1 — Frontend: Full Hearing Log Form

**File to check/modify**: `frontend/src/app/dashboard/hearings/` (new/page.tsx)
```tsx
// Form fields:
// - Matter selector (dropdown with search)
// - Hearing date + time picker
// - Court room / bench number
// - Judge name
// - Bench composition (single/division bench)
// - Outcome (text)
// - Next steps (textarea)
// - Adjourned to (date picker)
// - Order summary (textarea)
// - "Upload Order Scan" (file upload — Path B)
// - "Generate Client Update Email" button (calls Skill 12)
```

### Step 7.2 — Skill 12: Client Update Email UI

After logging a hearing, the workflow continues:

**File to modify**: `frontend/src/app/dashboard/hearings/[id]/page.tsx`
```tsx
// Hearing detail page shows:
// - All hearing fields (read-only if logged)
// - "Client Update" section:
//   - "Draft Client Update with AI" button (if not drafted yet)
//     → Calls api.runAiSkill("skill_12_client_update", { hearing_details, client_name, advocate_name })
//     → Shows loading spinner
//     → When done, shows draft email (subject + body)
//   - If draft exists (review_status: "pending"):
//     → Shows draft email in editable rich text box
//     → "Approve & Send" button (founder/admin only)
//     → "Reject" button
//     → "Edit & Approve" (modify text then approve)
//   - If approved:
//     → Shows "Sent on [date]" banner
```

### Step 7.3 — Backend: Client Update Approval Side Effect

**File to modify**: `backend/src/api/hearings.py`
- `POST /hearings/{id}/client-update/approve` should:
  1. Set `hearings.client_update_approved = true`
  2. Set `hearings.client_update_sent_at = now()`
  3. Log to audit: `action: "client_update.sent"`
  4. (Future: trigger email via SendGrid/Resend)

### Step 7.4 — Hearing Reminders (Backend)

**File to create**: `backend/src/services/reminders.py`
```python
# Check hearings in the next 24 hours
# For each: create a notification record (or log to audit)
# Can be triggered by a cron endpoint: GET /api/v1/system/check-reminders
# Future: integrate with APScheduler or Celery
```

### Acceptance Criteria
- [ ] Can log a complete hearing with all fields
- [ ] "Generate Client Update Email" produces a professional draft in < 30 seconds
- [ ] Founder can edit, approve, or reject the draft
- [ ] Approved drafts show "Sent on [date]" status
- [ ] Audit log records: hearing.logged, client_update.drafted, client_update.approved

---

## Phase 8 — Invoice Management (Complete)
**Priority**: 🟡 Medium  
**Estimated time**: 2 days  
**Dependencies**: Phases 2, 3

### Goal
Full invoice lifecycle: create milestone → AI draft → approve → send → mark paid. With GST compliance.

### Step 8.1 — Frontend: Invoice Creation Form

**File to check/modify**: `frontend/src/app/dashboard/invoices/` (new/page.tsx)
```tsx
// Form:
// - Matter selector
// - Milestone name (e.g., "Retainer Fee", "Appearance Fee", "Success Bonus")
// - Description (textarea)
// - Amount (INR)
// - GST Rate (default 18%)
// - Auto-calculated: GST Amount, Total Amount
// - "Generate Invoice Draft" button → calls Skill 11
// - "Create Manually" button → skips AI, creates invoice with status: "draft"
```

### Step 8.2 — Backend: Invoice State Machine

**File to modify**: `backend/src/api/invoices.py`

Current endpoints: list, create with AI, approve, mark-sent
Add:
```python
# PATCH /api/v1/invoices/{id}/mark-paid
# body: { payment_reference: str, paid_at: str }
# Sets status: "paid", records payment_reference

# GET /api/v1/invoices/{id}/pdf
# Generates invoice PDF using WeasyPrint from draft_html
# Returns PDF file for download
```

### Step 8.3 — Invoice Status Flow

Ensure status transitions are enforced:
```
draft → pending_approval → approved → sent → paid
                        ↘ cancelled
```

Each transition should be logged to `audit_logs` with `before_state` and `after_state`.

### Step 8.4 — Revenue Dashboard

**File to modify**: `frontend/src/app/dashboard/page.tsx`
- Replace the static hardcoded revenue numbers with real data:
  ```tsx
  // Calls a new endpoint: GET /api/v1/invoices/summary
  // Returns: { billed_this_month, collected, outstanding, overdue }
  ```

**File to modify**: `backend/src/api/invoices.py`
- Add `GET /api/v1/invoices/summary` endpoint that aggregates invoice amounts by status

### Acceptance Criteria
- [ ] Can create an invoice for a specific matter milestone
- [ ] AI-generated invoice HTML renders in a preview pane
- [ ] Founder can approve/reject the AI draft
- [ ] Approved invoice can be marked as "Sent" with a date
- [ ] "Mark as Paid" records payment reference and date
- [ ] Revenue dashboard shows real aggregated data

---

## Phase 9 — Client Portal
**Priority**: 🟢 Medium  
**Estimated time**: 2 days  
**Dependencies**: Phase 2 (auth), Phase 3 (real DB)

### Goal
Build a read-only portal for clients to see their matter status, upcoming hearings, and invoices.

### Step 9.1 — Frontend: Client-Specific Dashboard

**File to modify**: `frontend/src/app/dashboard/page.tsx`
- When `user.role === "client"`, show a completely different layout:
  - "Your Matters" section (only their assigned matters)
  - "Upcoming Hearings" (for their matters only)
  - "Invoices" (their invoices with payment status)
  - No AI Queue, no Revenue Snapshot, no Audit Trail

### Step 9.2 — Frontend: Client Matters View

**File to modify**: `frontend/src/app/dashboard/matters/page.tsx`
- When role is "client", filter to only show `client_email === user.email` matters
- Remove Create/Edit buttons
- Show matter status in a friendly way (not raw enum values like "arguments_pending" → "Pending Arguments")

### Step 9.3 — Backend: Client-Safe Endpoints

**File to modify**: `backend/src/api/matters.py`
- Ensure `GET /matters` already filters by `client_email` when role is "client" (already done in current code — verify this works correctly)

**File to modify**: `backend/src/api/hearings.py`
- Ensure client can only see hearings for their matters

**File to modify**: `backend/src/api/invoices.py`
- Ensure client can only see their own invoices

### Acceptance Criteria
- [ ] Logging in as `client@legalos.dev` shows only Rajesh Kumar's matters
- [ ] Client cannot access Audit Trail, AI Queue, or other admin sections
- [ ] Client's upcoming hearings are shown clearly with court details
- [ ] Client's invoice status is clear (paid/outstanding)

---

## Phase 10 — Notifications & Reminders
**Priority**: 🟢 Nice-to-Have  
**Estimated time**: 2-3 days  
**Dependencies**: Phase 3

### Goal
Build a real notification system for hearing reminders, invoice due dates, and AI queue alerts.

### Step 10.1 — Backend: Notifications Table

**File to modify**: `backend/src/db/schema.sql`
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,  -- 'hearing_reminder', 'invoice_due', 'ai_review_ready', 'strategy_locked'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Step 10.2 — Backend: Notification API

**File to create**: `backend/src/api/notifications.py`
```python
# GET /api/v1/notifications — list unread notifications for current user
# POST /api/v1/notifications/{id}/read — mark as read
# POST /api/v1/notifications/read-all — mark all read
```

### Step 10.3 — Frontend: Notifications Dropdown

**File to modify**: `frontend/src/app/dashboard/layout.tsx`
- Replace the static bell icon with a real dropdown:
  - Shows count of unread notifications
  - Dropdown lists recent notifications with type icons
  - Clicking a notification navigates to the resource and marks as read

### Acceptance Criteria
- [ ] Hearing reminders appear 24 hours before each hearing
- [ ] AI queue notifications appear when a new draft is added
- [ ] Invoice due date reminders appear 7 days before due date
- [ ] Notifications disappear when read
- [ ] Bell icon badge shows accurate unread count

---

## Phase 11 — Production Deployment
**Priority**: 🔴 Required before pilot  
**Estimated time**: 2-3 days  
**Dependencies**: All previous phases

### Goal
Deploy LegalOS to a production-grade environment with proper security, monitoring, and CI/CD.

### Infrastructure Options

**Option A: Vercel + Railway (Cheapest, Fastest)**
```
Frontend: Vercel (free tier) → vercel.com
Backend: Railway (Python) → railway.app
Database: Supabase (free tier) → supabase.com
Storage: Supabase Storage
```

**Option B: Azure (DPDP Compliant, India region)**
```
Frontend: Azure Static Web Apps (India South)
Backend: Azure Container Apps (India South)
Database: Azure PostgreSQL Flexible Server (India South)
Storage: Azure Blob Storage (India South)
AI: Azure AI Services via Gemini API (zero-data-retention header required)
```

> ⚠️ **For production with real clients, Option B is required** per the DEEP_ANALYSIS.md mandate: "Azure India regions only — no exceptions in production."

### Step 11.1 — CI/CD Pipeline

**File to create**: `.github/workflows/deploy-backend.yml`
```yaml
# Triggers on push to main branch
# Steps:
# 1. Run pytest on backend
# 2. Build Docker image
# 3. Push to container registry
# 4. Deploy to Railway/Azure Container Apps
```

**File to create**: `.github/workflows/deploy-frontend.yml`
```yaml
# Triggers on push to main branch
# Steps:
# 1. npm run build
# 2. Deploy to Vercel/Azure Static Web Apps
```

### Step 11.2 — Docker Setup

**File to create**: `backend/Dockerfile`
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**File to create**: `docker-compose.yml` (for local testing)
```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:8000
```

### Step 11.3 — Security Hardening

Before production:
- [ ] Remove all `"your-secret-key"` defaults from `config.py` — require env vars in production
- [ ] Set `ENVIRONMENT=production` and disable docs: `docs_url=None, redoc_url=None`
- [ ] Add rate limiting middleware (slowapi or custom)
- [ ] Verify `TrustedHostMiddleware` is configured correctly
- [ ] Set `AI_MOCK_MODE=False` in production
- [ ] Add `Strict-Transport-Security` header
- [ ] Configure CORS to production domain only (remove localhost)

### Acceptance Criteria
- [ ] `git push origin main` triggers CI/CD and deploys automatically
- [ ] Production backend accessible at `https://api.legalos.app` (or equivalent)
- [ ] Frontend accessible at `https://app.legalos.app`
- [ ] HTTPS enforced on all endpoints
- [ ] AI_MOCK_MODE=False in production
- [ ] All secrets in environment variables (not in code)

---

## Appendix: Remaining AI Skills to Implement

These 8 skills have no prompts yet. Implement in order of business value:

### Skill 06 — Material Deviation Flagging
```python
SKILL_PROMPTS[SkillName.deviation_flagging] = """You are a legal document review specialist.
Compare the provided contract clause against the standard template.
Identify and list material deviations in JSON:
Fields: deviations (array of { clause_id, original_text, contract_text, deviation_type, severity, recommendation })
Severity: critical / high / medium / low

Standard Template:
{standard_clause}

Contract Clause:
{contract_clause}"""
```

### Skill 07 — Arguments Brief
```python
SKILL_PROMPTS[SkillName.arguments_brief] = """You are a senior advocate preparing for a court hearing.
Based on the strategy note, compile a structured arguments brief in JSON.
Fields: oral_arguments (array of {sequence, argument, authority, response_to_opposition}),
written_submissions_outline (array of {heading, sub_headings, key_points}),
key_documents_to_rely (array), opposing_arguments_anticipated (array of {arg, rebuttal}),
relief_prayer

Strategy Note:
{strategy_note}

Opposing Counsel's Known Position:
{opposing_position}"""
```

### Skill 08 — Legal Memo
```python
# Standard IRAC format: Issue, Rule, Application, Conclusion
# Field: memo_html (formatted for printing)
# Fields: issue, rule_of_law, application, conclusion, recommendations
```

### Skill 10 — Order Analysis  
```python
# Analyze court orders: what was directed, what changed, impact on timeline
# Fields: order_type, directions_given (array), impact_on_matter, next_deadline, requires_action (bool)
```

### Skill 13 — Matter Close Summary
```python
# End-of-matter summary: outcome, key learnings, billing summary, precedents established
# Used for firm knowledge base and client final communication
```

---

## Summary Table

| Phase | What | Priority | Est. Time | Depends On |
|-------|------|----------|-----------|------------|
| Fix Bugs | db_lock, duplicate imports | 🔴 Critical | 30 mins | Nothing |
| 2 | Real Auth (JWT) | 🔴 Critical | 2-3 days | Nothing |
| 3 | Supabase DB Wiring | 🔴 Critical | 1-2 days | Phase 2 |
| 4 | Matter Intake AI Flow | 🟠 High | 2-3 days | Phases 2+3 |
| 5 | Strategy Note Complete | 🟠 High | 2-3 days | Phases 2+3 |
| 6 | Document Upload + RAG | 🟡 Medium | 3-4 days | Phase 3 |
| 7 | Hearing Management | 🟡 Medium | 2-3 days | Phases 2+3 |
| 8 | Invoice Complete | 🟡 Medium | 2 days | Phases 2+3 |
| 9 | Client Portal | 🟡 Medium | 2 days | Phases 2+3 |
| 10 | Notifications | 🟢 Nice-to-have | 2-3 days | Phase 3 |
| 11 | Production Deploy | 🔴 Pre-pilot | 2-3 days | All above |
