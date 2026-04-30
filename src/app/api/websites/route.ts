import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

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

  return NextResponse.json({ success: true, website: rows[0] ?? null });
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
