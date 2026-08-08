import { DEFAULT_MODEL } from "./constants";

const KEY = "roleplay_sessions_v1";

// Video frames are huge in Base64 (~3–6 MB for a 10s clip) and would blow the browser's
// ~5 MB localStorage quota. We keep full frames in memory (for the current send) but persist
// only the lightweight thumbnail for videos. Image attachments (~100–400 KB) are kept as-is.
function sanitizeForStorage(store) {
  return {
    ...store,
    sessions: store.sessions.map((s) => ({
      ...s,
      messages: (s.messages || []).map((m) => ({
        ...m,
        attachments: (m.attachments || []).map((a) =>
          a.type === "video" ? { type: a.type, name: a.name, thumb: a.thumb } : a
        ),
      })),
    })),
  };
}

function uid() {
  return "s_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { sessions: [], activeId: null };
    return JSON.parse(raw);
  } catch {
    return { sessions: [], activeId: null };
  }
}

export function saveStore(store) {
  localStorage.setItem(KEY, JSON.stringify(sanitizeForStorage(store)));
}

export function newSession(model = DEFAULT_MODEL, tone = "fun_casual") {
  return {
    id: uid(),
    title: "New Chat",
    model,
    tone,
    messages: [],
    createdAt: Date.now(),
  };
}

export function getStorageBytes() {
  try {
    const raw = localStorage.getItem(KEY) || "";
    // 2 bytes per char is a safe upper bound for UTF-16 stored strings
    return raw.length;
  } catch {
    return 0;
  }
}

export function exportSessions() {
  const store = loadStore();
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `roleplay-sessions-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImport(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.sessions)) throw new Error("Invalid backup file");
  return data;
}
