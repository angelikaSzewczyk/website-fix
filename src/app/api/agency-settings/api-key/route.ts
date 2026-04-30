/**
 * /api/agency-settings/api-key — generiert/rotiert den WP-Bridge-API-Key.
 *
 * Sprint 12: das WordPress-Plugin nutzt diesen Key für /api/wp-bridge.
 *
 * Sicherheits-Modell:
 *   1. Server generiert wfak_<32-byte-hex> via lib/crypto.generateApiKey().
 *   2. Encrypted-Wert (AES-256-GCM) wird in agency_settings.api_key_wp_encrypted
 *      gespeichert — er ist mit dem WF_SECRET_KEY entschlüsselbar, aber
 *      die DB allein gibt nichts preis.
 *   3. SHA-256-Hash wandert in agency_settings.api_key_wp_hash → das ist der
 *      schnelle Lookup-Index für den Bridge-Endpoint (constant-time).
 *   4. Klartext wird im Response-Body GENAU EINMAL zurückgegeben. Danach
 *      kann ihn niemand mehr abrufen — auch der User nicht. Für den
 *      Notfall: rotieren (DELETE) und neu generieren.
 *
 * POST   = Key (re)generieren — alter Key wird sofort ungültig.
 * DELETE = Key löschen ohne Ersatz (Plugin abschalten).
 */

import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { isAgency } from "@/lib/plans";
import { encrypt, generateApiKey, sha256Hex } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // WP-Bridge ist Agency-only. Bewusst strenger als hasBrandingAccess —
  // Pro-User können kein eigenes WordPress-Plugin haben (Plan-Restriction
  // + Cost-Control).
  const plan = (session.user as { plan?: string }).plan;
  if (!isAgency(plan)) {
    return NextResponse.json({ error: "WP-Bridge ist Agency-Plan-Feature." }, { status: 403 });
  }

  const apiKey = generateApiKey();
  let encrypted: string;
  try {
    encrypted = encrypt(apiKey);
  } catch (err) {
    console.error("[api-key] encrypt failed:", err);
    return NextResponse.json(
      { error: "Server-Konfigurationsfehler. WF_SECRET_KEY fehlt?" },
      { status: 500 },
    );
  }
  const hash = sha256Hex(apiKey);

  try {
    const sql = neon(process.env.DATABASE_URL!);
    // Upsert — wenn die Zeile fehlt (User ohne agency_settings), legen wir sie an.
    await sql`
      INSERT INTO agency_settings (
        user_id, api_key_wp_encrypted, api_key_wp_hash, api_key_wp_created_at, updated_at
      )
      VALUES (${session.user.id}, ${encrypted}, ${hash}, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE
      SET api_key_wp_encrypted   = ${encrypted},
          api_key_wp_hash        = ${hash},
          api_key_wp_created_at  = NOW(),
          updated_at             = NOW()
    `;
  } catch (err) {
    console.error("[api-key] DB write failed:", err);
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    api_key: apiKey,
    note: "Speichere diesen Key sicher — er wird nur EINMAL angezeigt. Verloren? Einfach neu generieren.",
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan;
  if (!isAgency(plan)) {
    return NextResponse.json({ error: "WP-Bridge ist Agency-Plan-Feature." }, { status: 403 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE agency_settings
      SET api_key_wp_encrypted   = NULL,
          api_key_wp_hash        = NULL,
          api_key_wp_created_at  = NULL,
          updated_at             = NOW()
      WHERE user_id = ${session.user.id}
    `;
  } catch (err) {
    console.error("[api-key] DELETE failed:", err);
    return NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
