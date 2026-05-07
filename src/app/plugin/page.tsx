import Link from "next/link";

export const metadata = {
  title: "WebsiteFix Connector-Plugin – Download",
  description: "Verbinde deine WordPress-Seite sicher mit dem WebsiteFix Dashboard. ZIP-Download v1.2.1 mit Deep-Scan-Handshake.",
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
  greenBg:     "rgba(34,197,94,0.10)",
  greenBorder: "rgba(34,197,94,0.32)",
  amber:       "#FBBF24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberBorder: "rgba(251,191,36,0.30)",
} as const;

const PLUGIN_VERSION = "1.2.1";
const ZIP_HREF       = "/downloads/websitefix-connector.zip";
const PHP_HREF       = "/downloads/plugin/website-exzellenz-connector.php";
const README_HREF    = "/downloads/plugin/readme.txt";

export default function PluginPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      padding: "56px 24px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
            background: C.greenBg,
            border: `1.5px solid ${C.greenBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 10, fontWeight: 800,
            padding: "3px 12px", borderRadius: 999, marginBottom: 16,
            background: C.greenBg, color: C.green,
            border: `1px solid ${C.greenBorder}`,
            letterSpacing: "0.10em", textTransform: "uppercase",
          }}>
            Read-Only · Sicher · DSGVO-konform
          </span>
          <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", color: C.text }}>
            WebsiteFix Connector
          </h1>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>
            Version {PLUGIN_VERSION} · WordPress 5.9+ · PHP 7.4+
          </p>
          <p style={{ margin: 0, fontSize: 14.5, color: C.textSub, lineHeight: 1.65, maxWidth: 480, marginInline: "auto" }}>
            Schaltet den Deep-Scan in deinem Dashboard frei. Das Plugin liest PHP-Logs,
            Plugin-Konflikte und Datenbank-Status — Read-Only, kein Schreibzugriff.
          </p>
        </div>

        {/* Primary download card */}
        <div style={{
          background: C.cardSolid,
          border: `1px solid ${C.greenBorder}`,
          borderRadius: 18,
          padding: "26px 28px",
          marginBottom: 18,
          boxShadow: "0 12px 40px rgba(34,197,94,0.10)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: C.greenBg, border: `1px solid ${C.greenBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.green,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
                ZIP-Download für WordPress
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
                Direkt im WP-Backend hochladbar
              </p>
            </div>
          </div>

          <a
            href={ZIP_HREF}
            download
            style={{
              display: "block", textAlign: "center",
              padding: "13px 24px", borderRadius: 11,
              background: "linear-gradient(90deg,#16a34a,#22c55e)",
              color: "#fff", fontSize: 14.5, fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(34,197,94,0.35)",
              marginBottom: 12,
            }}
          >
            websitefix-connector-{PLUGIN_VERSION}.zip ↓
          </a>

          {/* Setup-Steps */}
          <ol style={{ margin: "8px 0 0", padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              <>WordPress-Backend → <strong style={{ color: C.text }}>Plugins → Installieren</strong> → <strong style={{ color: C.text }}>Plugin hochladen</strong> → ZIP wählen → installieren.</>,
              <>Aktiviere das Plugin über die Plugin-Liste.</>,
              <>Gehe zu <strong style={{ color: C.text }}>Einstellungen → Website Exzellenz</strong>, kopiere deinen API-Key aus dem <Link href="/dashboard/integrations" style={{ color: C.green, textDecoration: "none", fontWeight: 700 }}>WebsiteFix-Dashboard</Link>, einfügen, <em>"Speichern &amp; verbinden"</em>.</>,
              <>Dashboard refreshen — Banner kippt von gelb auf <strong style={{ color: C.green }}>"Full System Audit aktiv"</strong>.</>,
            ].map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: C.textSub, lineHeight: 1.65 }}>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Alternative: Direct PHP for FTP install */}
        <details style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 18,
        }}>
          <summary style={{
            cursor: "pointer", fontSize: 13, fontWeight: 700, color: C.textSub,
            listStyle: "none",
          }}>
            Alternative: Plugin via FTP installieren →
          </summary>
          <div style={{ paddingTop: 14, fontSize: 12.5, color: C.textSub, lineHeight: 1.7 }}>
            <p style={{ margin: "0 0 10px" }}>
              Wenn dein Hoster den ZIP-Upload blockiert, kannst du die Datei direkt per FTP/SFTP hochladen.
              Erstelle den Ordner <code style={{ background: "rgba(0,0,0,0.32)", padding: "1px 6px", borderRadius: 4, fontSize: 11.5 }}>/wp-content/plugins/websitefix-connector/</code> und
              lade beide Dateien hinein:
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <a href={PHP_HREF} download style={{
                fontSize: 11.5, padding: "6px 12px", borderRadius: 7,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.borderStr}`,
                color: C.text, textDecoration: "none", fontFamily: "monospace",
              }}>
                website-exzellenz-connector.php ↓
              </a>
              <a href={README_HREF} download style={{
                fontSize: 11.5, padding: "6px 12px", borderRadius: 7,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.borderStr}`,
                color: C.text, textDecoration: "none", fontFamily: "monospace",
              }}>
                readme.txt ↓
              </a>
            </div>
          </div>
        </details>

        {/* Security note */}
        <div style={{
          background: C.amberBg,
          border: `1px solid ${C.amberBorder}`,
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 26,
          display: "flex", gap: 12,
        }}>
          <span style={{ flexShrink: 0, color: C.amber, fontSize: 16, lineHeight: 1.4 }}>🔒</span>
          <p style={{ margin: 0, fontSize: 12.5, color: C.textSub, lineHeight: 1.6 }}>
            Das Plugin ist <strong style={{ color: C.text }}>Read-Only</strong>: kein Schreibzugriff
            auf deine Datenbank, kein Passwort-Sharing, keine FTP-Aktion. Es liest nur Status-Werte
            (PHP-Version, Memory-Limit, Plugin-Liste, Log-Errors) und sendet sie via TLS an dein Dashboard.
            Keine personenbezogenen Daten, keine Inhalte deiner Seiten.
          </p>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center" }}>
          <Link href="/dashboard" style={{
            fontSize: 13, color: C.textMuted, textDecoration: "none", fontWeight: 600,
          }}>
            ← Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
