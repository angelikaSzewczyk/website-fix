"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = "red" | "yellow" | "green";
type Category = "recht" | "speed" | "technik";

export interface ParsedIssueProp {
  severity: Severity;
  title: string;
  body: string;
  category: Category;
}

export interface ScanBriefProp {
  id: string;
  url: string;
  type: string;
  created_at: string;
  issue_count: number | null;
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
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function Icon({ d, size = 16, stroke = 2 }: { d: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  alert:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  info:     "M12 16v-4M12 8h.01",
  check:    "M20 6 9 17l-5-5",
  lock:     "M7 11V7a5 5 0 0 1 10 0v4M3 11h18v11H3z",
  scan:     "M11 3a8 8 0 1 0 8 8M21 21l-4.35-4.35",
  arrow:    "m9 18 6-6-6-6",
  chevron:  "m6 9 6 6 6-6",
  refresh:  "M23 4v6h-6M1 20v-6h6",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap:      "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  clock:    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l4 2",
  file:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  monitor:  "M2 3h20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm10 17v-3m-4 3h8",
  trending: "M22 7 13.5 15.5 8.5 10.5 2 17",
  wrench:   "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  globe:    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-1.66 2.5-2.5 5-2.5 10s.84 7.5 2.5 10m0-20c1.66 2.5 2.5 5 2.5 10s-.84 7.5-2.5 10M2 12h20",
  mobile:   "M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM12 18h.01",
};

// ─── Fix guide helper ─────────────────────────────────────────────────────────
function getFixGuide(title: string, cms: string): string {
  const t = title.toLowerCase();
  const wp = cms === "WordPress";
  if (/alt.?text|img/.test(t))
    return wp ? "Medien → Bild → Feld 'Alternativer Text' ausfüllen." : "img-Tag um alt='Beschreibung' ergänzen.";
  if (/meta.?desc|beschreibung/.test(t))
    return wp ? "Yoast SEO → Seite bearbeiten → Meta-Beschreibung (150–160 Zeichen)." : "<meta name='description'> im <head> eintragen.";
  if (/h1|überschrift/.test(t))
    return "Jede Seite benötigt genau eine H1-Überschrift, die das Hauptthema beschreibt.";
  if (/ssl|https/.test(t))
    return "SSL über Hosting-Panel aktivieren (Let's Encrypt kostenlos), dann HTTP→HTTPS-Redirect einrichten.";
  if (/sitemap/.test(t))
    return wp ? "Yoast SEO → XML-Sitemaps aktivieren → In Google Search Console einreichen." : "sitemap.xml erstellen und in der Search Console einreichen.";
  if (/cookie|einwilligung/.test(t))
    return "DSGVO-konformes Cookie-Consent-Tool einbinden (Cookiebot). Tracking erst nach Zustimmung laden.";
  if (/impressum/.test(t))
    return "Impressum auf jeder Seite verlinken. Pflichtangaben: Name, Adresse, E-Mail (§ 5 TMG).";
  if (/ladezeit|speed|performance/.test(t))
    return wp ? "WP Rocket installieren, Bilder in WebP, CDN-Setup (Cloudflare kostenlos)." : "Bilder komprimieren, JS/CSS minimieren, CDN einbinden.";
  return "Detaillierte Handlungsempfehlungen im Smart-Guard Plan verfügbar.";
}

// ─── Tech detection ───────────────────────────────────────────────────────────
function detectTechStack(scanText: string, cmsLabel: string) {
  const t = scanText.toLowerCase();
  return {
    cms:       cmsLabel !== "Custom" && cmsLabel !== "–" ? cmsLabel : "WordPress",
    cmsVer:    cmsLabel === "WordPress" ? "6.4.3" : cmsLabel !== "Custom" && cmsLabel !== "–" ? "" : "6.4.3",
    server:    /cloudflare/.test(t) ? "Cloudflare" : /nginx/.test(t) ? "Nginx" : /apache/.test(t) ? "Apache" : "Nginx",
    serverVer: /cloudflare/.test(t) ? "CDN" : "1.24",
    php:       (cmsLabel === "WordPress" || cmsLabel === "Custom" || cmsLabel === "–") ? "8.2" : null,
    ssl:       !/ssl fehlt|kein https/.test(t),
    simCms:    cmsLabel === "Custom" || cmsLabel === "–",
    simServer: !/cloudflare|nginx|apache/.test(t),
  };
}

// ─── Vitals simulation ────────────────────────────────────────────────────────
function getVitals(speedScore: number, issues: ParsedIssueProp[]) {
  const lcpMs     = speedScore >= 70 ? 1200 + (100 - speedScore) * 8 : 2800 + (70 - speedScore) * 18;
  const mobileOk  = !issues.some(i => /mobil|viewport|responsive/.test(i.title.toLowerCase()));
  const sitemapOk = !issues.some(i => /sitemap/.test(i.title.toLowerCase()));
  const indexed   = Math.max(12, 80 - issues.filter(i => /index|robots/.test(i.title.toLowerCase())).length * 5);
  return { lcpMs, mobileOk, sitemapOk, indexed };
}

// ─── Primitive UI pieces ──────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-navy-800 border border-white/[0.06] ${className}`}>
      {children}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1 h-px bg-white/[0.05]" />
      <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.15em]">{label}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function Sev({ sev }: { sev: Severity }) {
  const cfg = {
    red:    { label: "Kritisch",  cls: "bg-red-500/[0.12] text-red-400 border-red-500/20"    },
    yellow: { label: "Warnung",   cls: "bg-amber-500/[0.10] text-amber-400 border-amber-500/20" },
    green:  { label: "Hinweis",   cls: "bg-blue-500/[0.10] text-blue-400 border-blue-500/20"  },
  }[sev];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.cls} shrink-0 uppercase tracking-wide`}>
      {cfg.label}
    </span>
  );
}

// ─── Locked premium block ─────────────────────────────────────────────────────
function LockedBlock({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="opacity-[0.25] blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-navy-900/70 backdrop-blur-[3px] rounded-2xl">
        <div className="w-11 h-11 rounded-xl bg-navy-800 border border-white/[0.08] flex items-center justify-center text-slate-400">
          <Icon d={ICONS.lock} size={18} stroke={1.75} />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5 max-w-[22ch] mx-auto leading-relaxed">{desc}</p>
        </div>
        <Link
          href="/smart-guard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
        >
          Aktivieren <Icon d={ICONS.arrow} size={10} stroke={2.5} />
        </Link>
      </div>
    </div>
  );
}

// ─── Individual finding row ───────────────────────────────────────────────────
function FindingRow({ issue, cms, idx, isFree }: {
  issue: ParsedIssueProp; cms: string; idx: number; isFree: boolean;
}) {
  const [open, setOpen] = useState(false);
  const fix = getFixGuide(issue.title, cms);
  const locked = isFree && issue.category === "recht" && idx >= 2;

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors group"
      >
        <Sev sev={issue.severity} />
        <span className="flex-1 text-sm text-slate-300 truncate group-hover:text-slate-200 transition-colors">
          {issue.title}
        </span>
        <svg
          className={`shrink-0 text-slate-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {issue.body && (
            <p className="text-xs text-slate-400 leading-relaxed">{issue.body}</p>
          )}
          <div className="rounded-xl bg-navy-900 border border-white/[0.05] p-3">
            <p className="text-[10px] font-mono font-semibold text-slate-600 uppercase tracking-wider mb-2">
              KI-Empfehlung · {cms}
            </p>
            {locked ? (
              <div className="flex items-center gap-2.5">
                <Icon d={ICONS.lock} size={14} stroke={1.75} />
                <span className="text-xs text-slate-500">
                  Vollständige Empfehlungen im{" "}
                  <Link href="/smart-guard" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    Smart Guard
                  </Link>
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed">{fix}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function FreeDashboardClient({
  firstName,
  plan,
  lastScan,
  lastScanResult,
  issues,
  redCount,
  yellowCount,
  rechtIssues,
  speedIssues,
  techIssues,
  cms,
  bfsgOk,
  speedScore,
  scans,
  monthlyScans,
  scanLimit,
}: FreeDashboardProps) {
  const isFree   = plan === "free";
  const isSingle = plan === "single";

  const scanText = (lastScanResult ?? "") + " " + (lastScan?.url ?? "");
  const tech     = detectTechStack(scanText, cms.label);
  const vitals   = lastScan ? getVitals(speedScore, issues) : null;

  // Sparkline for isSingle
  const sparkData = scans.slice(0, 7).reverse().map(s => Math.max(10, 100 - (s.issue_count ?? 5) * 8));
  while (sparkData.length < 7) sparkData.unshift(sparkData[0] ?? 72);
  const sparkMax   = Math.max(...sparkData);
  const sparkMin   = Math.min(...sparkData);
  const sparkRange = Math.max(sparkMax - sparkMin, 20);
  const sparkLatest = sparkData[sparkData.length - 1];
  const sparkDelta  = sparkLatest - sparkData[sparkData.length - 2];

  return (
    <div className="min-h-screen bg-navy-900 text-white font-sans antialiased">

      {/* ── Sticky command bar ──────────────────────────────────────── */}
      <div className="sticky top-0 z-30 h-12 flex items-center border-b border-white/[0.05] bg-navy-900/[0.97] backdrop-blur-xl px-5 gap-3">
        {lastScan ? (
          <>
            <span className="font-mono text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] shrink-0">
              TARGET
            </span>
            <span className="font-mono text-sm font-semibold text-slate-200 truncate min-w-0">
              {lastScan.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
          </>
        ) : (
          <span className="text-sm font-medium text-slate-400">WebsiteFix Dashboard</span>
        )}

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {isFree && (
            <span className="font-mono text-[10px] text-slate-600 tabular-nums">
              {monthlyScans}/{scanLimit} Scans
            </span>
          )}
          {isSingle && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Monitoring aktiv
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.07] text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {isFree ? "Free" : "Smart Guard"}
          </span>
          {isFree && (
            <Link
              href="/smart-guard"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────── */}
      <div className="max-w-[880px] mx-auto px-5 pb-24 space-y-4 pt-7">

        {/* ══ NO SCAN STATE ══════════════════════════════════════════ */}
        {!lastScan && (
          <Card className="relative overflow-hidden p-10 text-center">
            {/* ambient glows */}
            <div className="absolute top-0 right-0 w-96 h-48 bg-indigo-600/[0.04] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-40 bg-violet-600/[0.04] rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-indigo-500/[0.1] border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Icon d={ICONS.scan} size={28} stroke={1.75} />
              </div>
              <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">
                Hallo{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-8">
                Starte deinen ersten Website-Audit. In 60 Sekunden siehst du, warum Google dich nicht findet,
                welche Rechtsfehler Abmahnungen riskieren und was Conversions blockiert.
              </p>
              <form action="/dashboard/scan" method="GET"
                className="flex gap-2.5 max-w-lg mx-auto">
                <input
                  name="url" type="url"
                  placeholder="https://deine-website.de" required
                  className="flex-1 px-4 py-2.5 rounded-xl bg-navy-700 border border-white/[0.08]
                             text-sm text-white placeholder-slate-600
                             outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20
                             transition-all"
                />
                <button
                  type="submit"
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm
                             transition-colors shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
                >
                  <Icon d={ICONS.scan} size={14} />
                  Jetzt scannen
                </button>
              </form>
              <p className="mt-5 text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                {scanLimit - monthlyScans} Scans verbleibend · Kein Download · Ergebnis in 60 Sek.
              </p>
            </div>
          </Card>
        )}

        {/* ══ HAS SCAN ═══════════════════════════════════════════════ */}
        {lastScan && (
          <>
            {/* ① SCAN HERO ─────────────────────────────────────────── */}
            <Card className="relative overflow-hidden">
              {/* Background glows */}
              <div className="absolute -top-8 -right-8 w-72 h-72 bg-indigo-600/[0.05] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-56 h-40 bg-violet-600/[0.04] rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-6">
                <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-[0.15em] mb-1.5">
                      Letzter Audit
                    </p>
                    <h1 className="text-xl font-bold text-white tracking-tight truncate">
                      {lastScan.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </h1>
                    <p className="mt-1 text-[11px] font-mono text-slate-500">
                      {new Date(lastScan.created_at).toLocaleDateString("de-DE", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                      {" · "}
                      {new Date(lastScan.created_at).toLocaleTimeString("de-DE", {
                        hour: "2-digit", minute: "2-digit",
                      })} Uhr
                    </p>
                  </div>

                  <div className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                    redCount > 0
                      ? "bg-red-500/[0.1] border-red-500/20 text-red-400"
                      : yellowCount > 0
                      ? "bg-amber-500/[0.1] border-amber-500/20 text-amber-400"
                      : "bg-emerald-500/[0.1] border-emerald-500/20 text-emerald-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      redCount > 0 ? "bg-red-400" : yellowCount > 0 ? "bg-amber-400" : "bg-emerald-400"
                    }`} />
                    {redCount > 0 ? "Handlungsbedarf" : yellowCount > 0 ? "Verbesserungen möglich" : "Keine kritischen Fehler"}
                  </div>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed">
                  {redCount > 0
                    ? `${redCount} kritische Fehler und ${yellowCount} Warnungen erkannt. Sofortige Maßnahmen empfohlen.`
                    : yellowCount > 0
                    ? `Keine kritischen Fehler. ${yellowCount} Verbesserungen erhöhen Sichtbarkeit und Compliance.`
                    : "Glückwunsch — keine kritischen Probleme gefunden."}
                </p>

                <div className="flex items-center gap-3 mt-5 flex-wrap">
                  <Link
                    href={`/dashboard/scans/${lastScan.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl
                               bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08]
                               text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Vollbericht öffnen <Icon d={ICONS.arrow} size={11} stroke={2.5} />
                  </Link>
                  <Link
                    href="/dashboard/scan"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-400 transition-colors rounded-xl"
                  >
                    <Icon d={ICONS.scan} size={12} />
                    Neu scannen
                    {isFree && <span className="text-[10px] font-mono text-slate-600">({scanLimit - monthlyScans} verbleibend)</span>}
                  </Link>
                </div>
              </div>
            </Card>

            {/* ② INFRASTRUKTUR-LEISTE ──────────────────────────────── */}
            <Card className="px-4 py-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em] pr-3 border-r border-white/[0.06] shrink-0">
                  INFRA
                </span>

                {([
                  {
                    cat: "CMS", val: `${tech.cms}${tech.cmsVer ? " " + tech.cmsVer : ""}`,
                    iconBg: "bg-[#21759B]/10", iconText: "#5BA4CF", icon: "W", sim: tech.simCms,
                  },
                  {
                    cat: "Server", val: `${tech.server} ${tech.serverVer}`,
                    iconBg: "bg-emerald-500/10", iconText: "#4ADE80", icon: "S", sim: tech.simServer,
                  },
                  ...(tech.php
                    ? [{ cat: "PHP", val: tech.php, iconBg: "bg-violet-500/10", iconText: "#A78BFA", icon: "P", sim: false }]
                    : []),
                  {
                    cat: "SSL", val: tech.ssl ? "Aktiv" : "Fehlt",
                    iconBg: tech.ssl ? "bg-emerald-500/10" : "bg-red-500/10",
                    iconText: tech.ssl ? "#4ADE80" : "#F87171", icon: tech.ssl ? "✓" : "✗", sim: false,
                  },
                ] as const).map((t, i, arr) => (
                  <div key={t.cat} className="flex items-center gap-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-700 border border-white/[0.05]">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${t.iconBg}`}
                        style={{ color: t.iconText }}
                      >
                        {t.icon}
                      </span>
                      <span className="text-[9px] text-slate-600 font-semibold">{t.cat}</span>
                      <span className="font-mono text-xs font-bold text-slate-300">{t.val}</span>
                      {t.sim && (
                        <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-1">
                          SIM
                        </span>
                      )}
                    </div>
                    {i < arr.length - 1 && (
                      <span className="mx-2 text-slate-700 text-xs">·</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* ③ COMPLIANCE BANNER ─────────────────────────────────── */}
            <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${
              bfsgOk
                ? "bg-emerald-500/[0.05] border-emerald-500/20"
                : "bg-red-500/[0.05] border-red-500/20"
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                bfsgOk ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
              }`}>
                {bfsgOk
                  ? <Icon d={ICONS.check} size={15} stroke={2.5} />
                  : <Icon d={ICONS.alert} size={15} stroke={2} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${bfsgOk ? "text-emerald-400" : "text-red-400"}`}>
                  BFSG 2025 — {bfsgOk ? "Konform" : `${rechtIssues.length} Verstöße erkannt`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bfsgOk
                    ? "Keine kritischen Barrierefreiheits- oder Rechtsfehler gefunden."
                    : `${redCount} kritisch · ${yellowCount} Warnungen · Abmahnrisiko ab 28.06.2025`}
                </p>
              </div>
              {!bfsgOk && (
                <Link
                  href={`/dashboard/scans/${lastScan.id}`}
                  className="shrink-0 px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20
                             text-xs font-bold text-red-400 hover:bg-red-500/[0.15] transition-colors"
                >
                  Details →
                </Link>
              )}
            </div>

            {/* ④ ISSUE COUNT CARDS ─────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Kritische Fehler",
                  count: redCount,
                  icon: ICONS.alert,
                  top:  "bg-red-500",
                  bg:   "bg-red-500/[0.07]",
                  bdr:  "border-red-500/15",
                  txt:  "text-red-400",
                },
                {
                  label: "Warnungen",
                  count: yellowCount,
                  icon: ICONS.alert,
                  top:  "bg-amber-500",
                  bg:   "bg-amber-500/[0.07]",
                  bdr:  "border-amber-500/15",
                  txt:  "text-amber-400",
                },
                {
                  label: "Hinweise",
                  count: issues.filter(i => i.severity === "green").length,
                  icon: ICONS.info,
                  top:  "bg-blue-500",
                  bg:   "bg-blue-500/[0.07]",
                  bdr:  "border-blue-500/15",
                  txt:  "text-blue-400",
                },
              ].map(card => (
                <Card key={card.label} className="overflow-hidden">
                  <div className={`h-[2px] ${card.top}`} />
                  <div className="p-5">
                    <div className={`w-9 h-9 rounded-xl ${card.bg} border ${card.bdr} flex items-center justify-center mb-4 ${card.txt}`}>
                      <Icon d={card.icon} size={16} stroke={2} />
                    </div>
                    <p className={`text-3xl font-bold leading-none mb-1.5 ${card.txt}`}>{card.count}</p>
                    <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* ⑤ SEARCH & PERFORMANCE SNAPSHOT ────────────────────── */}
            {vitals && (
              <Card className="overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.04]">
                  <div className="flex gap-1.5">
                    {["#4285F4", "#EA4335", "#FBBC04", "#34A853"].map(c => (
                      <span key={c} style={{ background: c }} className="w-2 h-2 rounded-full" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-slate-400">Google Search · Performance</p>
                  <span className="ml-auto text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 uppercase tracking-wider">
                    Simuliert
                  </span>
                </div>
                <div className="grid grid-cols-4 divide-x divide-white/[0.04]">
                  {[
                    {
                      cat: "Index",
                      val: `${vitals.indexed} URLs`,
                      sub: "im Google Index",
                      ok: vitals.indexed > 20,
                    },
                    {
                      cat: "Sitemap",
                      val: vitals.sitemapOk ? "Erkannt" : "Fehlt",
                      sub: vitals.sitemapOk ? "/sitemap_index.xml" : "Nicht eingereicht",
                      ok: vitals.sitemapOk,
                    },
                    {
                      cat: "Core Web Vitals",
                      val: `LCP ${(vitals.lcpMs / 1000).toFixed(1)}s`,
                      sub: vitals.lcpMs < 2500 ? "Gut" : "Verbesserungsbedarf",
                      ok: vitals.lcpMs < 2500,
                    },
                    {
                      cat: "Mobile",
                      val: vitals.mobileOk ? "Bestanden" : "Fehlgeschlagen",
                      sub: "Viewport & Responsive",
                      ok: vitals.mobileOk,
                    },
                  ].map(m => (
                    <div key={m.cat} className="px-5 py-5">
                      <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.12em] mb-2 ${
                        m.ok ? "text-emerald-500/50" : "text-red-500/50"
                      }`}>
                        {m.cat}
                      </p>
                      <p className={`font-mono text-sm font-bold leading-none mb-1.5 ${
                        m.ok ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {m.val}
                      </p>
                      <p className="text-[10px] text-slate-600 leading-snug">{m.sub}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ⑥ FINDINGS ──────────────────────────────────────────── */}
            {issues.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-0.5">
                  <h2 className="text-sm font-semibold text-white">Audit-Befunde</h2>
                  <Link
                    href={`/dashboard/scans/${lastScan.id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Vollbericht →
                  </Link>
                </div>

                {[
                  { label: "BFSG / Recht", items: rechtIssues, dot: "bg-red-500",   txt: "text-red-400"   },
                  { label: "Performance",  items: speedIssues, dot: "bg-amber-500", txt: "text-amber-400" },
                  { label: "Technical SEO",items: techIssues,  dot: "bg-blue-500",  txt: "text-blue-400"  },
                ]
                  .filter(g => g.items.length > 0)
                  .map(group => (
                    <Card key={group.label} className="overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.04] bg-navy-700/30">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${group.dot}`} />
                        <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${group.txt}`}>
                          {group.label}
                        </p>
                        <span className="ml-auto text-[10px] font-mono text-slate-600">
                          {group.items.length} Befunde
                        </span>
                      </div>
                      <div>
                        {group.items.slice(0, 4).map((issue, i) => (
                          <FindingRow
                            key={i}
                            issue={issue}
                            cms={cms.label}
                            idx={i}
                            isFree={isFree}
                          />
                        ))}
                        {group.items.length > 4 && (
                          <Link
                            href={`/dashboard/scans/${lastScan.id}`}
                            className="flex items-center justify-center gap-1.5 py-3 text-[10px] font-mono text-slate-600 hover:text-slate-500 border-t border-white/[0.04] transition-colors"
                          >
                            +{group.items.length - 4} weitere im Vollbericht →
                          </Link>
                        )}
                      </div>
                    </Card>
                  ))}
              </div>
            )}

            {/* ⑦ LOCKED PREMIUM ────────────────────────────────────── */}
            <SectionDivider label="Smart Guard Features" />

            <div className="space-y-3">
              {/* Score history */}
              <LockedBlock
                title="Score-Verlauf · 7 Tage"
                desc="Verfolge, wie sich dein Website-Score entwickelt — und reagiere früh auf Rückgänge."
              >
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Score-Verlauf</p>
                    <p className="text-2xl font-bold text-emerald-400">82</p>
                  </div>
                  <svg viewBox="0 0 200 48" className="w-full h-12">
                    <polyline
                      points={[58,62,59,68,72,77,82].map((v, i) => `${i*(200/6)},${48-((v-50)/40)*48}`).join(" ")}
                      fill="none" stroke="#22C55E" strokeWidth="2"
                    />
                  </svg>
                </Card>
              </LockedBlock>

              <div className="grid grid-cols-2 gap-3">
                {/* Live monitoring */}
                <LockedBlock
                  title="24/7 Live-Überwachung"
                  desc="Stündliche Prüfung auf Downtime, SSL-Ablauf und Fehler."
                >
                  <Card className="p-5">
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-4">Monitoring</p>
                    <div className="space-y-2.5">
                      {["Stündliche Prüfung · 1h", "SSL-Ablauf Alarm · 87d", "Downtime-Alert · RT"].map(l => (
                        <div key={l} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-xs text-slate-400">{l}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </LockedBlock>

                {/* PDF report */}
                <LockedBlock
                  title="PDF-Bericht"
                  desc="Professioneller Audit-Bericht mit priorisierten Fixes als PDF."
                >
                  <Card className="p-5">
                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase mb-4">PDF-Export</p>
                    <div className="space-y-2.5">
                      {["Vollständige Befundliste", "Priorisierte Fixes", "Executive Summary"].map(l => (
                        <div key={l} className="flex items-center gap-2">
                          <Icon d={ICONS.check} size={12} stroke={2.5} />
                          <span className="text-xs text-slate-400">{l}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </LockedBlock>
              </div>

              {/* isSingle: show real chart instead of locked */}
              {isSingle && scans.length > 0 && (
                <Card className="p-5 -mt-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">Score-Verlauf · 7 Tage</p>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">LIVE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold text-emerald-400">{sparkLatest}</span>
                      <span className={`font-mono text-xs font-bold ${sparkDelta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {sparkDelta >= 0 ? "↑" : "↓"}{Math.abs(sparkDelta)}
                      </span>
                    </div>
                  </div>
                  <svg viewBox="0 0 480 48" className="w-full h-12 overflow-visible">
                    <defs>
                      <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const pts = sparkData.map((v, i) => ({
                        x: 8 + (i / (sparkData.length - 1)) * 464,
                        y: 6 + (1 - (v - sparkMin) / sparkRange) * 36,
                      }));
                      const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
                      const area = `M${pts[0].x},${pts[0].y} ` + pts.slice(1).map(p => `L${p.x},${p.y}`).join(" ") + ` L${pts[pts.length-1].x},44 L${pts[0].x},44 Z`;
                      return (
                        <>
                          <path d={area} fill="url(#sg)" />
                          <polyline points={line} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          {pts.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="3"
                              fill={i === pts.length - 1 ? "#22C55E" : "#0D1117"}
                              stroke="#22C55E" strokeWidth="1.5" />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </Card>
              )}
            </div>

            {/* ⑧ DONE-FOR-YOU ─────────────────────────────────────── */}
            <SectionDivider label="Professionelle Sofort-Fixes" />

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: ICONS.wrench,
                  title: "Kontaktformular reparieren",
                  desc: "DSGVO-konform, barrierefrei & mit automatischer Antwort",
                  time: "2–3 Werktage",
                  price: "ab 199 €",
                  urgent: false,
                },
                {
                  icon: ICONS.zap,
                  title: "Website beschleunigen",
                  desc: "PageSpeed-Optimierung, WebP-Bilder, CDN-Setup",
                  time: "3–5 Werktage",
                  price: "ab 249 €",
                  urgent: redCount > 0 && speedIssues.length > 0,
                },
                {
                  icon: ICONS.mobile,
                  title: "Mobile Ansicht fixen",
                  desc: "Responsive-Anpassung, Viewport-Korrekturen",
                  time: "2–3 Werktage",
                  price: "ab 179 €",
                  urgent: false,
                },
              ].map(s => (
                <Card key={s.title}
                  className={`flex flex-col p-5 gap-4 transition-colors hover:border-indigo-500/20 group ${
                    s.urgent ? "border-amber-500/20" : ""
                  }`}
                >
                  {s.urgent && (
                    <span className="self-start text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Empfohlen
                    </span>
                  )}
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/15 transition-colors">
                    <Icon d={s.icon} size={16} stroke={1.75} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white leading-snug mb-1.5">
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="space-y-2.5 mt-auto">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-600">{s.time}</span>
                      <span className="text-sm font-bold text-indigo-400">{s.price}</span>
                    </div>
                    <button className="w-full py-2 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/20 text-xs font-bold text-indigo-400 hover:bg-indigo-500/[0.14] hover:border-indigo-500/30 transition-colors">
                      Jetzt beauftragen →
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {/* ⑨ UPGRADE BANNER ───────────────────────────────────── */}
            {isFree && (
              <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/[0.08] via-indigo-600/[0.04] to-violet-600/[0.08] p-6">
                <div className="absolute -top-8 -right-8 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative flex items-center gap-6 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-mono text-[9px] font-bold text-indigo-400 uppercase tracking-[0.15em] mb-1.5">
                      Smart Guard
                    </p>
                    <h3 className="text-base font-bold text-white mb-2 tracking-tight">
                      Automatische Überwachung freischalten
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {["24/7 Monitoring", "Sofort-Alerts", "PDF-Berichte", "Priorisierte Fixes"].map(f => (
                        <span key={f} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Icon d={ICONS.check} size={11} stroke={2.5} />
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">39 €</p>
                      <p className="text-[10px] text-slate-500">/ Monat · kündbar</p>
                    </div>
                    <Link
                      href="/smart-guard"
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-[0_4px_20px_rgba(99,102,241,0.3)]"
                    >
                      Aktivieren →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {isSingle && (
              <p className="text-center text-[10px] font-mono text-slate-700 pb-2">
                <Link href="/fuer-agenturen" className="hover:text-slate-500 transition-colors">
                  Mehrere Websites überwachen? → Agency-Dashboard
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
