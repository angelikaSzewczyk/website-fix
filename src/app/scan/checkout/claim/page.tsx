"use client";

/**
 * /scan/checkout/claim — Post-Payment-Landing für anonymen Guide-Käufer
 *
 * Stripe redirected hier hin nach erfolgreicher Zahlung. Der Webhook hat
 * parallel den User angelegt (oder gefunden) und den Guide unlocked. Wir
 * zeigen:
 *  - Bestätigung "Guide ist freigeschaltet"
 *  - Email-spezifischer Hinweis ("Wir haben dir an X eine Mail geschickt")
 *  - 2 Wege zum Guide:
 *    a) Neuer Account → Passwort setzen via /forgot-password
 *    b) Bestehender Account → /login
 *
 * Wir zeigen den Guide-Inhalt NICHT direkt hier — der ist
 * authenticated-only. Das wäre die einzige Möglichkeit für anon View, aber
 * würde unsere Auth-Architektur kompromittieren.
 */

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import BrandLogo from "../../../components/BrandLogo";
import MobileNav from "../../../components/MobileNav";
import SiteFooter from "../../../components/SiteFooter";
import MaintenanceBanner from "../../../components/MaintenanceBanner";

function ClaimInner() {
  const params       = useSearchParams();
  const guideId      = params.get("guide") ?? "";
  const sessionId    = params.get("session_id") ?? "";
  const [verified, setVerified] = useState<"loading" | "ok" | "pending" | "error">("loading");
  const [email, setEmail]       = useState<string | null>(null);
  const [isNewAccount, setIsNewAccount] = useState<boolean>(true);

  // Webhook-Race: Stripe redirected sofort nach success_url, der Webhook
  // braucht aber 1-3 Sekunden. Wir polling /api/guides/[id]/verify-payment
  // bis der Unlock geschrieben ist (ist bereits-existing endpoint, der via
  // session_id check macht — siehe /api/guides/[id]/verify-payment/route.ts).
  // Nach 5 Versuchen geben wir auf und zeigen "pending" — die Email kommt
  // sowieso parallel.
  useEffect(() => {
    if (!guideId || !sessionId) {
      setVerified("error");
      return;
    }
    let attempts = 0;
    let cancelled = false;

    async function poll() {
      attempts++;
      try {
        const res = await fetch(`/api/guides/${encodeURIComponent(guideId)}/verify-anon?session_id=${encodeURIComponent(sessionId)}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json() as { verified?: boolean; email?: string; isNewAccount?: boolean };
          if (data.verified) {
            setEmail(data.email ?? null);
            setIsNewAccount(data.isNewAccount ?? true);
            setVerified("ok");
            return;
          }
        }
      } catch { /* network error → retry */ }

      if (attempts < 6) {
        setTimeout(poll, 1500);
      } else if (!cancelled) {
        setVerified("pending");
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [guideId, sessionId]);

  return (
    <>
      <MaintenanceBanner />
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo />
          <MobileNav />
        </div>
      </nav>

      <main style={{ background: "#0b0c10", minHeight: "calc(100vh - 58px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>

          {verified === "loading" && (
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "rgba(122,166,255,0.04)", border: "1px solid rgba(122,166,255,0.20)" }}>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                Prüfe deinen Kauf…
              </div>
            </div>
          )}

          {verified === "ok" && (
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.30)", boxShadow: "0 0 32px rgba(34,197,94,0.10)" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                Dein Fix-Guide ist freigeschaltet
              </h1>
              <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
                {isNewAccount
                  ? <>Wir haben dir ein kostenloses Konto unter <strong style={{ color: "#fff" }}>{email}</strong> erstellt. Setze dein Passwort, um den Guide zu öffnen — danach hast du lebenslangen Zugriff.</>
                  : <>Dein Konto unter <strong style={{ color: "#fff" }}>{email}</strong> existiert bereits. Logge dich ein, um den Guide zu öffnen.</>}
              </p>
              <Link
                href={isNewAccount
                  ? `/forgot-password?email=${encodeURIComponent(email ?? "")}`
                  : `/login?callbackUrl=${encodeURIComponent(`/dashboard/guides/${guideId}`)}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 10,
                  background: "linear-gradient(90deg, #059669, #10B981)",
                  color: "#fff", fontSize: 14, fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.32)",
                }}
              >
                {isNewAccount ? "Passwort setzen & Guide öffnen →" : "Login & Guide öffnen →"}
              </Link>
              <p style={{ margin: "16px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                Wir haben dir zusätzlich eine Bestätigungs-E-Mail mit dem direkten Link geschickt.
              </p>
            </div>
          )}

          {verified === "pending" && (
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.30)" }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#fbbf24" }}>
                Zahlung empfangen — Verarbeitung läuft
              </h1>
              <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                Wir bestätigen deine Zahlung gerade mit Stripe. Das kann bis zu einer Minute dauern. Du bekommst eine E-Mail mit dem direkten Zugriffs-Link, sobald alles bereit ist — meistens innerhalb weniger Sekunden.
              </p>
              <Link href="/login" style={{ display: "inline-flex", padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Zum Login
              </Link>
            </div>
          )}

          {verified === "error" && (
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#fca5a5" }}>
                Hmm — wir können den Kauf gerade nicht verifizieren
              </h1>
              <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                Falls die Zahlung erfolgreich war, bekommst du in Kürze eine E-Mail mit dem direkten Zugriffs-Link. Bei Fragen: <a href="mailto:support@website-fix.com" style={{ color: "#7aa6ff" }}>support@website-fix.com</a>.
              </p>
              <Link href="/" style={{ display: "inline-flex", padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Zur Startseite
              </Link>
            </div>
          )}

        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default function ScanCheckoutClaimPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#0b0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Lade…</div>
      </div>
    }>
      <ClaimInner />
    </Suspense>
  );
}
