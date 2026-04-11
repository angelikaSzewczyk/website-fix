"use client";
import { useState } from "react";

interface CheckoutButtonProps {
  plan: string;       // "freelancer" | "agency_core" | "agency_scale"
  label: string;
  style?: React.CSSProperties;
  href?: string;      // fallback for enterprise (mailto)
}

export default function CheckoutButton({ plan, label, style, href }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

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
        // Not logged in → send to login, pass plan so AutoCheckout fires after login
        const returnUrl = `/fuer-agenturen?checkout=${encodeURIComponent(plan)}#pricing`;
        window.location.href = `/login?callbackUrl=${encodeURIComponent(returnUrl)}`;

      } else {
        console.error("Checkout error:", data.error);
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
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
  );
}
