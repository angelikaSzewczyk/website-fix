import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

const AGENCY_PLANS = ["agency-starter", "agency-pro"];

export async function GET() {
  const session = await auth();
  const userId  = session?.user?.id as string | undefined;
  const plan    = (session?.user as { plan?: string } | undefined)?.plan ?? "starter";

  if (!userId || !AGENCY_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT agency_name, logo_url, primary_color
    FROM agency_settings
    WHERE user_id = ${userId}
    LIMIT 1
  ` as { agency_name: string | null; logo_url: string | null; primary_color: string | null }[];

  if (rows.length === 0) {
    return NextResponse.json({ agencyName: null, logoUrl: null, primaryColor: null });
  }

  return NextResponse.json({
    agencyName:   rows[0].agency_name,
    logoUrl:      rows[0].logo_url,
    primaryColor: rows[0].primary_color,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId  = session?.user?.id as string | undefined;
  const plan    = (session?.user as { plan?: string } | undefined)?.plan ?? "starter";

  if (!userId || !AGENCY_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 403 });
  }

  const body = await req.json() as { agencyName?: string; logoUrl?: string; primaryColor?: string };
  const { agencyName, logoUrl, primaryColor } = body;

  // Validate logoUrl is a plausible URL if provided
  if (logoUrl && !/^https?:\/\/.+/.test(logoUrl)) {
    return NextResponse.json({ error: "Ungültige Logo-URL. Muss mit https:// beginnen." }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    INSERT INTO agency_settings (user_id, agency_name, logo_url, primary_color, updated_at)
    VALUES (${userId}, ${agencyName ?? null}, ${logoUrl ?? null}, ${primaryColor ?? null}, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET agency_name   = EXCLUDED.agency_name,
        logo_url      = EXCLUDED.logo_url,
        primary_color = EXCLUDED.primary_color,
        updated_at    = NOW()
  `;

  return NextResponse.json({ ok: true });
}
