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
const FETCH_TIMEOUT_MS = 3000;

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

/** Race a promise against a timeout. Wenn die Quelle (DB, OAuth, externe API)
 *  länger als ms braucht, rejecten wir mit einem deterministischen Fehler —
 *  Promise.allSettled fängt das ab und der Hub rendert mit Default-Werten,
 *  statt zu blocken. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[settings] ${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

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
    type BrandingRow = {
      agency_name: string | null; agency_website: string | null;
      logo_url: string | null;    primary_color: string | null;
    };

    const sql = neon(process.env.DATABASE_URL!);

    // Beide Quellen parallel + jeweils mit 3-s-Timeout. Eine hakelige Quelle
    // (z. B. Neon-Rebalance, hängender OAuth-Refresh) blockiert nicht mehr
    // den gesamten Hub-Render — der jeweils andere Tab rendert trotzdem.
    const [brandingResult, integrationsResult] = await Promise.allSettled([
      withTimeout(
        sql`
          SELECT agency_name, agency_website, logo_url, primary_color
            FROM agency_settings
           WHERE user_id = ${userId}
           LIMIT 1
        ` as unknown as Promise<BrandingRow[]>,
        FETCH_TIMEOUT_MS,
        "agency_settings query",
      ),
      withTimeout(
        getIntegrationSettings(userId as string),
        FETCH_TIMEOUT_MS,
        "integration_settings query",
      ),
    ]);

    let branding: BrandingSettings = { ...BRANDING_DEFAULTS };
    if (brandingResult.status === "fulfilled") {
      const row = brandingResult.value[0];
      branding = {
        agency_name:    row?.agency_name    ?? BRANDING_DEFAULTS.agency_name,
        agency_website: row?.agency_website ?? BRANDING_DEFAULTS.agency_website,
        logo_url:       row?.logo_url       ?? BRANDING_DEFAULTS.logo_url,
        primary_color:  row?.primary_color  ?? BRANDING_DEFAULTS.primary_color,
      };
    } else {
      console.error("[settings] agency_settings failed:", brandingResult.reason);
    }

    // Failure → null → IntegrationsTab zeigt leere Form mit "Status unbekannt".
    // Der User kann trotzdem konfigurieren; das Speichern füllt die DB.
    let integrationsSettings = null;
    let integrationsStatus   = null;
    if (integrationsResult.status === "fulfilled") {
      const settings = integrationsResult.value;
      integrationsSettings = settings ? {
        jira_domain:      settings.jira_domain,
        jira_email:       settings.jira_email,
        jira_project_key: settings.jira_project_key,
        trello_list_id:   settings.trello_list_id,
        gsc_site_url:     settings.gsc_site_url,
        ga_property_id:   settings.ga_property_id,
      } : null;
      integrationsStatus = settings ? connectionStatus(settings) : null;
    } else {
      console.error("[settings] integrations failed:", integrationsResult.reason);
    }

    return (
      <SettingsTabsClient
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        plan={plan}
        userId={String(session.user.id)}
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
