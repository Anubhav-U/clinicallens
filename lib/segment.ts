import type { Sentence } from "./types";

// Tokens that end in a period but don't end a sentence.
const ABBREVIATIONS = new Set([
  "dr", "mr", "mrs", "ms", "pt", "vs", "etc", "approx", "no", "hx", "dx", "rx", "sx",
  "e.g", "i.e", "b.i.d", "t.i.d", "q.i.d", "q.d", "p.o", "p.r.n", "q.h.s", "a.m", "p.m",
  "mg", "mcg", "ml", "st", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept",
  "oct", "nov", "dec",
]);

/**
 * Split a note into sentences with exact char offsets into the original text.
 * Line breaks always end a sentence (clinical notes are line-oriented: headers,
 * bullets, vitals rows). Within a line, split on . ! ? followed by whitespace,
 * skipping decimals and common abbreviations.
 */
export function segmentNote(note: string): Sentence[] {
  const sentences: Sentence[] = [];
  const push = (start: number, end: number) => {
    // Trim whitespace while keeping offsets exact.
    while (start < end && /\s/.test(note[start])) start++;
    while (end > start && /\s/.test(note[end - 1])) end--;
    if (end > start) {
      sentences.push({ id: sentences.length, text: note.slice(start, end), start, end });
    }
  };

  let lineStart = 0;
  const lines = note.split("\n");
  for (const line of lines) {
    const lineEnd = lineStart + line.length;
    let segStart = lineStart;
    for (let i = lineStart; i < lineEnd; i++) {
      const ch = note[i];
      if (ch !== "." && ch !== "!" && ch !== "?") continue;
      const next = note[i + 1];
      // Must be followed by whitespace (or end of line) to count as a boundary.
      if (i + 1 < lineEnd && next !== " " && next !== "\t") continue;
      if (ch === "." && isAbbreviation(note, segStart, i)) continue;
      // Don't split if the next word starts lowercase (likely mid-sentence).
      const after = note.slice(i + 1, lineEnd).trimStart();
      if (after && /^[a-z]/.test(after)) continue;
      push(segStart, i + 1);
      segStart = i + 1;
    }
    push(segStart, lineEnd);
    lineStart = lineEnd + 1; // skip the "\n"
  }
  return sentences;
}

function isAbbreviation(note: string, segStart: number, dotIndex: number): boolean {
  let j = dotIndex - 1;
  while (j >= segStart && /[A-Za-z.]/.test(note[j])) j--;
  const word = note.slice(j + 1, dotIndex).toLowerCase();
  if (!word) return false;
  if (ABBREVIATIONS.has(word)) return true;
  // Single letters like initials ("J. Smith") or dotted forms ("b.i.d").
  return word.length === 1 || word.includes(".");
}

/** Render sentences as numbered lines for the model prompt. */
export function numberSentences(sentences: Sentence[]): string {
  return sentences.map((s) => `[S${s.id}] ${s.text}`).join("\n");
}
