"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Scale, Briefcase, User,
  MapPin, FileText, Hash, CheckCircle, Sparkles, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

const STEPS = [
  { id: 1, label: "Client Info", desc: "Basic client details" },
  { id: 2, label: "Case Details", desc: "Court & case specifics" },
  { id: 3, label: "AI Assist", desc: "Pre-populate from email" },
  { id: 4, label: "Review", desc: "Confirm & create" },
];

const CASE_TYPES = [
  "civil_suit", "criminal", "arbitration", "ibc_insolvency",
  "constitutional", "company_law", "tax", "real_estate",
  "intellectual_property", "employment", "family", "advisory"
];

const COURTS = [
  "supreme_court", "high_court", "district_court", "nclt",
  "nclat", "ncdrc", "arbitral_tribunal", "itat", "drat"
];

const COURT_LABELS: Record<string, string> = {
  supreme_court: "Supreme Court of India",
  high_court: "High Court",
  district_court: "District Court",
  nclt: "NCLT",
  nclat: "NCLAT",
  ncdrc: "NCDRC",
  arbitral_tribunal: "Arbitral Tribunal",
  itat: "ITAT",
  drat: "DRAT",
};

export default function NewMatterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [emailText, setEmailText] = useState("");

  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "", clientOrg: "",
    caseType: "", court: "", courtName: "", caseNumber: "", opposingParty: "",
    opposingCounsel: "", reliefSought: "", briefFacts: "", tags: "",
    assignedAssociate: "Priya Menon",
  });

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const runAIExtraction = async () => {
    if (!emailText.trim()) return toast.error("Paste email text first");
    setAiLoading(true);
    // Simulate AI extraction
    await new Promise(r => setTimeout(r, 2000));
    setForm(f => ({
      ...f,
      clientName: "Rajesh Kumar Enterprises Pvt. Ltd.",
      clientEmail: "rajesh@rkenterprises.com",
      clientPhone: "+91-9876543210",
      caseType: "arbitration",
      court: "high_court",
      courtName: "Delhi High Court",
      opposingParty: "ABC Infrastructure Ltd.",
      reliefSought: "Recovery of ₹2.5 Crore with interest under Section 37 of the Arbitration Act",
      briefFacts: "Client entered a construction contract dated March 15, 2022. Opposing party defaulted on payments totaling ₹2.5 Cr despite multiple reminders. Arbitration clause exists (Clause 23).",
      tags: "arbitration, recovery, construction",
    }));
    setAiLoading(false);
    setAiDone(true);
    toast.success("AI extracted matter details from email");
  };

  const handleCreate = async () => {
    await new Promise(r => setTimeout(r, 800));
    toast.success("Matter LOS-2024-007 created successfully!");
    router.push("/dashboard/matters");
  };

  const canNext = () => {
    if (step === 1) return form.clientName && form.clientEmail;
    if (step === 2) return form.caseType && form.court && form.courtName;
    return true;
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button
          onClick={() => router.back()}
          className="btn-ghost"
          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, padding: "6px 0" }}
        >
          <ArrowLeft size={15} /> Back to Matters
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Create New Matter</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
          Fill in the details or let AI extract from an email
        </p>
      </div>

      {/* Step Progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                cursor: s.id < step ? "pointer" : "default"
              }}
              onClick={() => { if (s.id < step) setStep(s.id); }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: step > s.id ? "var(--accent-emerald)" : step === s.id ? "var(--accent-indigo)" : "var(--bg-elevated)",
                border: `2px solid ${step >= s.id ? "transparent" : "var(--border)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s", flexShrink: 0
              }}>
                {step > s.id
                  ? <CheckCircle size={16} color="white" />
                  : <span style={{ fontSize: 13, fontWeight: 700, color: step === s.id ? "white" : "var(--text-muted)" }}>{s.id}</span>
                }
              </div>
              <div style={{ marginTop: 6, textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: step >= s.id ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {s.label}
                </div>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 12px", marginBottom: 28,
                background: step > s.id ? "var(--accent-emerald)" : "var(--border)",
                transition: "background 0.4s"
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="card"
          style={{ padding: 32 }}
        >
          {/* Step 1: Client Info */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                <User size={18} color="var(--accent-indigo)" /> Client Information
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Client / Organization Name *</label>
                  <input id="client-name" className="form-input" placeholder="e.g. Rajesh Kumar Enterprises Pvt. Ltd."
                    value={form.clientName} onChange={e => update("clientName", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input id="client-email" type="email" className="form-input" placeholder="client@example.com"
                    value={form.clientEmail} onChange={e => update("clientEmail", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input id="client-phone" className="form-input" placeholder="+91-98765 43210"
                    value={form.clientPhone} onChange={e => update("clientPhone", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Associate</label>
                  <select id="assigned-associate" className="form-select"
                    value={form.assignedAssociate} onChange={e => update("assignedAssociate", e.target.value)}>
                    <option>Priya Menon</option>
                    <option>Riya Singh</option>
                    <option>Vinay Gupta</option>
                    <option>Unassigned</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags</label>
                  <input id="matter-tags" className="form-input" placeholder="e.g. arbitration, recovery"
                    value={form.tags} onChange={e => update("tags", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Case Details */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                <Scale size={18} color="var(--accent-indigo)" /> Case Details
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Case Type *</label>
                  <select id="case-type" className="form-select"
                    value={form.caseType} onChange={e => update("caseType", e.target.value)}>
                    <option value="">Select case type</option>
                    {CASE_TYPES.map(ct => (
                      <option key={ct} value={ct}>{ct.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Court / Tribunal *</label>
                  <select id="court-type" className="form-select"
                    value={form.court} onChange={e => update("court", e.target.value)}>
                    <option value="">Select court</option>
                    {COURTS.map(c => <option key={c} value={c}>{COURT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Court Name (full) *</label>
                  <input id="court-name" className="form-input" placeholder="e.g. Delhi High Court — Division Bench"
                    value={form.courtName} onChange={e => update("courtName", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Case / Filing Number</label>
                  <input id="case-number" className="form-input" placeholder="e.g. OMP-2024-001"
                    value={form.caseNumber} onChange={e => update("caseNumber", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Opposing Party</label>
                  <input id="opposing-party" className="form-input" placeholder="Respondent / Defendant name"
                    value={form.opposingParty} onChange={e => update("opposingParty", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Opposing Counsel</label>
                  <input id="opposing-counsel" className="form-input" placeholder="Opposing advocate name"
                    value={form.opposingCounsel} onChange={e => update("opposingCounsel", e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Relief Sought</label>
                  <textarea id="relief-sought" className="form-textarea" placeholder="What does the client want?"
                    value={form.reliefSought} onChange={e => update("reliefSought", e.target.value)} rows={3} />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Brief Facts</label>
                  <textarea id="brief-facts" className="form-textarea" placeholder="Summary of the matter..."
                    value={form.briefFacts} onChange={e => update("briefFacts", e.target.value)} rows={4} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: AI Assist */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={18} color="var(--accent-indigo)" /> AI Matter Extraction
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
                Paste the client&apos;s email or any text — AI will extract structured matter details for your review.
              </p>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Paste Email / Brief Text</label>
                <textarea
                  id="ai-email-input"
                  className="form-textarea"
                  placeholder="Paste the client email here and AI will extract: client name, case type, court, relief sought, brief facts..."
                  value={emailText}
                  onChange={e => setEmailText(e.target.value)}
                  rows={8}
                />
              </div>

              {!aiDone ? (
                <button
                  id="ai-extract-btn"
                  className="btn-primary"
                  onClick={runAIExtraction}
                  disabled={aiLoading}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {aiLoading ? (
                    <>
                      <span className="ai-thinking-dots">
                        <span className="ai-thinking-dot" style={{ width: 6, height: 6, background: "white" }} />
                        <span className="ai-thinking-dot" style={{ width: 6, height: 6, background: "white" }} />
                        <span className="ai-thinking-dot" style={{ width: 6, height: 6, background: "white" }} />
                      </span>
                      Extracting with AI...
                    </>
                  ) : (
                    <><Sparkles size={15} /> Extract with AI</>
                  )}
                </button>
              ) : (
                <div className="ai-output-box" style={{ padding: "20px 20px 20px", marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, marginBottom: 16 }}>
                    <CheckCircle size={16} color="var(--accent-emerald)" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-emerald)" }}>
                      AI extraction complete — fields pre-populated
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      ["Client", form.clientName], ["Case Type", form.caseType],
                      ["Court", form.courtName], ["Opposing Party", form.opposingParty],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
                        <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{v || "—"}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: "10px", background: "rgba(217,119,6,0.08)", borderRadius: 8, border: "1px solid rgba(217,119,6,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#D97706" }}>
                      <AlertTriangle size={12} /> AI output — please review all extracted fields in Step 4 before creating
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 13, color: "var(--text-muted)" }}
                  onClick={() => setStep(4)}
                >
                  Skip AI extraction →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={18} color="var(--accent-emerald)" /> Review & Create Matter
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Client Name", value: form.clientName },
                  { label: "Email", value: form.clientEmail },
                  { label: "Phone", value: form.clientPhone || "—" },
                  { label: "Case Type", value: form.caseType.replace(/_/g, " ") || "—" },
                  { label: "Court", value: form.courtName || "—" },
                  { label: "Case Number", value: form.caseNumber || "TBD" },
                  { label: "Opposing Party", value: form.opposingParty || "—" },
                  { label: "Associate", value: form.assignedAssociate },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
                {form.reliefSought && (
                  <div style={{ gridColumn: "1/-1", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Relief Sought</div>
                    <div style={{ fontSize: 14 }}>{form.reliefSought}</div>
                  </div>
                )}
              </div>
              <div style={{ padding: "14px 16px", background: "rgba(79,70,229,0.08)", borderRadius: 10, border: "1px solid rgba(79,70,229,0.2)", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "var(--accent-indigo-light)" }}>
                  ✦ A matter number will be auto-assigned (LOS-2024-XXX). The strategy note workflow begins after creation.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button
          className="btn-secondary"
          onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={14} /> {step === 1 ? "Cancel" : "Back"}
        </button>

        {step < 4 ? (
          <motion.button
            className="btn-primary"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            style={{ display: "flex", alignItems: "center", gap: 6, opacity: canNext() ? 1 : 0.5 }}
            whileHover={canNext() ? { scale: 1.02 } : {}}
          >
            Next <ArrowRight size={14} />
          </motion.button>
        ) : (
          <motion.button
            id="create-matter-submit"
            className="btn-primary"
            onClick={handleCreate}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #10B981, #059669)" }}
            whileHover={{ scale: 1.02 }}
          >
            <CheckCircle size={15} /> Create Matter
          </motion.button>
        )}
      </div>
    </div>
  );
}
