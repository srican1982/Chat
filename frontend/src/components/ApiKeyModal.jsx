import React, { useState } from "react";
import { KeyRound, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/apikey";
import { toast } from "sonner";

export const ApiKeyModal = ({ open, onOpenChange, onSaved }) => {
  const [value, setValue] = useState(getApiKey());

  const save = () => {
    const v = value.trim();
    if (!v.startsWith("sk-or-")) {
      toast.error("That doesn't look like an OpenRouter key (starts with sk-or-)");
      return;
    }
    setApiKey(v);
    toast.success("API key saved on this device");
    onSaved && onSaved(v);
    onOpenChange(false);
  };

  const remove = () => {
    clearApiKey();
    setValue("");
    onSaved && onSaved("");
    toast.success("API key removed from this device");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="apikey-modal" className="bg-[#111113] border-white/10 max-w-md backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#00E676]" /> Your OpenRouter Key
          </DialogTitle>
          <DialogDescription className="text-[#52525B]">
            Stored only in this browser (localStorage). It's sent straight to OpenRouter from your
            device — never to any server of ours. Enter it once per device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Input
            data-testid="apikey-input"
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-or-v1-..."
            className="bg-white/5 border-white/10 text-[#EDEDED] rounded-xl h-11 text-base font-mono"
          />
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#90E0EF] hover:underline"
          >
            Get a key at openrouter.ai/keys <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-[10px] text-[#52525B] leading-relaxed">
            Tip: set a monthly spend limit on your key in OpenRouter so it can never be over-used.
          </p>

          <div className="flex gap-2 pt-1">
            <Button data-testid="apikey-save-btn" onClick={save}
              className="flex-1 bg-[#00E676] hover:bg-[#00E676]/90 text-[#0A0A0B] rounded-xl">
              Save key
            </Button>
            {getApiKey() && (
              <Button data-testid="apikey-remove-btn" onClick={remove} variant="ghost"
                className="text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl">
                Remove
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
