/**
 * EngineeringSection — "The Engineering behind WebsiteFix"
 *
 * Antwort auf die WordPress-Experten-Kritik vom 11.05.2026 ("anonymer
 * KI-Content"). Direkte Dev-zu-Dev-Kommunikation, technische Präzision,
 * keine Marketing-Adjektive.
 *
 * Refactor 11.05.2026: Tech-Stack & Founder-Statement auf Glasmorphismus-
 * Karten, Frankfurt als wertige Spotlight-Card, 92-Param-Matrix als Grid
 * mit Lucide-Icons + Hover-Reveal des Lighthouse-Blindspot-Texts.
 *
 * Inhaltlich 5 Bausteine: Statement der Founderin, Tech-Stack (mit
 * Frankfurt-Spotlight), 92-Param-Matrix, Counter-AI-Argument, Security-
 * Versprechen als Terminal-Block.
 */

import {
  Database, Layers, FileSearch, AlertTriangle, Cpu, Zap,
  GitBranch, Activity, Server, MapPin, ShieldCheck, Globe,
  Code, Lock, Mail, CreditCard,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

const T = {
  bg:           "#0a0c10",
  border:       "rgba(255,255,255,0.08)",
  borderStrong: "rgba(74,222,128,0.30)",
  text:         "#fff",
  textSub:      "rgba(255,255,255,0.62)",
  textMuted:    "rgba(255,255,255,0.42)",
  green:        "#4ade80",
  greenDeep:    "#22c55e",
  greenBg:      "rgba(74,222,128,0.06)",
  greenBgHover: "rgba(74,222,128,0.10)",
  amber:        "#fbbf24",
  mono:         "ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', Menlo, monospace",
  // Glasmorphismus-Tokens — werden in mehreren Cards wiederverwendet
  glass:        "rgba(255,255,255,0.04)",
  glassBorder:  "rgba(255,255,255,0.07)",
  glassInner:   "inset 0 1px 0 rgba(255,255,255,0.05)",
} as const;

const STACK: ReadonlyArray<{ name: string; version: string; role: string; Icon: LucideIcon }> = [
  { name: "Next.js",          version: "14.2",     role: "App Router · RSC · Edge",     Icon: Globe         },
  { name: "TypeScript",       version: "5.x",      role: "strict mode",                 Icon: Code          },
  { name: "Neon",             version: "Postgres", role: "Frankfurt-Region (ISO-27001)", Icon: Database      },
  { name: "Auth.js",          version: "v5",       role: "PKCE · bcrypt @ 12 rounds",   Icon: Lock          },
  { name: "Stripe",           version: "v18",      role: "Test-Mode E2E",               Icon: CreditCard    },
  { name: "Resend",           version: "v6",       role: "transactional mail",          Icon: Mail          },
  { name: "WordPress-Plugin", version: "PHP 7.4+", role: "Read-Only Hybrid",            Icon: ShieldCheck   },
];

type MatrixGroup = "DB-Audit" | "PHP-Runtime" | "Security & Server-Last";

// Dreiklang-Positionierung (11.05.2026): jeder Parameter zeigt jetzt
// drei Auflösungsstufen — Lighthouse = WAS (Symptom), Profi-Tools wie
// Query Monitor / New Relic = WO (Rohdaten, Dev-only), WebsiteFix = WIE
// (übersetzt in Fix-Anleitung). proTool-Feld beschreibt was ein Profi-
// Tool zeigen würde + dessen Limit (Setup-Friction, Live-Last, Dev-only).
// weDeliver = unser Translation-Layer in eine actionable Antwort.
const MATRIX: ReadonlyArray<{
  group:     MatrixGroup;
  Icon:      LucideIcon;
  param:     string;
  proTool:   string;
  weDeliver: string;
  blind:     string;
}> = [
  // ── Datenbank-Audit ─────────────────────────────────────────────────────
  {
    group:    "DB-Audit",
    Icon:     Database,
    param:    "wp_options Autoload-Size",
    proTool:  "Query Monitor listet alle Autoload-Options nach Größe — sortieren musst du selbst.",
    weDeliver:"Plugin-Slug des Verursachers + Migrations-Snippet zum Auslagern ins Transient-Cache.",
    blind:    "Lighthouse misst nur das Frontend-HTML — eine 200 MB große Autoload-Tabelle ist für externe Tools unsichtbar.",
  },
  {
    group:    "DB-Audit",
    Icon:     Layers,
    param:    "Index-Health & Fragmentierung",
    proTool:  "phpMyAdmin zeigt SHOW INDEX-Output — du musst SQL lesen können.",
    weDeliver:"Konkreter ALTER-TABLE-Befehl + Risiko-Hinweis (Lock-Dauer auf deinem DB-Größenprofil).",
    blind:    "Browser-basierte Audits sehen keine SQL-Struktur. Index-Probleme zeigen sich nur in Slow-TTFB-Symptomen ohne Ursache.",
  },
  {
    group:    "DB-Audit",
    Icon:     FileSearch,
    param:    "Slow-Query-Log + Post-Revisions",
    proTool:  "MySQL-Slow-Log liefert rohe Queries — Hoster aktivieren, parsen, korrelieren musst du selbst.",
    weDeliver:"Verursachendes Plugin/Theme identifiziert + WP-CLI-Befehl zum Revisions-Cleanup.",
    blind:    "Externe Crawler erleben nur Symptome (langsame Antwort) — sie können nicht in den MySQL-Log schauen, der die wahre Query identifiziert.",
  },

  // ── PHP-Runtime ─────────────────────────────────────────────────────────
  {
    group:    "PHP-Runtime",
    Icon:     AlertTriangle,
    param:    "PHP-Fatal-Errors mit Datei + Zeile",
    proTool:  "New Relic / Sentry zeigen Traces — brauchen Agent-Install + Service-Abo.",
    weDeliver:"Datei + Zeile aus debug.log + passende Disable-/Hotfix-Anweisung pro Plugin.",
    blind:    "Externer 200-OK-Crawl signalisiert „alles gut“ — gleichzeitig kann debug.log voller Fatal-Errors auf nicht-gecrawlten Routen sein.",
  },
  {
    group:    "PHP-Runtime",
    Icon:     Cpu,
    param:    "Memory-Limit-Hits & Peak-Usage",
    proTool:  "Query Monitor zeigt Peak-Usage pro Request — Aggregation über Zeit fehlt.",
    weDeliver:"Trend + memory_limit-Empfehlung für deinen Hoster + .htaccess- oder php.ini-Snippet.",
    blind:    "Lighthouse misst Browser-Memory, nicht das PHP-Memory-Limit auf dem Server. Out-of-Memory-Crashes bleiben unsichtbar bis zur weißen Seite.",
  },
  {
    group:    "PHP-Runtime",
    Icon:     Zap,
    param:    "OPcache-Status & Hit-Rate",
    proTool:  "opcache_get_status() ist eine PHP-Funktion — du musst sie selbst aufrufen + interpretieren.",
    weDeliver:"Status-Bewertung + Hoster-spezifische Anweisung zum Aktivieren (Strato, IONOS, Hetzner usw.).",
    blind:    "OPcache läuft serverseitig — ein deaktivierter Cache halbiert die PHP-Performance, ist von außen aber nicht messbar.",
  },

  // ── Security & Server-Last ──────────────────────────────────────────────
  {
    group:    "Security & Server-Last",
    Icon:     GitBranch,
    param:    "Hook-Chain-Race-Conditions",
    proTool:  "Query Monitor zeigt registrierte Hooks pro Action — Konflikt-Erkennung machst du manuell.",
    weDeliver:"Konfligierende Plugin-Paare identifiziert + Priority-Reihenfolge zum Fixen.",
    blind:    "DevTools sehen nur das gerenderte Endprodukt. Welche zwei Plugins sich gegenseitig auf the_content tot-filtern, bleibt verborgen.",
  },
  {
    group:    "Security & Server-Last",
    Icon:     Activity,
    param:    "Heartbeat-API-Frequenz & Cronjob-Counter",
    proTool:  "Heartbeat-Control-Plugin gibt UI — aber nur, wenn du es installierst und konfigurierst.",
    weDeliver:"Empfohlene Frequenz nach Site-Profil + drei Zeilen wp-config-Tweak für die Anpassung.",
    blind:    "Externe Scans sind Snapshot-basiert. Ein Cron, der nur alle 5 Min 2.000 Queries feuert, wird zu 99 % verfehlt.",
  },
  {
    group:    "Security & Server-Last",
    Icon:     Server,
    param:    "PHP-Version-Drift & SSL-Chain",
    proTool:  "phpinfo() + openssl s_client zeigen Rohwerte — kein Konflikt-Check mit Plugin-Anforderungen.",
    weDeliver:"PHP-Version-Empfehlung pro aktivem Plugin + 1-Click-Upgrade-Pfad bei deinem Hoster.",
    blind:    "SSL-Checker sagen „grün, gültig“. Eine veraltete Intermediate-CA oder ein EOL-PHP wird oft erst beim Browser-Warning-Popup sichtbar.",
  },
];

const SECURITY = [
  { key: "auth",     line: "passwords: bcrypt(salt, 12 rounds)  // never plaintext, never logged" },
  { key: "secrets",  line: "api_keys: edge-function-only         // never shipped to client bundle" },
  { key: "access",   line: "plugin_access: read-only by default  // writes require explicit click" },
  { key: "ftp",      line: "ftp_credentials: NULL                // we never ask, never store" },
  { key: "audit",    line: "audit_log: append-only Postgres       // Art. 30 DSGVO-tauglich" },
  { key: "dpa",      line: "dsgvo_avv: 1-click PDF in /settings   // signed template, ready to attach" },
] as const;

// Group → display-color (alle Tonalitäten grün, leicht versetzt für Wiedererkennung)
const GROUP_COLOR: Record<MatrixGroup, string> = {
  "DB-Audit":                "#4ade80",
  "PHP-Runtime":             "#22c55e",
  "Security & Server-Last":  "#86efac",
};

export default function EngineeringSection() {
  return (
    <section style={{
      padding: "96px 24px",
      background: T.bg,
      borderTop: `1px solid ${T.border}`,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle grid pattern für Terminal-Optik, hinter dem Content */}
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(74,222,128,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.025) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        opacity: 0.6,
        pointerEvents: "none",
      }} />

      {/* Hover-Behaviour-Style — Reveal nur auf Desktop (hover-fähigen Geräten). Auf Touch immer voll sichtbar. */}
      <style>{`
        .wf-matrix-card .wf-blind { opacity: 0.45; transition: opacity 0.18s ease, color 0.18s ease; }
        @media (hover: hover) {
          .wf-matrix-card .wf-blind { opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.18s ease, max-height 0.25s ease; }
          .wf-matrix-card:hover .wf-blind,
          .wf-matrix-card:focus-within .wf-blind { opacity: 0.9; max-height: 160px; }
          .wf-matrix-card { transition: transform 0.15s ease, border-color 0.18s ease, background 0.18s ease; }
          .wf-matrix-card:hover { transform: translateY(-2px); border-color: rgba(74,222,128,0.35); background: rgba(74,222,128,0.05); }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>

        {/* ── Eyebrow + H2 ── */}
        <div style={{ textAlign: "center", maxWidth: 760, marginInline: "auto", marginBottom: 56 }}>
          <p style={{
            margin: "0 0 10px",
            fontSize: 11.5, fontWeight: 700, color: T.green,
            fontFamily: T.mono,
            letterSpacing: "0.08em",
          }}>
            // THE ENGINEERING
          </p>
          <h2 style={{
            margin: "0 0 14px",
            fontSize: "clamp(26px, 3.4vw, 42px)", fontWeight: 800,
            color: T.text, letterSpacing: "-0.025em", lineHeight: 1.15,
          }}>
            Tiefer als Lighthouse.
            <br/>
            <span style={{ background: "linear-gradient(90deg,#4ade80,#22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Verständlicher als Query Monitor.
            </span>
          </h2>
          <p style={{ margin: 0, fontSize: 15.5, color: T.textSub, lineHeight: 1.65 }}>
            Lighthouse misst das <strong style={{ color: T.text }}>Was</strong> (Symptome an der Oberfläche).
            Profi-Tools zeigen das <strong style={{ color: T.text }}>Wo</strong> (Rohdaten für Entwickler).
            WebsiteFix liefert das <strong style={{ color: T.green }}>Wie</strong> — Deep-Audit-Metriken übersetzt
            in Fix-Anleitungen, die ein Solo-Betreiber oder Agentur-Junior umsetzen kann.
          </p>
        </div>

        {/* ── 1. Statement der Entwicklerin — Glasmorphismus-Card ── */}
        <div style={{
          marginBottom: 64,
          padding: "32px 36px",
          background: T.glass,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: `1px solid ${T.glassBorder}`,
          borderLeft: `3px solid ${T.green}`,
          borderRadius: 16,
          boxShadow: `${T.glassInner}, 0 24px 48px -28px rgba(74,222,128,0.18)`,
          maxWidth: 880, marginInline: "auto",
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 7,
              background: "rgba(74,222,128,0.12)",
              border: `1px solid ${T.borderStrong}`,
            }}>
              <Code size={14} color={T.green} strokeWidth={2.2} />
            </span>
            <p style={{
              margin: 0,
              fontSize: 10.5, fontWeight: 800, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              01 — Das Warum
            </p>
          </div>
          <blockquote style={{
            margin: 0, padding: 0, border: "none",
            fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.86)",
          }}>
            <p style={{ margin: "0 0 14px" }}>
              Ich bin Frontend-Developerin. Drei Jahre lang habe ich Lighthouse-Reports für Kunden gelesen —
              Performance 95, alles grün. Bis die Seite Mittwochs einen 500er warf, die Datenbank still unter
              <code style={{ fontFamily: T.mono, fontSize: 14, color: T.green, padding: "0 4px" }}> wp_options</code>-Bloat erstickte,
              oder ein Cronjob alle 30 Sekunden 2.000 DB-Queries feuerte.
            </p>
            <p style={{ margin: "0 0 14px" }}>
              Lighthouse sah davon nichts. Konnte es nicht sehen — das war architektonisch unmöglich.
              Ein externer Crawler hat keinen Zugriff auf <code style={{ fontFamily: T.mono, fontSize: 14, color: T.green, padding: "0 4px" }}>/wp-content/debug.log</code>,
              auf den Slow-Query-Log, auf die Hook-Chain in <code style={{ fontFamily: T.mono, fontSize: 14, color: T.green, padding: "0 4px" }}>functions.php</code>.
            </p>
            <p style={{ margin: "0 0 14px" }}>
              Also habe ich angefangen, das Tool zu bauen, das ich gebraucht hätte:
              eine Brücke vom Browser-Audit zum WordPress-PHP-Kern. Read-Only, kein FTP, kein Passwort-Sharing.
              Was eine Entwicklerin sehen will, sieht WebsiteFix jetzt auch.
            </p>
            <p style={{ margin: 0, paddingTop: 14, borderTop: `1px dashed ${T.border}`, color: "rgba(255,255,255,0.7)" }}>
              Ich schätze Tools wie <code style={{ fontFamily: T.mono, fontSize: 14, color: T.green, padding: "0 4px" }}>Query Monitor</code> beim Coden — die zeigen
              mir, <em>wo</em> es klemmt. Aber für den schnellen, automatisierten Health-Check einer Live-Seite,
              und für Kunden, die kein WP-Backend lesen können, brauchte ich etwas, das Analyse und Lösungsweg
              vereint. Nicht „<code style={{ fontFamily: T.mono, fontSize: 13.5, color: T.textSub, padding: "0 3px" }}>SHOW SLOW QUERIES</code>" — sondern „dieses Plugin verursacht es, hier ist der Fix".
            </p>
          </blockquote>
          <p style={{
            margin: "22px 0 0", fontSize: 12.5, color: T.textMuted,
            fontFamily: T.mono, letterSpacing: "0.02em",
          }}>
            — Angelika Szewczyk · Frontend-Developer · Founder
          </p>
        </div>

        {/* ── 2. Tech-Stack mit Frankfurt-Spotlight ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 22 }}>
            <p style={{
              margin: 0, fontSize: 10.5, fontWeight: 800, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              02 — Stack
            </p>
            <span style={{ flex: 1, height: 1, background: T.border }} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
            Vollständige Liste, ohne Marketing-Filter.
          </h3>
          <p style={{ margin: "0 0 26px", fontSize: 14, color: T.textSub, lineHeight: 1.7, maxWidth: 720 }}>
            Hybrid-Engine: externer Next-Crawl + WordPress-Plugin liefern getrennt Daten,
            der Server merged in eine konsolidierte Diagnose.
          </p>

          {/* Frankfurt-Spotlight — gehört oben hin, doppelter Glas-Akzent + Map-Pin */}
          <div style={{
            marginBottom: 16,
            padding: "22px 26px",
            background: "linear-gradient(135deg, rgba(74,222,128,0.08), rgba(34,197,94,0.04))",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 14,
            boxShadow: `${T.glassInner}, 0 24px 56px -32px rgba(74,222,128,0.30)`,
            display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 64, height: 64, borderRadius: 14,
              background: "rgba(74,222,128,0.12)",
              border: `1px solid ${T.borderStrong}`,
              flexShrink: 0,
              position: "relative",
            }}>
              <Server size={28} color={T.green} strokeWidth={1.8} />
              <span style={{
                position: "absolute", bottom: -6, right: -6,
                width: 26, height: 26, borderRadius: "50%",
                background: T.bg,
                border: `1.5px solid ${T.green}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MapPin size={13} color={T.green} strokeWidth={2.4} />
              </span>
            </div>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
                  Vercel Edge · fra1
                </span>
                <code style={{
                  fontSize: 11, fontWeight: 700, color: T.green,
                  fontFamily: T.mono,
                  padding: "2px 8px", borderRadius: 4,
                  background: "rgba(74,222,128,0.08)",
                  border: `1px solid rgba(74,222,128,0.22)`,
                }}>
                  region=&quot;fra1&quot;
                </code>
              </div>
              <p style={{ margin: "0 0 8px", fontSize: 13.5, color: T.textSub, lineHeight: 1.5 }}>
                Compute &amp; Datenbank physisch in <strong style={{ color: T.text }}>Frankfurt am Main, Hessen</strong>.
                Keine US-Region-Spillovers, keine Latency-Telemetry über den Atlantik.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["ISO-27001 (Neon)", "DSGVO-konform", "< 12 ms RTT DACH", "TLS 1.3"].map(badge => (
                  <span key={badge} style={{
                    fontSize: 10.5, fontWeight: 700, color: T.green,
                    fontFamily: T.mono,
                    padding: "3px 9px", borderRadius: 999,
                    background: "rgba(74,222,128,0.08)",
                    border: `1px solid rgba(74,222,128,0.22)`,
                  }}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 7 weitere Stack-Badges als Glas-Cards, responsive Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 10,
          }}>
            {STACK.map(s => {
              const Icon = s.Icon;
              return (
                <div key={s.name} style={{
                  padding: "13px 14px",
                  background: T.glass,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: `1px solid ${T.glassBorder}`,
                  borderRadius: 10,
                  display: "flex", alignItems: "flex-start", gap: 12,
                  boxShadow: T.glassInner,
                }}>
                  <span style={{
                    flexShrink: 0,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: 8,
                    background: "rgba(74,222,128,0.10)",
                    border: `1px solid rgba(74,222,128,0.22)`,
                  }}>
                    <Icon size={16} color={T.green} strokeWidth={2} />
                  </span>
                  <div style={{ minWidth: 0, fontFamily: T.mono }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text, letterSpacing: "-0.01em" }}>
                        {s.name}
                      </span>
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, color: T.green,
                        padding: "1px 6px", borderRadius: 4,
                        background: "rgba(74,222,128,0.08)",
                        border: `1px solid rgba(74,222,128,0.22)`,
                      }}>
                        {s.version}
                      </span>
                    </div>
                    <span style={{ display: "block", fontSize: 11.5, color: T.textMuted, marginTop: 2, lineHeight: 1.4 }}>
                      {s.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 3. 92-Parameter-Matrix mit Dreiklang-Positionierung ── */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 22 }}>
            <p style={{
              margin: 0, fontSize: 10.5, fontWeight: 800, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              03 — Drei Auflösungsstufen
            </p>
            <span style={{ flex: 1, height: 1, background: T.border }} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
            Wo Lighthouse aufhört, wo Profi-Tools überfordern, wo wir landen.
          </h3>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: T.textSub, lineHeight: 1.7, maxWidth: 720 }}>
            Jeder Parameter zeigt drei Sichten — die Symptom-Sicht, die Profi-Tool-Sicht (z. B. Query Monitor,
            New Relic), und unsere übersetzte Lösung. Hover über eine Karte für die Lighthouse-Blindspot-Begründung.
          </p>

          {/* ── Dreiklang-Comparison-Bar ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
            marginBottom: 22,
          }}>
            {[
              {
                accent:   "rgba(248,113,113,0.85)",
                accentBg: "rgba(248,113,113,0.06)",
                accentBd: "rgba(248,113,113,0.22)",
                label:    "Lighthouse",
                role:     "Browser-Audit",
                verb:     "Misst das WAS",
                detail:   "Symptome an der Oberfläche · TTFB, LCP, CLS. Schnell, aber Server-blind.",
                friction: "no setup",
              },
              {
                accent:   "rgba(251,191,36,0.85)",
                accentBg: "rgba(251,191,36,0.06)",
                accentBd: "rgba(251,191,36,0.25)",
                label:    "Profi-Tools",
                role:     "Query Monitor · New Relic · phpMyAdmin",
                verb:     "Zeigen das WO",
                detail:   "Rohdaten + Code-Zeilen für Entwickler. Mächtig, aber Setup-intensiv, Live-Last, Dev-only.",
                friction: "Agent + SQL-Skill nötig",
              },
              {
                accent:   T.green,
                accentBg: "rgba(74,222,128,0.10)",
                accentBd: T.borderStrong,
                label:    "WebsiteFix",
                role:     "Hybrid-Audit · automatisiert",
                verb:     "Liefert das WIE",
                detail:   "Übersetzte Fix-Anleitung pro Befund: verursachendes Plugin, exakter Befehl, Hoster-spezifischer Pfad.",
                friction: "Read-Only · ein Klick",
                highlight: true,
              },
            ].map(col => (
              <div key={col.label} style={{
                padding: "14px 16px",
                background: col.accentBg,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: `1px solid ${col.accentBd}`,
                borderRadius: 11,
                boxShadow: col.highlight
                  ? `${T.glassInner}, 0 16px 36px -20px rgba(74,222,128,0.45)`
                  : T.glassInner,
                position: "relative",
              }}>
                {col.highlight && (
                  <span style={{
                    position: "absolute", top: -10, right: 12,
                    fontSize: 9.5, fontWeight: 800, color: "#06210f",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    padding: "3px 9px", borderRadius: 999,
                    background: T.green,
                    boxShadow: `0 6px 16px -6px ${T.green}`,
                  }}>
                    Goldene Mitte
                  </span>
                )}
                <div style={{ fontSize: 11, fontWeight: 800, color: col.accent, fontFamily: T.mono, letterSpacing: "0.06em", marginBottom: 4 }}>
                  {col.verb}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.01em", marginBottom: 3 }}>
                  {col.label}
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.mono, marginBottom: 10 }}>
                  {col.role}
                </div>
                <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.55, marginBottom: 10 }}>
                  {col.detail}
                </div>
                <div style={{
                  fontSize: 10.5, fontWeight: 700, color: col.accent, fontFamily: T.mono,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  paddingTop: 8, borderTop: `1px dashed ${T.border}`,
                }}>
                  {col.friction}
                </div>
              </div>
            ))}
          </div>

          {/* ── Cards-Grid: jede Karte zeigt jetzt Profi-Tool-Sicht + WebsiteFix-Antwort ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}>
            {MATRIX.map((m, i) => {
              const Icon = m.Icon;
              const accent = GROUP_COLOR[m.group];
              return (
                <div
                  key={i}
                  tabIndex={0}
                  className="wf-matrix-card"
                  style={{
                    padding: "16px 16px 14px",
                    background: T.glass,
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: `1px solid ${T.glassBorder}`,
                    borderRadius: 11,
                    boxShadow: T.glassInner,
                    cursor: "default",
                    outline: "none",
                  }}>
                  {/* Header: Icon + Gruppen-Pill */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 36, height: 36, borderRadius: 8,
                      background: `${accent}1A`,
                      border: `1px solid ${accent}44`,
                    }}>
                      <Icon size={17} color={accent} strokeWidth={2} />
                    </span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, color: accent,
                      fontFamily: T.mono,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      padding: "2px 7px", borderRadius: 999,
                      background: `${accent}10`,
                      border: `1px solid ${accent}33`,
                    }}>
                      {m.group}
                    </span>
                  </div>

                  {/* Parameter-Name */}
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text, letterSpacing: "-0.01em", lineHeight: 1.35, marginBottom: 12 }}>
                    {m.param}
                  </div>

                  {/* Profi-Tool-Sicht (das WO) — sekundär, monospace */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{
                      fontSize: 9.5, fontWeight: 800, color: "rgba(251,191,36,0.85)",
                      fontFamily: T.mono, letterSpacing: "0.06em", textTransform: "uppercase",
                      marginBottom: 3,
                    }}>
                      Profi-Tool zeigt
                    </div>
                    <div style={{ fontSize: 12, color: T.textSub, lineHeight: 1.55 }}>
                      {m.proTool}
                    </div>
                  </div>

                  {/* WebsiteFix-Antwort (das WIE) — primär, grüner Akzent */}
                  <div>
                    <div style={{
                      fontSize: 9.5, fontWeight: 800, color: T.green,
                      fontFamily: T.mono, letterSpacing: "0.06em", textTransform: "uppercase",
                      marginBottom: 3,
                    }}>
                      WebsiteFix liefert
                    </div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.86)", lineHeight: 1.55, fontWeight: 500 }}>
                      {m.weDeliver}
                    </div>
                  </div>

                  {/* Lighthouse-Blindspot — Hover-Reveal (Desktop) / always-visible-muted (Mobile) */}
                  <div className="wf-blind" style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px dashed ${T.border}`,
                    fontSize: 11.5, lineHeight: 1.55,
                    color: "rgba(255,255,255,0.6)",
                    fontStyle: "italic",
                  }}>
                    <span style={{ color: "rgba(248,113,113,0.85)", fontStyle: "normal", fontWeight: 700, marginRight: 4 }}>
                      Lighthouse blind:
                    </span>
                    {m.blind}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. Non-Intrusive & AI-Native ── Glas-Card mit Amber-Akzent */}
        <div style={{ marginBottom: 64 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 22 }}>
            <p style={{
              margin: 0, fontSize: 10.5, fontWeight: 800, color: T.amber,
              fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              04 — Non-Intrusive · AI-Assisted, Human-Reviewed
            </p>
            <span style={{ flex: 1, height: 1, background: T.border }} />
          </div>
          <div style={{
            padding: "28px 32px",
            background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(251,191,36,0.02))",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(251,191,36,0.22)",
            borderRadius: 14,
            boxShadow: T.glassInner,
          }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
              Kein Agent. Kein Live-Mitlesen. Kein Performance-Drag.
            </h3>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: T.textSub, lineHeight: 1.75 }}>
              APM-Suiten wie New Relic, DataDog oder Blackfire installieren einen permanenten Agent in deinem
              PHP-Runtime und sampeln jeden Request — bezahlt mit ein paar Millisekunden Overhead und einer
              Server-Konfiguration, die Solo-Betreiber oft überfordert. WebsiteFix arbeitet on-demand: das
              Read-Only-Plugin liest Logs &amp; Konfiguration nur wenn du scannst, der Audit läuft danach in
              unserer Cloud weiter. <strong style={{ color: T.text }}>Null Live-Last, kein Setup über
              „Plugin aktivieren" hinaus.</strong>
            </p>
            <div style={{
              fontSize: 11, fontWeight: 800, color: T.amber, fontFamily: T.mono,
              letterSpacing: "0.06em", textTransform: "uppercase",
              marginBottom: 8, paddingTop: 14, borderTop: `1px dashed ${T.border}`,
            }}>
              Zum AI-Einsatz, ehrlich
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 13.5, color: T.textSub, lineHeight: 1.7 }}>
              Wir bauen schnell, weil LLMs für Repeating-Code, Doku-Drafts und Test-Boilerplate die richtigen
              Werkzeuge sind. Aber jeder Pfad, der auf eine Datenbank schreibt oder Geld bewegt, geht durch
              manuelle Reviews.
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: T.textSub, lineHeight: 1.9 }}>
              <li>Plugin-Security-Audit: manuell, vor jedem Release. Kein Auto-Deploy für PHP-Code.</li>
              <li>Auth-Flows: handgeschrieben, gegen OWASP-Top-10 abgeglichen.</li>
              <li>Architektur-Entscheidungen: in Code-Reviews, nicht in einem LLM-Prompt.</li>
              <li>Stripe-Webhooks &amp; DSGVO-Logic: 100 % menschliche Engineering-Arbeit, dokumentiert per Code-Comment mit Begründung.</li>
            </ul>
            <p style={{ margin: "14px 0 0", fontSize: 12.5, color: T.textMuted, fontStyle: "italic" }}>
              Wenn du den GitHub-Verlauf einsehen willst, schreib uns. Wir zeigen ihn gerne.
            </p>
          </div>
        </div>

        {/* ── 5. Security-Versprechen als Code-Block ── */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 22 }}>
            <p style={{
              margin: 0, fontSize: 10.5, fontWeight: 800, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              05 — Security-Constraints
            </p>
            <span style={{ flex: 1, height: 1, background: T.border }} />
          </div>
          <div style={{
            padding: 0,
            background: "#06080b",
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            overflow: "hidden",
            fontFamily: T.mono,
          }}>
            {/* Terminal-Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              borderBottom: `1px solid ${T.border}`,
              background: "rgba(255,255,255,0.02)",
            }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#fbbf24", display: "inline-block" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              <span style={{ marginLeft: 10, fontSize: 11.5, color: T.textMuted, letterSpacing: "0.04em" }}>
                websitefix · security.config.ts
              </span>
            </div>
            {/* Constraints */}
            <div style={{ padding: "18px 22px", fontSize: 13, lineHeight: 1.95, color: "rgba(255,255,255,0.78)" }}>
              {SECURITY.map((s, i) => (
                <div key={s.key} style={{ display: "flex", gap: 14 }}>
                  <span style={{ color: T.textMuted, userSelect: "none", flexShrink: 0, width: 18, textAlign: "right" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    {(() => {
                      const idx = s.line.indexOf("//");
                      if (idx === -1) return <span>{s.line}</span>;
                      return (
                        <>
                          <span>{s.line.slice(0, idx)}</span>
                          <span style={{ color: "rgba(74,222,128,0.65)", fontStyle: "italic" }}>
                            {s.line.slice(idx)}
                          </span>
                        </>
                      );
                    })()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ margin: "16px auto 0", maxWidth: 720, textAlign: "center", fontSize: 12.5, color: T.textMuted, lineHeight: 1.7 }}>
            Diese Constraints sind keine Versprechen — sie sind Code-Pfade. Wer es nicht glaubt:
            wir zeigen den relevanten Source live.
          </p>
        </div>

        {/* ── Bridge zur Smart-Fix-Library ──
            Macht die Library auf der Homepage discoverable. Ohne diesen
            Link wäre /smart-fix-library nur via direkter URL oder organischer
            Google-Suche erreichbar. Hier landet jeder Dev-zu-Dev-Leser. */}
        <a
          href="/smart-fix-library"
          style={{
            display: "block",
            marginTop: 40,
            padding: "22px 26px",
            background: T.greenBg,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1px solid ${T.borderStrong}`,
            borderRadius: 14,
            boxShadow: `${T.glassInner}, 0 24px 56px -32px rgba(74,222,128,0.30)`,
            textDecoration: "none",
            transition: "transform 0.15s ease, border-color 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <p style={{
                margin: "0 0 6px",
                fontSize: 10.5, fontWeight: 800, color: T.green,
                fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Geöffneter Engineering-Lab
              </p>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
                Smart-Fix-Library &nbsp;·&nbsp; 5 kuratierte Snippets, copy-paste-ready
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
                Heartbeat-Drosselung, XML-RPC-Hardening, Emoji-Bloat-Remove, Query-String-Cleaner, jQuery-Migrate-Drop —
                jeder mit Auto-Safety-Check für Plugin-Kollisionen.
              </p>
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 18px",
              background: T.green,
              color: "#06210f",
              fontSize: 13, fontWeight: 800,
              borderRadius: 9,
              letterSpacing: "-0.005em",
              flexShrink: 0,
            }}>
              Library öffnen
              <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>→</span>
            </span>
          </div>
        </a>

      </div>
    </section>
  );
}
