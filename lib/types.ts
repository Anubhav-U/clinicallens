import type { Category, RawFact } from "./schema";

export interface Sentence {
  id: number;
  text: string;
  /** Char offsets into the original note (end exclusive). */
  start: number;
  end: number;
}

/**
 * grounded   - quote found inside the sentences the model cited
 * corrected  - quote found verbatim in the note, but in a different sentence than cited
 * ungrounded - quote not found anywhere in the note; never shown as fact
 */
export type GroundingStatus = "grounded" | "corrected" | "ungrounded";

export interface Fact extends Omit<RawFact, "sentenceIds"> {
  id: string;
  category: Category;
  grounding: GroundingStatus;
  /** Sentences the verified span overlaps (or the model's claim, if ungrounded). */
  sentenceIds: number[];
  /** Exact char span of the quote in the note, when verified. */
  span?: { start: number; end: number };
}

export interface ExtractionStats {
  model: string;
  latencyMs: number;
  totalFacts: number;
  groundedFacts: number;
  ungroundedFacts: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ExtractionResult {
  note: string;
  sentences: Sentence[];
  facts: Fact[];
  stats: ExtractionStats;
}

export interface ApiError {
  error: string;
  code: "invalid_input" | "too_long" | "rate_limited" | "quota" | "upstream" | "config";
}
