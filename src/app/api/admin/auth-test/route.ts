/**
 * /api/admin/auth-test — schickt eine Test-Mail an Port25's Auth-Verifier.
 *
 * Port25 ist ein kostenloser Service: Mail an check-auth@verifier.port25.com
 * → Auto-Reply mit komplettem SPF/DKIM/DMARC/SpamAssassin-Report.
 *
 * Der Report geht an die ReplyTo-Adresse (ADMIN_EMAIL), damit der Admin den
 * Bericht direkt im eigenen Postfach sieht — nicht in noreply@website-fix.com,
 * was wir gar nicht lesen können.
 *
 * Nur Admin-Zugriff. Single-Use-Tool — nach erfolgreichem Test kann die Route
 * bleiben (kein Schaden) oder gelöscht werden.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Resend } from "resend";

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL ?? "";
const DEFAULT_TARGET = "check-auth@verifier.port25.com";

/** Whitelist legitimer Auth-Tester. Verhindert dass der Endpoint zum
 *  Generic-Mail-Sender umfunktioniert wird. */
const ALLOWED_DOMAINS = [
  "verifier.port25.com",
  "dkimvalidator.com",
  "appmaildev.com",         // mail-tester ähnlich
];

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email ?? "";
  if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY not set" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({})) as { to?: string };
  const target = (body.to || DEFAULT_TARGET).trim();

  // Domain-Whitelist
  const targetDomain = target.split("@")[1] ?? "";
  if (!ALLOWED_DOMAINS.includes(targetDomain)) {
    return NextResponse.json({
      error: `Empfänger-Domain '${targetDomain}' nicht erlaubt. Erlaubt: ${ALLOWED_DOMAINS.join(", ")}`,
    }, { status: 400 });
  }

  const sentAt = new Date().toISOString();
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    "WebsiteFix <noreply@website-fix.com>",
      to:      target,
      replyTo: ADMIN_EMAIL,
      subject: "WebsiteFix Auth Verification Request",
      html: `
        <p>Hi,</p>
        <p>Automated authentication test. Please verify SPF/DKIM/DMARC.</p>
        <p style="font-family:monospace;font-size:11px;color:#666;">
          Domain: website-fix.com<br/>
          Sent: ${sentAt}<br/>
          Provider: Resend<br/>
          Reply-To: ${ADMIN_EMAIL}
        </p>
      `,
      text: `WebsiteFix auth verification test\n\nDomain: website-fix.com\nSent: ${sentAt}\nReply-To: ${ADMIN_EMAIL}\n\nPlease verify SPF/DKIM/DMARC.`,
    });

    return NextResponse.json({
      ok:       true,
      sentTo:   target,
      reportTo: targetDomain === "dkimvalidator.com" ? "Browser bei dkimvalidator.com" : ADMIN_EMAIL,
      sentAt,
      hint:     targetDomain === "dkimvalidator.com"
        ? "Mail verschickt. Geh jetzt zurück zu dkimvalidator.com und klicke auf 'View Results' — der Report erscheint im Browser, kein Mail-Reply nötig."
        : `Report kommt in 1-5 Min an ${ADMIN_EMAIL} (auch Spam-Ordner prüfen).`,
    });
  } catch (err) {
    console.error("[auth-test] mail send failed:", err);
    return NextResponse.json(
      { error: "Mail send failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
