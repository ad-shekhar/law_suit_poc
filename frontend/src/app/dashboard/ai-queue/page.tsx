"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, X, Edit3, Clock, Zap, Shield, AlertTriangle, ChevronRight, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const QUEUE = [
  {
    id: "1", skill: "Strategy Note", matter_id: "1",
    matter: "Rajesh Kumar Enterprises v. ABC Infra",
    matter_number: "LOS-2024-001", created_by: "Priya Menon",
    created_at: "2 hours ago", risk: "low", model: "gemini-1.5-flash",
    latency_ms: 1842, tokens: 1240,
    content: `## Legal Position
Client holds a valid and enforceable arbitral award dated January 10, 2024. Post-2015 amendment, enforcement is a ministerial act.

## Key Arguments
1. Award is a decree — enforcement proceedings under Section 36 are maintainable
2. No automatic stay on filing of Section 34 petition post-2015 amendment
3. Separate application under Section 9 for attachment of assets recommended

## Recommended Strategy
Two-track approach: (1) File execution petition under S.36 immediately. (2) File S.9 application for attachment of identified assets as protective measure.

## Next Actions
- File S.36 execution petition by this week
- Asset search: CERSAI + MCA21
- Prepare S.9 application
- Send final demand notice before filing`
  },
  {
    id: "2", skill: "Client Update Email", matter_id: "2",
    matter: "Priya Estates Ltd",
    matter_number: "LOS-2024-002", created_by: "Riya Singh",
    created_at: "45 min ago", risk: "low", model: "gemini-1.5-flash",
    latency_ms: 923, tokens: 486,
    content: `Subject: Update on Your Matter — NCLT Hearing | June 10, 2024

Dear Ms. Priya,

I write to update you on today's proceedings before the NCLT Principal Bench.

**Hearing Summary — June 10, 2024**
Court: NCLT Principal Bench | Presiding Member: Shri R. Kumar

The matter was taken up and the resolution professional filed an updated progress report. The Committee of Creditors' claims have been admitted. The Hon'ble Bench directed the RP to submit the resolution plan by August 15, 2024.

**Next Steps**
The resolution timeline has been extended as directed. We will continue to monitor and advise on any developments with the Committee of Creditors.

**Next Hearing**
The matter is listed for further hearing on July 22, 2024.

With warm regards,
Arjun Sharma
LegalOS

---
✦ Human Generated, AI Assisted — This update was reviewed and approved by your advocate before dispatch.`
  },
  {
    id: "3", skill: "Preliminary Research", matter_id: "5",
    matter: "Sharma Family Trust",
    matter_number: "LOS-2024-005", created_by: "Riya Singh",
    created_at: "30 min ago", risk: "high", model: "gemini-1.5-flash",
    latency_ms: 3241, tokens: 2180,
    content: `## Research Summary
The matter involves family trust deed interpretation and disputed succession rights.

## Key Precedents ⚠️ VERIFY ALL CITATIONS
- **Mohan Lal v. Hem Raj (2019) 8 SCC 445** — Trust deed construction; settlor's intent paramount
- **Commissioner of IT v. Trustees of H.E.H. Nizam's Family Trust (1977) 1 SCC 464** — Beneficial interest
- **Pallavi Shroff v. Kirti S. Mehta (2022) — Delhi HC** — CITATION NEEDS VERIFICATION

## Risk Assessment
HIGH risk: Citation in point 3 above was generated with lower confidence. Must be independently verified before use in any filing.

## Recommended Approach
File for declaratory relief under Section 34 CPC. Injunction may be sought to preserve trust assets during proceedings.`
  },
];

const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low:    { color: "#10B981", label: "Low Risk" },
  medium: { color: "#D97706", label: "Med Risk" },
  high:   { color: "#EF4444", label: "High Risk" },
};

export default function AIQueuePage() {
  const [selected, setSelected] = useState(QUEUE[0]);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [queue, setQueue] = useState(QUEUE);
  const [approved, setApproved] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApproved(a => [...a, id]);
    setQueue(q => q.filter(i => i.id !== id));
    toast.success("AI output approved — proceeding to dispatch");
    if (queue.length > 1) setSelected(queue.find(q => q.id !== id)!);
  };

  const handleReject = (id: string) => {
    setQueue(q => q.filter(i => i.id !== id));
    toast.error("AI output rejected — discarded");
    if (queue.length > 1) setSelected(queue.find(q => q.id !== id)!);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
          <Brain size={24} color="var(--accent-gold)" /> AI Review Queue
          {queue.length > 0 && (
            <span className="badge badge-pending" style={{ fontSize: 12 }}>{queue.length} pending</span>
          )}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Review and approve all AI-generated outputs before they proceed. Nothing leaves without your approval.
        </p>
      </div>

      {queue.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ padding: 64, textAlign: "center" }}
        >
          <CheckCircle size={48} color="var(--accent-emerald)" style={{ marginBottom: 16, opacity: 0.8 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Queue is clear</h2>
          <p style={{ color: "var(--text-secondary)" }}>All AI outputs have been reviewed. Great work!</p>
        </motion.div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

          {/* Queue List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {queue.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => { setSelected(item); setEditing(false); }}
                className="card"
                style={{
                  padding: 16, cursor: "pointer",
                  border: selected.id === item.id ? "1px solid var(--accent-indigo)" : "1px solid var(--border)",
                  background: selected.id === item.id ? "rgba(79,70,229,0.07)" : "var(--bg-card)",
                  transition: "all 0.15s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span className="badge badge-ai" style={{ fontSize: 10 }}>
                    <Zap size={9} /> {item.skill}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: RISK_CONFIG[item.risk].color }} />
                    <span style={{ fontSize: 10, color: RISK_CONFIG[item.risk].color, fontWeight: 600 }}>
                      {RISK_CONFIG[item.risk].label}
                    </span>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{item.matter}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} /> {item.created_at} · by {item.created_by}
                </div>
                {selected.id === item.id && <ChevronRight size={14} style={{ position: "absolute", right: 12, top: "50%", color: "var(--accent-indigo)" }} />}
              </motion.div>
            ))}
          </div>

          {/* Review Pane */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="ai-output-box"
              style={{ padding: "36px 32px", position: "sticky", top: 80 }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="badge badge-ai"><Zap size={10} /> {selected.skill}</span>
                    <span className="badge" style={{
                      background: `${RISK_CONFIG[selected.risk].color}18`,
                      color: RISK_CONFIG[selected.risk].color,
                      border: `1px solid ${RISK_CONFIG[selected.risk].color}30`
                    }}>
                      {RISK_CONFIG[selected.risk].label}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{selected.matter}</h2>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {selected.matter_number} · by {selected.created_by} · {selected.created_at}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Model: {selected.model} · {selected.tokens} tokens · {selected.latency_ms}ms
                  </div>
                </div>
                <button
                  onClick={() => { setEditing(!editing); setEditContent(selected.content); }}
                  className="btn-secondary"
                  style={{ padding: "7px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Edit3 size={12} /> {editing ? "Cancel Edit" : "Edit"}
                </button>
              </div>

              {/* High risk warning */}
              {selected.risk === "high" && (
                <div style={{
                  padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 10, marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10
                }}>
                  <AlertTriangle size={16} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-red)", marginBottom: 2 }}>High Risk Output</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      This output contains citations or statements flagged for verification. Review carefully before approving.
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              {editing ? (
                <textarea
                  className="form-textarea"
                  style={{ width: "100%", minHeight: 360, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1.7 }}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                />
              ) : (
                <div style={{
                  background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "20px 24px",
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1.8,
                  color: "var(--text-secondary)", whiteSpace: "pre-wrap", maxHeight: 460, overflowY: "auto"
                }}>
                  {selected.content}
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <motion.button
                  id={`approve-${selected.id}`}
                  className="btn-primary"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", gap: 7, padding: "10px 20px" }}
                  onClick={() => handleApprove(selected.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <CheckCircle size={15} /> Approve & Proceed
                </motion.button>

                <motion.button
                  id={`reject-${selected.id}`}
                  className="btn-danger"
                  style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px" }}
                  onClick={() => handleReject(selected.id)}
                  whileHover={{ scale: 1.02 }}
                >
                  <X size={15} /> Reject
                </motion.button>

                <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px" }}>
                  <RefreshCw size={13} /> Regenerate
                </button>
              </div>

              {/* Audit note */}
              <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                <Shield size={12} color="var(--accent-gold)" />
                Your approval will be logged in the audit trail with your name, role, and timestamp
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
