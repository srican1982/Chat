import React, { useRef } from "react";
import { Plus, MessageSquare, Trash2, Pencil, Shield, Download, Upload, Eraser, Lock, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { STORAGE_WARN_BYTES, STORAGE_LIMIT_BYTES } from "@/lib/constants";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Sidebar = ({
  sessions, activeId, storageBytes, mobile = false,
  onNew, onSwitch, onRename, onDelete, onClearAll, onExport, onImport, onOpenPrivacy, onOpenApiKey,
}) => {
  const importRef = useRef(null);
  const pct = Math.min(100, (storageBytes / STORAGE_LIMIT_BYTES) * 100);
  const mb = (storageBytes / (1024 * 1024)).toFixed(2);
  const over = storageBytes > STORAGE_WARN_BYTES;

  return (
    <aside
      data-testid="sidebar"
      className={`w-72 flex-shrink-0 border-r border-white/5 h-screen overflow-y-auto flex-col bg-[#111113] ${mobile ? "flex" : "hidden md:flex"}`}
    >
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-4 h-4 text-[#00E676]" />
          <h1 className="font-heading text-lg tracking-tighter font-light">Vault Chat</h1>
        </div>
        <Button
          data-testid="new-chat-btn"
          onClick={onNew}
          className="w-full justify-start gap-2 bg-white/5 hover:bg-white/10 text-[#EDEDED] border border-white/10 rounded-xl"
          style={{ transition: "background-color 0.2s ease" }}
        >
          <Plus className="w-4 h-4" /> New Chat
        </Button>
      </div>

      <div className="flex-1 px-3 space-y-1">
        {sessions.length === 0 && (
          <p className="px-3 text-sm text-[#52525B]">No sessions yet.</p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            data-testid={`session-item-${s.id}`}
            onClick={() => onSwitch(s.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 ${
              s.id === activeId ? "bg-white/5 border border-white/10" : "border border-transparent"
            }`}
            style={{ transition: "background-color 0.2s ease" }}
          >
            <MessageSquare className="w-4 h-4 text-[#52525B] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm text-[#EDEDED]">{s.title}</div>
              {(() => {
                const last = s.messages && s.messages.length ? s.messages[s.messages.length - 1] : null;
                const preview = last
                  ? (last.text || (last.attachments && last.attachments.length ? "Media attached" : ""))
                  : "Empty — start typing";
                return preview ? (
                  <div className="truncate text-xs text-[#52525B] sinhala-text">
                    {last && last.role === "assistant" ? "AI: " : ""}{preview}
                  </div>
                ) : null;
              })()}
            </div>
            <button
              data-testid={`rename-session-${s.id}`}
              onClick={(e) => { e.stopPropagation(); const t = prompt("Rename session", s.title); if (t) onRename(s.id, t); }}
              className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-[#90E0EF]"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              data-testid={`delete-session-${s.id}`}
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
              className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-[#FF3B30]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 space-y-3">
        <div data-testid="storage-indicator">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[#A1A1AA]">Local Storage</span>
            <span className={`font-mono ${over ? "text-[#FF3B30]" : "text-[#52525B]"}`}>{mb} / 5 MB</span>
          </div>
          <Progress value={pct} className="h-1.5 bg-white/5" />
        </div>

        <div className="flex gap-2">
          <Button data-testid="export-btn" onClick={onExport} variant="ghost" size="sm"
            className="flex-1 gap-1.5 text-xs text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-white/5">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button data-testid="import-btn" onClick={() => importRef.current?.click()} variant="ghost" size="sm"
            className="flex-1 gap-1.5 text-xs text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-white/5">
            <Upload className="w-3.5 h-3.5" /> Import
          </Button>
          <input ref={importRef} type="file" accept="application/json" className="hidden"
            data-testid="import-input"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button data-testid="clear-all-btn" variant="ghost" size="sm"
              className="w-full gap-1.5 text-xs text-[#FF3B30] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10">
              <Eraser className="w-3.5 h-3.5" /> Clear Everything
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#111113] border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-heading">Clear all local data?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently wipes every session and all attachments from this browser's localStorage. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10">Cancel</AlertDialogCancel>
              <AlertDialogAction data-testid="confirm-clear-all" onClick={onClearAll}
                className="bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white">Wipe everything</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button data-testid="apikey-btn" onClick={onOpenApiKey} variant="ghost" size="sm"
          className="w-full gap-1.5 text-xs text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-white/5">
          <KeyRound className="w-3.5 h-3.5" /> API Key
        </Button>

        <Button data-testid="privacy-btn" onClick={onOpenPrivacy} variant="ghost" size="sm"
          className="w-full gap-1.5 text-xs text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-white/5">
          <Shield className="w-3.5 h-3.5" /> Privacy & Memory
        </Button>
      </div>
    </aside>
  );
};
