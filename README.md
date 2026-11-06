# LegalOS — AI Practice Operating System

> **"Human Generated, AI Assisted"** — India's first compliance-first legal practice OS

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-4285F4)](https://ai.google.dev/)

---

## 🏛️ What is LegalOS?

LegalOS is an AI-native practice operating system built for Indian law firms. Every AI output is flagged for human review before it reaches a client — no autonomous AI actions, ever.

**Roles**: `admin` | `founder` | `senior_associate` | `associate` | `paralegal` | `client`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- [Supabase account](https://supabase.com) (free)
- [Google AI Studio API key](https://aistudio.google.com) (free)

### 1. Clone & Setup

```bash
git clone https://github.com/ad-shekhar/law_suit_poc.git
cd law_suit_poc
```

### 2. Environment Variables

```bash
# Copy example env
cp .env.example .env
# Fill in your Supabase + Gemini keys
# Important: Set AI_MOCK_MODE=False to use the real Gemini API.
# Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set for the backend,
# alongside their NEXT_PUBLIC_ variants for the frontend.
# Copy your configured .env file into the backend/ and frontend/ folders.
```

### 3. Database Setup

```bash
# 1. Open backend/src/db/schema.sql
# 2. Copy the entire file content
# 3. Paste into your Supabase project's SQL Editor
# 4. Click "Run" (Select "Run without RLS" for this POC)
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 5. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/api/docs
```

---

## 📂 Project Structure

```
law_suit_poc/
├── frontend/                # Next.js 14 App Router
│   └── src/
│       ├── app/             # Pages (App Router)
│       │   ├── (auth)/      # Login, signup
│       │   ├── (dashboard)/ # Protected app
│       │   └── (public)/    # Landing page
│       ├── components/      # Reusable UI components
│       ├── lib/             # Supabase client, utils
│       ├── stores/          # Zustand state stores
│       └── types/           # TypeScript types
│
├── backend/                 # FastAPI Python
│   ├── main.py              # Entry point
│   └── src/
│       ├── api/             # Route handlers
│       ├── services/        # AI skills, business logic
│       ├── db/              # Database queries
│       └── models.py        # Pydantic schemas
│
├── infra/                   # Infrastructure
│   ├── terraform/           # Azure Terraform (production)
│   └── scripts/             # DB migrations, seeds
│
└── design_concept_docs/     # PRD + Concept Design PDFs
```

---

## 🎯 AI Skills (13 total)

| # | Skill | Description |
|---|-------|-------------|
| 01 | Matter Intake | Extract structured data from emails |
| 02 | Preliminary Research | Case law + statute research brief |
| 03 | Strategy Note | Discussion → structured strategy |
| 04 | Engagement Letter | Professional retainer letter |
| 05 | Document Query | RAG query over matter documents |
| 06 | Deviation Flagging | Flag clauses deviating from standard |
| 07 | Arguments Brief | Arguments bundle preparation |
| 08 | Legal Memo | Research memorandum |
| 09 | Hearing Summary | Summarize proceedings |
| 10 | Order Analysis | Analyze court orders |
| 11 | Invoice Generation | GST-compliant invoice draft |
| 12 | Client Update Email | Post-hearing client communication |
| 13 | Matter Close Summary | End-of-matter summary |

> ⚠️ All AI outputs are `status: pending` until a human reviews and approves them.

---

## 🔐 Role Permissions

| Feature | Admin | Founder | Sr. Associate | Associate | Paralegal | Client |
|---------|-------|---------|---------------|-----------|-----------|--------|
| All matters | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assigned matters | ✅ | ✅ | ✅ | ✅ | ✅ | Own only |
| Lock strategy note | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve AI outputs | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Generate AI drafts | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload documents | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View invoices | ✅ | ✅ | ✅ | ❌ | ❌ | Own only |
| Approve invoices | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit log access | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| User management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 📊 Build Checkpoints

- [x] Checkpoint 1: Foundation + Design System
- [ ] Checkpoint 2: Database + Matter Intake
- [ ] Checkpoint 3: Dual-Role Dashboard
- [ ] Checkpoint 4: AI Skills Pipeline + Strategy Note
- [ ] Checkpoint 5: Hearing Management + Invoices
- [ ] Checkpoint 6: Audit Trail + Landing Page

---

## 📜 License

Private — LegalOS © 2026
