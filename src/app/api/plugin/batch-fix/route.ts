/**
 * POST /api/plugin/batch-fix
 *
 * The KI-Mass-Fixer backend.
 * Reads all active plugin_installations for the current user,
 * fans out fix commands to each WordPress site in parallel,
 * and returns a per-site result summary.
 *
 * Body:
 *   fix_type   : string   — "set_alt_text" | "set_meta_description" | "set_title" | "remove_noindex" | "ping"
 *   target_id  : number   — WP post/attachment ID (0 = ignored for "ping")
 *   value      : string   — new value
 *   site_urls? : string[] — limit to specific sites (empty = all active)
 *   timeout_ms?: number   — per-site timeout (default 12000)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

const AGENCY_PLANS  = ["agency-starter", "agency-pro"];
const VALID_FIX_TYPES = ["set_alt_text", "set_meta_description", "set_title", "remove_noindex", "set_post_meta", "ping"];

type SiteResult = {
  site_url:  string;
  site_name: string | null;
  ok:        boolean;
  msg?:      string;
  error?:    string;
  duration_ms: number;
};

async function callSite(
  site_url: string,
  api_key:  string,
  payload:  Record<string, unknown>,
  timeout_ms: number,
): Promise<SiteResult & { site_name: null }> {
  const endpoint = site_url.replace(/\/$/, "") + "/wp-json/wf/v1/execute";
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout_ms);

    const res = await fetch(endpoint, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WF-API-KEY": api_key,
      },
      body:   JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const duration_ms = Date.now() - t0;
    if (!res.ok) {
      return { site_url, site_name: null, ok: false, error: `HTTP ${res.status}`, duration_ms };
    }
    const data = await res.json() as { ok?: boolean; msg?: string; error?: string };
    return {
      site_url, site_name: null,
      ok: data.ok ?? false,
      msg: data.msg,
      error: data.error,
      duration_ms,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { site_url, site_name: null, ok: false, error: msg, duration_ms: Date.now() - t0 };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; plan?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }
  if (!AGENCY_PLANS.includes(user.plan ?? "starter")) {
    return NextResponse.json({ error: "Agency plan required" }, { status: 403 });
  }

  let body: {
    fix_type?:   string;
    target_id?:  number;
    value?:      string;
    meta_key?:   string;
    site_urls?:  string[];
    timeout_ms?: number;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fix_type = "ping", target_id = 0, value = "", meta_key = "", timeout_ms = 12000 } = body;

  if (!VALID_FIX_TYPES.includes(fix_type)) {
    return NextResponse.json({ error: `Unknown fix_type: ${fix_type}` }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Fetch API key for this user
  const keyRows = await sql`
    SELECT plugin_api_key FROM users WHERE id::text = ${user.id} LIMIT 1
  ` as { plugin_api_key: string | null }[];

  const api_key = keyRows[0]?.plugin_api_key;
  if (!api_key) {
    return NextResponse.json({ error: "Kein Plugin-API-Key konfiguriert" }, { status: 400 });
  }

  // Fetch all active installations
  const installations = await sql`
    SELECT site_url, site_name
    FROM plugin_installations
    WHERE user_id = ${user.id}::integer AND active = true
    ORDER BY last_seen DESC
  ` as { site_url: string; site_name: string | null }[];

  // Optionally filter to specific sites
  const requested = body.site_urls ?? [];
  const targets = requested.length > 0
    ? installations.filter(i => requested.includes(i.site_url))
    : installations;

  if (targets.length === 0) {
    return NextResponse.json({
      ok: true,
      summary: { total: 0, success: 0, failed: 0 },
      results: [],
      message: "Keine verbundenen Installationen gefunden.",
    });
  }

  const payload = { fix_type, target_id, value, meta_key };

  // Fan out in parallel (max 10 concurrent to avoid overload)
  const CONCURRENCY = 10;
  const results: SiteResult[] = [];

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (site) => {
        const r = await callSite(site.site_url, api_key, payload, timeout_ms);
        return { ...r, site_name: site.site_name };
      })
    );
    results.push(...batchResults);
  }

  const success = results.filter(r => r.ok).length;
  const failed  = results.length - success;

  // Log batch fix operation
  sql`
    INSERT INTO scan_log (url, scan_type, status, duration_ms, user_id, created_at)
    VALUES (
      ${"batch-fix:" + fix_type},
      'plugin_batch',
      ${failed === 0 ? "ok" : "partial"},
      ${results.reduce((acc, r) => acc + r.duration_ms, 0)},
      ${user.id}::integer,
      NOW()
    )
  `.catch(() => {});

  return NextResponse.json({
    ok:      failed === 0,
    summary: { total: results.length, success, failed },
    results,
  });
}
