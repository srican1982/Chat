import { TONE_PROMPTS } from "./prompts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Provider routing pinned to Google Vertex AI: no fallbacks, deny data collection, zero retention.
const PROVIDER_BLOCK = {
  order: ["google-vertex"],
  allow_fallbacks: false,
  data_collection: "deny",
  zdr: true,
};

// Streams a chat completion directly from the browser to OpenRouter (no backend).
// Calls onToken(deltaText) for each streamed chunk. Throws on HTTP / network errors.
export async function streamChat({ apiKey, model, tone, messages, onToken, signal }) {
  const system = TONE_PROMPTS[tone] || TONE_PROMPTS.fun_casual;
  const body = {
    model,
    messages: [{ role: "system", content: system }, ...messages],
    temperature: 0.9, // locked for creative variety
    stream: true,
    provider: PROVIDER_BLOCK,
  };

  const resp = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "Vault Chat",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    let detail = "";
    try {
      const j = await resp.json();
      detail = j?.error?.message || JSON.stringify(j);
    } catch {
      detail = await resp.text().catch(() => "");
    }
    if (resp.status === 401) throw new Error("Invalid OpenRouter API key. Check it in Settings.");
    throw new Error(`OpenRouter ${resp.status}: ${detail}`);
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
      if (data === "[DONE]") return;
      try {
        const obj = JSON.parse(data);
        const delta = obj?.choices?.[0]?.delta?.content;
        if (delta) onToken(delta);
      } catch {
        // ignore keep-alive / partial JSON
      }
    }
  }
}
