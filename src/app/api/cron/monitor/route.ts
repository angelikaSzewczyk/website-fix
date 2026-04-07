import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { checkWebsite, type CheckAlert } from "@/lib/monitor";

export const maxDuration = 60;

type SavedWebsite = {
  id: string;
  user_id: number;
  url: string;
  name: string | null;
  alert_email: string | null;
  user_email: string;
  user_name: string | null;
  plan: string;
};

function alertEmailHtml(alerts: CheckAlert[], url: string, siteName: string | null): string {
  const critical = alerts.filter(a => a.level === "critical");
  const warnings = alerts.filter(a => a.level === "warning");

  const rows = [...critical, ...warnings].map(a => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${a.level === "critical" ? "#dc2626" : "#d97706"};margin-right:10px;vertical-align:middle"></span>
        <strong style="color:#111">${a.message}</strong>
      </td>
    </tr>
  `).join("");

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;color:#111;background:#fff">
      <div style="margin-bottom:32px">
        <span style="font-size:14px;font-weight:700;color:#111;letter-spacing:-0.01em">WebsiteFix</span>
      </div>

      <h1 style="font-size:22px;font-weight:700;margin:0 0 8px;letter-spacing:-0.02em">
        ${critical.length > 0 ? "Kritisches Problem erkannt" : "Warnung erkannt"}
      </h1>
      <p style="font-size:14px;color:#666;margin:0 0 28px;line-height:1.6">
        Automatische Prüfung für <strong>${siteName ?? url}</strong>
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
        <tbody>${rows}</tbody>
      </table>

      <a href="${process.env.NEXTAUTH_URL}/dashboard/clients" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
        Dashboard öffnen →
      </a>

      <p style="font-size:12px;color:#aaa;margin:28px 0 0;line-height:1.6">
        Diese E-Mail wurde automatisch von WebsiteFix gesendet.<br>
        Du erhältst sie weil du ${siteName ?? url} überwachst.
      </p>
    </div>
  `;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Alle gespeicherten Websites von Pro/Agentur-Nutzern holen
  const websites = await sql`
    SELECT
      sw.id, sw.user_id, sw.url, sw.name, sw.alert_email,
      u.email AS user_email, u.name AS user_name, u.plan
    FROM saved_websites sw
    JOIN users u ON u.id = sw.user_id
    WHERE u.plan IN ('pro', 'agentur')
      AND (sw.last_check_at IS NULL OR sw.last_check_at < NOW() - INTERVAL '23 hours')
    LIMIT 20
  ` as SavedWebsite[];

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  let checked = 0;
  let alerted = 0;

  for (const site of websites) {
    try {
      const result = await checkWebsite(site.url);

      // Check-Ergebnis speichern
      await sql`
        INSERT INTO website_checks (
          website_id, user_id, is_online, response_time_ms,
          ssl_valid, ssl_expires_at, ssl_days_left,
          platform, security_score, security_headers,
          http_status, alerts
        ) VALUES (
          ${site.id}, ${site.user_id}, ${result.is_online}, ${result.response_time_ms},
          ${result.ssl_valid}, ${result.ssl_expires_at}, ${result.ssl_days_left},
          ${result.platform}, ${result.security_score}, ${JSON.stringify(result.security_headers)},
          ${result.http_status}, ${JSON.stringify(result.alerts)}
        )
      `;

      // saved_websites aktualisieren
      const status = result.alerts.some(a => a.level === "critical") ? "critical"
        : result.alerts.some(a => a.level === "warning") ? "warning"
        : result.is_online ? "ok" : "offline";

      await sql`
        UPDATE saved_websites
        SET last_check_at = NOW(), last_check_status = ${status}
        WHERE id = ${site.id}
      `;

      // Alert senden wenn kritisch oder Warnung
      const criticalAlerts = result.alerts.filter(a => a.level === "critical" || a.level === "warning");
      if (criticalAlerts.length > 0 && resend) {
        const alertTo = site.alert_email ?? site.user_email;
        await resend.emails.send({
          from: "WebsiteFix <support@website-fix.com>",
          to: alertTo,
          subject: `${result.alerts.some(a => a.level === "critical") ? "Kritisch" : "Warnung"}: ${site.name ?? site.url}`,
          html: alertEmailHtml(criticalAlerts, site.url, site.name),
        }).catch(err => console.error("Alert-E-Mail Fehler:", err));
        alerted++;
      }

      checked++;
    } catch (err) {
      console.error(`Monitor-Check fehlgeschlagen für ${site.url}:`, err);
    }
  }

  return NextResponse.json({ checked, alerted, total: websites.length });
}
