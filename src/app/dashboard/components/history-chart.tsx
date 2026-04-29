/**
 * HistoryChart — 7-Tage-Score-Verlauf mit Sparkline-SVG.
 *
 * Vorher inline in dashboard/page.tsx (line 270, niemals gerendert).
 * Hier extrahiert + auf Dark-Theme angepasst, weil das Chart in
 * FreeDashboardClient (single-layout, dark bg) angezeigt wird, nicht im
 * agency-light-layout. Geometrie und Score-Berechnung 1:1 aus dem Original.
 *
 * Shared-Component (kein "use client"): pure SVG, keine Browser-APIs.
 */

type ScanBrief = {
  id:           string;
  created_at:   string;
  issue_count:  number | null;
};

const C = {
  card:        "rgba(255,255,255,0.03)",
  border:      "rgba(255,255,255,0.08)",
  textMuted:   "rgba(255,255,255,0.4)",
  green:       "#22C55E",
  amber:       "#F59E0B",
  red:         "#EF4444",
  badgeBg:     "rgba(34,197,94,0.10)",
  badgeBorder: "rgba(34,197,94,0.32)",
} as const;

export default function HistoryChart({ scans }: { scans: ScanBrief[] }) {
  const last7    = scans.slice(0, 7).reverse();
  const rawScores = last7.map(s => Math.max(10, 100 - (s.issue_count ?? 5) * 8));
  // Mindestens 2 Punkte erzwingen, sonst kann polyline nicht gezeichnet werden.
  while (rawScores.length < 2) rawScores.unshift(rawScores[0] ?? 72);
  const n = rawScores.length;

  const W = 520, H = 56, PX = 10, PY = 8;
  const minV  = Math.min(...rawScores);
  const maxV  = Math.max(...rawScores);
  const range = Math.max(maxV - minV, 20);

  const pts = rawScores.map((s, i) => ({
    x: PX + (i / (n - 1)) * (W - PX * 2),
    y: PY + (1 - (s - minV) / range) * (H - PY * 2),
    s,
  }));

  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area     = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} ` +
                   pts.slice(1).map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
                   ` L${pts[n-1].x.toFixed(1)},${(H - PY).toFixed(1)} L${pts[0].x.toFixed(1)},${(H - PY).toFixed(1)} Z`;

  const latest = rawScores[n - 1];
  const prev   = rawScores[n - 2];
  const delta  = latest - prev;
  const color  = latest >= 70 ? C.green : latest >= 50 ? C.amber : C.red;
  const dates  = last7.map(s => {
    const d = new Date(s.created_at);
    return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`;
  });

  // Farbe für Punkte: aktuellster ist gefüllt, vorherige sind als Ringe
  // dargestellt — Punkt-Color matched dem Linien-Color für visuelle Einheit.
  const dotFillCurrent = color;
  const dotFillRest    = "rgba(8,12,20,1)"; // matched dark dashboard bg

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "14px 20px 10px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Score-Verlauf · 7 Tage
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: C.badgeBg, color: C.green, border: `1px solid ${C.badgeBorder}` }}>
            LIVE MONITORING
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{latest}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? C.green : C.red }}>
            {delta >= 0 ? "↑" : "↓"}{Math.abs(delta)}
          </span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", height: 52, overflow: "visible" }}>
        <defs>
          <linearGradient id="hg-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#hg-dark)" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5"
            fill={i === n - 1 ? dotFillCurrent : dotFillRest}
            stroke={color} strokeWidth="1.5" />
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {dates.map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>{d}</span>
        ))}
      </div>
    </div>
  );
}
