"use client";

/**
 * AgencyTabBar — Browser-Tab-Style Projekt-Switcher (Variante B, 09.05.2026).
 *
 * Zweite Reihe unter dem Sticky-Header der Kommandozentrale. Pro behält
 * Variante A (Pill+Caret in DashboardShell-TopBar); Agency bekommt zusätzlich
 * diese Tab-Bar als Power-User-Shortcut.
 *
 *   [ kunde-1.de ✓ ] [ kunde-2.de ] ... [ +X mehr ▼ ] [ + ]
 *
 * Visible-Tabs: erste 6 — wenn der aktive Tab außerhalb der ersten 6 wäre,
 * rückt er auf Position 0 (der 6. wandert ins Overflow-Dropdown). So
 * verschwindet das gerade ausgewählte Projekt nie aus der Sicht.
 *
 * Overflow-Dropdown hat ein Search-Input, damit auch 50-Slot-Agency-Pläne
 * skaliert bedienbar sind.
 *
 * Navigation: Link → /dashboard?project=<id>. page.tsx scopt den Variant-
 * Render auf diese URL.
 */

import { useMemo, useState } from "react";
import Link from "next/link";

const VISIBLE_LIMIT = 6;

const C = {
  text:         "rgba(255,255,255,0.92)",
  textSub:      "rgba(255,255,255,0.55)",
  textMuted:    "rgba(255,255,255,0.4)",
  border:       "rgba(255,255,255,0.08)",
  borderMid:    "rgba(255,255,255,0.12)",
  divider:      "rgba(255,255,255,0.06)",
  card:         "rgba(255,255,255,0.025)",
  accent:       "#a78bfa",
  accentBg:     "rgba(124,58,237,0.18)",
  accentBorder: "rgba(167,139,250,0.45)",
  accentSoft:   "rgba(167,139,250,0.10)",
} as const;

export type AgencyTab = {
  id: string;
  url: string;
  name: string | null;
  client_label: string | null;
};

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function tabLabel(t: AgencyTab): string {
  return t.client_label ?? t.name ?? getDomain(t.url);
}

export default function AgencyTabBar({
  tabs,
  activeProjectId,
}: {
  tabs: AgencyTab[];
  activeProjectId: string | null;
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { visible, overflow } = useMemo(() => {
    if (tabs.length === 0) return { visible: [] as AgencyTab[], overflow: [] as AgencyTab[] };
    const activeIdx = tabs.findIndex(t => t.id === activeProjectId);
    if (activeIdx > VISIBLE_LIMIT - 1) {
      const active = tabs[activeIdx];
      const rest = tabs.filter((_, i) => i !== activeIdx);
      return {
        visible: [active, ...rest.slice(0, VISIBLE_LIMIT - 1)],
        overflow: rest.slice(VISIBLE_LIMIT - 1),
      };
    }
    return {
      visible: tabs.slice(0, VISIBLE_LIMIT),
      overflow: tabs.slice(VISIBLE_LIMIT),
    };
  }, [tabs, activeProjectId]);

  const filteredOverflow = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return overflow;
    return overflow.filter(t =>
      tabLabel(t).toLowerCase().includes(q) ||
      t.url.toLowerCase().includes(q),
    );
  }, [overflow, search]);

  if (tabs.length === 0) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      flexWrap: "wrap",
    }}>
      {visible.map(tab => {
        const active = tab.id === activeProjectId;
        return (
          <Link
            key={tab.id}
            href={`/dashboard?project=${tab.id}`}
            title={tab.url}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 8,
              background: active ? C.accentBg : C.card,
              border: `1px solid ${active ? C.accentBorder : C.border}`,
              color: active ? C.accent : C.textSub,
              fontSize: 12, fontWeight: active ? 800 : 600,
              textDecoration: "none",
              letterSpacing: "-0.005em",
              maxWidth: 200,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
            }}
          >
            {active && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                style={{ flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {tabLabel(tab)}
            </span>
          </Link>
        );
      })}

      {overflow.length > 0 && (
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setOverflowOpen(o => !o)}
            aria-expanded={overflowOpen}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 11px", borderRadius: 8,
              background: C.card,
              border: `1px solid ${C.borderMid}`,
              color: C.textSub,
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            +{overflow.length} mehr
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{
                transform: overflowOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease",
              }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {overflowOpen && (
            <>
              <div
                onClick={() => setOverflowOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 30, background: "transparent" }}
                aria-hidden="true"
              />
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0,
                zIndex: 31,
                width: 300,
                background: "#15161c",
                border: `1px solid ${C.borderMid}`,
                borderRadius: 10,
                boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
                overflow: "hidden",
              }}>
                <div style={{ padding: 8, borderBottom: `1px solid ${C.divider}` }}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Site suchen…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 7,
                      color: C.text, fontSize: 12, fontFamily: "inherit",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {filteredOverflow.length === 0 ? (
                    <div style={{ padding: "20px 14px", fontSize: 11.5, color: C.textMuted, textAlign: "center" }}>
                      Keine Treffer.
                    </div>
                  ) : (
                    filteredOverflow.map((tab, i) => {
                      const active = tab.id === activeProjectId;
                      const isLast = i === filteredOverflow.length - 1;
                      return (
                        <Link
                          key={tab.id}
                          href={`/dashboard?project=${tab.id}`}
                          onClick={() => setOverflowOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "9px 14px",
                            color: active ? C.accent : C.text,
                            background: active ? C.accentSoft : "transparent",
                            fontSize: 12, fontWeight: active ? 700 : 500,
                            textDecoration: "none",
                            borderBottom: isLast ? "none" : `1px solid ${C.divider}`,
                          }}
                        >
                          <span style={{
                            flex: 1, minWidth: 0,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {tabLabel(tab)}
                          </span>
                          <span style={{
                            fontSize: 10, color: C.textMuted,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            maxWidth: 120,
                          }}>
                            {getDomain(tab.url)}
                          </span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* "+"-Tab — öffnet das Neuen-Kunden-Modal via CSS :target. Plain <a>
          mit Hash-Href ist konsistent mit dem bestehenden CTA in
          AgencyDashboard und vermeidet die Hash-Navigations-Edge-Cases,
          die Link in Next/App-Router gelegentlich verschluckt. */}
      <a
        href="#modal-new-client"
        title="Neuen Kunden anlegen"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(16,185,129,0.10)",
          border: "1px solid rgba(16,185,129,0.30)",
          color: "#10B981",
          textDecoration: "none",
          marginLeft: 4,
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </a>
    </div>
  );
}
