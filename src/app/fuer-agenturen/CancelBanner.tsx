"use client";

/**
 * CancelBanner — Hinweis-Banner für /fuer-agenturen.
 *
 * Wird gerendert wenn `?checkout=cancelled` in der URL steht. Stripe ruft
 * diesen Param via cancel_url in /api/checkout auf, wenn der User die
 * Subscription-Bezahlung abbricht. Ohne Banner würde der User auf der
 * normalen Marketing-Page landen und nicht wissen, was passiert ist.
 *
 * Server-Component-Page kompatibel: dieser Wrapper nutzt useSearchParams
 * und muss daher in <Suspense> gepackt werden — siehe page.tsx.
 */

import { useSearchParams } from "next/navigation";

export default function CancelBanner() {
  const params = useSearchParams();
  const cancelled = params.get("checkout") === "cancelled";
  if (!cancelled) return null;

  return (
    <div role="status" aria-live="polite" style={{
      maxWidth: 1100, margin: "16px auto 0", padding: "12px 22px", borderRadius: 11,
      background: "rgba(251,191,36,0.10)",
      border: "1px solid rgba(251,191,36,0.34)",
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#FBBF24", marginBottom: 2 }}>
          Checkout abgebrochen — keine Belastung erfolgt
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
          Du kannst jederzeit einen neuen Versuch starten. Bei Fragen:{" "}
          <a href="mailto:support@website-fix.com" style={{ color: "#FBBF24", textDecoration: "underline", textUnderlineOffset: 2 }}>
            support@website-fix.com
          </a>
        </div>
      </div>
    </div>
  );
}
