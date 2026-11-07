import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Limiters = { perIp: Ratelimit; global: Ratelimit } | null;
let limiters: Limiters | undefined;

function getLimiters(): Limiters {
  if (limiters !== undefined) return limiters;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn("[ratelimit] Upstash env vars missing; rate limiting is DISABLED.");
    limiters = null;
    return limiters;
  }
  const redis = new Redis({ url, token });
  limiters = {
    // Per visitor: 8 live extractions per hour.
    perIp: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, "1 h"),
      prefix: "clinicallens:ip",
    }),
    // Whole demo: stays under the Gemini free-tier daily quota.
    global: new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(200, "1 d"),
      prefix: "clinicallens:global",
    }),
  };
  return limiters;
}

export async function checkRateLimit(
  ip: string,
): Promise<{ ok: true } | { ok: false; scope: "ip" | "global"; resetAt: number }> {
  const l = getLimiters();
  if (!l) return { ok: true };
  try {
    const ipRes = await l.perIp.limit(ip);
    if (!ipRes.success) return { ok: false, scope: "ip", resetAt: ipRes.reset };
    const globalRes = await l.global.limit("all");
    if (!globalRes.success) return { ok: false, scope: "global", resetAt: globalRes.reset };
  } catch (err) {
    // Fail open: a limiter outage shouldn't take the demo down. Gemini's own quota still caps usage.
    console.error("[ratelimit] check failed, allowing request", err);
  }
  return { ok: true };
}
