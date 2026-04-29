/**
 * Team-Invite-E-Mail (Phase 9).
 *
 * White-Label-fähig: nutzt agency_name + brand-color der einladenden Agentur,
 * sodass der Empfänger den Absender als "{Agency} — gehostet auf WebsiteFix"
 * wahrnimmt. WebsiteFix-Branding bleibt im Footer als Trust-Anker, aber
 * der Hero gehört der Agentur.
 *
 * Sicherheitshinweis zur Color-Validierung:
 *   brandColor wird in inline-CSS interpoliert (`background:${color}`).
 *   Die Quelle ist agency_settings.primary_color → kommt aus der DB ohne
 *   externes Tampering. Wir validieren trotzdem strikt mit /^#[0-9a-fA-F]{6}$/
 *   bevor wir interpolieren — defense-in-depth gegen einen kaputten DB-Wert.
 */

import { Resend } from "resend";

export type InviteMailParams = {
  agencyName:     string;          // z.B. "Müller & Partner Marketing"
  brandColor:     string | null;   // Hex (#RRGGBB) oder null → Default-Violet
  recipientEmail: string;
  /** Vollständiger absoluter Link, z.B. https://website-fix.com/invite/<token> */
  inviteUrl:      string;
  /** Optional: persönliche Note des Inviters (z.B. Inhaber-Name). */
  inviterName?:   string | null;
  /** Optional: E-Mail des Owners — wird als reply_to gesetzt, sodass der
   *  Empfänger direkt auf den Inviter antworten kann statt an support@. */
  inviterEmail?:  string | null;
};

const DEFAULT_BRAND = "#7C3AED";

function safeBrandColor(input: string | null | undefined): string {
  if (!input) return DEFAULT_BRAND;
  return /^#[0-9a-fA-F]{6}$/.test(input) ? input : DEFAULT_BRAND;
}

/** HTML-Escape für nutzergesteuerte Strings im Template-Body. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function buildInviteEmail(p: InviteMailParams): { subject: string; html: string } {
  const color   = safeBrandColor(p.brandColor);
  const agency  = esc(p.agencyName || "Deine Agentur");
  const inviter = p.inviterName ? esc(p.inviterName) : null;
  const url     = p.inviteUrl; // bereits encoded — keine Doppel-Escape

  // Subject: white-label, das Empfänger-Postfach zeigt klar, wer einlädt.
  const subject = `${p.agencyName} lädt dich zu WebsiteFix ein`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0b0c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0c10;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- ── Header: dezente WebsiteFix-Marke (Trust-Anker) ─────────── -->
        <tr><td style="padding:0 0 24px;">
          <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.4);letter-spacing:-0.01em;">
            Eine Einladung &middot; gehostet auf
            <span style="color:rgba(255,255,255,0.7);">Website<span style="color:#FBBF24;">Fix</span></span>
          </div>
        </td></tr>

        <!-- ── Hero: agency_name + brand-color als visuelle Identität ─── -->
        <tr><td style="
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.08);
          border-left:4px solid ${color};
          border-radius:16px;
          padding:36px 40px 32px;
        ">
          <p style="margin:0 0 10px;font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.10em;">
            Team-Einladung
          </p>
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#ffffff;line-height:1.25;letter-spacing:-0.025em;">
            ${agency} lädt dich zu WebsiteFix ein.
          </h1>
          <p style="margin:0 0 22px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.7;">
            ${inviter ? `${inviter} von <strong style="color:#fff;">${agency}</strong>` : `<strong style="color:#fff;">${agency}</strong>`}
            möchte dich als Mitglied im Team-Workspace freischalten. Du arbeitest gemeinsam an Audits,
            Berichten und Kunden-Websites &mdash; alles in einer Oberfläche.
          </p>

          <!-- ── CTA: Brand-Farbe als Hintergrund, hoher Kontrast ─────── -->
          <div style="margin:28px 0 20px;">
            <a href="${url}" style="
              display:inline-block;
              padding:14px 32px;
              background:${color};
              color:#ffffff;
              border-radius:10px;
              font-size:15px;
              font-weight:800;
              text-decoration:none;
              letter-spacing:-0.01em;
              box-shadow:0 4px 14px ${color}50;
            ">
              Einladung annehmen &rarr;
            </a>
          </div>

          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;">
            Oder kopiere diesen Link in den Browser:<br>
            <span style="color:rgba(255,255,255,0.55);word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;">${url}</span>
          </p>
        </td></tr>

        <!-- ── Was den Empfänger erwartet ───────────────────────────── -->
        <tr><td style="padding:24px 8px 0;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;">
            Was du als Mitglied bekommst
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${benefitRow(color, "Zugriff auf alle Audits & Berichte", "Sieh den Status jeder Kunden-Website in Echtzeit, lade PDF-Reports herunter, kommentiere Befunde im Team.")}
            ${benefitRow(color, "Eigener Login mit deiner E-Mail", `Du registrierst dich auf WebsiteFix mit ${esc(p.recipientEmail)} &mdash; ${agency} bleibt der Owner des Workspaces.`)}
            ${benefitRow(color, "Live-Activity & Workflow-Tools", "Asana/Slack-Integration, Score-Verlauf, Smart-Fix-Drawer &mdash; alles, was deine tägliche Arbeit beschleunigt.")}
          </table>
        </td></tr>

        <!-- ── Footer ────────────────────────────────────────────────── -->
        <tr><td style="padding:32px 8px 0;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.7;">
            Diese Einladung läuft in 7 Tagen ab. Wenn du sie nicht erwartest, ignoriere die Mail einfach &mdash;
            der Link läuft automatisch ab.
          </p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.7;">
            Versendet &uuml;ber WebsiteFix im Auftrag von ${agency}.<br>
            <a href="https://website-fix.com" style="color:rgba(255,255,255,0.4);text-decoration:none;">website-fix.com</a>
            &nbsp;&middot;&nbsp;
            <a href="https://website-fix.com/impressum" style="color:rgba(255,255,255,0.3);text-decoration:none;">Impressum</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

function benefitRow(color: string, title: string, body: string): string {
  return `
    <tr><td style="padding:0 0 14px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="top" style="width:24px;padding-top:4px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 0 3px ${color}25;"></div>
        </td>
        <td valign="top" style="padding-left:8px;">
          <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;">${title}</p>
          <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.55;">${body}</p>
        </td>
      </tr></table>
    </td></tr>
  `;
}

/**
 * Versendet die Invite-Mail. Returns true bei Erfolg, false sonst.
 * Caller entscheidet, ob das Failure den Invite-Flow blockt — aktuell tun wir
 * das nicht (siehe /api/team POST: Mail-Failure → User wird trotzdem eingeladen,
 * der Link existiert in der DB, der Owner kann ihn manuell teilen).
 */
/** Validiert eine Email-Adresse defensiv. Nicht streng RFC-konform, aber
 *  reicht um offensichtlich falsche Werte (whitespace, fehlendes @) abzulehnen.
 *  Resend würde solche Adressen sowieso ablehnen, aber wir schicken sie gar
 *  nicht erst raus. */
function isPlausibleEmail(s: string | null | undefined): s is string {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function sendInviteEmail(p: InviteMailParams): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[team-mailer] RESEND_API_KEY nicht gesetzt — Mail wird nicht versendet");
    return false;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, html } = buildInviteEmail(p);
  try {
    await resend.emails.send({
      from:    "WebsiteFix <support@website-fix.com>",
      to:      p.recipientEmail,
      subject,
      html,
      // reply_to-Header (Phase 11): wenn der Empfänger auf "Antworten" klickt,
      // landet die Antwort beim Owner der einladenden Agency, nicht bei
      // support@. Personalisiert die Conversation, hält uns aus der Schleife.
      // Validierung defensiv — ein kaputter Owner-Email darf den Send nicht
      // killen, in dem Fall fällt reply_to weg und der Default greift.
      ...(isPlausibleEmail(p.inviterEmail) ? { replyTo: p.inviterEmail } : {}),
    });
    return true;
  } catch (err) {
    console.error("[team-mailer] Resend send failed:", err);
    return false;
  }
}
