"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Shield, Mail, Award, CheckCircle, Lock } from "lucide-react";
import toast from "react-hot-toast";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "founder" | "senior_associate" | "associate" | "paralegal";
  barCouncilNumber?: string;
  assignedMatters: number;
  status: "active" | "invited";
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: "a1c5d96a-04bd-449e-8c38-89c0a6b7d5a5",
    name: "Arjun Sharma",
    email: "founder@legalos.dev",
    role: "founder",
    barCouncilNumber: "D/1248/2004",
    assignedMatters: 2,
    status: "active",
  },
  {
    id: "b2d6e07b-15ce-55af-9d49-90d1b7c8e6b6",
    name: "Priya Menon",
    email: "senior@legalos.dev",
    role: "senior_associate",
    barCouncilNumber: "D/3849/2012",
    assignedMatters: 2,
    status: "active",
  },
  {
    id: "c3e7f18c-26df-66b0-ae5a-01e2c8d9f7c7",
    name: "Riya Singh",
    email: "associate@legalos.dev",
    role: "associate",
    barCouncilNumber: "D/5120/2019",
    assignedMatters: 1,
    status: "active",
  },
  {
    id: "d4f8a29d-37ea-77c1-bf6b-12f3d9e0a8d8",
    name: "Vinay Gupta",
    email: "paralegal@legalos.dev",
    role: "paralegal",
    assignedMatters: 2,
    status: "active",
  },
  {
    id: "f6b0c4bf-59fc-99e3-d18d-34b5f1a2c0fa",
    name: "Admin User",
    email: "admin@legalos.dev",
    role: "admin",
    assignedMatters: 0,
    status: "active",
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Firm Admin",
  founder: "Founder / Sr. Advocate",
  senior_associate: "Senior Associate",
  associate: "Associate",
  paralegal: "Paralegal / Clerk",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "#EF4444",
  founder: "#D97706",
  senior_associate: "#6366F1",
  associate: "#06B6D4",
  paralegal: "#10B981",
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "associate" as TeamMember["role"],
    barCouncilNumber: "",
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error("Name and email are required");

    const newMember: TeamMember = {
      id: `user-${Date.now()}`,
      name: form.name,
      email: form.email,
      role: form.role,
      barCouncilNumber: form.barCouncilNumber || undefined,
      assignedMatters: 0,
      status: "invited",
    };

    setTeam([...team, newMember]);
    setForm({ name: "", email: "", role: "associate", barCouncilNumber: "" });
    setShowInviteModal(false);
    toast.success(`Invitation dispatched to ${form.email}!`);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={24} color="var(--accent-indigo)" /> Team & Permissions
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Manage advocates, associates, paralegals, and role-based approval rights.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
        >
          <Plus size={16} /> Invite Member
        </button>
      </div>

      {/* Team Table */}
      <div className="table-container" style={{ marginBottom: 32 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Bar Council Reg</th>
              <th>Assigned Matters</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Mail size={11} /> {m.email}
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: `${ROLE_COLORS[m.role]}18`,
                      color: ROLE_COLORS[m.role],
                      border: `1px solid ${ROLE_COLORS[m.role]}30`,
                      fontSize: 11
                    }}
                  >
                    {ROLE_LABELS[m.role]}
                  </span>
                </td>
                <td className="font-mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {m.barCouncilNumber || "—"}
                </td>
                <td style={{ fontSize: 13, fontWeight: 600 }}>{m.assignedMatters} matters</td>
                <td>
                  <span className={`badge badge-${m.status === "active" ? "approved" : "pending"}`} style={{ fontSize: 10 }}>
                    {m.status === "active" ? "Active" : "Invited"}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => toast.success(`Managing permissions for ${m.name}`)}
                    className="btn-ghost"
                    style={{ padding: "5px 10px", fontSize: 11 }}
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Capabilities Matrix */}
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <Shield size={16} color="var(--accent-indigo)" /> Role Permission Matrix
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
          Enforces Bar Council compliance: Associates draft; only Senior Advocates & Founders approve.
        </p>

        <div className="table-container">
          <table className="table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Admin</th>
                <th>Founder</th>
                <th>Sr. Associate</th>
                <th>Associate</th>
                <th>Paralegal</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cap: "Access All Firm Matters", admin: true, founder: true, sr: false, assoc: false, para: false },
                { cap: "Generate AI Drafts", admin: true, founder: true, sr: true, assoc: true, para: false },
                { cap: "Approve AI Review Queue", admin: true, founder: true, sr: true, assoc: false, para: false },
                { cap: "Lock Strategy Notes", admin: true, founder: true, sr: false, assoc: false, para: false },
                { cap: "Approve Invoices & Billing", admin: true, founder: true, sr: false, assoc: false, para: false },
                { cap: "Upload Matter Documents", admin: true, founder: true, sr: true, assoc: true, para: true },
                { cap: "View Immutable Audit Trail", admin: true, founder: true, sr: false, assoc: false, para: false },
              ].map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{row.cap}</td>
                  <td>{row.admin ? "✅" : "—"}</td>
                  <td>{row.founder ? "✅" : "—"}</td>
                  <td>{row.sr ? "✅" : "—"}</td>
                  <td>{row.assoc ? "✅" : "—"}</td>
                  <td>{row.para ? "✅" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card"
              style={{ width: "100%", maxWidth: 480, padding: 28 }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Invite Team Member</h2>
              <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Full Name</label>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Role</label>
                    <select
                      className="form-input"
                      style={{ width: "100%", marginTop: 4 }}
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    >
                      <option value="associate">Associate</option>
                      <option value="senior_associate">Senior Associate</option>
                      <option value="founder">Founder / Partner</option>
                      <option value="paralegal">Paralegal</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Bar Council Reg No.</label>
                    <input
                      placeholder="e.g. D/1234/2020"
                      className="form-input"
                      style={{ width: "100%", marginTop: 4 }}
                      value={form.barCouncilNumber}
                      onChange={(e) => setForm({ ...form, barCouncilNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary" style={{ padding: "8px 16px" }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: "8px 20px" }}>
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
