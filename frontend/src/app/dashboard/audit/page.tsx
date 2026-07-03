"use client";
import { motion } from "framer-motion";
import { Shield, Download, Filter, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
  
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["allAuditLogs"],
    queryFn: () => api.getAuditLogs(),
  });

  const filtered = logs.filter((l: any) =>
    search === "" ||
    (l.action && l.action.toLowerCase().includes(search.toLowerCase())) ||
    (l.user_name && l.user_name.toLowerCase().includes(search.toLowerCase())) ||
    (l.matter?.matter_number && l.matter.matter_number.toLowerCase().includes(search.toLowerCase())) ||
    (l.resource_type && l.resource_type.toLowerCase().includes(search.toLowerCase()))
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
        <a href={api.exportAuditLogsUrl()} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", fontSize: 13 }}>
            <Download size={14} /> Export CSV
          </button>
        </a>
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
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px 0" }}>Loading logs...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px 0" }}>No audit logs found.</td></tr>
            ) : (
              filtered.map((log: any, i: number) => (
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
                  <td style={{ fontSize: 13 }}>{log.resource_type || "—"}</td>
                  <td><span className="font-mono" style={{ fontSize: 12, color: "var(--accent-indigo)" }}>{log.matter?.matter_number || "—"}</span></td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{log.user_name || "System"}</td>
                  <td>
                    {log.user_role && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: ROLE_COLORS[log.user_role.toLowerCase()] || "#9CA3AF",
                        background: `${ROLE_COLORS[log.user_role.toLowerCase()] || "#9CA3AF"}15`, borderRadius: 999, padding: "2px 8px"
                      }}>
                        {log.user_role.replace(/_/g, " ")}
                      </span>
                    )}
                  </td>
                  <td className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                  </td>
                  <td className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{log.ip_address || "—"}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
