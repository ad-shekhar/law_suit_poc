# LegalOS — Current State (POC)
> **Branch**: `feature/poc` | **Date**: June 6, 2026 | **Status**: POC — Checkpoint 1 Complete

---

## Quick Start (for an agent picking this up)

```bash
# 1. Clone & navigate
cd c:\Users\adity\Desktop\law_suit_poc

# 2. Backend
cd backend
.venv\Scripts\activate           # venv is pre-created
uvicorn main:app --reload --port 8000
# → http://localhost:8000/api/docs

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev
# → http://localhost:3000

# 4. Auth: Login via any of the demo accounts below
```

**Demo Accounts** (all passwords: `demo1234`):
| Email | Role | What you see |
|-------|------|-------------|
| `founder@legalos.dev` | Founder | All matters, full AI controls |
| `senior@legalos.dev` | Sr. Associate | Assigned matters, can review AI |
| `associate@legalos.dev` | Associate | Only their matters, can generate |
| `paralegal@legalos.dev` | Paralegal | Data entry, document uploads |
| `client@legalos.dev` | Client | Read-only portal for own matters |
| `admin@legalos.dev` | Admin | Full system access |

---

## Project Structure — File Map

```
law_suit_poc/
├── backend/
│   ├── main.py                          # FastAPI entrypoint — registers all routers
│   ├── requirements.txt                 # Python deps (FastAPI, Supabase, Gemini, LangChain…)
│   ├── pyrightconfig.json               # Pyright config — extraPaths: ["."] resolves src.* imports
│   ├── .env                             # Secrets (Supabase URL, Gemini key, etc.)
│   └── src/
│       ├── __init__.py                  # Makes src a package (required for relative imports)
│       ├── config.py                    # Settings via pydantic-settings from .env
│       ├── models.py                    # ALL Pydantic schemas (User, Matter, Hearing, Invoice, etc.)
│       ├── api/
│       │   ├── __init__.py
│       │   ├── matters.py               # CRUD for matters (GET/POST/PATCH /api/v1/matters)
│       │   ├── dashboard.py             # Dashboard summary, today's hearings, AI queue
│       │   ├── strategy.py              # Strategy notes CRUD + lock + AI generate
│       │   ├── hearings.py              # Hearing log CRUD + client update approve
│       │   ├── invoices.py              # Invoice create/approve + AI generate
│       │   ├── ai_skills.py             # Generic AI run + review queue
│       │   ├── audit.py                 # Audit log read + CSV export
│       │   └── users.py                 # User login + list users
│       ├── services/
│       │   └── ai_skills.py             # AISkillRunner: mock mode + Gemini integration
│       ├── db/
│       │   ├── memory_db.py             # In-memory seed data (firms, users, matters, hearings…)
│       │   ├── supabase.py              # Supabase client init (falls back to None if no keys)
│       │   └── schema.sql               # Full PostgreSQL schema + seed data for Supabase
│       └── workflows/                   # Empty — reserved for LangGraph workflow orchestration
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx               # Root layout (Google Fonts, QueryClientProvider)
│       │   ├── page.tsx                 # Landing page (public-facing)
│       │   ├── globals.css              # Full design system (CSS variables, components)
│       │   ├── providers.tsx            # React Query + TanStack provider
│       │   ├── auth/
│       │   │   └── login/page.tsx       # Login page (sessionStorage auth)
│       │   └── dashboard/
│       │       ├── layout.tsx           # Dashboard shell (sidebar + topbar + role-based nav)
│       │       ├── page.tsx             # Main dashboard (stats, hearings, AI queue)
│       │       ├── matters/             # Matter list + detail + new matter form
│       │       ├── hearings/            # Hearing log list + log hearing form
│       │       ├── ai-queue/            # AI review queue page
│       │       ├── invoices/            # Invoice list
│       │       ├── audit/               # Audit trail table
│       │       ├── documents/           # Document upload (placeholder)
│       │       ├── clients/             # Client list (placeholder)
│       │       ├── team/                # Team list (placeholder)
│       │       └── settings/            # Settings (placeholder)
│       └── lib/
│           ├── api.ts                   # All frontend API calls (typed, with X-User-Id header)
│           └── types.ts                 # TypeScript interfaces (User, Matter, Hearing, etc.)
│
├── .vscode/
│   └── settings.json                    # Python interpreter + TS paths config
├── README.md                            # Quick start + AI skills table + role permissions
├── DEEP_ANALYSIS.md                     # Business analysis, TAM, risk matrix, roadmap
└── design_concept_docs/                 # PRD + concept design PDFs
```

---

## Backend — What's Built

### 1. Configuration (`src/config.py`)
- Pydantic `Settings` class reads from `.env`
- Key settings: `supabase_url`, `supabase_anon_key`, `gemini_api_key`, `gemini_model`, `ai_mock_mode`, `default_firm_id`
- **`ai_mock_mode = True`** by default → all AI calls return pre-baked mock responses without hitting the Gemini API
- `allowed_origins` for CORS (localhost:3000, localhost:3001)

### 2. Database Layer (`src/db/`)

#### `supabase.py` — Supabase Client
- Tries to create a Supabase client using `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- If keys are missing/placeholder, sets `supabase_client = None`
- Every API route checks `db = get_db()` and falls through to `memory_db` if `db is None`
- **All API endpoints are dual-path** — Supabase first, memory fallback second

#### `memory_db.py` — In-Memory Seed Data
Contains live Python lists with seed records:
- `FIRMS` — 1 firm: "LegalOS Practice" (firm_id: `7be7a8ff-...`)
- `USERS` — 6 demo users (founder, sr.associate, associate, paralegal, client, admin)
- `MATTERS` — 2 sample matters:
  - `m1-rajesh-kumar`: Civil suit (Delhi HC) — Rajesh Kumar vs ABC Infrastructure
  - `m2-priya-estates`: IBC insolvency (NCLT) — Priya Estates vs Defaulter Corp
- `STRATEGY_NOTES` — 1 locked strategy note for matter m1
- `HEARINGS` — 2 upcoming hearings (seeded with `datetime.now() + timedelta(hours=...)`)
- `INVOICES` — 2 invoices (1 paid, 1 sent) for matter m1
- `AI_OUTPUTS` — 2 AI draft records (1 approved, 1 pending review)
- `AUDIT_LOGS` — 1 seed log entry
- `DOCUMENTS` — empty list
- `log_audit()` helper — appends to `AUDIT_LOGS` with threading lock

#### `schema.sql` — PostgreSQL Schema
Complete DDL for Supabase:
- 9 tables: `firms`, `users`, `matters`, `strategy_notes`, `hearings`, `documents`, `ai_outputs`, `invoices`, `audit_logs`
- Custom ENUM types: `user_role`, `matter_status`, `case_type`, `court_type`, `hearing_path_type`, `ai_review_status`, `invoice_status`, `skill_name`
- Indexes on all FK columns + hearing_date
- Seed INSERT statements for demo firm + 6 demo users

### 3. API Routes (`src/api/`)

All routes are under prefix `/api/v1`. Auth is **header-based**: `X-User-Id` passed by frontend.

| File | Routes | Key Endpoints |
|------|--------|---------------|
| `matters.py` | `/matters` | `GET` (filtered list), `POST` (create), `PATCH /{id}` (update status) |
| `dashboard.py` | `/dashboard/*` | `GET /summary` (role-aware stats), `GET /hearings/today`, `GET /ai-queue` |
| `strategy.py` | `/matters/{id}/strategy` | `GET`, `POST /generate` (AI), `POST /lock`, `PUT` (save draft) |
| `hearings.py` | `/matters/{id}/hearings`, `/hearings` | `GET`, `POST` (log), `GET /{id}`, `POST /{id}/client-update/approve` |
| `invoices.py` | `/matters/{id}/invoices`, `/invoices` | `GET`, `POST /generate` (AI), `POST /{id}/approve`, `POST /{id}/mark-sent` |
| `ai_skills.py` | `/ai-skills` | `GET /queue`, `POST /run`, `POST /{id}/review` |
| `audit.py` | `/audit` | `GET` (filtered), `GET /export` (CSV) |
| `users.py` | `/users` | `GET /login`, `GET` (list) |

**Pattern used in all routes:**
```python
db = get_db()
if db:
    try:
        res = db.table("...").select("*").execute()
        # ... use res.data
    except Exception as e:
        logger.error(f'...')
        # fall through
# Fallback: memory_db
```

### 4. AI Skills Engine (`src/services/ai_skills.py`)

**13 Skills defined** via `SkillName` enum (maps to `skill_name` Postgres ENUM):
| Skill | Enum Key | Prompt Status |
|-------|----------|---------------|
| Matter Intake Extraction | `matter_intake_extraction` | ✅ Full prompt |
| Preliminary Research | `preliminary_research` | ✅ Full prompt |
| Strategy Note | `strategy_note` | ✅ Full prompt |
| Engagement Letter | `engagement_letter` | ✅ HTML template |
| Document Query | `document_query` | ❌ No prompt yet |
| Deviation Flagging | `deviation_flagging` | ❌ No prompt yet |
| Arguments Brief | `arguments_brief` | ❌ No prompt yet |
| Legal Memo | `legal_memo` | ❌ No prompt yet |
| Hearing Summary | `hearing_summary` | ✅ Full prompt |
| Order Analysis | `order_analysis` | ❌ No prompt yet |
| Invoice Generation | `invoice_generation` | ✅ Full prompt |
| Client Update Email | `client_update_email` | ✅ Full prompt |
| Matter Close Summary | `matter_close_summary` | ❌ No prompt yet |

**`AISkillRunner` class:**
- `mock_mode = settings.ai_mock_mode` — when True, returns `MOCK_RESPONSES[skill_name]` with 1.5s simulated delay
- When False: calls Gemini API via `genai.GenerativeModel(settings.gemini_model)` with `response_mime_type="application/json"`, temperature=0.3
- All outputs return `review_status: "pending"`, `human_verified: False` — nothing is auto-dispatched
- Global singleton: `skill_runner = AISkillRunner()`

---

## Frontend — What's Built

### Design System (`app/globals.css`)
- Dark-mode first design
- CSS custom properties: `--bg-primary`, `--bg-card`, `--accent-indigo`, `--accent-gold`, `--accent-emerald`, `--accent-red`
- Pre-built component classes: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.badge`, `.badge-pending`, `.badge-approved`, `.badge-ai`, `.stat-card`, `.sidebar`, `.sidebar-nav-item`, `.timeline`, `.timeline-item`
- Google Fonts: Inter (UI), IBM Plex Mono (monospace values)
- Framer Motion animations used throughout

### Authentication (`app/auth/login/page.tsx`)
- Simple email/password form
- Calls `POST /api/v1/users/login`
- On success, stores user object in `sessionStorage` as `"legalos_user"`
- **No Supabase Auth yet** — backend does a plain email lookup in memory_db

### Dashboard Layout (`app/dashboard/layout.tsx`)
- Sidebar with role-aware nav items (filtered by `user.role`)
- Navigation items: Dashboard, Matters, Hearings, Documents, AI Review Queue, Invoices, Clients, Audit Trail, Team, Settings
- Role color coding: admin=red, founder=gold, sr.associate=indigo, associate=cyan, paralegal=emerald, client=gray
- Reads user from `sessionStorage` on every render — redirects to `/auth/login` if not found
- Topbar: breadcrumbs, search bar (not functional yet), notifications badge (static count: 3)

### Dashboard Home (`app/dashboard/page.tsx`)
- Role-aware greeting + stats using React Query
- Stats fetched from `GET /api/v1/dashboard/summary` (Founder sees: Active Matters, Hearings, AI Queue, Outstanding ₹; Associates see: My Matters, Hearings, Drafts Pending, Tasks Due)
- Today's Hearings panel: fetched from `GET /api/v1/dashboard/hearings/today`
- AI Review Queue panel: visible to founder/senior only, fetched from `GET /api/v1/dashboard/ai-queue`
- Revenue Snapshot (founder only): static placeholder values
- Recent Activity: timeline from audit logs
- Quick Actions panel: role-filtered buttons for common workflows

### Matters (`app/dashboard/matters/`)
- Matter list with filters (status, case type, search)
- New matter form (`/matters/new`)
- Matter detail page

### Hearings (`app/dashboard/hearings/`)
- Hearing list
- Log hearing form (manual Path C entry)

### AI Queue (`app/dashboard/ai-queue/`)
- Pending AI drafts with Approve/Reject/Modify actions

### Audit Trail (`app/dashboard/audit/`)
- Audit log table with export CSV button

### API Client (`lib/api.ts`)
- Typed `apiRequest<T>` function
- Automatically injects `X-User-Id` header from `sessionStorage`
- All named methods on `api` object: `api.login()`, `api.getMatters()`, `api.createMatter()`, `api.getStrategy()`, `api.generateStrategy()`, `api.lockStrategy()`, `api.logHearing()`, `api.runAiSkill()`, `api.reviewAiOutput()`, `api.getAuditLogs()`, etc.
- `BACKEND_URL` from `process.env.NEXT_PUBLIC_BACKEND_URL` (defaults to `http://localhost:8000`)

---

## Environment Variables

**Backend `.env`** (at `backend/.env`):
```env
ENVIRONMENT=development
SECRET_KEY=your-secret-key
DEFAULT_FIRM_ID=7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab
DEFAULT_PASSWORD=demo1234

# Supabase (leave blank to use memory_db fallback)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini (leave blank to use mock mode)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# AI Settings
AI_MOCK_MODE=True   # Set to False to enable real Gemini calls
```

**Frontend** (at `frontend/.env.local` — create if missing):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Known Gaps & Current Limitations

| Area | Gap | Impact |
|------|-----|--------|
| Auth | No Supabase Auth — sessionStorage only | No real user sessions; refresh loses user |
| Auth | No JWT tokens | Backend has no auth middleware — X-User-Id is trusted blindly |
| Documents | Upload pipeline not built | `/dashboard/documents` is placeholder UI only |
| Clients | No client portal | `/dashboard/clients` is placeholder |
| Team | No team management | `/dashboard/team` is placeholder |
| Settings | No settings logic | `/dashboard/settings` is placeholder |
| Search | Global search bar is static | `⌘K` search is a UI placeholder only |
| Notifications | Bell icon shows static "3" | No real notification system |
| Revenue Snapshot | Static hardcoded values | Not pulling from real invoice data |
| Tasks Due | Shows static "6 / 3 overdue" | No task management module |
| Path A/B (Hearings) | Only Path C (manual) is built | No eCourts/CaseMine integration |
| RAG / Documents | No vector embeddings | Skills 05, 06, 07, 08, 10 have no prompts |
| Supabase Import Style | `matters.py`, `hearings.py`, etc. still use `from src.db.supabase import get_db` (absolute) instead of `from ..db.supabase` (relative) | Pyright warnings (warnings only, not errors — runtime works fine) |
| `models.py` | `from datetime import datetime, timezone, timezone` — duplicate `timezone` import | Python warning, non-breaking |
| DB lock variable | `memory_db.py` references `db_lock` which is never defined | Will cause `NameError` at runtime when `log_audit` is called under concurrent load |

---

## What Checkpoint 1 Delivered

Per the README Build Checkpoints:

- [x] **Checkpoint 1: Foundation + Design System**
  - [x] Full PostgreSQL schema (`schema.sql`) with all 9 tables
  - [x] In-memory mock database (`memory_db.py`) with realistic seed data
  - [x] FastAPI backend with 8 routers, all dual-path (Supabase + memory fallback)
  - [x] AI Skills engine with mock/Gemini toggle — 13 skills, 7 with full prompts
  - [x] Next.js 14 frontend with full design system
  - [x] Role-differentiated dashboard (6 roles)
  - [x] Dashboard, Matters, Hearings, AI Queue, Audit Trail pages wired to real API
  - [x] Audit logging on all create/update actions
  - [x] Pyright config fixed (type errors resolved in `ai_skills.py`, `models.py`)

- [ ] **Checkpoint 2: Database + Matter Intake** — Not started
- [ ] **Checkpoint 3: Dual-Role Dashboard** — Partially done (role logic exists, client portal not built)
- [ ] **Checkpoint 4: AI Skills Pipeline + Strategy Note** — Partial (mock works, Gemini not wired to frontend trigger)
- [ ] **Checkpoint 5: Hearing Management + Invoices** — Basic hearing log done, full workflow incomplete
- [ ] **Checkpoint 6: Audit Trail + Landing Page** — Audit table done, landing page stub exists
