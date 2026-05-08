"use client";

import SettingsClient from "../settings/settings-client";
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

const T = {
  text:      "rgba(255,255,255,0.92)",
  textSub:   "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.40)",
  border:    "rgba(255,255,255,0.08)",
  divider:   "rgba(255,255,255,0.06)",
  card:      "rgba(255,255,255,0.025)",
  purple:    "#a78bfa",
};

type Props = {
  plan:                 string;
  userId:               string;
  branding:             BrandingSettings;
  // Bleiben in den Props weil page.tsx sie noch lädt. Werden hier nicht mehr
  // verwendet (Externe-Integrationen-Sektion 08.05.2026 entfernt).
  integrationsStatus:   Status | null;
  integrationsSettings: IntegrationsVisible | null;
  isAgencyPlan:         boolean;
};

export default function AgencyBrandingPage({
  plan, userId, branding, integrationsStatus, integrationsSettings, isAgencyPlan,
}: Props) {
  void integrationsStatus; void integrationsSettings; // unused — Sektion entfernt

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

      {/* Externe-Integrationen-Sektion entfernt (08.05.2026): redundant mit
           der dedizierten /dashboard/integrations-Seite. User-Feedback:
           "auf der White Label und Branding Seite brauchen wir es nicht
           thematisieren". */}

      {/* ── Sektion 3: DSGVO & Compliance (Pricing-Card-Versprechen #9) ──── */}
      {isAgencyPlan && (
        <div style={{ marginTop: 36 }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              DSGVO &amp; Compliance
            </p>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
              AVV, Audit-Log &amp; Haftungs-Dokumentation
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: T.textSub, maxWidth: 600, lineHeight: 1.55 }}>
              Was du brauchst, um deine Kunden DSGVO-konform zu betreuen —
              und im Schadensfall nachweisen kannst, dass die Wartung ordentlich erfolgte.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}>
            {/* AVV-Template */}
            <a
              href="/dashboard/agency-branding/avv"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "20px 22px", borderRadius: 12,
                background: T.card, border: `1px solid ${T.border}`,
                textDecoration: "none", color: "inherit",
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                  AVV-Vorlage öffnen
                </span>
                <span style={{ marginLeft: "auto", fontSize: 9.5, fontWeight: 800, padding: "2px 7px",
                                borderRadius: 5, background: "rgba(167,139,250,0.18)",
                                border: "1px solid rgba(167,139,250,0.4)", color: T.purple,
                                letterSpacing: "0.04em" }}>
                  AGENCY
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>
                Auftragsverarbeitungs-Vertrag (Art. 28 DSGVO) als druckbare Vorlage —
                vorbefüllt mit deinem Agency-Namen. Per Browser-Print als PDF speichern,
                vom Kunden unterschreiben lassen, Kopie an support@website-fix.com schicken.
              </p>
              <span style={{ fontSize: 11.5, color: T.purple, fontWeight: 700, marginTop: 4 }}>
                Vorlage öffnen →
              </span>
            </a>

            {/* Audit-Log */}
            <a
              href="/dashboard/team#audit"
              style={{
                padding: "20px 22px", borderRadius: 12,
                background: T.card, border: `1px solid ${T.border}`,
                textDecoration: "none", color: "inherit",
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                  Audit-Log
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>
                Append-only Protokoll aller Team-Aktionen (Einladungen, Plan-Änderungen,
                Zugriffe). Nachweis-Pflicht im DSGVO-Audit oder bei Kunden-Anfragen
                nach Art. 30 DSGVO.
              </p>
              <span style={{ fontSize: 11.5, color: T.purple, fontWeight: 700, marginTop: 4 }}>
                Log ansehen →
              </span>
            </a>

            {/* Haftungs-Doku */}
            <div
              style={{
                padding: "20px 22px", borderRadius: 12,
                background: T.card, border: `1px solid ${T.border}`,
                display: "flex", flexDirection: "column", gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🛡️</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>
                  Haftungs-Doku
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>
                BFSG-2025 + Wartungsvertrags-Standard-Klauseln zum Einbau in deine
                Kunden-Verträge. Bei Bedarf an branchenspezifischer Doku
                (Praxis, Kanzlei, Online-Shop) schreib uns an
                <a href="mailto:support@website-fix.com?subject=Haftungs-Doku%20Anfrage" style={{ color: T.purple, fontWeight: 700, textDecoration: "none" }}> support@website-fix.com</a>.
              </p>
              <span style={{ fontSize: 10.5, color: T.textMuted, marginTop: 4, fontStyle: "italic" }}>
                Hinweis: Vor Verwendung von einem Anwalt prüfen lassen.
              </span>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
