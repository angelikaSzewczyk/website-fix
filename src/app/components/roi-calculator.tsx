"use client";
import { useState } from "react";

export default function RoiCalculator() {
  const [projects, setProjects] = useState(10);
  const [hours, setHours] = useState(2);
  const [rate, setRate] = useState(80);

  const savedHours = projects * hours;
  const savedEuros = savedHours * rate;
  const planCost = 149;
  const roi = savedEuros - planCost;

  return (
    <section style={{ background: "#0d1520", padding: "80px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(122,166,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ROI-Kalkulator
          </p>
          <h2 style={{ margin: "0 0 12px", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
            Berechne deinen monatlichen Zusatzgewinn.
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 500, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
            Passe die Werte an — und sieh, wie viel Zeit und Geld du jeden Monat zurückgewinnst.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}>
          {/* Inputs */}
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
              label="Manuelle Prüfung pro Monat"
              value={hours}
              min={0.5} max={8} step={0.5}
              unit="Std./Projekt"
              onChange={setHours}
              color="#8df3d3"
            />
            <SliderInput
              label="Dein Stundensatz"
              value={rate}
              min={30} max={200} step={10}
              unit="€/Std."
              onChange={setRate}
              color="#c084fc"
            />
          </div>

          {/* Results */}
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
              label="Wert der gesparten Zeit"
              value={`${savedEuros.toLocaleString("de-DE")} €`}
              sub={`${savedHours} Std. × ${rate} €`}
              color="#7aa6ff"
            />
            <ResultRow
              label="WebsiteFix Agency Core"
              value={`− ${planCost} €`}
              sub="Pro Monat"
              color="#94A3B8"
            />
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
            <div style={{
              padding: "16px 18px",
              borderRadius: 12,
              background: roi > 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${roi > 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>
                NETTO-ERSPARNIS PRO MONAT
              </div>
              <div style={{
                fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em",
                color: roi > 0 ? "#22C55E" : "#EF4444",
              }}>
                {roi > 0 ? "+" : ""}{roi.toLocaleString("de-DE")} €
              </div>
              {roi > 0 && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                  Amortisiert sich in weniger als 1 Monat
                </div>
              )}
            </div>

            <a href="/login" style={{
              display: "block", textAlign: "center",
              padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              textDecoration: "none", marginTop: 4,
              background: "linear-gradient(90deg, #007BFF, #0057b8)",
              color: "#fff",
              boxShadow: "0 4px 14px rgba(0,123,255,0.3)",
            }}>
              Jetzt {roi.toLocaleString("de-DE")} €/mtl. sparen →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SliderInput({
  label, value, min, max, step, unit, onChange, color,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: "-0.02em" }}>
          {value} <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.3)" }}>{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%", accentColor: color,
          height: 4, cursor: "pointer",
          appearance: "auto",
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
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
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
      <div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{sub}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</div>
    </div>
  );
}
