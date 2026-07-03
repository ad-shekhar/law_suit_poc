export interface User {
  id: string;
  firm_id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  is_active: boolean;
}

export interface Matter {
  id: string;
  firm_id: string;
  matter_number: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  case_type: string;
  court: string;
  court_name?: string | null;
  case_number?: string | null;
  filing_number?: string | null;
  status: string;
  assigned_founder_id?: string | null;
  assigned_associate_id?: string | null;
  opposing_counsel?: string | null;
  opposing_party?: string | null;
  relief_sought?: string | null;
  brief_facts?: string | null;
  tags?: string[];
  is_confidential: boolean;
  next_hearing_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hearing {
  id: string;
  matter_id: string;
  hearing_date: string;
  court_room?: string | null;
  judge_name?: string | null;
  bench_composition?: string | null;
  path_type?: string | null;
  order_summary?: string | null;
  outcome?: string | null;
  next_steps?: string | null;
  adjourned_to?: string | null;
  raw_order_url?: string | null;
  order_text?: string | null;
  client_update_draft?: string | null;
  client_update_approved: boolean;
  client_update_sent_at?: string | null;
  created_by?: string | null;
  created_at: string;
  matter?: Matter;
}

export interface Invoice {
  id: string;
  matter_id: string;
  invoice_number: string;
  milestone_name: string;
  description?: string | null;
  amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  status: string;
  draft_html?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  sent_at?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  payment_reference?: string | null;
  created_at: string;
  matter?: Matter;
}

export interface AiOutput {
  id: string;
  matter_id: string;
  skill_name: string;
  prompt_used: string;
  raw_output: string;
  review_status: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  final_output?: string | null;
  review_notes?: string | null;
  model_used: string;
  tokens_used: number;
  latency_ms: number;
  created_at: string;
  matter?: Matter; // Attached by backend conditionally
}

export interface DashboardSummary {
  role: string;
  stats: {
    label: string;
    value: string;
    change?: string;
    up?: boolean;
    color?: string;
  }[];
  recent_activity: {
    action: string;
    resource_type: string;
    user_name?: string;
    created_at?: string;
  }[];
}
