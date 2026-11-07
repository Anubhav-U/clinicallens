/**
 * Quick latency/grounding check on one sample.
 * Usage: npx tsx --env-file=.env.local scripts/bench.ts [sampleId]
 * Set GEMINI_THINKING / GEMINI_MODEL in the environment to compare settings.
 */
import { SAMPLES } from "../data/samples";
import { createGeminiProvider } from "../lib/llm/gemini";
import { runExtraction } from "../lib/pipeline";

const id = process.argv[2] ?? "primary-care";
const sample = SAMPLES.find((s) => s.id === id) ?? SAMPLES[0];
async function main() {
  const r = await runExtraction(sample.note, createGeminiProvider());
console.log(
  `${sample.id} model=${r.stats.model} thinking=${process.env.GEMINI_THINKING || "minimal"}: ` +
    `${r.stats.totalFacts} facts, ${r.stats.groundedFacts} grounded, ${r.stats.latencyMs} ms`,
);
}
main().catch((e) => { console.error(e); process.exit(1); });
