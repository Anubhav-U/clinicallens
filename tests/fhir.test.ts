import { describe, expect, it } from "vitest";
import { toFhirBundle } from "@/lib/fhir";
import type { Fact } from "@/lib/types";

const f = (over: Partial<Fact>): Fact => ({
  id: "x",
  category: "diagnosis",
  value: "Hypertension",
  quote: "hypertension",
  grounding: "grounded",
  sentenceIds: [0],
  ...over,
});

describe("toFhirBundle", () => {
  const bundle = toFhirBundle(
    [
      f({ category: "diagnosis", value: "Hypertension" }),
      f({ category: "medication", value: "Lisinopril 10 mg", dose: "10 mg", frequency: "daily" }),
      f({ category: "vital", value: "BP 148/92", vitalType: "blood_pressure", measurement: "148/92" }),
      f({ category: "vital", value: "HR 76", vitalType: "heart_rate", measurement: "76", unit: "bpm" }),
      f({ category: "allergy", value: "Penicillin", reaction: "hives" }),
      f({ category: "follow_up", value: "Return in 3 months" }),
      f({ category: "diagnosis", value: "Made up", grounding: "ungrounded" }),
    ],
    new Date("2026-01-01T00:00:00Z"),
  ) as { resourceType: string; type: string; entry: { resource: Record<string, unknown> }[] };

  const types = bundle.entry.map((e) => e.resource.resourceType);

  it("is an R4 collection bundle with a synthetic patient", () => {
    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.type).toBe("collection");
    expect(types[0]).toBe("Patient");
  });

  it("uses valid urn:uuid fullUrls and points every subject at the patient", () => {
    const uuidRe = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    const entries = bundle.entry as unknown as { fullUrl: string; resource: Record<string, { reference?: string }> }[];
    for (const e of entries) expect(e.fullUrl).toMatch(uuidRe);
    expect(new Set(entries.map((e) => e.fullUrl)).size).toBe(entries.length);
    const patientUrl = entries[0].fullUrl;
    for (const e of entries.slice(1)) {
      const ref = e.resource.subject?.reference ?? e.resource.patient?.reference;
      expect(ref).toBe(patientUrl);
    }
  });

  it("maps categories to resources and drops ungrounded facts and follow-ups", () => {
    expect(types).toEqual([
      "Patient",
      "Condition",
      "MedicationStatement",
      "Observation",
      "Observation",
      "AllergyIntolerance",
    ]);
  });

  it("splits blood pressure into systolic/diastolic components with LOINC codes", () => {
    const bp = bundle.entry[3].resource as { component: { valueQuantity: { value: number } }[]; code: { coding: { code: string }[] } };
    expect(bp.code.coding[0].code).toBe("85354-9");
    expect(bp.component.map((c) => c.valueQuantity.value)).toEqual([148, 92]);
  });

  it("uses numeric valueQuantity for simple vitals", () => {
    const hr = bundle.entry[4].resource as { valueQuantity: { value: number; unit: string } };
    expect(hr.valueQuantity).toEqual({ value: 76, unit: "bpm" });
  });
});
