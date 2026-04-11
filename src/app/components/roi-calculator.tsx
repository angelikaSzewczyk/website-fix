"use client";
import { useState } from "react";

export default function RoiCalculator() {
  const [projects, setProjects] = useState(10);
  const [hours,    setHours]    = useState(2);
  const [rate,     setRate]     = useState(120);   // Marktwert professionelle WP-Agentur

  const savedHours = projects * hours;
  const savedEuros = savedHours * rate;
  // Dynamic plan cost: ≤10 Projekte = Agency Starter 99 €, >10 = Agency Pro 199 €
  const planCost   = projects <= 10 ? 99 : 199;
  const planLabel  = projects <= 10 ? "Agency Starter (≤10 Projekte)" : "Agency Pro (>10 Projekte)";
  const roi        = savedEuros - planCost;

  return (
    <section style={{
      padding: "80px 24px",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      position: "relative",
      backgroundImage: "linear-gradient(rgba(122,166,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(122,166,255,0.04) 1px, transparent 1px)",
      backgroundSize: "44px 44px",
      backgroundColor: "#0d1520",
    }}>
      {/* Radial fade masks grid edges */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 30%, #0d1520 100%)",
      }} />

      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(122,166,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ROI-Kalkulator
          </p>
          <h2 style={{ margin: "0 0 12px", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
            Berechnen Sie Ihr monatliches Profit-Potenzial.
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 500, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
            Passen Sie die Werte an – und sehen Sie, wie viel Zeit und Budget Sie jeden Monat zurückgewinnen.
          </p>
        </div>

        <div className="wf-roi-grid">

          {/* ── Slider card ── */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "32px 28px",
            display: "flex", flexDirection: "column", gap: 28,
          }}>
            <SliderInput
              label="Kunden-Projekte"
              value={projects}
              min={1} max={50} step={1}
              unit="Projekte"
              onChange={setProjects}
              color="#7aa6ff"
            />
            <SliderInput
              label="Manueller Wartungsaufwand"
              value={hours}
              min={0.5} max={8} step={0.5}
              unit="Std./Projekt"
              onChange={setHours}
              color="#8df3d3"
            />
            <SliderInput
              label="Ihr Stundensatz"
              value={rate}
              min={30} max={200} step={10}
              unit="€/Std."
              onChange={setRate}
              color="#c084fc"
            />

            {/* Dynamic plan badge */}
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "rgba(122,166,255,0.06)",
              border: "1px solid rgba(122,166,255,0.15)",
              fontSize: 12, color: "rgba(255,255,255,0.35)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>Gewählter Plan:</span>
              <span style={{ color: "#7aa6ff", fontWeight: 600 }}>
                {planLabel} — {planCost} €/Monat
              </span>
            </div>
          </div>

          {/* ── Results card ── */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "32px 28px",
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <ResultRow
              label="Gesparte Stunden/Monat"
              value={`${savedHours} Std.`}
              sub={`${projects} Projekte × ${hours} Std.`}
              color="#8df3d3"
            />
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
            <ResultRow
              label="Freigesetzte Kapazität (Brutto)"
              value={`${savedEuros.toLocaleString("de-DE")} €`}
              sub={`${savedHours} Std. × ${rate} €`}
              color="#7aa6ff"
            />
            <ResultRow
              label="WebsiteFix Agency Core"
              value={`− ${planCost} €`}
              sub={planLabel}
              color="#94A3B8"
            />
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

            {/* Deckungsbeitrag — animated on change via key */}
            <div style={{
              padding: "18px 20px",
              borderRadius: 12,
              background: roi > 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${roi > 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              boxShadow: roi > 0 ? "0 0 28px rgba(34,197,94,0.10)" : "none",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 6, letterSpacing: "0.08em" }}>
                ZUSÄTZLICHER DECKUNGSBEITRAG / MONAT
              </div>
              {/* key=roi triggers CSS re-animation on every value change */}
              <div
                key={roi}
                className="wf-roi-flash"
                style={{
                  fontSize: "clamp(30px, 5vw, 42px)", fontWeight: 800, letterSpacing: "-0.04em",
                  color: roi > 0 ? "#22C55E" : "#EF4444",
                  lineHeight: 1,
                }}
              >
                {roi > 0 ? "+" : ""}{roi.toLocaleString("de-DE")} €
              </div>
              {roi > 0 && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>
                  Amortisiert sich in weniger als&nbsp;
                  <span style={{ color: "#22C55E", fontWeight: 600 }}>1 Monat</span>
                </div>
              )}
            </div>

            <a href="/register" style={{
              display: "block", textAlign: "center",
              padding: "14px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              textDecoration: "none", marginTop: 4,
              background: "linear-gradient(90deg, #007BFF, #0057b8)",
              color: "#fff",
              boxShadow: "0 4px 24px rgba(0,123,255,0.40), 0 0 40px rgba(0,123,255,0.15)",
            }}>
              Dieses Potenzial jetzt sichern →
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ── Sub-components ── */

function SliderInput({
  label, value, min, max, step, unit, onChange, color,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, gap: 8 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500, minWidth: 0 }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: "-0.02em", flexShrink: 0 }}>
          {value}&thinsp;<span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.3)" }}>{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color, height: 4, cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{min} {unit}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{max} {unit}</span>
      </div>
    </div>
  );
}

function ResultRow({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{sub}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: "-0.02em", flexShrink: 0, whiteSpace: "nowrap" }}>{value}</div>
    </div>
  );
}
