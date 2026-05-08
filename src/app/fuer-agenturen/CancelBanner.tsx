"use client";

/**
 * CancelBanner — Hinweis-Banner für /fuer-agenturen.
 *
 * Erkennt zwei verschiedene Status-Parameter und rendert das passende
 * Banner:
 *   - ?checkout=cancelled  → User hat Stripe-Checkout abgebrochen
 *   - ?wall=no_plan        → User hat kein aktives Abo (Dashboard-Layout
 *                            redirected nach /fuer-agenturen, weil
 *                            users.plan IS NULL — z.B. nach Register-ohne-
 *                            Zahlung oder nach Subscription-Cancel)
 *
 * Server-Component-Page kompatibel: dieser Wrapper nutzt useSearchParams
 * und muss daher in <Suspense> gepackt werden — siehe page.tsx.
 */

import { useSearchParams } from "next/navigation";

export default function CancelBanner() {
  const params = useSearchParams();
  const cancelled = params.get("checkout") === "cancelled";
  const noPlan    = params.get("wall") === "no_plan";

  if (!cancelled && !noPlan) return null;

  // No-Plan-Banner hat Vorrang — User soll wissen, warum er hier ist.
  if (noPlan) {
    return (
      <div role="status" aria-live="polite" style={{
        maxWidth: 1100, margin: "16px auto 0", padding: "14px 22px", borderRadius: 11,
        background: "rgba(0,123,255,0.08)",
        border: "1px solid rgba(0,123,255,0.34)",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#7aa6ff", marginBottom: 2 }}>
            Dashboard-Zugang braucht ein aktives Abo
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.62)", lineHeight: 1.55 }}>
            Wir konnten kein aktives Abonnement für deinen Account finden. Wähle unten
            einen Plan, um den vollen Zugang freizuschalten — oder schreib uns bei{" "}
            <a href="mailto:support@website-fix.com" style={{ color: "#7aa6ff", textDecoration: "underline", textUnderlineOffset: 2 }}>
              support@website-fix.com
            </a>
            , wenn du bereits gezahlt hast und ein technisches Problem vermutest.
          </div>
        </div>
      </div>
    );
  }

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
