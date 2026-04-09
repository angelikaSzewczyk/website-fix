import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Alle Felder sind erforderlich." }, { status: 400 });
    }

    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

    if (resend) {
      await resend.emails.send({
        from: "WebsiteFix <support@website-fix.com>",
        to: "support@website-fix.com",
        replyTo: email,
        subject: `[Kontakt] ${subject}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <div style="background: #0D1117; padding: 20px 24px; border-radius: 10px 10px 0 0; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px; font-weight: 300; color: #fff;">Website<strong style="color: #F59E0B;">Fix</strong></span>
            </div>
            <div style="border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px; padding: 28px;">
              <h2 style="margin: 0 0 20px; font-size: 18px; color: #0D1321;">Neue Kontaktanfrage</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 8px 12px; background: #F8FAFC; color: #6B7280; font-weight: 600; width: 100px; border-radius: 6px 0 0 6px;">Name</td>
                  <td style="padding: 8px 12px; color: #374151;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #F8FAFC; color: #6B7280; font-weight: 600; border-radius: 6px 0 0 6px;">E-Mail</td>
                  <td style="padding: 8px 12px; color: #374151;"><a href="mailto:${email}" style="color: #2563EB;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; background: #F8FAFC; color: #6B7280; font-weight: 600; border-radius: 6px 0 0 6px;">Betreff</td>
                  <td style="padding: 8px 12px; color: #374151;">${subject}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding: 16px; background: #F8FAFC; border-radius: 8px; border-left: 3px solid #2563EB;">
                <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em;">Nachricht</p>
                <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.7; white-space: pre-wrap;">${message}</p>
              </div>
              <p style="margin: 24px 0 0; font-size: 12px; color: #9CA3AF;">
                Du kannst direkt auf diese E-Mail antworten — sie geht an ${email}.
              </p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] error:", err);
    return NextResponse.json({ error: "Senden fehlgeschlagen. Bitte erneut versuchen." }, { status: 500 });
  }
}
