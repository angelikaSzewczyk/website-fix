import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import StarterDashboard from "@/components/dashboard/variants/StarterDashboard";
import ProDashboard     from "@/components/dashboard/variants/ProDashboard";
import RescueDashboard, { type RescueGuideMatch } from "@/components/dashboard/variants/RescueDashboard";
import { matchGuidesForIssues } from "@/lib/rescue-guides";
// Phase 3 Sprint 5: Echtes Agency-Layout — vorher inline IIFE, jetzt
// dedizierte Komponente. Plan-Router unten ruft sie für isAgency=true auf.
import AgencyDashboard  from "@/components/dashboard/variants/AgencyDashboard";
import { isAtLeastProfessional, isAgency as isAgencyPlan, getPlanQuota } from "@/lib/plans";
import { classifyDisplayCategory } from "@/lib/issue-categories";
import { getIntegrationSettings, connectionStatus } from "@/lib/integrations";
import ModalCloseButton from "./components/ModalCloseButton";
import ModalShell from "./components/ModalShell";
import NewClientForm from "./components/new-client-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — WebsiteFix",
  robots: { index: false },
};

// ─── Design tokens ─────────────────────────────────────────────────────────────
// Phase 3 Sprint 6: Dark-Mode-Tokens (vorher light → Stilbruch im Agency-
// Layout). New-Client-Modal + globale CSS-Selektoren konsumieren diese
// Tokens. AgencyTopBar nutzt eigene lokale Tokens für Topbar-Spezifika.
const C = {
  bg:          "#0b0c10",
  card:        "rgba(255,255,255,0.025)",
  border:      "rgba(255,255,255,0.08)",
  divider:     "rgba(255,255,255,0.06)",
  shadow:      "none",
  shadowMd:    "0 4px 18px rgba(0,0,0,0.5)",
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.55)",
  textMuted:   "rgba(255,255,255,0.4)",
  blue:        "#7aa6ff",
  blueBg:      "rgba(0,123,255,0.08)",
  blueBorder:  "rgba(0,123,255,0.22)",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.10)",
  greenDot:    "#22C55E",
  amber:       "#fbbf24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberDot:    "#F59E0B",
  red:         "#f87171",
  redBg:       "rgba(248,113,113,0.10)",
  redDot:      "#EF4444",
  yellow:      "#fbbf24",
} as const;

// ─── Plan → Layout ──────────────────────────────────────────────────────────────
// Canonical plans: starter | professional | agency (+ legacy aliases). Helper
// isAgencyPlan() normalisiert via lib/plans → Legacy-Strings (agency-starter,
// agency-pro) werden zentral dort gemappt, nicht doppelt hier.
function getLayout(plan: string): "single" | "agency" {
  return isAgencyPlan(plan) ? "agency" : "single"; // single = starter + professional
}

// Hex-Color-Validation und Branding-Color-Source leben jetzt in
// dashboard/layout.tsx. Page-Level brauchen wir nur agency_name + logo_url.

// ─── CMS Detection ──────────────────────────────────────────────────────────────
function detectCMS(text: string, url?: string): { label: string; version?: string } {
  const t = (text + " " + (url ?? "")).toLowerCase();
  if (/wp-content|wp-admin|wp-json|wordpress/.test(t)) return { label: "WordPress", version: "6.x" };
  if (/next\.js|nextjs|\/_next\//.test(t))             return { label: "Next.js" };
  if (/shopify/.test(t))                               return { label: "Shopify" };
  if (/webflow/.test(t))                               return { label: "Webflow" };
  if (/wix\.com/.test(t))                              return { label: "Wix" };
  if (/typo3/.test(t))                                 return { label: "TYPO3" };
  if (/joomla/.test(t))                                return { label: "Joomla" };
  if (/drupal/.test(t))                                return { label: "Drupal" };
  if (/react/.test(t))                                 return { label: "React" };
  return { label: "Custom" };
}

// ─── Issue Parsing ─────────────────────────────────────────────────────────────
type ParsedIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik" | "shop" | "builder";
  count?: number; // actual error count (e.g. 24 for 24 missing alt texts)
  url?: string;   // page URL for per-page issues
  // Phase A3: Aggregator-Felder durchreichen für Akkordeon-Render im UI.
  affectedUrls?: string[];
  scope?:        "global" | "local";
};

// classifyCategory + parseIssues wurden in Phase B / Push 2 entfernt.
// Sie waren der "fragile last resort" der Priority-Chain — Regex auf Claude-
// AI-Prosa, der bei fehlenden 🔴/🟡/🟢-Markern stillschweigend 0 Issues lieferte
// (genau der Trust-Bug aus dem Screenshot). issues_json ist jetzt die alleinige
// Truth-Quelle, mit unterseiten_json als Fallback für legacy Scans.

/**
 * Builds a full structured issue list directly from unterseiten_json crawler data.
 * Used when issues_json is null (older scans) to avoid re-parsing fragile Claude text.
 * Produces per-page issues so nothing is lost.
 */
function buildIssuesFromUnterseiten(
  unterseiten: { url: string; erreichbar: boolean; title: string; h1?: string; noindex: boolean; altMissing: number }[],
  issueCount: number | null,
): ParsedIssue[] {
  const issues: ParsedIssue[] = [];
  const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };

  // ── Consolidated aggregates — one entry per problem type with real count ──
  // Alt-text: single aggregated entry (count = total missing images)
  const totalAltMissing = unterseiten.reduce((s, p) => s + p.altMissing, 0);
  if (totalAltMissing > 0)
    issues.push({
      severity: "red",
      title: "Bilder ohne Alt-Text",
      body: `${totalAltMissing} Bilder ohne Beschreibung — schaden Barrierefreiheit und Google-Bild-Suche.`,
      category: "recht",
      count: totalAltMissing,
    });

  // Unreachable pages
  const unreachable = unterseiten.filter(p => !p.erreichbar);
  if (unreachable.length > 0)
    issues.push({
      severity: "red",
      title: "Unterseiten nicht erreichbar",
      body: `404/5xx auf: ${unreachable.slice(0, 3).map(p => toPath(p.url)).join(", ")}${unreachable.length > 3 ? ` (+${unreachable.length - 3} weitere)` : ""}.`,
      category: "technik",
      count: unreachable.length,
    });

  // Missing title tags
  const noTitle = unterseiten.filter(p => !p.title || p.title === "(kein Title)");
  if (noTitle.length > 0)
    issues.push({
      severity: "red",
      title: "Seiten ohne Title-Tag",
      body: `${noTitle.length} Seite${noTitle.length > 1 ? "n" : ""} ohne Title — schaden Google-Ranking direkt.`,
      category: "technik",
      count: noTitle.length,
    });

  // Missing H1
  const noH1 = unterseiten.filter(p => !p.h1 || p.h1 === "(kein H1)");
  if (noH1.length > 0)
    issues.push({
      severity: "yellow",
      title: "Seiten ohne H1-Überschrift",
      body: `${noH1.length} Seite${noH1.length > 1 ? "n" : ""} ohne H1 — schwächt das SEO-Signal.`,
      category: "technik",
      count: noH1.length,
    });

  // Noindex
  const noindex = unterseiten.filter(p => p.noindex);
  if (noindex.length > 0)
    issues.push({
      severity: "yellow",
      title: "Seiten von Google ausgeschlossen",
      body: `Noindex aktiv auf ${noindex.length} Seite${noindex.length > 1 ? "n" : ""}: ${noindex.slice(0, 3).map(p => toPath(p.url)).join(", ")}.`,
      category: "technik",
      count: noindex.length,
    });

  // Generic fallback when no other data
  if (issues.length === 0 && (issueCount ?? 0) > 0)
    issues.push({
      severity: "yellow",
      title: "Technische Probleme gefunden",
      body: "Starte einen neuen Scan für den vollständigen Bericht.",
      category: "technik",
      count: issueCount ?? 1,
    });

  return issues;
}

// buildTechFallback wurde in Phase B / Push 2 entfernt — war nur ein Wrap
// um buildIssuesFromUnterseiten und wurde nur vom toten parseIssues-Pfad
// genutzt. Die Priority-Chain ruft jetzt direkt buildIssuesFromUnterseiten.

// ─── Fix Guide per CMS ─────────────────────────────────────────────────────────
function getFixGuide(title: string, cms: string): string {
  const t = title.toLowerCase();
  const isWP = cms === "WordPress";
  if (/alt.?text|alt-text/.test(t))
    return isWP ? "WordPress: Medien → Bild auswählen → Feld 'Alternativer Text' ausfüllen. Kurz & beschreibend halten." : "Füge im HTML-Tag img das Attribut alt='Beschreibung' hinzu.";
  if (/meta.?desc|beschreibung/.test(t))
    return isWP ? "Yoast SEO / RankMath: Seite bearbeiten → SEO-Vorschau → Meta-Beschreibung eingeben (150–160 Zeichen)." : "Füge <meta name='description' content='...'> im <head> ein.";
  if (/h1|überschrift/.test(t))
    return "Jede Seite sollte genau eine H1-Überschrift haben. Sie beschreibt das Hauptthema der Seite.";
  if (/ssl|https|zertifikat/.test(t))
    return "Aktiviere SSL in deinem Hosting-Kontrollpanel (kostenlos via Let's Encrypt). Danach HTTP → HTTPS Weiterleitungen einrichten.";
  if (/sitemap/.test(t))
    return isWP ? "Yoast SEO: Einstellungen → XML-Sitemaps aktivieren. Dann in Google Search Console einreichen." : "Erstelle eine sitemap.xml und reiche sie in der Google Search Console ein.";
  if (/robots\.txt/.test(t))
    return "Die robots.txt muss erreichbar sein unter deinedomain.de/robots.txt und darf wichtige Seiten nicht blockieren.";
  if (/cookie|einwilligung/.test(t))
    return "Ein DSGVO-konformes Cookie-Consent-Tool ist Pflicht (z.B. Cookiebot, Borlabs Cookie). Vor dem Laden von Tracking-Skripten Einwilligung einholen.";
  if (/impressum/.test(t))
    return "Das Impressum muss von jeder Seite erreichbar sein. Pflichtangaben: Name, Adresse, E-Mail, Tel. (§ 5 TMG).";
  if (/ladezeit|speed|pagespeed|performance/.test(t))
    return isWP ? "WP Rocket oder LiteSpeed Cache installieren. Bilder in WebP konvertieren. Hosting-Paket ggf. upgraden." : "Bilder komprimieren, CSS/JS minimieren, CDN einsetzen (z.B. Cloudflare).";
  return "Prüfe den vollständigen Bericht für detaillierte Handlungsempfehlungen zu diesem Punkt.";
}

// ─── ScanBrief-Type (HistoryChart wurde nach components/history-chart.tsx
//     extrahiert; das Original lebt nicht mehr hier) ─────────────────────────
type ScanBrief = { id: string; url: string; type: string; created_at: string; issue_count: number | null };

// ─── Types ─────────────────────────────────────────────────────────────────────
type Scan = ScanBrief & { result?: string | null };
// CriticalSite-Typ existierte hier zur Übergabe an AgencyDashboard. Mit
// Sprint 11 lädt AgencyDashboard 2.0 seine Matrix selbst — dieser Typ ist
// nicht mehr nötig und wurde entfernt.

const PLAN_BADGE = {
  "starter":       { label: "Starter",      color: "#2563EB", bg: "#EFF6FF",             border: "#BFDBFE" },
  "professional":  { label: "Professional", color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)" },
  "smart-guard":   { label: "Professional", color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)" },
  "agency":        { label: "Agency",       color: "#7C3AED", bg: "#F5F3FF",             border: "#DDD6FE" },
  "agency-starter":{ label: "Agency",       color: "#7C3AED", bg: "#F5F3FF",             border: "#DDD6FE" },
  "agency-pro":    { label: "Agency",       color: "#7C3AED", bg: "#F5F3FF",             border: "#DDD6FE" },
} as const;

// ─── Shared helpers ─────────────────────────────────────────────────────────────
function PdfIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  );
}

function StatusBadge({ status }: { status: "ok" | "warning" | "critical" | string }) {
  const conf = {
    ok:       { label: "OK",       color: C.green, bg: C.greenBg, dot: C.greenDot, border: "#A7F3D0" },
    warning:  { label: "Warnung",  color: C.amber, bg: C.amberBg, dot: C.amberDot, border: "#FDE68A" },
    critical: { label: "Kritisch", color: C.red,   bg: C.redBg,   dot: C.redDot,   border: "#FECACA" },
  }[status] ?? { label: "—", color: C.textMuted, bg: C.divider, dot: C.textMuted, border: C.border };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, color: conf.color, background: conf.bg, border: `1px solid ${conf.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: conf.dot, display: "inline-block" }} />
      {conf.label}
    </span>
  );
}

function ProgressBar({ plan, scanCount, hasResult }: { plan: string; scanCount: number; hasResult: boolean }) {
  const badge = PLAN_BADGE[plan as keyof typeof PLAN_BADGE] ?? PLAN_BADGE["starter"];
  const isPro = isAtLeastProfessional(plan);
  // Steps: account created (always), first scan done, Pro/Agency plan, second scan done
  const steps = [true, scanCount > 0, isPro, scanCount > 1];
  const done = steps.filter(Boolean).length;
  const pct = Math.round((done / steps.length) * 100);
  const barColor = pct >= 75 ? C.green : pct >= 50 ? "#34D399" : C.yellow;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "8px 28px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, whiteSpace: "nowrap", letterSpacing: "0.08em", textTransform: "uppercase" }}>Setup</span>
        <div style={{ flex: 1, height: 5, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: barColor, transition: "width 0.5s ease" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: barColor, whiteSpace: "nowrap" }}>{pct}%</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
          {badge.label}
        </span>
        {!isPro && (
          <Link href="/fuer-agenturen#pricing" style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, textDecoration: "none", background: "var(--pro-emerald-bg)", border: "1px solid var(--pro-emerald-border)", color: "var(--pro-emerald)" }}>
            Auf Professional upgraden →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Agency Top Bar ─────────────────────────────────────────────────────────────
function AgencyTopBar({ badge, usedSlots, slotsLabel, clientSlotLimit, logoUrl, agencyName }: {
  badge: { label: string; color: string; bg: string; border: string };
  usedSlots: number; slotsLabel: string; clientSlotLimit: number;
  logoUrl?: string | null; agencyName?: string | null;
}) {
  // Live-Preview-Tooltip — wird sowohl auf Logo als auch auf den
  // Text-Fallback gehängt. Subtiler Upsell-Reminder für den Wert des
  // Agency-Plans (Branding wirkt nicht nur intern, sondern auch in den
  // versendeten PDF-Reports → Endkunden sehen die Marke der Agentur).
  const brandTooltip = "Dieses Branding wird auch in deinen PDF-Reports für Kunden verwendet.";

  // Phase 3 Sprint 6: Dark-Mode-Tokens (vorher light → Stilbruch).
  // Lokale const, weil page.tsx-C noch für andere helper light bleibt.
  const TOPBAR_BG     = "rgba(11,12,16,0.85)";
  const TOPBAR_BORDER = "rgba(255,255,255,0.06)";
  const TOPBAR_DIV    = "rgba(255,255,255,0.10)";
  const TOPBAR_TEXT   = "rgba(255,255,255,0.92)";
  const TOPBAR_SUB    = "rgba(255,255,255,0.55)";
  const TOPBAR_CARD   = "rgba(255,255,255,0.04)";
  const SLOT_OVER_BG  = "rgba(248,113,113,0.12)";
  const SLOT_OVER_BD  = "rgba(248,113,113,0.30)";
  const SLOT_OVER_FG  = "#f87171";

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: TOPBAR_BG, backdropFilter: "blur(12px)", borderBottom: `1px solid ${TOPBAR_BORDER}`, padding: "8px 32px" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 14 }}>
        {/* White-label logo or stylized text fallback. */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={agencyName ?? "Logo"}
            title={brandTooltip}
            style={{ height: 28, maxWidth: 120, objectFit: "contain", flexShrink: 0, cursor: "help" }}
          />
        ) : (
          <span
            title={brandTooltip}
            style={{ fontSize: 13, fontWeight: 800, color: TOPBAR_TEXT, whiteSpace: "nowrap", cursor: "help" }}
          >
            {agencyName ?? "Kommandozentrale"}
          </span>
        )}
        <div style={{ width: 1, height: 16, background: TOPBAR_DIV, flexShrink: 0 }} />
        {/* Plan-Pill — lila wie FeatureGate-Locks, nicht mehr badge.bg-light. */}
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, color: "#a78bfa", background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.30)", whiteSpace: "nowrap" }}>
          Plan: {badge.label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 20,
            background: usedSlots >= clientSlotLimit ? SLOT_OVER_BG  : TOPBAR_CARD,
            border:     `1px solid ${usedSlots >= clientSlotLimit ? SLOT_OVER_BD : TOPBAR_BORDER}` }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={usedSlots >= clientSlotLimit ? SLOT_OVER_FG : TOPBAR_SUB} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: usedSlots >= clientSlotLimit ? SLOT_OVER_FG : TOPBAR_TEXT, whiteSpace: "nowrap" }}>
            Slots: {usedSlots} / {slotsLabel}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        {/* White-label settings link — nutzt jetzt die Brand-CSS-Vars statt
            hartkodierter badge-Farben. Ein-Klick zur Branding-Sektion im Hub. */}
        <a
          href="/dashboard/agency-branding"
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700,
            padding: "4px 12px", borderRadius: 20,
            color: "var(--agency-accent)",
            background: "var(--agency-accent-bg)",
            border: "1px solid var(--agency-accent-border)",
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93A10 10 0 0 1 19.07 19.07"/></svg>
          White-Label
        </a>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ project?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql       = neon(process.env.DATABASE_URL!);
  const plan      = ((session.user as { plan?: string }).plan ?? "starter") as keyof typeof PLAN_BADGE;
  const badge     = PLAN_BADGE[plan] ?? PLAN_BADGE["starter"];
  const firstName = session.user.name?.split(" ")[0] ?? "Dashboard";
  const layout    = getLayout(plan);
  const isAgency  = layout === "agency";
  const isSingle  = layout === "single";

  // ── Plan-basierte Detection für RescueDashboard (Single-Site-Rescue) ─────
  // Sorglos-Flatrate-Pivot (05.05.): Pro/Agency dürfen NIE im RescueDashboard
  // landen — sie haben für KI-Smart-Fix-Drawer, Score-History und Multi-Site-
  // Portfolio bezahlt. Selbst mit 1 Site sehen Pro-User das ProDashboard.
  // Nur Starter (Pay-per-Guide-Pivot) bekommt den 3-Säulen-Rescue-View.
  let siteCount = 0;
  try {
    const cnt = await sql`
      SELECT COUNT(*)::int AS c FROM saved_websites WHERE user_id = ${session.user.id}
    ` as { c: number }[];
    siteCount = cnt[0]?.c ?? 0;
  } catch { /* Tabelle leer/fehlt → Default 0 */ }
  void siteCount; // bleibt im Scope für künftige Plan-Differenzierungen
  const useRescueView = !isAgency && plan === "starter";

  // Phase 3 Sprint 4: ?project=<id> Active-Project-Scoping.
  // Wenn ein Projekt-Param mitkommt, schauen wir die zugehörige URL nach
  // (mit Ownership-Check) und scopen den scans-SELECT auf genau diese URL.
  // Sonst: bisheriges Verhalten — letzte 20 Scans des Users über alle URLs.
  const sp = await searchParams;
  const projectId = sp?.project ?? null;
  let scopedProjectUrl: string | null = null;
  if (projectId) {
    try {
      const rows = await sql`
        SELECT url FROM saved_websites WHERE id = ${projectId} AND user_id = ${session.user.id} LIMIT 1
      ` as { url: string }[];
      scopedProjectUrl = rows[0]?.url ?? null;
    } catch { /* spalte/tabelle fehlt → fallback auf global */ }
  }

  const scans = scopedProjectUrl
    ? await sql`
        SELECT id, url, type, created_at, issue_count
        FROM scans
        WHERE user_id = ${session.user.id} AND url = ${scopedProjectUrl}
        ORDER BY created_at DESC LIMIT 20
      ` as Scan[]
    : await sql`
        SELECT id, url, type, created_at, issue_count
        FROM scans WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC LIMIT 20
      ` as Scan[];

  // ─── Agency Wrapper-Daten ──────────────────────────────────────────────
  // Phase 3 Sprint 11: AgencyDashboard 2.0 lädt seine Kunden-Matrix selbst
  // (dieselbe LATERAL-JOIN-SQL wie /dashboard/clients). page.tsx braucht nur
  // noch die Agency-Identität (Name, Logo) für die TopBar plus den Slot-
  // Count für das "X / Y"-Pill. Vorher wurde criticalSites zusätzlich hier
  // berechnet — Folge: zwei Queries auf dieselben Tabellen mit leicht
  // unterschiedlichen Filtern → Zahlen-Drift zwischen TopBar und Matrix.
  let usedAgencySlots = 0;
  let agencyLogoUrl: string | null = null;
  let agencyName:    string | null = null;
  if (isAgency) {
    try {
      const slotRows = await sql`
        SELECT COUNT(*)::int AS cnt
        FROM saved_websites
        WHERE user_id = ${session.user.id}
      ` as { cnt: number }[];
      usedAgencySlots = slotRows[0]?.cnt ?? 0;
    } catch { /* non-critical */ }

    try {
      const agRows = await sql`
        SELECT agency_name, logo_url
        FROM agency_settings WHERE user_id = ${session.user.id} LIMIT 1
      ` as { agency_name: string | null; logo_url: string | null }[];
      agencyLogoUrl = agRows[0]?.logo_url    ?? null;
      agencyName    = agRows[0]?.agency_name ?? null;
    } catch { /* non-critical */ }
  }

  // Free/Single: last scan result for issue parsing + tech fingerprint + page data
  let lastScanResult: string | null = null;
  let lastScanIssuesJson: ParsedIssue[] | null = null;
  let techFingerprint: import("@/lib/tech-detector").TechFingerprint | null = null;
  let lastScanTotalPages: number | null = null;
  let lastScanSpeedScore: number | null = null;
  let lastScanUnterseiten: { url: string; erreichbar: boolean; title: string; h1?: string; noindex: boolean; altMissing: number; altMissingImages?: string[]; metaDescription?: string; inputsWithoutLabel?: number; inputsWithoutLabelFields?: string[]; buttonsWithoutText?: number; foundVia?: string }[] | null = null;
  let lastScanWooAudit: {
    addToCartButtons: number; cartButtonsBlocked: boolean;
    pluginImpact: Array<{ name: string; impactScore: number; reason: string }>;
    outdatedTemplates: boolean; revenueRiskPct: number;
  } | null = null;
  let lastScanBuilderAudit: {
    builder: string | null; maxDomDepth: number; divCount: number;
    googleFontFamilies: string[]; cssBloatHints: string[]; stylesheetCount: number;
  } | null = null;
  let lastScanTtfbMs: number | null = null;
  // Phase A2: Site-Wide-Metrics aus meta_json
  let lastScanAvgTtfbMs: number | null = null;
  let lastScanWcagScore: number | null = null;
  let lastScanWcagLabel: string | null = null;
  const lastScan = scans[0] ?? null;
  if (!isAgency && lastScan) {
    try {
      const rows = await sql`
        SELECT result, issues_json, tech_fingerprint, total_pages, unterseiten_json, speed_score, meta_json
        FROM scans WHERE id = ${lastScan.id} AND user_id = ${session.user.id}
      ` as { result: string | null; issues_json: unknown; tech_fingerprint: unknown; total_pages: number | null; unterseiten_json: unknown; speed_score: number | null; meta_json: { woo_audit?: typeof lastScanWooAudit; builder_audit?: typeof lastScanBuilderAudit; ttfb_ms?: number; avg_ttfb_ms?: number; wcag_heuristic_score?: number; wcag_heuristic_label?: string } | null }[];
      lastScanResult = rows[0]?.result ?? null;
      lastScanIssuesJson = (rows[0]?.issues_json as ParsedIssue[] | null) ?? null;
      // Sanitize tech_fingerprint: leeres Objekt {} aus DB (z.B. Phase-B-Migration
      // ohne verkabelten TechFingerprint-Builder) wird als NULL behandelt.
      // Sonst crasht Frontend bei `fingerprint && fingerprint.ecommerce.value`,
      // weil {} truthy ist aber sub-Felder undefined sind.
      const rawFingerprint = rows[0]?.tech_fingerprint;
      techFingerprint = (
        rawFingerprint &&
        typeof rawFingerprint === "object" &&
        Object.keys(rawFingerprint).length > 0 &&
        // Mindest-Strukturcheck: TechFingerprint hat mindestens cms-Feld.
        // Schutz gegen alte/kaputte DB-Einträge.
        "cms" in rawFingerprint
      )
        ? rawFingerprint as import("@/lib/tech-detector").TechFingerprint
        : null;
      lastScanTotalPages = rows[0]?.total_pages ?? null;
      lastScanSpeedScore = rows[0]?.speed_score ?? null;
      lastScanUnterseiten = (rows[0]?.unterseiten_json as typeof lastScanUnterseiten | null) ?? null;
      lastScanWooAudit = rows[0]?.meta_json?.woo_audit ?? null;
      lastScanBuilderAudit = rows[0]?.meta_json?.builder_audit ?? null;
      lastScanTtfbMs = typeof rows[0]?.meta_json?.ttfb_ms === "number" ? rows[0].meta_json.ttfb_ms : null;
      // Phase A2: full-scan schreibt avg_ttfb_ms, single-scan ttfb_ms.
      // Wenn beide da: prefer avg_ttfb_ms (Site-Wide-Mittelwert ist aussagekräftiger).
      lastScanAvgTtfbMs = typeof rows[0]?.meta_json?.avg_ttfb_ms === "number"
        ? rows[0].meta_json.avg_ttfb_ms
        : lastScanTtfbMs;
      lastScanWcagScore = typeof rows[0]?.meta_json?.wcag_heuristic_score === "number"
        ? rows[0].meta_json.wcag_heuristic_score
        : null;
      lastScanWcagLabel = typeof rows[0]?.meta_json?.wcag_heuristic_label === "string"
        ? rows[0].meta_json.wcag_heuristic_label
        : null;
    } catch {}
  }

  // Monthly scan counter + plan-aware limit. Single source of truth: PLAN_QUOTAS
  // in lib/plans.ts. Legacy plan-strings (smart-guard, agency-starter, agency-pro)
  // werden via normalizePlan() in getPlanQuota auf den kanonischen Plan gemappt.
  const SCAN_LIMIT = getPlanQuota(plan).monthlyScans;
  const now = new Date();
  const monthlyScans = scans.filter(s => {
    const d = new Date(s.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  // Priority chain (Phase B / Push 2 — auf 2 Stufen reduziert):
  //   1. issues_json (structured, vom Scan persistiert — ground truth)
  //   2. unterseiten_json (per-page crawler data — Fallback für alte Scans
  //      ohne issues_json, z.B. legacy v1-Caches)
  //
  // Vorher gab es Stufe 3: parseIssues(AI-Prosa) mit Regex auf 🔴/🟡/🟢-Marker.
  // Diese Stufe produzierte "Phantome" — wenn Claude-Text keine Marker
  // generierte, kam 0 zurück → "Keine Probleme" trotz tatsächlicher Befunde.
  // Genau der Trust-Bug aus dem Screenshot. Mit Push 1 schreiben beide
  // Routes zuverlässig issues_json → Stufe 3 ist obsolet und ENTFERNT.
  const unterseiten4Issues = (lastScanUnterseiten ?? []) as { url: string; erreichbar: boolean; title: string; h1?: string; noindex: boolean; altMissing: number }[];
  let issues: ParsedIssue[];

  if (lastScanIssuesJson && lastScanIssuesJson.length > 0) {
    issues = lastScanIssuesJson;
  } else if (unterseiten4Issues.length > 0) {
    issues = buildIssuesFromUnterseiten(unterseiten4Issues, lastScan?.issue_count ?? null);
  } else {
    issues = [];
  }

  const cms = lastScanResult ? detectCMS(lastScanResult, lastScan?.url) : { label: "–" };

  const redIssues    = issues.filter(i => i.severity === "red");
  const yellowIssues = issues.filter(i => i.severity === "yellow");

  // Phase-3-Refactor: 4 Anzeige-Kategorien (Performance / SEO / Best Practices / Accessibility).
  // Datenmodell-Kategorie (recht/speed/technik/shop/builder) bleibt unangetastet —
  // Mapping passiert zentral in lib/issue-categories.
  const performanceIssues   = issues.filter(i => classifyDisplayCategory(i) === "performance");
  const seoIssues           = issues.filter(i => classifyDisplayCategory(i) === "seo");
  const bestPracticesIssues = issues.filter(i => classifyDisplayCategory(i) === "bestPractices");
  const accessibilityIssues = issues.filter(i => classifyDisplayCategory(i) === "accessibility");

  // BFSG = Accessibility-only (vorher: alle "recht"-Issues — Cookies/DSGVO falsch zugeordnet).
  const bfsgOk     = accessibilityIssues.length === 0;
  // Use persisted speed_score when available (avoids formula drift between live + archive views)
  const speedScore = lastScanSpeedScore ?? Math.max(10, 100 - performanceIssues.length * 15 - yellowIssues.length * 8);

  // Agency-Slots: kanonisch aus PLAN_QUOTAS (agency = 50).
  const clientSlotLimit = isAgency ? getPlanQuota(plan).projects : 10;
  const slotsLabel      = String(clientSlotLimit);
  // usedSlots stammt jetzt aus dem dedizierten COUNT(*) oben — KEIN
  // separates Mapping mehr, das mit AgencyDashboard 2.0 driften könnte.
  const usedSlots = usedAgencySlots;

  // Integrations-Status für die Issue-Action-Bar — nur für Pro im
  // single-Layout (Agency hat kein FreeDashboardClient-Render). Bei Failure
  // bleibt die Bar leer, der User sieht "Slack/Asana verbinden →"-Hints.
  let integrationsStatus: { asana: boolean; slack: boolean } | null = null;
  if (!isAgency && isAtLeastProfessional(plan)) {
    try {
      const settings = await getIntegrationSettings(session.user.id as string);
      const s = connectionStatus(settings);
      integrationsStatus = { asana: s.asana, slack: s.slack };
    } catch (err) {
      console.error("[dashboard] integrations status load failed:", err);
    }
  }

  return (
    <div style={{
      // Phase 3 Sprint 6: Dark-Mode für alle Plans (vorher: Agency hatte
      // light-bg C.bg → Stilbruch zum Rest des Tools).
      background: "#0b0c10",
      minHeight: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      // Agency-CSS-Vars (--agency-accent*) werden jetzt zentral in
      // dashboard/layout.tsx gesetzt und kaskadieren über alle dashboard/*
      // Pages. Vorher inline hier — verursachte Inkonsistenz auf Scan-Detail.
    }}>
      <style>{`
        a { text-decoration: none; }
        .dash-row:hover  { background: ${C.divider} !important; }
        .fix-details summary { cursor: pointer; user-select: none; }
        .fix-details summary::-webkit-details-marker { display: none; }
        .issue-row:hover { background: #F8FAFC !important; }
        /* Agency: new-client modal via CSS :target */
        .agency-modal { display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.5); z-index: 200; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .agency-modal:target { display: flex; }
        /* Mission-Control: 2-Spalten-Sub-Grids (Activity+Team, System+Anstehende)
           bei engen Viewports stacken. wf-agency-grid selbst ist flex-column
           und braucht keinen Stack-Breakpoint mehr. */
        @media (max-width: 860px) {
          .agency-two-col { grid-template-columns: 1fr !important; }
        }

        /* Stat-Tile Hover (klickbar — Drill-Down zu Portfolio/Reports). */
        .agency-stat-tile:hover {
          background: rgba(255,255,255,0.045) !important;
          border-color: rgba(255,255,255,0.14) !important;
          transform: translateY(-1px);
        }

        /* Feed-Item Hover (Live-Monitor / Activity / Lead-Ticker / Anstehende
           Berichte) — gemeinsame agency-feed-item-Klasse). */
        .agency-feed-item:hover {
          background: rgba(255,255,255,0.04) !important;
        }

        /* Sidebar-Logo-Placeholder Hover (führt zu Agency-Branding-Hub). */
        .agency-logo-placeholder:hover {
          background: rgba(167,139,250,0.08);
        }

        /* Acknowledge-Button im Live-Monitor — green tint on hover. */
        .agency-ack-btn:not(:disabled):hover {
          background: rgba(74,222,128,0.14) !important;
          border-color: rgba(74,222,128,0.35) !important;
          color: #4ade80 !important;
        }

        /* Live-Monitor Pulse-Glow bei aktiven Alarmen. Loop nur active wenn
           agency-monitor-pulse-Klasse gesetzt ist (= liveAlerts.length > 0). */
        @keyframes agency-monitor-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.18); }
          50%      { box-shadow: 0 0 18px 2px rgba(248,113,113,0.30); }
        }
        .agency-monitor-pulse {
          animation: agency-monitor-pulse 3.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .agency-monitor-pulse { animation: none; }
        }
        /* Professional: checkbox-based done state via :has() */
        .fix-details:has(.fix-done:checked) { background: #F0FDF4 !important; }
        .fix-details:has(.fix-done:checked) > summary .issue-title { text-decoration: line-through; color: ${C.textMuted} !important; }
        /* Pulse animation for monitoring dot */
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .pulse-dot { animation: pulse-ring 2s infinite; }
        /* Lock-Glass-CSS war hier global definiert, aber niemals verwendet —
           nach Phase 2 in components/locked-section.tsx gekapselt. */
        /* Auto-Report CSS toggle (server component, no JS) */
        .ar-cb { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .ar-track { display: inline-flex; width: 36px; height: 20px; border-radius: 10px; background: #CBD5E1; position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
        .ar-thumb { display: block; width: 14px; height: 14px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .ar-wrap:has(.ar-cb:checked) .ar-track { background: #16A34A; }
        .ar-wrap:has(.ar-cb:checked) .ar-thumb { left: 19px; }
      `}</style>

      {isAgency && <AgencyTopBar badge={badge} usedSlots={usedSlots} slotsLabel={slotsLabel} clientSlotLimit={clientSlotLimit} logoUrl={agencyLogoUrl} agencyName={agencyName} />}

      {/* ══════════════════════════════════════════════════════════
          FREE / STARTER / PROFESSIONAL LAYOUT — PREMIUM DARK
          ══════════════════════════════════════════════════════════ */}
      {/* Plan-Router (Phase 1): Starter und Pro/Professional bekommen
          unterschiedliche Variants — dieselben Props, plan-spezifische
          Sektionen. Agency hat einen eigenen Render-Pfad weiter unten
          (IIFE, line ~646), der nicht durch diese Branch läuft. */}
      {!isAgency && useRescueView && lastScan && (() => {
        // ── Guide-Matching pro Säule (Pay-per-Guide MVP, 03.05.) ──
        // Wir klassifizieren die Issues genau wie das Client-Render
        // im RescueDashboard (Title-Keywords + ScanIssue-category) und
        // ziehen pro Säule den höchstrelevanten passenden Guide aus DB.
        // Das passiert hier server-side — der Client kriegt fertige
        // Match-Records und rendert nur noch den SOS-Button.
        return (
          <RescueDashboardWithGuides
            firstName={firstName}
            url={lastScan.url}
            lastScanId={String(lastScan.id)}
            lastScanAt={lastScan.created_at}
            speedScore={speedScore}
            issues={issues}
            redCount={redIssues.length}
            yellowCount={yellowIssues.length}
            userId={String(session.user.id)}
          />
        );
      })()}
      {!isAgency && useRescueView && !lastScan && (
        <RescueDashboard
          firstName={firstName}
          domain="Noch keine Website"
          url=""
          lastScanId={null}
          lastScanAt={null}
          speedScore={0}
          issues={[]}
          redCount={0}
          yellowCount={0}
        />
      )}
      {!isAgency && !useRescueView && (
        <Suspense>
          {isAtLeastProfessional(plan) ? (
            <ProDashboardWithGuides
              firstName={firstName}
              plan={plan}
              lastScan={lastScan}
              lastScanResult={lastScanResult}
              issues={issues}
              redCount={redIssues.length}
              yellowCount={yellowIssues.length}
              performanceIssues={performanceIssues}
              seoIssues={seoIssues}
              bestPracticesIssues={bestPracticesIssues}
              accessibilityIssues={accessibilityIssues}
              cms={cms}
              bfsgOk={bfsgOk}
              speedScore={speedScore}
              scans={scans}
              monthlyScans={monthlyScans}
              scanLimit={SCAN_LIMIT}
              fingerprint={techFingerprint}
              totalPages={lastScanTotalPages}
              unterseiten={lastScanUnterseiten}
              wooAudit={lastScanWooAudit}
              builderAudit={lastScanBuilderAudit}
              integrationsStatus={integrationsStatus}
              avgTtfbMs={lastScanAvgTtfbMs}
              wcagHeuristicScore={lastScanWcagScore}
              wcagHeuristicLabel={lastScanWcagLabel}
              userId={String(session.user.id)}
            />
          ) : (
            <StarterDashboard
              firstName={firstName}
              plan={plan}
              lastScan={lastScan}
              lastScanResult={lastScanResult}
              issues={issues}
              redCount={redIssues.length}
              yellowCount={yellowIssues.length}
              performanceIssues={performanceIssues}
              seoIssues={seoIssues}
              bestPracticesIssues={bestPracticesIssues}
              accessibilityIssues={accessibilityIssues}
              cms={cms}
              bfsgOk={bfsgOk}
              speedScore={speedScore}
              scans={scans}
              monthlyScans={monthlyScans}
              scanLimit={SCAN_LIMIT}
              fingerprint={techFingerprint}
              totalPages={lastScanTotalPages}
              unterseiten={lastScanUnterseiten}
              wooAudit={lastScanWooAudit}
              builderAudit={lastScanBuilderAudit}
              integrationsStatus={integrationsStatus}
              avgTtfbMs={lastScanAvgTtfbMs}
              wcagHeuristicScore={lastScanWcagScore}
              wcagHeuristicLabel={lastScanWcagLabel}
            />
          )}
        </Suspense>
      )}

{/* ══════════════════════════════════════════════════════════
          AGENCY LAYOUT  (plan: agency-starter | agency-pro)
          ══════════════════════════════════════════════════════════ */}
      {isAgency && (
        <AgencyDashboard
          firstName={firstName}
          plan={plan}
          badge={badge}
          userId={String(session.user.id)}
          agencyName={agencyName}
          agencyLogoUrl={agencyLogoUrl}
          scans={scans}
          usedSlots={usedSlots}
        />
      )}

      {/* ── New Client Modal (CSS :target Show + Client-Component-Form) ──
          Wrapper ist jetzt ModalShell — CSS-:target öffnet weiterhin, aber
          Overlay-Click + ESC schließen das Modal sauber (vorher konnte man
          NUR über die Buttons schließen). */}
      <ModalShell
        id="modal-new-client"
        className="agency-modal"
        innerStyle={{ background: C.card, borderRadius: 20, padding: "32px", maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative" }}
      >
        <ModalCloseButton ariaLabel="Modal schließen" style={{ position: "absolute", top: 16, right: 20, fontSize: 22, color: C.textMuted, lineHeight: 1 }}>×</ModalCloseButton>
        <div style={{ marginBottom: 24 }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: C.blue, textTransform: "uppercase", letterSpacing: "0.08em" }}>Neues Projekt</p>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Kunden anlegen</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSub }}>Füge einen neuen Kunden zur Kunden-Matrix hinzu.</p>
        </div>
        <NewClientForm />
      </ModalShell>

    </div>
  );
}

// ─── RescueDashboardWithGuides ───────────────────────────────────────────────
// Server-Wrapper, der die Guide-Matches berechnet und an den
// RescueDashboard-Client weitergibt. Liegt außerhalb der Hauptkomponente
// damit die guides-Query nicht im Top-Level-Render-Pfad läuft (nur wenn
// useRescueView && lastScan).
async function RescueDashboardWithGuides(props: {
  firstName: string;
  url: string;
  lastScanId: string;
  lastScanAt: string;
  speedScore: number;
  issues: ParsedIssue[];
  redCount: number;
  yellowCount: number;
  userId: string;
}) {
  // Pillars: dieselbe Klassifikation wie im Client (Title-Keywords)
  const VISIBILITY_KEYWORDS = ["title","meta-description","meta beschreib","h1","h2","noindex","sitemap","robots.txt","robots","canonical","indexier","google find","open graph","og:","twitter card","html-lang","alt-attribut","alt-text"];
  const HEALTH_KEYWORDS = ["wordpress","wp-version","php","kritischer fehler","fatal","plugin","theme","security-header","csp","hsts","x-frame","ssl","https","cookie","wp-login","veraltet","outdated","update","schwachstelle","barriere","label","formular","bfsg","wcag"];
  const SPEED_KEYWORDS = ["ttfb","antwortzeit","speed","geschwindigkeit","performance","largest contentful","lcp","fcp","cls","render-block","bilder","image-size","hosting","lazyload","preload","minify","compress"];

  function classify(issue: ParsedIssue): "visibility" | "health" | "speed" | null {
    const hay = `${issue.title} ${issue.body ?? ""}`.toLowerCase();
    if (SPEED_KEYWORDS.some(k => hay.includes(k))) return "speed";
    if (issue.category === "speed") return "speed";
    if (HEALTH_KEYWORDS.some(k => hay.includes(k))) return "health";
    if (issue.category === "technik" || issue.category === "recht") return "health";
    if (VISIBILITY_KEYWORDS.some(k => hay.includes(k))) return "visibility";
    return null;
  }

  // Pro Säule die Issues sammeln und die matchenden Guides aus der DB ziehen
  const byPillar: Record<"visibility" | "health" | "speed", ParsedIssue[]> = {
    visibility: [], health: [], speed: [],
  };
  for (const issue of props.issues) {
    const p = classify(issue);
    if (p) byPillar[p].push(issue);
  }

  async function topGuideForPillar(
    issues: ParsedIssue[]
  ): Promise<RescueGuideMatch | null> {
    if (issues.length === 0) return null;
    const matches = await matchGuidesForIssues(
      issues.map(i => ({ title: i.title, body: i.body, category: i.category, severity: i.severity })),
      props.userId,
    );
    if (matches.length === 0) return null;
    const top = matches[0];
    return {
      id: top.guide.id,
      title: top.guide.title,
      problem_label: top.guide.problem_label,
      preview: top.guide.preview,
      price_cents: top.guide.price_cents,
      estimated_minutes: top.guide.estimated_minutes,
      unlocked: top.unlocked,
      checklistPreview: top.guide.content_json.checklist?.slice(0, 5).map(c => c.text) ?? [],
    };
  }

  const [visibilityGuide, healthGuide, speedGuide] = await Promise.all([
    topGuideForPillar(byPillar.visibility),
    topGuideForPillar(byPillar.health),
    topGuideForPillar(byPillar.speed),
  ]);

  let domain = props.url;
  try { domain = new URL(props.url).hostname.replace(/^www\./, ""); } catch { /* fallback */ }

  return (
    <RescueDashboard
      firstName={props.firstName}
      domain={domain}
      url={props.url}
      lastScanId={props.lastScanId}
      lastScanAt={props.lastScanAt}
      speedScore={props.speedScore}
      issues={props.issues}
      redCount={props.redCount}
      yellowCount={props.yellowCount}
      guideByPillar={{
        visibility: visibilityGuide,
        health:     healthGuide,
        speed:      speedGuide,
      }}
    />
  );
}

// ─── ProDashboardWithGuides ──────────────────────────────────────────────────
// Pro/Agency-Wrapper: matchGuidesForIssues läuft server-side, das Resultat
// wird als `inclusiveGuides` an ProDashboard durchgereicht. Pro/Agency haben
// alle aktiven Guides automatisch unlocked (Flatrate-Bypass in
// lib/rescue-guides.userHasFlatrate). UI rendert eine "Inklusiv-Fixes"-
// Sektion, die für Pro genau das einlöst, was die Pricing-Card verspricht.
async function ProDashboardWithGuides(
  props: React.ComponentProps<typeof ProDashboard> & { userId: string },
) {
  const inclusiveGuides = props.lastScan && props.issues.length > 0
    ? (await matchGuidesForIssues(
        props.issues.map(i => ({
          title: i.title, body: i.body,
          category: i.category, severity: i.severity,
        })),
        props.userId,
      ))
        .slice(0, 3)
        .map(m => ({
          id:                m.guide.id,
          title:             m.guide.title,
          problem_label:     m.guide.problem_label,
          preview:           m.guide.preview,
          price_cents:       m.guide.price_cents,
          estimated_minutes: m.guide.estimated_minutes,
          unlocked:          m.unlocked,
          checklistPreview:  m.guide.content_json.checklist?.slice(0, 5).map(c => c.text) ?? [],
        }))
    : [];

  // userId aus props nicht weiterreichen — ProDashboard erwartet ihn nicht.
  const { userId: _ignored, ...rest } = props;
  void _ignored;

  return <ProDashboard {...rest} inclusiveGuides={inclusiveGuides} />;
}
