import Link from "next/link";
import type { Metadata } from "next";
import BlogHeader from "../../components/blog-header";
import SiteFooter from "../../components/SiteFooter";
import {
  Activity,
  Database,
  Cpu,
  RefreshCcw,
  HeartPulse,
  ShieldCheck,
  Lock,
  Download,
  ArrowRight,
  Gauge,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "WebsiteFix Health Check — Free WordPress Plugin · 5 Metriken im Dashboard",
  description:
    "Kostenloses Read-Only-Plugin: TTFB, Heartbeat-API-Last, Datenbank-Bloat, PHP-Memory, Update-Backlog — direkt im WordPress-Dashboard. Keine Anmeldung, kein Schreibzugriff, DSGVO-konform.",
  alternates: { canonical: "https://website-fix.com/plugin/health-check" },
  openGraph: {
    title: "WebsiteFix Health Check — Free WordPress Plugin",
    description:
      "5 Kennzahlen, die zeigen wo dein Hoster bremst — direkt im WP-Dashboard. Read-Only, kostenlos, kein Account.",
    url: "https://website-fix.com/plugin/health-check",
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

const PLUGIN_VERSION = "0.4.1";
const WPORG_URL      = "https://wordpress.org/plugins/websitefix-health-check/";

const METRICS = [
  {
    icon:  Activity,
    title: "Server-Response (TTFB)",
    blurb: "Wie lange braucht dein Hoster für das erste Byte HTML? Werte > 800 ms sind Warnzeichen — überlasteter Host, zu kleiner Plan, oder ein Plugin frisst die ersten 500 ms.",
  },
  {
    icon:  HeartPulse,
    title: "Heartbeat-API-Last",
    blurb: "Die Heartbeat-API pingt seit 2013 alle 15 s admin-ajax.php — auf vielen Shared-Hostern der häufigste Grund für CPU-Throttling. Das Widget zeigt die effektive Frequenz inkl. aktiver Plugin-Modifikationen.",
  },
  {
    icon:  Database,
    title: "Datenbank-Größe & Top-Tabelle",
    blurb: "Eine WordPress-DB sollte selten > 100–200 MB sein. Bei 1.2 GB zeigt das Widget welche Tabelle schuld ist — meist wp_options mit Autoload-Bloat oder wp_postmeta mit verwaisten Einträgen.",
  },
  {
    icon:  Cpu,
    title: "PHP-Memory-Limit & Peak",
    blurb: "Dein Hoster gibt dir 128/256/512 MB — wie viel nutzt WordPress wirklich? Bei dauerhaft 85 %+ kommt das „Allowed memory size exhausted“ bei jedem Traffic-Peak.",
  },
  {
    icon:  RefreshCcw,
    title: "Update-Backlog",
    blurb: "Wie viele Updates hängen wirklich? Aufgeteilt nach kritisch (Core-Update oder 5+ ausstehende Plugins) und regulär. Sicherheits- und Performance-Schuld auf einen Blick.",
  },
] as const;

const TRUST = [
  {
    icon: Lock,
    title: "Read-Only",
    blurb: "Keine Schreibzugriffe auf Datenbank oder Dateisystem. Deaktiviert nichts, ändert nichts, sendet keine User-Daten.",
  },
  {
    icon: ShieldCheck,
    title: "DSGVO-konform",
    blurb: "Alle Werte werden lokal auf deinem Server erhoben. Einziger ausgehender Request: TTFB-Messung auf deine eigene Home-URL.",
  },
  {
    icon: Gauge,
    title: "Kein Account",
    blurb: "Plugin installieren, aktivieren, fertig. Kein Login, keine Anmeldung, keine Email-Wall vor den 5 Werten.",
  },
] as const;

export default function HealthCheckPluginPage() {
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
              <HeartPulse size={32} color={C.green} strokeWidth={2} />
            </div>

            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 10, fontWeight: 800,
              padding: "3px 12px", borderRadius: 999, marginBottom: 18,
              background: C.greenBg, color: C.green,
              border: `1px solid ${C.greenBorder}`,
              letterSpacing: "0.10em", textTransform: "uppercase",
            }}>
              Free Plugin · Read-Only · DSGVO-konform
            </span>

            <h1 style={{
              margin: "0 0 14px",
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: C.text,
            }}>
              WebsiteFix Health Check
            </h1>

            <p style={{
              margin: "0 0 12px",
              fontSize: 18,
              color: C.textSub,
              lineHeight: 1.55,
              maxWidth: 560,
              marginInline: "auto",
            }}>
              5 Kennzahlen direkt im WordPress-Dashboard, die zeigen{" "}
              <strong style={{ color: C.text }}>wo dein Hoster dich bremst</strong> —
              TTFB, Heartbeat, DB-Bloat, PHP-Memory, Update-Backlog.
            </p>

            <p style={{
              margin: "0 0 30px",
              fontSize: 13,
              color: C.textMuted,
              fontVariantNumeric: "tabular-nums",
            }}>
              Version {PLUGIN_VERSION} · WordPress 5.9+ · PHP 7.4+ · 60-Sek-Check
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
                href="/scan"
                style={{
                  padding: "13px 24px", borderRadius: 11,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.borderStr}`,
                  color: C.text, fontSize: 14.5, fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: 8,
                }}
              >
                Lieber online scannen
                <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Metrics-Section ──────────────────────────────────────────── */}
        <section style={{ padding: "56px 24px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <p style={{
                margin: "0 0 10px",
                fontSize: 11, fontWeight: 800,
                color: C.green,
                letterSpacing: "0.16em", textTransform: "uppercase",
              }}>
                Was du nach dem Aktivieren siehst
              </p>
              <h2 style={{
                margin: 0,
                fontSize: 28, fontWeight: 900,
                letterSpacing: "-0.02em",
                color: C.text,
              }}>
                Die 5 Werte, die zeigen wo dein Hoster bremst
              </h2>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 18,
            }}>
              {METRICS.map(({ icon: Icon, title, blurb }, i) => (
                <article key={title} style={{
                  background: C.cardSolid,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "22px 24px",
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
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
                      fontSize: 11, fontWeight: 700, color: C.textMuted,
                      fontFamily: C.mono, letterSpacing: "0.04em",
                    }}>
                      0{i + 1} / 05
                    </div>
                  </div>
                  <h3 style={{
                    margin: 0, fontSize: 16, fontWeight: 800,
                    color: C.text, letterSpacing: "-0.01em",
                  }}>
                    {title}
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
                Warum risikofrei
              </h2>
              <p style={{
                margin: 0, fontSize: 14.5, color: C.textSub, lineHeight: 1.6,
                maxWidth: 520, marginInline: "auto",
              }}>
                Du installierst kein Tool, das deine Site verändern kann — du installierst
                einen passiven Beobachter, der dir die richtigen Zahlen zeigt.
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

        {/* ── Next-Steps Cross-Links ───────────────────────────────────── */}
        <section style={{ padding: "64px 24px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <p style={{
                margin: "0 0 10px",
                fontSize: 11, fontWeight: 800,
                color: C.green,
                letterSpacing: "0.16em", textTransform: "uppercase",
              }}>
                Wenn die 5 Werte schlecht aussehen
              </p>
              <h2 style={{
                margin: 0,
                fontSize: 26, fontWeight: 900,
                letterSpacing: "-0.02em", color: C.text,
              }}>
                Was als nächstes
              </h2>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 18,
            }}>
              {/* Card 1 — Optimizer-Plugin */}
              <div style={{
                background: C.cardSolid,
                border: `1px solid ${C.greenBorder}`,
                borderRadius: 16,
                padding: "26px 28px",
                boxShadow: "0 12px 40px rgba(34,197,94,0.10)",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: C.greenBg,
                  border: `1px solid ${C.greenBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.green,
                }}>
                  <Zap size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <p style={{
                    margin: "0 0 6px",
                    fontSize: 11, fontWeight: 800, color: C.green,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                  }}>
                    Free Companion Plugin
                  </p>
                  <h3 style={{
                    margin: 0, fontSize: 18, fontWeight: 900,
                    color: C.text, letterSpacing: "-0.02em",
                  }}>
                    Auto-Fix mit dem One-Click Optimizer
                  </h3>
                </div>
                <p style={{
                  margin: 0, fontSize: 13.5, color: C.textSub, lineHeight: 1.65, flex: 1,
                }}>
                  Heartbeat zu hoch? jQuery-Migrate-Bloat? XML-RPC offen? Unser zweites Free-Plugin
                  fixt die <strong style={{ color: C.text }}>7 häufigsten WordPress-Performance-Killer</strong> mit
                  einem Klick — reversibel, hoster-aware, kein DB-Eingriff.
                </p>
                <Link
                  href="/plugin/optimizer"
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 9,
                    background: "linear-gradient(90deg,#16a34a,#22c55e)",
                    color: "#fff", fontSize: 13.5, fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 6px 18px rgba(34,197,94,0.28)",
                  }}
                >
                  Zum Optimizer-Plugin
                  <ArrowRight size={14} strokeWidth={2.4} />
                </Link>
              </div>

              {/* Card 2 — Deep-Audit */}
              <div style={{
                background: C.cardSolid,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "26px 28px",
                display: "flex", flexDirection: "column", gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.borderStr}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: C.text,
                }}>
                  <Gauge size={20} strokeWidth={2.2} />
                </div>
                <div>
                  <p style={{
                    margin: "0 0 6px",
                    fontSize: 11, fontWeight: 800, color: C.textMuted,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                  }}>
                    Online-Tool
                  </p>
                  <h3 style={{
                    margin: 0, fontSize: 18, fontWeight: 900,
                    color: C.text, letterSpacing: "-0.02em",
                  }}>
                    Tiefer-Audit mit 92 Parametern
                  </h3>
                </div>
                <p style={{
                  margin: 0, fontSize: 13.5, color: C.textSub, lineHeight: 1.65, flex: 1,
                }}>
                  Plugin zeigt dir <em>dass</em> bremst. Der WebsiteFix-Scan zeigt dir <em>warum</em> —
                  DB-Bloat tabellenweise, PHP-Error-Stacktraces, Hook-Chain-Konflikte, Slow-Query-Log,
                  Plugin-vs-Plugin-Priorität.
                </p>
                <Link
                  href="/scan"
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 9,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.borderStr}`,
                    color: C.text, fontSize: 13.5, fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Online-Scan starten
                  <ArrowRight size={14} strokeWidth={2.4} />
                </Link>
              </div>
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
                  nach <strong style={{ color: C.text }}>„WebsiteFix Health Check“</strong> suchen, installieren + aktivieren.
                </>,
                <>
                  Auf deine WordPress-Hauptseite (Dashboard) gehen — das Widget{" "}
                  <strong style={{ color: C.text }}>„WebsiteFix Health Check“</strong> erscheint
                  zwischen den Standard-Widgets.
                </>,
                <>
                  Die 5 Werte sind sofort da. Bei <strong style={{ color: C.text }}>Achtung</strong>-Markierungen
                  ziehst du dir entweder den{" "}
                  <Link href="/smart-fix-library" style={{ color: C.green, fontWeight: 700, textDecoration: "none" }}>
                    Smart-Fix-Library
                  </Link>
                  -Snippet, oder startest den{" "}
                  <Link href="/scan" style={{ color: C.green, fontWeight: 700, textDecoration: "none" }}>
                    Online-Scan
                  </Link>
                  {" "}für die 92-Punkt-Tiefe.
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
              websitefix-health-check.zip auf WordPress.org
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
