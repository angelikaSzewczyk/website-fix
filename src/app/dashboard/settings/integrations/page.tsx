import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isAtLeastProfessional, normalizePlan } from "@/lib/plans";
import { getIntegrationSettings, connectionStatus } from "@/lib/integrations";
import IntegrationsSettingsClient from "./integrations-client";

export const metadata: Metadata = {
  title: "Integrationen — WebsiteFix",
  robots: { index: false },
};

export default async function IntegrationsSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (normalizePlan(plan) === null) redirect("/fuer-agenturen");

  // Starter sieht die Page als Locked-Upsell.
  const hasAccess = isAtLeastProfessional(plan);

  const settings = hasAccess ? await getIntegrationSettings(session.user.id as string) : null;
  const status   = settings ? connectionStatus(settings) : null;

  return (
    <IntegrationsSettingsClient
      plan={plan}
      hasAccess={hasAccess}
      initialStatus={status}
      initialSettings={settings ? {
        jira_domain:      settings.jira_domain,
        jira_email:       settings.jira_email,
        jira_project_key: settings.jira_project_key,
        trello_list_id:   settings.trello_list_id,
        gsc_site_url:     settings.gsc_site_url,
        ga_property_id:   settings.ga_property_id,
      } : null}
    />
  );
}
