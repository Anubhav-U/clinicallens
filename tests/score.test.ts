import { describe, expect, it } from "vitest";
import { prf, scoreCase } from "@/eval/score";
import type { EvalCase } from "@/eval/types";
import type { Fact } from "@/lib/types";

const f = (category: Fact["category"], value: string, grounding: Fact["grounding"] = "grounded"): Fact => ({
  id: value,
  category,
  value,
  quote: value,
  grounding,
  sentenceIds: [0],
});

const c: EvalCase = {
  id: "t",
  note: "",
  expected: [
    { category: "medication", aliases: ["albuterol"] },
    { category: "medication", aliases: ["ipratropium"], optional: true },
    { category: "medication", aliases: ["prednisone"] },
    { category: "diagnosis", aliases: ["asthma"] },
  ],
  forbiddenDiagnoses: ["fever"],
};

describe("scoreCase", () => {
  it("counts TP/FP/FN and lets specific aliases match first", () => {
    const s = scoreCase(c, [
      f("medication", "Albuterol-ipratropium nebulizer"),
      f("medication", "Albuterol inhaler"),
      f("medication", "Vitamin D"),
      f("diagnosis", "Asthma"),
    ]);
    expect(s.byCategory.medication).toEqual({ tp: 1, fp: 1, fn: 1 }); // albuterol hit, vitamin D extra, prednisone missed
    expect(s.byCategory.diagnosis).toEqual({ tp: 1, fp: 0, fn: 0 });
  });

  it("ignores unverified facts and flags negated diagnoses", () => {
    const s = scoreCase(c, [f("medication", "Prednisone", "ungrounded"), f("diagnosis", "Fever")]);
    expect(s.byCategory.medication.fn).toBe(2);
    expect(s.ungrounded).toBe(1);
    expect(s.negationErrors).toHaveLength(1);
  });

  it("computes precision/recall/F1", () => {
    expect(prf({ tp: 8, fp: 2, fn: 2 })).toEqual({ precision: 0.8, recall: 0.8, f1: 0.8000000000000002 });
  });
});
