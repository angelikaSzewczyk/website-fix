import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

// Speichert einen anonymen Scan (aus sessionStorage) für den eingeloggten User in der DB.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const body = await req.json();
    const { url, diagnose, issueCount, techFingerprint } = body as {
      url?: string;
      diagnose?: string;
      issueCount?: number;
      techFingerprint?: unknown;
    };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Ungültige URL." }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Verhindere Duplikate — prüfe ob für diesen User + URL schon ein Scan existiert
    const existing = await sql`
      SELECT id FROM scans
      WHERE user_id = ${session.user.id} AND url = ${url}
      ORDER BY created_at DESC LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ ok: true, scanId: existing[0].id, duplicate: true });
    }

    const rows = await sql`
      INSERT INTO scans (user_id, url, type, issue_count, result, tech_fingerprint)
      VALUES (
        ${session.user.id},
        ${url},
        'website',
        ${issueCount ?? 0},
        ${diagnose ?? ""},
        ${techFingerprint ? JSON.stringify(techFingerprint) : null}
      )
      RETURNING id::text
    ` as { id: string }[];

    return NextResponse.json({ ok: true, scanId: rows[0]?.id });
  } catch (err) {
    console.error("scan/claim error:", err);
    return NextResponse.json({ error: "Fehler beim Speichern." }, { status: 500 });
  }
}
