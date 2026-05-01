"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { PLANS, normalizePlan, type PlanKey } from "@/lib/plans";

const T = {
  page:    "#0b0c10",
  text:    "#fff",
  textSub: "rgba(255,255,255,0.55)",
  textMid: "rgba(255,255,255,0.7)",
  border:  "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.06)",
  card:    "rgba(255,255,255,0.02)",
  purple:  "#a78bfa",
};

/** Schwarz/Weiß-Text basierend auf Hex-Hintergrund. */
function contrastText(hex: string): "#000" | "#fff" {
  const cleaned = (hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return "#fff";
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#000" : "#fff";
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "wf-spin 0.85s linear infinite" }}>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

/**
 * /dashboard/settings für Pro+ und Agency — strikt Account/Billing/Passwort.
 *
 * Branding/SMTP/Domain/API-Key/Integrationen leben in /dashboard/agency-branding.
 * Hier KEIN Tab-Switcher — eine Sidebar-Klick = eine Mission.
 */
export default function ProfileSettingsClient({
  name, email, plan, brandColor,
}: {
  name:       string;
  email:      string;
  plan:       string;
  brandColor: string;
}) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError,   setPortalError]   = useState<string | null>(null);
  const [signingOut,    setSigningOut]    = useState(false);

  const canonical = (normalizePlan(plan) ?? "starter") as PlanKey;
  const planDef   = PLANS[canonical];

  async function openStripePortal() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data?.url === "string") {
        window.location.href = data.url;
      } else {
        setPortalError(data?.error ?? "Portal konnte nicht geöffnet werden.");
        setPortalLoading(false);
      }
    } catch {
      setPortalError("Verbindungsfehler — bitte erneut versuchen.");
      setPortalLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh", background: T.page, color: T.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "32px 32px 80px", maxWidth: 1280, margin: "0 auto",
    }}>
      <style>{`
        @keyframes wf-spin { to { transform: rotate(360deg); } }
        .wf-stripe-btn:not(:disabled):hover {
          transform: translateY(-1px);
          filter: brightness(0.94);
        }
        .wf-stripe-btn:not(:disabled):active { filter: brightness(0.88); transform: translateY(0); }
      `}</style>

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: 28, paddingBottom: 18, borderBottom: `1px solid ${T.divider}`,
      }}>
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Account &amp; Billing
        </p>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
          Einstellungen
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: T.textSub, maxWidth: 720, lineHeight: 1.55 }}>
          Account-Daten, Abo &amp; Zahlung, Passwort-Reset. Branding, SMTP und
          API-Keys liegen unter Agency-Branding.
        </p>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>

        {/* Account-Daten */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "24px 26px",
        }}>
          <h2 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700 }}>Account</h2>
          <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "10px 16px", maxWidth: 560 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>Name</span>
            <span style={{ fontSize: 14, fontWeight: 600, alignSelf: "center" }}>{name || "—"}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>E-Mail</span>
            <span style={{ fontSize: 14, fontFamily: "ui-monospace, SF Mono, Menlo, monospace", alignSelf: "center" }}>{email}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>Aktueller Plan</span>
            <span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 20,
                background: `${planDef.color}15`,
                border: `1px solid ${planDef.color}40`,
                color: planDef.color,
                fontSize: 12, fontWeight: 800, letterSpacing: "0.04em",
              }}>
                {planDef.label} · {planDef.mrr}€/Monat
              </span>
            </span>
          </div>
        </div>

        {/* Stripe-Portal + Logout */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "24px 26px",
        }}>
          <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>Abo &amp; Zahlung</h2>
          <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            Zahlungsmethoden ändern, Rechnungen herunterladen oder Abo kündigen — alles im Stripe-Kunden-Portal.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={openStripePortal}
              disabled={portalLoading}
              className="wf-stripe-btn"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 22px", borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                background: brandColor, color: contrastText(brandColor),
                border: "1px solid rgba(0,0,0,0.08)",
                cursor: portalLoading ? "wait" : "pointer", fontFamily: "inherit",
                opacity: portalLoading ? 0.7 : 1,
                boxShadow: `0 4px 14px ${brandColor}33`,
                transition: "filter 0.15s ease, transform 0.12s ease, box-shadow 0.18s ease",
              }}
            >
              {portalLoading && <Spinner size={12} />}
              {portalLoading ? "Portal wird geöffnet…" : "Stripe-Kundenportal öffnen →"}
            </button>
            <button
              onClick={async () => { setSigningOut(true); await signOut({ callbackUrl: "/" }); }}
              disabled={signingOut}
              style={{
                padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: signingOut ? "wait" : "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 7,
              }}
            >
              {signingOut && <Spinner size={12} />}
              {signingOut ? "Wird ausgeloggt…" : "Abmelden"}
            </button>
          </div>
          {portalError && (
            <p style={{ margin: "12px 0 0", padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.32)", fontSize: 12, color: "#f87171" }}>
              {portalError}
            </p>
          )}
        </div>

        {/* Passwort-Hinweis */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "20px 26px",
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Passwort ändern</h3>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>
              Aus Sicherheitsgründen verwenden wir den E-Mail-basierten Reset-Flow.
            </p>
            <a
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: "rgba(255,255,255,0.04)", color: T.textMid,
                border: `1px solid ${T.border}`, textDecoration: "none",
              }}
            >
              Reset-Link anfordern →
            </a>
          </div>
        </div>

      </section>
    </main>
  );
}
