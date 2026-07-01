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
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { User, Hearing, AiOutput } from "@/lib/types";

interface Stat { label: string; value: string; color?: string; up?: boolean; change?: string; }
interface Activity { action: string; resource_type: string; user_name?: string; created_at?: string; }

const RISK_COLORS: Record<string, string> = { low: "#10B981", medium: "#D97706", high: "#EF4444" };

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", founder: "Founder", senior_associate: "Sr. Associate",
  associate: "Associate", paralegal: "Paralegal", client: "Client",
};

const ICON_MAP: Record<string, any> = {
  "Active Matters": Briefcase,
  "My Matters": Briefcase,
  "Today's Hearings": Calendar,
  "AI Queue": Brain,
  "Drafts Pending": Brain,
  "Outstanding (₹)": Receipt,
  "Tasks Due": Clock
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  useEffect(() => {
    const stored = sessionStorage.getItem("legalos_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch data using React Query
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["dashboardSummary", user?.id],
    queryFn: () => api.getDashboardSummary(),
    enabled: !!user?.id,
  });

  const { data: todayHearings, isLoading: isHearingsLoading } = useQuery({
    queryKey: ["todayHearings", user?.id],
    queryFn: () => api.getTodayHearings(),
    enabled: !!user?.id,
  });

  const { data: aiQueue, isLoading: isQueueLoading } = useQuery({
    queryKey: ["aiQueue", user?.id],
    queryFn: () => api.getAiQueue(),
    enabled: !!user?.id,
  });

  if (!user) return null;

  const isFounder = ["founder", "admin"].includes(user.role);
  const isSenior = ["founder", "admin", "senior_associate"].includes(user.role);
  const firstName = (user.full_name || (user as any).name || "User").split(" ")[0];

  const stats = summaryData?.stats || [];
  const activities = summaryData?.recent_activity || [];

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
        {isSummaryLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card" style={{ height: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="ai-thinking-dot" style={{ width: "60%", height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 8 }} />
              <div className="ai-thinking-dot" style={{ width: "40%", height: 20, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
            </div>
          ))
        ) : (
          stats.map((s: Stat, i: number) => {
            const IconComponent = ICON_MAP[s.label] || Briefcase;
            return (
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
                    background: `${s.color || "#4F46E5"}18`, border: `1px solid ${s.color || "#4F46E5"}25`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <IconComponent size={16} color={s.color || "#4F46E5"} />
                  </div>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className={`stat-change ${s.up ? "stat-up" : "stat-down"}`}>
                  {s.up ? "↑" : "↓"} {s.change}
                </div>
              </motion.div>
            );
          })
        )}
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
            {isHearingsLoading ? (
              <div style={{ padding: 24, textAlign: "center" }}>Loading hearings...</div>
            ) : !todayHearings || todayHearings.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No hearings listed for today
              </div>
            ) : (
              todayHearings.map((h: Hearing, i: number) => {
                const timeStr = h.hearing_date ? format(new Date(h.hearing_date), "hh:mm a") : "10:00 AM";
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                    style={{
                      padding: "16px 24px",
                      borderBottom: i < todayHearings.length - 1 ? "1px solid var(--border)" : "none",
                      display: "flex", alignItems: "center", gap: 16,
                      transition: "background 0.15s", cursor: "pointer"
                    }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    <div style={{
                      textAlign: "center", minWidth: 52,
                      background: h.outcome ? "rgba(107,114,128,0.1)" : "rgba(79,70,229,0.1)",
                      border: `1px solid ${h.outcome ? "rgba(107,114,128,0.2)" : "rgba(79,70,229,0.25)"}`,
                      borderRadius: 8, padding: "6px 8px"
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: h.outcome ? "var(--text-muted)" : "var(--accent-indigo)" }}>
                        {timeStr.split(" ")[0]}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{timeStr.split(" ")[1]}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>
                        {h.matter?.client_name || "Matter"}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                        <Scale size={11} />
                        {h.matter?.court_name || h.court_room || "Court"}
                        <span style={{ color: "var(--border-strong)" }}>·</span>
                        <span className="font-mono" style={{ fontSize: 11 }}>{h.matter?.matter_number || "—"}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {h.outcome
                        ? <span className="badge badge-approved" style={{ fontSize: 10 }}><CheckCircle size={9} /> Done</span>
                        : <span className="badge badge-pending" style={{ fontSize: 10 }}><Clock size={9} /> Upcoming</span>
                      }
                    </div>
                  </motion.div>
                );
              })
            )}
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
                  <span className="badge badge-pending" style={{ fontSize: 10 }}>{(aiQueue || []).length} pending</span>
                </h2>
                <Link href="/dashboard/ai-queue" style={{ textDecoration: "none" }}>
                  <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    Review all <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
              {isQueueLoading ? (
                <div style={{ padding: 24, textAlign: "center" }}>Loading AI reviews...</div>
              ) : !aiQueue || aiQueue.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  No pending AI drafts awaiting review
                </div>
              ) : (
                aiQueue.map((item: AiOutput, i: number) => {
                  const skillLabel = item.skill_name?.split("_").slice(2).join(" ") || item.skill_name;
                  const dateStr = item.created_at ? format(new Date(item.created_at), "h:mm a") : "Just now";
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      style={{
                        padding: "14px 24px", borderBottom: i < aiQueue.length - 1 ? "1px solid var(--border)" : "none",
                        display: "flex", alignItems: "center", gap: 14, cursor: "pointer"
                      }}
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: RISK_COLORS.low,
                        boxShadow: `0 0 6px ${RISK_COLORS.low}80`
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                          <span className="badge badge-ai" style={{ fontSize: 10, marginRight: 8, textTransform: "capitalize" }}>
                            <Zap size={9} /> {skillLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.matter?.client_name || "New Matter"}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{dateStr}</div>
                      <Link href="/dashboard/ai-queue" style={{ textDecoration: "none" }}>
                        <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>Review</button>
                      </Link>
                    </motion.div>
                  );
                })
              )}
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
              {activities.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>No recent activity logs</div>
              ) : (
                activities.map((act: Activity, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className="timeline-item"
                  >
                    <div className="timeline-dot" style={{ background: "var(--accent-indigo)", boxShadow: `0 0 6px var(--accent-indigo)60` }} />
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: "var(--text-primary)" }}>
                      {act.action?.replace(".", " ")}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{act.resource_type}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Users size={10} /> {act.user_name} · {act.created_at ? format(new Date(act.created_at), "h:mm a") : ""}
                    </div>
                  </motion.div>
                ))
              )}
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
