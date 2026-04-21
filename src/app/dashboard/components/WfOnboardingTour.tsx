"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, BarChart2, FileText, Check, Clock, ArrowRight, ChevronLeft } from "lucide-react";

const ONBOARDING_KEY = "wf_onboarding_done";

type Phase = "welcome" | "tour" | null;

const TOUR_STEPS = [
  {
    icon: <Search size={20} strokeWidth={1.8} />,
    title: "Schritt 1 — Scan starten",
    body: "Gib hier die URL deiner Website ein. Wir prüfen bis zu 25 Seiten auf SEO- und Technik-Fehler — in unter 60 Sekunden.",
  },
  {
    icon: <BarChart2 size={20} strokeWidth={1.8} />,
    title: "Schritt 2 — Ergebnisse lesen",
    body: "Hier erscheinen gleich deine Ergebnisse. Wir kategorisieren in Kritisch, Warnungen und Optimierungen — mit direkten Fix-Anleitungen.",
  },
  {
    icon: <FileText size={20} strokeWidth={1.8} />,
    title: "Schritt 3 — Berichte exportieren",
    body: "Deine fertigen Berichte kannst du jederzeit hier exportieren und als PDF an Kunden weitergeben.",
  },
];

const PLAN_LABEL: Record<string, string> = {
  starter:          "Starter",
  professional:     "Professional",
  "smart-guard":    "Professional",
  "agency-starter": "Agency",
  "agency-pro":     "Agency Pro",
};

interface Props {
  firstName: string;
  plan: string;
  scansCount: number;
}

export default function WfOnboardingTour({ firstName, plan, scansCount }: Props) {
  const [phase, setPhase] = useState<Phase>(null);
  const [tourStep, setTourStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    try {
      const done = localStorage.getItem(ONBOARDING_KEY);
      if (!done && scansCount === 0) {
        setPhase("welcome");
      }
    } catch { /* ignore */ }
  }, [scansCount]);

  function finish() {
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch { /* ignore */ }
    setPhase(null);
  }

  function startScan() {
    finish();
    router.push("/dashboard/scan");
  }

  function goToTour() {
    setTourStep(0);
    setPhase("tour");
  }

  function advanceTour() {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(s => s + 1);
    } else {
      finish();
    }
  }

  if (phase === null) return null;

  const planLabel = PLAN_LABEL[plan] ?? plan;

  // ── Welcome Overlay ──────────────────────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <>
        <style>{`
          @keyframes wf-ob-in {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.94); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes wf-ob-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.45; transform: scale(0.85); }
          }
          @keyframes wf-ob-glow {
            0%, 100% { box-shadow: 0 0 0 1px rgba(34,197,94,0.08), 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(34,197,94,0.06); }
            50%       { box-shadow: 0 0 0 1px rgba(34,197,94,0.12), 0 32px 80px rgba(0,0,0,0.8), 0 0 80px rgba(34,197,94,0.1); }
          }
        `}</style>

        {/* Backdrop */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(10px)",
        }} />

        {/* Card */}
        <div style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1001,
          width: "min(520px, calc(100vw - 32px))",
          background: "linear-gradient(135deg, #0d1520 0%, #0f1a2e 100%)",
          border: "1px solid rgba(34,197,94,0.22)",
          borderRadius: 22,
          padding: "40px 36px 32px",
          animation: "wf-ob-in 0.38s cubic-bezier(0.22,1,0.36,1) both, wf-ob-glow 3s ease-in-out 1s infinite",
        }}>

          {/* Green check icon */}
          <div style={{
            width: 68, height: 68, borderRadius: "50%", margin: "0 auto 24px",
            background: "rgba(34,197,94,0.1)",
            border: "2px solid rgba(34,197,94,0.28)",
            boxShadow: "0 0 48px rgba(34,197,94,0.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          {/* Plan badge */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px", borderRadius: 20,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.22)",
              color: "#22C55E", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            }}>
              <Check size={11} strokeWidth={3} /> {planLabel}-Plan aktiv
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            textAlign: "center", margin: "0 0 10px",
            fontSize: 26, fontWeight: 900, color: "#fff",
            letterSpacing: "-0.03em", lineHeight: 1.2,
          }}>
            Willkommen bei WebsiteFix, {firstName}!
          </h1>
          <p style={{
            textAlign: "center", margin: "0 0 30px",
            fontSize: 14, color: "rgba(255,255,255,0.48)", lineHeight: 1.65,
          }}>
            Lass uns direkt deinen ersten Scan starten,<br/>
            um kritische Fehler auf deiner Website zu finden.
          </p>

          {/* Gamification checklist */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: "6px 18px",
            marginBottom: 28,
          }}>
            {([
              { label: "Account erstellt",      done: true  },
              { label: "Plan aktiviert",         done: true  },
              { label: "Ersten Scan starten",    done: false },
            ] as { label: string; done: boolean }[]).map((item, i, arr) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 0",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                {/* Circle status */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: item.done ? "rgba(34,197,94,0.12)" : "rgba(251,191,36,0.08)",
                  border: `1.5px solid ${item.done ? "rgba(34,197,94,0.35)" : "rgba(251,191,36,0.32)"}`,
                }}>
                  {item.done ? (
                    <Check size={11} strokeWidth={3} color="#22C55E" />
                  ) : (
                    <Clock size={11} strokeWidth={2.5} color="#FBBF24" />
                  )}
                </div>

                {/* Label */}
                <span style={{
                  flex: 1, fontSize: 13,
                  fontWeight: item.done ? 400 : 700,
                  color: item.done ? "rgba(255,255,255,0.5)" : "#fff",
                  textDecoration: item.done ? "line-through" : "none",
                }}>
                  {item.label}
                </span>

                {/* Status tag */}
                {item.done ? (
                  <Check size={13} strokeWidth={2.5} color="#22C55E" />
                ) : (
                  <span style={{
                    fontSize: 9, color: "#FBBF24", fontWeight: 700,
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.22)",
                    padding: "2px 8px", borderRadius: 10,
                    letterSpacing: "0.05em",
                  }}>
                    AUSSTEHEND
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={startScan}
            style={{
              width: "100%", padding: "13px 24px", borderRadius: 11,
              background: "#22C55E", color: "#0b0c10",
              fontSize: 14, fontWeight: 800, cursor: "pointer",
              border: "none", fontFamily: "inherit",
              boxShadow: "0 4px 24px rgba(34,197,94,0.28)",
              marginBottom: 12,
              transition: "box-shadow 0.2s",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              Ersten Scan starten <ArrowRight size={15} strokeWidth={2.5} />
            </span>
          </button>

          {/* Secondary actions */}
          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
            <button onClick={goToTour} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: "rgba(255,255,255,0.3)",
              fontFamily: "inherit", padding: "4px 10px",
            }}>
              Feature-Übersicht ansehen
            </button>
            <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12, lineHeight: "28px" }}>·</span>
            <button onClick={finish} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: "rgba(255,255,255,0.3)",
              fontFamily: "inherit", padding: "4px 10px",
            }}>
              Überspringen
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Feature Tour ─────────────────────────────────────────────────────────────
  const current = TOUR_STEPS[tourStep];
  const isLast = tourStep === TOUR_STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes wf-tour-in {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div onClick={finish} style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(3px)",
      }} />

      {/* Tour card */}
      <div style={{
        position: "fixed",
        bottom: 32, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1001,
        width: "min(480px, calc(100vw - 32px))",
        background: "#0F1117",
        border: "1px solid rgba(251,191,36,0.28)",
        borderRadius: 16,
        padding: "28px 32px 24px",
        boxShadow: "0 0 0 1px rgba(251,191,36,0.06), 0 24px 64px rgba(0,0,0,0.7)",
        animation: "wf-tour-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* Step progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{
              height: 3, borderRadius: 2,
              flex: i <= tourStep ? 2 : 1,
              background: i <= tourStep ? "#FBBF24" : "rgba(255,255,255,0.1)",
              transition: "flex 0.3s ease, background 0.3s ease",
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: 10, padding: "10px 12px", flexShrink: 0,
            color: "#FBBF24",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {current.icon}
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {current.title}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.58)", lineHeight: 1.65 }}>
              {current.body}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={finish} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, color: "rgba(255,255,255,0.28)", padding: 0,
          }}>
            Überspringen
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {tourStep > 0 && (
              <button onClick={() => setTourStep(s => s - 1)} style={{
                padding: "8px 16px", borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.65)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <ChevronLeft size={14} strokeWidth={2} /> Zurück
              </button>
            )}
            <button onClick={advanceTour} style={{
              padding: "8px 20px", borderRadius: 8,
              background: "#FBBF24", border: "none",
              color: "#0b0c10", fontSize: 13, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              {isLast ? (
                <><Check size={14} strokeWidth={2.5} /> Los geht&apos;s</>
              ) : (
                <>Weiter <ArrowRight size={14} strokeWidth={2.5} /></>
              )}
            </button>
          </div>
        </div>

        <p style={{ margin: "14px 0 0", textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)" }}>
          Schritt {tourStep + 1} von {TOUR_STEPS.length}
        </p>
      </div>
    </>
  );
}
