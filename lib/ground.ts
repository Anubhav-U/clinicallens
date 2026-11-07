import type { RawFact } from "./schema";
import type { Fact, Sentence } from "./types";

/**
 * Normalize text for matching (lowercase, unify quotes/dashes, collapse whitespace)
 * while keeping a map from each normalized char back to its original index.
 */
export function normalizeWithMap(text: string): { norm: string; map: number[] } {
  let norm = "";
  const map: number[] = [];
  let prevSpace = true; // drops leading whitespace
  for (let i = 0; i < text.length; i++) {
    let ch = text[i];
    if (/\s/.test(ch)) {
      if (prevSpace) continue;
      ch = " ";
      prevSpace = true;
    } else {
      prevSpace = false;
      ch = ch
        .toLowerCase()
        .replace(/[‘’‛]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[‐-―]/g, "-");
    }
    norm += ch;
    map.push(i);
  }
  if (norm.endsWith(" ")) {
    norm = norm.slice(0, -1);
    map.pop();
  }
  return { norm, map };
}

function normalize(text: string): string {
  return normalizeWithMap(text).norm.replace(/^["'\s]+|["'\s.]+$/g, "");
}

/** Find `quote` in note[from, to), returning the original-text span. */
function findSpan(
  note: string,
  quote: string,
  from = 0,
  to = note.length,
): { start: number; end: number } | null {
  const q = normalize(quote);
  if (q.length < 2) return null;
  const { norm, map } = normalizeWithMap(note.slice(from, to));
  const idx = norm.indexOf(q);
  if (idx === -1) return null;
  return { start: from + map[idx], end: from + map[idx + q.length - 1] + 1 };
}

function overlappingSentences(sentences: Sentence[], span: { start: number; end: number }) {
  return sentences.filter((s) => s.start < span.end && s.end > span.start).map((s) => s.id);
}

/**
 * Merge facts the model listed twice (same category + same label, e.g. a diagnosis
 * named in both the history and the assessment). Keeps the first verified one and
 * unions the sentences it appears in. Different labels (e.g. a dose change) stay separate.
 */
export function dedupeFacts(facts: Fact[]): Fact[] {
  const key = (f: Fact) => `${f.category}|${f.value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`;
  const byKey = new Map<string, Fact>();
  const out: Fact[] = [];
  for (const f of facts) {
    const k = key(f);
    const existing = byKey.get(k);
    if (!existing) {
      byKey.set(k, f);
      out.push(f);
      continue;
    }
    if (existing.grounding === "ungrounded" && f.grounding !== "ungrounded") {
      // Prefer the verified copy.
      out[out.indexOf(existing)] = f;
      byKey.set(k, f);
    } else if (f.grounding !== "ungrounded") {
      existing.sentenceIds = [...new Set([...existing.sentenceIds, ...f.sentenceIds])].sort((a, b) => a - b);
    }
  }
  return out;
}

/**
 * The model *claims* a quote and the sentences it came from; this verifies the claim.
 * Facts whose quote can't be found verbatim in the note are marked ungrounded.
 */
export function groundFacts(note: string, sentences: Sentence[], raw: RawFact[]): Fact[] {
  const byId = new Map(sentences.map((s) => [s.id, s]));
  return raw.map((r, i) => {
    const { sentenceIds: claimed, ...rest } = r;
    const base = { ...rest, id: `f${i}` };
    const cited = claimed.map((id) => byId.get(id)).filter((s): s is Sentence => !!s);

    // 1) Search only within the range of the sentences the model cited.
    if (cited.length) {
      const from = Math.min(...cited.map((s) => s.start));
      const to = Math.max(...cited.map((s) => s.end));
      const span = findSpan(note, r.quote, from, to);
      if (span) {
        return { ...base, grounding: "grounded", span, sentenceIds: overlappingSentences(sentences, span) };
      }
    }
    // 2) Quote exists elsewhere in the note: accept it, but fix the citation.
    const span = findSpan(note, r.quote);
    if (span) {
      return { ...base, grounding: "corrected", span, sentenceIds: overlappingSentences(sentences, span) };
    }
    // 3) Not in the note at all.
    return { ...base, grounding: "ungrounded", sentenceIds: cited.map((s) => s.id) };
  });
}
