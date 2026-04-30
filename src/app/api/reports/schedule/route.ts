/**
 * /api/reports/schedule — Auto-Monthly-Reports persistieren.
 *
 * Phase 3 Sprint 11: löst den Mock-Toggle in dashboard/reports/reports-client.tsx
 * ab. Vorher hat handleAutoSave() nur einen lokalen useState gesetzt — der
 * Status-Toggle "Aktiv" bedeutete NICHTS, kein Cron, kein DB-Eintrag, kein
 * Versand. User-Vertrauensbruch.
 *
 * Jetzt: jeder Click landet als Upsert in scheduled_reports. Ein separater
 * Cron-Worker (siehe /api/cron/...) liest is_active=TRUE Zeilen und versendet
 * am 1. jeden Monats. Die UI spiegelt nur den DB-Status.
 *
 * Gates:
 *   - Auth Pflicht (401 wenn nicht eingeloggt).
 *   - Plan-Check: nur Pro/Agency dürfen Auto-Reports konfigurieren —
 *     Starter sehen den Toggle gar nicht erst, aber Server schützt nochmal.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { isAtLeastProfessional } from "@/lib/plans";

export const runtime = "nodejs";

type ScheduleRow = {
  id: number;
  user_id: number;
  website_id: string | null;
  recipient_email: string;
  interval: string;
  branding_enabled: boolean;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

// Body-Validation — nur diese Keys sind erlaubt. Alles andere wird ignoriert.
type ScheduleBody = {
  websiteId?:        string | null;
  recipientEmail:    string;
  interval?:         "monthly" | "weekly";
  brandingEnabled?:  boolean;
  isActive?:         boolean;
};

function isValidEmail(s: string): boolean {
  // Pragmatische Email-Heuristik. RFC-konform wäre Overkill — wir filtern
  // hier nur grobe Tipp-Fehler, der eigentliche Mailversand validiert eh.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}

// ── GET /api/reports/schedule ────────────────────────────────────────────────
// Liefert die scheduled_reports-Konfigurationen des Users zurück, damit der
// Client den Toggle initial korrekt rendert (statt jedes Mal mit "Inaktiv"
// zu starten).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, user_id, website_id::text, recipient_email,
             interval, branding_enabled, is_active,
             last_sent_at::text, created_at::text, updated_at::text
      FROM scheduled_reports
      WHERE user_id = ${session.user.id}
      ORDER BY website_id NULLS FIRST, created_at DESC
    ` as ScheduleRow[];
    return NextResponse.json({ schedules: rows });
  } catch (err) {
    console.error("[reports/schedule] GET failed:", err);
    return NextResponse.json({ schedules: [] });
  }
}

// ── POST /api/reports/schedule ───────────────────────────────────────────────
// Upsert: pro (user, website) genau eine Zeile. websiteId=null = Account-
// Default-Report für alle Sites zusammengefasst. Migration garantiert die
// Partial-Unique-Indices (scheduled_reports_user_website_idx /
// scheduled_reports_user_default_idx).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const userPlan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isAtLeastProfessional(userPlan)) {
    return NextResponse.json(
      { error: "Auto-Reports sind ab Professional verfügbar." },
      { status: 403 },
    );
  }

  let body: ScheduleBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  const recipientEmail = (body.recipientEmail ?? "").trim();
  if (!recipientEmail || !isValidEmail(recipientEmail)) {
    return NextResponse.json(
      { error: "Bitte eine gültige Empfänger-E-Mail angeben." },
      { status: 400 },
    );
  }

  const interval         = body.interval === "weekly" ? "weekly" : "monthly";
  const brandingEnabled  = body.brandingEnabled !== false;
  const isActive         = body.isActive !== false;
  const websiteId        = body.websiteId?.trim() || null;

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Wenn websiteId gegeben: Ownership-Check, damit niemand für fremde
    // saved_websites einen Cron-Job einrichtet.
    if (websiteId) {
      const ownerRows = await sql`
        SELECT 1 FROM saved_websites
        WHERE id = ${websiteId} AND user_id = ${session.user.id}
        LIMIT 1
      ` as unknown[];
      if (ownerRows.length === 0) {
        return NextResponse.json({ error: "Website nicht gefunden." }, { status: 404 });
      }
    }

    // Upsert mit zwei Pfaden, weil Partial-UNIQUE-Indices auf NULL ≠ NULL
    // arbeiten. Der einfachste Weg: zuerst lookup, dann INSERT oder UPDATE.
    const existing = websiteId
      ? await sql`
          SELECT id FROM scheduled_reports
          WHERE user_id = ${session.user.id} AND website_id = ${websiteId}
          LIMIT 1
        ` as { id: number }[]
      : await sql`
          SELECT id FROM scheduled_reports
          WHERE user_id = ${session.user.id} AND website_id IS NULL
          LIMIT 1
        ` as { id: number }[];

    let rows: ScheduleRow[];
    if (existing.length > 0) {
      rows = await sql`
        UPDATE scheduled_reports
        SET recipient_email  = ${recipientEmail},
            interval         = ${interval},
            branding_enabled = ${brandingEnabled},
            is_active        = ${isActive},
            updated_at       = NOW()
        WHERE id = ${existing[0].id} AND user_id = ${session.user.id}
        RETURNING id, user_id, website_id::text, recipient_email,
                  interval, branding_enabled, is_active,
                  last_sent_at::text, created_at::text, updated_at::text
      ` as ScheduleRow[];
    } else {
      rows = await sql`
        INSERT INTO scheduled_reports
          (user_id, website_id, recipient_email, interval, branding_enabled, is_active)
        VALUES
          (${session.user.id}, ${websiteId}, ${recipientEmail},
           ${interval}, ${brandingEnabled}, ${isActive})
        RETURNING id, user_id, website_id::text, recipient_email,
                  interval, branding_enabled, is_active,
                  last_sent_at::text, created_at::text, updated_at::text
      ` as ScheduleRow[];
    }

    return NextResponse.json({ success: true, schedule: rows[0] });
  } catch (err) {
    console.error("[reports/schedule] POST failed:", err);
    return NextResponse.json(
      { error: "Speichern fehlgeschlagen — bitte erneut versuchen." },
      { status: 500 },
    );
  }
}

// ── DELETE /api/reports/schedule?id=<n> ──────────────────────────────────────
// User kann eine geplante Konfiguration komplett löschen. Soft-Delete via
// is_active=FALSE wäre auch möglich, aber DELETE ist hier ehrlicher: der
// User sieht den Toggle dann nicht mehr "Inaktiv", sondern weg.
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }
  const idStr = req.nextUrl.searchParams.get("id");
  const id    = idStr ? parseInt(idStr, 10) : NaN;
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Ungültige ID." }, { status: 400 });
  }
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      DELETE FROM scheduled_reports
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reports/schedule] DELETE failed:", err);
    return NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }
}
