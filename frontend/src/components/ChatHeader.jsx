import React from "react";
import { Lock, Eraser, Menu, Copy } from "lucide-react";
import { MODELS, TONES } from "@/lib/constants";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const ChatHeader = ({ tone, model, onToneChange, onModelChange, onClearSession, onMenu, onCopyAllAI }) => {
  const toneObj = TONES.find((t) => t.id === tone) || TONES[0];

  return (
    <header
      data-testid="chat-header"
      className="flex-shrink-0 z-40 flex items-center gap-2 sm:gap-3 px-3 sm:px-8 py-3 bg-[#0A0A0B]/80 backdrop-blur-2xl border-b border-white/5"
    >
      <button
        data-testid="mobile-menu-btn"
        onClick={onMenu}
        className="md:hidden flex-shrink-0 text-[#A1A1AA] hover:text-[#EDEDED] -ml-1 p-1"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#00E676] font-mono mr-1">
        <Lock className="w-3.5 h-3.5" />
        <span>Local Only</span>
      </div>

      <Select value={tone} onValueChange={onToneChange}>
        <SelectTrigger
          data-testid="tone-selector"
          className="w-[118px] sm:w-[150px] flex-shrink-0 bg-white/5 text-[#EDEDED] rounded-xl text-sm"
          style={{ borderColor: toneObj.color + "80" }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A1D] border-white/10">
          {TONES.map((t) => (
            <SelectItem key={t.id} value={t.id} data-testid={`tone-option-${t.id}`}>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                {t.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={model} onValueChange={onModelChange}>
        <SelectTrigger data-testid="model-selector" className="flex-1 min-w-0 sm:max-w-[280px] bg-white/5 border-white/10 text-[#EDEDED] rounded-xl text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A1D] border-white/10 max-w-[320px]">
          {MODELS.map((m) => (
            <SelectItem key={m.id} value={m.id} data-testid={`model-option-${m.id}`}>
              <div className="flex flex-col items-start">
                <span>{m.label}</span>
                <span className="text-xs text-[#52525B]">{m.hint}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="hidden sm:block flex-1" />

      <Button
        data-testid="copy-all-ai-btn"
        onClick={onCopyAllAI}
        variant="ghost"
        size="icon"
        className="flex-shrink-0 sm:w-auto sm:px-3 gap-1.5 text-xs text-[#A1A1AA] hover:text-[#90E0EF] hover:bg-white/5"
      >
        <Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copy AI</span>
      </Button>

      <Button
        data-testid="clear-session-btn"
        onClick={onClearSession}
        variant="ghost"
        size="icon"
        className="flex-shrink-0 sm:w-auto sm:px-3 gap-1.5 text-xs text-[#A1A1AA] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10"
      >
        <Eraser className="w-4 h-4" /> <span className="hidden sm:inline">Clear session</span>
      </Button>
    </header>
  );
};
