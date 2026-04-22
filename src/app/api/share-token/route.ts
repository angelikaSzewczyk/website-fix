import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const PRO_PLANS = ["professional", "smart-guard", "agency", "agency-starter", "agency-pro"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!PRO_PLANS.includes(plan)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const scanId = searchParams.get("scanId");
  if (!scanId) return NextResponse.json({ error: "Missing scanId" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);

  // Return existing token if already generated
  const existing = await sql`
    SELECT share_token FROM scans
    WHERE id = ${scanId} AND user_id = ${session.user.id}
    LIMIT 1
  `;
  if (!existing[0]) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  if (existing[0].share_token) return NextResponse.json({ token: existing[0].share_token });

  // Generate a fresh token
  const token = randomUUID();
  await sql`
    UPDATE scans SET share_token = ${token}::uuid
    WHERE id = ${scanId} AND user_id = ${session.user.id}
  `;
  return NextResponse.json({ token });
}
