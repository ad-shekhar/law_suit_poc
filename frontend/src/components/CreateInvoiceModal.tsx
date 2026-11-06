"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Receipt, CheckCircle, Calculator } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Matter } from "@/lib/types";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultMatterId?: string;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  defaultMatterId,
}: CreateInvoiceModalProps) {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [matterId, setMatterId] = useState(defaultMatterId || "");
  const [milestoneName, setMilestoneName] = useState("Professional Legal Retainer");
  const [description, setDescription] = useState("Professional fee for drafting of pleadings, court appearances, and advisory.");
  const [amount, setAmount] = useState<number>(150000);
  const [loading, setLoading] = useState(false);

  const gstRate = 18;
  const gstAmount = Math.round(amount * (gstRate / 100));
  const totalAmount = amount + gstAmount;

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
    if (amount <= 0) return toast.error("Please enter a valid amount");

    setLoading(true);
    try {
      await api.createInvoice(matterId, {
        milestone_name: milestoneName,
        description: description,
        amount: amount,
      });
      toast.success("Invoice generated with AI layout! Draft is ready for approval.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate invoice");
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
          width: "100%", maxWidth: 540,
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
            <Receipt size={20} color="var(--accent-indigo)" /> Generate Invoice (Skill 11)
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Create a GST-compliant milestone billing invoice with AI layout.
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
                    {m.matter_number} — {m.client_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Milestone / Purpose</label>
            <input
              type="text"
              className="form-input"
              style={{ width: "100%", marginTop: 4 }}
              value={milestoneName}
              onChange={(e) => setMilestoneName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Description</label>
            <textarea
              rows={2}
              className="form-textarea"
              style={{ width: "100%", marginTop: 4 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Fee Amount (₹, Exclusive of GST)</label>
            <input
              type="number"
              step="1000"
              className="form-input"
              style={{ width: "100%", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: 15 }}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>

          {/* Tax Breakdown Preview */}
          <div style={{
            background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.2)",
            borderRadius: 8, padding: 14, marginTop: 4
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "var(--text-secondary)" }}>Base Amount:</span>
              <span className="font-mono">₹{amount.toLocaleString("en-IN")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: "var(--text-secondary)" }}>GST @ 18%:</span>
              <span className="font-mono">₹{gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800,
              borderTop: "1px solid rgba(79, 70, 229, 0.25)", paddingTop: 6, color: "var(--accent-indigo)"
            }}>
              <span>Total Payable:</span>
              <span className="font-mono">₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
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
              <CheckCircle size={15} /> {loading ? "Generating..." : "Generate AI Invoice"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

