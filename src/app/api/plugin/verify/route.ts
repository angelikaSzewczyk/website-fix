/**
 * POST /api/plugin/verify
 *
 * Called by the WebsiteFix Helper WordPress plugin on each request
 * to confirm the API key is valid and the user holds an Agency plan.
 *
 * Body: { api_key: string, domain: string }
 * Response: { valid: boolean, agency_name?: string, plan?: string, features?: {...} }
 *
 * Rate-limited by IP — max 30 verifications per hour per IP.
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const AGENCY_PLANS = ["agency-starter", "agency-pro"];

// Simple in-memory rate limit: 30 req / 60 min per IP
const ipHits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(ip: string): boolean {
  const now    = Date.now();
  const window = 60 * 60 * 1000;
  const entry  = ipHits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + window });
    return true;
  }
  entry.count++;
  if (entry.count > 30) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ valid: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: { api_key?: string; domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { api_key, domain } = body;
  if (!api_key || typeof api_key !== "string" || api_key.length < 20) {
    return NextResponse.json({ valid: false, error: "api_key required" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT
      u.id::text,
      u.name,
      u.plan,
      ag.agency_name,
      ag.primary_color,
      ag.logo_url
    FROM users u
    LEFT JOIN agency_settings ag ON ag.user_id = u.id
    WHERE u.plugin_api_key = ${api_key}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ valid: false, error: "Invalid API key" }, { status: 401 });
  }

  const user = rows[0] as {
    id: string;
    name: string | null;
    plan: string;
    agency_name: string | null;
    primary_color: string | null;
    logo_url: string | null;
  };

  if (!AGENCY_PLANS.includes(user.plan)) {
    return NextResponse.json({
      valid: false,
      error: "Agency plan required",
      plan: user.plan,
    }, { status: 403 });
  }

  // Log the verification (fire-and-forget, non-blocking)
  sql`
    INSERT INTO plugin_verifications (user_id, domain, verified_at)
    VALUES (${user.id}, ${domain ?? ""}, NOW())
    ON CONFLICT DO NOTHING
  `.catch(() => {/* table may not exist yet — ok */});

  return NextResponse.json({
    valid: true,
    agency_id: user.id,
    agency_name: user.agency_name ?? user.name ?? "WebsiteFix Agency",
    plan: user.plan,
    primary_color: user.primary_color ?? "#007BFF",
    logo_url: user.logo_url ?? null,
    features: {
      remote_fix: true,
      bulk_scan: true,
      white_label: true,
    },
  });
}
