"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Scale, Sparkles, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Matter } from "@/lib/types";

interface LogHearingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMatterId?: string;
}

export default function LogHearingModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMatterId,
}: LogHearingModalProps) {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [matterId, setMatterId] = useState(defaultMatterId || "");
  const [hearingDate, setHearingDate] = useState(new Date().toISOString().slice(0, 16));
  const [courtRoom, setCourtRoom] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [benchComposition, setBenchComposition] = useState("Single Bench");
  const [orderSummary, setOrderSummary] = useState("");
  const [outcome, setOutcome] = useState("Arguments heard in part; adjourned.");
  const [nextSteps, setNextSteps] = useState("Prepare compilation of authorities.");
  const [adjournedTo, setAdjournedTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultMatterId) {
      setMatterId(defaultMatterId);
    }
  }, [defaultMatterId]);

  useEffect(() => {
    if (isOpen && !defaultMatterId) {
      api.getMatters().then((res) => {
        setMatters(res || []);
        if (res && res.length > 0 && !matterId) {
          setMatterId(res[0].id);
        }
      }).catch((e) => console.error(e));
    }
  }, [isOpen, defaultMatterId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matterId) return toast.error("Please select a matter");
    if (!orderSummary.trim()) return toast.error("Please provide an order summary");

    setLoading(true);
    try {
      const payload = {
        hearing_date: new Date(hearingDate).toISOString(),
        court_room: courtRoom || "Court Room",
        judge_name: judgeName || "Hon'ble Judge",
        bench_composition: benchComposition,
        order_summary: orderSummary,
        outcome: outcome,
        next_steps: nextSteps,
        adjourned_to: adjournedTo ? new Date(adjournedTo).toISOString() : null,
      };

      await api.logHearing(matterId, payload);
      toast.success("Hearing logged! AI Skill 12 generated a client update email draft in the queue.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to log hearing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card"
        style={{
          width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto",
          padding: 28, border: "1px solid var(--border)", position: "relative"
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={20} color="var(--accent-indigo)" /> Log Court Hearing
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Record proceedings. LegalOS AI will automatically draft a client update email for review.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!defaultMatterId && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Matter</label>
              <select
                className="form-input"
                style={{ width: "100%", marginTop: 4 }}
                value={matterId}
                onChange={(e) => setMatterId(e.target.value)}
                required
              >
                {matters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matter_number} — {m.client_name} ({m.court_name})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Hearing Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                style={{ width: "100%", marginTop: 4 }}
                value={hearingDate}
                onChange={(e) => setHearingDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Court Room / Item No.</label>
              <input
                type="text"
                placeholder="e.g. Court 3, Item 14"
                className="form-input"
                style={{ width: "100%", marginTop: 4 }}
                value={courtRoom}
                onChange={(e) => setCourtRoom(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Presiding Judge / Bench</label>
              <input
                type="text"
                placeholder="Hon'ble Justice..."
                className="form-input"
                style={{ width: "100%", marginTop: 4 }}
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Bench Composition</label>
              <select
                className="form-input"
                style={{ width: "100%", marginTop: 4 }}
                value={benchComposition}
                onChange={(e) => setBenchComposition(e.target.value)}
              >
                <option value="Single Bench">Single Bench</option>
                <option value="Division Bench">Division Bench</option>
                <option value="Full Bench">Full Bench</option>
                <option value="Arbitral Tribunal">Arbitral Tribunal</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Summary of Proceedings & Order</label>
            <textarea
              rows={3}
              placeholder="What transpired in court? Key remarks or directions issued..."
              className="form-textarea"
              style={{ width: "100%", marginTop: 4 }}
              value={orderSummary}
              onChange={(e) => setOrderSummary(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Outcome</label>
              <input
                type="text"
                className="form-input"
                style={{ width: "100%", marginTop: 4 }}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Next Hearing Date (Adjourned To)</label>
              <input
                type="date"
                className="form-input"
                style={{ width: "100%", marginTop: 4 }}
                value={adjournedTo}
                onChange={(e) => setAdjournedTo(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Next Action Steps</label>
            <input
              type="text"
              placeholder="e.g. Prepare rejoinder, instruct arguing counsel..."
              className="form-input"
              style={{ width: "100%", marginTop: 4 }}
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: "10px 18px" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: "10px 22px", display: "flex", alignItems: "center", gap: 8 }}
            >
              <CheckCircle size={15} /> {loading ? "Logging..." : "Log Hearing & Generate Update"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

