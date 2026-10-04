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

// TODO(L2-07): Decode a data-channel payload into a MiraEvent.
//   - bytes → string with utf8() → JSON.parse
//   - return null for invalid JSON, non-objects, or unknown `type` (never throw: one bad packet must not crash the UI)
//   Common mistake: JSON.parse without try/catch → red screen the first time the server ships a new event type.
//   Terms: data channel, payload, schema/contract, forward compatibility. Test: npm test -- events
export function parseEvent(payload: Uint8Array): MiraEvent | null {
  // @sol-start L2-07
  try {
    const obj = JSON.parse(utf8(payload));
    if (!obj || typeof obj !== 'object' || !TYPES.has(obj.type)) return null;
    return obj as MiraEvent;
  } catch {
    return null;
  }
  // @sol-end
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

// TODO(L2-08): Pure reducer: (state, event) → new state. Do not mutate `state`.
//   - transcript → append a Line (skip empty text). Keep at most 200 lines (old ones dropped).
//   - latency    → push totalMs to latencies AND attach latencyMs to the LAST assistant line that has none
//   - safety     → safetyAlert = flagged (stays true once flagged during the call), lastSafetyMs = ms
//   - memory     → append fact to newFacts
//   - pipeline   → set pipeline
//   Common mistake: `state.lines.push(...)` → React doesn't re-render (same reference).
//   Terms: immutable update, reducer, derived state. Test: npm test -- events
export function reduceCall(state: CallState, ev: MiraEvent): CallState {
  // @sol-start L2-08
  switch (ev.type) {
    case 'transcript': {
      if (!ev.text.trim()) return state;
      const line: Line = { role: ev.role, text: ev.text, interrupted: ev.interrupted, at: ev.at };
      return { ...state, lines: [...state.lines, line].slice(-200) };
    }
    case 'latency': {
      const lines = [...state.lines];
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].role === 'assistant' && lines[i].latencyMs == null) {
          lines[i] = { ...lines[i], latencyMs: ev.totalMs };
          break;
        }
      }
      return { ...state, lines, latencies: [...state.latencies, ev.totalMs] };
    }
    case 'safety':
      return { ...state, safetyAlert: state.safetyAlert || ev.flagged, lastSafetyMs: ev.ms };
    case 'memory':
      return { ...state, newFacts: [...state.newFacts, ev.fact] };
    case 'pipeline':
      return { ...state, pipeline: ev.pipeline };
  }
  // @sol-end
}

export function p50p95(xs: number[]): { p50: number; p95: number } | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const at = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { p50: at(0.5), p95: at(0.95) };
}
