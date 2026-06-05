-- LegalOS Database Schema — PostgreSQL / Supabase
-- India's first AI-native legal practice operating system.
-- Human Generated, AI Assisted.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
    'admin',
    'founder',
    'senior_associate',
    'associate',
    'paralegal',
    'client'
);

CREATE TYPE matter_status AS ENUM (
    'intake',
    'active',
    'pending_docs',
    'hearing_scheduled',
    'arguments_pending',
    'reserved_for_orders',
    'order_received',
    'closed_won',
    'closed_lost',
    'closed_settled',
    'archived'
);

CREATE TYPE case_type AS ENUM (
    'civil_suit',
    'criminal',
    'arbitration',
    'ibc_insolvency',
    'constitutional',
    'company_law',
    'tax',
    'real_estate',
    'intellectual_property',
    'employment',
    'family',
    'advisory',
    'other'
);

CREATE TYPE court_type AS ENUM (
    'supreme_court',
    'high_court',
    'district_court',
    'nclt',
    'nclat',
    'ncdrc',
    'arbitral_tribunal',
    'itat',
    'drat',
    'other'
);

CREATE TYPE hearing_path_type AS ENUM (
    'A',
    'B',
    'C'
);

CREATE TYPE ai_review_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'modified'
);

CREATE TYPE invoice_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'sent',
    'paid',
    'overdue',
    'cancelled'
);

CREATE TYPE skill_name AS ENUM (
    'skill_01_matter_intake',
    'skill_02_preliminary_research',
    'skill_03_strategy_note',
    'skill_04_engagement_letter',
    'skill_05_document_query',
    'skill_06_deviation_flagging',
    'skill_07_arguments_brief',
    'skill_08_legal_memo',
    'skill_09_hearing_summary',
    'skill_10_order_analysis',
    'skill_11_invoice_generation',
    'skill_12_client_update',
    'skill_13_matter_close'
);

-- ─── TABLES ──────────────────────────────────────────────────────────────────

-- 1. Firms Table
CREATE TABLE firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'poc',
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'associate',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Matters Table
CREATE TABLE matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    matter_number VARCHAR(100) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    case_type case_type NOT NULL,
    court court_type NOT NULL,
    court_name VARCHAR(255) NOT NULL,
    case_number VARCHAR(100),
    filing_number VARCHAR(100),
    status matter_status DEFAULT 'intake',
    assigned_founder_id UUID NOT NULL REFERENCES users(id),
    assigned_associate_id UUID REFERENCES users(id),
    opposing_counsel VARCHAR(255),
    opposing_party VARCHAR(255),
    relief_sought TEXT,
    brief_facts TEXT,
    tags TEXT[] DEFAULT '{}'::text[],
    is_confidential BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Strategy Notes Table
CREATE TABLE strategy_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    version INT DEFAULT 1,
    discussion_transcript TEXT,
    legal_position TEXT,
    key_arguments TEXT[] DEFAULT '{}'::text[],
    risks JSONB DEFAULT '[]'::jsonb, -- Array of {risk: string, severity: string, mitigation: string}
    recommended_strategy TEXT,
    next_actions TEXT[] DEFAULT '{}'::text[],
    case_timeline TEXT,
    precedents TEXT[] DEFAULT '{}'::text[],
    fee_estimate TEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by UUID REFERENCES users(id),
    locked_at TIMESTAMP WITH TIME ZONE,
    pdf_url TEXT,
    ai_output_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Hearings Table
CREATE TABLE hearings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    hearing_date TIMESTAMP WITH TIME ZONE NOT NULL,
    court_room VARCHAR(100),
    judge_name VARCHAR(255),
    bench_composition VARCHAR(255),
    path_type hearing_path_type DEFAULT 'C',
    order_summary TEXT,
    outcome TEXT,
    next_steps TEXT,
    adjourned_to TIMESTAMP WITH TIME ZONE,
    raw_order_url TEXT,
    order_text TEXT,
    client_update_draft TEXT,
    client_update_approved BOOLEAN DEFAULT FALSE,
    client_update_sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'petition', 'order', 'contract', etc.
    display_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    embedding_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'done', 'failed'
    chunk_count INT DEFAULT 0,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AI Outputs Table (Pending review drafts)
CREATE TABLE ai_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    skill_name skill_name NOT NULL,
    prompt_used TEXT,
    raw_output TEXT NOT NULL,
    review_status ai_review_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    final_output TEXT,
    review_notes TEXT,
    model_used VARCHAR(100) DEFAULT 'gemini-1.5-flash',
    tokens_used INT DEFAULT 0,
    latency_ms INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) DEFAULT 18.00,
    gst_amount DECIMAL(15, 2) DEFAULT 0.00,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    status invoice_status DEFAULT 'draft',
    draft_html TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_reference VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_role user_role NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    before_state JSONB DEFAULT '{}'::jsonb,
    after_state JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── INDEXES FOR PERFORMANCE ────────────────────────────────────────────────

CREATE INDEX idx_users_firm ON users(firm_id);
CREATE INDEX idx_matters_firm ON matters(firm_id);
CREATE INDEX idx_matters_founder ON matters(assigned_founder_id);
CREATE INDEX idx_matters_associate ON matters(assigned_associate_id);
CREATE INDEX idx_strategy_notes_matter ON strategy_notes(matter_id);
CREATE INDEX idx_hearings_matter ON hearings(matter_id);
CREATE INDEX idx_hearings_date ON hearings(hearing_date);
CREATE INDEX idx_documents_matter ON documents(matter_id);
CREATE INDEX idx_ai_outputs_matter ON ai_outputs(matter_id);
CREATE INDEX idx_invoices_matter ON invoices(matter_id);
CREATE INDEX idx_audit_logs_firm ON audit_logs(firm_id);
CREATE INDEX idx_audit_logs_matter ON audit_logs(matter_id);

-- ─── SEED DATA FOR DEMO ACCOUNTS ─────────────────────────────────────────────

-- 1. Create LegalOS Firm
INSERT INTO firms (id, name, slug, subscription_tier, settings)
VALUES ('7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab', 'LegalOS Practice', 'legalos-practice', 'poc', '{}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create Demo Users
-- Founder: Arjun Sharma
INSERT INTO users (id, firm_id, email, full_name, role, is_active)
VALUES ('a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5', '7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab', 'founder@legalos.dev', 'Arjun Sharma', 'founder', true)
ON CONFLICT (email) DO NOTHING;

-- Senior Associate: Priya Menon
INSERT INTO users (id, firm_id, email, full_name, role, is_active)
VALUES ('b2d6e07b-15ce-55af-9d49-90d1b7c8e6b6', '7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab', 'senior@legalos.dev', 'Priya Menon', 'senior_associate', true)
ON CONFLICT (email) DO NOTHING;

-- Associate: Riya Singh
INSERT INTO users (id, firm_id, email, full_name, role, is_active)
VALUES ('c3e7f18c-26df-66b0-ae5a-01e2c8d9f7c7', '7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab', 'associate@legalos.dev', 'Riya Singh', 'associate', true)
ON CONFLICT (email) DO NOTHING;

-- Paralegal: Vinay Gupta
INSERT INTO users (id, firm_id, email, full_name, role, is_active)
VALUES ('d4f8g29d-37eg-77c1-bf6b-12f3d9e0f8d8', '7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab', 'paralegal@legalos.dev', 'Vinay Gupta', 'paralegal', true)
ON CONFLICT (email) DO NOTHING;

-- Client: Rajesh Kumar
INSERT INTO users (id, firm_id, email, full_name, role, is_active)
VALUES ('e5g9h0ae-48fh-88d2-c07c-23f4eaf1f9e9', '7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab', 'client@legalos.dev', 'Rajesh Kumar', 'client', true)
ON CONFLICT (email) DO NOTHING;

-- Admin: Admin User
INSERT INTO users (id, firm_id, email, full_name, role, is_active)
VALUES ('f6h0i1bf-59gi-99e3-d18d-34g5fbg2faea', '7be7a8ff-5cb6-4927-b8d9-2eb4c9bc08ab', 'admin@legalos.dev', 'Admin User', 'admin', true)
ON CONFLICT (email) DO NOTHING;
