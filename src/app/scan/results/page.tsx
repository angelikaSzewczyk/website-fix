"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import BrandLogo from "../../components/BrandLogo";
import MobileNav from "../../components/MobileNav";
import SiteFooter from "../../components/SiteFooter";

import { type StoredScan, saveScanToStorage, loadScanFromStorage } from "@/lib/scan-storage";

// ── Rich page item used in Deep-Scan Map ─────────────────────────────────────
type PageItem = {
  path:             string;
  fullUrl:          string;
  errors:           number;   // -1 = skipped (feed/xml/json)
  erreichbar:       boolean;
  altMissing:       number;
  noindex:          boolean;
  isSkipped:        boolean;
  altMissingImages?:   string[];  // Beweis-Modus: exact filenames
  missingTitle?:       boolean;
  missingMeta?:        boolean;
  missingH1?:          boolean;
  inputsWithoutLabel?: number;
  buttonsWithoutText?: number;
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

// Same 13-category boolean logic as /api/scan/route.ts → issueCount
// so public results and dashboard always show identical numbers.
// Note: !erreichbar (homepage reachable) is always false here — we only
// reach this page when the scan succeeded — so it contributes 0, matching
// the route's behaviour in practice.
function computeIssueCount(d: StoredScan): number {
  return [
    !d.https,
    /* !erreichbar — always reachable when results exist, matches route */
    !d.hasTitle,
    !d.hasMeta,
    !d.hasH1,
    d.robotsBlocked,
    !d.hasSitemap,
    d.hasUnreachable,
    d.duplicateTitlesCount > 0,
    d.duplicateMetasCount  > 0,
    d.altMissingCount      > 0,
    d.brokenLinksCount     > 0,
    (d.orphanedPagesCount  ?? 0) > 0,
  ].filter(Boolean).length;
}

function liabilityLevel(score: number, crit: number): string {
  if (score < 55 || crit >= 6) return "HOCH";
  if (score < 80 || crit >= 3) return "MITTEL";
  return "GERING";
}

function liabilityColor(level: string): string {
  if (level === "HOCH")   return "#f59e0b";
  if (level === "MITTEL") return "#c9820a";
  return "#22c55e";
}


// ── Feed/XML filter for display ───────────────────────────────────────────────
const FEED_URL_PATTERN = /\/(feed|feed\/atom|feed\/rss|rss)(\/|$)|\.(xml|txt|json)(\?|#|$)/i;

// ── Build subpage list from real data ─────────────────────────────────────────
function buildPages(d: StoredScan): { base: string; items: PageItem[] } {
  const base = (() => { try { return new URL(d.url).host; } catch { return d.url; } })();
  const homePath = (() => { try { return new URL(d.url).pathname || "/"; } catch { return "/"; } })();
  // Home page errors (from global flags, not per-page data)
  const homeAltMissing = d.altMissingCount > 0 ? Math.min(d.altMissingCount, 3) : 0;
  const homeErrors = (!d.hasTitle ? 1 : 0) + (!d.hasMeta ? 1 : 0) + (!d.hasH1 ? 1 : 0) + homeAltMissing;

  const items: PageItem[] = [
    {
      path: homePath, fullUrl: d.url, errors: homeErrors,
      erreichbar: true, altMissing: homeAltMissing, noindex: d.noIndex, isSkipped: false,
      // altMissingImages for home: take first homeAltMissing entries from global list
      altMissingImages: (d.altMissingImages ?? []).slice(0, homeAltMissing),
      missingTitle: !d.hasTitle,
      missingMeta:  !d.hasMeta,
      missingH1:    !d.hasH1,
    },
    // Audited subpages — same error checks as homepage
    ...d.unterseiten.filter(p => !FEED_URL_PATTERN.test(p.url)).map(p => {
      const noTitle = !p.title || p.title === "(kein Title)";
      const noH1    = !p.h1    || p.h1    === "(kein H1)";
      const noMeta  = !p.metaDescription;
      let errors = p.altMissing;
      if (!p.erreichbar)          errors += 1;
      if (p.noindex)              errors += 1;
      if (noTitle)                errors += 1;
      if (noH1)                   errors += 1;
      if (noMeta)                 errors += 1;
      errors += (p.inputsWithoutLabel ?? 0);
      errors += (p.buttonsWithoutText ?? 0);
      const path = (() => { try { return new URL(p.url).pathname || "/"; } catch { return p.url; } })();
      return {
        path, fullUrl: p.url, errors,
        erreichbar: p.erreichbar, altMissing: p.altMissing,
        noindex: p.noindex, isSkipped: false,
        altMissingImages:   p.altMissingImages ?? [],
        missingTitle:       noTitle,
        missingH1:          noH1,
        missingMeta:        noMeta,
        inputsWithoutLabel: p.inputsWithoutLabel ?? 0,
        buttonsWithoutText: p.buttonsWithoutText ?? 0,
      };
    }),
    // Skipped URLs (feeds, xml, json) — shown with special badge
    ...(d.skippedUrls ?? []).map(u => {
      const path = (() => { try { return new URL(u).pathname || "/"; } catch { return u; } })();
      return { path, fullUrl: u, errors: -1, erreichbar: true, altMissing: 0, noindex: false, isSkipped: true };
    }),
  ];
  return { base, items };
}

// ── Demo constants ────────────────────────────────────────────────────────────
const DEMO_DOMAIN  = "beispiel-agentur.de";
const DEMO_SCORE   = 64;
const DEMO_PAGES   = 42;
const DEMO_CRIT    = 12;
const DEMO_PAGES_LIST: PageItem[] = [
  { path: "/",                    fullUrl: `https://${DEMO_DOMAIN}/`,                  errors: 3, erreichbar: true, altMissing: 3, noindex: false, isSkipped: false },
  { path: "/leistungen",          fullUrl: `https://${DEMO_DOMAIN}/leistungen`,        errors: 5, erreichbar: true, altMissing: 5, noindex: false, isSkipped: false },
  { path: "/ueber-uns",           fullUrl: `https://${DEMO_DOMAIN}/ueber-uns`,         errors: 0, erreichbar: true, altMissing: 0, noindex: false, isSkipped: false },
  { path: "/kontakt",             fullUrl: `https://${DEMO_DOMAIN}/kontakt`,           errors: 2, erreichbar: true, altMissing: 2, noindex: false, isSkipped: false },
  { path: "/blog",                fullUrl: `https://${DEMO_DOMAIN}/blog`,              errors: 0, erreichbar: true, altMissing: 0, noindex: false, isSkipped: false },
  { path: "/blog/bfsg-2025",      fullUrl: `https://${DEMO_DOMAIN}/blog/bfsg-2025`,   errors: 4, erreichbar: true, altMissing: 4, noindex: false, isSkipped: false },
  { path: "/impressum",           fullUrl: `https://${DEMO_DOMAIN}/impressum`,         errors: 0, erreichbar: true, altMissing: 0, noindex: false, isSkipped: false },
  { path: "/datenschutz",         fullUrl: `https://${DEMO_DOMAIN}/datenschutz`,       errors: 1, erreichbar: true, altMissing: 1, noindex: false, isSkipped: false },
  { path: "/team",                fullUrl: `https://${DEMO_DOMAIN}/team`,              errors: 0, erreichbar: true, altMissing: 0, noindex: false, isSkipped: false },
  { path: "/leistungen/seo",      fullUrl: `https://${DEMO_DOMAIN}/leistungen/seo`,   errors: 3, erreichbar: true, altMissing: 3, noindex: false, isSkipped: false },
  { path: "/leistungen/design",   fullUrl: `https://${DEMO_DOMAIN}/leistungen/design`,errors: 2, erreichbar: true, altMissing: 2, noindex: false, isSkipped: false },
  { path: "/karriere",            fullUrl: `https://${DEMO_DOMAIN}/karriere`,          errors: 0, erreichbar: true, altMissing: 0, noindex: false, isSkipped: false },
  { path: "/referenzen",          fullUrl: `https://${DEMO_DOMAIN}/referenzen`,        errors: 1, erreichbar: true, altMissing: 1, noindex: false, isSkipped: false },
  { path: "/preise",              fullUrl: `https://${DEMO_DOMAIN}/preise`,            errors: 0, erreichbar: true, altMissing: 0, noindex: false, isSkipped: false },
];

const VISIBLE_PAGES = 8;

// ── Beweis-Modus: single protocol entry row ───────────────────────────────────
// Soft amber for "important / optimization potential" — not alarming neon yellow
const AMBER = "#c9820a";
const AMBER_BG   = "rgba(201,130,10,0.06)";
const AMBER_BDR  = "rgba(201,130,10,0.22)";

function ProtoRow({ severity, title, detail, law, tier = "anon", manualHint }: {
  severity: "red" | "yellow";
  title: string;
  detail?: string;
  law?: string;
  /** "anon" = hide filenames | "free" = show filenames + manual hint | "paid" = show everything */
  tier?: "anon" | "free" | "paid";
  /** Short manual fix instruction shown to free users instead of KI-code-fix */
  manualHint?: string;
}) {
  const c  = severity === "red" ? "#ef4444" : AMBER;
  const bg = severity === "red" ? "rgba(239,68,68,0.07)" : AMBER_BG;
  const bd = severity === "red" ? "rgba(239,68,68,0.22)" : AMBER_BDR;
  const showDetail = tier !== "anon";
  return (
    <div style={{ padding: "9px 14px", borderRadius: 9, display: "flex", alignItems: "flex-start", gap: 10, background: bg, border: `1px solid ${bd}` }}>
      <span style={{ color: c, flexShrink: 0, marginTop: 2, fontSize: 12, fontWeight: 800 }}>
        {severity === "red" ? "✕" : "→"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Error type always visible */}
        <div style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: "monospace", marginBottom: detail ? 3 : 0 }}>
          {title}
        </div>
        {/* Detail: anon = lock placeholder | free/paid = real value */}
        {detail && (
          !showDetail ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: law ? 3 : 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", fontStyle: "italic", letterSpacing: "0.03em" }}>
                Nach Registrierung sichtbar
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", marginBottom: (law || manualHint) ? 3 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {detail}
            </div>
          )
        )}
        {/* Manual hint — free users only */}
        {showDetail && manualHint && tier === "free" && (
          <div style={{ fontSize: 11, color: "rgba(141,243,211,0.7)", marginBottom: law ? 3 : 0, fontStyle: "italic" }}>
            Lösungsweg: {manualHint}
          </div>
        )}
        {law && (
          <div style={{ fontSize: 10, color: c, opacity: 0.7, fontWeight: 600 }}>{law}</div>
        )}
      </div>
      <span style={{
        fontSize: 10, padding: "2px 6px", borderRadius: 4, flexShrink: 0,
        background: severity === "red" ? "rgba(239,68,68,0.12)" : "rgba(201,130,10,0.12)",
        color: c, border: `1px solid ${c}33`, fontWeight: 800, letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}>
        {severity === "red" ? "KRITISCH" : "OPTIMIERUNG"}
      </span>
    </div>
  );
}

// ── Beweis-Modus: expandable panel — entry count ALWAYS equals header "N Fehler" ──
function ProtoPanelContent({ p, tier = "anon" }: {
  p: PageItem;
  /** "anon" = filenames hidden | "free" = filenames + manual hints | "paid" = everything */
  tier?: "anon" | "free" | "paid";
}) {
  const isUnreachable = !p.erreichbar;
  const altImages     = p.altMissingImages ?? [];
  const extraAlt      = Math.max(0, p.altMissing - altImages.length);

  // Summary chips: shows category breakdown so user can count to total
  const imgCount  = p.altMissing;
  const formCount = (p.inputsWithoutLabel ?? 0) + (p.buttonsWithoutText ?? 0);
  const seoCount  = (p.missingTitle ? 1 : 0) + (p.missingMeta ? 1 : 0) + (p.missingH1 ? 1 : 0) + (p.noindex ? 1 : 0);
  const reachCount = isUnreachable ? 1 : 0;
  const chips: { label: string; color: string }[] = [];
  if (reachCount > 0) chips.push({ label: `${reachCount} Erreichbarkeits-Fehler`, color: "#ef4444" });
  if (imgCount   > 0) chips.push({ label: `${imgCount} Bild-Fehler`,              color: "#ef4444" });
  if (formCount  > 0) chips.push({ label: `${formCount} Formular-Fehler`,         color: "#ef4444" });
  if (seoCount   > 0) chips.push({ label: `${seoCount} SEO-Optimierungen`,        color: AMBER });

  return (
    <div style={{ padding: "14px 20px 16px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header + breakdown chips */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
          Technisches Prüfprotokoll · {p.path}
        </span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {chips.map((ch, i) => (
            <span key={i} style={{
              fontSize: 10, padding: "2px 9px", borderRadius: 20, fontWeight: 700,
              background: `${ch.color}12`, border: `1px solid ${ch.color}33`, color: ch.color,
            }}>{ch.label}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>

        {/* 1. Seite nicht erreichbar — counts as 1 */}
        {isUnreachable && (
          <ProtoRow severity="red" tier={tier}
            title="HTTP: Seite nicht erreichbar"
            detail={`GET ${p.path} → 404 Not Found / Connection Timeout`}
            law="BFSG §4 — Barrierefreie Erreichbarkeit aller Inhalte"
            manualHint="Prüfe Server-Status und richte eine 301-Weiterleitung auf die korrekte URL ein"
          />
        )}

        {/* 2. Kein H1 — counts as 1 */}
        {p.missingH1 && (
          <ProtoRow severity="red" tier={tier}
            title="<h1>-Tag fehlt"
            detail="Überschriften-Hierarchie fehlt — Screenreader verlieren Seitenstruktur"
            law="BFSG §3 Abs. 2 · EN 301 549 Kap. 9.1.3.1 · WCAG 1.3.1"
            manualHint='Füge <h1>Dein Seitenthema</h1> einmalig pro Seite in den Seiteninhalt ein'
          />
        )}

        {/* 3. Kein Title — counts as 1 */}
        {p.missingTitle && (
          <ProtoRow severity="yellow" tier={tier}
            title="<title>-Tag fehlt"
            detail="Kein Seitentitel — erscheint namenlos in Suchergebnissen"
            law="SEO-Grundlage · BFSG §3 Abs. 2 (Identifizierbarkeit)"
            manualHint='Ergänze <title>Seitenname | Deine Marke</title> im WordPress-SEO-Plugin (Yoast/Rank Math)'
          />
        )}

        {/* 4. Keine Meta-Description — counts as 1 */}
        {p.missingMeta && (
          <ProtoRow severity="yellow" tier={tier}
            title="Meta-Description fehlt"
            detail="Google wählt beliebigen Text als Snippet — CTR sinkt"
            law="SEO-Best Practice"
            manualHint="Öffne die Seite im Editor → SEO-Plugin → Meta-Beschreibung ausfüllen (120–160 Zeichen)"
          />
        )}

        {/* 5+. Alt-missing images — each image = 1 entry */}
        {altImages.map((img, idx) => (
          <ProtoRow key={`img-named-${idx}`} severity="red" tier={tier}
            title={`<img alt=""> fehlt`}
            detail={img}
            law="Barrierefreiheits-Standard (BFSG 2025) · WCAG 1.1.1"
            manualHint='Füge alt="[Bildbeschreibung]" zum <img>-Tag hinzu — im WordPress-Medien-Manager unter "Alternativtext"'
          />
        ))}
        {Array.from({ length: extraAlt }, (_, i) => (
          <ProtoRow key={`img-extra-${i}`} severity="red" tier={tier}
            title={`<img alt=""> fehlt`}
            detail="Dateiname nicht ermittelt"
            law="Barrierefreiheits-Standard (BFSG 2025) · WCAG 1.1.1"
            manualHint='Füge alt="[Bildbeschreibung]" zum <img>-Tag hinzu — im WordPress-Medien-Manager unter "Alternativtext"'
          />
        ))}

        {/* Form labels — each missing label = 1 entry */}
        {(p.inputsWithoutLabel ?? 0) > 0 && Array.from({ length: p.inputsWithoutLabel! }, (_, i) => (
          <ProtoRow key={`label-${i}`} severity="red" tier={tier}
            title={`<label> fehlt für Formularfeld #${i + 1}`}
            detail="<input>-Element ohne zugeordnetes <label> oder aria-label"
            law="BFSG §3 Abs. 2 · EN 301 549 · WCAG 1.3.1"
            manualHint='Füge <label for="feldId">Beschreibung</label> vor dem Input ein oder setze aria-label="..."'
          />
        ))}
        {(p.buttonsWithoutText ?? 0) > 0 && Array.from({ length: p.buttonsWithoutText! }, (_, i) => (
          <ProtoRow key={`btn-${i}`} severity="red" tier={tier}
            title={`<button> ohne sichtbaren Text #${i + 1}`}
            detail="Button-Element ohne Beschriftung oder aria-label"
            law="BFSG §3 Abs. 2 · WCAG 4.1.2"
            manualHint='Füge aria-label="Aktion beschreiben" zum <button>-Tag hinzu'
          />
        ))}

        {/* Last. noindex — counts as 1 */}
        {p.noindex && (
          <ProtoRow severity="yellow" tier={tier}
            title={`<meta name="robots" content="noindex"> aktiv`}
            detail="Seite explizit von Google-Indexierung ausgeschlossen"
            law="Kein organischer Traffic · direkter Umsatzverlust"
            manualHint='Entferne content="noindex" im SEO-Plugin (Yoast: "Suchmaschinen-Sichtbarkeit" aktivieren)'
          />
        )}

      </div>

      {/* ── CTA je nach Tier ── */}
      {tier === "anon" && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 9,
          background: "rgba(122,166,255,0.06)", border: "1px solid rgba(122,166,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              Dateinamen &amp; Lösungsweg nach Registrierung kostenlos freischalten
            </span>
          </div>
          <Link href="/register" style={{
            fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 7,
            background: "rgba(122,166,255,0.14)", color: "#7aa6ff",
            border: "1px solid rgba(122,166,255,0.3)", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Kostenlos freischalten →
          </Link>
        </div>
      )}

      {tier === "free" && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 9,
          background: "rgba(192,132,252,0.06)", border: "1px solid rgba(192,132,252,0.18)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              KI-Auto-Fix (fertiger Code, Copy-Paste-bereit) nur mit Smart-Guard
            </span>
          </div>
          <Link href="/register?plan=smart-guard" style={{
            fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 7,
            background: "rgba(192,132,252,0.14)", color: "#c084fc",
            border: "1px solid rgba(192,132,252,0.3)", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Smart-Guard freischalten →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Ring chart ────────────────────────────────────────────────────────────────
function HealthRing({ score, displayScore }: { score: number; displayScore: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  const fill = (displayScore / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: "stroke-dasharray 0.016s linear" }}
      />
    </svg>
  );
}

// ── Main inner component ──────────────────────────────────────────────────────
function ResultsInner() {
  const params = useSearchParams();
  const urlParam = params.get("url") ?? "";

  const [scan, setScan]         = useState<StoredScan | null>(null);
  const [loaded, setLoaded]     = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // "anon" | "free" | "paid" — determines what's shown in the error panel
  const [userTier, setUserTier] = useState<"anon" | "free" | "paid">("anon");
  // ── Animated score counter ────────────────────────────────────────────────
  const [displayScore, setDisplayScore] = useState(0);
  // ── Magic pulse: first-time hint on first expandable row ─────────────────
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    const norm = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();

    // 1. Primary path: read from sessionStorage
    const stored = loadScanFromStorage();
    if (stored && (!urlParam || norm(stored.url) === norm(urlParam))) {
      setScan(stored);
      setLoaded(true);
      return;
    }

    // 2. Fallback: session expired or opened in new tab — try the 24h scan cache
    if (urlParam) {
      fetch(`/api/scan/cached?url=${encodeURIComponent(urlParam)}`)
        .then(r => r.json())
        .then((cached: { found: boolean; scanData?: unknown; diagnose?: string }) => {
          if (cached.found && cached.scanData) {
            // Re-hydrate storage from cache (read-only — no scan token consumed)
            saveScanToStorage(urlParam, { scanData: cached.scanData as never, diagnose: cached.diagnose });
            const reloaded = loadScanFromStorage();
            if (reloaded) setScan(reloaded);
          }
        })
        .catch(() => { /* cache miss or network error — demo mode */ })
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [urlParam]);

  // Fetch session to determine user tier
  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(data => {
        const plan: string = (data?.user as { plan?: string } | undefined)?.plan ?? "";
        if (!data?.user) {
          setUserTier("anon");
        } else if (["smart-guard", "agency-starter", "agency-pro"].includes(plan)) {
          setUserTier("paid");
        } else {
          setUserTier("free"); // logged in but free plan
        }
      })
      .catch(() => setUserTier("anon"));
  }, []);

  // ── Dynamic browser-tab title once scan data is available ──
  useEffect(() => {
    if (!scan) return;
    const domain = (() => { try { return new URL(scan.url).host; } catch { return scan.url; } })();
    document.title = `✅ Audit bereit: ${domain} | WebsiteFix`;
    return () => { document.title = "WebsiteFix | Compliance-Plattform für WordPress-Agenturen"; };
  }, [scan]);

  // ── Score count-up animation (0 → real score in 1.5s) ────────────────────
  const targetScore = !loaded ? 0 : (scan ? computeScore(scan) : DEMO_SCORE);
  useEffect(() => {
    if (targetScore === 0) return;
    const startTime = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / 1500, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplayScore(Math.round(targetScore * eased));
      if (p >= 1) { setDisplayScore(targetScore); clearInterval(id); }
    }, 16);
    return () => clearInterval(id);
  }, [targetScore]);

  // ── Show pulse hint until user first expands a detail row ────────────────
  useEffect(() => {
    try {
      if (!localStorage.getItem("wf_details_opened")) setShowPulse(true);
    } catch { /* localStorage unavailable */ }
  }, []);

  if (!loaded) return (
    <div style={{ background: "#0b0c10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Lade Ergebnisse…</div>
    </div>
  );

  // ── Derive display values ────────────────────────────────────────────────
  const isDemo       = !scan;
  const displayDomain = isDemo ? DEMO_DOMAIN : (() => { try { return new URL(scan!.url).host; } catch { return scan!.url; } })();
  const score        = isDemo ? DEMO_SCORE   : computeScore(scan!);
  const scoreColor   = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  const scoreLabel   = score >= 80 ? "Gut" : score >= 55 ? "Verbesserungsbedarf" : "Kritisch";

  // Pages list — must be built BEFORE pagesTotal so pagesTotal is derived from it
  const { base: pageBase, items: realPageItems } = isDemo
    ? { base: DEMO_DOMAIN, items: DEMO_PAGES_LIST }
    : buildPages(scan!);
  const pageItems  = isDemo ? DEMO_PAGES_LIST : realPageItems;
  const pagesTotal = isDemo ? DEMO_PAGES : pageItems.filter(p => !p.isSkipped).length;

  // Total errors = sum of ALL errors across ALL pages (the real number the user sees in the map)
  const totalTableErrors = isDemo ? 0 : pageItems.filter(p => !p.isSkipped && p.errors > 0).reduce((s, p) => s + p.errors, 0);
  const errorDensity     = isDemo || pagesTotal <= 0 ? 0 : Math.round((totalTableErrors / pagesTotal) * 10) / 10;

  // critErrors is the total sum — NOT a boolean type-count
  const critErrors   = isDemo ? DEMO_CRIT : (totalTableErrors > 0 ? totalTableErrors : computeIssueCount(scan!));
  const liability    = isDemo ? "HOCH"    : liabilityLevel(score, critErrors > 0 ? Math.min(critErrors, 13) : 0);
  const liabColor    = liabilityColor(liability);

  // Context strings for discovered vs analysed
  const entdeckteUrls  = scan?.entdeckteUrls  ?? 0;
  const gefilterteUrls = scan?.gefilterteUrls ?? 0;
  const skippedCount   = (scan?.skippedUrls ?? []).length;

  // ── Magic pulse helpers ───────────────────────────────────────────────────
  // Index of first expandable row (first non-skipped page with errors)
  const firstErrorIdx = pageItems.findIndex(p => !p.isSkipped && p.errors > 0 && !isDemo);

  function handleExpand(key: string) {
    setExpandedRow(prev => prev === key ? null : key);
    if (showPulse) {
      setShowPulse(false);
      try { localStorage.setItem("wf_details_opened", "1"); } catch { /* ignore */ }
    }
  }

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

          {/* Demo-mode notice — clearly distinct from real scan results */}
          {isDemo && (
            <div style={{
              marginBottom: 28, padding: "16px 20px", borderRadius: 12,
              background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.3)",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 0 20px rgba(251,191,36,0.06)",
            }}>
              <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 2 }}>Beispiel-Vorschau — keine echten Scan-Daten</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                  Diese Anzeige basiert auf fiktiven Demo-Daten. <Link href="/scan" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 600 }}>Eigene URL jetzt scannen →</Link>
                </div>
              </div>
            </div>
          )}

          {/* ── Audit-Protokoll Header ── */}
          <div style={{ marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {loaded && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 14px", borderRadius: 20, fontSize: 11, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e", fontWeight: 700, letterSpacing: "0.06em" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block" }} />
                  Scan abgeschlossen
                </div>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>360° Audit-Protokoll</span>
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.15 }}>
              Website-Analyse für{" "}
              <span style={{ background: "linear-gradient(90deg,#7aa6ff,#8df3d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{displayDomain}</span>
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              {!isDemo && entdeckteUrls > pagesTotal
                ? <><span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{pagesTotal} von {entdeckteUrls}</span> Seiten analysiert (Free-Limit)</>
                : <>{pagesTotal} {pagesTotal === 1 ? "Seite" : "Seiten"} analysiert</>
              }
              {!isDemo && gefilterteUrls > 0 && ` · ${gefilterteUrls} Feeds/XML übersprungen`}
              {!isDemo && critErrors > 0 && (
                <span style={{ color: "#f59e0b", fontWeight: 600 }}> · {critErrors} Optimierungen gefunden</span>
              )}
            </p>
          </div>

          {/* ── WEBSITE-OPTIMIERUNGS-REPORT ── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>360° Website-Optimierungs-Report</p>
                {!isDemo && critErrors > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", color: "#FBBF24" }}>
                    ⚡ {critErrors} Optimierungen verfügbar
                  </span>
                )}
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
                {!isDemo && critErrors > 0
                  ? `${critErrors} Optimierungen für deine Website`
                  : "Website-Optimierungs-Report"}
              </h2>
              {!isDemo && critErrors > 0 && (
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  Auf {pagesTotal} analysierten {pagesTotal === 1 ? "Seite" : "Seiten"}{" "}
                  <strong style={{ color: "#fff" }}>{critErrors} Verbesserungsmöglichkeiten</strong> identifiziert
                  {errorDensity > 0 ? ` — ⌀ ${errorDensity} pro Seite` : ""}.
                </p>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {/* Red — Sichtbarkeits-Blocker */}
              <div style={{ padding: "20px 22px", borderRadius: 14, background: critErrors > 0 && !isDemo ? "rgba(239,68,68,0.07)" : "rgba(239,68,68,0.05)", border: critErrors > 0 && !isDemo ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(239,68,68,0.2)", display: "flex", flexDirection: "column", gap: 10, boxShadow: critErrors > 0 && !isDemo ? "0 0 24px rgba(239,68,68,0.08)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🔴</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Sichtbarkeits-Blocker</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    !scan?.https && "Kein HTTPS: Google Chrome zeigt Sicherheitswarnung — schadet Vertrauen & Rankings",
                    scan?.robotsBlocked && "robots.txt blockiert Google: Seite wird nicht indexiert — kein organischer Traffic möglich",
                    scan?.noIndex && "noindex auf Startseite: Google schließt die Seite aktiv aus dem Index aus",
                    (scan?.brokenLinksCount ?? 0) > 0 && `${scan!.brokenLinksCount} Broken Links: Google wertet defekte Seiten als schlechtes Qualitätssignal`,
                    !scan?.hasTitle && "Kein <title>-Tag: fehlt als wichtigstes On-Page-SEO-Signal",
                    scan?.hasUnreachable && "Unterseiten nicht erreichbar (404): beeinträchtigt Nutzererlebnis & Crawling",
                    (scan?.altMissingCount ?? 0) > 0 && `${scan!.altMissingCount} Bilder ohne Alt-Text: Google kann sie nicht lesen — SEO-Potenzial verschenkt`,
                    isDemo && "Formularfelder ohne Label: beeinträchtigt Nutzererlebnis & Barrierefreiheit",
                    isDemo && "3 Broken Links: Google & Nutzer landen auf leeren Seiten",
                  ].filter(Boolean).map((msg, i) => (
                    <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                      <span style={{ color: "#ef4444", flexShrink: 0 }}>✕</span>{msg as string}
                    </div>
                  ))}
                  {!isDemo && !scan?.robotsBlocked && scan?.https && !scan?.noIndex && (scan?.brokenLinksCount ?? 0) === 0 && scan?.hasTitle && !scan?.hasUnreachable && (scan?.altMissingCount ?? 0) === 0 && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>Keine Sichtbarkeits-Blocker gefunden ✓</div>
                  )}
                </div>
              </div>
              {/* Yellow — SEO & UX-Optimierungen */}
              <div style={{ padding: "20px 22px", borderRadius: 14, background: AMBER_BG, border: `1px solid ${AMBER_BDR}`, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>✦</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: AMBER }}>SEO & UX-Optimierungen</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    !scan?.hasMeta && "Meta-Description fehlt: Klickrate in Google-Suchergebnissen leidet",
                    !scan?.hasH1 && "Kein H1-Tag: Google fehlt die Haupt-Überschrift als Relevanz-Signal",
                    !scan?.hasSitemap && "Keine Sitemap: Google findet neue Seiten langsamer",
                    (scan?.duplicateTitlesCount ?? 0) > 1 && "Doppelte Seitentitel: Keyword-Kannibalisierung schadet Rankings",
                    (scan?.duplicateMetasCount ?? 0) > 1 && "Doppelte Meta-Descriptions: Google verwässert das Relevanz-Signal",
                    isDemo && `168 Bilder ohne Alt-Text: Google kann sie nicht lesen — Smart-Fix verfügbar`,
                    isDemo && "9 Seiten ohne Meta-Description — automatisch behebbar",
                  ].filter(Boolean).map((msg, i) => (
                    <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                      <span style={{ color: AMBER, flexShrink: 0 }}>→</span>{msg as string}
                    </div>
                  ))}
                </div>
              </div>
              {/* Green — Bereits optimiert */}
              <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🟢</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Bereits optimiert ✓</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {[
                    (scan?.https ?? isDemo) && "HTTPS aktiv — verschlüsselte Verbindung",
                    (scan?.hasTitle ?? isDemo) && "Title-Tag vorhanden — Google-Ranking-Grundlage",
                    (scan?.hasSitemap ?? isDemo) && "Sitemap gefunden — Indexierung optimiert",
                    (scan?.hasMeta ?? isDemo) && "Meta-Description gesetzt — bessere Klickrate",
                    (scan?.hasH1 ?? false) && "H1-Überschrift vorhanden — klares Relevanz-Signal",
                    (scan ? !scan.robotsBlocked : isDemo) && "Google-Zugang erlaubt — vollständige Indexierung",
                  ].filter(Boolean).map((msg, i) => (
                    <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                      <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>{msg as string}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Dashboard-Metriken ── */}
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
                <HealthRing score={score} displayScore={displayScore} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: scoreColor, letterSpacing: "-0.04em", lineHeight: 1 }}>{displayScore}%</span>
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
                  {pagesTotal}
                  {!isDemo && entdeckteUrls > pagesTotal && (
                    <span style={{ fontSize: 15, color: "rgba(255,255,255,0.25)", fontWeight: 400 }}> /{entdeckteUrls}</span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Gescannte Seiten</div>
                <a href="#deep-scan-map" style={{ fontSize: 12, color: "#7aa6ff", marginTop: 4, fontWeight: 500, display: "block", textDecoration: "none" }}>
                  Beweis: Alle {pagesTotal} Seiten ↓
                </a>
              </div>
            </div>

            {/* Sichtbarkeits-Blocker */}
            <div style={{
              background: "rgba(255,255,255,0.025)",
              border: critErrors === 0 ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(245,158,11,0.25)",
              borderRadius: 20, padding: "28px 28px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              boxShadow: critErrors === 0 ? "0 0 30px rgba(34,197,94,0.06)" : "0 0 30px rgba(245,158,11,0.06)",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: critErrors === 0 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", border: critErrors === 0 ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={critErrors === 0 ? "#22c55e" : "#f59e0b"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="11" y1="16" x2="11.01" y2="16"/></svg>
              </div>
              <div>
                <a href="#deep-scan-map" style={{ textDecoration: "none" }}>
                  <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: critErrors === 0 ? "#22c55e" : "#f59e0b", lineHeight: 1, cursor: critErrors > 0 ? "pointer" : "default" }}>
                    {critErrors}
                  </div>
                </a>
                <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                  {critErrors === 0 ? "Alles sauber" : "Sichtbarkeits-Blocker"}
                </div>
                <div style={{ fontSize: 12, color: critErrors === 0 ? "#22c55e" : "#f59e0b", marginTop: 4, fontWeight: 500 }}>
                  {critErrors === 0 ? "Top Google-Sichtbarkeit ✓" : "Direkt wirksam auf Google-Ranking"}
                </div>
                {critErrors > 0 && !isDemo && pagesTotal > 0 && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                    ⌀ {errorDensity} Optimierungen / Seite
                  </div>
                )}
                {critErrors > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <a href="#deep-scan-map" style={{ fontSize: 11, color: "#7aa6ff", textDecoration: "none", fontWeight: 600 }}>
                      → Schritt-für-Schritt Fixes ansehen
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* On-Page SEO Status */}
            {(() => {
              const seoChecks = [
                { ok: scan?.hasTitle  ?? isDemo, label: "Title-Tag" },
                { ok: scan?.hasMeta   ?? isDemo, label: "Meta-Description" },
                { ok: scan?.hasH1     ?? false,  label: "H1-Tag" },
                { ok: scan?.hasSitemap ?? isDemo, label: "Sitemap" },
                { ok: !(scan?.robotsBlocked ?? false) || isDemo, label: "Google-Zugang" },
                { ok: scan?.https ?? isDemo, label: "HTTPS" },
              ];
              const goodCount = seoChecks.filter(c => c.ok).length;
              const seoStatus = goodCount >= 5 ? "GUT" : goodCount >= 3 ? "MITTEL" : "SCHWACH";
              const seoColor  = goodCount >= 5 ? "#22c55e" : goodCount >= 3 ? "#f59e0b" : "#ef4444";
              return (
                <div style={{
                  background: "rgba(255,255,255,0.025)", border: `1px solid ${seoColor}40`,
                  borderRadius: 20, padding: "28px 28px",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  boxShadow: `0 0 30px ${seoColor}10`,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${seoColor}18`, border: `1px solid ${seoColor}30`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={seoColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: seoColor, lineHeight: 1 }}>{seoStatus}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>On-Page SEO Status</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                      {seoChecks.map(c => (
                        <span key={c.label} style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          <span style={{ color: c.ok ? "#22c55e" : "rgba(255,255,255,0.2)", fontSize: 10 }}>{c.ok ? "✓" : "○"}</span>
                          <span style={{ color: c.ok ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.2)" }}>{c.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </section>

        {/* ── WORDPRESS-STACK ANALYSE ── */}
        {!isDemo && (
          <section style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 0" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(33,117,218,0.12)", border: "1px solid rgba(33,117,218,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.09em" }}>CMS-Stack Analyse</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>WordPress erkannt — tiefgehende Prüfung</div>
                </div>
                {scan?.wpVersion && (
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "rgba(122,166,255,0.08)", border: "1px solid rgba(122,166,255,0.2)" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>WordPress</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#7aa6ff", fontFamily: "monospace" }}>v{scan.wpVersion}</span>
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                {[
                  {
                    label: "WordPress erkannt",
                    ok: true,
                    detail: scan?.wpVersion ? `Version ${scan.wpVersion} im Generator-Tag` : "Version nicht öffentlich sichtbar",
                    risk: !scan?.wpVersion ? null : "Version öffentlich: Angreifer können gezielt bekannte Lücken suchen",
                    riskLevel: scan?.wpVersion ? "warn" : null,
                  },
                  {
                    label: "XML-RPC Schnittstelle",
                    ok: !(scan?.xmlRpcOpen),
                    detail: scan?.xmlRpcOpen ? "/xmlrpc.php antwortet (Angriffsfläche offen)" : "/xmlrpc.php blockiert ✓",
                    risk: scan?.xmlRpcOpen ? "Sicherheitsrisiko: XML-RPC ermöglicht Brute-Force-Attacken & DDoS-Amplification" : null,
                    riskLevel: scan?.xmlRpcOpen ? "crit" : null,
                  },
                  {
                    label: "Sitemap gefunden",
                    ok: !!(scan?.hasSitemap),
                    detail: scan?.sitemapIndexFound ? "sitemap_index.xml vorhanden" : scan?.hasSitemap ? "sitemap.xml vorhanden" : "Keine Sitemap gefunden",
                    risk: !scan?.hasSitemap ? "Google findet neue Seiten langsamer — SEO-Indexierungsverzögerung" : null,
                    riskLevel: !scan?.hasSitemap ? "warn" : null,
                  },
                  {
                    label: "robots.txt Status",
                    ok: !(scan?.robotsBlocked),
                    detail: scan?.robotsBlocked ? "Disallow: / — alle Crawler gesperrt!" : "Crawler erlaubt ✓",
                    risk: scan?.robotsBlocked ? "Kritisch: Seite komplett deindexiert — kein organischer Traffic" : null,
                    riskLevel: scan?.robotsBlocked ? "crit" : null,
                  },
                  {
                    label: "SEO-Plugin",
                    ok: !!(scan?.hasRankMath || scan?.hasYoast),
                    detail: scan?.hasRankMath
                      ? "Rank Math erkannt — strukturierte SEO-Daten aktiv"
                      : scan?.hasYoast
                        ? "Yoast SEO erkannt — strukturierte SEO-Daten aktiv"
                        : "Kein SEO-Plugin erkannt",
                    risk: !(scan?.hasRankMath || scan?.hasYoast)
                      ? "Schema-Markup & Sitemap-Generierung möglicherweise nicht optimiert"
                      : (scan?.hasRankMath && scan?.hasSitemap)
                        ? "Sitemap-Validierung erfolgreich ✓"
                        : null,
                    riskLevel: !(scan?.hasRankMath || scan?.hasYoast) ? "warn" : null,
                  },
                ].map((item) => {
                  const borderColor = !item.ok ? (item.riskLevel === "crit" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.2)") : "rgba(34,197,94,0.15)";
                  const bgColor    = !item.ok ? (item.riskLevel === "crit" ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.04)") : "rgba(34,197,94,0.03)";
                  const dotColor   = !item.ok ? (item.riskLevel === "crit" ? "#ef4444" : "#f59e0b") : "#22c55e";
                  return (
                    <div key={item.label} style={{ padding: "12px 14px", borderRadius: 10, background: bgColor, border: `1px solid ${borderColor}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: dotColor, flexShrink: 0 }}>{item.ok ? "✓" : "✕"}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>{item.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", lineHeight: 1.4, marginBottom: item.risk ? 6 : 0 }}>{item.detail}</div>
                      {item.risk && (
                        <div style={{ fontSize: 10, color: dotColor, lineHeight: 1.4, opacity: 0.85 }}>{item.risk}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── SECTION 2: DEEP-SCAN MAP ── */}
        <section id="deep-scan-map" style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Deep-Scan Map</p>
              <h2 style={{ margin: "0 0 6px", fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
                {isDemo ? "Alle gefundenen Unterseiten" : `${pagesTotal} ${pagesTotal === 1 ? "Seite" : "Seiten"} analysiert`}
              </h2>
              {!isDemo && (entdeckteUrls > pagesTotal || skippedCount > 0) && (
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                  {entdeckteUrls > 0 ? `${entdeckteUrls} URLs entdeckt` : ""}
                  {skippedCount > 0 ? ` · ${skippedCount} Feed/XML-Endpunkte übersprungen` : ""}
                  {!isDemo && totalTableErrors > 0 ? ` · ${totalTableErrors} Fehler gesamt` : ""}
                </p>
              )}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: 8, flexShrink: 0 }}>
              {pagesTotal} Seiten · BFS-Crawler
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Seite</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", width: 120, textAlign: "center" }}>Status</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", width: 90, textAlign: "right" }}>Fehler</span>
            </div>

            {/* All rows with expandable detail panels */}
            {pageItems.map((p, i) => {
              // Skipped URLs (feed/xml/json) — special gray treatment
              if (p.isSkipped) {
                return (
                  <div key={p.path + i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", opacity: 0.55 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.2)" }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{pageBase}{p.path}</span>
                    </div>
                    <div style={{ width: 120, textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Übersprungen
                      </span>
                    </div>
                    <div style={{ width: 90, textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>—</span>
                    </div>
                  </div>
                );
              }

              // Normal rows
              const isUnreachable = !p.erreichbar;
              const dotColor   = isUnreachable ? "#ef4444" : p.errors === 0 ? "#22c55e" : p.errors >= 4 ? "#ef4444" : "#f59e0b";
              const statusLabel = isUnreachable ? "Nicht erreichbar" : p.errors === 0 ? "✓ Sauber" : p.errors >= 4 ? "Kritisch" : "Warnung";
              const isExpanded  = expandedRow === (p.path + i);
              const canExpand   = !isDemo && p.errors > 0;

              return (
                <div key={p.path + i}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: dotColor, boxShadow: `0 0 5px ${dotColor}` }} />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>
                        {pageBase}{p.path}
                      </span>
                    </div>
                    <div style={{ width: 120, textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        background: isUnreachable ? "rgba(239,68,68,0.1)" : p.errors === 0 ? "rgba(34,197,94,0.1)" : p.errors >= 4 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        color: dotColor, border: `1px solid ${dotColor}33` }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ width: 90, textAlign: "right" }}>
                      <span
                        onClick={() => canExpand && handleExpand(p.path + i)}
                        style={{ fontSize: 13, fontWeight: 700, color: p.errors === 0 ? "rgba(255,255,255,0.2)" : dotColor, cursor: canExpand ? "pointer" : "default", userSelect: "none",
                          textDecoration: canExpand ? "underline dotted" : "none", textUnderlineOffset: 3 }}>
                        {p.errors === 0 ? "—" : `${p.errors} Fehler`}
                        {canExpand && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>{isExpanded ? "▲" : "▼"}</span>}
                      </span>
                      {/* ── Magic pulse: gold tooltip on first expandable row ── */}
                      {canExpand && showPulse && i === firstErrorIdx && (
                        <div className="wf-pulse-hint" style={{
                          marginTop: 6, padding: "4px 8px", borderRadius: 5,
                          background: "rgba(251,191,36,0.12)",
                          border: "1px solid rgba(251,191,36,0.4)",
                          fontSize: 10, color: "#FBBF24", fontWeight: 700,
                          whiteSpace: "nowrap", lineHeight: 1.3,
                          cursor: "pointer",
                        }} onClick={() => handleExpand(p.path + i)}>
                          ↑ Klick hier: Dein Schritt-für-Schritt SEO-Fix
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── BEWEIS-MODUS: technisches Protokoll ── */}
                  {isExpanded && <ProtoPanelContent p={p} tier={userTier} />}
                </div>
              );
            })}

            {/* Error total footer row */}
            {!isDemo && totalTableErrors > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>Gesamt</span>
                <div style={{ width: 120 }} />
                <div style={{ width: 90, textAlign: "right" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>{totalTableErrors} Fehler</span>
                </div>
              </div>
            )}

            {/* Registrierung CTA under the map */}
            <div style={{ padding: "14px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <Link href="/register" style={{ fontSize: 13, color: "#7aa6ff", textDecoration: "none", fontWeight: 600 }}>
                Kostenlos registrieren — Ergebnisse dauerhaft speichern →
              </Link>
            </div>
          </div>
        </section>

        {/* ── WEBSITE-EXZELLENZ BADGE ── */}
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
                  Website-Exzellenz ✓
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                  Keine Sichtbarkeits-Blocker gefunden — diese Website ist für Google und Nutzer optimal aufgestellt.
                </div>
              </div>
              <div style={{
                marginLeft: "auto", flexShrink: 0,
                fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                color: "#22c55e", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                Top Score
              </div>
            </div>
          </section>
        )}

        {/* ── RE-SCAN LINK ── */}
        <div style={{ textAlign: "center", padding: "40px 24px 72px" }}>
          <Link href="/scan" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>
            ← Neue URL scannen
          </Link>
        </div>

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
        @keyframes wf-pulse-hint {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); border-color: rgba(251,191,36,0.4); }
          50%       { box-shadow: 0 0 0 4px rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.75); }
        }
        .wf-pulse-hint {
          animation: wf-pulse-hint 1.8s ease-in-out infinite;
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
