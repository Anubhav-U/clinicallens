import type { VitalType } from "./schema";
import type { Fact } from "./types";

// LOINC codes for common vital signs (FHIR R4 vital-signs profile).
const VITAL_LOINC: Partial<Record<VitalType, { code: string; display: string; unit?: string }>> = {
  blood_pressure: { code: "85354-9", display: "Blood pressure panel", unit: "mm[Hg]" },
  heart_rate: { code: "8867-4", display: "Heart rate", unit: "/min" },
  temperature: { code: "8310-5", display: "Body temperature" },
  respiratory_rate: { code: "9279-1", display: "Respiratory rate", unit: "/min" },
  oxygen_saturation: { code: "59408-5", display: "Oxygen saturation by pulse oximetry", unit: "%" },
  weight: { code: "29463-7", display: "Body weight" },
  height: { code: "8302-2", display: "Body height" },
  bmi: { code: "39156-5", display: "Body mass index", unit: "kg/m2" },
  blood_glucose: { code: "2339-0", display: "Glucose [Mass/volume] in Blood", unit: "mg/dL" },
};

// Bundle-local references must be real UUIDs to pass FHIR validators.
let PATIENT_REF = "";

type Resource = Record<string, unknown> & { resourceType: string };

function extensionNote(fact: Fact) {
  return [{ text: `Source: "${fact.quote}" (ClinicalLens, ${fact.grounding})` }];
}

function condition(f: Fact): Resource {
  const status = (f.status ?? "active").toLowerCase();
  const clinical = status === "resolved" ? "resolved" : status === "history" ? "inactive" : "active";
  return {
    resourceType: "Condition",
    clinicalStatus: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: clinical }],
    },
    verificationStatus: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
          code: status === "suspected" ? "provisional" : "confirmed",
        },
      ],
    },
    code: { text: f.value },
    subject: { reference: PATIENT_REF },
    note: extensionNote(f),
  };
}

function medication(f: Fact): Resource {
  const status = (f.status ?? "active").toLowerCase();
  const fhirStatus = status === "discontinued" ? "stopped" : "active";
  const dosageText = [f.dose, f.route, f.frequency].filter(Boolean).join(" ");
  return {
    resourceType: "MedicationStatement",
    status: fhirStatus,
    medicationCodeableConcept: { text: f.value },
    subject: { reference: PATIENT_REF },
    ...(dosageText ? { dosage: [{ text: dosageText }] } : {}),
    note: extensionNote(f),
  };
}

function observation(f: Fact): Resource {
  const loinc = f.vitalType ? VITAL_LOINC[f.vitalType] : undefined;
  const base: Resource = {
    resourceType: "Observation",
    status: "final",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs",
          },
        ],
      },
    ],
    code: loinc
      ? { coding: [{ system: "http://loinc.org", code: loinc.code, display: loinc.display }], text: f.value }
      : { text: f.value },
    subject: { reference: PATIENT_REF },
    note: extensionNote(f),
  };

  const m = f.measurement?.trim();
  const unit = f.unit ?? loinc?.unit;
  const bp = m?.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (f.vitalType === "blood_pressure" && bp) {
    const comp = (code: string, display: string, v: string) => ({
      code: { coding: [{ system: "http://loinc.org", code, display }] },
      valueQuantity: { value: Number(v), unit: "mmHg", system: "http://unitsofmeasure.org", code: "mm[Hg]" },
    });
    base.component = [comp("8480-6", "Systolic blood pressure", bp[1]), comp("8462-4", "Diastolic blood pressure", bp[2])];
  } else if (m && !Number.isNaN(Number(m))) {
    base.valueQuantity = { value: Number(m), ...(unit ? { unit } : {}) };
  } else if (m) {
    base.valueString = unit ? `${m} ${unit}` : m;
  }
  return base;
}

function allergy(f: Fact): Resource {
  return {
    resourceType: "AllergyIntolerance",
    clinicalStatus: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", code: "active" }],
    },
    code: { text: f.value },
    patient: { reference: PATIENT_REF },
    ...(f.reaction
      ? {
          reaction: [
            {
              manifestation: [{ text: f.reaction }],
              ...(f.severity && ["mild", "moderate", "severe"].includes(f.severity.toLowerCase())
                ? { severity: f.severity.toLowerCase() }
                : {}),
            },
          ],
        }
      : {}),
    note: extensionNote(f),
  };
}

/** FHIR R4 collection Bundle. Only verified facts are exported; follow-ups are out of MVP scope. */
export function toFhirBundle(
  facts: Fact[],
  now = new Date(),
  uuid: () => string = () => crypto.randomUUID(),
): Resource {
  const patientId = uuid();
  PATIENT_REF = `urn:uuid:${patientId}`;
  const resources: Resource[] = [
    {
      resourceType: "Patient",
      id: patientId,
      meta: {
        tag: [
          {
            system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
            code: "HTEST",
            display: "test health data",
          },
        ],
      },
    },
  ];
  for (const f of facts) {
    if (f.grounding === "ungrounded") continue;
    if (f.category === "diagnosis") resources.push(condition(f));
    else if (f.category === "medication") resources.push(medication(f));
    else if (f.category === "vital") resources.push(observation(f));
    else if (f.category === "allergy") resources.push(allergy(f));
  }
  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: now.toISOString(),
    entry: resources.map((resource, i) => ({
      fullUrl: i === 0 ? PATIENT_REF : `urn:uuid:${uuid()}`,
      resource,
    })),
  };
}
