"use client";
import { motion } from "framer-motion";
import { Calendar, Plus, Clock, Scale, ChevronRight } from "lucide-react";

const HEARINGS = [
  { id: "1", date: "2024-06-10", matter: "Rajesh Kumar Enterprises v. ABC Infra", matter_number: "LOS-2024-001", court: "Delhi HC — Division Bench", judge: "Justice A. Sharma", time: "10:30 AM", status: "completed", outcome: "Counter-affidavit in 4 weeks" },
  { id: "2", date: "2024-06-10", matter: "Priya Estates Ltd", matter_number: "LOS-2024-002", court: "NCLT Principal Bench", judge: "Presiding Member Kumar", time: "02:00 PM", status: "completed", outcome: "RP directed to file plan by Aug 15" },
  { id: "3", date: "2024-07-08", matter: "Rajesh Kumar Enterprises v. ABC Infra", matter_number: "LOS-2024-001", court: "Delhi HC — Division Bench", judge: "Justice A. Sharma", time: "10:30 AM", status: "upcoming", outcome: null },
  { id: "4", date: "2024-07-15", matter: "Tech Corp International", matter_number: "LOS-2024-003", court: "Arbitral Tribunal", judge: "Arbitrator Panel", time: "11:00 AM", status: "upcoming", outcome: null },
  { id: "5", date: "2024-07-22", matter: "Priya Estates Ltd", matter_number: "LOS-2024-002", court: "NCLT Principal Bench", judge: "Presiding Member Kumar", time: "02:00 PM", status: "upcoming", outcome: null },
];

export default function HearingsPage() {
  const upcoming = HEARINGS.filter(h => h.status === "upcoming");
  const past = HEARINGS.filter(h => h.status === "completed");

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
        {upcoming.map((h, i) => (
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
                {new Date(h.date).getDate()}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {new Date(h.date).toLocaleDateString("en-IN", { month: "short" })}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{h.matter}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: "var(--text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Scale size={12} />{h.court}</span>
                <span>·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{h.time}</span>
                <span>·</span>
                <span>{h.judge}</span>
              </div>
            </div>
            <span className="font-mono" style={{ fontSize: 12, color: "var(--accent-indigo)" }}>{h.matter_number}</span>
            <ChevronRight size={16} color="var(--text-muted)" />
          </motion.div>
        ))}
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
            {past.map((h, i) => (
              <motion.tr key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <td className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{h.matter}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: "var(--accent-indigo)" }}>{h.matter_number}</div>
                </td>
                <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{h.court}</td>
                <td style={{ fontSize: 13 }}>{h.outcome}</td>
                <td><button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }}>View</button></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
