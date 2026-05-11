import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/**
 * GET /api/plugin-lead/confirm?token=<uuid>
 *
 * Double-Opt-In-Bestätigung für die Newsletter-Anmeldung aus /plugin-report.
 * Setzt confirmed_at NOW() für den Eintrag mit dem matchenden token und
 * löscht das Token nach erfolgreicher Bestätigung (one-shot).
 *
 * Antwortet IMMER mit Redirect zu /plugin-report/bestaetigt, damit der User
 * eine deutsch-sprachige Success/Error-Page bekommt. Status-Code 302 ist
 * absichtlich gewählt — der Browser hängt damit nicht am API-Endpoint, sondern
 * landet auf einer indexbar-noindex-Page mit klarer Erklärung.
 */
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://website-fix.com";
  const token   = req.nextUrl.searchParams.get("token") ?? "";

  // Format-Check vorm DB-Hit: UUID-Längen-Schutz gegen SQL-Pattern-Spam.
  if (!token || token.length < 32 || token.length > 64) {
    return NextResponse.redirect(`${baseUrl}/plugin-report/bestaetigt?error=invalid`);
  }

  const sql = neon(process.env.DATABASE_URL!);
  try {
    const updated = await sql`
      UPDATE plugin_leads
      SET confirmed_at = NOW(),
          confirmation_token = NULL
      WHERE confirmation_token = ${token}
        AND newsletter_opt_in = TRUE
        AND confirmed_at IS NULL
      RETURNING id, email
    ` as Array<{ id: number; email: string }>;

    if (updated.length === 0) {
      // Mögliche Ursachen: Token bereits verbraucht, expired (in dieser MVP-
      // Version: kein TTL), oder ungültig. Wir geben aus DSGVO-Gründen KEINE
      // Email-Adresse zurück — nur generisches Status-Code.
      return NextResponse.redirect(`${baseUrl}/plugin-report/bestaetigt?error=invalid`);
    }

    return NextResponse.redirect(`${baseUrl}/plugin-report/bestaetigt?ok=1`);
  } catch (err) {
    console.error("[plugin-lead/confirm] db update failed:", err);
    return NextResponse.redirect(`${baseUrl}/plugin-report/bestaetigt?error=server`);
  }
}
