import type { Metadata } from "next";
import Link from "next/link";
import BlogHeader from "../../components/blog-header";
import SiteFooter from "../../components/SiteFooter";

/**
 * /plugin-report/bestaetigt — Landing nach Klick auf den
 * Newsletter-Confirmation-Link.
 *
 * Liest ?ok=1 oder ?error=<type> aus der URL und zeigt ein klares
 * Erfolgs- oder Fehler-Panel. Bewusst sehr schlank (Server-Component),
 * kein State, kein API-Call — die Bestätigung läuft komplett in
 * /api/plugin-lead/confirm, diese Page rendert nur das Outcome.
 *
 * noindex: Funnel-Endpoint, kein SEO-Wert.
 */
export const metadata: Metadata = {
  title:  "Newsletter-Bestätigung · WebsiteFix",
  robots: { index: false, follow: false },
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
  red:         "#ef4444",
  redBg:       "rgba(239,68,68,0.06)",
  redBorder:   "rgba(239,68,68,0.30)",
  glass:       "rgba(255,255,255,0.04)",
  glassBorder: "rgba(255,255,255,0.10)",
  mono:        "ui-monospace, Menlo, monospace",
} as const;

export default async function BestaetigtPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const sp      = await searchParams;
  const success = sp.ok === "1";
  const errorKind = sp.error ?? "";

  return (
    <>
      <BlogHeader active="none" lang="de" />
      <main style={{
        background: T.bg, color: T.text, minHeight: "100vh",
        padding: "96px 24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>

          {success ? (
            <div style={{
              padding: "28px 30px",
              background: "linear-gradient(135deg, rgba(74,222,128,0.10), rgba(34,197,94,0.04))",
              border: `1px solid ${T.greenBorder}`,
              borderRadius: 14,
              boxShadow: `0 24px 56px -28px rgba(74,222,128,0.30), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}>
              <p style={{
                margin: "0 0 8px",
                fontSize: 10.5, fontWeight: 800, color: T.green,
                fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Bestätigt · Double-Opt-In abgeschlossen
              </p>
              <h1 style={{
                margin: "0 0 12px",
                fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800,
                color: T.text, letterSpacing: "-0.02em", lineHeight: 1.25,
              }}>
                Vielen Dank — deine Anmeldung ist aktiv.
              </h1>
              <p style={{ margin: "0 0 18px", fontSize: 14.5, color: T.textSub, lineHeight: 1.7 }}>
                Du bekommst ab sofort unsere kuratierten WordPress-Optimierungs-Tipps. Maximal
                ein bis zwei Mails pro Monat, kein Re-Sale deiner Adresse. Widerruf jederzeit
                per Antwort auf eine unserer Mails oder über{" "}
                <a href="mailto:support@website-fix.com" style={{ color: T.green, textDecoration: "none" }}>
                  support@website-fix.com
                </a>.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href="/scan" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 20px",
                  background: `linear-gradient(135deg, ${T.green}, ${T.greenDeep})`,
                  color: "#06210f",
                  fontSize: 13.5, fontWeight: 800,
                  borderRadius: 9,
                  textDecoration: "none",
                  boxShadow: `0 8px 24px -8px ${T.green}`,
                }}>
                  Deep-Audit jetzt starten →
                </Link>
                <Link href="/smart-fix-library" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 20px",
                  background: T.glass,
                  color: T.textSub,
                  fontSize: 13.5, fontWeight: 700,
                  borderRadius: 9,
                  textDecoration: "none",
                  border: `1px solid ${T.glassBorder}`,
                }}>
                  Smart-Fix-Library ansehen
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              padding: "28px 30px",
              background: T.redBg,
              border: `1px solid ${T.redBorder}`,
              borderRadius: 14,
            }}>
              <p style={{
                margin: "0 0 8px",
                fontSize: 10.5, fontWeight: 800, color: "#fca5a5",
                fontFamily: T.mono, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Bestätigung fehlgeschlagen
              </p>
              <h1 style={{
                margin: "0 0 12px",
                fontSize: "clamp(20px, 2.8vw, 26px)", fontWeight: 800,
                color: T.text, letterSpacing: "-0.02em", lineHeight: 1.3,
              }}>
                {errorKind === "server"
                  ? "Technischer Fehler beim Bestätigen."
                  : "Dieser Bestätigungs-Link ist ungültig oder bereits verbraucht."}
              </h1>
              <p style={{ margin: "0 0 16px", fontSize: 14, color: T.textSub, lineHeight: 1.7 }}>
                {errorKind === "server"
                  ? "Bitte versuche es in ein paar Minuten erneut. Falls das Problem bestehen bleibt, schreib uns kurz."
                  : "Mögliche Ursachen: du hast schon einmal bestätigt, oder der Link wurde verändert. Bei Unsicherheit melde dich unter "}
                {errorKind !== "server" && (
                  <a href="mailto:support@website-fix.com" style={{ color: T.green, textDecoration: "none" }}>
                    support@website-fix.com
                  </a>
                )}
                {errorKind !== "server" && "."}
              </p>
              <Link href="/plugin-report" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 18px",
                background: T.glass,
                color: T.textSub,
                fontSize: 13, fontWeight: 700,
                borderRadius: 9,
                textDecoration: "none",
                border: `1px solid ${T.glassBorder}`,
              }}>
                ← Zurück zum Plugin-Report
              </Link>
            </div>
          )}

        </div>
      </main>
      <SiteFooter />
    </>
  );
}
