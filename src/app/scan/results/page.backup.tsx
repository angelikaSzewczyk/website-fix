"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import BrandLogo from "../../components/BrandLogo";
import MobileNav from "../../components/MobileNav";
import SiteFooter from "../../components/SiteFooter";

import { type StoredScan, saveScanToStorage, loadScanFromStorage } from "@/lib/scan-storage";
import { normalizePlan } from "@/lib/plans";
import PsiButton from "./PsiButton";

// ── Rich page item used in Betroffene Seiten ─────────────────────────────────────
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

// ── Derived metrics ──────────────────────────────────────────────────────────
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

// ── Feed/XML filter for display ───────────────────────────────────────────────
const FEED_URL_PATTERN = /\/(feed|feed\/atom|feed\/rss|rss)(\/|$)|\.(xml|txt|json)(\?|#|$)/i;

// ── Build subpage list from real data ─────────────────────────────────────────
//
// Issue-Aggregation (08.05.2026): "Bilder ohne alt-Text" zählt als 1 Issue
// pro Seite, nicht pro Bild. Selbiges für Inputs/Buttons. Die Anzahl der
// betroffenen Vorkommen bleibt in altMissing/inputsWithoutLabel/buttonsWithoutText
// erhalten (für die Detail-Ansicht im Drawer), aber die Top-Level-"errors"-
// Spalte zählt das Issue-Type-Level. Konkret: Seite mit 30 Bildern ohne alt
// + fehlendem Title + fehlender Meta = 3 Issues (nicht 32).
//
// Maximum pro Page: 8 Issues (alt-fehlt, !erreichbar, noindex, noTitle, noH1,
// noMeta, inputs-ohne-label, buttons-ohne-text). Realistisch 2-5 pro Seite.
function buildPages(d: StoredScan): { base: string; items: PageItem[] } {
  const base = (() => { try { return new URL(d.url).host; } catch { return d.url; } })();
  const homePath = (() => { try { return new URL(d.url).pathname || "/"; } catch { return "/"; } })();
  // Home page errors (Issue-Typ-Level): alt-fehlt = 1, kein 1 pro Bild
  const homeAltMissing = d.altMissingCount > 0 ? Math.min(d.altMissingCount, 3) : 0;
  const homeErrors =
    (!d.hasTitle ? 1 : 0) +
    (!d.hasMeta  ? 1 : 0) +
    (!d.hasH1    ? 1 : 0) +
    (homeAltMissing > 0 ? 1 : 0);

  const items: PageItem[] = [
    {
      path: homePath, fullUrl: d.url, errors: homeErrors,
      erreichbar: true, altMissing: homeAltMissing, noindex: d.noIndex, isSkipped: false,
      altMissingImages: (d.altMissingImages ?? []).slice(0, homeAltMissing),
      missingTitle: !d.hasTitle,
      missingMeta:  !d.hasMeta,
      missingH1:    !d.hasH1,
    },
    // Audited subpages — Issue-Typ-Level statt Vorkommen-Level
    ...d.unterseiten.filter(p => !FEED_URL_PATTERN.test(p.url)).map(p => {
      const noTitle = !p.title || p.title === "(kein Title)";
      const noH1    = !p.h1    || p.h1    === "(kein H1)";
      const noMeta  = !p.metaDescription;
      let errors = 0;
      if (p.altMissing > 0)                  errors += 1;  // 1 Issue: "Bilder ohne alt-Text"
      if (!p.erreichbar)                     errors += 1;
      if (p.noindex)                         errors += 1;
      if (noTitle)                           errors += 1;
      if (noH1)                              errors += 1;
      if (noMeta)                            errors += 1;
      if ((p.inputsWithoutLabel ?? 0) > 0)   errors += 1;  // 1 Issue: "Inputs ohne Label"
      if ((p.buttonsWithoutText ?? 0) > 0)   errors += 1;  // 1 Issue: "Buttons ohne Text"
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

// ── Plausible/GA tracking helper ─────────────────────────────────────────────
// Single Source für CTA-Events auf der Result-Page. Verwendung: trackCta("Click X", "location-id").
// no-op wenn Plausible/gtag nicht geladen — silent fail bei try-catch.
function trackCta(event: string, location: string): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
    gtag?:      (cmd: string, event: string, params?: Record<string, string>) => void;
  };
  try {
    w.plausible?.(event, { props: { location } });
    w.gtag?.("event", event.toLowerCase().replace(/\s+/g, "_"), { location });
  } catch { /* tracker not ready */ }
}

// ── Demo constants ────────────────────────────────────────────────────────────
const DEMO_DOMAIN  = "beispiel-agentur.de";
// DEMO_PAGES muss zur DEMO_PAGES_LIST.length passen (sonst zeigt Hero "X analysiert"
// und die Tabelle eine andere Anzahl). Bei Erweiterung der Liste hier mitziehen.
const DEMO_PAGES   = 14;
// Sum of DEMO_PAGES_LIST errors: 3+5+0+2+0+4+0+1+0+3+2+0+1+0 = 21
const DEMO_CRIT    = 21;
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

function ProtoRow({
  severity,
  title,
  detail,
  meaning,
  cause,
  tier = "anon",
  manualHint,
}: {
  severity: "red" | "yellow";
  title: string;
  detail?: string;
  meaning?: string;
  cause?: string;
  tier?: "anon" | "free" | "paid";
  manualHint?: string;
}) {
  const isHigh = severity === "red";

  const accent = isHigh ? "#f59e0b" : "#FBBF24";
  const bg = isHigh
    ? "rgba(245,158,11,0.055)"
    : "rgba(251,191,36,0.045)";
  const border = isHigh
    ? "rgba(245,158,11,0.22)"
    : "rgba(251,191,36,0.18)";

  const showDetails = tier !== "anon";

  return (
    <article
      style={{
        borderRadius: 10,
        border: `1px solid ${border}`,
        background: bg,
        overflow: "hidden",
      }}
    >
      {/* Finding header */}
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            minWidth: 0,
            alignItems: "flex-start",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              marginTop: 6,
              borderRadius: "50%",
              background: accent,
              flexShrink: 0,
            }}
          />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.45,
                fontWeight: 750,
                color: "#fff",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </div>
          </div>
        </div>

        <span
          style={{
            flexShrink: 0,
            padding: "3px 7px",
            borderRadius: 5,
            fontSize: 9.5,
            lineHeight: 1.3,
            fontWeight: 800,
            letterSpacing: "0.07em",
            color: accent,
            background: `${accent}12`,
            border: `1px solid ${accent}32`,
            whiteSpace: "nowrap",
          }}
        >
          {isHigh ? "PRIORITÄT HOCH" : "PRÜFEN"}
        </span>
      </div>

      {showDetails ? (
        <div
          style={{
            margin: "0 14px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {detail && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px minmax(0,1fr)",
                gap: 14,
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.055)",
              }}
              className="wf-diagnosis-detail-row"
            >
              <span
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.32)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Befund
              </span>

              <span
                style={{
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.72)",
                  fontFamily: "var(--font-family-mono, monospace)",
                  overflowWrap: "anywhere",
                }}
              >
                {detail}
              </span>
            </div>
          )}

          {meaning && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px minmax(0,1fr)",
                gap: 14,
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.055)",
              }}
              className="wf-diagnosis-detail-row"
            >
              <span
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.32)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Bedeutung
              </span>

              <span
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                {meaning}
              </span>
            </div>
          )}

          {cause && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px minmax(0,1fr)",
                gap: 14,
                padding: "12px 0",
                borderBottom: "1px solid rgba(255,255,255,0.055)",
              }}
              className="wf-diagnosis-detail-row"
            >
              <span
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.32)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Mögliche Ursache
              </span>

              <span
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                {cause}
              </span>
            </div>
          )}

          {manualHint && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "110px minmax(0,1fr)",
                gap: 14,
                padding: "12px 0 0",
              }}
              className="wf-diagnosis-detail-row"
            >
              <span
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,0.32)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Nächster Schritt
              </span>

              <span
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  color: "#8df3d3",
                }}
              >
                {manualHint}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            margin: "0 14px 13px 31px",
            paddingTop: 10,
            borderTop: "1px solid rgba(255,255,255,0.055)",
            fontSize: 11.5,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.38)",
          }}
        >
          Befund erkannt · Details und konkrete nächste Schritte nach
          Freischaltung
        </div>
      )}
    </article>
  );
}

// Funnel-Personalisierung Stufe B (05.05.2026): wenn der User von einer SEO-Card
// mit ?problem=<pillar> kam, hat /scan den Pillar in localStorage.wf_focus_pillar
// persistiert. Wir lesen ihn EINMAL im Parent (ResultsInner) und reichen ihn als
// Prop runter — damit ProtoPanelContent nicht pro expandierter Zeile neu liest.
type FocusPillar = "visibility" | "health" | "speed" | null;

// ── Beweis-Modus: expandable panel — entry count ALWAYS equals header "N Fehler" ──
function ProtoPanelContent({ p, tier = "anon", focusPillar = null, speedPreview = null }: {
  p: PageItem;
  /** "anon" = filenames hidden | "free" = filenames + manual hints | "paid" = everything */
  tier?: "anon" | "free" | "paid";
  /** Vom Parent durchgereicht — vermeidet localStorage-Read pro Zeile. */
  focusPillar?: FocusPillar;
  /** Speed-Werte aus builderAudit für die ?problem=speed-Personalisierung. */
  speedPreview?: { domDepth: number; stylesheetCount: number; googleFonts: number } | null;
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
  if (imgCount   > 0) chips.push({ label: `${imgCount} Bild-Befunde`,       color: "#f59e0b" });
  if (formCount  > 0) chips.push({ label: `${formCount} Formular-Befunde`,  color: AMBER });
  if (seoCount   > 0) chips.push({ label: `${seoCount} SEO-Befunde`,        color: AMBER });

  // Befunde-Sammlung als Array — jeder Eintrag mit Pillar-Tag.
  // Erlaubt es uns, je nach focusPillar zu sortieren ohne die JSX-Switches
  // zu verlieren. Speed-Befunde gibt's hier nicht (sind im Backend-Scan,
  // nicht im StoredScan-Snapshot) — User mit ?problem=speed sieht daher
  // alle Befunde + einen Hinweis-Banner.
  type Pillar = "visibility" | "health" | "recht";
  const findings: Array<{ pillar: Pillar; el: React.ReactElement }> = [];

  if (isUnreachable) {
    findings.push({
      pillar: "health",
      el: (
        <ProtoRow
          key="unreachable"
          severity="red"
          tier={tier}
          title="Seite nicht erreichbar"
          detail={`GET ${p.path} → keine erfolgreiche Antwort`}
          meaning="WebsiteFix konnte die URL finden, die Seite ist für Besucher und Suchmaschinen aber nicht zuverlässig erreichbar."
          cause="Die URL wurde möglicherweise geändert oder gelöscht, eine Weiterleitung fehlt oder der Server liefert einen Fehler."
          manualHint="Prüfe die URL und den HTTP-Status. Wurde die Seite verschoben, richte eine 301-Weiterleitung auf die passende Zielseite ein."
        />
      ),
    });
  }

  if (p.missingH1) {
    findings.push({
      pillar: "visibility",
      el: (
        <ProtoRow
          key="h1"
          severity="red"
          tier={tier}
          title="H1-Überschrift fehlt"
          detail="<h1> nicht gefunden"
          meaning="Auf der Seite wurde keine zentrale H1-Überschrift erkannt. Dadurch ist die inhaltliche Hauptstruktur weniger eindeutig."
          cause="Die Überschrift wurde möglicherweise nur visuell gestaltet oder im Page Builder mit einem anderen HTML-Element ausgegeben."
          manualHint="Prüfe die Hauptüberschrift im WordPress-Editor oder Page Builder und verwende für die wichtigste Seitenüberschrift ein H1-Element."
        />
      ),
    });
  }

  if (p.missingTitle) {
    findings.push({
      pillar: "visibility",
      el: (
        <ProtoRow
          key="title"
          severity="yellow"
          tier={tier}
          title="Seitentitel fehlt"
          detail="<title> nicht gefunden"
          meaning="Die Seite besitzt keinen erkennbaren HTML-Titel. Suchmaschinen haben dadurch weniger Informationen darüber, wie die Seite in Suchergebnissen bezeichnet werden soll."
          cause="Der SEO-Titel wurde möglicherweise nicht gesetzt oder das Theme beziehungsweise SEO-Plugin gibt ihn nicht korrekt aus."
          manualHint="Öffne die SEO-Einstellungen der Seite und hinterlege einen eindeutigen Seitentitel."
        />
      ),
    });
  }

  if (p.missingMeta) {
    findings.push({
      pillar: "visibility",
      el: (
        <ProtoRow
          key="meta"
          severity="yellow"
          tier={tier}
          title="Meta-Description fehlt"
          detail={'meta[name="description"] nicht gefunden'}
          meaning="Für die Seite wurde keine Meta-Beschreibung erkannt. Google kann deshalb selbst einen Textausschnitt für das Suchergebnis auswählen."
          cause="Das Feld wurde möglicherweise im SEO-Plugin nicht ausgefüllt oder die Beschreibung wird technisch nicht ausgegeben."
          manualHint="Hinterlege im SEO-Plugin eine individuelle Beschreibung, die Inhalt und Suchintention der Seite knapp zusammenfasst."
        />
      ),
    });
  }

  altImages.forEach((img, idx) => {
    findings.push({
      pillar: "visibility",
      el: (
        <ProtoRow
          key={`img-named-${idx}`}
          severity="yellow"
          tier={tier}
          title="Bild ohne Alternativtext"
          detail={img}
          meaning="Für dieses Bild wurde kein verwertbarer Alternativtext erkannt. Das erschwert die inhaltliche Einordnung für assistive Technologien und kann auch die Bildsuche beeinträchtigen."
          cause="Der Alternativtext wurde möglicherweise beim Hochladen oder Einfügen des Bildes nicht gepflegt."
          manualHint="Öffne das Bild im WordPress-Medienbereich und ergänze einen kurzen, sachlichen Alternativtext, sofern das Bild inhaltliche Bedeutung hat."
        />
      ),
    });
  });

  Array.from({ length: extraAlt }, (_, i) => {
    findings.push({
      pillar: "visibility",
      el: (
        <ProtoRow
          key={`img-extra-${i}`}
          severity="yellow"
          tier={tier}
          title="Bild ohne Alternativtext"
          detail="Betroffenes Bild erkannt · Dateiname nicht verfügbar"
          meaning="Mindestens ein weiteres Bild besitzt keinen verwertbaren Alternativtext."
          cause="Der Alternativtext wurde wahrscheinlich nicht hinterlegt oder konnte beim öffentlichen Scan nicht eindeutig einem Dateinamen zugeordnet werden."
          manualHint="Prüfe die Bilder auf dieser Seite im WordPress-Editor und ergänze fehlende Alternativtexte bei inhaltlich relevanten Bildern."
        />
      ),
    });
  });

  Array.from({ length: p.inputsWithoutLabel ?? 0 }, (_, i) => {
    findings.push({
      pillar: "recht",
      el: (
        <ProtoRow
          key={`label-${i}`}
          severity="red"
          tier={tier}
          title={`Formularfeld ohne Beschriftung #${i + 1}`}
          detail="<input> ohne zugeordnetes <label> oder aria-label"
          meaning="Das Formularfeld besitzt keine eindeutig erkennbare Beschriftung. Das kann die Bedienung mit Screenreadern erschweren."
          cause="Das Formular-Plugin oder der Page Builder gibt das Feld möglicherweise ohne korrekt verknüpftes Label aus."
          manualHint="Prüfe das entsprechende Formularfeld und hinterlege ein korrekt verknüpftes Label oder eine passende zugängliche Beschriftung."
        />
      ),
    });
  });

  Array.from({ length: p.buttonsWithoutText ?? 0 }, (_, i) => {
    findings.push({
      pillar: "recht",
      el: (
        <ProtoRow
          key={`btn-${i}`}
          severity="red"
          tier={tier}
          title={`Button ohne erkennbare Beschriftung #${i + 1}`}
          detail="<button> ohne Text oder aria-label"
          meaning="Für den Button wurde keine ausreichend erkennbare Beschriftung gefunden. Assistive Technologien können seine Funktion deshalb möglicherweise nicht eindeutig vermitteln."
          cause="Es handelt sich möglicherweise um einen reinen Icon-Button ohne zugänglichen Namen."
          manualHint="Prüfe den Button und ergänze sichtbaren Text oder eine technisch geeignete zugängliche Beschriftung."
        />
      ),
    });
  });

  if (p.noindex) {
    findings.push({
      pillar: "visibility",
      el: (
        <ProtoRow
          key="noindex"
          severity="red"
          tier={tier}
          title="Seite ist von der Google-Indexierung ausgeschlossen"
          detail={'<meta name="robots" content="noindex"> erkannt'}
          meaning="Die Seite weist Suchmaschinen ausdrücklich an, sie nicht in den Suchindex aufzunehmen."
          cause="Die Einstellung wurde möglicherweise absichtlich oder versehentlich über WordPress, das SEO-Plugin oder eine Seiteneinstellung gesetzt."
          manualHint="Prüfe zuerst, ob die Seite tatsächlich indexiert werden soll. Falls ja, entferne die noindex-Einstellung in WordPress beziehungsweise deinem SEO-Plugin."
        />
      ),
    });
  }

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

        {/* Speed-Sonderfall: StoredScan hat keine Lighthouse-Werte, aber
            builderAudit liefert echte Speed-Indikatoren (DOM-Tiefe, Stylesheets,
            Google-Fonts). Wir zeigen diese als Preview, damit der Speed-Klicker
            nicht mit einem leeren Versprechen abgespeist wird. */}
        {focusPillar === "speed" && speedPreview && (
          <div style={{
            padding: "12px 14px", marginBottom: 6, borderRadius: 7,
            background: PILLAR_META.speed.bg,
            border: `1px solid ${PILLAR_META.speed.bdr}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: PILLAR_META.speed.color, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
              Deine Speed-Werte
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "DOM-Tiefe", value: speedPreview.domDepth, ok: speedPreview.domDepth <= 15, hint: speedPreview.domDepth > 15 ? "stark verschachtelt" : "unauffällig" },
                { label: "Stylesheets", value: speedPreview.stylesheetCount, ok: speedPreview.stylesheetCount <= 8, hint: speedPreview.stylesheetCount > 8 ? "Render-Stau möglich" : "akzeptabel" },
                { label: "Google-Fonts", value: speedPreview.googleFonts, ok: speedPreview.googleFonts === 0, hint: speedPreview.googleFonts > 0 ? "blockierende Requests" : "lokal/keine" },
              ].map(m => (
                <div key={m.label} style={{
                  padding: "8px 10px", borderRadius: 6,
                  background: "rgba(0,0,0,0.25)",
                  border: `1px solid ${m.ok ? "rgba(74,222,128,0.25)" : "rgba(245,158,11,0.3)"}`,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.ok ? "#4ade80" : "#f59e0b", lineHeight: 1 }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: m.ok ? "rgba(74,222,128,0.7)" : "rgba(245,158,11,0.75)", marginTop: 2 }}>{m.hint}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 9, lineHeight: 1.5 }}>
              Lighthouse-Score (FCP, LCP, CLS, TTFB) und volle Speed-Roadmap im Dashboard nach Freischaltung.
            </div>
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
            onClick={e => {
              e.preventDefault();
              trackCta("Click Plan Anchor", "proto-panel-anon");
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }}
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
          <Link
            href="/register?plan=professional"
            onClick={() => trackCta("Click Professional", "proto-panel-free")}
            style={{
              fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 7,
              background: "rgba(251,191,36,0.12)", color: "#FBBF24",
              border: "1px solid rgba(251,191,36,0.3)", textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            Professional freischalten →
          </Link>
        </div>
      )}
    </div>
  );
}

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
            Konkrete Issues, Lösungs-Snippets und builder-spezifische Anleitungen — Einzel-Guide ab 9,90 € oder Flatrate ab 29 €/Monat.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/scan/checkout"
            onClick={() => trackCta("Click Pay-per-Fix", "locked-overlay")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              background: "rgba(251,191,36,0.12)", color: "#FBBF24",
              border: "1px solid rgba(251,191,36,0.35)",
              fontSize: 12, fontWeight: 800, textDecoration: "none",
            }}
          >
            Einzel-Fix 9,90 €
          </Link>
          <Link
            href={ctaHref}
            onClick={() => trackCta("Click Unlock Plan", "locked-overlay")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8,
              background: "linear-gradient(90deg, #059669, #10B981)",
              color: "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none",
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
            }}
          >
            Flatrate 29 € →
          </Link>
        </div>
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
  // Cache-Miss-Flag: true wenn urlParam vorhanden ist, aber weder Storage
  // noch /api/scan/cached den Scan finden konnten. Triggert einen eigenen
  // "Scan abgelaufen"-State statt stillschweigend in Demo-Mode zu fallen.
  const [scanMissing, setScanMissing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  // "anon" | "free" | "paid" — determines what's shown in the error panel
  const [userTier, setUserTier] = useState<"anon" | "free" | "paid">("anon");
  // ── Magic pulse: first-time hint on first expandable row ─────────────────
  const [showPulse, setShowPulse] = useState(false);
  // ── Unlock animation: anon → free/paid tier transition ───────────────────
  const [unlocking, setUnlocking] = useState(false);
  const tierFirstLoad = useRef<"anon" | "free" | "paid" | null>(null);
  // ── Focus-Pillar: wird einmal in ResultsInner aus localStorage gelesen
  // und pro ProtoPanelContent durchgereicht (vermeidet N localStorage-Reads
  // bei vielen expandierten Reihen). Quelle: /scan setzt wf_focus_pillar bei
  // ?problem=<pillar>, siehe scan/page.tsx:230-234.
  const [focusPillar, setFocusPillar] = useState<FocusPillar>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("wf_focus_pillar");
      if (stored === "visibility" || stored === "health" || stored === "speed") {
        setFocusPillar(stored);
      }
    } catch { /* localStorage unavailable */ }
  }, []);

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
            if (reloaded) {
              setScan(reloaded);
            } else {
              // Cache hit but re-hydration failed — treat as miss, eigene Error-State.
              setScanMissing(true);
            }
          } else {
            // urlParam vorhanden, aber kein Cache-Treffer → expliziter Error-State.
            setScanMissing(true);
          }
        })
        .catch(() => { setScanMissing(true); })
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
    document.title = `Diagnose für ${domain} | WebsiteFix`;
    return () => { document.title = "WebsiteFix | WordPress-Diagnose"; };
  }, [scan]);

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

  // Cache-Miss: User hat eine URL angefragt, aber Scan ist nicht (mehr) verfügbar.
  // Verhindert den verwirrenden silent-fallback in den Demo-Modus.
  if (scanMissing && !scan) return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BrandLogo />
          <MobileNav />
        </div>
      </nav>
      <main style={{ background: "#0b0c10", minHeight: "calc(100vh - 58px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{
          maxWidth: 480, textAlign: "center",
          padding: "32px 28px", borderRadius: 16,
          background: "rgba(122,166,255,0.04)", border: "1px solid rgba(122,166,255,0.20)",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13, margin: "0 auto 16px",
            background: "rgba(122,166,255,0.10)", border: "1px solid rgba(122,166,255,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            Scan-Ergebnis nicht mehr verfügbar
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
            Wir konnten den Scan für <strong style={{ color: "#fff" }}>{urlParam || "diese URL"}</strong> nicht laden — wahrscheinlich wurde er aus dem Kurzzeit-Cache entfernt (24 h Lebensdauer) oder du hast den Link in einem neuen Browser geöffnet. Starte den Scan einfach neu — er dauert weniger als eine Minute.
          </p>
          <Link
            href={urlParam ? `/scan?url=${encodeURIComponent(urlParam)}` : "/scan"}
            onClick={() => trackCta("Click Rescan", "cache-miss")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "11px 22px", borderRadius: 10,
              background: "linear-gradient(90deg, #059669, #10B981)",
              color: "#fff", fontSize: 13.5, fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(16,185,129,0.32)",
            }}
          >
            Diese Seite erneut scannen →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );

  // ── Derive display values ────────────────────────────────────────────────
  const isDemo       = !scan;
  const displayDomain = isDemo ? DEMO_DOMAIN : (() => { try { return new URL(scan!.url).host; } catch { return scan!.url; } })();

  // ── Detect hoster from techFingerprint (Strato/IONOS/Kinsta/etc.) ────────
  // Wird im Hero als Vertrauens-Badge ausgespielt: "Optimierung für [Hoster]
  // erkannt" — der User sieht sofort, dass wir SEINE Infrastruktur kennen,
  // nicht nur generische SEO-Floskeln liefern.
  const detectedHoster = (() => {
    if (isDemo) return null;
    const fp = scan?.techFingerprint as { hosting?: { value?: string | null; confidence?: number } } | null | undefined;
    const value = fp?.hosting?.value;
    const confidence = fp?.hosting?.confidence ?? 0;
    if (!value || confidence < 0.5) return null;
    return value;
  })();

  // Speed-Preview-Werte für ?problem=speed-User: aus builderAudit ableiten
  // (echte Datenpunkte statt nur "Wert kommt im vollen Bericht"-Versprechen).
  const speedPreview = !isDemo && scan?.builderAudit ? {
    domDepth:        scan.builderAudit.maxDomDepth ?? 0,
    stylesheetCount: scan.builderAudit.stylesheetCount ?? 0,
    googleFonts:     scan.builderAudit.googleFontFamilies?.length ?? 0,
  } : null;
  // Pages list — must be built BEFORE pagesTotal so pagesTotal is derived from it
  const { base: pageBase, items: realPageItems } = isDemo
    ? { base: DEMO_DOMAIN, items: DEMO_PAGES_LIST }
    : buildPages(scan!);
  const pageItems  = isDemo ? DEMO_PAGES_LIST : realPageItems;
  const pagesTotal = isDemo ? DEMO_PAGES : pageItems.filter(p => !p.isSkipped).length;

  // Total errors = sum of ALL errors across ALL pages (the real number the user sees in the map)
  const totalTableErrors = isDemo ? 0 : pageItems.filter(p => !p.isSkipped && p.errors > 0).reduce((s, p) => s + p.errors, 0);

  // critErrors is the total sum — NOT a boolean type-count
  const critErrors   = isDemo ? DEMO_CRIT : (totalTableErrors > 0 ? totalTableErrors : computeIssueCount(scan!));

  // ── Bucket-Count: Anzahl der DISTINCT Problemarten (Issue-Kinds) ──
  // Ehrlichkeits-Hebel: Free-Scan zeigt sonst die rohe Stellen-Summe (totalTableErrors),
  // das Dashboard die konsolidierte Issue-Zahl. User war frustriert: "Free sagt 19,
  // Paid sagt 5 — gleicher Crawl, andere Zahl". Jetzt zeigen beide Pages denselben
  // Aggregations-Begriff: "X Aufgaben · Y Stellen auf Z Seiten". Die kleine Zahl
  // (Buckets) ist die ehrliche "wie viele Arbeitsschritte muss ich machen"-Antwort,
  // die große Zahl (Stellen) bleibt als sekundäres Volumen-Signal sichtbar.
  const bucketCount = isDemo ? DEMO_CRIT : (() => {
    const kinds = new Set<string>();
    for (const p of pageItems) {
      if (p.isSkipped) continue;
      if (p.altMissing > 0)                    kinds.add("alt");
      if (p.missingTitle)                      kinds.add("title");
      if (p.missingH1)                         kinds.add("h1");
      if (p.missingMeta)                       kinds.add("meta");
      if (p.noindex)                           kinds.add("noindex");
      if (!p.erreichbar)                       kinds.add("404");
      if ((p.inputsWithoutLabel ?? 0) > 0)     kinds.add("label");
      if ((p.buttonsWithoutText ?? 0) > 0)     kinds.add("button");
    }
    return kinds.size;
  })();

  // ── Diagnosis metrics: no synthetic score, only findings the scan actually observed ──
  const diagnosisMetrics = (() => {
    if (isDemo) {
      return {
        highPriority: 3,
        additional: 5,
        affectedPages: 6,
        topPriority: "Mehrere technische Probleme mit hoher Priorität erkannt",
      };
    }

    const highKinds = new Set<string>();
    const additionalKinds = new Set<string>();
    let affectedPages = 0;

    for (const p of pageItems) {
      if (p.isSkipped) continue;
      if (p.errors > 0) affectedPages += 1;

      if (!p.erreichbar)                   highKinds.add("unreachable");
      if (p.noindex)                       highKinds.add("noindex");
      if (p.missingH1)                     highKinds.add("h1");
      if ((p.inputsWithoutLabel ?? 0) > 0) highKinds.add("label");
      if ((p.buttonsWithoutText ?? 0) > 0) highKinds.add("button");

      if (p.missingTitle) additionalKinds.add("title");
      if (p.missingMeta)  additionalKinds.add("meta");
      if (p.altMissing > 0) additionalKinds.add("alt");
    }

    const topPriority =
      highKinds.has("unreachable") ? "Mindestens eine Seite ist nicht erreichbar" :
      highKinds.has("noindex")     ? "Mindestens eine Seite ist von der Indexierung ausgeschlossen" :
      highKinds.has("h1")          ? "Auf mindestens einer Seite fehlt die zentrale H1-Überschrift" :
      highKinds.has("label")       ? "Formularfelder ohne eindeutige Beschriftung erkannt" :
      highKinds.has("button")      ? "Buttons ohne eindeutige Beschriftung erkannt" :
      additionalKinds.has("title") ? "Auf mindestens einer Seite fehlt der Seitentitel" :
      additionalKinds.has("meta")  ? "Auf mindestens einer Seite fehlt die Meta-Description" :
      additionalKinds.has("alt")   ? "Bilder ohne Alternativtext erkannt" :
      "Bei den geprüften Signalen wurde kein akuter technischer Blocker erkannt";

    return {
      highPriority: highKinds.size,
      additional: additionalKinds.size,
      affectedPages,
      topPriority,
    };
  })();

  const diagnosisTone = diagnosisMetrics.highPriority > 0
    ? { label: "Handlungsbedarf", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.28)" }
    : diagnosisMetrics.additional > 0
    ? { label: "Hinweise gefunden", color: "#FBBF24", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.24)" }
    : { label: "Keine akuten Blocker", color: "#22c55e", bg: "rgba(34,197,94,0.07)", border: "rgba(34,197,94,0.24)" };


  // ── Results V5: evidence-first diagnosis summary ─────────────────────────
  // These are real observations from StoredScan/PageItem. No synthetic score,
  // no projected ranking/revenue uplift and no legal conclusion.
  const overviewFindings = (() => {
    type Finding = {
      key: string;
      priority: "high" | "check" | "info";
      title: string;
      evidence: string;
      meaning: string;
    };

    if (isDemo) {
      return [
        {
          key: "demo-unreachable",
          priority: "high" as const,
          title: "Unterseiten nicht erreichbar",
          evidence: "2 Seiten betroffen",
          meaning: "Diese URLs sollten zuerst auf Statuscode, Ziel-URL und Weiterleitungen geprüft werden.",
        },
        {
          key: "demo-alt",
          priority: "check" as const,
          title: "Bilder ohne Alternativtext",
          evidence: "Mehrere Bilder betroffen",
          meaning: "Prüfe, welche Bilder einen beschreibenden Alternativtext benötigen.",
        },
        {
          key: "demo-structure",
          priority: "info" as const,
          title: "WordPress-Struktur erkannt",
          evidence: "Technische Signale verfügbar",
          meaning: "Der Detailbericht ordnet die Befunde pro Seite ein.",
        },
      ];
    }

    const findings: Finding[] = [];
    const unreachablePages = pageItems.filter(p => !p.isSkipped && !p.erreichbar).length;
    const noindexPages = pageItems.filter(p => !p.isSkipped && p.noindex).length;
    const h1Pages = pageItems.filter(p => !p.isSkipped && p.missingH1).length;
    const titlePages = pageItems.filter(p => !p.isSkipped && p.missingTitle).length;
    const metaPages = pageItems.filter(p => !p.isSkipped && p.missingMeta).length;
    const altCount = scan?.altMissingCount ?? pageItems.reduce((sum, p) => sum + (p.isSkipped ? 0 : p.altMissing), 0);
    const formCount = pageItems.reduce(
      (sum, p) => sum + (p.isSkipped ? 0 : (p.inputsWithoutLabel ?? 0) + (p.buttonsWithoutText ?? 0)),
      0,
    );

    if (unreachablePages > 0) {
      findings.push({
        key: "unreachable",
        priority: "high",
        title: "Seiten nicht erreichbar",
        evidence: `${unreachablePages} ${unreachablePages === 1 ? "Seite" : "Seiten"} betroffen`,
        meaning: "Prüfe zuerst URL, HTTP-Status und mögliche Weiterleitungen.",
      });
    }

    if (noindexPages > 0 || scan?.robotsBlocked) {
      const parts = [
        noindexPages > 0 ? `${noindexPages} ${noindexPages === 1 ? "Seite mit noindex" : "Seiten mit noindex"}` : "",
        scan?.robotsBlocked ? "robots.txt blockiert Crawler" : "",
      ].filter(Boolean);
      findings.push({
        key: "indexing",
        priority: "high",
        title: "Indexierung eingeschränkt",
        evidence: parts.join(" · "),
        meaning: "Prüfe, ob diese Ausschlüsse beabsichtigt sind. Nur unbeabsichtigte Blockierungen sollten entfernt werden.",
      });
    }

    if (h1Pages > 0) {
      findings.push({
        key: "h1",
        priority: "check",
        title: "H1-Struktur prüfen",
        evidence: `${h1Pages} ${h1Pages === 1 ? "Seite ohne H1" : "Seiten ohne H1"}`,
        meaning: "Eine zentrale Seitenüberschrift macht Inhalt und Dokumentstruktur eindeutiger.",
      });
    }

    if (titlePages > 0 || metaPages > 0) {
      const parts = [
        titlePages > 0 ? `${titlePages} ohne Seitentitel` : "",
        metaPages > 0 ? `${metaPages} ohne Meta-Description` : "",
      ].filter(Boolean);
      findings.push({
        key: "metadata",
        priority: "check",
        title: "Seitendaten unvollständig",
        evidence: parts.join(" · "),
        meaning: "Die betroffenen Seiten sollten einzeln auf Title und Meta-Description geprüft werden.",
      });
    }

    if (altCount > 0) {
      findings.push({
        key: "alt",
        priority: "check",
        title: "Bilder ohne Alternativtext",
        evidence: `${altCount} ${altCount === 1 ? "Bild" : "Bilder"} erkannt`,
        meaning: "Prüfe die betroffenen Bilder. Inhaltlich relevante Bilder benötigen in der Regel eine passende Textalternative.",
      });
    }

    if (formCount > 0) {
      findings.push({
        key: "forms",
        priority: "check",
        title: "Bedienelemente ohne eindeutige Beschriftung",
        evidence: `${formCount} ${formCount === 1 ? "Element" : "Elemente"} erkannt`,
        meaning: "Formularfelder und Buttons sollten für Nutzer und assistive Technologien eindeutig benannt sein.",
      });
    }

    if ((scan?.brokenLinksCount ?? 0) > 0) {
      findings.push({
        key: "broken-links",
        priority: "high",
        title: "Defekte Links erkannt",
        evidence: `${scan!.brokenLinksCount} ${scan!.brokenLinksCount === 1 ? "Link" : "Links"}`,
        meaning: "Prüfe die Ziel-URLs und ersetze oder entferne Links, die nicht mehr auf ein gültiges Ziel führen.",
      });
    }

    return findings;
  })();

  const visibleOverviewFindings = overviewFindings;

  const affectedPagesCount = pageItems.filter(p => !p.isSkipped && p.errors > 0).length;

  // Context strings for discovered vs analysed
  const entdeckteUrls  = scan?.entdeckteUrls  ?? 0;
  const gefilterteUrls = scan?.gefilterteUrls ?? 0;
  const skippedCount   = (scan?.skippedUrls ?? []).length;

  // ── Detail interaction helper ─────────────────────────────────────────────
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
            <div className="hide-sm" style={{ display: "flex", alignItems: "center" }}>
              <a
                href="#deep-scan-map"
                style={{
                  fontSize: 12.5, padding: "7px 14px", borderRadius: 8, fontWeight: 700,
                  background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)",
                  border: "1px solid rgba(255,255,255,0.10)", textDecoration: "none",
                  whiteSpace: "nowrap" as const,
                }}
              >
                Befunde ansehen ↓
              </a>
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

          {/* ── RESULTS V5: DIAGNOSIS HEADER ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "5px 12px", borderRadius: 20,
                fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em",
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.22)",
                color: "#4ade80",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
                Scan abgeschlossen
              </div>
              {!isDemo && detectedHoster && (
                <span style={{
                  padding: "5px 10px", borderRadius: 20, fontSize: 10.5,
                  color: "rgba(255,255,255,0.42)", border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.025)",
                }}>
                  Hosting-Signal: {detectedHoster}
                </span>
              )}
            </div>

            <h1 style={{
              margin: "0 0 10px",
              fontSize: "clamp(28px, 4vw, 46px)",
              fontWeight: 850,
              letterSpacing: "-0.04em",
              color: "#fff",
              lineHeight: 1.06,
              maxWidth: 820,
            }}>
              {bucketCount > 0
                ? `${bucketCount} ${bucketCount === 1 ? "Problemart" : "Problemarten"} auf deiner Website gefunden.`
                : "Keine akuten technischen Probleme gefunden."}
            </h1>

            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.46)", lineHeight: 1.65, maxWidth: 760 }}>
              Diagnose für <strong style={{ color: "rgba(255,255,255,0.82)", fontWeight: 700 }}>{displayDomain}</strong>.{" "}
              {!isDemo && entdeckteUrls > pagesTotal
                ? <>{pagesTotal} von {entdeckteUrls} entdeckten Seiten wurden analysiert</>
                : <>{pagesTotal} {pagesTotal === 1 ? "Seite wurde" : "Seiten wurden"} analysiert</>}
              {critErrors > 0 ? <> · {critErrors} betroffene {critErrors === 1 ? "Stelle" : "Stellen"} erkannt.</> : "."}
            </p>
          </div>

          {/* ── TOP PRIORITY ── */}
          <div className="wf-v5-priority-card" style={{
            marginBottom: 18,
            padding: "20px 22px",
            borderRadius: 14,
            background: diagnosisTone.bg,
            border: `1px solid ${diagnosisTone.border}`,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: 18,
          }}>
            <div>
              <div style={{
                marginBottom: 7, fontSize: 10, fontWeight: 850,
                color: diagnosisTone.color, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                {diagnosisMetrics.highPriority > 0 ? "Zuerst prüfen" : diagnosisMetrics.additional > 0 ? "Nächster Prüfschritt" : "Diagnosestatus"}
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginBottom: 5, letterSpacing: "-0.015em" }}>
                {diagnosisMetrics.topPriority}
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.48)", lineHeight: 1.55 }}>
                {diagnosisMetrics.highPriority > 0
                  ? "WebsiteFix priorisiert technische Befunde, die Erreichbarkeit, Indexierung oder Bedienbarkeit direkt beeinträchtigen können."
                  : diagnosisMetrics.additional > 0
                  ? "Es wurden keine direkten Blocker erkannt. Die verbleibenden Hinweise solltest du Seite für Seite prüfen."
                  : "Bei den aktuell geprüften Signalen gibt es keinen akuten Befund. Weitere Messungen können zusätzliche Hinweise liefern."}
              </div>
            </div>
            {(diagnosisMetrics.highPriority > 0 || diagnosisMetrics.additional > 0) && (
              <a
                href="#deep-scan-map"
                style={{
                  alignSelf: "center", padding: "9px 13px", borderRadius: 8,
                  background: `${diagnosisTone.color}12`, border: `1px solid ${diagnosisTone.color}35`,
                  color: diagnosisTone.color, textDecoration: "none", fontSize: 12, fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                Befund ansehen ↓
              </a>
            )}
          </div>

          {/* ── DIAGNOSIS SUMMARY ── */}
          <div style={{
            borderRadius: 16, overflow: "hidden",
            background: "rgba(255,255,255,0.018)",
            border: "1px solid rgba(255,255,255,0.075)",
            marginBottom: 18,
          }}>
            <div style={{
              padding: "14px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, flexWrap: "wrap",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Was WebsiteFix gefunden hat</div>
                <div style={{ marginTop: 3, fontSize: 11.5, color: "rgba(255,255,255,0.34)" }}>
                  Technische Befunde aus dem aktuellen Scan — ohne geschätzten SEO- oder Umsatz-Score.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10.5, padding: "4px 8px", borderRadius: 20, color: "rgba(255,255,255,0.50)", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {pagesTotal} Seiten
                </span>
                <span style={{ fontSize: 10.5, padding: "4px 8px", borderRadius: 20, color: "rgba(255,255,255,0.50)", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {affectedPagesCount} mit Befund
                </span>
              </div>
            </div>

            {visibleOverviewFindings.length > 0 ? (
              <div>
                {visibleOverviewFindings.map((finding, index) => {
                  const tone =
                    finding.priority === "high"
                      ? { color: "#f59e0b", bg: "rgba(245,158,11,0.055)" }
                      : finding.priority === "check"
                      ? { color: "#FBBF24", bg: "rgba(251,191,36,0.035)" }
                      : { color: "#7aa6ff", bg: "rgba(122,166,255,0.03)" };

                  return (
                    <div
                      key={finding.key}
                      className="wf-v5-finding-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr) auto",
                        gap: 13,
                        padding: "15px 18px",
                        alignItems: "start",
                        background: tone.bg,
                        borderBottom: index < visibleOverviewFindings.length - 1 ? "1px solid rgba(255,255,255,0.045)" : "none",
                      }}
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", marginTop: 5,
                        background: tone.color, boxShadow: `0 0 0 3px ${tone.color}12`,
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{finding.title}</span>
                          <span style={{ fontSize: 10.5, color: tone.color, fontFamily: "monospace" }}>{finding.evidence}</span>
                        </div>
                        <div style={{ fontSize: 11.8, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
                          {finding.meaning}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 9.5, fontWeight: 850, letterSpacing: "0.06em", textTransform: "uppercase",
                        color: tone.color, padding: "3px 7px", borderRadius: 5,
                        border: `1px solid ${tone.color}30`, background: `${tone.color}0b`,
                        whiteSpace: "nowrap",
                      }}>
                        {finding.priority === "high" ? "hoch" : finding.priority === "check" ? "prüfen" : "hinweis"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "18px", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#4ade80", fontWeight: 900 }}>✓</span>
                <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.52)" }}>
                  Keine akuten Befunde in den aktuell ausgewerteten technischen Signalen.
                </span>
              </div>
            )}
          </div>

          {/* ── PERFORMANCE AS A COMPACT DIAGNOSIS STEP ── */}
          {!isDemo && userTier === "anon" && scan && (
            <div style={{
              marginBottom: 24,
              padding: "13px 16px",
              borderRadius: 12,
              background: "rgba(122,166,255,0.025)",
              border: "1px solid rgba(122,166,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "rgba(255,255,255,0.82)", marginBottom: 3 }}>
                  Performance noch nicht gemessen
                </div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
                  Core Web Vitals werden separat über Google PageSpeed Insights gemessen.
                </div>
              </div>
              <PsiButton url={scan.url} onTrack={() => trackCta("Click PSI Anon", "results-diagnosis")} />
            </div>
          )}
        </section>

        {/* ── TECHNICAL CONTEXT ── */}
        {!isDemo && scan && (
          <section style={{
            marginBottom: 34,
            borderRadius: 14,
            background: "rgba(255,255,255,0.016)",
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.055)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}>
              <div>
                <div style={{
                  fontSize: 10,
                  fontWeight: 850,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(122,166,255,0.65)",
                  marginBottom: 4,
                }}>
                  Technischer Kontext
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>
                  WordPress-Signale aus dem Scan
                </div>
              </div>

              {scan.wpVersion && (
                <span style={{
                  padding: "4px 8px",
                  borderRadius: 20,
                  fontSize: 10.5,
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(122,166,255,0.05)",
                  border: "1px solid rgba(122,166,255,0.16)",
                }}>
                  WordPress {scan.wpVersion}
                </span>
              )}
            </div>

            <div
              className="wf-v51-context-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              }}
            >
              {[
                {
                  label: "WordPress",
                  value: scan.wpVersion
                    ? `erkannt · Version ${scan.wpVersion}`
                    : "erkannt",
                  state: "ok" as const,
                },
                {
                  label: "XML-RPC",
                  value: scan.xmlRpcOpen ? "erreichbar" : "nicht erreichbar",
                  state: "neutral" as const,
                },
                {
                  label: "Sitemap",
                  value: scan.hasSitemap ? "gefunden" : "nicht erkannt",
                  state: scan.hasSitemap ? "ok" as const : "check" as const,
                },
                {
                  label: "robots.txt",
                  value: scan.robotsBlocked
                    ? "Crawler umfassend blockiert"
                    : "keine umfassende Crawl-Sperre erkannt",
                  state: scan.robotsBlocked ? "check" as const : "ok" as const,
                },
                {
                  label: "SEO-Plugin",
                  value: scan.hasRankMath
                    ? "Rank Math erkannt"
                    : scan.hasYoast
                    ? "Yoast erkannt"
                    : "kein unterstütztes Plugin erkannt",
                  state: (scan.hasRankMath || scan.hasYoast) ? "ok" as const : "neutral" as const,
                },
              ].map((item, index, arr) => {
                const tone =
                  item.state === "ok"
                    ? { dot: "#4ade80", text: "rgba(255,255,255,0.72)" }
                    : item.state === "check"
                    ? { dot: "#f59e0b", text: "rgba(255,255,255,0.72)" }
                    : { dot: "#7aa6ff", text: "rgba(255,255,255,0.66)" };

                return (
                  <div
                    key={item.label}
                    style={{
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      minWidth: 0,
                      borderRight: index % 2 === 0 ? "1px solid rgba(255,255,255,0.045)" : "none",
                      borderBottom: index < arr.length - 2 ? "1px solid rgba(255,255,255,0.045)" : "none",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: tone.dot, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 750, color: "#fff", marginBottom: 2 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 10.8, color: tone.text, lineHeight: 1.45 }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SECTION 2: BETROFFENE SEITEN ── */}
        <section id="deep-scan-map" style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Betroffene Seiten</p>
              <h2 style={{ margin: "0 0 6px", fontSize: "clamp(18px, 2.5vw, 26px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
                {isDemo ? "Beispielhafte Seitenbefunde" : `${diagnosisMetrics.affectedPages} von ${pagesTotal} ${pagesTotal === 1 ? "Seite mit Befund" : "Seiten mit Befund"}`}
              </h2>
              {!isDemo && (entdeckteUrls > pagesTotal || skippedCount > 0) && (
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                  {entdeckteUrls > 0 ? `${entdeckteUrls} URLs entdeckt` : ""}
                  {skippedCount > 0 ? ` · ${skippedCount} Feed/XML-Endpunkte übersprungen` : ""}
                  {!isDemo && totalTableErrors > 0 ? ` · ${totalTableErrors} Befunde gesamt` : ""}
                </p>
              )}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: 8, flexShrink: 0 }}>
              {pagesTotal} Seiten geprüft
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            {/* Header row */}
            <div className="wf-scan-header" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Seite</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", width: 120, textAlign: "center" }}>Status</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", width: 90, textAlign: "right" }}>Befunde</span>
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
              const statusLabel = isUnreachable ? "Nicht erreichbar" : p.errors === 0 ? "✓ Unauffällig" : "Befund";
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
                    <div className="wf-scan-errors" style={{ width: 90, textAlign: "right", position: "relative" }}>
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
                        {p.errors === 0 ? "—" : `${p.errors} ${p.errors === 1 ? "Befund" : "Befunde"}`}
                        {canExpand && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>{isExpanded ? "▲" : "▼"}</span>}
                      </span>
                      {/* Pulse-Hint-Tooltip entfernt (12.05.2026): ~250px-Text
                          passte nicht in die 90px-"Fehler"-Cell, ragte über die
                          Tabellen-Breite raus und überlappte Nachbar-Zeilen.
                          Position-Hacks (absolute + right:0 + zIndex) waren
                          unzureichend. Die unterstrichelte "X Befunde"-
                          Cell selbst signalisiert die Klick-Möglichkeit bereits
                          (textDecoration: underline dotted + cursor: pointer +
                          ▼-Caret). Kein extra Hint nötig. */}
                    </div>
                  </div>

                  {/* ── DETAILDIAGNOSE ── */}
                  {isExpanded && (
                    userTier === "anon" ? (
                      <div style={{ padding: "14px 20px 18px" }}>
                        <LockedOverlay tier={userTier}>
                          <ProtoPanelContent p={p} tier={userTier} focusPillar={focusPillar} speedPreview={speedPreview} />
                        </LockedOverlay>
                      </div>
                    ) : <ProtoPanelContent p={p} tier={userTier} focusPillar={focusPillar} speedPreview={speedPreview} />
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{totalTableErrors} Befunde</span>
                </div>
              </div>
            )}

            {/* Freischalt-CTA under the map */}
            <div style={{ padding: "14px 20px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  trackCta("Click Map Footer", "deep-scan-map");
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{ fontSize: 13, color: "#FBBF24", textDecoration: "none", fontWeight: 700, cursor: "pointer" }}
              >
                Alle Befunde, Ursachen und nächsten Schritte freischalten →
              </a>
            </div>
          </div>
        </section>

        {/* ── WEBSITE-EXZELLENZ BADGE ── */}
        {!isDemo && diagnosisMetrics.highPriority === 0 && diagnosisMetrics.additional === 0 && (
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
                  Keine akuten Befunde ✓
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                  Bei den aktuell geprüften Signalen wurden keine akuten technischen Probleme erkannt. Das ist keine Garantie für vollständige Fehlerfreiheit.
                </div>
              </div>
              <div style={{
                marginLeft: "auto", flexShrink: 0,
                fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                color: "#22c55e", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                Scan unauffällig
              </div>
            </div>
          </section>
        )}

        {/* ── PRICING TIERS ── */}
        {userTier !== "paid" && (
          <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 20, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", fontSize: 11, fontWeight: 700, color: "#FBBF24", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                Diagnose vertiefen
              </div>
              <h2 style={{ margin: "0 0 10px", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.025em" }}>
                Vom Befund zum konkreten nächsten Schritt
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 480, marginInline: "auto" }}>
                Schalte die vollständige Diagnose mit betroffenen Seiten, Ursachen und konkreten WordPress-Schritten frei.
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
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.5 }}>Für Selbstständige · bis zu 2 Sites</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, marginBottom: 20 }}>
                  {["2 Projekte · 10 Deep-Scans/Monat", "Technik, Sichtbarkeit und Performance", "🔒 Read-Only Plugin (Hybrid-Scan)", "Schritt-für-Schritt-Anleitungen"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                      <span style={{ color: "#FBBF24", fontSize: 11 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/register?plan=starter"
                  onClick={() => trackCta("Click Starter Plan", "pricing-tiers")}
                  style={{ display: "block", textAlign: "center", padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                >
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
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20, lineHeight: 1.5 }}>Für Freelancer und kleine Agenturen</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, marginBottom: 20 }}>
                  {["10 WordPress-Projekte · unbegrenzte Scans", "Vollständige Detaildiagnose", "Konkrete WordPress-Fix-Anleitungen", "Verlauf und Monitoring", "White-Label PDF (Logo + Brand)", "Schritt-für-Schritt-Anleitungen"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: "#FBBF24", fontSize: 11 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/register?plan=professional"
                  onClick={() => trackCta("Click Professional Plan", "pricing-tiers")}
                  style={{ display: "block", textAlign: "center", padding: "11px 20px", borderRadius: 10, background: "#FBBF24", color: "#000", fontSize: 13, fontWeight: 800, textDecoration: "none" }}
                >
                  Professional starten →
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
          <Link
            href="/scan"
            onClick={() => trackCta("Click Rescan", "results-footer")}
            style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}
          >
            ← Andere Seite scannen
          </Link>
        </div>

      </main>

      {/* ── MOBILE STICKY CTA ── */}
      {/* Auf <768px ist der Top-Optimize-CTA versteckt (hide-sm). Damit mobile
          User nicht ohne sichtbaren Conversion-Touchpoint scrollen, blenden
          wir hier einen Sticky-Bottom-Bar ein. Nur für anon/free, nicht paid. */}
      {!isDemo && userTier !== "paid" && (
        <div className="wf-mobile-sticky-cta" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
          padding: "10px 16px",
          background: "rgba(11,12,16,0.96)", backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "none",
          gap: 8,
        }}>
          <Link
            href="/scan/checkout"
            onClick={() => trackCta("Click Pay-per-Fix", "mobile-sticky")}
            style={{
              flex: 1, textAlign: "center",
              padding: "10px 12px", borderRadius: 9,
              background: "rgba(251,191,36,0.12)", color: "#FBBF24",
              border: "1px solid rgba(251,191,36,0.35)",
              fontSize: 12, fontWeight: 800, textDecoration: "none",
            }}
          >
            9,90 € Einzel-Fix
          </Link>
          <Link
            href="/register?plan=starter"
            onClick={() => trackCta("Click Starter Plan", "mobile-sticky")}
            style={{
              flex: 1.2, textAlign: "center",
              padding: "10px 12px", borderRadius: 9,
              background: "linear-gradient(90deg, #059669, #10B981)",
              color: "#fff",
              fontSize: 12, fontWeight: 800, textDecoration: "none",
              boxShadow: "0 4px 14px rgba(16,185,129,0.32)",
            }}
          >
            29 € Flatrate →
          </Link>
        </div>
      )}

      <SiteFooter />
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
