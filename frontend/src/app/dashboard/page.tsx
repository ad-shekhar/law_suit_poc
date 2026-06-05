"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Briefcase, Calendar, Brain, Receipt, TrendingUp,
  Clock, CheckCircle, AlertTriangle, ArrowRight,
  Scale, FileText, Lock, Zap, Users
} from "lucide-react";
import { format } from "date-fns";

interface User { name: string; role: string; email: string; }

// Mock data — replace with real API calls
const MOCK_STATS_FOUNDER = [
  { label: "Active Matters", value: "24", change: "+3 this week", up: true, icon: Briefcase, color: "#4F46E5" },
  { label: "Today's Hearings", value: "3", change: "2 in HC, 1 NCLT", up: true, icon: Calendar, color: "#06B6D4" },
  { label: "AI Queue", value: "7", change: "Awaiting your review", up: false, icon: Brain, color: "#D97706" },
  { label: "Outstanding (₹)", value: "₹14.2L", change: "+₹2.5L this month", up: true, icon: Receipt, color: "#10B981" },
];

const MOCK_STATS_ASSOCIATE = [
  { label: "My Matters", value: "8", change: "3 with upcoming hearings", up: true, icon: Briefcase, color: "#4F46E5" },
  { label: "Today's Hearings", value: "2", change: "1 HC, 1 District Court", up: true, icon: Calendar, color: "#06B6D4" },
  { label: "Drafts Pending", value: "4", change: "Awaiting Founder review", up: false, icon: Brain, color: "#D97706" },
  { label: "Tasks Due", value: "6", change: "3 overdue", up: false, icon: Clock, color: "#EF4444" },
];

const MOCK_HEARINGS = [
  { id: "1", matter: "Rajesh Kumar v. ABC Infra", court: "Delhi HC — DB", time: "10:30 AM", judge: "Justice A. Sharma", matter_number: "OMP-2024-001", status: "upcoming" },
  { id: "2", matter: "Priya Estates Ltd", court: "NCLT — Principal Bench", time: "02:00 PM", judge: "Presiding Member", matter_number: "CP-2024-045", status: "upcoming" },
  { id: "3", matter: "Venkat vs State of Maharashtra", court: "Bombay HC", time: "11:00 AM", judge: "Justice B. Kumar", matter_number: "CRL-2024-012", status: "completed" },
];

const MOCK_AI_QUEUE = [
  { id: "1", skill: "Strategy Note", matter: "Rajesh Kumar v. ABC Infra", created: "2 hours ago", risk: "low" },
  { id: "2", skill: "Client Update Email", matter: "Priya Estates Ltd", created: "45 min ago", risk: "low" },
  { id: "3", skill: "Engagement Letter", matter: "New Matter — Sunita Devi", created: "1 hour ago", risk: "medium" },
  { id: "4", skill: "Invoice Draft", matter: "Tech Corp Arbitration", created: "3 hours ago", risk: "low" },
  { id: "5", skill: "Preliminary Research", matter: "Sharma Family Trust", created: "30 min ago", risk: "high" },
];

const MOCK_ACTIVITY = [
  { action: "Strategy note locked", matter: "Rajesh Kumar v. ABC Infra", user: "Arjun Sharma", time: "15 min ago", icon: Lock, color: "#D97706" },
  { action: "Hearing log added", matter: "Priya Estates Ltd", user: "Priya Menon", time: "1 hour ago", icon: Calendar, color: "#6366F1" },
  { action: "AI output approved", matter: "Tech Corp Arbitration", user: "Arjun Sharma", time: "2 hours ago", icon: CheckCircle, color: "#10B981" },
  { action: "New matter created", matter: "Sharma Family Trust", user: "Riya Singh", time: "3 hours ago", icon: Briefcase, color: "#06B6D4" },
  { action: "Document uploaded", matter: "Venkat vs State", user: "Vinay Gupta", time: "4 hours ago", icon: FileText, color: "#9CA3AF" },
];

const RISK_COLORS: Record<string, string> = { low: "#10B981", medium: "#D97706", high: "#EF4444" };

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", founder: "Founder", senior_associate: "Sr. Associate",
  associate: "Associate", paralegal: "Paralegal", client: "Client",
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  useEffect(() => {
    const stored = sessionStorage.getItem("legalos_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  if (!user) return null;

  const isFounder = ["founder", "admin"].includes(user.role);
  const isSenior = ["founder", "admin", "senior_associate"].includes(user.role);
  const stats = isFounder ? MOCK_STATS_FOUNDER : MOCK_STATS_ASSOCIATE;
  const firstName = user.name.split(" ")[0];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{today}</p>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
                <span className="text-gradient-indigo">{firstName}</span> 👋
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 6 }}>
                {ROLE_LABELS[user.role]} · {user.email}
              </p>
            </div>
            {isSenior && (
              <Link href="/dashboard/matters/new">
                <motion.button
                  id="new-matter-btn"
                  className="btn-primary"
                  style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <Briefcase size={15} /> New Matter
                </motion.button>
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Stats ── */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="stat-card"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.label}
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: `${s.color}18`, border: `1px solid ${s.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <s.icon size={16} color={s.color} />
              </div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-change ${s.up ? "stat-up" : "stat-down"}`}>
              {s.up ? "↑" : "↓"} {s.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Today's Hearings */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div style={{
              padding: "18px 24px", borderBottom: "1px solid var(--border)",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} color="var(--accent-indigo)" /> Today&apos;s Hearings
              </h2>
              <Link href="/dashboard/hearings" style={{ textDecoration: "none" }}>
                <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  View all <ArrowRight size={12} />
                </button>
              </Link>
            </div>
            {MOCK_HEARINGS.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                style={{
                  padding: "16px 24px",
                  borderBottom: i < MOCK_HEARINGS.length - 1 ? "1px solid var(--border)" : "none",
                  display: "flex", alignItems: "center", gap: 16,
                  transition: "background 0.15s", cursor: "pointer"
                }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <div style={{
                  textAlign: "center", minWidth: 52,
                  background: h.status === "completed" ? "rgba(107,114,128,0.1)" : "rgba(79,70,229,0.1)",
                  border: `1px solid ${h.status === "completed" ? "rgba(107,114,128,0.2)" : "rgba(79,70,229,0.25)"}`,
                  borderRadius: 8, padding: "6px 8px"
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: h.status === "completed" ? "var(--text-muted)" : "var(--accent-indigo)" }}>
                    {h.time.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{h.time.split(" ")[1]}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{h.matter}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                    <Scale size={11} />
                    {h.court}
                    <span style={{ color: "var(--border-strong)" }}>·</span>
                    <span className="font-mono" style={{ fontSize: 11 }}>{h.matter_number}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {h.status === "completed"
                    ? <span className="badge badge-approved" style={{ fontSize: 10 }}><CheckCircle size={9} /> Done</span>
                    : <span className="badge badge-pending" style={{ fontSize: 10 }}><Clock size={9} /> Upcoming</span>
                  }
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* AI Queue (Founder/Senior only) */}
          {isSenior && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="card"
              style={{ padding: 0, overflow: "hidden" }}
            >
              <div style={{
                padding: "18px 24px", borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <Brain size={16} color="var(--accent-gold)" />
                  AI Review Queue
                  <span className="badge badge-pending" style={{ fontSize: 10 }}>{MOCK_AI_QUEUE.length} pending</span>
                </h2>
                <Link href="/dashboard/ai-queue" style={{ textDecoration: "none" }}>
                  <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    Review all <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
              {MOCK_AI_QUEUE.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  style={{
                    padding: "14px 24px", borderBottom: i < MOCK_AI_QUEUE.length - 1 ? "1px solid var(--border)" : "none",
                    display: "flex", alignItems: "center", gap: 14, cursor: "pointer"
                  }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: RISK_COLORS[item.risk],
                    boxShadow: `0 0 6px ${RISK_COLORS[item.risk]}80`
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      <span className="badge badge-ai" style={{ fontSize: 10, marginRight: 8 }}>
                        <Zap size={9} /> {item.skill}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.matter}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.created}</div>
                  <Link href="/dashboard/ai-queue" style={{ textDecoration: "none" }}>
                    <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>Review</button>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Revenue (Founder only) */}
          {isFounder && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="card"
              style={{ padding: 20 }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={13} /> Revenue Snapshot
              </h3>
              {[
                { label: "Billed this month", value: "₹8,50,000", color: "var(--accent-emerald)" },
                { label: "Collected", value: "₹6,20,000", color: "var(--accent-indigo)" },
                { label: "Outstanding", value: "₹14,20,000", color: "var(--accent-gold)" },
                { label: "Overdue", value: "₹2,30,000", color: "var(--accent-red)" },
              ].map((item) => (
                <div key={item.label} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "10px 0",
                  borderBottom: "1px solid var(--border)"
                }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: item.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
            style={{ padding: 20 }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
              Recent Activity
            </h3>
            <div className="timeline">
              {MOCK_ACTIVITY.map((act, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 + i * 0.05 }}
                  className="timeline-item"
                >
                  <div className="timeline-dot" style={{ background: act.color, boxShadow: `0 0 6px ${act.color}60` }} />
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: "var(--text-primary)" }}>
                    {act.action}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{act.matter}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Users size={10} /> {act.user} · {act.time}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
            style={{ padding: 20 }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Quick Actions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Add Hearing Log", icon: Calendar, href: "/dashboard/hearings/new", show: true },
                { label: "Create New Matter", icon: Briefcase, href: "/dashboard/matters/new", show: isSenior },
                { label: "Generate Invoice", icon: Receipt, href: "/dashboard/invoices/new", show: isFounder },
                { label: "Upload Document", icon: FileText, href: "/dashboard/documents", show: true },
                { label: "View Audit Trail", icon: Scale, href: "/dashboard/audit", show: isFounder },
              ].filter(a => a.show).map((action) => (
                <Link key={action.label} href={action.href} style={{ textDecoration: "none" }}>
                  <motion.button
                    id={`quick-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className="btn-secondary"
                    style={{
                      width: "100%", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", fontSize: 13
                    }}
                    whileHover={{ x: 3 }}
                  >
                    <action.icon size={14} color="var(--accent-indigo)" />
                    {action.label}
                    <ArrowRight size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />
                  </motion.button>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
