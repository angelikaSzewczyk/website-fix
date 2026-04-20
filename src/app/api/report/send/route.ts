import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { auth } from "@/auth";
import { generateReportData, renderReportEmail, formatMonth } from "@/lib/monthly-report";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const [user] = (await sql`
    SELECT id, plan FROM users WHERE email = ${session.user.email}
  `) as { id: number; plan: string }[];

  if (!user || !["smart-guard", "professional", "starter", "agency-starter", "agency-pro"].includes(user.plan)) {
    return NextResponse.json({ error: "Bezahlter Plan erforderlich" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { month?: string };

  // Default: current month (for preview/testing)
  let targetDate: Date;
  if (body.month) {
    const [y, m] = body.month.split("-").map(Number);
    targetDate = new Date(Date.UTC(y, m - 1, 1));
  } else {
    const now = new Date();
    targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  }

  const data = await generateReportData(user.id, targetDate);
  if (!data || data.websites.length === 0) {
    return NextResponse.json({ error: "Keine Website-Daten gefunden" }, { status: 404 });
  }

  const html = renderReportEmail(data);
  const monthLabel = formatMonth(targetDate);

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  if (resend) {
    await resend.emails.send({
      from: "WebsiteFix <support@website-fix.com>",
      to: session.user.email,
      subject: `Monatsbericht ${monthLabel} — ${data.websites.length} Website${data.websites.length !== 1 ? "s" : ""} überwacht`,
      html,
    });
  }

  // Upsert report record
  await sql`
    INSERT INTO monthly_reports (user_id, month, website_count, ok_count, issue_count, avg_uptime_pct)
    VALUES (
      ${user.id},
      ${targetDate.toISOString().slice(0, 10)},
      ${data.websites.length},
      ${data.total_ok},
      ${data.total_issues},
      ${data.avg_uptime}
    )
    ON CONFLICT (user_id, month) DO UPDATE SET
      sent_at = NOW(),
      website_count = EXCLUDED.website_count,
      ok_count = EXCLUDED.ok_count,
      issue_count = EXCLUDED.issue_count,
      avg_uptime_pct = EXCLUDED.avg_uptime_pct
  `;

  return NextResponse.json({ ok: true, month: targetDate.toISOString().slice(0, 7), email: session.user.email });
}
