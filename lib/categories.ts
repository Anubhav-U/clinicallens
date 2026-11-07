import type { Category, VitalType } from "./schema";

export interface CategoryMeta {
  /** Chart-style section name. */
  label: string;
  /** Literal Tailwind classes (must be static strings for Tailwind to detect). */
  tick: string;
  text: string;
}

export const CATEGORY_ORDER: Category[] = ["diagnosis", "medication", "vital", "allergy", "follow_up"];

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  diagnosis: { label: "Problems", tick: "bg-(--c-dx)", text: "text-(--c-dx)" },
  medication: { label: "Medications", tick: "bg-(--c-rx)", text: "text-(--c-rx)" },
  vital: { label: "Vitals", tick: "bg-(--c-vital)", text: "text-(--c-vital)" },
  allergy: { label: "Allergies", tick: "bg-(--c-allergy)", text: "text-(--c-allergy)" },
  follow_up: { label: "Plan", tick: "bg-(--c-plan)", text: "text-(--c-plan)" },
};

export const VITAL_LABEL: Record<VitalType, string> = {
  blood_pressure: "BP",
  heart_rate: "HR",
  temperature: "Temp",
  respiratory_rate: "RR",
  oxygen_saturation: "SpO₂",
  weight: "Weight",
  height: "Height",
  bmi: "BMI",
  blood_glucose: "Glucose",
  other: "Other",
};
