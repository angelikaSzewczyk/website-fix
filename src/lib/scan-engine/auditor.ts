/**
 * WebsiteAuditor — Per-Page Single Source of Truth (Phase A).
 *
 * Operation Unified Core: ELIMINIERT die Detection-Drift zwischen /api/scan
 * und /api/full-scan. Beide Routes rufen denselben analyze() auf — der gibt
 * für JEDE Seite identische PageAudit-Daten zurück (sowohl raw DOM als auch
 * generierte per-page ScanIssues).
 *
 * Garantie:
 *   - Pure Function (modulo Network-Calls innerhalb des analyze-Bodies):
 *     Gleicher (html, url, headers, status) → gleicher PageAudit.
 *   - KEINE site-wide Aggregate hier. Die liefert der Aggregator über alle
 *     pageAudits hinweg. Damit ist analyze() pro-Seite isoliert testbar.
 *
 * Was hier NICHT passiert (Phase B):
 *   - Tech-Fingerprint-Detection (lib/tech-detector — async, DOM-tief)
 *   - Builder-Audit (analyzeBuilderHtml — site-wide CSS-Bloat-Bewertung)
 *   - Woo-Audit (woo-audit.ts — Plugin-Impact-Analyse)
 *   Diese laufen weiterhin in den Routen, werden aber in Phase B in den
 *   SiteContext-Builder verlagert.
 */

import type { PageInput, PageAudit, ScanIssue, IssueKind } from "./types";

// ─── Public Klasse ──────────────────────────────────────────────────────────

export class WebsiteAuditor {
  /** Plan-Kontext (kann später für plan-spezifische Detection-Regeln genutzt
   *  werden — z.B. tiefere Performance-Checks für Agency). Aktuell nur als
   *  Marker durchgereicht. */
  constructor(private readonly opts: { rootUrl: string; plan: string }) {}

  /**
   * Hauptmethode: analysiert eine einzelne HTML-Seite und liefert das
   * vollständige PageAudit (raw DOM + generierte per-page Issues).
   *
   * Reihenfolge:
   *   1. DOM-Extraction (title, h1, meta, alt, forms, links) → rein passiv
   *   2. Per-Page-Issue-Generation → liest Extraction-Resultate, generiert ScanIssues
   *   3. Return PageAudit mit beidem (raw + issues)
   */
  async analyze(input: PageInput): Promise<PageAudit> {
    const { html, url, status } = input;
    const ok = status >= 200 && status < 400;

    // ── DOM-Extraction ─────────────────────────────────────────────────────
    // Wenn die Page nicht erreichbar ist (status 0 oder 4xx/5xx), überspringe
    // DOM-Extraction — das HTML ist entweder leer oder Error-Page.
    const title           = ok ? this.extractTitle(html)        : "";
    const h1              = ok ? this.extractH1(html)           : "";
    const metaDescription = ok ? this.extractMeta(html, "description") : "";
    const robotsMeta      = ok ? this.extractMeta(html, "robots")      : "";
    const noindex         = robotsMeta.toLowerCase().includes("noindex");
    const canonical       = ok ? this.extractCanonical(html)    : "";
    const altResult       = ok ? this.countMissingAlt(html)     : { missing: 0, total: 0, examples: [] };
    const formIssues      = ok ? this.countFormIssues(html)     : { inputsWithoutLabel: 0, inputsWithoutLabelFields: [], buttonsWithoutText: 0 };
    const internalLinks   = ok ? this.extractInternalLinks(html, url) : [];

    // ── Phase A2: Social/Branding/SEO-Tiefen-Checks ────────────────────────
    const ogTags          = ok ? this.checkOpenGraph(html)      : { title: false, description: false, image: false };
    const twitterCards    = ok ? this.checkTwitterCards(html)   : { card: false, title: false };
    const hasFavicon      = ok ? this.checkFavicon(html)        : false;
    const htmlLang        = ok ? this.checkLanguage(html)       : null;
    const headingHierarchy = ok ? this.checkHeadingHierarchy(html) : { ok: true, issue: null };
    const securityHeadersMissing = this.checkSecurityHeaders(input.headers);

    // ── Per-Page-Issue-Generation ─────────────────────────────────────────
    const isRootPage = url === this.opts.rootUrl;
    const pageIssues = this.buildPerPageIssues({
      url,
      ok,
      title,
      h1,
      metaDescription,
      noindex,
      altMissing:           altResult.missing,
      inputsWithoutLabel:   formIssues.inputsWithoutLabel,
      buttonsWithoutText:   formIssues.buttonsWithoutText,
      ogTags,
      twitterCards,
      hasFavicon,
      htmlLang,
      headingHierarchy,
      securityHeadersMissing,
      isRootPage,
    });

    return {
      url,
      status,
      ok,
      title,
      h1,
      metaDescription,
      noindex,
      canonical,
      altMissing:               altResult.missing,
      altTotal:                 altResult.total,
      altMissingImages:         altResult.examples,
      inputsWithoutLabel:       formIssues.inputsWithoutLabel,
      inputsWithoutLabelFields: formIssues.inputsWithoutLabelFields,
      buttonsWithoutText:       formIssues.buttonsWithoutText,
      internalLinks,
      ttfbMs:                   input.ttfbMs ?? null,
      ogTags,
      twitterCards,
      hasFavicon,
      htmlLang,
      headingHierarchy,
      securityHeadersMissing,
      pageIssues,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PER-PAGE ISSUE GENERATION
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Generiert per-Seite-Issues (eine Seite, eine URL → 0..n Issues).
   *
   * Site-wide Issues werden hier NICHT generiert — die kommen vom Aggregator.
   * Beispielsweise "https fehlt": semantisch site-wide, generiert der
   * Aggregator einmal aus dem SiteContext.
   *
   * Per-Page-Issues haben IMMER eine url gesetzt — der Aggregator nutzt das
   * für Konsolidierung (gleicher kind über mehrere URLs → ein Konso-Issue).
   */
  private buildPerPageIssues(p: {
    url:                 string;
    ok:                  boolean;
    title:               string;
    h1:                  string;
    metaDescription:     string;
    noindex:             boolean;
    altMissing:          number;
    inputsWithoutLabel:  number;
    buttonsWithoutText:  number;
    ogTags:              { title: boolean; description: boolean; image: boolean };
    twitterCards:        { card: boolean; title: boolean };
    hasFavicon:          boolean;
    htmlLang:            string | null;
    headingHierarchy:    { ok: boolean; issue: string | null };
    securityHeadersMissing: string[];
    isRootPage:          boolean;
  }): ScanIssue[] {
    const issues: ScanIssue[] = [];
    const path = this.toPath(p.url);

    // ── Reachability ──
    if (!p.ok) {
      issues.push({
        kind:     p.isRootPage ? "root-not-reachable" : "page-not-reachable",
        severity: "red",
        title:    p.isRootPage
          ? "Kritischer Ausfall: Startseite nicht erreichbar (4xx/5xx)"
          : `Toter Link: ${path} gibt 4xx/5xx zurück`,
        body:     p.isRootPage
          ? "Die Startseite gibt einen Fehler zurück — Besucher und Google sehen nur eine Fehlerseite."
          : "Besucher und Crawler landen auf einer Fehlerseite — direkter UX-Schaden und Ranking-Verlust für diese URL.",
        category: "technik",
        url:      p.url,
        count:    1,
      });
      // Wenn die Seite nicht ok ist, lohnt sich keine weitere Issue-Detection
      // (DOM ist sowieso leer/Error-Page).
      return issues;
    }

    // ── Title ──
    if (!p.title) {
      issues.push({
        kind:     "title-missing",
        severity: "red",
        title:    p.isRootPage
          ? "Unsichtbar bei Google: Title-Tag fehlt (Startseite)"
          : `Unsichtbar bei Google: Title-Tag fehlt auf ${path}`,
        body:     "Ohne Title-Tag fehlt das wichtigste On-Page-SEO-Signal — kein Ranking-Snippet in der Suche möglich.",
        category: "technik",
        url:      p.url,
        count:    1,
      });
    }

    // ── H1 ──
    if (!p.h1) {
      issues.push({
        kind:     "h1-missing",
        // Root: H1-Fehlen ist red (zentrale Page). Subpages: yellow.
        severity: p.isRootPage ? "red" : "yellow",
        title:    p.isRootPage
          ? "SEO-Schwäche: H1-Hauptüberschrift fehlt (Startseite)"
          : `SEO-Schwäche: H1-Hauptüberschrift fehlt auf ${path}`,
        body:     p.isRootPage
          ? "Ohne H1 fehlt das wichtigste Inhaltssignal für Google — Ranking und Nutzererfahrung leiden direkt darunter."
          : "Fehlende H1 schwächt das Keyword-Signal — Google bewertet diese Seite schlechter.",
        category: "technik",
        url:      p.url,
        count:    1,
      });
    }

    // ── Meta-Description ──
    if (!p.metaDescription) {
      issues.push({
        kind:     "meta-description-missing",
        severity: "yellow",
        title:    p.isRootPage
          ? "Schlechte Klickrate: Meta-Description fehlt (Startseite)"
          : `Schlechte Klickrate: Meta-Description fehlt auf ${path}`,
        body:     "Google wählt einen zufälligen Seitenausschnitt als Vorschautext — Klicks und Conversions sinken messbar.",
        category: "technik",
        url:      p.url,
        count:    1,
      });
    }

    // ── Noindex (für Root: kritisch — ganze Seite unsichtbar) ──
    if (p.noindex) {
      issues.push({
        kind:     "noindex",
        severity: p.isRootPage ? "red" : "yellow",
        title:    p.isRootPage
          ? "Kritisch: Startseite für Google unsichtbar (noindex gesetzt)"
          : `Für Google gesperrt: noindex auf ${path}`,
        body:     p.isRootPage
          ? "Der noindex-Tag macht die Startseite für Suchmaschinen komplett unsichtbar — kein Traffic aus der organischen Suche möglich."
          : "Diese Unterseite ist für Suchmaschinen komplett unsichtbar — ist das beabsichtigt?",
        category: "technik",
        url:      p.url,
        count:    1,
      });
    }

    // ── Alt-Text (BFSG-relevant) ──
    if (p.altMissing > 0) {
      issues.push({
        kind:     "alt-text-missing",
        severity: "red",
        title:    p.isRootPage
          ? `Barrierefreiheits-Verstoß: ${p.altMissing} Bilder ohne Alt-Text (Startseite)`
          : `BFSG-Verstoß: ${p.altMissing}× fehlendes Alt-Attribut auf ${path}`,
        body:     `${p.altMissing} Bild${p.altMissing > 1 ? "er" : ""} ohne Alt-Text — Barrierefreiheitsgesetz ab 06/2025 verpflichtend, konkrete Abmahngefahr.`,
        category: "recht",
        url:      p.url,
        count:    p.altMissing,
      });
    }

    // ── Form-Label-Missing (BFSG-relevant) ──
    if (p.inputsWithoutLabel > 0) {
      issues.push({
        kind:     "form-label-missing",
        severity: "red",
        title:    p.isRootPage
          ? `Barrierefreiheits-Verstoß: ${p.inputsWithoutLabel} Formularfelder ohne Label (Startseite, BFSG §3)`
          : `BFSG-Verstoß: ${p.inputsWithoutLabel} Formular-Label${p.inputsWithoutLabel > 1 ? "s" : ""} fehlen auf ${path}`,
        body:     "Formularfelder ohne sichtbares Label — Screen-Reader können sie nicht vorlesen (BFSG §3 Abs. 2).",
        category: "recht",
        url:      p.url,
        count:    p.inputsWithoutLabel,
      });
    }

    // ── Buttons ohne Text (BFSG-relevant, aber niedrigerer Schweregrad) ──
    if (p.buttonsWithoutText > 0) {
      issues.push({
        kind:     "form-button-text-missing",
        severity: "yellow",
        title:    `Barrierefreiheit: ${p.buttonsWithoutText} Button${p.buttonsWithoutText > 1 ? "s" : ""} ohne erkennbaren Text auf ${path}`,
        body:     "Buttons ohne Text- oder aria-label sind für Screen-Reader bedeutungslos — BFSG-relevant.",
        category: "recht",
        url:      p.url,
        count:    p.buttonsWithoutText,
      });
    }

    // ── Phase A2: OpenGraph (Social-Vorschau) ──
    // Mindestens title + description müssen da sein für eine sinnvolle Social-Card.
    // og:image ist nice-to-have aber nicht kritisch — wird im Body-Text erwähnt.
    if (!p.ogTags.title || !p.ogTags.description) {
      const missing: string[] = [];
      if (!p.ogTags.title)       missing.push("og:title");
      if (!p.ogTags.description) missing.push("og:description");
      if (!p.ogTags.image)       missing.push("og:image");
      issues.push({
        kind:     "og-missing",
        severity: "yellow",
        title:    p.isRootPage
          ? `Schlechte Social-Vorschau: OpenGraph-Tags fehlen (Startseite)`
          : `Schlechte Social-Vorschau: OpenGraph-Tags fehlen auf ${path}`,
        body:     `Fehlend: ${missing.join(", ")}. Ohne OpenGraph zeigen LinkedIn/Facebook beim Teilen nur die rohe URL — keine Vorschau-Card mit Bild + Titel.`,
        category: "technik",
        url:      p.url,
        count:    1,
      });
    }

    // ── Phase A2: Twitter-Card ──
    if (!p.twitterCards.card) {
      issues.push({
        kind:     "twitter-card-missing",
        severity: "yellow",
        title:    p.isRootPage
          ? `Twitter/X-Vorschau fehlt (Startseite)`
          : `Twitter/X-Vorschau fehlt auf ${path}`,
        body:     "Ohne twitter:card-Tag zeigt X/Twitter beim Teilen kein Vorschau-Bild — Engagement-Rate ist messbar niedriger.",
        category: "technik",
        url:      p.url,
        count:    1,
      });
    }

    // ── Phase A2: Favicon ──
    if (!p.hasFavicon) {
      issues.push({
        kind:     "favicon-missing",
        severity: "yellow",
        title:    p.isRootPage
          ? `Favicon fehlt (Startseite)`
          : `Favicon fehlt auf ${path}`,
        body:     "Browser-Tabs zeigen ein generisches Default-Icon — Marken-Wiedererkennung leidet, wirkt unprofessionell beim Bookmarken.",
        category: "technik",
        url:      p.url,
        count:    1,
      });
    }

    // ── Phase A2: html lang-Attribut (BFSG + SEO-relevant) ──
    if (!p.htmlLang) {
      issues.push({
        kind:     "html-lang-missing",
        severity: "yellow",
        title:    p.isRootPage
          ? `Sprache nicht definiert: <html lang="..."> fehlt (Startseite)`
          : `Sprache nicht definiert: <html lang="..."> fehlt auf ${path}`,
        body:     "Screen-Reader können die Sprache nicht erkennen → BFSG-relevant. Plus: Google nutzt das Attribut als Ranking-Signal für lokalisierte Suche.",
        category: "recht",
        url:      p.url,
        count:    1,
      });
    }

    // ── Phase A2: Heading-Hierarchie ──
    if (!p.headingHierarchy.ok && p.headingHierarchy.issue) {
      issues.push({
        kind:     "heading-hierarchy-broken",
        severity: "yellow",
        title:    `Überschriften-Hierarchie falsch auf ${path}`,
        body:     `${p.headingHierarchy.issue}. Screen-Reader navigieren über Überschriften-Levels — gebrochene Reihenfolge frustriert Nutzer mit Behinderungen und ist BFSG-relevant.`,
        category: "recht",
        url:      p.url,
        count:    1,
      });
    }

    // ── Phase A2: Security-Header ──
    if (p.securityHeadersMissing.length > 0) {
      issues.push({
        kind:     "security-headers-missing",
        severity: "yellow",
        title:    p.isRootPage
          ? `Security-Header fehlen (Startseite)`
          : `Security-Header fehlen auf ${path}`,
        body:     `Fehlend: ${p.securityHeadersMissing.join(", ")}. Diese Header schützen vor XSS-Injection, Clickjacking und Protokoll-Downgrade-Angriffen — fehlen sie, sind moderne Browser nicht im Hardening-Modus.`,
        category: "technik",
        url:      p.url,
        count:    1,
      });
    }

    return issues;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE A2 — DOM/HEADER CHECKS (Social, Branding, SEO-Tiefe, Security)
  // ═════════════════════════════════════════════════════════════════════════

  /** OpenGraph: prüft Anwesenheit der drei Standard-Tags (title/description/image).
   *  Akzeptiert sowohl property="og:..." als auch name="og:..." (manche CMS
   *  serialisieren falsch — Facebook ist tolerant, wir auch). */
  private checkOpenGraph(html: string): { title: boolean; description: boolean; image: boolean } {
    const has = (key: string) =>
      new RegExp(`<meta[^>]+(?:property|name)=["']og:${key}["']`, "i").test(html);
    return {
      title:       has("title"),
      description: has("description"),
      image:       has("image"),
    };
  }

  /** Twitter-Cards: card-Type ist Pflicht (summary/summary_large_image/etc.),
   *  twitter:title als Bonus-Indikator. */
  private checkTwitterCards(html: string): { card: boolean; title: boolean } {
    return {
      card:  /<meta[^>]+name=["']twitter:card["']/i.test(html),
      title: /<meta[^>]+name=["']twitter:title["']/i.test(html),
    };
  }

  /** Favicon: drei Varianten akzeptiert — rel="icon", rel="shortcut icon",
   *  rel="apple-touch-icon". Falls eine davon existiert, gilt das als OK. */
  private checkFavicon(html: string): boolean {
    return /<link[^>]+rel=["'](?:shortcut\s+icon|icon|apple-touch-icon)["']/i.test(html);
  }

  /** html lang-Attribut: extrahiert den Wert oder null. */
  private checkLanguage(html: string): string | null {
    const m = html.match(/<html[^>]+lang\s*=\s*["']([^"']+)["']/i);
    return m ? m[1].trim() : null;
  }

  /** Heading-Hierarchie: detektiert die zwei häufigsten Probleme:
   *    1. Mehrere H1 auf einer Seite (SEO + Accessibility)
   *    2. Level-Sprünge (H1 → H3 ohne H2)
   *  Tieferer hierarchical-validator kann später kommen. */
  private checkHeadingHierarchy(html: string): { ok: boolean; issue: string | null } {
    const headings: number[] = [];
    const regex = /<h([1-6])(?:\s[^>]*)?>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      headings.push(parseInt(m[1], 10));
    }
    if (headings.length === 0) return { ok: true, issue: null };

    const h1Count = headings.filter(h => h === 1).length;
    if (h1Count > 1) {
      return { ok: false, issue: `${h1Count} H1-Überschriften auf einer Seite (sollte genau 1 sein)` };
    }

    // Level-Sprung: aufeinanderfolgende headings dürfen max 1 Level höher sein.
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i] - headings[i - 1];
      if (diff > 1) {
        return { ok: false, issue: `Sprung von H${headings[i - 1]} direkt zu H${headings[i]} (H${headings[i - 1] + 1} fehlt)` };
      }
    }

    return { ok: true, issue: null };
  }

  /** Security-Header: prüft die zwei wichtigsten — Content-Security-Policy
   *  schützt vor XSS, Strict-Transport-Security (HSTS) verhindert
   *  Protokoll-Downgrade. Andere Header (X-Frame-Options, X-Content-Type-Options)
   *  sind Phase-A3-Erweiterung. */
  private checkSecurityHeaders(headers: Headers): string[] {
    const missing: string[] = [];
    if (!headers.get("content-security-policy"))   missing.push("Content-Security-Policy");
    if (!headers.get("strict-transport-security")) missing.push("Strict-Transport-Security (HSTS)");
    return missing;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // DOM-EXTRACTION HELPERS (private, aus scan/route.ts und full-scan/route.ts
  // konsolidiert. Pure functions — keine Network-Calls, keine State.)
  // ═════════════════════════════════════════════════════════════════════════

  private extractBetween(html: string, start: string, end: string): string {
    const s = html.toLowerCase().indexOf(start.toLowerCase());
    if (s === -1) return "";
    const e = html.indexOf(end, s + start.length);
    return e === -1 ? "" : html.slice(s + start.length, e).trim();
  }

  private extractTitle(html: string): string {
    return this.extractBetween(html, "<title>", "</title>")
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractH1(html: string): string {
    // <h1 attr="…">Text</h1> → "Text" (Tags rausgestripped)
    return this.extractBetween(html, "<h1", "</h1>")
      .replace(/<[^>]+>/g, "")
      .trim();
  }

  private extractMeta(html: string, name: string): string {
    const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, "i");
    const m = html.match(re);
    return m ? m[1] : "";
  }

  private extractCanonical(html: string): string {
    const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
    return m ? m[1] : "";
  }

  /** Zählt Bilder ohne alt-Attribut + sammelt bis zu 10 src-Werte als Beispiele.
   *  alt="" (leer) ist kein Issue — das ist die WCAG-konforme Markierung für
   *  rein dekorative Bilder. Issue ist NUR fehlendes alt-Attribut komplett. */
  private countMissingAlt(html: string): { missing: number; total: number; examples: string[] } {
    const imgs = html.match(/<img\s[^>]+>/gi) ?? [];
    let missing = 0;
    const examples: string[] = [];
    for (const tag of imgs) {
      // alt-Attribut komplett fehlt? (alt="" gilt als bewusst leer = OK)
      if (!/\salt\s*=/i.test(tag)) {
        missing++;
        if (examples.length < 10) {
          const srcMatch = tag.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
          if (srcMatch) examples.push(srcMatch[1]);
        }
      }
    }
    return { missing, total: imgs.length, examples };
  }

  /** Form-Probleme: input-Felder ohne <label for="…">-Verknüpfung,
   *  buttons ohne sichtbaren Text/aria-label. Beides BFSG-relevant. */
  private countFormIssues(html: string): {
    inputsWithoutLabel:   number;
    inputsWithoutLabelFields: string[];
    buttonsWithoutText:   number;
  } {
    // Sammle alle <label for="X">-IDs
    const labelFor = new Set<string>();
    const labelMatches = html.match(/<label[^>]+for=["']([^"']+)["']/gi) ?? [];
    for (const m of labelMatches) {
      const idMatch = m.match(/for=["']([^"']+)["']/i);
      if (idMatch) labelFor.add(idMatch[1]);
    }

    // input/select/textarea ohne aria-label und ohne id-in-labelFor
    const inputs = html.match(/<(input|select|textarea)\s[^>]+>/gi) ?? [];
    let inputsWithoutLabel = 0;
    const inputsWithoutLabelFields: string[] = [];
    for (const tag of inputs) {
      // type="hidden" und type="submit" sind nicht label-pflichtig
      if (/type\s*=\s*["'](hidden|submit|button|reset|image)["']/i.test(tag)) continue;

      const ariaLabel = /\saria-label\s*=/i.test(tag);
      const ariaLabelledBy = /\saria-labelledby\s*=/i.test(tag);
      if (ariaLabel || ariaLabelledBy) continue;

      const idMatch = tag.match(/\sid\s*=\s*["']([^"']+)["']/i);
      const id = idMatch?.[1];
      if (id && labelFor.has(id)) continue;

      inputsWithoutLabel++;
      if (inputsWithoutLabelFields.length < 10) {
        const placeholder = tag.match(/\splaceholder\s*=\s*["']([^"']+)["']/i)?.[1];
        const name        = tag.match(/\sname\s*=\s*["']([^"']+)["']/i)?.[1];
        inputsWithoutLabelFields.push(placeholder ?? name ?? id ?? "(unnamed input)");
      }
    }

    // <button>…</button> ohne Inhalt UND ohne aria-label
    const buttons = html.match(/<button[^>]*>([\s\S]*?)<\/button>/gi) ?? [];
    let buttonsWithoutText = 0;
    for (const btn of buttons) {
      const openTag = btn.match(/^<button[^>]*>/i)?.[0] ?? "";
      const ariaLabel = /\saria-label\s*=\s*["'][^"']+["']/i.test(openTag);
      if (ariaLabel) continue;
      // Inhalt zwischen <button> und </button> — Tags strippen, dann trimmen
      const content = btn
        .replace(/^<button[^>]*>/i, "")
        .replace(/<\/button>$/i, "")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (!content) buttonsWithoutText++;
    }

    return { inputsWithoutLabel, inputsWithoutLabelFields, buttonsWithoutText };
  }

  /** Extract internal links (same-host only) — vom Aggregator für die
   *  orphaned-pages-Detection genutzt. Filtert externe Domains, hash-Links,
   *  mailto/tel/javascript. */
  private extractInternalLinks(html: string, baseUrl: string): string[] {
    let baseHost: string;
    try { baseHost = new URL(baseUrl).host; } catch { return []; }

    const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["']/gi) ?? [];
    const links = new Set<string>();
    for (const m of linkMatches) {
      const hrefMatch = m.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;
      const href = hrefMatch[1];
      // Skip Anker, mailto, tel, javascript, externe Protokolle
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;

      try {
        const absolute = new URL(href, baseUrl).toString();
        const u = new URL(absolute);
        if (u.host !== baseHost) continue;
        // Strip Fragment
        u.hash = "";
        links.add(u.toString());
      } catch { /* malformed href — skip */ }
    }
    return Array.from(links);
  }

  /** URL → Pfad für UI-Anzeige (z.B. https://domain.de/about → /about). */
  private toPath(u: string): string {
    try { return new URL(u).pathname || "/"; } catch { return u; }
  }
}

// ─── Re-export der Issue-Kinds für einfaches Match-and-Group im Aggregator ──
export type { IssueKind };
