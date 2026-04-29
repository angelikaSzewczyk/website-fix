import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import { Resend } from "resend";
import { logAudit } from "@/lib/audit";

// Token-Format-Check identisch zu /invite/[token] — defense-in-depth, falls
// jemand ein gefälschtes Token-Feld an /register sendet.
const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,80}$/;

function buildWelcomeEmail(firstName: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Willkommen bei WebsiteFix</title></head>
<body style="margin:0;padding:0;background:#0b0c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0c10;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr><td style="padding:0 0 32px;">
          <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.02em;">
            Website<span style="color:#FBBF24;">Fix</span>
          </div>
        </td></tr>

        <!-- Hero -->
        <tr><td style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 40px 32px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#FBBF24;text-transform:uppercase;letter-spacing:0.08em;">Exzellenz-Index</p>
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:900;color:#ffffff;line-height:1.2;letter-spacing:-0.025em;">
            Hallo ${firstName} — dein Sichtbarkeits-Boost startet jetzt.
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.7;">
            Dein WebsiteFix-Account ist aktiv. In wenigen Sekunden siehst du, welche Optimierungen deiner Website heute am meisten Wachstum bringen.
          </p>

          <!-- Steps -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 0 16px;">
                <div style="display:flex;align-items:flex-start;gap:14px;">
                  <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);border-radius:8px;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#FBBF24;flex-shrink:0;line-height:36px;text-align:center;">1</div>
                  <div style="padding-top:8px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;">Exzellenz-Index abrufen</p>
                    <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5;">Gib deine Website-URL ein — der Score zeigt dir auf einen Blick, wie viel Sichtbarkeits-Potenzial noch ungenutzt ist.</p>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 0 16px;">
                <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);border-radius:8px;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#FBBF24;flex-shrink:0;line-height:36px;text-align:center;">2</div>
                <div style="display:inline-block;vertical-align:top;padding-top:8px;padding-left:14px;width:calc(100% - 64px);">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;">Wachstums-Bremsen identifizieren</p>
                  <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5;">Sieh sofort, welche Fehler dein Google-Ranking und deine Conversion-Rate heute blockieren — priorisiert nach Impact.</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0;">
                <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);border-radius:8px;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#FBBF24;flex-shrink:0;line-height:36px;text-align:center;">3</div>
                <div style="display:inline-block;vertical-align:top;padding-top:8px;padding-left:14px;width:calc(100% - 64px);">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;">Smart-Fix Drawer öffnen</p>
                  <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5;">Klicke auf eine Wachstums-Bremse — der Direkt-Fix Guide zeigt dir Schritt für Schritt, wie du das Problem in unter 10 Minuten löst.</p>
                </div>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="margin-top:32px;text-align:center;">
            <a href="https://website-fix.com/dashboard/scan"
               style="display:inline-block;padding:14px 36px;background:#FBBF24;color:#0b0c10;border-radius:10px;font-size:15px;font-weight:900;text-decoration:none;letter-spacing:-0.01em;">
              Ersten Scan starten →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 0 0;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);line-height:1.7;">
            Du erhältst diese E-Mail, weil du dich bei <a href="https://website-fix.com" style="color:rgba(255,255,255,0.4);text-decoration:none;">website-fix.com</a> registriert hast.<br>
            <a href="https://website-fix.com/dashboard/settings" style="color:rgba(255,255,255,0.3);text-decoration:none;">E-Mail-Einstellungen</a> &nbsp;·&nbsp;
            <a href="https://website-fix.com/impressum" style="color:rgba(255,255,255,0.3);text-decoration:none;">Impressum</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, invite } = await req.json() as {
      name?:    string;
      email?:   string;
      password?: string;
      invite?:  string;  // Optional: Token aus /invite/[token]-Flow
    };

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Alle Felder sind erforderlich." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
    }
    // Optional invite-Token validieren bevor er die DB sieht.
    const inviteToken = invite && INVITE_TOKEN_PATTERN.test(invite) ? invite : null;

    const sql = neon(process.env.DATABASE_URL!);

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      // Google-only account → link password
      const withPwd = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} AND password_hash IS NULL`;
      if (withPwd.length > 0) {
        const hashed = await hash(password, 12);
        await sql`UPDATE users SET password_hash = ${hashed}, name = COALESCE(name, ${name}) WHERE email = ${email.toLowerCase()}`;
        return NextResponse.json({ ok: true, linked: true });
      }
      return NextResponse.json({ error: "E-Mail bereits registriert." }, { status: 409 });
    }

    const hashed = await hash(password, 12);
    // Column is "emailVerified" (camelCase — NextAuth schema)
    await sql`
      INSERT INTO users (name, email, password_hash, "emailVerified")
      VALUES (${name}, ${email.toLowerCase()}, ${hashed}, NOW())
    `;

    // ── Invite-Token-Claim (Phase 9) ────────────────────────────────────
    // Wenn der User über /invite/[token] kam: jetzt joined_at setzen.
    // Strenge Match-Conditions: Token muss noch gültig + die Email im Token
    // muss zur registrierten Email passen. Verhindert "geleakter Token wird
    // mit fremder Email kombiniert"-Angriff. Token wird beim Claim NICHT
    // gelöscht (joined_at IS NULL bleibt der Replay-Check) — Audit-Trail
    // bleibt erhalten.
    if (inviteToken) {
      try {
        const claimed = await sql`
          UPDATE team_members
          SET    joined_at = NOW()
          WHERE  invite_token     = ${inviteToken}
            AND  token_expires_at > NOW()
            AND  joined_at        IS NULL
            AND  LOWER(member_email) = ${email.toLowerCase()}
          RETURNING id, owner_id, member_email
        ` as { id: number; owner_id: number; member_email: string }[];

        if (claimed[0]) {
          logAudit({
            ownerId:     claimed[0].owner_id,
            action:      "team.join",
            memberEmail: claimed[0].member_email,
            memberId:    claimed[0].id,
          });
        }
        // Kein Failure-Path: wenn Token nicht matched (z.B. abgelaufen während
        // der User das Formular ausfüllte), wird der Account trotzdem erstellt.
        // User landet als Standard-Free-User; Owner kann erneut einladen.
      } catch (err) {
        console.error("[register] invite-token claim failed:", err);
        // Non-blocking — Account-Erstellung erfolgreich, Team-Verknüpfung kommt
        // später per Re-Invite zustande.
      }
    }

    // Send plan-aware welcome email (non-blocking)
    const firstName = name.split(" ")[0] ?? name;
    const resend = new Resend(process.env.RESEND_API_KEY);
    resend.emails.send({
      from: "WebsiteFix <support@website-fix.com>",
      to: email.toLowerCase(),
      subject: "Dein Exzellenz-Index wartet — los geht's!",
      html: buildWelcomeEmail(firstName),
    }).catch(() => {/* non-critical */});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Registrierung fehlgeschlagen. Bitte versuche es erneut." }, { status: 500 });
  }
}
