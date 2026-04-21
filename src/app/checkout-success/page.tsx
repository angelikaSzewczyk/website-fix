"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BrandLogo from "../components/BrandLogo";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "starter";
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    // Countdown
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(interval);
          // Hard redirect → Dashboard-Layout macht frische DB-Abfrage (JWT irrelevant)
          window.location.href = "/dashboard";
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const planLabel: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    "smart-guard": "Professional",
    "agency-starter": "Agency",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0b0c10",
      display: "flex", flexDirection: "column",
    }}>
      {/* NAV */}
      <nav style={{
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center" }}>
          <BrandLogo />
        </div>
      </nav>

      {/* MAIN */}
      <main style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 24px",
      }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

          {/* Checkmark */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 28px",
            background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 60px rgba(34,197,94,0.1)",
            animation: "pop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20,
            padding: "5px 14px", borderRadius: 20,
            background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)",
            color: "#22C55E", fontWeight: 700, fontSize: 12, letterSpacing: "0.05em",
          }}>
            ✓ {planLabel[plan] ?? plan} aktiviert
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 12px",
            letterSpacing: "-0.03em", lineHeight: 1.15,
          }}>
            Zahlung empfangen.
          </h1>
          <p style={{
            fontSize: 17, fontWeight: 700, color: "#22C55E", margin: "0 0 20px",
            letterSpacing: "-0.01em",
          }}>
            Wir schalten dein Dashboard frei…
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 40px", lineHeight: 1.7 }}>
            Dein Konto wird gerade aktiviert. Du wirst automatisch weitergeleitet.
          </p>

          {/* Spinner + countdown */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 56, height: 56 }}>
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none"
                style={{ animation: "spin 1s linear infinite", position: "absolute", inset: 0 }}>
                <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
                <path d="M28 4 A24 24 0 0 1 52 28" stroke="#22C55E" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#fff",
              }}>
                {seconds}
              </div>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
              Weiterleitung zum Dashboard in {seconds}s…
            </span>
          </div>

          {/* Manual link */}
          <div style={{ marginTop: 40 }}>
            <a href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>
              Jetzt direkt zum Dashboard →
            </a>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop  { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
