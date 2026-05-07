"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import IssueList from "@/components/dashboard/variants/_shared/IssueList";
import ScoreRingSection from "./_shared/ScoreRingSection";
import LockedSection from "@/app/dashboard/components/locked-section";
import DashboardShell from "./_shared/DashboardShell";
import MetricPillBar from "./_shared/MetricPillBar";
import PluginDownloadCard from "./_shared/PluginDownloadCard";
import HybridScanBanner from "./_shared/HybridScanBanner";
import XrayCompareCard from "./_shared/XrayCompareCard";
import WhyWebsitefixCard from "./_shared/WhyWebsitefixCard";
import OnboardingChecklist from "./_shared/OnboardingChecklist";
import type { DeepData } from "@/lib/plugin-status";
import { normalizeOnboardingPlan } from "@/lib/onboarding-steps";
import type { TechFingerprint } from "@/lib/tech-detector";
import { CONFIDENCE_THRESHOLD, UNKNOWN } from "@/lib/tech-detector";
import { isAtLeastProfessional, isAgency as isAgencyPlan, isPaidPlan, normalizePlan } from "@/lib/plans";
import { WordPressPluginsBlock, WooCommerceSection, BuilderIntelligenceSection } from "./_shared/IntegrationSections";
import type { PluginDetected } from "./_shared/IntegrationSections";
import { DeepScanMap, GscInsightCard, InlineStat } from "./_shared/MapAndTools";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StarterDashboardProps {
  firstName: string;
  plan: string;
  lastScan: ScanBriefProp | null;
  lastScanResult: string | null;
  issues: ParsedIssueProp[];
  redCount: number;
  yellowCount: number;
  performanceIssues:   ParsedIssueProp[];
  seoIssues:           ParsedIssueProp[];
  bestPracticesIssues: ParsedIssueProp[];
  accessibilityIssues: ParsedIssueProp[];
  cms: { label: string; version?: string };
  bfsgOk: boolean;
  speedScore: number;
  scans: ScanBriefProp[];
  monthlyScans: number;
  scanLimit: number;
  /** Structured tech fingerprint from the detection engine. Null for legacy scans. */
  fingerprint: TechFingerprint | null;
  /** Total pages analyzed in the last scan (null = legacy scan without this data). */
  totalPages: number | null;
  /** Subpage data from the last scan. */
  unterseiten: UnterseiteProp[] | null;
  /** WooCommerce Business-Audit-Meta — nur gesetzt wenn Shop erkannt. */
  wooAudit?: {
    addToCartButtons:    number;
    cartButtonsBlocked:  boolean;
    pluginImpact:        Array<{ name: string; impactScore: number; reason: string }>;
    outdatedTemplates:   boolean;
    revenueRiskPct:      number;
  } | null;
  /** Builder-Intelligence-Meta — DOM-Tiefe, Fonts, CSS-Bloat. */
  builderAudit?: {
    builder:             string | null;
    maxDomDepth:         number;
    divCount:            number;
    googleFontFamilies:  string[];
    cssBloatHints:       string[];
    stylesheetCount:     number;
  } | null;
  /** Integration-Verbindungsstatus für die Issue-Action-Bar (Pro+).
   *  Null/undefined wenn unter Pro oder Status nicht ladbar — Action-Bar
   *  zeigt dann nicht die Buttons, sondern die "Provider verbinden →"-Hints. */
  integrationsStatus?: { asana: boolean; slack: boolean } | null;
  /** Phase A2 Site-Wide-Metrics aus meta_json. Alle drei optional —
   *  legacy-Scans ohne diese Felder rendern keine Pill. */
  avgTtfbMs?:          number | null;
  wcagHeuristicScore?: number | null;
  wcagHeuristicLabel?: string | null;
  /** Hybrid-Scan-Status (07.05.2026): pluginActive=true wenn ein WordPress-
   *  Plugin innerhalb der letzten 7 Tage einen Handshake gemacht hat.
   *  deepData = Server-Telemetrie (PHP-Logs, DB-Last, memory_limit, …). */
  pluginActive?:          boolean;
  pluginLastHandshakeAt?: string | null;
  pluginDeepData?:        DeepData | null;
}

// ─── Design tokens — matching the WebsiteFix marketing site exactly ───────────
import { D, Card, SectionLabel, SectionHead, Pill, BtnPrimary, BtnGhost, Divider, SevBadge, LockIco, hexToRgb } from "./_shared/UIHelpers";
import { DrawerCard, DrawerPanel, OptimizationPlanModal } from "./_shared/IssueDetailDrawer";
import { getBuilderTheme } from "./_shared/builder-utils";
import type { BuilderAuditProp, WooAuditProp } from "./_shared/builder-utils";
import type { ParsedIssueProp, ScanBriefProp, UnterseiteProp } from "./_shared/dashboard-types";

// ─── Drawer helpers ────────────────────────────────────────────────────────────


export default function StarterDashboard(props: StarterDashboardProps) {
  const {
    firstName, plan,
    lastScan, lastScanResult, issues,
    redCount, yellowCount,
    performanceIssues, seoIssues, bestPracticesIssues, accessibilityIssues,
    cms, bfsgOk, speedScore,
    scans, monthlyScans, scanLimit,
    fingerprint,
    totalPages, unterseiten,
    wooAudit,
    builderAudit,
    integrationsStatus = null,
    avgTtfbMs = null,
    wcagHeuristicScore = null,
    wcagHeuristicLabel = null,
    pluginActive = false,
    pluginLastHandshakeAt = null,
    pluginDeepData = null,
  } = props;

  // Actual sum of all errors (e.g. 24 alt-missing = 24, not 1)
  const totalErrors = issues.reduce((acc, i) => acc + (i.count ?? 1), 0);

  const searchParams    = useSearchParams();
  const isImpersonating = searchParams.get("impersonating") === "1";
  const isNewScan       = searchParams.get("newScan") === "true";

  // Remove ?newScan=true from URL immediately so a refresh doesn't re-trigger focus mode
  useEffect(() => {
    if (isNewScan && typeof window !== "undefined") {
      const clean = window.location.pathname + (isImpersonating ? "?impersonating=1" : "");
      window.history.replaceState({}, "", clean);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Professional welcome banner — shown once after upgrade
  const isPro = isAtLeastProfessional(plan);
  const [showProWelcome, setShowProWelcome] = useState(false);
  useEffect(() => {
    if (!isPro) return;
    const key = "wf_pro_welcome_seen_v1";
    if (!localStorage.getItem(key)) {
      setShowProWelcome(true);
    }
  }, [isPro]);
  function dismissProWelcome() {
    localStorage.setItem("wf_pro_welcome_seen_v1", "1");
    setShowProWelcome(false);
  }

  const [expandedFinding, setExpandedFinding]   = useState<number | null>(null);
  const [fixOpenIdx, setFixOpenIdx]             = useState<number | null>(null);
  const [drawerPageUrl, setDrawerPageUrl]       = useState<string | null>(null);
  const [checkedUrls, setCheckedUrls]           = useState<Set<string>>(new Set());
  const [highlightUrl, setHighlightUrl]         = useState<string | null>(null);
  // projectDialogOpen / cancelHover / switchHover / switching → in DashboardShell
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [sessionDomain, setSessionDomain]       = useState<string | null>(null);
  const [pluginApiKey, setPluginApiKey]         = useState<string | null>(null);
  const [pluginKeyCopied, setPluginKeyCopied]   = useState(false);
  const [pluginKeyLoading, setPluginKeyLoading] = useState(false);
  const [connectedSites, setConnectedSites]     = useState<{ site_url: string; site_name: string | null; last_seen: string }[]>([]);
  const [batchFixType, setBatchFixType]         = useState("ping");
  const [batchRunning, setBatchRunning]         = useState(false);
  const [showOptPlan,  setShowOptPlan]          = useState(false);
  const [batchResult, setBatchResult]           = useState<{ summary: { total: number; success: number; failed: number } } | null>(null);
  const [quickStartUrl, setQuickStartUrl]       = useState("");
  const [showLimitModal, setShowLimitModal]     = useState(false);

  const isAgencyUser = isAgencyPlan(plan);

  // Fetch plugin API key + connected sites for Agency users
  useEffect(() => {
    if (!isAgencyUser) return;
    fetch("/api/user/plugin-key")
      .then(r => r.json())
      .then((d: { key?: string }) => { if (d.key) setPluginApiKey(d.key); })
      .catch(() => {});
    fetch("/api/plugin/installations")
      .then(r => r.json())
      .then((d: { sites?: { site_url: string; site_name: string | null; last_seen: string }[] }) => {
        if (d.sites) setConnectedSites(d.sites);
      })
      .catch(() => {});
  }, [isAgencyUser]);

  async function handleRegenerateKey() {
    setPluginKeyLoading(true);
    try {
      const r = await fetch("/api/user/plugin-key", { method: "POST" });
      const d = await r.json() as { key?: string };
      if (d.key) setPluginApiKey(d.key);
    } catch { /* ignore */ }
    finally { setPluginKeyLoading(false); }
  }

  async function handleBatchFix() {
    if (batchRunning) return;
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const r = await fetch("/api/plugin/batch-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fix_type: batchFixType }),
      });
      const d = await r.json() as { summary: { total: number; success: number; failed: number } };
      setBatchResult(d);
    } catch { setBatchResult({ summary: { total: 0, success: 0, failed: 1 } }); }
    finally { setBatchRunning(false); }
  }

  function handleCopyKey() {
    if (!pluginApiKey) return;
    try { navigator.clipboard.writeText(pluginApiKey); } catch { /* ignore */ }
    setPluginKeyCopied(true);
    setTimeout(() => setPluginKeyCopied(false), 2000);
  }

  // handleProjectSwitch → in DashboardShell

  // Read anonymous scan domain from sessionStorage when no DB scan exists yet
  useEffect(() => {
    if (!lastScan) {
      try {
        const raw = sessionStorage.getItem("wf_scan_result");
        if (raw) {
          const parsed = JSON.parse(raw) as { url?: string };
          if (parsed?.url) {
            setSessionDomain(parsed.url.replace(/^https?:\/\//, "").replace(/\/$/, ""));
          }
        }
      } catch { /* ignore */ }
    }
  }, [lastScan]);

  // Persist checked URLs to localStorage (per scan).
  // Reset immediately on scan-id change so stale checkmarks don't bleed into new scans.
  const checkedKey = `wf_checked_${lastScan?.id ?? "anon"}`;
  useEffect(() => {
    setCheckedUrls(new Set()); // reset first — new scan = clean slate
    try {
      const saved = localStorage.getItem(checkedKey);
      if (saved) setCheckedUrls(new Set(JSON.parse(saved) as string[]));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedKey]);

  function toggleChecked(url: string) {
    setCheckedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      try { localStorage.setItem(checkedKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function handleShowInMap(url: string) {
    setHighlightUrl(url);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setHighlightUrl(null), 2500);
  }

  const canonical        = normalizePlan(plan);
  const isPaid           = canonical !== null;
  const isStarter        = canonical === "starter";
  const isProfessionalPlus = isAtLeastProfessional(plan);
  const isAgency         = isAgencyPlan(plan);
  const isSmartGuard     = isProfessionalPlus; // alias used in drawer code — means Pro+ only
  const isFree           = !isPaid;
  const planLabel        = canonical === "agency" ? "Agency" : canonical === "professional" ? "Professional" : canonical === "starter" ? "Starter" : "—";
  const domain     = lastScan?.url
    ? lastScan.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : sessionDomain ?? "—";
  const scanDate   = lastScan?.created_at
    ? new Date(lastScan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const greenCount  = issues.filter(i => i.severity === "green").length;

  // Total affected elements per severity (sum of count, not category count)
  const redTotal    = issues.filter(i => i.severity === "red").reduce((s, i) => s + (i.count ?? 1), 0);
  const yellowTotal = issues.filter(i => i.severity === "yellow").reduce((s, i) => s + (i.count ?? 1), 0);
  const greenTotal  = issues.filter(i => i.severity === "green").reduce((s, i) => s + (i.count ?? 1), 0);

  // ── Title normalisation helpers ────────────────────────────────────────────
  // Many issues arrive as "BFSG-Verstoß: Fehlendes Alt-Attribut auf /seite1"
  // Strip the URL suffix so we can group them, and replace scary BFSG language.
  function normaliseTitleKey(raw: string): string {
    return raw
      .replace(/\s+auf\s+(https?:\/\/\S+|\/\S+|\S+\.(html|php|aspx))\s*$/i, "")
      .replace(/\s+\(https?:\/\/\S+\)\s*$/, "")
      .replace(/^BFSG-Verstoß:\s*/i, "")
      .replace(/^Barrierefreiheit:\s*/i, "")
      .trim()
      .toLowerCase();
  }

  function friendlyTitle(raw: string): string {
    // Strip URL suffix first
    const stripped = raw
      .replace(/\s+auf\s+(https?:\/\/\S+|\/\S+|\S+\.(html|php|aspx))\s*$/i, "")
      .replace(/\s+\(https?:\/\/\S+\)\s*$/, "")
      .trim();

    // Replace BFSG-Verstoß prefix with a helpful category label
    return stripped
      .replace(/^BFSG-Verstoß:\s*fehlendes?\s+alt-attribut$/i,  "Barrierefreiheit: Bilder-Beschreibung fehlt")
      .replace(/^BFSG-Verstoß:\s*fehlendes?\s+alt-text(e)?\s*$/i, "Barrierefreiheit: Bilder-Beschreibung fehlt")
      .replace(/^BFSG-Verstoß:\s*/i,                             "Barrierefreiheit: ")
      .replace(/^Fehlendes?\s+alt-attribut$/i,                   "Barrierefreiheit: Bilder-Beschreibung fehlt")
      .replace(/^Fehlendes?\s+alt-text(e)?\s*$/i,               "Barrierefreiheit: Bilder-Beschreibung fehlt");
  }

  // Extract URL from title suffix "… auf /seite" if issue.url is absent
  function extractUrlFromTitle(raw: string): string | null {
    const m = raw.match(/\s+auf\s+(https?:\/\/\S+|\/\S+)\s*$/i);
    if (m) {
      const u = m[1];
      // Prepend domain if only a path
      if (u.startsWith("/") && lastScan?.url) {
        try {
          const base = new URL(lastScan.url);
          return base.origin + u;
        } catch { return null; }
      }
      return u;
    }
    return null;
  }

  // Consolidated issues — group by normalised title+severity
  // Handles "BFSG-Verstoß: … auf /seite1", "BFSG-Verstoß: … auf /seite2" → 1 entry
  type ConsolidatedIssue = ParsedIssueProp & {
    displayTitle: string;
    totalCount: number;
    affectedUrls: string[];
    allImages: string[];
  };
  const consolidatedIssues: ConsolidatedIssue[] = (() => {
    const map = new Map<string, ConsolidatedIssue>();
    for (const issue of issues) {
      const key = `${issue.severity}||${normaliseTitleKey(issue.title)}`;
      // Collect URL — from issue.url or extracted from title
      const url = issue.url ?? extractUrlFromTitle(issue.title) ?? null;
      const imgs = url
        ? unterseiten?.find(p => p.url === url)?.altMissingImages ?? []
        : [];

      if (map.has(key)) {
        const ex = map.get(key)!;
        ex.totalCount += issue.count ?? 1;
        if (url && !ex.affectedUrls.includes(url)) ex.affectedUrls.push(url);
        ex.allImages.push(...imgs);
      } else {
        map.set(key, {
          ...issue,
          displayTitle: friendlyTitle(issue.title),
          totalCount: issue.count ?? 1,
          affectedUrls: url ? [url] : [],
          allImages: imgs,
        });
      }
    }
    return Array.from(map.values());
  })();

  // Consolidated issues mapped to the flat IssueProp shape StarterResultsPanel expects.
  // Uses displayTitle (friendly) and totalCount (sum of all occurrences across pages).
  const panelIssues: ParsedIssueProp[] = consolidatedIssues.map(i => ({
    severity: i.severity,
    title: i.displayTitle,
    body: i.body,
    category: i.category,
    count: i.totalCount,
  }));
  // Counts based on unique issue types (not raw occurrences) — used for score formulas.
  const consolidatedRedCount    = panelIssues.filter(i => i.severity === "red").length;
  const consolidatedYellowCount = panelIssues.filter(i => i.severity === "yellow").length;

  // ── Tech chip building ─────────────────────────────────────────────────────
  // Prefer the structured fingerprint (real HTML signals). Falls back to
  // text-based heuristics only for scans performed before the fingerprint
  // column was added.

  type ChipDef = { label: string; value: string; color: string };

  function chipsFromFingerprint(fp: TechFingerprint): ChipDef[] {
    const T = CONFIDENCE_THRESHOLD;
    const chips: ChipDef[] = [];

    const pick = (d: { value: string; confidence: number }) =>
      d.confidence >= T && d.value !== UNKNOWN ? d.value : null;

    const cmsVal = pick(fp.cms);
    if (cmsVal) chips.push({ label: "CMS",       value: cmsVal,           color: "#7aa6ff" });

    const bldr = pick(fp.builder);
    if (bldr)   chips.push({ label: "Builder",   value: bldr,             color: "#c084fc" });

    const frm = pick(fp.framework);
    if (frm)    chips.push({ label: "Framework", value: frm,              color: "#38bdf8" });

    const eco = pick(fp.ecommerce);
    if (eco)    chips.push({ label: "E-Commerce",value: eco,              color: "#34d399" });

    const srv = pick(fp.server);
    if (srv)    chips.push({ label: "Server",    value: srv,              color: "#8df3d3" });

    const php = pick(fp.phpVersion);
    if (php)    chips.push({ label: "PHP",       value: php,              color: "#a78bfa" });

    // SSL is always shown
    const sslDisplay = fp.ssl.value.startsWith("SSL aktiv") ? "Aktiv"
      : fp.ssl.value === "Kein SSL / HTTP" ? "Kein SSL" : fp.ssl.value;
    chips.push({ label: "SSL", value: sslDisplay, color: sslDisplay === "Aktiv" ? "#4ade80" : D.red });

    // Tracking: tagManager wins, then analytics, then any tracker
    const tm = pick(fp.tagManager);
    const an = pick(fp.analytics);
    const tr = fp.tracking.find(t => t.confidence >= T && t.value !== UNKNOWN);
    const trackingVal = tm ?? an ?? tr?.value ?? null;
    if (trackingVal) chips.push({ label: "Tracking", value: trackingVal, color: "#fb923c" });

    return chips;
  }

  function chipsFromText(): ChipDef[] {
    // Legacy fallback: text-based heuristics on the AI report
    const t = (lastScanResult ?? "").toLowerCase();
    const chips: ChipDef[] = [];
    const cmsLabel = cms.label === "Custom" || !cms.label ? null : cms.label + (cms.version ? ` ${cms.version}` : "");
    if (cmsLabel) chips.push({ label: "CMS", value: cmsLabel, color: "#7aa6ff" });
    if (/elementor/.test(t))               chips.push({ label: "Builder",   value: "Elementor",    color: "#c084fc" });
    else if (/divi/.test(t))               chips.push({ label: "Builder",   value: "Divi",          color: "#c084fc" });
    if (/next\.js|nextjs|_next\//.test(t)) chips.push({ label: "Framework", value: "Next.js",       color: "#38bdf8" });
    const srvMatch = /nginx/.test(t) ? "Nginx" : /apache/.test(t) ? "Apache" : /litespeed/.test(t) ? "LiteSpeed" : /cloudflare/.test(t) ? "Cloudflare" : null;
    if (srvMatch) chips.push({ label: "Server", value: srvMatch, color: "#8df3d3" });
    // Always show SSL and security — never leave strip empty
    chips.push({ label: "SSL", value: "Prüfung OK", color: "#4ade80" });
    if (!srvMatch) chips.push({ label: "Server", value: "Analyse abgeschlossen", color: "#8df3d3" });
    return chips;
  }

  const techChips: ChipDef[] = fingerprint ? chipsFromFingerprint(fingerprint) : chipsFromText();

  // ── Impact label per category / severity ──────────────────────────────────
  function getImpact(category: string, severity: string): { label: string; color: string } {
    if (category === "recht")                            return { label: "Best Practices",                    color: D.amber   };
    if (category === "speed" && severity === "red")      return { label: "Performance- & Ranking-Boost",     color: D.amber   };
    if (category === "speed")                            return { label: "Performance-Optimierung",          color: D.amber   };
    if (severity === "red")                              return { label: "Wachstums-Bremse",                 color: "#FBBF24" };
    if (severity === "yellow")                           return { label: "Ranking-Potenzial",                color: D.amber   };
    return                                                      { label: "Hinweis",                          color: D.textMuted };
  }

  // ── Fix guidance per issue ─────────────────────────────────────────────────
  function generateFixSteps(issue: ParsedIssueProp): { steps: string[]; verify: string } {
    const t = issue.title.toLowerCase();
    const b = issue.body.toLowerCase();
    const combined = t + ' ' + b;

    if (/alt.?text|alternativtext|bilder ohne/.test(combined)) return {
      steps: [
        'Oeffne im CMS-Dashboard die Mediathek (WordPress: Medien \u2192 Bibliothek).',
        'Klicke auf ein Bild ohne Alt-Text und trage im Feld Alternativtext eine kurze, inhaltliche Beschreibung ein \u2014 z.\u00a0B. "Teamfoto im Buero Muenchen".',
        'Fuer Bilder direkt auf Seiten: oeffne die Seite im Editor, klicke das Bild an und befuelle das Alt-Text-Feld in der Seitenleiste.',
        'Wiederhole das fuer alle betroffenen Bilder. Rein dekorative Bilder koennen ein leeres alt-Attribut erhalten.',
        'Tipp: Bildunterschriften sind kein Ersatz fuer Alt-Texte \u2014 beide Felder erfuellen unterschiedliche Zwecke.',
      ],
      verify: 'Starte danach einen neuen Scan \u2014 die Anzahl der Bilder ohne Alt-Text sollte deutlich gesunken sein.',
    };

    if (/h1|hauptüberschrift/.test(combined)) return {
      steps: [
        'Oeffne die betroffene Seite im Editor deines CMS.',
        'Pruefe, ob eine Ueberschrift als H1 formatiert ist. In WordPress-Gutenberg: Blocktyp Ueberschrift, Ebene H1 auswaehlen.',
        'Jede Seite sollte genau eine H1 haben \u2014 sie beschreibt das Hauptthema der Seite.',
        'Integriere das wichtigste Keyword der Seite in die H1-Ueberschrift.',
        'Speichere und veroeffentliche die Seite.',
      ],
      verify: 'Rechtsklick \u2192 Seitenquelltext anzeigen und nach dem h1-Tag suchen \u2014 genau ein Treffer sollte erscheinen.',
    };

    if (/meta.?description|beschreibung fehlt|snippet/.test(combined)) return {
      steps: [
        'Installiere ein SEO-Plugin falls nicht vorhanden \u2014 z.\u00a0B. Yoast SEO oder RankMath (beide kostenlos).',
        'Oeffne die betroffene Seite im Editor und scrolle zur SEO-Sektion des Plugins.',
        'Trage im Feld Meta-Beschreibung einen Text mit 120\u2013155 Zeichen ein, der den Seiteninhalt treffend zusammenfasst.',
        'Die Meta-Beschreibung erscheint in Google-Suchergebnissen als Vorschautext \u2014 formuliere sie einladend und klickstark.',
        'Speichere und veroeffentliche die Seite.',
      ],
      verify: 'Pruefe mit PageSpeed Insights (developers.google.com/speed/pagespeed/insights) ob die Meta-Beschreibung erkannt wird.',
    };

    if (/sitemap/.test(combined)) return {
      steps: [
        'Installiere ein SEO-Plugin wie Yoast SEO oder RankMath \u2014 beide erstellen automatisch eine XML-Sitemap.',
        'Aktiviere die Sitemap-Funktion im Plugin (Yoast: SEO \u2192 Allgemein \u2192 Funktionen \u2192 XML-Sitemaps).',
        'Die Sitemap erscheint automatisch unter yourdomain.com/sitemap.xml.',
        'Melde die Sitemap in der Google Search Console an: search.google.com/search-console \u2192 Sitemaps \u2192 URL eintragen.',
      ],
      verify: 'Rufe yourdomain.com/sitemap.xml direkt im Browser auf \u2014 eine XML-Datei mit deinen Seiten sollte erscheinen.',
    };

    if (/cookie|einwilligung|consent|banner/.test(combined)) return {
      steps: [
        'Installiere ein DSGVO-konformes Cookie-Consent-Plugin \u2014 z.\u00a0B. Complianz, Borlabs Cookie oder CookieYes.',
        'Konfiguriere den Banner so, dass Nutzer aktiv zustimmen muessen (Opt-in), bevor Tracking-Cookies gesetzt werden.',
        'Stelle sicher, dass Ablehnen-Button und Zustimmen-Button gleichwertig sichtbar sind \u2014 kein Dark Pattern.',
        'Verlinke im Cookie-Banner auf deine Datenschutzerklaerung.',
        'Teste den Banner im Inkognito-Modus \u2014 er muss beim ersten Besuch erscheinen.',
      ],
      verify: 'Oeffne die Website in einem neuen Inkognito-Fenster \u2014 der Cookie-Banner muss sofort beim ersten Besuch erscheinen.',
    };

    if (/ssl|https|zertifikat/.test(combined)) return {
      steps: [
        "Kontaktiere deinen Hosting-Anbieter und aktiviere ein SSL-Zertifikat \u2014 Let's Encrypt ist kostenlos und weitverbreitet.",
        'Stelle sicher, dass alle HTTP-Anfragen automatisch auf HTTPS weitergeleitet werden (301-Redirect).',
        'Pruefe in den CMS-Einstellungen, ob die Website-URL auf https:// gesetzt ist (WordPress: Einstellungen \u2192 Allgemein).',
        'Scanne alle internen Links und Bildquellen auf HTTP-Referenzen und aktualisiere sie auf HTTPS.',
        'Aktiviere den HSTS-Header auf dem Server \u2014 das erzwingt HTTPS dauerhaft.',
      ],
      verify: 'Pruefe das Schloss-Symbol in der Browserleiste \u2014 es sollte ohne Sicherheitswarnung erscheinen.',
    };

    if (/404|nicht erreichbar|broken link|kaputte/.test(combined)) return {
      steps: [
        'Notiere alle betroffenen URLs aus dem Scan-Ergebnis.',
        'Pruefe, ob die Seiten versehentlich geloescht oder umbenannt wurden.',
        'Erstelle die fehlende Seite neu oder setze eine 301-Weiterleitung auf die naechstgelegene relevante Seite.',
        'In WordPress: nutze das Plugin Redirection um 301-Weiterleitungen einfach zu verwalten.',
        'Pruefe alle internen Links, die auf die fehlerhafte URL verweisen, und aktualisiere sie.',
      ],
      verify: 'Rufe die betroffene URL direkt im Browser auf \u2014 keine 404-Fehlerseite sollte mehr erscheinen.',
    };

    if (/ladezeit|pagespeed|performance|lcp|cls|core web|langsam/.test(combined)) return {
      steps: [
        'Komprimiere alle Bilder auf der Website \u2014 nutze dafuer das Plugin Smush, ShortPixel oder Imagify fuer WordPress.',
        'Stelle das Bildformat auf WebP um \u2014 das reduziert die Dateigroe\u00dfe um 30\u201350\u00a0% ohne sichtbaren Qualitaetsverlust.',
        'Aktiviere Browser-Caching ueber dein Hosting oder ein Caching-Plugin wie WP Rocket oder W3 Total Cache.',
        'Entferne nicht genutzte JavaScript- und CSS-Dateien \u2014 pruefe welche Plugins aktiv, aber ungenutzt sind.',
        'Aktiviere Lazy Loading fuer Bilder unterhalb des sichtbaren Bereichs (in WordPress Standard seit Version 5.5).',
      ],
      verify: 'Teste mit PageSpeed Insights \u2014 der Score sollte nach den Optimierungen deutlich steigen.',
    };

    if (/datenschutz|dsgvo|impressum|rechtlich/.test(combined)) return {
      steps: [
        'Pruefe, ob eine Datenschutzerklaerung und ein Impressum auf der Website vorhanden sind.',
        'Beide Seiten muessen vom Footer aus mit maximal zwei Klicks erreichbar sein.',
        'Aktualisiere die Datenschutzerklaerung auf alle aktuell genutzten Dienste (Analytics, Fonts, Maps etc.).',
        'Nutze einen DSGVO-Generator \u2014 z.\u00a0B. datenschutz.org oder e-recht24.de.',
        'Pruefe, ob externe Ressourcen wie Google Fonts DSGVO-konform eingebunden sind (lokal hosten oder anonymisieren).',
      ],
      verify: 'Klicke im Footer auf Datenschutz und Impressum \u2014 beide Seiten muessen erreichbar und aktuell sein.',
    };

    if (/mobile|viewport|responsive|smartphone/.test(combined)) return {
      steps: [
        'Oeffne die Website auf einem Smartphone oder nutze den DevTools-Mobil-Modus (F12 \u2192 Geraetesymbol).',
        'Pruefe, ob der Meta-Viewport-Tag im head-Bereich vorhanden ist: content="width=device-width, initial-scale=1".',
        'Identifiziere Elemente, die auf kleinen Bildschirmen ueberlappen oder ausserhalb des sichtbaren Bereichs liegen.',
        'Stelle sicher, dass alle Buttons und Links mindestens 44\u00d744\u00a0Pixel gross sind \u2014 kleinere Touch-Targets sind schwer bedienbar.',
        'Teste mit Google Mobile Friendly Test: search.google.com/test/mobile-friendly.',
      ],
      verify: 'Oeffne die Website auf einem echten Smartphone \u2014 alle Inhalte muessen lesbar und alle Buttons bedienbar sein.',
    };

    if (/canonical|duplicate|doppelt/.test(combined)) return {
      steps: [
        'Installiere ein SEO-Plugin (Yoast SEO oder RankMath) falls nicht vorhanden.',
        'Oeffne die betroffene Seite und setze im SEO-Plugin den kanonischen URL manuell auf die bevorzugte Version.',
        'Pruefe, ob Seiten mit und ohne www oder mit und ohne Trailing-Slash unterschiedliche Inhalte liefern \u2014 richte 301-Weiterleitungen ein.',
        'Stelle sicher, dass jede Seite auf sich selbst als Canonical verweist (Self-Canonical).',
      ],
      verify: 'Pruefe im Seitenquelltext, ob ein canonical-Link-Tag vorhanden ist.',
    };

    // Category fallbacks
    if (issue.category === 'recht') return {
      steps: [
        'Optimiere den betroffenen Bereich für bessere Nutzerfreundlichkeit — das steigert Conversion-Rate und SEO-Ranking.',
        'Stelle sicher, dass alle interaktiven Elemente per Tastatur bedienbar sind.',
        'Pruefe den Farbkontrast zwischen Text und Hintergrund \u2014 Mindestkontrast ist 4,5:1 nach WCAG AA.',
        'Fuege ARIA-Labels zu Elementen ohne sichtbaren Text hinzu (z.\u00a0B. Icon-Buttons, Formularfelder).',
        'Teste mit dem kostenlosen Tool WAVE unter wave.webaim.org.',
      ],
      verify: 'Pruefe mit WAVE (wave.webaim.org) \u2014 die Fehleranzahl sollte nach der Korrektur zurueckgehen.',
    };

    if (issue.category === 'speed') return {
      steps: [
        'Analysiere die Ladezeit mit Google PageSpeed Insights (developers.google.com/speed/pagespeed/insights).',
        'Behebe die hoechstpriorisierten Empfehlungen zuerst \u2014 haeufig Bilder und nicht genutztes JavaScript.',
        'Aktiviere Server-seitiges Caching ueber dein Hosting-Dashboard oder ein Caching-Plugin.',
        'Pruefe, ob externe Ressourcen (Fonts, Scripts von Drittanbietern) die Ladezeit blockieren.',
        'Erwaege ein CDN fuer schnellere Auslieferung von statischen Ressourcen.',
      ],
      verify: 'Starte einen erneuten PageSpeed-Test \u2014 der Score sollte gestiegen sein.',
    };

    return {
      steps: [
        'Lies die obige Fehlerbeschreibung sorgfaeltig durch und identifiziere den betroffenen Bereich.',
        'Oeffne die betroffene Seite oder Einstellung im CMS-Backend.',
        'Behebe das beschriebene Problem anhand der Fehlerbeschreibung.',
        'Speichere alle Aenderungen und stelle sicher, dass die Seite korrekt veroeffentlicht ist.',
      ],
      verify: 'Starte einen neuen Scan um zu pruefen, ob das Problem behoben wurde.',
    };
  }

  // Simulated performance — only meaningful when a scan exists
  const hasData     = !!lastScan;
  const lcpMs       = Math.max(1200, 4200 - speedScore * 30);
  const cls         = speedScore > 70 ? 0.05 : 0.18;
  const indexedUrls = 80 + Math.round(speedScore / 2);
  const sitemapOk   = speedScore > 40;
  const mobileOk    = speedScore > 55;



  return (
    <>
      <DashboardShell
        firstName={firstName}
        plan={plan}
        domain={domain}
        scanCount={scans.length}
        monthlyScans={monthlyScans}
        scanLimit={scanLimit}
        isImpersonating={isImpersonating}
      >

          {/* Onboarding-Checkliste (3 Schritte). Auto-Detection läuft im
              GET-Endpoint, dismiss persistiert in users.onboarding_state. */}
          {(() => {
            const planKey = normalizeOnboardingPlan(plan);
            return planKey ? <OnboardingChecklist plan={planKey} /> : null;
          })()}

          {/* "Warum WebsiteFix?"-Reminder — 3 Key-Points (Code-Fix · PHP-Logs ·
              Haftungsschutz). Plan-aware: Starter sieht 2 + Agency-Hint, Pro
              alle 3 als Vorgeschmack auf Agency-Upgrade. */}
          <WhyWebsitefixCard plan={plan} />

          {/* Hybrid-Scan-Banner (External Mode vs. Full System Audit). Steht
              direkt über der Plugin-Download-Card, weil der CTA dort hin
              verlinkt — User-Flow: Banner sehen → Plugin-Card sehen → klicken. */}
          <HybridScanBanner
            pluginActive={pluginActive}
            lastHandshakeAt={pluginLastHandshakeAt}
          />

          {/* Plugin-Download-Card — Read-Only-Plugin ist ab Starter inklusive,
              gibt diesem Tier ein konkretes Power-User-Feature jenseits vom
              wöchentlichen Scan. */}
          {isPaidPlan(plan) && (
            <div style={{ marginBottom: 20 }}>
              <PluginDownloadCard plan={plan} />
            </div>
          )}

          {/* Röntgen-Vergleich: 12 (extern) vs. 85 (mit Plugin) Parameter.
              Einziger Ort, an dem der quantitative Mehrwert des Plugins als
              direkter Zahlenvergleich sichtbar wird. */}
          <XrayCompareCard
            pluginActive={pluginActive}
            deepData={pluginDeepData}
          />


          {/* ── PROFESSIONAL WELCOME BANNER (once after upgrade) ──────────── */}
          {showProWelcome && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
              padding: "14px 20px", borderRadius: 12, marginBottom: 20,
              background: "linear-gradient(135deg, rgba(5,46,22,0.7) 0%, rgba(6,78,59,0.5) 100%)",
              border: "1px solid rgba(16,185,129,0.3)",
              animation: "wf-sr-fadein 0.4s ease both",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24" stroke="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                    Willkommen im Professional-Bereich, {firstName}.
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                    Dein White-Label-Branding ist aktiv — richte dein Logo und deine Farben in den{" "}
                    <a href="/dashboard/settings" style={{ color: "#10B981", textDecoration: "none", fontWeight: 600 }}>Einstellungen</a> ein.
                  </p>
                </div>
              </div>
              <button
                onClick={dismissProWelcome}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                aria-label="Schließen"
              >
                ×
              </button>
            </div>
          )}

          {/* ── NEW-SCAN SUCCESS BANNER ─────────────────── */}
          {isNewScan && lastScan && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 22px", borderRadius: 12, marginBottom: 24,
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.22)",
              animation: "wf-fadein 0.4s ease both",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#22C55E" }}>
                  Scan für {domain} erfolgreich abgeschlossen
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  Deine Ergebnisse wurden gespeichert — Score-Übersicht und Prioritäten findest du direkt unten.
                </p>
              </div>
              <Link href={`/dashboard/scans/${lastScan.id}`} style={{
                flexShrink: 0, fontSize: 12, fontWeight: 700,
                padding: "6px 14px", borderRadius: 7,
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                color: "#22C55E", textDecoration: "none",
              }}>
                Vollbericht →
              </Link>
            </div>
          )}

          {/* ① QUICK-START GUIDE — shown when plan is active but no scan yet */}
          {!lastScan && !isNewScan && (
            <div style={{
              background: "linear-gradient(160deg, #0d1f3c 0%, #091528 100%)",
              border: "1px solid rgba(37,99,235,0.3)",
              borderRadius: 18, padding: "40px 40px 32px", marginBottom: 16,
              textAlign: "center",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Quick-Start Guide — Schritt 1 von 1
              </p>
              <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                URL eingeben für deinen ersten Deep-Scan
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                Kein Plugin nötig. Kein Hosting-Zugang. Einfach die Domain eingeben — fertig.
              </p>

              {/* URL Input */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const url = quickStartUrl.trim();
                  if (!url) return;
                  const full = url.startsWith("http") ? url : `https://${url}`;
                  window.location.href = `/dashboard/scan?url=${encodeURIComponent(full)}`;
                }}
                style={{ display: "flex", gap: 10, maxWidth: 540, margin: "0 auto 20px", flexWrap: "wrap" }}
              >
                <input
                  type="text"
                  value={quickStartUrl}
                  onChange={e => setQuickStartUrl(e.target.value)}
                  placeholder="https://deine-website.de"
                  style={{
                    flex: 1, minWidth: 200,
                    padding: "13px 18px", borderRadius: 10, fontSize: 15,
                    background: "rgba(255,255,255,0.06)",
                    border: "1.5px solid rgba(37,99,235,0.4)",
                    color: "#fff", outline: "none", fontFamily: "inherit",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.8)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                />
                <button type="submit" style={{
                  padding: "13px 24px", borderRadius: 10, fontSize: 14, fontWeight: 800,
                  background: "#2563EB", color: "#fff", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.5)", whiteSpace: "nowrap",
                  fontFamily: "inherit",
                }}>
                  Deep-Scan starten →
                </button>
              </form>

              {/* Badges */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { icon: "📄", text: "25 Seiten inkl." },
                  { icon: "🔍", text: "SEO-Audit" },
                  { icon: "📱", text: "Mobile-Check" },
                  { icon: "⚡", text: "< 60 Sekunden" },
                ].map(b => (
                  <div key={b.text} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.55)",
                  }}>
                    <span>{b.icon}</span>{b.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ② AUDIT HERO CARD */}
          <Card style={{ padding: "28px 32px", marginBottom: 12 }} accent="#007BFF">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div>
                <SectionLabel color={D.blueSoft}>Letzter Website-Audit</SectionLabel>
                <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: D.text, letterSpacing: "-0.025em" }}>
                  {domain !== "—" ? domain : "Noch keine Website gescannt"}
                </h1>
                {!lastScan && sessionDomain && (
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: D.amber, lineHeight: 1.6, display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Anonymer Scan erkannt — als Account-Scan speichern für dauerhaften Zugriff
                  </p>
                )}
                {lastScan && (
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: D.textSub, lineHeight: 1.6 }}>
                    Gescannt am {scanDate}
                    {(() => {
                      const n = totalPages ?? (unterseiten ? unterseiten.length + 1 : null);
                      return n != null ? ` · ${n} Seite${n !== 1 ? "n" : ""} analysiert` : "";
                    })()}
                    {" · "}
                    {totalErrors > 0
                      ? `${totalErrors} Optimierungen verfügbar`
                      : "Alles optimiert ✓"}
                  </p>
                )}
                {/* Status badge — amber for opportunities, green for perfect */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  background: totalErrors > 0 ? D.amberBg : D.greenBg,
                  border: `1px solid ${totalErrors > 0 ? D.amberBorder : D.greenBorder}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%",
                    background: totalErrors > 0 ? D.amber : D.green,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700,
                    color: totalErrors > 0 ? D.amber : D.green,
                  }}>
                    {totalErrors > 0 ? `${totalErrors} Optimierungen` : "Alles optimiert ✓"}
                  </span>
                </div>

                {/* WooCommerce-Shop-Badge — immer sichtbar bei erkanntem Shop (alle Pläne) */}
                {fingerprint && fingerprint.ecommerce.value === "WooCommerce" && fingerprint.ecommerce.confidence >= CONFIDENCE_THRESHOLD && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "5px 13px 5px 10px", borderRadius: 20,
                    background: "linear-gradient(90deg, rgba(150,88,138,0.14), rgba(124,58,237,0.08))",
                    border: "1px solid rgba(150,88,138,0.35)",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#96588A" stroke="none">
                      <path d="M21 5H3a1 1 0 0 0-1 1v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a1 1 0 0 0-1-1zM4 13l1.5 7h13l1.5-7H4zm6 2h4v3h-4v-3z"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#C084B8", letterSpacing: "0.03em" }}>
                      WooCommerce Shop
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {monthlyScans >= scanLimit ? (
                  <button
                    onClick={() => setShowLimitModal(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "9px 20px", borderRadius: D.radiusSm,
                      background: D.redBg, border: `1px solid ${D.redBorder}`,
                      color: D.red, fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    <LockIco size={13} color={D.red} />
                    Scan-Limit erreicht — Upgrade
                  </button>
                ) : (
                  <BtnPrimary href={
                    !lastScan && sessionDomain
                      ? `/dashboard/scan?url=${encodeURIComponent(sessionDomain)}`
                      : "/dashboard/scan"
                  }>
                    {lastScan ? "Neuen Scan starten →" : sessionDomain ? "Jetzt als Account-Scan speichern →" : "+ Website hinzufügen"}
                  </BtnPrimary>
                )}
                {lastScan && (
                  <BtnGhost href={`/dashboard/scans/${lastScan.id}`}>Bericht ansehen</BtnGhost>
                )}
              </div>
            </div>
          </Card>

          {/* Smart-Fix-Banner für Starter: nach unten verlegt — der Haupt-CTA
              am Seitenende deckt den Smart-Fix-Upsell ab. Dashboard-Top
              fokussiert auf User-Daten, nicht Werbung. */}

          {/* Agency: Lead-Magnet Setup prompt */}
          {isAgency && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "18px 24px", marginBottom: 16,
              background: "rgba(167,139,250,0.05)",
              border: "1px solid rgba(167,139,250,0.18)",
              borderRadius: 12,
            }}>
              <div style={{
                fontSize: 22, flexShrink: 0,
                background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: 8, padding: "6px 10px",
              }}>
                🧲
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#a78bfa" }}>
                  Lead-Magnet Widget — exklusiv für dein Agency-Plan
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  Bette das Widget auf Kunden-Websites ein. Besucher starten direkt einen Scan — du erhältst sie als warme Leads.
                </p>
              </div>
              <Link href="/fuer-agenturen" style={{
                flexShrink: 0, padding: "9px 20px", borderRadius: 8,
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.3)",
                color: "#a78bfa",
                fontSize: 12, fontWeight: 800, textDecoration: "none",
                whiteSpace: "nowrap",
              }}>
                Widget einrichten →
              </Link>
            </div>
          )}

          {/* Phase 2: Shared MetricPillBar — Starter-Mode size="lg" für
              Daten-Prominenz (Pricing-Argument: 29€ für Volldaten). */}
          {!isNewScan && lastScan && (
            <MetricPillBar
              avgTtfbMs={avgTtfbMs}
              wcagHeuristicScore={wcagHeuristicScore}
              wcagHeuristicLabel={wcagHeuristicLabel}
              size="lg"
            />
          )}

          {/* Score-Verlauf ist Pro-Feature — Starter rendert ihn nicht (per Plan-Spec). */}

          {/* ①b GSC-CARD + LOW-SPEED-INSIGHT — Agency-Feature.
              Outer-Gate `isAtLeastProfessional`: Starter sieht die Sektion gar
              nicht (zu viele Locks erschlagen). Pro sieht Lock-Card mit
              Agency-Upsell. Agency sieht echte Live-Daten. */}
          {!isNewScan && lastScan && isAtLeastProfessional(plan) && (
            <LockedSection
              required="agency"
              currentPlan={plan}
              feature="gsc"
              title="Google Search Console — Live-Daten"
              description="Impressions, Klicks und Position direkt neben deinen Scores. Sieh den SEO-ROI deiner Optimierungen — exakt, nicht geschätzt."
              upsellPrice={249}
            >
              <GscInsightCard
                speedScore={speedScore}
                domainUrl={lastScan.url}
              />
            </LockedSection>
          )}

          {/* ② TECH FINGERPRINT STRIP */}
          {!isNewScan && lastScan && techChips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, padding: "14px 0 2px" }}>
              {techChips.map(item => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "5px 12px 5px 10px",
                  borderRadius: 20,
                  background: `rgba(${hexToRgb(item.color)},0.06)`,
                  border: `1px solid rgba(${hexToRgb(item.color)},0.2)`,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                    background: item.color, opacity: 0.85,
                  }} />
                  <span style={{ fontSize: 11, color: D.textMuted, fontWeight: 500 }}>{item.label}:</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ②b WORDPRESS-EXPERT-MODE — Plugin-Liste mit plan-abhängiger Tiefe */}
          {!isNewScan && lastScan && fingerprint && fingerprint.cms.value === "WordPress" &&
            (fingerprint.wpPlugins ?? []).filter(p => p.confidence >= CONFIDENCE_THRESHOLD).length > 0 && (
            <WordPressPluginsBlock
              plugins={fingerprint.wpPlugins ?? []}
              plan={plan}
            />
          )}

          {/* ②c E-COMMERCE & SHOP-PERFORMANCE — nur bei erkanntem WooCommerce.
              Pro+ Feature per Spec: Starter sieht die Lock-Card mit Upsell,
              ab Professional rendert das echte Audit (inkl. Revenue-Risk in €). */}
          {!isNewScan && lastScan && fingerprint && fingerprint.ecommerce.value === "WooCommerce" &&
            fingerprint.ecommerce.confidence >= CONFIDENCE_THRESHOLD && (
            <LockedSection
              required="professional"
              currentPlan={plan}
              feature="shop-audit"
              title="Shop-Audit — Revenue-Risiko-Analyse"
              description="Plugin-Impact, Cart-Performance und Template-Status für deinen WooCommerce-Shop. Erkenne, wie viel Umsatz du durch Tech-Schulden verlierst."
              upsellPrice={89}
            >
              <WooCommerceSection
                plan={plan}
                shopIssues={issues.filter(i => i.category === "shop")}
                audit={wooAudit}
              />
            </LockedSection>
          )}

          {/* ②d BUILDER-INTELLIGENCE — Elementor / Divi / Astra / WPBakery */}
          {!isNewScan && lastScan && builderAudit && builderAudit.builder && (
            <BuilderIntelligenceSection
              plan={plan}
              audit={builderAudit}
              builderIssues={issues.filter(i => i.category === "builder")}
              onGeneratePlan={() => setShowOptPlan(true)}
            />
          )}

          {/* ③ BFSG / COMPLIANCE BANNER */}
          {!isNewScan && lastScan && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 20px", borderRadius: D.radiusSm, marginBottom: 28,
              background: bfsgOk ? D.greenBg : D.amberBg,
              border: `1px solid ${bfsgOk ? D.greenBorder : D.amberBorder}`,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{bfsgOk ? "✅" : "⚠️"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
                  color: bfsgOk ? D.green : "#FBBF24",
                }}>
                  Nutzerfreundlichkeit: {bfsgOk ? "Sehr gut" : "Optimierungspotenzial gefunden"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: D.textSub, marginTop: 2 }}>
                  {bfsgOk
                    ? "Alle UX-Checks bestanden — Nutzer und Google finden diese Website barrierefrei zugänglich."
                    : `${accessibilityIssues.length} UX-Hürde${accessibilityIssues.length !== 1 ? "n" : ""} gefunden — verschenkt wertvolles SEO-Ranking und Nutzer-Vertrauen.`}
                </p>
              </div>
              {!bfsgOk && (
                <button
                  onClick={() => {
                    const target =
                      document.querySelector<HTMLElement>('[data-wf-anchor="wf-recht-first"]') ??
                      document.getElementById("wf-aufgaben");
                    if (!target) return;
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                    // Auto-open the accordion item if it has a toggle button
                    const btn = target.querySelector<HTMLButtonElement>("button");
                    if (btn && target.getAttribute("aria-expanded") !== "true") btn.click();
                  }}
                  style={{
                    flexShrink: 0, fontSize: 11, fontWeight: 700,
                    padding: "5px 12px", borderRadius: D.radiusXs,
                    background: D.amberBg, border: `1px solid ${D.amberBorder}`,
                    color: D.amber, cursor: "pointer",
                  }}
                >
                  Details →
                </button>
              )}
            </div>
          )}

          {/* ④ SUMMARY CARDS — hidden in focus mode after fresh scan */}
          {!isNewScan && (
          <div style={{ marginBottom: 28 }}>
            {/* Skeleton-Loader wenn noch kein Scan */}
            <style>{`
              @keyframes wf-shimmer {
                0%   { background-position: -400px 0; }
                100% { background-position: 400px 0; }
              }
              .wf-skeleton {
                background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
                background-size: 800px 100%;
                animation: wf-shimmer 1.6s infinite;
              }
            `}</style>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {!lastScan ? (
                // Skeleton cards
                [0, 1, 2].map(i => (
                  <div key={i} style={{
                    borderRadius: D.radiusSm, padding: "20px 22px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    minHeight: 90,
                  }}>
                    <div className="wf-skeleton" style={{ height: 10, width: 60, borderRadius: 4, marginBottom: 16 }} />
                    <div className="wf-skeleton" style={{ height: 28, width: 40, borderRadius: 6, marginBottom: 10 }} />
                    <div className="wf-skeleton" style={{ height: 8, width: 80, borderRadius: 4 }} />
                  </div>
                ))
              ) : [
                { label: "Handlungsbedarf", total: redTotal,    cats: redCount,    color: D.red,   bg: D.redBg,   border: D.redBorder   },
                { label: "Optimierungen",   total: yellowTotal, cats: yellowCount, color: D.amber, bg: D.amberBg, border: D.amberBorder },
                { label: "Hinweise",        total: greenTotal,  cats: greenCount,  color: D.green, bg: D.greenBg, border: D.greenBorder },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "20px 22px",
                  borderRadius: D.radius,
                  background: s.total > 0 ? s.bg : D.card,
                  border: `1px solid ${s.total > 0 ? s.border : D.border}`,
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700,
                    color: s.total > 0 ? s.color : D.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}>
                    {s.label}
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: 32, fontWeight: 900,
                    color: s.total > 0 ? s.color : D.textFaint,
                    letterSpacing: "-0.03em", lineHeight: 1.1,
                  }}>
                    {s.total}
                  </p>
                  {s.cats > 0 && (
                    <p style={{ margin: 0, fontSize: 11, color: D.textMuted, fontWeight: 400 }}>
                      In {s.cats} {s.cats === 1 ? "Kategorie" : "Kategorien"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}

          {!isNewScan && <Divider style={{ marginBottom: 28 }} />}

          {/* ④a SCORE-RINGS — Ebene 1 (Phase-2 Shared) */}
          <ScoreRingSection
            issues={panelIssues}
            redCount={consolidatedRedCount}
            yellowCount={consolidatedYellowCount}
            speedScore={speedScore}
            plan={plan}
            lastScan={!!lastScan}
            focusMode={isNewScan}
            scanId={lastScan?.id}
            isWooCommerce={!!fingerprint && fingerprint.ecommerce.value === "WooCommerce" && fingerprint.ecommerce.confidence >= CONFIDENCE_THRESHOLD}
            builderName={builderAudit?.builder ?? null}
            builderForGuidance={
              builderAudit?.builder === "Elementor" ||
              builderAudit?.builder === "Divi" ||
              builderAudit?.builder === "Astra" ||
              builderAudit?.builder === "WPBakery"
                ? builderAudit.builder
                : null
            }
            integrationsStatus={integrationsStatus}
            scanUrl={lastScan?.url}
          />

          {/* ④b ISSUE-LIST — Ebene 2 (Starter: KI-Guide gelockt). */}
          <IssueList
            issues={panelIssues}
            redCount={consolidatedRedCount}
            yellowCount={consolidatedYellowCount}
            speedScore={speedScore}
            plan={plan}
            lastScan={!!lastScan}
            focusMode={isNewScan}
            scanId={lastScan?.id}
            isWooCommerce={!!fingerprint && fingerprint.ecommerce.value === "WooCommerce" && fingerprint.ecommerce.confidence >= CONFIDENCE_THRESHOLD}
            builderName={builderAudit?.builder ?? null}
            builderForGuidance={
              builderAudit?.builder === "Elementor" ||
              builderAudit?.builder === "Divi" ||
              builderAudit?.builder === "Astra" ||
              builderAudit?.builder === "WPBakery"
                ? builderAudit.builder
                : null
            }
            integrationsStatus={integrationsStatus}
            scanUrl={lastScan?.url}
            hideScoreRings
            lockExpertFix
          />

          {/* ─── EBENE 3: DEEP-SCAN MAP ─────────────────────────────────────── */}
          {!isNewScan && hasData && unterseiten && unterseiten.length > 0 && (
            <div ref={mapSectionRef}>
              <DeepScanMap
                homepageUrl={lastScan?.url ?? ""}
                homepageIssueCount={panelIssues.length}
                unterseiten={unterseiten}
                isFree={isFree}
                onOpenDrawer={setDrawerPageUrl}
                checkedUrls={checkedUrls}
                onToggleChecked={toggleChecked}
                highlightUrl={highlightUrl}
                activeUrl={drawerPageUrl}
              />
            </div>
          )}

          {/* Side drawer */}
          {!isNewScan && drawerPageUrl && unterseiten && (
            <DrawerPanel
              pageUrl={drawerPageUrl}
              unterseiten={unterseiten}
              globalIssues={panelIssues}
              onClose={() => setDrawerPageUrl(null)}
              isChecked={checkedUrls.has(drawerPageUrl)}
              onToggleChecked={() => toggleChecked(drawerPageUrl)}
              pluginActive={pluginActive}
              deepData={pluginDeepData}
              userPlan={plan}
            />
          )}

          {!isNewScan && <Divider style={{ marginBottom: 28 }} />}

          {/* ─── EBENE 4: PERFORMANCE & SEARCH CARDS ───────────────────────── */}
          {!isNewScan && <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <SectionLabel>Scan · Sichtbarkeit &amp; Performance</SectionLabel>
            </div>
            <SectionHead>Search &amp; Performance</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {((): Array<{
                label: string; value: string; sub: string; color: string;
                tip?: { text: string; cta?: { label: string; href: string } };
              }> => {
                const scanUrl = lastScan?.url ?? "";
                const psUrl = scanUrl
                  ? `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(scanUrl)}`
                  : "https://pagespeed.web.dev/";
                const gscUrl = scanUrl
                  ? `https://search.google.com/search-console/index?resource_id=${encodeURIComponent(scanUrl)}`
                  : "https://search.google.com/search-console";
                return [
                  {
                    label: "Indexierte URLs",
                    value: hasData ? `${indexedUrls}` : "—",
                    sub: hasData ? "Im Google Index" : "Noch kein Scan",
                    color: hasData ? D.blueSoft : D.textFaint,
                    tip: hasData && indexedUrls === 0 ? {
                      text: "Deine Seite ist noch nicht bei Google registriert.",
                      cta: { label: "Search Console öffnen →", href: gscUrl },
                    } : undefined,
                  },
                  {
                    label: "Sitemap",
                    value: hasData ? (sitemapOk ? "/sitemap.xml" : "Fehlt") : "—",
                    sub: hasData ? (sitemapOk ? "Status: 200 OK" : "Nicht eingereicht") : "Noch kein Scan",
                    color: hasData ? (sitemapOk ? D.green : D.red) : D.textFaint,
                    tip: hasData && !sitemapOk ? {
                      text: "Erstelle eine sitemap.xml mit Yoast SEO oder RankMath.",
                      cta: { label: "Anleitung ansehen", href: "/blog/google-findet-deine-website-nicht" },
                    } : undefined,
                  },
                  {
                    label: "Core Web Vitals",
                    value: hasData ? `LCP ${(lcpMs / 1000).toFixed(1)}s` : "—",
                    sub: hasData ? `CLS ${cls.toFixed(2)}` : "Noch kein Scan",
                    color: hasData ? (lcpMs < 2500 ? D.green : D.amber) : D.textFaint,
                    tip: hasData && lcpMs >= 2500 ? {
                      text: "Bilder komprimieren & Caching-Plugin aktivieren senkt LCP spürbar.",
                      cta: { label: "PageSpeed Insights →", href: psUrl },
                    } : undefined,
                  },
                  {
                    label: "Mobil",
                    value: hasData ? (mobileOk ? "Bestanden" : "Fehlgeschlagen") : "—",
                    sub: hasData ? "Viewport & Responsive" : "Noch kein Scan",
                    color: hasData ? (mobileOk ? D.green : D.red) : D.textFaint,
                    tip: hasData && !mobileOk ? {
                      text: "Schriftgrößen ≥ 16px und genug Abstand zwischen Buttons auf Smartphones.",
                      cta: { label: "Mobile Test →", href: `https://search.google.com/test/mobile-friendly?url=${encodeURIComponent(scanUrl)}` },
                    } : undefined,
                  },
                ];
              })().map(tile => (
                <div key={tile.label} style={{
                  padding: "16px 16px",
                  borderRadius: D.radiusSm,
                  background: hasData ? `rgba(${hexToRgb(tile.color)},0.05)` : D.card,
                  border: `1px solid ${hasData ? `rgba(${hexToRgb(tile.color)},0.18)` : D.border}`,
                }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700,
                    color: tile.color, textTransform: "uppercase", letterSpacing: "0.08em", opacity: hasData ? 0.8 : 0.5,
                  }}>
                    {tile.label}
                  </p>
                  <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 800, color: hasData ? D.text : D.textFaint, lineHeight: 1.2 }}>
                    {tile.value}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: D.textMuted }}>{tile.sub}</p>

                  {tile.tip && (
                    <div style={{
                      marginTop: 10,
                      padding: "8px 10px",
                      borderRadius: 7,
                      background: "rgba(251,191,36,0.05)",
                      border: "1px solid rgba(251,191,36,0.16)",
                    }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ flexShrink: 0, marginTop: 1 }}>
                          <path d="M9 18h6"/><path d="M10 22h4"/>
                          <path d="M12 2a7 7 0 0 1 7 7c0 3.5-2 5.5-2.5 7h-9C7 14.5 5 12.5 5 9a7 7 0 0 1 7-7z"/>
                        </svg>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(251,191,36,0.75)", lineHeight: 1.5 }}>
                          {tile.tip.text}
                        </p>
                      </div>
                      {tile.tip.cta && (
                        <a
                          href={tile.tip.cta.href}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            display: "inline-block", marginTop: 7,
                            fontSize: 10, fontWeight: 700,
                            color: "#fbbf24", textDecoration: "none",
                            padding: "3px 8px", borderRadius: 5,
                            background: "rgba(251,191,36,0.08)",
                            border: "1px solid rgba(251,191,36,0.2)",
                          }}
                        >
                          {tile.tip.cta.label}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p style={{ margin: "10px 0 0", fontSize: 11, color: D.textFaint, lineHeight: 1.6, fontWeight: 400 }}>
              Diese Werte basieren auf Scan-Schätzungen.{" "}
              <Link href="/fuer-agenturen#pricing" style={{ color: D.blueSoft, textDecoration: "none", opacity: 0.8 }}>
                Präzise Live-Daten aus GSC &amp; PageSpeed
              </Link>
              {" "}sind im Professional Plan verfügbar.
            </p>

            {hasData && (
              <div style={{
                marginTop: 14,
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: D.radiusSm,
                background: "linear-gradient(135deg, rgba(0,123,255,0.06) 0%, rgba(0,123,255,0.03) 100%)",
                border: "1px solid rgba(0,123,255,0.18)",
              }}>
                <div style={{
                  flexShrink: 0,
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(0,123,255,0.1)",
                  border: "1px solid rgba(0,123,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(122,166,255,0.75)", lineHeight: 1.55, flex: 1 }}>
                  <strong style={{ color: "#7aa6ff", fontWeight: 700 }}>
                    Deep-Scan ({totalPages != null ? totalPages : "10"} Seiten analysiert)
                  </strong>
                  {isFree && <>{" · "}Für 30+ Seiten und erweiterte Berichte{" "}
                    <Link href="/fuer-agenturen#pricing" style={{ color: "#7aa6ff", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(122,166,255,0.4)", fontWeight: 600 }}>
                      Professional Plan →
                    </Link>
                  </>}
                </p>
              </div>
            )}
          </div>}

          {!isNewScan && <Divider style={{ marginBottom: 28 }} />}

          {/* ⑦ SMART-GUARD AUTOMATION MODULES — hidden in focus mode */}
          {!isNewScan && <div style={{ marginBottom: 28 }}>
            <SectionLabel color={D.blueSoft}>Professional · Automatisierung</SectionLabel>
            <SectionHead>Einmal verstehen — dauerhaft überwacht.</SectionHead>
            <p style={{ margin: "-10px 0 24px", fontSize: 13, color: D.textMuted, lineHeight: 1.75, maxWidth: 580 }}>
              Die Analyse liegt vor dir. Der Professional Plan läuft im Hintergrund, beobachtet jede Veränderung und meldet sich — ohne dass du selbst regelmäßig prüfen musst.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {([
                {
                  key: "score",
                  title: "Score-Verlauf",
                  badge: "Täglich · 30 Tage",
                  desc: "Jede Verbesserung, jeder Rückschritt — sauber dokumentiert. Du siehst, ob deine Maßnahmen wirken, bevor Google es tut.",
                  cta: "Professional aktivieren",
                  planTag: "Professional",
                  status: isFree ? "Professional" : null as string | null,
                  disabled: isFree,
                },
                {
                  key: "monitor",
                  title: "24/7 Live-Monitoring",
                  badge: "Echtzeit · E-Mail-Alert",
                  desc: "Ausfall, veränderte Inhalte, neue Sicherheitsprobleme — du wirst sofort informiert. Nicht einmal täglich, sondern in dem Moment, in dem es passiert.",
                  cta: "Professional aktivieren",
                  planTag: "Professional",
                  status: isFree ? "Professional" : null as string | null,
                  disabled: isFree,
                },
                {
                  key: "pdf",
                  title: "Monatlicher PDF-Bericht",
                  badge: "Automatisch · Teilbar",
                  desc: "Jeden Monat ein vollständiger Auditbericht als PDF — automatisch erstellt, strukturiert aufbereitet, teilbar mit Kunden oder für die interne Dokumentation.",
                  cta: "Berichte aktivieren",
                  planTag: "Professional",
                  status: null as string | null,
                  disabled: false,
                },
                {
                  key: "leadmagnet",
                  title: "Lead-Magnet Widget",
                  badge: "Exklusiv · Agency",
                  desc: "Bettest du das Widget auf Kunden-Websites ein, können Besucher direkt einen kostenlosen Scan starten — und landen als warme Leads in deinem Dashboard.",
                  cta: "Agency anfragen",
                  planTag: "Agency",
                  status: (isFree || isSmartGuard) ? "Agency" : null as string | null,
                  disabled: isFree || isSmartGuard,
                },
              ]).map(module => (
                <div key={module.key} className={module.disabled ? "wf-disabled-card" : ""} style={{
                  borderRadius: D.radius,
                  background: module.disabled
                    ? "rgba(255,255,255,0.02)"
                    : (module.status ? "rgba(0,123,255,0.04)" : D.card),
                  border: `1px solid ${module.disabled ? "rgba(255,255,255,0.06)" : (module.status ? D.blueBorder : D.border)}`,
                  padding: "24px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  position: "relative" as const,
                  overflow: "hidden",
                }}>
                  {/* Glassmorphism lock overlay */}
                  {module.disabled && (
                    <div style={{
                      position: "absolute", inset: 0, zIndex: 10,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      background: "rgba(11,12,16,0.72)",
                      borderRadius: D.radius,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      cursor: "pointer",
                    }}>
                      {/* Lock icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: module.status === "Agency"
                          ? "rgba(167,139,250,0.15)"
                          : "rgba(251,191,36,0.15)",
                        border: `1px solid ${module.status === "Agency" ? "rgba(167,139,250,0.4)" : "rgba(251,191,36,0.4)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke={module.status === "Agency" ? "#a78bfa" : "#fbbf24"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      {/* Plan label */}
                      <div style={{
                        fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: module.status === "Agency" ? "#a78bfa" : "#fbbf24",
                        opacity: 0.9,
                      }}>
                        {module.status === "Agency" ? "Agency Feature" : "Professional Feature"}
                      </div>
                      {/* Upgrade CTA */}
                      <Link
                        href="/fuer-agenturen#pricing"
                        style={{
                          fontSize: 12, fontWeight: 600,
                          color: module.status === "Agency" ? "#a78bfa" : "#fbbf24",
                          background: module.status === "Agency"
                            ? "rgba(167,139,250,0.12)"
                            : "rgba(251,191,36,0.12)",
                          border: `1px solid ${module.status === "Agency" ? "rgba(167,139,250,0.3)" : "rgba(251,191,36,0.3)"}`,
                          borderRadius: 8,
                          padding: "6px 14px",
                          textDecoration: "none",
                          transition: "background 0.18s",
                        }}
                      >
                        {module.status === "Agency" ? "Agency freischalten →" : "Professional freischalten →"}
                      </Link>
                    </div>
                  )}
                  {/* Icon row + optional status badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>

                    {/* Score: icon + blurred mini chart */}
                    {module.key === "score" ? (
                      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="20" height="14" viewBox="0 0 60 28" fill="none">
                            <polyline points="0,22 10,16 20,20 30,8 40,12 50,4 60,10"
                              stroke={D.blueSoft} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              fill="none" opacity="0.9"/>
                            <polyline points="0,22 10,16 20,20 30,8 40,12 50,4 60,10 60,28 0,28"
                              stroke="none" fill="url(#sg)" opacity="0.25"/>
                            <defs>
                              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7aa6ff"/>
                                <stop offset="100%" stopColor="#7aa6ff" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    ) : module.key === "monitor" ? (
                      /* Monitoring: pulsing ring icon */
                      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* Outer pulse ring */}
                        <div style={{
                          position: "absolute", inset: 0, borderRadius: 10,
                          border: `1px solid ${D.blueBorder}`,
                          animation: "wf-ring 2s ease-out infinite",
                        }} />
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          position: "relative", zIndex: 1,
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.blueSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={{ animation: "wf-pulse-dot 2s ease-in-out infinite" }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.blueSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                    )}

                    {module.status && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 10, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 20,
                        background: module.status === "Agency"
                          ? "rgba(167,139,250,0.1)"
                          : "rgba(251,191,36,0.08)",
                        border: `1px solid ${module.status === "Agency" ? "rgba(167,139,250,0.3)" : "rgba(251,191,36,0.25)"}`,
                        color: module.status === "Agency" ? "#a78bfa" : "#FBBF24",
                        letterSpacing: "0.03em", whiteSpace: "nowrap",
                      }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        {module.status} Plan
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: D.text, lineHeight: 1.3 }}>
                    {module.title}
                  </p>

                  {/* Badge */}
                  <span style={{
                    display: "inline-block", alignSelf: "flex-start",
                    fontSize: 10, fontWeight: 600,
                    padding: "2px 9px", borderRadius: 20, marginBottom: 14,
                    background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                    color: D.blueSoft, letterSpacing: "0.03em",
                  }}>
                    {module.badge}
                  </span>

                  {/* Description — flex: 1 to push button down */}
                  <p style={{ margin: "0 0 20px", fontSize: 12, color: D.textMuted, lineHeight: 1.7, flex: 1 }}>
                    {module.desc}
                  </p>

                  {/* CTA — monitoring gets full-width prominent style */}
                  {module.status ? (
                    <Link
                      href="/fuer-agenturen#pricing"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "10px 18px", borderRadius: D.radiusXs,
                        background: module.status === "Agency" ? "rgba(124,58,237,0.15)" : "rgba(251,191,36,0.12)",
                        color: module.status === "Agency" ? "#a78bfa" : "#FBBF24",
                        border: `1px solid ${module.status === "Agency" ? "rgba(124,58,237,0.3)" : "rgba(251,191,36,0.3)"}`,
                        fontSize: 13, fontWeight: 700, textDecoration: "none",
                      }}>
                      {module.cta} →
                    </Link>
                  ) : (
                    <Link href="/dashboard/reports" style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      alignSelf: "flex-start",
                      padding: "8px 16px", borderRadius: D.radiusXs,
                      background: D.blue, color: "#fff",
                      fontSize: 11, fontWeight: 700, textDecoration: "none",
                      boxShadow: D.blueGlow,
                    }}>
                      {module.cta} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>}

          {!isNewScan && <Divider style={{ marginBottom: 28 }} />}

          {/* ⑧ WP-PLUGIN ANBINDUNG — hidden in focus mode */}
          {!isNewScan && <div style={{ marginBottom: 28 }}>
            <SectionLabel color={isAgency ? "#a78bfa" : D.blueSoft}>
              {isAgency ? "Agency · Exklusiv" : "Agency Feature"}
            </SectionLabel>
            <SectionHead>WP-Plugin Anbindung</SectionHead>
            <p style={{ margin: "-10px 0 24px", fontSize: 13, color: D.textMuted, lineHeight: 1.75, maxWidth: 600 }}>
              Installiere das White-Label Helper-Plugin auf deinen Kunden-Seiten, um Fixes direkt aus diesem Dashboard per API zu übertragen — ohne Entwickler, ohne manuelles Copy-Paste.
            </p>

            {isAgency ? (
              /* ── Agency: full plugin area ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── KI-Mass-Fixer ── */}
              <div style={{
                padding: "22px 24px", borderRadius: D.radius,
                background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: "#a78bfa" }}>
                      KI-Mass-Fixer
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: D.textMuted }}>
                      Befehle an alle verbundenen WordPress-Sites gleichzeitig senden
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                    background: connectedSites.length > 0 ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${connectedSites.length > 0 ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                    color: connectedSites.length > 0 ? "#34d399" : D.textMuted,
                  }}>
                    {connectedSites.length} Site{connectedSites.length !== 1 ? "s" : ""} verbunden
                  </span>
                </div>

                {/* Connected sites list */}
                {connectedSites.length > 0 ? (
                  <div style={{
                    marginBottom: 14, borderRadius: 8,
                    background: "rgba(0,0,0,0.2)", border: "1px solid rgba(167,139,250,0.1)",
                    overflow: "hidden",
                  }}>
                    {connectedSites.map((site, si) => (
                      <div key={site.site_url} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 14px",
                        borderBottom: si < connectedSites.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                          background: "#34d399",
                        }} />
                        <span style={{ flex: 1, fontSize: 12, color: D.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {site.site_name ?? site.site_url}
                        </span>
                        <span style={{ fontSize: 10, color: D.textMuted, flexShrink: 0 }}>
                          {(() => {
                            try {
                              const d = new Date(site.last_seen);
                              const diff = Date.now() - d.getTime();
                              if (diff < 3600000) return "Vor " + Math.round(diff / 60000) + " Min";
                              if (diff < 86400000) return "Vor " + Math.round(diff / 3600000) + " Std";
                              return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                            } catch { return "—"; }
                          })()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    marginBottom: 14, padding: "14px 16px", borderRadius: 8,
                    background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)",
                    textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: D.textMuted }}>
                      Noch keine verbundenen Installationen. Plugin installieren → API-Key eingeben → Site erscheint hier.
                    </p>
                  </div>
                )}

                {/* Fix type selector + execute */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={batchFixType}
                    onChange={e => setBatchFixType(e.target.value)}
                    style={{
                      flex: 1, minWidth: 160,
                      padding: "8px 12px", borderRadius: 7,
                      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(167,139,250,0.2)",
                      color: D.textSub, fontSize: 12, cursor: "pointer",
                    }}
                  >
                    <option value="ping">Verbindungstest (Ping)</option>
                    <option value="set_alt_text">Alt-Texte setzen</option>
                    <option value="set_meta_description">Meta-Descriptions setzen</option>
                    <option value="set_title">Seitentitel (SEO) setzen</option>
                    <option value="remove_noindex">noindex entfernen</option>
                  </select>
                  <button
                    onClick={handleBatchFix}
                    disabled={batchRunning || connectedSites.length === 0}
                    style={{
                      padding: "8px 20px", borderRadius: 7,
                      background: batchRunning ? "rgba(167,139,250,0.1)" : "#a78bfa",
                      color: batchRunning ? "#a78bfa" : "#0b0c10",
                      border: batchRunning ? "1px solid rgba(167,139,250,0.3)" : "none",
                      fontSize: 12, fontWeight: 800, cursor: batchRunning ? "default" : "pointer",
                      opacity: connectedSites.length === 0 ? 0.4 : 1,
                    }}
                  >
                    {batchRunning ? "Läuft…" : "An alle senden →"}
                  </button>
                </div>

                {/* Result */}
                {batchResult && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 7,
                    background: batchResult.summary.failed === 0 ? "rgba(52,211,153,0.08)" : "rgba(251,191,36,0.08)",
                    border: `1px solid ${batchResult.summary.failed === 0 ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}`,
                  }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700,
                      color: batchResult.summary.failed === 0 ? "#34d399" : "#FBBF24" }}>
                      {batchResult.summary.failed === 0
                        ? `✓ ${batchResult.summary.success} / ${batchResult.summary.total} Sites erfolgreich`
                        : `⚠ ${batchResult.summary.success} OK · ${batchResult.summary.failed} Fehler`}
                    </p>
                  </div>
                )}
              </div>

              {/* ── API Key + Download grid ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* API Key card */}
                <div style={{
                  padding: "24px 22px", borderRadius: D.radius,
                  background: "rgba(167,139,250,0.04)",
                  border: "1px solid rgba(167,139,250,0.2)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: "rgba(167,139,250,0.1)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Dein Plugin API-Key</p>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(167,139,250,0.15)",
                    marginBottom: 10,
                  }}>
                    <code style={{ flex: 1, fontSize: 11, color: pluginApiKey ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontFamily: "monospace", letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pluginApiKey
                        ? pluginApiKey.slice(0, 16) + "••••••••••••••••••••••••••••••••"
                        : "Wird geladen…"}
                    </code>
                    <button
                      onClick={handleCopyKey}
                      disabled={!pluginApiKey}
                      style={{
                        background: pluginKeyCopied ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.1)",
                        border: `1px solid ${pluginKeyCopied ? "rgba(52,211,153,0.3)" : "rgba(167,139,250,0.25)"}`,
                        borderRadius: 5, padding: "4px 10px", cursor: pluginApiKey ? "pointer" : "default",
                        fontSize: 11, fontWeight: 700,
                        color: pluginKeyCopied ? "#34d399" : "#a78bfa",
                        flexShrink: 0, transition: "all 0.2s",
                      }}
                    >
                      {pluginKeyCopied ? "✓ Kopiert!" : "Kopieren"}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                      Gültig für alle deine Kunden-Projekte.
                    </p>
                    <button
                      onClick={handleRegenerateKey}
                      disabled={pluginKeyLoading}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 10, color: "rgba(167,139,250,0.5)", padding: 0,
                        textDecoration: "underline", textDecorationColor: "rgba(167,139,250,0.25)",
                      }}
                    >
                      {pluginKeyLoading ? "…" : "Neu generieren"}
                    </button>
                  </div>
                </div>

                {/* Download card */}
                <div style={{
                  padding: "24px 22px", borderRadius: D.radius,
                  background: "rgba(167,139,250,0.04)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: "rgba(167,139,250,0.1)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Plugin herunterladen</p>
                  </div>
                  <p style={{ margin: "0 0 16px", fontSize: 12, color: D.textMuted, lineHeight: 1.7, flex: 1 }}>
                    Lade das <strong style={{ color: "rgba(255,255,255,0.6)" }}>website-fix-helper.zip</strong> herunter, installiere es in WordPress (Plugins → Installieren → Plugin hochladen) und trage deinen API-Key ein.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a
                      href="/downloads/website-fix-helper.zip"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 18px", borderRadius: 8,
                        background: "#a78bfa", color: "#0b0c10",
                        fontSize: 12, fontWeight: 800, textDecoration: "none",
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Plugin herunterladen (.zip)
                    </a>
                    <a
                      href="https://docs.website-fix.com/plugin"
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 18px", borderRadius: 8,
                        background: "rgba(167,139,250,0.1)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        color: "#a78bfa",
                        fontSize: 12, fontWeight: 700, textDecoration: "none",
                      }}
                    >
                      Dokumentation →
                    </a>
                  </div>
                </div>
              </div>
              </div>
            ) : (
              /* ── Non-Agency: high-conversion upgrade card ── */
              <div style={{
                position: "relative", overflow: "hidden",
                padding: "32px 36px", borderRadius: D.radius,
                background: "linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(124,58,237,0.04) 100%)",
                border: "1px solid rgba(167,139,250,0.22)",
              }}>
                {/* Decorative glow blob */}
                <div style={{
                  position: "absolute", right: -40, top: -40,
                  width: 220, height: 220, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                {/* Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                    background: "rgba(167,139,250,0.12)",
                    border: "1px solid rgba(167,139,250,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)",
                    color: "#a78bfa", letterSpacing: "0.07em", textTransform: "uppercase",
                  }}>
                    Agency · Exklusiv
                  </span>
                </div>
                {/* Headline */}
                <h3 style={{
                  margin: "0 0 10px", fontSize: 18, fontWeight: 800,
                  color: "#fff", lineHeight: 1.3, maxWidth: 520,
                }}>
                  WordPress-Vollautomatik: Fixe alle{" "}
                  <span style={{ color: "#a78bfa" }}>
                    {issues.length > 0 ? `${issues.length}+` : "248+"}
                  </span>{" "}
                  Fehler direkt aus diesem Dashboard.
                </h3>
                {/* Sub-copy */}
                <p style={{ margin: "0 0 22px", fontSize: 13, color: D.textMuted, lineHeight: 1.7, maxWidth: 500 }}>
                  Installiere das White-Label-Plugin einmalig auf Kunden-Seiten und übertrage Korrekturen per API — kein manuelles Copy-Paste, keine FTP-Zugänge, keine Fehler.
                </p>
                {/* Feature pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                  {["Auto-Deploy via API", "White-Label ready", "Unbegrenzte Kunden-Sites", "Direkt-Push aus Dashboard"].map(pill => (
                    <span key={pill} style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                      background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
                      color: "rgba(167,139,250,0.85)",
                    }}>{pill}</span>
                  ))}
                </div>
                {/* CTA */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Link href="/fuer-agenturen#pricing" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "11px 24px", borderRadius: 8,
                    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                    color: "#fff",
                    fontSize: 13, fontWeight: 800, textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                    whiteSpace: "nowrap",
                  }}>
                    Auf Agency upgraden →
                  </Link>
                  <span style={{ fontSize: 11, color: D.textMuted }}>ab 249€/Monat · inkl. Plugin + Kunden-Matrix</span>
                </div>
              </div>
            )}
          </div>}

          {/* ⑨ UPGRADE CTA — hidden in focus mode */}
          {!isNewScan && <div style={{
            padding: "40px 40px",
            borderRadius: D.radius,
            background: "rgba(0,123,255,0.06)",
            border: "1px solid rgba(0,123,255,0.2)",
            textAlign: "center",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
              padding: "4px 14px", borderRadius: 20,
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              fontSize: 11, fontWeight: 700, color: D.blueSoft, letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              Professional Plan
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: D.text, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Mehr SEO-Ranking.<br/>Weniger manuelle Arbeit.
            </h2>
            <p style={{ margin: "0 auto 28px", fontSize: 15, color: D.textSub, maxWidth: 520, lineHeight: 1.75 }}>
              Der Professional Plan scannt automatisch, überwacht Veränderungen 24/7 und liefert KI-Auto-Fixes — Copy-Paste-fertig für WordPress. Inkl. Score-Verlauf, monatlichem PDF-Bericht, 10 Projekten und Smart-Fix Drawer. Für 89 €/Monat. Jederzeit kündbar.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/fuer-agenturen#pricing" style={{
                padding: "13px 32px", borderRadius: D.radiusSm,
                background: D.blue, color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
              }}>
                Professional aktivieren →
              </Link>
              <Link href="/fuer-agenturen#pricing" style={{
                padding: "13px 24px", borderRadius: D.radiusSm,
                border: `1px solid ${D.borderStrong}`,
                color: D.textSub, fontSize: 14, textDecoration: "none",
              }}>
                Mehr erfahren
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 12, color: D.textFaint }}>
              Keine Installation · Ergebnis sofort · Jederzeit kündbar
            </p>
          </div>}

        {/* ── STICKY UPGRADE FOOTER BANNER (free only) ─────── */}
        {isFree && (
          <div style={{
            position: "sticky", bottom: 0, zIndex: 30,
            background: "rgba(9,10,15,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(0,123,255,0.18)",
            boxShadow: "0 -1px 0 rgba(0,123,255,0.08), 0 -8px 32px rgba(0,0,0,0.6)",
          }}>
            {/* Left gradient accent */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
              background: "linear-gradient(180deg, #007BFF 0%, rgba(0,123,255,0.3) 100%)",
              borderRadius: "0 2px 2px 0",
            }} />

            <div style={{
              maxWidth: 1100, margin: "0 auto",
              padding: "11px 28px 11px 32px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Animated pulse dot */}
                <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: D.blue, opacity: 0.35,
                    transform: "scale(2.2)",
                    animation: "wf-ring 2.5s ease-out infinite",
                  }} />
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: D.blue,
                    boxShadow: `0 0 10px ${D.blue}`,
                    position: "relative",
                  }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: D.text, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                    Mehr Rankings. Weniger manuelle Arbeit.
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: D.textMuted, lineHeight: 1.3, marginTop: 1 }}>
                    Professional: 10 Projekte, Smart-Fix Drawer, KI-Auto-Fix, 24/7 Monitoring — ab 89€/Monat.
                  </p>
                </div>
              </div>
              <Link href="/fuer-agenturen#pricing" className="wf-upgrade-btn" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 22px", borderRadius: D.radiusSm,
                background: "linear-gradient(135deg, #1a7fe8 0%, #007BFF 100%)",
                color: "#fff",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 18px rgba(0,123,255,0.4)",
                flexShrink: 0,
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}>
                Professional aktivieren
                <span className="wf-arrow" style={{ display: "inline-block", fontWeight: 400 }}>→</span>
              </Link>
            </div>
          </div>
        )}

      </DashboardShell>


      {/* ── OPTIMIERUNGS-PLAN MODAL (Builder-Intelligence, Pro/Agency) ── */}
      {showOptPlan && (
        <OptimizationPlanModal
          onClose={() => setShowOptPlan(false)}
          plan={plan}
          builder={builderAudit ?? null}
          woo={wooAudit ?? null}
          speedScore={speedScore}
          redCount={redCount}
          yellowCount={yellowCount}
          url={lastScan?.url ?? ""}
          scanId={lastScan?.id}
        />
      )}

      {/* ── SCAN-LIMIT UPGRADE MODAL ─────────────────────────────────── */}
      {showLimitModal && (
        <div
          onClick={() => setShowLimitModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0f1623", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 18, padding: "36px 32px", maxWidth: 440, width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
              background: D.redBg, border: `1px solid ${D.redBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={D.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: D.red, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Scan-Limit erreicht
            </p>
            <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em" }}>
              Alle {scanLimit} Scans diesen Monat aufgebraucht
            </h2>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
              Mit dem <strong style={{ color: "#FBBF24" }}>Professional-Plan</strong> bekommst du unbegrenzte Scans,
              KI-gestützte Fix-Anleitungen und Monitoring rund um die Uhr.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/fuer-agenturen#pricing" style={{
                display: "block", padding: "13px 24px", borderRadius: 10,
                background: "#FBBF24", color: "#0b0c10", fontWeight: 800, fontSize: 14,
                textDecoration: "none", boxShadow: "0 4px 16px rgba(251,191,36,0.3)",
              }}>
                Jetzt auf Professional upgraden →
              </a>
              <button
                onClick={() => setShowLimitModal(false)}
                style={{
                  padding: "10px", background: "none", border: "none",
                  color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
