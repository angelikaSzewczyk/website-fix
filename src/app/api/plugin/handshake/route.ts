/**
 * POST /api/plugin/handshake
 *
 * Sicherer Handshake-Endpunkt für die Hybrid-Scan-Logik. Wird vom WordPress-
 * Plugin nach erfolgreicher Installation und danach periodisch (z.B. alle
 * 6h zusammen mit dem Heartbeat) aufgerufen.
 *
 * Pflicht:
 *   - X-WF-API-KEY Header (wf_live_…)
 *   - Body { site_url, deep_data: { ... } }
 *
 * Optional im Body: site_name, wp_version, plugin_version
 *
 * Wirkung:
 *   1. Validiert API-Key gegen users.plugin_api_key.
 *   2. Upsert plugin_installations: deep_data wird ersetzt, last_handshake_at
 *      auf NOW(), handshake_count++, last_seen ebenfalls aufgefrischt.
 *   3. Triggert "starter_plugin_install"-Step im users.onboarding_state, damit
 *      die Onboarding-Checkliste auf "Plugin verbunden ✓" wechselt — egal welcher
 *      Plan, der Step-ID-Set deckt Starter ab und ist no-op für Pro/Agency.
 *   4. Gibt einen Echo-Hint zurück, damit das Plugin den User-Plan kennt
 *      (für plan-aware Branding im WordPress-Backend).
 *
 * Permissivität: Im Gegensatz zu /api/plugin/register (Agency-only) ist der
 * Handshake bewusst für ALLE bezahlten Plans offen. Das Read-Only-Plugin ist
 * ab Starter inklusive (PluginDownloadCard) — und die Hybrid-UX hängt davon
 * ab, dass auch Starter/Pro pluginActive=true erreichen können.
 *
 * Rate-Limit: 30 Handshakes / Stunde / IP.
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

// In-Memory-Rate-Limit (best effort — bei Multi-Instance würde Redis nötig).
const ipHits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT  = 30;
const RATE_WINDOW = 60 * 60 * 1000;
function rateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

type HandshakeBody = {
  site_url?: string;
  site_name?: string;
  wp_version?: string;
  plugin_version?: string;
  deep_data?: Record<string, unknown>;
};

const MAX_DEEP_DATA_BYTES = 64 * 1024;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const api_key = req.headers.get("x-wf-api-key")?.trim() ?? "";
  if (!api_key.startsWith("wf_live_") || api_key.length < 20) {
    return NextResponse.json({ ok: false, error: "invalid_api_key" }, { status: 401 });
  }

  let body: HandshakeBody;
  try {
    body = await req.json() as HandshakeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { site_url, site_name, wp_version, plugin_version, deep_data } = body;
  if (!site_url || typeof site_url !== "string") {
    return NextResponse.json({ ok: false, error: "site_url_required" }, { status: 400 });
  }
  if (!deep_data || typeof deep_data !== "object") {
    return NextResponse.json({ ok: false, error: "deep_data_required" }, { status: 400 });
  }

  // Größenkappe — verhindert dass ein kompromittierter Plugin-Build die DB
  // mit Mega-JSON flutet. 64 KB ist ~10× das was die Spec erwartet.
  const serialized = JSON.stringify(deep_data);
  if (serialized.length > MAX_DEEP_DATA_BYTES) {
    return NextResponse.json({ ok: false, error: "deep_data_too_large" }, { status: 413 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // User aus API-Key auflösen.
  const users = await sql`
    SELECT id, plan FROM users WHERE plugin_api_key = ${api_key} LIMIT 1
  ` as Array<{ id: number; plan: string }>;

  if (!users.length) {
    return NextResponse.json({ ok: false, error: "key_not_found" }, { status: 401 });
  }
  const user = users[0];

  // Upsert mit Handshake-Update. handshake_count atomar inkrementieren —
  // ohne SELECT-then-UPDATE-Race.
  await sql`
    INSERT INTO plugin_installations
      (user_id, site_url, site_name, wp_version, plugin_version,
       deep_data, last_handshake_at, last_seen, handshake_count, active)
    VALUES
      (${user.id}, ${site_url}, ${site_name ?? null}, ${wp_version ?? null},
       ${plugin_version ?? null}, ${serialized}::jsonb, NOW(), NOW(), 1, true)
    ON CONFLICT (user_id, site_url)
    DO UPDATE SET
      site_name         = COALESCE(EXCLUDED.site_name, plugin_installations.site_name),
      wp_version        = COALESCE(EXCLUDED.wp_version, plugin_installations.wp_version),
      plugin_version    = COALESCE(EXCLUDED.plugin_version, plugin_installations.plugin_version),
      deep_data         = EXCLUDED.deep_data,
      last_handshake_at = NOW(),
      last_seen         = NOW(),
      handshake_count   = plugin_installations.handshake_count + 1,
      active            = true
  `;

  // Onboarding-Step "starter_plugin_install" markieren — idempotent über
  // jsonb_array-Append-IF-NOT-EXISTS. State-Shape: { completed_steps: [...],
  // dismissed: bool, completed_at: string|null } — wenn die Spalte gar nicht
  // existiert, fängt der CATCH unten den Error ab.
  try {
    await sql`
      UPDATE users
      SET onboarding_state = jsonb_set(
        COALESCE(onboarding_state, '{}'::jsonb),
        '{completed_steps}',
        CASE
          WHEN COALESCE(onboarding_state->'completed_steps', '[]'::jsonb)
                @> '"starter_plugin_install"'::jsonb
          THEN COALESCE(onboarding_state->'completed_steps', '[]'::jsonb)
          ELSE COALESCE(onboarding_state->'completed_steps', '[]'::jsonb)
                || '"starter_plugin_install"'::jsonb
        END,
        true
      )
      WHERE id = ${user.id}
    `;
  } catch {
    // Onboarding-Schema noch nicht migriert → kein Showstopper.
  }

  return NextResponse.json({
    ok: true,
    site_url,
    plan: user.plan,
    mode: "deep_scan",
    onboarding_step_completed: "starter_plugin_install",
  });
}
