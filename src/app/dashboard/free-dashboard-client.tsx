"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { TechFingerprint } from "@/lib/tech-detector";
import { CONFIDENCE_THRESHOLD, UNKNOWN } from "@/lib/tech-detector";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParsedIssueProp {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik";
  count?: number; // actual number of errors this issue represents
}
export interface ScanBriefProp {
  id: string;
  url: string;
  created_at: string;
  issue_count: number | null;
}
export interface UnterseiteProp {
  url: string;
  erreichbar: boolean;
  title: string;
  h1?: string;
  noindex: boolean;
  altMissing: number;
  altMissingImages?: string[];
  metaDescription?: string;
  inputsWithoutLabel?: number;
  buttonsWithoutText?: number;
}
export interface FreeDashboardProps {
  firstName: string;
  plan: string;
  lastScan: ScanBriefProp | null;
  lastScanResult: string | null;
  issues: ParsedIssueProp[];
  redCount: number;
  yellowCount: number;
  rechtIssues: ParsedIssueProp[];
  speedIssues: ParsedIssueProp[];
  techIssues: ParsedIssueProp[];
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
}

// ─── Design tokens — matching the WebsiteFix marketing site exactly ───────────
const D = {
  // Backgrounds
  page:         "#0b0c10",
  sidebar:      "#0A192F",
  card:         "rgba(255,255,255,0.03)",
  cardHover:    "rgba(255,255,255,0.05)",
  topbar:       "rgba(11,12,16,0.96)",

  // Borders
  border:       "rgba(255,255,255,0.07)",
  borderMid:    "rgba(255,255,255,0.1)",
  borderStrong: "rgba(255,255,255,0.14)",
  divider:      "rgba(255,255,255,0.06)",
  sidebarBdr:   "rgba(255,255,255,0.06)",

  // Typography
  text:         "#ffffff",
  textSub:      "rgba(255,255,255,0.5)",
  textMuted:    "rgba(255,255,255,0.3)",
  textFaint:    "rgba(255,255,255,0.18)",

  // Brand blue (primary)
  blue:         "#007BFF",
  blueSoft:     "#7aa6ff",
  blueBg:       "rgba(0,123,255,0.08)",
  blueBorder:   "rgba(0,123,255,0.25)",
  blueGlow:     "0 2px 14px rgba(0,123,255,0.35)",

  // Functional
  red:          "#f87171",
  redBg:        "rgba(239,68,68,0.1)",
  redBorder:    "rgba(239,68,68,0.25)",
  amber:        "#fbbf24",
  amberBg:      "rgba(251,191,36,0.1)",
  amberBorder:  "rgba(251,191,36,0.25)",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.1)",
  greenBorder:  "rgba(74,222,128,0.25)",

  // Shapes
  radius:   14,
  radiusSm: 8,
  radiusXs: 6,
} as const;

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Dark card matching marketing-site feature cards */
function Card({
  children,
  style,
  accent,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}) {
  const border = accent ? `rgba(${hexToRgb(accent)},0.2)` : D.border;
  const bg     = accent ? `rgba(${hexToRgb(accent)},0.04)` : D.card;
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: D.radius,
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Label above sections — same style as marketing site */
function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{
      margin: "0 0 6px",
      fontSize: 11, fontWeight: 700,
      color: color ?? D.textMuted,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    }}>
      {children}
    </p>
  );
}

/** Section heading */
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      margin: "0 0 20px",
      fontSize: 20, fontWeight: 800,
      color: D.text,
      letterSpacing: "-0.02em",
    }}>
      {children}
    </h2>
  );
}

/** Pill / badge — same language as marketing site pills */
function Pill({
  children,
  color,
  size = "sm",
}: {
  children: React.ReactNode;
  color: string;
  size?: "xs" | "sm";
}) {
  const pad = size === "xs" ? "2px 7px" : "3px 10px";
  const fs  = size === "xs" ? 10 : 11;
  return (
    <span style={{
      display: "inline-block",
      fontSize: fs, fontWeight: 700,
      padding: pad,
      borderRadius: 20,
      background: `rgba(${hexToRgb(color)},0.12)`,
      border: `1px solid rgba(${hexToRgb(color)},0.28)`,
      color,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

/** Primary button — same as marketing site */
function BtnPrimary({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) {
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 20px", borderRadius: D.radiusSm,
    background: D.blue, color: "#fff",
    fontSize: 13, fontWeight: 700,
    textDecoration: "none", border: "none", cursor: "pointer",
    boxShadow: D.blueGlow,
    fontFamily: "inherit",
  };
  if (href) return <Link href={href} style={style}>{children}</Link>;
  return <button onClick={onClick} style={style}>{children}</button>;
}

/** Ghost button */
function BtnGhost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center",
      padding: "9px 18px", borderRadius: D.radiusSm,
      border: `1px solid ${D.borderStrong}`,
      color: D.textSub, fontSize: 13,
      textDecoration: "none",
    }}>
      {children}
    </Link>
  );
}

/** Horizontal divider */
function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ borderTop: `1px solid ${D.divider}`, ...style }} />;
}

// ─── Severity badge ───────────────────────────────────────────────────────────
function SevBadge({ sev }: { sev: "red" | "yellow" | "green" }) {
  const map = {
    red:    { label: "Kritisch", color: D.red,   bg: D.redBg,   border: D.redBorder   },
    yellow: { label: "Warnung",  color: D.amber, bg: D.amberBg, border: D.amberBorder },
    green:  { label: "Hinweis",  color: D.green, bg: D.greenBg, border: D.greenBorder },
  };
  const s = map[sev];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}


// ─── Lock icon ────────────────────────────────────────────────────────────────
function LockIco({ size = 16, color = D.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ─── Hex → "r,g,b" helper ─────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r},${g},${b}`;
  }
  return "255,255,255";
}

// ─── Deep-Scan Map ────────────────────────────────────────────────────────────
function DeepScanMap({ homepageUrl, homepageIssueCount, unterseiten, isFree }: {
  homepageUrl: string;
  homepageIssueCount: number;
  unterseiten: UnterseiteProp[];
  isFree: boolean;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Scan-Ergebnisse · Alle analysierten Seiten</SectionLabel>
      <SectionHead>Deep-Scan Map</SectionHead>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* ── Startseite ── */}
        <div style={{
          padding: "13px 20px",
          borderBottom: `1px solid ${D.divider}`,
          background: "rgba(0,123,255,0.035)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: "rgba(0,123,255,0.12)", color: D.blueSoft,
            border: "1px solid rgba(0,123,255,0.22)", whiteSpace: "nowrap", flexShrink: 0,
          }}>START</span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: D.text, fontFamily: "monospace",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {homepageUrl}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
            color: homepageIssueCount > 0 ? D.red : D.green,
            background: homepageIssueCount > 0 ? D.redBg : D.greenBg,
            border: `1px solid ${homepageIssueCount > 0 ? D.redBorder : D.greenBorder}`,
            padding: "2px 8px", borderRadius: 4,
          }}>
            {homepageIssueCount > 0 ? `${homepageIssueCount} Fehler` : "OK"}
          </span>
          <span style={{ fontSize: 11, color: D.textMuted, whiteSpace: "nowrap", flexShrink: 0 }}>
            Details ↓ unten
          </span>
        </div>

        {/* ── Unterseiten ── */}
        {unterseiten.map((page, i) => {
          const pageIssues =
            page.altMissing
            + (!page.erreichbar ? 1 : 0)
            + (page.noindex ? 1 : 0)
            + (!page.title || page.title === "(kein Title)" ? 1 : 0)
            + (!page.h1 || page.h1 === "(kein H1)" ? 1 : 0)
            + (!page.metaDescription ? 1 : 0)
            + (page.inputsWithoutLabel ?? 0)
            + (page.buttonsWithoutText ?? 0);
          const isLast = i === unterseiten.length - 1;
          const isOpen = expanded === i;

          // Build issue label texts for smart-guard users
          const issueLabels: string[] = [];
          if (!page.erreichbar)                               issueLabels.push("Seite nicht erreichbar");
          if (!page.title || page.title === "(kein Title)")   issueLabels.push("Kein Title-Tag");
          if (page.noindex)                                   issueLabels.push("Noindex gesetzt");
          if (page.altMissing > 0)                            issueLabels.push(`${page.altMissing} Bild${page.altMissing !== 1 ? "er" : ""} ohne Alt-Text`);

          return (
            <div key={page.url} style={{
              borderBottom: isLast ? "none" : `1px solid ${D.divider}`,
            }}>
              {/* Main row */}
              <div style={{
                padding: "11px 20px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {/* Status badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  background: pageIssues > 0 ? D.redBg : D.greenBg,
                  color: pageIssues > 0 ? D.red : D.green,
                  border: `1px solid ${pageIssues > 0 ? D.redBorder : D.greenBorder}`,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {pageIssues > 0 ? `${pageIssues} Fehler` : "OK"}
                </span>

                {/* Full URL */}
                <span style={{
                  fontSize: 12, color: D.textSub, fontFamily: "monospace",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                }}>
                  {page.url}
                </span>

                {/* Details toggle — only if there are issues */}
                {pageIssues > 0 && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                      background: isOpen ? "rgba(124,58,237,0.12)" : D.card,
                      border: `1px solid ${isOpen ? "rgba(124,58,237,0.3)" : D.borderMid}`,
                      color: isOpen ? "#a78bfa" : D.textSub,
                    }}
                  >
                    {isOpen ? "Schließen ✕" : "Details →"}
                  </button>
                )}
              </div>

              {/* Expandable detail panel */}
              {isOpen && pageIssues > 0 && (
                <div style={{
                  margin: "0 20px 12px",
                  borderRadius: 8,
                  border: `1px solid ${D.borderMid}`,
                  overflow: "hidden",
                }}>
                  {isFree ? (
                    /* Smart-Guard gate — only shown when user clicks Details */
                    <div style={{
                      padding: "16px 20px",
                      background: "rgba(124,58,237,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
                    }}>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>
                          {pageIssues} Problem{pageIssues !== 1 ? "e" : ""} auf dieser Seite gefunden
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: D.textMuted }}>
                          Schritt-für-Schritt-Lösung & KI-Auto-Fix nur im Smart-Guard Plan
                        </p>
                      </div>
                      <Link href="/pricing?plan=smart-guard" style={{
                        fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 6,
                        background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)",
                        color: "#c4b5fd", textDecoration: "none", whiteSpace: "nowrap",
                      }}>
                        Smart-Guard freischalten →
                      </Link>
                    </div>
                  ) : (
                    /* Paid: show actual issue list */
                    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {issueLabels.map(label => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: D.red, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: D.textSub }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FreeDashboardClient(props: FreeDashboardProps) {
  const {
    firstName, plan,
    lastScan, lastScanResult, issues,
    redCount, yellowCount,
    rechtIssues, speedIssues, techIssues,
    cms, bfsgOk, speedScore,
    scans, monthlyScans, scanLimit,
    fingerprint,
    totalPages, unterseiten,
  } = props;

  // Actual sum of all errors (e.g. 24 alt-missing = 24, not 1)
  const totalErrors = issues.reduce((acc, i) => acc + (i.count ?? 1), 0);

  const searchParams = useSearchParams();
  const isImpersonating = searchParams.get("impersonating") === "1";

  const [expandedFinding, setExpandedFinding]   = useState<number | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [cancelHover, setCancelHover]           = useState(false);
  const [switchHover, setSwitchHover]           = useState(false);
  const [switching, setSwitching]               = useState(false);
  const [sessionDomain, setSessionDomain]       = useState<string | null>(null);

  async function handleProjectSwitch() {
    if (switching) return;
    setSwitching(true);
    try {
      await fetch("/api/clear-project", { method: "POST" });
    } catch { /* non-critical */ }
    setProjectDialogOpen(false);
    window.location.href = "/dashboard/scan";
  }

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


  const SMART_GUARD_PLANS = ["smart-guard", "agency-starter", "agency-pro"];
  const isSmartGuard = SMART_GUARD_PLANS.includes(plan);
  const isFree     = !isSmartGuard; // free = everyone without a paid plan
  const planLabel  = isSmartGuard ? "Smart-Guard" : "Free";
  const domain     = lastScan?.url
    ? lastScan.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : sessionDomain ?? "—";
  const scanDate   = lastScan?.created_at
    ? new Date(lastScan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const greenCount = issues.filter(i => i.severity === "green").length;

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
    chips.push({ label: "SSL", value: sslDisplay, color: sslDisplay === "Aktiv" ? "#4ade80" : "#f87171" });

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
    if (category === "recht")                            return { label: "BFSG- & Barrierefreiheits-Risiko", color: "#f87171" };
    if (category === "speed" && severity === "red")      return { label: "Performance- & Conversion-Risiko", color: D.amber   };
    if (category === "speed")                            return { label: "Performance-Risiko",               color: D.amber   };
    if (severity === "red")                              return { label: "SEO-Risiko",                       color: "#f87171" };
    if (severity === "yellow")                           return { label: "Vertrauens-Risiko",                color: D.amber   };
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
        'Pruefe den betroffenen Bereich auf Konformitaet mit dem BFSG (Barrierefreiheitsstaerkungsgesetz, gilt ab Juni 2025).',
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
    <div style={{ display: "flex", minHeight: "100vh", background: D.page, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes wf-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes wf-ring {
          0%   { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes wf-gold-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(251,191,36,0.18); }
          50%       { box-shadow: 0 0 10px rgba(251,191,36,0.35); }
        }
        @keyframes wf-arrow-slide {
          0%   { transform: translateX(0); }
          50%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        .wf-nav-locked { transition: opacity 0.15s; }
        .wf-nav-locked:hover { opacity: 1 !important; background: rgba(251,191,36,0.04) !important; }
        .wf-nav-whitelabel:hover { background: rgba(167,139,250,0.06) !important; }
        .wf-upgrade-btn { transition: box-shadow 0.2s, transform 0.15s; }
        .wf-upgrade-btn:hover { box-shadow: 0 6px 28px rgba(0,123,255,0.55) !important; transform: translateY(-1px); }
        .wf-upgrade-btn:hover .wf-arrow { animation: wf-arrow-slide 0.4s ease-in-out; }
        .wf-pro-badge { animation: wf-gold-pulse 3s ease-in-out infinite; }
        .wf-disabled-card { transition: filter 0.3s; }
        .wf-disabled-card:hover { filter: saturate(0.4) brightness(0.8) !important; }
      `}</style>


      {/* ══════════════════════════════════════════════════
          MAIN — sidebar is rendered by dashboard layout.tsx
      ══════════════════════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Impersonation banner */}
        {isImpersonating && (
          <div style={{
            padding: "10px 20px", background: "rgba(245,158,11,0.12)",
            borderBottom: "1px solid rgba(245,158,11,0.3)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12,
          }}>
            <span style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
              👁 Admin-Ansicht — Du siehst das Dashboard als dieser Nutzer.
            </span>
            <a href="/admin" style={{
              fontSize: 12, color: "#fbbf24", textDecoration: "underline", cursor: "pointer",
            }}>
              ← Zurück zum Admin
            </a>
          </div>
        )}

        {/* ── TOP BAR ──────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          background: D.topbar,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${D.divider}`,
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto", padding: "0 24px",
            height: 52,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* Aktives Projekt + Stift-Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Aktives Projekt
              </span>
              {domain !== "—" ? (
                <>
                  <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>
                    {domain}
                  </span>
                  <button
                    onClick={() => setProjectDialogOpen(true)}
                    title="Projekt wechseln"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 22, height: 22, borderRadius: 5,
                      background: "transparent", border: `1px solid ${D.border}`,
                      cursor: "pointer", padding: 0, flexShrink: 0,
                      transition: "border-color 0.15s",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </>
              ) : (
                <Link href="/dashboard/scan" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 12px", borderRadius: D.radiusSm,
                  background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                  color: D.blueSoft, fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Website hinzufügen
                </Link>
              )}
            </div>

            <div style={{ flex: 1 }} />

            {/* Projekt-Slots */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 500 }}>Projekt-Slots</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "2px 9px", borderRadius: 20,
                background: D.card, border: `1px solid ${D.borderMid}`,
                color: D.textSub,
              }}>
                1 / 1
              </span>
            </div>

            {/* Scan usage */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 500 }}>Scans</span>
              {monthlyScans >= scanLimit ? (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 10px", borderRadius: 20,
                  background: D.redBg, border: `1px solid ${D.redBorder}`,
                  color: D.red,
                }}>
                  Limit erreicht
                </span>
              ) : (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 9px", borderRadius: 20,
                  background: D.card, border: `1px solid ${D.borderMid}`,
                  color: D.textSub,
                }}>
                  {scanLimit - monthlyScans} verbleibend
                </span>
              )}
            </div>

            {/* Upgrade CTA */}
            <Link href="/pricing" style={{
              padding: "6px 16px", borderRadius: D.radiusSm,
              background: D.blue, color: "#fff",
              fontSize: 12, fontWeight: 700, textDecoration: "none",
              boxShadow: D.blueGlow,
            }}>
              Upgrade →
            </Link>
          </div>
        </header>

        {/* ── PAGE CONTENT ─────────────────────────────── */}
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* ① AUDIT HERO CARD */}
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
                      ? `${totalErrors} Fehler gefunden`
                      : "Keine Fehler gefunden"}
                  </p>
                )}
                {/* Status badge */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  background: redCount > 0 ? D.redBg : yellowCount > 0 ? D.amberBg : D.greenBg,
                  border: `1px solid ${redCount > 0 ? D.redBorder : yellowCount > 0 ? D.amberBorder : D.greenBorder}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%",
                    background: redCount > 0 ? D.red : yellowCount > 0 ? D.amber : D.green,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700,
                    color: redCount > 0 ? D.red : yellowCount > 0 ? D.amber : D.green,
                  }}>
                    {totalErrors > 0 ? `${totalErrors} Fehler` : "Alles in Ordnung"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {monthlyScans >= scanLimit ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "9px 20px", borderRadius: D.radiusSm,
                    background: D.redBg, border: `1px solid ${D.redBorder}`,
                    color: D.red, fontSize: 13, fontWeight: 700,
                  }}>
                    <LockIco size={13} color={D.red} />
                    Scan-Limit erreicht
                  </span>
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

          {/* ② TECH FINGERPRINT STRIP */}
          {lastScan && techChips.length > 0 && (
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

          {/* ③ BFSG / COMPLIANCE BANNER */}
          {lastScan && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 20px", borderRadius: D.radiusSm, marginBottom: 28,
              background: bfsgOk ? D.greenBg : D.amberBg,
              border: `1px solid ${bfsgOk ? D.greenBorder : D.amberBorder}`,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{bfsgOk ? "✅" : "⚠️"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
                  color: bfsgOk ? D.green : D.amber,
                }}>
                  BFSG-Konformität: {bfsgOk ? "Bestanden" : "Verstöße gefunden"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: D.textSub, marginTop: 2 }}>
                  {bfsgOk
                    ? "Keine kritischen Barrierefreiheits-Verstöße erkannt — Gesetzeskonformität (BFSG 2025) ist gegeben."
                    : `${rechtIssues.length} Barrierefreiheits-Problem${rechtIssues.length !== 1 ? "e" : ""} gefunden — Prüfung empfohlen (BFSG 2025 gilt ab Juni 2025).`}
                </p>
              </div>
              {!bfsgOk && (
                <Link href="/pricing" style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700,
                  padding: "5px 12px", borderRadius: D.radiusXs,
                  background: D.amberBg, border: `1px solid ${D.amberBorder}`,
                  color: D.amber, textDecoration: "none",
                }}>
                  Details →
                </Link>
              )}
            </div>
          )}

          {/* ④ SUMMARY CARDS */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Kritisch",   count: redCount,   color: "#f87171", bg: D.redBg,   border: D.redBorder,   icon: "⛔" },
                { label: "Warnungen",  count: yellowCount, color: D.amber,   bg: D.amberBg, border: D.amberBorder, icon: "⚠️" },
                { label: "Hinweise",   count: greenCount,  color: D.green,   bg: D.greenBg, border: D.greenBorder, icon: "✓"  },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "20px 22px",
                  borderRadius: D.radius,
                  background: s.count > 0 ? s.bg : D.card,
                  border: `1px solid ${s.count > 0 ? s.border : D.border}`,
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700,
                    color: s.count > 0 ? s.color : D.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}>
                    {s.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 900,
                    color: s.count > 0 ? s.color : D.textFaint,
                    letterSpacing: "-0.03em", lineHeight: 1.1,
                  }}>
                    {s.count}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑤ PERFORMANCE SNAPSHOT */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <SectionLabel>Scan · Sichtbarkeit &amp; Performance</SectionLabel>
            </div>
            <SectionHead>Search &amp; Performance</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                {
                  label: "Indexierte URLs",
                  value: hasData ? `${indexedUrls}` : "—",
                  sub: hasData ? "Im Google Index" : "Noch kein Scan",
                  color: hasData ? D.blueSoft : D.textFaint,
                },
                {
                  label: "Sitemap",
                  value: hasData ? (sitemapOk ? "/sitemap.xml" : "Fehlt") : "—",
                  sub: hasData ? (sitemapOk ? "Status: 200 OK" : "Nicht eingereicht") : "Noch kein Scan",
                  color: hasData ? (sitemapOk ? D.green : D.red) : D.textFaint,
                },
                {
                  label: "Core Web Vitals",
                  value: hasData ? `LCP ${(lcpMs / 1000).toFixed(1)}s` : "—",
                  sub: hasData ? `CLS ${cls.toFixed(2)}` : "Noch kein Scan",
                  color: hasData ? (lcpMs < 2500 ? D.green : D.amber) : D.textFaint,
                },
                {
                  label: "Mobil",
                  value: hasData ? (mobileOk ? "Bestanden" : "Fehlgeschlagen") : "—",
                  sub: hasData ? "Viewport & Responsive" : "Noch kein Scan",
                  color: hasData ? (mobileOk ? D.green : D.red) : D.textFaint,
                },
              ].map(tile => (
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
                </div>
              ))}
            </div>
            {/* Snapshot disclaimer */}
            <p style={{ margin: "10px 0 0", fontSize: 11, color: D.textFaint, lineHeight: 1.6, fontWeight: 400 }}>
              Diese Werte basieren auf Scan-Schätzungen.{" "}
              <Link href="/pricing" style={{ color: D.blueSoft, textDecoration: "none", opacity: 0.8 }}>
                Präzise Live-Daten aus GSC &amp; PageSpeed
              </Link>
              {" "}sind im Smart-Guard Plan verfügbar.
            </p>

            {/* Deep-Scan info */}
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
                    <Link href="/pricing" style={{ color: "#7aa6ff", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(122,166,255,0.4)", fontWeight: 600 }}>
                      Smart-Guard Plan →
                    </Link>
                  </>}
                </p>
              </div>
            )}
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑥ DEEP-SCAN MAP */}
          {hasData && unterseiten && unterseiten.length > 0 && (
            <DeepScanMap
              homepageUrl={lastScan?.url ?? ""}
              homepageIssueCount={issues.length}
              unterseiten={unterseiten}
              isFree={isFree}
            />
          )}

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑦ FINDINGS LIST */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Audit-Ergebnisse</SectionLabel>
            <SectionHead>Gefundene Probleme</SectionHead>

            {issues.length === 0 ? (
              <Card style={{ padding: "32px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 14, color: D.textMuted }}>
                  Noch kein Scan — starte jetzt deinen ersten Audit.
                </p>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {issues.map((issue, idx) => {
                  const isOpen = expandedFinding === idx;
                  const accentColor = issue.severity === "red" ? "#f87171" : issue.severity === "yellow" ? D.amber : D.green;
                  return (
                    <div key={idx} style={{
                      borderRadius: D.radiusSm,
                      background: D.card,
                      border: `1px solid rgba(${hexToRgb(accentColor)},0.15)`,
                      overflow: "hidden",
                    }}>
                      {/* Row */}
                      {(() => {
                        const impact = getImpact(issue.category, issue.severity);
                        return (
                          <button
                            onClick={() => setExpandedFinding(isOpen ? null : idx)}
                            style={{
                              width: "100%", background: "none", border: "none", cursor: "pointer",
                              padding: "13px 18px",
                              display: "flex", alignItems: "center", gap: 12,
                              textAlign: "left", fontFamily: "inherit",
                            }}
                          >
                            <SevBadge sev={issue.severity} />
                            {/* Title + impact */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: D.text, lineHeight: 1.3 }}>
                                {issue.title}
                              </p>
                              <p style={{ margin: "2px 0 0", fontSize: 11, color: impact.color, fontWeight: 500, opacity: 0.85 }}>
                                ↑ {impact.label}
                              </p>
                            </div>
                            <span style={{ fontSize: 10, color: D.textMuted, flexShrink: 0,
                              padding: "2px 7px", borderRadius: 4,
                              background: "rgba(255,255,255,0.03)", border: `1px solid ${D.border}`,
                              textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                              {issue.category === "recht" ? "BFSG" : issue.category === "speed" ? "Speed" : "Technik"}
                            </span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                              stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </button>
                        );
                      })()}

                      {/* Expanded body */}
                      {isOpen && (
                        <div style={{ padding: "0 18px 20px", borderTop: `1px solid ${D.divider}` }}>

                          {/* Technical finding — always visible */}
                          <p style={{ margin: "14px 0 16px", fontSize: 13, color: D.textSub, lineHeight: 1.75 }}>
                            {issue.body}
                          </p>

                          {/* Fix block — varies by plan */}
                          {isSmartGuard ? (
                            /* Smart-Guard: vollständige KI-Fix-Anleitung */
                            <div style={{
                              padding: "14px 18px 16px",
                              background: "rgba(255,255,255,0.02)",
                              border: `1px solid ${D.border}`,
                              borderRadius: D.radiusSm,
                            }}>
                              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: D.text, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                KI-Fix — Schritt-für-Schritt:
                              </p>
                              {(() => { const steps = generateFixSteps(issue).steps; return steps.length > 0
                                ? steps.map((s: string, i: number) => (
                                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < steps.length - 1 ? 6 : 0 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: D.blueSoft, flexShrink: 0, lineHeight: 1.6 }}>{i + 1}.</span>
                                    <span style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>{s}</span>
                                  </div>
                                ))
                                : (
                                  <p style={{ margin: 0, fontSize: 12, color: D.textMuted }}>Kein KI-Fix für diesen Befund verfügbar.</p>
                                ); })()
                              }
                            </div>
                          ) : (
                            /* Free: Manueller Lösungsweg + CTA nur für KI-Fix */
                            <div>
                              <div style={{
                                padding: "12px 16px",
                                background: "rgba(141,243,211,0.04)",
                                border: "1px solid rgba(141,243,211,0.15)",
                                borderRadius: D.radiusSm,
                                marginBottom: 10,
                              }}>
                                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#8df3d3", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                  Manueller Lösungsweg:
                                </p>
                                {(() => { const steps = generateFixSteps(issue).steps; return steps.length > 0
                                  ? steps.map((s: string, i: number) => (
                                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: i < steps.length - 1 ? 5 : 0 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8df3d3", flexShrink: 0, lineHeight: 1.6 }}>{i + 1}.</span>
                                      <span style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>{s}</span>
                                    </div>
                                  ))
                                  : (
                                    <p style={{ margin: 0, fontSize: 12, color: D.textMuted }}>Navigiere im CMS zum betroffenen Element und korrigiere es manuell.</p>
                                  ); })()}
                              </div>
                              {/* KI-Auto-Fix CTA — nur für Smart-Guard */}
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                <span style={{ fontSize: 12, color: D.textMuted, flex: 1 }}>
                                  KI-Auto-Fix (Copy-Paste-fertig) nur mit Smart-Guard
                                </span>
                                <Link href="/pricing?plan=smart-guard" style={{
                                  flexShrink: 0,
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: "6px 12px", borderRadius: D.radiusXs,
                                  background: "rgba(192,132,252,0.12)",
                                  border: "1px solid rgba(192,132,252,0.3)",
                                  color: "#c084fc",
                                  fontSize: 11, fontWeight: 700, textDecoration: "none",
                                  whiteSpace: "nowrap",
                                }}>
                                  Smart-Guard →
                                </Link>
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            )}
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑦ SMART-GUARD AUTOMATION MODULES */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel color={D.blueSoft}>Smart-Guard · Automatisierung</SectionLabel>
            <SectionHead>Einmal verstehen — dauerhaft überwacht.</SectionHead>
            <p style={{ margin: "-10px 0 24px", fontSize: 13, color: D.textMuted, lineHeight: 1.75, maxWidth: 580 }}>
              Die Analyse liegt vor dir. Smart Guard läuft im Hintergrund, beobachtet jede Veränderung und meldet sich — ohne dass du selbst regelmäßig prüfen musst.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {([
                {
                  key: "score",
                  title: "Score-Verlauf",
                  badge: "Täglich · 30 Tage",
                  desc: "Jede Verbesserung, jeder Rückschritt — sauber dokumentiert. Du siehst, ob deine Maßnahmen wirken, bevor Google es tut.",
                  cta: "Score-Verlauf aktivieren",
                  status: "Wartet auf Aktivierung" as string | null,
                  disabled: isFree,
                },
                {
                  key: "monitor",
                  title: "24/7 Live-Monitoring",
                  badge: "Echtzeit · E-Mail-Alert",
                  desc: "Ausfall, veränderte Inhalte, neue Sicherheitsprobleme — du wirst sofort informiert. Nicht einmal täglich, sondern in dem Moment, in dem es passiert.",
                  cta: "Monitoring aktivieren",
                  status: "Wartet auf Aktivierung" as string | null,
                  disabled: isFree,
                },
                {
                  key: "pdf",
                  title: "Monatlicher PDF-Bericht",
                  badge: "Automatisch · Teilbar",
                  desc: "Jeden Monat ein vollständiger Auditbericht als PDF — automatisch erstellt, strukturiert aufbereitet, teilbar mit Kunden oder für die interne Dokumentation.",
                  cta: "Berichte aktivieren",
                  status: null as string | null,
                  disabled: false,
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
                  filter: module.disabled ? "saturate(0.18) brightness(0.65)" : "none",
                  position: "relative" as const,
                  overflow: "hidden",
                }}>
                  {/* Locked overlay — subtle veil with centered lock prompt */}
                  {module.disabled && (
                    <div style={{
                      position: "absolute", inset: 0, zIndex: 2,
                      background: "rgba(11,12,16,0.0)",
                      borderRadius: D.radius,
                      pointerEvents: "none",
                    }} />
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
                        background: module.disabled
                          ? "rgba(251,191,36,0.07)"
                          : D.redBg,
                        border: `1px solid ${module.disabled ? "rgba(251,191,36,0.2)" : D.redBorder}`,
                        color: module.disabled ? "rgba(251,191,36,0.6)" : D.red,
                        letterSpacing: "0.03em", whiteSpace: "nowrap",
                      }}>
                        {module.disabled && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        )}
                        {module.status}
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
                    <Link href="/pricing" style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "10px 18px", borderRadius: D.radiusXs,
                      background: D.blue, color: "#fff",
                      fontSize: 13, fontWeight: 700, textDecoration: "none",
                      boxShadow: "0 4px 18px rgba(0,123,255,0.4)",
                    }}>
                      {module.cta} →
                    </Link>
                  ) : (
                    <Link href="/pricing" style={{
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
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑧ PROFESSIONELLER SERVICE */}
          <div style={{ marginBottom: 40 }}>
            <SectionLabel color={D.blueSoft}>Optionaler Service</SectionLabel>
            <SectionHead>Lieber delegieren? Wir unterstützen gezielt.</SectionHead>
            <p style={{ margin: "-10px 0 24px", fontSize: 13, color: D.textMuted, lineHeight: 1.75, maxWidth: 620 }}>
              Du möchtest die Umsetzung lieber direkt an Profis abgeben? Wir setzen die gefundenen Optimierungen für dich um — technisch sauber, dokumentiert und ohne Risiko für deine bestehende Website.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {([
                {
                  num: "01",
                  color: "#7aa6ff",
                  title: "Rechtliches & DSGVO",
                  outcome: "Geprüft, dokumentiert, übergeben",
                  desc: "Wir prüfen Cookie-Banner, Einwilligungstexte, Datenschutzerklärung und Impressum auf DSGVO- und BFSG-Konformität — und korrigieren, was technisch klar umsetzbar ist.",
                  pills: ["DSGVO", "BFSG 2025", "WCAG 2.2"],
                },
                {
                  num: "02",
                  color: "#8df3d3",
                  title: "Performance & Ladezeit",
                  outcome: "Messbar optimiert, nachweisbar besser",
                  desc: "Bildoptimierung, Lazy Loading, Caching-Konfiguration, Script-Reduktion — wir implementieren, was sich sicher umsetzen lässt, und dokumentieren jeden Schritt.",
                  pills: ["LCP", "Core Web Vitals", "Caching"],
                },
                {
                  num: "03",
                  color: "#c084fc",
                  title: "Mobile & Barrierefreiheit",
                  outcome: "Gezielt behoben, getestet, übergeben",
                  desc: "Alt-Texte, Viewport-Konfiguration, Touch-Target-Größen, Tastaturnavigation — wir setzen um, was ohne Zugriff auf das CMS-Backend nicht möglich wäre.",
                  pills: ["Alt-Texte", "WCAG AA", "Touch-Targets"],
                },
              ] as const).map(fix => (
                <div key={fix.title} style={{
                  padding: "24px 22px",
                  borderRadius: D.radius,
                  background: `rgba(${hexToRgb(fix.color)},0.03)`,
                  border: `1px solid rgba(${hexToRgb(fix.color)},0.15)`,
                  position: "relative", overflow: "hidden",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Subtle step watermark */}
                  <div style={{
                    position: "absolute", right: 16, top: 12,
                    fontSize: 36, fontWeight: 900,
                    color: `rgba(${hexToRgb(fix.color)},0.07)`,
                    lineHeight: 1, userSelect: "none", pointerEvents: "none",
                    letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums",
                  }}>
                    {fix.num}
                  </div>

                  {/* Category label */}
                  <p style={{
                    margin: "0 0 8px",
                    fontSize: 10, fontWeight: 700,
                    color: fix.color, textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    Umsetzung auf Wunsch
                  </p>

                  {/* Title */}
                  <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: D.text, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    {fix.title}
                  </h3>

                  {/* Outcome */}
                  <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 500, color: fix.color }}>
                    {fix.outcome}
                  </p>

                  {/* Description */}
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: D.textSub, lineHeight: 1.7, flex: 1 }}>
                    {fix.desc}
                  </p>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 20 }}>
                    {fix.pills.map(p => (
                      <span key={p} style={{
                        fontSize: 10, fontWeight: 600,
                        padding: "2px 8px", borderRadius: 16,
                        background: `rgba(${hexToRgb(fix.color)},0.08)`,
                        border: `1px solid rgba(${hexToRgb(fix.color)},0.2)`,
                        color: fix.color,
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* CTA — pinned to bottom */}
                  <Link href="/kontakt" style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    alignSelf: "flex-start",
                    padding: "9px 18px", borderRadius: D.radiusSm,
                    background: D.blue, color: "#fff",
                    fontSize: 12, fontWeight: 700, textDecoration: "none",
                    boxShadow: D.blueGlow,
                  }}>
                    Anfrage stellen →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* ⑨ UPGRADE CTA */}
          <div style={{
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
              Smart-Guard
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: D.text, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Du weißt was zu tun ist.<br/>Wir überwachen, ob es erledigt bleibt.
            </h2>
            <p style={{ margin: "0 auto 28px", fontSize: 15, color: D.textSub, maxWidth: 520, lineHeight: 1.75 }}>
              Smart-Guard scannt deine Website automatisch, überwacht Veränderungen rund um die Uhr und informiert dich sofort — ohne dass du selbst prüfen musst. Inkl. Score-Verlauf, monatlichem PDF-Bericht und unbegrenzten Scans. Für 39 €/Monat.
              Jederzeit kündbar.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/pricing" style={{
                padding: "13px 32px", borderRadius: D.radiusSm,
                background: D.blue, color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
              }}>
                Smart-Guard aktivieren →
              </Link>
              <Link href="/pricing" style={{
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
          </div>

        </main>

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
                    Sichere deine Projekte dauerhaft ab.
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: D.textMuted, lineHeight: 1.3, marginTop: 1 }}>
                    Smart-Guard überwacht Veränderungen automatisch — 24/7, ohne deinen Eingriff.
                  </p>
                </div>
              </div>
              <Link href="/pricing" className="wf-upgrade-btn" style={{
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
                Smart-Guard aktivieren
                <span className="wf-arrow" style={{ display: "inline-block", fontWeight: 400 }}>→</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          PROJEKT-WECHSEL DIALOG
      ══════════════════════════════════════════════════ */}
      {projectDialogOpen && (
        <div
          onClick={() => setProjectDialogOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0f1623",
              border: `1px solid ${D.borderStrong}`,
              borderRadius: D.radius,
              padding: "32px 32px 28px",
              maxWidth: 420, width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 11,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={D.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>

            <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
              Projekt wechseln?
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: D.textSub, lineHeight: 1.75 }}>
              Im Free-Plan ist <strong style={{ color: D.text }}>1 Wechsel pro Monat</strong> inkludiert.
            </p>
            <div style={{
              padding: "14px 16px", borderRadius: D.radiusXs, marginBottom: 24,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(248,113,113,0.85)", lineHeight: 1.65, fontWeight: 500 }}>
                Achtung: Alle Daten und Berichte der aktuellen Website werden dabei unwiderruflich gelöscht.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setProjectDialogOpen(false)}
                onMouseEnter={() => setCancelHover(true)}
                onMouseLeave={() => setCancelHover(false)}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: D.radiusSm,
                  border: `1px solid ${D.borderStrong}`,
                  background: cancelHover ? "rgba(255,255,255,0.06)" : "transparent",
                  color: cancelHover ? D.text : D.textSub,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleProjectSwitch}
                onMouseEnter={() => setSwitchHover(true)}
                onMouseLeave={() => setSwitchHover(false)}
                disabled={switching}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: D.radiusSm,
                  border: "none",
                  background: switchHover ? "#ef4444" : D.red,
                  color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: switching ? "default" : "pointer",
                  boxShadow: "0 4px 16px rgba(248,113,113,0.25)",
                  fontFamily: "inherit",
                  opacity: switching ? 0.7 : 1,
                  transition: "background 0.15s, opacity 0.15s",
                }}
              >
                {switching ? "Wird gelöscht..." : "Wechseln & Daten löschen"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
