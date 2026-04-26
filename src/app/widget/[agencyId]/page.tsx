"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Branding = { agencyName: string; agencyColor: string; agencyLogo: string | null };

type Risk = { label: string; severity: "red" | "yellow"; detail: string };
type TeaserResult = {
  teaserToken: string;
  agencyName:  string;
  agencyColor: string;
  agencyLogo:  string | null;
  score:       number;
  issueCount:  number;
  redCount:    number;
  yellowCount: number;
  builder:     string | null;
  isWooCommerce: boolean;
  domDepth:      number | null;
  googleFonts:   number;
  risks: Risk[];
};

const SCAN_STEPS = [
  "Website wird abgerufen…",
  "KI analysiert Builder & Struktur…",
  "Risiken werden bewertet…",
];

// Accent-Paletten — passend zu den drei Plan-Themes der Hauptapp.
// Die Agentur wählt einen dieser Töne im Konfigurator via URL-Param ?color=blue|emerald|violet
// oder über ihren Branding-Color (primary_color der Agentur, wenn "custom" genutzt wird).
const COLOR_PRESETS: Record<string, string> = {
  blue:    "#007BFF",
  emerald: "#10B981",
  violet:  "#7C3AED",
};

export default function WidgetPage() {
  const params        = useParams();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const agencyId      = params.agencyId as string;
  const colorParam    = searchParams.get("color");

  const [branding, setBranding] = useState<Branding | null>(null);
  const [url, setUrl]           = useState("");
  const [email, setEmail]       = useState("");
  const [phase, setPhase]       = useState<"form" | "scanning" | "teaser" | "unlocking">("form");
  const [step, setStep]         = useState(0);
  const [stepDone, setStepDone] = useState<boolean[]>([false, false, false]);
  const [teaser, setTeaser]     = useState<TeaserResult | null>(null);
  const [error, setError]       = useState("");
  const timersRef               = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    fetch(`/api/widget/branding?agencyId=${encodeURIComponent(agencyId)}`)
      .then(r => r.json())
      .then(d => { if (d.agencyName) setBranding(d); })
      .catch(() => null);
    fetch("/api/widget/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyId }),
    }).catch(() => null);
  }, [agencyId]);

  // Color priority: teaser-color > ?color=preset > agency branding > default
  const primary =
    teaser?.agencyColor ??
    (colorParam && COLOR_PRESETS[colorParam]) ??
    branding?.agencyColor ??
    "#007BFF";

  async function handleStartScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setError("");
    setPhase("scanning");
    setStep(0);
    setStepDone([false, false, false]);

    const t1 = setTimeout(() => { setStepDone(p => { const n = [...p]; n[0] = true; return n; }); setStep(1); }, 1400);
    const t2 = setTimeout(() => { setStepDone(p => { const n = [...p]; n[1] = true; return n; }); setStep(2); }, 4200);
    timersRef.current = [t1, t2];

    try {
      const res = await fetch("/api/widget/teaser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, url }),
      });
      const data = await res.json() as TeaserResult & { error?: string; ok?: boolean };
      timersRef.current.forEach(clearTimeout);

      if (!res.ok || !data.ok) {
        setPhase("form");
        setError(data.error ?? "Scan fehlgeschlagen. Bitte URL prüfen.");
        return;
      }

      setStepDone([true, true, true]);
      setStep(2);
      await new Promise(r => setTimeout(r, 500));
      setTeaser(data);
      setPhase("teaser");
    } catch {
      timersRef.current.forEach(clearTimeout);
      setPhase("form");
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !teaser) return;
    setError("");
    setPhase("unlocking");
    try {
      const res = await fetch("/api/widget/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teaserToken: teaser.teaserToken, email }),
      });
      const data = await res.json() as { ok?: boolean; leadId?: string; error?: string };
      if (!res.ok || !data.ok || !data.leadId) {
        setPhase("teaser");
        setError(data.error ?? "Konnte nicht entsperren. Bitte erneut versuchen.");
        return;
      }
      router.push(`/widget/${agencyId}/report/${data.leadId}`);
    } catch {
      setPhase("teaser");
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    }
  }

  const name = teaser?.agencyName ?? branding?.agencyName ?? "Deine Agentur";
  const logo = teaser?.agencyLogo ?? branding?.agencyLogo ?? null;

  const progress = phase === "scanning"
    ? stepDone.filter(Boolean).length === 3 ? 100
    : stepDone.filter(Boolean).length === 2 ? 80
    : stepDone.filter(Boolean).length === 1 ? 45
    : 10
    : 0;

  // Verdict aus Teaser ableiten (für die Headline im Teaser-Screen)
  const hasCriticalRisk  = teaser?.risks.some(r => r.severity === "red") ?? false;
  const riskHeadline = !teaser ? ""
    : hasCriticalRisk ? "Mehrere kritische Risiken erkannt"
    : teaser.risks.length > 0 ? "Optimierungspotenzial erkannt"
    : "Deine Website sieht solide aus";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0c10",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: phase === "teaser" ? 520 : 420,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, overflow: "hidden",
        boxShadow: `0 0 60px ${primary}18`,
        transition: "max-width 0.35s ease",
      }}>

        {/* Header */}
        <div style={{
          padding: "26px 28px 22px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: `linear-gradient(135deg, ${primary}18, transparent)`,
        }}>
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logo} alt={name} style={{ height: 32, marginBottom: 14, objectFit: "contain" }} />
          ) : (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14,
              padding: "5px 14px", borderRadius: 20,
              background: `${primary}18`, border: `1px solid ${primary}35`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: primary }}>{name}</span>
            </div>
          )}
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            {phase === "teaser" ? riskHeadline : "Gratis Website-Audit"}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            {phase === "teaser"
              ? `${teaser?.score ?? 0}/100 Score · ${teaser?.redCount ?? 0} kritische, ${teaser?.yellowCount ?? 0} gelbe Hinweise`
              : "Builder-Check, DSGVO-Risiken, Performance-Score — in 30 Sekunden."}
          </p>
        </div>

        {/* Form phase */}
        {phase === "form" && (
          <form onSubmit={handleStartScan} style={{ padding: "22px 28px 26px" }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Deine Website-URL
              </label>
              <input
                type="url"
                placeholder="https://deine-website.de"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
                autoFocus
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${url ? `${primary}40` : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 10, color: "#fff", fontSize: 14,
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
                }}
              />
            </div>
            {error && (
              <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 13, color: "#ef4444" }}>
                {error}
              </div>
            )}
            <button type="submit" style={{
              width: "100%", padding: "13px",
              background: primary, color: "#fff",
              border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              boxShadow: `0 4px 16px ${primary}40`,
            }}>
              Kostenlos analysieren →
            </button>
            <p style={{ margin: "12px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6 }}>
              Kein Account · keine E-Mail nötig für die Sofort-Analyse
            </p>
          </form>
        )}

        {/* Scanning phase */}
        {phase === "scanning" && (
          <div style={{ padding: "28px 28px 30px" }}>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginBottom: 24, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: `linear-gradient(90deg, ${primary}, ${primary}aa)`,
                width: `${progress}%`, transition: "width 0.8s ease",
                boxShadow: `0 0 8px ${primary}60`,
              }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SCAN_STEPS.map((label, i) => {
                const done   = stepDone[i];
                const active = step === i && !done;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? `${primary}25` : active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${done ? `${primary}60` : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                      {done ? (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke={primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : active ? (
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          border: `2px solid rgba(255,255,255,0.15)`,
                          borderTopColor: primary, animation: "wf-spin 0.7s linear infinite",
                        }} />
                      ) : (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      color: done ? "rgba(255,255,255,0.55)" : active ? "#fff" : "rgba(255,255,255,0.25)",
                    }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teaser phase — Risiken anzeigen + Email-Gate */}
        {phase === "teaser" && teaser && (
          <div style={{ padding: "22px 28px 26px" }}>
            {/* Score pill row */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {teaser.builder && (
                <Pill label={`${teaser.builder} erkannt`} color={primary} />
              )}
              {teaser.isWooCommerce && (
                <Pill label="WooCommerce-Shop" color="#7F54B3" />
              )}
              <Pill label={`Score ${teaser.score}/100`} color={teaser.score >= 70 ? "#4ade80" : teaser.score >= 50 ? "#fbbf24" : "#f87171"} />
            </div>

            {/* Risk list */}
            {teaser.risks.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {teaser.risks.slice(0, 4).map((risk, i) => (
                  <div key={i} style={{
                    padding: "11px 13px", borderRadius: 9,
                    background: risk.severity === "red" ? "rgba(239,68,68,0.10)" : "rgba(251,191,36,0.08)",
                    border: `1px solid ${risk.severity === "red" ? "rgba(239,68,68,0.28)" : "rgba(251,191,36,0.26)"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                        stroke={risk.severity === "red" ? "#f87171" : "#fbbf24"}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: risk.severity === "red" ? "#f87171" : "#fbbf24", letterSpacing: "-0.01em" }}>
                        {risk.label}
                      </span>
                    </div>
                    <p style={{ margin: "2px 0 0 20px", fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                      {risk.detail}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: "12px 14px", borderRadius: 9, marginBottom: 20,
                background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)",
                fontSize: 12.5, color: "#4ade80",
              }}>
                Keine kritischen Befunde — wenn du noch Wachstumspotenzial suchst, zeigen wir dir im Detail-Report, wo du Scores verbessern kannst.
              </div>
            )}

            {/* Email Gate */}
            <form onSubmit={handleUnlock} style={{
              padding: "14px 16px", borderRadius: 11,
              background: `linear-gradient(135deg, ${primary}14, ${primary}05)`,
              border: `1px solid ${primary}40`,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 800, color: primary, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Vollen Optimierungs-Plan freischalten
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                Erhalte {teaser.issueCount} konkrete Handlungsempfehlungen inkl. DOM-Analyse, Font-Check und {teaser.isWooCommerce ? "Shop-Audit" : "Technik-Deep-Dive"} per Mail.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  type="email"
                  placeholder="name@beispiel.de"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    flex: "1 1 180px", padding: "11px 13px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 9, color: "#fff", fontSize: 13,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
                <button type="submit" style={{
                  padding: "11px 18px",
                  background: primary, color: "#fff",
                  border: "none", borderRadius: 9,
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  boxShadow: `0 3px 12px ${primary}50`,
                  whiteSpace: "nowrap",
                }}>
                  Plan ansehen →
                </button>
              </div>
              {error && (
                <div style={{ marginTop: 10, fontSize: 11.5, color: "#f87171" }}>
                  {error}
                </div>
              )}
              <p style={{ margin: "10px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.28)" }}>
                Kein Spam · nur der Plan. Abmeldung mit einem Klick.
              </p>
            </form>
          </div>
        )}

        {/* Unlocking phase — brief spinner */}
        {phase === "unlocking" && (
          <div style={{ padding: "38px 28px", textAlign: "center" }}>
            <span style={{
              display: "inline-block",
              width: 32, height: 32, borderRadius: "50%",
              border: `3px solid rgba(255,255,255,0.1)`,
              borderTopColor: primary,
              animation: "wf-spin 0.6s linear infinite",
              marginBottom: 14,
            }} />
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              Plan wird geladen…
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: "11px 28px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Powered by</span>
          <a href="https://website-fix.com" target="_blank" rel="noopener noreferrer" style={{
            fontSize: 11, fontWeight: 700, textDecoration: "none",
            background: "linear-gradient(90deg, rgba(255,255,255,0.4), rgba(245,158,11,0.5))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.02em",
          }}>
            WebsiteFix
          </a>
        </div>
      </div>

      <style>{`@keyframes wf-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      padding: "4px 10px", borderRadius: 20,
      background: `${color}18`, border: `1px solid ${color}35`,
      color, letterSpacing: "-0.01em", whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}
