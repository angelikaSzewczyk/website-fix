import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

// Public endpoint — no auth required.
// Called from the client-facing /view/[token] page when the user clicks "PDF speichern".
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE scans
      SET download_count = download_count + 1
      WHERE share_token = ${token}::uuid
    `;
  } catch { /* non-critical — never fail the user's PDF action */ }

  return NextResponse.json({ ok: true });
}
