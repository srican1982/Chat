import React, { useRef, useState } from "react";
import { Paperclip, ArrowUp, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { readImageFile, extractVideoFrames } from "@/lib/media";
import { TONES } from "@/lib/constants";

export const Composer = ({ onSend, disabled, tone }) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const taRef = useRef(null);

  const handleFiles = async (files) => {
    setProcessing(true);
    try {
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const att = await readImageFile(file);
          setAttachments((prev) => [...prev, att]);
        } else if (file.type.startsWith("video/")) {
          toast.info("Extracting video frames in your browser…");
          const att = await extractVideoFrames(file);
          setAttachments((prev) => [...prev, att]);
          toast.success(`Captured ${att.frames.length} frames`);
        } else {
          toast.error("Only image and video files are supported");
        }
      }
    } catch (e) {
      toast.error("Could not process file: " + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const submit = () => {
    if (disabled || processing) return;
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments);
    setText("");
    setAttachments([]);
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const autoGrow = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const accent = (TONES.find((t) => t.id === tone) || TONES[0]).color;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/90 to-transparent">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1A1A1D] border border-white/10 shadow-2xl rounded-3xl p-3">
          {attachments.length > 0 && (
            <div data-testid="attachment-tray" className="flex gap-2 overflow-x-auto px-1 pb-2 mb-1">
              {attachments.map((a, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={a.thumb} alt={a.name} className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                  {a.type === "video" && (
                    <span className="absolute bottom-0.5 left-0.5 text-[9px] font-mono bg-black/70 px-1 rounded text-[#FFB000]">
                      {a.frames.length}f
                    </span>
                  )}
                  <button
                    data-testid={`remove-attachment-${i}`}
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-[#FF3B30] rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <Button
              data-testid="attach-btn"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
              variant="ghost"
              size="icon"
              className="rounded-full text-[#A1A1AA] hover:text-[#EDEDED] hover:bg-white/5 flex-shrink-0"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              data-testid="file-input"
              onChange={(e) => { handleFiles(Array.from(e.target.files || [])); e.target.value = ""; }}
            />

            <Textarea
              ref={taRef}
              data-testid="composer-input"
              value={text}
              onChange={autoGrow}
              onKeyDown={onKeyDown}
              placeholder="Write your scene…"
              rows={1}
              className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 text-[#EDEDED] placeholder:text-[#52525B] py-2 max-h-[200px] leading-relaxed"
            />

            <Button
              data-testid="send-btn"
              onClick={submit}
              disabled={disabled || processing || (!text.trim() && attachments.length === 0)}
              size="icon"
              className="rounded-full flex-shrink-0 text-[#0A0A0B]"
              style={{ backgroundColor: accent, transition: "background-color 0.2s ease" }}
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <p className="text-center text-[10px] text-[#52525B] mt-2 font-mono">
          Temp 0.9 · Provider pinned to Google Vertex (ZDR, no retention) · Enter to send
        </p>
      </div>
    </div>
  );
};
