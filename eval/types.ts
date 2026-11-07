import type { Category } from "../lib/schema";

/**
 * One expected fact. A prediction matches if any alias appears (case-insensitive)
 * in its value or quote, and the category is the same.
 */
export interface ExpectedFact {
  category: Category;
  aliases: string[];
  /** Fine to extract, not penalized if missed (e.g. symptoms, repeat measurements). */
  optional?: boolean;
}

export interface EvalCase {
  id: string;
  note: string;
  expected: ExpectedFact[];
  /** Mentioned but negated or ruled out: must NOT be extracted as a diagnosis. */
  forbiddenDiagnoses?: string[];
}
