import { z } from "zod";

export const CATEGORIES = [
  "diagnosis",
  "medication",
  "vital",
  "allergy",
  "follow_up",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const VITAL_TYPES = [
  "blood_pressure",
  "heart_rate",
  "temperature",
  "respiratory_rate",
  "oxygen_saturation",
  "weight",
  "height",
  "bmi",
  "blood_glucose",
  "other",
] as const;
export type VitalType = (typeof VITAL_TYPES)[number];

/** One fact as the model returns it. Validated before we trust it. */
export const RawFactSchema = z.object({
  category: z.enum(CATEGORIES),
  value: z
    .string()
    .min(1)
    .describe("Short human-readable label, e.g. 'Type 2 diabetes mellitus' or 'Metformin 500 mg'."),
  sentenceIds: z
    .array(z.int().nonnegative())
    .min(1)
    .describe("IDs of the numbered sentences [S#] that state this fact."),
  quote: z
    .string()
    .min(1)
    .describe("Exact text copied character-for-character from the note that supports the fact."),
  status: z
    .string()
    .optional()
    .describe(
      "diagnosis: active | history | resolved | suspected. medication: active | new | changed | discontinued.",
    ),
  dose: z.string().optional(),
  route: z.string().optional(),
  frequency: z.string().optional(),
  vitalType: z.enum(VITAL_TYPES).optional(),
  measurement: z
    .string()
    .optional()
    .describe("Numeric part of a vital, e.g. '142/88' or '98.6'."),
  unit: z.string().optional(),
  reaction: z.string().optional(),
  severity: z.string().optional(),
  timeframe: z.string().optional().describe("Follow-up timing, e.g. 'in 3 months'."),
});
export type RawFact = z.infer<typeof RawFactSchema>;

export const ExtractionSchema = z.object({
  facts: z.array(RawFactSchema),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

/** JSON Schema sent to the model to constrain its output. */
export function extractionJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(ExtractionSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
}

export const NOTE_MAX_CHARS = 8000;
export const NOTE_MIN_CHARS = 40;

export const ExtractRequestSchema = z.object({
  note: z.string().trim().min(NOTE_MIN_CHARS).max(NOTE_MAX_CHARS),
});
