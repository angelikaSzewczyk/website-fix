"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BrandLogo from "../components/BrandLogo";

/** CSS-Var-Set — Single-Source der Variablen-Namen, damit Set + Cleanup
 *  symmetrisch sind. Mismatch wäre ein Stacking-Leak in andere Pages. */
const AGENCY_CSS_VARS = [
  "--agency-accent",
  "--agency-accent-bg",
  "--agency-accent-border",
  "--agency-accent-glow",
  "--agency-accent-glow-soft",
] as const;

function applyBrandColor(hex: string): void {
  const root = document.documentElement;
  root.style.setProperty("--agency-accent",            hex);
  root.style.setProperty("--agency-accent-bg",         `${hex}14`); //  8%
  root.style.setProperty("--agency-accent-border",     `${hex}47`); // 28%
  root.style.setProperty("--agency-accent-glow",       `${hex}50`); // 31%
  root.style.setProperty("--agency-accent-glow-soft",  `${hex}40`); // 25%
}

function clearBrandColor(): void {
  const root = document.documentElement;
  for (const key of AGENCY_CSS_VARS) root.style.removeProperty(key);
}

// ─── Plan-specific left-panel content ────────────────────────────────────────
const PLAN_CONTENT: Record<string, {
  headline: React.ReactNode;
  sub: string;
  bullets: string[];
}> = {
  starter: {
    headline: <>Deine Website.<br />Sicher &amp; Fehlerfrei.</>,
    sub: "Konto erstellen. Sicher per Stripe bezahlen. Sofort aktiv.",
    bullets: [
      "Voller SEO-Audit (25 Seiten)",
      "Kritische Fehler-Analyse",
      "Sofort-Check für Google-Ranking",
    ],
  },
  professional: {
    headline: <>Das WordPress-Audit<br />das Kunden überzeugt.</>,
    sub: "Unbegrenzte WP-Scans. KI-Empfehlungen. White-Label Berichte.",
    bullets: [
      "Unbegrenzte WordPress-Audits",
      "Automatisches Monitoring 24/7",
      "White-Label PDF-Reports",
    ],
  },
  agency: {
    headline: <>Der WordPress-Agentur<br />Autopilot.</>,
    sub: "Konto erstellen. Direkt zu Stripe. Sofort loslegen.",
    bullets: [
      "Alle Agency-Features & WordPress-Plugin",
      "Vollständiges White-Label",
      "Mass-Fix für alle Kunden-Sites",
    ],
  },
  // Legacy-Keys für alte Register-Links:
  "smart-guard":    { headline: <>KI-Power für<br />deine Website.</>, sub: "Professional-Plan.", bullets: ["Unbegrenzte Scans", "KI-Empfehlungen", "White-Label Berichte"] },
  "agency-starter": { headline: <>Der<br />Agentur-Autopilot.</>,       sub: "Agency-Plan.",       bullets: ["Alle Agency-Features", "White-Label Berichte", "Mass-Fix"] },
};

// ─── Intent-driven content (z.B. von /scan/results "9,90€ Einzel-Fix" CTA) ───
// "guide" = User will einen einzelnen 9,90€-Guide kaufen, kein Abo. Macht das
// Versprechen der Landing-Page ("Einmal-Fix ab 9,90 €") explizit auf der Register-Seite.
const INTENT_CONTENT: Record<string, {
  headline: React.ReactNode;
  sub: string;
  bullets: string[];
}> = {
  guide: {
    headline: <>Konto kostenlos.<br />Fix einmalig 9,90 €.</>,
    sub: "Erstelle dein Konto in 30 Sekunden — danach wählst du deinen Fix-Guide. Kein Abo, keine versteckten Kosten.",
    bullets: [
      "Einzelne Guides ab 9,90 € · Einmalzahlung",
      "Schritt-für-Schritt-Anleitung (hoster-spezifisch)",
      "Lebenslanger Zugriff auf gekaufte Guides",
    ],
  },
};

// Fallback: kein Plan in URL → zur Preisseite schicken (kein Free-Zugang)
const DEFAULT_CONTENT = {
  headline: <>Plan wählen &amp;<br />loslegen.</>,
  sub: "Wähle deinen Plan und starte direkt.",
  bullets: [
    "Starter ab 29 €/Monat",
    "Professional ab 89 €/Monat",
    "Agency ab 249 €/Monat",
  ],
};

// Token-Format-Pattern identisch zu /invite/[token] und /api/auth/register —
// Token wird clientseitig vor-validiert, bevor er ins Form-State landet.
// Verhindert, dass ein invalider URL-Param (z.B. abgeschnittener Link) als
// Token an die Register-Route gesendet wird.
const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,80}$/;
function isValidInviteToken(t: string | null): boolean {
  return !!t && INVITE_TOKEN_PATTERN.test(t);
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const plan         = searchParams.get("plan")  ?? "";
  // Intent-Param: "guide" = von /scan/results "9,90€ Einzel-Fix"-CTA. Steuert
  // Headline-Copy + Post-Register-Redirect (zur /scan/checkout statt zum
  // Stripe-Sub-Checkout). Whitelist-Check verhindert Render-Inject.
  const intent       = (() => {
    const i = searchParams.get("intent") ?? "";
    return i in INTENT_CONTENT ? i : "";
  })();
  const isGuideIntent = intent === "guide";
  // Trial-Param (z.B. ?trial=7 für Agency 7-Tage-Test) wird durchgereicht ans
  // Stripe-Checkout. Der eigentliche Trial-Mode wird von der Stripe-API gesetzt,
  // nicht clientseitig — wir reichen ihn nur weiter.
  const trialDays    = (() => {
    const t = parseInt(searchParams.get("trial") ?? "", 10);
    return Number.isFinite(t) && t > 0 && t <= 30 ? t : 0;
  })();

  // ── Invite-Pre-Fill (Phase 10) ──────────────────────────────────────────
  // ?email + ?invite kommen aus /invite/[token]-Redirect. Email wird ins
  // Form-Feld vorgefüllt + nicht editierbar gemacht (sonst könnte der User
  // versehentlich eine andere Adresse eintragen → Token würde nicht claimen,
  // siehe Schicht 4 in /invite/[token]). Token wird hidden mitgesendet.
  const inviteEmailParam = searchParams.get("email")  ?? "";
  const inviteTokenParam = searchParams.get("invite") ?? "";
  const inviteToken      = isValidInviteToken(inviteTokenParam) ? inviteTokenParam : null;
  const isInviteFlow     = !!inviteToken && !!inviteEmailParam;

  // Session-State — entscheidet, ob die Page den Form anzeigt oder einen
  // "Du bist bereits eingeloggt"-Hinweis. WICHTIG: Wir redirecten nur, wenn
  // status === "authenticated" — alles andere zeigt das Formular.
  const { status: sessionStatus } = useSession();

  // Intent gewinnt vor Plan — wenn der User mit ?intent=guide kommt, sehen
  // wir die Guide-Copy egal welcher Plan-Param noch in der URL hängt.
  const content    = isGuideIntent ? INTENT_CONTENT.guide : (PLAN_CONTENT[plan] ?? DEFAULT_CONTENT);
  const isPaidPlan = !isGuideIntent && plan && plan !== "free";

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState(isInviteFlow ? inviteEmailParam : "");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Live-Branding (Phase 11): wenn Invite-Flow erkannt, lädt useEffect die
  // Agency-Identität (Name + Brand-Farbe) und injiziert die CSS-Variablen
  // ins :root-Element. Damit erbt JEDES <var(--agency-accent)>-Token auf
  // dieser Page die Brand-Farbe, ohne dass /register im Dashboard-Layout
  // hängen muss.
  //
  // Failure-Mode: wenn Fetch fehlschlägt oder Token nicht (mehr) gültig ist,
  // bleiben die Vars unverändert → Fallback-Default-Violet greift weiterhin.
  // KEIN Crash, KEIN Layout-Shift, nur weniger personalisiert.
  const [agencyName, setAgencyName] = useState<string | null>(null);
  useEffect(() => {
    if (!isInviteFlow || !inviteToken) return;
    let aborted = false;

    fetch(`/api/invite-meta?token=${encodeURIComponent(inviteToken)}`, { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then((data: { agency_name: string; brand_color: string | null } | null) => {
        if (aborted || !data) return;
        if (data.agency_name) setAgencyName(data.agency_name);
        if (data.brand_color && /^#[0-9a-fA-F]{6}$/.test(data.brand_color)) {
          applyBrandColor(data.brand_color);
        }
      })
      .catch(() => { /* silent — Default-Vars bleiben aktiv */ });

    // Cleanup: Vars beim Unmount entfernen, damit sie nicht in andere Pages
    // (Login, Public-Routes) leaken. SPA-Navigation würde sonst die Vars
    // beibehalten bis zum nächsten Hard-Reload.
    return () => {
      aborted = true;
      clearBrandColor();
    };
  }, [isInviteFlow, inviteToken]);

  // Hilfsfunktion: baut die Checkout-URL inkl. trial-Param.
  // Wird NUR aufgerufen, nachdem der User in der DB angelegt UND eingeloggt ist —
  // sonst könnten wir auf einen Plan zugreifen, den der User noch nicht hat.
  function checkoutUrlFor(p: string): string {
    const params = new URLSearchParams({ plan: p });
    if (trialDays > 0) params.set("trial", String(trialDays));
    return `/api/checkout?${params.toString()}`;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Invite-Flow: Token aus URL als hidden field mitsenden. Server claimed
      // das team_members-Row nach erfolgreicher User-Erstellung (siehe
      // /api/auth/register POST). Wenn Token invalide ist, wird der Account
      // trotzdem angelegt — kein silent failure, kein blockierender Bug.
      const body: Record<string, string> = { name, email, password };
      if (inviteToken) body.invite = inviteToken;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: { ok?: boolean; error?: string } = {};
      try { data = JSON.parse(text); } catch { /* ignore parse errors */ }

      if (!res.ok) {
        setError(data.error ?? "Registrierung fehlgeschlagen. Bitte versuche es erneut.");
        return;
      }

      // Auto sign-in after registration
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.ok) {
        // Anonymen Scan übertragen falls vorhanden
        try {
          const raw = sessionStorage.getItem("wf_scan_result");
          if (raw) {
            const scan = JSON.parse(raw) as {
              url?: string; diagnose?: string; issueCount?: number;
              techFingerprint?: unknown; unterseiten?: unknown[];
              pages?: number; altMissingCount?: number;
              brokenLinksCount?: number; duplicateTitlesCount?: number;
              duplicateMetasCount?: number; hasUnreachable?: boolean;
              orphanedPagesCount?: number; noIndex?: boolean;
              hasTitle?: boolean; hasMeta?: boolean; hasH1?: boolean;
              hasSitemap?: boolean; robotsBlocked?: boolean; https?: boolean;
              entdeckteUrls?: number;
            };
            if (scan?.url) {
              await fetch("/api/scan/claim", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  url: scan.url,
                  diagnose: scan.diagnose ?? "",
                  issueCount: scan.issueCount ?? 0,
                  techFingerprint: scan.techFingerprint ?? null,
                  unterseiten: scan.unterseiten ?? [],
                  totalPages: scan.pages ?? null,
                  altMissingCount: scan.altMissingCount ?? 0,
                  brokenLinksCount: scan.brokenLinksCount ?? 0,
                  duplicateTitlesCount: scan.duplicateTitlesCount ?? 0,
                  duplicateMetasCount: scan.duplicateMetasCount ?? 0,
                  hasUnreachable: scan.hasUnreachable ?? false,
                  orphanedPagesCount: scan.orphanedPagesCount ?? 0,
                  https: scan.https ?? true,
                  hasTitle: scan.hasTitle ?? true,
                  hasMeta: scan.hasMeta ?? true,
                  hasH1: scan.hasH1 ?? true,
                  hasSitemap: scan.hasSitemap ?? true,
                  robotsBlocked: scan.robotsBlocked ?? false,
                  noIndex: scan.noIndex ?? false,
                }),
              });
            }
          }
        } catch { /* non-critical */ }

        // Harter Redirect zur GET-Checkout-Route — erst NACHDEM:
        //   1. /api/auth/register den User in der DB angelegt hat (POST oben)
        //   2. signIn() die Session-Cookie gesetzt hat (Bedingung: signInRes.ok)
        // → erst jetzt darf auf den Plan zugegriffen werden. Trial-Tage werden
        //   per Query-Param weitergereicht (Stripe setzt den eigentlichen Trial-Mode).
        if (isGuideIntent) {
          // Guide-Intent: direkt zur Guide-Checkout-Page mit dem Scan-Kontext.
          // Der Scan ist via /api/scan/claim oben bereits dem User zugeordnet.
          window.location.href = "/scan/checkout";
        } else if (isPaidPlan) {
          window.location.href = checkoutUrlFor(plan);
        } else {
          // Kein Plan → zur Preisseite, nie zum Dashboard
          window.location.href = "/fuer-agenturen";
        }
      } else {
        // signIn fehlgeschlagen — wir leiten NICHT auto-redirected weiter,
        // sondern zeigen einen Fehler. So vermeiden wir den /login → /dashboard
        // → /fuer-agenturen-Loop bei Race-Conditions mit der Session-Init.
        setError("Konto erstellt, aber automatischer Login fehlgeschlagen. Bitte manuell anmelden.");
      }
    } catch {
      setError("Netzwerkfehler. Bitte prüfe deine Verbindung und versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    // Hash-Fragmente (#...) sind in HTTP-Redirects nicht erlaubt → NextAuth rejectet sie.
    // Stattdessen: AutoCheckout liest ?checkout= und ?trial= params auf /fuer-agenturen.
    let callbackUrl: string;
    if (isGuideIntent) {
      // Guide-Intent: nach Google-Auth direkt zur Guide-Checkout-Page.
      callbackUrl = "/scan/checkout";
    } else {
      const params = new URLSearchParams();
      if (isPaidPlan) params.set("checkout", plan);
      if (trialDays > 0) params.set("trial", String(trialDays));
      callbackUrl = params.toString()
        ? `/fuer-agenturen?${params.toString()}`
        : "/fuer-agenturen";
    }
    await signIn("google", { callbackUrl });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* LEFT panel */}
      <div style={{
        width: "42%", flexShrink: 0,
        background: "linear-gradient(160deg, #060d1a 0%, #0a1628 50%, #071020 100%)",
        padding: "48px 40px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }} className="hide-sm">
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <BrandLogo size="lg" />

        <div>
          {isPaidPlan && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 20, marginBottom: 16,
              background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.05em" }}>
                STRIPE-CHECKOUT IM NÄCHSTEN SCHRITT
              </span>
            </div>
          )}
          <h2 style={{ fontSize: "clamp(22px, 2.5vw, 30px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {content.headline}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 36px", lineHeight: 1.7 }}>
            {content.sub}
          </p>
          {content.bullets.map(item => (
            <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E", flexShrink: 0, marginTop: 2 }}>✓</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Schon dabei:</p>
          <div style={{ display: "flex", gap: -8 }}>
            {["M", "S", "T"].map((l, i) => (
              <div key={l} style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${220 + i * 30}, 70%, 50%)`, border: "2px solid #0b0c10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", marginLeft: i > 0 ? -8 : 0 }}>{l}</div>
            ))}
            <span style={{ marginLeft: 10, fontSize: 13, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>
              Agenturen nutzen WebsiteFix
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT panel */}
      <div style={{ flex: 1, background: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 40px", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <Link href="/" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none" }}>← Zurück</Link>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            Schon registriert?{" "}
            <Link href="/login" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>Anmelden</Link>
          </span>
        </div>

        <div style={{ maxWidth: 380, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.025em", color: "#0F172A" }}>
            {isInviteFlow
              ? agencyName
                ? `${agencyName} hat dich eingeladen`
                : "Team-Einladung annehmen"
              : isGuideIntent
                ? "Konto kostenlos · Fix 9,90 €"
                : "Account erstellen"}
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px", lineHeight: 1.6 }}>
            {isInviteFlow
              ? `Erstelle deinen Account mit ${inviteEmailParam}, um ${agencyName ? `dem Team von ${agencyName}` : "deinem Team"} auf WebsiteFix beizutreten.`
              : isGuideIntent
              ? "Erstelle dein kostenloses Konto. Im nächsten Schritt wählst du deinen Fix-Guide und zahlst einmalig 9,90 €. Kein Abo."
              : isPaidPlan
              ? trialDays > 0
                ? `Konto erstellen — ${trialDays} Tage kostenlos testen, danach automatisch der ${plan === "agency" ? "Agency" : "Professional"}-Plan.`
                : "Konto erstellen — du wirst direkt zum sicheren Stripe-Checkout weitergeleitet."
              : "Account erstellen — Plan direkt im nächsten Schritt wählen."}
          </p>

          {/* Invite-Banner: visuelle Bestätigung dass die Einladung erkannt
              wurde, plus Hinweis dass die Email fix ist (Token-Mismatch sonst).
              Brand-Farbe wird durch applyBrandColor() bei Page-Mount injiziert. */}
          {isInviteFlow && (
            <div style={{
              padding: "12px 14px", marginBottom: 22, borderRadius: 9,
              background: "var(--agency-accent-bg, rgba(124,58,237,0.08))",
              border: "1px solid var(--agency-accent-border, rgba(124,58,237,0.28))",
              fontSize: 12.5, color: "#0F172A", lineHeight: 1.55,
            }}>
              <strong style={{ fontWeight: 700 }}>
                {agencyName ? `Einladung von ${agencyName}.` : "Einladung erkannt."}
              </strong>{" "}
              <span style={{ color: "#475569" }}>
                Die E-Mail-Adresse ist durch deine Einladung festgelegt. Du brauchst
                nur Name &amp; Passwort — fertig.
              </span>
            </div>
          )}

          {/* Hinweis bei bereits authenticated Session — KEIN Auto-Redirect.
              User entscheidet selbst, ob er upgraden oder ausloggen will. */}
          {sessionStatus === "authenticated" && (
            <div style={{
              padding: "12px 14px", marginBottom: 22, borderRadius: 9,
              background: "#FFFBEB", border: "1px solid #FDE68A",
              fontSize: 13, color: "#92400E", lineHeight: 1.5,
            }}>
              <strong>Du bist bereits eingeloggt.</strong>{" "}
              {isPaidPlan
                ? <>Wenn du auf deinem aktuellen Account upgraden willst, gehe zu <Link href={checkoutUrlFor(plan)} style={{ color: "#92400E", textDecoration: "underline", fontWeight: 700 }}>Checkout für {plan}</Link>.</>
                : <>Du kannst direkt zum <Link href="/dashboard" style={{ color: "#92400E", textDecoration: "underline", fontWeight: 700 }}>Dashboard</Link> oder hier ein neues Konto anlegen.</>
              }
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: "#fff", color: "#0F172A", cursor: "pointer",
            border: "1.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Mit Google registrieren
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            <span style={{ fontSize: 12, color: "#94A3B8" }}>oder mit E-Mail</span>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          </div>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Name",     type: "text",     value: name,     set: setName,     ph: "Dein Name",            readOnly: false },
              { label: "E-Mail",   type: "email",    value: email,    set: setEmail,    ph: "du@agentur.de",        readOnly: isInviteFlow },
              { label: "Passwort", type: "password", value: password, set: setPassword, ph: "Mindestens 8 Zeichen", readOnly: false },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                  {f.label}
                  {f.readOnly && (
                    <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, color: "var(--agency-accent, #7C3AED)" }}>
                      · aus Einladung
                    </span>
                  )}
                </label>
                <input
                  type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph} required
                  readOnly={f.readOnly}
                  // Invite-Email-Field: read-only via DOM, optisch grauer und
                  // mit cursor:not-allowed signalisiert. Nicht "disabled" weil
                  // disabled-Felder im Form-Submit nicht mitgesendet werden.
                  style={{
                    width: "100%", padding: "11px 14px", borderRadius: 9,
                    border: "1.5px solid #E2E8F0",
                    fontSize: 14, color: "#0F172A", outline: "none",
                    background: f.readOnly ? "#F1F5F9" : "#FAFBFC",
                    cursor: f.readOnly ? "not-allowed" : "text",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: loading ? "#93C5FD" : "#2563EB",
              color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
            }}>
              {loading
                ? (isPaidPlan ? "Weiterleiten zu Stripe…" : "Bitte warten…")
                : (isPaidPlan ? "Konto erstellen & bezahlen →" : "Account erstellen →")}
            </button>

            <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", lineHeight: 1.5 }}>
              Mit der Registrierung stimmst du unseren{" "}
              <Link href="/agb" style={{ color: "#2563EB", textDecoration: "none" }}>AGB</Link>
              {" "}und der{" "}
              <Link href="/datenschutz" style={{ color: "#2563EB", textDecoration: "none" }}>Datenschutzerklärung</Link>
              {" "}zu.
            </p>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[{ label: "Impressum", href: "/impressum" }, { label: "Datenschutz", href: "/datenschutz" }, { label: "AGB", href: "/agb" }].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#CBD5E1" }}>{`© ${new Date().getFullYear()} website-fix.com`}</p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
