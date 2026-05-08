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

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Resend } from "resend";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const VERIFIER_TO = "check-auth@verifier.port25.com";

export async function POST() {
  // Auth-Gate
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

  const sentAt = new Date().toISOString();
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from:    "WebsiteFix <noreply@website-fix.com>",
      to:      VERIFIER_TO,
      replyTo: ADMIN_EMAIL,
      subject: "WebsiteFix Auth Verification Request",
      html: `
        <p>Hi Port25,</p>
        <p>This is an automated authentication test. Please reply with the SPF/DKIM/DMARC report.</p>
        <p style="font-family:monospace;font-size:11px;color:#666;">
          Domain: website-fix.com<br/>
          Sent: ${sentAt}<br/>
          Provider: Resend<br/>
          Reply-To: ${ADMIN_EMAIL}
        </p>
      `,
      text: `WebsiteFix authentication test\n\nDomain: website-fix.com\nSent: ${sentAt}\nReply-To: ${ADMIN_EMAIL}\n\nPlease reply with the auth report.`,
    });

    return NextResponse.json({
      ok:        true,
      sentTo:    VERIFIER_TO,
      reportTo:  ADMIN_EMAIL,
      sentAt,
      hint:      `Report kommt in 1-2 Min an ${ADMIN_EMAIL} (auch Spam-Ordner prüfen).`,
    });
  } catch (err) {
    console.error("[auth-test] mail send failed:", err);
    return NextResponse.json(
      { error: "Mail send failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
