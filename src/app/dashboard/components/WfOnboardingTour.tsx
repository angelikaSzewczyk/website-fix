"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, ChevronLeft, Search, BarChart2, FileText } from "lucide-react";

const ONBOARDING_KEY = "wf_onboarding_done";
const PRO_PLANS = ["professional", "smart-guard", "agency-pro", "agency-starter"];

type Phase = "welcome" | "wizard-1" | "wizard-2" | "wizard-3" | "tour" | null;

// ─── Tour steps (non-pro / feature overview) ──────────────────────────────────
const TOUR_STEPS = [
  {
    icon: <Search size={20} strokeWidth={1.8} />,
    title: "Schritt 1 — Scan starten",
    body: "Gib hier die URL deiner Website ein. Wir prüfen bis zu 25 Seiten auf SEO- und Technik-Fehler — in unter 60 Sekunden.",
  },
  {
    icon: <BarChart2 size={20} strokeWidth={1.8} />,
    title: "Schritt 2 — Ergebnisse lesen",
    body: "Hier erscheinen deine Ergebnisse. Kategorisiert in Kritisch, Warnungen und Optimierungen — mit direkten Fix-Anleitungen.",
  },
  {
    icon: <FileText size={20} strokeWidth={1.8} />,
    title: "Schritt 3 — Berichte exportieren",
    body: "Deine fertigen Berichte kannst du jederzeit exportieren und als PDF an Kunden weitergeben.",
  },
];

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter", professional: "Professional",
  "smart-guard": "Professional", "agency-starter": "Agency", "agency-pro": "Agency Pro",
};

// ─── Animated scan item ───────────────────────────────────────────────────────
function ScanItem({ label, delay }: { label: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const [done, setDone]       = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay);
    const t2 = setTimeout(() => setDone(true), delay + 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);
  if (!visible) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px", borderRadius: 10, marginBottom: 8,
      background: done ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${done ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.07)"}`,
      transition: "background 0.4s, border-color 0.4s",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: done ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${done ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.1)"}`,
        transition: "all 0.4s",
      }}>
        {done
          ? <Check size={10} strokeWidth={3} color="#10B981" />
          : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FBBF24", animation: "wf-ob-pulse 0.8s ease-in-out infinite" }} />
        }
      </div>
      <span style={{ fontSize: 13, color: done ? "#10B981" : "rgba(255,255,255,0.6)", fontWeight: done ? 600 : 400, transition: "color 0.4s" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props { firstName: string; plan: string; scansCount: number; }

export default function WfOnboardingTour({ firstName, plan, scansCount }: Props) {
  const [phase, setPhase]       = useState<Phase>(null);
  const [tourStep, setTourStep] = useState(0);
  const router = useRouter();
  const isPro = PRO_PLANS.includes(plan);

  // Wizard state (pro)
  const [agencyName, setAgencyName] = useState("");
  const [logoUrl,    setLogoUrl]    = useState("");
  const [scanUrl,    setScanUrl]    = useState("");
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY) && scansCount === 0) {
        setPhase(isPro ? "wizard-1" : "welcome");
      }
    } catch { /* ignore */ }
  }, [scansCount, isPro]);

  // Wizard-3: auto-redirect after animation
  useEffect(() => {
    if (phase !== "wizard-3") return;
    const t = setTimeout(() => {
      finish();
      router.push(scanUrl ? `/dashboard/scan?url=${encodeURIComponent(scanUrl)}` : "/dashboard/scan");
    }, 3200);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function finish() {
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch { /* ignore */ }
    setPhase(null);
  }

  async function advanceFromSlide1() {
    if (!agencyName && !logoUrl) { setPhase("wizard-2"); return; }
    setSaving(true);
    try {
      await fetch("/api/agency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agency_name: agencyName, logo_url: logoUrl, primary_color: "#8df3d3", agency_website: "" }),
      });
    } catch { /* non-critical */ }
    setSaving(false);
    setPhase("wizard-2");
  }

  if (phase === null) return null;

  const planLabel = PLAN_LABEL[plan] ?? plan;

  // ── Shared overlay styles ──────────────────────────────────────────────────
  const overlayBg = (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }} />
  );

  const cardBase: React.CSSProperties = {
    position: "fixed", top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1001,
    width: "min(540px, calc(100vw - 32px))",
    background: "linear-gradient(135deg, #0d1520 0%, #0e1a2e 100%)",
    border: "1px solid rgba(16,185,129,0.22)",
    borderRadius: 24,
    padding: "40px 36px 32px",
    animation: "wf-ob-in 0.38s cubic-bezier(0.22,1,0.36,1) both, wf-ob-glow 3.5s ease-in-out 0.5s infinite",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 14,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  };

  const proGradBtn: React.CSSProperties = {
    width: "100%", padding: "14px 24px", borderRadius: 12,
    background: "linear-gradient(90deg, #10B981, #059669)",
    color: "#fff", fontSize: 14, fontWeight: 800,
    border: "none", cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 4px 24px rgba(16,185,129,0.35)",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "box-shadow 0.2s",
  };

  // ──────────────────────────────────────────────────────────────────────────
  // WIZARD SLIDE 1 — Agency Branding
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === "wizard-1") {
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
            0%, 100% { box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 50px rgba(16,185,129,0.06); }
            50%       { box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 80px rgba(16,185,129,0.12); }
          }
        `}</style>
        {overlayBg}
        <div style={cardBase}>
          {/* Step indicator */}
          <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{
                height: 3, borderRadius: 2, flex: 1,
                background: n === 1 ? "linear-gradient(90deg,#10B981,#059669)" : "rgba(255,255,255,0.1)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>

          {/* Icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: "0 auto 20px",
            background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>

          <span style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#10B981", marginBottom: 8 }}>
            SCHRITT 1 VON 3 · PROFESSIONAL SETUP
          </span>
          <h1 style={{ textAlign: "center", margin: "0 0 8px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
            Lass uns dein Branding einrichten.
          </h1>
          <p style={{ textAlign: "center", margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            Deine Berichte erscheinen ab sofort unter deinem Namen — nicht unter WebsiteFix.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Agency name */}
            <div>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 600 }}>
                Agenturname
              </label>
              <input
                style={inputStyle}
                placeholder="z.B. Meine Digitalagentur GmbH"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Logo upload */}
            <div>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 600 }}>
                Agentur-Logo
              </label>
              {logoUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="" style={{ height: 32, maxWidth: 120, objectFit: "contain" }} />
                  <button onClick={() => setLogoUrl("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(255,107,107,0.7)", fontSize: 12, fontFamily: "inherit" }}>
                    Entfernen
                  </button>
                </div>
              ) : (
                <label style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                  background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)",
                  fontSize: 13, color: "rgba(255,255,255,0.45)",
                  transition: "border-color 0.15s",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Logo hochladen (PNG, SVG, WebP)
                  <input type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" style={{ display: "none" }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => setLogoUrl(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <button
            onClick={advanceFromSlide1}
            disabled={saving}
            style={{ ...proGradBtn, marginTop: 28 }}
          >
            {saving ? "Speichert…" : <>{agencyName || logoUrl ? "Speichern & weiter" : "Später einrichten"} <ArrowRight size={15} strokeWidth={2.5} /></>}
          </button>
          <button onClick={finish} style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.22)", fontFamily: "inherit" }}>
            Überspringen
          </button>
        </div>
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WIZARD SLIDE 2 — First Scan URL
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === "wizard-2") {
    const canScan = scanUrl.trim().length > 4;
    return (
      <>
        <style>{`
          @keyframes wf-ob-in {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.94); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes wf-ob-glow {
            0%, 100% { box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 50px rgba(16,185,129,0.06); }
            50%       { box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 80px rgba(16,185,129,0.12); }
          }
        `}</style>
        {overlayBg}
        <div style={cardBase}>
          {/* Step indicator */}
          <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{
                height: 3, borderRadius: 2, flex: 1,
                background: n <= 2 ? "linear-gradient(90deg,#10B981,#059669)" : "rgba(255,255,255,0.1)",
              }} />
            ))}
          </div>

          {/* Icon */}
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: "0 auto 20px",
            background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>

          <span style={{ display: "block", textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#10B981", marginBottom: 8 }}>
            SCHRITT 2 VON 3 · ERSTER SCAN
          </span>
          <h1 style={{ textAlign: "center", margin: "0 0 8px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
            Bereit für den ersten Erfolg?
          </h1>
          <p style={{ textAlign: "center", margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            Wir prüfen SEO, Technik, Sicherheit und Barrierefreiheit — in unter 60 Sekunden.
          </p>

          <div>
            <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 600 }}>
              Website-URL
            </label>
            <input
              style={{ ...inputStyle, fontSize: 15 }}
              placeholder="https://deine-website.de"
              value={scanUrl}
              onChange={e => setScanUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canScan && setPhase("wizard-3")}
              autoFocus
            />
          </div>

          <button
            onClick={() => canScan && setPhase("wizard-3")}
            disabled={!canScan}
            style={{
              ...proGradBtn,
              marginTop: 24,
              opacity: canScan ? 1 : 0.45,
              cursor: canScan ? "pointer" : "default",
            }}
          >
            Scan starten <ArrowRight size={15} strokeWidth={2.5} />
          </button>

          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
            <button onClick={() => setPhase("wizard-1")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.22)", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ChevronLeft size={12} strokeWidth={2} /> Zurück
            </button>
            <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12, lineHeight: "24px" }}>·</span>
            <button onClick={() => { finish(); router.push("/dashboard/scan"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.22)", fontFamily: "inherit" }}>
              Direkt zum Scan
            </button>
          </div>
        </div>
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WIZARD SLIDE 3 — Launch Animation
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === "wizard-3") {
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
          @keyframes wf-ob-spin {
            to { transform: rotate(360deg); }
          }
          @keyframes wf-ob-glow {
            0%, 100% { box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(16,185,129,0.08); }
            50%       { box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 100px rgba(16,185,129,0.18); }
          }
        `}</style>
        {overlayBg}
        <div style={cardBase}>
          {/* Step indicator — all filled */}
          <div style={{ display: "flex", gap: 5, marginBottom: 28 }}>
            {[1,2,3].map(n => (
              <div key={n} style={{ height: 3, borderRadius: 2, flex: 1, background: "linear-gradient(90deg,#10B981,#059669)" }} />
            ))}
          </div>

          {/* Pulsing spinner */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%", margin: "0 auto 20px",
            background: "rgba(16,185,129,0.08)", border: "2px solid rgba(16,185,129,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "wf-ob-spin 1s linear infinite" }}>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>

          <h1 style={{ textAlign: "center", margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
            Wir prüfen deine Website…
          </h1>
          <p style={{ textAlign: "center", margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            SEO, Technik und Sicherheit — wird gleich gestartet.
          </p>

          <div style={{ padding: "0 4px" }}>
            <ScanItem label="SEO-Analyse vorbereiten…"        delay={200} />
            <ScanItem label="Technik & Performance prüfen…"   delay={900} />
            <ScanItem label="Sicherheits-Scan starten…"       delay={1600} />
          </div>

          {scanUrl && (
            <div style={{ marginTop: 20, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {scanUrl}
              </span>
            </div>
          )}
        </div>
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NON-PRO: Simple Welcome Overlay
  // ──────────────────────────────────────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <>
        <style>{`
          @keyframes wf-ob-in {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.94); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes wf-ob-glow {
            0%, 100% { box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 50px rgba(34,197,94,0.05); }
            50%       { box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 70px rgba(34,197,94,0.09); }
          }
        `}</style>

        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)" }} />

        <div style={{ ...cardBase, border: "1px solid rgba(34,197,94,0.22)" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", margin: "0 auto 24px", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)", color: "#22C55E", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
              <Check size={11} strokeWidth={3} /> {planLabel}-Plan aktiv
            </span>
          </div>

          <h1 style={{ textAlign: "center", margin: "0 0 10px", fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            Willkommen bei WebsiteFix, {firstName}!
          </h1>
          <p style={{ textAlign: "center", margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
            Lass uns direkt deinen ersten Scan starten, um kritische Fehler zu finden.
          </p>

          {/* Checklist */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "6px 18px", marginBottom: 28 }}>
            {([
              { label: "Account erstellt", done: true },
              { label: "Plan aktiviert",    done: true },
              { label: "Ersten Scan starten", done: false },
            ] as { label: string; done: boolean }[]).map((item, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: item.done ? "rgba(34,197,94,0.12)" : "rgba(251,191,36,0.08)", border: `1.5px solid ${item.done ? "rgba(34,197,94,0.35)" : "rgba(251,191,36,0.32)"}` }}>
                  {item.done ? <Check size={11} strokeWidth={3} color="#22C55E" /> : <Clock size={11} strokeWidth={2.5} color="#FBBF24" />}
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: item.done ? 400 : 700, color: item.done ? "rgba(255,255,255,0.5)" : "#fff", textDecoration: item.done ? "line-through" : "none" }}>
                  {item.label}
                </span>
                {item.done
                  ? <Check size={13} strokeWidth={2.5} color="#22C55E" />
                  : <span style={{ fontSize: 9, color: "#FBBF24", fontWeight: 700, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.22)", padding: "2px 8px", borderRadius: 10, letterSpacing: "0.05em" }}>AUSSTEHEND</span>
                }
              </div>
            ))}
          </div>

          <button
            onClick={() => { finish(); router.push("/dashboard/scan"); }}
            style={{ width: "100%", padding: "13px 24px", borderRadius: 11, background: "#22C55E", color: "#0b0c10", fontSize: 14, fontWeight: 800, cursor: "pointer", border: "none", fontFamily: "inherit", boxShadow: "0 4px 24px rgba(34,197,94,0.28)", marginBottom: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            Ersten Scan starten <ArrowRight size={15} strokeWidth={2.5} />
          </button>

          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
            <button onClick={() => { setTourStep(0); setPhase("tour"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "inherit", padding: "4px 10px" }}>
              Feature-Übersicht ansehen
            </button>
            <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12, lineHeight: "28px" }}>·</span>
            <button onClick={finish} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "inherit", padding: "4px 10px" }}>
              Überspringen
            </button>
          </div>
        </div>
      </>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FEATURE TOUR (bottom panel)
  // ──────────────────────────────────────────────────────────────────────────
  const current = TOUR_STEPS[tourStep];
  const isLast  = tourStep === TOUR_STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes wf-tour-in {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div onClick={finish} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }} />

      <div style={{
        position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
        zIndex: 1001, width: "min(480px, calc(100vw - 32px))",
        background: "#0F1117", border: "1px solid rgba(251,191,36,0.28)",
        borderRadius: 16, padding: "28px 32px 24px",
        boxShadow: "0 0 0 1px rgba(251,191,36,0.06), 0 24px 64px rgba(0,0,0,0.7)",
        animation: "wf-tour-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 20 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} style={{ height: 3, borderRadius: 2, flex: i <= tourStep ? 2 : 1, background: i <= tourStep ? "#FBBF24" : "rgba(255,255,255,0.1)", transition: "flex 0.3s ease" }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: "10px 12px", flexShrink: 0, color: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current.icon}
          </div>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{current.title}</p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{current.body}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={finish} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.28)", padding: 0 }}>Überspringen</button>
          <div style={{ display: "flex", gap: 8 }}>
            {tourStep > 0 && (
              <button onClick={() => setTourStep(s => s - 1)} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ChevronLeft size={14} strokeWidth={2} /> Zurück
              </button>
            )}
            <button onClick={() => isLast ? finish() : setTourStep(s => s + 1)} style={{ padding: "8px 20px", borderRadius: 8, background: "#FBBF24", border: "none", color: "#0b0c10", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {isLast ? <><Check size={14} strokeWidth={2.5} /> Los geht&apos;s</> : <>Weiter <ArrowRight size={14} strokeWidth={2.5} /></>}
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
