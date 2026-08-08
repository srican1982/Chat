import { useEffect, useMemo, useRef, useState } from "react";
import "@/App.css";
import { Menu } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatPane } from "@/components/ChatPane";
import { Composer } from "@/components/Composer";
import { PrivacyModal } from "@/components/PrivacyModal";
import { DEFAULT_MODEL, STORAGE_WARN_BYTES } from "@/lib/constants";
import {
  loadStore, saveStore, newSession, getStorageBytes, exportSessions, parseImport,
} from "@/lib/storage";

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
  const warnedRef = useRef(false);
  const initRef = useRef(false);

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

  const persist = (next) => {
    setStore(next);
    try {
      saveStore(next);
      const bytes = getStorageBytes();
      setStorageBytes(bytes);
      if (bytes > STORAGE_WARN_BYTES && !warnedRef.current) {
        warnedRef.current = true;
        toast.error("Local storage is over 3.5 MB", {
          description: "Consider exporting a backup and clearing old sessions.",
          duration: 8000,
        });
      }
      if (bytes <= STORAGE_WARN_BYTES) warnedRef.current = false;
    } catch (e) {
      toast.error("Storage quota exceeded", {
        description: "Your browser storage is full. Clear a session to continue.",
      });
    }
  };

  const active = useMemo(
    () => store.sessions.find((s) => s.id === store.activeId) || null,
    [store]
  );

  const updateActive = (updater) => {
    const next = {
      ...store,
      sessions: store.sessions.map((s) => (s.id === store.activeId ? updater(s) : s)),
    };
    persist(next);
  };

  // Session controls
  const handleNew = () => {
    const s = newSession(active?.model || DEFAULT_MODEL, active?.tone || "professional");
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
    const title = active.messages.length === 0 && text ? text.slice(0, 40) : active.title;

    updateActive((s) => ({ ...s, messages: baseMessages, title }));
    setStreaming(true);
    setStreamText("");

    let acc = "";
    try {
      const resp = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: active.model,
          tone: active.tone,
          messages: toApiMessages(baseMessages),
        }),
      });

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

  return (
    <div className="App flex h-screen bg-[#0A0A0B] overflow-hidden">
      <div className="grain-overlay" />

      {/* Desktop sidebar */}
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

      {/* Mobile sidebar overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
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

      <main className="flex-1 flex flex-col h-screen relative bg-[#0A0A0B]">
        <div className="flex items-center">
          <button
            data-testid="mobile-menu-btn"
            onClick={() => setMobileSidebar(true)}
            className="md:hidden p-3 text-[#A1A1AA]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <ChatHeader
              tone={active?.tone || "professional"}
              model={active?.model || DEFAULT_MODEL}
              onToneChange={setTone}
              onModelChange={setModel}
              onClearSession={handleClearSession}
            />
          </div>
        </div>

        <ChatPane session={active} streaming={streaming} streamText={streamText} />

        <Composer onSend={handleSend} disabled={streaming} tone={active?.tone || "professional"} />
      </main>

      <PrivacyModal open={privacyOpen} onOpenChange={setPrivacyOpen} />
      <Toaster theme="dark" position="top-center" />
    </div>
  );
}

export default App;
