import Link from "next/link";

export const metadata = {
  title: "Beispiel-Bericht – WebsiteFix",
  description: "So sieht ein vollständiger WebsiteFix Audit-Bericht aus — mit KI-Diagnose, Fehlerprotokoll und Handlungsempfehlungen.",
};

const C = {
  page:        "#0b0c10",
  card:        "rgba(255,255,255,0.03)",
  cardSolid:   "#0f1623",
  border:      "rgba(255,255,255,0.07)",
  borderMid:   "rgba(255,255,255,0.11)",
  text:        "#ffffff",
  textSub:     "rgba(255,255,255,0.5)",
  textMuted:   "rgba(255,255,255,0.3)",
  blue:        "#007BFF",
  blueSoft:    "#7aa6ff",
  blueBg:      "rgba(0,123,255,0.08)",
  blueBorder:  "rgba(0,123,255,0.25)",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.08)",
  greenBorder: "rgba(74,222,128,0.22)",
  amber:       "#fbbf24",
  amberBg:     "rgba(251,191,36,0.08)",
  amberBorder: "rgba(251,191,36,0.22)",
  red:         "#f87171",
  redBg:       "rgba(239,68,68,0.08)",
  redBorder:   "rgba(239,68,68,0.22)",
  radius:      14,
  radiusSm:    8,
};

const SAMPLE_ISSUES = [
  {
    severity: "red" as const,
    title: "14 Bilder ohne Alt-Text",
    detail: "/uploads/hero-banner.jpg, /uploads/team-photo.jpg, +12 weitere",
    law: "BFSG § 4 · WCAG 2.1 SC 1.1.1",
    fix: `<!-- Vorher -->\n<img src="/uploads/hero-banner.jpg">\n\n<!-- Nachher -->\n<img src="/uploads/hero-banner.jpg"\n     alt="Teammitglieder vor dem Bürogebäude">`,
  },
  {
    severity: "red" as const,
    title: "Fehlende Meta-Description",
    detail: "/blog/online-marketing-tipps, /leistungen/seo",
    law: "SEO Best Practice · Google Search Central",
    fix: `<meta name="description"\n      content="Kurze, prägnante Beschreibung\n               der Seite (120–160 Zeichen)">`,
  },
  {
    severity: "yellow" as const,
    title: "H1-Tag fehlt auf 3 Seiten",
    detail: "/kontakt, /impressum, /datenschutz",
    law: "BFSG § 4 · WCAG 2.1 SC 1.3.1",
    fix: `<!-- Jede Seite braucht genau einen H1: -->\n<h1>Kontakt – Ihr Ansprechpartner</h1>`,
  },
  {
    severity: "yellow" as const,
    title: "Niedrige Lesbarkeit (Kontrast 2.8:1)",
    detail: "#9ca3af auf #ffffff — Mindest-Kontrast 4.5:1",
    law: "WCAG 2.1 SC 1.4.3 · BFSG",
    fix: `/* Vorher: */\ncolor: #9ca3af;\n\n/* Nachher (Kontrast 5.1:1): */\ncolor: #6b7280;`,
  },
  {
    severity: "green" as const,
    title: "SSL-Zertifikat aktiv",
    detail: "TLS 1.3 · Let's Encrypt · gültig bis 12.09.2025",
    law: "DSGVO Art. 32",
    fix: null,
  },
  {
    severity: "green" as const,
    title: "Sitemap vorhanden",
    detail: "/sitemap.xml · 47 URLs indexiert",
    law: "SEO Best Practice",
    fix: null,
  },
];

function SeverityDot({ s }: { s: "red"|"yellow"|"green" }) {
  const color = s === "red" ? C.red : s === "yellow" ? C.amber : C.green;
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />;
}

function IssueRow({ severity, title, detail, law, fix }: typeof SAMPLE_ISSUES[0]) {
  const bg     = severity === "red" ? C.redBg     : severity === "yellow" ? C.amberBg     : C.greenBg;
  const border = severity === "red" ? C.redBorder : severity === "yellow" ? C.amberBorder : C.greenBorder;
  const color  = severity === "red" ? C.red       : severity === "yellow" ? C.amber       : C.green;
  const label  = severity === "red" ? "Kritisch"  : severity === "yellow" ? "Warnung"     : "OK";

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radiusSm, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <SeverityDot s={severity} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
              background: bg, color, border: `1px solid ${border}`, letterSpacing: "0.05em" }}>
              {label}
            </span>
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: C.textSub, fontFamily: "monospace" }}>{detail}</p>
          <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{law}</p>
        </div>
      </div>
      {fix && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px", background: "rgba(255,255,255,0.015)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: "0.04em" }}>KI-FIX VERFÜGBAR</span>
          </div>
          <pre style={{ margin: 0, padding: "10px 12px", borderRadius: 6, background: "rgba(0,0,0,0.35)",
            border: `1px solid ${C.border}`, fontSize: 11.5, color: C.textSub,
            fontFamily: "'Fira Code', 'Cascadia Code', monospace", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {fix}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function SampleReportPage() {
  const redCount    = SAMPLE_ISSUES.filter(i => i.severity === "red").length;
  const yellowCount = SAMPLE_ISSUES.filter(i => i.severity === "yellow").length;
  const greenCount  = SAMPLE_ISSUES.filter(i => i.severity === "green").length;

  return (
    <main style={{
      minHeight: "100vh", background: C.page, padding: "40px 24px 80px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: C.text,
    }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10,
              padding: "4px 12px", borderRadius: 20,
              background: C.amberBg, border: `1px solid ${C.amberBorder}`,
              fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: "0.06em",
            }}>
              BEISPIEL-BERICHT
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em" }}>
              beispiel-kunde.de
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textSub }}>
              Gescannt am 14. Apr. 2025 · Website-Check · Basis
            </p>
          </div>
          <Link href="/dashboard/scans" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: C.radiusSm,
            background: C.blue, color: "#fff", fontSize: 13, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 2px 14px rgba(0,123,255,0.35)",
          }}>
            Eigene Seite scannen →
          </Link>
        </div>

        {/* Score summary bar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { count: redCount,    label: "Kritisch",  color: C.red,   bg: C.redBg,   border: C.redBorder },
            { count: yellowCount, label: "Warnungen", color: C.amber, bg: C.amberBg, border: C.amberBorder },
            { count: greenCount,  label: "Bestanden", color: C.green, bg: C.greenBg, border: C.greenBorder },
          ].map(({ count, label, color, bg, border }) => (
            <div key={label} style={{ flex: 1, minWidth: 120, padding: "16px 20px", borderRadius: C.radiusSm,
              background: bg, border: `1px solid ${border}`, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color, marginTop: 4, letterSpacing: "0.04em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* KI-Diagnose */}
        <div style={{ background: C.card, border: `1px solid ${C.borderMid}`, borderRadius: C.radius,
          padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blueSoft} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.blueSoft, letterSpacing: "0.06em" }}>KI-DIAGNOSE</span>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 14, color: C.textSub, lineHeight: 1.75 }}>
            Die Website <strong style={{ color: C.text }}>beispiel-kunde.de</strong> weist{" "}
            <strong style={{ color: C.red }}>2 kritische Probleme</strong> auf, die sofortigen Handlungsbedarf erfordern.
            Die fehlenden Alt-Texte auf 14 Bildern verstoßen gegen BFSG § 4 und WCAG 2.1 — ab dem 28.06.2025
            können Behörden Bußgelder verhängen.
          </p>
          <p style={{ margin: 0, fontSize: 14, color: C.textSub, lineHeight: 1.75 }}>
            Empfehlung: Alt-Texte und Meta-Descriptions sollten in dieser Woche ergänzt werden.
            Die H1-Struktur und Kontrastwerte sind mittelfristig anzupassen.
            SSL und Sitemap sind korrekt konfiguriert — gute Basis für weiteres SEO-Wachstum.
          </p>
        </div>

        {/* Protocol */}
        <h2 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Fehlerprotokoll
        </h2>
        {SAMPLE_ISSUES.map((issue, i) => (
          <IssueRow key={i} {...issue} />
        ))}

        {/* CTA banner */}
        <div style={{
          marginTop: 32, padding: "24px 28px", borderRadius: C.radius,
          background: "linear-gradient(135deg, rgba(0,123,255,0.12) 0%, rgba(122,166,255,0.07) 100%)",
          border: `1px solid ${C.blueBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.text }}>
              Bereit für deinen eigenen Bericht?
            </p>
            <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>
              Kostenlos scannen — keine Kreditkarte, kein Abo.
            </p>
          </div>
          <Link href="/scan" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 22px", borderRadius: C.radiusSm,
            background: C.blue, color: "#fff", fontSize: 14, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 2px 14px rgba(0,123,255,0.40)",
            whiteSpace: "nowrap",
          }}>
            Jetzt kostenlos scannen →
          </Link>
        </div>

        {/* Back link */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/dashboard/scans" style={{ fontSize: 13, color: C.textMuted, textDecoration: "none", fontWeight: 600 }}>
            ← Zurück zu Berichte
          </Link>
        </div>
      </div>
    </main>
  );
}
