"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import BrandLogo from "../../components/BrandLogo";
import MobileNav from "../../components/MobileNav";
import SiteFooter from "../../components/SiteFooter";

import { type StoredScan, saveScanToStorage, loadScanFromStorage } from "@/lib/scan-storage";
import { normalizePlan } from "@/lib/plans";

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
// More errors → lower score (inversely coupled to Sichtbarkeits-Potenzial).
// Boolean flags give a base deduction; counts give proportional penalties.
function computeScore(d: StoredScan): number {
  let s = 100;
  if (!d.https)                    s -= 20;
  if (!d.hasTitle)                 s -= 8;
  if (!d.hasMeta)                  s -= 6;
  if (!d.hasH1)                    s -= 5;
  if (d.robotsBlocked)             s -= 15;
  if (!d.hasSitemap)               s -= 4;
  if (d.hasUnreachable)            s -= 8;
  if (d.noIndex)                   s -= 12;
  // Broken links: proportional up to -20
  if (d.brokenLinksCount > 0)
    s -= Math.min(20, 5 + d.brokenLinksCount * 2);
  // Duplicate titles: proportional up to -10
  if (d.duplicateTitlesCount > 1)
    s -= Math.min(10, d.duplicateTitlesCount * 2);
  // Missing alt texts: tiered proportional up to -25
  const alt = d.altMissingCount ?? 0;
  s -= alt > 30 ? 25 : alt > 15 ? 18 : alt > 5 ? 12 : alt > 0 ? 6 : 0;
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
const DEMO_SCORE   = 48;
const DEMO_PAGES   = 42;
const DEMO_CRIT    = 21; // sum of DEMO_PAGES_LIST errors: 3+5+2+4+1+3+2+1
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
// Amber-first: every finding is an optimization opportunity, not an accusation
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
  // Rank-blockers use amber, not red — framing as opportunity, not alarm
  const c  = severity === "red" ? "#f59e0b" : AMBER;
  const bg = severity === "red" ? "rgba(245,158,11,0.07)" : AMBER_BG;
  const bd = severity === "red" ? "rgba(245,158,11,0.22)" : AMBER_BDR;
  const showDetail = tier !== "anon";
  return (
    <div style={{ padding: "9px 14px", borderRadius: 9, display: "flex", alignItems: "flex-start", gap: 10, background: bg, border: `1px solid ${bd}` }}>
      <span style={{ color: c, flexShrink: 0, marginTop: 2, fontSize: 12, fontWeight: 800 }}>
        {severity === "red" ? "✕" : "→"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Finding title always visible */}
        <div style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: "monospace", marginBottom: detail ? 3 : 0 }}>
          {title}
        </div>
        {/* Detail: anon = unlock teaser | free/paid = real value */}
        {detail && (
          !showDetail ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: law ? 3 : 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(122,166,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span style={{ fontSize: 11, color: "rgba(122,166,255,0.5)", fontStyle: "italic", letterSpacing: "0.03em" }}>
                Vollständige Analyse nach Freischaltung
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "monospace", marginBottom: (law || manualHint) ? 3 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {detail}
            </div>
          )
        )}
        {/* Fix hint — free users only */}
        {showDetail && manualHint && tier === "free" && (
          <div style={{ fontSize: 11, color: "rgba(141,243,211,0.7)", marginBottom: law ? 3 : 0, fontStyle: "italic" }}>
            Fix: {manualHint}
          </div>
        )}
        {law && (
          <div style={{ fontSize: 10, color: c, opacity: 0.7, fontWeight: 600 }}>{law}</div>
        )}
      </div>
      <span style={{
        fontSize: 10, padding: "2px 6px", borderRadius: 4, flexShrink: 0,
        background: "rgba(251,191,36,0.14)",
        color: "#FBBF24", border: "1px solid rgba(251,191,36,0.35)", fontWeight: 800, letterSpacing: "0.05em",
        whiteSpace: "nowrap",
      }}>
        {severity === "red" ? "PRIO" : "OPTIMIERUNG"}
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
  if (reachCount > 0) chips.push({ label: `${reachCount} Erreichbarkeits-Problem`, color: "#f59e0b" });
  if (imgCount   > 0) chips.push({ label: `${imgCount} Bild-Optimierungen`,       color: "#f59e0b" });
  if (formCount  > 0) chips.push({ label: `${formCount} Formular-Optimierungen`,  color: AMBER });
  if (seoCount   > 0) chips.push({ label: `${seoCount} SEO-Optimierungen`,        color: AMBER });

  // Funnel-Personalisierung Stufe B (05.05.2026):
  // Wenn der User von einer SEO-Card mit ?problem=<pillar> kam, hat /scan
  // den Pillar in localStorage.wf_focus_pillar persistiert. Hier lesen wir
  // ihn, um die Befunde-Liste pillar-spezifisch zu sortieren — die match-
  // Befunde kommen unter einem hervorgehobenen Section-Header zuerst,
  // andere Befunde darunter unter "Weitere Befunde".
  const [focusPillar, setFocusPillar] = useState<"visibility" | "health" | "speed" | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("wf_focus_pillar");
    if (stored === "visibility" || stored === "health" || stored === "speed") {
      setFocusPillar(stored);
    }
  }, []);

  // Befunde-Sammlung als Array — jeder Eintrag mit Pillar-Tag.
  // Erlaubt es uns, je nach focusPillar zu sortieren ohne die JSX-Switches
  // zu verlieren. Speed-Befunde gibt's hier nicht (sind im Backend-Scan,
  // nicht im StoredScan-Snapshot) — User mit ?problem=speed sieht daher
  // alle Befunde + einen Hinweis-Banner.
  type Pillar = "visibility" | "health" | "recht";
  const findings: Array<{ pillar: Pillar; el: React.ReactElement }> = [];

  if (isUnreachable) findings.push({ pillar: "health", el: (
    <ProtoRow key="unreachable" severity="red" tier={tier}
      title="HTTP: Seite nicht erreichbar"
      detail={`GET ${p.path} → 404 Not Found / Connection Timeout`}
      law="Wachstums-Bremse: verschenkt wertvolles SEO-Ranking und Nutzer-Vertrauen"
      manualHint="Prüfe Server-Status und richte eine 301-Weiterleitung auf die korrekte URL ein"
    />
  )});
  if (p.missingH1) findings.push({ pillar: "visibility", el: (
    <ProtoRow key="h1" severity="red" tier={tier}
      title="<h1>-Tag fehlt"
      detail="Überschriften-Hierarchie fehlt — Screenreader verlieren Seitenstruktur"
      law="SEO-Ranking: Seitenstruktur für Google-Crawler und Nutzer essentiell"
      manualHint='Füge <h1>Dein Seitenthema</h1> einmalig pro Seite in den Seiteninhalt ein'
    />
  )});
  if (p.missingTitle) findings.push({ pillar: "visibility", el: (
    <ProtoRow key="title" severity="yellow" tier={tier}
      title="<title>-Tag fehlt"
      detail="Kein Seitentitel — erscheint namenlos in Suchergebnissen"
      law="SEO-Grundlage: Seitenname fehlt in Suchergebnissen — direkter Klick-Verlust"
      manualHint='Ergänze <title>Seitenname | Deine Marke</title> im WordPress-SEO-Plugin (Yoast/Rank Math)'
    />
  )});
  if (p.missingMeta) findings.push({ pillar: "visibility", el: (
    <ProtoRow key="meta" severity="yellow" tier={tier}
      title="Meta-Description fehlt"
      detail="Google wählt beliebigen Text als Snippet — CTR sinkt"
      law="SEO-Best Practice"
      manualHint="Öffne die Seite im Editor → SEO-Plugin → Meta-Beschreibung ausfüllen (120–160 Zeichen)"
    />
  )});
  altImages.forEach((img, idx) => findings.push({ pillar: "recht", el: (
    <ProtoRow key={`img-named-${idx}`} severity="red" tier={tier}
      title={`<img alt=""> fehlt`}
      detail={img}
      law="SEO-Potenzial: Bilder ohne Alt-Text sind für Google unsichtbar — verschenkt Bild-Ranking"
      manualHint='Füge alt="[Bildbeschreibung]" zum <img>-Tag hinzu — im WordPress-Medien-Manager unter "Alternativtext"'
    />
  )}));
  Array.from({ length: extraAlt }, (_, i) => findings.push({ pillar: "recht", el: (
    <ProtoRow key={`img-extra-${i}`} severity="red" tier={tier}
      title={`<img alt=""> fehlt`}
      detail="Dateiname nicht ermittelt"
      law="SEO-Potenzial: Bilder ohne Alt-Text sind für Google unsichtbar — verschenkt Bild-Ranking"
      manualHint='Füge alt="[Bildbeschreibung]" zum <img>-Tag hinzu — im WordPress-Medien-Manager unter "Alternativtext"'
    />
  )}));
  Array.from({ length: p.inputsWithoutLabel ?? 0 }, (_, i) => findings.push({ pillar: "recht", el: (
    <ProtoRow key={`label-${i}`} severity="red" tier={tier}
      title={`<label> fehlt für Formularfeld #${i + 1}`}
      detail="<input>-Element ohne zugeordnetes <label> oder aria-label"
      law="UX-Hürde: Formularfelder ohne Label senken Conversion-Rate"
      manualHint='Füge <label for="feldId">Beschreibung</label> vor dem Input ein oder setze aria-label="..."'
    />
  )}));
  Array.from({ length: p.buttonsWithoutText ?? 0 }, (_, i) => findings.push({ pillar: "recht", el: (
    <ProtoRow key={`btn-${i}`} severity="red" tier={tier}
      title={`<button> ohne sichtbaren Text #${i + 1}`}
      detail="Button-Element ohne Beschriftung oder aria-label"
      law="UX-Hürde: Buttons ohne Text schaden Konvertierung und Nutzer-Vertrauen"
      manualHint='Füge aria-label="Aktion beschreiben" zum <button>-Tag hinzu'
    />
  )}));
  if (p.noindex) findings.push({ pillar: "visibility", el: (
    <ProtoRow key="noindex" severity="yellow" tier={tier}
      title={`<meta name="robots" content="noindex"> aktiv`}
      detail="Seite explizit von Google-Indexierung ausgeschlossen"
      law="Kein organischer Traffic · direkter Umsatzverlust"
      manualHint='Entferne content="noindex" im SEO-Plugin (Yoast: "Suchmaschinen-Sichtbarkeit" aktivieren)'
    />
  )});

  // Pillar-Mapping für die Section-Headers + Theme-Farben
  const PILLAR_META: Record<NonNullable<typeof focusPillar>, { label: string; color: string; bg: string; bdr: string; matchPillars: Pillar[] }> = {
    visibility: { label: "Sichtbarkeit",  color: "#7aa6ff", bg: "rgba(122,166,255,0.08)", bdr: "rgba(122,166,255,0.30)", matchPillars: ["visibility"] },
    health:     { label: "Gesundheit",    color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  bdr: "rgba(251,191,36,0.30)",  matchPillars: ["health"] },
    speed:      { label: "Speed",         color: "#22d3ee", bg: "rgba(34,211,238,0.08)",  bdr: "rgba(34,211,238,0.30)",  matchPillars: [] /* keine Speed-Befunde im StoredScan */ },
  };

  // Wenn focusPillar gesetzt: matching zuerst, Rest darunter. Sonst Default-Reihenfolge.
  const matchingFindings = focusPillar
    ? findings.filter(f => PILLAR_META[focusPillar].matchPillars.includes(f.pillar))
    : [];
  const otherFindings = focusPillar
    ? findings.filter(f => !PILLAR_META[focusPillar].matchPillars.includes(f.pillar))
    : findings;

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

        {/* Pillar-spezifische Sektion: Match-Befunde mit hervorgehobenem Header */}
        {focusPillar && matchingFindings.length > 0 && (
          <div style={{
            padding: "8px 12px", marginBottom: 4, borderRadius: 7,
            background: PILLAR_META[focusPillar].bg,
            border: `1px solid ${PILLAR_META[focusPillar].bdr}`,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <span style={{ fontSize: 11 }}>🎯</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: PILLAR_META[focusPillar].color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Deine {PILLAR_META[focusPillar].label}-Befunde — {matchingFindings.length} gefunden
            </span>
          </div>
        )}
        {matchingFindings.map(f => f.el)}

        {/* Speed-Sonderfall: kein Match-Befund im StoredScan, aber wir
            bestätigen dem User, dass der Backend-Scan die Speed-Werte
            erfasst hat — sonst fühlt er sich nicht abgeholt. */}
        {focusPillar === "speed" && (
          <div style={{
            padding: "10px 14px", marginBottom: 4, borderRadius: 7,
            background: PILLAR_META.speed.bg,
            border: `1px dashed ${PILLAR_META.speed.bdr}`,
            fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.55,
          }}>
            <strong style={{ color: PILLAR_META.speed.color }}>Speed-Werte deiner Seite</strong> wurden im Hintergrund-Scan gemessen (Server-Antwortzeit, DOM-Tiefe, Asset-Größen) — du siehst sie im vollen Bericht im Dashboard. Hier sind die anderen Befunde, die wir auf der Seite gefunden haben:
          </div>
        )}

        {/* Trenner + Section-Header für "Weitere Befunde" — nur wenn fokussiert
            UND es einen Match-Block + andere Befunde gibt */}
        {focusPillar && matchingFindings.length > 0 && otherFindings.length > 0 && (
          <div style={{
            padding: "6px 12px", marginTop: 6, marginBottom: 2,
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            Weitere Befunde — {otherFindings.length}
          </div>
        )}
        {otherFindings.map(f => f.el)}

      </div>

      {/* ── CTA je nach Tier ── */}
      {tier === "anon" && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 9,
          background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
              Vollständige Analyse + Schritt-für-Schritt SEO-Fixes freischalten und Sichtbarkeit steigern
            </span>
          </div>
          <a
            href="#pricing"
            onClick={e => { e.preventDefault(); document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); }}
            style={{
              fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 7,
              background: "rgba(251,191,36,0.12)", color: "#FBBF24",
              border: "1px solid rgba(251,191,36,0.3)", textDecoration: "none", whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            Plan wählen →
          </a>
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
              KI-Auto-Fix (fertiger Code, Copy-Paste-bereit) im Professional Plan
            </span>
          </div>
          <Link href="/register?plan=professional" style={{
            fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 7,
            background: "rgba(251,191,36,0.12)", color: "#FBBF24",
            border: "1px solid rgba(251,191,36,0.3)", textDecoration: "none", whiteSpace: "nowrap",
          }}>
            Professional freischalten →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Ring chart ────────────────────────────────────────────────────────────────
function HealthRing({ score, displayScore }: { score: number; displayScore: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#FBBF24" : score >= 55 ? "#f59e0b" : "#f59e0b";
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

// ── Quick-Check-Zusammenfassung ──────────────────────────────────────────────
// Zeigt für anonyme/Free-User die wichtigsten Treffer aus Builder/Woo/DSGVO-
// Audit, OHNE konkrete Issue-Details preiszugeben. Druckt damit Wertigkeit auf
// und führt zum Upgrade.
function QuickCheckSummary({ scan, isDemo }: { scan: StoredScan | null; isDemo: boolean }) {
  if (isDemo || !scan) return null;

  const builder      = scan.builderAudit?.builder ?? null;
  const domDepth     = scan.builderAudit?.maxDomDepth ?? 0;
  const fonts        = scan.builderAudit?.googleFontFamilies.length ?? 0;

  // ── HARTE WooCommerce-Prüfung — keine False-Positives bei Tierärzten & Co. ──
  // Wir verlangen explizit `=== true` (nicht truthy) und prüfen ZUSÄTZLICH,
  // ob es echte Shop-Signale gibt: revenueRiskPct > 0 ODER konkrete shop-Befunde
  // im wooAudit. Sonst blenden wir die Karte komplett aus (auch wenn der
  // Backend-Flag fälschlich true wäre — Defense in depth).
  const wooDetected  = scan.isWooCommerce === true;
  const wooHasShopSignals =
    wooDetected && (
      (scan.wooAudit?.revenueRiskPct ?? 0) > 0 ||
      scan.wooAudit?.cartButtonsBlocked === true ||
      scan.wooAudit?.outdatedTemplates  === true ||
      (scan.wooAudit?.pluginImpact?.length ?? 0) >= 1 ||
      (scan.wooAudit?.addToCartButtons   ?? 0) > 0
    );
  // Sicherheits-Check ("keine Geister-Meldungen"): WooCommerce-Karte nur
  // anzeigen, wenn `isWooCommerce === true` UND mindestens ein konkretes
  // Shop-Signal vorliegt. Wenn isWooCommerce zwar true wäre aber alle Audit-
  // Werte bei 0 stehen (verdächtig — vermutlich False-Positive), zeigen wir
  // gar nichts. Konsequenz: Tierarztpraxen sehen niemals "WooCommerce" oder
  // "Umsatz-Risiko" auf ihrem Bericht.
  const showWooCard  = wooDetected && wooHasShopSignals;

  // Nichts erkannt → Komponente nicht anzeigen
  if (!builder && !showWooCard && fonts === 0) return null;

  const cards: Array<{
    title: string;
    detail: string;
    tone: "warn" | "ok" | "info";
    icon: "builder" | "shop" | "dsgvo" | "seo";
  }> = [];

  // SEO-Indikatoren für die "Indexierung & Sichtbarkeit"-Card.
  // Wird bei Nicht-Shop-Sites anstelle der WooCommerce-Card eingeblendet —
  // entspricht der Search-Console-User-Intention ("nicht gefunden").
  const altMissing      = scan.altMissingCount      ?? 0;
  const brokenLinks     = scan.brokenLinksCount     ?? 0;
  const orphanedPages   = scan.orphanedPagesCount   ?? 0;
  const seoBlockers: string[] = [
    altMissing > 50         ? `${altMissing} Bilder ohne Alt-Text`        : "",
    brokenLinks > 0          ? `${brokenLinks} defekte Link${brokenLinks !== 1 ? "s" : ""} (404)` : "",
    scan.hasUnreachable      ? "Unterseiten nicht erreichbar"              : "",
    scan.noIndex             ? "Startseite mit noindex"                    : "",
    scan.robotsBlocked       ? "robots.txt blockiert Crawler"              : "",
    !scan.hasTitle           ? "Title-Tag fehlt"                           : "",
    !scan.hasSitemap         ? "Sitemap fehlt"                             : "",
    orphanedPages > 0        ? `${orphanedPages} Waisenseiten`             : "",
  ].filter(Boolean) as string[];

  // SEO-Potential-Indikator (Heuristik): jeder Blocker = ~7 % Sichtbarkeits-Hebel,
  // gecappt bei 60 %. Wird im Conversion-Footer angezeigt.
  const seoPotentialPct = Math.min(60, seoBlockers.length * 7 + (altMissing > 200 ? 15 : 0) + (brokenLinks > 5 ? 10 : 0));

  if (builder) {
    const isCritical = domDepth > 22;
    const isWarning  = domDepth > 15 && !isCritical;
    cards.push({
      title:  isCritical ? `${builder} · DOM-Risiko: KRITISCH` : isWarning ? `${builder} · DOM-Risiko: HOCH` : `${builder} erkannt`,
      detail: isCritical || isWarning
        ? `DOM-Verschachtelungstiefe ${domDepth} — über dem Google-Limit von 15. Render-Stau auf Mobilgeräten wahrscheinlich.`
        : `Sauber konfiguriert · DOM-Tiefe im grünen Bereich.`,
      tone: isCritical ? "warn" : isWarning ? "warn" : "ok",
      icon: "builder",
    });
  }

  // Strict Content Logic:
  //   - WooCommerce-Card NUR wenn isWooCommerce === true UND Shop-Signale vorhanden
  //   - Bei Nicht-Shops: SEO-Status-Card als Ersatz (entspricht der GSC-User-Intent
  //     "Seite wird nicht gefunden")
  if (showWooCard) {
    cards.push({
      title:  wooHasShopSignals ? "⚠️ Umsatz-Risiko erkannt" : "WooCommerce-Shop erkannt",
      detail: wooHasShopSignals
        ? "Verzögerungen im Checkout reduzieren die Kaufwahrscheinlichkeit massiv. Details im vollen Bericht."
        : "Shop technisch sauber · Detail-Audit im vollen Bericht.",
      tone: wooHasShopSignals ? "warn" : "ok",
      icon: "shop",
    });
  } else {
    // SEO-Status-Card: zeigt Indexierung & Sichtbarkeit für Nicht-Shop-Seiten
    const hasMassiveBlockers = seoBlockers.length >= 2 || altMissing > 200 || brokenLinks > 5 || scan.noIndex || scan.robotsBlocked;
    cards.push({
      title:  hasMassiveBlockers
        ? "⚠️ Massive Sichtbarkeits-Blocker gefunden"
        : seoBlockers.length > 0
        ? "Indexierung & Sichtbarkeit · Optimierungsbedarf"
        : "Indexierung & Sichtbarkeit · Stabil",
      detail: hasMassiveBlockers
        ? `Google blockiert oder ignoriert wesentliche Teile deiner Seite${seoBlockers.length > 0 ? ` (${seoBlockers.slice(0, 2).join(" · ")}${seoBlockers.length > 2 ? "…" : ""})` : ""}. Sichtbarkeit & Traffic leiden direkt.`
        : seoBlockers.length > 0
        ? `Erste Hinweise gefunden: ${seoBlockers.slice(0, 2).join(" · ")}. Volle Auswertung im Bericht.`
        : "Keine Hinweise auf Indexierungs- oder Sichtbarkeits-Probleme auf der Startseite.",
      tone: hasMassiveBlockers ? "warn" : seoBlockers.length > 0 ? "info" : "ok",
      icon: "seo",
    });
  }

  if (fonts > 0) {
    cards.push({
      title:  "DSGVO-Status: Google Fonts gefunden",
      detail: "Externe Google-Font-Anfragen erkannt — DSGVO-relevant (LG München 3 O 17493/20). Konkrete Familien im vollen Bericht.",
      tone:   "warn",
      icon:   "dsgvo",
    });
  } else {
    cards.push({
      title:  "DSGVO-Status: Keine Google Fonts",
      detail: "Keine externen Font-Requests an Google-Server erkannt — gut für die Compliance.",
      tone:   "ok",
      icon:   "dsgvo",
    });
  }

  return (
    <div style={{
      marginBottom: 28, borderRadius: 14, overflow: "hidden",
      background: "linear-gradient(135deg, rgba(122,166,255,0.05), rgba(16,185,129,0.04))",
      border: "1px solid rgba(122,166,255,0.22)",
    }}>
      <div style={{
        padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const,
        borderBottom: "1px solid rgba(122,166,255,0.15)",
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 10,
          background: "rgba(122,166,255,0.12)", color: "#7aa6ff",
          border: "1px solid rgba(122,166,255,0.32)", letterSpacing: "0.08em",
        }}>
          QUICK-CHECK
        </span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
          Sofort-Diagnose deiner Seite
        </h3>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginLeft: "auto" }}>
          {showWooCard ? "Builder · WooCommerce · DSGVO" : "Builder · SEO & Sichtbarkeit · DSGVO"}
        </span>
      </div>
      <div
        className={`wf-quick-grid wf-quick-grid-${cards.length}`}
        style={{ padding: "14px 18px", display: "grid", gap: 10 }}
      >
        {cards.map((c, i) => {
          const colors = c.tone === "warn"
            ? { fg: "#fbbf24", bg: "rgba(251,191,36,0.08)", bd: "rgba(251,191,36,0.25)" }
            : c.tone === "ok"
            ? { fg: "#4ade80", bg: "rgba(74,222,128,0.08)", bd: "rgba(74,222,128,0.25)" }
            : { fg: "#7aa6ff", bg: "rgba(122,166,255,0.08)", bd: "rgba(122,166,255,0.25)" };

          return (
            <div key={i} style={{
              padding: "12px 14px", borderRadius: 10,
              background: colors.bg, border: `1px solid ${colors.bd}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                {/* Icon je Slot */}
                {c.icon === "builder" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {c.tone === "warn"
                      ? <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                      : <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></>}
                  </svg>
                )}
                {c.icon === "shop" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                )}
                {c.icon === "dsgvo" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                )}
                {c.icon === "seo" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                )}
                <span style={{ fontSize: 12.5, fontWeight: 800, color: colors.fg, letterSpacing: "-0.01em" }}>
                  {c.title}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                {c.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Conversion-Footer — quantifiziertes SEO-Potential, führt zum vollen Bericht */}
      <div style={{
        padding: "12px 18px 14px",
        borderTop: "1px solid rgba(122,166,255,0.12)",
        background: "rgba(16,185,129,0.04)",
        display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
        </svg>
        <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.55, flex: 1, minWidth: 220 }}>
          <strong style={{ color: "#10B981" }}>Dein SEO-Potential liegt bei +{Math.max(20, seoPotentialPct)}%.</strong>{" "}
          Der volle Bericht zeigt dir jede einzelne Unterseite, die Google aktuell blockiert.
        </p>
      </div>
    </div>
  );
}

// ── Upgrade-CTA für anon User ────────────────────────────────────────────────
function FullReportLockedCTA({ tier }: { tier: "anon" | "free" | "paid" }) {
  if (tier === "paid") return null; // Bezahlende sehen das nicht

  return (
    <div style={{
      marginBottom: 32, borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(124,58,237,0.06) 100%)",
      border: "1px solid rgba(16,185,129,0.32)",
      boxShadow: "0 0 40px rgba(16,185,129,0.08)",
    }}>
      <div style={{ padding: "22px 28px 20px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 800, color: "#10B981", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Vollen Bericht freischalten
        </p>
        <h3 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 900, letterSpacing: "-0.025em", color: "#fff" }}>
          Detaillierte Issues, Optimierungs-Plan und Builder-Anleitungen
        </h3>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
          Du hast die Quick-Check-Diagnose gesehen — der volle Bericht liefert konkrete Issues mit Lösungs-Snippets, einen exportierbaren Optimierungs-Plan und builder-spezifische Schritt-für-Schritt-Anleitungen für Elementor, Divi und Astra.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {/* Starter — 29 € */}
          <Link
            href="/register?plan=starter"
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "16px 20px", borderRadius: 12,
              background: "linear-gradient(90deg, #059669, #10B981)",
              border: "1px solid rgba(16,185,129,0.5)",
              textDecoration: "none", color: "#fff",
              boxShadow: "0 6px 20px rgba(16,185,129,0.32)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <line x1="12" y1="16" x2="12" y2="18"/>
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2, letterSpacing: "-0.01em" }}>
                Vollen Bericht für 29 € freischalten
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                Starter-Plan · 5 Scans/Monat · alle Issues sichtbar · monatlich kündbar
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>

          {/* Agency — 7 Tage Test */}
          <Link
            href="/register?plan=agency&trial=7"
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "16px 20px", borderRadius: 12,
              background: "rgba(124,58,237,0.10)",
              border: "1px solid rgba(124,58,237,0.45)",
              textDecoration: "none", color: "#fff",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <path d="M20 8v6"/><path d="M23 11h-6"/>
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 2, letterSpacing: "-0.01em", color: "#fff" }}>
                Für Agenturen: 7 Tage kostenlos testen
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                Agency-Plan · White-Label · Lead-Widget · unbegrenzte Scans
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>

        <p style={{ margin: "14px 0 0", fontSize: 11, color: "rgba(255,255,255,0.32)", lineHeight: 1.5, textAlign: "center" }}>
          Keine versteckten Kosten · DSGVO-konform · jederzeit kündbar
        </p>
      </div>
    </div>
  );
}

// ── Locked-Overlay-Wrapper für Detail-Cards (anon User) ──────────────────────
function LockedOverlay({ children, tier, ctaHref = "/register?plan=starter" }: {
  children: React.ReactNode;
  tier: "anon" | "free" | "paid";
  ctaHref?: string;
}) {
  if (tier === "paid") return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      {/* Geblurrter Inhalt — Struktur erkennbar, Text absolut nicht mehr entzifferbar */}
      <div style={{
        filter: "blur(10px)",
        pointerEvents: "none",
        userSelect: "none",
        opacity: 0.5,
      }} aria-hidden="true">
        {children}
      </div>
      {/* Lock-Overlay */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, padding: 20,
        background: "linear-gradient(180deg, rgba(11,12,16,0.45) 0%, rgba(11,12,16,0.78) 70%)",
        borderRadius: 14,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            Detail-Befunde im vollen Bericht
          </p>
          <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, maxWidth: 320 }}>
            Konkrete Issues, Lösungs-Snippets und builder-spezifische Anleitungen — ab 29 €/Monat.
          </p>
        </div>
        <Link href={ctaHref} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 8,
          background: "linear-gradient(90deg, #059669, #10B981)",
          color: "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none",
          boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
        }}>
          Jetzt freischalten →
        </Link>
      </div>
    </div>
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
  // ── Unlock animation: anon → free/paid tier transition ───────────────────
  const [unlocking, setUnlocking] = useState(false);
  const tierFirstLoad = useRef<"anon" | "free" | "paid" | null>(null);

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
        } else if (normalizePlan(plan) !== null) {
          setUserTier("paid");
        } else {
          setUserTier("free"); // logged in but unknown plan (shouldn't happen with new DB default)
        }
      })
      .catch(() => setUserTier("anon"));
  }, []);

  // ── Detect anon → logged-in transition and trigger unlock flash ───────────
  useEffect(() => {
    if (tierFirstLoad.current === null) {
      // First resolution: record the tier
      tierFirstLoad.current = userTier;
      return;
    }
    // Subsequent resolution: if we went from anon → free/paid, fire unlock
    if (tierFirstLoad.current === "anon" && userTier !== "anon") {
      tierFirstLoad.current = userTier;
      setUnlocking(true);
      const t = setTimeout(() => setUnlocking(false), 2200);
      return () => clearTimeout(t);
    }
  }, [userTier]);

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
  const scoreColor   = score >= 80 ? "#FBBF24" : score >= 55 ? "#f59e0b" : "#ef4444";
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
            <div className="hide-sm" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <Link
                href="/checkout?plan=starter"
                onClick={() => {
                  // Plausible-Event (no-op wenn Plausible nicht geladen)
                  if (typeof window !== "undefined") {
                    const w = window as unknown as {
                      plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
                      gtag?: (cmd: string, event: string, params?: Record<string, string>) => void;
                    };
                    try {
                      w.plausible?.("Click Optimize Button", { props: { location: "scan-header" } });
                      w.gtag?.("event", "click_optimize_button", { location: "scan-header" });
                    } catch { /* tracker not ready */ }
                  }
                }}
                className="wf-optimize-cta"
                style={{
                  fontSize: 13, padding: "8px 20px", borderRadius: 8, fontWeight: 700,
                  background: "#10B981", color: "#fff", textDecoration: "none",
                  whiteSpace: "nowrap" as const,
                }}
              >
                Jetzt optimieren →
              </Link>
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", fontWeight: 500, letterSpacing: "0.01em" }}>
                ✓ Über 1.200 WordPress-Seiten optimiert
              </span>
              <style>{`
                @keyframes wf-optimize-pulse {
                  0%, 100% {
                    box-shadow: 0 4px 14px rgba(16,185,129,0.40),
                                0 0 0 0 rgba(16,185,129,0.30);
                  }
                  50% {
                    box-shadow: 0 4px 22px rgba(16,185,129,0.65),
                                0 0 0 6px rgba(16,185,129,0.05);
                  }
                }
                .wf-optimize-cta {
                  animation: wf-optimize-pulse 2.4s ease-in-out infinite;
                  transition: transform 0.18s ease, filter 0.18s ease;
                }
                .wf-optimize-cta:hover {
                  transform: translateY(-1px);
                  filter: brightness(1.08);
                }
              `}</style>
            </div>
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

          {/* ── QUICK-CHECK-ZUSAMMENFASSUNG (anon/free) ── */}
          {userTier !== "paid" && <QuickCheckSummary scan={scan} isDemo={isDemo} />}

          {/* ── UPGRADE-CTA (anon/free) ── */}
          {!isDemo && userTier !== "paid" && <FullReportLockedCTA tier={userTier} />}

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
            {(() => {
              // Items pro Spalte erst sammeln und filtern, damit wir
              // bei leeren Spalten kein "Bug-Gefühl" produzieren.
              const blockerItems: string[] = [
                !scan?.https                       ? "Kein HTTPS: verhindert optimale Google-Sichtbarkeit und schließt potenzielle Kunden aus" : "",
                scan?.robotsBlocked                ? "robots.txt blockiert Google: Seite wird nicht indexiert — kein organischer Traffic möglich" : "",
                scan?.noIndex                      ? "noindex auf Startseite: Google schließt die Seite aktiv aus dem Index aus" : "",
                (scan?.brokenLinksCount ?? 0) > 0  ? `${scan!.brokenLinksCount} Broken Links: Nutzer und Google landen auf leeren Seiten — direkte Ranking-Einbuße` : "",
                !scan?.hasTitle                    ? "Kein <title>-Tag: wichtigstes On-Page-SEO-Signal fehlt — Klickrate sinkt" : "",
                scan?.hasUnreachable               ? "Unterseiten nicht erreichbar (404): Crawling-Budget verschwendet, Nutzer verloren" : "",
                (scan?.altMissingCount ?? 0) > 0   ? `${scan!.altMissingCount} Bilder ohne Alt-Text: Google-Bild-Suche vollständig ausgeschlossen` : "",
                isDemo                             ? "Formularfelder ohne Label: verhindert Conversions durch schlechte Nutzerführung" : "",
                isDemo                             ? "3 Broken Links: Nutzer und Google landen auf leeren Seiten" : "",
              ].filter(Boolean);

              const seoItems: string[] = [
                !scan?.hasMeta                            ? "Meta-Description fehlt: Klickrate in Google-Suchergebnissen leidet" : "",
                !scan?.hasH1                              ? "Kein H1-Tag: Google fehlt die Haupt-Überschrift als Relevanz-Signal" : "",
                !scan?.hasSitemap                         ? "Keine Sitemap: Google findet neue Seiten langsamer" : "",
                (scan?.duplicateTitlesCount ?? 0) > 1     ? "Doppelte Seitentitel: Keyword-Kannibalisierung schadet Rankings" : "",
                (scan?.duplicateMetasCount  ?? 0) > 1     ? "Doppelte Meta-Descriptions: Google verwässert das Relevanz-Signal" : "",
                isDemo                                    ? "168 Bilder ohne Alt-Text: Google kann sie nicht lesen — Smart-Fix Guide im Professional Plan" : "",
                isDemo                                    ? "9 Seiten ohne Meta-Description — automatisch behebbar" : "",
              ].filter(Boolean);

              const optimizedItems: string[] = [
                (scan?.https     ?? isDemo) ? "HTTPS aktiv — verschlüsselte Verbindung" : "",
                (scan?.hasTitle  ?? isDemo) ? "Title-Tag vorhanden — Google-Ranking-Grundlage" : "",
                (scan?.hasSitemap?? isDemo) ? "Sitemap gefunden — Indexierung optimiert" : "",
                (scan?.hasMeta   ?? isDemo) ? "Meta-Description gesetzt — bessere Klickrate" : "",
                (scan?.hasH1     ?? false)  ? "H1-Überschrift vorhanden — klares Relevanz-Signal" : "",
                (scan ? !scan.robotsBlocked : isDemo) ? "Google-Zugang erlaubt — vollständige Indexierung" : "",
              ].filter(Boolean);

              // Zähle, wie viele Spalten wirklich Inhalt haben — auf 2-Spalten-Grid wechseln,
              // wenn nur 2 Spalten Inhalt zeigen (vermeidet "leeres Loch").
              const filledColumns = (blockerItems.length > 0 ? 1 : 0) + (seoItems.length > 0 ? 1 : 0) + (optimizedItems.length > 0 ? 1 : 0);
              const minWidth = filledColumns >= 3 ? 220 : filledColumns === 2 ? 280 : 320;

              return (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`, gap: 12 }}>
                  {/* Gold — Wachstums-Bremsen (nur rendern, wenn Items vorhanden) */}
                  {blockerItems.length > 0 ? (
                    <div style={{ padding: "20px 22px", borderRadius: 14, background: critErrors > 0 && !isDemo ? "rgba(251,191,36,0.07)" : "rgba(251,191,36,0.04)", border: critErrors > 0 && !isDemo ? "1px solid rgba(251,191,36,0.3)" : "1px solid rgba(251,191,36,0.15)", display: "flex", flexDirection: "column", gap: 10, boxShadow: critErrors > 0 && !isDemo ? "0 0 24px rgba(251,191,36,0.06)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>⚡</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#FBBF24" }}>Wachstums-Bremsen</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {blockerItems.map((msg, i) => (
                          <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                            <span style={{ color: "#FBBF24", flexShrink: 0, fontWeight: 700 }}>›</span>{msg}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (!isDemo && (
                    <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.20)", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>✓</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Wachstums-Bremsen</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                        Keine kritischen Blocker auf der Startseite gefunden — saubere Basis.
                      </p>
                    </div>
                  ))}

                  {/* Yellow — SEO & UX-Optimierungen (Animated Placeholder bei leer) */}
                  {seoItems.length > 0 ? (
                    <div style={{ padding: "20px 22px", borderRadius: 14, background: AMBER_BG, border: `1px solid ${AMBER_BDR}`, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>✦</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: AMBER }}>SEO &amp; UX-Optimierungen</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {seoItems.map((msg, i) => (
                          <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                            <span style={{ color: AMBER, flexShrink: 0 }}>→</span>{msg}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "20px 22px", borderRadius: 14, background: AMBER_BG, border: `1px solid ${AMBER_BDR}`, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>✦</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: AMBER }}>SEO &amp; UX-Optimierungen</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span className="wf-seo-pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: AMBER, flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, fontStyle: "italic" }}>
                          SEO-Analyse wird im vollen Bericht generiert…
                        </p>
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.32)", lineHeight: 1.45 }}>
                        Im Gratis-Scan werden nur die wichtigsten Blocker geprüft. Title-Tag-Strukturen, Meta-Description-Coverage und H1-Hierarchie über alle Unterseiten analysieren wir im vollen Bericht.
                      </p>
                    </div>
                  )}

                  {/* Green — Bereits optimiert (nur wenn Items vorhanden) */}
                  {optimizedItems.length > 0 && (
                    <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>🟢</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Bereits optimiert ✓</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {optimizedItems.map((msg, i) => (
                          <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", display: "flex", gap: 7, alignItems: "flex-start", lineHeight: 1.5 }}>
                            <span style={{ color: "#22c55e", flexShrink: 0 }}>✓</span>{msg}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
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

            {/* Sichtbarkeits-Boost */}
            {(() => {
              const boostPotential = isDemo ? 75 : Math.min(95, Math.round((100 - score) * 1.5));
              return (
                <div style={{
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(251,191,36,0.25)",
                  borderRadius: 20, padding: "28px 28px",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  boxShadow: "0 0 30px rgba(251,191,36,0.06)",
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em", color: "#FBBF24", lineHeight: 1 }}>
                      +{boostPotential}%
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Sichtbarkeits-Potenzial</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Durch Behebung aller Optimierungen</div>
                    {boostPotential > 0 && (
                      <a href="#deep-scan-map" style={{ display: "inline-block", marginTop: 10, fontSize: 11, color: "#FBBF24", textDecoration: "none", fontWeight: 600 }}>
                        → Jetzt Optimierungen ansehen
                      </a>
                    )}
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
                  const borderColor = !item.ok ? "rgba(251,191,36,0.25)" : "rgba(34,197,94,0.15)";
                  const bgColor    = !item.ok ? "rgba(251,191,36,0.05)" : "rgba(34,197,94,0.03)";
                  const dotColor   = !item.ok ? "#FBBF24" : "#22c55e";
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
            <div className="wf-scan-header" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Seite</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", width: 120, textAlign: "center" }}>Status</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", width: 90, textAlign: "right" }}>Fehler</span>
            </div>

            {/* All rows with expandable detail panels */}
            {pageItems.map((p, i) => {
              // Skipped URLs (feed/xml/json) — special gray treatment
              if (p.isSkipped) {
                return (
                  <div key={p.path + i} className="wf-scan-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "11px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", opacity: 0.55 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.2)" }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pageBase}{p.path}</span>
                    </div>
                    <div className="wf-scan-status" style={{ width: 120, textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Übersprungen
                      </span>
                    </div>
                    <div className="wf-scan-errors" style={{ width: 90, textAlign: "right" }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>—</span>
                    </div>
                  </div>
                );
              }

              // Normal rows — amber-first: treat all findings as optimization opportunities
              const isUnreachable = !p.erreichbar;
              const dotColor   = isUnreachable ? "#ef4444" : p.errors === 0 ? "#22c55e" : "#FBBF24";
              const statusLabel = isUnreachable ? "Nicht erreichbar" : p.errors === 0 ? "✓ Optimiert" : "Optimierbar";
              const isExpanded  = expandedRow === (p.path + i);
              const canExpand   = !isDemo && p.errors > 0;

              return (
                <div key={p.path + i}
                  className={unlocking ? "wf-row-unlock" : ""}
                  style={{ animationDelay: unlocking ? `${i * 55}ms` : "0ms" }}
                >
                  <div className="wf-scan-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: dotColor, boxShadow: `0 0 5px ${dotColor}` }} />
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pageBase}{p.path}
                      </span>
                    </div>
                    <div className="wf-scan-status" style={{ width: 120, textAlign: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                        background: isUnreachable ? "rgba(239,68,68,0.1)" : p.errors === 0 ? "rgba(251,191,36,0.1)" : "rgba(245,158,11,0.1)",
                        color: dotColor, border: `1px solid ${dotColor}33` }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="wf-scan-errors" style={{ width: 90, textAlign: "right" }}>
                      {/* Gold ✓ checkmark flash during unlock */}
                      {unlocking && canExpand && (
                        <span className="wf-unlock-check" style={{ fontSize: 13, fontWeight: 800, color: "#FBBF24", display: "block", pointerEvents: "none", animationDelay: `${i * 55}ms` }}>
                          ✓
                        </span>
                      )}
                      <span
                        onClick={() => canExpand && handleExpand(p.path + i)}
                        style={{ fontSize: 13, fontWeight: 700, color: p.errors === 0 ? "rgba(255,255,255,0.2)" : dotColor, cursor: canExpand ? "pointer" : "default", userSelect: "none",
                          textDecoration: canExpand ? "underline dotted" : "none", textUnderlineOffset: 3,
                          opacity: unlocking && canExpand ? 0 : 1, transition: "opacity 0.6s ease 0.8s" }}>
                        {p.errors === 0 ? "—" : `${p.errors} Optimierungen`}
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
                  {isExpanded && (
                    userTier === "anon" ? (
                      <div style={{ padding: "14px 20px 18px" }}>
                        <LockedOverlay tier={userTier}>
                          <ProtoPanelContent p={p} tier={userTier} />
                        </LockedOverlay>
                      </div>
                    ) : <ProtoPanelContent p={p} tier={userTier} />
                  )}
                </div>
              );
            })}

            {/* Error total footer row */}
            {!isDemo && totalTableErrors > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>Gesamt</span>
                <div style={{ width: 120 }} />
                <div style={{ width: 90, textAlign: "right" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{totalTableErrors} Optimierungen</span>
                </div>
              </div>
            )}

            {/* Freischalt-CTA under the map */}
            <div style={{ padding: "14px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <Link href="/register" style={{ fontSize: 13, color: "#FBBF24", textDecoration: "none", fontWeight: 700 }}>
                Schritt-für-Schritt SEO-Fixes + vollständige Analyse freischalten →
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

        {/* ── PRICING TIERS ── */}
        {userTier !== "paid" && (
          <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", fontSize: 11, fontWeight: 700, color: "#FBBF24", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                Pläne & Preise
              </div>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em" }}>
                Alle Optimierungen jetzt umsetzen
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 480, marginInline: "auto" }}>
                Schritt-für-Schritt Fixes freischalten und SEO-Ranking systematisch steigern.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {/* Starter */}
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Starter</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em" }}>29€</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>/Monat</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.5 }}>Für Einzelunternehmer & kleine Websites</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, marginBottom: 20 }}>
                  {["3 Projekte", "Wöchentlicher Deep-Scan", "Smart-Fix Anleitungen", "Score-Verlauf (7 Tage)"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                      <span style={{ color: "#FBBF24", fontSize: 11 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link href="/register?plan=starter" style={{ display: "block", textAlign: "center", padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                  Starter wählen
                </Link>
              </div>

              {/* Professional (highlighted) */}
              <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 0 40px rgba(251,191,36,0.08)" }}>
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "3px 14px", borderRadius: 20, background: "#FBBF24", color: "#000", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  ★ Empfohlen
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#FBBF24", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Professional</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#FBBF24", letterSpacing: "-0.04em" }}>89€</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>/Monat</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.5 }}>Für wachsende Projekte & Agenturen</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, marginBottom: 20 }}>
                  {["10 Projekte", "Täglicher Deep-Scan", "Smart-Fix Drawer (vollständig)", "KI-Auto-Fix (Copy-Paste-fertig)", "24/7 Monitoring + E-Mail-Alerts", "Monatlicher PDF-Bericht"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: "#FBBF24", fontSize: 11 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link href="/register?plan=professional" style={{ display: "block", textAlign: "center", padding: "11px 20px", borderRadius: 10, background: "#FBBF24", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                  Professional starten →
                </Link>
              </div>

              {/* Agency */}
              <div style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Agency</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em" }}>249€</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>/Monat</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.5 }}>White-Label für Agenturen mit Mandantenverwaltung</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, marginBottom: 20 }}>
                  {["Unlimited Projekte", "Full White-Label (eigene Domain)", "Lead-Magnet Widget für Neukunden", "Auto-Report an Endkunden", "Kunden-Logins + Mandantenverwaltung"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                      <span style={{ color: "#a78bfa", fontSize: 11 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link href="/register?plan=agency&trial=7" style={{ display: "block", textAlign: "center", padding: "10px 20px", borderRadius: 10, background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.45)", color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 3px 14px rgba(124,58,237,0.28)" }}>
                  7 Tage kostenlos testen →
                </Link>
              </div>
            </div>

            <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
              Keine Einrichtungsgebühr · Jederzeit kündbar · Ergebnis sofort
            </p>
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
        @keyframes wf-seo-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
        .wf-seo-pulse-dot { animation: wf-seo-pulse 1.4s ease-in-out infinite; }

        /* Quick-Check-Grid — passt sich exakt der Anzahl der Karten an,
           damit bei verstecktem WC-Slot kein leerer Auto-Fit-Slot bleibt. */
        .wf-quick-grid-1 { grid-template-columns: 1fr; }
        .wf-quick-grid-2 { grid-template-columns: 1fr; }
        .wf-quick-grid-3 { grid-template-columns: 1fr; }
        @media (min-width: 640px) {
          .wf-quick-grid-2 { grid-template-columns: 1fr 1fr; }
          .wf-quick-grid-3 { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 900px) {
          .wf-quick-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .wf-scan-header { display: none !important; }
          .wf-scan-row {
            grid-template-columns: 1fr auto !important;
            row-gap: 8px !important;
            padding: 12px 14px !important;
          }
          .wf-scan-row > div:first-child { grid-column: 1 / 3; }
          .wf-scan-status { width: auto !important; text-align: left !important; justify-self: start; }
          .wf-scan-errors { width: auto !important; text-align: right !important; }
        }
        @keyframes wf-pulse-hint {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); border-color: rgba(251,191,36,0.4); }
          50%       { box-shadow: 0 0 0 4px rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.75); }
        }
        .wf-pulse-hint {
          animation: wf-pulse-hint 1.8s ease-in-out infinite;
        }
        @keyframes wf-row-unlock {
          0%   { background: transparent; }
          25%  { background: rgba(251,191,36,0.10); }
          60%  { background: rgba(251,191,36,0.06); }
          100% { background: transparent; }
        }
        .wf-row-unlock {
          animation: wf-row-unlock 1.4s ease-out both;
        }
        @keyframes wf-unlock-check {
          0%   { opacity: 0; transform: scale(0.6); }
          20%  { opacity: 1; transform: scale(1.3); }
          55%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
        .wf-unlock-check {
          animation: wf-unlock-check 1.2s ease-out forwards;
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
