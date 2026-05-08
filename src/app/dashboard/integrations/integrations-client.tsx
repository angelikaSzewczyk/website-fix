"use client";

import { useState } from "react";
import { isAgency as isAgencyPlan } from "@/lib/plans";
import { SlackIcon, JiraIcon, TrelloIcon, AsanaIcon } from "@/app/components/BrandIcons";

// 08.05.2026: Dark-Theme passend zum restlichen Dashboard. Vorher Light-
// Theme — wirkte als heller Bruch im sonst dunklen Layout.
const C = {
  bg:          "#0b0c10",
  card:        "rgba(255,255,255,0.025)",
  border:      "rgba(255,255,255,0.08)",
  divider:     "rgba(255,255,255,0.06)",
  shadow:      "0 1px 4px rgba(0,0,0,0.4)",
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.55)",
  textMuted:   "rgba(255,255,255,0.40)",
  blue:        "#2563EB",
  blueBg:      "rgba(37,99,235,0.10)",
  blueBorder:  "rgba(37,99,235,0.32)",
  green:       "#22C55E",
  greenBg:     "rgba(34,197,94,0.10)",
  greenBorder: "rgba(34,197,94,0.32)",
  amber:       "#FBBF24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberBorder: "rgba(251,191,36,0.30)",
};

type Integration = {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  iconBg: string;
  status: "connected" | "available" | "soon";
  board?: string;
  /** Plan-Tier für Hybrid-Modell (08.05.2026):
   *   "pro"    = ab Professional zugänglich (Slack-Alerts laut Pricing-Card)
   *   "agency" = nur Agency Scale (Workflow-API: Jira/Trello/Asana/Zapier)
   *   "soon"   = noch nicht released, alle sehen Coming-Soon-Status
   */
  tier: "pro" | "agency" | "soon";
};

const INTEGRATIONS: Integration[] = [
  // ── Pro+ Tier (Pricing-Card "Slack- und E-Mail-Alerts bei kritischen Befunden") ──
  {
    id: "slack",
    name: "Slack",
    description: "Erhalte sofortige Benachrichtigungen bei kritischen Befunden direkt in deinem Kanal.",
    category: "Kommunikation",
    color: "#4A154B",
    iconBg: "#F4EBF4",
    status: "available",
    board: "#website-monitoring",
    tier: "pro",
  },
  // ── Agency-Only Tier (Pricing-Card "Workflow-API: Jira, Trello, Asana, Zapier — automatisch verbucht") ──
  {
    id: "jira",
    name: "Jira",
    description: "Erstelle automatisch Tickets für kritische Befunde im richtigen Backlog.",
    category: "Projektmanagement",
    color: "#0052CC",
    iconBg: "#E8F0FB",
    status: "available",
    board: "WebsiteFix-Backlog",
    tier: "agency",
  },
  {
    id: "trello",
    name: "Trello",
    description: "Befunde direkt als Karten in dein Trello-Board verschieben.",
    category: "Projektmanagement",
    color: "#0079BF",
    iconBg: "#E4F0F6",
    status: "available",
    board: "Web-Pflege",
    tier: "agency",
  },
  {
    id: "asana",
    name: "Asana",
    description: "Tasks und Projekte aus Scan-Befunden automatisch in Asana anlegen.",
    category: "Projektmanagement",
    color: "#F06A6A",
    iconBg: "#FEF0F0",
    status: "available",
    board: "Website-Tasks",
    tier: "agency",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Verbinde WebsiteFix mit 5.000+ Apps über deine eigenen Zaps.",
    category: "Automatisierung",
    color: "#FF4A00",
    iconBg: "#FFF0EB",
    status: "available",
    tier: "agency",
  },
  // ── Coming-Soon ──
  {
    id: "github",
    name: "GitHub Issues",
    description: "Issues direkt im Repository erstellen für technische Befunde.",
    category: "Entwicklung",
    color: "#24292E",
    iconBg: "#F3F4F6",
    status: "soon",
    tier: "soon",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Reports als Notion-Seiten exportieren und mit dem Team teilen.",
    category: "Dokumentation",
    color: "#000000",
    iconBg: "#F7F7F7",
    status: "soon",
    tier: "soon",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Tech-Issues direkt in Linear-Issues überführen.",
    category: "Entwicklung",
    color: "#5E6AD2",
    iconBg: "#EEEFFE",
    status: "soon",
    tier: "soon",
  },
];

// ─── Brand icons ──────────────────────────────────────────────────────────────
function IntegrationIcon({ id, color }: { id: string; color: string }) {
  // 08.05.2026: Markenechte SVGs aus components/BrandIcons (Slack-4-Farb,
  // Jira-Gradient, Trello-Card-Logo, Asana-3-Punkte). Vorher Single-Color-
  // Inline-SVGs — wirkten generisch.
  if (id === "slack")  return <SlackIcon  size={26} />;
  if (id === "jira")   return <JiraIcon   size={26} />;
  if (id === "trello") return <TrelloIcon size={26} />;
  if (id === "asana")  return <AsanaIcon  size={26} />;
  // Zapier hat noch keinen Brand-SVG in components/BrandIcons —
  // benutzen das offizielle "Z"-Funnel-Logo inline.
  if (id === "zapier") return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
      <path d="M16 1l5.196 9-5.196 9-5.196-9L16 1z" fill="#FF4F00"/>
      <path d="M16 13l5.196 9-5.196 9-5.196-9L16 13z" fill="#FF4F00"/>
      <path d="M1 16l9-5.196 9 5.196-9 5.196L1 16z" fill="#FF4F00"/>
      <path d="M13 16l9-5.196 9 5.196-9 5.196L13 16z" fill="#FF4F00"/>
    </svg>
  );
  // Coming-Soon (github/notion/linear)
  return (
    <span style={{ fontSize: 16, fontWeight: 800, color }}>{id.charAt(0).toUpperCase()}</span>
  );
}

function IntegrationCard({ integration, locked = false }: { integration: Integration; locked?: boolean }) {
  const [status, setStatus] = useState(integration.status);
  const isSoon = status === "soon";

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${locked ? "#E2E8F0" : C.border}`,
      borderRadius: 14,
      boxShadow: C.shadow,
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      opacity: isSoon || locked ? 0.7 : 1,
      position: "relative",
    }}>
      {/* Lock-Pill für Agency-Tier wenn nicht-Agency-User die Card sieht */}
      {locked && (
        <div style={{
          position: "absolute", top: 10, right: 10,
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 5,
          background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)",
          fontSize: 10, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.04em",
        }}>
          🔒 AGENCY
        </div>
      )}

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Icon box */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: integration.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <IntegrationIcon id={integration.id} color={integration.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{integration.name}</span>
            {isSoon && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                background: C.amberBg, color: C.amber, border: `1px solid ${C.amberBorder}`,
                letterSpacing: "0.06em",
              }}>BALD</span>
            )}
            {!isSoon && !locked && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}`,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
                Verfügbar
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{integration.category}</p>
        </div>
      </div>

      {/* Description */}
      <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>
        {integration.description}
      </p>

      {/* Board tag */}
      {integration.board && !isSoon && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: C.textMuted }}>Board / Kanal:</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
            background: C.divider, color: C.textSub,
          }}>
            {integration.board}
          </span>
        </div>
      )}

      {/* Action button */}
      <div style={{ marginTop: "auto" }}>
        {locked ? (
          <a
            href="/fuer-agenturen?upgrade=agency#pricing"
            style={{
              display: "block", width: "100%", textAlign: "center",
              padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "1px solid rgba(167,139,250,0.35)",
              background: "rgba(167,139,250,0.10)",
              color: "#a78bfa",
              textDecoration: "none",
            }}
          >
            Auf Agency Scale upgraden →
          </a>
        ) : isSoon ? (
          <button disabled style={{
            width: "100%", padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: `1px solid ${C.border}`, background: C.divider, color: C.textMuted,
            cursor: "not-allowed",
          }}>
            Demnächst verfügbar
          </button>
        ) : (
          <button
            onClick={() => setStatus(s => s === "connected" ? "available" : "connected")}
            style={{
              width: "100%", padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: `1px solid ${status === "connected" ? C.border : C.blueBorder}`,
              background: status === "connected" ? C.divider : C.blueBg,
              color: status === "connected" ? C.textSub : C.blue,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {status === "connected" ? "Trennen" : "✓ Verbunden"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsClient({ plan, pluginActive = false }: { plan: string | null; pluginActive?: boolean }) {
  // Plan-Tier-Sektionierung (Hybrid-Modell, 08.05.2026):
  //   Pro+    sieht Slack-Card freigeschaltet (Pricing-Card "Slack-Alerts")
  //   Pro     sieht Workflow-API-Cards mit Lock-Wrapper (Pricing-Card "Agency-only")
  //   Agency  sieht Workflow-API-Cards freigeschaltet
  const isAgency  = isAgencyPlan(plan);
  const proCards     = INTEGRATIONS.filter(i => i.tier === "pro");
  const agencyCards  = INTEGRATIONS.filter(i => i.tier === "agency");
  const soonCards    = INTEGRATIONS.filter(i => i.tier === "soon");

  return (
    <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: C.text, letterSpacing: "-0.02em" }}>
          Integrationen
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
          Verbinde WebsiteFix mit deinen Lieblingstools — Alerts, Tickets und Automatisierungen.
        </p>
      </div>

      {/* Plan-Tier-Hint Banner */}
      {/* Plan-Banner — Dark-Variante, ausreichender Kontrast (08.05.2026
           Bug: vorheriges Light-Lila auf Dark-Page → Text unlesbar) */}
      <div style={{
        marginBottom: 32, padding: "14px 18px", borderRadius: 11,
        background: isAgency ? "rgba(167,139,250,0.10)" : "rgba(37,99,235,0.10)",
        border: `1px solid ${isAgency ? "rgba(167,139,250,0.32)" : C.blueBorder}`,
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <span style={{
          flexShrink: 0, padding: "3px 10px", borderRadius: 6,
          fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
          background: isAgency ? "#7C3AED" : C.blue, color: "#fff",
        }}>
          {isAgency ? "AGENCY SCALE" : "PROFESSIONAL"}
        </span>
        <p style={{ margin: 0, fontSize: 13, color: C.text, flex: 1, lineHeight: 1.55 }}>
          {isAgency
            ? <>Du hast vollen Zugriff auf alle Integrationen inkl. Workflow-API (Jira, Trello, Asana, Zapier).</>
            : <>Slack- und E-Mail-Alerts sind in deinem Plan inklusive. Die volle Workflow-API (Jira, Trello, Asana, Zapier — automatisch verbucht) ist Teil von Agency Scale.</>}
        </p>
      </div>

      {/* ── Plugin Download Card — nur wenn Plugin NICHT aktiv ───────────────
           User hat Plugin schon installiert+verbunden → "herunterladen"-CTA
           ist redundant. Ersetzt durch grüne "Plugin verbunden"-Bestätigung
           weiter unten. (08.05.2026 User-Direktive) */}
      {!pluginActive && (
      <div style={{
        background: C.card,
        border: `1.5px solid ${C.greenBorder}`,
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(22,163,74,0.10)",
        padding: "28px 32px",
        marginBottom: 36,
        display: "flex",
        alignItems: "flex-start",
        gap: 24,
        flexWrap: "wrap",
      }}>
        {/* Plugin icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
          background: C.greenBg,
          border: `1.5px solid ${C.greenBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 220 }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
              WebsiteFix Connector-Plugin
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
              background: "rgba(34,197,94,0.10)", color: "#86EFAC", border: "1px solid rgba(34,197,94,0.32)",
              letterSpacing: "0.05em",
            }}>v0.9.1 Beta</span>
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
              background: C.greenBg, color: C.green, border: `1.5px solid ${C.greenBorder}`,
              letterSpacing: "0.07em", display: "flex", alignItems: "center", gap: 5,
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              READ-ONLY SCHUTZ AKTIV
            </span>
          </div>

          <p style={{ margin: "0 0 14px", fontSize: 13.5, color: C.textSub, lineHeight: 1.65, maxWidth: 540 }}>
            Das Plugin verbindet deine Seite sicher mit unserem Dashboard. Korrekturen
            (wie Alt-Texte) werden erst nach deiner Freigabe synchronisiert.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              "WordPress 5.0+",
              "Keine Schreibrechte ohne Freigabe",
              "AES-256 verschlüsselt",
              "DSGVO-konform",
            ].map(pill => (
              <span key={pill} style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                background: C.divider, color: C.textSub,
              }}>{pill}</span>
            ))}
          </div>
        </div>

        {/* Download section */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10,
          flexShrink: 0, minWidth: 160,
        }}>
          <a
            href="/plugin"
            style={{
              display: "inline-block",
              padding: "11px 24px",
              borderRadius: 10,
              fontSize: 13.5, fontWeight: 700,
              background: C.green, color: "#fff",
              textDecoration: "none",
              boxShadow: "0 3px 10px rgba(22,163,74,0.30)",
              whiteSpace: "nowrap",
            }}
          >
            Plugin herunterladen →
          </a>
          <span style={{ fontSize: 11, color: C.textMuted }}>
            ZIP · ~18 KB · inkl. Anleitung
          </span>
        </div>
      </div>
      )}

      {/* Plugin-Verbunden-Status — wenn aktiv (08.05.2026) */}
      {pluginActive && (
        <div style={{
          marginBottom: 36, padding: "18px 22px", borderRadius: 14,
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.32)",
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <div style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: 10,
            background: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: "#86EFAC" }}>
              WebsiteFix Connector-Plugin · Aktiv
            </p>
            <p style={{ margin: 0, fontSize: 12.5, color: C.textSub, lineHeight: 1.5 }}>
              Dein Plugin sendet Read-Only-Daten an WebsiteFix. Deep-Scan-Diagnose ist freigeschaltet.
            </p>
          </div>
        </div>
      )}

      {/* Pro+ Sektion: Alerts */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Alerts &amp; Benachrichtigungen <span style={{ color: C.blue, marginLeft: 6 }}>· Pro+</span>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {proCards.map(integration => (
            <IntegrationCard key={integration.id} integration={integration} locked={false} />
          ))}
        </div>
      </div>

      {/* Agency-Only Sektion: Workflow-API */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Workflow-API <span style={{ color: "#7C3AED", marginLeft: 6 }}>· Agency Scale</span>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {agencyCards.map(integration => (
            <IntegrationCard key={integration.id} integration={integration} locked={!isAgency} />
          ))}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Demnächst
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {soonCards.map(integration => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>

      {/* Request banner */}
      <div style={{
        marginTop: 40,
        background: C.blueBg,
        border: `1px solid ${C.blueBorder}`,
        borderRadius: 14,
        padding: "20px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: C.text }}>
            Integration nicht dabei?
          </p>
          <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>
            Schreib uns — wir bauen neue Integrationen innerhalb von 2 Wochen.
          </p>
        </div>
        <a href="mailto:support@website-fix.com" style={{
          padding: "9px 20px", borderRadius: 9, textDecoration: "none",
          fontSize: 13, fontWeight: 700,
          background: C.blue, color: "#fff",
          boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
          flexShrink: 0,
        }}>
          Integration anfragen →
        </a>
      </div>
    </main>
  );
}
