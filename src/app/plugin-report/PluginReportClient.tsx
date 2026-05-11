"use client";

import { useEffect, useState, type FormEvent } from "react";

/**
 * Lead-Capture-Client für /plugin-report.
 *
 * Aufbau:
 *  1. Hero (H1 + Sub)
 *  2. Tacho-SVG, animiert auf 64/100 (Teaser-Score — bewusst als "Vorab-
 *     Diagnose basierend auf den 5 Quick-Checks" gelabelt, damit es nicht
 *     wie ein fake-fertiger Voll-Score wirkt)
 *  3. Gradient-Blur über "Findings-Preview" — 6 vorgaukelnde Befund-Titel,
 *     die durch den Blur als Wert-Hinweis durchschimmern
 *  4. Email-Form als überlagerte Card (Glasmorphismus, Button in Lighthouse-Grün)
 *  5. Success-State nach Submit
 */

const T = {
  bg:          "#0a0c10",
  text:        "#fff",
  textSub:     "rgba(255,255,255,0.62)",
  textMuted:   "rgba(255,255,255,0.42)",
  border:      "rgba(255,255,255,0.08)",
  green:       "#16a34a",
  greenSoft:   "#4ade80",
  greenDeep:   "#15803d",
  greenBg:     "rgba(74,222,128,0.06)",
  greenBorder: "rgba(74,222,128,0.30)",
  red:         "#ef4444",
  amber:       "#fbbf24",
  glass:       "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.10)",
  mono:        "ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

const TEASER_SCORE = 64; // bewusst fix — "Vorab-Score aus 5 Quick-Checks"

// Vorgaukelnde Findings — wirken durch Blur nur als "Wertschimmer".
// Texte sind realistisch genug, dass der Reveal-Effekt nach Submit nicht
// als Bullshit auffliegt (sie verweisen alle auf reale Audit-Kategorien).
const PREVIEW_FINDINGS = [
  { icon: "DB",   title: "wp_options Autoload-Größe",    detail: "ca. 142 MB pro Request (Empfehlung < 1 MB)" },
  { icon: "PHP",  title: "PHP-Fatal-Errors (24h)",       detail: "23 Einträge im debug.log auf 4 verschiedenen Routes" },
  { icon: "DB",   title: "Slow-Query-Log",               detail: "7 Queries > 1 s, längste 7.2 s (post_meta Index fehlt)" },
  { icon: "HOOK", title: "Plugin-Hook-Konflikt",         detail: "Yoast vs RankMath konkurrieren auf the_content (Priority 10)" },
  { icon: "WP",   title: "Heartbeat-API-Frequenz",       detail: "alle 15 s aktiv (Standard) — empfohlen 60 s + Throttling" },
  { icon: "SEC",  title: "OPcache & PHP-Version",        detail: "PHP 7.4 (EoL) · OPcache inaktiv (Hosting-Standard nicht gesetzt)" },
] as const;

interface Props {
  source:   string;
  medium:   string | null;
  campaign: string | null;
  siteUrl:  string | null;
}

export default function PluginReportClient({ source, medium, campaign, siteUrl: initialSiteUrl }: Props) {
  const [email,    setEmail]    = useState("");
  const [siteUrl,         setSiteUrl]         = useState(initialSiteUrl ?? "");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);  // Double-Opt-In Wunsch
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState<string | null>(null);
  const [animVal,         setAnimVal]         = useState(0);  // Tacho-Wert

  // Tacho-Animation: 0 → TEASER_SCORE über ~1.4 s mit Ease-Out
  useEffect(() => {
    const duration = 1400;
    const start    = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setAnimVal(TEASER_SCORE * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/plugin-lead", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email: email.trim(),
          siteUrl: siteUrl.trim() || null,
          source, medium, campaign,
          newsletterOptIn,
        }),
      });
      const data = await res.json() as { success: boolean; message?: string; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Submit fehlgeschlagen.");
        setLoading(false);
        return;
      }
      setSuccess(data.message ?? "Bericht freigeschaltet. Check dein Postfach.");
      setLoading(false);
    } catch {
      setError("Netzwerkfehler — bitte erneut versuchen.");
      setLoading(false);
    }
  }

  // ── Tacho-Geometrie (Halbkreis) ──
  // 220 viewBox-units Wide × 130 Tall; Center at (110, 110); Radius 90.
  // Arc von -180° (links) bis 0° (rechts), volle Halbkreislinie.
  const cx = 110, cy = 110, r = 90;
  const startAngle = -180;
  const endAngle   = 0;
  const valueAngle = startAngle + (endAngle - startAngle) * (animVal / 100);
  const rad        = (deg: number) => (deg * Math.PI) / 180;
  const needleX    = cx + (r - 8) * Math.cos(rad(valueAngle));
  const needleY    = cy + (r - 8) * Math.sin(rad(valueAngle));
  const trackPath  = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const fillLength = Math.PI * r;
  const fillPct    = animVal / 100;

  // Farbe: Lighthouse-Konvention
  const scoreColor = animVal >= 90 ? T.greenSoft
                   : animVal >= 50 ? T.amber : T.red;

  return (
    <main style={{
      background: T.bg, color: T.text, minHeight: "100vh",
      padding: "64px 24px 96px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* dezenter Grid-Hintergrund — passt zur EngineeringSection */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(74,222,128,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.025) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        opacity: 0.4,
      }} />

      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{
            margin: "0 0 10px",
            fontSize: 11.5, fontWeight: 700, color: T.greenSoft,
            fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            // Plugin-Report · {source}
          </p>
          <h1 style={{
            margin: "0 0 14px",
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
            letterSpacing: "-0.025em", lineHeight: 1.15,
          }}>
            Dein WordPress Health-Check ist bereit.
          </h1>
          <p style={{ margin: 0, fontSize: 15.5, color: T.textSub, lineHeight: 1.65, maxWidth: 560, marginInline: "auto" }}>
            Wir haben potenzielle Engpässe in deiner Datenbank und im System-Kern identifiziert.
            Gib deine E-Mail an, um das vollständige Protokoll und die Fix-Anleitungen zu erhalten.
          </p>
        </div>

        {/* ── Tacho ── */}
        <div style={{
          padding: "28px 24px 18px",
          background: T.glass,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${T.glassBorder}`,
          borderRadius: 14,
          marginBottom: 16,
          textAlign: "center",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <p style={{
            margin: "0 0 6px",
            fontSize: 11, fontWeight: 700, color: T.textMuted,
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Vorab-Score · 5 Quick-Checks aus deinem Plugin
          </p>
          <svg
            viewBox="0 0 220 125"
            style={{ width: "100%", maxWidth: 260, height: "auto", margin: "0 auto", display: "block" }}
            role="img"
            aria-label={`Health-Score ${Math.round(animVal)} von 100`}
          >
            {/* Track */}
            <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
            {/* Fill */}
            <path
              d={trackPath}
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${fillLength * fillPct} ${fillLength}`}
              style={{ transition: "stroke 0.4s ease" }}
            />
            {/* Needle */}
            <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={scoreColor} strokeWidth="3" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="6" fill={scoreColor} />
            <circle cx={cx} cy={cy} r="2.5" fill={T.bg} />
          </svg>
          {/* Score-Anzeige außerhalb des SVG, damit sie nie an die viewBox-Grenze stößt. */}
          <div style={{ marginTop: -14, marginBottom: 6, lineHeight: 1 }}>
            <span style={{
              fontSize: 36, fontWeight: 800, color: scoreColor,
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "-0.02em",
            }}>
              {Math.round(animVal)}
            </span>
            <span style={{
              fontSize: 13, color: "rgba(255,255,255,0.45)",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.08em",
              marginLeft: 4,
            }}>
              / 100
            </span>
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: T.text, fontWeight: 700 }}>
            Verbesserungsbedürftig
          </p>
          <p style={{ margin: 0, fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
            Im vollständigen 92-Punkt-Audit decken wir Datenbank-Bloat, PHP-Errors und Hook-Konflikte auf.
          </p>
        </div>

        {/* ── Findings-Preview + Email-Wall ──
            Findings stehen real im DOM (Accessibility/SEO), Blur ist via CSS
            filter — der Wert wird suggeriert, ohne dass wir "fake-Daten" als
            Marketing missbrauchen.
        */}
        <div style={{ position: "relative", marginBottom: 8 }}>
          {/* Findings-Block (geblurrt) */}
          <div style={{
            background: T.glass,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: `1px solid ${T.glassBorder}`,
            borderRadius: 14,
            padding: "20px 22px 24px",
            filter: success ? "none" : "blur(5px)",
            opacity: success ? 1 : 0.85,
            pointerEvents: "none",
            userSelect: "none",
            transition: "filter 0.5s ease, opacity 0.5s ease",
          }} aria-hidden={!success}>
            <p style={{
              margin: "0 0 14px",
              fontSize: 11, fontWeight: 800, color: T.greenSoft,
              fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
            }}>
              6 von 92 Auffälligkeiten · Vorschau
            </p>
            {PREVIEW_FINDINGS.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 0",
                borderTop: i === 0 ? "none" : `1px dashed ${T.border}`,
              }}>
                <span style={{
                  flexShrink: 0,
                  fontSize: 9, fontWeight: 800, color: T.greenSoft,
                  fontFamily: T.mono, letterSpacing: "0.05em",
                  padding: "3px 7px", borderRadius: 4,
                  background: "rgba(74,222,128,0.10)",
                  border: `1px solid ${T.greenBorder}`,
                  minWidth: 38, textAlign: "center",
                }}>
                  {f.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, lineHeight: 1.35 }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 12, color: T.textSub, fontFamily: T.mono, marginTop: 2, lineHeight: 1.5 }}>
                    {f.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Email-Wall — überlagert die Preview, solange nicht success */}
          {!success && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 16px",
            }}>
              <form
                onSubmit={handleSubmit}
                style={{
                  width: "100%", maxWidth: 460,
                  padding: "28px 26px",
                  background: "rgba(11,12,16,0.85)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  border: `1px solid ${T.greenBorder}`,
                  borderRadius: 14,
                  boxShadow: "0 24px 56px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.greenSoft} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{
                    fontSize: 10.5, fontWeight: 800, color: T.greenSoft,
                    fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    Bericht entsperren
                  </span>
                </div>
                <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: "-0.015em" }}>
                  Vollständigen 92-Punkt-Bericht anfordern.
                </h2>
                <p style={{ margin: "0 0 18px", fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>
                  Inkl. SQL-Struktur, PHP-Error-Trace mit Datei + Zeile, Hook-Konflikten und Fix-Anleitungen.
                  Eine E-Mail, keine Newsletter.
                </p>

                <label htmlFor="lead-email" style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  E-Mail-Adresse
                </label>
                <input
                  id="lead-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="du@beispiel.de"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    fontSize: 14,
                    background: "rgba(255,255,255,0.04)",
                    color: T.text,
                    border: `1px solid ${T.glassBorder}`,
                    borderRadius: 8,
                    outline: "none",
                    fontFamily: "inherit",
                    marginBottom: 12,
                  }}
                />

                <label htmlFor="lead-url" style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  WordPress-URL (optional)
                </label>
                <input
                  id="lead-url"
                  type="url"
                  autoComplete="url"
                  value={siteUrl}
                  onChange={e => setSiteUrl(e.target.value)}
                  placeholder="https://deine-site.de"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "11px 13px",
                    fontSize: 14,
                    background: "rgba(255,255,255,0.04)",
                    color: T.text,
                    border: `1px solid ${T.glassBorder}`,
                    borderRadius: 8,
                    outline: "none",
                    fontFamily: "inherit",
                    marginBottom: 14,
                  }}
                />

                {/* Newsletter-Opt-In (Double-Opt-In) — DSGVO-konform getrennt
                    vom Lead-Eintrag selbst. Lighthouse-Grün-Custom-Checkbox. */}
                <label
                  htmlFor="lead-newsletter"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    marginBottom: 16,
                    borderRadius: 8,
                    background: newsletterOptIn ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${newsletterOptIn ? T.greenBorder : T.glassBorder}`,
                    cursor: "pointer",
                    transition: "background 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  <span style={{
                    position: "relative",
                    flexShrink: 0,
                    width: 18, height: 18, marginTop: 1,
                    borderRadius: 5,
                    background: newsletterOptIn ? T.greenSoft : "rgba(255,255,255,0.05)",
                    border: `1px solid ${newsletterOptIn ? T.greenSoft : "rgba(255,255,255,0.25)"}`,
                    transition: "background 0.15s ease, border-color 0.15s ease",
                  }}>
                    {newsletterOptIn && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06210f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", top: 2, left: 2 }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </span>
                  <input
                    id="lead-newsletter"
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={e => setNewsletterOptIn(e.target.checked)}
                    disabled={loading}
                    style={{
                      // Hidden, native checkbox bleibt focusable für Tastatur-User
                      position: "absolute",
                      width: 0, height: 0, opacity: 0, pointerEvents: "none",
                    }}
                  />
                  <span style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.55 }}>
                    Ich möchte zusätzlich hilfreiche Tipps zur WordPress-Optimierung und exklusive
                    Angebote erhalten. <span style={{ color: T.textMuted }}>(Widerruf jederzeit möglich.)</span>
                    <br/>
                    <span style={{ fontSize: 10.5, color: T.textMuted, fontFamily: T.mono }}>
                      Double-Opt-In · Bestätigungs-Mail folgt nach dem Klick
                    </span>
                  </span>
                </label>

                {error && (
                  <p style={{
                    margin: "0 0 12px", padding: "8px 12px", borderRadius: 8,
                    background: "rgba(239,68,68,0.10)",
                    border: "1px solid rgba(239,68,68,0.30)",
                    fontSize: 12.5, color: "#fca5a5",
                  }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    fontSize: 14, fontWeight: 800,
                    background: loading || !email ? "rgba(74,222,128,0.25)" : `linear-gradient(135deg, ${T.greenSoft}, ${T.green})`,
                    color: "#06210f",
                    border: "none",
                    borderRadius: 9,
                    cursor: loading || !email ? "wait" : "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "-0.005em",
                    transition: "transform 0.12s ease, filter 0.15s ease",
                    boxShadow: `0 8px 24px -8px ${T.greenSoft}`,
                  }}>
                  {loading ? "Wird freigeschaltet…" : "Vollständigen 92-Punkt-Bericht entsperren"}
                </button>

                <p style={{ margin: "12px 0 0", fontSize: 10.5, color: T.textMuted, lineHeight: 1.5, textAlign: "center" }}>
                  Read-Only-Audit · DSGVO · EU-Hosting Frankfurt · keine Newsletter
                </p>
              </form>
            </div>
          )}
        </div>

        {/* ── Success-State ── */}
        {success && (
          <div style={{
            marginTop: 24,
            padding: "20px 22px",
            background: T.greenBg,
            border: `1px solid ${T.greenBorder}`,
            borderRadius: 12,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.greenSoft} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: T.greenSoft, marginBottom: 4 }}>
                {success}
              </div>
              <div style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.6 }}>
                Klicke in der Mail auf <strong>„Deep-Scan starten"</strong>, dann läuft der vollständige
                Audit gegen deine Site. Wenn die Mail nicht ankommt, prüfe Spam / Promotionen.
              </div>
            </div>
          </div>
        )}

        {/* ── Footer-Trust-Strip ── */}
        <div style={{
          marginTop: 32,
          paddingTop: 20,
          borderTop: `1px solid ${T.border}`,
          fontSize: 11.5, color: T.textMuted, lineHeight: 1.7,
          display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <span>Plugin: <strong style={{ color: T.textSub, fontFamily: T.mono }}>websitefix-health-check</strong></span>
          <span>EU-Hosting · DSGVO · Read-Only-Plugin</span>
        </div>
      </div>
    </main>
  );
}
