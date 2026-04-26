"use client";
import { useState } from "react";

interface CheckoutButtonProps {
  plan: string;       // "starter" | "professional" | "agency"
  label: string;
  style?: React.CSSProperties;
  href?: string;      // fallback for enterprise (mailto)
}

export default function CheckoutButton({ plan, label, style, href }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Enterprise uses a mailto link
  if (href) {
    return (
      <a href={href} style={style}>
        {label}
      </a>
    );
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (res.status === 401) {
        // Not logged in → send to register with plan param so text + redirect are plan-aware
        window.location.href = `/register?plan=${encodeURIComponent(plan)}`;
      } else {
        console.error("Checkout error:", data.error);
        setError(data.error ?? "Fehler beim Checkout. Bitte erneut versuchen.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Checkout fetch error:", err);
      setError("Verbindungsfehler. Bitte Seite neu laden.");
      setLoading(false);
    }
  }

  return (
    <>
    {error && (
      <div style={{
        fontSize: 12, marginBottom: 10,
        background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.28)",
        borderRadius: 8, padding: "9px 12px",
        display: "flex", alignItems: "flex-start", gap: 8,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div style={{ flex: 1, color: "rgba(255,255,255,0.85)" }}>
          <div style={{ color: "#EF4444", fontWeight: 700, marginBottom: 2 }}>{error}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            Falls das Problem bestehen bleibt: Schreib uns direkt unter{" "}
            <a href="mailto:support@website-fix.com?subject=Checkout-Problem"
              style={{ color: "#7aa6ff", textDecoration: "underline" }}>
              support@website-fix.com
            </a>
            {" "}— wir aktivieren deinen Plan manuell.
          </div>
        </div>
      </div>
    )}
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.85 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
    >
      {loading && (
        <svg
          width="15" height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ animation: "checkout-spin 0.7s linear infinite", flexShrink: 0 }}
        >
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      )}
      {loading ? "Weiterleiten…" : label}
    </button>
    </>
  );
}
