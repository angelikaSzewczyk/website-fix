/**
 * EngineeringSection — "The Engineering behind WebsiteFix"
 *
 * Antwort auf die WordPress-Experten-Kritik vom 11.05.2026 ("anonymer
 * KI-Content"). Direkte Dev-zu-Dev-Kommunikation, technische Präzision,
 * keine Marketing-Adjektive. Terminal/Code-Snippet-Optik damit es sich
 * vom Rest der Landing visuell als "harte Fakten"-Zone abhebt.
 *
 * Inhaltlich 5 Bausteine: Statement der Founderin, Tech-Stack, 92-Param-
 * Matrix (was Lighthouse NICHT sieht), Counter-AI-Argument, Security-
 * Versprechen.
 */

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
} as const;

const STACK = [
  { name: "Next.js",      version: "14.2",   role: "App Router · RSC · Edge"    },
  { name: "TypeScript",   version: "5.x",    role: "strict mode"                },
  { name: "Neon",         version: "Postgres", role: "Frankfurt-Region (ISO-27001)" },
  { name: "Vercel",       version: "fra1",   role: "Edge-Compute Hessen"        },
  { name: "Auth.js",      version: "v5",     role: "PKCE · bcrypt @ 12 rounds"  },
  { name: "Stripe",       version: "v18",    role: "Test-Mode E2E"              },
  { name: "Resend",       version: "v6",     role: "transactional mail"         },
  { name: "WordPress-Plugin", version: "PHP 7.4+", role: "Read-Only Hybrid"    },
] as const;

const MATRIX = [
  {
    blind:  "Lighthouse: \"Performance 95 — alles grün.\"",
    seen:   "wp_options Autoload-Bloat (oft 50–200 MB nach 3 Jahren)",
  },
  {
    blind:  "GTmetrix: \"Time to First Byte: 2.4 s.\" — ohne Ursache.",
    seen:   "Heartbeat-API-Frequenz (alle 15 s vs 60 s) + Cronjob-Counter",
  },
  {
    blind:  "Externer Crawl sieht 200 OK auf jeder Seite.",
    seen:   "PHP-Fatal-Errors mit Datei + Zeilennummer aus /wp-content/debug.log",
  },
  {
    blind:  "Browser-DevTools: keine sichtbaren Plugin-Konflikte.",
    seen:   "Hook-Chain-Kollisionen in functions.php (filter-Race-Conditions)",
  },
  {
    blind:  "PageSpeed-API: \"LCP 3.8 s — Bilder optimieren.\"",
    seen:   "DB-Index-Fragmentierung, Slow-Query-Log, Post-Revisions-Bloat",
  },
  {
    blind:  "SSL-Checker: \"Zertifikat gültig.\"",
    seen:   "OPcache-Status, PHP-Memory-Limit-Hits, Hoster-PHP-Version-Drift",
  },
] as const;

const SECURITY = [
  { key: "auth",     line: "passwords: bcrypt(salt, 12 rounds)  // never plaintext, never logged" },
  { key: "secrets",  line: "api_keys: edge-function-only         // never shipped to client bundle" },
  { key: "access",   line: "plugin_access: read-only by default  // writes require explicit click" },
  { key: "ftp",      line: "ftp_credentials: NULL                // we never ask, never store" },
  { key: "audit",    line: "audit_log: append-only Postgres       // Art. 30 DSGVO-tauglich" },
  { key: "dpa",      line: "dsgvo_avv: 1-click PDF in /settings   // signed template, ready to attach" },
] as const;

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
            Was Lighthouse nicht sieht.
            <br/>
            <span style={{ background: "linear-gradient(90deg,#4ade80,#22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Und warum wir es gebaut haben.
            </span>
          </h2>
          <p style={{ margin: 0, fontSize: 15.5, color: T.textSub, lineHeight: 1.65 }}>
            WebsiteFix ist keine SEO-Audit-App. Wir sind eine PHP-Deep-Bridge mit Next.js-Frontend
            und einem Read-Only-Plugin als zweiter Augenpaar im WordPress-Kern. Hier ist, wie.
          </p>
        </div>

        {/* ── 1. Statement der Entwicklerin ── */}
        <div style={{
          marginBottom: 56,
          padding: "32px 36px",
          background: T.greenBg,
          border: `1px solid ${T.borderStrong}`,
          borderLeft: `3px solid ${T.green}`,
          borderRadius: 14,
          maxWidth: 880, marginInline: "auto",
        }}>
          <p style={{
            margin: "0 0 14px",
            fontSize: 10.5, fontWeight: 800, color: T.green,
            fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            01 — Das Warum
          </p>
          <blockquote style={{
            margin: 0, padding: 0, border: "none",
            fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.85)",
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
            <p style={{ margin: 0 }}>
              Also habe ich angefangen, das Tool zu bauen, das ich gebraucht hätte:
              eine Brücke vom Browser-Audit zum WordPress-PHP-Kern. Read-Only, kein FTP, kein Passwort-Sharing.
              Was eine Entwicklerin sehen will, sieht WebsiteFix jetzt auch.
            </p>
          </blockquote>
          <p style={{
            margin: "20px 0 0", fontSize: 12.5, color: T.textMuted,
            fontFamily: T.mono, letterSpacing: "0.02em",
          }}>
            — Angelika Szewczyk · Frontend-Developer · Founder
          </p>
        </div>

        {/* ── 2. Tech-Stack ── */}
        <div style={{ marginBottom: 56 }}>
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
          <p style={{ margin: "0 0 22px", fontSize: 14, color: T.textSub, lineHeight: 1.7, maxWidth: 720 }}>
            Dedizierte Vercel-Region <code style={{ fontFamily: T.mono, color: T.green }}>fra1</code> (Hessen) gegen
            US-Latency und für DSGVO-Konformität. Hybrid-Engine: externer Next-Crawl + WordPress-Plugin liefern
            getrennt Daten, der Server merged in eine konsolidierte Diagnose.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 10,
          }}>
            {STACK.map(s => (
              <div key={s.name} style={{
                padding: "12px 14px",
                background: T.greenBg,
                border: `1px solid ${T.border}`,
                borderRadius: 9,
                display: "flex", flexDirection: "column", gap: 4,
                fontFamily: T.mono,
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
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
                <span style={{ fontSize: 11.5, color: T.textMuted }}>
                  {s.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3. 92-Parameter-Matrix ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 22 }}>
            <p style={{
              margin: 0, fontSize: 10.5, fontWeight: 800, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              03 — 92-Parameter-Matrix
            </p>
            <span style={{ flex: 1, height: 1, background: T.border }} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
            Externes Tool blind · WebsiteFix sieht.
          </h3>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: T.textSub, lineHeight: 1.7, maxWidth: 720 }}>
            Sechs konkrete Lücken zwischen Lighthouse-Welt und Realität. Die vollständigen 92 Parameter sind
            im Audit-Report sichtbar — diese Tabelle zeigt die häufigsten blinden Flecken.
          </p>

          <div style={{
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            overflow: "hidden",
            background: "rgba(255,255,255,0.015)",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              padding: "12px 18px",
              background: "rgba(255,255,255,0.025)",
              borderBottom: `1px solid ${T.border}`,
              fontFamily: T.mono, fontSize: 10.5, fontWeight: 800,
              letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              <span style={{ color: "rgba(248,113,113,0.85)" }}>↳ blind</span>
              <span style={{ color: T.green }}>↳ sichtbar</span>
            </div>
            {MATRIX.map((row, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                padding: "16px 18px",
                borderBottom: i < MATRIX.length - 1 ? `1px solid ${T.border}` : "none",
                fontSize: 13.5, lineHeight: 1.65,
              }}>
                <span style={{
                  color: "rgba(255,255,255,0.45)",
                  paddingRight: 18,
                  borderRight: `1px dashed ${T.border}`,
                  fontStyle: "italic",
                }}>
                  {row.blind}
                </span>
                <span style={{ color: "rgba(255,255,255,0.85)", paddingLeft: 18, fontFamily: T.mono, fontSize: 12.5 }}>
                  {row.seen}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4. Counter-AI ── */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 22 }}>
            <p style={{
              margin: 0, fontSize: 10.5, fontWeight: 800, color: T.amber,
              fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              04 — AI-Native Workflow
            </p>
            <span style={{ flex: 1, height: 1, background: T.border }} />
          </div>
          <div style={{
            padding: "26px 32px",
            background: "rgba(251,191,36,0.04)",
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 12,
          }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
              Wir nutzen LLMs. Aber nicht da, wo es wehtut.
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: T.textSub, lineHeight: 1.75 }}>
              Wir bauen schnell, weil LLMs für Repeating-Code, Doku-Drafts und Test-Boilerplate die richtigen
              Werkzeuge sind. Aber jeder Pfad, der auf eine Datenbank schreibt oder Geld bewegt, geht durch
              manuelle Reviews.
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: T.textSub, lineHeight: 1.9 }}>
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

      </div>
    </section>
  );
}
