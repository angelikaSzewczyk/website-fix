/**
 * MetricPillBar — Site-Wide-Metrics aus dem Aggregator (Phase A2/A3).
 *
 * Rendert TTFB, WCAG-Heuristik und (optional) SSL-Status als Pills.
 * Wird von allen Plan-Variants genutzt; Größe via `size`-Prop:
 *   - "sm"  Default; kompakt für Pro/Agency-Dashboards.
 *   - "lg"  Doppelt so groß; Hauptprominenz für Starter (Daten-Fokus).
 *
 * Render-Gate: wenn weder TTFB noch WCAG-Score noch SSL-Daten gegeben sind,
 * rendert der Bar nichts (return null) — Legacy-Scans ohne meta_json
 * sehen die Bar nicht. Konsistent zum bisherigen Verhalten.
 */

type Size = "sm" | "lg";

type Props = {
  avgTtfbMs?:          number | null;
  wcagHeuristicScore?: number | null;
  wcagHeuristicLabel?: string | null;
  /** Optional: SSL-Cert-Ablauf in Tagen. Wenn gesetzt, rendert eine SSL-Pill. */
  sslDaysLeft?:        number | null;
  size?:               Size;
};

const SIZE = {
  sm: {
    barPad:  "12px 18px",
    barGap:  10,
    pillPad: "5px 12px",
    pillGap: 7,
    label:   10,
    value:   13,
    sub:     10,
    radius:  20,
  },
  lg: {
    barPad:  "20px 26px",
    barGap:  16,
    pillPad: "12px 22px",
    pillGap: 11,
    label:   12,
    value:   20,
    sub:     11,
    radius:  28,
  },
} as const;

function ttfbColor(ms: number) {
  return ms < 200 ? "#4ade80" : ms < 600 ? "#fbbf24" : "#f87171";
}
function ttfbBg(ms: number) {
  return ms < 200 ? "rgba(34,197,94,0.10)"
       : ms < 600 ? "rgba(251,191,36,0.10)"
       :            "rgba(248,113,113,0.10)";
}
function ttfbBorder(ms: number) {
  return ms < 200 ? "rgba(34,197,94,0.30)"
       : ms < 600 ? "rgba(251,191,36,0.30)"
       :            "rgba(248,113,113,0.30)";
}
function wcagColor(score: number) {
  return score >= 80 ? "#4ade80" : score >= 60 ? "#fbbf24" : "#f87171";
}
function sslColor(days: number) {
  if (days < 0)  return "#f87171"; // expired
  if (days <= 7) return "#f87171";
  if (days <= 14) return "#fbbf24";
  return "#4ade80";
}
function sslBg(days: number) {
  return days <= 14 || days < 0 ? "rgba(248,113,113,0.10)" : "rgba(34,197,94,0.10)";
}
function sslBorder(days: number) {
  return days <= 14 || days < 0 ? "rgba(248,113,113,0.30)" : "rgba(34,197,94,0.30)";
}

export default function MetricPillBar({
  avgTtfbMs          = null,
  wcagHeuristicScore = null,
  wcagHeuristicLabel = null,
  sslDaysLeft        = null,
  size               = "sm",
}: Props) {
  const hasAny = avgTtfbMs != null || wcagHeuristicScore != null || sslDaysLeft != null;
  if (!hasAny) return null;

  const s = SIZE[size];

  return (
    <div
      data-testid="metric-pill-bar"
      data-size={size}
      style={{
        display: "flex", flexWrap: "wrap", gap: s.barGap, marginBottom: 18,
        padding: s.barPad,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        alignItems: "center",
      }}
    >
      {avgTtfbMs != null && (
        <div
          title="Time to First Byte — Mittelwert über alle gecrawlten Seiten"
          style={{
            display: "flex", alignItems: "center", gap: s.pillGap,
            padding: s.pillPad, borderRadius: s.radius,
            background: ttfbBg(avgTtfbMs),
            border: `1px solid ${ttfbBorder(avgTtfbMs)}`,
          }}
        >
          <span style={{ fontSize: s.label, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Ø TTFB</span>
          <span style={{ fontSize: s.value, fontWeight: 800, color: ttfbColor(avgTtfbMs) }}>{avgTtfbMs} ms</span>
        </div>
      )}
      {wcagHeuristicScore != null && (
        <div
          title={`${wcagHeuristicLabel ?? "Heuristische Analyse"}. Struktureller Check — für rechtssichere Audits ist ein manueller Test/Headless-Audit erforderlich.`}
          style={{
            display: "flex", alignItems: "center", gap: s.pillGap, cursor: "help",
            padding: s.pillPad, borderRadius: s.radius,
            background: "rgba(124,58,237,0.10)",
            border: "1px solid rgba(124,58,237,0.30)",
          }}
        >
          <span style={{ fontSize: s.label, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase" }}>WCAG-Heuristik</span>
          <span style={{ fontSize: s.value, fontWeight: 800, color: wcagColor(wcagHeuristicScore) }}>{wcagHeuristicScore}/100</span>
          <span style={{ fontSize: s.sub, color: "rgba(255,255,255,0.35)" }}>· {wcagHeuristicLabel ?? "Heuristik"}</span>
        </div>
      )}
      {sslDaysLeft != null && (
        <div
          title={sslDaysLeft < 0
            ? "SSL-Zertifikat ist abgelaufen — Browser blockieren die Seite"
            : `SSL-Zertifikat läuft in ${sslDaysLeft} Tag${sslDaysLeft === 1 ? "" : "en"} ab`}
          style={{
            display: "flex", alignItems: "center", gap: s.pillGap, cursor: "help",
            padding: s.pillPad, borderRadius: s.radius,
            background: sslBg(sslDaysLeft),
            border: `1px solid ${sslBorder(sslDaysLeft)}`,
          }}
        >
          <span style={{ fontSize: s.label, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em", textTransform: "uppercase" }}>SSL</span>
          <span style={{ fontSize: s.value, fontWeight: 800, color: sslColor(sslDaysLeft) }}>
            {sslDaysLeft < 0 ? "abgelaufen" : `${sslDaysLeft}d`}
          </span>
        </div>
      )}
    </div>
  );
}
