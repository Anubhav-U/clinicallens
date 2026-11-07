/**
 * Runs the real pipeline over the hand-labeled eval set and writes eval/RESULTS.md.
 * Usage: npm run eval   (needs GEMINI_API_KEY in .env.local)
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CATEGORIES } from "../lib/schema";
import { CATEGORY_META } from "../lib/categories";
import { createGeminiProvider } from "../lib/llm/gemini";
import { runExtraction } from "../lib/pipeline";
import { EVAL_CASES } from "../eval/cases";
import { prf, scoreCase, sumCounts, type CaseScore } from "../eval/score";

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const provider = createGeminiProvider();
  const scores: CaseScore[] = [];
  const latencies: number[] = [];
  let model = "";
  let totalFacts = 0;

  for (const c of EVAL_CASES) {
    process.stdout.write(`${c.id.padEnd(16)} `);
    const result = await runExtraction(c.note, provider);
    model = result.stats.model;
    latencies.push(result.stats.latencyMs);
    totalFacts += result.facts.length;
    const s = scoreCase(c, result.facts);
    scores.push(s);
    const all = prf(sumCounts(Object.values(s.byCategory)));
    console.log(
      `P ${pct(all.precision)}  R ${pct(all.recall)}  ${result.stats.latencyMs} ms` +
        (s.negationErrors.length ? `  NEGATION: ${s.negationErrors.join(", ")}` : ""),
    );
    await sleep(1200); // stay friendly to free-tier rate limits
  }

  const rows = CATEGORIES.map((cat) => {
    const counts = sumCounts(scores.map((s) => s.byCategory[cat]));
    return { label: CATEGORY_META[cat].label, counts, ...prf(counts) };
  });
  const overallCounts = sumCounts(rows.map((r) => r.counts));
  const overall = prf(overallCounts);
  const verified = scores.reduce((a, s) => a + s.verified, 0);
  const corrected = scores.reduce((a, s) => a + s.corrected, 0);
  const ungrounded = scores.reduce((a, s) => a + s.ungrounded, 0);
  const negation = scores.flatMap((s) => s.negationErrors.map((e) => `${s.id}: ${e}`));
  const forbiddenTotal = EVAL_CASES.reduce((a, c) => a + (c.forbiddenDiagnoses?.length ?? 0), 0);
  const sorted = [...latencies].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const md = [
    `# Eval results`,
    ``,
    `Run on ${new Date().toISOString().slice(0, 10)} with \`${model}\` over ${EVAL_CASES.length} hand-labeled synthetic notes.`,
    `Regenerate with \`npm run eval\`. Model output varies a little between runs.`,
    ``,
    `| Category | Precision | Recall | F1 | TP | FP | FN |`,
    `|---|---|---|---|---|---|---|`,
    ...rows.map(
      (r) =>
        `| ${r.label} | ${pct(r.precision)} | ${pct(r.recall)} | ${pct(r.f1)} | ${r.counts.tp} | ${r.counts.fp} | ${r.counts.fn} |`,
    ),
    `| **Overall** | **${pct(overall.precision)}** | **${pct(overall.recall)}** | **${pct(overall.f1)}** | ${overallCounts.tp} | ${overallCounts.fp} | ${overallCounts.fn} |`,
    ``,
    `| Grounding | |`,
    `|---|---|`,
    `| Facts returned by the model | ${totalFacts} |`,
    `| Verified verbatim in the note | ${verified} (${pct(verified / totalFacts)}) |`,
    `| Citation corrected by code | ${corrected} |`,
    `| Unverified (flagged, excluded) | ${ungrounded} |`,
    `| Negated findings wrongly extracted as diagnoses | ${negation.length} of ${forbiddenTotal} traps |`,
    `| Median model latency | ${(median / 1000).toFixed(1)} s |`,
    ``,
    `## Misses (false negatives)`,
    ``,
    ...scores.flatMap((s) => s.missed.map((m) => `- ${s.id}: ${CATEGORY_META[m.category].label}: ${m.aliases[0]}`)),
    ``,
    `## Extras (false positives)`,
    ``,
    `Extracted facts that weren't in the hand labels. Some are reasonable but unlabeled; listed for transparency.`,
    ``,
    ...scores.flatMap((s) => s.extra.map((x) => `- ${s.id}: ${CATEGORY_META[x.category].label}: ${x.value}`)),
    ...(negation.length ? [``, `## Negation errors`, ``, ...negation.map((n) => `- ${n}`)] : []),
    ``,
  ].join("\n");

  const file = join(process.cwd(), "eval", "RESULTS.md");
  writeFileSync(file, md);
  console.log(`\nOverall  P ${pct(overall.precision)}  R ${pct(overall.recall)}  F1 ${pct(overall.f1)}`);
  console.log(`Negation errors: ${negation.length}/${forbiddenTotal}. Wrote ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
