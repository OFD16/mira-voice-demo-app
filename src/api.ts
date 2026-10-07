import { API_URL, DEMO_API_KEY } from './config';
import type { Lang } from './locale';

export type Pipeline = 'cascaded' | 'realtime';
export type SessionInfo = { serverUrl: string; roomName: string; token: string };
export type MemoryRow = { id: string; fact: string; created_at: string };

const headers = () => ({ 'content-type': 'application/json', 'x-demo-key': DEMO_API_KEY });

/** fetch with a timeout — mobile networks hang instead of failing. */
async function call(path: string, init: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${API_URL}${path}`, { ...init, headers: headers(), signal: ctrl.signal });
  } catch (e) {
    throw new Error(`Cannot reach API at ${API_URL} (${String(e)}). See src/config.ts for emulator/phone URLs.`);
  } finally {
    clearTimeout(t);
  }
}

// Asks OUR API for a LiveKit session. The app never signs tokens itself.
export async function fetchSession(userId: string, pipeline: Pipeline, lang: Lang): Promise<SessionInfo> {
  const res = await call('/session', { method: 'POST', body: JSON.stringify({ userId, pipeline, lang }) });
  if (!res.ok) throw new Error(`session failed: ${res.status}`);
  return res.json();
}

export async function fetchMemories(userId: string): Promise<{ memories: MemoryRow[]; enabled: boolean }> {
  const res = await call(`/memories/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`memories failed: ${res.status}`);
  return res.json();
}

export async function deleteMemory(userId: string, id: string): Promise<void> {
  const res = await call(`/memories/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`delete failed: ${res.status}`);
}
