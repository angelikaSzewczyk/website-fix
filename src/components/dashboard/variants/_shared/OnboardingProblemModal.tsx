"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * OnboardingProblemModal — erste Aktion eines Starter-Users nach Registrierung.
 *
 * 3 klare Optionen die den Workflow priorisieren:
 *   1. "Google findet meine Seite nicht" → Visibility-Scan-Fokus
 *   2. "Mein WordPress hat einen kritischen Fehler" → Health-Scan-Fokus
 *   3. "Meine Seite lädt extrem langsam" → Speed-Scan-Fokus
 *
 * Nach Auswahl wird die URL-Eingabe sichtbar; Submit triggert
 * /dashboard/scan?url=X&problem=Y. Der ?problem-Param wird auf der
 * Scan-Page als UI-Hint gerendert (z.B. "Wir scannen mit Speed-Fokus...").
 *
 * Trigger: localStorage-Flag "wf_onboarding_seen". User mit erfolgter
 * Auswahl sehen das Modal nicht mehr.
 */

const T = {
  text:       "rgba(255,255,255,0.92)",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.40)",
  border:     "rgba(255,255,255,0.10)",
  cardSolid:  "linear-gradient(135deg, #0f1623 0%, #0d1520 100%)",
  blue:       "#7aa6ff",
  blueBg:     "rgba(122,166,255,0.10)",
  blueBdr:    "rgba(122,166,255,0.30)",
  amber:      "#fbbf24",
  amberBg:    "rgba(251,191,36,0.10)",
  amberBdr:   "rgba(251,191,36,0.30)",
  cyan:       "#22d3ee",
  cyanBg:     "rgba(34,211,238,0.10)",
  cyanBdr:    "rgba(34,211,238,0.30)",
  purple:     "#a78bfa",
};

const PROBLEMS = [
  {
    id: "visibility",
    label: "Google findet meine Seite nicht",
    sub: "Indexierung, Sitemap, Meta-Daten",
    color: T.blue, bg: T.blueBg, bdr: T.blueBdr,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    id: "health",
    label: "Mein WordPress hat einen kritischen Fehler",
    sub: "Plugin-Konflikte, PHP-Warnungen, weiße Seite",
    color: T.amber, bg: T.amberBg, bdr: T.amberBdr,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  {
    id: "speed",
    label: "Meine Seite lädt extrem langsam",
    sub: "Hoster, Server-Antwortzeit, Bilder",
    color: T.cyan, bg: T.cyanBg, bdr: T.cyanBdr,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
] as const;

type ProblemId = typeof PROBLEMS[number]["id"];

const STORAGE_KEY = "wf_onboarding_seen";

export default function OnboardingProblemModal({
  defaultUrl = "",
}: {
  defaultUrl?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProblemId | null>(null);
  const [urlValue, setUrlValue] = useState(defaultUrl);
  const [open, setOpen] = useState(false);

  // Beim Mount: prüfen ob Modal schon gesehen wurde ODER ob der User
  // gerade einen anonymen Scan geclaimed hat (sessionStorage.wf_scan_result).
  // Im Claim-Fall hat der User bereits Issues gesehen und sein Problem
  // implizit benannt — das Modal wäre eine UX-Doppelung. Wir markieren das
  // Onboarding direkt als gesehen und zeigen es nicht.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen) return;

    const claimedScan = window.sessionStorage.getItem("wf_scan_result");
    if (claimedScan) {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      return;
    }

    setOpen(true);
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setOpen(false);
  }

  function startScan(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    let cleanUrl = urlValue.trim();
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) cleanUrl = "https://" + cleanUrl;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    const params = new URLSearchParams();
    if (cleanUrl) params.set("url", cleanUrl);
    params.set("problem", selected);
    router.push(`/dashboard/scan?${params.toString()}`);
  }

  // ESC schließt das Modal — User kann später noch Scans starten
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") dismiss(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div onClick={dismiss} style={{
      position: "fixed", inset: 0, zIndex: 1100,
      background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{
        width: "min(620px, calc(100vw - 32px))",
        maxHeight: "calc(100vh - 64px)", overflowY: "auto",
        background: T.cardSolid,
        border: `1px solid ${T.border}`,
        borderRadius: 18, padding: "32px 32px 28px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
        color: T.text,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        animation: "wf-onboard-in 0.3s cubic-bezier(0.22,1,0.36,1) both",
        position: "relative",
      }}>
        <style>{`
          @keyframes wf-onboard-in {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
        `}</style>

        {/* × Close */}
        <button onClick={dismiss} aria-label="Modal schließen" style={{
          position: "absolute", top: 14, right: 16,
          background: "none", border: "none", cursor: "pointer",
          color: T.textMuted, fontSize: 22, lineHeight: 1, padding: 4,
          fontFamily: "inherit",
        }}>×</button>

        {/* Eyebrow */}
        <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          👋 Willkommen
        </p>

        {/* Title */}
        <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
          Wo brennt&apos;s gerade?
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: 13.5, color: T.textSub, lineHeight: 1.55 }}>
          Wähle dein Hauptproblem — wir starten den Scan mit Fokus genau darauf.
        </p>

        {/* Problem-Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
          {PROBLEMS.map(p => {
            const isActive = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px", borderRadius: 12,
                  background: isActive ? p.bg : "rgba(255,255,255,0.025)",
                  border: `1.5px solid ${isActive ? p.bdr : T.border}`,
                  color: T.text,
                  cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                }}
              >
                <div style={{
                  flexShrink: 0, width: 40, height: 40, borderRadius: 10,
                  background: p.bg, border: `1px solid ${p.bdr}`,
                  color: p.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {p.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                    {p.label}
                  </div>
                  <div style={{ fontSize: 11.5, color: T.textSub }}>
                    {p.sub}
                  </div>
                </div>
                <div style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                  border: `2px solid ${isActive ? p.color : T.border}`,
                  background: isActive ? p.color : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isActive && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0b0c10" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* URL-Eingabe — nur sichtbar wenn ein Problem gewählt wurde */}
        {selected && (
          <form onSubmit={startScan}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Deine Website-URL
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://meine-website.de"
                autoFocus
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${T.border}`,
                  color: T.text, fontSize: 14,
                  fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!urlValue.trim()}
                style={{
                  padding: "12px 22px", borderRadius: 10,
                  background: "rgba(124,58,237,0.85)",
                  border: "1px solid rgba(167,139,250,0.55)",
                  color: "#fff",
                  fontSize: 13, fontWeight: 800,
                  cursor: urlValue.trim() ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                  boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
                  opacity: urlValue.trim() ? 1 : 0.6,
                  whiteSpace: "nowrap",
                }}
              >
                Scan starten →
              </button>
            </div>
          </form>
        )}

        {/* Skip-Link */}
        <p style={{ margin: "20px 0 0", textAlign: "center" }}>
          <button onClick={dismiss} style={{
            background: "none", border: "none", padding: 4, cursor: "pointer",
            color: T.textMuted, fontSize: 12, fontFamily: "inherit",
            textDecoration: "underline",
          }}>
            Später entscheiden
          </button>
        </p>
      </div>
    </div>
  );
}
