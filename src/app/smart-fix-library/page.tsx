import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
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
  title:       "WordPress Smart-Fix Library — geprüfte Snippets ohne Plugin | WebsiteFix",
  description: "5 kuratierte WordPress-Snippets für Heartbeat, XML-RPC, Emojis, Query-Strings und jQuery-Migrate. Copy-paste-ready, Safe-Mode geprüft, für alle Hoster.",
  alternates:  { canonical: "https://website-fix.com/smart-fix-library" },
  openGraph: {
    title:       "WordPress Smart-Fix Library | WebsiteFix",
    description: "5 geprüfte Universal-Snippets für Performance + Security. Ohne Plugin-Installation, copy-paste-ready.",
    url:         "https://website-fix.com/smart-fix-library",
    type:        "website",
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
