// Hand-written SYNTHETIC notes. Not real patients. No names, IDs are fake.

export interface SampleNote {
  id: string;
  title: string;
  subtitle: string;
  note: string;
}

export const SAMPLES: SampleNote[] = [
  {
    id: "primary-care",
    title: "Primary care follow-up",
    subtitle: "Diabetes + hypertension",
    note: `PRIMARY CARE FOLLOW-UP — SYNTHETIC PATIENT SYN-1042
58-year-old presents for a 3-month follow-up of type 2 diabetes mellitus and hypertension.
Reports good adherence to medications but admits to frequent snacking in the evenings.
Denies chest pain, shortness of breath, or vision changes.
Vitals: BP 148/92 mmHg, HR 76 bpm, Temp 98.4 F, SpO2 98% on room air.
Weight 212 lb, BMI 31.4.
Fingerstick glucose today was 186 mg/dL.
Current medications: metformin 1000 mg PO twice daily and lisinopril 10 mg PO once daily.
Atorvastatin 20 mg nightly was started last year for hyperlipidemia.
Allergies: penicillin (hives).
Assessment: type 2 diabetes, not at goal. Hypertension, above target.
Plan: increase lisinopril to 20 mg daily. Order hemoglobin A1c and basic metabolic panel.
Referral to nutrition counseling. Return to clinic in 3 months.`,
  },
  {
    id: "urgent-care",
    title: "Urgent care visit",
    subtitle: "Asthma exacerbation",
    note: `URGENT CARE NOTE — SYNTHETIC PATIENT SYN-2207
24-year-old with a history of mild persistent asthma presents with 2 days of wheezing and cough after a viral illness.
Using albuterol inhaler 4 to 5 times daily with partial relief.
No fever reported at home.
Vitals: HR 104, RR 22, Temp 99.1 F, SpO2 94% on room air.
Diffuse expiratory wheezes on exam, no accessory muscle use.
Received one albuterol-ipratropium nebulizer treatment in clinic with improvement; repeat SpO2 97%.
Diagnosis: acute asthma exacerbation, likely triggered by viral upper respiratory infection.
Start prednisone 40 mg by mouth daily for 5 days.
Continue albuterol 2 puffs every 4 hours as needed.
Start fluticasone 110 mcg inhaler 2 puffs twice daily.
No known drug allergies.
Return precautions reviewed: go to the emergency department for worsening shortness of breath.
Follow up with primary care in 1 week.`,
  },
  {
    id: "cardiology",
    title: "Cardiology consult",
    subtitle: "Heart failure + AFib",
    note: `CARDIOLOGY CONSULT — SYNTHETIC PATIENT SYN-3318
71-year-old referred for worsening exertional dyspnea and bilateral leg swelling over 3 weeks.
Past medical history includes heart failure with reduced ejection fraction, paroxysmal atrial fibrillation, and chronic kidney disease stage 3.
Prior myocardial infarction in 2019, treated with stent placement.
BP 132/78, HR 88 irregular, RR 18, SpO2 95%. Weight 189 lb, up 6 lb from last visit.
Echocardiogram last month showed an ejection fraction of 30%.
Home medications: carvedilol 12.5 mg twice daily, sacubitril-valsartan 49/51 mg twice daily, apixaban 5 mg twice daily.
He stopped furosemide 2 weeks ago on his own because of urinary frequency.
Allergic to sulfa drugs, which caused a rash.
Impression: acute on chronic systolic heart failure, volume overloaded after diuretic discontinuation.
Restart furosemide 40 mg by mouth daily.
Check BMP and NT-proBNP in 1 week.
Daily weights at home; call if weight increases by more than 3 lb in a day.
Cardiology follow-up in 2 weeks.`,
  },
  {
    id: "post-op",
    title: "Post-op check",
    subtitle: "Knee replacement",
    note: `ORTHOPEDIC POST-OPERATIVE VISIT — SYNTHETIC PATIENT SYN-4471
66-year-old seen 2 weeks after right total knee arthroplasty for severe osteoarthritis.
Pain is controlled at 3/10 with acetaminophen 1000 mg every 8 hours.
Oxycodone 5 mg as needed was discontinued last week.
Taking aspirin 81 mg twice daily for DVT prophylaxis, to continue for 4 more weeks.
Also has hypothyroidism, managed with levothyroxine 75 mcg daily.
Vitals: BP 126/80, HR 72, Temp 98.2 F.
Incision is clean, dry, and intact with no signs of infection.
Knee flexion to 95 degrees.
Allergy to codeine causes nausea.
Plan: continue outpatient physical therapy three times weekly.
Staples removed today.
Follow up in 4 weeks with repeat knee X-ray.`,
  },
];
