import React, { useState } from "react";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setGateToken } from "@/lib/gate";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const LockScreen = ({ onUnlock }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e?.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!resp.ok) {
        setError("Incorrect password. Try again.");
        setLoading(false);
        return;
      }
      const data = await resp.json();
      setGateToken(data.token);
      onUnlock();
    } catch {
      setError("Could not reach the server. Try again.");
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="lock-screen"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0A0A0B] p-6"
    >
      <div className="grain-overlay" />
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 text-[#00E676] mb-6 font-mono text-xs">
          <ShieldCheck className="w-4 h-4" /> PRIVATE · LOCKED
        </div>
        <h1 className="font-heading text-4xl tracking-tighter font-light mb-2">Vault Chat</h1>
        <p className="text-[#A1A1AA] leading-relaxed mb-8 text-sm">
          This is a private app. Enter the password to unlock it. Your unlock is remembered on this
          device for 30 days.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Lock className="w-4 h-4 text-[#52525B] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              data-testid="lock-password-input"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter password"
              autoFocus
              className="pl-9 bg-white/5 border-white/10 text-[#EDEDED] rounded-xl h-12 text-base"
            />
          </div>

          {error && (
            <p data-testid="lock-error" className="text-[#FF3B30] text-sm">{error}</p>
          )}

          <Button
            data-testid="lock-submit-btn"
            type="submit"
            disabled={loading || !password}
            className="w-full h-12 rounded-xl bg-[#00E676] hover:bg-[#00E676]/90 text-[#0A0A0B] font-medium"
            style={{ transition: "background-color 0.2s ease" }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock"}
          </Button>
        </form>

        <p className="text-[10px] text-[#52525B] mt-6 font-mono leading-relaxed">
          The password is verified on the server. The chat API stays locked until it's correct, so
          no one can use your OpenRouter key without it.
        </p>
      </div>
    </div>
  );
};
