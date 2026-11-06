"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, ArrowLeft, ArrowRight, CheckCircle, Scale,
  Briefcase, Mail, Phone, Building, AlertCircle, FileText,
  Copy, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

const SAMPLE_EMAILS = [
  {
    title: "Arbitration & Debt Recovery",
    text: `From: rajesh@rkenterprises.com
Subject: Urgent: Default on EPC Construction Contract by ABC Infrastructure

Dear Mr. Sharma,

We had entered into a construction EPC contract dated 15th March 2022 with ABC Infrastructure Ltd. for our warehouse project in Gurugram.
Despite multiple reminder notices and completion of milestones, they have defaulted on payments totaling INR 2.5 Crores.
Clause 23 of our agreement provides for arbitration seated in New Delhi under the Arbitration and Conciliation Act, 1996.
We urgently need your representation before the Delhi High Court for Section 9 interim relief and appointment of an arbitrator.

Best regards,
Rajesh Kumar
Managing Director, Rajesh Kumar Enterprises Pvt. Ltd.
Phone: +91-9876543210`
  },
  {
    title: "IBC Insolvency Section 7",
    text: `From: legal@priyaestates.in
Subject: Legal Notice & NCLT Petition against Defaulter Corp

Dear Senior Advocate Arjun,

Defaulter Corp has failed to repay financial debt of INR 8.2 Crores due on debentures issued to Priya Estates Pvt. Ltd. The date of default was January 14, 2024.
We intend to file a corporate insolvency resolution process (CIRP) petition under Section 7 of the IBC before the NCLT Principal Bench, New Delhi.
Please find the loan agreement and demand notice records attached.

Warm regards,
Priya Menon
Director, Priya Estates Pvt. Ltd.
Mobile: +91-9811223344`
  }
];

export default function MatterIntakePage() {
  const router = useRouter();
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleExtract = async () => {
    if (!emailText.trim()) {
      return toast.error("Please paste an email or text first.");
    }
    setLoading(true);
    try {
      const res = await api.runAiSkill("skill_01_matter_intake", "new-intake", { input_text: emailText });
      let data: any = {};
      if (res && res.raw_output) {
        try {
          data = JSON.parse(res.raw_output);
        } catch {
          data = { brief_facts: res.raw_output };
        }
      }
      setExtracted({
        client_name: data.client_name || "New Client",
        client_email: data.client_email || "",
        client_phone: data.client_phone || "",
        case_type: data.case_type || "civil_suit",
        court: data.court || "high_court",
        court_name: data.court_name || "High Court",
        opposing_party: data.opposing_party || "",
        relief_sought: data.relief_sought || "",
        brief_facts: data.brief_facts || emailText,
        tags: Array.isArray(data.suggested_tags) ? data.suggested_tags.join(", ") : (data.suggested_tags || "intake, ai-extracted"),
        confidence: data.confidence || 0.90
      });
      toast.success("AI extracted matter fields successfully!");
    } catch (err: any) {
      toast.error(err.message || "Extraction failed. Check network or AI mock toggle.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatter = async () => {
    if (!extracted) return;
    setSubmitting(true);
    try {
      const payload = {
        client_name: extracted.client_name,
        client_email: extracted.client_email,
        client_phone: extracted.client_phone,
        case_type: extracted.case_type,
        court: extracted.court,
        court_name: extracted.court_name,
        opposing_party: extracted.opposing_party,
        relief_sought: extracted.relief_sought,
        brief_facts: extracted.brief_facts,
        tags: extracted.tags ? extracted.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : ["ai-intake"],
        status: "intake"
      };
      const created = await api.createMatter(payload);
      toast.success(`Matter ${created.matter_number || ""} created successfully!`);
      router.push(`/dashboard/matters/${created.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create matter");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", paddingBottom: 60 }}>
      {/* Top Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/dashboard/matters" style={{ textDecoration: "none", color: "var(--text-muted)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={14} /> Back to Matters
        </Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={24} color="var(--accent-indigo)" /> AI Matter Intake (Skill 01)
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Paste an inquiry email or client communication. The AI extracts parties, court, relief, and legal taxonomy for human review.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: extracted ? "1fr 1fr" : "1fr", gap: 24 }}>
        {/* Left Column: Email Input */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              Incoming Email / Client Brief
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {SAMPLE_EMAILS.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: "4px 8px" }}
                  onClick={() => setEmailText(s.text)}
                >
                  <Copy size={11} style={{ marginRight: 4 }} /> {s.title}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="form-textarea"
            rows={14}
            style={{ width: "100%", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1.6 }}
            placeholder="Paste raw email or consultation notes here..."
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
          />

          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {emailText.length} characters
            </span>
            <button
              onClick={handleExtract}
              disabled={loading || !emailText.trim()}
              className="btn-primary"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px" }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="spin" /> Extracting with AI...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Extract Matter Details
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Extracted Fields Review */}
        <AnimatePresence>
          {extracted && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="card"
              style={{ padding: 24, border: "1px solid var(--accent-indigo)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>Review Extracted Fields</h2>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Verify all details before creating matter record</div>
                </div>
                <span className="badge badge-ai" style={{ fontSize: 11 }}>
                  Confidence: {Math.round((extracted.confidence || 0.9) * 100)}%
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Client Name</label>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={extracted.client_name}
                    onChange={(e) => setExtracted({ ...extracted, client_name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Client Email</label>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginTop: 4 }}
                      value={extracted.client_email}
                      onChange={(e) => setExtracted({ ...extracted, client_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Client Phone</label>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginTop: 4 }}
                      value={extracted.client_phone}
                      onChange={(e) => setExtracted({ ...extracted, client_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Court Name</label>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginTop: 4 }}
                      value={extracted.court_name}
                      onChange={(e) => setExtracted({ ...extracted, court_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Opposing Party</label>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginTop: 4 }}
                      value={extracted.opposing_party}
                      onChange={(e) => setExtracted({ ...extracted, opposing_party: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Relief Sought</label>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={extracted.relief_sought}
                    onChange={(e) => setExtracted({ ...extracted, relief_sought: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Brief Facts</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    style={{ width: "100%", marginTop: 4, fontSize: 12 }}
                    value={extracted.brief_facts}
                    onChange={(e) => setExtracted({ ...extracted, brief_facts: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Tags (comma-separated)</label>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={extracted.tags}
                    onChange={(e) => setExtracted({ ...extracted, tags: e.target.value })}
                  />
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                  <button
                    onClick={handleCreateMatter}
                    disabled={submitting}
                    className="btn-primary"
                    style={{ flex: 1, padding: "12px 20px", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}
                  >
                    <CheckCircle size={16} /> Approve & Create Matter
                  </button>
                  <button
                    onClick={() => setExtracted(null)}
                    className="btn-secondary"
                    style={{ padding: "12px 16px" }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

