// Server-Sent Events consumer. The Go backend uses POST for SSE (intake report,
// agent tool-call trace, weekly bulletin), so we can't use the native EventSource
// (which only does GET). This wraps fetch + ReadableStream and parses the
// `event:` / `data:` lines into typed callbacks.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface SseMessage<T = unknown> {
  event: string;
  data: T;
}

export interface StreamSseOptions<T = unknown> {
  /** Path on the backend (e.g. "/api/agent") OR a full URL. */
  url: string;
  /** JSON body (object) or FormData. Sent via POST. */
  body?: unknown;
  /** Extra headers — Content-Type / Accept set automatically. */
  headers?: Record<string, string>;
  /** AbortSignal to cancel the stream early. */
  signal?: AbortSignal;
  /** Called once per parsed `event:` block. */
  onEvent: (ev: SseMessage<T>) => void;
  /** Optional fatal-error callback. */
  onError?: (err: Error) => void;
  /** Called once when the stream ends cleanly. */
  onDone?: () => void;
}

/**
 * Open an SSE connection and stream messages until the server closes the
 * response or the AbortSignal fires. Returns a promise that resolves when
 * the stream ends (cleanly or via abort) and rejects on transport error
 * BEFORE the first byte (after that, errors go to onError).
 */
export async function streamSse<T = unknown>(opts: StreamSseOptions<T>): Promise<void> {
  const { url, body, headers = {}, signal, onEvent, onError, onDone } = opts;
  const fullUrl = url.startsWith("http") ? url : API_URL + url;

  const fetchHeaders: Record<string, string> = {
    Accept: "text/event-stream",
    ...headers,
  };

  let fetchBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      fetchBody = body;
    } else {
      fetchHeaders["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body);
    }
  }

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: fetchBody,
      credentials: "include",
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`sse ${res.status}: ${text}`);
  }
  if (!res.body) {
    throw new Error("sse: empty response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const msg = parseSseBlock<T>(block);
        if (msg) {
          try {
            onEvent(msg);
          } catch (e) {
            console.error("sse: onEvent threw", e);
          }
        }
      }
    }
    onDone?.();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    onError?.(err as Error);
  } finally {
    reader.releaseLock();
  }
}

function parseSseBlock<T>(block: string): SseMessage<T> | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith(":")) continue; // SSE comment
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;
  const dataStr = dataLines.join("\n");
  let data: unknown = dataStr;
  if (dataStr.startsWith("{") || dataStr.startsWith("[")) {
    try {
      data = JSON.parse(dataStr);
    } catch {
      // keep as string
    }
  }
  return { event, data: data as T };
}

// ---------------------------------------------------------------------------
// Convenience helpers — typed wrappers around the three SSE endpoints.
// ---------------------------------------------------------------------------

export interface AgentToolCall {
  id: string;
  name: string;
  args: unknown;
  result?: string;
  error?: string;
  duration_ms: number;
}

export interface AgentSseEvent {
  phase?: "iter" | "call_start" | "call_complete" | "answer";
  iter?: number;
  tool_call?: AgentToolCall;
  answer?: string;
}

export function streamAgent(
  question: string,
  handlers: {
    onIter?: (iter: number) => void;
    onCallStart?: (call: AgentToolCall) => void;
    onCallComplete?: (call: AgentToolCall) => void;
    onAnswer?: (text: string) => void;
    onSummary?: (payload: { answer: string; trace: AgentToolCall[] }) => void;
    onError?: (err: Error) => void;
    onDone?: () => void;
  },
  signal?: AbortSignal,
): Promise<void> {
  return streamSse<AgentSseEvent | { answer: string; trace: AgentToolCall[] } | { error: string }>({
    url: "/api/agent",
    body: { question },
    signal,
    onEvent: (msg) => {
      switch (msg.event) {
        case "iter": {
          const d = msg.data as AgentSseEvent;
          if (d.iter) handlers.onIter?.(d.iter);
          break;
        }
        case "call_start": {
          const d = msg.data as AgentSseEvent;
          if (d.tool_call) handlers.onCallStart?.(d.tool_call);
          break;
        }
        case "call_complete": {
          const d = msg.data as AgentSseEvent;
          if (d.tool_call) handlers.onCallComplete?.(d.tool_call);
          break;
        }
        case "answer": {
          const d = msg.data as AgentSseEvent;
          if (d.answer) handlers.onAnswer?.(d.answer);
          break;
        }
        case "summary": {
          handlers.onSummary?.(msg.data as { answer: string; trace: AgentToolCall[] });
          break;
        }
        case "error": {
          const d = msg.data as { error: string };
          handlers.onError?.(new Error(d.error));
          break;
        }
        case "done":
          handlers.onDone?.();
          break;
      }
    },
    onError: handlers.onError,
  });
}

export interface ReportMeta {
  incident_id: string;
  category: string;
  severity: string;
  title_fr: string;
  title_ar: string;
  playbook_id: string;
  loi_18_07: boolean;
  language_order: string[];
}

export function streamReport(
  incidentId: string,
  handlers: {
    onMeta?: (meta: ReportMeta) => void;
    onToken?: (text: string) => void;
    onDone?: (payload: { chars: number; resolved_now: boolean }) => void;
    onError?: (err: Error) => void;
  },
  signal?: AbortSignal,
): Promise<void> {
  return streamSse({
    url: `/api/incident/${incidentId}/report`,
    body: {},
    signal,
    onEvent: (msg) => {
      switch (msg.event) {
        case "meta":
          handlers.onMeta?.(msg.data as ReportMeta);
          break;
        case "token":
          handlers.onToken?.((msg.data as { text: string }).text);
          break;
        case "done":
          handlers.onDone?.(msg.data as { chars: number; resolved_now: boolean });
          break;
        case "error":
          handlers.onError?.(new Error((msg.data as { error: string }).error));
          break;
      }
    },
    onError: handlers.onError,
  });
}

export function streamBulletin(
  handlers: {
    onMeta?: (meta: { week: string; stats: unknown }) => void;
    onToken?: (text: string) => void;
    onDone?: (payload: { chars: number }) => void;
    onError?: (err: Error) => void;
  },
  signal?: AbortSignal,
): Promise<void> {
  return streamSse({
    url: "/api/bulletin",
    body: {},
    signal,
    onEvent: (msg) => {
      switch (msg.event) {
        case "meta":
          handlers.onMeta?.(msg.data as { week: string; stats: unknown });
          break;
        case "token":
          handlers.onToken?.((msg.data as { text: string }).text);
          break;
        case "done":
          handlers.onDone?.(msg.data as { chars: number });
          break;
        case "error":
          handlers.onError?.(new Error((msg.data as { error: string }).error));
          break;
      }
    },
    onError: handlers.onError,
  });
}
