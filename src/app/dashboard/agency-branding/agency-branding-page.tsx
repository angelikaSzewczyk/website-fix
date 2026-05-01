"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import SettingsClient from "../settings/settings-client";
import IntegrationsSettingsClient from "../settings/integrations/integrations-client";
import AgencyConfigClient from "../settings/agency-config-client";

type BrandingSettings = {
  agency_name:    string;
  agency_website: string;
  logo_url:       string;
  primary_color:  string;
};

type Status = {
  slack: boolean; zapier: boolean; asana: boolean; jira: boolean; trello: boolean; gsc: boolean; ga: boolean;
};

type IntegrationsVisible = {
  jira_domain:      string | null;
  jira_email:       string | null;
  jira_project_key: string | null;
  trello_list_id:   string | null;
  gsc_site_url:     string | null;
  ga_property_id:   string | null;
};

const PROVIDER_IDS = ["slack", "zapier", "asana", "jira", "trello", "gsc", "ga"] as const;
type ProviderId = (typeof PROVIDER_IDS)[number];
function validateProvider(raw: string | null): ProviderId | null {
  if (!raw) return null;
  return (PROVIDER_IDS as readonly string[]).includes(raw) ? (raw as ProviderId) : null;
}

const T = {
  text:      "rgba(255,255,255,0.92)",
  textSub:   "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.40)",
  border:    "rgba(255,255,255,0.08)",
  divider:   "rgba(255,255,255,0.06)",
  purple:    "#a78bfa",
};

type Props = {
  plan:                 string;
  userId:               string;
  branding:             BrandingSettings;
  integrationsStatus:   Status | null;
  integrationsSettings: IntegrationsVisible | null;
  isAgencyPlan:         boolean;
};

export default function AgencyBrandingPage({
  plan, userId, branding, integrationsStatus, integrationsSettings, isAgencyPlan,
}: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ?open=<provider> Deep-Link einmalig beim Mount auswerten — wie zuvor
  // im Settings-Tabs-Client. Wert wird in den lokalen State eingefroren,
  // damit das nachträgliche router.replace (Param strippen) das Akkordeon
  // nicht wieder schließt.
  const [initialOpen] = useState<ProviderId | null>(() => validateProvider(searchParams?.get("open") ?? null));

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!searchParams?.get("open")) return;
    router.replace(window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  return (
    <main style={{
      minHeight: "100vh", background: "#0b0c10", color: T.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "32px 32px 80px", maxWidth: 1280, margin: "0 auto",
    }}>

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: 28, paddingBottom: 18, borderBottom: `1px solid ${T.divider}`,
      }}>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Agency · Identität & Technik
        </p>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
          Agency-Branding
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: T.textSub, maxWidth: 720, lineHeight: 1.55 }}>
          Logo, Farbe, eigene Subdomain, SMTP-Versand, WordPress-API-Key und
          Workflow-Integrationen (Slack, Asana, Jira, Trello, GSC, GA). Alles
          was deine Kunden als deine Marke sehen — nicht als WebsiteFix.
        </p>
      </div>

      {/* ── Sektion 1: Branding-Center (Logo / Color / Agency-Name) ──────── */}
      <SettingsClient plan={plan} initial={branding} embedded />

      {/* ── Sektion 2: SMTP / Custom-Domain / WP-API-Key ─────────────────── */}
      <AgencyConfigClient agencyId={userId} plan={plan} />

      {/* ── Sektion 3: Externe Workflow-Integrationen ────────────────────── */}
      <div style={{ marginTop: 28, marginBottom: 14 }}>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Workflow
        </p>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
          Externe Integrationen
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: T.textSub, maxWidth: 600, lineHeight: 1.55 }}>
          Slack-Notifications, Asana-Tickets, Jira-Issues — verbinde WebsiteFix
          mit den Tools, die du eh schon nutzt.
        </p>
      </div>
      <IntegrationsSettingsClient
        plan={plan}
        hasAccess={isAgencyPlan}
        initialStatus={integrationsStatus}
        initialSettings={integrationsSettings}
        initialOpen={initialOpen}
        embedded
      />

    </main>
  );
}
