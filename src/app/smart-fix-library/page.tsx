import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, AlertTriangle, ShieldCheck, Eye, Layers, Plug } from "lucide-react";
import BlogHeader from "../components/blog-header";
import SiteFooter from "../components/SiteFooter";
import SmartFixCard from "@/components/SmartFixCard";
import { SNIPPETS } from "@/lib/smartfix-snippets";

/**
 * /smart-fix-library — SEO-Einstiegspunkt + Lead-Magnet.
 *
 * Strategie: indexierbar (im Gegensatz zu /plugin-report), zielt auf
 * Long-Tail-Suchen wie "WordPress Heartbeat drosseln ohne Plugin",
 * "XML-RPC deaktivieren functions.php", "Emojis aus WordPress entfernen".
 * Jede Snippet-Card ist über `#snippet-<slug>` direkt verlinkbar (z.B. aus
 * Blog-Posts heraus).
 *
 * Parallel zur dynamischen `SmartFixSection.tsx` im Dashboard — diese hier
 * ist statisch + öffentlich, jene ist deep-data-driven + login-gated.
 */
export const metadata: Metadata = {
  title:       "WordPress Performance optimieren ohne Plugin — Smart-Fix Code-Library | WebsiteFix",
  description: "Stoppe das Rätselraten. Hol dir kuratierte, sichere Smart-Fix Code-Snippets für dein WordPress. Optimiert für Core Web Vitals, ohne schwere Plugins. Direkt aus dem WebsiteFix Engineering-Lab.",
  keywords: [
    "WordPress Performance optimieren ohne Plugin",
    "WP Heartbeat drosseln Code",
    "wp_options aufräumen Anleitung",
    "WordPress Core Web Vitals verbessern Backend",
    "XML-RPC deaktivieren WordPress",
    "WordPress Snippets functions.php",
    "WP-Emojis deaktivieren",
    "jQuery-Migrate entfernen WordPress",
  ],
  alternates:  { canonical: "https://website-fix.com/smart-fix-library" },
  openGraph: {
    title:       "WordPress Performance optimieren ohne Plugin | WebsiteFix Smart-Fix Library",
    description: "5 kuratierte Code-Snippets aus dem WebsiteFix Engineering-Lab. Heartbeat, XML-RPC, Emojis, Query-Strings, jQuery-Migrate — Safe-Mode geprüft, copy-paste-ready.",
    url:         "https://website-fix.com/smart-fix-library",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "WordPress Performance optimieren ohne Plugin",
    description: "Kuratierte Smart-Fix Snippets für Core Web Vitals. Aus dem WebsiteFix Engineering-Lab.",
  },
};

const T = {
  bg:          "#0a0c10",
  text:        "#fff",
  textSub:     "rgba(255,255,255,0.62)",
  textMuted:   "rgba(255,255,255,0.42)",
  border:      "rgba(255,255,255,0.08)",
  green:       "#4ade80",
  greenDeep:   "#22c55e",
  greenBg:     "rgba(74,222,128,0.06)",
  greenBorder: "rgba(74,222,128,0.30)",
  glass:       "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.10)",
  mono:        "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace",
} as const;

export default function SmartFixLibraryPage() {
  return (
    <>
      <BlogHeader active="none" lang="de" />

      <main style={{
        background: T.bg, color: T.text, minHeight: "100vh",
        padding: "64px 24px 96px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtile Grid-Background, passt zur EngineeringSection */}
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(74,222,128,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.6,
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 880, margin: "0 auto", position: "relative" }}>

          {/* ── Hero ── */}
          <header style={{ marginBottom: 48 }}>
            <p style={{
              margin: "0 0 12px",
              fontSize: 11.5, fontWeight: 700, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              // Smart-Fix Library
            </p>
            <h1 style={{
              margin: "0 0 16px",
              fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 800,
              color: T.text, letterSpacing: "-0.025em", lineHeight: 1.15,
            }}>
              Echte Lösungen statt nur Kritik.
              <br/>
              <span style={{ background: "linear-gradient(90deg,#4ade80,#22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Copy-paste-ready, ohne Plugin.
              </span>
            </h1>
            <p style={{ margin: "0 0 18px", fontSize: 16, color: T.textSub, lineHeight: 1.7, maxWidth: 720 }}>
              Unsere kuratierten Smart-Fixes sind für 99 % aller WordPress-Installationen sicher —
              vom Solo-Blog bis zur Multi-Site-Agentur. Jedes Snippet kommt mit Sicherheits-Wrapper,
              klarem Einbau-Pfad und Rollback-Anleitung. Keine Werbung, keine Tracker, keine
              versteckten Calls.
            </p>

            {/* Schnell-Navigation als Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SNIPPETS.map(s => (
                <a
                  key={s.slug}
                  href={`#snippet-${s.slug}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: 12, fontWeight: 700, color: T.textSub,
                    padding: "6px 12px", borderRadius: 999,
                    background: T.glass,
                    border: `1px solid ${T.glassBorder}`,
                    textDecoration: "none",
                    fontFamily: T.mono,
                    letterSpacing: "0.01em",
                  }}
                >
                  <Search size={11} strokeWidth={2.4} style={{ opacity: 0.6 }} />
                  {s.title}
                </a>
              ))}
            </div>
          </header>

          {/* ── Win-Win Sektion: Stock-WP vs WebsiteFix-Enhanced ── */}
          <section style={{ marginBottom: 56 }}>
            <div style={{ textAlign: "center", marginBottom: 28, maxWidth: 720, marginInline: "auto" }}>
              <p style={{
                margin: "0 0 10px",
                fontSize: 11.5, fontWeight: 700, color: T.green,
                fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                // Power-Duo
              </p>
              <h2 style={{
                margin: "0 0 12px",
                fontSize: "clamp(22px, 3.4vw, 34px)", fontWeight: 800,
                color: T.text, letterSpacing: "-0.025em", lineHeight: 1.2,
              }}>
                WordPress + WebsiteFix ={" "}
                <span style={{ background: "linear-gradient(90deg,#4ade80,#22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  dein Performance-Powerhaus.
                </span>
              </h2>
              <p style={{ margin: 0, fontSize: 14.5, color: T.textSub, lineHeight: 1.7 }}>
                Weniger Plugins, mehr Kontrolle. Wir liefern den Code, du bleibst der Boss in deinem Backend.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {/* Links: Stock-WP — "unruhig" */}
              <div style={{
                padding: "20px 22px",
                background: "rgba(248,113,113,0.04)",
                border: "1px solid rgba(248,113,113,0.20)",
                borderRadius: 12,
                position: "relative",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 10.5, fontWeight: 800, color: "rgba(248,113,113,0.95)",
                  fontFamily: T.mono, letterSpacing: "0.06em", textTransform: "uppercase",
                  padding: "3px 9px", borderRadius: 999,
                  background: "rgba(248,113,113,0.10)",
                  border: "1px solid rgba(248,113,113,0.30)",
                  marginBottom: 12,
                }}>
                  <AlertTriangle size={11} strokeWidth={2.5} />
                  Standard-WP
                </div>
                <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
                  Stock-Installation, ungepatcht
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {[
                    { Icon: Layers, label: "Langsame Datenbank", detail: "wp_options autoloadet 50–200 MB pro Request" },
                    { Icon: Plug,   label: "Plugin-Overload",    detail: "5+ Performance-Plugins, die sich gegenseitig blockieren" },
                    { Icon: Eye,    label: "Blackbox-Fehler",    detail: "weiße Seite ohne Hinweis im Frontend" },
                  ].map((row, i) => (
                    <li key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 0",
                      borderTop: i === 0 ? "none" : `1px dashed ${T.border}`,
                    }}>
                      <row.Icon size={14} color="rgba(248,113,113,0.85)" strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.35 }}>
                          {row.label}
                        </div>
                        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2, lineHeight: 1.5 }}>
                          {row.detail}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rechts: WebsiteFix-Enhanced — "aufgeräumt" */}
              <div style={{
                padding: "20px 22px",
                background: "linear-gradient(135deg, rgba(74,222,128,0.10), rgba(34,197,94,0.04))",
                border: `1px solid ${T.greenBorder}`,
                borderRadius: 12,
                boxShadow: `0 24px 56px -32px rgba(74,222,128,0.35), inset 0 1px 0 rgba(255,255,255,0.05)`,
                position: "relative",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 10.5, fontWeight: 800, color: T.green,
                  fontFamily: T.mono, letterSpacing: "0.06em", textTransform: "uppercase",
                  padding: "3px 9px", borderRadius: 999,
                  background: T.greenBg,
                  border: `1px solid ${T.greenBorder}`,
                  marginBottom: 12,
                }}>
                  <ShieldCheck size={11} strokeWidth={2.5} />
                  WebsiteFix-Enhanced
                </div>
                <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
                  Schlanker Code, glasklare Diagnose
                </h3>
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {[
                    { Icon: Layers, label: "Schlanker Code",     detail: "5 kuratierte Snippets statt 5 Plugins — funktions.php-bereit" },
                    { Icon: Plug,   label: "Volle Kontrolle",    detail: "Auto-Safety-Check erkennt Plugin-Kollisionen vor dem Apply" },
                    { Icon: Eye,    label: "Glasklare Transparenz", detail: "Datei + Zeile + verursachendes Plugin im Audit-Report" },
                  ].map((row, i) => (
                    <li key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 0",
                      borderTop: i === 0 ? "none" : `1px dashed ${T.border}`,
                    }}>
                      <row.Icon size={14} color={T.green} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.35 }}>
                          {row.label}
                        </div>
                        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2, lineHeight: 1.5 }}>
                          {row.detail}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── Snippet-Cards ── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 56 }}>
            {SNIPPETS.map(s => (
              <SmartFixCard key={s.slug} snippet={s} />
            ))}
          </section>

          {/* ── Trust-Strip ── */}
          <section style={{
            padding: "20px 22px",
            background: T.glass,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: `1px solid ${T.glassBorder}`,
            borderRadius: 12,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            marginBottom: 36,
          }}>
            <p style={{
              margin: "0 0 10px",
              fontSize: 10.5, fontWeight: 800, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Was diese Library NICHT ist
            </p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.textSub, lineHeight: 1.85 }}>
              <li>Kein Plugin-Pitch — alle Snippets funktionieren standalone in deiner <code style={{ fontFamily: T.mono, color: T.green }}>functions.php</code>.</li>
              <li>Kein Mining für deine Daten — die Library ist statisch, kein Tracking pro Snippet-View.</li>
              <li>Kein generischer KI-Output — jedes Snippet ist hand-getestet auf Strato / IONOS / Hetzner / all-inkl / Webgo.</li>
              <li>Kein Versprechen, dass dies dein einzelnes Problem löst. Für eine zielgerichtete Diagnose deiner spezifischen Site → der 92-Punkt-Audit weiter unten.</li>
            </ul>
          </section>

          {/* ── Bridge-CTA zum Deep-Audit ── */}
          <section style={{
            padding: "28px 30px",
            background: "linear-gradient(135deg, rgba(74,222,128,0.10), rgba(34,197,94,0.04))",
            border: `1px solid ${T.greenBorder}`,
            borderRadius: 14,
            boxShadow: "0 24px 56px -28px rgba(74,222,128,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
            <p style={{
              margin: "0 0 8px",
              fontSize: 10.5, fontWeight: 800, color: T.green,
              fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              Willst du tiefer graben?
            </p>
            <h2 style={{
              margin: "0 0 10px",
              fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800,
              color: T.text, letterSpacing: "-0.02em", lineHeight: 1.25,
            }}>
              Starte den 92-Punkt Deep-Audit für deine spezifische Seite.
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 14.5, color: T.textSub, lineHeight: 1.7, maxWidth: 660 }}>
              Die Library deckt die häufigsten Pauschal-Optimierungen ab. Der Deep-Audit zeigt dir,
              welche davon für DEINE Site überhaupt relevant sind — plus die individuellen
              Befunde, die nur in deinem PHP-Error-Log, deiner Datenbank und deiner Plugin-
              Konfiguration stecken. Read-Only, kein Plugin nötig für den Start.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link href="/scan" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 22px",
                background: `linear-gradient(135deg, ${T.green}, ${T.greenDeep})`,
                color: "#06210f",
                fontSize: 14, fontWeight: 800,
                borderRadius: 9,
                textDecoration: "none",
                letterSpacing: "-0.005em",
                boxShadow: `0 8px 24px -8px ${T.green}`,
              }}>
                Deep-Audit jetzt starten
                <ArrowRight size={15} strokeWidth={2.6} />
              </Link>
              <Link href="/fuer-agenturen#pricing" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 22px",
                background: "rgba(255,255,255,0.04)",
                color: T.textSub,
                fontSize: 14, fontWeight: 700,
                borderRadius: 9,
                textDecoration: "none",
                border: `1px solid ${T.border}`,
              }}>
                Pricing ansehen
              </Link>
            </div>
          </section>

        </div>
      </main>

      <SiteFooter />
    </>
  );
}
