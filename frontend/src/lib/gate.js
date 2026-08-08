const TOKEN_KEY = "gate_token";

export function getGateToken() {
  try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}
export function setGateToken(t) {
  try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ }
}
export function clearGateToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}
