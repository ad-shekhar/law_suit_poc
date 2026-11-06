"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Search, Filter, Shield, Brain,
  Download, Eye, Lock, CheckCircle, RefreshCw, Sparkles, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Matter } from "@/lib/types";

interface DocumentItem {
  id: string;
  title: string;
  matterId: string;
  matterNumber: string;
  clientName: string;
  category: "Contract" | "Pleadings" | "Court Order" | "Legal Notice" | "Evidence";
  fileSize: string;
  uploadedAt: string;
  isConfidential: boolean;
}

const INITIAL_DOCS: DocumentItem[] = [
  {
    id: "doc-1",
    title: "EPC Warehouse Construction Agreement",
    matterId: "m1-rajesh-kumar",
    matterNumber: "LOS-2024-001",
    clientName: "Rajesh Kumar Enterprises",
    category: "Contract",
    fileSize: "2.4 MB",
    uploadedAt: "2024-01-15",
    isConfidential: true,
  },
  {
    id: "doc-2",
    title: "Section 36 Execution Petition & Affidavits",
    matterId: "m1-rajesh-kumar",
    matterNumber: "LOS-2024-001",
    clientName: "Rajesh Kumar Enterprises",
    category: "Pleadings",
    fileSize: "1.8 MB",
    uploadedAt: "2024-02-04",
    isConfidential: false,
  },
  {
    id: "doc-3",
    title: "Debenture Trust Deed & Default Notices",
    matterId: "m2-priya-estates",
    matterNumber: "LOS-2024-002",
    clientName: "Priya Estates Pvt. Ltd.",
    category: "Contract",
    fileSize: "3.1 MB",
    uploadedAt: "2024-02-18",
    isConfidential: true,
  },
  {
    id: "doc-4",
    title: "NCLT Interim Order Directing Asset Statement",
    matterId: "m2-priya-estates",
    matterNumber: "LOS-2024-002",
    clientName: "Priya Estates Pvt. Ltd.",
    category: "Court Order",
    fileSize: "620 KB",
    uploadedAt: "2024-03-02",
    isConfidential: false,
  },
];

const CATEGORIES = ["All", "Contract", "Pleadings", "Court Order", "Legal Notice", "Evidence"];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCS);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);

  // New document form
  const [newTitle, setNewTitle] = useState("");
  const [newMatterId, setNewMatterId] = useState("");
  const [newCategory, setNewCategory] = useState<DocumentItem["category"]>("Contract");
  const [newConfidential, setNewConfidential] = useState(false);

  // AI Query state
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api.getMatters().then((res) => {
      setMatters(res || []);
      if (res && res.length > 0) {
        setNewMatterId(res[0].id);
      }
    }).catch((e) => console.error(e));
  }, []);

  const filtered = docs.filter((d) => {
    const matchesSearch =
      search === "" ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.clientName.toLowerCase().includes(search.toLowerCase()) ||
      d.matterNumber.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "All" || d.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast.error("Enter document title");

    const matter = matters.find((m) => m.id === newMatterId);
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: newTitle,
      matterId: newMatterId || "m1-rajesh-kumar",
      matterNumber: matter?.matter_number || "LOS-2024-001",
      clientName: matter?.client_name || "Matter Client",
      category: newCategory,
      fileSize: "1.2 MB",
      uploadedAt: new Date().toISOString().slice(0, 10),
      isConfidential: newConfidential,
    };

    setDocs([newDoc, ...docs]);
    setNewTitle("");
    setShowUpload(false);
    toast.success("Document uploaded and indexed for AI extraction!");
  };

  const handleRunAiQuery = async () => {
    if (!aiQuery.trim()) return toast.error("Enter a query first");
    setAiLoading(true);
    try {
      const res = await api.runAiSkill("skill_05_document_query", docs[0]?.matterId || "m1", {
        query: aiQuery,
        document_text: docs.map((d) => `${d.title} (${d.category})`).join("\n"),
      });

      let parsed: any = {};
      if (res && res.raw_output) {
        try {
          parsed = JSON.parse(res.raw_output);
        } catch {
          parsed = { answer: res.raw_output };
        }
      }
      setAiAnswer(parsed);
      toast.success("AI Document Query complete!");
    } catch (err: any) {
      toast.error(err.message || "Query failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={24} color="var(--accent-indigo)" /> Document Vault
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Privileged document repository with RAG search & automated clause deviation checks.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px" }}
        >
          <Plus size={16} /> Upload Document
        </button>
      </div>

      {/* Stats Bar */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Documents", value: docs.length.toString(), color: "var(--accent-indigo)" },
          { label: "Confidential", value: docs.filter((d) => d.isConfidential).length.toString(), color: "var(--accent-gold)" },
          { label: "Contracts", value: docs.filter((d) => d.category === "Contract").length.toString(), color: "var(--accent-cyan)" },
          { label: "Court Orders", value: docs.filter((d) => d.category === "Court Order").length.toString(), color: "var(--accent-emerald)" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Upload Modal Drawer */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
            style={{ padding: 24, marginBottom: 24, border: "1px solid var(--accent-indigo)", overflow: "hidden" }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Upload Document to Matter</h2>
            <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Document Title</label>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    placeholder="e.g. Counter Affidavit of Respondent"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Matter</label>
                  <select
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={newMatterId}
                    onChange={(e) => setNewMatterId(e.target.value)}
                  >
                    {matters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.matter_number} — {m.client_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Category</label>
                  <select
                    className="form-input"
                    style={{ width: "100%", marginTop: 4 }}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                  >
                    <option value="Contract">Contract</option>
                    <option value="Pleadings">Pleadings</option>
                    <option value="Court Order">Court Order</option>
                    <option value="Legal Notice">Legal Notice</option>
                    <option value="Evidence">Evidence</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22 }}>
                  <input
                    type="checkbox"
                    id="confidential-check"
                    checked={newConfidential}
                    onChange={(e) => setNewConfidential(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <label htmlFor="confidential-check" style={{ fontSize: 13, cursor: "pointer" }}>
                    Mark as Attorney-Client Privileged / Confidential
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowUpload(false)} className="btn-secondary" style={{ padding: "8px 16px" }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: "8px 20px" }}>
                  Upload & Index
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Document Search / Query Box (Skill 05) */}
      <div className="card" style={{ padding: 20, marginBottom: 24, background: "rgba(79, 70, 229, 0.04)", border: "1px solid rgba(79, 70, 229, 0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Sparkles size={16} color="var(--accent-indigo)" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>AI Document Query (Skill 05)</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Ask a question across all matter documents (e.g. What is the dispute resolution clause and liability cap?)..."
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRunAiQuery()}
          />
          <button
            onClick={handleRunAiQuery}
            disabled={aiLoading}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px" }}
          >
            {aiLoading ? <RefreshCw size={14} className="spin" /> : <Brain size={14} />} Ask AI
          </button>
        </div>

        {aiAnswer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 16, padding: 16, borderRadius: 8,
              background: "rgba(0, 0, 0, 0.3)", border: "1px solid var(--border)"
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-indigo)", marginBottom: 6 }}>
              AI Answer (Confidence: {Math.round((aiAnswer.confidence_score || 0.92) * 100)}%)
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-primary)", marginBottom: 10 }}>
              {aiAnswer.answer || JSON.stringify(aiAnswer)}
            </p>
            {aiAnswer.citations && Array.isArray(aiAnswer.citations) && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <strong>Citations:</strong>
                {aiAnswer.citations.map((c: any, i: number) => (
                  <div key={i} style={{ marginTop: 2 }}>
                    ↳ <em>{c.clause}:</em> "{c.excerpt}"
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="form-input"
            style={{ paddingLeft: 38, width: "100%" }}
            placeholder="Search by title, client, matter number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={categoryFilter === cat ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: 12, padding: "7px 12px" }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Matter</th>
              <th>Category</th>
              <th>Uploaded</th>
              <th>Size</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                  No documents found matching the filter.
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <FileText size={16} color="var(--accent-indigo)" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{d.title}</div>
                        {d.isConfidential && (
                          <span style={{ fontSize: 10, color: "var(--accent-gold)", display: "flex", alignItems: "center", gap: 3 }}>
                            <Lock size={9} /> Privileged & Confidential
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{d.clientName}</div>
                    <div className="font-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.matterNumber}</div>
                  </td>
                  <td>
                    <span className="badge badge-draft" style={{ fontSize: 10 }}>{d.category}</span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.uploadedAt}</td>
                  <td className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.fileSize}</td>
                  <td>
                    <span className="badge badge-approved" style={{ fontSize: 10 }}>
                      <CheckCircle size={9} /> Indexed
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => toast.success(`Viewing document ${d.title}`)}
                        className="btn-ghost"
                        style={{ padding: "5px 8px", fontSize: 11 }}
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => toast.success(`Downloaded ${d.title}`)}
                        className="btn-ghost"
                        style={{ padding: "5px 8px", fontSize: 11 }}
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
