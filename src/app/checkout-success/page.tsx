"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BrandLogo from "../components/BrandLogo";

type Status = "verifying" | "success" | "error";

function CheckoutSuccessContent() {
  const searchParams  = useSearchParams();
  const plan          = searchParams.get("plan") ?? "starter";
  const sessionId     = searchParams.get("session_id") ?? "";

  const [status, setStatus]   = useState<Status>("verifying");
  const [message, setMessage] = useState("Zahlung wird verifiziert…");
  const [seconds, setSeconds] = useState(3);

  const planLabel: Record<string, string> = {
    starter:          "Starter",
    professional:     "Professional",
    "smart-guard":    "Professional",
    "agency-starter": "Agency",
  };

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage("Keine Session-ID gefunden.");
      return;
    }

    // 1. Verify & update plan in DB directly (webhook-independent)
    fetch("/api/verify-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.paid) {
          setStatus("success");
          setMessage("Dashboard wird freigeschaltet…");
          // 2. Countdown → redirect
          let s = 3;
          setSeconds(s);
          const iv = setInterval(() => {
            s -= 1;
            setSeconds(s);
            if (s <= 0) {
              clearInterval(iv);
              window.location.href = "/dashboard";
            }
          }, 1000);
        } else {
          setStatus("error");
          setMessage(data.error ?? "Zahlung konnte nicht verifiziert werden.");
        }
      })
      .catch(err => {
        setStatus("error");
        setMessage(`Verbindungsfehler: ${String(err)}`);
      });
  }, [sessionId]);

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", display: "flex", flexDirection: "column" }}>
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
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

          {/* Icon */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 28px",
            background: status === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
            border: `2px solid ${status === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: status === "error" ? "0 0 60px rgba(239,68,68,0.1)" : "0 0 60px rgba(34,197,94,0.1)",
          }}>
            {status === "verifying" ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)"
                strokeWidth="2.5" strokeLinecap="round"
                style={{ animation: "spin 1s linear infinite" }}>
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            ) : status === "success" ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            )}
          </div>

          {/* Badge */}
          {status !== "verifying" && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20,
              padding: "5px 14px", borderRadius: 20,
              background: status === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${status === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              color: status === "success" ? "#22C55E" : "#EF4444",
              fontWeight: 700, fontSize: 12, letterSpacing: "0.05em",
            }}>
              {status === "success" ? `✓ ${planLabel[plan] ?? plan} aktiviert` : "⚠ Fehler"}
            </div>
          )}

          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            {status === "verifying" ? "Zahlung wird geprüft…"
              : status === "success" ? "Zahlung empfangen."
              : "Etwas ist schiefgelaufen."}
          </h1>

          <p style={{
            fontSize: 17, fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.01em",
            color: status === "error" ? "#EF4444" : "#22C55E",
          }}>
            {message}
          </p>

          {status === "verifying" && (
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 40px", lineHeight: 1.7 }}>
              Bitte warte einen Moment — wir aktivieren deinen Account.
            </p>
          )}

          {/* Countdown nach Erfolg */}
          {status === "success" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 24 }}>
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
                Weiterleitung in {seconds}s…
              </span>
              <a href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textDecoration: "none", marginTop: 16 }}>
                Jetzt direkt zum Dashboard →
              </a>
            </div>
          )}

          {/* Fehler-Anweisungen */}
          {status === "error" && (
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                Deine Zahlung wurde möglicherweise trotzdem verarbeitet.<br/>
                Warte 30 Sekunden und versuche es erneut.
              </p>
              <a href="/dashboard" style={{
                padding: "11px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "#2563EB", color: "#fff", textDecoration: "none",
                display: "inline-block", marginTop: 8,
              }}>
                Zum Dashboard →
              </a>
              <a href="/fuer-agenturen" style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textDecoration: "none" }}>
                Zurück zu den Preisen
              </a>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
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
