"use client";

/**
 * OnboardingChecklist — plan-spezifische 3-Schritt-Checkliste fürs Dashboard.
 *
 * Self-contained: fetched seinen eigenen State von /api/onboarding?plan=<key>
 * (welcher serverseitig auch Auto-Detections wie "Logo gesetzt?" oder
 * "Team-Member da?" durchführt + persistiert). Kein Server-Wrapper nötig —
 * diese Komponente kann direkt in Client-Dashboard-Variants gemountet werden.
 *
 * UX:
 *   - Kompakter Header mit Progress-Ring (X/3) — anklickbar zum Auf/Zuklappen
 *   - Steps darunter: Klick auf Karte → Link-Navigation, kleiner ✓-Button
 *     daneben für "manuell als erledigt markieren"
 *   - "Verstanden"-Button setzt dismissed=true → Card weg
 *   - Wenn alle Steps done → grüner Flash, Auto-Dismiss nach 3.5 s
 *
 * Schema-Sync: dismissed=true rendert null. Komponente kommt erst wieder
 * wenn Admin-API users.onboarding_state resettet (action: "reset").
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ONBOARDING_STEPS, type OnboardingPlanKey } from "@/lib/onboarding-steps";

/** Plausible/GA-Tracking-Helper. Identisch zur Variante in /scan/results/page.tsx —
 *  könnte später in lib/track.ts zentralisiert werden. Silent fail wenn Plausible
 *  oder gtag nicht geladen sind (z.B. Cookie-Consent abgelehnt). */
function trackEvent(event: string, props: Record<string, string>): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
    gtag?:      (cmd: string, event: string, params?: Record<string, string>) => void;
  };
  try {
    w.plausible?.(event, { props });
    w.gtag?.("event", event.toLowerCase().replace(/\s+/g, "_"), props);
  } catch { /* tracker not ready */ }
}

type State = {
  completed_steps: string[];
  dismissed:       boolean;
  completed_at:    string | null;
};

type Props = {
  /** Bereits normalisierter Plan-Key — null wenn Plan nicht onboarded werden soll. */
  plan: OnboardingPlanKey;
};

const C = {
  bg:       "rgba(122,166,255,0.05)",
  border:   "rgba(122,166,255,0.28)",
  green:    "#22c55e",
  greenBg:  "rgba(34,197,94,0.10)",
  blue:     "#7aa6ff",
  text:     "rgba(255,255,255,0.92)",
  textSub:  "rgba(255,255,255,0.62)",
  textMuted:"rgba(255,255,255,0.40)",
  divider:  "rgba(255,255,255,0.06)",
} as const;

export default function OnboardingChecklist({ plan }: Props) {
  const config = ONBOARDING_STEPS[plan];
  const [state, setState] = useState<State | null>(null); // null = noch nicht geladen
  const [open,  setOpen]  = useState(true);
  const [allDoneFlash, setAllDoneFlash] = useState(false);
  /** First-Run-Pulse: animierte Border + Scroll-into-View beim ersten Mount,
   *  wenn der User die Card noch nie gesehen hat (keine completed_steps + nicht
   *  dismissed). Schaltet sich nach 6 s automatisch ab — das soll den ersten
   *  Blick lenken, nicht permanent blinken. */
  const [pulse, setPulse] = useState(false);
  const flashTriggeredRef = useRef(false);
  const cardRef           = useRef<HTMLDivElement | null>(null);

  // Initial-Fetch: lädt State aus DB inkl. Auto-Detection für diesen Plan
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/onboarding?plan=${encodeURIComponent(plan)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.state) return;
        const loaded = data.state as State;
        setState(loaded);
        // First-Run-Detection: keine completed_steps + nicht dismissed → Pulse
        // + scroll in den Viewport (smooth, falls die Card noch außerhalb).
        if (loaded.completed_steps.length === 0 && !loaded.dismissed) {
          setPulse(true);
          requestAnimationFrame(() => {
            cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          });
          // Pulse-Auto-Off nach 6s
          setTimeout(() => setPulse(false), 6000);
          trackEvent("Onboarding Shown", { plan, fresh: "true" });
        } else if (!loaded.dismissed) {
          trackEvent("Onboarding Shown", { plan, fresh: "false" });
        }
      })
      .catch(() => { /* network error → Component bleibt unsichtbar */ });
    return () => { cancelled = true; };
  }, [plan]);

  // Allen-Done-Flash + Auto-Dismiss
  useEffect(() => {
    if (!state || state.dismissed) return;
    const allDone = config.steps.every(s => state.completed_steps.includes(s.id));
    if (!allDone || flashTriggeredRef.current) return;
    flashTriggeredRef.current = true;
    setAllDoneFlash(true);
    const t = setTimeout(() => { void dismiss(); }, 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!state || state.dismissed) return null;

  const doneCount = state.completed_steps.filter(id => config.steps.some(s => s.id === id)).length;
  const totalCount = config.steps.length;
  const allDone   = doneCount === totalCount;

  async function completeStep(stepId: string, source: "manual" | "link" = "manual") {
    if (!state || state.completed_steps.includes(stepId)) return;
    trackEvent("Onboarding Step Complete", { plan, step: stepId, source });
    setState(prev => prev ? { ...prev, completed_steps: [...prev.completed_steps, stepId] } : prev);
    fetch("/api/onboarding", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "complete_step", stepId }),
    }).catch(() => { /* silent — refresh holt korrekten State */ });
  }

  async function dismiss() {
    const wasComplete = state ? config.steps.every(s => state.completed_steps.includes(s.id)) : false;
    trackEvent("Onboarding Dismissed", {
      plan,
      // "auto" = Auto-Dismiss nach Allen-Done-Flash. "manual" = User hat
      // "Verstanden" geklickt. Hilft uns, drop-off vs. completion zu trennen.
      reason: wasComplete ? "auto_complete" : "manual_skip",
      completed_steps: String(state?.completed_steps.length ?? 0),
    });
    setState(prev => prev ? { ...prev, dismissed: true } : prev);
    fetch("/api/onboarding", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "dismiss" }),
    }).catch(() => { /* silent */ });
  }

  function trackStepClick(stepId: string) {
    // Wird beim Link-Click gefeuert (User navigiert zum Step-Ziel) — nicht
    // identisch mit complete_step, weil Klick != Erledigung. Hilft beim
    // Funnel-Verständnis: welche Steps werden geöffnet, welche manuell
    // abgehakt, welche per Auto-Detect erledigt.
    trackEvent("Onboarding Step Clicked", { plan, step: stepId });
  }

  return (
    <section
      ref={cardRef}
      role="region"
      aria-label="Onboarding-Checkliste"
      className={pulse ? "wf-onboarding-pulse" : undefined}
      style={{
        marginBottom: 20,
        padding: "18px 22px",
        borderRadius: 14,
        background: allDoneFlash ? `linear-gradient(135deg, ${C.greenBg}, ${C.bg})` : C.bg,
        border: `1px solid ${allDoneFlash ? "rgba(34,197,94,0.35)" : C.border}`,
        transition: "background 0.5s, border-color 0.5s",
        position: "relative",
      }}
    >
      {/* First-Run-Pulse: animierter Outer-Ring, schaltet sich nach 6 s ab.
          Pure CSS — kein JS-Animation-Frame, keine Layout-Reflows. */}
      <style>{`
        @keyframes wf-onb-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(122,166,255,0.0); }
          50%      { box-shadow: 0 0 0 6px rgba(122,166,255,0.18); }
        }
        .wf-onboarding-pulse {
          animation: wf-onb-pulse 1.6s ease-in-out 3;
        }
      `}</style>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0,
            textAlign: "left", color: "inherit",
          }}
        >
          {/* Progress-Ring */}
          <div style={{ position: "relative", width: 38, height: 38, flexShrink: 0 }} aria-hidden="true">
            <svg width="38" height="38" viewBox="0 0 38 38">
              <circle cx="19" cy="19" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
              <circle
                cx="19" cy="19" r="16" fill="none"
                stroke={allDone ? C.green : C.blue}
                strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(doneCount / totalCount) * 100.5} 100.5`}
                style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dasharray 0.4s ease" }}
              />
            </svg>
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: allDone ? C.green : C.blue,
            }}>
              {doneCount}/{totalCount}
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: C.blue, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Erste Schritte
              </span>
              {allDoneFlash && (
                <span style={{ fontSize: 10, fontWeight: 800, color: C.green, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  ✓ Alles erledigt!
                </span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
              {config.title}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>
              {config.subtitle}
            </p>
          </div>

          <span style={{ fontSize: 13, color: C.textMuted, flexShrink: 0 }} aria-hidden="true">
            {open ? "▴" : "▾"}
          </span>
        </button>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Checkliste ausblenden"
          style={{
            background: "transparent", border: `1px solid rgba(255,255,255,0.10)`,
            color: C.textMuted, padding: "5px 11px", borderRadius: 7,
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Verstanden
        </button>
      </div>

      {/* Steps */}
      {open && (
        <ul style={{
          margin: "16px 0 0", padding: 0, listStyle: "none",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {config.steps.map((s, idx) => {
            const done = state.completed_steps.includes(s.id);
            const isLink = s.href && s.href.length > 0;
            const inner = (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "11px 12px", borderRadius: 9,
                background: done ? "rgba(34,197,94,0.06)" : "rgba(0,0,0,0.20)",
                border: `1px solid ${done ? "rgba(34,197,94,0.22)" : C.divider}`,
                transition: "background 0.2s, border-color 0.2s",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                  background: done ? C.green : "rgba(122,166,255,0.10)",
                  border: done ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                  color: done ? "#000" : C.blue,
                }}>
                  {done ? "✓" : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                    <span aria-hidden="true">{s.icon}</span>
                    <span style={{
                      fontSize: 13.5, fontWeight: 700,
                      color: done ? "rgba(255,255,255,0.50)" : C.text,
                      textDecoration: done ? "line-through" : "none",
                    }}>
                      {s.label}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: C.textMuted, lineHeight: 1.5 }}>
                    {s.hint}
                  </p>
                </div>

                {!done && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    {isLink && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, whiteSpace: "nowrap" }}>
                        Öffnen →
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); completeStep(s.id); }}
                      title="Manuell als erledigt markieren"
                      aria-label={`Schritt ${idx + 1} abhaken`}
                      style={{
                        background: "transparent",
                        border: `1px solid rgba(255,255,255,0.12)`,
                        color: C.textMuted,
                        width: 24, height: 24, borderRadius: 6,
                        fontSize: 12, fontWeight: 800, cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      ✓
                    </button>
                  </div>
                )}
              </div>
            );
            return (
              <li key={s.id}>
                {isLink && !done ? (
                  <Link
                    href={s.href}
                    onClick={() => trackStepClick(s.id)}
                    style={{ display: "block", textDecoration: "none", color: "inherit" }}
                  >
                    {inner}
                  </Link>
                ) : inner}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
