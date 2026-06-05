"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Scale, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// Demo accounts for POC — no real auth needed
const DEMO_ACCOUNTS = [
  { email: "founder@legalos.dev", password: "demo1234", role: "founder", name: "Arjun Sharma" },
  { email: "senior@legalos.dev", password: "demo1234", role: "senior_associate", name: "Priya Menon" },
  { email: "associate@legalos.dev", password: "demo1234", role: "associate", name: "Riya Singh" },
  { email: "paralegal@legalos.dev", password: "demo1234", role: "paralegal", name: "Vinay Gupta" },
  { email: "client@legalos.dev", password: "demo1234", role: "client", name: "Rajesh Kumar" },
  { email: "admin@legalos.dev", password: "demo1234", role: "admin", name: "Admin User" },
];

const ROLE_LABELS: Record<string, string> = {
  founder: "Founder / Senior Advocate",
  senior_associate: "Senior Associate",
  associate: "Associate",
  paralegal: "Paralegal",
  client: "Client",
  admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  founder: "#D97706",
  senior_associate: "#6366F1",
  associate: "#06B6D4",
  paralegal: "#10B981",
  client: "#9CA3AF",
  admin: "#EF4444",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dbUser = await api.login(email, password);
      // Store in sessionStorage for POC
      sessionStorage.setItem("legalos_user", JSON.stringify(dbUser));
      toast.success(`Welcome back, ${dbUser.full_name.split(" ")[0]}!`);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Use a demo account below.");
    } finally {
      setLoading(false);
    }
  };

  const loginAs = async (account: typeof DEMO_ACCOUNTS[0]) => {
    try {
      toast.loading(`Logging in as ${account.name}...`, { id: "login-toast" });
      const dbUser = await api.login(account.email, account.password);
      sessionStorage.setItem("legalos_user", JSON.stringify(dbUser));
      toast.success(`Logged in as ${dbUser.full_name}!`, { id: "login-toast" });
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to login as demo user", { id: "login-toast" });
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "var(--bg-primary)",
    }}>
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 48px",
          maxWidth: 520,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", marginBottom: 48, display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Scale size={24} color="var(--accent-indigo)" strokeWidth={2.5} />
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>
            Legal<span style={{ color: "var(--accent-indigo)" }}>OS</span>
          </span>
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          Sign in to your workspace
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 36 }}>
          Human Generated, AI Assisted — every time.
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-muted)"
              }} />
              <input
                id="email-input"
                type="email"
                className="form-input"
                style={{ paddingLeft: 42, width: "100%" }}
                placeholder="you@legalos.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-muted)"
              }} />
              <input
                id="password-input"
                type={showPw ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: 42, paddingRight: 42, width: "100%" }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)"
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            id="login-button"
            type="submit"
            className="btn-primary"
            style={{ padding: "13px", fontSize: 15, width: "100%", marginTop: 4 }}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span className="ai-thinking-dot" />
                <span className="ai-thinking-dot" />
                <span className="ai-thinking-dot" />
              </span>
            ) : (
              <>Sign In <ArrowRight size={15} style={{ display: "inline", marginLeft: 6 }} /></>
            )}
          </motion.button>
        </form>

        {/* Demo Accounts */}
        <div style={{ marginTop: 40 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 16
          }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={12} /> DEMO ACCOUNTS
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <motion.button
                key={acc.email}
                id={`demo-${acc.role}`}
                whileHover={{ x: 4 }}
                onClick={() => loginAs(acc)}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${ROLE_COLORS[acc.role]}25`,
                  borderLeft: `3px solid ${ROLE_COLORS[acc.role]}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{acc.name}</div>
                  <div style={{ fontSize: 11, color: ROLE_COLORS[acc.role], fontWeight: 600 }}>
                    {ROLE_LABELS[acc.role]}
                  </div>
                </div>
                <ArrowRight size={14} color="var(--text-muted)" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel — Hero Visual */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0D1220 0%, #111827 50%, #0D1220 100%)",
          borderLeft: "1px solid var(--border)",
          padding: 60,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow orb */}
        <div style={{
          position: "absolute", width: 400, height: 400,
          background: "radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)",
          top: "30%", left: "40%", transform: "translate(-50%, -50%)",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 440 }}>
          <Scale size={56} color="var(--accent-indigo)" style={{ marginBottom: 28, opacity: 0.9 }} />

          <h2 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 20 }}>
            The practice OS that keeps the lawyer in control
          </h2>

          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            Every AI output starts as a draft. You review, edit, and approve. Your signature, your judgment — AI just does the heavy lifting.
          </p>

          {/* Feature bullets */}
          {[
            "Matter-centric, India-first design",
            "Role-differentiated views for every team member",
            "Gemini-powered with full audit trail",
            "DPDP Act compliant by architecture",
          ].map((item) => (
            <div key={item} style={{
              display: "flex", alignItems: "center", gap: 10,
              marginBottom: 12, textAlign: "left"
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(79,70,229,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-indigo)" }} />
              </div>
              <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
