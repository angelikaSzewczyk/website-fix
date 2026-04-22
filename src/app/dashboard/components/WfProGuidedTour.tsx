"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check } from "lucide-react";

const TOUR_KEY = "wf_pro_guided_tour_v1";
const PRO_PLANS = ["professional", "smart-guard", "agency-pro", "agency-starter"];

const STEPS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: "Experten-Fazit schreiben",
    body: "Ganz oben im Ergebnis-Panel findest du das Textfeld 'Experten-Fazit'. Schreibe hier dein persönliches Fazit für den Kunden — es erscheint automatisch auf Seite 1 deines PDFs. Nutze die Vorlagen-Buttons für einen schnellen Start.",
    accent: "#10B981",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    title: "White-Label PDF exportieren",
    body: "Klicke auf 'White-Label PDF' — der Export enthält dein Logo, deine Farbe und deinen Agentur-Namen. Kein WebsiteFix-Branding. Der Bericht sieht aus, als käme er direkt von dir.",
    accent: "#8df3d3",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
    title: "Teilen-Link für Kunden",
    body: "Mit 'Teilen-Link generieren' erzeugst du einen passwortfreien Link, den du direkt an deinen Kunden schicken kannst. Der Bericht öffnet sich in deinem Branding — ohne Dashboard-Zugang.",
    accent: "#FBBF24",
  },
];

interface Props {
  plan: string;
  scansCount: number;
}

export default function WfProGuidedTour({ plan, scansCount }: Props) {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!PRO_PLANS.includes(plan)) return;
    if (scansCount < 1) return;
    try {
      if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
    } catch { /* ignore */ }
  }, [plan, scansCount]);

  function finish() {
    try { localStorage.setItem(TOUR_KEY, "1"); } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes wf-ptour-in {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Soft backdrop — doesn't fully block */}
      <div onClick={finish} style={{
        position: "fixed", inset: 0, zIndex: 990,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
      }} />

      {/* Tour card — bottom center */}
      <div style={{
        position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
        zIndex: 991,
        width: "min(500px, calc(100vw - 32px))",
        background: "linear-gradient(135deg, #0e1321 0%, #0f1a30 100%)",
        border: `1px solid ${current.accent}40`,
        borderRadius: 18,
        padding: "24px 28px 20px",
        boxShadow: `0 0 0 1px ${current.accent}12, 0 24px 72px rgba(0,0,0,0.75)`,
        animation: "wf-ptour-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Step progress bar */}
        <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              height: 2.5, borderRadius: 2, flex: 1,
              background: i <= step ? s.accent : "rgba(255,255,255,0.08)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Content row */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: `${current.accent}12`,
            border: `1px solid ${current.accent}28`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {current.icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                {current.title}
              </p>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 4,
                background: `${current.accent}18`, color: current.accent,
                border: `1px solid ${current.accent}30`, letterSpacing: "0.06em",
              }}>
                PRO
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
              {current.body}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={finish} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.25)", padding: 0, fontFamily: "inherit" }}>
            Tour beenden
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
              {step + 1} / {STEPS.length}
            </span>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                Zurück
              </button>
            )}
            <button
              onClick={() => isLast ? finish() : setStep(s => s + 1)}
              style={{
                padding: "7px 18px", borderRadius: 8, border: "none",
                background: current.accent, color: "#0b0c10",
                fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              {isLast ? <><Check size={12} strokeWidth={3} /> Verstanden</> : <>Weiter <ArrowRight size={12} strokeWidth={2.5} /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
