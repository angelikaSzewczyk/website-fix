import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // Vercel Cron Authorization
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Fällige Scans holen
  const due = await sql`
    SELECT ss.*, u.email, u.name
    FROM scheduled_scans ss
    JOIN users u ON u.id = ss.user_id
    WHERE ss.active = true AND ss.next_run_at <= NOW()
    LIMIT 10
  `;

  let processed = 0;

  for (const job of due) {
    try {
      // Scan ausführen (nur website-Check für Cron — WCAG braucht Browser)
      const targetUrl = job.url as string;
      const res = await fetch(`${process.env.NEXTAUTH_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-cron-secret": process.env.CRON_SECRET! },
        body: JSON.stringify({ url: targetUrl, userId: job.user_id }),
      });
      const data = await res.json();

      // next_run_at aktualisieren
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + ((job.frequency as string) === "daily" ? 1 : 7));
      await sql`
        UPDATE scheduled_scans
        SET last_run_at = NOW(), next_run_at = ${nextRun.toISOString()}
        WHERE id = ${job.id as string}
      `;

      // E-Mail senden wenn Probleme gefunden
      if (job.notify_email && data.success && data.scanData && job.email && process.env.RESEND_API_KEY) {
        const issueCount = data.diagnose?.match(/🔴/g)?.length ?? 0;
        if (issueCount > 0) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "WebsiteFix <support@website-fix.com>",
            to: job.email as string,
            subject: `⚠️ ${issueCount} Problem${issueCount !== 1 ? "e" : ""} auf ${targetUrl}`,
            html: `
              <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111">
                <h2>Automatischer Scan: ${targetUrl}</h2>
                <p>Unser wöchentlicher Scan hat <strong>${issueCount} Problem${issueCount !== 1 ? "e" : ""}</strong> gefunden.</p>
                <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#0b0c10;color:#8df3d3;text-decoration:none;border-radius:8px;font-weight:700;border:1px solid #8df3d3">
                  Im Dashboard ansehen →
                </a>
                <p style="color:#999;font-size:12px">Du erhältst diese Mail weil du automatische Scans für ${targetUrl} aktiviert hast.</p>
              </div>
            `,
          });
        }
      }

      processed++;
    } catch (err) {
      console.error(`Cron-Scan fehlgeschlagen für ${job.url}:`, err);
    }
  }

  return NextResponse.json({ processed, total: due.length });
}
