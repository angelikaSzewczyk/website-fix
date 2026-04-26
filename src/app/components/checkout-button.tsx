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
        fontSize: 12, color: "#EF4444", marginBottom: 8,
        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: 6, padding: "6px 10px",
      }}>
        ⚠ {error}
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
