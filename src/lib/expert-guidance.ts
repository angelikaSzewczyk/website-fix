/**
 * Expert-Guidance — Lösungs-Snippets für die Top-Issues +
 * Plugin-Empfehlungen je nach gefundenem Problem.
 *
 * Wird vom Dashboard-Issue-Drawer und der "Empfohlene Werkzeuge"-Sektion
 * konsumiert. Die Issue-Klassifikation läuft über matchIssueType() per
 * Title/Body-Pattern (robuster als Free-Text-Checks im UI).
 */

export type BuilderName = "Elementor" | "Divi" | "Astra" | "WPBakery" | null;

export type IssueType =
  | "dom_depth"
  | "google_fonts"
  | "google_fonts_dsgvo"
  | "css_bloat"
  | "cart_fragments"
  | "wc_db_bloat"
  | "wc_uploads_open"
  | "xmlrpc_open"
  | "wp_login_open"
  | "outdated_wc_templates"
  | "wc_plugin_impact"
  | "missing_alt"
  | "missing_h1"
  | "missing_meta_desc"
  | "missing_title"
  | "missing_sitemap"
  | "broken_links"
  | "noindex_blocking"
  | "no_https"
  | "embed_no_consent"     // DSGVO Embed (Maps/YouTube)
  | "form_label_missing"
  | "core_web_vitals"
  | "unknown";

/** Klassifiziert ein Issue anhand Title + Body. Liefert "unknown" wenn nichts greift. */
export function matchIssueType(title: string, body: string): IssueType {
  const t = (title + " " + body).toLowerCase();

  // Builder-Intelligence
  if (/dom.?verschachtelung|dom.?tiefe|dom.?depth/.test(t))                      return "dom_depth";
  if (/google.?font/.test(t) && /dsgvo|münchen|google-server/i.test(t))          return "google_fonts_dsgvo";
  if (/google.?font|font-?vielfalt/.test(t))                                     return "google_fonts";
  if (/css.?bloat|ungenutzte.+(?:builder|css|stylesheet)|animate\.css/.test(t))  return "css_bloat";

  // WooCommerce
  if (/cart.?fragments|wc-ajax=get_refreshed_fragments/.test(t))                 return "cart_fragments";
  if (/database.?bloat|session-marker|wp_options/.test(t))                       return "wc_db_bloat";
  if (/woocommerce_uploads|upload-verzeichnis ungeschützt/.test(t))              return "wc_uploads_open";
  if (/template.+veraltet|outdated.?template/.test(t))                           return "outdated_wc_templates";
  if (/plugin-?ballast|woocommerce-addons.+ladezeit|plugin.+impact/.test(t))     return "wc_plugin_impact";

  // WordPress-Security
  if (/xml-rpc|xmlrpc/.test(t))                                                  return "xmlrpc_open";
  if (/wp-login\.php|wordpress-login/.test(t))                                   return "wp_login_open";

  // SEO
  if (/alt.?text|alternativtext|bilder-beschreibung/.test(t))                    return "missing_alt";
  if (/\bh1\b|hauptüberschrift/.test(t))                                         return "missing_h1";
  if (/meta.?desc|snippet/.test(t))                                              return "missing_meta_desc";
  if (/title.?tag|kein.*title|ohne.*title/.test(t))                              return "missing_title";
  if (/sitemap/.test(t))                                                          return "missing_sitemap";
  if (/404|broken|tote.?link/.test(t))                                            return "broken_links";
  if (/noindex|für google gesperrt/.test(t))                                      return "noindex_blocking";

  // Compliance
  if (/embed|google maps|youtube|vimeo/.test(t) && /consent|wrapper|dsgvo|cookie/.test(t)) return "embed_no_consent";
  if (/ssl|https/.test(t))                                                        return "no_https";
  if (/label|formularfeld.+screenreader/.test(t))                                 return "form_label_missing";
  if (/lcp|cls|core.?web|ladezeit|pagespeed/.test(t))                             return "core_web_vitals";

  return "unknown";
}

// ══════════════════════════════════════════════════════════════════════════
// SOLUTION-LIBRARY
// ══════════════════════════════════════════════════════════════════════════

export type SolutionVariant = {
  builder?: BuilderName | "any";  // "any" oder undefined = Default
  steps:    string[];             // nummerierte Schritte
  caveat?:  string;               // optionale Warnung
};

export type IssueSolution = {
  type:           IssueType;
  headline:       string;
  rootCause:      string;          // 1-Satz-Erklärung warum das Problem auftritt
  variants:       SolutionVariant[];
  recommendedPlugins: string[];   // Plugin-IDs aus PLUGIN_CATALOG
  estImpact:      string;          // "z.B. -300 ms LCP, +5 Punkte PageSpeed"
};

export const SOLUTIONS: Record<IssueType, IssueSolution | null> = {
  dom_depth: {
    type:      "dom_depth",
    headline:  "DOM-Verschachtelung verschlanken",
    rootCause: "Page-Builder erzeugen pro Section/Column ein verschachteltes <div>-Konstrukt. Über 15 Ebenen verlangsamt sich der Layout-Reflow auf Mobilgeräten spürbar.",
    variants: [
      {
        builder: "Elementor",
        steps: [
          "Backend → Elementor → Settings → 'Flexbox Container' aktivieren (falls noch nicht).",
          "Bestehende Pages: Rechtsklick auf eine Section → 'Edit as Container' → konvertiert Section/Column/Inner-Section zu einem Flex-Container.",
          "Verschachtelte Inner-Sections entfernen — Flex-Direction (row/column) ersetzt 90 % der Wrapper-Divs.",
          "Mit dem Plugin 'Element Pack' oder 'Happy Elementor Addons' → 'DOM Cleaner'-Funktion aktivieren.",
        ],
        caveat: "Container sind seit Elementor 3.16 stable. Vorher Backup machen — das Konvertieren ist nicht reversibel ohne Revert.",
      },
      {
        builder: "Divi",
        steps: [
          "Divi Theme Builder → Settings → Performance → 'Dynamic CSS' aktivieren.",
          "Im Visual Builder: Sections mit nur einer Row → über 'Row Settings' → 'Expand Row to Section' zusammenfassen.",
          "Zusatzklassen wie .et_pb_text_inner und .et_pb_with_border entfernen, die keinen visuellen Effekt mehr haben.",
          "Plugin 'Divi Builder Helper' → automatisches Wrapper-Cleanup bei Page-Save.",
        ],
      },
      {
        builder: "Astra",
        steps: [
          "Astra → Settings → Performance → 'Disable Self-Hosted Google Fonts' falls möglich.",
          "Astra Pro: 'Page Headers' und 'Site Layout' auf 'Plain Container' setzen — entfernt 2-3 Wrapper-Ebenen.",
          "Nicht benötigte Sidebar-Module deaktivieren (Customizer → Sidebars).",
        ],
      },
      {
        builder: "any",
        steps: [
          "Mit Browser-DevTools → Elements-Panel → tiefste Verschachtelung identifizieren (rechtsklick → 'Inspect' auf Content).",
          "CSS-Grid und Flexbox einsetzen statt mehrfacher Wrapper-Divs.",
          "Plugin 'Asset CleanUp' → ungenutzte Page-Builder-Module pro Seite deaktivieren.",
        ],
      },
    ],
    recommendedPlugins: ["asset_cleanup", "perfmatters"],
    estImpact: "Typisch −20 bis −40 % LCP auf Mobile, +10 Punkte PageSpeed Insights.",
  },

  google_fonts: {
    type:      "google_fonts",
    headline:  "Font-Vielfalt reduzieren",
    rootCause: "Jede Google-Font-Familie ist ein zusätzlicher externer Request + Render-Blocking-Stylesheet. Best Practice: max. 2 Familien (Heading + Body).",
    variants: [
      {
        builder: "Elementor",
        steps: [
          "Elementor → Site Settings → Typography → Font-Familie für 'Primary' und 'Secondary' Headings auf eine reduzieren.",
          "Body Typography: dieselbe oder eine zweite Familie wählen.",
          "Bei vielen alten Pages: Plugin 'Find & Replace DB' nutzen, um veraltete Font-Familien-Strings zu entfernen.",
        ],
      },
      {
        builder: "Astra",
        steps: [
          "Customizer → Global → Typography → Font-Families auf max. 2 reduzieren.",
          "Astra Pro: 'Performance' → 'Load Google Fonts Locally' aktivieren (lokales Hosting).",
        ],
      },
      {
        builder: "any",
        steps: [
          "Im Theme: alle @import-fonts.googleapis.com-Aufrufe in styles.css/header.php auf max. 2 Familien reduzieren.",
          "font-display: swap immer setzen — Text wird sofort sichtbar, auch bevor die Font geladen ist.",
          "Nur die wirklich genutzten Schriftschnitte (z.B. 400, 700) laden — nicht das volle Set.",
        ],
      },
    ],
    recommendedPlugins: ["omgf", "perfmatters"],
    estImpact: "Typisch −150 bis −400 ms First Contentful Paint.",
  },

  google_fonts_dsgvo: {
    type:      "google_fonts_dsgvo",
    headline:  "Google Fonts DSGVO-konform lokal hosten",
    rootCause: "Das LG München (Az. 3 O 17493/20) hat 2022 entschieden: Externe Google-Font-Einbettung überträgt die IP des Besuchers ohne Einwilligung an Google in den USA — Abmahn-Risiko.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'OMGF | Host Google Fonts Locally' installieren und aktivieren.",
          "Im OMGF-Backend: 'Auto-detect & download fonts' klicken — alle aktiven Google Fonts werden lokal kopiert.",
          "'Use display: swap' aktivieren.",
          "Frontend prüfen: Browser-DevTools → Network-Tab → keine Requests mehr zu fonts.googleapis.com oder fonts.gstatic.com.",
          "Im Backend Cache leeren (z.B. WP Rocket → Clear Cache).",
        ],
        caveat: "Bei Custom-Themes mit gehärtetem CSS kann das Auto-Download-Tool fehlschlagen — dann manuell die WOFF2-Dateien aus google-webfonts-helper.herokuapp.com herunterladen und im Theme-Ordner einbinden.",
      },
    ],
    recommendedPlugins: ["omgf"],
    estImpact: "DSGVO-konform · Abmahn-Risiko eliminiert · spart 1 DNS-Lookup zu Google-Servern.",
  },

  css_bloat: {
    type:      "css_bloat",
    headline:  "Ungenutzte Builder-Styles entfernen",
    rootCause: "Page-Builder und Themes laden oft alle Stylesheets global (Animate.css, Font Awesome, Icon-Sets) — auch auf Seiten, wo sie nicht gebraucht werden.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'Asset CleanUp' (oder 'Perfmatters' im Pro-Plan) installieren.",
          "Backend → Asset CleanUp → Settings → 'Test Mode' aktivieren (verhindert versehentliche Frontend-Brüche).",
          "Pro Seite/Post: ungenutzte CSS/JS-Dateien per Toggle deaktivieren — z.B. Animate.css auf Pages ohne Animationen.",
          "Globale Regel anlegen: 'Disable on all pages except…' für Tools, die nur auf 1-2 Seiten gebraucht werden.",
          "Test-Mode wieder ausschalten, wenn alles stimmt.",
        ],
        caveat: "Vor jeder Bulk-Deaktivierung Cache leeren und Frontend prüfen — manche Themes laden Scripts conditional.",
      },
    ],
    recommendedPlugins: ["asset_cleanup", "perfmatters", "wp_rocket"],
    estImpact: "Typisch −80 bis −250 kB initial Page-Size, +5 Punkte PageSpeed.",
  },

  cart_fragments: {
    type:      "cart_fragments",
    headline:  "WooCommerce Cart-Fragments deaktivieren",
    rootCause: "Das wc-cart-fragments.js-Skript löst auf JEDER Seite einen unzwischengespeicherten AJAX-Request an /?wc-ajax=get_refreshed_fragments aus — selbst auf Blog-Artikeln ohne Warenkorb. Klassischer TTI-Killer.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'Disable Cart Fragments' installieren — One-Click-Lösung.",
          "Alternativ Code-Snippet in functions.php: wp_dequeue_script('wc-cart-fragments') in einem 'wp_enqueue_scripts' Hook mit Priority 11.",
          "Auf Shop-, Cart-, Checkout- und Produkt-Seiten muss das Script weiter laden — Conditional einbauen: !is_woocommerce() && !is_cart() && !is_checkout().",
          "WP Rocket: Settings → 'Disable Cart Fragments on landing pages' aktivieren.",
          "Cache leeren und Frontend prüfen — Mini-Cart sollte auf Shop-Seiten weiter funktionieren.",
        ],
      },
    ],
    recommendedPlugins: ["wp_rocket", "perfmatters"],
    estImpact: "−200 bis −500 ms Time-to-Interactive auf allen Nicht-Shop-Seiten.",
  },

  wc_db_bloat: {
    type:      "wc_db_bloat",
    headline:  "WooCommerce-Datenbank entrümpeln",
    rootCause: "Über die Zeit sammeln sich verwaiste Transients, Expired Sessions und alte Order-Metadaten in wp_options und wp_postmeta — typisch für Shops älter als 6 Monate.",
    variants: [
      {
        builder: "any",
        steps: [
          "Backup machen (Updraft, BackWPup) — DB-Cleanup ist nicht reversibel.",
          "Admin → WooCommerce → Status → Tools → 'Kundensitzungen aufräumen' und 'Verfallene Transienten löschen' ausführen.",
          "Plugin 'WP-Optimize' installieren → 'Database' → alle Tabellen auf 'Optimize' setzen + 'Remove expired transients' aktivieren.",
          "Bei Shops mit > 1.000 Bestellungen zusätzlich: 'Delete Old Orders (Safe)' Plugin → Bestellungen älter 12 Monate archivieren (rechtliche Aufbewahrungsfristen beachten).",
          "WP-Optimize → 'Schedule' → wöchentliche Auto-Cleanups aktivieren.",
        ],
        caveat: "Vor 'Delete Old Orders' den Steuerberater fragen — in DE gilt 10 Jahre Aufbewahrungspflicht für Rechnungsdaten (HGB §257).",
      },
    ],
    recommendedPlugins: ["wp_optimize"],
    estImpact: "Typisch −10 bis −40 % wp_options-Größe, schnellere Admin-Pages und Checkout.",
  },

  wc_uploads_open: {
    type:      "wc_uploads_open",
    headline:  "WooCommerce-Upload-Ordner absichern",
    rootCause: "/wp-content/uploads/woocommerce_uploads/ enthält Rechnungen, Order-Exporte und teils Lizenzdateien. Wenn das Verzeichnis ein Directory-Listing zeigt, sind Kundendaten direkt per URL abrufbar — DSGVO-Verstoß.",
    variants: [
      {
        builder: "any",
        steps: [
          "Per FTP/SFTP: in /wp-content/uploads/woocommerce_uploads/ eine .htaccess-Datei anlegen mit dem Inhalt: 'Options -Indexes' und in einer neuen Zeile 'Deny from all'.",
          "Zugriff auf Backend → WooCommerce → Settings → 'Allow access to files via URL only with secure links' aktivieren.",
          "Plugin 'WooCommerce Protected Categories' für Lizenz-Downloads, falls Files weiterhin per Link verfügbar sein müssen.",
          "Curl-Test im Terminal: curl -I https://deinedomain.de/wp-content/uploads/woocommerce_uploads/ → muss 403 Forbidden zurückgeben.",
        ],
      },
    ],
    recommendedPlugins: ["wordfence"],
    estImpact: "Sicherheits-Critical-Risk eliminiert, DSGVO-konform.",
  },

  xmlrpc_open: {
    type:      "xmlrpc_open",
    headline:  "XML-RPC-Endpunkt sperren",
    rootCause: "/xmlrpc.php erlaubt Remote-API-Calls und wird massenhaft für Brute-Force-Login (1.000 Versuche/Request via system.multicall) und Pingback-DDoS missbraucht.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'Disable XML-RPC-API' installieren — One-Click.",
          "Alternativ: in .htaccess (Apache) folgendes einfügen vor '#BEGIN WordPress': '<Files xmlrpc.php> Order Deny,Allow Deny from all </Files>'.",
          "Bei Nginx: in der Server-Config: 'location = /xmlrpc.php { deny all; }'.",
          "Wordfence aktivieren — 'XML-RPC Authentication Limit' begrenzt Calls auf 5/Stunde pro IP.",
        ],
        caveat: "Wenn die Jetpack-App, mobile WordPress-App oder eine fremde API auf XML-RPC zugreifen soll: nicht komplett sperren, sondern nur per Plugin-Limit absichern.",
      },
    ],
    recommendedPlugins: ["wordfence"],
    estImpact: "Massive Brute-Force-Welle eliminiert, Server-Last sinkt spürbar.",
  },

  wp_login_open: {
    type:      "wp_login_open",
    headline:  "WordPress-Login-URL absichern",
    rootCause: "/wp-login.php ist die Standard-URL für jeden WP-Login. Bots scannen 24/7 nach genau dieser URL für Brute-Force-Angriffe.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'WPS Hide Login' installieren.",
          "Settings → 'Login URL' auf z.B. /mein-secret-login setzen, /wp-login.php wird zu 404.",
          "Zusätzlich: Wordfence → 'Login Security' → 2FA + 'Lock out after 5 failed attempts'.",
          "Login-URL nur intern teilen, nicht in Bookmarks oder Lesezeichen-Dumps mit fremden teilen.",
        ],
        caveat: "Vor dem Aktivieren die neue URL notieren — sonst sperrst du dich selbst aus. Backup-Plan: per FTP das Plugin-Verzeichnis umbenennen, dann wp-login.php wieder erreichbar.",
      },
    ],
    recommendedPlugins: ["wordfence"],
    estImpact: "Brute-Force-Versuche von 5.000+/Tag auf nahe 0.",
  },

  outdated_wc_templates: {
    type:      "outdated_wc_templates",
    headline:  "Veraltete WooCommerce-Templates aktualisieren",
    rootCause: "Wenn dein Theme WooCommerce-Templates überschreibt (in /wp-content/themes/<theme>/woocommerce/), müssen die nach jedem WC-Update mitgepflegt werden — sonst drohen Checkout-Fehler.",
    variants: [
      {
        builder: "any",
        steps: [
          "Backend → WooCommerce → Status → System Status → Abschnitt 'Templates' öffnen.",
          "Jeden mit 'Versions-Hinweis' markierten Override öffnen — Datei aus /wp-content/plugins/woocommerce/templates/<dateiname> kopieren.",
          "In einem Diff-Tool (VSCode, Beyond Compare) die alten Theme-Anpassungen mit der neuen Plugin-Version mergen.",
          "Datei zurück in /wp-content/themes/<theme>/woocommerce/<dateiname> speichern.",
          "Auf Staging testen (Checkout, Bestätigungsseite, Order-Email) — erst dann auf Production.",
        ],
        caveat: "Bei Premium-Themes (Avada, Flatsome, Astra Pro) liefert der Theme-Vendor oft Update-Patches mit — dann besser auf Theme-Update warten.",
      },
    ],
    recommendedPlugins: [],
    estImpact: "Verhindert Checkout-Bugs, Tax-Calculation-Fehler und kaputte Produkt-Galerien nach WC-Updates.",
  },

  wc_plugin_impact: {
    type:      "wc_plugin_impact",
    headline:  "Heavy WooCommerce-Plugins selektiv laden",
    rootCause: "WC-Addons (Wishlists, Bookings, Custom Product Options) laden ihre Scripts oft global — auch auf Seiten ohne Shop-Bezug. Auf einem Blog-Artikel haben sie nichts zu suchen.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'Asset CleanUp Pro' oder 'Perfmatters' (Pro hat es eingebaut) installieren.",
          "In Asset CleanUp → 'Manage' → identifiziere die schwersten Plugin-Scripts (>50 kB).",
          "Pro Plugin eine Regel setzen: 'Disable on all pages, except: /shop, /cart, /checkout, /produkt-kategorie/*, /produkt/*'.",
          "Nicht-Shop-Seiten erneut mit PageSpeed Insights testen — sollte −30 bis −50 % TTI bringen.",
          "WP Rocket → 'File Optimization' → 'Delay JavaScript Execution' auf alle Plugin-Scripts ausser Critical.",
        ],
      },
    ],
    recommendedPlugins: ["asset_cleanup", "perfmatters", "wp_rocket"],
    estImpact: "Typisch −30 bis −50 % Time-to-Interactive auf Nicht-Shop-Seiten.",
  },

  // ── Standard-SEO ──────────────────────────────────────────────────────
  missing_alt: {
    type:      "missing_alt",
    headline:  "Bilder mit Alt-Text versehen",
    rootCause: "Alt-Texte sind doppelter Hebel: SEO (Bildersuche-Ranking) und Barrierefreiheit (Screenreader, BFSG-Pflicht ab 06/2025).",
    variants: [
      {
        builder: "any",
        steps: [
          "Backend → Medien → Bibliothek → Liste-Ansicht.",
          "Pro Bild: Alt-Text-Feld befüllen — kurz, inhaltsbeschreibend, kein Keyword-Stuffing.",
          "Plugin 'Bulk Image Alt Text Editor' für Massen-Editing.",
          "Bei AI-Hilfe: 'Auto Alt Text' Plugin (mit OpenAI Key) — generiert Vorschläge automatisch.",
        ],
        caveat: "Dekorative Bilder (z.B. Hintergrund-Patterns) bekommen alt='' (leer) — sonst nervt das den Screenreader.",
      },
    ],
    recommendedPlugins: ["yoast_seo"],
    estImpact: "Barrierefreiheit (BFSG) erfüllt + zusätzliche Sichtbarkeit in Google Bildersuche.",
  },

  missing_h1: {
    type:      "missing_h1",
    headline:  "H1-Hauptüberschrift setzen",
    rootCause: "Genau eine H1 pro Seite — sie sagt Google und Screenreadern, worum es auf der Seite geht.",
    variants: [
      {
        builder: "Elementor",
        steps: [
          "Page öffnen → erstes Heading-Widget anklicken → 'HTML Tag' auf H1 setzen.",
          "Alle anderen Headings auf H2/H3/H4 mit logischer Hierarchie.",
        ],
      },
      {
        builder: "Divi",
        steps: [
          "Visual Builder → Text-/Heading-Modul → Tab 'Design' → 'Heading Level' auf H1 setzen.",
          "Im Theme-Customizer prüfen, ob das Page-Title-Modul ebenfalls als H1 läuft (sonst Doppel-H1).",
        ],
      },
      {
        builder: "any",
        steps: [
          "Im Editor: erste Überschrift als 'Heading 1' formatieren.",
          "SEO-Plugin (Yoast/Rank Math) → 'Single H1 check' aktivieren.",
        ],
      },
    ],
    recommendedPlugins: ["yoast_seo", "rank_math"],
    estImpact: "+5 bis +12 Ranking-Punkte für die Hauptkeyword-Phrase.",
  },

  missing_meta_desc: {
    type:      "missing_meta_desc",
    headline:  "Meta-Description schreiben",
    rootCause: "Google nutzt die Meta-Description als Snippet in den Suchergebnissen. Fehlt sie, wählt Google einen beliebigen Textausschnitt — meist nicht conversion-optimiert.",
    variants: [
      {
        builder: "any",
        steps: [
          "Yoast SEO oder Rank Math installieren (falls noch nicht aktiv).",
          "Pro Page/Post: Meta-Description-Feld befüllen — 120-155 Zeichen.",
          "Mit klarem CTA: 'Jetzt Termin vereinbaren', 'Kostenlos testen' etc.",
          "Hauptkeyword in den ersten 60 Zeichen platzieren.",
        ],
      },
    ],
    recommendedPlugins: ["yoast_seo", "rank_math"],
    estImpact: "+15 bis +40 % Click-Through-Rate aus Google-Suchergebnissen.",
  },

  missing_title: {
    type:      "missing_title",
    headline:  "Title-Tag definieren",
    rootCause: "Der Title-Tag ist das wichtigste SEO-Element überhaupt — ohne ihn kann eine Seite nicht ranken.",
    variants: [
      {
        builder: "any",
        steps: [
          "Yoast/Rank Math → SEO-Title-Feld füllen, max. 60 Zeichen.",
          "Format: 'Hauptkeyword | Sekundär-Keyword - Markenname'.",
          "Pro Page einzigartig — keine zwei identischen Titles im Site.",
        ],
      },
    ],
    recommendedPlugins: ["yoast_seo", "rank_math"],
    estImpact: "Ohne Title-Tag rankt die Seite gar nicht — kritischer Fix.",
  },

  missing_sitemap: {
    type:      "missing_sitemap",
    headline:  "XML-Sitemap aktivieren",
    rootCause: "Eine sitemap.xml gibt Google die Liste aller indexierbaren URLs — beschleunigt Discovery um Tage bis Wochen.",
    variants: [
      {
        builder: "any",
        steps: [
          "Yoast SEO → Allgemein → Features → 'XML-Sitemaps' aktivieren.",
          "URL prüfen: deinedomain.de/sitemap_index.xml muss erreichbar sein.",
          "Search Console → Sitemaps → URL einreichen.",
          "Robots.txt prüfen: muss eine Zeile 'Sitemap: https://deinedomain.de/sitemap_index.xml' enthalten.",
        ],
      },
    ],
    recommendedPlugins: ["yoast_seo", "rank_math"],
    estImpact: "Schnellere Indexierung neuer Seiten (Tage statt Wochen).",
  },

  broken_links: {
    type:      "broken_links",
    headline:  "Defekte Links reparieren",
    rootCause: "404-Links frustrieren Besucher, schaden dem Ranking und verbrauchen Crawl-Budget — kostet direkt Conversions.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'Redirection' installieren.",
          "Pro 404-URL eine 301-Weiterleitung zur nächstbesten Seite setzen (nicht generisch zur Startseite).",
          "Plugin 'Broken Link Checker' für laufende Überwachung interner UND externer Links.",
          "Search Console → Berichte → 404-Fehler regelmäßig prüfen.",
        ],
      },
    ],
    recommendedPlugins: ["redirection"],
    estImpact: "Bewahrt Link-Equity, verbessert Crawl-Effizienz, weniger Bounce-Rate.",
  },

  noindex_blocking: {
    type:      "noindex_blocking",
    headline:  "noindex-Meta-Tag prüfen",
    rootCause: "noindex sagt Google: 'Diese Seite nicht in den Index aufnehmen'. Auf Live-Pages oft versehentlich gesetzt — ranking-tot.",
    variants: [
      {
        builder: "any",
        steps: [
          "Yoast/Rank Math → SEO-Tab → 'Indexierung' auf 'Index' setzen.",
          "Backend → Lesen-Einstellungen → 'Suchmaschinen daran hindern' DARF NICHT aktiv sein.",
          "Bei vererbten Settings: SEO-Plugin → Bulk-Editor → 'Set all to Index' für Pages/Posts.",
        ],
        caveat: "Tag-Archive, Author-Pages und Dünn-Content-Seiten sind durchaus noindex-Kandidaten — pro URL einzeln entscheiden.",
      },
    ],
    recommendedPlugins: ["yoast_seo", "rank_math"],
    estImpact: "Seite wird wieder indexierbar — kommt typisch nach 1-2 Wochen in den Index.",
  },

  no_https: {
    type:      "no_https",
    headline:  "SSL-Zertifikat aktivieren",
    rootCause: "Ohne HTTPS markiert Chrome die Seite als 'Nicht sicher' — Google straft im Ranking ab und Browser blockieren moderne APIs.",
    variants: [
      {
        builder: "any",
        steps: [
          "Hosting-Panel öffnen (Plesk, cPanel, ServerPilot, …).",
          "'Let's Encrypt SSL' aktivieren — kostenlos, Auto-Renewal.",
          "WP-Admin → Einstellungen → Allgemein → Site-URL und WP-URL auf https:// umstellen.",
          "Plugin 'Really Simple SSL' installieren — fixt Mixed-Content automatisch.",
          "In .htaccess HTTP→HTTPS 301-Redirect setzen.",
        ],
      },
    ],
    recommendedPlugins: ["wordfence"],
    estImpact: "Kein 'Nicht sicher'-Banner mehr, +5-15 Ranking-Punkte für relevante Queries.",
  },

  embed_no_consent: {
    type:      "embed_no_consent",
    headline:  "Externe Embeds in Consent-Wrapper packen",
    rootCause: "Google Maps, YouTube, Vimeo & Co. setzen Tracking-Cookies, sobald sie geladen werden. Ohne Consent-Wrapper = DSGVO-Verstoß.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'Borlabs Cookie' (Premium) oder 'Complianz GDPR' (Freemium) installieren.",
          "Im Plugin-Backend: Service für YouTube/Maps/Vimeo aktivieren — die Embeds werden automatisch in Consent-Wrapper gepackt.",
          "Manueller Weg: Embed in <div data-cookieconsent='marketing'> wrappen, Fallback-Vorschau-Bild zeigen.",
          "Frontend prüfen: vor Cookie-Akzeptanz darf KEIN Request an youtube.com/maps.googleapis.com gehen.",
        ],
        caveat: "Reine Verlinkungen (z.B. 'In Maps öffnen') ohne iframe sind unkritisch — nur Embeds problematisch.",
      },
    ],
    recommendedPlugins: ["borlabs_cookie", "complianz"],
    estImpact: "DSGVO-Konformität · Abmahn-Risiko eliminiert.",
  },

  form_label_missing: {
    type:      "form_label_missing",
    headline:  "Form-Labels für Screenreader",
    rootCause: "Inputs ohne <label> oder aria-label sind für Screenreader-Nutzer komplett unzugänglich — BFSG-Verstoß ab 06/2025.",
    variants: [
      {
        builder: "any",
        steps: [
          "Pro Input-Feld ein <label for='input-id'>-Element setzen oder aria-label-Attribut.",
          "Bei Contact Form 7: in der Form-Definition explizit [label] vor jedem [text]-Field schreiben.",
          "Bei Elementor Form-Widget: Field → Advanced → Custom CSS Classes → 'aria-label' setzen.",
          "Plugin 'WP Accessibility' für Auto-Fix der häufigsten Form-Probleme.",
        ],
      },
    ],
    recommendedPlugins: [],
    estImpact: "BFSG-Konform, bessere UX für Screenreader und mobile Nutzer.",
  },

  core_web_vitals: {
    type:      "core_web_vitals",
    headline:  "Core Web Vitals optimieren",
    rootCause: "Google bewertet LCP, CLS und INP direkt im Ranking — schlechte Werte = niedrigere Position.",
    variants: [
      {
        builder: "any",
        steps: [
          "Plugin 'WP Rocket' (oder kostenlos: 'LiteSpeed Cache' bei LiteSpeed-Server) für Page-Cache + Asset-Optimierung.",
          "Bilder mit ShortPixel / Smush in WebP/AVIF konvertieren — Lazy-Loading aktivieren.",
          "Hero-Image als 'preload' im <head> setzen → verbessert LCP um 200-500 ms.",
          "CLS-Fix: alle Bilder bekommen width/height-Attribute (vermeidet Layout-Shifts).",
          "Mit PageSpeed Insights testen → konkrete Empfehlungen für die Site umsetzen.",
        ],
      },
    ],
    recommendedPlugins: ["wp_rocket", "perfmatters", "shortpixel"],
    estImpact: "Typisch +20-40 Punkte PageSpeed Mobile, bessere Ranking-Position.",
  },

  unknown: null,
};

/** Liefert die Solution für ein Issue oder null. Bevorzugt builder-spezifische Variant. */
export function getSolution(type: IssueType, builder: BuilderName): IssueSolution | null {
  return SOLUTIONS[type] ?? null;
}

/** Liefert die "passende" Variant für einen Builder, fallback auf "any". */
export function pickVariant(solution: IssueSolution, builder: BuilderName): SolutionVariant {
  const exact = solution.variants.find(v => v.builder === builder);
  if (exact) return exact;
  const any = solution.variants.find(v => v.builder === "any" || !v.builder);
  return any ?? solution.variants[0];
}

// ══════════════════════════════════════════════════════════════════════════
// PLUGIN-KATALOG
// ══════════════════════════════════════════════════════════════════════════

export type PluginRecommendation = {
  id:          string;
  name:        string;
  vendor:      string;
  category:    "performance" | "security" | "seo" | "compliance" | "media" | "ecommerce";
  description: string;     // Was macht das Plugin?
  whyItHelps:  string;     // Warum löst es das aktuelle Problem?
  pricing:     "free" | "freemium" | "paid";
  url:         string;     // wp.org-Plugin-Listing oder Vendor-Seite
};

export const PLUGIN_CATALOG: Record<string, PluginRecommendation> = {
  wp_rocket: {
    id:       "wp_rocket",
    name:     "WP Rocket",
    vendor:   "WP Media",
    category: "performance",
    description: "Premium Page-Cache mit Asset-Minification, Lazy-Loading und Critical-CSS-Generierung — Industriestandard für WordPress-Performance.",
    whyItHelps:  "Ein-Klick-Setup für Page-Cache, GZIP, JS-/CSS-Minification, Lazy-Load und 'Delay JavaScript Execution' — adressiert die häufigsten Speed-Probleme automatisch.",
    pricing: "paid",
    url:     "https://wp-rocket.me/",
  },
  perfmatters: {
    id:       "perfmatters",
    name:     "Perfmatters",
    vendor:   "forgemedia",
    category: "performance",
    description: "Lightweight Performance-Plugin von Kinsta-Founder. Asset-CleanUp, Script-Manager, Database-Cleaner.",
    whyItHelps:  "Per-Page-Asset-Disable für heavy WC-Plugins, native Lazy-Load, jQuery-Migrate-Removal — perfekt ergänzend zu WP Rocket.",
    pricing: "paid",
    url:     "https://perfmatters.io/",
  },
  asset_cleanup: {
    id:       "asset_cleanup",
    name:     "Asset CleanUp",
    vendor:   "Gabe Livan",
    category: "performance",
    description: "Free-Variante zum selektiven Deaktivieren von CSS/JS-Dateien pro Seite. Pro-Version mit Bulk-Regeln.",
    whyItHelps:  "Kostenloser Einstieg in Per-Page-Asset-Optimierung — identifiziert ungenutzte Builder-Stylesheets und Plugin-Scripts.",
    pricing: "freemium",
    url:     "https://wordpress.org/plugins/wp-asset-clean-up/",
  },
  omgf: {
    id:       "omgf",
    name:     "OMGF | Host Google Fonts Locally",
    vendor:   "Daan van den Bergh",
    category: "compliance",
    description: "Lädt Google Fonts automatisch lokal in WordPress und ersetzt externe Requests an fonts.googleapis.com.",
    whyItHelps:  "Eliminiert das DSGVO-Risiko der externen Font-Einbettung (LG München 3 O 17493/20) mit einem Klick und spart einen DNS-Lookup.",
    pricing: "freemium",
    url:     "https://wordpress.org/plugins/host-webfonts-local/",
  },
  borlabs_cookie: {
    id:       "borlabs_cookie",
    name:     "Borlabs Cookie",
    vendor:   "Borlabs",
    category: "compliance",
    description: "Premium DSGVO-Cookie-Banner mit feinem Service-Management für YouTube, Maps, Analytics, Pixel etc.",
    whyItHelps:  "Wrappt externe Embeds (YouTube/Maps) automatisch in Consent-Boxen — Anwalts-getestet, IAB-TCF-2.2-konform.",
    pricing: "paid",
    url:     "https://borlabs.io/borlabs-cookie/",
  },
  complianz: {
    id:       "complianz",
    name:     "Complianz GDPR",
    vendor:   "Complianz B.V.",
    category: "compliance",
    description: "Freemium DSGVO-Suite mit Cookie-Banner, Cookie-Scan und automatischer Datenschutzerklärung.",
    whyItHelps:  "Free-Variante deckt schon Banner + Scan ab — ideal für Starter-Budgets, die DSGVO-konform sein müssen.",
    pricing: "freemium",
    url:     "https://wordpress.org/plugins/complianz-gdpr/",
  },
  yoast_seo: {
    id:       "yoast_seo",
    name:     "Yoast SEO",
    vendor:   "Yoast",
    category: "seo",
    description: "Marktführer für WordPress-SEO. Title/Meta-Editor, XML-Sitemap, Schema-Markup, Readability-Check.",
    whyItHelps:  "Behebt fehlende Title-Tags, Meta-Descriptions, H1-Probleme und generiert Sitemap automatisch — SEO-Basics in einem Plugin.",
    pricing: "freemium",
    url:     "https://wordpress.org/plugins/wordpress-seo/",
  },
  rank_math: {
    id:       "rank_math",
    name:     "Rank Math",
    vendor:   "MyThemeShop",
    category: "seo",
    description: "Modernerer Yoast-Konkurrent mit kostenloser Schema-Generation, eingebauter Search-Console-Integration.",
    whyItHelps:  "Volles SEO-Toolset gratis — Title/Meta, Sitemap, Schema, GSC-Daten direkt im WP-Backend.",
    pricing: "freemium",
    url:     "https://wordpress.org/plugins/seo-by-rank-math/",
  },
  redirection: {
    id:       "redirection",
    name:     "Redirection",
    vendor:   "John Godley",
    category: "seo",
    description: "Free Redirect-Manager mit 404-Logging und 301-Setup-UI.",
    whyItHelps:  "Adressiert defekte Links: zeigt 404-URLs und erlaubt sofortige 301-Weiterleitung — bewahrt SEO-Link-Equity.",
    pricing: "free",
    url:     "https://wordpress.org/plugins/redirection/",
  },
  wp_optimize: {
    id:       "wp_optimize",
    name:     "WP-Optimize",
    vendor:   "UpdraftPlus",
    category: "performance",
    description: "Datenbank-Cleaner + Image-Compression + Page-Cache in einem Plugin.",
    whyItHelps:  "Bereinigt Transients, Expired Sessions, Orphan-Postmeta — direkter Fix für WC-Database-Bloat.",
    pricing: "freemium",
    url:     "https://wordpress.org/plugins/wp-optimize/",
  },
  wordfence: {
    id:       "wordfence",
    name:     "Wordfence Security",
    vendor:   "Defiant",
    category: "security",
    description: "Firewall, Malware-Scanner, 2FA, Login-Protection für WordPress.",
    whyItHelps:  "Adressiert XML-RPC-Brute-Force, Login-Bruteforce und allgemeine Security-Hardening — eines der meistinstallierten Security-Plugins.",
    pricing: "freemium",
    url:     "https://wordpress.org/plugins/wordfence/",
  },
  shortpixel: {
    id:       "shortpixel",
    name:     "ShortPixel",
    vendor:   "ShortPixel",
    category: "media",
    description: "Bild-Optimierung im WebP/AVIF-Format mit Lossy/Lossless-Modi.",
    whyItHelps:  "LCP-Killer Nr. 1 sind unoptimierte Bilder — ShortPixel konvertiert automatisch zu WebP und spart 50-80 % Größe.",
    pricing: "freemium",
    url:     "https://wordpress.org/plugins/shortpixel-image-optimiser/",
  },
};

/** Aggregiert alle Plugin-Empfehlungen aus den gefundenen Issue-Types.
 *  Dedupliziert per Plugin-ID, sortiert nach Häufigkeit der Erwähnung. */
export function recommendPluginsForIssues(issueTypes: IssueType[]): PluginRecommendation[] {
  const counts = new Map<string, number>();
  for (const t of issueTypes) {
    const sol = SOLUTIONS[t];
    if (!sol) continue;
    for (const id of sol.recommendedPlugins) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => PLUGIN_CATALOG[id])
    .filter((p): p is PluginRecommendation => !!p);
}
