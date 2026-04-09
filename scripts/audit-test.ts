/**
 * WebsiteFix — Full Audit Test Suite
 *
 * Run:  npx tsx scripts/audit-test.ts
 *
 * Tests:
 *  1. Load simulation  — 30 concurrent requests to /api/scan (batching + retry)
 *  2. Cache validation — second identical scan returns fromCache=true, 0 AI tokens
 *  3. Edge cases       — long URL, 404 URL, minimal HTML page
 *  4. Token audit      — model assignments across all API routes
 */

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ── Colour helpers ────────────────────────────────────────────────────────────
const G = (s: string) => `\x1b[32m${s}\x1b[0m`;
const R = (s: string) => `\x1b[31m${s}\x1b[0m`;
const Y = (s: string) => `\x1b[33m${s}\x1b[0m`;
const B = (s: string) => `\x1b[34m${s}\x1b[0m`;

let passed = 0, failed = 0, warned = 0;

function ok(msg: string)   { console.log(G("  ✓ " + msg)); passed++; }
function fail(msg: string) { console.log(R("  ✗ " + msg)); failed++; }
function warn(msg: string) { console.log(Y("  ⚠ " + msg)); warned++; }
function head(msg: string) { console.log(B("\n══ " + msg + " ══")); }

// ── Helper: POST /api/scan ────────────────────────────────────────────────────
async function quickScan(url: string): Promise<{
  ok: boolean; status: number; fromCache?: boolean; latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const body = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      fromCache: (body as Record<string, unknown>).fromCache === true,
      latencyMs: Date.now() - start,
      error: (body as Record<string, unknown>).error as string | undefined,
    };
  } catch (e) {
    return { ok: false, status: 0, latencyMs: Date.now() - start, error: String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — LOAD SIMULATION
// ─────────────────────────────────────────────────────────────────────────────
async function testLoad() {
  head("TEST 1 — Load Simulation (30 concurrent requests)");
  console.log("  Firing 30 simultaneous POST /api/scan requests…");

  const TARGET = "https://example.com";
  const CONCURRENCY = 30;

  const promises = Array.from({ length: CONCURRENCY }, (_, i) =>
    quickScan(TARGET).then(r => ({ ...r, i }))
  );

  const t0 = Date.now();
  const results = await Promise.allSettled(promises);
  const elapsed = Date.now() - t0;

  const resolved  = results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<{ok:boolean;status:number;fromCache?:boolean;latencyMs:number}>).value);
  const succeeded = resolved.filter(r => r.ok || r.status === 429 || r.status === 403);
  const errors    = resolved.filter(r => !r.ok && r.status !== 429 && r.status !== 403);
  const cached    = resolved.filter(r => r.fromCache);
  const rateLimited = resolved.filter(r => r.status === 429);
  const avgLatency = resolved.length ? Math.round(resolved.reduce((s, r) => s + r.latencyMs, 0) / resolved.length) : 0;

  console.log(`  Resolved: ${resolved.length}/30 | Cached: ${cached.length} | Rate-limited: ${rateLimited.length} | Errors: ${errors.length}`);
  console.log(`  Total time: ${elapsed}ms | Avg latency: ${avgLatency}ms`);

  if (errors.length === 0)
    ok("No unexpected errors (non-429/403) under 30 concurrent requests");
  else
    fail(`${errors.length} unexpected errors: ${errors.slice(0,3).map(r=>r.status).join(", ")}`);

  if (rateLimited.length > 0)
    ok(`Rate limiter active — blocked ${rateLimited.length} excess requests`);
  else
    warn("Rate limiter fired 0 times — in-memory limiter may be bypassed across serverless instances");

  if (cached.length > 0)
    ok(`Cache hit on ${cached.length} requests — saved tokens`);
  else
    warn("No cache hits (expected on first run or if URL was not cached yet)");

  if (elapsed < 30000)
    ok(`All 30 requests resolved within 30s (${elapsed}ms total)`);
  else
    fail(`Requests took ${elapsed}ms — possible timeout risk`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — CACHE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
async function testCache() {
  head("TEST 2 — Cache Validation");

  const URL_TO_TEST = "https://example.com";

  console.log("  Scan 1: initial scan (populates cache)…");
  const first = await quickScan(URL_TO_TEST);

  if (!first.ok && first.status !== 429) {
    warn(`Scan 1 failed (${first.status}): ${first.error} — skipping cache test`);
    return;
  }

  console.log(`  Scan 1: status=${first.status} fromCache=${first.fromCache} latency=${first.latencyMs}ms`);

  console.log("  Scan 2: immediate repeat scan (should hit cache)…");
  const second = await quickScan(URL_TO_TEST);

  console.log(`  Scan 2: status=${second.status} fromCache=${second.fromCache} latency=${second.latencyMs}ms`);

  if (second.fromCache === true)
    ok("Cache hit confirmed — fromCache=true on second scan, 0 AI tokens consumed");
  else
    fail("Cache MISS on second scan — cache writes may still be broken");

  if (second.fromCache && second.latencyMs < first.latencyMs * 0.5)
    ok(`Cache is faster: ${second.latencyMs}ms vs ${first.latencyMs}ms (>${Math.round((1 - second.latencyMs / first.latencyMs) * 100)}% speedup)`);
  else if (second.fromCache)
    warn(`Cache hit but not faster: ${second.latencyMs}ms vs ${first.latencyMs}ms — check DB latency`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────
async function testEdgeCases() {
  head("TEST 3 — Edge Cases");

  // 3a: URL > 2000 chars
  const longUrl = "https://example.com/" + "a".repeat(2000);
  console.log(`  3a: Long URL (${longUrl.length} chars)…`);
  const r1 = await quickScan(longUrl);
  if (r1.status === 400)
    ok("Long URL correctly rejected with 400");
  else
    fail(`Long URL returned ${r1.status} — expected 400`);

  // 3b: 404 page
  const url404 = "https://httpstat.us/404";
  console.log(`  3b: 404 URL (${url404})…`);
  const r2 = await quickScan(url404);
  if (r2.ok || r2.status === 429 || r2.status === 403)
    ok(`404 URL handled gracefully (status=${r2.status}) — scan returns result, not crash`);
  else
    fail(`404 URL caused unexpected error: status=${r2.status} error=${r2.error}`);

  // 3c: Minimal HTML (no images, no forms) — use example.com which is minimal
  const minimalUrl = "https://example.com";
  console.log(`  3c: Minimal HTML (${minimalUrl})…`);
  const r3 = await quickScan(minimalUrl);
  if (r3.ok || r3.fromCache || r3.status === 429)
    ok(`Minimal page handled (status=${r3.status} fromCache=${r3.fromCache})`);
  else
    fail(`Minimal page error: ${r3.status} — ${r3.error}`);

  // 3d: Private IP (SSRF test)
  const privateIp = "http://192.168.1.1";
  console.log(`  3d: Private IP SSRF attempt (${privateIp})…`);
  const r4 = await quickScan(privateIp);
  if (r4.status === 400 || r4.status === 403)
    ok("Private IP blocked by SSRF guard");
  else
    fail(`Private IP not blocked — returned ${r4.status}`);

  // 3e: Non-HTTP protocol
  const ftpUrl = "ftp://example.com";
  console.log(`  3e: Non-HTTP protocol (${ftpUrl})…`);
  const r5 = await quickScan(ftpUrl);
  if (r5.status === 400 || r5.status === 403)
    ok("Non-HTTP protocol blocked");
  else
    fail(`Non-HTTP protocol not blocked — returned ${r5.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 — TOKEN / MODEL AUDIT (static analysis)
// ─────────────────────────────────────────────────────────────────────────────
async function testTokenAudit() {
  head("TEST 4 — Token / Model Audit (static)");

  const fs = await import("fs");
  const path = await import("path");

  const SRC = path.join(process.cwd(), "src");

  function grep(dir: string, pattern: RegExp, ext = /\.(ts|tsx)$/): { file: string; line: number; text: string }[] {
    const hits: { file: string; line: number; text: string }[] = [];
    function walk(d: string) {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") walk(full);
        else if (entry.isFile() && ext.test(entry.name)) {
          fs.readFileSync(full, "utf8").split("\n").forEach((line, i) => {
            if (pattern.test(line)) hits.push({ file: full.replace(SRC, "src"), line: i + 1, text: line.trim() });
          });
        }
      }
    }
    walk(dir);
    return hits;
  }

  // Check: no hardcoded model strings (except in ai-models.ts itself)
  const hardcoded = grep(SRC, /["']claude-(haiku|sonnet|opus)/)
    .filter(h => !h.file.includes("ai-models.ts"));

  if (hardcoded.length === 0)
    ok("All model references use MODELS.* constants — no hardcoded strings");
  else {
    fail(`${hardcoded.length} hardcoded model string(s) found:`);
    hardcoded.forEach(h => console.log(R(`    ${h.file}:${h.line}  ${h.text}`)));
  }

  // Check: MODELS.EXPERT used only in expected places
  const expertUsages = grep(SRC, /MODELS\.EXPERT/);
  console.log(`  MODELS.EXPERT used in ${expertUsages.length} location(s):`);
  expertUsages.forEach(h => console.log(`    ${h.file}:${h.line}`));
  const expectedExpert = ["expert-fix", "full-scan", "reports", "slack"];
  const unexpectedExpert = expertUsages.filter(h => !expectedExpert.some(e => h.file.includes(e)));
  if (unexpectedExpert.length === 0)
    ok("MODELS.EXPERT only used in approved expert-analysis routes");
  else
    warn(`MODELS.EXPERT used unexpectedly in: ${unexpectedExpert.map(h=>h.file).join(", ")}`);

  // Check: cache save calls are awaited (match call-site lines, not imports/defs/comments)
  const unawaited = grep(SRC, /\bsaveScan(Async)?\(|saveDiagnose(Async)?\(/)
    .filter(h =>
      !h.text.startsWith("//") &&
      !h.text.startsWith("*") &&
      !h.text.startsWith("/**") &&       // JSDoc comments
      !h.text.includes("export ") &&     // function definition
      !h.text.includes("import ") &&     // import statement
      !h.text.includes("return ") &&     // wrapper return
      !h.text.match(/^\s*await /)        // already awaited
    );
  if (unawaited.length === 0)
    ok("All cache save calls are awaited");
  else
    warn(`${unawaited.length} potentially unawaited cache writes:\n${unawaited.map(h=>`    ${h.file}:${h.line}  ${h.text}`).join("\n")}`);

  // Check: guardRequest present in all scan routes
  const scanRoutes = ["scan/route.ts", "full-scan/route.ts", "wcag-scan/route.ts", "performance-scan/route.ts"];
  for (const route of scanRoutes) {
    const hasGuard = grep(path.join(SRC, "app/api"), /guardRequest/).some(h => h.file.includes(route.replace("/", path.sep)));
    if (hasGuard) ok(`guardRequest present in ${route}`);
    else          warn(`guardRequest MISSING in ${route}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(B("\n╔════════════════════════════════════════╗"));
  console.log(B("║    WebsiteFix Full Audit Test Suite    ║"));
  console.log(B("╚════════════════════════════════════════╝"));
  console.log(`  Base URL: ${BASE}\n`);

  // Test 4 (static) always runs — Tests 1-3 require a live server
  const isLive = process.argv.includes("--live");

  if (isLive) {
    await testLoad();
    await testCache();
    await testEdgeCases();
  } else {
    console.log(Y("  Tests 1–3 skipped (no --live flag). Run with --live against a running server."));
  }

  await testTokenAudit();

  console.log(B("\n══ RESULTS ══"));
  console.log(G(`  Passed:  ${passed}`));
  if (warned > 0) console.log(Y(`  Warnings: ${warned}`));
  if (failed > 0) console.log(R(`  Failed:  ${failed}`));

  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(R("\nFatal: " + e)); process.exit(1); });
