import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/** Called by the PDF button on the widget report page.
 *  Stamps pdf_downloaded_at on the widget_lead row so the admin can see it. */
export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json() as { leadId?: string };
    if (!leadId) return NextResponse.json({ ok: false }, { status: 400 });

    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE widget_leads
      SET pdf_downloaded_at = NOW()
      WHERE id::text = ${leadId}
        AND pdf_downloaded_at IS NULL
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
