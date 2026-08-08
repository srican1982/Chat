import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles, ImageIcon } from "lucide-react";
import { TONES } from "@/lib/constants";

const AttachmentThumbs = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex gap-2 flex-wrap mt-3">
      {attachments.map((a, i) => (
        <div key={i} className="relative">
          <img src={a.thumb} alt={a.name}
            className="w-16 h-16 rounded-lg object-cover border border-white/10" />
          {a.type === "video" && (
            <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono bg-black/70 px-1 rounded text-[#FFB000]">
              {a.frames.length}f
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export const ChatPane = ({ session, streaming, streamText }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages?.length, streamText]);

  const messages = session?.messages || [];

  if (messages.length === 0 && !streaming) {
    return (
      <div data-testid="empty-state" className="flex-1 overflow-y-auto flex items-center justify-start p-8 md:p-16 pb-40">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 text-[#00E676] mb-4 font-mono text-xs">
            <Lock className="w-3.5 h-3.5" /> STORED IN THIS BROWSER ONLY
          </div>
          <h2 className="font-heading text-4xl tracking-tighter font-light mb-4">
            Your private writing room.
          </h2>
          <p className="text-[#A1A1AA] leading-relaxed mb-6">
            Roleplay and creative writing with Gemini. Nothing you type or attach is stored on a server —
            history and images live in your browser's localStorage. Switch to <span className="text-[#FFB000]">Story</span> tone
            for uncensored fiction, or keep it <span className="text-[#90E0EF]">Professional</span>.
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
    <div data-testid="chat-container" className="flex-1 overflow-y-auto p-4 md:p-8 pb-44 scroll-smooth">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            data-testid={`message-${m.role}`}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            {m.role === "user" ? (
              <div className="bg-white/5 rounded-2xl rounded-tr-sm px-5 py-4 max-w-[85%]">
                {m.text && <p className="whitespace-pre-wrap leading-relaxed text-[#EDEDED]">{m.text}</p>}
                <AttachmentThumbs attachments={m.attachments} />
              </div>
            ) : (
              <div className="border-l-2 border-[#52525B] pl-4 py-1 max-w-[95%]">
                <p className="whitespace-pre-wrap leading-relaxed text-[#EDEDED]">{m.text}</p>
              </div>
            )}
          </motion.div>
        ))}

        {streaming && (
          <div data-testid="streaming-message" className="flex justify-start">
            <div className="border-l-2 border-[#FFB000] pl-4 py-1 max-w-[95%]">
              <p className={`whitespace-pre-wrap leading-relaxed text-[#EDEDED] ${!streamText ? "cursor-blink" : ""}`}>
                <span>{streamText}</span>
                {streamText && <span className="cursor-blink" />}
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export { TONES };
