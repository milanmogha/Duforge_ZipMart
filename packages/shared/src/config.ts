/**
 * Single source of truth for backend endpoints.
 *
 * Every client previously hardcoded `http://localhost:8000`, which meant a
 * deploy required hand-editing ~30 call sites across four apps. Set
 * `VITE_API_URL` in each app's `.env` to point at a real backend; the
 * localhost default keeps local development working with no config.
 */

/** Read a Vite env var without exploding in non-Vite (Node/test) contexts. */
function readEnv(key: string): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  const value = env?.[key];
  return value && value.length > 0 ? value : undefined;
}

/** Backend origin, no trailing slash. Also the Socket.IO endpoint. */
export const SERVER_URL: string = (
  readEnv("VITE_API_URL") ?? "http://localhost:8000"
).replace(/\/+$/, "");

/** Backend REST root, e.g. `http://localhost:8000/api`. */
export const API_BASE_URL = `${SERVER_URL}/api`;

/** Socket.IO endpoint — same origin as the REST API. */
export const SOCKET_URL = SERVER_URL;

/** Build an absolute API URL from a path: `apiUrl("/support/request")`. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}
