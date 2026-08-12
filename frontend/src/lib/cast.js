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
