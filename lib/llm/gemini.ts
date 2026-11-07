import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { ExtractionSchema, extractionJsonSchema } from "../schema";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { ProviderError, type ExtractionProvider, type LlmExtraction } from "./types";

// Benchmarked on the bundled samples (free tier): flash-lite + minimal thinking ran in ~3-4 s
// with 100% of facts verified; gemini-3.8-flash took 80-240 s per note for similar output.
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

// Extraction is lookup, not reasoning, so thinking is kept minimal by default.
const THINKING_LEVELS: Record<string, ThinkingLevel> = {
  minimal: ThinkingLevel.MINIMAL,
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};
function thinkingLevel(): ThinkingLevel {
  return THINKING_LEVELS[(process.env.GEMINI_THINKING || "minimal").toLowerCase()] ?? ThinkingLevel.MINIMAL;
}

export function createGeminiProvider(
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
): ExtractionProvider {
  if (!apiKey) {
    throw new ProviderError("GEMINI_API_KEY is not set.", "config");
  }
  const ai = new GoogleGenAI({ apiKey });

  async function attempt(numberedNote: string): Promise<LlmExtraction> {
      let text: string | undefined;
      let usage: { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;
      try {
        const res = await ai.models.generateContent({
          model,
          contents: buildUserPrompt(numberedNote),
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseJsonSchema: extractionJsonSchema(),
            thinkingConfig: { thinkingLevel: thinkingLevel() },
          },
        });
        text = res.text;
        usage = res.usageMetadata;
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          throw new ProviderError("The demo's free AI quota is used up for now.", "quota");
        }
        console.error("Gemini request failed", err);
        throw new ProviderError("The AI service failed to respond.", "upstream");
      }

      if (!text) throw new ProviderError("The AI service returned an empty response.", "upstream");

      // Never trust model output blindly: parse and validate against the schema.
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new ProviderError("The AI service returned invalid JSON.", "upstream");
      }
      const result = ExtractionSchema.safeParse(parsed);
      if (!result.success) {
        console.error("Schema validation failed", result.error.issues.slice(0, 5));
        throw new ProviderError("The AI response didn't match the expected format.", "upstream");
      }

      return {
        extraction: result.data,
        model,
        inputTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
      };
  }

  return {
    async extract(numberedNote: string): Promise<LlmExtraction> {
      // Free-tier calls occasionally fail transiently (5xx, malformed JSON): retry once.
      // Quota and config errors are not retried.
      try {
        return await attempt(numberedNote);
      } catch (err) {
        if (err instanceof ProviderError && err.kind === "upstream") {
          console.warn("[gemini] transient failure, retrying once:", err.message);
          return attempt(numberedNote);
        }
        throw err;
      }
    },
  };
}
