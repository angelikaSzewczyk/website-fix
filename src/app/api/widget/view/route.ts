import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/** Increments widget_views on agency_settings for a given agencyId.
 *  Called fire-and-forget from the widget page on mount. */
export async function POST(req: NextRequest) {
  try {
    const { agencyId } = await req.json() as { agencyId?: string };
    if (!agencyId) return NextResponse.json({ ok: false });

    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE agency_settings
      SET widget_views = COALESCE(widget_views, 0) + 1
      WHERE user_id::text = ${agencyId}
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
