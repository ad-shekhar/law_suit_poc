"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Scale, Calendar, FileText, Brain, Receipt,
  Lock, CheckCircle, Clock, Users, Sparkles, AlertTriangle,
  ChevronRight, Shield, Activity, Edit3, Send, Download,
  Plus, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

const MATTER = {
  id: "1", number: "LOS-2024-001",
  client: "Rajesh Kumar Enterprises Pvt. Ltd.",
  clientEmail: "rajesh@rkenterprises.com",
  case_type: "Arbitration", court: "Delhi High Court",
  case_number: "OMP-2024-001", status: "active",
  associate: "Priya Menon", founder: "Arjun Sharma",
  opposing_party: "ABC Infrastructure Ltd.",
  opposing_counsel: "Adv. Suresh Patel",
  relief_sought: "Recovery of ₹2.5 Crore with interest under Section 37",
  brief_facts: "Client entered construction contract March 2022. Opposing party defaulted on ₹2.5 Cr payments. Arbitration clause exists.",
  tags: ["arbitration", "recovery", "construction"],
  created_at: "2024-05-15",
};

const STRATEGY_NOTE = {
  exists: true, locked: true,
  locked_by: "Arjun Sharma", locked_at: "2024-05-20",
  legal_position: "Strong. Client holds valid arbitral award. Post-2015 amendment, enforcement is ministerial.",
  key_arguments: [
    "Award is a decree — enforcement under S.36 maintainable",
    "No automatic stay post-2015 amendment (BCCI v. Kochi precedent)",
    "S.9 application for asset attachment recommended",
  ],
  risks: [
    { risk: "S.34 challenge filing", severity: "medium", mitigation: "File execution immediately" },
    { risk: "Asset transfer pre-attachment", severity: "high", mitigation: "Emergency S.9 this week" },
  ],
  recommended_strategy: "Two-track: File S.36 execution immediately + S.9 for asset attachment. Parallel settlement negotiation.",
  next_actions: ["File S.36 by this week", "Asset search via CERSAI", "Send final demand notice"],
};

const HEARINGS = [
  { id: "1", date: "2024-06-10", court_room: "Court Room 4", judge: "Justice A. Sharma",
    outcome: "Counter-affidavit directed in 4 weeks", next_date: "2024-07-08", client_update_sent: true },
  { id: "2", date: "2024-05-22", court_room: "Court Room 7", judge: "Justice A. Sharma",
    outcome: "Notice issued to respondent. Hearing adjourned.", next_date: "2024-06-10", client_update_sent: true },
];

const AI_OUTPUTS = [
  { id: "1", skill: "Strategy Note (Skill 03)", status: "approved", created: "2024-05-20", reviewed_by: "Arjun Sharma" },
  { id: "2", skill: "Engagement Letter (Skill 04)", status: "approved", created: "2024-05-16", reviewed_by: "Arjun Sharma" },
  { id: "3", skill: "Client Update Email (Skill 12)", status: "pending", created: "2024-06-10", reviewed_by: null },
];

const TABS = ["Overview", "Strategy Note", "Hearings", "Documents", "Invoices", "AI Trail", "Audit"];

const STATUS_COLORS: Record<string, string> = {
  approved: "var(--accent-emerald)", pending: "var(--accent-gold)", rejected: "var(--accent-red)"
};

export default function MatterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Overview");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showGenerateMenu, setShowGenerateMenu] = useState(false);

  const triggerAI = async (skill: string) => {
    setShowGenerateMenu(false);
    setGeneratingAI(true);
    await new Promise(r => setTimeout(r, 2200));
    setGeneratingAI(false);
    toast.success(`${skill} generated — awaiting your review in AI Trail`);
  };

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.back()} className="btn-ghost"
        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "6px 0" }}>
        <ArrowLeft size={15} /> All Matters
      </button>

      {/* Matter Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ padding: "24px 28px", marginBottom: 24 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span className="font-mono" style={{ fontSize: 13, color: "var(--accent-indigo)", fontWeight: 700 }}>
                {MATTER.number}
              </span>
              <span style={{ color: "var(--border)" }}>·</span>
              <span className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>{MATTER.case_number}</span>
              <span className="badge badge-active" style={{ fontSize: 10 }}>{MATTER.status}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
              {MATTER.client}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Scale size={13} color="var(--accent-indigo)" /> {MATTER.court}
              </span>
              <span>·</span>
              <span>{MATTER.case_type}</span>
              <span>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={13} /> {MATTER.associate}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {MATTER.tags.map(tag => (
                <span key={tag} style={{
                  background: "var(--bg-elevated)", color: "var(--text-muted)",
                  borderRadius: 6, padding: "2px 10px", fontSize: 11
                }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", position: "relative" }}>
            <div style={{ position: "relative" }}>
              <motion.button
                id="generate-ai-btn"
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", fontSize: 13 }}
                onClick={() => setShowGenerateMenu(!showGenerateMenu)}
                disabled={generatingAI}
                whileHover={{ scale: 1.02 }}
              >
                {generatingAI ? (
                  <><span className="ai-thinking-dots">
                    <span className="ai-thinking-dot" style={{ width: 5, height: 5, background: "white" }} />
                    <span className="ai-thinking-dot" style={{ width: 5, height: 5, background: "white" }} />
                    <span className="ai-thinking-dot" style={{ width: 5, height: 5, background: "white" }} />
                  </span> Generating...</>
                ) : (
                  <><Sparkles size={14} /> Generate AI <ChevronRight size={12} /></>
                )}
              </motion.button>
              <AnimatePresence>
                {showGenerateMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                      background: "var(--bg-card)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: 8, minWidth: 220, boxShadow: "0 16px 40px rgba(0,0,0,0.4)"
                    }}
                  >
                    {[
                      "Strategy Note", "Engagement Letter", "Preliminary Research",
                      "Client Update Email", "Invoice Draft", "Hearing Summary"
                    ].map((skill) => (
                      <button key={skill} onClick={() => triggerAI(skill)}
                        className="btn-ghost"
                        style={{ width: "100%", textAlign: "left", padding: "9px 12px", fontSize: 13,
                          display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <Sparkles size={12} color="var(--accent-indigo)" /> {skill}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="btn-secondary" style={{ padding: "9px 14px", fontSize: 13 }}>
              <Edit3 size={14} style={{ display: "inline", marginRight: 5 }} /> Edit
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0, overflowX: "auto" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none", border: "none",
              padding: "10px 18px", fontSize: 13, fontWeight: 600,
              color: activeTab === tab ? "var(--accent-indigo)" : "var(--text-muted)",
              borderBottom: activeTab === tab ? "2px solid var(--accent-indigo)" : "2px solid transparent",
              cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              marginBottom: -1
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* OVERVIEW */}
          {activeTab === "Overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Case Details
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {[
                      ["Client", MATTER.client],
                      ["Case Type", MATTER.case_type],
                      ["Court", MATTER.court],
                      ["Case Number", MATTER.case_number],
                      ["Opposing Party", MATTER.opposing_party],
                      ["Opposing Counsel", MATTER.opposing_counsel],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{k}</div>
                        <div style={{ fontSize: 14 }}>{v}</div>
                      </div>
                    ))}
                    <div style={{ gridColumn: "1/-1" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Relief Sought</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{MATTER.relief_sought}</div>
                    </div>
                  </div>
                </div>
                {/* Strategy Note Preview */}
                {STRATEGY_NOTE.exists && (
                  <div className="ai-output-box" style={{ padding: "28px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10, marginBottom: 16 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 7 }}>
                        <Brain size={15} color="var(--accent-indigo)" /> Strategy Note
                        {STRATEGY_NOTE.locked && (
                          <span className="badge badge-locked" style={{ fontSize: 10 }}>
                            <Lock size={9} /> Locked
                          </span>
                        )}
                      </h3>
                      <button className="btn-ghost" onClick={() => setActiveTab("Strategy Note")} style={{ fontSize: 12 }}>
                        Full view <ArrowRight size={12} />
                      </button>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 14 }}>
                      {STRATEGY_NOTE.legal_position}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {STRATEGY_NOTE.next_actions.map((a, i) => (
                        <span key={i} style={{
                          background: "rgba(79,70,229,0.1)", color: "#818CF8",
                          borderRadius: 6, padding: "3px 10px", fontSize: 12,
                          display: "flex", alignItems: "center", gap: 5
                        }}>
                          <CheckCircle size={10} /> {a}
                        </span>
                      ))}
                    </div>
                    <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Shield size={12} color="var(--accent-gold)" />
                      Locked by {STRATEGY_NOTE.locked_by} on {STRATEGY_NOTE.locked_at} · Immutable record
                    </div>
                  </div>
                )}
              </div>

              {/* Right sidebar */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                    Next Hearing
                  </h3>
                  <div style={{ textAlign: "center", padding: "16px", background: "rgba(79,70,229,0.08)", borderRadius: 10, border: "1px solid rgba(79,70,229,0.2)", marginBottom: 12 }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-indigo)", lineHeight: 1 }}>08</div>
                    <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>July 2024</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Delhi High Court</div>
                  </div>
                  <button className="btn-secondary" style={{ width: "100%", fontSize: 13, padding: "9px" }}>
                    <Plus size={13} style={{ display: "inline", marginRight: 5 }} />
                    Log Hearing
                  </button>
                </div>

                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                    AI Review Status
                  </h3>
                  {AI_OUTPUTS.map((o) => (
                    <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[o.status], flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{o.skill}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{o.created}</div>
                      </div>
                      <span className={`badge badge-${o.status}`} style={{ fontSize: 10 }}>{o.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STRATEGY NOTE TAB */}
          {activeTab === "Strategy Note" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
              <div className="ai-output-box" style={{ padding: "36px 32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800 }}>Strategy Note v1</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    {STRATEGY_NOTE.locked
                      ? <span className="badge badge-locked pulse-gold"><Lock size={11} /> Locked — Immutable</span>
                      : <button className="btn-gold" style={{ padding: "8px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                          <Lock size={13} /> Lock Note
                        </button>
                    }
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                  <section>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                      Legal Position
                    </h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-secondary)" }}>{STRATEGY_NOTE.legal_position}</p>
                  </section>
                  <div className="divider" />
                  <section>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                      Key Arguments
                    </h3>
                    {STRATEGY_NOTE.key_arguments.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(79,70,229,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-indigo)" }}>{i + 1}</span>
                        </div>
                        <span style={{ fontSize: 14, lineHeight: 1.6 }}>{a}</span>
                      </div>
                    ))}
                  </section>
                  <div className="divider" />
                  <section>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                      Risk Assessment
                    </h3>
                    {STRATEGY_NOTE.risks.map((r, i) => (
                      <div key={i} style={{
                        marginBottom: 10, padding: "12px 14px", borderRadius: 10,
                        background: r.severity === "high" ? "rgba(239,68,68,0.07)" : "rgba(217,119,6,0.07)",
                        border: `1px solid ${r.severity === "high" ? "rgba(239,68,68,0.2)" : "rgba(217,119,6,0.2)"}`
                      }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                          <AlertTriangle size={13} color={r.severity === "high" ? "var(--accent-red)" : "var(--accent-gold)"} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{r.risk}</span>
                          <span className={`badge badge-${r.severity === "high" ? "rejected" : "pending"}`} style={{ fontSize: 9 }}>{r.severity}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", paddingLeft: 21 }}>↳ {r.mitigation}</div>
                      </div>
                    ))}
                  </section>
                  <div className="divider" />
                  <section>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                      Recommended Strategy
                    </h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7 }}>{STRATEGY_NOTE.recommended_strategy}</p>
                  </section>
                  <div className="divider" />
                  <section>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                      Next Actions
                    </h3>
                    {STRATEGY_NOTE.next_actions.map((a, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <CheckCircle size={14} color="var(--accent-emerald)" />
                        <span style={{ fontSize: 14 }}>{a}</span>
                      </div>
                    ))}
                  </section>
                </div>
                <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(217,119,6,0.07)", borderRadius: 10, border: "1px solid rgba(217,119,6,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
                  <Shield size={14} color="var(--accent-gold)" />
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Locked by <strong>{STRATEGY_NOTE.locked_by}</strong> on {STRATEGY_NOTE.locked_at} · This note is immutable and archived to PDF
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="card" style={{ padding: 18 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Actions</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button className="btn-secondary" style={{ fontSize: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                      <Download size={13} /> Download PDF
                    </button>
                    <button className="btn-secondary" style={{ fontSize: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                      <Brain size={13} /> Regenerate (new version)
                    </button>
                  </div>
                </div>
                <div className="card" style={{ padding: 18 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Versions</h3>
                  <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(79,70,229,0.1)", borderRadius: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-indigo)" }} />
                    v1 · {STRATEGY_NOTE.locked_at} · Current
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HEARINGS TAB */}
          {activeTab === "Hearings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Hearing Timeline</h2>
                <button className="btn-primary" style={{ padding: "9px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                  <Plus size={14} /> Log Hearing
                </button>
              </div>
              <div className="timeline">
                {HEARINGS.map((h, i) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="timeline-item"
                  >
                    <div className={`timeline-dot ${i === 0 ? "gold" : "emerald"}`} />
                    <div className="card" style={{ padding: "18px 20px", marginBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                            <Calendar size={13} color="var(--accent-indigo)" />
                            {new Date(h.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                          </div>
                          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
                            {h.judge} · {h.court_room}
                          </div>
                          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{h.outcome}</div>
                          {h.next_date && (
                            <div style={{ fontSize: 13, color: "var(--accent-indigo)", marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
                              <ArrowRight size={12} /> Next: {new Date(h.next_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                          {h.client_update_sent
                            ? <span className="badge badge-approved" style={{ fontSize: 10 }}><Send size={9} /> Client notified</span>
                            : <button className="btn-gold" style={{ fontSize: 11, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                                <Brain size={11} /> Generate Update
                              </button>
                          }
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* AI TRAIL TAB */}
          {activeTab === "AI Trail" && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>AI Output Trail</h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Every AI output is logged here. Nothing proceeds without human review.
                </p>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Skill</th>
                      <th>Status</th>
                      <th>Generated</th>
                      <th>Reviewed By</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AI_OUTPUTS.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className="badge badge-ai" style={{ fontSize: 11 }}>
                            <Brain size={10} /> {o.skill}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${o.status}`} style={{ fontSize: 11 }}>
                            {o.status === "approved" && <CheckCircle size={10} />}
                            {o.status === "pending" && <Clock size={10} />}
                            {o.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{o.created}</td>
                        <td style={{ fontSize: 13 }}>{o.reviewed_by || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                        <td>
                          {o.status === "pending"
                            ? <button className="btn-primary" style={{ padding: "5px 12px", fontSize: 12 }}>Review</button>
                            : <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>View</button>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === "Audit" && (
            <div className="card" style={{ padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Audit Trail</h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Complete log of all actions on this matter</p>
              <div className="timeline">
                {[
                  { action: "Strategy note locked", user: "Arjun Sharma", time: "2024-05-20 14:32", role: "founder", icon: Lock, color: "#D97706" },
                  { action: "AI output approved (Strategy Note)", user: "Arjun Sharma", time: "2024-05-20 14:28", role: "founder", icon: CheckCircle, color: "#10B981" },
                  { action: "Strategy note generated by AI", user: "Priya Menon", time: "2024-05-20 11:15", role: "senior_associate", icon: Brain, color: "#6366F1" },
                  { action: "Engagement letter approved", user: "Arjun Sharma", time: "2024-05-17 10:00", role: "founder", icon: CheckCircle, color: "#10B981" },
                  { action: "Matter created", user: "Arjun Sharma", time: "2024-05-15 09:30", role: "founder", icon: Activity, color: "#06B6D4" },
                ].map((e, i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot" style={{ background: e.color, boxShadow: `0 0 6px ${e.color}60` }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{e.action}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          {e.user} · <span className={`role-${e.role}`}>{e.role}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{e.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder tabs */}
          {["Documents", "Invoices"].includes(activeTab) && (
            <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>
                {activeTab === "Documents" ? "📄" : "🧾"}
              </div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>No {activeTab.toLowerCase()} yet</p>
              <button className="btn-primary" style={{ margin: "0 auto", display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", fontSize: 13 }}>
                <Plus size={14} /> Add {activeTab === "Documents" ? "Document" : "Invoice"}
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
