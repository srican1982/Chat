import { useEffect, useMemo, useRef, useState } from "react";
import "@/App.css";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatPane } from "@/components/ChatPane";
import { Composer } from "@/components/Composer";
import { PrivacyModal } from "@/components/PrivacyModal";
import { LockScreen } from "@/components/LockScreen";
import { DEFAULT_MODEL, DEFAULT_TONE, STORAGE_WARN_BYTES } from "@/lib/constants";
import {
  loadStore, saveStore, newSession, getStorageBytes, exportSessions, parseImport,
} from "@/lib/storage";
import { getGateToken, clearGateToken } from "@/lib/gate";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function toApiMessages(msgs) {
  return msgs.map((m) => {
    if (!m.attachments || m.attachments.length === 0) {
      return { role: m.role, content: m.text };
    }
    const content = [];
    if (m.text) content.push({ type: "text", text: m.text });
    m.attachments.forEach((a) => {
      (a.frames || [a.thumb]).forEach((url) => {
        content.push({ type: "image_url", image_url: { url } });
      });
    });
    return { role: m.role, content };
  });
}

function App() {
  const [store, setStore] = useState(() => loadStore());
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [storageBytes, setStorageBytes] = useState(getStorageBytes());
  const [locked, setLocked] = useState(null); // null = checking, true = show lock, false = unlocked
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  const warnedRef = useRef(false);
  const initRef = useRef(false);

  // Track viewport for a single (non-duplicated) sidebar render.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Check whether the password gate is enabled and whether we already hold a token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${API}/auth/status`);
        const data = await resp.json();
        if (cancelled) return;
        if (data.gate_enabled && !getGateToken()) setLocked(true);
        else setLocked(false);
      } catch {
        if (!cancelled) setLocked(false); // fail open to avoid hard lockout on network hiccup
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Ensure there's always an active session on first load.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (store.sessions.length === 0) {
      const s = newSession();
      persist({ sessions: [s], activeId: s.id });
    } else if (!store.activeId || !store.sessions.find((s) => s.id === store.activeId)) {
      persist({ ...store, activeId: store.sessions[0].id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAndTrack = (next) => {
    try {
      saveStore(next);
      const bytes = getStorageBytes();
      setStorageBytes(bytes);
      if (bytes > STORAGE_WARN_BYTES && !warnedRef.current) {
        warnedRef.current = true;
        toast.error("Local storage over 4 MB — approaching the ~5 MB browser limit", {
          description: "Export a backup and clear old sessions. Tip: video frames aren't saved (only a thumbnail), so history stays light.",
          duration: 9000,
        });
      }
      if (bytes <= STORAGE_WARN_BYTES) warnedRef.current = false;
    } catch (e) {
      toast.error("Storage quota exceeded", {
        description: "Your browser storage is full. Clear a session to continue.",
      });
    }
  };

  const persist = (next) => {
    setStore(next);
    saveAndTrack(next);
  };

  const active = useMemo(
    () => store.sessions.find((s) => s.id === store.activeId) || null,
    [store]
  );

  // Functional update so async callers (e.g. streaming) always read the latest state,
  // preventing stale-closure writes that would revert the auto-title.
  const updateActive = (updater) => {
    setStore((prev) => {
      const next = {
        ...prev,
        sessions: prev.sessions.map((s) => (s.id === prev.activeId ? updater(s) : s)),
      };
      saveAndTrack(next);
      return next;
    });
  };

  // Session controls
  const handleNew = () => {
    // Don't pile up empty "New Chat" duplicates — reuse the current one if it's empty.
    if (active && active.messages.length === 0) {
      setMobileSidebar(false);
      return;
    }
    const s = newSession(active?.model || DEFAULT_MODEL, active?.tone || DEFAULT_TONE);
    persist({ sessions: [s, ...store.sessions], activeId: s.id });
    setMobileSidebar(false);
  };
  const handleSwitch = (id) => { persist({ ...store, activeId: id }); setMobileSidebar(false); };
  const handleRename = (id, title) =>
    persist({ ...store, sessions: store.sessions.map((s) => (s.id === id ? { ...s, title } : s)) });
  const handleDelete = (id) => {
    const remaining = store.sessions.filter((s) => s.id !== id);
    const activeId = store.activeId === id ? remaining[0]?.id || null : store.activeId;
    if (remaining.length === 0) {
      const s = newSession();
      persist({ sessions: [s], activeId: s.id });
    } else {
      persist({ sessions: remaining, activeId });
    }
    toast.success("Session deleted from this browser");
  };
  const handleClearSession = () => {
    updateActive((s) => ({ ...s, messages: [], title: "New Chat" }));
    toast.success("Session wiped");
  };
  const handleClearAll = () => {
    const s = newSession();
    persist({ sessions: [s], activeId: s.id });
    toast.success("All local data wiped");
  };
  const handleExport = () => { exportSessions(); toast.success("Backup downloaded"); };
  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseImport(reader.result);
        persist({ sessions: data.sessions, activeId: data.activeId || data.sessions[0]?.id });
        toast.success(`Imported ${data.sessions.length} sessions`);
      } catch (e) {
        toast.error("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  const setTone = (tone) => updateActive((s) => ({ ...s, tone }));
  const setModel = (model) => updateActive((s) => ({ ...s, model }));

  const handleSend = async (text, attachments) => {
    if (!active || streaming) return;
    const userMsg = { id: "m_" + Date.now(), role: "user", text, attachments };
    const baseMessages = [...active.messages, userMsg];
    const title =
      active.messages.length === 0
        ? (text ? text.slice(0, 40) : (attachments && attachments.length ? "Media chat" : active.title))
        : active.title;

    updateActive((s) => ({ ...s, messages: baseMessages, title }));
    setStreaming(true);
    setStreamText("");

    let acc = "";
    try {
      const resp = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getGateToken()}`,
        },
        body: JSON.stringify({
          model: active.model,
          tone: active.tone,
          messages: toApiMessages(baseMessages),
        }),
      });

      if (resp.status === 401) {
        clearGateToken();
        setLocked(true);
        throw new Error("Session expired — please unlock again.");
      }
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const obj = JSON.parse(data);
            if (obj.error) throw new Error(obj.error);
            if (obj.content) {
              acc += obj.content;
              setStreamText(acc);
            }
          } catch (e) {
            if (e.message && e.message !== "Unexpected end of JSON input") {
              // surfaced below
            }
          }
        }
      }

      if (!acc) throw new Error("No response received. Check the API key / model.");

      const aiMsg = { id: "m_" + Date.now() + "_a", role: "assistant", text: acc };
      updateActive((s) => ({ ...s, messages: [...baseMessages, aiMsg] }));
    } catch (e) {
      toast.error("Generation failed", { description: e.message });
      if (acc) {
        const aiMsg = { id: "m_" + Date.now() + "_a", role: "assistant", text: acc };
        updateActive((s) => ({ ...s, messages: [...baseMessages, aiMsg] }));
      }
    } finally {
      setStreaming(false);
      setStreamText("");
    }
  };

  if (locked === null) {
    return <div className="fixed inset-0 bg-[#0A0A0B]" data-testid="gate-loading" />;
  }
  if (locked) {
    return <LockScreen onUnlock={() => setLocked(false)} />;
  }

  return (
    <div className="App flex h-[100dvh] bg-[#0A0A0B] overflow-hidden">
      <div className="grain-overlay" />

      {/* Desktop sidebar (only mounted on desktop to avoid duplicate testids) */}
      {!isMobile && (
        <Sidebar
          sessions={store.sessions}
          activeId={store.activeId}
          storageBytes={storageBytes}
          onNew={handleNew}
          onSwitch={handleSwitch}
          onRename={handleRename}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
          onExport={handleExport}
          onImport={handleImport}
          onOpenPrivacy={() => setPrivacyOpen(true)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebar && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebar(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              mobile
              sessions={store.sessions}
              activeId={store.activeId}
              storageBytes={storageBytes}
              onNew={handleNew}
              onSwitch={handleSwitch}
              onRename={handleRename}
              onDelete={handleDelete}
              onClearAll={handleClearAll}
              onExport={handleExport}
              onImport={handleImport}
              onOpenPrivacy={() => setPrivacyOpen(true)}
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col h-[100dvh] relative bg-[#0A0A0B] overflow-hidden">
        <ChatHeader
          tone={active?.tone || DEFAULT_TONE}
          model={active?.model || DEFAULT_MODEL}
          onToneChange={setTone}
          onModelChange={setModel}
          onClearSession={handleClearSession}
          onMenu={() => setMobileSidebar(true)}
        />

        <ChatPane session={active} streaming={streaming} streamText={streamText} />

        <Composer onSend={handleSend} disabled={streaming} tone={active?.tone || DEFAULT_TONE} />
      </main>

      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}

export default App;
