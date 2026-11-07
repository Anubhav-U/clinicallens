import { describe, expect, it } from "vitest";
import { dedupeFacts, groundFacts } from "@/lib/ground";
import type { RawFact } from "@/lib/schema";
import { segmentNote } from "@/lib/segment";

const note = `Allergies: penicillin (hives).
Current medications: metformin 1000 mg PO twice daily.
Vitals: BP 148/92 mmHg, HR 76 bpm.`;
const sentences = segmentNote(note);

const fact = (over: Partial<RawFact>): RawFact => ({
  category: "medication",
  value: "Metformin 1000 mg",
  sentenceIds: [1],
  quote: "metformin 1000 mg PO twice daily",
  ...over,
});

describe("groundFacts", () => {
  it("grounds a verbatim quote in the cited sentence with an exact span", () => {
    const [f] = groundFacts(note, sentences, [fact({})]);
    expect(f.grounding).toBe("grounded");
    expect(note.slice(f.span!.start, f.span!.end)).toBe("metformin 1000 mg PO twice daily");
    expect(f.sentenceIds).toEqual([1]);
  });

  it("tolerates case, whitespace, and trailing punctuation differences", () => {
    const [f] = groundFacts(note, sentences, [fact({ quote: "  Metformin   1000 MG po twice daily." })]);
    expect(f.grounding).toBe("grounded");
  });

  it("corrects a wrong sentence citation when the quote exists elsewhere", () => {
    const [f] = groundFacts(note, sentences, [
      fact({ category: "vital", value: "BP 148/92", quote: "BP 148/92 mmHg", sentenceIds: [0] }),
    ]);
    expect(f.grounding).toBe("corrected");
    expect(f.sentenceIds).toEqual([2]);
  });

  it("flags a hallucinated quote as ungrounded", () => {
    const [f] = groundFacts(note, sentences, [
      fact({ value: "Lisinopril 10 mg", quote: "lisinopril 10 mg daily", sentenceIds: [1] }),
    ]);
    expect(f.grounding).toBe("ungrounded");
    expect(f.span).toBeUndefined();
  });

  it("flags a paraphrased quote as ungrounded", () => {
    const [f] = groundFacts(note, sentences, [fact({ quote: "takes metformin two times a day" })]);
    expect(f.grounding).toBe("ungrounded");
  });

  it("merges exact duplicates but keeps distinct items", () => {
    const facts = dedupeFacts(
      groundFacts(note, sentences, [
        fact({ category: "allergy", value: "Penicillin", quote: "penicillin", sentenceIds: [0] }),
        fact({ category: "allergy", value: "penicillin.", quote: "penicillin (hives)", sentenceIds: [0] }),
        fact({}),
      ]),
    );
    expect(facts.map((f) => f.value)).toEqual(["Penicillin", "Metformin 1000 mg"]);
  });

  it("handles invalid sentence ids without crashing", () => {
    const [f] = groundFacts(note, sentences, [fact({ sentenceIds: [99] })]);
    expect(f.grounding).toBe("corrected");
  });
});
