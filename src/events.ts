// Same contract as mira-voice-demo-api/src/events.ts — keep them in sync.
export const EVENTS_TOPIC = 'mira.events';

export type MiraEvent =
  | { type: 'transcript'; role: 'user' | 'assistant'; text: string; interrupted: boolean; at: number }
  | { type: 'latency'; speechId: string; eouMs: number; ttftMs: number; ttfbMs: number; totalMs: number }
  | { type: 'safety'; flagged: boolean; layer: string; ms: number }
  | { type: 'memory'; fact: string }
  | { type: 'pipeline'; pipeline: 'cascaded' | 'realtime' };

// Hermes has no guaranteed TextDecoder — tiny UTF-8 decoder (handles Turkish characters).
export function utf8(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b = bytes[i++];
    if (b < 0x80) out += String.fromCharCode(b);
    else if (b < 0xe0) out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
    else if (b < 0xf0) out += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
    else {
      const cp = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      out += String.fromCodePoint(cp);
    }
  }
  return out;
}

const TYPES = new Set(['transcript', 'latency', 'safety', 'memory', 'pipeline']);

// Decodes a data-channel payload. Returns null (never throws) for bad JSON or unknown event types.
export function parseEvent(payload: Uint8Array): MiraEvent | null {
  try {
    const obj: unknown = JSON.parse(utf8(payload));
    if (typeof obj !== 'object' || obj === null) return null;
    const type = (obj as { type?: unknown }).type;
    // Unknown type = a newer server: ignore it instead of crashing (forward compatibility).
    return typeof type === 'string' && TYPES.has(type) ? (obj as MiraEvent) : null;
  } catch {
    return null; // one bad packet must never crash the UI
  }
}

export type Line = { role: 'user' | 'assistant'; text: string; interrupted: boolean; at: number; latencyMs?: number };
export type CallState = {
  pipeline?: 'cascaded' | 'realtime';
  lines: Line[];
  latencies: number[];
  safetyAlert: boolean;
  lastSafetyMs?: number;
  newFacts: string[];
};
export const initialCallState: CallState = { lines: [], latencies: [], safetyAlert: false, newFacts: [] };

// Pure reducer: (state, event) → new state, never mutates `state`.
const MAX_LINES = 200;

export function reduceCall(state: CallState, ev: MiraEvent): CallState {
  switch (ev.type) {
    case 'transcript': {
      if (!ev.text.trim()) return state; // same reference = no re-render
      const line: Line = { role: ev.role, text: ev.text, interrupted: ev.interrupted, at: ev.at };
      return { ...state, lines: [...state.lines, line].slice(-MAX_LINES) };
    }
    case 'latency': {
      // Attach to the most recent assistant line that has no latency yet.
      let i = state.lines.length - 1;
      while (i >= 0 && !(state.lines[i].role === 'assistant' && state.lines[i].latencyMs === undefined)) i--;
      const lines = i < 0 ? state.lines : state.lines.map((l, j) => (j === i ? { ...l, latencyMs: ev.totalMs } : l));
      return { ...state, lines, latencies: [...state.latencies, ev.totalMs] };
    }
    case 'safety':
      // Once raised, the alert stays for the rest of the call.
      return { ...state, safetyAlert: state.safetyAlert || ev.flagged, lastSafetyMs: ev.ms };
    case 'memory':
      return { ...state, newFacts: [...state.newFacts, ev.fact] };
    case 'pipeline':
      return { ...state, pipeline: ev.pipeline };
  }
}

export function p50p95(xs: number[]): { p50: number; p95: number } | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const at = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { p50: at(0.5), p95: at(0.95) };
}
