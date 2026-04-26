"use client";
import { useState } from "react";
import CheckoutButton from "./checkout-button";

export default function RoiCalculator() {
  // Default-Werte für Agentur-Profile (B2B-fokussiert, höheres Volumen):
  // 15 Projekte, 2.5 Std./Projekt, 125 €/Std. — siehe ROI-Briefing.
  const [projects, setProjects] = useState(15);
  const [hours,    setHours]    = useState(2.5);
  const [rate,     setRate]     = useState(125);

  // Fixer Plan-Preis: Agency Pro (Unlimited) = 249 €/Monat
  const PLAN_COST  = 249;
  const PLAN_LABEL = "Agency Pro (Unlimited)";

  // Kern-Berechnungen
  const savedHours        = projects * hours;
  const grossSavings      = savedHours * rate;            // Brutto-Wert der gesparten Zeit
  const netSavings        = grossSavings - PLAN_COST;     // Effektive Kostenersparnis nach Abzug Plan
  // "Opportunitäts-Umsatz": Was die Agentur in den gesparten Stunden zusätzlich verdienen KÖNNTE,
  // wenn sie die freigewordene Kapazität für Neukunden-Akquise oder Premium-Beratung nutzt.
  const opportunityRevenue = savedHours * rate;
  // Stunden, die jetzt für Wachstum (Akquise, Strategie) frei sind
  const growthHours        = savedHours;

  // Glow-Trigger für CTA-Button (psychologische Belohnung bei "echter" ROI)
  const isHighProfit = netSavings > 1000;

  return (
    <section className="wf-roi-section" style={{
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

      <div style={{ maxWidth: 980, margin: "0 auto", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "rgba(122,166,255,0.8)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ROI-Kalkulator · Agency Pro
          </p>
          <h2 style={{ margin: "0 0 12px", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
            Berechne deinen monatlichen Profit-Hebel.
          </h2>
          <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.4)", maxWidth: 540, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
            Drei Werte. Sofort-Ergebnis. Du siehst nicht nur, was du sparst — sondern auch, was du in der gewonnenen Zeit zusätzlich verdienen kannst.
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
              min={1} max={100} step={1}
              unit="Projekte"
              onChange={setProjects}
              color="#7aa6ff"
            />
            <SliderInput
              label="Manueller Wartungsaufwand"
              value={hours}
              min={0.5} max={10} step={0.5}
              unit="Std./Projekt"
              onChange={setHours}
              color="#8df3d3"
            />
            <SliderInput
              label="Dein Stundensatz"
              value={rate}
              min={50} max={250} step={5}
              unit="€/Std."
              onChange={setRate}
              color="#c084fc"
            />

            {/* Plan-Footer — fix Agency Pro */}
            <div style={{
              padding: "12px 14px", borderRadius: 9,
              background: "rgba(167,139,250,0.06)",
              border: "1px solid rgba(167,139,250,0.22)",
              fontSize: 12, color: "rgba(255,255,255,0.4)",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6,
            }}>
              <span>Gewählter Plan:</span>
              <span style={{ color: "#A78BFA", fontWeight: 700 }}>
                {PLAN_LABEL} — {PLAN_COST} €/Monat
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
              label="Gesparte Stunden / Monat"
              value={`${savedHours} Std.`}
              sub={`${projects} Projekte × ${hours} Std.`}
              color="#8df3d3"
            />
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
            <ResultRow
              label="Freigesetzte Kapazität (Brutto)"
              value={`${grossSavings.toLocaleString("de-DE")} €`}
              sub={`${savedHours} Std. × ${rate} €`}
              color="#7aa6ff"
            />
            <ResultRow
              label="WebsiteFix Agency Pro"
              value={`− ${PLAN_COST} €`}
              sub={PLAN_LABEL}
              color="#94A3B8"
            />
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

            {/* ── Effektive Kostenersparnis (Hauptzahl) ── */}
            <div style={{
              padding: "20px 22px",
              borderRadius: 12,
              background: netSavings > 0
                ? "linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(16,185,129,0.06) 100%)"
                : "rgba(239,68,68,0.08)",
              border: `1px solid ${netSavings > 0 ? "rgba(34,197,94,0.32)" : "rgba(239,68,68,0.25)"}`,
              boxShadow: netSavings > 0
                ? "0 0 36px rgba(34,197,94,0.18), 0 0 0 1px rgba(34,197,94,0.10)"
                : "none",
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: "0.08em" }}>
                EFFEKTIVE KOSTENERSPARNIS / MONAT
              </div>
              <div
                key={netSavings}
                className="wf-roi-flash"
                style={{
                  fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.04em",
                  color: netSavings > 0 ? "#22C55E" : "#EF4444",
                  lineHeight: 1,
                }}
              >
                {netSavings > 0 ? "+" : ""}{netSavings.toLocaleString("de-DE")} €
              </div>
              {netSavings > 0 && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 8 }}>
                  Stunden × Stundensatz − 249 € · Amortisiert in&nbsp;
                  <span style={{ color: "#22C55E", fontWeight: 700 }}>weniger als 1 Monat</span>
                </div>
              )}
            </div>

            {/* ── Wachstums-Hebel (zweite Kennzahl) ── */}
            <div style={{
              padding: "16px 18px", borderRadius: 11,
              background: "rgba(167,139,250,0.07)",
              border: "1px solid rgba(167,139,250,0.25)",
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#A78BFA", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                Wachstums-Hebel
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                  {growthHours} Std.
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.48)" }}>
                  pro Monat frei für Neukunden-Akquise
                </span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                Zusätzliches Umsatzpotenzial durch freigewordene Kapazität:{" "}
                <strong style={{ color: "#A78BFA" }}>
                  bis zu {opportunityRevenue.toLocaleString("de-DE")} €
                </strong>
              </div>
            </div>

            {/* ── ROI-Story Hinweis-Box ── */}
            <div style={{
              padding: "11px 14px", borderRadius: 9,
              background: "rgba(122,166,255,0.05)",
              border: "1px solid rgba(122,166,255,0.18)",
              display: "flex", gap: 9, alignItems: "flex-start",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8"  x2="12.01" y2="8"/>
              </svg>
              <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                <strong style={{ color: "rgba(255,255,255,0.78)" }}>Bei 249 € Investment</strong> amortisiert sich WebsiteFix bereits ab der <strong style={{ color: "#7aa6ff" }}>2. gesparten Stunde pro Monat</strong>. Alles danach ist reiner Gewinn.
              </p>
            </div>

            {/* ── Premium CTA mit dynamischem Glow ── */}
            <div style={{ marginTop: 4 }}>
              <CheckoutButton
                plan="agency"
                label="Dieses Potenzial jetzt sichern →"
                style={{
                  display: "block", width: "100%", textAlign: "center" as const,
                  padding: "15px 20px", borderRadius: 11, fontSize: 14, fontWeight: 800,
                  background: isHighProfit
                    ? "linear-gradient(90deg, #5B21B6 0%, #7C3AED 50%, #A78BFA 100%)"
                    : "linear-gradient(90deg, #007BFF, #0057b8)",
                  color: "#fff", border: "none",
                  boxShadow: isHighProfit
                    ? "0 6px 28px rgba(124,58,237,0.50), 0 0 60px rgba(167,139,250,0.30), 0 0 0 1px rgba(167,139,250,0.32)"
                    : "0 4px 24px rgba(0,123,255,0.40), 0 0 40px rgba(0,123,255,0.15)",
                  transition: "box-shadow 0.4s ease, background 0.4s ease",
                }}
              />
              {isHighProfit && (
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#A78BFA", textAlign: "center", fontWeight: 600, letterSpacing: "0.02em" }}>
                  Profit über 1.000 € · Premium-Gewinn aktiviert
                </p>
              )}
            </div>
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
