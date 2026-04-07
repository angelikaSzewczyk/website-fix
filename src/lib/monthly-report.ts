import { neon } from "@neondatabase/serverless";

export type WebsiteReportRow = {
  website_id: string;
  name: string | null;
  url: string;
  check_count: number;
  uptime_pct: number;
  avg_response_ms: number;
  ssl_valid: boolean;
  ssl_days_left: number | null;
  security_score: number | null;
  critical_alerts: number;
  warning_alerts: number;
  status: "ok" | "warning" | "critical" | "unmonitored";
};

export type MonthlyReportData = {
  user_id: number;
  user_name: string | null;
  user_email: string;
  agency_name: string | null;
  logo_url: string | null;
  primary_color: string;
  month: Date;
  websites: WebsiteReportRow[];
  total_ok: number;
  total_issues: number;
  avg_uptime: number;
};

export async function generateReportData(
  userId: number,
  month: Date
): Promise<MonthlyReportData | null> {
  const sql = neon(process.env.DATABASE_URL!);

  const monthStart = new Date(Date.UTC(month.getFullYear(), month.getMonth(), 1));
  const monthEnd = new Date(Date.UTC(month.getFullYear(), month.getMonth() + 1, 1));

  const [user] = (await sql`
    SELECT u.id, u.name, u.email, u.plan,
      a.agency_name, a.logo_url, a.primary_color
    FROM users u
    LEFT JOIN agency_settings a ON a.user_id = u.id
    WHERE u.id = ${userId}
  `) as {
    id: number; name: string | null; email: string; plan: string;
    agency_name: string | null; logo_url: string | null; primary_color: string | null;
  }[];

  if (!user) return null;

  const sites = (await sql`
    SELECT id::text, name, url
    FROM saved_websites
    WHERE user_id = ${userId}
    ORDER BY name, url
  `) as { id: string; name: string | null; url: string }[];

  if (!sites.length) return null;

  const websiteRows: WebsiteReportRow[] = [];

  for (const site of sites) {
    const checks = (await sql`
      SELECT is_online, response_time_ms, ssl_valid, ssl_days_left,
             security_score, alerts, checked_at
      FROM website_checks
      WHERE website_id = ${site.id}::uuid
        AND checked_at >= ${monthStart.toISOString()}
        AND checked_at <  ${monthEnd.toISOString()}
      ORDER BY checked_at DESC
    `) as {
      is_online: boolean; response_time_ms: number | null;
      ssl_valid: boolean; ssl_days_left: number | null;
      security_score: number | null; alerts: { level: string }[];
    }[];

    if (checks.length === 0) {
      websiteRows.push({
        website_id: site.id, name: site.name, url: site.url,
        check_count: 0, uptime_pct: 0, avg_response_ms: 0,
        ssl_valid: false, ssl_days_left: null, security_score: null,
        critical_alerts: 0, warning_alerts: 0, status: "unmonitored",
      });
      continue;
    }

    const onlineCount = checks.filter((c) => c.is_online).length;
    const uptime = Math.round((onlineCount / checks.length) * 100);

    const timings = checks.map((c) => c.response_time_ms).filter((t): t is number => t !== null);
    const avgResponse = timings.length
      ? Math.round(timings.reduce((s, t) => s + t, 0) / timings.length)
      : 0;

    const latest = checks[0];

    let criticalCount = 0;
    let warningCount = 0;
    for (const check of checks) {
      const alerts = Array.isArray(check.alerts) ? check.alerts : [];
      criticalCount += alerts.filter((a) => a.level === "critical").length;
      warningCount += alerts.filter((a) => a.level === "warning").length;
    }

    const status: WebsiteReportRow["status"] =
      criticalCount > 0 ? "critical" : warningCount > 0 || uptime < 99 ? "warning" : "ok";

    websiteRows.push({
      website_id: site.id, name: site.name, url: site.url,
      check_count: checks.length, uptime_pct: uptime, avg_response_ms: avgResponse,
      ssl_valid: latest.ssl_valid ?? false,
      ssl_days_left: latest.ssl_days_left ?? null,
      security_score: latest.security_score ?? null,
      critical_alerts: criticalCount, warning_alerts: warningCount,
      status,
    });
  }

  const monitored = websiteRows.filter((w) => w.status !== "unmonitored");
  const totalOk = monitored.filter((w) => w.status === "ok").length;
  const totalIssues = monitored.filter((w) => w.status !== "ok").length;
  const avgUptime = monitored.length
    ? Math.round(monitored.reduce((s, w) => s + w.uptime_pct, 0) / monitored.length)
    : 0;

  return {
    user_id: userId,
    user_name: user.name,
    user_email: user.email,
    agency_name: user.agency_name,
    logo_url: user.logo_url,
    primary_color: user.primary_color || "#8df3d3",
    month: monthStart,
    websites: websiteRows,
    total_ok: totalOk,
    total_issues: totalIssues,
    avg_uptime: avgUptime,
  };
}

export function formatMonth(date: Date, locale = "de-DE"): string {
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export function renderReportEmail(data: MonthlyReportData): string {
  const monthLabel = formatMonth(data.month);
  const brandName = data.agency_name || "WebsiteFix";
  const accent = data.primary_color || "#8df3d3";
  const dashboardUrl = process.env.NEXTAUTH_URL || "https://website-fix.com";

  const statusDot = (status: WebsiteReportRow["status"]) => {
    const colors: Record<string, string> = {
      ok: "#22c55e", warning: "#f59e0b", critical: "#ef4444", unmonitored: "#9ca3af",
    };
    return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[status] || "#9ca3af"};vertical-align:middle;margin-right:6px"></span>`;
  };

  const statusLabel: Record<string, string> = {
    ok: "OK", warning: "Warnung", critical: "Kritisch", unmonitored: "Nicht geprüft",
  };

  const sslBadge = (row: WebsiteReportRow) => {
    if (row.check_count === 0) return "—";
    if (!row.ssl_valid) return `<span style="color:#ef4444;font-weight:600">Ungültig</span>`;
    if (row.ssl_days_left !== null && row.ssl_days_left <= 14)
      return `<span style="color:#f59e0b;font-weight:600">${row.ssl_days_left}d</span>`;
    if (row.ssl_days_left !== null) return `${row.ssl_days_left}d`;
    return "✓";
  };

  const rows = data.websites.map((w) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;max-width:220px">
        <div style="font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${w.name || w.url}</div>
        ${w.name ? `<div style="font-size:11px;color:#888;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${w.url}</div>` : ""}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;white-space:nowrap">
        ${statusDot(w.status)}${statusLabel[w.status] || w.status}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center">
        ${w.check_count > 0 ? `${w.uptime_pct}%` : "—"}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center">
        ${w.check_count > 0 && w.avg_response_ms > 0 ? `${w.avg_response_ms}ms` : "—"}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center">
        ${sslBadge(w)}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center">
        ${w.security_score !== null ? `${w.security_score}/100` : "—"}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center;color:#888">
        ${w.check_count > 0 ? w.check_count : "—"}
      </td>
    </tr>
  `).join("");

  const issuesSummary = data.total_issues > 0
    ? `<span style="color:#ef4444;font-weight:700">${data.total_issues} Problem${data.total_issues > 1 ? "e" : ""}</span>`
    : `<span style="color:#22c55e;font-weight:700">Keine Probleme</span>`;

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:680px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:#111;padding:28px 32px;display:flex;align-items:center;justify-content:space-between">
    <div>
      ${data.logo_url
        ? `<img src="${data.logo_url}" alt="${brandName}" style="height:32px;max-width:140px;object-fit:contain">`
        : `<span style="font-size:17px;font-weight:700;color:#fff;letter-spacing:-0.01em">${brandName}</span>`
      }
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em">Monatsbericht</div>
      <div style="font-size:14px;font-weight:600;color:#fff;margin-top:2px">${monthLabel}</div>
    </div>
  </div>

  <!-- Summary bar -->
  <div style="background:#fafafa;border-bottom:1px solid #eee;padding:20px 32px;display:flex;gap:32px">
    <div>
      <div style="font-size:22px;font-weight:700;color:#111">${data.websites.length}</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Website${data.websites.length !== 1 ? "s" : ""}</div>
    </div>
    <div>
      <div style="font-size:22px;font-weight:700;color:#111">${data.avg_uptime > 0 ? data.avg_uptime + "%" : "—"}</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Ø Verfügbarkeit</div>
    </div>
    <div>
      <div style="font-size:22px;font-weight:700;color:#111">${data.total_ok}</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Ohne Probleme</div>
    </div>
    <div>
      <div style="font-size:22px;font-weight:700;color:#111">${issuesSummary}</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Status</div>
    </div>
  </div>

  <!-- Table -->
  <div style="padding:24px 32px">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#fafafa">
          <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #eee">Website</th>
          <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #eee">Status</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #eee">Verfügbarkeit</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #eee">Ø Antwortzeit</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #eee">SSL</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #eee">Sicherheit</th>
          <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;border-bottom:2px solid #eee">Prüfungen</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <!-- CTA -->
  <div style="padding:0 32px 32px">
    <a href="${dashboardUrl}/dashboard/clients" style="display:inline-block;padding:13px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
      Dashboard öffnen →
    </a>
  </div>

  <!-- Footer -->
  <div style="background:#fafafa;border-top:1px solid #eee;padding:20px 32px">
    <p style="font-size:12px;color:#aaa;margin:0;line-height:1.6">
      Automatischer Monatsbericht von ${brandName} · Powered by WebsiteFix<br>
      Du erhältst diese E-Mail weil du Websites mit WebsiteFix überwachst.
    </p>
  </div>

</div>
</body>
</html>`;
}
