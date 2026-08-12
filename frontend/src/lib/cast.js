// Parses the hidden [[CAST: ...]] marker the storytelling prompts append.
export function extractCast(text) {
  if (!text) return { clean: "", cast: [] };
  const m = text.match(/\[\[CAST:([^\]]*)\]\]/i);
  const cast = m
    ? m[1].split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  // Remove the marker (and any partial marker while streaming) from display text.
  const clean = text.replace(/\[\[CAST[\s\S]*$/i, "").trimEnd();
  return { clean, cast };
}
