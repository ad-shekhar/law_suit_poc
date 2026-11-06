"use client";
import { motion } from "framer-motion";
import { X, CheckCircle, Send, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/types";

interface ViewInvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function ViewInvoiceModal({
  invoice,
  onClose,
  onUpdated,
}: ViewInvoiceModalProps) {
  if (!invoice) return null;

  const handleApprove = async () => {
    try {
      await api.approveInvoice(invoice.id);
      toast.success(`Invoice ${invoice.invoice_number} approved and marked sent!`);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve invoice");
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
          width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto",
          padding: 28, border: "1px solid var(--border)", position: "relative"
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Invoice Details</h2>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
              {invoice.invoice_number} · {invoice.milestone_name}
            </div>
          </div>
          <span className={`badge badge-${invoice.status === "paid" || invoice.status === "approved" || invoice.status === "sent" ? "approved" : "pending"}`} style={{ marginRight: 32 }}>
            {invoice.status}
          </span>
        </div>

        {/* Invoice HTML Document Preview */}
        <div style={{
          background: "white", color: "#111827", borderRadius: 8, padding: 28,
          marginBottom: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          {invoice.draft_html ? (
            <div dangerouslySetInnerHTML={{ __html: invoice.draft_html }} />
          ) : (
            <div>
              <h3 style={{ margin: 0, color: "#1e3a5f" }}>LegalOS Practice</h3>
              <p style={{ color: "#666", fontSize: 12 }}>Advocates & Legal Consultants</p>
              <hr style={{ margin: "16px 0", borderColor: "#e5e7eb" }} />
              <p><strong>Invoice Number:</strong> {invoice.invoice_number}</p>
              <p><strong>Milestone:</strong> {invoice.milestone_name}</p>
              <p><strong>Base Amount:</strong> ₹{invoice.amount?.toLocaleString("en-IN")}</p>
              <p><strong>GST (18%):</strong> ₹{invoice.gst_amount?.toLocaleString("en-IN")}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#4F46E5" }}>
                <strong>Total Amount:</strong> ₹{invoice.total_amount?.toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => window.print()}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", fontSize: 13 }}
          >
            <Printer size={14} /> Print / Save PDF
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} className="btn-secondary" style={{ padding: "9px 16px", fontSize: 13 }}>
              Close
            </button>
            {invoice.status === "draft" && (
              <button
                onClick={handleApprove}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", fontSize: 13 }}
              >
                <CheckCircle size={14} /> Approve & Dispatch
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

