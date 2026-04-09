"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Branding = { agencyName: string; agencyColor: string; agencyLogo: string | null };

const STEPS = [
  "Website wird abgerufen…",
  "KI analysiert deine Seite…",
  "Report wird erstellt…",
];

export default function WidgetPage() {
  const params   = useParams();
  const router   = useRouter();
  const agencyId = params.agencyId as string;

  const [branding, setBranding] = useState<Branding | null>(null);
  const [url, setUrl]           = useState("");
  const [email, setEmail]       = useState("");
  const [phase, setPhase]       = useState<"form" | "scanning">("form");
  const [step, setStep]         = useState(0);       // 0-2 loading steps
  const [stepDone, setStepDone] = useState<boolean[]>([false, false, false]);
  const [error, setError]       = useState("");
  const timersRef               = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    fetch(`/api/widget/branding?agencyId=${encodeURIComponent(agencyId)}`)
      .then(r => r.json())
      .then(d => { if (d.agencyName) setBranding(d); })
      .catch(() => null);
  }, [agencyId]);

  const primary = branding?.agencyColor ?? "#007BFF";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !email) return;
    setPhase("scanning");
    setStep(0);
    setStepDone([false, false, false]);

    // Animate steps while API runs in parallel
    const t1 = setTimeout(() => { setStepDone(p => { const n = [...p]; n[0] = true; return n; }); setStep(1); }, 1200);
    const t2 = setTimeout(() => { setStepDone(p => { const n = [...p]; n[1] = true; return n; }); setStep(2); }, 4000);
    timersRef.current = [t1, t2];

    try {
      const res = await fetch("/api/widget/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, url, email }),
      });
      const data = await res.json();

      // Clear step timers
      timersRef.current.forEach(clearTimeout);

      if (!res.ok || !data.ok) {
        setPhase("form");
        setError(data.error ?? "Fehler beim Scan. Bitte erneut versuchen.");
        return;
      }

      // Mark all steps done, then redirect
      setStepDone([true, true, true]);
      setStep(2);
      await new Promise(r => setTimeout(r, 600)); // brief "done" flash

      if (data.leadId) {
        router.push(`/widget/${agencyId}/report/${data.leadId}`);
      } else {
        // Fallback: old thank-you page
        const qs = new URLSearchParams({
          score: String(data.score ?? 0),
          agency: data.agencyName ?? "",
          color: data.agencyColor ?? primary,
          url,
        });
        router.push(`/widget/${agencyId}/thank-you?${qs}`);
      }
    } catch {
      timersRef.current.forEach(clearTimeout);
      setPhase("form");
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    }
  }

  const name = branding?.agencyName ?? "Deine Agentur";

  // ── Progress bar percentage
  const progress = phase === "scanning"
    ? stepDone.filter(Boolean).length === 3 ? 100
    : stepDone.filter(Boolean).length === 2 ? 80
    : stepDone.filter(Boolean).length === 1 ? 45
    : 10
    : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0c10",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, overflow: "hidden",
        boxShadow: `0 0 60px ${primary}18`,
      }}>

        {/* Header */}
        <div style={{
          padding: "28px 28px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: `linear-gradient(135deg, ${primary}18, transparent)`,
        }}>
          {branding?.agencyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.agencyLogo} alt={name} style={{ height: 32, marginBottom: 16, objectFit: "contain" }} />
          ) : (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16,
              padding: "5px 14px", borderRadius: 20,
              background: `${primary}18`, border: `1px solid ${primary}35`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: primary }}>{name}</span>
            </div>
          )}
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            Gratis Barrierefreiheits-Check
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            KI-Analyse deiner Website in Sekunden — kostenlos und unverbindlich.
          </p>
        </div>

        {/* Form phase */}
        {phase === "form" && (
          <form onSubmit={handleSubmit} style={{ padding: "24px 28px 28px" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Website-URL
              </label>
              <input
                type="url"
                placeholder="https://deine-website.de"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${url ? `${primary}40` : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 10, color: "#fff", fontSize: 14,
                  outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Deine E-Mail (für den Bericht)
              </label>
              <input
                type="email"
                placeholder="name@beispiel.de"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${email ? `${primary}40` : "rgba(255,255,255,0.1)"}`,
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
              transition: "all 0.15s",
            }}>
              Kostenlos analysieren →
            </button>
            <p style={{ margin: "14px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6 }}>
              Kein Spam. Deine Daten werden nur für die Analyse verwendet.
            </p>
          </form>
        )}

        {/* Scanning phase */}
        {phase === "scanning" && (
          <div style={{ padding: "32px 28px 36px" }}>
            {/* Progress bar */}
            <div style={{
              height: 4, borderRadius: 2,
              background: "rgba(255,255,255,0.07)",
              marginBottom: 28, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: `linear-gradient(90deg, ${primary}, ${primary}aa)`,
                width: `${progress}%`,
                transition: "width 0.8s ease",
                boxShadow: `0 0 8px ${primary}60`,
              }} />
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {STEPS.map((label, i) => {
                const done    = stepDone[i];
                const active  = step === i && !done;
                const pending = step < i;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Icon */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: done ? `${primary}25` : active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${done ? `${primary}60` : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                      transition: "all 0.3s",
                    }}>
                      {done ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6L5 9L10 3" stroke={primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : active ? (
                        <span style={{
                          width: 8, height: 8, borderRadius: "50%",
                          border: `2px solid rgba(255,255,255,0.15)`,
                          borderTopColor: primary,
                          display: "inline-block",
                          animation: "wf-spin 0.7s linear infinite",
                        }} />
                      ) : (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      color: done ? "rgba(255,255,255,0.6)" : active ? "#fff" : "rgba(255,255,255,0.25)",
                      transition: "all 0.3s",
                    }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p style={{ margin: "24px 0 0", fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              Das kann 10–30 Sekunden dauern — bitte nicht schließen.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: "12px 28px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Powered by</span>
          <a
            href="https://website-fix.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11, fontWeight: 700, textDecoration: "none",
              background: "linear-gradient(90deg, rgba(255,255,255,0.4), rgba(245,158,11,0.5))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.02em",
            }}
          >
            WebsiteFix
          </a>
        </div>
      </div>

      <style>{`@keyframes wf-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
