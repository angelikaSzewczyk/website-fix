import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";
import { Resend } from "resend";
import { logAudit } from "@/lib/audit";
import { createHash } from "crypto";

// Token-Format-Check identisch zu /invite/[token]
const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,80}$/;

// Hilfsfunktion für IP-Hashing (identisch zu deinem Scan-Rate-Limiter)
function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.IP_SALT ?? "wf-salt-2024"))
    .digest("hex");
}

// Registrierungs-spezifisches Rate Limiting (z.B. max 5 Versuche pro 24h pro IP)
const REG_LIMIT = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

async function checkRegisterRateLimit(ip: string): Promise<{ allowed: boolean; reason?: string }> {
  const sql = neon(process.env.DATABASE_URL!);
  const ipHash = hashIp(ip);
  const now = Date.now();

  type Row = { first_attempt_at: string; last_attempt_at: string; attempt_count: number };
  
  // Hinweis: Falls du eine eigene Tabelle hast oder nutzen möchtest, 
  // kannst du hier die Tabelle anpassen (z.B. 'free_scan_limits' oder eine neue 'register_limits').
  // Hier nutzen wir beispielhaft eine Abfrage:
  const rows = (await sql`
    SELECT first_scan_at as first_attempt_at, last_scan_at as last_attempt_at, scan_count as attempt_count
    FROM free_scan_limits
    WHERE ip_hash = ${ipHash}
  `) as Row[];

  if (rows.length === 0) {
    await sql`
      INSERT INTO free_scan_limits (ip_hash, first_scan_at, last_scan_at, scan_count)
      VALUES (${ipHash}, NOW(), NOW(), 1)
    `;
    return { allowed: true };
  }

  const entry = rows[0];
  const firstAttemptAt = new Date(entry.first_attempt_at).getTime();
  const lastAttemptAt = new Date(entry.last_attempt_at).getTime();

  if (now - firstAttemptAt >= WINDOW_MS) {
    await sql`
      UPDATE free_scan_limits
      SET first_scan_at = NOW(), last_scan_at = NOW(), scan_count = 1
      WHERE ip_hash = ${ipHash}
    `;
    return { allowed: true };
  }

  // Kurzer Mindestabstand (z.B. 5 Sekunden zwischen Registrierungsversuchen)
  if (now - lastAttemptAt < 5000) {
    return { allowed: false, reason: "Bitte warte einen Moment vor dem nächsten Versuch." };
  }

  if (entry.attempt_count >= REG_LIMIT) {
    return { allowed: false, reason: "Zu viele Registrierungsversuche von dieser IP. Bitte versuche es morgen erneut." };
  }

  await sql`
    UPDATE free_scan_limits
    SET last_scan_at = NOW(), scan_count = scan_count + 1
    WHERE ip_hash = ${ipHash}
  `;
  return { allowed: true };
}

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
                <div style="background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);border-radius:8px;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#FBBF24;flex-shrink:0;line-height:36px;text-align:center;">1</div>
                <div style="display:inline-block;vertical-align:top;padding-top:8px;padding-left:14px;width:calc(100% - 64px);">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#ffffff;">Exzellenz-Index abrufen</p>
                  <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5;">Gib deine Website-URL ein — der Score zeigt dir auf einen Blick, wie viel Sichtbarkeits-Potenzial noch ungenutzt ist.</p>
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
    // ── 1. IP-Rate-Limiting (Lokaler Entwicklungsschutz) ────────────────
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    
    // Prüfen, ob es sich um Localhost handelt
    const isLocalhost = ip === "127.0.0.1" || ip === "::1" || ip.includes("localhost") || ip.includes("192.168.");

    if (!isLocalhost) {
      const rateLimitCheck = await checkRegisterRateLimit(ip);
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { error: rateLimitCheck.reason || "Zu viele Anfragen. Bitte versuche es später erneut." },
          { status: 429 }
        );
      }
    }

    // ── 2. Request Body parsen ──────────────────────────────────────────
    const { name, email, password, invite } = await req.json() as {
      name?:     string;
      email?:    string;
      password?: string;
      invite?:   string;
    };

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Alle Felder sind erforderlich." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
    }

    const inviteToken = invite && INVITE_TOKEN_PATTERN.test(invite) ? invite : null;
    const sql = neon(process.env.DATABASE_URL!);

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      const withPwd = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} AND password_hash IS NULL`;
      if (withPwd.length > 0) {
        const hashed = await hash(password, 12);
        await sql`UPDATE users SET password_hash = ${hashed}, name = COALESCE(name, ${name}) WHERE email = ${email.toLowerCase()}`;
        return NextResponse.json({ ok: true, linked: true });
      }
      return NextResponse.json({ error: "E-Mail bereits registriert." }, { status: 409 });
    }

    const hashed = await hash(password, 12);
    await sql`
      INSERT INTO users (name, email, password_hash, "emailVerified")
      VALUES (${name}, ${email.toLowerCase()}, ${hashed}, NOW())
    `;

    // ── 3. Invite-Token-Claim ───────────────────────────────────────────
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
      } catch (err) {
        console.error("[register] invite-token claim failed:", err);
      }
    }

    // ── 4. Willkommens-E-Mail senden ────────────────────────────────────
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