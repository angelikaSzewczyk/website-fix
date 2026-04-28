import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import SettingsTabsClient from "./settings-tabs-client";
import FreeSettingsClient from "./free-settings-client";
import { hasBrandingAccess } from "@/lib/plans";
import { getIntegrationSettings, connectionStatus } from "@/lib/integrations";

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

const BRANDING_DEFAULTS: BrandingSettings = {
  agency_name:    "",
  agency_website: "",
  logo_url:       "",
  primary_color:  "#8df3d3",
};

export default async function SettingsPage() {
  // Auth-Gate mit defensivem try/catch — Auth-Service-Fehler darf die
  // Page nicht abstürzen lassen.
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error("[settings] auth() threw:", err);
    redirect("/login");
  }
  if (!session?.user) redirect("/login");

  const plan   = (session.user as { plan?: string }).plan ?? "starter";
  const userId = session.user.id;

  // ── Pro+ / Agency: Settings-Hub mit Tabs (Profil / Branding / Integrationen) ──
  if (hasBrandingAccess(plan)) {
    let branding: BrandingSettings = { ...BRANDING_DEFAULTS };

    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`
        SELECT agency_name, agency_website, logo_url, primary_color
        FROM agency_settings
        WHERE user_id = ${userId}
        LIMIT 1
      ` as { agency_name: string | null; agency_website: string | null; logo_url: string | null; primary_color: string | null }[];

      const row = rows[0];
      branding = {
        agency_name:    row?.agency_name    ?? BRANDING_DEFAULTS.agency_name,
        agency_website: row?.agency_website ?? BRANDING_DEFAULTS.agency_website,
        logo_url:       row?.logo_url       ?? BRANDING_DEFAULTS.logo_url,
        primary_color:  row?.primary_color  ?? BRANDING_DEFAULTS.primary_color,
      };
    } catch (err) {
      console.error("[settings] agency_settings query failed:", err);
    }

    // Integrations-Settings vorab laden, damit Tab-Wechsel ohne weiteren
    // Roundtrip flutscht. Failure → null → IntegrationsTab zeigt leere
    // Form (User kann trotzdem konfigurieren, das Speichern füllt die DB).
    let integrationsSettings = null;
    let integrationsStatus   = null;
    try {
      const settings = await getIntegrationSettings(userId as string);
      integrationsSettings = settings ? {
        jira_domain:      settings.jira_domain,
        jira_email:       settings.jira_email,
        jira_project_key: settings.jira_project_key,
        trello_list_id:   settings.trello_list_id,
        gsc_site_url:     settings.gsc_site_url,
        ga_property_id:   settings.ga_property_id,
      } : null;
      integrationsStatus = settings ? connectionStatus(settings) : null;
    } catch (err) {
      console.error("[settings] integrations query failed:", err);
    }

    return (
      <SettingsTabsClient
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        plan={plan}
        branding={branding}
        integrationsStatus={integrationsStatus}
        integrationsSettings={integrationsSettings}
      />
    );
  }

  // ── Starter / Free-Plan: einfache Settings-Seite (kein Tabs-System) ──
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
