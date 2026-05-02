// Backend fetch wrapper. JWT lives in an httpOnly cookie set by /api/auth/login,
// so every request goes out with `credentials: 'include'`. The browser sends
// the cookie back automatically — no Authorization header to manage from JS.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

type FetchOpts = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Query;
};

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const fullUrl = path.startsWith("http") ? path : API_URL + path;
  const url = new URL(fullUrl);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((opts.headers as Record<string, string> | undefined) ?? {}),
  };

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (opts.body instanceof FormData) {
      // Browser sets multipart Content-Type with the right boundary — don't override.
      body = opts.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
  }

  const res = await fetch(url.toString(), {
    ...opts,
    body,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    let detail: unknown;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      detail = await res.json().catch(() => undefined);
    } else {
      detail = await res.text().catch(() => undefined);
    }
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, detail);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: Omit<FetchOpts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<FetchOpts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<FetchOpts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<FetchOpts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: Omit<FetchOpts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
  postFormData: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData }),
};

export const apiBaseUrl = API_URL;

// ---------------------------------------------------------------------------
// Backend wire types — kept here (rather than a separate types.ts) so api.ts
// imports stay flat for callers. Mirrors GORM structs in backend/internal/domain.
// ---------------------------------------------------------------------------

export type Severity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus =
  | "ACTIVE"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "ESCALATED"
  | "ARCHIVED";
export type IncidentCategory =
  | "PHISHING"
  | "LOST_DEVICE"
  | "RANSOMWARE"
  | "CREDENTIAL_LEAK"
  | "SUSPICIOUS_LOGIN"
  | "ACCOUNT_TAKEOVER"
  | "MALWARE"
  | "BUSINESS_EMAIL_COMPROMISE"
  | "WHISPER"
  | "OTHER";
export type ReportingChannel = "WEB" | "TELEGRAM" | "BOOKMARKLET";

export interface Incident {
  id: string;
  reporter_id_hash: string;
  reporter_revealed: boolean;
  channel: ReportingChannel;
  category: IncidentCategory;
  severity: Severity;
  title_fr: string;
  title_ar: string;
  summary_fr: string;
  summary_ar: string;
  raw_darija_transcript?: string;
  raw_fr_transcript?: string;
  raw_ar_transcript?: string;
  affected_user_email?: string;
  affected_asset_id?: string;
  matched_campaign?: string;
  sla_minutes: number;
  playbook_id: string;
  decision_tree_path: string; // JSON string
  grace_period_flag: boolean;
  workflow_steps: string; // JSON string
  escalation_chain: string; // JSON string
  regulatory_refs: string; // JSON string
  loi_18_07_triggered: boolean;
  loi_18_07_deadline_at?: string | null;
  counter_ai_score: number;
  ai_disagreement: boolean;
  injection_detected: boolean;
  status: IncidentStatus;
  mode: "STANDARD" | "CRISIS";
  confidence: number;
  created_at: string;
  acknowledged_at?: string | null;
  closed_at?: string | null;
}

export interface AuditEvent {
  id: string;
  incident_id: string;
  actor_id_hash: string;
  action: string;
  payload: string;
  prev_hash: string;
  hash: string;
  created_at: string;
}

export interface WhisperWindow {
  id: string;
  incident_id: string;
  department: string;
  institution_id: string;
  opened_at: string;
  expires_at: string;
  status: "ACTIVE" | "EXPIRED" | "ESCALATED";
  correlating_signals: string;
}

export interface User {
  id: string;
  email: string;
  role: "ADMIN" | "WORKER" | "MANAGER";
  name?: string;
  department_id?: string;
  institution_id?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  institution_id: string;
  created_at: string;
}

export interface IntakeResponse {
  incident: Incident;
  needs_clarification: boolean;
  clarifying_questions?: string[];
  injection_detected: boolean;
  ai_disagreement: boolean;
  counter_ai_score: number;
  decision_tree_path?: string[];
  playbook_id: string;
}

// ---------------------------------------------------------------------------
// Endpoint helpers — thin wrappers around api.* so callers don't repeat paths.
// ---------------------------------------------------------------------------

export const sentinel = {
  intake: (body: {
    text: string;
    reporter_id: string;
    channel: ReportingChannel;
    whisper_mode?: boolean;
    institution?: string;
    department?: string;
    affected_user_email?: string;
    raw_darija_transcript?: string;
    raw_fr_transcript?: string;
    raw_ar_transcript?: string;
    estimated_event_time?: string;
  }) => api.post<IntakeResponse>("/api/intake", body),

  transcribe: (audio: Blob, language: "ar" | "fr" | "en" = "ar", filename = "voice.webm") => {
    const fd = new FormData();
    fd.append("file", audio, filename);
    fd.append("language", language);
    return api.postFormData<{ transcript: string; language: string; source: string }>(
      "/api/transcribe",
      fd,
    );
  },

  listIncidents: (limit = 100) =>
    api.get<{ count: number; incidents: Incident[] }>("/api/incidents", { query: { limit } }),
  getIncident: (id: string) => api.get<Incident>(`/api/incident/${id}`),
  ack: (id: string, actor = "system") =>
    api.post<{ ok: boolean; incident_id: string; status: IncidentStatus }>(
      `/api/incident/${id}/ack`,
      { actor },
    ),
  close: (id: string, actor = "system") =>
    api.post<{ ok: boolean; incident_id: string; status: IncidentStatus }>(
      `/api/incident/${id}/close`,
      { actor },
    ),
  report: (id: string, actor = "system") =>
    api.post<{ ok: boolean; incident_id: string; report: string }>(
      `/api/incident/${id}/report`,
      { actor },
    ),
  escalate: (id: string, actor = "system", reason = "") =>
    api.post<{ ok: boolean; incident_id: string; status: IncidentStatus }>(
      `/api/incident/${id}/escalate`,
      { actor, reason },
    ),

  blackbox: {
    list: (q?: { incident_id?: string; action?: string; since?: string; limit?: number; order?: "asc" | "desc" }) =>
      api.get<{ count: number; events: AuditEvent[] }>("/api/blackbox", { query: q }),
    verify: (incidentId?: string) =>
      api.get<{ ok: boolean; event_count?: number; incidents_verified?: number; total_events?: number; failures?: string[] }>(
        "/api/blackbox/verify",
        { query: incidentId ? { incident_id: incidentId } : undefined },
      ),
    exportUrl: () => `${API_URL}/api/blackbox/export`,
  },

  whispers: {
    list: () => api.get<{ count: number; windows: WhisperWindow[] }>("/api/whispers"),
    get: (id: string) => api.get<WhisperWindow>(`/api/whisper/${id}`),
    signal: (id: string, payload: unknown) => api.post<{ ok: boolean; signal_id: string }>(`/api/whisper/${id}/signal`, payload),
  },

  agent: (query: string, context?: unknown) => api.post<{ response: string }>("/api/agent", { query, context }),
  bulletin: () => api.post<{ bulletin: string }>("/api/bulletin"),

  unlock: {
    state: (id: string) =>
      api.get<{ exists: boolean; unlock_request?: unknown; approvers_count?: number; min_approvers?: number }>(
        `/api/incident/${id}/unlock`,
      ),
    request: (id: string, requesterId: string, reason = "") =>
      api.post<{ ok: boolean; unlock_request: unknown }>(`/api/incident/${id}/unlock-request`, {
        requester_id: requesterId,
        reason,
      }),
    approve: (id: string, approverId: string, role: "RSSI" | "DPO" | "HR_HEAD") =>
      api.post<{
        ok: boolean;
        approvers_count: number;
        min_approvers: number;
        approved: boolean;
        reporter_id_raw?: string;
      }>(`/api/incident/${id}/unlock-approve`, { approver_id: approverId, role }),
  },

  velocityScan: () => api.post<{ ok: boolean }>("/api/velocity/scan"),

  admin: {
    addDepartment: (name: string, institutionId?: string) =>
      api.post<{ ok: boolean; department: Department }>("/api/admin/departments", { name, institution_id: institutionId }),
    addWorker: (body: { email: string; name: string; role: string; department_id?: string; password?: string }) =>
      api.post<{ ok: boolean; user: User }>("/api/admin/workers", body),
    listWorkers: () => api.get<{ count: number; workers: User[] }>("/api/admin/workers"),
    listDepartments: () => api.get<{ count: number; departments: Department[] }>("/api/admin/departments"),
  },

  auth: {
    signupAdmin: (email: string, password: string, name: string, institution?: string) =>
      api.post<{ ok: boolean; user: User }>("/api/auth/admin-signup", { email, password, name, institution, role: "ADMIN" }),
    login: (email: string, password: string) =>
      api.post<{ ok: boolean; user: User; expires_at: string }>("/api/auth/login", { email, password }),
    logout: () => api.post<{ ok: boolean }>("/api/auth/logout"),
    me: () => api.get<User>("/api/auth/me"),
  },

  panic: (body: {
    url: string;
    user_agent?: string;
    language?: string;
    timezone?: string;
    screenshot_base64?: string;
    optional_text?: string;
    reporter_id: string;
    department?: string;
    institution?: string;
  }) => api.post<IntakeResponse>("/api/panic", body),

  health: () =>
    api.get<{
      status: string;
      service: string;
      version: string;
      ws_clients: number;
      groq_configured: boolean;
      db_path: string;
    }>("/healthz"),
};
