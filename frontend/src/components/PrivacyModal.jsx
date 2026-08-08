import React from "react";
import { Shield, HardDrive, Eye, AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const Section = ({ icon: Icon, title, children }) => (
  <div className="flex gap-3">
    <Icon className="w-4 h-4 text-[#90E0EF] flex-shrink-0 mt-1" />
    <div>
      <h4 className="font-heading text-sm mb-1 text-[#EDEDED]">{title}</h4>
      <p className="text-sm text-[#A1A1AA] leading-relaxed">{children}</p>
    </div>
  </div>
);

export const PrivacyModal = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      data-testid="privacy-modal"
      className="bg-[#111113] border-white/10 max-w-lg backdrop-blur-2xl max-h-[85vh] overflow-y-auto"
    >
      <DialogHeader>
        <DialogTitle className="font-heading text-2xl tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#00E676]" /> Privacy & Memory Model
        </DialogTitle>
        <DialogDescription className="text-[#52525B]">
          Exactly how your data is handled — no accounts, no database, no tracking.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 mt-2">
        <Section icon={HardDrive} title="Your data lives only in this browser">
          Every session, message, and Base64 thumbnail is stored in this browser's <span className="font-mono text-[#EDEDED]">localStorage</span>.
          It persists across refresh, and is wiped instantly when you clear a session, clear everything, or close an incognito window.
          No server-side storage, no cookies beyond localStorage, no analytics.
        </Section>

        <Section icon={Eye} title="What the backend does">
          The backend is a stateless proxy. It forwards your request to OpenRouter and streams the reply back.
          It does not log, cache, or persist request bodies. Files are never uploaded to storage — Base64 flows
          through as a request payload only, for a single inference call.
        </Section>

        <Section icon={Shield} title="Provider routing (pinned)">
          Requests are pinned to <span className="text-[#EDEDED]">Google Vertex AI</span> with{" "}
          <span className="font-mono text-[#EDEDED]">allow_fallbacks: false</span>,{" "}
          <span className="font-mono text-[#EDEDED]">data_collection: "deny"</span>, and{" "}
          <span className="font-mono text-[#EDEDED]">zdr: true</span> (zero data retention).
          Google receives image content only for that single call under ZDR — no retention, no training.
          OpenRouter retains only metadata with I/O logging disabled.
        </Section>

        <Section icon={AlertTriangle} title="Image safety filter caveat">
          Google's vision safety filter is model-side and cannot be bypassed for image inputs, even in Story tone.
          For adult or graphic scenarios, describe scenes in text rather than uploading images.
          For image-heavy sessions, <span className="text-[#EDEDED]">Gemini 2.5 Flash / 2.5 Pro</span> are recommended.
        </Section>
      </div>
    </DialogContent>
  </Dialog>
);
