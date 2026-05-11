/**
 * FounderPledge — "Mein Versprechen" als Pre-Launch-Ersatz für Testimonials.
 *
 * In der Pre-Launch-Phase ohne echte Customer-Quotes wäre jedes
 * Stock-Testimonial rechtlich (UWG § 5) und strategisch problematisch.
 * Stattdessen: ein direktes, unterschriebenes Founder-Statement mit drei
 * konkreten, überprüfbaren Versprechen. Trust durch Transparenz, nicht
 * durch erfundene Social-Proof.
 *
 * Sobald echte Kunden + Bewertungen vorhanden sind (WP-org-Listing +
 * erste 30 Pro-Kunden), kann diese Section um Real-Testimonials erweitert
 * werden — dieser Block bleibt aber als Founder-Anker bestehen.
 */

import { ShieldCheck, AlertTriangle, MapPin, Mail } from "lucide-react";

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
  amberBg:     "rgba(251,191,36,0.06)",
  amberBorder: "rgba(251,191,36,0.25)",
  mono:        "ui-monospace, 'SF Mono', Menlo, monospace",
} as const;

const PROMISES = [
  {
    num:    "01",
    Icon:   AlertTriangle,
    title:  "Ehrlichkeit über Limits",
    body:   "Wenn ein Problem den Rahmen unseres Audits sprengt — wir sagen es. Wir verkaufen dir keinen Pro-Plan, wenn ein Profi-Debugger oder eine Entwickler-Stunde der richtige Weg wäre. Das schreibt der Audit-Report dann konkret hin.",
  },
  {
    num:    "02",
    Icon:   ShieldCheck,
    title:  "Read-Only, immer",
    body:   "Das Plugin schreibt nichts auf deinen Server, ohne dass du es explizit auslöst. Der Code-Pfad ist überprüfbar — wir zeigen ihn auf Anfrage. Auto-Fixes laufen ausschließlich nach deinem Klick im Dashboard.",
  },
  {
    num:    "03",
    Icon:   MapPin,
    title:  "EU-First, ohne Verstecken",
    body:   "Daten in Frankfurt, AVV-Vorlage auf Klick im Account, keine Dark-Pattern-Newsletter-Anmeldungen. Wenn dir EU-Hosting egal ist: auch okay. Wenn nicht: das ist unser Kernpunkt, nicht ein Marketing-Sticker.",
  },
] as const;

const NOT_PROMISED = [
  "Magie. Manche Probleme brauchen wirklich einen Entwickler — wir sagen dir konkret, was zu tun ist.",
  "Garantierte Google-Top-10. Wir sind Technik-Diagnostik, nicht SEO-Agentur. Wir liefern die technische Basis, nicht das Ranking.",
  "Backup-Service oder Update-Management. Dafür gibt es spezialisierte Tools (UpdraftPlus, BlogVault). Wir bündeln nicht künstlich.",
];

export default function FounderPledge() {
  return (
    <section style={{
      padding: "96px 24px",
      background: "#0a0c10",
      borderTop: `1px solid ${T.border}`,
      position: "relative",
      overflow: "hidden",
    }}>
      <div aria-hidden style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(74,222,128,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.022) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        opacity: 0.5,
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: 920, margin: "0 auto", position: "relative" }}>

        {/* ── Hero ── */}
        <div style={{ textAlign: "center", maxWidth: 720, marginInline: "auto", marginBottom: 44 }}>
          <p style={{
            margin: "0 0 10px",
            fontSize: 11.5, fontWeight: 700, color: T.green,
            fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            // Mein Versprechen
          </p>
          <h2 style={{
            margin: "0 0 14px",
            fontSize: "clamp(26px, 3.4vw, 40px)", fontWeight: 800,
            color: T.text, letterSpacing: "-0.025em", lineHeight: 1.15,
          }}>
            Drei Dinge, die ich dir zusichere.
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: T.textSub, lineHeight: 1.7 }}>
            WebsiteFix ist pre-launch — es gibt noch keine Stock-Testimonials und keine erfundenen
            5-Sterne-Sprechblasen. Stattdessen ein direktes Statement von mir als Frontend-Developerin,
            die das Tool gebaut hat. Drei Versprechen, die überprüfbar sind. Wenn ich sie breche, schreib mir.
          </p>
        </div>

        {/* ── 3 Versprechen als Glas-Cards ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginBottom: 36,
        }}>
          {PROMISES.map(p => {
            const Icon = p.Icon;
            return (
              <div key={p.num} style={{
                padding: "22px 22px",
                background: T.glass,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: `1px solid ${T.glassBorder}`,
                borderRadius: 12,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    flexShrink: 0,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: 9,
                    background: T.greenBg,
                    border: `1px solid ${T.greenBorder}`,
                  }}>
                    <Icon size={17} color={T.green} strokeWidth={2} />
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: T.green,
                    fontFamily: T.mono, letterSpacing: "0.08em",
                  }}>
                    {p.num}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                  {p.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13.5, color: T.textSub, lineHeight: 1.65 }}>
                  {p.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── "Was wir NICHT versprechen" ── */}
        <div style={{
          padding: "22px 26px",
          background: T.amberBg,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: `1px solid ${T.amberBorder}`,
          borderRadius: 12,
          marginBottom: 32,
        }}>
          <p style={{
            margin: "0 0 12px",
            fontSize: 10.5, fontWeight: 800, color: T.amber,
            fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Und was wir explizit NICHT versprechen
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, color: T.textSub, lineHeight: 1.85 }}>
            {NOT_PROMISED.map((line, i) => (
              <li key={i} style={{ marginBottom: i < NOT_PROMISED.length - 1 ? 4 : 0 }}>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Signatur-Block ── */}
        <div style={{
          padding: "22px 26px",
          background: "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(34,197,94,0.02))",
          border: `1px solid ${T.greenBorder}`,
          borderRadius: 12,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
          display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
        }}>
          <div style={{
            flexShrink: 0,
            width: 56, height: 56, borderRadius: "50%",
            background: T.greenBg,
            border: `1px solid ${T.greenBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: T.mono, fontSize: 20, fontWeight: 800,
            color: T.green,
            letterSpacing: "-0.02em",
          }}>
            AS
          </div>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
              Angelika Szewczyk
            </div>
            <div style={{ fontSize: 12.5, color: T.textSub, marginTop: 2, fontFamily: T.mono }}>
              Frontend-Developer · Gründerin
            </div>
            <a href="mailto:angelika@website-fix.com" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, color: T.green,
              marginTop: 8, textDecoration: "none",
              fontFamily: T.mono,
            }}>
              <Mail size={12} strokeWidth={2.2} />
              angelika@website-fix.com
            </a>
          </div>
          <p style={{ margin: 0, flex: "1 1 200px", fontSize: 12.5, color: T.textMuted, lineHeight: 1.6, fontStyle: "italic" }}>
            „Wenn ich diese Versprechen breche — schreib mir direkt. Ich antworte persönlich."
          </p>
        </div>

      </div>
    </section>
  );
}
