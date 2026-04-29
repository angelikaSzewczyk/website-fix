import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { generateReportData, renderReportEmail, formatMonth } from "@/lib/monthly-report";
import { KNOWN_PLAN_STRINGS } from "@/lib/plans";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // Previous month
  const now = new Date();
  const prevMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
  const monthLabel = formatMonth(prevMonth);

  // All Pro/Agentur users with at least 1 saved website. Plan-Filter via
  // KNOWN_PLAN_STRINGS aus lib/plans.ts — Single-Source für alle akzeptierten
  // Plan-Werte (kanonisch + Legacy). = ANY() statt IN () weil Postgres-Arrays
  // mit Neon-Tagged-Templates direkt parametrisierbar sind.
  const users = (await sql`
    SELECT DISTINCT u.id, u.email, u.name, u.plan
    FROM users u
    JOIN saved_websites sw ON sw.user_id = u.id
    WHERE u.plan = ANY(${KNOWN_PLAN_STRINGS as string[]})
  `) as { id: number; email: string; name: string | null; plan: string }[];

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      // Skip if already sent for this month
      const [existing] = await sql`
        SELECT id FROM monthly_reports
        WHERE user_id = ${user.id} AND month = ${prevMonth.toISOString().slice(0, 10)}
      `;
      if (existing) { skipped++; continue; }

      const data = await generateReportData(user.id, prevMonth);
      if (!data || data.websites.length === 0) { skipped++; continue; }

      const html = renderReportEmail(data);

      // Save report record first
      await sql`
        INSERT INTO monthly_reports (user_id, month, website_count, ok_count, issue_count, avg_uptime_pct)
        VALUES (
          ${user.id},
          ${prevMonth.toISOString().slice(0, 10)},
          ${data.websites.length},
          ${data.total_ok},
          ${data.total_issues},
          ${data.avg_uptime}
        )
        ON CONFLICT (user_id, month) DO NOTHING
      `;

      if (resend) {
        await resend.emails.send({
          from: "WebsiteFix <support@website-fix.com>",
          to: user.email,
          subject: `Monatsbericht ${monthLabel} — ${data.websites.length} Website${data.websites.length !== 1 ? "s" : ""} überwacht`,
          html,
        });
      }

      sent++;
    } catch (err) {
      console.error(`Monatsbericht fehlgeschlagen für user ${user.id}:`, err);
      errors.push(`user ${user.id}: ${String(err)}`);
    }
  }

  return NextResponse.json({ month: prevMonth.toISOString().slice(0, 7), sent, skipped, errors });
}
