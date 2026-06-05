"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Briefcase, Search, Filter, Plus, ArrowRight,
  Scale, Calendar, Clock, ChevronRight, Tag,
  AlertCircle, CheckCircle, FileText, Users
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Matter } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  intake:                { label: "Intake",          color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
  active:                { label: "Active",          color: "#06B6D4", bg: "rgba(6,182,212,0.1)"   },
  pending_docs:          { label: "Pending Docs",    color: "#D97706", bg: "rgba(217,119,6,0.1)"   },
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

  const { data: matters = [], isLoading } = useQuery({
    queryKey: ["matters", activeFilter, search],
    queryFn: () => {
      // Map filter to backend status if needed
      let statusQuery = undefined;
      if (activeFilter === "Active") statusQuery = "active";
      if (activeFilter === "Hearings") statusQuery = "hearing_scheduled";
      if (activeFilter === "Arguments") statusQuery = "arguments_pending";
      if (activeFilter === "Intake") statusQuery = "intake";
      // We will perform client-side filtering on other statuses or pass search filter
      return api.getMatters({
        status: statusQuery,
        search: search || undefined
      });
    }
  });

  // Client side filters for "Closed" since it has multiple roles
  const filtered = matters.filter((m: Matter) => {
    if (activeFilter === "Closed") {
      return m.status?.startsWith("closed") || m.status === "archived";
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Matters</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {filtered.length} matters · {filtered.filter((m: Matter) => !m.status?.startsWith("closed")).length} active
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
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-dot" />
            <span className="ai-thinking-dot" />
            <p style={{ marginTop: 12, color: "var(--text-secondary)", fontSize: 14 }}>Loading matters...</p>
          </div>
        ) : (
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
                {filtered.map((m: Matter, i: number) => {
                  const statusConf = STATUS_CONFIG[m.status] || { label: m.status, color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" };
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
                          {m.matter_number}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.case_number || "—"}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                          {(m.tags || []).slice(0, 2).map((tag: string) => (
                            <span key={tag} style={{
                              fontSize: 10, background: "var(--bg-elevated)",
                              color: "var(--text-muted)", borderRadius: 4, padding: "1px 6px"
                            }}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.client_name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>
                          {m.case_type?.replace("_", " ")}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Scale size={12} color="var(--accent-indigo)" />
                          {m.court_name || m.court}
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
                        {m.next_hearing_date ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                            <Calendar size={12} color="var(--accent-indigo)" />
                            {new Date(m.next_hearing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        {m.assigned_associate_id === "c3e7f18c-26df-66b0-ae5a-01e2c8d9f7c7" ? "Riya Singh" : m.assigned_associate_id === "b2d6e07b-15ce-55af-9d49-90d1b7c8e6b6" ? "Priya Menon" : "Unassigned"}
                      </td>
                      <td>
                        <span className="badge badge-approved" style={{ fontSize: 10 }}>
                          <CheckCircle size={9} /> Clear
                        </span>
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
        )}

        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            <Briefcase size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No matters found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
