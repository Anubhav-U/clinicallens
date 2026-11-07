import { describe, expect, it } from "vitest";
import { SAMPLES } from "@/data/samples";
import { numberSentences, segmentNote } from "@/lib/segment";

describe("segmentNote", () => {
  it("splits on sentence punctuation and keeps exact offsets", () => {
    const note = "Patient is stable. BP was 120/80. Return in 2 weeks.";
    const s = segmentNote(note);
    expect(s.map((x) => x.text)).toEqual(["Patient is stable.", "BP was 120/80.", "Return in 2 weeks."]);
    for (const x of s) expect(note.slice(x.start, x.end)).toBe(x.text);
  });

  it("treats each line as a boundary and skips blank lines", () => {
    const s = segmentNote("Vitals: HR 72\n\nAllergies: none");
    expect(s.map((x) => x.text)).toEqual(["Vitals: HR 72", "Allergies: none"]);
  });

  it("does not split decimals or abbreviations", () => {
    const s = segmentNote("Temp 98.6 F today. Seen by Dr. Lee for metformin 500 mg b.i.d. with meals.");
    expect(s.map((x) => x.text)).toEqual([
      "Temp 98.6 F today.",
      "Seen by Dr. Lee for metformin 500 mg b.i.d. with meals.",
    ]);
  });

  it("numbers sentences for the prompt", () => {
    expect(numberSentences(segmentNote("A one. B two."))).toBe("[S0] A one.\n[S1] B two.");
  });

  it("offsets are exact for every bundled sample", () => {
    for (const sample of SAMPLES) {
      const s = segmentNote(sample.note);
      expect(s.length).toBeGreaterThan(5);
      for (const x of s) expect(sample.note.slice(x.start, x.end)).toBe(x.text);
    }
  });
});
