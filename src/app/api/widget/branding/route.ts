import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(req: NextRequest) {
  const agencyId = req.nextUrl.searchParams.get("agencyId");
  if (!agencyId) return NextResponse.json({ error: "Fehlende agencyId" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);
  const [row] = await sql`
    SELECT u.name, ag.agency_name, ag.logo_url, ag.primary_color
    FROM users u
    LEFT JOIN agency_settings ag ON ag.user_id = u.id::text
    WHERE u.id::text = ${agencyId}
    LIMIT 1
  ` as { name: string; agency_name: string | null; logo_url: string | null; primary_color: string | null }[];

  if (!row) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  return NextResponse.json({
    agencyName:  row.agency_name ?? row.name ?? "Agentur",
    agencyColor: row.primary_color ?? "#007BFF",
    agencyLogo:  row.logo_url ?? null,
  });
}
