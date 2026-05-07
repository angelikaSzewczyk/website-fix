"use client";

/**
 * SmartFixSection — die "Präzisions-Diagnose-Box" im IssueDetailDrawer.
 *
 * Zwei klar getrennte Render-Pfade:
 *
 *   1. pluginActive=false → "Vermutete Lösung":
 *      Allgemeiner Rat ("Wir sehen von außen, dass ein Fehler vorliegt,
 *      können aber ohne Plugin die exakte Zeile im Code nicht bestimmen.")
 *      + CTA-Button "Jetzt Plugin verbinden & Details freischalten".
 *
 *   2. pluginActive=true + deepData verfügbar → "Präzisions-Diagnose":
 *      Konkreter Code-Fix mit echten Werten (z.B. "Dein Memory-Limit ist
 *      128M, ändere Zeile 45 in der wp-config.php auf 256M"), inkl.
 *      One-Click-Copy für das Snippet. Für Agency-Plan zusätzlich ein
 *      "Delegieren →"-Button, der das Issue als Task an das Team-Mitglied
 *      übergibt.
 *
 * Heuristik welcher Code-Fix gerendert wird: derived aus
 * issue.fixKey + deepData. Erkenne ich keinen Match, fällt die Box auf
 * "Allgemeine Diagnose" zurück (zeigt Server-Fingerprint statt Code).
 *
 * Keine globalen Side-Effects: der Delegate-Button feuert auf
 * /api/integrations/export-task — derselbe Endpunkt, den auch der
 * Optimization-Plan-Modal verwendet.
 */

import { useState } from "react";
import Link from "next/link";
import type { DeepData } from "@/lib/plugin-status";

type Severity = "critical" | "warning";

type Props = {
  pluginActive:  boolean;
  deepData?:     DeepData | null;
  /** Plan-String (kanonisch oder Legacy) — entscheidet ob Delegate-Button sichtbar wird. */
  userPlan?:     string | null;
  /** Optional: aktuelles Top-Issue, für kontextuelle Code-Snippets. */
  topIssue?: {
    fixKey:   string | null;
    label:    string;
    severity: Severity;
  } | null;
  /** Optional: Page-URL für Delegate-Payload */
  pageUrl?:      string;
};

const C = {
  green:        "#22c55e",
  greenBg:      "rgba(34,197,94,0.10)",
  greenBorder:  "rgba(34,197,94,0.30)",
  amber:        "#fbbf24",
  amberBg:      "rgba(251,191,36,0.10)",
  amberBorder:  "rgba(251,191,36,0.30)",
  text:         "rgba(255,255,255,0.92)",
  textSub:      "rgba(255,255,255,0.62)",
  textMuted:    "rgba(255,255,255,0.42)",
  codeBg:       "rgba(0,0,0,0.40)",
  codeBorder:   "rgba(255,255,255,0.10)",
  agencyAccent: "#a78bfa",
} as const;

function isAgencyLike(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p === "agency" || p === "agency-pro" || p === "agency-starter";
}

/** Aus deepData + fixKey ein konkretes Code-Snippet generieren — best-effort.
 *  Kein Match → null, dann fällt die UI auf den generischen "Server-Snapshot"-Pfad zurück. */
function generatePrecisionSnippet(
  deep: DeepData,
  fixKey: string | null,
): { language: string; code: string; lineHint?: string; explainer: string } | null {
  const memLimit = deep.php?.memory_limit;
  const phpVer   = deep.php?.version;
  const wpDebug  = deep.wp?.debug;
  const slowQ    = deep.db?.slow_queries_24h;
  const errors24 = deep.logs?.php_errors_24h;

  // Memory-Limit ist die häufigste Root-Cause für "kritischen Fehler"
  // sowie für Plugin/Theme-Konflikte — daher zuerst.
  if (memLimit && /^(?:32|64|96|128)M$/i.test(memLimit)) {
    return {
      language: "php",
      lineHint: "wp-config.php · Zeile direkt vor /* That's all, stop editing! */",
      code: `define('WP_MEMORY_LIMIT', '256M');\ndefine('WP_MAX_MEMORY_LIMIT', '512M');`,
      explainer: `Dein Memory-Limit liegt bei ${memLimit} — bei aktiven Buildern wie Elementor zu wenig. Setze es auf 256M, das deckt 95 % aller WP-Sites ab.`,
    };
  }

  if (fixKey === "404" && wpDebug === false && (errors24 ?? 0) > 5) {
    return {
      language: "php",
      lineHint: "wp-config.php · Debug-Modus temporär aktivieren",
      code: `define('WP_DEBUG', true);\ndefine('WP_DEBUG_LOG', true);\ndefine('WP_DEBUG_DISPLAY', false);`,
      explainer: `In den letzten 24 h wurden ${errors24} PHP-Fehler geloggt. Aktiviere den Debug-Log und schau in wp-content/debug.log — die letzte Zeile zeigt das verursachende Plugin/Theme.`,
    };
  }

  if ((slowQ ?? 0) > 10) {
    return {
      language: "sql",
      lineHint: "MySQL-Konsole · Slow-Query-Log auswerten",
      code: `SELECT query_time, sql_text FROM mysql.slow_log\nORDER BY query_time DESC LIMIT 5;`,
      explainer: `Deine DB hat ${slowQ} langsame Queries in 24 h. Die Top-5 nach Laufzeit zeigen meistens fehlende Indizes oder unoptimierte Plugin-Abfragen.`,
    };
  }

  if (phpVer && /^7\.|^8\.0/.test(phpVer)) {
    return {
      language: "ini",
      lineHint: "Hosting-Panel · PHP-Version-Wechsel",
      code: `; Zielversion: PHP 8.2.x\nupload_max_filesize = 64M\npost_max_size       = 64M\nmemory_limit        = 256M`,
      explainer: `Du läufst auf PHP ${phpVer} — End-of-Life-Risiko. PHP 8.2 ist 30-50 % schneller und wird mindestens bis 2025 supportet.`,
    };
  }

  return null;
}

export default function SmartFixSection({ pluginActive, deepData, userPlan, topIssue, pageUrl }: Props) {
  const [copied,    setCopied]    = useState(false);
  const [delegating,setDelegating]= useState(false);
  const [delegated, setDelegated] = useState(false);
  const [delegateErr,setDelegateErr] = useState<string | null>(null);

  // ─── Locked-State (kein Plugin) ─────────────────────────────────────────
  if (!pluginActive) {
    return (
      <div
        data-testid="smart-fix-locked"
        style={{
          marginBottom: 14,
          padding: "14px 16px", borderRadius: 12,
          background: C.amberBg, border: `1px solid ${C.amberBorder}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span aria-hidden="true" style={{
            width: 22, height: 22, borderRadius: 6,
            background: "rgba(251,191,36,0.16)",
            border: `1px solid ${C.amberBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.amber}
                 strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.amber,
                         letterSpacing: "0.10em", textTransform: "uppercase" }}>
            Deep-Data Locked · Vermutete Lösung
          </span>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 12.5, color: C.textSub, lineHeight: 1.55 }}>
          Wir sehen von außen, dass ein Fehler vorliegt — können aber{" "}
          <strong style={{ color: C.text }}>ohne Plugin die exakte Zeile im Code nicht bestimmen</strong>.
          Die unten gezeigten Schritte sind die typische Lösung für diese Fehler-Klasse.
        </p>
        <Link
          href="/plugin"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 7,
            background: "linear-gradient(90deg,#16a34a,#22c55e)",
            color: "#fff", fontSize: 12, fontWeight: 800,
            textDecoration: "none",
            boxShadow: "0 3px 10px rgba(34,197,94,0.28)",
          }}
        >
          🔒 Jetzt Plugin verbinden &amp; Details freischalten
        </Link>
      </div>
    );
  }

  // ─── Deep-Scan-Mode mit deepData ────────────────────────────────────────
  const snippet = deepData ? generatePrecisionSnippet(deepData, topIssue?.fixKey ?? null) : null;
  const showAgencyDelegate = isAgencyLike(userPlan);

  async function handleCopy() {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore — manche Browser blockieren clipboard */ }
  }

  async function handleDelegate() {
    if (delegating || delegated) return;
    setDelegating(true);
    setDelegateErr(null);
    try {
      const r = await fetch("/api/integrations/export-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       `Smart-Fix: ${topIssue?.label ?? "Issue aus Drawer"}`,
          description: snippet
            ? `${snippet.explainer}\n\n${snippet.lineHint ?? ""}\n\n${snippet.code}`
            : (topIssue?.label ?? "Issue aus Drawer — siehe Dashboard"),
          priority:    topIssue?.severity === "critical" ? "red" : "yellow",
          url:         pageUrl ?? "",
          source:      "smart_fix_drawer",
        }),
      });
      const data = await r.json() as { ok?: boolean; error?: string };
      if (!r.ok || data.ok === false) {
        setDelegateErr(data.error ?? "Delegation fehlgeschlagen");
      } else {
        setDelegated(true);
      }
    } catch {
      setDelegateErr("Verbindungsfehler");
    } finally {
      setDelegating(false);
    }
  }

  return (
    <div
      data-testid="smart-fix-deep"
      style={{
        marginBottom: 14,
        padding: "14px 16px", borderRadius: 12,
        background: C.greenBg, border: `1px solid ${C.greenBorder}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span aria-hidden="true" style={{
          width: 22, height: 22, borderRadius: 6,
          background: "rgba(34,197,94,0.16)",
          border: `1px solid ${C.greenBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.green}
               strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.green,
                       letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Präzisions-Diagnose · Deep-Data aktiv
        </span>
      </div>

      {snippet ? (
        <>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.textSub, lineHeight: 1.55 }}>
            {snippet.explainer}
          </p>

          {snippet.lineHint && (
            <p style={{ margin: "0 0 6px", fontSize: 10.5, color: C.textMuted, fontFamily: "monospace" }}>
              {snippet.lineHint}
            </p>
          )}

          <pre style={{
            margin: 0, padding: "10px 12px",
            background: C.codeBg, border: `1px solid ${C.codeBorder}`,
            borderRadius: 8,
            fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            color: "#cbd5e1", lineHeight: 1.55,
            overflowX: "auto", whiteSpace: "pre",
          }}>
            <code>{snippet.code}</code>
          </pre>

          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              onClick={handleCopy}
              disabled={copied}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 7,
                background: copied ? "rgba(34,197,94,0.16)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${copied ? C.greenBorder : "rgba(255,255,255,0.12)"}`,
                color: copied ? C.green : C.textSub,
                fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                cursor: copied ? "default" : "pointer",
              }}
            >
              {copied ? "✓ Kopiert" : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                       strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Code kopieren
                </>
              )}
            </button>

            {showAgencyDelegate && (
              <button
                onClick={handleDelegate}
                disabled={delegating || delegated}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 7,
                  background: delegated ? "rgba(167,139,250,0.16)" : "rgba(167,139,250,0.06)",
                  border: `1px solid ${delegated ? "rgba(167,139,250,0.40)" : "rgba(167,139,250,0.24)"}`,
                  color: C.agencyAccent,
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                  cursor: (delegating || delegated) ? "default" : "pointer",
                }}
              >
                {delegated ? "✓ An Team delegiert" : delegating ? "Wird delegiert…" : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Delegieren →
                  </>
                )}
              </button>
            )}

            {delegateErr && (
              <span style={{ fontSize: 11, color: "#f87171", alignSelf: "center" }}>
                {delegateErr}
              </span>
            )}
          </div>
        </>
      ) : (
        // Fallback: Plugin verbunden, aber kein matchender Snippet → Server-Snapshot.
        <>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: C.textSub, lineHeight: 1.55 }}>
            Dein Server liefert aktuell sauber — wir sehen keinen akuten Anlass für einen Code-Fix.
            Falls das Issue trotzdem auftritt: prüfe die Plugin-/Theme-Liste auf Konflikte.
          </p>
          {deepData && (
            <pre style={{
              margin: 0, padding: "10px 12px",
              background: C.codeBg, border: `1px solid ${C.codeBorder}`,
              borderRadius: 8,
              fontSize: 11, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "#94a3b8", lineHeight: 1.55,
            }}>
              <code>{[
                deepData.php?.version       && `PHP ${deepData.php.version}`,
                deepData.php?.memory_limit  && `memory_limit ${deepData.php.memory_limit}`,
                deepData.wp?.version        && `WP ${deepData.wp.version}`,
                deepData.db?.engine && deepData.db?.version && `${deepData.db.engine} ${deepData.db.version}`,
                deepData.plugins_active != null && `${deepData.plugins_active} Plugins aktiv`,
              ].filter(Boolean).join(" · ") || "Server-Snapshot leer"}</code>
            </pre>
          )}
        </>
      )}
    </div>
  );
}
