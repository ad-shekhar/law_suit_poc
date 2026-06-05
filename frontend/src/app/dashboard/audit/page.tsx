"use client";
import { motion } from "framer-motion";
import { Shield, Download, Filter, Search } from "lucide-react";
import { useState } from "react";

const LOGS = [
  { id: "1", action: "ai_output.approved", resource: "Strategy Note", matter: "LOS-2024-001", user: "Arjun Sharma", role: "founder", time: "2024-06-10 14:32:08", ip: "103.45.x.x" },
  { id: "2", action: "strategy_note.locked", resource: "Strategy Note v1", matter: "LOS-2024-001", user: "Arjun Sharma", role: "founder", time: "2024-06-10 14:32:45", ip: "103.45.x.x" },
  { id: "3", action: "hearing.created", resource: "Hearing #3", matter: "LOS-2024-002", user: "Priya Menon", role: "senior_associate", time: "2024-06-10 11:15:22", ip: "182.71.x.x" },
  { id: "4", action: "ai_skill.triggered", resource: "Skill 12 — Client Email", matter: "LOS-2024-002", user: "Riya Singh", role: "associate", time: "2024-06-10 11:30:44", ip: "182.71.x.x" },
  { id: "5", action: "matter.created", resource: "LOS-2024-005", matter: "LOS-2024-005", user: "Arjun Sharma", role: "founder", time: "2024-06-09 09:30:00", ip: "103.45.x.x" },
  { id: "6", action: "invoice.approved", resource: "INV-2024-003", matter: "LOS-2024-003", user: "Arjun Sharma", role: "founder", time: "2024-06-08 16:45:12", ip: "103.45.x.x" },
  { id: "7", action: "document.uploaded", resource: "Order Sheet 22-05.pdf", matter: "LOS-2024-001", user: "Vinay Gupta", role: "paralegal", time: "2024-06-07 14:20:33", ip: "115.98.x.x" },
  { id: "8", action: "ai_output.rejected", resource: "Preliminary Research v1", matter: "LOS-2024-005", user: "Priya Menon", role: "senior_associate", time: "2024-06-07 11:05:17", ip: "182.71.x.x" },
];

const ACTION_COLORS: Record<string, string> = {
  "ai_output.approved": "#10B981",
  "ai_output.rejected": "#EF4444",
  "ai_skill.triggered": "#6366F1",
  "strategy_note.locked": "#D97706",
  "hearing.created": "#06B6D4",
  "matter.created": "#4F46E5",
  "invoice.approved": "#10B981",
  "document.uploaded": "#9CA3AF",
};

const ROLE_COLORS: Record<string, string> = {
  founder: "#D97706", senior_associate: "#6366F1",
  associate: "#06B6D4", paralegal: "#10B981",
  client: "#9CA3AF", admin: "#EF4444",
};

export default function AuditPage() {
  const [search, setSearch] = useState("");

  const filtered = LOGS.filter(l =>
    search === "" ||
    l.action.includes(search.toLowerCase()) ||
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.matter.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <Shield size={24} color="var(--accent-gold)" /> Audit Trail
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Immutable log of all actions — DPDP Act compliant evidence trail
          </p>
        </div>
        <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", fontSize: 13 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 38, width: "100%" }}
            placeholder="Search by action, user, matter..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-secondary" style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <Filter size={14} /> Filter
        </button>
      </div>

      <motion.div className="table-container" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Resource</th>
              <th>Matter</th>
              <th>User</th>
              <th>Role</th>
              <th>Timestamp</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => (
              <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: ACTION_COLORS[log.action] || "var(--text-muted)"
                    }} />
                    <span className="font-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {log.action}
                    </span>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{log.resource}</td>
                <td><span className="font-mono" style={{ fontSize: 12, color: "var(--accent-indigo)" }}>{log.matter}</span></td>
                <td style={{ fontSize: 13, fontWeight: 500 }}>{log.user}</td>
                <td>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: ROLE_COLORS[log.role],
                    background: `${ROLE_COLORS[log.role]}15`, borderRadius: 999, padding: "2px 8px"
                  }}>
                    {log.role.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{log.time}</td>
                <td className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{log.ip}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
