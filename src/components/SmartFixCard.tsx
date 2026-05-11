"use client";

/**
 * SmartFixCard — Universal-Snippet-Anzeige für die Smart-Fix-Library.
 *
 * Komponente nimmt ein `Snippet` aus `lib/smartfix-snippets.ts` und rendert:
 *   - Header mit Title + Problem-Tag + Hoster/Scope-Badges
 *   - Default-collapsed; "Lösung verfügbar"-Button öffnet den Code-Block
 *   - Code-Block mit Copy-to-Clipboard inkl. Success-State
 *   - 1-2-3 Install-Anleitung
 *   - Optional: Warning-Box (über dem Code) + Rollback-Hinweis (unter dem Code)
 *
 * Design strikt im Stil der EngineeringSection (Glasmorphismus, Lighthouse-
 * Grün-Akzent #4ade80). Lucide-Icons für visuelle Klarheit.
 */

import { useState } from "react";
import {
  ChevronDown, ChevronUp, Copy, Check, ShieldCheck,
  AlertTriangle, RotateCcw, Server, Layers, Lock,
} from "lucide-react";
import { type Snippet, buildSnippet } from "@/lib/smartfix-snippets";

const T = {
  text:        "#fff",
  textSub:     "rgba(255,255,255,0.62)",
  textMuted:   "rgba(255,255,255,0.42)",
  border:      "rgba(255,255,255,0.08)",
  glass:       "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.10)",
  green:       "#4ade80",
  greenDeep:   "#22c55e",
  greenBg:     "rgba(74,222,128,0.06)",
  greenBorder: "rgba(74,222,128,0.30)",
  amber:       "#fbbf24",
  amberBg:     "rgba(251,191,36,0.08)",
  amberBorder: "rgba(251,191,36,0.30)",
  codeBg:      "#06080b",
  mono:        "ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', Menlo, monospace",
} as const;

interface Props {
  snippet:           Snippet;
  /** Optional: standard-expanded (z.B. wenn via #anchor verlinkt). */
  defaultExpanded?:  boolean;
}

export default function SmartFixCard({ snippet, defaultExpanded = false }: Props) {
  const [open, setOpen] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const fullCode = buildSnippet(snippet);

  // HowTo-JSON-LD pro Snippet. Generische Steps (Kopieren / Einfügen / Validieren)
  // statt der per-Snippet-installSteps — Rich-Snippet-Display in Google SERPs
  // braucht knappe, einheitliche Schritte. Die ausführlichen Steps bleiben im UI.
  const baseUrl = "https://website-fix.com";
  const howToSchema = {
    "@context": "https://schema.org",
    "@type":    "HowTo",
    "name":     snippet.title,
    "description": snippet.description,
    "totalTime": "PT5M",
    "tool": {
      "@type": "HowToTool",
      "name": "WordPress (mit Child-Theme oder Code-Snippets-Plugin)",
    },
    "step": [
      {
        "@type":    "HowToStep",
        "position": 1,
        "name":     "Code kopieren",
        "text":     `Kopiere den Safe-Mode-geprüften ${snippet.fixType}-Snippet aus der WebsiteFix Smart-Fix Library.`,
        "url":      `${baseUrl}/smart-fix-library#snippet-${snippet.slug}`,
      },
      {
        "@type":    "HowToStep",
        "position": 2,
        "name":     "Snippet einfügen",
        "text":     "Füge den Code in die functions.php deines aktiven Child-Themes ein — oder lege ihn als neues Snippet im Plugin „Code Snippets“ an.",
      },
      {
        "@type":    "HowToStep",
        "position": 3,
        "name":     "Ergebnis validieren",
        "text":     "Speichern, Frontend neu laden, im Browser-DevTools (Network-Tab) den erwarteten Effekt prüfen.",
      },
    ],
  };

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(fullCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback: textarea-select. Sehr alte Browser only — moderner Browser
      // mit HTTPS oder localhost hat Clipboard-API. Wenn das auch fehlschlägt,
      // sieht User den Code und kann manuell markieren.
    }
  }

  return (
    <article
      id={`snippet-${snippet.slug}`}
      style={{
        background: T.glass,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${T.glassBorder}`,
        borderRadius: 14,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow: "hidden",
        scrollMarginTop: 84,
      }}
    >
      {/* HowTo-JSON-LD für Google-Rich-Snippets. Unique pro Snippet —
          kein FAQ-Doublette-Risk, da jeder Card-Inhalt einzigartig ist. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 22px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 280px", minWidth: 0 }}>
            <span style={{
              flexShrink: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 38, height: 38, borderRadius: 9,
              background: T.greenBg,
              border: `1px solid ${T.greenBorder}`,
            }}>
              <ShieldCheck size={18} color={T.green} strokeWidth={2} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                {snippet.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>
                {snippet.description}
              </p>
            </div>
          </div>

          {/* Problem-Tag */}
          <span style={{
            flexShrink: 0,
            fontSize: 10.5, fontWeight: 800, color: T.green,
            fontFamily: T.mono, letterSpacing: "0.04em",
            padding: "4px 10px", borderRadius: 999,
            background: T.greenBg,
            border: `1px solid ${T.greenBorder}`,
          }}>
            {snippet.problemTag}
          </span>
        </div>

        {/* Meta-Badges Reihe (Hoster + Scope) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4, fontFamily: T.mono }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: T.textMuted, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <Server size={11} strokeWidth={2} />
            {snippet.hosterScope}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: T.textMuted, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <Layers size={11} strokeWidth={2} />
            {snippet.effectScope}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: T.green, padding: "3px 8px", borderRadius: 6, background: T.greenBg, border: `1px solid ${T.greenBorder}`, fontWeight: 700 }}>
            <ShieldCheck size={11} strokeWidth={2.5} />
            Safe-Mode geprüft
          </span>
          {snippet.safetyCheck && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: T.green, padding: "3px 8px", borderRadius: 6, background: T.greenBg, border: `1px solid ${T.greenBorder}`, fontWeight: 700 }}>
              <Lock size={11} strokeWidth={2.5} />
              Auto-Safety-Check
            </span>
          )}
        </div>
      </div>

      {/* ── Toggle: "Lösung verfügbar" ───────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`snippet-body-${snippet.slug}`}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12,
          padding: "13px 22px",
          background: open ? "rgba(74,222,128,0.04)" : "transparent",
          borderTop: `1px solid ${T.border}`,
          borderBottom: open ? `1px solid ${T.border}` : "none",
          color: T.green,
          fontSize: 13, fontWeight: 800, letterSpacing: "0.02em", fontFamily: "inherit",
          cursor: "pointer", outline: "none",
          transition: "background 0.15s ease",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
          {open ? "Lösung & Anleitung ausblenden" : "Lösung verfügbar · Code + Anleitung anzeigen"}
        </span>
        {open
          ? <ChevronUp size={16} color={T.green} strokeWidth={2.4} />
          : <ChevronDown size={16} color={T.green} strokeWidth={2.4} />}
      </button>

      {/* ── Body (collapsible) ───────────────────────────────────────────── */}
      {open && (
        <div id={`snippet-body-${snippet.slug}`} style={{ padding: "20px 22px 22px" }}>

          {/* Optional: Warning */}
          {snippet.warning && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "10px 12px",
              background: T.amberBg,
              border: `1px solid ${T.amberBorder}`,
              borderRadius: 9,
              marginBottom: 14,
            }}>
              <AlertTriangle size={14} color={T.amber} strokeWidth={2.4} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.78)", lineHeight: 1.6 }}>
                <strong style={{ color: T.amber }}>Hinweis:</strong> {snippet.warning}
              </p>
            </div>
          )}

          {/* Code-Block mit Copy-Button */}
          <div style={{
            position: "relative",
            background: T.codeBg,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 18,
          }}>
            {/* Terminal-Header — flex-wrap für sehr enge Mobile-Viewports */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 8, flexWrap: "wrap",
              padding: "9px 14px",
              borderBottom: `1px solid ${T.border}`,
              background: "rgba(255,255,255,0.02)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: "1 1 auto" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fbbf24", flexShrink: 0 }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
                <span style={{
                  marginLeft: 10, fontSize: 11, color: T.textMuted, fontFamily: T.mono,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  minWidth: 0,
                }}>
                  smart-fix · {snippet.slug}.php
                </span>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                aria-label={copied ? "Kopiert" : "Code kopieren"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 10px",
                  background: copied ? T.greenBg : "rgba(255,255,255,0.06)",
                  border: `1px solid ${copied ? T.greenBorder : T.border}`,
                  borderRadius: 6,
                  color: copied ? T.green : T.textSub,
                  fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                  cursor: "pointer", outline: "none",
                  transition: "all 0.18s ease",
                }}
              >
                {copied
                  ? <><Check size={12} strokeWidth={2.6} /> Kopiert</>
                  : <><Copy size={12} strokeWidth={2.2} /> Copy</>}
              </button>
            </div>

            {/* Code */}
            <pre style={{
              margin: 0,
              padding: "16px 18px",
              fontFamily: T.mono,
              fontSize: 12.5,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.86)",
              overflowX: "auto",
              whiteSpace: "pre",
              tabSize: 4,
            }}>
              <code>{fullCode}</code>
            </pre>
          </div>

          {/* 1-2-3 Anleitung */}
          <div style={{ marginBottom: snippet.rollback ? 16 : 0 }}>
            <p style={{
              margin: "0 0 10px",
              fontSize: 10.5, fontWeight: 800, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Einbau in 3 Schritten
            </p>
            <ol style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              counterReset: "smartfix-step",
            }}>
              {snippet.installSteps.map((step, i) => (
                <li key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "10px 0",
                  borderTop: i === 0 ? `1px solid ${T.border}` : "none",
                  borderBottom: `1px solid ${T.border}`,
                  fontSize: 13, color: "rgba(255,255,255,0.78)", lineHeight: 1.6,
                }}>
                  <span style={{
                    flexShrink: 0,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 22, height: 22, borderRadius: "50%",
                    background: T.greenBg,
                    border: `1px solid ${T.greenBorder}`,
                    color: T.green,
                    fontSize: 11, fontWeight: 800, fontFamily: T.mono,
                  }}>
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Rollback */}
          {snippet.rollback && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              marginBottom: 12,
            }}>
              <RotateCcw size={13} color={T.textMuted} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 12, color: T.textSub, lineHeight: 1.6 }}>
                <strong style={{ color: "rgba(255,255,255,0.7)" }}>Rückgängig machen:</strong> {snippet.rollback}
              </p>
            </div>
          )}

          {/* Safe-Mode Disclaimer (Haftungs-Schutz) — dezent, aber rechtlich notwendig */}
          <p style={{
            margin: 0,
            fontSize: 11, color: T.textMuted, lineHeight: 1.6,
            fontStyle: "italic",
            paddingTop: 10,
            borderTop: `1px dashed ${T.border}`,
          }}>
            <strong style={{ color: "rgba(255,255,255,0.55)", fontStyle: "normal" }}>Disclaimer:</strong>{" "}
            Dieser Code ist als Blaupause optimiert. Die Anwendung erfolgt in eigener Verantwortung.
            WebsiteFix empfiehlt dringend ein Backup vor der Implementierung und die Nutzung eines
            Child-Themes oder Snippet-Plugins.
          </p>

        </div>
      )}
    </article>
  );
}
