/**
 * POST /api/widget/unlock
 *
 * Stage 2 des 2-Stage-Widget-Flows. Gast hat bereits den Teaser gesehen und
 * gibt jetzt seine E-Mail ein, um den vollen Optimierungs-Plan zu entsperren.
 *
 * Trägt die E-Mail am bestehenden Lead nach, benachrichtigt die Agentur per
 * Resend-E-Mail, und gibt die leadId zurück (die führt zur report-Seite).
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const { teaserToken, email } = await req.json() as { teaserToken: string; email: string };

    if (!teaserToken || !email) {
      return NextResponse.json({ error: "Token oder E-Mail fehlen" }, { status: 400 });
    }
    // Simple email-format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Ungültige E-Mail-Adresse" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Lead laden + E-Mail nachtragen (atomic update).
    // Wir erlauben das Nachtragen nur wenn der Lead noch keine E-Mail hat
    // (verhindert, dass ein Token mehrfach verwendet wird um Spam-Mails zu generieren).
    const [lead] = await sql`
      UPDATE widget_leads
         SET visitor_email = ${email}
       WHERE id::text = ${teaserToken}
         AND visitor_email IS NULL
      RETURNING id::text, agency_user_id::text AS agency_id, scanned_url, score, diagnose
    ` as { id: string; agency_id: string; scanned_url: string; score: number; diagnose: string }[];

    if (!lead) {
      // Entweder token ungültig oder Lead ist schon freigeschaltet — wir geben
      // den Lead trotzdem zurück, wenn er existiert (für Re-Visits).
      const [existing] = await sql`
        SELECT id::text, agency_user_id::text AS agency_id
          FROM widget_leads WHERE id::text = ${teaserToken}
      ` as { id: string; agency_id: string }[];
      if (existing) {
        return NextResponse.json({ ok: true, leadId: existing.id, alreadyUnlocked: true });
      }
      return NextResponse.json({ error: "Token ungültig oder abgelaufen" }, { status: 404 });
    }

    // Agentur laden für Notification-Mail
    const [agency] = await sql`
      SELECT id::text, email, name FROM users WHERE id::text = ${lead.agency_id} LIMIT 1
    ` as { id: string; email: string; name: string }[];

    // Agentur per E-Mail benachrichtigen (fire-and-forget)
    if (agency?.email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const scoreColor = lead.score >= 80 ? "#22c55e" : lead.score >= 55 ? "#f59e0b" : "#ef4444";
      const domain = (() => { try { return new URL(lead.scanned_url).host; } catch { return lead.scanned_url; } })();
      resend.emails.send({
        from:    "WebsiteFix <support@website-fix.com>",
        to:      agency.email,
        subject: `Neuer Lead: ${email} hat ${domain} gescannt`,
        html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:540px;margin:0 auto;background:#0b0c10;color:#fff;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#10B981,#059669);padding:32px 36px">
    <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Lead-Benachrichtigung</div>
    <h1 style="margin:0;font-size:26px;font-weight:800;letter-spacing:-0.03em">Neuer Website-Lead</h1>
  </div>
  <div style="padding:32px 36px">
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px">
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);font-size:13px;width:120px">E-Mail</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:600;font-size:13px">${email}</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);font-size:13px">Gescannte URL</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-weight:600;font-size:13px;word-break:break-all">${lead.scanned_url}</td></tr>
      <tr><td style="padding:10px 0;color:rgba(255,255,255,0.45);font-size:13px">Website-Score</td>
          <td style="padding:10px 0;font-weight:800;font-size:22px;color:${scoreColor}">${lead.score}%</td></tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.7">
      Der Interessent hat dein Lead-Widget durchlaufen. Er hat den Teaser gesehen (Builder/DOM/Fonts-Hinweise) und danach seine E-Mail eingegeben, um den vollen Optimierungs-Plan zu sehen — klares Kaufsignal.
    </p>
    <a href="${process.env.NEXTAUTH_URL}/dashboard/leads" style="display:inline-block;padding:12px 28px;background:#10B981;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 16px rgba(16,185,129,0.4)">
      Lead im Dashboard ansehen
    </a>
  </div>
</div>`,
      }).then(() => {
        sql`UPDATE widget_leads SET notification_sent = true WHERE id::text = ${lead.id}`.catch(() => null);
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (err) {
    console.error("Widget unlock error:", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
