import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ ok: true }); // silent — don't reveal if email exists

  const sql = neon(process.env.DATABASE_URL!);

  // Ensure reset tokens table exists
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const user = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (!user.length) return NextResponse.json({ ok: true }); // silent

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await sql`
    INSERT INTO password_reset_tokens (email, token, expires_at)
    VALUES (${email.toLowerCase()}, ${token}, ${expiresAt.toISOString()})
  `;

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "WebsiteFix <support@website-fix.com>",
      to: email,
      subject: "Passwort zurücksetzen — WebsiteFix",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111">
          <h2 style="margin-bottom:8px">Passwort zurücksetzen</h2>
          <p style="color:#555;line-height:1.6">Du hast eine Anfrage zum Zurücksetzen deines Passworts erhalten. Klicke auf den Link unten — er ist 1 Stunde gültig.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#2563EB;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">
            Passwort zurücksetzen →
          </a>
          <p style="color:#999;font-size:13px">Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
        </div>
      `,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
