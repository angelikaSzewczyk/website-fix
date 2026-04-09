/**
 * Exponential-backoff wrapper for Anthropic API calls.
 * Retries on 429 (rate limit) and 529 (overloaded) automatically.
 */

function isRetryableError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  if (e.status === 429 || e.status === 529) return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  return msg.includes("rate_limit") || msg.includes("rate limit") || msg.includes("overloaded");
}

/**
 * Call an async function with exponential backoff on rate-limit errors.
 *
 * @param fn           – async function to execute (no args; use closure for params)
 * @param maxRetries   – maximum number of additional attempts after the first (default 3)
 * @param baseDelayMs  – initial wait in ms; doubles each attempt (default 2000)
 */
export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 2000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!isRetryableError(err) || attempt === maxRetries) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt); // 2s → 4s → 8s → 16s
      console.warn(`[ai-retry] Rate limit / overloaded – attempt ${attempt + 1}/${maxRetries}. Waiting ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError;
}
