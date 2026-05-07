"use client";

/**
 * FatalErrorAlert — pulsierende Warnbox + Support-Export.
 *
 * Wird ganz oben im IssueDetailDrawer gerendert, sobald deep_data.logs.last_fatal
 * vorhanden ist. Drei Aufgaben:
 *
 *   1. Sichtbarkeit: pulsierende rote Box, die nicht zu übersehen ist.
 *      Animation respektiert prefers-reduced-motion.
 *
 *   2. Lerneffekt: kurze Heuristik-Diagnose UNTER der Fehlermeldung —
 *      versucht aus den Plugin-Pfaden im Fatal-Stack einen Konflikt-Hinweis
 *      zu generieren ("Wahrscheinlich Konflikt zwischen Elementor und WooCommerce").
 *      Pure-Function, kein Anthropic-Call zur Laufzeit (würde den Drawer-
 *      Open-Pfad teuer machen).
 *
 *   3. Support-Export: zwei Plan-Varianten via Modal:
 *      - Solos (Starter/Pro): "Hilfe-Text für Hoster kopieren" — formuliert
 *        einen freundlichen Support-Mail-Text mit den relevanten Daten.
 *      - Agency: "Technischen Report exportieren" — zeigt zusätzlich JSON-
 *        Export + Delegate-Button (an Team via /api/integrations/export-task).
 *
 * Architekturentscheidung: kein eigenes Modal-Library-Dependency — wir nutzen
 * dieselbe Inline-Modal-Pattern, die der OptimizationPlanModal in IssueDetailDrawer
 * verwendet (fixed overlay + click-outside-to-close).
 */

import { useState } from "react";
import type { DeepData } from "@/lib/plugin-status";

type Props = {
  deepData?: DeepData | null;
  /** Plan-String — entscheidet ob Solo- oder Agency-Variante des Buttons. */
  userPlan?: string | null;
  /** Optional: Page-URL des aktuellen Drawer-Kontextes für den Support-Text. */
  pageUrl?:  string;
};

const C = {
  red:           "#F87171",
  redBg:         "rgba(248,113,113,0.10)",
  redBgStrong:   "rgba(248,113,113,0.16)",
  redBorder:     "rgba(248,113,113,0.40)",
  redGlow:       "rgba(248,113,113,0.40)",
  text:          "rgba(255,255,255,0.95)",
  textSub:       "rgba(255,255,255,0.65)",
  textMuted:     "rgba(255,255,255,0.42)",
  border:        "rgba(255,255,255,0.10)",
  card:          "rgba(255,255,255,0.025)",
  cardSolid:     "#0f1623",
  agencyAccent:  "#A78BFA",
  agencyBg:      "rgba(167,139,250,0.10)",
  agencyBorder:  "rgba(167,139,250,0.30)",
} as const;

function isAgencyLike(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p === "agency" || p === "agency-pro" || p === "agency-starter";
}

// ─── Heuristik: Plugin-Konflikt-Erkennung ─────────────────────────────────────
/**
 * Extrahiert Plugin/Theme-Slugs aus einem Fatal-Error-String und matcht sie
 * gegen die installed-plugins-Liste, um eine erste Konflikt-Vermutung zu
 * generieren. Pure-Function — keine API-Calls, deterministisch testbar.
 *
 * Beispiel-Input: "PHP Fatal error: Uncaught Error: Call to undefined function
 *   woocommerce_session_init() in /wp-content/plugins/elementor/foo.php:42"
 *
 * Output: { hint: "Wahrscheinlich Konflikt zwischen Elementor und WooCommerce",
 *           involvedPlugins: ["elementor", "woocommerce"] }
 */
export function analyzeFatalError(
  fatal: string,
  plugins: Array<{ slug: string; name: string; version: string }> = [],
): { hint: string; involvedPlugins: string[] } {
  const lower = fatal.toLowerCase();

  // 1. Plugin-Pfade aus Stack-Trace extrahieren (wp-content/plugins/<slug>/)
  const pathRegex = /wp-content\/(?:plugins|themes)\/([a-z0-9-]+)\//gi;
  const pathSlugs = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = pathRegex.exec(fatal)) !== null) {
    if (m[1]) pathSlugs.add(m[1].toLowerCase());
  }

  // 2. Plugin-Namen im Fatal-Text suchen (für Function-Calls wie "woocommerce_init")
  const nameSlugs = new Set<string>();
  for (const p of plugins) {
    const slug = p.slug.toLowerCase();
    if (lower.includes(slug.replace(/-/g, "_")) || lower.includes(slug)) {
      nameSlugs.add(slug);
    }
  }

  const involved = Array.from(new Set([...pathSlugs, ...nameSlugs]));

  // 3. Hint-Generation
  function pluginName(slug: string): string {
    const found = plugins.find(p => p.slug.toLowerCase() === slug);
    return found?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  }

  // Spezielle Error-Patterns (priorisiert vor Plugin-Match)
  if (/allowed memory size .* exhausted/i.test(fatal)) {
    return {
      hint: "Out-of-Memory — der PHP-Prozess hat das memory_limit gerissen. Häufig durch ein einzelnes hungriges Plugin (Image-Optimizer, Backup-Tool) oder eine schlecht-skalierende DB-Query.",
      involvedPlugins: involved,
    };
  }
  if (/maximum execution time .* exceeded/i.test(fatal)) {
    return {
      hint: "Timeout — eine Anfrage hat länger als max_execution_time gedauert. Häufige Ursachen: kaputte externe API (Cron-Job hängt), langsame DB-Query, große Bild-Verarbeitung.",
      involvedPlugins: involved,
    };
  }
  if (/cannot redeclare/i.test(fatal)) {
    const name = involved.length >= 2
      ? `${pluginName(involved[0])} und ${pluginName(involved[1])}`
      : involved[0] ? pluginName(involved[0]) : "zwei aktive Plugins";
    return {
      hint: `Doppel-Deklaration — ${name} definieren wahrscheinlich denselben Funktions-/Klassen-Namen. Klassisches Plugin-Konflikt-Symptom.`,
      involvedPlugins: involved,
    };
  }
  if (/class .* not found/i.test(fatal)) {
    return {
      hint: involved.length > 0
        ? `Fehlende Klasse — wahrscheinlich wurde ein Plugin (${pluginName(involved[0])}) deaktiviert, von dem ${involved[1] ? pluginName(involved[1]) : "ein anderes Plugin"} abhängt.`
        : "Fehlende Klasse — ein Plugin/Theme erwartet eine Library, die nicht (mehr) geladen wird. Häufig nach einem Plugin-Update.",
      involvedPlugins: involved,
    };
  }
  if (/call to undefined function/i.test(fatal)) {
    if (involved.length >= 2) {
      return {
        hint: `Wahrscheinlich Konflikt zwischen ${pluginName(involved[0])} und ${pluginName(involved[1])} — eines erwartet eine Funktion, die das andere nicht (mehr) bereitstellt.`,
        involvedPlugins: involved,
      };
    }
    if (involved.length === 1) {
      return {
        hint: `${pluginName(involved[0])} ruft eine undefined function — möglicherweise wurde eine WordPress-/PHP-Version vorausgesetzt, die nicht aktiv ist.`,
        involvedPlugins: involved,
      };
    }
    return {
      hint: "Undefined function — ein Plugin/Theme erwartet eine Funktion, die nicht existiert. Häufig nach PHP-Major-Update (z.B. 7.4 → 8.x).",
      involvedPlugins: involved,
    };
  }

  // Fallback: einfacher Konflikt-Hinweis bei 2+ involved Plugins
  if (involved.length >= 2) {
    return {
      hint: `Wahrscheinlich Konflikt zwischen ${pluginName(involved[0])} und ${pluginName(involved[1])}.`,
      involvedPlugins: involved,
    };
  }
  if (involved.length === 1) {
    return {
      hint: `Fehler tritt in ${pluginName(involved[0])} auf. Erste Maßnahme: Plugin-Version prüfen, ggf. ein Update zurückrollen.`,
      involvedPlugins: involved,
    };
  }
  return {
    hint: "Kein klares Plugin-Pattern erkennbar. Aktiviere WP_DEBUG_LOG und schau in wp-content/debug.log — die zweite Zeile zeigt meistens den Auslöser.",
    involvedPlugins: [],
  };
}

// ─── Support-Text-Generation ──────────────────────────────────────────────────
function buildSoloSupportText({
  fatal, phpVersion, wpVersion, plugins, pageUrl,
}: {
  fatal:       string;
  phpVersion?: string;
  wpVersion?:  string;
  plugins:     Array<{ slug: string; name: string; version: string }>;
  pageUrl?:    string;
}): string {
  const pluginLines = plugins.slice(0, 12).map(p => `  - ${p.name} (${p.version})`).join("\n");
  const more        = plugins.length > 12 ? `\n  - … und ${plugins.length - 12} weitere` : "";
  return `Hallo Support-Team,

auf meiner WordPress-Website tritt ein kritischer Fehler auf — bitte um Prüfung.

${pageUrl ? `Betroffene URL:\n  ${pageUrl}\n\n` : ""}Fehlermeldung:
${fatal.trim()}

System-Informationen:
  - PHP-Version: ${phpVersion ?? "nicht ermittelt"}
  - WordPress-Version: ${wpVersion ?? "nicht ermittelt"}

Aktive Plugins:
${pluginLines}${more}

Was ich bereits geprüft habe:
  - Site ist erreichbar (kein Hosting-Ausfall)
  - WP-Debug-Log ist aktiviert (siehe Fehlermeldung oben)

Vielen Dank für die Unterstützung!`;
}

function buildAgencyTextReport({
  fatal, phpVersion, wpVersion, plugins, pageUrl, hint, involvedPlugins,
}: {
  fatal:           string;
  phpVersion?:     string;
  wpVersion?:      string;
  plugins:         Array<{ slug: string; name: string; version: string }>;
  pageUrl?:        string;
  hint:            string;
  involvedPlugins: string[];
}): string {
  const involvedFmt = involvedPlugins.length
    ? involvedPlugins.map(s => {
        const p = plugins.find(pl => pl.slug.toLowerCase() === s);
        return p ? `${p.name} (${p.slug} v${p.version})` : s;
      }).join(", ")
    : "nicht eindeutig identifiziert";
  const pluginLines = plugins.slice(0, 20).map(p => `  ${p.slug.padEnd(28)} v${p.version}`).join("\n");
  const more        = plugins.length > 20 ? `\n  … +${plugins.length - 20} more` : "";
  return `[FATAL ERROR REPORT — WebsiteFix]
Generated: ${new Date().toISOString()}
${pageUrl ? `URL: ${pageUrl}\n` : ""}
─── ERROR ─────────────────────────────────────────────────────
${fatal.trim()}

─── HEURISTIC ─────────────────────────────────────────────────
${hint}
Involved: ${involvedFmt}

─── ENVIRONMENT ───────────────────────────────────────────────
PHP:        ${phpVersion ?? "n/a"}
WordPress:  ${wpVersion ?? "n/a"}
Plugins:    ${plugins.length} active

─── PLUGIN MANIFEST ───────────────────────────────────────────
${pluginLines}${more}

─── SUGGESTED FIRST STEPS ─────────────────────────────────────
1. Plugin-by-Plugin deactivation (start with: ${involvedPlugins[0] ?? "most-recently-updated"})
2. WP_DEBUG_LOG → wp-content/debug.log (if not already enabled)
3. Roll back last plugin/theme update if conflict pattern matches
4. Check PHP error_log for stack frames pre-fatal`;
}

function buildAgencyJson({
  fatal, phpVersion, wpVersion, plugins, pageUrl, hint, involvedPlugins,
}: Parameters<typeof buildAgencyTextReport>[0]): string {
  return JSON.stringify({
    generated_at:    new Date().toISOString(),
    url:             pageUrl ?? null,
    fatal_error:     fatal.trim(),
    heuristic: {
      hint,
      involved_plugins: involvedPlugins,
    },
    environment: {
      php_version: phpVersion ?? null,
      wp_version:  wpVersion ?? null,
    },
    plugins,
  }, null, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FatalErrorAlert({ deepData, userPlan, pageUrl }: Props) {
  const fatalRaw = deepData?.logs?.last_fatal;
  if (!fatalRaw) return null;
  const fatal: string = fatalRaw; // narrow für Closure-Capture in async-Handlern

  const phpVersion = deepData?.php?.version;
  const wpVersion  = deepData?.wp?.version;
  const plugins    = deepData?.plugins_list ?? [];

  const { hint, involvedPlugins } = analyzeFatalError(fatal, plugins);
  const isAgency = isAgencyLike(userPlan);

  const [modalOpen,   setModalOpen]   = useState(false);
  const [copied,      setCopied]      = useState<"text" | "json" | null>(null);
  const [delegating,  setDelegating]  = useState(false);
  const [delegated,   setDelegated]   = useState(false);
  const [delegateErr, setDelegateErr] = useState<string | null>(null);

  const supportText = isAgency
    ? buildAgencyTextReport({ fatal, phpVersion, wpVersion, plugins, pageUrl, hint, involvedPlugins })
    : buildSoloSupportText({ fatal, phpVersion, wpVersion, plugins, pageUrl });
  const supportJson = isAgency
    ? buildAgencyJson({ fatal, phpVersion, wpVersion, plugins, pageUrl, hint, involvedPlugins })
    : "";

  async function handleCopy(content: string, type: "text" | "json") {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Browser blockt clipboard — User muss manuell selektieren
    }
  }

  async function handleDelegate() {
    if (delegating || delegated) return;
    setDelegating(true);
    setDelegateErr(null);
    try {
      const r = await fetch("/api/integrations/export-task", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:       `Fatal Error: ${fatal.slice(0, 80)}${fatal.length > 80 ? "…" : ""}`,
          description: supportText,
          priority:    "red",
          url:         pageUrl ?? "",
          source:      "fatal_error_alert",
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

  const ctaLabel = isAgency ? "Technischen Report exportieren" : "Hilfe-Text für Hoster kopieren";

  return (
    <>
      <style>{`
        @keyframes wf-fatal-pulse {
          0%, 100% { box-shadow: 0 0 0 0 ${C.redGlow}; }
          50%      { box-shadow: 0 0 22px 4px ${C.redGlow}; }
        }
        .wf-fatal-alert {
          animation: wf-fatal-pulse 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .wf-fatal-alert { animation: none !important; }
        }
      `}</style>

      <div
        data-testid="fatal-error-alert"
        className="wf-fatal-alert"
        style={{
          marginBottom: 14,
          padding: "14px 16px", borderRadius: 12,
          background: `linear-gradient(135deg, ${C.redBgStrong}, ${C.redBg})`,
          border: `1px solid ${C.redBorder}`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span aria-hidden="true" style={{
            width: 28, height: 28, borderRadius: 8,
            background: C.redBg,
            border: `1px solid ${C.redBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.red, fontSize: 14, flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.red,
                          letterSpacing: "0.10em", textTransform: "uppercase" }}>
              Kritischer Fehler erkannt
            </div>
            <div style={{ fontSize: 12, color: C.textMuted }}>
              Aus deinem PHP-Error-Log · letzter Eintrag
            </div>
          </div>
        </div>

        {/* Fehlermeldung */}
        <pre style={{
          margin: "0 0 10px", padding: "10px 12px",
          background: "rgba(0,0,0,0.40)",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          fontSize: 11.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: "#fca5a5", lineHeight: 1.55,
          overflowX: "auto", whiteSpace: "pre-wrap",
          maxHeight: 120, overflowY: "auto",
        }}>
          <code>{fatal.length > 800 ? fatal.slice(0, 800) + "…" : fatal}</code>
        </pre>

        {/* KI-Heuristik (Lerneffekt) */}
        <div style={{
          padding: "10px 12px", borderRadius: 8, marginBottom: 12,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted,
                        letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 4 }}>
            🧠 Erste Vermutung
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: C.textSub, lineHeight: 1.55 }}>
            {hint}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => setModalOpen(true)}
          style={{
            width: "100%",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "10px 18px", borderRadius: 9,
            background: isAgency
              ? `linear-gradient(90deg, ${C.agencyAccent}, #C4B5FD)`
              : "linear-gradient(90deg,#dc2626,#f87171)",
            color: "#fff", fontSize: 13, fontWeight: 800,
            border: "none", cursor: "pointer", fontFamily: "inherit",
            boxShadow: isAgency
              ? "0 4px 16px rgba(167,139,250,0.32)"
              : "0 4px 16px rgba(248,113,113,0.32)",
          }}
        >
          {isAgency ? "📋" : "📄"} {ctaLabel}
        </button>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1100,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 640, width: "100%", maxHeight: "90vh", overflow: "auto",
              borderRadius: 14, background: C.cardSolid,
              border: `1px solid ${isAgency ? C.agencyBorder : C.redBorder}`,
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
            }}
          >
            {/* Modal-Header */}
            <div style={{
              padding: "18px 22px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              background: isAgency
                ? `linear-gradient(135deg, ${C.agencyBg}, transparent)`
                : `linear-gradient(135deg, ${C.redBg}, transparent)`,
            }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 800,
                            color: isAgency ? C.agencyAccent : C.red,
                            letterSpacing: "0.10em", textTransform: "uppercase" }}>
                  {isAgency ? "Technischer Report" : "Support-Mail"}
                </p>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
                  {ctaLabel}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Schließen"
                style={{
                  width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${C.border}`,
                  color: C.textMuted, cursor: "pointer", fontSize: 16, fontFamily: "inherit",
                }}
              >×</button>
            </div>

            {/* Body — Vorschau-Text */}
            <div style={{ padding: "18px 22px" }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>
                {isAgency
                  ? "Vollständiger Diagnose-Report inklusive Plugin-Manifest und Heuristik-Hinweis. Format wählbar, dann kopieren oder direkt an Team delegieren."
                  : "Vorformulierte Mail an deinen Hoster-Support — alle relevanten Daten sind eingebaut. Einfach kopieren und in dein Mail-Programm einfügen."}
              </p>

              <pre style={{
                margin: 0, padding: "14px 16px",
                background: "rgba(0,0,0,0.42)",
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                fontSize: 11.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "#cbd5e1", lineHeight: 1.65,
                whiteSpace: "pre-wrap", maxHeight: 360, overflowY: "auto",
              }}>
                <code>{supportText}</code>
              </pre>

              {/* Action-Bar */}
              <div style={{
                marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap",
              }}>
                <button
                  onClick={() => handleCopy(supportText, "text")}
                  disabled={copied === "text"}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 16px", borderRadius: 8,
                    background: copied === "text"
                      ? "rgba(34,197,94,0.16)"
                      : "linear-gradient(90deg,#16a34a,#22c55e)",
                    border: copied === "text" ? "1px solid rgba(34,197,94,0.40)" : "none",
                    color: "#fff", fontSize: 12.5, fontWeight: 800,
                    cursor: copied === "text" ? "default" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: copied === "text" ? "none" : "0 3px 12px rgba(34,197,94,0.30)",
                  }}
                >
                  {copied === "text" ? "✓ Kopiert" : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Text kopieren
                    </>
                  )}
                </button>

                {isAgency && (
                  <>
                    <button
                      onClick={() => handleCopy(supportJson, "json")}
                      disabled={copied === "json"}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 16px", borderRadius: 8,
                        background: copied === "json" ? "rgba(34,197,94,0.16)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${copied === "json" ? "rgba(34,197,94,0.40)" : C.border}`,
                        color: copied === "json" ? "#22c55e" : C.textSub,
                        fontSize: 12.5, fontWeight: 700,
                        cursor: copied === "json" ? "default" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {copied === "json" ? "✓ JSON kopiert" : "JSON kopieren"}
                    </button>
                    <button
                      onClick={handleDelegate}
                      disabled={delegating || delegated}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 16px", borderRadius: 8,
                        background: delegated
                          ? "rgba(167,139,250,0.16)"
                          : "rgba(167,139,250,0.06)",
                        border: `1px solid ${delegated ? "rgba(167,139,250,0.40)" : C.agencyBorder}`,
                        color: C.agencyAccent,
                        fontSize: 12.5, fontWeight: 700,
                        cursor: (delegating || delegated) ? "default" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {delegated ? "✓ An Team delegiert"
                       : delegating ? "Wird delegiert…"
                       : "An Team delegieren →"}
                    </button>
                  </>
                )}
                {delegateErr && (
                  <span style={{ fontSize: 11.5, color: C.red, alignSelf: "center" }}>
                    {delegateErr}
                  </span>
                )}
              </div>

              <p style={{
                margin: "12px 0 0", fontSize: 10.5, color: C.textMuted, lineHeight: 1.55,
              }}>
                {isAgency
                  ? "Tipp: JSON-Variante ist für Slack/Jira-Embeds geeignet, der Text-Report für Email."
                  : "Tipp: Vor dem Senden den Text durchlesen und ggf. dein Hoster-Vertragsdaten ergänzen."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
