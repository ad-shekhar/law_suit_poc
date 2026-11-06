"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, LayoutDashboard, Briefcase, Calendar, FileText,
  Receipt, Users, Shield, Settings, LogOut, Bell,
  ChevronRight, Menu, X, Brain, Search, Activity
} from "lucide-react";

interface User {
  email: string;
  role: string;
  name?: string;
  full_name?: string;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin","founder","senior_associate","associate","paralegal","client"] },
  { href: "/dashboard/matters", label: "Matters", icon: Briefcase, roles: ["admin","founder","senior_associate","associate","paralegal","client"] },
  { href: "/dashboard/hearings", label: "Hearings", icon: Calendar, roles: ["admin","founder","senior_associate","associate","paralegal"] },
  { href: "/dashboard/documents", label: "Documents", icon: FileText, roles: ["admin","founder","senior_associate","associate","paralegal"] },
  { href: "/dashboard/ai-queue", label: "AI Review Queue", icon: Brain, roles: ["admin","founder","senior_associate"] },
  { href: "/dashboard/invoices", label: "Invoices", icon: Receipt, roles: ["admin","founder","senior_associate"] },
  { href: "/dashboard/clients", label: "Clients", icon: Users, roles: ["admin","founder","senior_associate"] },
  { href: "/dashboard/audit", label: "Audit Trail", icon: Shield, roles: ["admin","founder"] },
  { href: "/dashboard/team", label: "Team", icon: Users, roles: ["admin"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["admin","founder"] },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin:            { label: "Admin",            color: "#EF4444", bg: "rgba(239,68,68,0.1)"    },
  founder:          { label: "Founder",          color: "#D97706", bg: "rgba(217,119,6,0.1)"    },
  senior_associate: { label: "Sr. Associate",    color: "#6366F1", bg: "rgba(99,102,241,0.1)"  },
  associate:        { label: "Associate",        color: "#06B6D4", bg: "rgba(6,182,212,0.1)"    },
  paralegal:        { label: "Paralegal",        color: "#10B981", bg: "rgba(16,185,129,0.1)"   },
  client:           { label: "Client",           color: "#9CA3AF", bg: "rgba(156,163,175,0.1)"  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications] = useState(3);

  useEffect(() => {
    const stored = sessionStorage.getItem("legalos_user");
    if (!stored) { router.push("/auth/login"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("legalos_user");
    router.push("/auth/login");
  };

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
      <div className="ai-thinking">
        <div className="ai-thinking-dots">
          <div className="ai-thinking-dot" />
          <div className="ai-thinking-dot" />
          <div className="ai-thinking-dot" />
        </div>
        Loading LegalOS...
      </div>
    </div>
  );

  const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.associate;
  const visibleNav = NAV_ITEMS.filter((n) => n.roles.includes(user.role));
  const initials = (user.full_name || user.name || "User").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 39 }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : undefined }}
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        style={{ zIndex: 40 }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <Scale size={20} color="var(--accent-indigo)" strokeWidth={2.5} />
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em" }}>
              Legal<span style={{ color: "var(--accent-indigo)" }}>OS</span>
            </span>
          </Link>
          <div style={{ marginTop: 12 }}>
            <span
              className="badge"
              style={{ background: roleConf.bg, color: roleConf.color, border: `1px solid ${roleConf.color}30`, fontSize: 10 }}
            >
              {roleConf.label}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          <div className="sidebar-section-label">Navigation</div>
          {visibleNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }} onClick={() => setSidebarOpen(false)}>
                <div className={`sidebar-nav-item ${active ? "active" : ""}`} id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <item.icon size={16} />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: `linear-gradient(135deg, ${roleConf.color}80, ${roleConf.color})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name || user.name || "User"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
            </div>
            <button
              id="logout-button"
              onClick={handleLogout}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="main-content" style={{ flex: 1 }}>
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="btn-ghost"
              style={{ padding: 8, display: "none" }}
              onClick={() => setSidebarOpen(true)}
              id="menu-toggle"
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-muted)" }}>
              <Scale size={14} color="var(--accent-indigo)" />
              <span>LegalOS</span>
              <ChevronRight size={12} />
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                {visibleNav.find(n => pathname.startsWith(n.href) || pathname === n.href)?.label || "Dashboard"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8, padding: "7px 14px",
              fontSize: 13, color: "var(--text-muted)"
            }}>
              <Search size={14} />
              <span>Search matters...</span>
              <span style={{ fontSize: 10, background: "var(--bg-elevated)", padding: "2px 6px", borderRadius: 4 }}>⌘K</span>
            </div>

            {/* Notifications */}
            <button
              id="notifications-btn"
              style={{
                position: "relative", background: "var(--bg-card)",
                border: "1px solid var(--border)", borderRadius: 8,
                padding: "7px 10px", cursor: "pointer", color: "var(--text-secondary)"
              }}
            >
              <Bell size={16} />
              {notifications > 0 && (
                <span style={{
                  position: "absolute", top: 4, right: 4,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--accent-red)", border: "2px solid var(--bg-secondary)"
                }} />
              )}
            </button>

            {/* Activity */}
            <button style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: "var(--text-secondary)"
            }}>
              <Activity size={16} />
            </button>
          </div>
        </div>

        {/* Page content */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="page-content"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
