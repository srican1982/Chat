// Removes the trailing "3 continuation options" block from an AI reply for clean copying.
export function stripOptions(text) {
  if (!text) return text;
  // Primary: the standard Sinhala options header used by the prompts.
  const idx = text.search(/ඊළඟට\s*මොකද\s*වෙන්නේ/);
  if (idx !== -1) return text.slice(0, idx).trimEnd();
  // Fallback: strip a trailing numbered list (1. 2. 3.) plus an optional header line above it.
  const lines = text.split("\n");
  let cut = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const ln = lines[i].trim();
    if (ln === "") continue;
    if (/^(\d+|[①-⑳])[.)、:]/.test(ln)) {
      cut = i;
    } else {
      if (cut !== -1 && ln.length <= 70 && /[:?？]$/.test(ln)) cut = i;
      break;
    }
  }
  if (cut !== -1) return lines.slice(0, cut).join("\n").trimEnd();
  return text.trimEnd();
}

// Generic role/pronoun words that are NOT real characters (English + Sinhala).
const GENERIC = new Set(
  [
    "you", "user", "me", "i", "myself", "we", "us", "narrator", "ai",
    "assistant", "gemini", "reader", "author", "story", "scene",
    "ඔබ", "ඔයා", "ඔබ්", "මම", "මා", "මාව", "අපි", "අප", "කථකයා",
    "කතාව", "පාඨකයා", "ඔබට", "ඔබේ",
  ].map((s) => s.toLowerCase())
);

// Filters a stored character roster to drop generic words and duplicates.
export function cleanRoster(list) {
  const seen = new Set();
  return (list || []).filter((name) => {
    if (!name) return false;
    const key = String(name).toLowerCase();
    if (GENERIC.has(key)) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Parses the hidden [[CAST: ...]] marker the storytelling prompts append.
export function extractCast(text) {
  if (!text) return { clean: "", cast: [] };
  const m = text.match(/\[\[\s*CAST\s*:([^\]]*)\]\]/i);
  let cast = [];
  if (m) {
    const seen = new Set();
    cast = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter((name) => {
        if (!name) return false;
        const key = name.toLowerCase();
        if (GENERIC.has(key)) return false; // drop generic words like You / User
        if (seen.has(key)) return false; // dedupe case-insensitively
        seen.add(key);
        return true;
      });
  }
  // Remove the marker (and any partial marker while streaming) from display text.
  const clean = text.replace(/\[\[\s*CAST[\s\S]*$/i, "").trimEnd();
  return { clean, cast };
}
