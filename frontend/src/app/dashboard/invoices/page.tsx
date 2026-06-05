"use client";
import { motion } from "framer-motion";
import { Receipt, Plus, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";

const INVOICES = [
  { id: "1", number: "LOS-INV-2024-001", matter: "Rajesh Kumar Enterprises", matter_number: "LOS-2024-001", milestone: "Retainer Fee", amount: 500000, gst: 90000, total: 590000, status: "paid", date: "2024-05-15" },
  { id: "2", number: "LOS-INV-2024-002", matter: "Priya Estates Ltd", matter_number: "LOS-2024-002", milestone: "HC Filing Fee", amount: 150000, gst: 27000, total: 177000, status: "sent", date: "2024-06-01" },
  { id: "3", number: "LOS-INV-2024-003", matter: "Tech Corp International", matter_number: "LOS-2024-003", milestone: "Arbitration Retainer", amount: 800000, gst: 144000, total: 944000, status: "approved", date: "2024-06-05" },
  { id: "4", number: "LOS-INV-2024-004", matter: "Sharma Family Trust", matter_number: "LOS-2024-005", milestone: "Initial Consultation + Intake", amount: 75000, gst: 13500, total: 88500, status: "draft", date: "2024-06-10" },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  draft:    { label: "Draft",    cls: "badge-draft",    icon: Clock },
  approved: { label: "Approved", cls: "badge-approved", icon: CheckCircle },
  sent:     { label: "Sent",     cls: "badge-active",   icon: TrendingUp },
  paid:     { label: "Paid ✓",   cls: "badge-approved", icon: CheckCircle },
  overdue:  { label: "Overdue",  cls: "badge-rejected", icon: AlertCircle },
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const totalBilled = INVOICES.reduce((s, i) => s + i.total, 0);
const totalPaid = INVOICES.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
const totalOutstanding = INVOICES.filter(i => ["sent","approved"].includes(i.status)).reduce((s, i) => s + i.total, 0);

export default function InvoicesPage() {
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
          { label: "Invoices", value: INVOICES.length.toString(), color: "var(--accent-cyan)" },
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
            {INVOICES.map((inv, i) => {
              const sc = STATUS_CONFIG[inv.status];
              return (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td className="font-mono" style={{ fontSize: 12, color: "var(--accent-indigo)" }}>{inv.number}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.matter}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{inv.matter_number}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{inv.milestone}</td>
                  <td className="font-mono" style={{ fontSize: 13 }}>{fmt(inv.amount)}</td>
                  <td className="font-mono" style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmt(inv.gst)}</td>
                  <td className="font-mono" style={{ fontSize: 13, fontWeight: 700 }}>{fmt(inv.total)}</td>
                  <td><span className={`badge ${sc.cls}`} style={{ fontSize: 10 }}><sc.icon size={9} /> {sc.label}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.date}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-ghost" style={{ padding: "5px 8px", fontSize: 11 }}>View</button>
                      {inv.status === "draft" && <button className="btn-primary" style={{ padding: "5px 10px", fontSize: 11 }}>Approve</button>}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
