import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { isAtLeastProfessional } from "@/lib/plans";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "Missing scanId" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT meta_json->>'executive_summary' AS executive_summary
    FROM scans
    WHERE id = ${scanId} AND user_id = ${session.user.id}
    LIMIT 1
  `;

  return NextResponse.json({ executive_summary: rows[0]?.executive_summary ?? "" });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "Missing scanId" }, { status: 400 });

  const body = await req.json();
  const text = String(body.executive_summary ?? "").slice(0, 2000);

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    UPDATE scans
    SET meta_json = COALESCE(meta_json, '{}'::jsonb) || jsonb_build_object('executive_summary', ${text}::text)
    WHERE id = ${scanId} AND user_id = ${session.user.id}
  `;

  return NextResponse.json({ ok: true });
}
