import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest, isUrlAllowed } from "@/lib/scan-guard";
import { checkIpRateLimit } from "@/lib/ip-rate-limit";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { callWithRetry } from "@/lib/ai-retry";
import { getCachedScan, saveScanAsync, cacheTtlHours } from "@/lib/scan-cache";
import { logScan } from "@/lib/scan-logger";
import { batchAsync } from "@/lib/batch-async";
import { MODELS } from "@/lib/ai-models";
import { buildFingerprintFromRaw } from "@/lib/tech-detector";
import { buildRawWebsiteData } from "@/lib/tech-detector/fetcher";
import { normalizePlan, isAgency, isAtLeastProfessional, isPaidPlan, getPlanQuota } from "@/lib/plans";
import { getIntegrationSettings, triggerZapierScanWebhook } from "@/lib/integrations";
import { sendScanSummaryToSlack } from "@/lib/slack";
import { consolidatePerPageIssuesPublic, classifyScopesPublic } from "@/lib/scan-engine/aggregator";
import type { IssueKind } from "@/lib/scan-engine/types";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Compute issue count from scanData ───────────────────────
function computeIssueCount(sd: Record<string, unknown>): number {
  const audit = sd.audit as {
    unterseiten?: { erreichbar: boolean }[];
    duplicateTitles?: unknown[];
    duplicateMetas?: unknown[];
    altTexte?: { fehlend: number };
    brokenLinks?: unknown[];
    verwaistSeiten?: unknown[];
  } | undefined;
  return [
    !sd.https,
    !sd.erreichbar,
    !sd.title,
    !sd.metaDescription,
    !sd.h1,
    sd.robotsBlockiertAlles,
    !sd.sitemapVorhanden,
    audit?.unterseiten?.some(p => !p.erreichbar),
    (audit?.duplicateTitles?.length ?? 0) > 0,
    (audit?.duplicateMetas?.length ?? 0) > 0,
    (audit?.altTexte?.fehlend ?? 0) > 0,
    (audit?.brokenLinks?.length ?? 0) > 0,
    (audit?.verwaistSeiten?.length ?? 0) > 0,
  ].filter(Boolean).length;
}

// ── Structured issue type (saved as issues_json) ────────────
// Phase B / Push 2: kind + affectedUrls + scope sind die Aggregator-Felder
// (lib/scan-engine/types.ts). Lokaler Type bleibt structural-kompatibel zum
// Engine-Type, damit die hier generierten Issues durch consolidatePerPageIssues
// und classifyScopes laufen können.
export type ScanIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik" | "shop" | "builder"; // shop = WooCommerce, builder = Page-Builder/Theme
  url?: string; // per-page issues carry their URL
  count: number; // actual number of errors this issue represents (e.g. 24 for alt-missing)
  /** kind/affectedUrls/scope werden von annotateAndConsolidate() befüllt
   *  und vom Aggregator-Algorithmus genutzt. Optional, damit raw issues
   *  aus buildIssuesJson() ohne diese Felder weiterhin valide sind. */
  kind?:         IssueKind;
  affectedUrls?: string[];
  scope?:        "global" | "local";
};

function classifyIssueCategory(text: string): ScanIssue["category"] {
  const t = text.toLowerCase();
  if (/bfsg|wcag|barriere|impressum|datenschutz|cookie|dsgvo|label|aria|alt.?text/.test(t)) return "recht";
  if (/speed|lcp|cls|ladezeit|pagespeed|core web/.test(t)) return "speed";
  return "technik";
}

/**
 * Phase B / Push 2: Title-Prefix-Matching → IssueKind.
 *
 * buildIssuesJson() generiert Issues mit menschlich lesbaren Titeln, aber
 * ohne IssueKind-Identifier. Der Aggregator braucht aber kind, um per-page
 * Issues über mehrere URLs zu gruppieren (z.B. "Alt-Text fehlt auf /a/b/c"
 * → ein konsolidierter Issue mit affectedUrls-Liste).
 *
 * Die Inferenz ist string-basiert (fragil-aber-pragmatisch). Unbekannte
 * Title-Patterns liefern undefined → Issue bleibt ungrouped, kein Crash.
 *
 * Wenn buildIssuesJson später kind selbst setzt, kann diese Inferenz weg.
 */
function inferIssueKind(title: string): IssueKind | undefined {
  const t = title.toLowerCase();
  // Per-Page-Kinds (sind Konsolidierungs-Targets)
  if (t.includes("alt-attribut") || t.includes("alt-text"))     return "alt-text-missing";
  if (t.includes("h1-haupt") || t.includes("h1-überschrift"))   return "h1-missing";
  if (t.includes("title-tag fehlt"))                            return "title-missing";
  if (t.includes("meta-description fehlt"))                     return "meta-description-missing";
  if (t.includes("noindex"))                                    return "noindex";
  if (t.includes("formular-label") || t.includes("formularfelder")) return "form-label-missing";
  if (t.includes("button") && t.includes("ohne") && t.includes("text")) return "form-button-text-missing";
  // Phase A2 — neue Per-Page-Kinds
  if (t.includes("opengraph") || t.includes("social-vorschau"))   return "og-missing";
  if (t.includes("twitter") || t.includes("x-vorschau"))           return "twitter-card-missing";
  if (t.includes("favicon"))                                       return "favicon-missing";
  if (t.includes("sprache nicht definiert") || t.includes("html lang")) return "html-lang-missing";
  if (t.includes("überschriften-hierarchie") || t.includes("heading-hierarchie")) return "heading-hierarchy-broken";
  if (t.includes("security-header"))                               return "security-headers-missing";
  // Site-Wide-Kinds (für scope-Klassifikation, nicht-konsolidierbar)
  if (t.includes("https fehlt") || t.includes("verschlüsselte verbindung")) return "no-https";
  if (t.includes("robots.txt blockiert"))                       return "robots-blocks-all";
  if (t.includes("sitemap.xml fehlt"))                          return "sitemap-missing";
  if (t.includes("wordpress veraltet"))                         return "wp-stale";
  if (t.includes("identischer title-tag"))                      return "duplicate-titles";
  if (t.includes("identische meta-description"))                return "duplicate-metas";
  if (t.includes("tote link") || t.includes("404"))             return "broken-links";
  if (t.includes("ohne interne verlinkung") || t.includes("orphan")) return "orphaned-pages";
  if (t.includes("4xx/5xx"))                                    return "page-not-reachable";
  // Phase A3: SSL-Cert-Issues
  if (t.includes("ssl-zertifikat") || t.includes("ssl certificate") || t.includes("zertifikat läuft")) return "ssl-expiring-soon";
  return undefined;
}

/**
 * Annotiert raw Issues mit kind, konsolidiert per-page-Duplikate (über
 * affectedUrls-Listen) und klassifiziert scope ("global" wenn >= 80% Pages
 * betroffen). Wird nach buildIssuesJson() + Builder/WP/DSGVO-Issues aufgerufen.
 */
function annotateAndConsolidate(issues: ScanIssue[], totalPages: number): ScanIssue[] {
  const annotated = issues.map(i => i.kind ? i : { ...i, kind: inferIssueKind(i.title) });
  const consolidated = consolidatePerPageIssuesPublic(annotated);
  return classifyScopesPublic(consolidated, totalPages);
}

/** Aktuelle WordPress-Major-Version. Updaten wenn neue Releases rauskommen.
 *  < 6.5 wird als veraltet geflaggt (≥2 Minor-Versionen hinten). */
const LATEST_WP_VERSION = "6.7";
const STALE_WP_THRESHOLD_MAJOR = 6;
const STALE_WP_THRESHOLD_MINOR = 5;

function isWpStale(version: string | null | undefined): boolean {
  if (!version) return false;
  const [majStr, minStr] = version.split(".");
  const major = parseInt(majStr ?? "", 10);
  const minor = parseInt(minStr ?? "0", 10);
  if (Number.isNaN(major)) return false;
  if (major < STALE_WP_THRESHOLD_MAJOR) return true;
  if (major === STALE_WP_THRESHOLD_MAJOR && minor < STALE_WP_THRESHOLD_MINOR) return true;
  return false;
}

/**
 * Build a deterministic, structured issues array directly from raw scan data.
 * This is the ground truth — saved as issues_json so the dashboard never has
 * to re-parse the AI text (which loses fidelity).
 */
function buildIssuesJson(
  scanData: Record<string, unknown>,
  unterseiten: { url: string; erreichbar: boolean; title: string; h1: string; noindex: boolean; altMissing: number; metaDescription?: string; inputsWithoutLabel?: number; buttonsWithoutText?: number }[],
  totalAltMissing: number,
  totalImages: number,
  duplicateTitles: { title: string; seiten: string[] }[],
  duplicateMetas: { meta: string; seiten: string[] }[],
  brokenLinks: { url: string; status: number }[],
  orphanedPages: string[],
): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };
  const fc = scanData.formCheck as { inputsWithoutLabel?: number; buttonsWithoutText?: number } | undefined;

  // ── Global issues ──
  if (!scanData.https)
    issues.push({ severity: "red", title: "Sicherheitsrisiko: Keine verschlüsselte Verbindung (HTTPS fehlt)", body: "Besucher sehen eine Browser-Warnung — Google stuft unverschlüsselte Seiten im Ranking ab und markiert sie als unsicher.", category: "technik", count: 1 });
  if (!scanData.erreichbar)
    issues.push({ severity: "red", title: "Kritischer Ausfall: Startseite nicht erreichbar (4xx/5xx)", body: "Die Startseite gibt einen Fehler zurück — Besucher und Google sehen nur eine Fehlerseite.", category: "technik", count: 1 });
  if (!scanData.title)
    issues.push({ severity: "red", title: "Unsichtbar bei Google: Title-Tag fehlt (Startseite)", body: "Ohne Title-Tag fehlt das wichtigste On-Page-SEO-Signal — kein Ranking-Snippet in der Suche möglich.", category: "technik", count: 1 });
  if (!scanData.metaDescription)
    issues.push({ severity: "yellow", title: "Schlechte Klickrate: Meta-Description fehlt (Startseite)", body: "Google wählt einen zufälligen Seitenausschnitt als Vorschautext — Klicks und Conversions sinken messbar. Das Snippet sollte gezielt formuliert sein.", category: "technik", count: 1 });
  if (!scanData.h1)
    issues.push({ severity: "red", title: "SEO-Schwäche: H1-Hauptüberschrift fehlt (Startseite)", body: "Ohne H1 fehlt das wichtigste Inhaltssignal für Google — das Ranking und die Nutzererfahrung leiden direkt darunter.", category: "technik", count: 1 });
  if (scanData.robotsBlockiertAlles)
    issues.push({ severity: "red", title: "Kritisch: robots.txt blockiert Google komplett", body: "Die gesamte Website ist für alle Suchmaschinen-Crawler gesperrt — kein Seiteninhalt wird indexiert.", category: "technik", count: 1 });
  if (scanData.indexierungGesperrt)
    issues.push({ severity: "red", title: "Kritisch: Startseite für Google unsichtbar (noindex gesetzt)", body: "Der noindex-Tag macht die Startseite für Suchmaschinen komplett unsichtbar — kein Traffic aus der organischen Suche möglich.", category: "technik", count: 1 });
  if (!scanData.sitemapVorhanden)
    issues.push({ severity: "yellow", title: "Langsame Indexierung: Sitemap.xml fehlt", body: "Ohne Sitemap findet Google neue Inhalte langsamer — besonders kritisch nach Relaunch oder bei neu veröffentlichten Seiten.", category: "technik", count: 1 });

  // ── WordPress-Version-Staleness ──
  // Nur wenn wpVersion erkennbar war (viele gehärtete WP-Sites blenden den
  // Generator-Tag aus → null → kein Issue, kein false-positive).
  const wpVer = typeof scanData.wpVersion === "string" ? scanData.wpVersion : null;
  if (wpVer && isWpStale(wpVer)) {
    issues.push({
      severity: "yellow",
      title: `WordPress veraltet: ${wpVer} (aktuell: ${LATEST_WP_VERSION})`,
      body: `Die installierte WordPress-Version ${wpVer} liegt mehrere Minor-Releases hinter ${LATEST_WP_VERSION}. Jede Major-Version schließt Sicherheitslücken — veraltete Cores sind das #1 Einfallstor für Hack-Versuche und führen zu Plugin-Inkompatibilitäten. Empfehlung: Im WP-Admin unter "Updates" Core, Plugins und Themes aktualisieren.`,
      category: "technik",
      count: 1,
    });
  }

  // ── BFSG / Accessibility ──
  if (totalAltMissing > 0)
    issues.push({ severity: "red", title: `Barrierefreiheits-Verstoß: ${totalAltMissing} Bilder für Screenreader unsichtbar (BFSG-Risiko)`, body: `${totalAltMissing} von ${totalImages} Bildern fehlt der Alt-Text — ab 06/2025 gesetzlich vorgeschrieben, konkrete Abmahngefahr.`, category: "recht", count: totalAltMissing });
  if ((fc?.inputsWithoutLabel ?? 0) > 0)
    issues.push({ severity: "red", title: `Barrierefreiheits-Verstoß: ${fc!.inputsWithoutLabel} Formularfelder nicht nutzbar für Screenreader (BFSG §3)`, body: "Formularfelder ohne Label-Verknüpfung — Screen-Reader können sie nicht vorlesen, Nutzer mit Behinderungen sind ausgeschlossen.", category: "recht", count: fc!.inputsWithoutLabel! });

  // ── SEO-Duplikate ──
  if (duplicateTitles.length > 0)
    issues.push({ severity: "red", title: `Google-Verwirrung: ${duplicateTitles.length}× identischer Title-Tag (Ranking-Verlust)`, body: `Doppelte Titles führen zu Duplicate-Content-Problemen bei Google. Betroffen: ${duplicateTitles.slice(0, 3).flatMap(d => d.seiten).slice(0, 3).map(toPath).join(", ")}`, category: "technik", count: duplicateTitles.length });
  if (duplicateMetas.length > 0)
    issues.push({ severity: "yellow", title: `Schwache Klickrate: ${duplicateMetas.length}× identische Meta-Description`, body: `Identische Vorschautexte bei verschiedenen Seiten — Google ignoriert sie oder wählt beliebige Textausschnitte. Betroffen: ${duplicateMetas.slice(0, 3).flatMap(d => d.seiten).slice(0, 3).map(toPath).join(", ")}`, category: "technik", count: duplicateMetas.length });

  // ── Broken Links / Orphans ──
  if (brokenLinks.length > 0)
    issues.push({ severity: "red", title: `Geschäftsschädigend: ${brokenLinks.length} tote Link${brokenLinks.length > 1 ? "s" : ""} (404) führen ins Leere`, body: `Fehlerhafte Links frustrieren Besucher, schaden dem Ranking und kosten Conversions: ${brokenLinks.slice(0, 3).map(b => toPath(b.url)).join(", ")}`, category: "technik", count: brokenLinks.length });
  if (orphanedPages.length > 0)
    issues.push({ severity: "yellow", title: `Versteckter Content: ${orphanedPages.length} Seite${orphanedPages.length > 1 ? "n" : ""} ohne interne Verlinkung (nicht auffindbar)`, body: `Keine internen Links zeigen auf diese Seiten — Google und Besucher finden sie kaum. Betroffen: ${orphanedPages.slice(0, 3).map(toPath).join(", ")}`, category: "technik", count: orphanedPages.length });

  // ── Per-page issues ──
  for (const p of unterseiten) {
    const path = toPath(p.url);
    if (!p.erreichbar)
      issues.push({ severity: "red", title: `Toter Link: ${path} gibt 404/5xx zurück`, body: "Besucher und Crawler landen auf einer Fehlerseite — direkter UX-Schaden und Ranking-Verlust für diese URL.", category: "technik", url: p.url, count: 1 });
    if (!p.title || p.title === "(kein Title)")
      issues.push({ severity: "red", title: `Unsichtbar bei Google: Title-Tag fehlt auf ${path}`, body: "Fehlender Title-Tag verhindert ein Ranking-Snippet — diese Unterseite kann nicht ranken.", category: "technik", url: p.url, count: 1 });
    if (!p.h1 || p.h1 === "(kein H1)")
      issues.push({ severity: "yellow", title: `SEO-Schwäche: H1-Hauptüberschrift fehlt auf ${path}`, body: "Fehlende H1 schwächt das Keyword-Signal — Google bewertet diese Seite schlechter.", category: "technik", url: p.url, count: 1 });
    if (p.noindex)
      issues.push({ severity: "yellow", title: `Für Google gesperrt: noindex auf ${path}`, body: "Diese Unterseite ist für Suchmaschinen komplett unsichtbar — ist das beabsichtigt?", category: "technik", url: p.url, count: 1 });
    if (p.altMissing > 0)
      issues.push({ severity: "red", title: `BFSG-Verstoß: ${p.altMissing}× fehlendes Alt-Attribut auf ${path}`, body: `${p.altMissing} Bild${p.altMissing > 1 ? "er" : ""} ohne Alt-Text auf dieser Seite — Barrierefreiheitsgesetz ab 06/2025 verpflichtend.`, category: "recht", url: p.url, count: p.altMissing });
    if (!p.metaDescription)
      issues.push({ severity: "yellow", title: `Schlechte Klickrate: Meta-Description fehlt auf ${path}`, body: "Fehlende Meta-Description — Google wählt einen beliebigen Seitenausschnitt als Snippet in der Suche.", category: "technik", url: p.url, count: 1 });
    if ((p.inputsWithoutLabel ?? 0) > 0)
      issues.push({ severity: "red", title: `BFSG-Verstoß: ${p.inputsWithoutLabel} Formular-Label${(p.inputsWithoutLabel ?? 0) > 1 ? "s" : ""} fehlen auf ${path}`, body: "Formularfelder ohne sichtbares Label — Screen-Reader können sie nicht vorlesen (BFSG §3 Abs. 2).", category: "recht", url: p.url, count: p.inputsWithoutLabel! });
  }

  return issues;
}

// ── WordPress-spezifische Security / Performance Checks ───────────
/** Prüft /wp-admin, /wp-login.php und /xmlrpc.php auf offene Angriffsflächen. */
async function runWordPressChecks(baseUrl: string): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];
  let origin: string;
  try { origin = new URL(baseUrl).origin; } catch { return issues; }

  async function probe(path: string): Promise<number | null> {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(origin + path, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": "WebsiteFix-Scanner/1.0" },
      });
      clearTimeout(t);
      return res.status;
    } catch { return null; }
  }

  const [loginStatus, xmlrpcStatus] = await Promise.all([
    probe("/wp-login.php"),
    probe("/xmlrpc.php"),
  ]);

  if (loginStatus !== null && loginStatus < 400) {
    issues.push({
      severity: "yellow",
      title: "WordPress-Login unter /wp-login.php öffentlich erreichbar",
      body: "Der Standard-Login ist über die Standard-URL erreichbar und ein bekanntes Ziel für Brute-Force-Angriffe. Empfehlung: Login-URL ändern (z.B. WPS Hide Login) oder per .htaccess / Firewall absichern.",
      category: "technik",
      count: 1,
    });
  }

  if (xmlrpcStatus !== null && xmlrpcStatus < 400 && xmlrpcStatus !== 405) {
    issues.push({
      severity: "red",
      title: "XML-RPC-Endpunkt (/xmlrpc.php) offen — Brute-Force-Risiko",
      body: "xmlrpc.php erlaubt Remote-Aufrufe und wird für verteilte Angriffe (Pingback-DDoS, Login-Bruteforce) missbraucht. Empfehlung: .htaccess-Block oder Plugin 'Disable XML-RPC'.",
      category: "technik",
      count: 1,
    });
  }

  return issues;
}

// ── WooCommerce-spezifische Shop-Checks ─────────────────────────────────
/**
 * E-Commerce Business Auditor für WooCommerce.
 * Prüft Cart-Performance, Database-Bloat, Upload-Security, UX-Buttons,
 * Plugin-Impact und veraltete Templates. Erzeugt shop-kategorisierte Issues
 * plus strukturierte Meta-Daten für die Dashboard-Visualisierung.
 */
export type WooAuditMeta = {
  /** Anzahl gefundener add_to_cart-Buttons auf der Seite */
  addToCartButtons:     number;
  /** Sind kritische Skripte nahe der Buttons blockierend (ohne defer/async)? */
  cartButtonsBlocked:   boolean;
  /** Top 3 WooCommerce-Addons mit geschätztem TTI-Impact (Gewicht 1..10). */
  pluginImpact:         Array<{ name: string; impactScore: number; reason: string }>;
  /** Hinweis: Shop verwendet veraltete Template-Override im Theme-Ordner? */
  outdatedTemplates:    boolean;
  /** Revenue-at-Risk — Basis-Prozent-Wert für die UI-Kalkulation (0-40) */
  revenueRiskPct:       number;
};

async function runWooCommerceChecks(params: {
  baseUrl: string;
  html: string;
  scriptUrls: string[];
  speedScore: number;
}): Promise<{ issues: ScanIssue[]; meta: WooAuditMeta }> {
  const issues: ScanIssue[] = [];
  const meta: WooAuditMeta = {
    addToCartButtons:   0,
    cartButtonsBlocked: false,
    pluginImpact:       [],
    outdatedTemplates:  false,
    revenueRiskPct:     0,
  };
  let origin: string;
  try { origin = new URL(params.baseUrl).origin; } catch { return { issues, meta }; }

  async function probe(path: string): Promise<number | null> {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(origin + path, {
        method: "GET",
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": "WebsiteFix-Scanner/1.0" },
      });
      clearTimeout(t);
      return res.status;
    } catch { return null; }
  }

  // Kleiner Helper: gibt true zurück, wenn irgendein <script> mit dieser URL-Pattern
  // KEIN defer/async-Attribut hat (blockierendes Parsen).
  function hasBlockingScript(pattern: RegExp): boolean {
    const tags = params.html.match(/<script[^>]*>/gi) ?? [];
    return tags.some(tag => pattern.test(tag) && !/\b(defer|async)\b/i.test(tag));
  }

  // 1. Cart-Fragments: wc-ajax=get_refreshed_fragments wird auf JEDER Seite geladen
  //    und ist der klassische WooCommerce-Ladezeit-Killer (unncached AJAX-Request).
  const hasCartFragments =
    /wc-cart-fragments|wc-ajax=get_refreshed_fragments|woocommerce-cart-fragments/.test(params.html) ||
    params.scriptUrls.some(u => /wc-cart-fragments/.test(u));

  if (hasCartFragments) {
    issues.push({
      severity: "yellow",
      title: "WooCommerce Cart-Fragments blockiert Ladezeit (wc-ajax=get_refreshed_fragments)",
      body: "Das cart-fragments.js-Skript löst auf JEDER Seite einen AJAX-Request an /?wc-ajax=get_refreshed_fragments aus — ein klassischer WooCommerce-Performance-Killer, besonders auf der Startseite und Blog-Artikeln ohne Warenkorb. Empfehlung: Cart-Fragments per Plugin (Disable Cart Fragments) oder Code-Snippet auf Nicht-Shop-Seiten deaktivieren — spart typisch 200–500 ms Ladezeit.",
      category: "shop",
      count: 1,
    });
  }

  // 2. Upload-Ordner-Security: woocommerce_uploads enthält Order-CSVs, Rechnungen, Lizenzen.
  //    Wenn Directory-Listing aktiv ist (Status 200 mit HTML-Listing), ist das kritisch.
  const uploadDirStatus = await probe("/wp-content/uploads/woocommerce_uploads/");
  if (uploadDirStatus !== null && uploadDirStatus === 200) {
    issues.push({
      severity: "red",
      title: "WooCommerce Upload-Verzeichnis ungeschützt — Rechnungs-/Order-Daten lesbar",
      body: "/wp-content/uploads/woocommerce_uploads/ liefert HTTP 200 und listet womöglich Rechnungen, Order-Exporte und Lizenz-Dateien auf. Das ist DSGVO-relevant: Kundendaten dürfen nicht direkt per URL abrufbar sein. Empfehlung: .htaccess-Regel 'Options -Indexes' setzen und Deny from all für dieses Verzeichnis aktivieren, oder das Verzeichnis per Plugin (WooCommerce Protected Categories) absichern.",
      category: "shop",
      count: 1,
    });
  }

  // 3. Database-Bloat-Indikatoren: Wenn der HTML-Output sehr viele versteckte
  //    woocommerce-Transient-/Session-Marker enthält, deutet das auf aufgeblähte
  //    wp_options oder abandoned carts hin. Heuristik: zähle wc_session_/wc_cart_-Marker.
  const sessionMarkers = (params.html.match(/wc_session_|wc_cart_|woocommerce_cart_hash|woocommerce_items_in_cart/g) ?? []).length;
  if (sessionMarkers >= 6) {
    issues.push({
      severity: "yellow",
      title: "WooCommerce Database-Bloat wahrscheinlich — viele Session-/Cart-Fragmente im HTML",
      body: `Im HTML-Output wurden ${sessionMarkers} WooCommerce-Session- und Cart-Marker gefunden. Das deutet auf verwaiste Transients und ungelöschte Expired Sessions in wp_options hin — ein typisches WooCommerce-Problem bei Shops älter als 6 Monate. Empfehlung: Plugin 'WP-Optimize' oder Admin-Tools → WooCommerce Tools → "Kundensitzungen aufräumen" laufen lassen. Bei Shops mit >1.000 Bestellungen: zusätzlich alte Order-Metadaten mit Delete Old Orders (Safe) bereinigen.`,
      category: "shop",
      count: 1,
    });
  }

  // 4. Checkout-/Cart-Seite-spezifisch: prüfe, ob der Shop HTTPS-Cookies setzt
  //    (wichtig für PCI-DSS-Konformität beim Checkout)
  const hasHttpsCheckout = /secure[^>]*cookie|__Secure-woocommerce|__Host-woocommerce/i.test(params.html);
  if (!hasHttpsCheckout && params.baseUrl.startsWith("https://")) {
    if (hasCartFragments) {
      issues.push({
        severity: "yellow",
        title: "WooCommerce: Session-Cookies ohne sichtbares Secure-Flag",
        body: "Für WooCommerce-Shops empfohlen: alle Session-Cookies sollten das Secure- und HttpOnly-Flag haben (wichtig für PCI-DSS bei Checkouts). Prüfe in wp-config.php, ob 'force_ssl_admin' und 'force_ssl_login' aktiv sind — setzt beides für eingeloggte Kunden Secure-Cookies.",
        category: "shop",
        count: 1,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // E-COMMERCE BUSINESS AUDITOR — erweiterte Pro/Agency-Checks
  // ═══════════════════════════════════════════════════════════════════════

  // 5. UX-Quick-Check: add_to_cart-Buttons finden + prüfen, ob blockierende
  //    Skripte in ihrer Nähe stehen. Schneller Checkout = mehr Conversions.
  const addToCartMatches = params.html.match(/class="[^"]*(?:add_to_cart|add-to-cart|single_add_to_cart)[^"]*"|data-product_id=/gi) ?? [];
  meta.addToCartButtons = addToCartMatches.length;

  // "Blockierende" Skripte in der Nähe der Buttons: WooCommerce-Add-to-Cart
  // hängt an jquery und wc-add-to-cart.js — wenn diese ohne defer/async
  // geladen werden, verzögert das die TTI spürbar.
  meta.cartButtonsBlocked =
    meta.addToCartButtons > 0 &&
    (hasBlockingScript(/jquery(\.min)?\.js/i) || hasBlockingScript(/wc-add-to-cart/i));

  if (meta.addToCartButtons > 0 && meta.cartButtonsBlocked) {
    issues.push({
      severity: "yellow",
      title: `UX-Bremse: ${meta.addToCartButtons} "In den Warenkorb"-Button${meta.addToCartButtons > 1 ? "s" : ""} hinter blockierendem JavaScript`,
      body: `Auf der Seite sind ${meta.addToCartButtons} add_to_cart-Elemente — aber jQuery oder wc-add-to-cart.js werden OHNE defer/async geladen. Das heißt: Der Button reagiert erst, nachdem das gesamte JavaScript geparst wurde (typisch +300–900 ms auf mobile). Lösung: WP Rocket / FlyingPress → "Defer JavaScript" aktivieren, oder manuell <script defer> in functions.php patchen. Jede 100 ms Verzögerung kostet typisch 1 % Conversion (Akamai-Studie).`,
      category: "shop",
      count: 1,
    });
  }

  // 6. Plugin-Impact-Score: Top 3 WC-Addons nach geschätztem TTI-Impact.
  //    Heuristik: bekannte "schwere" Plugin-Familien + wie oft ihr Skript
  //    eingebunden ist.
  const PLUGIN_WEIGHTS: Record<string, { pattern: RegExp; baseImpact: number; reason: string }> = {
    "WooCommerce Product Addons":   { pattern: /woocommerce-product-addons/i,         baseImpact: 7, reason: "Lädt mehrere Custom-Option-Scripts auf jeder Produktseite" },
    "YITH WooCommerce Wishlist":    { pattern: /yith-woocommerce-wishlist/i,          baseImpact: 6, reason: "Fügt jQuery-UI + Wishlist-Framework global hinzu" },
    "WooCommerce Germanized":       { pattern: /woocommerce-germanized/i,             baseImpact: 5, reason: "DSGVO-Module laden zusätzliche Tracking-/Cookie-Scripts" },
    "Variation Swatches":           { pattern: /variation-swatches|variations-radio/i,baseImpact: 6, reason: "Swatches-Rendering läuft on-the-fly pro Produkt-Variante" },
    "WooCommerce Advanced Shipping":{ pattern: /woocommerce-advanced-shipping/i,      baseImpact: 4, reason: "Zusätzliche Shipping-Calculator-Scripts am Frontend" },
    "WooCommerce Smart Coupons":    { pattern: /woocommerce-smart-coupons/i,          baseImpact: 5, reason: "Lädt Coupon-UI-Framework global" },
    "WooCommerce Bookings":         { pattern: /woocommerce-bookings/i,               baseImpact: 7, reason: "Kalender-/Zeitpicker-Scripts sind TTI-intensiv" },
    "WooCommerce Subscriptions":    { pattern: /woocommerce-subscriptions/i,          baseImpact: 6, reason: "Recurring-Billing-UI zieht zusätzliche Assets" },
    "Elementor Pro WooCommerce":    { pattern: /elementor-pro.*woocommerce|pro\/assets\/js\/woocommerce/i, baseImpact: 8, reason: "Elementor-Widgets laden pro Shop-Block eigene Scripts" },
    "WooCommerce Cart Fragments":   { pattern: /wc-cart-fragments/i,                  baseImpact: 9, reason: "Klassischer TTI-Killer: AJAX-Request auf JEDER Seite" },
  };

  const allUrls = [...params.scriptUrls, ...(params.html.match(/href=["']([^"']+)["']/gi) ?? [])];
  for (const [name, def] of Object.entries(PLUGIN_WEIGHTS)) {
    const hits = allUrls.filter(u => def.pattern.test(u)).length;
    if (hits > 0) {
      // Zusätzlicher Impact bei mehrfacher Einbindung
      const impactScore = Math.min(10, def.baseImpact + Math.min(2, Math.floor(hits / 2)));
      meta.pluginImpact.push({ name, impactScore, reason: def.reason });
    }
  }
  meta.pluginImpact.sort((a, b) => b.impactScore - a.impactScore);
  meta.pluginImpact = meta.pluginImpact.slice(0, 3);

  if (meta.pluginImpact.length >= 2) {
    const topNames = meta.pluginImpact.map(p => p.name).join(", ");
    issues.push({
      severity: "yellow",
      title: `Plugin-Ballast: ${meta.pluginImpact.length} WooCommerce-Addons belasten die Ladezeit stark`,
      body: `Die Top-Verdächtigen auf dieser Seite: ${topNames}. Jedes dieser Plugins lädt eigenständige JavaScript-Framework-Teile — auch auf Seiten ohne Shop-Bezug (z. B. Blog-Artikeln). Empfehlung: Mit dem Plugin "Asset CleanUp" oder "Perfmatters" diese Scripts selektiv nur auf /shop, /warenkorb, /produkt/* laden — typisch –40 % TTI auf Nicht-Shop-Seiten.`,
      category: "shop",
      count: meta.pluginImpact.length,
    });
  }

  // 7. Security-Focus: Veraltete WooCommerce-Templates im Theme-Ordner.
  //    WooCommerce markiert veraltete Templates mit einem HTML-Kommentar
  //    (sichtbar nur im Admin, aber manchmal im HTML-Output bei fehlerhaften
  //    Themes) oder per Classname "woocommerce-template-outdated".
  //    Zusätzlich: Template-Version-String in Archive/Single-Templates
  //    (<!-- This template is outdated -->).
  const hasOutdatedTemplate =
    /woocommerce-template-outdated|<!--\s*this template is outdated|template is out of date/i.test(params.html) ||
    // Heuristik: Theme-Override auf altem wc-Template-Pfad
    /wp-content\/themes\/[^/]+\/woocommerce\/archive-product\.php/i.test(params.html);

  meta.outdatedTemplates = hasOutdatedTemplate;

  if (hasOutdatedTemplate) {
    issues.push({
      severity: "red",
      title: "WooCommerce-Template im Theme veraltet — Darstellungsfehler nach WP-Update wahrscheinlich",
      body: "Im HTML-Output tauchen Marker für veraltete WooCommerce-Template-Overrides auf (/wp-content/themes/<dein-theme>/woocommerce/). Das bedeutet: Dein Theme überschreibt Standard-WooCommerce-Templates, die nach einem WooCommerce-Update nicht mitgewachsen sind. Typische Folgen: defekte Checkout-Felder, fehlende Steuerberechnungen, verschwundene Produktbilder. Lösung: Admin → WooCommerce → Status → System-Status → Abschnitt 'Templates' öffnen, jeden Override mit Versions-Hinweis aktualisieren (Datei aus /wp-content/plugins/woocommerce/templates/ neu kopieren und Anpassungen mergen).",
      category: "shop",
      count: 1,
    });
  }

  // 8. Revenue-at-Risk — Basis-Prozentwert für die UI-Kalkulation.
  //    Formel: jede 100 ms Ladezeit-Verlust kostet ~1 % Conversion (Akamai/Amazon).
  //    speedScore = 100 → 0 % Risk | speedScore = 50 → ~25 % Risk | Bloat & Cart-Fragments
  //    addieren jeweils 3-5 %.
  const speed = params.speedScore ?? 70;
  let riskPct = Math.max(0, Math.round((100 - speed) * 0.35)); // 100 → 0 %, 60 → 14 %, 30 → 24 %
  if (hasCartFragments)                riskPct += 5;
  if (meta.cartButtonsBlocked)         riskPct += 4;
  if (meta.pluginImpact.length >= 2)   riskPct += 3;
  if (hasOutdatedTemplate)             riskPct += 2;
  meta.revenueRiskPct = Math.min(40, riskPct); // Cap bei 40 % — realistisches Maximum

  return { issues, meta };
}

// ── DSGVO-Compliance-Check: externe Embeds ohne Consent-Wrapper ──────────
/**
 * Erkennt Google Maps, YouTube, Vimeo, Google Analytics und Facebook-Pixel im
 * HTML. Prüft, ob ein Cookie-Banner (Borlabs/Complianz/Cookiebot/UserCentrics)
 * aktiv ist UND ob die Embeds explizit in einen Consent-Wrapper eingebettet sind.
 *
 * Heuristik für Wrapper-Detection:
 * - Borlabs:  data-borlabs-cookie-uuid oder class="BorlabsCookie"
 * - Complianz: cmplz-blocked-content / data-category / cmplz-iframe
 * - Cookiebot: data-cookieconsent= / cookieconsent-optout-marketing
 * - UserCentrics: uc-embedding-container / data-usercentrics
 *
 * Fehlt für ein erkanntes Embed der Wrapper UND es gibt keinen Cookie-Banner →
 * "yellow"-Issue (DSGVO-Risiko). Gibt es das Embed UND einen Banner aber keinen
 * Wrapper → "red"-Issue (Banner ist da, aber Embeds laden trotzdem ungeschützt).
 */
async function runDsgvoEmbedChecks(html: string): Promise<ScanIssue[]> {
  const issues: ScanIssue[] = [];

  // Embeds-Detection
  const embeds: Array<{ name: string; pattern: RegExp; severity: "red" | "yellow" }> = [
    { name: "Google Maps",      pattern: /maps\.googleapis\.com\/maps|google\.com\/maps\/embed|maps\.google\.com\/maps\?/i, severity: "red" },
    { name: "YouTube",          pattern: /youtube\.com\/embed|youtube-nocookie\.com\/embed|youtu\.be\/embed/i,                severity: "red" },
    { name: "Vimeo",            pattern: /player\.vimeo\.com\/video\//i,                                                       severity: "yellow" },
    { name: "Google Analytics", pattern: /googletagmanager\.com\/gtag\/js|google-analytics\.com\/analytics\.js/i,              severity: "red" },
    { name: "Facebook Pixel",   pattern: /connect\.facebook\.net\/[^/]+\/fbevents\.js/i,                                       severity: "red" },
  ];
  const found = embeds.filter(e => e.pattern.test(html));
  if (found.length === 0) return issues;

  // Cookie-Banner-Detection (nur ob ein Banner-Plugin geladen ist — Wrapper-Check separat)
  const bannerSignals = [
    /BorlabsCookie|borlabs-cookie/i,
    /complianz|cmplz-/i,
    /cookieconsent|cookiebot/i,
    /usercentrics|uc-cmp-/i,
    /cookie-law-info/i,
    /cookieyes/i,
  ];
  const hasBanner = bannerSignals.some(p => p.test(html));

  // Wrapper-Detection — sucht nach Consent-Wrapper-Attributen/Klassen im HTML
  const wrapperSignals = [
    /data-borlabs-cookie-uuid|data-borlabs-cookie-type/i,
    /cmplz-blocked-content|data-category=["'](?:marketing|statistics|preferences)/i,
    /data-cookieconsent=["'](?:marketing|statistics)/i,
    /uc-embedding-container|data-usercentrics/i,
    /cli-embed-content|cookielawinfo-checkbox-/i,
  ];
  const hasWrapper = wrapperSignals.some(p => p.test(html));

  // Pro erkanntem Embed ein Issue (zusammenfassend, nicht pro Iframe).
  // Severity: ohne Banner = red (kompletter Verstoß), mit Banner aber ohne Wrapper = red,
  // mit Banner und mit Wrapper = kein Issue (Setup vermutlich korrekt).
  if (hasBanner && hasWrapper) return issues;

  const names = found.map(f => f.name).join(", ");
  if (!hasBanner) {
    issues.push({
      severity: "red",
      title:    `DSGVO-Verstoß: ${found.length} externe Embed${found.length > 1 ? "s" : ""} ohne Cookie-Banner (${names})`,
      body:     `Auf der Seite werden ${names} ohne Consent-Banner geladen. Diese Services setzen Tracking-Cookies und übertragen IP-Adressen ins Ausland — DSGVO-Verstoß ohne Einwilligung. Lösung: Plugin 'Borlabs Cookie' oder 'Complianz GDPR' installieren und die Embeds in Consent-Wrapper packen.`,
      category: "recht",
      count:    found.length,
    });
  } else {
    issues.push({
      severity: "red",
      title:    `Cookie-Banner aktiv, aber ${found.length} Embed${found.length > 1 ? "s" : ""} ohne Consent-Wrapper (${names})`,
      body:     `Ein Cookie-Banner-Plugin wurde erkannt, aber ${names} laden trotzdem ohne sichtbaren Consent-Wrapper. Im Banner-Backend prüfen, ob die Services für 'YouTube', 'Google Maps', 'Google Analytics' aktiviert sind — und ob die Embeds im Markup mit data-borlabs-cookie-uuid, cmplz-blocked-content oder data-cookieconsent gewrappt werden.`,
      category: "recht",
      count:    found.length,
    });
  }

  return issues;
}

// ── Builder-Intelligence: DOM-Depth, Fonts, CSS-Bloat ──────────────────────
/**
 * Deep-Audit für Page-Builder (Elementor, Divi, Astra, WPBakery).
 * Analysiert DOM-Verschachtelungstiefe, Google-Font-Nutzung, CSS-Bloat-Hinweise.
 */
export type BuilderAuditMeta = {
  /** Erkannter Builder (oder null). */
  builder:             string | null;
  /** Maximal gemessene DOM-Verschachtelungstiefe. */
  maxDomDepth:         number;
  /** Anzahl <div>-Tags (Richtwert für Builder-Overhead). */
  divCount:            number;
  /** Liste eindeutig geladener Google-Font-Familien. */
  googleFontFamilies:  string[];
  /** CSS-Bloat-Hinweise (Animation-CSS geladen ohne Animationen, etc.). */
  cssBloatHints:       string[];
  /** Anzahl unique externer Stylesheets. */
  stylesheetCount:     number;
};

function analyzeBuilderHtml(html: string, builder: string | null): BuilderAuditMeta {
  const meta: BuilderAuditMeta = {
    builder,
    maxDomDepth:        0,
    divCount:           0,
    googleFontFamilies: [],
    cssBloatHints:      [],
    stylesheetCount:    0,
  };

  // ── 1. DOM-Depth — schneller tokenizer-ähnlicher Scan ──
  // Wir ignorieren selbstschließende und void-elements (meta/img/link/input/br/hr/area/base/col/embed/source/track/wbr).
  const VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
  let depth = 0;
  let maxDepth = 0;
  let divCount = 0;
  const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)[^>]*?(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(html)) !== null) {
    const isClose     = m[1] === "/";
    const tag         = m[2].toLowerCase();
    const isSelfClose = m[3] === "/" || VOID.test(tag);
    // Skip non-tree elements that live in <head> style
    if (tag === "script" || tag === "style") continue;
    if (isClose) {
      if (depth > 0) depth--;
    } else if (!isSelfClose) {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
      if (tag === "div") divCount++;
    }
    // Safety: extreme nesting caps — bei Rekursion-Detection abbrechen
    if (depth > 100) break;
  }
  meta.maxDomDepth = maxDepth;
  meta.divCount    = divCount;

  // ── 2. Google-Font-Familien extrahieren ──
  const fontFamilies = new Set<string>();
  // Pattern 1: <link href="...fonts.googleapis.com/css?family=Roboto|Open+Sans">
  const linkCssRegex = /fonts\.googleapis\.com\/css2?\?[^"'>\s]+/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkCssRegex.exec(html)) !== null) {
    const url = lm[0];
    // family=Roboto:wght@400 ODER family=Roboto|Open+Sans
    const famMatches = Array.from(url.matchAll(/family=([^&:|]+)/gi));
    for (const fm of famMatches) {
      // URL-decoded split on "|" (legacy v1) or on &family=... (v2)
      const raw = decodeURIComponent(fm[1]);
      raw.split("|").forEach(f => {
        const name = f.replace(/\+/g, " ").trim();
        if (name && name.length < 40) fontFamilies.add(name);
      });
    }
    // Zusätzlich: v2-syntax mit mehrfach &family=...
    const allFamParams = url.matchAll(/[?&]family=([^&]+)/gi);
    for (const p of allFamParams) {
      const raw = decodeURIComponent(p[1]);
      const name = raw.split(":")[0].replace(/\+/g, " ").trim();
      if (name && name.length < 40) fontFamilies.add(name);
    }
  }
  // Pattern 2: @import url('https://fonts.googleapis.com/css?family=...') im HTML-Style-Block
  const importRegex = /@import\s+url\(['"]https:\/\/fonts\.googleapis\.com\/css[^'")]+['"]\)/gi;
  const importMatches = html.match(importRegex) ?? [];
  for (const imp of importMatches) {
    const fam = imp.match(/family=([^&'"|:]+)/i);
    if (fam) {
      const name = decodeURIComponent(fam[1]).replace(/\+/g, " ").trim();
      if (name) fontFamilies.add(name);
    }
  }
  meta.googleFontFamilies = Array.from(fontFamilies).slice(0, 10);

  // ── 3. Stylesheet-Count (für Kontext) ──
  meta.stylesheetCount = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) ?? []).length;

  // ── 4. CSS-Bloat-Heuristik ──
  // Hinweis 1: Animation-Stylesheet geladen, aber keine animierten Klassen im HTML
  const loadsAnimateCss = /\banimate(\.min)?\.css\b|\banimate-css\b|animate__animated/.test(html);
  const usesAnimation   = /animate__|data-animation|class="[^"]*wow[- ]|class="[^"]*animated\b/.test(html);
  if (loadsAnimateCss && !usesAnimation) {
    meta.cssBloatHints.push("Animate.css geladen, aber keine animierten Elemente im Markup — CSS-Datei ist Ballast.");
  }
  // Hinweis 2: FontAwesome geladen, aber keine fa-Klassen benutzt
  const loadsFontAwesome = /font-?awesome|\/fa\.css|\/fontawesome[-.]/i.test(html);
  const usesFontAwesome  = /class="[^"]*\bfa[- ]/.test(html) || /class="[^"]*\bfas\b/.test(html) || /class="[^"]*\bfab\b/.test(html);
  if (loadsFontAwesome && !usesFontAwesome) {
    meta.cssBloatHints.push("Font Awesome geladen, aber keine fa-Icons im HTML gefunden — überflüssiger 70+ kB Download.");
  }
  // Hinweis 3: Elementor "icons-support" CSS geladen ohne i-Elemente
  if (builder === "Elementor" && /elementor-icons/.test(html) && !/<i\s+class="[^"]*eicon-/.test(html)) {
    meta.cssBloatHints.push("Elementor-Icons-CSS geladen, aber keine eicon-Elemente genutzt.");
  }
  // Hinweis 4: Bei >8 Stylesheets ohne Aggregation ein Hinweis
  if (meta.stylesheetCount >= 8) {
    meta.cssBloatHints.push(`${meta.stylesheetCount} separate Stylesheets — Aggregation (WP Rocket "Combine CSS") empfohlen.`);
  }

  return meta;
}

function buildBuilderIssues(audit: BuilderAuditMeta): ScanIssue[] {
  const issues: ScanIssue[] = [];
  if (!audit.builder) return issues;

  // ── DOM-Depth-Issue: kritisch bei > 15 für Page-Builder ──
  if (audit.maxDomDepth > 15) {
    const severity = audit.maxDomDepth > 22 ? "red" : "yellow";
    issues.push({
      severity,
      title: `Übermäßige DOM-Verschachtelung erkannt (Tiefe: ${audit.maxDomDepth})`,
      body: `${audit.builder} generiert eine DOM-Verschachtelungstiefe von ${audit.maxDomDepth} Ebenen (${audit.divCount} <div>-Tags). Google empfiehlt maximal 15 Ebenen — darüber erschwert es das Layout-Rendering, besonders auf Mobilgeräten mit schwacher CPU. Folge: höherer LCP, schlechtere Scroll-Performance. Empfehlung: ${audit.builder === "Elementor" ? "Migration zu Elementor-Containern (Flexbox) — reduziert Section/Column/Inner-Section-Ebenen um typisch 40 %." : audit.builder === "Divi" ? "Mit dem 'Collapse Nested Rows'-Feature Sections zusammenfassen." : "Unnötige Wrapper-Divs entfernen, CSS-Grid/Flexbox statt verschachtelter Rows nutzen."}`,
      category: "builder",
      count: 1,
    });
  }

  // ── Google-Font-Familien-Issue: > 2 ist Risiko ──
  if (audit.googleFontFamilies.length > 2) {
    issues.push({
      severity: "yellow",
      title: `Hohe Font-Vielfalt: ${audit.googleFontFamilies.length} Google-Font-Familien geladen`,
      body: `Die Seite lädt ${audit.googleFontFamilies.length} verschiedene Schriftfamilien von Google Fonts (${audit.googleFontFamilies.slice(0, 5).join(", ")}${audit.googleFontFamilies.length > 5 ? ", …" : ""}). Jede Familie bedeutet zusätzliche Font-Files (WOFF2) + Render-Blocking + DSGVO-Fragen. Empfehlung: 1) Auf max. 2 Familien reduzieren (Heading + Body), 2) Google Fonts lokal hosten (Plugin 'OMGF') — verhindert die Verbindung zu Google-Servern und erfüllt DSGVO ohne Cookie-Banner-Zustimmung, 3) font-display: swap setzen, damit Text sofort sichtbar ist.`,
      category: "builder",
      count: audit.googleFontFamilies.length,
    });
  }

  // ── Google-Font DSGVO-Hinweis: 1 oder mehr geladen ohne lokales Hosting ──
  if (audit.googleFontFamilies.length >= 1) {
    issues.push({
      severity: "yellow",
      title: "Google Fonts werden von Google-Servern geladen — DSGVO-Risiko",
      body: "Das LG München (Az. 3 O 17493/20) hat 2022 entschieden: Das Einbetten von Google Fonts via fonts.googleapis.com überträgt die IP-Adresse der Besucher an Google in den USA — DSGVO-Verstoß ohne explizite Einwilligung. Lösung: Google Fonts lokal hosten. Schnellster Weg: Plugin 'OMGF | Host Google Fonts Locally' oder 'Local Google Fonts' — ein Klick, keine Code-Änderungen nötig.",
      category: "recht",
      count: audit.googleFontFamilies.length,
    });
  }

  // ── CSS-Bloat-Issues ──
  for (const hint of audit.cssBloatHints) {
    issues.push({
      severity: "yellow",
      title: "CSS-Bloat erkannt — ungenutzte Builder-Styles geladen",
      body: hint,
      category: "builder",
      count: 1,
    });
  }

  return issues;
}

// ── Compute speed score from issues at scan time ─────────────
function computeSpeedScore(issuesJson: ScanIssue[]): number {
  const speedIssueCount  = issuesJson.filter(i => i.category === "speed").length;
  const yellowIssueCount = issuesJson.filter(i => i.severity === "yellow").length;
  return Math.max(10, 100 - speedIssueCount * 15 - yellowIssueCount * 8);
}

// ── Save scan to user's history ──────────────────────────────
async function saveUserScan(params: {
  userId: string;
  url: string;
  issueCount: number;
  diagnose: string;
  issuesJson: ScanIssue[];
  speedScore: number;
  techFingerprint?: unknown;
  totalPages?: number | null;
  unterseitenJson?: unknown | null;
  wooAudit?: WooAuditMeta | null;
  builderAudit?: BuilderAuditMeta | null;
  /** Time-to-First-Byte in ms (annähernd: inkl. DNS+TLS). */
  ttfbMs?: number | null;
}): Promise<string | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const metaJsonObj: Record<string, unknown> = {};
    if (params.wooAudit)     metaJsonObj.woo_audit     = params.wooAudit;
    if (params.builderAudit) metaJsonObj.builder_audit = params.builderAudit;
    if (typeof params.ttfbMs === "number" && params.ttfbMs >= 0) metaJsonObj.ttfb_ms = params.ttfbMs;
    const metaJson = Object.keys(metaJsonObj).length > 0 ? metaJsonObj : null;
    const rows = await sql`
      INSERT INTO scans (user_id, url, type, issue_count, result, issues_json, speed_score, tech_fingerprint, total_pages, unterseiten_json, meta_json)
      VALUES (
        ${params.userId}, ${params.url}, 'website',
        ${params.issueCount}, ${params.diagnose},
        ${JSON.stringify(params.issuesJson)},
        ${params.speedScore},
        ${params.techFingerprint ? JSON.stringify(params.techFingerprint) : null},
        ${params.totalPages ?? null},
        ${params.unterseitenJson ? JSON.stringify(params.unterseitenJson) : null},
        ${metaJson ? JSON.stringify(metaJson) : null}::jsonb
      )
      RETURNING id::text
    ` as { id: string }[];
    return rows[0]?.id ?? null;
  } catch (err) {
    console.error("DB write error:", err);
    return null;
  }
}

// ── Global burst guard (in-memory, nur Serversicherheit) ────
const globalLimit = { count: 0, resetAt: 0 };

// ── Fetch Helpers ───────────────────────────────────────────
async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "WebsiteFix-Scanner/1.0" } });
    clearTimeout(timeout);
    return res;
  } catch { clearTimeout(timeout); return null; }
}

function extractBetween(html: string, start: string, end: string): string {
  const s = html.toLowerCase().indexOf(start.toLowerCase());
  if (s === -1) return "";
  const e = html.indexOf(end, s + start.length);
  if (e === -1) return "";
  return html.slice(s + start.length, e).trim();
}

function extractMeta(html: string, name: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
  return m ? m[1] : "";
}

// ── URL Discovery ───────────────────────────────────────────
const SKIP_EXT = /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|woff2|ttf)(\?|$)/i;

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const urlObj = new URL(baseUrl);
  const base = `${urlObj.protocol}//${urlObj.host}`;
  const links = new Set<string>();
  // Only match <a href> — NOT <link rel>, <meta>, or other tags.
  // WordPress <head> emits dozens of <link href="/wp-json/..."> and
  // <link href="/xmlrpc.php?rsd"> entries that are API/technical endpoints,
  // not user-facing pages. Matching only <a> keeps the list clean.
  const regex = /<a[^>]+href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1].trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    if (SKIP_EXT.test(href)) continue;
    try {
      const absolute = href.startsWith("http") ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`;
      const u = new URL(absolute);
      if (u.host === urlObj.host) {
        links.add(`${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, "") || base);
      }
    } catch { /* ignore */ }
  }
  return [...links];
}

function extractSitemapUrls(xml: string): string[] {
  return (xml.match(/<loc>([^<]+)<\/loc>/g) ?? [])
    .map((m) => m.replace(/<\/?loc>/g, "").trim())
    .filter((u) => !u.endsWith(".xml"));
}

// ── WordPress Detection ─────────────────────────────────────
function detectWordPress(html: string, headers: Headers): boolean {
  // HTML-Signale (zuverlässigste Methode)
  if (html.includes("/wp-content/"))          return true;
  if (html.includes("/wp-includes/"))          return true;
  if (html.includes("wp-json"))               return true;
  if (html.includes("wp-login.php"))           return true;
  if (/wp-emoji-release\.min\.js/i.test(html)) return true;
  if (/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress/i.test(html)) return true;

  // HTTP-Header-Signale
  if (/wordpress/i.test(headers.get("x-powered-by") ?? "")) return true;
  if (/wordpress/i.test(headers.get("x-generator")  ?? "")) return true;
  if ((headers.get("link") ?? "").includes("wp-json"))       return true;

  return false;
}

// ── URL Audit Filter ────────────────────────────────────────
// URLs im Crawl registrieren, aber NICHT analysieren:
// /feed/, WP-JSON/REST-API, xmlrpc.php, wp-admin, .xml, .txt, .json, ?replytocom
const SKIP_AUDIT_PATH = /\/(feed|feed\/atom|feed\/rss|rss)(\/|$)|^\/wp-json(\/|$)|^\/wp-admin(\/|$)/i;
const SKIP_AUDIT_EXT  = /\.(xml|txt|json)(\?|#|$)/i;
const SKIP_AUDIT_FILE = /^\/(xmlrpc\.php|wp-cron\.php|wp-login\.php|wp-activate\.php)(\/|\?|$)/i;

function shouldAudit(url: string): boolean {
  try {
    const { pathname, searchParams } = new URL(url);
    if (searchParams.has("replytocom"))   return false;
    if (SKIP_AUDIT_PATH.test(pathname))   return false;
    if (SKIP_AUDIT_EXT.test(pathname))    return false;
    if (SKIP_AUDIT_FILE.test(pathname))   return false;
    return true;
  } catch {
    return false;
  }
}

// ── Alt Text Check ──────────────────────────────────────────
function countMissingAlt(html: string): { missing: number; total: number; missingSrcs: string[] } {
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  const missingSrcs: string[] = [];
  imgs.forEach((tag) => {
    if (!tag.match(/alt=["'][^"']+["']/i)) {
      const srcMatch = tag.match(/src=["']([^"'?#\s]+)/i);
      if (srcMatch) {
        const src = srcMatch[1];
        // Skip data URIs and very short values — not actionable for the user
        if (!src.startsWith("data:") && src.length > 3) {
          // Store full path (keeps directory context so users can find the file)
          const path = (() => { try { return new URL(src).pathname; } catch { return src; } })();
          missingSrcs.push(path);
        }
      }
    }
  });
  return {
    missing:    imgs.filter((tag) => !tag.match(/alt=["'][^"']+["']/i)).length,
    total:      imgs.length,
    missingSrcs, // no cap — all missing images listed
  };
}

// ── Form Accessibility Check ────────────────────────────────
function checkFormAccessibility(html: string): { formsCount: number; inputsWithoutLabel: number; inputsWithoutLabelFields: string[]; buttonsWithoutText: number } {
  const formsCount = (html.match(/<form[^>]*>/gi) ?? []).length;
  // Inputs of interactive types that need a label
  const inputs = html.match(/<input[^>]*type=["']?(?:text|email|tel|number|search|password|url)[^>]*>/gi) ?? [];
  const unlabeled = inputs.filter(tag => {
    if (/aria-label=["'][^"']+["']/i.test(tag)) return false;
    if (/aria-labelledby=["'][^"']+["']/i.test(tag)) return false;
    const idMatch = tag.match(/\sid=["']([^"']+)["']/i);
    if (idMatch) {
      const id = idMatch[1];
      if (html.includes(`for="${id}"`) || html.includes(`for='${id}'`)) return false;
    }
    return true;
  });
  const inputsWithoutLabel = unlabeled.length;
  // Extract the best human-readable identifier for each unlabeled field
  const inputsWithoutLabelFields: string[] = unlabeled.map(tag => {
    const placeholder = tag.match(/placeholder=["']([^"']{1,50})["']/i)?.[1];
    if (placeholder) return `Feld: „${placeholder}"`;
    const name = tag.match(/\sname=["']([^"']+)["']/i)?.[1];
    if (name) return `Feld: ${name}`;
    const id = tag.match(/\sid=["']([^"']+)["']/i)?.[1];
    if (id) return `ID: ${id}`;
    const type = tag.match(/type=["']?([a-z-]+)/i)?.[1];
    if (type && type !== "text") return `${type.charAt(0).toUpperCase() + type.slice(1)}-Feld (kein Name)`;
    return "Unbekanntes Eingabefeld";
  });
  // Buttons without visible text or aria-label
  const buttons = html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) ?? [];
  const buttonsWithoutText = buttons.filter(btn => {
    if (/aria-label=["'][^"']+["']/i.test(btn)) return false;
    const inner = btn.replace(/<[^>]+>/g, "").trim();
    return inner.length === 0;
  }).length;
  return { formsCount, inputsWithoutLabel, inputsWithoutLabelFields, buttonsWithoutText };
}

// ── Subpage Scan ────────────────────────────────────────────
type PageResult = {
  url: string;
  erreichbar: boolean;
  status: number;
  title: string;
  h1: string;
  metaDescription: string;
  noindex: boolean;
  canonical: string;
  outgoingLinks: string[];
  altMissing: number;
  altTotal: number;
  altMissingImages: string[];
  // Form accessibility — identical check as homepage
  inputsWithoutLabel: number;
  inputsWithoutLabelFields: string[];
  buttonsWithoutText: number;
  // Where the crawler found this URL (source page URL or "sitemap")
  foundVia?: string;
};

async function scanSubpage(url: string, baseUrl: string): Promise<PageResult> {
  const empty: PageResult = { url, erreichbar: false, status: 0, title: "", h1: "", metaDescription: "", noindex: false, canonical: "", outgoingLinks: [], altMissing: 0, altTotal: 0, altMissingImages: [], inputsWithoutLabel: 0, inputsWithoutLabelFields: [], buttonsWithoutText: 0 };
  const res = await fetchWithTimeout(url, 6000);
  if (!res) return empty;
  const html = await res.text();
  const alt = countMissingAlt(html);
  const fc  = checkFormAccessibility(html);
  return {
    url,
    erreichbar: res.ok,
    status: res.status,
    title: extractBetween(html, "<title>", "</title>").replace(/\s+/g, " ").trim(),
    h1: extractBetween(html, "<h1", "</h1>").replace(/<[^>]+>/g, "").trim(),
    metaDescription: extractMeta(html, "description"),
    noindex: extractMeta(html, "robots").includes("noindex"),
    canonical: (() => { const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i); return m ? m[1] : ""; })(),
    outgoingLinks: extractInternalLinks(html, baseUrl),
    altMissing: alt.missing,
    altTotal: alt.total,
    altMissingImages: alt.missingSrcs,
    inputsWithoutLabel: fc.inputsWithoutLabel,
    inputsWithoutLabelFields: fc.inputsWithoutLabelFields,
    buttonsWithoutText: fc.buttonsWithoutText,
  };
}

// ── Grouping Helper ─────────────────────────────────────────
function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ── Plan-based crawl depth ──────────────────────────────────
function getMaxSubpages(plan: string): number {
  const p = normalizePlan(plan);
  if (p === "agency")       return 10000;
  if (p === "professional") return 500;
  if (p === "starter")      return 50;
  return 10; // unknown / anonym
}

// ── Monthly scan limits per plan ────────────────────────────
// Single-Source-Lookup gegen PLAN_QUOTAS in lib/plans.ts. Vorher hartkodiert
// (5 / 999 / 999) — Pro/Agency hatten faktisch kein Server-Cap, was ein
// Cost-DoS-Vektor war. Jetzt: Starter=5, Pro=25, Agency=500 (anti-abuse-Cap;
// UI rendert "Flatrate"). Unauthenticated User bekommen weiterhin 0.
function getMonthlyLimit(plan: string): number {
  if (normalizePlan(plan) === null) return 0;
  return getPlanQuota(plan).monthlyScans;
}

// ── Server-Side-Masking für anonyme User ────────────────────
// Verhindert "Security Through Obscurity" — Konkrete Detail-Felder
// (Datei-Pfade, Form-IDs) werden serverseitig aus der Response entfernt,
// nicht nur clientseitig geblurred. DevTools-Inspector kann sie damit
// gar nicht erst sehen. Counts + URLs bleiben sichtbar (für Marketing-
// Buckets), nur die "Beweis"-Details fallen weg.
function maskScanDataForAnon(scanData: Record<string, unknown>): Record<string, unknown> {
  const masked = JSON.parse(JSON.stringify(scanData));
  if (Array.isArray(masked.startseite_altMissingImages)) {
    masked.startseite_altMissingImages = [];
  }
  if (masked.formCheck && typeof masked.formCheck === "object") {
    const fc = masked.formCheck as Record<string, unknown>;
    if (Array.isArray(fc.inputsWithoutLabelFields)) fc.inputsWithoutLabelFields = [];
  }
  if (masked.audit && typeof masked.audit === "object") {
    const audit = masked.audit as Record<string, unknown>;
    if (Array.isArray(audit.unterseiten)) {
      audit.unterseiten = (audit.unterseiten as Record<string, unknown>[]).map(p => ({
        ...p,
        altMissingImages:        [],
        inputsWithoutLabelFields: [],
      }));
    }
    const altTexte = audit.altTexte as Record<string, unknown> | undefined;
    if (altTexte && Array.isArray(altTexte.missingImages)) {
      altTexte.missingImages = [];
    }
  }
  return masked;
}

// ── Main Handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const guard = guardRequest(req);
    if (guard.blocked) return NextResponse.json({ success: false, error: guard.reason }, { status: 403 });

    const session = await auth();
    const userId  = session?.user?.id as string | undefined;
    const userPlan = (session?.user as { plan?: string } | undefined)?.plan ?? "starter";
    // isPaidPlan() normalisiert Legacy-Strings (smart-guard, agency-starter, agency-pro, free)
    // → kanonischer Plan. Vorher: hartkodierte Liste, in der "agency" UND "free" fehlten →
    // canonical-Agency-User wurden fälschlich als unbezahlt behandelt (15 statt 50 Broken-Link-Checks).
    const isPaid = isPaidPlan(userPlan);

    // ── Admin test-bypass cookie: skips IP rate limit ──────────
    const bypassCookie = req.cookies.get("wf_admin_test")?.value ?? "";
    const bypassSecret = process.env.ADMIN_BYPASS_SECRET ?? "";
    const hasAdminBypass = bypassSecret.length > 0 && bypassCookie === bypassSecret;

    // ── Anonymous users: IP-based rate limit ───────────────
    if (!userId && !hasAdminBypass) {
      const now = Date.now();
      if (now > globalLimit.resetAt) { globalLimit.count = 0; globalLimit.resetAt = now + 60_000; }
      if (globalLimit.count >= 15) {
        return NextResponse.json({ success: false, error: "Server ausgelastet. Bitte versuche es in einer Minute erneut." }, { status: 429 });
      }
      globalLimit.count++;

      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
      const limitResult = await checkIpRateLimit(ip);
      if (!limitResult.allowed) {
        return NextResponse.json(
          { success: false, errorCode: limitResult.errorCode ?? "RATE_LIMIT", error: limitResult.reason, retryAfterMs: limitResult.retryAfterMs },
          { status: 429 },
        );
      }
    }

    // ── Registered users: monthly scan limit ───────────────
    if (userId) {
      const monthlyLimit = getMonthlyLimit(userPlan);
      try {
        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`
          SELECT COUNT(*)::int AS cnt FROM scans
          WHERE user_id = ${userId}
          AND created_at >= date_trunc('month', NOW())
        ` as { cnt: number }[];
        const used = rows[0]?.cnt ?? 0;
        if (used >= monthlyLimit) {
          return NextResponse.json(
            { success: false, errorCode: "MONTHLY_LIMIT", error: `Monatliches Scan-Kontingent (${monthlyLimit}) aufgebraucht. Bitte nächsten Monat oder nach einem Upgrade erneut versuchen.` },
            { status: 429 },
          );
        }
      } catch { /* DB check non-critical — allow scan if check fails */ }
    }

    const body = await req.json();
    const { url, forceRefresh } = body as { url?: string; forceRefresh?: boolean };
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ success: false, error: "Bitte gib eine gültige URL ein." }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
    if (!isUrlAllowed(targetUrl)) return NextResponse.json({ success: false, error: "Diese URL kann nicht gescannt werden." }, { status: 400 });

    // ── Loopback check: eigene Domain sofort als Nicht-WP markieren ────────────
    const targetHostCheck = (() => { try { return new URL(targetUrl).hostname.toLowerCase(); } catch { return ""; } })();
    const OWN_HOSTS = ["website-fix.com", "www.website-fix.com"];
    if (OWN_HOSTS.includes(targetHostCheck)) {
      return NextResponse.json(
        { success: false, errorCode: "ERR_NOT_WORDPRESS", error: "Diese Website verwendet kein WordPress." },
        { status: 422 },
      );
    }

    const scanStart = Date.now();

    // ── Cache check — skipped when forceRefresh=true ────────
    if (!forceRefresh) {
      const ttl    = cacheTtlHours(userPlan);
      const cached = await getCachedScan(targetUrl, ttl);
      // Treat cache as stale if it's from an old version without audit data
      const cacheHasAudit = !!(cached?.scanData?.audit as { unterseiten?: unknown[] } | undefined)?.unterseiten?.length;
      if (cached && cacheHasAudit) {
        const { cachedAt, ...payload } = cached;
        let scanId: string | null = null;
        const fp = cached.scanData.techFingerprint;
        type CachedAudit = {
          gescannteSeiten?: number;
          unterseiten?: { url: string; erreichbar: boolean; title: string; h1: string; noindex: boolean; altMissing: number }[];
          altTexte?: { fehlend?: number; gesamt?: number };
          duplicateTitles?: { title: string; seiten: string[] }[];
          duplicateMetas?: { meta: string; seiten: string[] }[];
          brokenLinks?: { url: string; status: number }[];
          verwaistSeiten?: string[];
        };
        const cachedAudit = cached.scanData.audit as CachedAudit | undefined;
        const cachedUnterseiten = cachedAudit?.unterseiten ?? [];
        const cachedTotalPages = cachedAudit?.gescannteSeiten ?? (cachedUnterseiten.length + 1);
        const cachedIssuesJson = annotateAndConsolidate(
          buildIssuesJson(
            cached.scanData,
            cachedUnterseiten,
            cachedAudit?.altTexte?.fehlend ?? 0,
            cachedAudit?.altTexte?.gesamt ?? 0,
            cachedAudit?.duplicateTitles ?? [],
            cachedAudit?.duplicateMetas ?? [],
            cachedAudit?.brokenLinks ?? [],
            cachedAudit?.verwaistSeiten ?? [],
          ),
          cachedTotalPages,
        );
        // Sum of all .count values = total optimisations (e.g. 241), not just issue types.
        const totalCachedIssues = cachedIssuesJson.reduce((a, i) => a + i.count, 0);
        if (userId) {
          const issueCount = computeIssueCount(cached.scanData);
          scanId = await saveUserScan({
            userId,
            url: targetUrl,
            issueCount,
            diagnose: cached.diagnose,
            issuesJson: cachedIssuesJson,
            speedScore: computeSpeedScore(cachedIssuesJson),
            techFingerprint: fp,
            totalPages: cachedAudit?.gescannteSeiten ?? ((cachedAudit?.unterseiten?.length ?? 0) + 1),
            unterseitenJson: cachedAudit?.unterseiten ?? null,
            wooAudit: (cached.scanData?.wooAudit as WooAuditMeta | null | undefined) ?? null,
            builderAudit: (cached.scanData?.builderAudit as BuilderAuditMeta | null | undefined) ?? null,
            ttfbMs: typeof cached.scanData?.ttfbMs === "number" ? cached.scanData.ttfbMs : null,
          });
        }
        logScan({ userId, url: targetUrl, scanType: "website", status: "cached", fromCache: true });
        // Anon: konkrete Detail-Felder serverseitig entfernen (Datei-Pfade,
        // Form-IDs) — DevTools-Leak-Prevention. Counts bleiben.
        const responsePayload = userId
          ? payload
          : { ...payload, scanData: maskScanDataForAnon(payload.scanData as Record<string, unknown>) };
        // Spread payload last so our issueCount (real sum) wins over any stale cached value.
        return NextResponse.json({ success: true, fromCache: true, cachedAt, scanId, ...responsePayload, issueCount: totalCachedIssues });
      }
    }

    const maxSubpages = getMaxSubpages(userPlan);
    const maxBrokenLinkChecks = isPaid ? 50 : 15;

    const scanData: Record<string, unknown> = { url: targetUrl };

    // ── 1. HAUPTSEITE ───────────────────────────────────────
    // TTFB-Messung: Zeit bis zum ersten Byte der Homepage. Der Wert ist nur
    // näherungsweise (umfasst auch DNS + TLS-Handshake im Node-Fetch), reicht
    // aber als grober Server-Antwortzeit-Indikator für Agency-Reports.
    const ttfbStart = Date.now();
    const mainRes = await fetchWithTimeout(targetUrl);
    const ttfbMs = Date.now() - ttfbStart;

    // Früh-Abbruch: Seite nicht erreichbar (DNS-Fehler, Timeout, Connection refused)
    if (!mainRes) {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── Status-A: HTTP-Fehler (4xx/5xx) → SITE_UNREACHABLE ────────────────────
    if (mainRes.status >= 400) {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    let mainHtml = "";
    try {
      mainHtml = await mainRes.text();
    } catch {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── Antwort zu kurz → leere Seite oder reine Redirect-Shell ───────────────
    if (mainHtml.length < 500) {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── Normalize targetUrl to the resolved URL after redirects ──────────────
    // fetch() follows redirects; mainRes.url is the final URL.
    // Example: user types "glasklar.com" → we prepend https://glasklar.com →
    // server redirects to https://www.glasklar.com/ → all internal links use
    // www.glasklar.com as host. Without normalization, extractInternalLinks
    // would drop all subpages because "www.glasklar.com" !== "glasklar.com".
    try {
      const resolvedHost = new URL(mainRes.url).host;
      const originalHost = new URL(targetUrl).host;
      const stripWww = (h: string) => h.replace(/^www\./, "").toLowerCase();
      if (stripWww(resolvedHost) === stripWww(originalHost) && resolvedHost !== originalHost) {
        const r = new URL(mainRes.url);
        targetUrl = `${r.protocol}//${r.host}`;
        scanData.url = targetUrl;
      }
    } catch { /* keep original targetUrl */ }

    // ── Tech fingerprint — runs against the already-fetched HTML ─────────────
    // buildFingerprintFromRaw is synchronous; no extra HTTP request needed.
    const techFingerprint = buildFingerprintFromRaw(
      buildRawWebsiteData({ url: targetUrl, response: mainRes, html: mainHtml }),
    );

    const host0 = (() => { try { return new URL(targetUrl).hostname; } catch { return targetUrl; } })();

    // ── Status-B: Seite antwortet, aber kein WordPress → ERR_NOT_WORDPRESS ────
    // WICHTIG: Dieser Check kommt VOR dem Parking-Page-Check,
    // damit erreichbare Nicht-WP-Seiten (Google, Shopify, Next.js) niemals
    // SITE_UNREACHABLE erhalten.
    scanData.istWordpress = detectWordPress(mainHtml, mainRes.headers);
    if (!scanData.istWordpress) {
      return NextResponse.json(
        { success: false, errorCode: "ERR_NOT_WORDPRESS", error: "Diese Website verwendet kein WordPress." },
        { status: 422 },
      );
    }

    // ── ISP-Fehlerseiten / Parking-Pages (geben HTTP 200, aber kein echter Inhalt) ─
    // Dieser Check ist nur noch für WP-Sites relevant (sehr seltener Edge-Case).
    const PARKING_PATTERNS = [
      /diese domain (ist|wird) (nicht|noch nicht) (erreichbar|konfiguriert)/i,
      /domain not (found|configured|available)/i,
      /site not found/i,
      /this domain is for sale/i,
      /domain parking/i,
      /parked (domain|page|by)/i,
      /account suspended/i,
      /default web page/i,
      /welcome to nginx/i,
      /apache2? default page/i,
      /it works!/i,
    ];
    if (PARKING_PATTERNS.some((p) => p.test(mainHtml))) {
      return NextResponse.json(
        { success: false, errorCode: "SITE_UNREACHABLE", error: "Website konnte nicht erreicht werden – bitte prüfe die URL." },
        { status: 400 },
      );
    }

    // ── WP version from meta generator ─────────────────────────
    const wpVersionMatch = mainHtml.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress\s+([\d.]+)/i)
      ?? mainHtml.match(/WordPress\/([\d.]+)/);
    scanData.wpVersion = wpVersionMatch?.[1] ?? null;
    scanData.ttfbMs = ttfbMs;

    // ── SEO Plugin detection ────────────────────────────────────
    scanData.hasRankMath = /rank[-_]?math/i.test(mainHtml);
    scanData.hasYoast    = /yoast|wpseo/i.test(mainHtml);

    scanData.erreichbar = true;
    scanData.statusCode = mainRes.status;
    scanData.https = targetUrl.startsWith("https://");
    scanData.htmlLaenge = mainHtml.length;
    scanData.wordpressFehler = mainHtml.includes("Es gab einen kritischen Fehler") || mainHtml.includes("There has been a critical error");
    scanData.weisseSeite = mainHtml.length < 500;
    scanData.title = extractBetween(mainHtml, "<title>", "</title>") || "";
    scanData.metaDescription = extractMeta(mainHtml, "description") || "";
    scanData.h1 = extractBetween(mainHtml, "<h1", "</h1>").replace(/<[^>]+>/g, "").trim() || "";
    scanData.indexierungGesperrt = extractMeta(mainHtml, "robots").includes("noindex");
    const canonicalMatch = mainHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    scanData.canonical = canonicalMatch ? canonicalMatch[1] : "";
    scanData.formularVorhanden = mainHtml.includes("<form");
    // istWordpress wurde bereits oben gesetzt und als Guard genutzt — hier nur noch dokumentieren
    const formCheck = checkFormAccessibility(mainHtml);
    scanData.formCheck = formCheck;
    const mainAlt = countMissingAlt(mainHtml);
    scanData.startseite_altMissing = mainAlt.missing;
    scanData.startseite_altTotal = mainAlt.total;
    scanData.startseite_altMissingImages = mainAlt.missingSrcs;

    // ── 2. ROBOTS.TXT + WP-SPECIFIC CHECKS (parallel) ─────────
    const [robotsRes, xmlRpcRes, sitemapIndexRes] = await Promise.all([
      fetchWithTimeout(new URL("/robots.txt", targetUrl).href, 5000),
      fetchWithTimeout(new URL("/xmlrpc.php", targetUrl).href, 4000),
      fetchWithTimeout(new URL("/sitemap_index.xml", targetUrl).href, 4000),
    ]);
    scanData.xmlRpcOpen = xmlRpcRes !== null && (xmlRpcRes.status === 200 || xmlRpcRes.status === 405);
    scanData.sitemapIndexFound = !!(sitemapIndexRes?.ok);
    if (robotsRes?.ok) {
      const robotsTxt = await robotsRes.text();
      scanData.robotsTxt = robotsTxt.slice(0, 500);
      let currentAgent = "", blockedForAll = false;
      for (const line of robotsTxt.split("\n").map((l) => l.trim())) {
        if (line.toLowerCase().startsWith("user-agent:")) currentAgent = line.split(":")[1].trim();
        else if (line.toLowerCase().startsWith("disallow:")) {
          const path = line.split(":")[1]?.trim();
          if (currentAgent === "*" && (path === "/" || path === "/*")) blockedForAll = true;
        }
      }
      scanData.robotsBlockiertAlles = blockedForAll;
    } else {
      scanData.robotsTxt = "(nicht gefunden)";
      scanData.robotsBlockiertAlles = false;
    }

    // ── 3. SITEMAP + URL-DISCOVERY ──────────────────────────
    const sitemapRes = await fetchWithTimeout(new URL("/sitemap.xml", targetUrl).href, 5000);
    scanData.sitemapVorhanden = !!(sitemapRes?.ok);

    let subpageUrls: string[] = [];
    // sourceMap tracks the first place the crawler encountered each URL:
    // "sitemap" if it came from sitemap.xml, otherwise the page that linked to it.
    const sourceMap = new Map<string, string>();
    if (sitemapRes?.ok) {
      const xml = await sitemapRes.text();
      const sitemapUrls = extractSitemapUrls(xml).filter((u) => u !== targetUrl && u !== targetUrl + "/");
      sitemapUrls.forEach(u => sourceMap.set(u, "sitemap"));
      subpageUrls = sitemapUrls;
    }
    if (mainHtml && subpageUrls.length < maxSubpages) {
      const links = extractInternalLinks(mainHtml, targetUrl).filter((u) => u !== targetUrl && u !== targetUrl.replace(/\/$/, ""));
      links.forEach(u => { if (!sourceMap.has(u)) sourceMap.set(u, targetUrl); });
      subpageUrls = [...new Set([...subpageUrls, ...links])];
    }
    subpageUrls = subpageUrls.slice(0, maxSubpages);

    // Split: alle entdeckten URLs (für Statistik) vs. auditierbare URLs (für Analyse)
    // Feed-, XML-, TXT-, JSON- und replytocom-URLs werden registriert aber nicht gescannt.
    const discoveredCount = subpageUrls.length;
    const auditableUrls   = subpageUrls.filter(shouldAudit);
    const filteredCount   = discoveredCount - auditableUrls.length;

    // ── 4. UNTERSEITEN SCANNEN — in Batches von 5 ──────────
    // Batching prevents hammering the target server and avoids hitting
    // Vercel's connection limits when 30 agencies scan simultaneously.
    const unterseiten: PageResult[] = auditableUrls.length > 0
      ? await batchAsync(auditableUrls, 5, (u) => scanSubpage(u, targetUrl), 200)
      : [];
    // Attach provenance — where did the crawler first find each URL?
    unterseiten.forEach(p => { p.foundVia = sourceMap.get(p.url) ?? targetUrl; });

    // ── 5. CHECK 1: DUPLICATE TITLES ───────────────────────
    const allPages = [
      { url: targetUrl, title: scanData.title as string, metaDescription: scanData.metaDescription as string },
      ...unterseiten.filter((p) => p.erreichbar).map((p) => ({ url: p.url, title: p.title, metaDescription: p.metaDescription })),
    ];

    const titleGroups = groupBy(allPages.filter((p) => p.title), (p) => p.title.toLowerCase().trim());
    const duplicateTitles = Object.entries(titleGroups)
      .filter(([, pages]) => pages.length > 1)
      .map(([title, pages]) => ({ title: title.slice(0, 80), seiten: pages.map((p) => p.url) }));

    // ── 6. CHECK 2: DUPLICATE META DESCRIPTIONS ────────────
    const metaGroups = groupBy(allPages.filter((p) => p.metaDescription), (p) => p.metaDescription.toLowerCase().trim());
    const duplicateMetas = Object.entries(metaGroups)
      .filter(([, pages]) => pages.length > 1)
      .map(([meta, pages]) => ({ meta: meta.slice(0, 80) + "…", seiten: pages.map((p) => p.url) }));

    // ── 7. CHECK 3: MISSING ALT TEXTS ──────────────────────
    const totalAltMissing = (scanData.startseite_altMissing as number) + unterseiten.reduce((s, p) => s + p.altMissing, 0);
    const totalImages = (scanData.startseite_altTotal as number) + unterseiten.reduce((s, p) => s + p.altTotal, 0);

    // ── 8. CHECK 4: BROKEN LINKS ───────────────────────────
    // Alle ausgehenden internen Links sammeln die noch nicht gescannt wurden
    const scannedUrls = new Set([targetUrl, targetUrl.replace(/\/$/, ""), ...unterseiten.map((p) => p.url)]);
    const allOutgoing = new Set<string>();
    if (mainHtml) extractInternalLinks(mainHtml, targetUrl).forEach((l) => allOutgoing.add(l));
    unterseiten.forEach((p) => p.outgoingLinks.forEach((l) => allOutgoing.add(l)));

    const linksToCheck = [...allOutgoing].filter((l) => !scannedUrls.has(l)).slice(0, maxBrokenLinkChecks);
    // Batch broken-link checks 10 at a time — avoids 30-connection bursts
    const brokenLinkResults = await batchAsync(
      linksToCheck,
      10,
      async (linkUrl) => {
        const res = await fetchWithTimeout(linkUrl, 4000);
        return { url: linkUrl, status: res?.status ?? 0, broken: !res?.ok };
      },
      100,
    );
    const brokenLinks = brokenLinkResults.filter((r) => r.broken);

    // ── 9. CHECK 5: VERWAISTE SEITEN ───────────────────────
    // Seiten aus Sitemap/Discovery die kein eingehender interner Link von gescannten Seiten hat
    const orphanedPages = subpageUrls.filter((u) => {
      const uNorm = u.replace(/\/$/, "");
      return !allOutgoing.has(u) && !allOutgoing.has(uNorm) && !allOutgoing.has(u + "/");
    });

    // ── Audit-Ergebnisse zusammenführen ────────────────────
    const audit = {
      gescannteSeiten:   unterseiten.length + 1, // +1 für die Homepage, die immer gescannt wird
      entdeckteUrls:     discoveredCount,
      gefilterteUrls:    filteredCount,  // Feeds/XML/etc. — registriert aber nicht analysiert
      uebersprungeneUrls: subpageUrls.filter(u => !shouldAudit(u)),  // Gefilterte URLs für Tabelle
      unterseiten: unterseiten.map((p) => ({
        url: p.url, erreichbar: p.erreichbar, status: p.status,
        title: p.title || "(kein Title)", h1: p.h1 || "(kein H1)",
        metaDescription: p.metaDescription || "",
        noindex: p.noindex, altMissing: p.altMissing,
        altMissingImages: p.altMissingImages,
        inputsWithoutLabel: p.inputsWithoutLabel,
        inputsWithoutLabelFields: p.inputsWithoutLabelFields,
        buttonsWithoutText: p.buttonsWithoutText,
        foundVia: p.foundVia,
      })),
      duplicateTitles,
      duplicateMetas,
      altTexte: {
        fehlend: totalAltMissing,
        gesamt:  totalImages,
        // Up to 10 unique filenames across all pages for the "Beweis-Modus"
        missingImages: [
          ...(scanData.startseite_altMissingImages as string[] ?? []),
          ...unterseiten.flatMap(p => p.altMissingImages),
        ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 10),
      },
      brokenLinks: brokenLinks.map((b) => ({ url: b.url, status: b.status })),
      verwaistSeiten: orphanedPages,
    };

    scanData.audit = audit;
    scanData.techFingerprint = techFingerprint;

    // ── 10. CLAUDE DIAGNOSE ─────────────────────────────────
    // Token-optimised prompt: paths only (not full URLs), counts over lists,
    // compact issue format. Target: ~900 input tokens instead of ~1800.
    const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };

    const fc = scanData.formCheck as { formsCount: number; inputsWithoutLabel: number; buttonsWithoutText: number } | undefined;

    // Build explicit issue list from technical checks for injection into prompt
    const techIssueLines: string[] = [];
    if (!scanData.title)           techIssueLines.push("- STARTSEITE: Title-Tag fehlt");
    if (!scanData.metaDescription) techIssueLines.push("- STARTSEITE: Meta-Description fehlt");
    if (!scanData.h1)              techIssueLines.push("- STARTSEITE: H1-Tag fehlt");
    if (!scanData.https)           techIssueLines.push("- STARTSEITE: Kein HTTPS");
    if (scanData.indexierungGesperrt) techIssueLines.push("- STARTSEITE: Noindex gesetzt — Google kann Seite nicht indexieren");
    if (!scanData.sitemapVorhanden)   techIssueLines.push("- STARTSEITE: Sitemap.xml fehlt");
    if (scanData.robotsBlockiertAlles) techIssueLines.push("- STARTSEITE: robots.txt blockiert alle Crawler");
    if (totalAltMissing > 0)          techIssueLines.push(`- ${totalAltMissing} Bilder ohne Alt-Text (BFSG 2025 Pflicht!)`);
    if ((fc?.inputsWithoutLabel ?? 0) > 0) techIssueLines.push(`- ${fc!.inputsWithoutLabel} Formularfelder ohne Label (BFSG-Verstoß)`);
    if (duplicateTitles.length > 0)    techIssueLines.push(`- ${duplicateTitles.length} doppelte Title-Tags (SEO-Schaden)`);
    if (duplicateMetas.length > 0)     techIssueLines.push(`- ${duplicateMetas.length} doppelte Meta-Descriptions`);
    if (brokenLinks.length > 0)        techIssueLines.push(`- ${brokenLinks.length} Broken Links (404)`);
    unterseiten.filter(p => !p.erreichbar).forEach(p =>
      techIssueLines.push(`- UNTERSEITE DOWN: ${toPath(p.url)} (nicht erreichbar)`)
    );
    unterseiten.filter(p => !p.title || p.title === "(kein Title)").forEach(p =>
      techIssueLines.push(`- UNTERSEITE kein Title: ${toPath(p.url)}`)
    );
    unterseiten.filter(p => p.noindex).forEach(p =>
      techIssueLines.push(`- UNTERSEITE Noindex: ${toPath(p.url)}`)
    );
    unterseiten.filter(p => p.altMissing > 0).slice(0, 5).forEach(p =>
      techIssueLines.push(`- UNTERSEITE Alt-Texte fehlen (${p.altMissing}x): ${toPath(p.url)}`)
    );

    const prompt = `Du bist ein Website-Audit-Experte. Analysiere ${host0} (${audit.gescannteSeiten} Seiten gescannt).

CRAWLER-BEFUNDE (diese sind FAKTEN, nicht interpretierbar):
${techIssueLines.length > 0 ? techIssueLines.join("\n") : "- Keine kritischen technischen Probleme gefunden"}

VOLLSTÄNDIGE TECHNISCHE DATEN:
Startseite: title="${scanData.title || "FEHLT"}" | meta="${scanData.metaDescription ? "ok" : "FEHLT"}" | h1="${scanData.h1 ? "ok" : "FEHLT"}" | https=${scanData.https} | sitemap=${scanData.sitemapVorhanden}
BFSG: Alt-Texte fehlend=${totalAltMissing}/${totalImages} | Formular-Labels fehlend=${fc?.inputsWithoutLabel ?? 0}
Unterseiten (${unterseiten.length}):
${unterseiten.slice(0, 10).map((p) => `  ${toPath(p.url)}: ${p.erreichbar ? "ok" : "DOWN"} | title=${p.title ? "ok" : "FEHLT"} | h1=${p.h1 ? "ok" : "FEHLT"} | noindex=${p.noindex} | alt-missing=${p.altMissing}`).join("\n") || "  (keine)"}

PFLICHT-REGELN:
1. Jedes Crawler-Befund aus der Liste oben MUSS als eigenständige Issue erscheinen.
2. Kein Problem ignorieren — auch "kleine" Mängel sind Issues.
3. Verwende EXAKT dieses Format für jede Issue (eine pro Zeile):
   🔴 KRITISCH Titel — kurze Erklärung mit Business-Bezug
   🟡 WICHTIG Titel — kurze Erklärung mit Business-Bezug
   🟢 OK Titel — was bereits funktioniert
4. Schwellenwerte: DOWN/fehlend/BFSG → 🔴 | Optimierungsbedarf → 🟡 | Gut → 🟢

## Zusammenfassung
(2 Sätze: konkrete Business-Auswirkung der Hauptprobleme)

## Befunde
(Eine Issue pro Zeile, schlimmste zuerst — ALLE Crawler-Befunde müssen auftauchen)

## Top 3 Sofortmaßnahmen`;

    // ── 10. CLAUDE DIAGNOSE — with exponential backoff ─────
    const message = await callWithRetry(() =>
      client.messages.create({
        model: MODELS.SCAN,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      })
    );
    const diagnose = message.content[0].type === "text" ? message.content[0].text : "";

    // ── Async DB write + cache — never blocks the response ─

    // Build structured issues from raw data — this is the ground truth for the dashboard.
    // `let` weil wir am Ende mit annotateAndConsolidate() das Array durch die
    // konsolidierte Version ersetzen (kind-Annotation, URL-Konsolidierung,
    // 80%-Scope-Klassifikation aus dem Aggregator).
    let issuesJson = buildIssuesJson(
      scanData,
      unterseiten,
      totalAltMissing,
      totalImages,
      duplicateTitles,
      duplicateMetas,
      brokenLinks,
      orphanedPages,
    );

    // WordPress-spezifische Zusatz-Checks (nur wenn WordPress erkannt)
    if (techFingerprint.cms.value === "WordPress" && techFingerprint.cms.confidence >= 0.45) {
      try {
        const wpIssues = await runWordPressChecks(targetUrl);
        issuesJson.push(...wpIssues);
      } catch { /* non-fatal */ }
    }

    // WooCommerce-Hard-Detection — falsch positives sind ein Killer-Bug:
    // Tierarztpraxen ohne Shop dürfen NIE eine WC-Karte sehen, nur weil ein
    // Theme zufällig eine "woocommerce"-CSS-Klasse mitbringt. Wir fordern hier:
    //   1. Tech-Detector: ecommerce === "WooCommerce" mit hoher Confidence (>= 0.70)
    //   2. ZUSÄTZLICH einen der harten Core-Marker im HTML:
    //      - /wp-content/plugins/woocommerce/ (Plugin-Pfad in Script/Link)
    //      - WooCommerce-Generator-Meta-Tag
    //      - wc-ajax-Endpunkt (cart-fragments etc.)
    //      - data-wc-store-api / wc-block-Marker
    // Beides muss erfüllt sein → kein False-Positive bei Themes oder Plugin-Resten.
    const hasWcCoreMarker =
      /\/wp-content\/plugins\/woocommerce\//i.test(mainHtml) ||
      /<meta[^>]+name=["']generator["'][^>]+woocommerce/i.test(mainHtml) ||
      /\bwc-ajax=|woocommerce-cart-fragments|data-wc-store-api|wc-blocks-style/i.test(mainHtml);

    const isWooCommerce =
      techFingerprint.ecommerce.value === "WooCommerce" &&
      techFingerprint.ecommerce.confidence >= 0.70 &&
      hasWcCoreMarker;
    let wooMeta: WooAuditMeta | null = null;
    if (isWooCommerce) {
      try {
        // Extract script URLs from mainHtml — lightweight parse
        const scriptUrls: string[] = Array.from(
          mainHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi),
          m => m[1],
        );
        const wooResult = await runWooCommerceChecks({
          baseUrl:    targetUrl,
          html:       mainHtml,
          scriptUrls,
          speedScore: computeSpeedScore(issuesJson),
        });
        issuesJson.push(...wooResult.issues);
        wooMeta = wooResult.meta;
      } catch { /* non-fatal */ }
    }
    // Flag + Meta für Dashboard/View — SoT für "WooCommerce Shop"-Badge & Business-Auditor
    scanData.isWooCommerce = isWooCommerce;
    scanData.wooAudit = wooMeta;

    // Builder-Intelligence: DOM-Depth, Google Fonts, CSS-Bloat — für ALLE scans
    // mit erkanntem Builder (Elementor, Divi, Astra, WPBakery, Beaver…)
    let builderAudit: BuilderAuditMeta | null = null;
    try {
      const builderName = techFingerprint.builder.confidence >= 0.45
        ? techFingerprint.builder.value
        : null;
      // Astra wird als "builder" gespeichert, auch wenn's technisch ein Theme ist —
      // weil das gleiche DOM-Audit-Verfahren zutrifft.
      builderAudit = analyzeBuilderHtml(mainHtml, builderName);
      const builderIssues = buildBuilderIssues(builderAudit);
      issuesJson.push(...builderIssues);
    } catch { /* non-fatal */ }
    scanData.builderAudit = builderAudit;

    // DSGVO-Check: externe Embeds ohne Consent-Wrapper (für ALLE Scans)
    try {
      const dsgvoIssues = await runDsgvoEmbedChecks(mainHtml);
      issuesJson.push(...dsgvoIssues);
    } catch { /* non-fatal */ }

    // ── Phase B / Push 2: Engine-Konsolidierung anwenden ──────────────
    // Nach allen Issue-Sammlern (buildIssuesJson + WP + Builder + DSGVO):
    // 1. kind-Inferenz pro Issue (string-prefix-matching aus inferIssueKind)
    // 2. consolidatePerPageIssues: gleichartige per-Seite-Issues mit
    //    affectedUrls-Liste zusammenfassen (z.B. "Alt-Text fehlt auf 12 Seiten")
    // 3. classifyScopes: scope:"global" wenn ≥ 80% der Seiten betroffen
    //    (= Template-Fehler) → UI kann das als "Eine Korrektur fixt alle X" rendern
    issuesJson = annotateAndConsolidate(issuesJson, audit.gescannteSeiten);

    // Actual sum of all errors (e.g. 24 missing alt texts = 24, not 1)
    const issueCount = issuesJson.reduce((acc, i) => acc + i.count, 0);

    // Await DB write — must complete before response so the dashboard can read it
    const savedScanId = userId
      ? await saveUserScan({
          userId, url: targetUrl, issueCount, diagnose, issuesJson,
          speedScore: computeSpeedScore(issuesJson),
          techFingerprint,
          totalPages: audit.gescannteSeiten,
          unterseitenJson: audit.unterseiten,
          wooAudit: wooMeta,
          builderAudit,
          ttfbMs,
        })
      : null;

    // Persist to 24h cache — awaited so Vercel doesn't kill it before it completes
    await saveScanAsync(targetUrl, { scanData, diagnose });

    // ── Integrations-Trigger (fire-and-forget, blockiert Scan-Response nicht) ──
    if (userId && isAtLeastProfessional(userPlan)) {
      const redCount    = issuesJson.filter(i => i.severity === "red").reduce((a, i) => a + i.count, 0);
      const yellowCount = issuesJson.filter(i => i.severity === "yellow").reduce((a, i) => a + i.count, 0);
      const score       = computeSpeedScore(issuesJson);

      (async () => {
        try {
          const integrations = await getIntegrationSettings(userId);

          // Zapier: volles meta_json-Event (alle Pro+ bekommen das, wenn Webhook gesetzt)
          await triggerZapierScanWebhook(integrations, {
            scanId:        savedScanId,
            url:           targetUrl,
            createdAt:     new Date().toISOString(),
            score,
            issueCount,
            redCount,
            yellowCount,
            techFingerprint,
            wooAudit:      wooMeta,
            builderAudit,
            isWooCommerce,
            builder:       builderAudit?.builder ?? null,
          });

          // Slack-Zusammenfassung: nur für Agency (249 €)
          if (isAgency(userPlan) && integrations.slack_webhook_url) {
            await sendScanSummaryToSlack({
              webhookUrl:    integrations.slack_webhook_url,
              projectUrl:    targetUrl,
              scanId:        savedScanId,
              score,
              issueCount,
              redCount,
              yellowCount,
              builder:       builderAudit?.builder ?? null,
              isWooCommerce,
              wooRiskPct:    wooMeta?.revenueRiskPct ?? null,
              domDepth:      builderAudit?.maxDomDepth ?? null,
              dashboardUrl:  process.env.NEXTAUTH_URL ?? "https://website-fix.com",
              agencyName:    "WebsiteFix",
            });
          }
        } catch (err) {
          console.error("[scan-integrations] failed:", err);
        }
      })();
    }

    logScan({ userId, url: targetUrl, scanType: "website", status: "success", durationMs: Date.now() - scanStart });
    // Anon-Maskierung: konkrete Detail-Felder vor dem Versand entfernen
    const responseScanData = userId ? scanData : maskScanDataForAnon(scanData);
    return NextResponse.json({ success: true, scanData: responseScanData, diagnose, issueCount, scanId: savedScanId });

  } catch (err) {
    console.error("Scan-Fehler:", err);
    return NextResponse.json({ success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." }, { status: 500 });
  }
}
