import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, ImageIcon, Copy, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { TONES } from "@/lib/constants";
import { stripOptions } from "@/lib/cast";

const AttachmentThumbs = ({ attachments, onOpen }) => {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex gap-2 flex-wrap mt-3">
      {attachments.map((a, i) => (
        <button
          key={i}
          type="button"
          data-testid={`attachment-thumb-${i}`}
          onClick={() => onOpen && onOpen(a)}
          className="relative block cursor-zoom-in group/thumb"
          style={{ transition: "transform 0.15s ease" }}
        >
          <img src={a.thumb} alt={a.name}
            className="w-16 h-16 rounded-lg object-cover border border-white/10 group-hover/thumb:border-white/30" />
          {a.type === "video" && (
            <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono bg-black/70 px-1 rounded text-[#FFB000]">
              {a.frames ? a.frames.length + "f" : "vid"}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

const ImageViewer = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div
      data-testid="image-viewer"
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <button
        data-testid="image-viewer-close"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={item.thumb}
        alt={item.name}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
      />
      {item.name && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/60 font-mono px-4 truncate">
          {item.name}
        </div>
      )}
    </div>
  );
};

const CopyButton = ({ text, testid, align = "left" }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <button
      data-testid={testid}
      onClick={onCopy}
      className={`mt-1.5 flex items-center gap-1 text-[11px] text-[#A1A1AA] hover:text-[#EDEDED] ${
        align === "right" ? "ml-auto" : ""
      }`}
      style={{ transition: "color 0.15s ease" }}
    >
      {copied ? <Check className="w-3 h-3 text-[#00E676]" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

export const ChatPane = ({ session, streaming, streamText, onDeleteMessage }) => {
  const bottomRef = useRef(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.messages?.length, streamText]);

  const messages = session?.messages || [];

  if (messages.length === 0 && !streaming) {
    return (
      <div data-testid="empty-state" className="flex-1 min-h-0 overflow-y-auto flex items-center justify-start p-8 md:p-16">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 text-[#00E676] mb-4 font-mono text-xs">
            <Lock className="w-3.5 h-3.5" /> STORED IN THIS BROWSER ONLY
          </div>
          <h2 className="font-heading text-4xl tracking-tighter font-light mb-4">
            Your private writing room.
          </h2>
          <p className="text-[#A1A1AA] leading-relaxed mb-6">
            සිංහල creative writing සහ roleplay with Gemini. Nothing you type or attach is stored on a
            server — history and images live in your browser's localStorage. Pick a tone —{" "}
            <span className="text-[#FFB000]">Fun &amp; Casual</span>,{" "}
            <span className="text-[#00E676]">Casual</span>,{" "}
            <span className="text-[#90E0EF]">Professional</span>,{" "}
            <span className="text-[#F78166]">Story</span>,{" "}
            <span className="text-[#E5C07B]">Comedy</span>,{" "}
            <span className="text-[#8AB0C4]">Zen</span>, or{" "}
            <span className="text-[#C9A27E]">Reality</span> — and start writing in Sinhala.
          </p>
          <div className="flex gap-4 text-sm text-[#52525B]">
            <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Temp locked 0.9</span>
            <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> Image + video</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div data-testid="chat-container" className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 scroll-smooth">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            data-testid={`message-${m.role}`}
            className={`group flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            {m.role === "user" ? (
              <div className="bg-white/5 rounded-2xl rounded-tr-sm px-5 py-4 max-w-[85%]">
                {m.speaker && (
                  <div className="text-[11px] font-medium text-[#90E0EF] mb-1">{m.speaker}</div>
                )}
                {m.text && <p className="whitespace-pre-wrap text-[#EDEDED] sinhala-text">{m.text}</p>}
                <AttachmentThumbs attachments={m.attachments} onOpen={setViewer} />
              </div>
            ) : (
              <div className="border-l-2 border-[#52525B] pl-4 py-1 max-w-[95%]">
                <p className="whitespace-pre-wrap text-[#EDEDED] sinhala-text">{m.text}</p>
              </div>
            )}
            <div className={`mt-0.5 flex items-center gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.text && (
                <CopyButton
                  text={m.role === "assistant" ? stripOptions(m.text) : m.text}
                  testid={`copy-${m.role}-${m.id}`}
                  align="left"
                />
              )}
              <button
                data-testid={`delete-msg-${m.id}`}
                onClick={() => onDeleteMessage && onDeleteMessage(m.id)}
                className="mt-1.5 flex items-center gap-1 text-[11px] text-[#A1A1AA] hover:text-[#FF3B30]"
                style={{ transition: "color 0.15s ease" }}
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </motion.div>
        ))}

        {streaming && (
          <div data-testid="streaming-message" className="flex justify-start">
            <div className="border-l-2 border-[#FFB000] pl-4 py-1 max-w-[95%]">
              <p className={`whitespace-pre-wrap text-[#EDEDED] sinhala-text ${!streamText ? "cursor-blink" : ""}`}>
                <span>{streamText}</span>
                {streamText && <span className="cursor-blink" />}
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
    <ImageViewer item={viewer} onClose={() => setViewer(null)} />
    </>
  );
};

export { TONES };
