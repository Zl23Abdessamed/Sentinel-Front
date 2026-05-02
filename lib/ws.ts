// Singleton WebSocket client. The whole app shares one connection — this is
// the right shape for SENTINEL.DZ because every screen wants the same live
// feed (incidents created, crisis triggered, unlock approved, etc.).
//
// All real WebSocket work happens in the browser; this module is safe to
// import from server components because instantiation is lazy.

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

// Application-level event types broadcast by the Go backend's ws.Hub. Lifecycle
// pseudo-events use a leading underscore so callers can subscribe to connection
// state changes without colliding with real broadcast types.
export type WsEventType =
  | "INCIDENT_CREATED"
  | "INCIDENT_ACKNOWLEDGED"
  | "INCIDENT_ESCALATED"
  | "INCIDENT_CLOSED"
  | "REPORT_GENERATED"
  | "CRISIS_TRIGGERED"
  | "WHISPER_CREATED"
  | "WHISPER_SIGNAL"
  | "UNLOCK_REQUESTED"
  | "UNLOCK_APPROVED"
  | "_open"
  | "_close"
  | "_error"
  | "*"; // wildcard

export interface WsEvent<T = unknown> {
  type: string;
  data: T;
}

type Listener = (ev: WsEvent) => void;

class WsClient {
  private url: string;
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectAttempt = 0;
  private maxBackoffMs = 30_000;
  private shouldReconnect = true;
  private connecting: Promise<void> | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect(): Promise<void> {
    if (typeof window === "undefined") {
      // No-op on SSR — components must call connect() inside useEffect.
      return Promise.resolve();
    }
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.connecting) return this.connecting;

    this.shouldReconnect = true;
    this.connecting = new Promise<void>((resolve, reject) => {
      let resolved = false;
      try {
        const ws = new WebSocket(this.url);
        this.ws = ws;

        ws.onopen = () => {
          this.reconnectAttempt = 0;
          this.connecting = null;
          this.notify({ type: "_open", data: { url: this.url } });
          resolved = true;
          resolve();
        };

        ws.onmessage = (msg) => {
          try {
            const ev = JSON.parse(msg.data) as WsEvent;
            this.notify(ev);
          } catch (e) {
            console.error("ws: bad message", e);
          }
        };

        ws.onerror = (e) => {
          this.notify({ type: "_error", data: { error: String(e) } });
        };

        ws.onclose = () => {
          this.ws = null;
          this.connecting = null;
          this.notify({ type: "_close", data: { reconnecting: this.shouldReconnect } });
          if (this.shouldReconnect) this.scheduleReconnect();
          if (!resolved) reject(new Error("ws closed before opening"));
        };
      } catch (e) {
        this.connecting = null;
        reject(e);
      }
    });
    return this.connecting;
  }

  disconnect() {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }

  /**
   * Subscribe to a WS event type. Pass "*" to receive every event.
   * Returns an unsubscribe function — call it from useEffect cleanup.
   */
  on<T = unknown>(type: WsEventType | string, listener: (ev: WsEvent<T>) => void): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener as Listener);
    return () => {
      set?.delete(listener as Listener);
    };
  }

  isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private notify(ev: WsEvent) {
    this.listeners.get(ev.type)?.forEach((l) => {
      try { l(ev); } catch (e) { console.error("ws listener", e); }
    });
    if (ev.type !== "*") {
      this.listeners.get("*")?.forEach((l) => {
        try { l(ev); } catch (e) { console.error("ws listener", e); }
      });
    }
  }

  private scheduleReconnect() {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, this.maxBackoffMs);
    this.reconnectAttempt += 1;
    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(() => { /* will trigger another scheduleReconnect via onclose */ });
      }
    }, delay);
  }
}

let _client: WsClient | null = null;

/**
 * Get the process-wide WS client. Lazily constructs on first call so SSR
 * imports stay safe. Components must call .connect() inside useEffect.
 */
export function getWsClient(): WsClient {
  if (!_client) _client = new WsClient(WS_URL);
  return _client;
}
