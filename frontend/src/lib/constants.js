export const MODELS = [
  { id: "google/gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", hint: "Default · fastest, lightweight" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Recommended for image-heavy sessions" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Recommended for image-heavy sessions" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", hint: "Preview · most capable" },
];

export const DEFAULT_MODEL = MODELS[0].id;

export const TONES = [
  { id: "fun_casual", label: "Fun & Casual", color: "#FFB000", desc: "Playful, expressive Sinhala" },
  { id: "casual", label: "Casual", color: "#00E676", desc: "Witty, grounded friend" },
  { id: "professional", label: "Professional", color: "#90E0EF", desc: "Formal, literary Sinhala" },
  { id: "story", label: "Story Mode", color: "#F78166", desc: "Novel-style Sinhala fiction" },
  { id: "comedy", label: "Comedy Mode", color: "#E5C07B", desc: "Absurd Sinhala comedy" },
  { id: "zen", label: "Zen", color: "#8AB0C4", desc: "Calm, non-judgmental companion" },
];

export const DEFAULT_TONE = "fun_casual";

export const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // typical browser localStorage cap (~5 MB)
export const STORAGE_WARN_BYTES = 4 * 1024 * 1024;  // warn when approaching the cap
