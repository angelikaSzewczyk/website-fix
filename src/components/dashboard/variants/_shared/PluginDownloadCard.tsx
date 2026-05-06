/**
 * PluginDownloadCard — Plan-aware Plugin-Download-Hinweis fürs Dashboard.
 *
 * Drei Render-Varianten:
 *   - Starter / Professional → Standard-Card "Plugin herunterladen", Read-Only-
 *     Sicherheits-Hinweis, Link auf /plugin (Coming-Soon-Page mit Mailto).
 *   - Agency Scale → "White-Label Plugin"-Variante: erwähnt Logo-Upload-
 *     Möglichkeit unter /dashboard/agency-branding, sodass das Plugin beim
 *     Endkunden mit dem Agentur-Branding läuft.
 *
 * Wird in StarterDashboard / ProDashboard / AgencyDashboard mit den
 * jeweiligen plan/agencyLogoUrl-Props gerendert.
 *
 * Server-Component (kein useState/useEffect) — kann direkt in Server-Pages
 * eingesetzt werden.
 */

import Link from "next/link";

type Props = {
  plan: string;
  /** Agency-only: wenn ein Logo gesetzt ist, zeigen wir "Branding aktiv ✓"
   *  als Trust-Signal. */
  agencyLogoUrl?: string | null;
};

const C = {
  bg:      "rgba(34,197,94,0.06)",
  border:  "rgba(34,197,94,0.30)",
  green:   "#22c55e",
  amber:   "#FBBF24",
  text:    "rgba(255,255,255,0.92)",
  textSub: "rgba(255,255,255,0.60)",
  textMuted: "rgba(255,255,255,0.42)",
  scale:   "#A78BFA",
  scaleBg: "rgba(167,139,250,0.10)",
  scaleBorder: "rgba(167,139,250,0.32)",
} as const;

export default function PluginDownloadCard({ plan, agencyLogoUrl }: Props) {
  const isAgency = plan === "agency";

  return (
    <section style={{
      padding: "20px 22px", borderRadius: 14,
      background: isAgency ? `linear-gradient(135deg, ${C.scaleBg}, ${C.bg})` : C.bg,
      border: `1px solid ${isAgency ? C.scaleBorder : C.border}`,
      display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
    }}>
      {/* Shield-Icon */}
      <div style={{
        width: 46, height: 46, borderRadius: 11, flexShrink: 0,
        background: isAgency ? "rgba(167,139,250,0.16)" : "rgba(34,197,94,0.14)",
        border:     `1px solid ${isAgency ? C.scaleBorder : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }} aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isAgency ? C.scale : C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>

      <div style={{ flex: "1 1 280px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: isAgency ? C.scale : C.green,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "2px 9px", borderRadius: 999,
            background: isAgency ? "rgba(167,139,250,0.16)" : "rgba(34,197,94,0.14)",
            border:     `1px solid ${isAgency ? C.scaleBorder : C.border}`,
          }}>
            {isAgency ? "White-Label Plugin" : "Read-Only Plugin"}
          </span>
          {isAgency && agencyLogoUrl && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: C.green,
              padding: "2px 8px", borderRadius: 999,
              background: "rgba(34,197,94,0.10)",
              border: `1px solid ${C.border}`,
            }}>
              ✓ Branding aktiv
            </span>
          )}
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
          {isAgency
            ? "WordPress-Plugin mit deinem Agentur-Branding"
            : "WordPress-Plugin für Deep-Insights ohne Passwort"}
        </h3>
        <p style={{ margin: 0, fontSize: 12.5, color: C.textSub, lineHeight: 1.6 }}>
          {isAgency ? (
            <>
              Installiere das Plugin auf Mandanten-Sites — es läuft unter <strong style={{ color: C.text }}>deinem Logo + Agentur-Domain</strong>.
              Endkunden sehen WebsiteFix nicht. Logo + Brand-Farbe konfigurierst du im{" "}
              <Link href="/dashboard/agency-branding" style={{ color: C.scale, textDecoration: "underline", textUnderlineOffset: 2 }}>
                Agency-Branding
              </Link>.
            </>
          ) : (
            <>
              Read-Only-Verbindung: kein Schreibzugriff, keine Passwörter, kein FTP. Liest PHP-Fehler, Plugin-Versionen und Datenbank-Health — Daten, die ein externer Crawler nie sieht.
            </>
          )}
        </p>
      </div>

      <Link href="/plugin" style={{
        flexShrink: 0,
        padding: "10px 22px", borderRadius: 10,
        background: isAgency
          ? "linear-gradient(90deg,#7C3AED,#A78BFA)"
          : "linear-gradient(90deg,#16A34A,#22c55e)",
        color: "#fff", fontSize: 13, fontWeight: 800,
        textDecoration: "none", whiteSpace: "nowrap",
        boxShadow: isAgency
          ? "0 4px 14px rgba(124,58,237,0.32)"
          : "0 4px 14px rgba(34,197,94,0.32)",
      }}>
        Plugin herunterladen →
      </Link>
    </section>
  );
}
