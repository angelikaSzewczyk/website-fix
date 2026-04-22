import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan;
  const BRANDING_PLANS = ["agency-pro", "agency-starter", "professional", "smart-guard", "starter"];
  if (!BRANDING_PLANS.includes(plan ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT agency_name, agency_website, logo_url, primary_color
    FROM agency_settings
    WHERE user_id = ${session.user.id}
    LIMIT 1
  `;

  return NextResponse.json(rows[0] ?? { agency_name: "", agency_website: "", logo_url: "", primary_color: "#8df3d3" });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan;
  const BRANDING_PLANS = ["agency-pro", "agency-starter", "professional", "smart-guard", "starter"];
  if (!BRANDING_PLANS.includes(plan ?? "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const agencyName    = String(body.agency_name    ?? "").slice(0, 100);
  const agencyWebsite = String(body.agency_website ?? "").slice(0, 255);
  // logo_url accepts either a public URL or a base64 data URL — no length cap
  const logoUrl       = String(body.logo_url ?? "");
  const primaryColor  = /^#[0-9a-fA-F]{6}$/.test(body.primary_color) ? body.primary_color : "#8df3d3";

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    INSERT INTO agency_settings (user_id, agency_name, agency_website, logo_url, primary_color, updated_at)
    VALUES (${session.user.id}, ${agencyName}, ${agencyWebsite}, ${logoUrl}, ${primaryColor}, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET agency_name    = ${agencyName},
        agency_website = ${agencyWebsite},
        logo_url       = ${logoUrl},
        primary_color  = ${primaryColor},
        updated_at     = NOW()
  `;

  return NextResponse.json({ ok: true });
}
