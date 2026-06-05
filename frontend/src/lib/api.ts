/**
 * LegalOS Frontend API Client
 */
import { User, Matter, Hearing, Invoice, AiOutput, DashboardSummary } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (typeof window !== "undefined") {
    const storedUser = sessionStorage.getItem("legalos_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          headers["X-User-Id"] = user.id;
        }
      } catch (e) {
        console.error("Error parsing stored user for API headers", e);
      }
    }
  }
  
  return headers;
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch {
      // Not JSON
    }
    throw new Error(errorJson?.detail || errorText || `API Error: ${response.status}`);
  }

  // Handle file downloads or empty responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/csv")) {
    return response as any;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as any);
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest<User>("/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
    
  getUsers: () => apiRequest<User[]>("/api/v1/users"),
  
  // Matters
  getMatters: (filters?: { status?: string; case_type?: string; court?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
    }
    const query = params.toString();
    return apiRequest<Matter[]>(`/api/v1/matters${query ? `?${query}` : ""}`);
  },
  
  getMatter: (id: string) => apiRequest<Matter>(`/api/v1/matters/${id}`),
  
  createMatter: (data: Partial<Matter>) =>
    apiRequest("/api/v1/matters", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  updateMatterStatus: (id: string, status: string) =>
    apiRequest<Matter>(`/api/v1/matters/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Dashboard
  getDashboardSummary: () => apiRequest<DashboardSummary>("/api/v1/dashboard/summary"),
  getTodayHearings: () => apiRequest<Hearing[]>("/api/v1/dashboard/hearings/today"),
  getAiQueue: () => apiRequest<AiOutput[]>("/api/v1/dashboard/ai-queue"),

  // Strategy Note
  getStrategy: (matterId: string) => apiRequest(`/api/v1/matters/${matterId}/strategy`),
  generateStrategy: (matterId: string, transcript: string) =>
    apiRequest(`/api/v1/matters/${matterId}/strategy/generate`, {
      method: "POST",
      body: JSON.stringify({ discussion_transcript: transcript }),
    }),
  lockStrategy: (matterId: string) =>
    apiRequest(`/api/v1/matters/${matterId}/strategy/lock`, {
      method: "POST",
    }),

  // Hearings
  getHearings: (matterId?: string) =>
    matterId ? apiRequest<Hearing[]>(`/api/v1/matters/${matterId}/hearings`) : apiRequest<Hearing[]>("/api/v1/hearings"),
  logHearing: (matterId: string, data: Partial<Hearing>) =>
    apiRequest(`/api/v1/matters/${matterId}/hearings`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  approveClientUpdate: (hearingId: string) =>
    apiRequest(`/api/v1/hearings/${hearingId}/client-update/approve`, {
      method: "POST",
    }),

  // Invoices
  getInvoices: (matterId?: string) =>
    matterId ? apiRequest<Invoice[]>(`/api/v1/matters/${matterId}/invoices`) : apiRequest<Invoice[]>("/api/v1/invoices"),
  createInvoice: (matterId: string, data: Partial<Invoice>) =>
    apiRequest(`/api/v1/matters/${matterId}/invoices`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  approveInvoice: (invoiceId: string) =>
    apiRequest(`/api/v1/invoices/${invoiceId}/approve`, {
      method: "POST",
    }),

  // AI Skills generic
  getAiSkillsQueue: () => apiRequest<AiOutput[]>("/api/v1/ai-skills/queue"),
  runAiSkill: (skillName: string, matterId: string, inputData: Record<string, unknown>) =>
    apiRequest("/api/v1/ai-skills/run", {
      method: "POST",
      body: JSON.stringify({ skill_name: skillName, matter_id: matterId, input_data: inputData }),
    }),
  reviewAiOutput: (outputId: string, status: string, finalOutput?: string, notes?: string) =>
    apiRequest(`/api/v1/ai-skills/${outputId}/review`, {
      method: "POST",
      body: JSON.stringify({ review_status: status, final_output: finalOutput, review_notes: notes }),
    }),

  // Audit Logs
  getAuditLogs: (matterId?: string) =>
    apiRequest(`/api/v1/audit${matterId ? `?matter_id=${matterId}` : ""}`),
  exportAuditLogsUrl: (matterId?: string) =>
    `${BACKEND_URL}/api/v1/audit/export${matterId ? `?matter_id=${matterId}` : ""}`
};
