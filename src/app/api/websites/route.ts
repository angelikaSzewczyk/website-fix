import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { checkWebsite } from "@/lib/monitor";
import { normalizePlan } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const sql = neon(process.env.DATABASE_URL!);
  // Phase 3 Sprint 3: Multi-Tenancy-Felder + last_scan_id für den
  // Power-Switcher (Click → /dashboard/scans/[id]). last_scan_id::text,
  // damit das uuid-Mapping im Client trivial ist.
  const websites = await sql`
    SELECT sw.id, sw.url, sw.name, sw.created_at,
      sw.is_customer_project,
      sw.client_label,
      sw.client_logo_url,
      (SELECT id::text FROM scans WHERE user_id = ${session.user.id} AND url = sw.url ORDER BY created_at DESC LIMIT 1) as last_scan_id,
      (SELECT issue_count FROM scans WHERE user_id = ${session.user.id} AND url = sw.url ORDER BY created_at DESC LIMIT 1) as last_issue_count,
      (SELECT created_at FROM scans WHERE user_id = ${session.user.id} AND url = sw.url ORDER BY created_at DESC LIMIT 1) as last_scan_at,
      (SELECT type FROM scans WHERE user_id = ${session.user.id} AND url = sw.url ORDER BY created_at DESC LIMIT 1) as last_scan_type
    FROM saved_websites sw
    WHERE sw.user_id = ${session.user.id}
    ORDER BY sw.is_customer_project ASC, sw.created_at DESC
  `;
  return NextResponse.json({ websites });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const body = await req.json() as {
    url?: string;
    name?: string;
    isCustomerProject?: boolean;
    clientLabel?: string;
  };
  const url = body.url;
  if (!url || typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "URL fehlt" }, { status: 400 });
  }

  // Normalisierung — wir speichern http(s) immer mit Protocol, sonst
  // matcht der spätere `WHERE url = ${url}` JOIN nicht.
  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = "https://" + cleanUrl;

  const cleanName  = body.name?.trim() || null;
  const isCustomer = body.isCustomerProject === true;
  const clientLabel = body.clientLabel?.trim() || null;

  const sql = neon(process.env.DATABASE_URL!);

  // ── Starter-Plan-Quota-Guard ────────────────────────────────────────
  // Pay-per-Guide-Pivot: Starter-User dürfen genau 1 Website verwalten.
  // Bei Versuch eine 2. anzulegen → 402 limit_reached, damit der Client
  // das Upsell-Modal zum Professional-Plan zeigen kann. Re-Submit derselben
  // URL ist erlaubt (UPSERT-Pfad bleibt unten greifbar).
  const userRow = await sql`
    SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as Array<{ plan: string | null }>;
  const planKey = normalizePlan(userRow[0]?.plan);

  if (planKey === "starter") {
    const existing = await sql`
      SELECT
        COUNT(*)::int                                              AS total,
        COUNT(*) FILTER (WHERE LOWER(url) = LOWER(${cleanUrl}))::int AS this_url
      FROM saved_websites
      WHERE user_id = ${session.user.id}
    ` as Array<{ total: number; this_url: number }>;

    const total   = existing[0]?.total   ?? 0;
    const thisUrl = existing[0]?.this_url ?? 0;

    // Limit greift nur wenn (a) schon eine Site existiert UND (b) die neue URL
    // KEINE existierende Site ist (sonst würde der ON-CONFLICT-UPSERT geblockt).
    if (total >= 1 && thisUrl === 0) {
      return NextResponse.json(
        {
          error:        "limit_reached",
          message:      "Starter-Plan ist auf 1 Website beschränkt. Upgrade auf Professional, um weitere Sites zu verwalten.",
          currentCount: total,
          limit:        1,
          plan:         "starter",
          upgradeTo:    "professional",
        },
        { status: 402 },
      );
    }
  }
  // RETURNING id::text — der New-Client-Modal-Flow muss die neue ID
  // sofort wissen, um danach auf /dashboard/scan?websiteId=<id> zu redirecten.
  // Bei Conflict (URL existiert schon) → existierende ID zurückgeben, damit
  // der Flow trotzdem weitergeht (DO UPDATE auf name fixt verlorene clientName).
  const rows = await sql`
    INSERT INTO saved_websites (user_id, url, name, is_customer_project, client_label)
    VALUES (
      ${session.user.id},
      ${cleanUrl},
      ${cleanName},
      ${isCustomer},
      ${clientLabel}
    )
    ON CONFLICT (user_id, url)
    DO UPDATE SET
      name                = COALESCE(EXCLUDED.name,                saved_websites.name),
      is_customer_project = saved_websites.is_customer_project OR EXCLUDED.is_customer_project,
      client_label        = COALESCE(EXCLUDED.client_label,        saved_websites.client_label)
    RETURNING id::text, url, name, is_customer_project, client_label
  ` as Array<{
    id: string; url: string; name: string | null;
    is_customer_project: boolean; client_label: string | null;
  }>;

  const website = rows[0] ?? null;

  // ── First-Run Health-Check ──────────────────────────────────────────
  // Vorher sah ein neu angelegter Kunde im Portfolio bis zum nächsten
  // monitor-Cron (06:00 UTC, 1×/Tag) leer aus — CMS, SSL, Security und
  // Status-Pill waren NULL, weil website_checks nur vom Cron befüllt wurde.
  //
  // Jetzt: nach dem INSERT in saved_websites führen wir SOFORT einen
  // checkWebsite() aus und schreiben den ersten website_checks-Eintrag.
  // Der User sieht beim Reload das vollständige Portfolio-Row.
  //
  // Defensiv: 8s-Timeout (Vercel-maxDuration: 15s lässt 7s Buffer für
  // den INSERT + DB-Roundtrips). Wenn die Kunden-Site offline ist oder
  // langsam antwortet, ignorieren wir das Failure — der Cron repariert
  // den Eintrag morgen früh.
  if (website) {
    try {
      const result = await Promise.race([
        checkWebsite(cleanUrl),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("first-run health check timeout")), 8000)
        ),
      ]);
      const status =
        result.alerts.some(a => a.level === "critical") ? "critical"
        : result.alerts.some(a => a.level === "warning") ? "warning"
        : result.is_online ? "ok" : "offline";

      await Promise.all([
        sql`
          INSERT INTO website_checks (
            website_id, user_id, is_online, response_time_ms,
            ssl_valid, ssl_expires_at, ssl_days_left,
            platform, security_score, security_headers,
            http_status, alerts,
            cms_context, plugins_detected
          ) VALUES (
            ${website.id}::uuid, ${session.user.id}, ${result.is_online}, ${result.response_time_ms},
            ${result.ssl_valid}, ${result.ssl_expires_at}, ${result.ssl_days_left},
            ${result.platform}, ${result.security_score}, ${JSON.stringify(result.security_headers)},
            ${result.http_status}, ${JSON.stringify(result.alerts)},
            ${result.cms_context}, ${JSON.stringify(result.plugins_detected)}::jsonb
          )
        `,
        sql`
          UPDATE saved_websites
          SET last_check_at = NOW(), last_check_status = ${status}
          WHERE id = ${website.id}::uuid
        `,
      ]);
    } catch (err) {
      // Kein Fail — der nächste Cron-Run repariert das. Der INSERT in
      // saved_websites ist bereits erfolgt, der User-Flow geht weiter.
      console.error("[websites POST] first-run check failed:", err);
    }
  }

  return NextResponse.json({ success: true, website });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  const { id } = await req.json();
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM saved_websites WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ success: true });
}

/**
 * PATCH — Multi-Tenancy-Felder pro Projekt aktualisieren (Phase 3 Sprint 4).
 *
 * Body: { id, is_customer_project?, client_label?, client_logo_url? }
 * Nur die mitgegebenen Felder werden gepatcht (undefined bleibt unangetastet).
 * Ownership-Check via WHERE user_id = session.user.id verhindert
 * Cross-Account-Manipulation.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = await req.json() as {
    id?: string;
    is_customer_project?: boolean;
    client_label?: string | null;
    client_logo_url?: string | null;
  };

  if (!body.id) return NextResponse.json({ error: "ID fehlt" }, { status: 400 });

  // Sanitize: leerer String → null, sonst trim. Verhindert "    " als gültigen Wert.
  const label = body.client_label === undefined
    ? undefined
    : (body.client_label?.trim() || null);
  const logoUrl = body.client_logo_url === undefined
    ? undefined
    : (body.client_logo_url?.trim() || null);
  const isCustomer = body.is_customer_project;

  // URL-Validierung: leeres oder einfaches Mantra wie "Kunden-Logo" wäre Quatsch.
  // Wenn ein Wert da ist, muss er http(s) sein, sonst 400.
  if (logoUrl && !/^https?:\/\//i.test(logoUrl)) {
    return NextResponse.json({ error: "client_logo_url muss mit http(s):// beginnen" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  // Coalesce-Pattern: nur die Spalten überschreiben, deren Wert NICHT undefined
  // ist. Wir reichen alle drei + ein Match-Token (booleanischer Flag pro Spalte)
  // an Postgres weiter, damit unveränderte Spalten ihren bisherigen Wert behalten.
  const updated = await sql`
    UPDATE saved_websites
    SET
      is_customer_project = COALESCE(${isCustomer ?? null}, is_customer_project),
      client_label        = CASE WHEN ${label === undefined}    THEN client_label    ELSE ${label    ?? null} END,
      client_logo_url     = CASE WHEN ${logoUrl === undefined}  THEN client_logo_url ELSE ${logoUrl  ?? null} END
    WHERE id = ${body.id} AND user_id = ${session.user.id}
    RETURNING id::text, is_customer_project, client_label, client_logo_url
  ` as Array<{ id: string; is_customer_project: boolean; client_label: string | null; client_logo_url: string | null }>;

  if (updated.length === 0) {
    return NextResponse.json({ error: "Projekt nicht gefunden oder gehört nicht dir" }, { status: 404 });
  }
  return NextResponse.json({ success: true, project: updated[0] });
}
