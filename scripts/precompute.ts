/**
 * Runs each bundled sample through the real pipeline once and saves the results,
 * so visitors who pick a sample get instant results with zero API calls.
 * Usage: npm run precompute   (needs GEMINI_API_KEY in .env.local)
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { SAMPLES } from "../data/samples";
import { createGeminiProvider } from "../lib/llm/gemini";
import { runExtraction } from "../lib/pipeline";
import type { ExtractionResult } from "../lib/types";

async function main() {
  const provider = createGeminiProvider();
  const out: Record<string, ExtractionResult> = {};
  for (const s of SAMPLES) {
    process.stdout.write(`${s.id} ... `);
    const result = await runExtraction(s.note, provider);
    out[s.id] = result;
    const { totalFacts, groundedFacts, latencyMs } = result.stats;
    console.log(`${totalFacts} facts, ${groundedFacts} grounded, ${latencyMs} ms`);
    const corrected = result.facts.filter((f) => f.grounding === "corrected").length;
    if (corrected) console.log(`  ${corrected} citation(s) corrected`);
  }
  const file = join(process.cwd(), "data", "precomputed.json");
  writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log(`Saved ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
