"use client";

/**
 * /scan/checkout/claim — Post-Payment-Landing für Pay-per-Fix-Käufer.
 *
 * Stripe redirected hier hin nach erfolgreicher 9,90-€-Zahlung. Der Webhook
 * legt parallel einen 4-Wochen-Token in guide_access_tokens an (kein
 * User-Konto, siehe Migration 2026-05-08). Wir polling auf den Token und
 * zeigen — sobald verfügbar — einen Direct-Link auf /g/[token].
 *
 * UX-Pfade:
 *   - "loading"  — Polling läuft (max 6×1.5s = 9s)
 *   - "ok"       — Token gefunden → Direct-Link + Mail-Hinweis
 *   - "pending"  — Polling timeout → "Mail kommt gleich, prüfe Inbox"
 *   - "error"    — Session-Param fehlt oder unverifizierbar
 */

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import BrandLogo from "../../../components/BrandLogo";
import MobileNav from "../../../components/MobileNav";
import SiteFooter from "../../../components/SiteFooter";
import MaintenanceBanner from "../../../components/MaintenanceBanner";

function ClaimInner() {
  const params    = useSearchParams();
  const guideId   = params.get("guide") ?? "";
  const sessionId = params.get("session_id") ?? "";

  const [verified, setVerified] = useState<"loading" | "ok" | "pending" | "error">("loading");
  const [email,    setEmail]    = useState<string | null>(null);
  const [token,    setToken]    = useState<string | null>(null);

  useEffect(() => {
    if (!guideId || !sessionId) {
      setVerified("error");
      return;
    }
    let attempts  = 0;
    let cancelled = false;

    async function poll() {
      attempts++;
      try {
        const res = await fetch(
          `/api/guides/${encodeURIComponent(guideId)}/verify-anon?session_id=${encodeURIComponent(sessionId)}`
        );
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json() as { verified?: boolean; token?: string; email?: string };
          if (data.verified && data.token) {
            setToken(data.token);
            setEmail(data.email ?? null);
            setVerified("ok");
            return;
          }
        }
      } catch { /* network error → retry */ }

      // Polling-Window 12×2s=24s (Stripe-Webhook-P95 ist ~15-25s, vorheriges
      // 6×1.5s=9s war zu eng bei Webhook-Delay). User-Vertrauens-Fix 12.05.
      if (attempts < 12) {
        setTimeout(poll, 2000);
      } else if (!cancelled) {
        setVerified("pending");
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [guideId, sessionId]);

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo />
          <MobileNav />
        </div>
      </nav>

      <main style={{ background: "#0b0c10", minHeight: "calc(100vh - 58px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ maxWidth: 540, width: "100%", textAlign: "center" }}>

          {verified === "loading" && (
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "rgba(122,166,255,0.04)", border: "1px solid rgba(122,166,255,0.20)" }}>
              <div style={{
                width: 48, height: 48, margin: "0 auto 18px", borderRadius: "50%",
                border: "3px solid rgba(122,166,255,0.20)",
                borderTopColor: "#7aa6ff",
                animation: "wf-claim-spin 0.9s linear infinite",
              }} />
              <h1 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#fff" }}>
                Zahlung wird bestätigt
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                Stripe hat erfolgreich kassiert. Wir bereiten gerade<br/>deinen Online-Bericht vor — gleich da.
              </p>
              <style>{`@keyframes wf-claim-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {verified === "ok" && token && (
            <div style={{ padding: "36px 30px", borderRadius: 16, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.30)", boxShadow: "0 0 32px rgba(34,197,94,0.10)" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 18px", background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h1 style={{ margin: "0 0 8px", fontSize: 23, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                Dein Fix-Guide ist da
              </h1>
              <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.65 }}>
                Du brauchst weder Konto noch Login — du hast deinen Guide auf zwei Wegen:
              </p>

              <Link
                href={`/g/${token}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "14px 26px", borderRadius: 11,
                  background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
                  color: "#fff", fontSize: 14, fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 6px 18px rgba(124,58,237,0.36)",
                }}
              >
                Online-Bericht öffnen →
              </Link>

              {/* Wichtigster Hinweis bei jungen Domains: User sollte den Link
                  jetzt sofort sichern, falls die Mail ggf. im Spam landet
                  (web.de/GMX-Heuristik bei <30-Tage-Sender-Domains). */}
              <div style={{
                margin: "22px 0 0", padding: "12px 14px", borderRadius: 10,
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.30)",
                textAlign: "left",
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 800, color: "#fbbf24",
                            letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  💡 Tipp: jetzt sichern
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>
                  Bookmark den Link <strong style={{ color: "#fff" }}>direkt jetzt</strong> (Strg+D / Cmd+D)
                  oder kopier ihn aus der Adresszeile. Er bleibt 4 Wochen aktiv und du brauchst
                  weder Konto noch Mail für den Zugriff.
                </p>
              </div>

              <div style={{
                margin: "10px 0 0", padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.08)",
                textAlign: "left",
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 11.5, fontWeight: 800, color: "rgba(255,255,255,0.7)",
                            letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  📎 PDF kommt per Mail
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                  Wir senden den kompletten Guide zusätzlich als PDF an{" "}
                  {email ? <strong style={{ color: "#fff" }}>{email}</strong> : "deine E-Mail"} —
                  dauerhaft nutzbar. Bei <strong>web.de / GMX</strong> bitte auch im{" "}
                  <strong style={{ color: "#fff" }}>Spam-Ordner</strong> prüfen, das ist bei jungen
                  Absender-Domains ein bekanntes Verhalten der Provider.
                </p>
              </div>

              <p style={{ margin: "16px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
                Online-Zugriff: 4 Wochen. PDF: dauerhaft. Details in der AGB §5.6.
              </p>
            </div>
          )}

          {verified === "pending" && (
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.30)" }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800, color: "#fbbf24" }}>
                Zahlung empfangen — Mail kommt gleich
              </h1>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                Wir verarbeiten gerade die letzten Schritte. Du bekommst innerhalb der nächsten Minute eine E-Mail mit dem direkten Link zu deinem Online-Bericht <strong style={{ color: "#fff" }}>plus dem PDF im Anhang</strong>. Bitte auch Spam-Ordner prüfen.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: "inline-flex", padding: "10px 20px", borderRadius: 10,
                  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Erneut prüfen
              </button>
            </div>
          )}

          {verified === "error" && (
            <div style={{ padding: "32px 28px", borderRadius: 16, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 800, color: "#fca5a5" }}>
                Hmm — diese Seite braucht den Stripe-Session-Parameter
              </h1>
              <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                Falls deine Zahlung erfolgreich war, bekommst du in Kürze eine Bestätigungs-E-Mail mit dem direkten Online-Link plus PDF-Anhang. Bei Fragen: <a href="mailto:support@website-fix.com" style={{ color: "#7aa6ff" }}>support@website-fix.com</a>.
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
