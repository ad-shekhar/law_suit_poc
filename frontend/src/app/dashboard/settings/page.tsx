"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Brain, Building, Save, CheckCircle, Database } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [firmName, setFirmName] = useState("LegalOS Practice Advocates");
  const [gstin, setGstin] = useState("07AAAAA0000A1Z5");
  const [address, setAddress] = useState("Bar Chambers, Supreme Court of India, Bhagwan Das Road, New Delhi 110001");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [aiStrictCitations, setAiStrictCitations] = useState(true);
  const [zeroDataRetention, setZeroDataRetention] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Firm configuration and compliance settings updated!");
  };

  return (
    <div style={{ maxWidth: 840, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
          <Settings size={24} color="var(--accent-indigo)" /> Firm Settings
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Firm details, GST billing settings, AI engine guardrails, and DPDP Act compliance.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Firm Profile */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Building size={16} color="var(--accent-indigo)" /> Firm Identity & Invoicing
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Firm Legal Name</label>
              <input
                className="form-input"
                style={{ width: "100%", marginTop: 4 }}
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Firm GSTIN (for tax invoices)</label>
                <input
                  className="form-input"
                  style={{ width: "100%", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Practice Tier</label>
                <input
                  className="form-input"
                  style={{ width: "100%", marginTop: 4 }}
                  disabled
                  value="LegalOS Enterprise Practice (Active)"
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Office Chambers Address</label>
              <textarea
                rows={2}
                className="form-textarea"
                style={{ width: "100%", marginTop: 4 }}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* AI Guardrails */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Brain size={16} color="var(--accent-gold)" /> AI Engine Guardrails ("Human Generated, AI Assisted")
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 8, border: "1px solid var(--border)"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Strict Citation Verification (Skills 02, 07, 08)</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Require explicit verification on all SCC, AIR, and High Court case law citations before dispatch.
                </div>
              </div>
              <input
                type="checkbox"
                checked={aiStrictCitations}
                onChange={(e) => setAiStrictCitations(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
            </div>

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", background: "rgba(255, 255, 255, 0.02)", borderRadius: 8, border: "1px solid var(--border)"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Zero Data Retention (ZDR) Mode</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Ensures all AI model API requests are discarded post-inference with zero training retention.
                </div>
              </div>
              <input
                type="checkbox"
                checked={zeroDataRetention}
                onChange={(e) => setZeroDataRetention(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Active Foundation Model</label>
                <div className="form-input" style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.2)" }}>
                  <span className="badge badge-ai" style={{ fontSize: 11 }}>gemini-3.5-flash-lite</span>
                  <span style={{ fontSize: 12, color: "var(--accent-emerald)" }}>● Live Connected</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Temperature & Precision</label>
                <div className="form-input" style={{ marginTop: 4, background: "rgba(0,0,0,0.2)" }}>
                  0.2 (Optimized for Legal Rigor)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance & Storage */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={16} color="var(--accent-emerald)" /> DPDP Act & Data Sovereignty
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={15} color="var(--accent-emerald)" />
              <span><strong>Data Residency:</strong> Azure India Central (Pune & Chennai regions only).</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={15} color="var(--accent-emerald)" />
              <span><strong>Attorney-Client Privilege:</strong> End-to-end encrypted under Section 126 of the Indian Evidence Act.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle size={15} color="var(--accent-emerald)" />
              <span><strong>Audit Trail Immutability:</strong> All changes, approvals, and AI prompts logged in cryptographically signed audit store.</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px" }}>
            <Save size={15} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
