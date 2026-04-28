"use client";

import { useState, useEffect, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import SettingsClient from "./settings-client";
import IntegrationsSettingsClient from "./integrations/integrations-client";
import { PLANS, normalizePlan, type PlanKey } from "@/lib/plans";

// ─── Types ──────────────────────────────────────────────────────────────────
type BrandingSettings = {
  agency_name:    string;
  agency_website: string;
  logo_url:       string;
  primary_color:  string;
};

type Status = {
  slack: boolean; zapier: boolean; asana: boolean; jira: boolean; trello: boolean; gsc: boolean; ga: boolean;
};

type IntegrationsVisible = {
  jira_domain:      string | null;
  jira_email:       string | null;
  jira_project_key: string | null;
  trello_list_id:   string | null;
  gsc_site_url:     string | null;
  ga_property_id:   string | null;
};

type TabId = "profil" | "branding" | "integrationen";

const TABS: { id: TabId; label: string }[] = [
  { id: "profil",        label: "Profil & Abo" },
  { id: "branding",      label: "Branding" },
  { id: "integrationen", label: "Integrationen" },
];

// Aliase aus alten Hash-Patterns oder typischen Tippfehlern,
// damit Deep-Links robust bleiben.
const HASH_ALIASES: Record<string, TabId> = {
  profile:      "profil",
  account:      "profil",
  brand:        "branding",
  integrations: "integrationen",
  integration:  "integrationen",
};

function parseHash(): TabId {
  if (typeof window === "undefined") return "profil";
  const raw = window.location.hash.replace("#", "").toLowerCase();
  if (!raw) return "profil";
  if (TABS.some(t => t.id === raw)) return raw as TabId;
  return HASH_ALIASES[raw] ?? "profil";
}

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

// ─── Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab({ name, email, plan, brandColor }: {
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
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Account-Daten */}
      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "26px 28px",
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
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "26px 28px",
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>Abo &amp; Zahlung</h2>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          Zahlungsmethoden ändern, Rechnungen herunterladen oder Abo kündigen — alles im Stripe-Kunden-Portal.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={openStripePortal}
            disabled={portalLoading}
            className="wf-tabs-brand-btn"
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
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16, padding: "20px 28px",
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
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none",
            }}
          >
            Reset-Link anfordern →
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Tab Navigation (Underline-Style) ───────────────────────────────────────
function TabNav({ active, onSelect, brandColor }: {
  active:     TabId;
  onSelect:   (tab: TabId) => void;
  brandColor: string;
}) {
  return (
    <nav className="wf-tabs-nav" style={{
      display: "flex", gap: 16,
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      marginBottom: 28,
      maxWidth: "100%",
      overflowX: "auto", WebkitOverflowScrolling: "touch",
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              position: "relative",
              padding: "12px 4px",
              fontSize: 14, fontWeight: isActive ? 700 : 500,
              color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
              transition: "color 0.18s ease",
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)"; }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; }}
          >
            {/* Inner span = text + underline. Underline-Width = exakte
                Textbreite, weil die innere Span sich an den Text anpasst
                und der Underline bei left:0/right:0 angedockt ist. */}
            <span style={{ position: "relative", display: "inline-block", paddingBottom: 13 }}>
              {tab.label}
              <span style={{
                position: "absolute", left: 0, right: 0, bottom: 0,
                height: 3, borderRadius: 2,
                background: isActive ? brandColor : "transparent",
                boxShadow: isActive ? `0 0 10px ${brandColor}66` : "none",
                transition: "background 0.18s ease, box-shadow 0.18s ease",
              }} />
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Main wrapper ───────────────────────────────────────────────────────────
type Props = {
  // Profile
  name:  string;
  email: string;
  plan:  string;

  // Branding
  branding: BrandingSettings;

  // Integrations (Pro+)
  integrationsStatus:   Status | null;
  integrationsSettings: IntegrationsVisible | null;
};

export default function SettingsTabsClient({
  name, email, plan, branding, integrationsStatus, integrationsSettings,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("profil");
  const [hydrated,  setHydrated]  = useState(false);
  const brandColor = /^#[0-9a-fA-F]{6}$/.test(branding.primary_color)
    ? branding.primary_color
    : "#8df3d3";

  // Hash → Tab. Initial-Hash beim Mount + auf hashchange-Event reagieren.
  // hydrated-Flag verhindert SSR/Client-Hash-Mismatch in der ersten Frame.
  useEffect(() => {
    setActiveTab(parseHash());
    setHydrated(true);
    function onHashChange() { setActiveTab(parseHash()); }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function selectTab(tab: TabId) {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      // history.replaceState statt window.location.hash, damit kein
      // unnötiger Scroll-Sprung zum Anker-Element passiert.
      history.replaceState(null, "", `${window.location.pathname}#${tab}`);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0b0c10", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "40px 24px 80px" }}>
      <style>{`
        @keyframes wf-spin { to { transform: rotate(360deg); } }
        .wf-tabs-brand-btn:not(:disabled):hover {
          transform: translateY(-1px);
          filter: brightness(0.94);
          box-shadow: 0 8px 24px ${brandColor}55, 0 0 0 1px ${brandColor}33 !important;
        }
        .wf-tabs-brand-btn:not(:disabled):active { filter: brightness(0.88); transform: translateY(0); }
        /* Tab-Nav: horizontaler Scroll-Container OHNE Native-Scrollbar.
           Funktionalität (Swipe auf Mobile) bleibt intakt — nur Visual weg. */
        .wf-tabs-nav {
          scrollbar-width: none;        /* Firefox */
          -ms-overflow-style: none;     /* IE/Edge */
        }
        .wf-tabs-nav::-webkit-scrollbar {
          display: none;                /* Chrome/Safari/Opera */
          width: 0; height: 0;
        }
      `}</style>

      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        {/* Tab-Navigation — ersetzt den alten H1 + Subtitle */}
        <TabNav active={activeTab} onSelect={selectTab} brandColor={brandColor} />

        {/* Bis zur Hash-Hydration den Default-Tab leer halten,
            sonst flashed Profil bevor #branding aktiv wird */}
        <TabContent show={hydrated && activeTab === "profil"}>
          <ProfileTab name={name} email={email} plan={plan} brandColor={brandColor} />
        </TabContent>

        <TabContent show={hydrated && activeTab === "branding"}>
          <SettingsClient plan={plan} initial={branding} embedded />
        </TabContent>

        <TabContent show={hydrated && activeTab === "integrationen"}>
          <IntegrationsSettingsClient
            plan={plan}
            hasAccess={true /* gegated bereits in page.tsx via hasBrandingAccess */}
            initialStatus={integrationsStatus}
            initialSettings={integrationsSettings}
            embedded
          />
        </TabContent>
      </div>
    </main>
  );
}

/** Render-Wrapper: nur sichtbar wenn show=true. Alle Tabs bleiben im DOM
 *  damit Form-State zwischen Tab-Wechseln erhalten bleibt. */
function TabContent({ show, children }: { show: boolean; children: ReactNode }) {
  return <div style={{ display: show ? "block" : "none" }}>{children}</div>;
}
