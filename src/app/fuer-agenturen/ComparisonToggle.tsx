"use client";

/**
 * ComparisonToggle — Standard-Scanner vs. WebsiteFix Agency.
 *
 * Zwei-Tab-Switcher unter der Hero-Sektion auf /fuer-agenturen. Zweck: dem
 * Inhaber sichtbar machen, *was* Standard-Scanner (Wordfence, ManageWP, externe
 * SEO-Crawler) NICHT liefern — Status, Diagnose, Zeitaufwand, Branding.
 *
 * Render-Logik:
 *   - State `view` toggelt zwischen "external" und "websitefix".
 *   - Tabelle wechselt Werte + Icons (blasses ❌ / Warn vs. kräftiges ✅).
 *   - Pro Tab klar farbcodiert: rot/grau für Standard, lila/grün für WF.
 *
 * Stand-alone Client-Component, keine externen Stores. Wird in der Server-
 * Component /fuer-agenturen/page.tsx eingebettet.
 */

import { useState } from "react";
import { Check, X, AlertTriangle } from "lucide-react";

type View = "external" | "websitefix";

type Row = {
  /** Spalten-Label links */
  metric: string;
  /** Wert für Standard-Scanner */
  external: { label: string; tone: "negative" | "warning" };
  /** Wert für WebsiteFix Agency */
  websitefix: { label: string; tone: "positive" | "premium" };
};

const ROWS: Row[] = [
  {
    metric: "Scan-Tiefe",
    external:   { label: "Oberflächlich",                          tone: "negative" },
    websitefix: { label: "Deep-Audit · Röntgenblick",              tone: "premium"  },
  },
  {
    metric: "Diagnose",
    external:   { label: "Fehler gefunden — keine Lösung",         tone: "warning"  },
    websitefix: { label: "Smart-Fix-Drawer · Code-Snippet inkl.",  tone: "positive" },
  },
  {
    metric: "Zeitaufwand pro Issue",
    external:   { label: "Hoch · manuelle Senior-Suche",           tone: "negative" },
    websitefix: { label: "Minimal · 1-Klick-Delegation",           tone: "positive" },
  },
  {
    metric: "Branding gegenüber Endkunden",
    external:   { label: "Fremd-Logo & fremde Domain",             tone: "negative" },
    websitefix: { label: "100 % White-Label · Dein Logo",          tone: "premium"  },
  },
];

const T = {
  card:        "rgba(255,255,255,0.025)",
  border:      "rgba(255,255,255,0.08)",
  borderStr:   "rgba(255,255,255,0.14)",
  text:        "#fff",
  textSub:     "rgba(255,255,255,0.65)",
  textMuted:   "rgba(255,255,255,0.42)",
  textFaint:   "rgba(255,255,255,0.28)",
  red:         "#F87171",
  redBg:       "rgba(248,113,113,0.08)",
  redBorder:   "rgba(248,113,113,0.30)",
  amber:       "#FBBF24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberBorder: "rgba(251,191,36,0.30)",
  green:       "#22C55E",
  greenBg:     "rgba(34,197,94,0.10)",
  greenBorder: "rgba(34,197,94,0.32)",
  scale:       "#A78BFA",
  scaleBg:     "rgba(167,139,250,0.10)",
  scaleBorder: "rgba(167,139,250,0.32)",
} as const;

function ToneIcon({ tone }: { tone: Row["external"]["tone"] | Row["websitefix"]["tone"] }) {
  if (tone === "positive" || tone === "premium") {
    return (
      <span aria-hidden="true" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: 999,
        background: tone === "premium" ? T.scaleBg : T.greenBg,
        border: `1px solid ${tone === "premium" ? T.scaleBorder : T.greenBorder}`,
        color: tone === "premium" ? T.scale : T.green,
        flexShrink: 0,
      }}>
        <Check size={13} strokeWidth={3} />
      </span>
    );
  }
  if (tone === "warning") {
    return (
      <span aria-hidden="true" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: 999,
        background: T.amberBg, border: `1px solid ${T.amberBorder}`, color: T.amber,
        flexShrink: 0,
      }}>
        <AlertTriangle size={12} strokeWidth={2.4} />
      </span>
    );
  }
  // negative
  return (
    <span aria-hidden="true" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 22, height: 22, borderRadius: 999,
      background: T.redBg, border: `1px solid ${T.redBorder}`, color: T.red,
      opacity: 0.78, flexShrink: 0,
    }}>
      <X size={13} strokeWidth={2.6} />
    </span>
  );
}

export default function ComparisonToggle() {
  const [view, setView] = useState<View>("external");
  const isWf = view === "websitefix";

  return (
    <section style={{ maxWidth: 980, margin: "0 auto", padding: "72px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 28, maxWidth: 720, marginInline: "auto" }}>
        <p style={{
          margin: "0 0 8px", fontSize: 11, fontWeight: 800,
          color: T.scale, letterSpacing: "0.10em", textTransform: "uppercase",
        }}>
          Direkter Vergleich
        </p>
        <h2 style={{
          margin: "0 0 14px",
          fontSize: "clamp(24px, 3.2vw, 38px)", fontWeight: 800,
          letterSpacing: "-0.025em", lineHeight: 1.18, color: T.text,
        }}>
          Standard-Scanner vs. WebsiteFix Agency
        </h2>
        <p style={{ margin: 0, fontSize: 14.5, color: T.textSub, lineHeight: 1.65 }}>
          Wordfence, ManageWP, externe SEO-Tools finden Probleme. Wir liefern den fertigen Fix —
          inklusive Code-Snippet, White-Label und Junior-Delegation.
        </p>
      </div>

      {/* ── Tab-Switcher ─────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Vergleich Standard-Scanner und WebsiteFix Agency"
        style={{
          display: "inline-flex",
          padding: 4, borderRadius: 12,
          background: "rgba(0,0,0,0.32)",
          border: `1px solid ${T.border}`,
          margin: "0 auto 22px",
          width: "100%", maxWidth: 460,
        }}
      >
        <button
          role="tab"
          aria-selected={!isWf}
          onClick={() => setView("external")}
          style={{
            flex: 1,
            padding: "10px 16px", borderRadius: 8,
            background: !isWf ? T.redBg : "transparent",
            border: `1px solid ${!isWf ? T.redBorder : "transparent"}`,
            color: !isWf ? T.red : T.textMuted,
            fontSize: 13, fontWeight: 800, fontFamily: "inherit",
            cursor: "pointer", transition: "all 0.18s ease",
          }}
        >
          Standard-Scanner
        </button>
        <button
          role="tab"
          aria-selected={isWf}
          onClick={() => setView("websitefix")}
          style={{
            flex: 1,
            padding: "10px 16px", borderRadius: 8,
            background: isWf ? "linear-gradient(90deg, rgba(167,139,250,0.20), rgba(34,197,94,0.18))" : "transparent",
            border: `1px solid ${isWf ? T.scaleBorder : "transparent"}`,
            color: isWf ? T.text : T.textMuted,
            fontSize: 13, fontWeight: 800, fontFamily: "inherit",
            cursor: "pointer", transition: "all 0.18s ease",
            boxShadow: isWf ? "0 4px 18px rgba(124,58,237,0.20)" : "none",
          }}
        >
          WebsiteFix Agency
        </button>
      </div>

      {/* ── Vergleichs-Tabelle ───────────────────────────────────────────── */}
      <div
        style={{
          background: T.card, border: `1px solid ${isWf ? T.scaleBorder : T.borderStr}`,
          borderRadius: 16, overflow: "hidden",
          transition: "border-color 0.25s ease",
          boxShadow: isWf
            ? "0 12px 50px rgba(124,58,237,0.16)"
            : "0 6px 24px rgba(0,0,0,0.30)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 22px",
          background: isWf
            ? "linear-gradient(90deg, rgba(167,139,250,0.10), rgba(34,197,94,0.06))"
            : "rgba(248,113,113,0.04)",
          borderBottom: `1px solid ${isWf ? T.scaleBorder : T.redBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span aria-hidden="true" style={{
              width: 10, height: 10, borderRadius: 999,
              background: isWf ? T.green : T.red,
              boxShadow: `0 0 10px ${isWf ? T.green : T.red}`,
            }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
              {isWf ? "WebsiteFix Agency · Profit-Center-Modus" : "Standard-Scanner · Notfall-Modus"}
            </span>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800,
            padding: "3px 10px", borderRadius: 999,
            background: isWf ? T.greenBg : T.redBg,
            border: `1px solid ${isWf ? T.greenBorder : T.redBorder}`,
            color: isWf ? T.green : T.red,
            letterSpacing: "0.10em", textTransform: "uppercase",
          }}>
            {isWf ? "Empfohlen" : "Marktstandard"}
          </span>
        </div>

        {/* Rows */}
        <div>
          {ROWS.map((row, i) => {
            const cell = isWf ? row.websitefix : row.external;
            const isLast = i === ROWS.length - 1;
            return (
              <div
                key={row.metric}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(140px, 1fr) minmax(0, 1.6fr)",
                  gap: 12,
                  padding: "16px 22px",
                  borderBottom: isLast ? "none" : `1px solid ${T.border}`,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {row.metric}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ToneIcon tone={cell.tone} />
                  <span style={{
                    fontSize: 14, fontWeight: 700,
                    color: cell.tone === "premium" ? T.scale
                         : cell.tone === "positive" ? T.green
                         : cell.tone === "warning"  ? T.amber
                         : T.textFaint,
                    letterSpacing: "-0.01em",
                  }}>
                    {cell.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p style={{
        margin: "16px auto 0", maxWidth: 600, textAlign: "center",
        fontSize: 12, color: T.textFaint, lineHeight: 1.6,
      }}>
        {isWf
          ? "Mit WebsiteFix bekommt jeder Befund eine fertige Lösung — kein manuelles Recherchieren mehr."
          : "Standard-Scanner liefern Listen. Sie verbringen Ihre Zeit mit Recherche statt mit Fixing."}
      </p>
    </section>
  );
}
