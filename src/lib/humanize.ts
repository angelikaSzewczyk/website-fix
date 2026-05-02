/**
 * lib/humanize.ts — Tech-Jargon → Klartext-Mapping.
 *
 * Zielgruppe: Einzelunternehmer im Starter-Plan, die nicht wissen was
 * "TTFB" ist. Statt sie mit Akronymen zu erschlagen, übersetzen wir
 * Issue-Titel + Body-Texte automatisch in eine verständliche Sprache.
 *
 * Single-Source-of-Truth — wenn neue Begriffe ergänzt werden, hier
 * pflegen. Wird vom IssueList-Render und von DiagnoseReport genutzt.
 *
 * Reihenfolge wichtig: längste Phrasen zuerst (sonst greift der
 * "TTFB"-Match BEVOR "TTFB-Latenz optimieren" matched).
 */

const REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // === Performance / Speed ===
  { pattern: /\bTTFB-Latenz optimieren\b/gi,    replacement: "Server-Antwortzeit verbessern" },
  { pattern: /\bTTFB-Latenz\b/gi,                replacement: "Server-Antwortzeit" },
  { pattern: /\bTTFB\b/gi,                       replacement: "Server-Antwortzeit" },
  { pattern: /\bLargest Contentful Paint\b/gi,   replacement: "Sichtbarer Lade-Abschluss" },
  { pattern: /\bLCP\b/gi,                        replacement: "Sichtbarer Lade-Abschluss" },
  { pattern: /\bFirst Contentful Paint\b/gi,     replacement: "Erste sichtbare Inhalte" },
  { pattern: /\bFCP\b/gi,                        replacement: "Erste sichtbare Inhalte" },
  { pattern: /\bCumulative Layout Shift\b/gi,    replacement: "Layout-Sprünge beim Laden" },
  { pattern: /\bCLS\b/gi,                        replacement: "Layout-Sprünge beim Laden" },
  { pattern: /\bTotal Blocking Time\b/gi,        replacement: "Reaktionsverzögerung" },
  { pattern: /\bTBT\b/gi,                        replacement: "Reaktionsverzögerung" },
  { pattern: /\bInteraction to Next Paint\b/gi,  replacement: "Klick-Antwortzeit" },
  { pattern: /\bINP\b/gi,                        replacement: "Klick-Antwortzeit" },
  { pattern: /\bRender-blocking\b/gi,            replacement: "Lade-Blocker (CSS/JavaScript)" },
  { pattern: /\bRender-Blocker\b/gi,             replacement: "Lade-Blocker (CSS/JavaScript)" },
  { pattern: /\bCore Web Vitals\b/gi,            replacement: "Google-Performance-Werte" },

  // === SEO / Sichtbarkeit ===
  { pattern: /\bIndexierungs-Status\b/gi,        replacement: "Google-Erreichbarkeit" },
  { pattern: /\bIndexierungsstatus\b/gi,         replacement: "Google-Erreichbarkeit" },
  { pattern: /\bIndexierung\b/gi,                replacement: "Google-Erreichbarkeit" },
  { pattern: /\bMeta-Description\b/gi,           replacement: "Google-Suchergebnis-Text" },
  { pattern: /\bMeta Description\b/gi,           replacement: "Google-Suchergebnis-Text" },
  { pattern: /\bH1-Tag\b/gi,                     replacement: "Hauptüberschrift" },
  { pattern: /\bH1-Überschrift\b/gi,             replacement: "Hauptüberschrift" },
  { pattern: /\bTitle-Tag\b/gi,                  replacement: "Seiten-Titel (Browser-Tab)" },
  { pattern: /\bCanonical-Tag\b/gi,              replacement: "Bevorzugte URL-Variante" },
  { pattern: /\bnoindex-Tag\b/gi,                replacement: "Google-Verstecke-Marker" },
  { pattern: /\bsitemap\.xml\b/gi,               replacement: "Site-Karte für Google" },

  // === Technik / Sicherheit ===
  { pattern: /\bSSL-Zertifikat\b/gi,             replacement: "HTTPS-Verschlüsselung" },
  { pattern: /\bHSTS\b/gi,                       replacement: "HTTPS-Erzwingung" },
  { pattern: /\bCSP\b/gi,                        replacement: "Content-Sicherheits-Regel" },
  { pattern: /\bX-Frame-Options\b/gi,            replacement: "Klickjacking-Schutz" },
  { pattern: /\bSecurity-Header\b/gi,            replacement: "Sicherheits-Einstellungen" },

  // === Accessibility / BFSG ===
  { pattern: /\bAlt-Text\b/gi,                   replacement: "Bildbeschreibung" },
  { pattern: /\bAlt-Attribut\b/gi,               replacement: "Bildbeschreibung" },
  { pattern: /\baria-label\b/gi,                 replacement: "Beschriftung für Screen-Reader" },
  { pattern: /\bWCAG-Heuristik\b/gi,             replacement: "Barrierefreiheits-Score" },
  { pattern: /\bWCAG\b/gi,                       replacement: "Barrierefreiheit" },
  { pattern: /\bBFSG\b/gi,                       replacement: "Barrierefreiheits-Gesetz" },
];

/**
 * Übersetzt einen Tech-Text in Klartext. Idempotent — wenn der Text
 * keine Tech-Begriffe enthält, bleibt er unverändert.
 */
export function humanize(text: string | null | undefined): string {
  if (!text) return "";
  let result = text;
  for (const { pattern, replacement } of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/** Convenience-Helper für Issue-Objekte. */
export function humanizeIssue<T extends { title: string; body?: string }>(
  issue: T
): T {
  return {
    ...issue,
    title: humanize(issue.title),
    body:  issue.body ? humanize(issue.body) : issue.body,
  };
}
