/**
 * HybridScanBanner — Status-Bar oben im Dashboard, die zwischen
 * "Oberflächen-Check aktiv" (kein Plugin) und "Full System Audit"
 * (Deep-Scan via Plugin) umschaltet.
 *
 * Zwei Render-Zustände:
 *   - external: gelbe Bar mit CTA "Plugin verbinden →"
 *   - deep:     grüne Bar mit "Full System Audit aktiv" + last-handshake-Hint
 *
 * Server-Component (kein useState/useEffect) — kann direkt in den Server-
 * Wrappern (Starter/Pro/Agency) gerendert werden.
 */

import Link from "next/link";

type Props = {
  pluginActive:    boolean;
  lastHandshakeAt: string | null;
  /** Zielroute des CTA. Default = /plugin (Setup-Anleitung). */
  href?: string;
};

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms  = Date.now() - new Date(iso).getTime();
  if (ms < 0)              return "gerade eben";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1)            return "gerade eben";
  if (mins < 60)           return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)            return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

export default function HybridScanBanner({ pluginActive, lastHandshakeAt, href = "/plugin" }: Props) {
  if (pluginActive) {
    return (
      <section
        data-testid="hybrid-scan-banner"
        data-mode="deep"
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "12px 18px", borderRadius: 12, marginBottom: 16,
          background: "linear-gradient(90deg, rgba(34,197,94,0.10), rgba(34,197,94,0.04))",
          border: "1px solid rgba(34,197,94,0.30)",
        }}
      >
        <div aria-hidden="true" style={{
          width: 32, height: 32, flexShrink: 0, borderRadius: 8,
          background: "rgba(34,197,94,0.16)", border: "1px solid rgba(34,197,94,0.32)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e"
               strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#22c55e",
                      textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Full System Audit aktiv
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.5 }}>
            Plugin-Handshake erkannt — alle Deep-Scan-Metriken freigeschaltet.
            <span style={{ color: "rgba(255,255,255,0.38)" }}> · Letzter Sync {formatRelative(lastHandshakeAt)}</span>
          </p>
        </div>
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 800,
          padding: "3px 10px", borderRadius: 999,
          background: "rgba(34,197,94,0.14)",
          border: "1px solid rgba(34,197,94,0.32)",
          color: "#22c55e", letterSpacing: "0.10em",
        }}>
          DEEP-SCAN
        </span>
      </section>
    );
  }

  return (
    <section
      data-testid="hybrid-scan-banner"
      data-mode="external"
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 18px", borderRadius: 12, marginBottom: 16,
        background: "linear-gradient(90deg, rgba(251,191,36,0.10), rgba(251,191,36,0.04))",
        border: "1px solid rgba(251,191,36,0.32)",
      }}
    >
      <div aria-hidden="true" style={{
        width: 32, height: 32, flexShrink: 0, borderRadius: 8,
        background: "rgba(251,191,36,0.14)", border: "1px solid rgba(251,191,36,0.30)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24"
             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fbbf24",
                    textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Oberflächen-Check aktiv
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.5 }}>
          Wir sehen deine Seite nur von außen. Installiere das Plugin für Deep-Insights —
          PHP-Logs, DB-Last, Memory-Limit und exakte Code-Zeilen-Diagnose.
        </p>
      </div>
      <Link href={href} style={{
        flexShrink: 0,
        padding: "8px 16px", borderRadius: 8,
        background: "linear-gradient(90deg,#16a34a,#22c55e)",
        color: "#fff", fontSize: 12.5, fontWeight: 800,
        textDecoration: "none", whiteSpace: "nowrap",
        boxShadow: "0 3px 12px rgba(34,197,94,0.32)",
      }}>
        Plugin verbinden →
      </Link>
    </section>
  );
}
