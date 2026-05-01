/**
 * /dashboard/agency-branding — Identität & Technik.
 *
 * Eigenständige Page (kein Tab-Switcher mehr) — strikt getrennt von
 * /dashboard/settings (Account/Billing/Passwort). Inhalt:
 *   - Branding-Center (Logo, Color, Agency-Name, Eigene Subdomain, E-Mail-Absender)
 *   - SMTP-Konfiguration + Custom-Domain + WP-API-Key (AgencyConfigClient)
 *   - Externe Integrationen (Slack/Asana/Jira/Trello/GSC/GA)
 *
 * Agency-Plan-only — Free/Starter/Pro werden auf das Dashboard zurückgeleitet,
 * weil Branding ohne Plan-Cap keinen Sinn ergibt.
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import { isAgency, hasBrandingAccess } from "@/lib/plans";
import { getIntegrationSettings, connectionStatus } from "@/lib/integrations";
import AgencyBrandingPage from "./agency-branding-page";

export const metadata: Metadata = {
  title: "Agency-Branding — WebsiteFix",
  robots: { index: false },
};

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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[agency-branding] ${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  // Branding ist Pro+/Agency-Feature. Starter werden auf Dashboard
  // zurückgeleitet — sie können das Branding-UI gar nicht erreichen.
  if (!hasBrandingAccess(plan)) redirect("/dashboard");

  const userId = session.user.id;

  type BrandingRow = {
    agency_name: string | null; agency_website: string | null;
    logo_url: string | null;    primary_color: string | null;
  };

  const sql = neon(process.env.DATABASE_URL!);

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
    console.error("[agency-branding] agency_settings failed:", brandingResult.reason);
  }

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
    console.error("[agency-branding] integrations failed:", integrationsResult.reason);
  }

  return (
    <AgencyBrandingPage
      plan={plan}
      userId={String(session.user.id)}
      branding={branding}
      integrationsStatus={integrationsStatus}
      integrationsSettings={integrationsSettings}
      isAgencyPlan={isAgency(plan)}
    />
  );
}
