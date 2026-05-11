import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { createHash } from "crypto";

/**
 * Lead-Capture-Endpoint für die /plugin-report-Landing.
 *
 * Input (JSON-Body):
 *   email      — required, RFC-5322-ish validation
 *   siteUrl    — optional, vor-ausgefüllt aus dem Plugin
 *   source     — utm_source (default "wp-plugin")
 *   medium     — utm_medium
 *   campaign   — utm_campaign
 *
 * Output:
 *   { success: true, message: string }
 *   { success: false, error: string }
 *
 * Persistiert in plugin_leads (UNIQUE(email, source) → idempotent).
 * Sendet Welcome-Mail via Resend mit Scan-Trigger-Link.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function hashIp(ip: string): string {
  return createHash("sha256")
    .update("plugin-lead:" + ip + (process.env.IP_SALT ?? "wf-salt-2024"))
    .digest("hex");
}

function getClientIp(req: NextRequest): string {
  return (req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "0.0.0.0").trim();
}

export async function POST(req: NextRequest) {
  // ── Origin-Check (gegen Direct-Curl-Abuse) ──
  // Im Production-Build muss der Request entweder von unserer Domain oder
  // vom WordPress-Plugin selbst kommen. Plugin-Calls haben einen anderen
  // Referer (= Kunden-Site), darum lassen wir Origin-Mismatch hier durch.
  // Schutz erfolgt stattdessen via Rate-Limit + Captcha-frei UNIQUE-Constraint.

  let body: { email?: unknown; siteUrl?: unknown; source?: unknown; medium?: unknown; campaign?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Ungültiger Request-Body." }, { status: 400 });
  }

  // ── Validation ──
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ success: false, error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 });
  }

  const siteUrl  = typeof body.siteUrl === "string"  ? body.siteUrl.slice(0, 500)  : null;
  const source   = typeof body.source === "string"   ? body.source.slice(0, 80)    : "unknown";
  const medium   = typeof body.medium === "string"   ? body.medium.slice(0, 80)    : null;
  const campaign = typeof body.campaign === "string" ? body.campaign.slice(0, 80)  : null;

  const ip       = getClientIp(req);
  const ipHash   = hashIp(ip);
  const ua       = (req.headers.get("user-agent") ?? "").slice(0, 250);

  // ── Rate-Limit per IP: max 3 Submits / 24 h ──
  // Schützt vor Spam-Bots, ohne Captcha-Friction für echte User.
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const recent = await sql`
      SELECT COUNT(*)::int AS cnt FROM plugin_leads
      WHERE ip_hash = ${ipHash} AND captured_at > NOW() - INTERVAL '24 hours'
    ` as Array<{ cnt: number }>;
    if ((recent[0]?.cnt ?? 0) >= 3) {
      return NextResponse.json(
        { success: false, error: "Zu viele Anfragen von deiner IP. Bitte versuche es in 24 Stunden erneut." },
        { status: 429 },
      );
    }
  } catch (err) {
    console.error("[plugin-lead] rate-limit-query failed:", err);
    // Defensiv: bei DB-Fehler nicht den User aussperren — der Insert unten
    // wird dann auch failen und wir geben einen sauberen Fehler zurück.
  }

  // ── Persist (idempotent via UNIQUE(email, source)) ──
  let isFirstTime = true;
  try {
    const inserted = await sql`
      INSERT INTO plugin_leads (email, source, medium, campaign, site_url, ip_hash, user_agent)
      VALUES (${email}, ${source}, ${medium}, ${campaign}, ${siteUrl}, ${ipHash}, ${ua})
      ON CONFLICT (email, source) DO NOTHING
      RETURNING id
    ` as Array<{ id: number }>;
    isFirstTime = inserted.length > 0;
  } catch (err) {
    console.error("[plugin-lead] insert failed:", err);
    return NextResponse.json({ success: false, error: "Speichern fehlgeschlagen. Bitte später erneut versuchen." }, { status: 500 });
  }

  // ── Welcome-Mail via Resend (fire-and-forget) ──
  // Mail-Failure darf den User-Flow nicht blocken. Wir geben success=true
  // zurück, egal ob die Mail durchgeht — der User hat seinen Lead-Eintrag.
  if (process.env.RESEND_API_KEY && isFirstTime) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const baseUrl = process.env.NEXTAUTH_URL ?? "https://website-fix.com";
      const scanUrl = siteUrl
        ? `${baseUrl}/scan?url=${encodeURIComponent(siteUrl)}&utm_source=plugin-lead&utm_campaign=welcome`
        : `${baseUrl}/scan?utm_source=plugin-lead&utm_campaign=welcome`;

      await resend.emails.send({
        from:    "WebsiteFix <noreply@website-fix.com>",
        to:      email,
        subject: "Dein 92-Punkt-Bericht ist bereit ✓",
        html: `
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F172A;">
            <h2 style="margin:0 0 12px;font-size:20px;">Bereit für den Deep-Audit.</h2>
            <p style="margin:0 0 16px;line-height:1.6;color:#475569;">
              Vielen Dank — der vollständige 92-Punkt-Bericht ist freigeschaltet.
              Starte den Scan mit einem Klick, das Tool erkennt deinen Hoster automatisch
              und liefert die Diagnose inkl. Datenbank-Audit, PHP-Error-Trace und Hook-Chain-Analyse.
            </p>
            <a href="${scanUrl}" style="display:inline-block;padding:12px 22px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
              Deep-Scan starten →
            </a>
            <p style="margin:20px 0 6px;padding:10px 12px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;font-size:11.5px;color:#92400E;line-height:1.5;">
              💡 <strong>Damit du keine Mails verpasst:</strong> bitte
              <strong>noreply@website-fix.com</strong> zu deinen Kontakten hinzufügen
              oder als „kein Spam" markieren — vor allem bei web.de/GMX-Postfächern.
            </p>
            <p style="margin:14px 0 0;font-size:11px;color:#94A3B8;">
              Du hast diese Mail erhalten, weil du auf deiner WordPress-Site das WebsiteFix-Health-Check-Plugin
              installiert hast und den 92-Punkt-Bericht angefordert hast. Keine Newsletter, kein Spam.
            </p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("[plugin-lead] welcome mail failed:", mailErr);
    }
  }

  return NextResponse.json({
    success: true,
    message: isFirstTime
      ? "Bericht freigeschaltet. Check dein Postfach für den Scan-Link."
      : "Du bist bereits registriert. Bitte prüfe dein Postfach (auch Spam-Ordner).",
  });
}
