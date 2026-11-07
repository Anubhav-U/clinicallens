# Eval results

Run on 2026-11-07 with `gemini-3.5-flash-lite` over 10 hand-labeled synthetic notes.
Regenerate with `npm run eval`. Model output varies a little between runs.

| Category | Precision | Recall | F1 | TP | FP | FN |
|---|---|---|---|---|---|---|
| Problems | 85.7% | 100.0% | 92.3% | 24 | 4 | 0 |
| Medications | 100.0% | 100.0% | 100.0% | 30 | 0 | 0 |
| Vitals | 100.0% | 100.0% | 100.0% | 41 | 0 | 0 |
| Allergies | 100.0% | 100.0% | 100.0% | 11 | 0 | 0 |
| Plan | 100.0% | 81.8% | 90.0% | 18 | 0 | 4 |
| **Overall** | **96.9%** | **96.9%** | **96.9%** | 124 | 4 | 4 |

| Grounding | |
|---|---|
| Facts returned by the model | 143 |
| Verified verbatim in the note | 143 (100.0%) |
| Citation corrected by code | 0 |
| Unverified (flagged, excluded) | 0 |
| Negated findings wrongly extracted as diagnoses | 0 of 12 traps |
| Median model latency | 2.5 s |

## Misses (false negatives)

- primary-care: Plan: a1c
- psychiatry: Plan: cognitive behavioral
- dermatology: Plan: quantiferon
- dermatology: Plan: hepatitis b

## Extras (false positives)

Extracted facts that weren't in the hand labels. Some are reasonable but unlabeled; listed for transparency.

- primary-care: Problems: type 2 diabetes
- cardiology: Problems: ejection fraction of 30%
- prenatal: Problems: intrauterine pregnancy at 28 weeks
- prenatal: Problems: mild iron deficiency anemia
