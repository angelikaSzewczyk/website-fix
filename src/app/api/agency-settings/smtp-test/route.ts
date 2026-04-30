/**
 * /api/agency-settings/smtp-test — testet eine SMTP-Verbindung.
 *
 * Sprint 12: der "Verbindung testen"-Button ruft hier an. Wir öffnen einen
 * TCP-Socket (Port 465: TLS direkt; Port 25/587: STARTTLS), lesen das SMTP-
 * Banner, schicken EHLO und (wenn AUTH ankommen soll) AUTH LOGIN. Bei AUTH-
 * Antwort 235 ist der Login OK.
 *
 * Bewusst KEINE nodemailer-Dependency: ein minimalistischer Probe reicht für
 * den Health-Check und vermeidet Bundle-Bloat. Wenn der User später Mails
 * tatsächlich versendet (z.B. monthly-report), fällt ein invalides Setup
 * dort auf — diese Route ist die schnelle Diagnose.
 *
 * Limits: 10s Connect-Timeout, 10s pro Server-Response. Hängende Provider
 * (manche Hetzner/Hosteurope-Server reagieren träge) brechen wir hart ab.
 */

import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";
import { hasBrandingAccess } from "@/lib/plans";
import { tryDecrypt } from "@/lib/crypto";
import { connect as netConnect } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";
import type { Socket } from "node:net";

export const runtime = "nodejs";
export const maxDuration = 30;

const TIMEOUT_MS = 10_000;

type SmtpResult = { ok: true; message: string } | { ok: false; error: string };

function readReply(sock: Socket | TLSSocket): Promise<{ code: number; text: string }> {
  return new Promise((resolve, reject) => {
    let buf = "";
    const onData = (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      // SMTP multiline-replies: alle Zeilen außer der letzten enden mit "<code>-text",
      // die letzte mit "<code> text". Wir warten, bis eine Zeile mit "<3-digit><space>" kommt.
      const lines = buf.split(/\r?\n/);
      for (let i = 0; i < lines.length - 1; i++) {
        const m = /^(\d{3})\s+(.*)$/.exec(lines[i]);
        if (m) {
          sock.removeListener("data", onData);
          resolve({ code: parseInt(m[1], 10), text: lines.slice(0, i + 1).join("\n") });
          return;
        }
      }
    };
    const onError = (err: Error) => {
      sock.removeListener("data", onData);
      reject(err);
    };
    sock.on("data", onData);
    sock.once("error", onError);
    setTimeout(() => {
      sock.removeListener("data", onData);
      reject(new Error("SMTP-Read-Timeout"));
    }, TIMEOUT_MS);
  });
}

function send(sock: Socket | TLSSocket, line: string): void {
  sock.write(line + "\r\n");
}

async function probeSmtp(host: string, port: number, user: string, pass: string): Promise<SmtpResult> {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (r: SmtpResult) => { if (!resolved) { resolved = true; resolve(r); } };

    const baseSock: Socket = port === 465
      ? (tlsConnect({ host, port, servername: host, rejectUnauthorized: false }) as unknown as Socket)
      : netConnect({ host, port });

    const connectTimeout = setTimeout(() => {
      try { baseSock.destroy(); } catch {}
      finish({ ok: false, error: "Connect-Timeout — Host/Port nicht erreichbar." });
    }, TIMEOUT_MS);

    baseSock.once("error", (err) => {
      clearTimeout(connectTimeout);
      finish({ ok: false, error: `Verbindung fehlgeschlagen: ${err.message}` });
    });

    baseSock.once("connect", async () => {
      clearTimeout(connectTimeout);
      try {
        // 1. Banner lesen
        const banner = await readReply(baseSock);
        if (banner.code !== 220) {
          finish({ ok: false, error: `Unerwartetes Banner: ${banner.code} ${banner.text}` });
          baseSock.end();
          return;
        }

        // 2. EHLO senden
        send(baseSock, "EHLO websitefix.test");
        const ehlo = await readReply(baseSock);
        if (ehlo.code !== 250) {
          finish({ ok: false, error: `EHLO abgelehnt: ${ehlo.text}` });
          baseSock.end();
          return;
        }

        // 3. STARTTLS, falls Port != 465 (sonst ist die Verbindung schon TLS)
        let activeSock: Socket | TLSSocket = baseSock;
        if (port !== 465 && /STARTTLS/i.test(ehlo.text)) {
          send(baseSock, "STARTTLS");
          const starttls = await readReply(baseSock);
          if (starttls.code !== 220) {
            finish({ ok: false, error: `STARTTLS abgelehnt: ${starttls.text}` });
            baseSock.end();
            return;
          }
          activeSock = await new Promise<TLSSocket>((res, rej) => {
            const tlsSock = tlsConnect({
              socket: baseSock,
              servername: host,
              rejectUnauthorized: false,
            }, () => res(tlsSock));
            tlsSock.once("error", rej);
          });
          // EHLO erneut nach TLS-Upgrade
          send(activeSock, "EHLO websitefix.test");
          const ehlo2 = await readReply(activeSock);
          if (ehlo2.code !== 250) {
            finish({ ok: false, error: `EHLO post-STARTTLS abgelehnt: ${ehlo2.text}` });
            activeSock.end();
            return;
          }
        }

        // 4. AUTH LOGIN
        send(activeSock, "AUTH LOGIN");
        const authStart = await readReply(activeSock);
        if (authStart.code !== 334) {
          finish({ ok: false, error: `AUTH LOGIN nicht unterstützt: ${authStart.text}` });
          activeSock.end();
          return;
        }
        send(activeSock, Buffer.from(user).toString("base64"));
        const userReply = await readReply(activeSock);
        if (userReply.code !== 334) {
          finish({ ok: false, error: `Username abgelehnt: ${userReply.text}` });
          activeSock.end();
          return;
        }
        send(activeSock, Buffer.from(pass).toString("base64"));
        const passReply = await readReply(activeSock);
        if (passReply.code !== 235) {
          finish({ ok: false, error: `Passwort abgelehnt: ${passReply.text}` });
          activeSock.end();
          return;
        }

        // 5. QUIT
        send(activeSock, "QUIT");
        try { await readReply(activeSock); } catch {}
        activeSock.end();
        finish({ ok: true, message: "SMTP-Login erfolgreich (AUTH 235)." });
      } catch (err) {
        finish({ ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler" });
        try { baseSock.end(); } catch {}
      }
    });
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan;
  if (!hasBrandingAccess(plan)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as {
    host?: string; port?: number | string; user?: string; pass?: string;
  };

  const host = (body.host ?? "").trim();
  const port = typeof body.port === "string" ? parseInt(body.port, 10) : body.port ?? 0;
  const user = (body.user ?? "").trim();
  const passInput = body.pass ?? "";

  if (!host || !Number.isFinite(port) || port < 1 || port > 65535) {
    return NextResponse.json({ error: "Host und gültiger Port sind Pflicht." }, { status: 400 });
  }

  // Pass aus DB lesen, wenn nicht im Body — erlaubt Test ohne Re-Eingabe.
  let pass = passInput;
  if (!pass) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`
        SELECT smtp_pass_encrypted FROM agency_settings
        WHERE user_id = ${session.user.id} LIMIT 1
      ` as Array<{ smtp_pass_encrypted: string | null }>;
      const decrypted = tryDecrypt(rows[0]?.smtp_pass_encrypted);
      if (decrypted) pass = decrypted;
    } catch (err) {
      console.error("[smtp-test] pass lookup failed:", err);
    }
  }

  if (!user || !pass) {
    return NextResponse.json(
      { ok: false, error: "Benutzer + Passwort fehlen. Speichere zuerst dein SMTP-Passwort." },
      { status: 200 },
    );
  }

  const result = await probeSmtp(host, Number(port), user, pass);
  return NextResponse.json(result, { status: 200 });
}
