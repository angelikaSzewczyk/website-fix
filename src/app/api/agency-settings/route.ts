/**
 * /api/agency-settings — Branding + SMTP + Custom-Domain (Lese/Schreib-Endpoint).
 *
 * Sprint 12: erweitert um SMTP-Daten, Custom-Domain und White-Label-Logo.
 * Sensible Felder (smtp_pass) werden via lib/crypto.ts AES-256-GCM
 * verschlüsselt, NIE als Plain-Text in der DB.
 *
 * GET liefert die UI-Repräsentation:
 *   - smtp_pass_set: Boolean (true = Passwort hinterlegt; nie der Wert selbst)
 *   - api_key_wp_set: Boolean + api_key_wp_created_at
 *   - alle anderen Felder direkt
 *
 * PUT akzeptiert eine partielle Aktualisierung. smtp_pass wird nur dann
 * neu verschlüsselt, wenn ein nicht-leerer Wert kommt (Empty-String oder null
 * = Feld wird auf NULL gesetzt → Logout-Pfad).
 */

import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { hasBrandingAccess, isAgency } from "@/lib/plans";
import { encrypt } from "@/lib/crypto";

export const runtime = "nodejs";

// ── Validation Helpers ───────────────────────────────────────────────────────
function isValidHexColor(s: unknown): s is string {
  return typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);
}
function safeStr(v: unknown, max = 255): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}
function safeOptStr(v: unknown, max = 255): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}
function safeOptInt(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}
function isValidDomain(s: string): boolean {
  // Akzeptiert "kunde.de", "agency.example.com", "sub.kunde.tld".
  // Lehnt URLs (https://…), Pfade, IPs ab.
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(s);
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan;
  if (!hasBrandingAccess(plan)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT agency_name, agency_website, logo_url, primary_color,
           white_label_logo_url, custom_domain,
           smtp_host, smtp_port, smtp_user, smtp_from_email,
           smtp_pass_encrypted, api_key_wp_hash, api_key_wp_created_at::text AS api_key_wp_created_at
    FROM agency_settings
    WHERE user_id = ${session.user.id}
    LIMIT 1
  ` as Array<{
    agency_name: string | null; agency_website: string | null;
    logo_url: string | null; primary_color: string | null;
    white_label_logo_url: string | null; custom_domain: string | null;
    smtp_host: string | null; smtp_port: number | null;
    smtp_user: string | null; smtp_from_email: string | null;
    smtp_pass_encrypted: string | null;
    api_key_wp_hash: string | null; api_key_wp_created_at: string | null;
  }>;

  const row = rows[0];

  return NextResponse.json({
    agency_name:          row?.agency_name          ?? "",
    agency_website:       row?.agency_website       ?? "",
    logo_url:             row?.logo_url             ?? "",
    primary_color:        row?.primary_color        ?? "#8df3d3",
    white_label_logo_url: row?.white_label_logo_url ?? "",
    custom_domain:        row?.custom_domain        ?? "",
    smtp_host:            row?.smtp_host            ?? "",
    smtp_port:            row?.smtp_port            ?? null,
    smtp_user:            row?.smtp_user            ?? "",
    smtp_from_email:      row?.smtp_from_email      ?? "",
    // NIE den Plaintext zurückgeben — nur ob ein Wert hinterlegt ist.
    smtp_pass_set:        !!row?.smtp_pass_encrypted,
    api_key_wp_set:       !!row?.api_key_wp_hash,
    api_key_wp_created_at: row?.api_key_wp_created_at ?? null,
    // Agency-Plan kann WP-Bridge nutzen; kleinere Plans sehen den
    // "Generieren"-Button in der UI ausgegraut.
    can_use_wp_bridge:    isAgency(plan),
  });
}

// ── PUT ──────────────────────────────────────────────────────────────────────
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan;
  if (!hasBrandingAccess(plan)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  // ── Pflicht-Branding (alte Form-Compat) ──
  const agencyName    = safeStr(body.agency_name, 100);
  const agencyWebsite = safeStr(body.agency_website, 255);
  const logoUrl       = safeStr(body.logo_url);
  const primaryColor  = isValidHexColor(body.primary_color) ? body.primary_color : "#8df3d3";

  // ── Optional: White-Label + Custom-Domain ──
  const whiteLabelLogo = safeOptStr(body.white_label_logo_url, 1024);
  const customDomainRaw = safeOptStr(body.custom_domain, 253);
  let customDomain: string | null = customDomainRaw;
  if (customDomain) {
    customDomain = customDomain.toLowerCase().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
    if (!isValidDomain(customDomain)) {
      return NextResponse.json({ error: "Custom-Domain ungültig (z.B. kunde.de)." }, { status: 400 });
    }
  }

  // ── SMTP-Felder ──
  const smtpHost = safeOptStr(body.smtp_host, 253);
  const smtpPort = safeOptInt(body.smtp_port, 1, 65535);
  const smtpUser = safeOptStr(body.smtp_user, 253);
  const smtpFrom = safeOptStr(body.smtp_from_email, 253);
  // smtp_pass wird nur geschrieben, wenn ein neuer Wert kommt. Ein leerer
  // String und Wert "__clear__" (UI-Marker) löschen das Feld; undefined heißt
  // "nicht ändern".
  const smtpPassRaw = body.smtp_pass;
  let smtpPassEncrypted: string | null | undefined = undefined;
  if (smtpPassRaw === null || smtpPassRaw === "__clear__") {
    smtpPassEncrypted = null;
  } else if (typeof smtpPassRaw === "string" && smtpPassRaw.length > 0) {
    try {
      smtpPassEncrypted = encrypt(smtpPassRaw);
    } catch (err) {
      console.error("[agency-settings] encrypt failed:", err);
      return NextResponse.json({ error: "Server-Konfigurationsfehler — bitte Admin kontaktieren." }, { status: 500 });
    }
  }

  // E-Mail-Format-Check für smtp_from_email
  if (smtpFrom && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(smtpFrom)) {
    return NextResponse.json({ error: "Absender-E-Mail-Adresse ungültig." }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  try {
    if (smtpPassEncrypted === undefined) {
      // Kein Pass-Update → bestehenden Wert beibehalten.
      await sql`
        INSERT INTO agency_settings (
          user_id, agency_name, agency_website, logo_url, primary_color,
          white_label_logo_url, custom_domain,
          smtp_host, smtp_port, smtp_user, smtp_from_email,
          updated_at
        )
        VALUES (
          ${session.user.id}, ${agencyName}, ${agencyWebsite}, ${logoUrl}, ${primaryColor},
          ${whiteLabelLogo}, ${customDomain},
          ${smtpHost}, ${smtpPort}, ${smtpUser}, ${smtpFrom},
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE
        SET agency_name           = ${agencyName},
            agency_website        = ${agencyWebsite},
            logo_url              = ${logoUrl},
            primary_color         = ${primaryColor},
            white_label_logo_url  = ${whiteLabelLogo},
            custom_domain         = ${customDomain},
            smtp_host             = ${smtpHost},
            smtp_port             = ${smtpPort},
            smtp_user             = ${smtpUser},
            smtp_from_email       = ${smtpFrom},
            updated_at            = NOW()
      `;
    } else {
      // smtp_pass auch updaten (oder NULL setzen)
      await sql`
        INSERT INTO agency_settings (
          user_id, agency_name, agency_website, logo_url, primary_color,
          white_label_logo_url, custom_domain,
          smtp_host, smtp_port, smtp_user, smtp_from_email, smtp_pass_encrypted,
          updated_at
        )
        VALUES (
          ${session.user.id}, ${agencyName}, ${agencyWebsite}, ${logoUrl}, ${primaryColor},
          ${whiteLabelLogo}, ${customDomain},
          ${smtpHost}, ${smtpPort}, ${smtpUser}, ${smtpFrom}, ${smtpPassEncrypted},
          NOW()
        )
        ON CONFLICT (user_id) DO UPDATE
        SET agency_name           = ${agencyName},
            agency_website        = ${agencyWebsite},
            logo_url              = ${logoUrl},
            primary_color         = ${primaryColor},
            white_label_logo_url  = ${whiteLabelLogo},
            custom_domain         = ${customDomain},
            smtp_host             = ${smtpHost},
            smtp_port             = ${smtpPort},
            smtp_user             = ${smtpUser},
            smtp_from_email       = ${smtpFrom},
            smtp_pass_encrypted   = ${smtpPassEncrypted},
            updated_at            = NOW()
      `;
    }
  } catch (err) {
    // Häufigster Fehler: custom_domain UNIQUE-Verletzung
    const msg = err instanceof Error ? err.message : "";
    if (/custom_domain/i.test(msg) || /unique/i.test(msg)) {
      return NextResponse.json({ error: "Diese Custom-Domain ist bereits vergeben." }, { status: 409 });
    }
    console.error("[agency-settings] PUT failed:", err);
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
