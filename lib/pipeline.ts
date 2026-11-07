import { dedupeFacts, groundFacts } from "./ground";
import type { ExtractionProvider } from "./llm/types";
import { numberSentences, segmentNote } from "./segment";
import type { ExtractionResult } from "./types";

/** segment -> LLM extraction -> verification. Shared by the API route and the precompute script. */
export async function runExtraction(
  note: string,
  provider: ExtractionProvider,
): Promise<ExtractionResult> {
  const normalizedNote = note.replace(/\r\n/g, "\n");
  const sentences = segmentNote(normalizedNote);
  const started = Date.now();
  const llm = await provider.extract(numberSentences(sentences));
  const latencyMs = Date.now() - started;
  const facts = dedupeFacts(groundFacts(normalizedNote, sentences, llm.extraction.facts));
  const ungroundedFacts = facts.filter((f) => f.grounding === "ungrounded").length;

  return {
    note: normalizedNote,
    sentences,
    facts,
    stats: {
      model: llm.model,
      latencyMs,
      totalFacts: facts.length,
      groundedFacts: facts.length - ungroundedFacts,
      ungroundedFacts,
      inputTokens: llm.inputTokens,
      outputTokens: llm.outputTokens,
    },
  };
}
