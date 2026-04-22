import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const PRO_PLANS = ["professional", "smart-guard", "agency", "agency-starter", "agency-pro"];

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!PRO_PLANS.includes(plan)) return NextResponse.json({ activity: [] });

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT
        url,
        last_viewed_at::text AS last_viewed_at,
        view_count,
        download_count
      FROM scans
      WHERE user_id    = ${session.user.id}
        AND share_token IS NOT NULL
        AND last_viewed_at IS NOT NULL
      ORDER BY last_viewed_at DESC
      LIMIT 5
    `;
    return NextResponse.json({ activity: rows });
  } catch {
    return NextResponse.json({ activity: [] });
  }
}
