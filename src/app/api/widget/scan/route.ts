import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

export const maxDuration = 30;

// Simple score computation (mirrors scan/results/page.tsx)
function quickScore(data: Record<string, unknown>): number {
  let s = 100;
  if (!data.https)        s -= 20;
  if (!data.title)        s -= 8;
  if (!data.metaDescription) s -= 6;
  if (!data.h1)           s -= 5;
  if (data.robotsBlockiertAlles) s -= 15;
  if (!data.sitemapVorhanden)    s -= 4;
  if ((data.brokenLinks as unknown[])?.length > 0) s -= 8;
  if (data.indexierungGesperrt)  s -= 12;
  return Math.max(15, Math.round(s));
}

export async function POST(req: NextRequest) {
  try {
    const { agencyId, url, email } = await req.json() as {
      agencyId: string;
      url: string;
      email: string;
    };

    if (!agencyId || !url || !email) {
      return NextResponse.json({ error: "Fehlende Felder" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Verify agency exists + get branding
    const [agency] = await sql`
      SELECT u.id, u.email, u.name,
             ag.agency_name, ag.logo_url, ag.primary_color
      FROM users u
      LEFT JOIN agency_settings ag ON ag.user_id = u.id
      WHERE u.id::text = ${agencyId}
      LIMIT 1
    ` as { id: string; email: string; name: string; agency_name: string | null; logo_url: string | null; primary_color: string | null }[];

    if (!agency) {
      return NextResponse.json({ error: "Agentur nicht gefunden" }, { status: 404 });
    }

    const agencyName  = agency.agency_name ?? agency.name ?? "WebsiteFix";
    const agencyColor = agency.primary_color ?? "#007BFF";
    const agencyLogo  = agency.logo_url ?? null;

    // Run a quick scan
    let score = 50;
    let diagnose = "";
    try {
      const scanRes = await fetch(`${process.env.NEXTAUTH_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const scanData = await scanRes.json();
      if (scanData.success && scanData.scanData) {
        score    = quickScore(scanData.scanData);
        diagnose = scanData.diagnose ?? "";
      }
    } catch { /* scan failed — still save lead */ }

    // Save lead and get back the UUID
    const [lead] = await sql`
      INSERT INTO widget_leads (agency_user_id, visitor_email, scanned_url, score, diagnose)
      VALUES (${agencyId}, ${email}, ${url}, ${score}, ${diagnose})
      RETURNING id::text
    ` as { id: string }[];

    // Notify agency via email
    if (agency.email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const scoreColor = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
      const domain = (() => { try { return new URL(url).host; } catch { return url; } })();
      await resend.emails.send({
        from: "WebsiteFix <support@website-fix.com>",
        to: agency.email,
        subject: `🎯 Neuer Lead: ${email} hat ${domain} gescannt`,
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:540px;margin:0 auto;background:#0b0c10;color:#fff;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#007BFF,#0057b8);padding:32px 36px">
    <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Lead-Benachrichtigung</div>
    <h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-0.03em">Neuer Website-Lead! 🎯</h1>
  </div>
  <div style="padding:32px 36px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);font-size:13px;width:120px">E-Mail</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:600;font-size:13px">${email}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);font-size:13px">Gescannte URL</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:600;font-size:13px;word-break:break-all">${url}</td></tr>
      <tr><td style="padding:10px 0;color:rgba(255,255,255,0.45);font-size:13px">Website-Score</td>
          <td style="padding:10px 0;font-weight:800;font-size:22px;color:${scoreColor}">${score}%</td></tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7">
      Dieser Interessent hat das Lead-Widget auf deiner Website genutzt.
      ${score < 70 ? `Mit einem Score von ${score}% hat diese Website <strong style="color:#f59e0b">erheblichen Optimierungsbedarf</strong> — ein idealer Gesprächseinstieg!` : "Die Website sieht solide aus, aber es gibt immer Raum für Verbesserungen."}
    </p>
    <a href="${process.env.NEXTAUTH_URL}/dashboard/leads" style="display:inline-block;padding:12px 28px;background:#007BFF;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 16px rgba(0,123,255,0.4)">
      Lead im Dashboard ansehen →
    </a>
  </div>
  <div style="padding:16px 36px 24px;border-top:1px solid rgba(255,255,255,0.06)">
    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2)">Powered by WebsiteFix · Lead-Widget</p>
  </div>
</div>`,
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      score,
      leadId: lead?.id ?? null,
      agencyName,
      agencyColor,
      agencyLogo,
    });
  } catch (err) {
    console.error("Widget scan error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
