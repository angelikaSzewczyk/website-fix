import Link from "next/link";

export const metadata = {
  title: "WebsiteFix Connector-Plugin – Download",
  description: "Verbinde deine WordPress-Seite sicher mit dem WebsiteFix Dashboard.",
};

const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  shadow:      "0 1px 4px rgba(0,0,0,0.07)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenBorder: "#A7F3D0",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  divider:     "#F1F5F9",
};

export default function PluginPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>

        {/* Shield icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 24px",
          background: C.greenBg,
          border: `1.5px solid ${C.greenBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>

        {/* Badge */}
        <div style={{ marginBottom: 20 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 20,
            background: C.greenBg, color: C.green, border: `1.5px solid ${C.greenBorder}`,
            letterSpacing: "0.08em",
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            READ-ONLY SCHUTZ AKTIV
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
          WebsiteFix Connector-Plugin
        </h1>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: C.textMuted, fontWeight: 600 }}>
          Version 0.9.1 Beta · WordPress 5.0+
        </p>

        <p style={{ margin: "0 0 32px", fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>
          Das Plugin verbindet deine Seite sicher mit unserem Dashboard.
          Korrekturen (wie Alt-Texte) werden erst nach deiner Freigabe synchronisiert.
        </p>

        {/* Coming soon card */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          boxShadow: C.shadow,
          padding: "32px 28px",
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔧</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
            Download in Kürze verfügbar
          </h2>
          <p style={{ margin: "0 0 24px", fontSize: 13.5, color: C.textSub, lineHeight: 1.65 }}>
            Wir stellen das Plugin gerade fertig. Du erhältst eine E-Mail mit dem
            Download-Link, sobald es bereit ist — in der Regel innerhalb von 24&nbsp;Stunden
            nach deinem Kauf.
          </p>

          {/* Feature list */}
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {[
              ["Sichere Verbindung", "AES-256-verschlüsselt, nur Lesezugriff ohne Freigabe"],
              ["Automatische Synchronisation", "Alt-Texte, Meta-Tags und Redirects auf Knopfdruck"],
              ["Rollback jederzeit", "Jede Änderung ist in der Änderungshistorie protokolliert"],
              ["DSGVO-konform", "Keine externen Server – direkte Verbindung zu deinem Dashboard"],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "flex", gap: 10 }}>
                <span style={{ color: C.green, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6 }}>
                  <strong style={{ color: C.text }}>{title}:</strong> {desc}
                </span>
              </div>
            ))}
          </div>

          <a href="mailto:support@website-fix.com?subject=Plugin-Download%20anfragen" style={{
            display: "block",
            padding: "12px 0",
            borderRadius: 10,
            fontSize: 14, fontWeight: 700,
            background: C.green, color: "#fff",
            textDecoration: "none",
            boxShadow: "0 3px 10px rgba(22,163,74,0.30)",
          }}>
            Plugin jetzt per E-Mail anfordern →
          </a>
        </div>

        {/* Back link */}
        <Link href="/dashboard" style={{
          fontSize: 13, color: C.textMuted, textDecoration: "none", fontWeight: 600,
        }}>
          ← Zurück zum Dashboard
        </Link>
      </div>
    </main>
  );
}
