import { CATEGORIES, type Category } from "../lib/schema";
import type { Fact } from "../lib/types";
import type { EvalCase, ExpectedFact } from "./types";

export interface Counts {
  tp: number;
  fp: number;
  fn: number;
}

export interface CaseScore {
  id: string;
  byCategory: Record<Category, Counts>;
  missed: { category: Category; aliases: string[] }[];
  extra: { category: Category; value: string }[];
  negationErrors: string[];
  verified: number;
  corrected: number;
  ungrounded: number;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
const text = (f: Fact) => norm(`${f.value} ${f.quote}`);
const matches = (f: Fact, e: ExpectedFact) => e.aliases.some((a) => text(f).includes(norm(a)));
const specificity = (e: ExpectedFact) => Math.max(...e.aliases.map((a) => a.length));

const zero = (): Record<Category, Counts> =>
  Object.fromEntries(CATEGORIES.map((c) => [c, { tp: 0, fp: 0, fn: 0 }])) as Record<Category, Counts>;

/**
 * Greedy one-to-one matching per category. Required items are matched before optional
 * ones, most specific alias first, and each takes its least ambiguous candidate, so a
 * generic alias ("albuterol") can't steal a fact a specific one ("ipratropium") needs.
 * Scored facts are verified ones only; unverified facts never count as extractions.
 */
export function scoreCase(c: EvalCase, facts: Fact[]): CaseScore {
  const verified = facts.filter((f) => f.grounding !== "ungrounded");
  const score: CaseScore = {
    id: c.id,
    byCategory: zero(),
    missed: [],
    extra: [],
    negationErrors: [],
    verified: verified.length,
    corrected: facts.filter((f) => f.grounding === "corrected").length,
    ungrounded: facts.length - verified.length,
  };

  for (const cat of CATEGORIES) {
    const preds = verified.filter((f) => f.category === cat);
    const used = new Set<Fact>();
    const expected = c.expected
      .filter((e) => e.category === cat)
      .sort((a, b) => Number(!!a.optional) - Number(!!b.optional) || specificity(b) - specificity(a));

    // How many expected items each prediction could satisfy: prefer unambiguous candidates,
    // so "albuterol" takes the plain inhaler and leaves "albuterol-ipratropium" for "ipratropium".
    const ambiguity = new Map(preds.map((p) => [p, expected.filter((e) => matches(p, e)).length]));
    for (const e of expected) {
      const hit = preds
        .filter((p) => !used.has(p) && matches(p, e))
        .sort((a, b) => ambiguity.get(a)! - ambiguity.get(b)!)[0];
      if (hit) {
        used.add(hit);
        if (!e.optional) score.byCategory[cat].tp++;
      } else if (!e.optional) {
        score.byCategory[cat].fn++;
        score.missed.push({ category: cat, aliases: e.aliases });
      }
    }
    for (const p of preds) {
      if (!used.has(p)) {
        score.byCategory[cat].fp++;
        score.extra.push({ category: cat, value: p.value });
      }
    }
  }

  for (const term of c.forbiddenDiagnoses ?? []) {
    const bad = verified.find((f) => f.category === "diagnosis" && norm(f.value).includes(norm(term)));
    if (bad) score.negationErrors.push(`${term} → "${bad.value}"`);
  }
  return score;
}

export function prf({ tp, fp, fn }: Counts) {
  const precision = tp + fp ? tp / (tp + fp) : 1;
  const recall = tp + fn ? tp / (tp + fn) : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}

export function sumCounts(list: Counts[]): Counts {
  return list.reduce((a, b) => ({ tp: a.tp + b.tp, fp: a.fp + b.fp, fn: a.fn + b.fn }), { tp: 0, fp: 0, fn: 0 });
}
