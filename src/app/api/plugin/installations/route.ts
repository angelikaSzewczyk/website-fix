/**
 * GET /api/plugin/installations
 *
 * Returns all active plugin_installations for the current Agency user.
 * Used by the dashboard KI-Mass-Fixer site list.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

const AGENCY_PLANS = ["agency-starter", "agency-pro"];

export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; plan?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }
  if (!AGENCY_PLANS.includes(user.plan ?? "free")) {
    return NextResponse.json({ error: "Agency plan required" }, { status: 403 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT site_url, site_name, last_seen, wp_version, plugin_version, active
    FROM plugin_installations
    WHERE user_id = ${user.id}::integer AND active = true
    ORDER BY last_seen DESC
  ` as {
    site_url: string;
    site_name: string | null;
    last_seen: string;
    wp_version: string | null;
    plugin_version: string | null;
    active: boolean;
  }[];

  return NextResponse.json({ sites: rows });
}
