"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Mail, Phone, Building, Briefcase,
  Search, ExternalLink, CheckCircle, Shield
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface ClientRecord {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  activeMattersCount: number;
  totalBilled: string;
  outstanding: string;
  primaryCounsel: string;
}

const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: "c-1",
    name: "Rajesh Kumar",
    company: "Rajesh Kumar Enterprises Pvt. Ltd.",
    email: "rajesh@rkenterprises.com",
    phone: "+91-9876543210",
    activeMattersCount: 1,
    totalBilled: "₹4,13,000",
    outstanding: "₹1,77,000",
    primaryCounsel: "Arjun Sharma (Founder)",
  },
  {
    id: "c-2",
    name: "Priya Menon",
    company: "Priya Estates Pvt. Ltd.",
    email: "legal@priyaestates.in",
    phone: "+91-9811223344",
    activeMattersCount: 1,
    totalBilled: "₹3,50,000",
    outstanding: "₹0",
    primaryCounsel: "Priya Menon (Sr. Associate)",
  },
  {
    id: "c-3",
    name: "Vikram Malhotra",
    company: "Malhotra Logistics Corp",
    email: "vikram@malhotralogistics.com",
    phone: "+91-9988776655",
    activeMattersCount: 2,
    totalBilled: "₹6,20,000",
    outstanding: "₹2,10,000",
    primaryCounsel: "Arjun Sharma (Founder)",
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>(INITIAL_CLIENTS);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    primaryCounsel: "Arjun Sharma (Founder)",
  });

  const filtered = clients.filter(
    (c) =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      return toast.error("Client name and email are required");
    }

    const newClient: ClientRecord = {
      id: `c-${Date.now()}`,
      name: form.name,
      company: form.company || form.name,
      email: form.email,
      phone: form.phone || "+91-9000000000",
      activeMattersCount: 0,
      totalBilled: "₹0",
      outstanding: "₹0",
      primaryCounsel: form.primaryCounsel,
    };

    setClients([newClient, ...clients]);
    setForm({ name: "", company: "", email: "", phone: "", primaryCounsel: "Arjun Sharma (Founder)" });
    setShowAddModal(false);
    toast.success("New client registered! Client portal invitation generated.");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={24} color="var(--accent-indigo)" /> Clients
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Client contacts, matter associations, billing history, and client portal credentials.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Clients", value: clients.length.toString(), color: "var(--accent-indigo)" },
          { label: "Active Matters", value: clients.reduce((s, c) => s + c.activeMattersCount, 0).toString(), color: "var(--accent-emerald)" },
          { label: "Portal Enabled", value: `${clients.length}/${clients.length}`, color: "var(--accent-cyan)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: "relative", maxWidth: 360 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="form-input"
            style={{ paddingLeft: 38, width: "100%" }}
            placeholder="Search by client name, organization, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Client Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
        {filtered.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{c.name}</h3>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Building size={11} /> {c.company}
                  </div>
                </div>
                <span className="badge badge-approved" style={{ fontSize: 10 }}>Portal Active</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={12} color="var(--text-muted)" /> {c.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={12} color="var(--text-muted)" /> {c.phone}
                </div>
              </div>

              <div style={{
                background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Active Matters</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-indigo)" }}>{c.activeMattersCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Billed</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.totalBilled}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Outstanding</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.outstanding === "₹0" ? "var(--accent-emerald)" : "var(--accent-gold)" }}>
                    {c.outstanding}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Lead: {c.primaryCounsel.split(" ")[0]}
              </span>
              <Link href="/dashboard/matters" style={{ textDecoration: "none" }}>
                <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  View Matters <ExternalLink size={11} />
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              style={{ width: "100%", maxWidth: 500, padding: 28, position: "relative" }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Register New Client</h2>
              <form onSubmit={handleAddClient} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Client / Contact Name</label>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Company / Entity Name</label>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Email</label>
                    <input
                      type="email"
                      className="form-input"
                      style={{ width: "100%", marginTop: 4 }}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Phone</label>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginTop: 4 }}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ padding: "8px 16px" }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: "8px 20px" }}>
                    Register & Invite
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
