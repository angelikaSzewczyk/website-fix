/**
 * XrayCompareCard — "Röntgen"-Vergleichsgrafik für die Hybrid-Scan-UX.
 *
 * Zeigt zwei Bars nebeneinander:
 *   1. Geprüfte Parameter von außen: 12  (Basis-Scan, immer)
 *   2. Geprüfte Parameter mit Plugin: 85 (real wenn deepData.parameters_checked
 *      gesetzt ist, sonst statisch — der Plugin-Wert ist die *Versprechung*,
 *      die der User nach Installation einlöst)
 *
 * Wenn pluginActive=false: zweite Bar ist gestrichelt + Lock-Icon, plus
 * subtiler CTA-Hint. Wenn pluginActive=true: zweite Bar wird ausgefüllt
 * dargestellt, Mode-Pill wechselt auf grün.
 *
 * Server-Component — keine Interaktion, kein useState.
 */

import Link from "next/link";
import { EXTERNAL_PARAMETER_COUNT, PLUGIN_PARAMETER_COUNT } from "@/lib/plugin-status";
import type { DeepData } from "@/lib/plugin-status";

type Props = {
  pluginActive: boolean;
  deepData?:    DeepData | null;
  href?:        string;
};

export default function XrayCompareCard({ pluginActive, deepData, href = "/plugin" }: Props) {
  const externalCount = EXTERNAL_PARAMETER_COUNT;
  const pluginCount   = deepData?.parameters_checked ?? PLUGIN_PARAMETER_COUNT;
  const max           = Math.max(externalCount, pluginCount, 1);

  const externalPct = Math.max(8, Math.round((externalCount / max) * 100));
  const pluginPct   = Math.max(8, Math.round((pluginCount   / max) * 100));

  const accent       = pluginActive ? "#22c55e" : "#fbbf24";
  const accentBg     = pluginActive ? "rgba(34,197,94,0.10)"  : "rgba(251,191,36,0.10)";
  const accentBorder = pluginActive ? "rgba(34,197,94,0.30)"  : "rgba(251,191,36,0.30)";
  const lockColor    = "rgba(255,255,255,0.45)";

  return (
    <section
      data-testid="xray-compare"
      style={{
        marginBottom: 18,
        padding: "18px 22px", borderRadius: 14,
        background: "linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span aria-hidden="true" style={{
          width: 26, height: 26, borderRadius: 7,
          background: accentBg, border: `1px solid ${accentBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <line x1="12" y1="3" x2="12" y2="21"/>
            <line x1="3"  y1="12" x2="21" y2="12"/>
          </svg>
        </span>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>
          Röntgen-Analyse: Was wir sehen können
        </h3>
        <span style={{
          marginLeft: "auto",
          fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
          background: accentBg, color: accent, border: `1px solid ${accentBorder}`,
          letterSpacing: "0.10em", textTransform: "uppercase",
        }}>
          {pluginActive ? "DEEP-SCAN" : "BASIS-SCAN"}
        </span>
      </div>

      {/* Bar 1 — extern (immer aktiv) */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.78)" }}>
            Geprüfte Parameter von außen
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.92)", fontVariantNumeric: "tabular-nums" }}>
            {externalCount}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            width: `${externalPct}%`, height: "100%",
            background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
            transition: "width 0.4s ease",
          }} />
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.42)" }}>
          HTML-Crawl: Title, Meta, H1-H6, Alt-Texte, robots.txt, Sitemap, SSL, TTFB, …
        </p>
      </div>

      {/* Bar 2 — mit Plugin (gated) */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 700,
            color: pluginActive ? "rgba(255,255,255,0.78)" : lockColor,
          }}>
            {!pluginActive && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
            Geprüfte Parameter mit Plugin
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: pluginActive ? "#22c55e" : lockColor, fontVariantNumeric: "tabular-nums" }}>
            {pluginCount}
          </span>
        </div>
        <div style={{
          height: 8, borderRadius: 99, overflow: "hidden",
          background: "rgba(255,255,255,0.06)",
          border: pluginActive ? undefined : "1px dashed rgba(255,255,255,0.18)",
        }}>
          <div style={{
            width: `${pluginPct}%`, height: "100%",
            background: pluginActive
              ? "linear-gradient(90deg, #16a34a, #22c55e)"
              : "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 6px, rgba(255,255,255,0.04) 6px 12px)",
            transition: "width 0.4s ease",
          }} />
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.42)" }}>
          PHP-Logs · DB-Last · memory_limit · max_execution_time · slow_queries · Plugin-Konflikte · …
        </p>
      </div>

      {!pluginActive && (
        <div style={{
          marginTop: 14, paddingTop: 14, borderTop: "1px dashed rgba(255,255,255,0.10)",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", flex: 1, minWidth: 200 }}>
            Mit dem Plugin sehen wir <strong style={{ color: "rgba(255,255,255,0.85)" }}>{pluginCount - externalCount}× mehr Signale</strong> —
            nicht nur was kaputt ist, sondern <em>warum</em>.
          </p>
          <Link href={href} style={{
            padding: "7px 14px", borderRadius: 7,
            background: "linear-gradient(90deg,#16a34a,#22c55e)",
            color: "#fff", fontSize: 11.5, fontWeight: 800,
            textDecoration: "none", whiteSpace: "nowrap",
            boxShadow: "0 3px 10px rgba(34,197,94,0.28)",
          }}>
            Jetzt freischalten →
          </Link>
        </div>
      )}
    </section>
  );
}
