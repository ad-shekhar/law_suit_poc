"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Briefcase, Search, Filter, Plus, ArrowRight,
  Scale, Calendar, Clock, ChevronRight, Tag,
  AlertCircle, CheckCircle, FileText, Users
} from "lucide-react";

const MATTERS = [
  {
    id: "1", number: "LOS-2024-001", client: "Rajesh Kumar Enterprises",
    case_type: "Arbitration", court: "Delhi High Court", status: "active",
    associate: "Priya Menon", next_hearing: "2024-06-10", case_number: "OMP-2024-001",
    tags: ["recovery", "arbitration"], last_activity: "2 hours ago", ai_outputs_pending: 2
  },
  {
    id: "2", number: "LOS-2024-002", client: "Priya Estates Ltd",
    case_type: "IBC/Insolvency", court: "NCLT Principal Bench", status: "hearing_scheduled",
    associate: "Riya Singh", next_hearing: "2024-06-10", case_number: "CP-2024-045",
    tags: ["insolvency", "NCLT"], last_activity: "1 day ago", ai_outputs_pending: 1
  },
  {
    id: "3", number: "LOS-2024-003", client: "Tech Corp International",
    case_type: "Arbitration", court: "Arbitral Tribunal", status: "arguments_pending",
    associate: "Priya Menon", next_hearing: "2024-06-15", case_number: "ARB-2024-012",
    tags: ["technology", "arbitration", "IP"], last_activity: "3 hours ago", ai_outputs_pending: 0
  },
  {
    id: "4", number: "LOS-2024-004", client: "Venkat Industries",
    case_type: "Criminal", court: "Bombay High Court", status: "reserved_for_orders",
    associate: "Riya Singh", next_hearing: "2024-06-20", case_number: "CRL-2024-012",
    tags: ["criminal", "bail"], last_activity: "5 hours ago", ai_outputs_pending: 0
  },
  {
    id: "5", number: "LOS-2024-005", client: "Sharma Family Trust",
    case_type: "Civil Suit", court: "Delhi District Court", status: "intake",
    associate: null, next_hearing: null, case_number: null,
    tags: ["family", "trust", "property"], last_activity: "30 min ago", ai_outputs_pending: 3
  },
  {
    id: "6", number: "LOS-2024-006", client: "MNO Infrastructure",
    case_type: "Tax", court: "ITAT Delhi", status: "closed_won",
    associate: "Priya Menon", next_hearing: null, case_number: "ITA-2024-088",
    tags: ["tax", "ITAT"], last_activity: "2 days ago", ai_outputs_pending: 0
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  intake:                { label: "Intake",          color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
  active:                { label: "Active",          color: "#06B6D4", bg: "rgba(6,182,212,0.1)"   },
  hearing_scheduled:     { label: "Hearing Set",     color: "#4F46E5", bg: "rgba(79,70,229,0.1)"  },
  arguments_pending:     { label: "Arguments",       color: "#D97706", bg: "rgba(217,119,6,0.1)"  },
  reserved_for_orders:   { label: "Reserved",        color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
  order_received:        { label: "Order In",        color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  closed_won:            { label: "Closed ✓",        color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  closed_lost:           { label: "Closed ✗",        color: "#EF4444", bg: "rgba(239,68,68,0.1)"  },
  closed_settled:        { label: "Settled",         color: "#10B981", bg: "rgba(16,185,129,0.1)" },
};

const FILTERS = ["All", "Active", "Hearings", "Arguments", "Intake", "Closed"];

export default function MattersPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [view, setView] = useState<"list" | "card">("list");

  const filtered = MATTERS.filter((m) => {
    const matchSearch = search === "" ||
      m.client.toLowerCase().includes(search.toLowerCase()) ||
      m.number.toLowerCase().includes(search.toLowerCase()) ||
      (m.case_number || "").toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "Active" && ["active", "hearing_scheduled"].includes(m.status)) ||
      (activeFilter === "Hearings" && m.status === "hearing_scheduled") ||
      (activeFilter === "Arguments" && m.status === "arguments_pending") ||
      (activeFilter === "Intake" && m.status === "intake") ||
      (activeFilter === "Closed" && m.status.startsWith("closed"));

    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Matters</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {MATTERS.length} matters · {MATTERS.filter(m => !m.status.startsWith("closed")).length} active
          </p>
        </div>
        <Link href="/dashboard/matters/new">
          <motion.button
            id="create-matter-btn"
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
            whileHover={{ scale: 1.02 }}
          >
            <Plus size={16} /> New Matter
          </motion.button>
        </Link>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="matters-search"
            className="form-input"
            style={{ paddingLeft: 38, width: "100%" }}
            placeholder="Search by client, matter number, case number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Filters */}
        <div style={{ display: "flex", gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              id={`filter-${f.toLowerCase()}`}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? "var(--accent-indigo)" : "var(--bg-card)",
                color: activeFilter === f ? "white" : "var(--text-secondary)",
                border: `1px solid ${activeFilter === f ? "var(--accent-indigo)" : "var(--border)"}`,
                borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s"
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Matters Table */}
      <motion.div
        className="table-container"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <table className="table">
          <thead>
            <tr>
              <th>Matter</th>
              <th>Client</th>
              <th>Court / Tribunal</th>
              <th>Status</th>
              <th>Next Hearing</th>
              <th>Associate</th>
              <th>AI Queue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((m, i) => {
                const statusConf = STATUS_CONFIG[m.status];
                return (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="font-mono" style={{ fontSize: 12, color: "var(--accent-indigo)", fontWeight: 600, marginBottom: 2 }}>
                        {m.number}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.case_number || "—"}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {m.tags.slice(0, 2).map(tag => (
                          <span key={tag} style={{
                            fontSize: 10, background: "var(--bg-elevated)",
                            color: "var(--text-muted)", borderRadius: 4, padding: "1px 6px"
                          }}>{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.client}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.case_type}</div>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Scale size={12} color="var(--accent-indigo)" />
                        {m.court}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: statusConf.bg, color: statusConf.color,
                        border: `1px solid ${statusConf.color}30`
                      }}>
                        {statusConf.label}
                      </span>
                    </td>
                    <td>
                      {m.next_hearing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                          <Calendar size={12} color="var(--accent-indigo)" />
                          {new Date(m.next_hearing).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {m.associate || <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}
                    </td>
                    <td>
                      {m.ai_outputs_pending > 0 ? (
                        <span className="badge badge-pending" style={{ fontSize: 10 }}>
                          <AlertCircle size={9} /> {m.ai_outputs_pending}
                        </span>
                      ) : (
                        <span className="badge badge-approved" style={{ fontSize: 10 }}>
                          <CheckCircle size={9} /> Clear
                        </span>
                      )}
                    </td>
                    <td>
                      <Link href={`/dashboard/matters/${m.id}`} style={{ textDecoration: "none" }}>
                        <motion.button
                          className="btn-ghost"
                          style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                          whileHover={{ x: 3 }}
                        >
                          Open <ChevronRight size={12} />
                        </motion.button>
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <Briefcase size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No matters found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
