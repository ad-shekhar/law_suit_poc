"use client";
import { motion } from "framer-motion";
import { Receipt, Plus, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Invoice } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  draft:    { label: "Draft",    cls: "badge-draft",    icon: Clock },
  approved: { label: "Approved", cls: "badge-approved", icon: CheckCircle },
  sent:     { label: "Sent",     cls: "badge-active",   icon: TrendingUp },
  paid:     { label: "Paid ✓",   cls: "badge-approved", icon: CheckCircle },
  overdue:  { label: "Overdue",  cls: "badge-rejected", icon: AlertCircle },
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function InvoicesPage() {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["allInvoices"],
    queryFn: () => api.getInvoices(),
  });

  const totalBilled = invoices.reduce((s: number, i: Invoice) => s + (i.total_amount || 0), 0);
  const totalPaid = invoices.filter((i: Invoice) => i.status === "paid").reduce((s: number, i: Invoice) => s + (i.total_amount || 0), 0);
  const totalOutstanding = invoices.filter((i: Invoice) => ["sent","approved"].includes(i.status || "")).reduce((s: number, i: Invoice) => s + (i.total_amount || 0), 0);

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading invoices...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Invoices</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>GST-compliant invoices with AI-assisted generation</p>
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}>
          <Plus size={16} /> Generate Invoice
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { label: "Total Billed", value: fmt(totalBilled), color: "var(--accent-indigo)" },
          { label: "Collected", value: fmt(totalPaid), color: "var(--accent-emerald)" },
          { label: "Outstanding", value: fmt(totalOutstanding), color: "var(--accent-gold)" },
          { label: "Invoices", value: invoices.length.toString(), color: "var(--accent-cyan)" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <motion.div className="table-container" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th><th>Matter</th><th>Milestone</th><th>Amount</th><th>GST (18%)</th><th>Total</th><th>Status</th><th>Date</th><th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>No invoices found.</td>
              </tr>
            ) : (
              invoices.map((inv: Invoice, i: number) => {
                const sc = STATUS_CONFIG[inv.status || "draft"] || STATUS_CONFIG["draft"];
                return (
                  <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td className="font-mono" style={{ fontSize: 12, color: "var(--accent-indigo)" }}>{inv.invoice_number}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.matter?.client_name || "Matter"}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{inv.matter?.matter_number || "—"}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{inv.milestone_name || "—"}</td>
                    <td className="font-mono" style={{ fontSize: 13 }}>{fmt(inv.amount || 0)}</td>
                    <td className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmt(inv.gst_amount || 0)}</td>
                    <td className="font-mono" style={{ fontSize: 13, fontWeight: 700 }}>{fmt(inv.total_amount || 0)}</td>
                    <td><span className={`badge ${sc.cls}`} style={{ fontSize: 10 }}><sc.icon size={9} /> {sc.label}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-ghost" style={{ padding: "5px 8px", fontSize: 11 }}>View</button>
                        {inv.status === "draft" && <button className="btn-primary" style={{ padding: "5px 10px", fontSize: 11 }}>Approve</button>}
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
