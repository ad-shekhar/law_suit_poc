"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scale, Shield, Brain, FileText, BarChart3, Users,
  CheckCircle, ArrowRight, Star, Lock, Eye, Zap
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "13 AI Legal Skills",
    desc: "From matter intake extraction to invoice generation — purpose-built AI for Indian legal workflows.",
    color: "var(--accent-indigo)",
  },
  {
    icon: Shield,
    title: "Human-in-the-Loop",
    desc: "Nothing reaches your client without a human review. Every AI output is flagged for approval.",
    color: "var(--accent-gold)",
  },
  {
    icon: FileText,
    title: "Matter-Centric Design",
    desc: "Every document, hearing, invoice, and strategy traces back to a single matter record.",
    color: "var(--accent-emerald)",
  },
  {
    icon: Scale,
    title: "India-First Workflows",
    desc: "Built for Indian courts — SC, HC, NCLT, NCLAT, Tribunals. IBC, Arbitration, Civil, Criminal.",
    color: "var(--accent-cyan)",
  },
  {
    icon: BarChart3,
    title: "Founder Dashboard",
    desc: "Monday morning view — all matters, hearings, AI queue, and revenue at a glance.",
    color: "#A855F7",
  },
  {
    icon: Lock,
    title: "Full Audit Trail",
    desc: "Every AI action, human approval, document upload logged with timestamp and reviewer.",
    color: "var(--accent-red)",
  },
];

const roles = [
  { role: "Founder", desc: "Full access, all approvals, strategic view", color: "#D97706" },
  { role: "Senior Associate", desc: "Generate AI drafts, approve outputs", color: "#6366F1" },
  { role: "Associate", desc: "Hearing logs, drafts, document uploads", color: "#06B6D4" },
  { role: "Paralegal", desc: "Data entry, document management", color: "#10B981" },
  { role: "Client", desc: "Read-only matter status portal", color: "#9CA3AF" },
  { role: "Admin", desc: "Firm settings, user management, billing", color: "#EF4444" },
];

const stats = [
  { value: "13", label: "AI Skills" },
  { value: "6", label: "User Roles" },
  { value: "100%", label: "Audit Coverage" },
  { value: "0", label: "Autonomous AI Actions" },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* ── Nav ── */}
      <nav className="glass-strong" style={{
        position: "sticky", top: 0, zIndex: 50,
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Scale size={22} color="var(--accent-indigo)" strokeWidth={2.5} />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
            Legal<span style={{ color: "var(--accent-indigo)" }}>OS</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/auth/login">
            <button className="btn-ghost">Sign In</button>
          </Link>
          <Link href="/auth/login">
            <button className="btn-primary" style={{ padding: "8px 20px" }}>
              Request Demo
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: "100px 40px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="badge badge-ai" style={{ margin: "0 auto 24px", display: "inline-flex" }}>
            <Zap size={10} /> India&apos;s First AI-Native Legal OS
          </div>

          <h1 style={{
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: "-0.03em",
            marginBottom: 24,
            maxWidth: 900,
            margin: "0 auto 24px"
          }}>
            <span className="text-gradient">AI That </span>
            <span className="text-gradient-indigo">Lawyers Control</span>
          </h1>

          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "var(--text-secondary)",
            maxWidth: 580,
            margin: "0 auto 40px",
            lineHeight: 1.7
          }}>
            A complete practice operating system for Indian law firms.
            Every AI output is reviewed by a human before it reaches your client — always.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/auth/login">
              <motion.button
                className="btn-primary"
                style={{ padding: "14px 32px", fontSize: 16 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started Free <ArrowRight size={16} style={{ display: "inline", marginLeft: 6 }} />
              </motion.button>
            </Link>
            <Link href="/auth/login">
              <button className="btn-secondary" style={{ padding: "14px 32px", fontSize: 16 }}>
                <Eye size={16} style={{ display: "inline", marginRight: 6 }} />
                View Demo
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            display: "flex", justifyContent: "center", gap: 48,
            marginTop: 72, flexWrap: "wrap"
          }}
        >
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "var(--accent-indigo)" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Core Principle Banner ── */}
      <section style={{ padding: "0 40px 60px" }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="card"
          style={{
            maxWidth: 900, margin: "0 auto",
            background: "linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(217,119,6,0.08) 100%)",
            border: "1px solid rgba(79,70,229,0.3)",
            padding: "40px 48px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
            &ldquo;Nothing leaves your chambers without passing through a human hand.&rdquo;
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
            Our core design principle. LegalOS creates a legally defensible audit trail of every AI output,
            every human approval, and every document dispatched — compliant with Indian Bar Council ethics.
          </p>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: "60px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Everything a law firm needs
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
              Built for Indian legal workflows from the ground up
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20
          }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card"
                style={{ padding: 28, cursor: "default" }}
                whileHover={{ y: -4 }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${f.color}18`,
                  border: `1px solid ${f.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16
                }}>
                  <f.icon size={20} color={f.color} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section style={{ padding: "60px 40px", background: "var(--bg-secondary)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Every person in your firm has a role
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 16 }}>
              Role-differentiated access — the right information for the right person
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16
          }}>
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${r.color}25`,
                  borderRadius: 12,
                  padding: "20px",
                  borderTop: `3px solid ${r.color}`,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 15, color: r.color, marginBottom: 6 }}>{r.role}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{r.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Skills Preview ── */}
      <section style={{ padding: "60px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 12 }}>
              13 AI Skills, all human-verified
            </h2>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[
              "Matter Intake Extraction", "Preliminary Research", "Strategy Note",
              "Engagement Letter", "Document Query", "Clause Deviation Flagging",
              "Arguments Brief", "Legal Memo", "Hearing Summary",
              "Order Analysis", "Invoice Generation", "Client Update Email",
              "Matter Close Summary"
            ].map((skill, i) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCircle size={12} color="var(--accent-indigo)" />
                {skill}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "80px 40px", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ maxWidth: 600, margin: "0 auto" }}
        >
          <h2 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Ready to build your <span className="text-gradient-indigo">AI-powered practice?</span>
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 16, marginBottom: 32 }}>
            Start free. No credit card required. Set up your first matter in minutes.
          </p>
          <Link href="/auth/login">
            <motion.button
              className="btn-primary"
              style={{ padding: "16px 40px", fontSize: 17 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Building <ArrowRight size={18} style={{ display: "inline", marginLeft: 8 }} />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "24px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "var(--text-muted)",
        fontSize: 13,
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Scale size={16} color="var(--accent-indigo)" />
          <span><strong style={{ color: "var(--text-secondary)" }}>LegalOS</strong> — Human Generated, AI Assisted</span>
        </div>
        <div>Built for Indian law firms · © 2026</div>
      </footer>
    </div>
  );
}
