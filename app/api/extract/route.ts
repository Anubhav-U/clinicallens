import { createGeminiProvider } from "@/lib/llm/gemini";
import { ProviderError } from "@/lib/llm/types";
import { runExtraction } from "@/lib/pipeline";
import { checkRateLimit } from "@/lib/ratelimit";
import { ExtractRequestSchema, NOTE_MAX_CHARS, NOTE_MIN_CHARS } from "@/lib/schema";
import type { ApiError } from "@/lib/types";

export const maxDuration = 60;

function fail(status: number, code: ApiError["code"], error: string) {
  return Response.json({ error, code } satisfies ApiError, { status });
}

export async function POST(request: Request) {
  // Reject oversized bodies before parsing (the note cap is far smaller than this).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > 64 * 1024) {
    return fail(413, "too_long", `Notes are capped at ${NOTE_MAX_CHARS.toLocaleString()} characters.`);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_input", "Request body must be JSON.");
  }

  const parsed = ExtractRequestSchema.safeParse(body);
  if (!parsed.success) {
    const note = (body as { note?: unknown })?.note;
    if (typeof note === "string" && note.trim().length > NOTE_MAX_CHARS) {
      return fail(413, "too_long", `Notes are capped at ${NOTE_MAX_CHARS.toLocaleString()} characters.`);
    }
    return fail(400, "invalid_input", `Paste a note of at least ${NOTE_MIN_CHARS} characters.`);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = await checkRateLimit(ip);
  if (!limit.ok) {
    const minutes = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 60000));
    return fail(
      429,
      "rate_limited",
      limit.scope === "ip"
        ? `You've hit the demo limit. Try again in about ${minutes} min, or explore the sample notes.`
        : "The demo's daily limit is reached. The sample notes still work instantly.",
    );
  }

  try {
    const result = await runExtraction(parsed.data.note, createGeminiProvider());
    console.info("[extract]", JSON.stringify(result.stats));
    return Response.json(result);
  } catch (err) {
    if (err instanceof ProviderError) {
      if (err.kind === "quota") return fail(429, "quota", `${err.message} The sample notes still work instantly.`);
      if (err.kind === "config") return fail(500, "config", "The AI service isn't configured on this server.");
      return fail(502, "upstream", err.message);
    }
    console.error(err);
    return fail(500, "upstream", "Something went wrong. Please try again.");
  }
}
