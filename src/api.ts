import { API_URL, DEMO_API_KEY } from './config';

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

// TODO(L2-05): Ask OUR API for a LiveKit session. The app never creates tokens itself.
//   - POST `/session` with JSON body { userId, pipeline } via call()
//   - !res.ok → throw Error(`session failed: ${res.status}`) (401 = wrong DEMO_API_KEY, 400 = bad userId)
//   - return the parsed SessionInfo
//   Common mistake: bundling the LiveKit server SDK into the app and signing tokens with the API secret.
//   Terms: token server, client/server trust boundary. Test: npm test -- api
export async function fetchSession(userId: string, pipeline: Pipeline): Promise<SessionInfo> {
  throw new Error('TODO(L2-05) — see docs/LESSONS.md');
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
