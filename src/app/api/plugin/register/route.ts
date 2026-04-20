/**
 * POST /api/plugin/register
 *
 * Called once when the plugin connects to a new WordPress installation.
 * Upserts a row in plugin_installations.
 * Auth: X-WF-API-KEY header
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const AGENCY_PLANS = ["agency-starter", "agency-pro"];

export async function POST(req: NextRequest) {
  const api_key = req.headers.get("x-wf-api-key")?.trim() ?? "";
  if (!api_key.startsWith("wf_live_")) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  let body: { site_url?: string; site_name?: string; wp_version?: string; plugin_version?: string };
  try { body = await req.json(); } catch { body = {}; }

  const { site_url, site_name, wp_version, plugin_version } = body;
  if (!site_url) return NextResponse.json({ error: "site_url required" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);

  // Resolve user from API key
  const users = await sql`
    SELECT id, plan FROM users WHERE plugin_api_key = ${api_key} LIMIT 1
  ` as { id: number; plan: string }[];

  if (!users.length || !AGENCY_PLANS.includes(users[0].plan)) {
    return NextResponse.json({ error: "Agency plan required" }, { status: 403 });
  }

  const userId = users[0].id;

  await sql`
    INSERT INTO plugin_installations (user_id, site_url, site_name, wp_version, plugin_version, last_seen, active)
    VALUES (${userId}, ${site_url}, ${site_name ?? null}, ${wp_version ?? null}, ${plugin_version ?? null}, NOW(), true)
    ON CONFLICT (user_id, site_url)
    DO UPDATE SET
      site_name      = EXCLUDED.site_name,
      wp_version     = EXCLUDED.wp_version,
      plugin_version = EXCLUDED.plugin_version,
      last_seen      = NOW(),
      active         = true
  `;

  return NextResponse.json({ ok: true, registered: site_url });
}
