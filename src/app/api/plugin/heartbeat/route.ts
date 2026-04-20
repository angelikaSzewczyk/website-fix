/**
 * POST /api/plugin/heartbeat
 *
 * Called every 12 hours by the WordPress plugin cron.
 * Updates last_seen in plugin_installations.
 * Auth: X-WF-API-KEY header
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  const api_key = req.headers.get("x-wf-api-key")?.trim() ?? "";
  if (!api_key.startsWith("wf_live_")) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: { site_url?: string; wp_version?: string; plugin_version?: string; site_name?: string };
  try { body = await req.json(); } catch { body = {}; }

  const { site_url, wp_version, plugin_version, site_name } = body;
  if (!site_url) return NextResponse.json({ ok: false, error: "site_url required" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);

  const users = await sql`SELECT id FROM users WHERE plugin_api_key = ${api_key} LIMIT 1` as { id: number }[];
  if (!users.length) return NextResponse.json({ ok: false }, { status: 401 });

  await sql`
    UPDATE plugin_installations
    SET last_seen      = NOW(),
        active         = true,
        wp_version     = COALESCE(${wp_version ?? null}, wp_version),
        plugin_version = COALESCE(${plugin_version ?? null}, plugin_version),
        site_name      = COALESCE(${site_name ?? null}, site_name)
    WHERE user_id = ${users[0].id} AND site_url = ${site_url}
  `;

  return NextResponse.json({ ok: true });
}
