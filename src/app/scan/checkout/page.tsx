"use client";

/**
 * /scan/checkout — Guide-Auswahl + Anon-Checkout-Flow
 *
 * Wird vom 9,90-€-CTA auf /scan/results aufgerufen. Zeigt:
 *  1. Die zum aktuellen Scan passenden Guides (Match via /api/guides/anon-match)
 *  2. Ein Inline-Form mit Email + Hoster-Auswahl
 *  3. Klick → /api/guides/[id]/anon-checkout → Stripe-Redirect
 *
 * Nach erfolgreicher Zahlung kommt der Käufer auf /scan/checkout/claim,
 * der Webhook hat parallel User + Unlock angelegt.
 *
 * Fallback: wenn kein Scan im sessionStorage liegt (Direkt-Aufruf),
 * zeigen wir einen "Erst scannen"-Hinweis mit Link zu /scan.
 */

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import BrandLogo from "../../components/BrandLogo";
import MobileNav from "../../components/MobileNav";
import SiteFooter from "../../components/SiteFooter";
import MaintenanceBanner from "../../components/MaintenanceBanner";
import { loadScanFromStorage, type StoredScan } from "@/lib/scan-storage";
import { HOSTER_OPTIONS } from "@/lib/rescue-guides";

type AnonGuide = {
  id:                string;
  title:             string;
  problem_label:     string;
  preview:           string | null;
  price_cents:       number;
  estimated_minutes: number | null;
  relevance:         number;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mappt einen StoredScan auf die Issue-Liste, die das anon-match-Endpoint
 * akzeptiert. Wir verwenden die boolean-flags + counts, da wir keine
 * detaillierten Issues im Frontend-State haben.
 */
function buildIssuesFromScan(scan: StoredScan): Array<{ title: string; severity?: string; category?: string }> {
  const issues: Array<{ title: string; severity?: string; category?: string }> = [];
  if (!scan.https)             issues.push({ title: "HTTPS fehlt",              severity: "red",    category: "security" });
  if (!scan.hasTitle)          issues.push({ title: "Title-Tag fehlt",          severity: "red",    category: "seo" });
  if (!scan.hasMeta)           issues.push({ title: "Meta-Description fehlt",   severity: "yellow", category: "seo" });
  if (!scan.hasH1)             issues.push({ title: "H1-Tag fehlt",             severity: "red",    category: "seo" });
  if (scan.robotsBlocked)      issues.push({ title: "robots.txt blockiert",     severity: "red",    category: "indexing" });
  if (!scan.hasSitemap)        issues.push({ title: "Sitemap fehlt",            severity: "yellow", category: "indexing" });
  if (scan.noIndex)            issues.push({ title: "noindex auf Startseite",   severity: "red",    category: "indexing" });
  if (scan.hasUnreachable)     issues.push({ title: "Unterseiten nicht erreichbar (404)", severity: "red", category: "links" });
  if (scan.brokenLinksCount > 0)     issues.push({ title: "Broken Links",       severity: "red", category: "links" });
  if (scan.altMissingCount > 0)      issues.push({ title: "Bilder ohne alt-Text", severity: "yellow", category: "accessibility" });
  if (scan.duplicateTitlesCount > 1) issues.push({ title: "Doppelte Titles",    severity: "yellow", category: "seo" });
  if (scan.duplicateMetasCount > 1)  issues.push({ title: "Doppelte Meta-Descriptions", severity: "yellow", category: "seo" });
  if (scan.xmlRpcOpen)               issues.push({ title: "XML-RPC offen",      severity: "red",    category: "security" });
  return issues;
}

function CheckoutInner() {
  const [scan, setScan]               = useState<StoredScan | null>(null);
  const [scanLoaded, setScanLoaded]   = useState(false);
  const [guides, setGuides]           = useState<AnonGuide[]>([]);
  const [guidesLoaded, setGuidesLoaded] = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [email, setEmail]             = useState("");
  const [hoster, setHoster]           = useState<string>("default");
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");

  // Scan aus sessionStorage laden (anonymer Flow — kein Cache-Fallback nötig)
  useEffect(() => {
    const loaded = loadScanFromStorage();
    setScan(loaded);
    setScanLoaded(true);
  }, []);

  // Sobald Scan da: matchende Guides via API holen
  useEffect(() => {
    if (!scan) { setGuidesLoaded(true); return; }
    const issues = buildIssuesFromScan(scan);
    if (issues.length === 0) { setGuides([]); setGuidesLoaded(true); return; }
    fetch("/api/guides/anon-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ issues }),
    })
      .then(r => r.json())
      .then((data: { guides?: AnonGuide[] }) => {
        const list = data.guides ?? [];
        setGuides(list);
        // Auto-select das relevanteste Guide, damit der User nur 1 Klick braucht
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setGuides([]))
      .finally(() => setGuidesLoaded(true));
  }, [scan]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedId) { setError("Bitte wähle einen Fix-Guide aus."); return; }
    if (!EMAIL_PATTERN.test(email.trim())) { setError("Bitte gib eine gültige E-Mail-Adresse ein."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/guides/${encodeURIComponent(selectedId)}/anon-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), hoster }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout konnte nicht gestartet werden. Bitte versuche es erneut.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Netzwerkfehler. Bitte prüfe deine Verbindung und versuche es erneut.");
      setSubmitting(false);
    }
  }

  // ── Render-Branches ────────────────────────────────────────────────────
  if (!scanLoaded) {
    return (
      <div style={{ background: "#0b0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Lade Scan-Daten…</div>
      </div>
    );
  }

  if (!scan) {
    return (
      <>
        <Nav />
        <main style={{ background: "#0b0c10", minHeight: "calc(100vh - 58px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <div style={{ maxWidth: 460, textAlign: "center", padding: "32px 28px", borderRadius: 16, background: "rgba(122,166,255,0.04)", border: "1px solid rgba(122,166,255,0.20)" }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#fff" }}>
              Kein aktueller Scan gefunden
            </h1>
            <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              Um den passenden Fix-Guide für deine Website zu finden, brauchen wir zuerst einen Scan. Das dauert weniger als eine Minute.
            </p>
            <Link href="/scan" style={{ display: "inline-flex", padding: "11px 22px", borderRadius: 10, background: "linear-gradient(90deg, #059669, #10B981)", color: "#fff", fontSize: 13.5, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 14px rgba(16,185,129,0.32)" }}>
              Jetzt scannen →
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (guidesLoaded && guides.length === 0) {
    return (
      <>
        <Nav />
        <main style={{ background: "#0b0c10", minHeight: "calc(100vh - 58px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <div style={{ maxWidth: 480, textAlign: "center", padding: "32px 28px", borderRadius: 16, background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.20)" }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#22c55e" }}>
              Keine kritischen Befunde — kein Fix-Guide nötig
            </h1>
            <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              Unser Scan hat keine Befunde gefunden, die einen unserer aktuellen Fix-Guides triggern. Deine Seite ist in den Standard-Kategorien sauber aufgestellt.
            </p>
            <Link href="/scan/results" style={{ display: "inline-flex", padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              ← Zurück zum Bericht
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main style={{ background: "#0b0c10", minHeight: "calc(100vh - 58px)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: "#FBBF24", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Einzel-Fix · 9,90 €
            </p>
            <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em" }}>
              Wähle deinen Fix-Guide
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              Unser Scan hat <strong style={{ color: "#fff" }}>{guides.length}</strong> {guides.length === 1 ? "passenden Guide" : "passende Guides"} für deine Seite gefunden. Wähle einen aus, gib deine E-Mail ein, und du wirst direkt zum sicheren Stripe-Checkout geleitet. Kein Abo, keine versteckten Kosten.
            </p>
          </div>

          {/* Guide-Liste */}
          {!guidesLoaded ? (
            <div style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              Suche passende Guides für deine Seite…
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {guides.map(g => {
                const selected = selectedId === g.id;
                const priceLabel = (g.price_cents / 100).toFixed(2).replace(".", ",") + " €";
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedId(g.id)}
                    style={{
                      textAlign: "left", cursor: "pointer",
                      padding: "16px 20px", borderRadius: 12,
                      background: selected ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.025)",
                      border: `1px solid ${selected ? "rgba(251,191,36,0.45)" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: selected ? "0 0 24px rgba(251,191,36,0.08)" : "none",
                      transition: "all 0.15s",
                      display: "flex", alignItems: "flex-start", gap: 14,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 3,
                      background: selected ? "#FBBF24" : "rgba(255,255,255,0.06)",
                      border: `2px solid ${selected ? "#FBBF24" : "rgba(255,255,255,0.18)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {selected && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{g.title}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#FBBF24", padding: "2px 9px", borderRadius: 12, background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.30)" }}>
                          {priceLabel}
                        </span>
                        {g.estimated_minutes && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>· ⏱ ~{g.estimated_minutes} Min</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: g.preview ? 6 : 0 }}>{g.problem_label}</div>
                      {g.preview && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>{g.preview}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Email + Hoster + Checkout */}
          <form onSubmit={handleCheckout} style={{ padding: "22px 24px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6, letterSpacing: "0.02em" }}>
                Deine E-Mail-Adresse
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="du@deine-firma.de"
                autoComplete="email"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 9,
                  background: "rgba(255,255,255,0.04)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.14)",
                  fontSize: 14, outline: "none",
                }}
              />
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                Wir verknüpfen den Guide mit deiner E-Mail. Nach der Zahlung bekommst du einen Link zum sofortigen Zugriff.
              </p>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 6, letterSpacing: "0.02em" }}>
                Dein Hoster (optional — für Hoster-spezifische Schritte)
              </label>
              <select
                value={hoster}
                onChange={e => setHoster(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 9,
                  background: "rgba(255,255,255,0.04)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.14)",
                  fontSize: 14, outline: "none",
                }}
              >
                {HOSTER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} style={{ background: "#0b0c10" }}>{o.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div style={{ padding: "9px 12px", marginBottom: 14, borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 12.5 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedId}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 10,
                background: submitting ? "rgba(16,185,129,0.5)" : "linear-gradient(90deg, #059669, #10B981)",
                color: "#fff", fontSize: 14, fontWeight: 800,
                border: "none", cursor: submitting ? "wait" : "pointer",
                boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
              }}
            >
              {submitting ? "Stripe-Checkout wird vorbereitet…" : "Sicher mit Stripe bezahlen — 9,90 € einmalig"}
            </button>

            <p style={{ margin: "12px 0 0", fontSize: 11, color: "rgba(255,255,255,0.32)", textAlign: "center", lineHeight: 1.5 }}>
              Einmalzahlung · Kein Abo · DSGVO-konform · Lebenslanger Zugriff
            </p>
          </form>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Nav() {
  return (
    <>
      <MaintenanceBanner />
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo />
          <MobileNav />
        </div>
      </nav>
    </>
  );
}

export default function ScanCheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#0b0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Lade…</div>
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  );
}
