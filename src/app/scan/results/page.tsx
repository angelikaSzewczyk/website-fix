"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import BrandLogo from "../../components/BrandLogo";
import MobileNav from "../../components/MobileNav";
import SiteFooter from "../../components/SiteFooter";

// ── Real scan data shape (stored by /scan/page.tsx via sessionStorage) ────────
type StoredScan = {
  url:                  string;
  pages:                number;
  unterseiten:          Array<{ url: string; erreichbar: boolean; altMissing: number; noindex: boolean }>;
  diagnose:             string;
  https:                boolean;
  brokenLinksCount:     number;
  altMissingCount:      number;
  duplicateTitlesCount: number;
  duplicateMetasCount:  number;
  noIndex:              boolean;
  hasTitle:             boolean;
  hasMeta:              boolean;
  hasH1:                boolean;
  hasSitemap:           boolean;
  robotsBlocked:        boolean;
  hasUnreachable:       boolean;
};

// ── Score + derived metrics ───────────────────────────────────────────────────
function computeScore(d: StoredScan): number {
  let s = 100;
  if (!d.https)                    s -= 20;
  if (!d.hasTitle)                 s -= 8;
  if (!d.hasMeta)                  s -= 6;
  if (!d.hasH1)                    s -= 5;
  if (d.robotsBlocked)             s -= 15;
  if (!d.hasSitemap)               s -= 4;
  if (d.brokenLinksCount > 0)      s -= 8;
  if (d.duplicateTitlesCount > 1)  s -= 5;
  if (d.altMissingCount > 5)       s -= 8;
  else if (d.altMissingCount > 0)  s -= 4;
  if (d.hasUnreachable)            s -= 8;
  if (d.noIndex)                   s -= 12;
  return Math.max(15, Math.round(s));
}

function computeCritical(d: StoredScan): number {
  return d.altMissingCount
    + (d.brokenLinksCount)
    + (!d.hasH1 ? 1 : 0)
    + (d.noIndex ? 1 : 0);
}

function liabilityLevel(score: number, crit: number): string {
  if (score < 55 || crit > 8) return "HOCH";
  if (score < 80 || crit > 2) return "MITTEL";
  return "GERING";
}

function liabilityColor(level: string): string {
  if (level === "HOCH")   return "#f59e0b";
  if (level === "MITTEL") return "#fbbf24";
  return "#22c55e";
}

// ── Diagnose parser ───────────────────────────────────────────────────────────
type Finding = { label: string; issue: string; desc: string };

function parseFindings(diagnose: string): Finding[] {
  const findings: Finding[] = [];
  const lines = diagnose.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(/^\*\*((?:🔴|🟡|🟢)[^*]+)\*\*\s+(.*)/);
    if (m) {
      const label = m[1].trim();
      const issue = m[2].trim();
      let desc = "";
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const next = lines[j].trim();
        if (next && !next.startsWith("**") && !next.startsWith("#")) {
          desc = next.slice(0, 220);
          break;
        }
      }
      if (issue) findings.push({ label, issue, desc });
    }
  }
  return findings;
}

// ── Feed/XML filter for display ───────────────────────────────────────────────
const FEED_URL_PATTERN = /\/(feed|feed\/atom|feed\/rss|rss)(\/|$)|\.(xml|txt|json)(\?|#|$)/i;

// ── Build subpage list from real data ─────────────────────────────────────────
function buildPages(d: StoredScan) {
  const base = (() => { try { return new URL(d.url).host; } catch { return d.url; } })();
  const homePath = (() => { try { return new URL(d.url).pathname || "/"; } catch { return "/"; } })();
  const homeErrors = (!d.hasTitle ? 1 : 0) + (!d.hasMeta ? 1 : 0) + (!d.hasH1 ? 1 : 0)
    + (d.altMissingCount > 0 ? Math.min(d.altMissingCount, 3) : 0);
  const items = [
    { path: homePath, errors: homeErrors },
    ...d.unterseiten.filter(p => !FEED_URL_PATTERN.test(p.url)).map(p => {
      let errors = p.altMissing;
      if (!p.erreichbar) errors += 3;
      if (p.noindex)     errors += 1;
      const path = (() => { try { return new URL(p.url).pathname || "/"; } catch { return p.url; } })();
      return { path, errors };
    }),
  ];
  return { base, items };
}

// ── Demo constants ────────────────────────────────────────────────────────────
const DEMO_DOMAIN  = "beispiel-agentur.de";
const DEMO_SCORE   = 64;
const DEMO_PAGES   = 42;
const DEMO_CRIT    = 12;
const DEMO_PAGES_LIST = [
  { path: "/",                    errors: 3 },
  { path: "/leistungen",          errors: 5 },
  { path: "/ueber-uns",           errors: 0 },
  { path: "/kontakt",             errors: 2 },
  { path: "/blog",                errors: 0 },
  { path: "/blog/bfsg-2025",      errors: 4 },
  { path: "/impressum",           errors: 0 },
  { path: "/datenschutz",         errors: 1 },
  { path: "/team",                errors: 0 },
  { path: "/leistungen/seo",      errors: 3 },
  { path: "/leistungen/design",   errors: 2 },
  { path: "/karriere",            errors: 0 },
  { path: "/referenzen",          errors: 1 },
  { path: "/preise",              errors: 0 },
];
const DEMO_FIX = {
  label: "🔴 Kritisch",
  issue: "Kontrastverhältnis zu niedrig",
  desc:  "Weißer Text (#FFFFFF) auf hellblauem Hintergrund (#4A9EFF) im Footer erreicht nur ein Kontrastverhältnis von 2.4:1. WCAG 2.1 AA fordert mindestens 4.5:1.",
  before: `.footer-text {\n  color: #ffffff;\n  background: #4a9eff; /* Kontrast: 2.4:1 ❌ */\n}`,
  after:  `.footer-text {\n  color: #ffffff;\n  background: #1d4ed8; /* Kontrast: 5.8:1 ✅ */\n}`,
};
const DEMO_LOCKED = [
  { label: "🔴 Kritisch", issue: "Fehlendes alt-Attribut auf 18 Bildern" },
  { label: "🔴 Kritisch", issue: "Formularfelder ohne Label-Zuordnung" },
  { label: "🟡 Mittel",   issue: "Fehlende ARIA-Landmarks auf Unterseiten" },
  { label: "🟡 Mittel",   issue: "Fokus-Reihenfolge nicht logisch" },
  { label: "🟡 Mittel",   issue: "Skip-Navigation fehlt" },
  { label: "⚪ Info",     issue: "Meta-Description auf 9 Seiten leer" },
];

const COMPARE_ROWS = [
  { feature: "Scans pro Monat",          free: "3 Seiten",     pro: "Unbegrenzt" },
  { feature: "Unterseiten pro Scan",     free: "1 Startseite", pro: "Bis zu 150 Seiten" },
  { feature: "KI-Diagnose & Code-Fixes", free: "1 Vorschau",   pro: "Alle Befunde" },
  { feature: "White-Label PDF-Report",   free: "—",            pro: "Mit deinem Logo" },
  { feature: "Automatisches Monitoring", free: "—",            pro: "Monatlich" },
  { feature: "Jira / Trello / Slack",    free: "—",            pro: "✓" },
  { feature: "BFSG Haftungsschutz",      free: "—",            pro: "Audit-Trail" },
  { feature: "Team-Mitglieder",          free: "—",            pro: "Bis zu 5" },
];

const VISIBLE_PAGES = 8;

// ── Ring chart ────────────────────────────────────────────────────────────────
function HealthRing({ score }: { score: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${(score / 100) * circ} ${circ - (score / 100) * circ}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
      />
    </svg>
  );
}

// ── Main inner component ──────────────────────────────────────────────────────
function ResultsInner() {
  const params = useSearchParams();
  const urlParam = params.get("url") ?? "";

  const [scan, setScan]     = useState<StoredScan | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("wf_scan_result");
      if (raw) {
        const parsed: StoredScan = JSON.parse(raw);
        // Accept if URLs roughly match (both normalised)
        const norm = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
        if (norm(parsed.url) === norm(urlParam) || !urlParam) {
          setScan(parsed);
        }
      }
    } catch { /* SSR / blocked */ }
    setLoaded(true);
  }, [urlParam]);

  if (!loaded) return (
    <div style={{ background: "#0b0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Lade Ergebnisse…</div>
    </div>
  );

  // ── Derive display values ────────────────────────────────────────────────
  const isDemo       = !scan;
  const displayDomain = isDemo ? DEMO_DOMAIN : (() => { try { return new URL(scan!.url).host; } catch { return scan!.url; } })();
  const score        = isDemo ? DEMO_SCORE   : computeScore(scan!);
  const pagesTotal   = isDemo ? DEMO_PAGES   : scan!.pages;
  const critErrors   = isDemo ? DEMO_CRIT    : computeCritical(scan!);
  const liability    = isDemo ? "HOCH"       : liabilityLevel(score, critErrors);
  const liabColor    = liabilityColor(liability);
  const scoreColor   = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  const scoreLabel   = score >= 80 ? "Gut" : score >= 55 ? "Verbesserungsbedarf" : "Kritisch";

  // Pages list
  const { base: pageBase, items: realPageItems } = isDemo
    ? { base: DEMO_DOMAIN, items: DEMO_PAGES_LIST }
    : buildPages(scan!);
  const pageItems = isDemo ? DEMO_PAGES_LIST : realPageItems;

  // Findings
  const findings    = isDemo ? [] : parseFindings(scan!.diagnose);
  // For real scans: use first finding or null (never fall back to DEMO_FIX — that would show
  // fake "Kontrastverhältnis" data on a real result and destroy credibility).
  const visibleFix  = isDemo
    ? DEMO_FIX
    : (findings[0] ? { ...findings[0], before: "", after: "" } : null);
  const lockedCount = isDemo ? DEMO_LOCKED.length : Math.max(0, findings.length - 1);
  const lockedItems = isDemo
    ? DEMO_LOCKED
    : findings.slice(1).map(f => ({ label: f.label, issue: f.issue }));

  return (
    <>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {!isDemo && (
              <span className="hide-sm" style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {displayDomain}
              </span>
            )}
            <Link href="/register" className="hide-sm" style={{
              fontSize: 13, padding: "7px 18px", borderRadius: 8, fontWeight: 700,
              background: "#007BFF", color: "#fff", textDecoration: "none",
              boxShadow: "0 2px 12px rgba(0,123,255,0.4)",
            }}>
              Kostenlos starten →
            </Link>
            {/* Burger-Menü — nur auf Mobile sichtbar */}
            <MobileNav />
          </div>
        </div>
      </nav>

      <main style={{ background: "#0b0c10", minHeight: "100vh" }}>

        {/* ── SECTION 1: HERO DASHBOARD ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 0" }}>

          {/* Demo-mode notice */}
          {isDemo && (
            <div style={{
              marginBottom: 24, padding: "10px 16px", borderRadius: 10,
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 13 }}>💡</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                Das sind Beispieldaten. <Link href="/scan" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 600 }}>Eigene URL scannen →</Link>
              </span>
            </div>
          )}

          {/* Scan complete label */}
          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "4px 14px", borderRadius: 20, fontSize: 11,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              color: "#22c55e", fontWeight: 700, letterSpacing: "0.06em",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
              Scan abgeschlossen
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              {displayDomain} · {pagesTotal} {pagesTotal === 1 ? "Seite" : "Unterseiten"} analysiert
            </span>
          </div>

          {/* Dashboard grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>

            {/* Health ring */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: `1px solid ${scoreColor}40`,
              borderRadius: 20, padding: "28px 32px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 40px ${scoreColor}12`, minWidth: 180,
            }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <HealthRing score={score} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor, letterSpacing: "-0.04em", lineHeight: 1 }}>{score}%</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>Score</span>
                </div>
              </div>
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Website-Gesundheit</div>
                <div style={{ fontSize: 11, color: scoreColor, marginTop: 3, fontWeight: 600 }}>{scoreLabel}</div>
              </div>
            </div>

            {/* Pages */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(122,166,255,0.2)",
              borderRadius: 20, padding: "28px 28px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              boxShadow: "0 0 30px rgba(122,166,255,0.06)",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(122,166,255,0.1)", border: "1px solid rgba(122,166,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>
                  {pagesTotal}<span style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>/{pagesTotal}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Gescannte Seiten</div>
                <div style={{ fontSize: 12, color: "#7aa6ff", marginTop: 4, fontWeight: 500 }}>Beweis: Wir waren überall</div>
              </div>
            </div>

            {/* Critical errors */}
            <div style={{
              background: "rgba(255,255,255,0.025)",
              border: critErrors === 0 ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.25)",
              borderRadius: 20, padding: "28px 28px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              boxShadow: critErrors === 0 ? "0 0 30px rgba(34,197,94,0.06)" : "0 0 30px rgba(239,68,68,0.06)",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: critErrors === 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: critErrors === 0 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={critErrors === 0 ? "#22c55e" : "#ef4444"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: critErrors === 0 ? "#22c55e" : "#ef4444", lineHeight: 1 }}>
                  {critErrors}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                  {critErrors === 0 ? "Keine Fehler" : "Kritische BFSG-Fehler"}
                </div>
                <div style={{ fontSize: 12, color: critErrors === 0 ? "#22c55e" : "#ef4444", marginTop: 4, fontWeight: 500 }}>
                  {critErrors === 0 ? "Sieht gut aus!" : "Bußgeld-relevant ab 28.06.2025"}
                </div>
                {critErrors > 0 && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10,
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.30)",
                    color: "#f59e0b",
                  }}>
                    ⚠️ Bußgeld-Risiko hoch
                  </div>
                )}
              </div>
            </div>

            {/* Liability */}
            <div style={{
              background: "rgba(255,255,255,0.025)", border: `1px solid ${liabColor}40`,
              borderRadius: 20, padding: "28px 28px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              boxShadow: `0 0 30px ${liabColor}10`,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${liabColor}18`, border: `1px solid ${liabColor}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={liabColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: liabColor, lineHeight: 1 }}>{liability}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Potenzielle Haftung</div>
                <div style={{ fontSize: 12, color: liabColor, marginTop: 4, fontWeight: 500 }}>BFSG §3 Abs. 2</div>
              </div>
            </div>

          </div>
        </section>

        {/* ── SECTION 2: DEEP-SCAN MAP ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Deep-Scan Map</p>
              <h2 style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
                {isDemo ? "Alle gefundenen Unterseiten" : `${pagesTotal} Unterseiten analysiert`}
              </h2>
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: 8 }}>
              {pagesTotal} Seiten · BFS-Crawler
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Seite</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", width: 100, textAlign: "center" }}>Status</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", width: 80, textAlign: "right" }}>Fehler</span>
            </div>

            {/* Visible rows */}
            {pageItems.slice(0, VISIBLE_PAGES).map((p, i) => {
              const dotColor = p.errors === 0 ? "#22c55e" : p.errors >= 4 ? "#ef4444" : "#f59e0b";
              const statusLabel = p.errors === 0 ? "✓ Sauber" : p.errors >= 4 ? "Kritisch" : "Warnung";
              return (
                <div key={p.path} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "13px 20px", borderBottom: i < VISIBLE_PAGES - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: dotColor, boxShadow: `0 0 5px ${dotColor}` }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>
                      {pageBase}{p.path}
                    </span>
                  </div>
                  <div style={{ width: 100, textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: p.errors === 0 ? "rgba(34,197,94,0.1)" : p.errors >= 4 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", color: dotColor, border: `1px solid ${dotColor}33` }}>
                      {statusLabel}
                    </span>
                  </div>
                  <div style={{ width: 80, textAlign: "right" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.errors === 0 ? "rgba(255,255,255,0.2)" : dotColor }}>
                      {p.errors === 0 ? "—" : `${p.errors} Fehler`}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Locked rows (blurred) — only if more pages exist */}
            {pageItems.length > VISIBLE_PAGES && (
              <div style={{ position: "relative" }}>
                {pageItems.slice(VISIBLE_PAGES).map((p, i) => (
                  <div key={p.path + i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", filter: "blur(4px)", userSelect: "none" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>{pageBase}{p.path}</span>
                    <div style={{ width: 100, textAlign: "center" }}><span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>████</span></div>
                    <div style={{ width: 80, textAlign: "right" }}><span style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>██</span></div>
                  </div>
                ))}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, rgba(11,12,16,0.85) 40%, rgba(11,12,16,0.98) 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 0 24px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>+ {pageItems.length - VISIBLE_PAGES} weitere Seiten analysiert</div>
                    <Link href="/register" className="wf-cta-pulse" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, background: "#007BFF", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,123,255,0.4)" }}>
                      Alle {pagesTotal} Seiten freischalten →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* If fewer pages than visible limit, add CTA below */}
            {pageItems.length <= VISIBLE_PAGES && (
              <div style={{ padding: "16px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <Link href="/register" style={{ fontSize: 13, color: "#7aa6ff", textDecoration: "none", fontWeight: 600 }}>
                  Mit Agency Core alle Seiten dauerhaft überwachen →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── BFSG-READY BADGE ── */}
        {!isDemo && critErrors === 0 && score >= 80 && (
          <section style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 0" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 24px", borderRadius: 14,
              background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)",
              boxShadow: "0 0 24px rgba(34,197,94,0.08)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 2 }}>
                  BFSG-Ready ✓
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                  Diese Seite erfüllt die technischen Kriterien des Barrierefreiheitsstärkungsgesetzes.
                </div>
              </div>
              <div style={{
                marginLeft: "auto", flexShrink: 0,
                fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                color: "#22c55e", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                Konform
              </div>
            </div>
          </section>
        )}

        {/* ── DRINGLICHKEITS-AMPEL ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 0" }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>360° Business Health Check</p>
            <h2 style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>Dringlichkeits-Ampel</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {/* Red */}
            <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🔴</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Kritisch — sofort handeln</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  !scan?.https                             && "Kein HTTPS — Sicherheitsrisiko & SEO-Verlust",
                  scan?.robotsBlocked                      && "robots.txt blockiert Suchmaschinen komplett",
                  scan?.noIndex                            && "Startseite von Google ausgesperrt (noindex)",
                  (scan?.brokenLinksCount ?? 0) > 0        && `${scan!.brokenLinksCount} kaputte Links — Nutzer landen ins Leere`,
                  !scan?.hasTitle                          && "Kein Seitentitel — unsichtbar für Google",
                  scan?.hasUnreachable                     && "Unterseiten nicht erreichbar — Umsatzverlust",
                  isDemo                                   && "BFSG-Verstoß: Formularfelder ohne Label",
                  isDemo                                   && "Broken Links auf 3 Unterseiten",
                ].filter(Boolean).map((msg, i) => (
                  <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                    <span style={{ color: "#ef4444", flexShrink: 0 }}>✕</span>{msg as string}
                  </div>
                ))}
                {!isDemo && !scan?.robotsBlocked && scan?.https && !scan?.noIndex && (scan?.brokenLinksCount ?? 0) === 0 && scan?.hasTitle && !scan?.hasUnreachable && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>Keine kritischen Fehler gefunden ✓</div>
                )}
              </div>
            </div>
            {/* Yellow */}
            <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🟡</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>Optimierung — binnen 30 Tagen</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  !scan?.hasMeta                           && "Fehlende Meta-Description — schlechte CTR in Google",
                  !scan?.hasH1                             && "Kein H1-Tag — schwaches SEO-Signal",
                  !scan?.hasSitemap                        && "Keine Sitemap — erschwert Indexierung",
                  (scan?.altMissingCount ?? 0) > 0         && `${scan!.altMissingCount} Bilder ohne Alt-Text — BFSG-Pflicht & SEO`,
                  (scan?.duplicateTitlesCount ?? 0) > 1    && "Doppelte Seitentitel — Keyword-Kannibalisierung",
                  isDemo                                   && "Ladezeit > 2.5s — erhöhte Absprungrate",
                  isDemo                                   && "9 Seiten ohne Meta-Description",
                ].filter(Boolean).map((msg, i) => (
                  <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                    <span style={{ color: "#fbbf24", flexShrink: 0 }}>⚠</span>{msg as string}
                  </div>
                ))}
              </div>
            </div>
            {/* Green */}
            <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🟢</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Gut — bereits erfüllt</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  (scan?.https ?? isDemo)                  && "HTTPS aktiv — sichere Verbindung",
                  (scan?.hasTitle ?? isDemo)               && "Seitentitel vorhanden",
                  (scan?.hasSitemap ?? isDemo)             && "Sitemap gefunden",
                  (scan?.hasMeta ?? isDemo)                && "Meta-Description gesetzt",
                  isDemo                                   && "Startseite erreichbar",
                ].filter(Boolean).map((msg, i) => (
                  <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                    <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>{msg as string}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: AI EXPERT FIX ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 0" }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI-Expert-Fix</p>
            <h2 style={{ margin: 0, fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>KI-generierte Code-Lösungen</h2>
          </div>

          {/* Visible fix — Demo: vollständig mit Code-Panels | Real: echte AI-Daten | Null: Skeleton */}
          {isDemo && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "rgba(239,68,68,0.04)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>🔴 Kritisch</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{DEMO_FIX.issue}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: "auto", fontFamily: "monospace" }}>{displayDomain}</span>
              </div>
              <div style={{ padding: "20px 24px 0" }}>
                <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>{DEMO_FIX.desc}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Vorher</span>
                  </div>
                  <pre style={{ margin: 0, padding: "18px 18px 22px", fontSize: 12.5, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", fontFamily: "'Fira Code','Cascadia Code',monospace", background: "rgba(239,68,68,0.03)", overflowX: "auto" }}>{DEMO_FIX.before}</pre>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ padding: "10px 18px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>KI-Fix</span>
                  </div>
                  <pre style={{ margin: 0, padding: "18px 18px 22px", fontSize: 12.5, lineHeight: 1.75, color: "#8df3d3", fontFamily: "'Fira Code','Cascadia Code',monospace", background: "rgba(34,197,94,0.03)", overflowX: "auto" }}>{DEMO_FIX.after}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Real scan — first finding aus echter KI-Diagnose */}
          {!isDemo && visibleFix && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "rgba(239,68,68,0.04)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {visibleFix.label.includes("🔴") ? "🔴 Kritisch" : "🟡 Wichtig"}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{visibleFix.issue}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: "auto", fontFamily: "monospace" }}>{displayDomain}</span>
              </div>
              {visibleFix.desc && (
                <div style={{ padding: "20px 24px 0" }}>
                  <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>{visibleFix.desc}</p>
                </div>
              )}
              <div style={{ padding: "0 24px 20px" }}>
                <div style={{ padding: "14px 18px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>KI-Empfehlung</div>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                    Registriere dich kostenlos für vollständige Code-Fixes mit exakten Zeilennummern und Copy-Paste-Lösungen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Real scan — keine parsierbaren Findings: Skeleton statt Fake-Daten */}
          {!isDemo && !visibleFix && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 24px", marginBottom: 12, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Keine kritischen Code-Fehler in der KI-Analyse gefunden</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Die KI-Diagnose enthält keine strukturierten Befunde für diesen Bereich. Vollständige Analyse mit Agency Core verfügbar.
                </div>
              </div>
            </div>
          )}

          {/* Locked fixes */}
          {lockedCount > 0 && (
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lockedItems.map((fix, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 24px", display: "flex", alignItems: "center", gap: 14, filter: "blur(3.5px)", userSelect: "none" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>{fix.label}</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{fix.issue}</span>
                  </div>
                ))}
              </div>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, rgba(11,12,16,0.7) 30%, rgba(11,12,16,0.97) 75%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 0 8px" }}>
                <div style={{ textAlign: "center", background: "rgba(11,12,16,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 36px", maxWidth: 520, width: "100%", backdropFilter: "blur(8px)" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.025em" }}>{lockedCount} Befunde & Fix-Anleitungen gesperrt</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 20 }}>
                    Schalte alle KI-generierten Code-Fixes<br />für <strong style={{ color: "#fff" }}>{pagesTotal} Unterseiten</strong> frei — inkl. BFSG-Dokumentation.
                  </div>
                  <Link href="/register" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 10, background: "linear-gradient(90deg, #007BFF, #0057b8)", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,123,255,0.45)" }}>
                    Vollständigen Fehler-Report &amp; Fix-Anleitungen freischalten →
                  </Link>
                  <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Jederzeit kündbar · Sicher bezahlen</div>
                </div>
              </div>
            </div>
          )}

          {/* If scan is clean (0 findings) */}
          {!isDemo && lockedCount === 0 && findings.length === 0 && (
            <div style={{ padding: "28px 24px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🛡️</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Keine kritischen Fehler gefunden!</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                Deine Website sieht gut aus. Mit Agency Core kannst du sie dauerhaft überwachen<br />und Kunden monatliche White-Label Reports schicken.
              </div>
            </div>
          )}
        </section>

        {/* ── SECTION 4: WHITE-LABEL VORSCHAU ── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 0" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.06) 100%)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: 20, padding: "clamp(28px,4vw,48px)", display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-40%", right: "-5%", width: "40%", height: "180%", background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

            {/* Mock PDF */}
            <div style={{ flexShrink: 0, position: "relative" }}>
              <div style={{ width: 200, borderRadius: 14, background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", overflow: "hidden", transform: "rotate(-2deg)" }}>
                <div style={{ background: "#1e40af", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed rgba(255,255,255,0.4)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Dein Branding hier</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>Website-Audit</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "14px 14px 16px", background: "#f8fafc" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>{displayDomain}</div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 7, color: "#64748b" }}>Gesundheit</span><span style={{ fontSize: 7, color: scoreColor, fontWeight: 700 }}>{score}%</span></div>
                    <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2 }}><div style={{ height: "100%", width: `${score}%`, background: scoreColor, borderRadius: 2 }} /></div>
                  </div>
                  {["Barrierefreiheit", "Performance", "BFSG"].map((item, idx) => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: 1, background: ["#ef4444","#f59e0b","#ef4444"][idx], flexShrink: 0 }} />
                      <span style={{ fontSize: 7.5, color: "#475569", flex: 1 }}>{item}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, padding: "5px 8px", background: "#eff6ff", borderRadius: 4, textAlign: "center" }}>
                    <span style={{ fontSize: 7, color: "#2563eb", fontWeight: 700 }}>Automatisch generiert · WebsiteFix</span>
                  </div>
                </div>
              </div>
              <div style={{ position: "absolute", top: -10, right: -16, background: "#0b0c10", border: "1px solid rgba(37,99,235,0.4)", borderRadius: 8, padding: "5px 10px", fontSize: 10, color: "#7aa6ff", fontWeight: 700, boxShadow: "0 4px 16px rgba(0,0,0,0.4)", transform: "rotate(2deg)" }}>
                ← Dein Logo hier
              </div>
            </div>

            {/* Text + CTA */}
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 14, padding: "4px 12px", borderRadius: 20, fontSize: 11, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#c084fc", fontWeight: 700, letterSpacing: "0.06em" }}>White-Label Report</div>
              <h2 style={{ margin: "0 0 12px", fontSize: "clamp(20px,2.5vw,28px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff", lineHeight: 1.2 }}>Professionelle Berichte<br />mit deinem Branding.</h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>Am 1. jeden Monats erhält jeder deiner Kunden automatisch einen PDF-Report — mit deinem Logo, deiner Farbe und einer KI-Zusammenfassung. Kein WebsiteFix-Branding sichtbar.</p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/register?plan=agency_core" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 10, background: "linear-gradient(90deg, #7C3AED, #6d28d9)", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}>
                  PDF-Report mit meinem Logo →
                </Link>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>ab Agency Core</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: VERGLEICHS-TABELLE ── */}
        <section style={{ maxWidth: 900, margin: "0 auto", padding: "72px 24px 80px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Upsell</p>
            <h2 style={{ margin: 0, fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>Was du jetzt siehst — und was du bekommst</h2>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 200px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ padding: "16px 24px" }} />
              <div style={{ padding: "16px 20px", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Free</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>0€</div>
              </div>
              <div style={{ padding: "16px 20px", textAlign: "center", borderLeft: "1px solid rgba(37,99,235,0.2)", background: "rgba(37,99,235,0.05)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7aa6ff", textTransform: "uppercase", letterSpacing: "0.08em" }}>★ Agency Core</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginTop: 2 }}>149€<span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>/Mo</span></div>
              </div>
            </div>

            {COMPARE_ROWS.map((row, i) => (
              <div key={row.feature} style={{ display: "grid", gridTemplateColumns: "1fr 160px 200px", borderBottom: i < COMPARE_ROWS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
                <div style={{ padding: "14px 24px", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{row.feature}</div>
                <div style={{ padding: "14px 20px", textAlign: "center", fontSize: 13, color: row.free === "—" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.45)", fontWeight: row.free === "—" ? 400 : 600, borderLeft: "1px solid rgba(255,255,255,0.04)" }}>{row.free}</div>
                <div style={{ padding: "14px 20px", textAlign: "center", fontSize: 13, color: "#22c55e", fontWeight: 700, borderLeft: "1px solid rgba(37,99,235,0.15)", background: "rgba(37,99,235,0.03)" }}>{row.pro}</div>
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 200px", background: "rgba(37,99,235,0.04)", borderTop: "1px solid rgba(37,99,235,0.15)" }}>
              <div style={{ padding: "20px 24px" }} />
              <div style={{ padding: "20px 20px", textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                <Link href="/scan" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "underline" }}>Aktuell</Link>
              </div>
              <div style={{ padding: "16px 20px", borderLeft: "1px solid rgba(37,99,235,0.15)" }}>
                <Link href="/register?plan=agency_core" style={{ display: "block", textAlign: "center", padding: "11px 0", borderRadius: 9, background: "linear-gradient(90deg, #007BFF, #0057b8)", color: "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none", boxShadow: "0 4px 16px rgba(0,123,255,0.35)" }}>
                  Agency Core starten →
                </Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {["Sicherer Stripe-Checkout", "Jederzeit kündbar", "DSGVO-konform"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
              </div>
            ))}
          </div>
        </section>

      </main>

      <SiteFooter />

      <style>{`
        @keyframes wf-cta-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(0,123,255,0.4); }
          50%       { box-shadow: 0 4px 28px rgba(0,123,255,0.75), 0 0 0 4px rgba(0,123,255,0.15); }
        }
        .wf-cta-pulse {
          animation: wf-cta-pulse 2.2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

// ── Page export with Suspense (required for useSearchParams) ──────────────────
export default function ScanResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "#0b0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Lade Ergebnisse…</div>
      </div>
    }>
      <ResultsInner />
    </Suspense>
  );
}
