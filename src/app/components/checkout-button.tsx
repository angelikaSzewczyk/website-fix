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
        // Not logged in → send to login with return URL
        window.location.href = `/login?callbackUrl=${encodeURIComponent("/fuer-agenturen#pricing")}`;
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
        opacity: loading ? 0.75 : 1,
        ...style,
      }}
    >
      {loading ? "Weiterleiten…" : label}
    </button>
  );
}
