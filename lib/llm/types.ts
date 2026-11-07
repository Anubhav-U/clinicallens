import type { Extraction } from "../schema";

export interface LlmExtraction {
  extraction: Extraction;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

/** Any provider that can turn a numbered note into raw (unverified) facts. */
export interface ExtractionProvider {
  extract(numberedNote: string): Promise<LlmExtraction>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly kind: "quota" | "upstream" | "config",
  ) {
    super(message);
  }
}
