/**
 * POST /api/plugin/verify
 *
 * Called by the Website Exzellenz Connector WordPress plugin.
 * Validates the API key and confirms Agency plan access.
 *
 * Auth: X-WF-API-KEY header OR body.api_key (header takes priority)
 * Rate limit: 60 req / hour per IP
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const AGENCY_PLANS = ["agency-starter", "agency-pro"];

// In-memory rate limit: 60 req / 60 min per IP
const ipHits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now  = Date.now();
  const win  = 60 * 60 * 1000;
  const entry = ipHits.get(ip);
  if (!entry || now > entry.resetAt) { ipHits.set(ip, { count: 1, resetAt: now + win }); return true; }
  entry.count++;
  return entry.count <= 60;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ valid: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  // X-WF-API-KEY header takes priority over body
  const headerKey = req.headers.get("x-wf-api-key");
  let bodyKey = "";
  let domain  = "";
  try {
    const body = await req.json() as { api_key?: string; domain?: string };
    bodyKey = body.api_key ?? "";
    domain  = body.domain ?? "";
  } catch { /* header-only call, no body */ }

  const api_key = (headerKey ?? bodyKey).trim();

  if (!api_key || api_key.length < 20 || !api_key.startsWith("wf_live_")) {
    return NextResponse.json({ valid: false, error: "Invalid API key format" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT
      u.id::text            AS id,
      u.name,
      u.plan,
      ag.agency_name,
      ag.primary_color,
      ag.logo_url
    FROM users u
    LEFT JOIN agency_settings ag ON ag.user_id = u.id
    WHERE u.plugin_api_key = ${api_key}
    LIMIT 1
  ` as {
    id: string; name: string | null; plan: string;
    agency_name: string | null; primary_color: string | null; logo_url: string | null;
  }[];

  if (rows.length === 0) {
    return NextResponse.json({ valid: false, error: "API key not found" }, { status: 401 });
  }

  const user = rows[0];

  if (!AGENCY_PLANS.includes(user.plan)) {
    return NextResponse.json({
      valid: false,
      error: `Agency plan required. Current plan: ${user.plan}`,
      plan: user.plan,
    }, { status: 403 });
  }

  // Update last_seen on matching installation (fire-and-forget)
  if (domain) {
    sql`
      UPDATE plugin_installations
      SET last_seen = NOW(), active = true
      WHERE user_id = ${user.id}::integer AND site_url = ${domain}
    `.catch(() => {});
  }

  return NextResponse.json({
    valid: true,
    agency_id:    user.id,
    agency_name:  user.agency_name ?? user.name ?? "WebsiteFix Agency",
    plan:         user.plan,
    primary_color: user.primary_color ?? "#FBBF24",
    logo_url:     user.logo_url ?? null,
    features: {
      remote_fix:    true,
      bulk_scan:     true,
      white_label:   true,
      ki_mass_fixer: true,
    },
  });
}
