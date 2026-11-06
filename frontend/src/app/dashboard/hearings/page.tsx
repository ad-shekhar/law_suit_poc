"use client";
import { motion } from "framer-motion";
import { Calendar, Plus, Clock, Scale, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Hearing } from "@/lib/types";
import { format } from "date-fns";

export default function HearingsPage() {
  const { data: hearings = [], isLoading } = useQuery({
    queryKey: ["allHearings"],
    queryFn: () => api.getHearings(),
  });

  const now = new Date();
  const upcoming = hearings.filter((h: Hearing) => new Date(h.hearing_date) >= now);
  const past = hearings.filter((h: Hearing) => new Date(h.hearing_date) < now);

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading hearings...</div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>Hearings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>{upcoming.length} upcoming · {past.length} completed</p>
        </div>
        <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}>
          <Plus size={16} /> Log Hearing
        </button>
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
        Upcoming
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {upcoming.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "20px 0" }}>No upcoming hearings.</div>
        ) : (
          upcoming.map((h: Hearing, i: number) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card"
              style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 20 }}
            >
              <div style={{
                textAlign: "center", minWidth: 56, padding: "10px",
                background: "rgba(79,70,229,0.1)", border: "1px solid rgba(79,70,229,0.2)", borderRadius: 10
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent-indigo)", lineHeight: 1 }}>
                  {new Date(h.hearing_date).getDate()}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {new Date(h.hearing_date).toLocaleDateString("en-IN", { month: "short" })}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{h.matter?.client_name || "Matter"}</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Scale size={12} />{h.matter?.court_name || h.court_room || "Court"}</span>
                  <span>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{format(new Date(h.hearing_date), "hh:mm a")}</span>
                  <span>·</span>
                  <span>{h.judge_name || "—"}</span>
                </div>
              </div>
              <span className="font-mono" style={{ fontSize: 12, color: "var(--accent-indigo)" }}>{h.matter?.matter_number || "—"}</span>
              <ChevronRight size={16} color="var(--text-muted)" />
            </motion.div>
          ))
        )}
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
        Past Hearings
      </h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th><th>Matter</th><th>Court</th><th>Outcome</th><th></th>
            </tr>
          </thead>
          <tbody>
            {past.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>No past hearings found.</td>
              </tr>
            ) : (
              past.map((h: Hearing, i: number) => (
                <motion.tr key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {new Date(h.hearing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{h.matter?.client_name || "Matter"}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: "var(--accent-indigo)" }}>{h.matter?.matter_number || "—"}</div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{h.matter?.court_name || h.court_room || "Court"}</td>
                  <td style={{ fontSize: 13 }}>{h.outcome || "—"}</td>
                  <td><button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>View</button></td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
