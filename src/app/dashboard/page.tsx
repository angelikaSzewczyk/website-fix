import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import FreeDashboardClient from "./free-dashboard-client";
import { isAtLeastProfessional, isAgency as isAgencyPlan, getPlanQuota } from "@/lib/plans";
import { classifyDisplayCategory } from "@/lib/issue-categories";
import { getIntegrationSettings, connectionStatus } from "@/lib/integrations";
import ModalCloseButton from "./components/ModalCloseButton";
import TeamWidget from "./components/team-widget";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — WebsiteFix",
  robots: { index: false },
};

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  divider:     "#F1F5F9",
  shadow:      "0 1px 3px rgba(0,0,0,0.06)",
  shadowMd:    "0 4px 16px rgba(0,0,0,0.08)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenDot:    "#22C55E",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberDot:    "#F59E0B",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redDot:      "#EF4444",
  yellow:      "#EAB308",
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
type CriticalSite = {
  id: string; url: string; name: string | null;
  last_check_status: string; last_check_at: string;
  ssl_days_left: number | null; security_score: number | null;
  alerts: { level: string; message: string }[] | null;
};

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

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "8px 28px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
        {/* White-label logo or stylized text fallback. Beides bekommt den
            gleichen "Live-Preview"-Tooltip beim Hover. cursor:help signalisiert,
            dass es sich um eine Hint-Quelle handelt, nicht um einen Klick-Target. */}
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
            style={{ fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap", cursor: "help" }}
          >
            {agencyName ?? "Kommandozentrale"}
          </span>
        )}
        <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
          Plan: {badge.label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 20, background: usedSlots >= clientSlotLimit ? C.redBg : C.divider, border: `1px solid ${usedSlots >= clientSlotLimit ? "#FECACA" : C.border}` }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={usedSlots >= clientSlotLimit ? C.red : C.textSub} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: usedSlots >= clientSlotLimit ? C.red : C.text, whiteSpace: "nowrap" }}>
            Slots: {usedSlots} / {slotsLabel}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        {/* White-label settings link — nutzt jetzt die Brand-CSS-Vars statt
            hartkodierter badge-Farben. Ein-Klick zur Branding-Sektion im Hub. */}
        <a
          href="/dashboard/settings#branding"
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
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql       = neon(process.env.DATABASE_URL!);
  const plan      = ((session.user as { plan?: string }).plan ?? "starter") as keyof typeof PLAN_BADGE;
  const badge     = PLAN_BADGE[plan] ?? PLAN_BADGE["starter"];
  const firstName = session.user.name?.split(" ")[0] ?? "Dashboard";
  const layout    = getLayout(plan);
  const isAgency  = layout === "agency";
  const isSingle  = layout === "single";

  const scans = await sql`
    SELECT id, url, type, created_at, issue_count
    FROM scans WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC LIMIT 20
  ` as Scan[];

  // Agency data
  let criticalSites: CriticalSite[] = [];
  let domainCount = 0; // updated after agencyClients is built
  let agencyLogoUrl: string | null = null;
  let agencyName:    string | null = null;
  if (isAgency) {
    try {
      criticalSites = await sql`
        SELECT sw.id::text, sw.url, sw.name, sw.last_check_status, sw.last_check_at,
               wc.ssl_days_left, wc.security_score, wc.alerts
        FROM saved_websites sw
        LEFT JOIN LATERAL (
          SELECT ssl_days_left, security_score, alerts FROM website_checks
          WHERE website_id = sw.id AND user_id = sw.user_id
          ORDER BY checked_at DESC LIMIT 1
        ) wc ON true
        WHERE sw.user_id = ${session.user.id}
        ORDER BY sw.last_check_at DESC NULLS LAST LIMIT 10
      ` as CriticalSite[];
      domainCount = criticalSites.length;
    } catch { /* table may not exist yet */ }

    try {
      // primary_color kommt aus dashboard/layout.tsx als CSS-Variable —
      // hier nur die Identitäts-Felder für TopBar und Body-H1.
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

  // Agency-Slots: kanonisch aus PLAN_QUOTAS (agency = 50). Lokales isAgency
  // ist bereits via getLayout(plan) korrekt für alle Legacy-Strings
  // (agency-starter, agency-pro) gesetzt — kein zweites Roh-String-Match nötig.
  const clientSlotLimit = isAgency ? getPlanQuota(plan).projects : 10;
  const slotsLabel      = String(clientSlotLimit);

  // Map real saved_websites → agency client row format. No demo fallback —
  // empty state is rendered explicitly when an agency has no analyzed sites yet.
  const AGENCY_COLORS = ["#2563EB","#16A34A","#D97706","#7C3AED","#DC2626","#0891B2","#059669","#DB2777"];
  const agencyClients = isAgency && criticalSites.length > 0
    ? criticalSites.map((site, i) => {
        const domain = (() => { try { return new URL(site.url.startsWith("http") ? site.url : `https://${site.url}`).hostname; } catch { return site.url; } })();
        const label  = site.name ?? domain;
        const initials = label.replace(/https?:\/\//, "").replace(/\./g, " ").trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "??";
        const rawStatus = site.last_check_status ?? "ok";
        const status: "ok" | "warning" | "critical" = rawStatus === "critical" || rawStatus === "error" ? "critical" : rawStatus === "warning" ? "warning" : "ok";
        const lastScanLabel = site.last_check_at
          ? new Date(site.last_check_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
          : "—";
        return { id: site.id, name: label, contact: domain, initials, color: AGENCY_COLORS[i % AGENCY_COLORS.length], domains: [domain], status, lastScan: lastScanLabel, assignee: "–", autoReport: false, clientLogin: false };
      })
    : [];

  const usedSlots = agencyClients.length;
  domainCount = agencyClients.reduce((s, c) => s + c.domains.length, 0);

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
      background: isAgency ? C.bg : "#080C14",
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
        .agency-client-row:hover { background: #F8FAFC !important; }
        /* Agency matrix responsive */
        @media (max-width: 860px) {
          .agency-matrix-head { display: none !important; }
          .agency-client-row  { grid-template-columns: 1fr 1fr !important; grid-template-rows: auto auto !important; gap: 8px !important; padding: 14px 16px !important; }
          .agency-client-row > *:nth-child(n+4) { display: none; }
        }
        /* 2-Spalten-Layout (Matrix + Team-Widget) auf engen Viewports stacken.
           Breakpoint 980px statt 860px, weil bei <1024 die rechte 320px-Spalte
           sonst die Matrix unter ~480px Breite drückt — unleserlich. */
        @media (max-width: 980px) {
          .wf-agency-grid { grid-template-columns: 1fr !important; }
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
      {!isAgency && (
        <Suspense>
          <FreeDashboardClient
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
        </Suspense>
      )}

{/* ══════════════════════════════════════════════════════════
          AGENCY LAYOUT  (plan: agency-starter | agency-pro)
          ══════════════════════════════════════════════════════════ */}
      {isAgency && (()=> {
        // Agency-Accent: dynamisch aus den CSS-Vars, die der Outer-Wrapper
        // setzt. Kein Hex mehr hartkodiert — alles flowt von brandingColor.
        // Das Default-Violet ist nur Fallback wenn der User noch keine Farbe
        // eingestellt hat (siehe AGENCY_DEFAULT_PRIMARY).
        const accent       = "var(--agency-accent)";
        const accentBg     = "var(--agency-accent-bg)";
        const accentBorder = "var(--agency-accent-border)";
        const accentGlow   = "var(--agency-accent-glow)";       // CTA-Shadow
        const accentGlowS  = "var(--agency-accent-glow-soft)";  // Bericht-Button

        const healthScore = (status: string) =>
          status === "ok" ? 88 : status === "warning" ? 61 : 34;

        const lastScanId = scans[0]?.id ?? null;

        return (
          <main style={{ padding: "28px 32px 80px" }}>

              {/* ── Header ── */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
                {/* Body-H1: Markenname statt "Kommandozentrale" wenn agency_name gesetzt.
                    Spec §3.1 — der Agentur-Inhaber sieht *seinen* Namen groß als
                    Page-Heading. Fallback bleibt unsere Default-Bezeichnung,
                    damit die Page auch ohne Branding-Setup einen Titel hat. */}
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em" }}>
                  {agencyName ?? "Kommandozentrale"}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Plan badge */}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
                    Plan: {badge.label}
                  </span>
                  {/* Slots */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: usedSlots >= clientSlotLimit ? C.redBg : C.divider, border: `1px solid ${usedSlots >= clientSlotLimit ? "#FECACA" : C.border}` }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={usedSlots >= clientSlotLimit ? C.red : C.textSub} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: usedSlots >= clientSlotLimit ? C.red : C.text, whiteSpace: "nowrap" }}>
                      Slots: {usedSlots} / {slotsLabel}
                    </span>
                  </div>
                  {/* Branding badge — Live-Preview-Hint: Tooltip zeigt dem
                      Agentur-Admin, wo das Branding noch wirkt (PDF-Reports).
                      Subtiler Upsell-Reminder für den 249€-Plan. */}
                  <span
                    title="Dieses Branding wird auch in deinen PDF-Reports für Kunden verwendet."
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, whiteSpace: "nowrap", cursor: "help" }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    White-Label aktiv
                  </span>
                  {/* CTA */}
                  <a href="#modal-new-client" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: C.yellow, color: "#0a0a0a", fontWeight: 800, fontSize: 13, textDecoration: "none", boxShadow: "0 2px 12px rgba(234,179,8,0.35)", whiteSpace: "nowrap" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    + Neuen Kunden
                  </a>
                </div>
              </div>

              {/* ── Stat Strip ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { value: agencyClients.length,                                             label: "Aktive Kunden",     color: C.blue,    icon: "👥" },
                  { value: agencyClients.reduce((s, c) => s + c.domains.length, 0),        label: "Domains gesamt",   color: C.green,   icon: "🌐" },
                  { value: agencyClients.filter(c => c.status === "critical").length,       label: "Handlungsbedarf",  color: C.red,     icon: "🔴" },
                  { value: scans.length,                                                   label: "Scans gesamt",     color: C.textSub, icon: "📊" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: C.shadow, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.025em", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 2-Spalten-Grid: Kunden-Matrix (links, breit) + Team-Widget (rechts, fix 320px).
                   Mobile (< 980px) stack vertikal — siehe .wf-agency-grid in Styles. */}
              <div className="wf-agency-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>

              {/* ── Kunden-Matrix ── */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowMd }}>

                {/* Table header */}
                <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Kunden-Matrix</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, letterSpacing: "0.04em" }}>
                      UNLIMITIERT
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{agencyClients.length} {agencyClients.length === 1 ? "Projekt" : "Projekte"}</span>
                </div>

                {/* Empty state — Agentur hat noch keine analysierten Kunden */}
                {agencyClients.length === 0 && (
                  <div style={{ padding: "56px 28px", textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: accentBg, border: `1px solid ${accentBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                      Noch keine Kunden-Websites analysiert
                    </h3>
                    <p style={{ margin: "0 auto 22px", fontSize: 13, color: C.textSub, lineHeight: 1.6, maxWidth: 420 }}>
                      Starte deinen ersten Scan, um dein Portfolio aufzubauen.
                      Jeder neue Scan landet automatisch in der Kunden-Matrix.
                    </p>
                    <a href="#modal-new-client" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 10, background: accent, color: "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none", boxShadow: `0 2px 14px ${accentGlow}`, whiteSpace: "nowrap" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Ersten Kunden anlegen
                    </a>
                  </div>
                )}

                {/* Column headers — 7 cols (only when clients exist) */}
                {agencyClients.length > 0 && (
                  <div className="agency-matrix-head" style={{ padding: "9px 22px", background: C.bg, borderBottom: `1px solid ${C.divider}`, display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 110px 68px 72px 170px", gap: 12, alignItems: "center" }}>
                    {["Kunde", "Domain", "Status", "Health", "Zuständig", "Login", "Aktion"].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                    ))}
                  </div>
                )}

                {/* Rows */}
                <div style={{ overflowX: "auto" }}>
                {agencyClients.map((client, i) => {
                  const score  = healthScore(client.status);
                  const isOk   = client.status === "ok";
                  const isCrit = client.status === "critical";
                  const statusConf = isOk
                    ? { label: "Sicher",          color: C.green, bg: C.greenBg, border: "#A7F3D0" }
                    : isCrit
                    ? { label: "Kritisch",        color: C.red,   bg: C.redBg,   border: "#FECACA" }
                    : { label: "Prüfen",          color: C.amber, bg: C.amberBg, border: "#FDE68A" };
                  const scoreColor = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
                  const detailHref = lastScanId ? `/dashboard/scans/${lastScanId}` : "/dashboard/scan";
                  const cbId = `ar-${client.id}`;

                  return (
                    <div key={client.id} className="agency-client-row" style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 110px 68px 72px 170px", gap: 12, alignItems: "center", padding: "13px 22px", borderBottom: i < agencyClients.length - 1 ? `1px solid ${C.divider}` : "none", background: "transparent" }}>

                      {/* Kunde */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${client.color}14`, border: `1px solid ${client.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: client.color }}>
                          {client.initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.contact}</div>
                        </div>
                      </div>

                      {/* Domain */}
                      <div style={{ minWidth: 0 }}>
                        {client.domains.slice(0, 2).map((d, di) => (
                          <a key={d} href={`https://${d}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: accent, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: di === 0 && client.domains.length > 1 ? 2 : 0 }}>
                            {d}
                          </a>
                        ))}
                        {client.domains.length > 2 && <span style={{ fontSize: 10, color: C.textMuted }}>+{client.domains.length - 2} weitere</span>}
                      </div>

                      {/* Status */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 20, color: statusConf.color, background: statusConf.bg, border: `1px solid ${statusConf.border}`, whiteSpace: "nowrap" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusConf.color, display: "inline-block", flexShrink: 0 }} />
                        {statusConf.label}
                      </span>

                      {/* Health-Score */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor, letterSpacing: "-0.02em", lineHeight: 1 }}>{score}</span>
                          <span style={{ fontSize: 10, color: C.textMuted }}>/100</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: scoreColor }} />
                        </div>
                      </div>

                      {/* Verantwortlich */}
                      <div title={`Zuständig: ${client.assignee}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: accentBg, border: `1px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: accent }}>
                          {client.assignee}
                        </div>
                      </div>

                      {/* Kunden-Login */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {client.clientLogin ? (
                          <span title="Kunden-Login aktiv" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </span>
                        ) : (
                          <span title="Kein Kunden-Login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: C.divider, border: `1px solid ${C.border}` }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </span>
                        )}
                      </div>

                      {/* PDF + Bericht-Button (Auto-Report-Toggle entfernt — siehe Beta-Indikator) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* Beta-Indikator: Auto-Report ist noch nicht live, kein irreführender Toggle.
                            Vorher CSS-only checkbox ohne Backend — wirkte aktiv, war Deko. */}
                        <span
                          aria-label="Auto-Report-Beta"
                          title="BETA: Automatischer Versand wird aktuell für Agency-Accounts ausgerollt."
                          style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 28, height: 28, borderRadius: 7,
                            background: C.divider,
                            border: `1px solid ${C.border}`,
                            color: C.textMuted,
                            cursor: "help",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </span>
                        {/* Reference cbId to silence unused-var TS error from removed toggle */}
                        <span style={{ display: "none" }} aria-hidden="true">{cbId}</span>
                        {/* PDF-Export: nur als <a> rendern wenn ein Scan existiert.
                            Sonst ein <span> ohne Tab-/Enter-Aktivierung (echtes Disable,
                            nicht nur pointer-events). */}
                        {lastScanId ? (
                          <a
                            href={`/api/export/pdf?scanId=${lastScanId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Als PDF exportieren"
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 30, height: 30, borderRadius: 7,
                              background: "#F0FDF4",
                              border: "1px solid #A7F3D0",
                              color: C.green,
                              textDecoration: "none",
                            }}
                          >
                            <PdfIcon />
                          </a>
                        ) : (
                          <span
                            role="img"
                            aria-label="PDF-Export verfügbar nach erstem Scan"
                            title="Noch kein Scan vorhanden"
                            style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                              width: 30, height: 30, borderRadius: 7,
                              background: C.divider,
                              border: `1px solid ${C.border}`,
                              color: C.textMuted,
                              opacity: 0.55,
                              cursor: "not-allowed",
                            }}
                          >
                            <PdfIcon />
                          </span>
                        )}
                        <Link href={detailHref} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: accent, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: `0 1px 6px ${accentGlowS}` }}>
                          Bericht →
                        </Link>
                      </div>

                    </div>
                  );
                })}
                </div>

              </div>
              {/* /Kunden-Matrix — Team-Widget rendert als rechte Spalte im
                  wf-agency-grid Container und schließt diesen unten ab. */}

              <TeamWidget />
              </div>
              {/* /wf-agency-grid */}
          </main>
        );
      })()}

      {/* ── New Client Modal (CSS :target, no JS) ── */}
      <div id="modal-new-client" className="agency-modal">
        <div style={{ background: C.card, borderRadius: 20, padding: "32px", maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative" }}>
          <ModalCloseButton ariaLabel="Modal schließen" style={{ position: "absolute", top: 16, right: 20, fontSize: 22, color: C.textMuted, lineHeight: 1 }}>×</ModalCloseButton>
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: C.blue, textTransform: "uppercase", letterSpacing: "0.08em" }}>Neues Projekt</p>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Kunden anlegen</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSub }}>Füge einen neuen Kunden zur Kunden-Matrix hinzu.</p>
          </div>
          <form action="/dashboard/scan" method="GET" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 5 }}>Kundenname</label>
              <input name="clientName" type="text" placeholder="z.B. Autohaus Müller GmbH" style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.bg, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 5 }}>Website-URL</label>
              <input name="url" type="url" placeholder="https://kunde-website.de" required style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.bg, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: C.blue, color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
                Ersten Scan starten →
              </button>
              <ModalCloseButton style={{ padding: "11px 18px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.textSub, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center" }}>
                Abbrechen
              </ModalCloseButton>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
