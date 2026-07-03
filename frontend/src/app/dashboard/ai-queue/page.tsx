"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, X, Edit3, Clock, Zap, Shield, AlertTriangle, ChevronRight, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low:    { color: "#10B981", label: "Low Risk" },
  medium: { color: "#D97706", label: "Med Risk" },
  high:   { color: "#EF4444", label: "High Risk" },
};

export default function AIQueuePage() {
  const queryClient = useQueryClient();
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["aiQueue"],
    queryFn: () => api.getAiQueue(),
  });

  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (queue.length > 0 && !selected) {
      setSelected(queue[0]);
    } else if (queue.length === 0) {
      setSelected(null);
    }
  }, [queue, selected]);

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, finalContent }: { id: string, status: string, finalContent?: string }) => 
      api.reviewAiOutput(id, status, finalContent, undefined),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["aiQueue"] });
      if (variables.status === "approved") {
        toast.success("AI output approved — proceeding to dispatch");
      } else {
        toast.error("AI output rejected — discarded");
      }
      setSelected(null);
    }
  });

  const handleApprove = (id: string) => {
    reviewMutation.mutate({ id, status: "approved", finalContent: editing ? editContent : selected?.final_output || selected?.generated_content });
  };

  const handleReject = (id: string) => {
    reviewMutation.mutate({ id, status: "rejected" });
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading AI Queue...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
          <Brain size={24} color="var(--accent-gold)" /> AI Review Queue
          {queue.length > 0 && (
            <span className="badge badge-pending" style={{ fontSize: 12 }}>{queue.length} pending</span>
          )}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Review and approve all AI-generated outputs before they proceed. Nothing leaves without your approval.
        </p>
      </div>

      {queue.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ padding: 64, textAlign: "center" }}
        >
          <CheckCircle size={48} color="var(--accent-emerald)" style={{ marginBottom: 16, opacity: 0.8 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Queue is clear</h2>
          <p style={{ color: "var(--text-secondary)" }}>All AI outputs have been reviewed. Great work!</p>
        </motion.div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

          {/* Queue List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {queue.map((item: any) => {
              // Ensure we have valid risk
              const riskKey = ["low", "medium", "high"].includes(item.risk_level?.toLowerCase()) ? item.risk_level.toLowerCase() : "low";
              const rc = RISK_CONFIG[riskKey];

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => { setSelected(item); setEditing(false); }}
                  className="card"
                  style={{
                    padding: 16, cursor: "pointer",
                    border: selected?.id === item.id ? "1px solid var(--accent-indigo)" : "1px solid var(--border)",
                    background: selected?.id === item.id ? "rgba(79,70,229,0.07)" : "var(--bg-card)",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span className="badge badge-ai" style={{ fontSize: 10 }}>
                      <Zap size={9} /> {item.skill_name?.replace(/_/g, " ") || "Skill"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: rc.color }} />
                      <span style={{ fontSize: 10, color: rc.color, fontWeight: 600 }}>
                        {rc.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{item.matter?.client_name || "Matter"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={10} /> {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ""}
                  </div>
                  {selected?.id === item.id && <ChevronRight size={14} style={{ position: "absolute", right: 12, top: "50%", color: "var(--accent-indigo)" }} />}
                </motion.div>
              );
            })}
          </div>

          {/* Review Pane */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="ai-output-box"
                style={{ padding: "36px 32px", position: "sticky", top: 80 }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="badge badge-ai"><Zap size={10} /> {selected.skill_name?.replace(/_/g, " ") || "Skill"}</span>
                      {(() => {
                        const riskKey = ["low", "medium", "high"].includes(selected.risk_level?.toLowerCase()) ? selected.risk_level.toLowerCase() : "low";
                        const rc = RISK_CONFIG[riskKey];
                        return (
                          <span className="badge" style={{
                            background: `${rc.color}18`,
                            color: rc.color,
                            border: `1px solid ${rc.color}30`
                          }}>
                            {rc.label}
                          </span>
                        );
                      })()}
                    </div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{selected.matter?.client_name || "Matter"}</h2>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {selected.matter?.matter_number} · {selected.created_at ? new Date(selected.created_at).toLocaleString() : ""}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Model: {selected.model_used || "Unknown"}
                    </div>
                  </div>
                  <button
                    onClick={() => { setEditing(!editing); setEditContent(selected.final_output || selected.generated_content); }}
                    className="btn-secondary"
                    style={{ padding: "7px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <Edit3 size={12} /> {editing ? "Cancel Edit" : "Edit"}
                  </button>
                </div>

                {/* High risk warning */}
                {selected.risk_level?.toLowerCase() === "high" && (
                  <div style={{
                    padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 10, marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10
                  }}>
                    <AlertTriangle size={16} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-red)", marginBottom: 2 }}>High Risk Output</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        This output contains citations or statements flagged for verification. Review carefully before approving.
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                {editing ? (
                  <textarea
                    className="form-textarea"
                    style={{ width: "100%", minHeight: 360, fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1.7 }}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                  />
                ) : (
                  <div style={{
                    background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "20px 24px",
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, lineHeight: 1.8,
                    color: "var(--text-secondary)", whiteSpace: "pre-wrap", maxHeight: 460, overflowY: "auto"
                  }}>
                    {selected.final_output || selected.generated_content}
                  </div>
                )}

                {/* Actions */}
                <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <motion.button
                    id={`approve-${selected.id}`}
                    className="btn-primary"
                    style={{ background: "linear-gradient(135deg, #10B981, #059669)", display: "flex", alignItems: "center", gap: 7, padding: "10px 20px" }}
                    onClick={() => handleApprove(selected.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={reviewMutation.isPending}
                  >
                    <CheckCircle size={15} /> Approve & Proceed
                  </motion.button>

                  <motion.button
                    id={`reject-${selected.id}`}
                    className="btn-danger"
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px" }}
                    onClick={() => handleReject(selected.id)}
                    whileHover={{ scale: 1.02 }}
                    disabled={reviewMutation.isPending}
                  >
                    <X size={15} /> Reject
                  </motion.button>

                  <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 16px" }}>
                    <RefreshCw size={13} /> Regenerate
                  </button>
                </div>

                {/* Audit note */}
                <div style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Shield size={12} color="var(--accent-gold)" />
                  Your approval will be logged in the audit trail with your name, role, and timestamp
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
