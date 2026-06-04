import Link from "next/link";
import type { Metadata } from "next";
import BlogHeader from "../../components/blog-header";
import SiteFooter from "../../components/SiteFooter";
import {
  Zap,
  HeartPulse,
  ShieldOff,
  Smile,
  Link2Off,
  UserX,
  EyeOff,
  Code2,
  ShieldCheck,
  Undo2,
  Download,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "WebsiteFix One-Click Performance Optimizer — Free WordPress Plugin · 7 Snippets",
  description:
    "7 WordPress-Performance-Killer mit einem Klick: Heartbeat drosseln, XML-RPC schließen, Emojis raus, Query-Strings clean, Author-Enumeration blocken, WP-Version verstecken, jQuery-Migrate weg. Free, reversibel.",
  alternates: { canonical: "https://website-fix.com/plugin/optimizer" },
  openGraph: {
    title: "WebsiteFix One-Click Performance Optimizer — Free WordPress Plugin",
    description:
      "7 Performance-Snippets in WordPress aktivierbar mit einem Klick. Reversibel, kein DB-Schreibzugriff, GPL v2.",
    url: "https://website-fix.com/plugin/optimizer",
    type: "website",
  },
};

const C = {
  bg:          "#0b0c10",
  card:        "rgba(255,255,255,0.03)",
  cardSolid:   "#0f1623",
  border:      "rgba(255,255,255,0.08)",
  borderStr:   "rgba(255,255,255,0.14)",
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.62)",
  textMuted:   "rgba(255,255,255,0.42)",
  green:       "#22C55E",
  greenSoft:   "#4ade80",
  greenBg:     "rgba(34,197,94,0.10)",
  greenBorder: "rgba(34,197,94,0.32)",
  amber:       "#FBBF24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberBorder: "rgba(251,191,36,0.30)",
  mono:        "ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

const PLUGIN_VERSION = "0.3.1";
const WPORG_URL      = "https://wordpress.org/plugins/websitefix-one-click-performance-optimizer/";

const SNIPPETS = [
  {
    icon:  HeartPulse,
    title: "Heartbeat-API drosseln",
    blurb: "Reduziert die WP-Heartbeat-Frequenz: 60 s im Admin, 120 s im Post-Editor (statt 15 s), Frontend praktisch aus. Senkt CPU-Last auf Shared-Hosts oft um 60–75 %.",
    metric: "CPU −60–75 %",
  },
  {
    icon:  ShieldOff,
    title: "XML-RPC & Pingbacks deaktivieren",
    blurb: "Schließt den XML-RPC-Endpoint (Brute-Force-Angriffsfläche) und schaltet Pingbacks ab. Erkennt aktives Jetpack/Wordfence/Sucuri und greift dann NICHT ein.",
    metric: "Angriffsfläche −1",
  },
  {
    icon:  Smile,
    title: "Emojis & oEmbed-Discovery entfernen",
    blurb: "Entfernt die WP-Emoji-Polyfill-Scripte (wp-emoji-release.min.js, ~14 KB) und die oEmbed-Auto-Discovery-Routen.",
    metric: "−14 KB pro Seite",
  },
  {
    icon:  Link2Off,
    title: "Query-Strings aus statischen Assets entfernen",
    blurb: "Strippt `?ver=…` aus CSS/JS-Pfaden. Proxy- und CDN-Caches können die Assets sauber cachen, statt jede Asset-URL als „neu“ zu behandeln.",
    metric: "Cache-Hit-Rate +",
  },
  {
    icon:  UserX,
    title: "Author-Enumeration blockieren",
    blurb: "Verhindert Username-Discovery via /?author=N oder /author/<name>/. Der bekannteste Brute-Force-Vorbereitungs-Trick wird ausgehebelt.",
    metric: "Brute-Force-Schutz",
  },
  {
    icon:  EyeOff,
    title: "WordPress-Version aus Frontend entfernen",
    blurb: "Entfernt den Generator-Tag im HTML-Head, im RSS-Feed und in Resource-URL-Versionierungen. Scanner sehen die WordPress-Version nicht mehr direkt.",
    metric: "Fingerprint −",
  },
  {
    icon:  Code2,
    title: "jQuery-Migrate aus dem Frontend entfernen",
    blurb: "Entfernt jquery-migrate.min.js (~11 KB) aus dem Frontend, lässt sie im Admin aber aktiv — alte Page-Builder-Backends funktionieren weiter.",
    metric: "−11 KB pro Seite",
  },
] as const;

const TRUST = [
  {
    icon: Undo2,
    title: "Komplett reversibel",
    blurb: "Jeder Snippet einzeln deaktivierbar. Beim Deaktivieren wird die zugehörige mu-plugin-Datei einfach gelöscht — WordPress-Standardverhalten ist sofort wieder aktiv.",
  },
  {
    icon: ShieldCheck,
    title: "Kein DB-Schreibzugriff",
    blurb: "Snippets liegen als einzelne PHP-Dateien unter /wp-content/mu-plugins/ — keine Optionen-Tabelle, keine Plugin-Settings, keine Datenbank-Migration.",
  },
  {
    icon: Sparkles,
    title: "Hoster-aware",
    blurb: "Snippets erkennen aktive Schutz-Plugins (Jetpack, Wordfence, Sucuri, WP Rocket, Heartbeat Control). Bei Konflikten greift der Snippet NICHT ein.",
  },
] as const;

export default function OptimizerPluginPage() {
  return (
    <>
      <BlogHeader active="none" lang="de" />

      <main style={{
        background: C.bg,
        color: C.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section style={{ padding: "72px 24px 56px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18, margin: "0 auto 22px",
              background: C.greenBg,
              border: `1.5px solid ${C.greenBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={32} color={C.green} strokeWidth={2} fill={C.greenBg} />
            </div>

            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 10, fontWeight: 800,
              padding: "3px 12px", borderRadius: 999, marginBottom: 18,
              background: C.greenBg, color: C.green,
              border: `1px solid ${C.greenBorder}`,
              letterSpacing: "0.10em", textTransform: "uppercase",
            }}>
              Free Plugin · Reversibel · Hoster-aware
            </span>

            <h1 style={{
              margin: "0 0 14px",
              fontSize: 38, fontWeight: 900,
              letterSpacing: "-0.03em", lineHeight: 1.1,
              color: C.text,
            }}>
              One-Click Performance Optimizer
            </h1>

            <p style={{
              margin: "0 0 12px",
              fontSize: 18, color: C.textSub, lineHeight: 1.55,
              maxWidth: 560, marginInline: "auto",
            }}>
              <strong style={{ color: C.text }}>7 WordPress-Performance-Killer</strong> mit
              einem Klick deaktivieren. Heartbeat-Last, XML-RPC, Emojis, Query-Strings,
              Author-Enum, WP-Version, jQuery-Migrate.
            </p>

            <p style={{
              margin: "0 0 30px",
              fontSize: 13, color: C.textMuted,
              fontVariantNumeric: "tabular-nums",
            }}>
              Version {PLUGIN_VERSION} · WordPress 5.9+ · PHP 7.4+ · GPL v2
            </p>

            <div style={{
              display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
            }}>
              <a
                href={WPORG_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "13px 24px", borderRadius: 11,
                  background: "linear-gradient(90deg,#16a34a,#22c55e)",
                  color: "#fff", fontSize: 14.5, fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 6px 20px rgba(34,197,94,0.32)",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                <Download size={18} strokeWidth={2.4} />
                Auf WordPress.org installieren
              </a>
              <Link
                href="/plugin/health-check"
                style={{
                  padding: "13px 24px", borderRadius: 11,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.borderStr}`,
                  color: C.text, fontSize: 14.5, fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                Erst diagnostizieren
                <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Snippets-Section ─────────────────────────────────────────── */}
        <section style={{ padding: "56px 24px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{
                margin: "0 0 10px",
                fontSize: 11, fontWeight: 800,
                color: C.green,
                letterSpacing: "0.16em", textTransform: "uppercase",
              }}>
                Die 7 Snippets
              </p>
              <h2 style={{
                margin: 0,
                fontSize: 28, fontWeight: 900,
                letterSpacing: "-0.02em", color: C.text,
              }}>
                Was du in der WordPress-Tools-Seite klickst
              </h2>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 18,
            }}>
              {SNIPPETS.map(({ icon: Icon, title, blurb, metric }, i) => (
                <article key={title} style={{
                  background: C.cardSolid,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "22px 24px",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12,
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: C.greenBg,
                      border: `1px solid ${C.greenBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: C.green,
                    }}>
                      <Icon size={18} strokeWidth={2.2} />
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: C.green,
                      fontFamily: C.mono, letterSpacing: "0.02em",
                      padding: "3px 8px", borderRadius: 6,
                      background: C.greenBg,
                      border: `1px solid ${C.greenBorder}`,
                      whiteSpace: "nowrap",
                    }}>
                      {metric}
                    </div>
                  </div>
                  <h3 style={{
                    margin: 0, fontSize: 15.5, fontWeight: 800,
                    color: C.text, letterSpacing: "-0.01em",
                  }}>
                    {i + 1}. {title}
                  </h3>
                  <p style={{
                    margin: 0, fontSize: 13.5, color: C.textSub, lineHeight: 1.65,
                  }}>
                    {blurb}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust-Strip ──────────────────────────────────────────────── */}
        <section style={{
          padding: "56px 24px",
          borderTop: `1px solid ${C.border}`,
          background: "rgba(255,255,255,0.015)",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{
                margin: "0 0 8px",
                fontSize: 24, fontWeight: 900,
                letterSpacing: "-0.02em", color: C.text,
              }}>
                Warum es safer ist als eine functions.php-Bastelei
              </h2>
              <p style={{
                margin: 0, fontSize: 14.5, color: C.textSub, lineHeight: 1.6,
                maxWidth: 520, marginInline: "auto",
              }}>
                Jeder Snippet ist isoliert, deaktivierbar und respektiert deine
                vorhandenen Plugins. Kein „mein Theme-Update überschreibt alle meine
                Anpassungen“-Problem.
              </p>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}>
              {TRUST.map(({ icon: Icon, title, blurb }) => (
                <div key={title} style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "20px 22px",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, marginBottom: 12,
                    background: C.greenBg,
                    border: `1px solid ${C.greenBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.green,
                  }}>
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <h3 style={{
                    margin: "0 0 6px", fontSize: 14.5, fontWeight: 800,
                    color: C.text, letterSpacing: "-0.01em",
                  }}>
                    {title}
                  </h3>
                  <p style={{
                    margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.6,
                  }}>
                    {blurb}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Health-Check Cross-Link ──────────────────────────────────── */}
        <section style={{ padding: "64px 24px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{
              background: C.cardSolid,
              border: `1px solid ${C.greenBorder}`,
              borderRadius: 18,
              padding: "32px 36px",
              boxShadow: "0 12px 40px rgba(34,197,94,0.10)",
              textAlign: "center",
            }}>
              <p style={{
                margin: "0 0 10px",
                fontSize: 11, fontWeight: 800,
                color: C.green,
                letterSpacing: "0.16em", textTransform: "uppercase",
              }}>
                Vor dem Optimieren — diagnostizieren
              </p>
              <h2 style={{
                margin: "0 0 14px",
                fontSize: 26, fontWeight: 900,
                letterSpacing: "-0.02em", color: C.text,
              }}>
                Erst messen mit dem Health Check
              </h2>
              <p style={{
                margin: "0 0 24px",
                fontSize: 14.5, color: C.textSub, lineHeight: 1.65,
                maxWidth: 520, marginInline: "auto",
              }}>
                Damit du weißt, welcher der 7 Snippets bei dir wirklich was bringt:
                aktiviere zuerst unseren Health Check (Read-Only, kostenlos), schau dir
                Heartbeat-Frequenz, DB-Größe und PHP-Memory an — und entscheide dann
                bewusst, welche Optimizer-Snippets du brauchst.
              </p>
              <Link
                href="/plugin/health-check"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "13px 26px", borderRadius: 11,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.borderStr}`,
                  color: C.text, fontSize: 14.5, fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Zum Health Check Plugin
                <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Install-Steps ────────────────────────────────────────────── */}
        <section style={{ padding: "56px 24px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{
              margin: "0 0 28px",
              fontSize: 22, fontWeight: 900,
              letterSpacing: "-0.02em", color: C.text,
              textAlign: "center",
            }}>
              Installation in 3 Schritten
            </h2>
            <ol style={{
              margin: 0, padding: 0, listStyle: "none",
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              {[
                <>
                  In deinem WP-Admin: <strong style={{ color: C.text }}>Plugins → Installieren</strong> öffnen,
                  nach <strong style={{ color: C.text }}>„WebsiteFix One-Click Performance Optimizer“</strong> suchen,
                  installieren + aktivieren.
                </>,
                <>
                  Im Admin-Menü unter <strong style={{ color: C.text }}>Werkzeuge → WebsiteFix Optimizer</strong>:
                  Liste der 7 Snippets mit Beschreibung + Aktivieren-Button.
                </>,
                <>
                  Pro Snippet entscheiden: <strong style={{ color: C.text }}>Fix aktivieren</strong> →
                  einzelne mu-plugin-Datei wird angelegt. <strong style={{ color: C.text }}>Fix deaktivieren</strong> →
                  Datei wird gelöscht, WordPress-Standardverhalten ist sofort wieder aktiv.
                </>,
              ].map((step, i) => (
                <li key={i} style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  display: "flex", gap: 14,
                  fontSize: 14, color: C.textSub, lineHeight: 1.65,
                }}>
                  <span style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                    background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                    color: C.green, fontWeight: 800, fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1 }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Footer-CTA ───────────────────────────────────────────────── */}
        <section style={{ padding: "48px 24px 72px", borderTop: `1px solid ${C.border}` }}>
          <div style={{
            maxWidth: 640, margin: "0 auto",
            textAlign: "center",
          }}>
            <a
              href={WPORG_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 22px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.borderStr}`,
                color: C.text, fontSize: 13.5, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <Download size={15} strokeWidth={2.4} />
              websitefix-one-click-performance-optimizer.zip auf WordPress.org
            </a>
            <p style={{
              margin: "18px 0 0",
              fontSize: 12, color: C.textMuted, lineHeight: 1.6,
            }}>
              Open Source · GPL v2 · Maintained by{" "}
              <Link href="/" style={{ color: C.textSub, textDecoration: "none", fontWeight: 700 }}>
                website-fix.com
              </Link>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
