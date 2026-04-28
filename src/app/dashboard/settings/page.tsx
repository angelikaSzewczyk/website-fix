import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import SettingsClient from "./settings-client";
import FreeSettingsClient from "./free-settings-client";
import { hasBrandingAccess } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Einstellungen — WebsiteFix",
  robots: { index: false },
};

const SCAN_LIMIT = 3;

type BrandingSettings = {
  agency_name:    string;
  agency_website: string;
  logo_url:       string;
  primary_color:  string;
};

/** Safe-Defaults für Branding wenn Query fehlschlägt oder noch keine Settings
 *  hinterlegt sind. Verhindert Application Error bei frisch upgegradeten
 *  Pro-/Agency-Kunden, die noch nie /dashboard/settings#branding besucht haben. */
const BRANDING_DEFAULTS: BrandingSettings = {
  agency_name:    "",
  agency_website: "",
  logo_url:       "",
  primary_color:  "#8df3d3",
};

export default async function SettingsPage() {
  // Auth-Gate mit defensivem try/catch — sollte Auth-Service einmal hicksen
  // (Token-Decode-Fehler, JWT abgelaufen mid-request), nicht die ganze
  // Page-Komponente abstürzen lassen, sondern sauber zur Login-Seite leiten.
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error("[settings] auth() threw:", err);
    redirect("/login");
  }
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  const userId = session.user.id;

  // ── Pro+ / Agency: White-Label-Branding-Settings laden ────────────────────
  if (hasBrandingAccess(plan)) {
    let initial: BrandingSettings = { ...BRANDING_DEFAULTS };

    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`
        SELECT agency_name, agency_website, logo_url, primary_color
        FROM agency_settings
        WHERE user_id = ${userId}
        LIMIT 1
      ` as { agency_name: string | null; agency_website: string | null; logo_url: string | null; primary_color: string | null }[];

      // rows[0] kann undefined sein wenn der User noch keine Branding-Daten
      // hinterlegt hat. Optional Chaining fängt das ab — alle Felder fallen
      // auf BRANDING_DEFAULTS zurück.
      const row = rows[0];
      initial = {
        agency_name:    row?.agency_name    ?? BRANDING_DEFAULTS.agency_name,
        agency_website: row?.agency_website ?? BRANDING_DEFAULTS.agency_website,
        logo_url:       row?.logo_url       ?? BRANDING_DEFAULTS.logo_url,
        primary_color:  row?.primary_color  ?? BRANDING_DEFAULTS.primary_color,
      };
    } catch (err) {
      // Häufige Gründe: agency_settings-Tabelle fehlt (Migration ausstehend),
      // Column-Mismatch nach Schema-Update, kurzfristiger DB-Connection-Drop.
      // In allen Fällen: Page mit Defaults rendern statt 500-Error.
      console.error("[settings] agency_settings query failed:", err);
    }

    return <SettingsClient plan={plan} initial={initial} />;
  }

  // ── Starter / Free-Plan: einfache Settings-Seite ──────────────────────────
  let projectUrl   = "";
  let monthlyScans = 0;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [projectRows, countRow] = await Promise.all([
      sql`
        SELECT url FROM scans
        WHERE user_id = ${userId}
        ORDER BY created_at DESC LIMIT 1
      ` as unknown as Promise<{ url: string }[]>,
      sql`
        SELECT COUNT(*)::int AS cnt FROM scans
        WHERE user_id = ${userId}
          AND created_at >= date_trunc('month', NOW())
      ` as unknown as Promise<{ cnt: number }[]>,
    ]);
    projectUrl   = projectRows[0]?.url ?? "";
    monthlyScans = countRow[0]?.cnt ?? 0;
  } catch (err) {
    console.error("[settings] free-plan query failed:", err);
    // Defaults sind schon gesetzt — Page rendert mit leerem URL + 0 Scans
  }

  return (
    <FreeSettingsClient
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
      plan={plan}
      projectUrl={projectUrl}
      monthlyScans={monthlyScans}
      scanLimit={SCAN_LIMIT}
    />
  );
}
