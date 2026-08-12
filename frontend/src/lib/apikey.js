const K = "openrouter_key";

export function getApiKey() {
  try { return localStorage.getItem(K) || ""; } catch { return ""; }
}
export function setApiKey(v) {
  try { localStorage.setItem(K, v); } catch { /* ignore */ }
}
export function clearApiKey() {
  try { localStorage.removeItem(K); } catch { /* ignore */ }
}
