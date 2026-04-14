"use client";

import { useState } from "react";

const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  divider:     "#F1F5F9",
  shadow:      "0 1px 4px rgba(0,0,0,0.07)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenBorder: "#A7F3D0",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberBorder: "#FDE68A",
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
};

const INTEGRATIONS: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Erhalte sofortige Benachrichtigungen bei kritischen Befunden direkt in deinem Kanal.",
    category: "Kommunikation",
    color: "#4A154B",
    iconBg: "#F4EBF4",
    status: "connected",
    board: "#website-monitoring",
  },
  {
    id: "jira",
    name: "Jira",
    description: "Erstelle automatisch Tickets für kritische Befunde im richtigen Backlog.",
    category: "Projektmanagement",
    color: "#0052CC",
    iconBg: "#E8F0FB",
    status: "available",
    board: "WebsiteFix-Backlog",
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
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Verbinde WebsiteFix mit 5.000+ Apps über deine eigenen Zaps.",
    category: "Automatisierung",
    color: "#FF4A00",
    iconBg: "#FFF0EB",
    status: "soon",
  },
  {
    id: "github",
    name: "GitHub Issues",
    description: "Issues direkt im Repository erstellen für technische Befunde.",
    category: "Entwicklung",
    color: "#24292E",
    iconBg: "#F3F4F6",
    status: "soon",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Reports als Notion-Seiten exportieren und mit dem Team teilen.",
    category: "Dokumentation",
    color: "#000000",
    iconBg: "#F7F7F7",
    status: "soon",
  },
  {
    id: "linear",
    name: "Linear",
    description: "Tech-Issues direkt in Linear-Issues überführen.",
    category: "Entwicklung",
    color: "#5E6AD2",
    iconBg: "#EEEFFE",
    status: "soon",
  },
];

// ─── Brand icons ──────────────────────────────────────────────────────────────
function IntegrationIcon({ id, color }: { id: string; color: string }) {
  if (id === "slack") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  );
  if (id === "jira") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.001 1.001 0 0 0-1.021-1.005zM23.013 0H11.459a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.019 12.49V1.005A1.001 1.001 0 0 0 23.013 0z"/>
    </svg>
  );
  if (id === "trello") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.645-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-6c0 .794-.645 1.44-1.44 1.44H15c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.62z"/>
    </svg>
  );
  if (id === "asana") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm-3.5 14.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm7 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm-3.5-7a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>
    </svg>
  );
  if (id === "zapier") return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
      <path d="M14.924 12.001a12.954 12.954 0 0 1-.203 2.31H9.279a12.955 12.955 0 0 1 0-4.62h5.442c.136.752.203 1.528.203 2.31zm3.387 6.932a13.05 13.05 0 0 1-1.965 1.965l-3.846-3.846a7.734 7.734 0 0 0 1.965-1.965zm-13.622 0l3.846-3.846a7.734 7.734 0 0 0 1.965 1.965l-3.846 3.846a13.05 13.05 0 0 1-1.965-1.965zm0-13.866a13.05 13.05 0 0 1 1.965-1.965l3.846 3.846a7.734 7.734 0 0 0-1.965 1.965zm13.622 0l-3.846 3.846a7.734 7.734 0 0 0-1.965-1.965l3.846-3.846a13.05 13.05 0 0 1 1.965 1.965zM12 7.076a4.925 4.925 0 1 0 0 9.849 4.925 4.925 0 0 0 0-9.849z"/>
    </svg>
  );
  // Generic icon for github/notion/linear
  return (
    <span style={{ fontSize: 16, fontWeight: 800, color }}>{id.charAt(0).toUpperCase()}</span>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const [status, setStatus] = useState(integration.status);

  const isConnected = status === "connected" || status === "available";
  const isSoon      = status === "soon";

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      boxShadow: C.shadow,
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      opacity: isSoon ? 0.7 : 1,
    }}>
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
            {!isSoon && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                background: C.greenBg, color: C.green, border: `1px solid ${C.greenBorder}`,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />
                {status === "connected" ? "Verbunden" : "Aktiv"}
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
        {isSoon ? (
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

export default function IntegrationsPage() {
  const connected = INTEGRATIONS.filter(i => i.status !== "soon");
  const soon      = INTEGRATIONS.filter(i => i.status === "soon");

  return (
    <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: C.text, letterSpacing: "-0.02em" }}>
          Integrationen
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: C.textMuted }}>
          Verbinde WebsiteFix mit deinen Lieblingstools — Tickets, Benachrichtigungen und Automatisierungen.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px 24px",
        display: "flex", gap: 32, alignItems: "center",
        marginBottom: 32, flexWrap: "wrap",
        boxShadow: C.shadow,
      }}>
        {[
          { value: connected.length, label: "Aktive Integrationen", color: C.green, bg: C.greenBg },
          { value: soon.length,      label: "Demnächst",             color: C.amber, bg: C.amberBg },
          { value: "0",              label: "Fehler",                 color: C.textMuted, bg: C.divider },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 18, fontWeight: 800,
              background: s.bg, borderRadius: 8, padding: "4px 12px",
              color: s.color,
            }}>{s.value}</span>
            <span style={{ fontSize: 13, color: C.textSub }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Plugin Download Card ─────────────────────────────────────────── */}
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
              background: "#F0FFF4", color: "#15803D", border: "1px solid #86EFAC",
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

      {/* Active integrations */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Verbundene Tools
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {connected.map(integration => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Demnächst
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {soon.map(integration => (
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
