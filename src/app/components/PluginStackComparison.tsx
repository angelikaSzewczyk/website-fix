/**
 * PluginStackComparison — "Eine SaaS statt 15 Plugins".
 *
 * Strategische Positionierung gegen den eigentlichen WP-Konkurrenten:
 * nicht ManageWP, sondern das typische 12-15-Plugin-Sammelsurium, das ein
 * gestresster WP-Solopreneur über Jahre angehäuft hat.
 *
 * Bewusst KEINE Konkurrenz-Logos (rechtlich + markenrechtlich heikel).
 * Stattdessen: textliche Plugin-Namen in gestylten Glas-Boxen, damit der
 * Bloat-Schmerz visuell erfahrbar wird — der Wert von "eine Codebase statt
 * 15" landet ohne Vergleich-Trash-Talk.
 */

import { Plug, ShieldCheck, AlertCircle } from "lucide-react";

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
  red:         "#ef4444",
  redBg:       "rgba(248,113,113,0.04)",
  redBorder:   "rgba(248,113,113,0.22)",
  mono:        "ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

// Realistischer Plugin-Stack eines DACH-WP-Solopreneurs nach 3 Jahren.
// Kein Logo, nur Funktion + Plugin-Name. 12 Einträge = visuell genug.
const TYPICAL_STACK = [
  { name: "WP Rocket",                  role: "Cache & Performance" },
  { name: "Smush / Imagify",            role: "Bild-Optimierung" },
  { name: "Yoast SEO",                  role: "SEO-Meta" },
  { name: "Wordfence",                  role: "Security" },
  { name: "UpdraftPlus",                role: "Backup" },
  { name: "WP-Optimize",                role: "DB-Cleanup" },
  { name: "Heartbeat Control",          role: "Heartbeat-Drosselung" },
  { name: "Disable Emojis",             role: "Frontend-Bloat" },
  { name: "Limit Login Attempts",       role: "Login-Security" },
  { name: "Query Monitor",              role: "Dev-Diagnostik" },
  { name: "Advanced DB Cleaner",        role: "DB-Optimization" },
  { name: "Asset CleanUp",              role: "Asset-Defer" },
] as const;

const COMPARISON_ROWS: ReadonlyArray<{ topic: string; old: string; ours: string }> = [
  {
    topic: "Performance-Diagnose",
    old:   "Query Monitor + GTmetrix-Plugin + Lighthouse-Plugin (3 Plugins, 3 Dashboards)",
    ours:  "Eine Hybrid-Diagnose in einem Dashboard",
  },
  {
    topic: "Heartbeat-Drosselung",
    old:   "Heartbeat Control (extra Plugin, extra Settings-Page)",
    ours:  "Smart-Fix-Snippet in functions.php — keine Settings-Page",
  },
  {
    topic: "Emoji- & Embed-Bloat",
    old:   "Disable Emojis + Disable Embeds (2 Plugins)",
    ours:  "Ein Smart-Fix-Snippet, Read-Only-erkannt",
  },
  {
    topic: "XML-RPC-Hardening",
    old:   "Wordfence-Vollpaket (Plugin mit Auto-Update + eigene Cron-Last)",
    ours:  "Smart-Fix-Snippet mit Jetpack-/Wordfence-Safety-Check",
  },
  {
    topic: "Datenbank-Audit + Cleanup",
    old:   "WP-Optimize + Advanced DB Cleaner (überlappende Funktionen)",
    ours:  "Konkrete SQL-Anleitung pro Befund im Audit",
  },
  {
    topic: "Plugin-Konflikt-Erkennung",
    old:   "Manuelles Deaktivieren + Bisection-Testing",
    ours:  "Hook-Chain-Audit identifiziert Konflikt-Paare automatisch",
  },
  {
    topic: "Performance-Impact",
    old:   "Jeder Plugin lädt mit · +10–50 ms TTFB pro Plugin · Memory",
    ours:  "On-demand-Scan · 0 Live-Last · kein permanenter Agent",
  },
  {
    topic: "Update-Pflege",
    old:   "Wöchentlich pro Plugin, Konflikt-Risiko mit jedem Update",
    ours:  "Eine Codebase · von uns getestet · ein Update-Cycle",
  },
  {
    topic: "Monatliche Kosten",
    old:   "5–15 Plugin-Lizenzen (zT. ab 49 €/Jahr) + Setup-Zeit",
    ours:  "29–249 € Plan · oder 9,90 € Pay-per-Fix (anonym)",
  },
];

export default function PluginStackComparison() {
  return (
    <section style={{
      padding: "96px 24px",
      background: "#0a0c10",
      borderTop: `1px solid ${T.border}`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtler Grid-Background passend zur EngineeringSection */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(74,222,128,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.022) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        opacity: 0.5,
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", maxWidth: 760, marginInline: "auto", marginBottom: 44 }}>
          <p style={{
            margin: "0 0 10px",
            fontSize: 11.5, fontWeight: 700, color: T.green,
            fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            // Stack-Reduktion
          </p>
          <h2 style={{
            margin: "0 0 14px",
            fontSize: "clamp(26px, 3.4vw, 42px)", fontWeight: 800,
            color: T.text, letterSpacing: "-0.025em", lineHeight: 1.15,
          }}>
            Eine SaaS statt{" "}
            <span style={{ background: "linear-gradient(90deg,#4ade80,#22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              15 Plugins.
            </span>
          </h2>
          <p style={{ margin: 0, fontSize: 15.5, color: T.textSub, lineHeight: 1.65 }}>
            Der typische DACH-WP-Solopreneur hat nach 3 Jahren ein Plugin-Sammelsurium für Performance,
            Security, SEO und Datenbank-Cleanup. Jedes mit eigenem Dashboard, eigenem Update-Zyklus, eigenem
            Konflikt-Risiko. WebsiteFix ersetzt nicht jedes Plugin — aber den Hauptteil dieses Stacks durch
            eine kontrollierte Codebase.
          </p>
        </div>

        {/* ── Visuelle Gegenüberstellung: Stack vs WebsiteFix ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}>
          {/* Links: 12-Plugin-Stack */}
          <div style={{
            padding: "20px 22px",
            background: T.redBg,
            border: `1px solid ${T.redBorder}`,
            borderRadius: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <AlertCircle size={16} color="rgba(248,113,113,0.85)" strokeWidth={2.2} />
              <p style={{
                margin: 0, fontSize: 10.5, fontWeight: 800, color: "rgba(248,113,113,0.9)",
                fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Typischer Plugin-Stack · 12 von ~15
              </p>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 6,
            }}>
              {TYPICAL_STACK.map(p => (
                <div key={p.name} style={{
                  padding: "8px 10px",
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${T.glassBorder}`,
                  borderRadius: 7,
                  minWidth: 0,
                }}>
                  <div style={{
                    fontSize: 11.5, fontWeight: 700, color: T.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    <Plug size={9} strokeWidth={2.4} style={{ display: "inline-block", marginRight: 4, opacity: 0.5, verticalAlign: "baseline" }} />
                    {p.name}
                  </div>
                  <div style={{
                    fontSize: 10, color: T.textMuted, marginTop: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: T.mono,
                  }}>
                    {p.role}
                  </div>
                </div>
              ))}
            </div>
            <p style={{
              margin: "14px 0 0", fontSize: 11.5, color: T.textMuted, lineHeight: 1.6,
              fontStyle: "italic",
            }}>
              Plus jeder Plugin = eigener Update-Cycle, eigene Cron-Last, eigene potenzielle Sicherheitslücke.
            </p>
          </div>

          {/* Rechts: WebsiteFix als einzige Card */}
          <div style={{
            padding: "20px 22px",
            background: "linear-gradient(135deg, rgba(74,222,128,0.10), rgba(34,197,94,0.04))",
            border: `1px solid ${T.greenBorder}`,
            borderRadius: 14,
            boxShadow: `0 24px 56px -32px rgba(74,222,128,0.30), inset 0 1px 0 rgba(255,255,255,0.05)`,
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <ShieldCheck size={16} color={T.green} strokeWidth={2.2} />
              <p style={{
                margin: 0, fontSize: 10.5, fontWeight: 800, color: T.green,
                fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                WebsiteFix · 1 Codebase
              </p>
            </div>
            <div style={{
              padding: "20px 22px",
              background: T.greenBg,
              border: `1px solid ${T.greenBorder}`,
              borderRadius: 11,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
                WebsiteFix
              </div>
              <div style={{ fontSize: 12, color: T.textSub, marginTop: 4, fontFamily: T.mono }}>
                Audit · Diagnose · Smart-Fix-Snippets
              </div>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
                {["Read-Only", "EU-Hosting", "0 Live-Last", "ein Dashboard"].map(b => (
                  <span key={b} style={{
                    fontSize: 10, fontWeight: 700, color: T.green,
                    fontFamily: T.mono,
                    padding: "2px 8px", borderRadius: 999,
                    background: "rgba(74,222,128,0.08)",
                    border: `1px solid rgba(74,222,128,0.22)`,
                  }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
            <p style={{
              margin: "14px 0 0", fontSize: 11.5, color: T.textMuted, lineHeight: 1.6,
              fontStyle: "italic",
            }}>
              Ein Update-Cycle, getestet vor jedem Release. Keine versteckten Cron-Jobs auf deinem Server.
            </p>
          </div>
        </div>

        {/* ── Vergleichs-Tabelle ── */}
        <div style={{
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(255,255,255,0.015)",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "minmax(140px, 1fr) 1.4fr 1.4fr",
            padding: "12px 18px",
            background: "rgba(255,255,255,0.025)",
            borderBottom: `1px solid ${T.border}`,
            fontFamily: T.mono, fontSize: 10.5, fontWeight: 800,
            letterSpacing: "0.08em", textTransform: "uppercase",
            gap: 12,
          }}>
            <span style={{ color: T.textMuted }}>Bereich</span>
            <span style={{ color: "rgba(248,113,113,0.85)" }}>↳ Plugin-Sammelsurium</span>
            <span style={{ color: T.green }}>↳ WebsiteFix</span>
          </div>
          {COMPARISON_ROWS.map((row, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "minmax(140px, 1fr) 1.4fr 1.4fr",
              padding: "14px 18px",
              borderBottom: i < COMPARISON_ROWS.length - 1 ? `1px dashed ${T.border}` : "none",
              fontSize: 13, lineHeight: 1.55,
              gap: 12,
            }}>
              <span style={{
                color: T.text, fontWeight: 700,
                fontSize: 12.5,
              }}>
                {row.topic}
              </span>
              <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: T.mono, fontSize: 12 }}>
                {row.old}
              </span>
              <span style={{ color: "rgba(255,255,255,0.86)", fontSize: 12.5, fontWeight: 500 }}>
                {row.ours}
              </span>
            </div>
          ))}
        </div>

        <p style={{ margin: "20px auto 0", maxWidth: 720, textAlign: "center", fontSize: 13, color: T.textMuted, lineHeight: 1.7 }}>
          Ehrlich: nicht jeder Plugin wird obsolet. Backup-Monitoring (UpdraftPlus / BlogVault) und
          Caching-Compiler (WP Rocket) bleiben sinnvoll. Aber 8–10 dieser 15 Plugins lösen Probleme, die
          WebsiteFix mit einer kontrollierten Codebase + Smart-Fix-Library erschlägt.
        </p>

      </div>
    </section>
  );
}
