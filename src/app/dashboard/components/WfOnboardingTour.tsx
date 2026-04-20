"use client";

import { useState, useEffect } from "react";

const TOUR_KEY = "wf_tour_done";

const STEPS = [
  {
    id: "score",
    title: "Dein Exzellenz-Index",
    body: "Dieser Score zeigt auf einen Blick, wie sichtbar deine Website heute ist — je höher, desto mehr Potenzial hast du bereits ausgeschöpft.",
    emoji: "⚡",
    anchor: "wf-tour-score",
  },
  {
    id: "boost",
    title: "Sichtbarkeits-Boost",
    body: "Hier siehst du, wie viel Prozent mehr Sichtbarkeit du durch die Behebung der aktuellen Wachstums-Bremsen erreichen kannst.",
    emoji: "📈",
    anchor: "wf-tour-boost",
  },
  {
    id: "drawer",
    title: "Smart-Fix Drawer",
    body: "Klicke auf eine Wachstums-Bremse in der Liste — der Drawer öffnet sich mit einem Schritt-für-Schritt Direkt-Fix Guide.",
    emoji: "🔧",
    anchor: "wf-tour-issues",
  },
];

export default function WfOnboardingTour() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    try {
      const done = localStorage.getItem(TOUR_KEY);
      if (!done) setStep(0);
    } catch { /* ignore */ }
  }, []);

  function advance() {
    if (step === null) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  function finish() {
    try { localStorage.setItem(TOUR_KEY, "1"); } catch { /* ignore */ }
    setStep(null);
  }

  if (step === null) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={finish}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Tour card */}
      <div style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1001,
        width: "min(480px, calc(100vw - 32px))",
        background: "#0F1117",
        border: "1px solid rgba(251,191,36,0.3)",
        borderRadius: 16,
        padding: "28px 32px 24px",
        boxShadow: "0 0 0 1px rgba(251,191,36,0.08), 0 24px 64px rgba(0,0,0,0.7)",
        animation: "wf-tour-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <style>{`
          @keyframes wf-tour-in {
            from { opacity: 0; transform: translateX(-50%) translateY(18px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, borderRadius: 2,
              flex: i <= step ? 2 : 1,
              background: i <= step ? "#FBBF24" : "rgba(255,255,255,0.12)",
              transition: "flex 0.3s ease, background 0.3s ease",
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{
            fontSize: 24, lineHeight: 1,
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: 10,
            padding: "10px 12px",
            flexShrink: 0,
          }}>
            {current.emoji}
          </div>
          <div>
            <p style={{
              margin: "0 0 6px",
              fontSize: 16, fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}>
              {current.title}
            </p>
            <p style={{
              margin: 0,
              fontSize: 13, color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
            }}>
              {current.body}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={finish}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: "rgba(255,255,255,0.3)",
              padding: 0,
            }}
          >
            Überspringen
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  padding: "8px 18px", borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                ← Zurück
              </button>
            )}
            <button
              onClick={advance}
              style={{
                padding: "8px 22px", borderRadius: 8,
                background: "#FBBF24",
                border: "none",
                color: "#0b0c10",
                fontSize: 13, fontWeight: 800, cursor: "pointer",
              }}
            >
              {isLast ? "Los geht's ✓" : "Weiter →"}
            </button>
          </div>
        </div>

        {/* Step label */}
        <p style={{
          margin: "14px 0 0",
          textAlign: "center",
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
        }}>
          Schritt {step + 1} von {STEPS.length}
        </p>
      </div>
    </>
  );
}
