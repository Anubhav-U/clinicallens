// Hand-labeled SYNTHETIC eval set. No real patients. Expected facts were written by hand
// from each note before running the model.
import { SAMPLES } from "../data/samples";
import type { EvalCase, ExpectedFact } from "./types";

const dx = (aliases: string[], optional = false): ExpectedFact => ({ category: "diagnosis", aliases, optional });
const rx = (aliases: string[], optional = false): ExpectedFact => ({ category: "medication", aliases, optional });
const vs = (aliases: string[], optional = false): ExpectedFact => ({ category: "vital", aliases, optional });
const al = (aliases: string[], optional = false): ExpectedFact => ({ category: "allergy", aliases, optional });
const fu = (aliases: string[], optional = false): ExpectedFact => ({ category: "follow_up", aliases, optional });

const sample = (id: string) => SAMPLES.find((s) => s.id === id)!.note;

export const EVAL_CASES: EvalCase[] = [
  {
    id: "primary-care",
    note: sample("primary-care"),
    expected: [
      dx(["diabetes"]), dx(["hypertension"]), dx(["hyperlipidemia"]),
      rx(["metformin"]), rx(["lisinopril"]), rx(["lisinopril"], true), rx(["atorvastatin"]),
      vs(["148/92"]), vs(["76"]), vs(["98.4"]), vs(["98%", "spo2 98", "98"]), vs(["212"]), vs(["31.4"]), vs(["186"]),
      al(["penicillin"]),
      fu(["a1c"]), fu(["metabolic panel", "bmp"]), fu(["nutrition"]), fu(["3 months"]),
    ],
    forbiddenDiagnoses: ["chest pain", "shortness of breath", "vision changes"],
  },
  {
    id: "urgent-care",
    note: sample("urgent-care"),
    expected: [
      dx(["persistent asthma", "history of mild"]), dx(["exacerbation"]), dx(["respiratory infection", "uri"], true),
      rx(["ipratropium"], true), rx(["albuterol"]), rx(["albuterol"], true), rx(["prednisone"]), rx(["fluticasone"]),
      vs(["104"]), vs(["rr 22", "22"]), vs(["99.1"]), vs(["94"]), vs(["97"], true),
      al(["no known"]),
      fu(["emergency"]), fu(["1 week"]),
    ],
    forbiddenDiagnoses: ["fever"],
  },
  {
    id: "cardiology",
    note: sample("cardiology"),
    expected: [
      dx(["reduced ejection"]), dx(["atrial fibrillation"]), dx(["kidney disease", "ckd"]), dx(["myocardial infarction"]),
      dx(["acute on chronic"]), dx(["volume overload"], true), dx(["dyspnea"], true), dx(["swelling", "edema"], true),
      dx(["stent"], true),
      rx(["carvedilol"]), rx(["sacubitril", "entresto"]), rx(["apixaban"]), rx(["furosemide"]), rx(["furosemide"], true),
      vs(["132/78"]), vs(["88"]), vs(["18"]), vs(["95"]), vs(["189"]), vs(["30%"], true),
      al(["sulfa"]),
      fu(["bnp", "bmp"]), fu(["2 weeks"]), fu(["daily weight", "3 lb"], true),
    ],
  },
  {
    id: "post-op",
    note: sample("post-op"),
    expected: [
      dx(["osteoarthritis"]), dx(["hypothyroidism"]), dx(["arthroplasty", "knee replacement"], true),
      rx(["acetaminophen"]), rx(["oxycodone"]), rx(["aspirin"]), rx(["levothyroxine"]),
      vs(["126/80"]), vs(["72"]), vs(["98.2"]), vs(["flexion", "95 degrees"], true),
      al(["codeine"]),
      fu(["physical therapy"]), fu(["4 weeks", "x-ray"]), fu(["staples"], true),
    ],
  },
  {
    id: "pediatric-ear",
    note: `PEDIATRIC SICK VISIT — SYNTHETIC PATIENT SYN-5120
6-year-old brought in by a parent for 3 days of right ear pain and fever up to 102.4 F at home.
Temp 101.8 F, HR 118, RR 24, SpO2 99%. Weight 21 kg.
Right tympanic membrane is bulging and erythematous.
Diagnosis: acute otitis media, right ear.
Start amoxicillin 90 mg/kg/day divided twice daily for 10 days.
Ibuprofen 200 mg every 6 hours as needed for pain or fever.
Allergic to cefdinir, which caused a rash.
Immunizations are up to date.
Recheck in 2 to 3 days if not improving, otherwise follow up in 2 weeks for an ear recheck.`,
    expected: [
      dx(["otitis media"]), dx(["fever"], true), dx(["ear pain"], true),
      rx(["amoxicillin"]), rx(["ibuprofen"]),
      vs(["101.8"]), vs(["118"]), vs(["24"]), vs(["99"]), vs(["21"]), vs(["102.4"], true),
      al(["cefdinir"]),
      fu(["2 to 3 days"]), fu(["2 weeks"]),
    ],
  },
  {
    id: "psychiatry",
    note: `PSYCHIATRY FOLLOW-UP — SYNTHETIC PATIENT SYN-6034
34-year-old with major depressive disorder and generalized anxiety disorder returns after 6 weeks on sertraline 50 mg daily.
Reports improved mood and sleep, but still has daytime anxiety.
Denies suicidal ideation.
PHQ-9 score improved from 18 to 11.
Bupropion was stopped last year due to insomnia.
BP 118/76, HR 72, weight 154 lb.
No known drug allergies.
Plan: increase sertraline to 100 mg daily.
Continue weekly cognitive behavioral therapy.
Return in 4 weeks; call the crisis line or go to the nearest emergency department for any thoughts of self-harm.`,
    expected: [
      dx(["depressive"]), dx(["anxiety disorder"]), dx(["insomnia"], true), dx(["daytime anxiety"], true),
      rx(["sertraline"]), rx(["sertraline"], true), rx(["bupropion"]),
      vs(["118/76"]), vs(["72"]), vs(["154"]), vs(["phq"], true),
      al(["no known"]),
      fu(["cognitive behavioral", "therapy"]), fu(["4 weeks"]), fu(["crisis", "emergency"], true),
    ],
    forbiddenDiagnoses: ["suicidal"],
  },
  {
    id: "prenatal",
    note: `PRENATAL VISIT — SYNTHETIC PATIENT SYN-7781
29-year-old G2P1 at 28 weeks gestation for routine prenatal care.
Feels regular fetal movement.
Denies headache, vision changes, or vaginal bleeding.
BP 136/88, HR 84, weight 172 lb. Fetal heart rate 145 bpm.
One-hour glucose challenge test result was 152 mg/dL, above the screening cutoff.
Taking a prenatal vitamin daily and ferrous sulfate 325 mg daily for iron deficiency anemia.
Allergic to latex, causing hives.
Assessment: intrauterine pregnancy at 28 weeks; abnormal glucose screen; mild iron deficiency anemia.
Plan: schedule a 3-hour glucose tolerance test this week.
Give Tdap vaccine today.
Return in 2 weeks for a blood pressure check.`,
    expected: [
      dx(["pregnancy", "gestation"]), dx(["anemia"]), dx(["glucose screen", "glucose challenge"], true),
      rx(["prenatal vitamin"]), rx(["ferrous sulfate"]), rx(["tdap"], true),
      vs(["136/88"]), vs(["84"]), vs(["172"]), vs(["145"], true), vs(["152"], true),
      al(["latex"]),
      fu(["tolerance test"]), fu(["2 weeks"]), fu(["tdap"], true),
    ],
    forbiddenDiagnoses: ["headache", "vaginal bleeding"],
  },
  {
    id: "ed-wrist",
    note: `EMERGENCY DEPARTMENT NOTE — SYNTHETIC PATIENT SYN-8450
45-year-old fell from a ladder about 6 feet, landing on the left wrist.
No head strike and no loss of consciousness.
Pain 8/10 with swelling and deformity of the left wrist.
BP 142/90, HR 96, RR 16, Temp 98.6 F, SpO2 99%.
X-ray shows a displaced distal radius fracture.
History of type 1 diabetes on insulin glargine 20 units nightly and insulin lispro with meals.
Point-of-care glucose 212 mg/dL.
Allergies: morphine (itching) and shellfish (throat swelling).
Given hydromorphone 0.5 mg IV once for pain.
Closed reduction performed and splint applied.
Diagnosis: closed displaced fracture of the left distal radius.
Follow up with orthopedics in 5 to 7 days.
Keep the splint dry and elevate the arm.`,
    expected: [
      dx(["radius"]), dx(["type 1 diabetes"]), dx(["fracture"], true), dx(["wrist pain", "deformity", "swelling"], true),
      rx(["glargine"]), rx(["lispro"]), rx(["hydromorphone"]),
      vs(["142/90"]), vs(["96"]), vs(["16"]), vs(["98.6"]), vs(["99"]), vs(["212"]),
      al(["morphine"]), al(["shellfish"]),
      fu(["orthopedic"]), fu(["splint", "elevate"], true),
    ],
    forbiddenDiagnoses: ["head injury", "concussion", "loss of consciousness"],
  },
  {
    id: "pulmonology",
    note: `PULMONOLOGY CLINIC — SYNTHETIC PATIENT SYN-9012
67-year-old former smoker with COPD (GOLD stage 2) and obstructive sleep apnea.
Quit smoking 5 years ago after a 40 pack-year history.
Two exacerbations in the past year, one requiring hospitalization in March.
Current inhalers: tiotropium 18 mcg inhaled once daily and albuterol 90 mcg 2 puffs every 6 hours as needed.
Uses CPAP nightly at 10 cm H2O.
RR 18, SpO2 91% on room air, HR 82, BP 128/74.
Spirometry today: FEV1 58% predicted.
No known drug allergies.
Pneumonia was ruled out on chest X-ray last month.
Plan: add fluticasone-salmeterol 250/50 mcg one inhalation twice daily.
Refer to pulmonary rehabilitation.
Return in 3 months with repeat spirometry.`,
    expected: [
      dx(["copd"]), dx(["sleep apnea"]), dx(["smok", "pack-year"], true), dx(["exacerbation"], true),
      rx(["tiotropium"]), rx(["albuterol"]), rx(["salmeterol"]), rx(["cpap"], true),
      vs(["18"]), vs(["91"]), vs(["82"]), vs(["128/74"]), vs(["fev1", "58%"], true),
      al(["no known"]),
      fu(["rehabilitation"]), fu(["3 months"]), fu(["spirometry"], true),
    ],
    forbiddenDiagnoses: ["pneumonia"],
  },
  {
    id: "dermatology",
    note: `DERMATOLOGY VISIT — SYNTHETIC PATIENT SYN-1188
52-year-old with plaque psoriasis on the elbows and knees, about 8% body surface area.
Has tried clobetasol 0.05% ointment twice daily with partial response.
Also has psoriatic arthritis affecting both hands.
Methotrexate was discontinued in 2024 due to elevated liver enzymes.
Hx of hypertension, controlled on amlodipine 5 mg daily.
BP 134/82.
Allergies: none known.
Plan: start adalimumab 40 mg subcutaneous every other week after a negative tuberculosis test.
Order a QuantiFERON TB test and hepatitis B panel today.
Follow up in 12 weeks.`,
    expected: [
      dx(["psoriasis"]), dx(["psoriatic arthritis"]), dx(["hypertension"]), dx(["liver enzymes"], true),
      rx(["clobetasol"]), rx(["methotrexate"]), rx(["amlodipine"]), rx(["adalimumab"]),
      vs(["134/82"]), vs(["8%"], true),
      al(["none", "no known"]),
      fu(["quantiferon", "tuberculosis", "tb test"]), fu(["hepatitis b"]), fu(["12 weeks"]),
    ],
    forbiddenDiagnoses: ["tuberculosis"],
  },
];
