/**
 * POST /api/support — submit a support ticket (authenticated users only)
 *
 * Body: {
 *   subject, message,
 *   metadata?: {
 *     activeProjectUrl?, lastErrorLog?, timestamp?, plan?,
 *     screenshot?: { name, type, dataUrl, size_kb }   // base64 PNG/JPG/WebP, max 2MB
 *   }
 * }
 *
 * Side-Effects:
 *   1. INSERT in support_tickets (mit metadata als JSONB inkl. Screenshot-DataURL)
 *   2. Resend-Email an ADMIN_EMAIL (oder support@website-fix.com als Default)
 *      mit Plain-Body + HTML-Body + Screenshot als Attachment
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

type ScreenshotInput = {
  name?:    string;
  type?:    string;
  dataUrl?: string;
  size_kb?: number;
};

type IncomingBody = {
  subject?:  string;
  message?:  string;
  metadata?: {
    activeProjectUrl?: string;
    lastErrorLog?:     string;
    timestamp?:        string;
    plan?:             string;
    requestType?:      string;
    screenshot?:       ScreenshotInput | null;
  };
  requestType?:        string;
};

const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES  = new Set(["image/png", "image/jpeg", "image/webp"]);

/** Validiert + zerlegt eine base64 DataURL in Buffer + MIME für Resend-Attachment.
 *  Gibt null zurück wenn die Eingabe ungültig ist (User wird nicht geblockt — wir
 *  speichern dann eben kein Screenshot, der Rest des Tickets geht durch). */
function parseScreenshot(input: ScreenshotInput | null | undefined): {
  name:    string;
  type:    string;
  buffer:  Buffer;
  dataUrl: string;
  sizeKb:  number;
} | null {
  if (!input || typeof input !== "object") return null;
  const name    = String(input.name ?? "screenshot");
  const type    = String(input.type ?? "");
  const dataUrl = String(input.dataUrl ?? "");

  if (!ALLOWED_IMAGE_TYPES.has(type)) return null;
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  if (m[1] !== type) return null;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(m[2], "base64");
  } catch {
    return null;
  }
  if (buffer.length === 0 || buffer.length > MAX_SCREENSHOT_BYTES) return null;

  return {
    name,
    type,
    buffer,
    dataUrl,
    sizeKb: Math.round(buffer.length / 1024),
  };
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  let body: IncomingBody;
  try {
    body = await req.json() as IncomingBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!subject || !message) {
    return NextResponse.json({ error: "Betreff und Nachricht sind Pflicht." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Nachricht zu lang (max. 2000 Zeichen)." }, { status: 400 });
  }

  const screenshot = parseScreenshot(body.metadata?.screenshot ?? null);

  // Metadata für DB — Screenshot inkl. dataUrl persistiert für Admin-Review.
  // Bei sehr vielen Tickets könnte das die DB-Zeile aufblähen; für aktuelles
  // Ticket-Volume (~50/Monat) akzeptabel. Bei Skalierung: Storage-Service
  // (S3 / Cloudinary) und nur die URL persistieren.
  const meta = {
    activeProjectUrl: body.metadata?.activeProjectUrl ?? null,
    lastErrorLog:     body.metadata?.lastErrorLog     ?? null,
    timestamp:        body.metadata?.timestamp        ?? new Date().toISOString(),
    plan:             body.metadata?.plan             ?? null,
    // requestType-Marker für Lead-Qualifizierung im Admin-Dashboard.
    // Aktuell genutzt: "agency-support" (RescueDashboard CTA "Agentur-Support
    // anfordern" — Einzelunternehmer der Hilfe bei Umsetzung will → Lead
    // für die Marktplatz-Phase).
    requestType:      body.requestType ?? body.metadata?.requestType ?? "general-support",
    screenshot:       screenshot ? {
      name:    screenshot.name,
      type:    screenshot.type,
      dataUrl: screenshot.dataUrl,
      size_kb: screenshot.sizeKb,
    } : null,
  };

  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    INSERT INTO support_tickets (user_id, user_email, subject, message, metadata)
    VALUES (
      ${session.user.id ? parseInt(session.user.id) : null},
      ${session.user.email},
      ${subject},
      ${message},
      ${JSON.stringify(meta)}
    )
  `;

  // ── Admin-Email-Notification (non-blocking) ──────────────────────────────
  // Bei Resend-Fail: Ticket bleibt in DB, Admin sieht es bei nächstem
  // Dashboard-Refresh. Daher silent-fail.
  if (process.env.RESEND_API_KEY) {
    const adminTo  = process.env.ADMIN_EMAIL ?? "support@website-fix.com";
    const userMail = session.user.email;
    const userName = session.user.name ?? userMail;

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:    "WebsiteFix Support <support@website-fix.com>",
        to:      adminTo,
        replyTo: userMail,
        subject: `[Support] ${subject}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; color: #0F172A;">
            <div style="background: #0D1117; padding: 18px 22px; border-radius: 10px 10px 0 0; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px; font-weight: 300; color: #fff;">Website<strong style="color: #F59E0B;">Fix</strong></span>
              <span style="margin-left:auto; font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;">Neues Support-Ticket</span>
            </div>
            <div style="border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px; padding: 24px; background: #fff;">
              <h2 style="margin: 0 0 14px; font-size: 17px; color: #0F172A;">${escHtml(subject)}</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 18px;">
                <tr><td style="padding: 6px 12px; background: #F8FAFC; color: #6B7280; font-weight: 600; width: 130px; border-radius: 6px 0 0 6px;">User</td>
                    <td style="padding: 6px 12px; color: #374151;">${escHtml(userName)} (<a href="mailto:${escHtml(userMail)}" style="color: #2563EB;">${escHtml(userMail)}</a>)</td></tr>
                <tr><td style="padding: 6px 12px; background: #F8FAFC; color: #6B7280; font-weight: 600; border-radius: 6px 0 0 6px;">Plan</td>
                    <td style="padding: 6px 12px; color: #374151;">${escHtml(meta.plan ?? "—")}</td></tr>
                <tr><td style="padding: 6px 12px; background: #F8FAFC; color: #6B7280; font-weight: 600; border-radius: 6px 0 0 6px;">Projekt-URL</td>
                    <td style="padding: 6px 12px; color: #374151;">${meta.activeProjectUrl ? `<a href="${escHtml(meta.activeProjectUrl)}" style="color: #2563EB;">${escHtml(meta.activeProjectUrl)}</a>` : "—"}</td></tr>
                <tr><td style="padding: 6px 12px; background: #F8FAFC; color: #6B7280; font-weight: 600; border-radius: 6px 0 0 6px;">Zeitstempel</td>
                    <td style="padding: 6px 12px; color: #374151;">${escHtml(meta.timestamp)}</td></tr>
                ${screenshot ? `
                <tr><td style="padding: 6px 12px; background: #F8FAFC; color: #6B7280; font-weight: 600; border-radius: 6px 0 0 6px;">Screenshot</td>
                    <td style="padding: 6px 12px; color: #374151;">📎 ${escHtml(screenshot.name)} (${screenshot.sizeKb} KB) — siehe Anhang</td></tr>
                ` : ""}
              </table>
              <div style="padding: 14px 16px; background: #F8FAFC; border-radius: 8px; border-left: 3px solid #2563EB; margin-bottom: 14px;">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em;">Nachricht</p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap;">${escHtml(message)}</p>
              </div>
              ${meta.lastErrorLog ? `
              <details style="margin-bottom: 14px;">
                <summary style="cursor: pointer; font-size: 12px; font-weight: 700; color: #B45309;">⚠ Letzter Scan-Log (${meta.lastErrorLog.length} Zeichen)</summary>
                <pre style="margin: 8px 0 0; padding: 12px; background: #FEF3C7; border-radius: 6px; font-size: 11px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; color: #78350F;">${escHtml(meta.lastErrorLog)}</pre>
              </details>
              ` : ""}
              <p style="margin: 18px 0 0; font-size: 12px; color: #9CA3AF;">
                Direkt antworten — die Mail geht via Reply-To an ${escHtml(userMail)}.
              </p>
            </div>
          </div>
        `,
        attachments: screenshot ? [{
          filename: screenshot.name,
          content:  screenshot.buffer,
        }] : undefined,
      });
    } catch (err) {
      // Resend-Fail soll den User nicht blockieren — Ticket ist in DB.
      console.error("[support] Resend admin notification failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
