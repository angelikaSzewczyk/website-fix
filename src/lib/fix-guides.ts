/**
 * Fix-Guides — kontextspezifische Anleitungen pro Issue-Kind und CMS-Kontext.
 *
 * Das Audit hat den generischen Fix-Anleitungen widersprochen: "Es muss
 * heißen 'Gehe in Elementor auf Widget X', nicht 'Ändere den HTML-Tag'".
 *
 * Diese Datei liefert genau das. Pro Issue-Kind (alt, title, h1, meta, …)
 * existiert ein Mapping pro CMS-Kontext (elementor / divi / gutenberg /
 * astra / wpbakery / beaver / klassisch). Die Caller-Komponente
 * (IssueDetailDrawer) liest cms_context aus website_checks und ruft
 * `getFixGuide(kind, cms_context)` — bekommt eine Liste konkreter
 * Schritt-für-Schritt-Anweisungen.
 *
 * Default-Verhalten: wenn kein CMS-spezifischer Eintrag existiert, fallen
 * wir auf "wordpress" (Klassisch / Gutenberg) zurück. Das ist der größte
 * gemeinsame Nenner und immer sinnvoll.
 */

export type FixIssueKind =
  | "alt"        // Bilder ohne Alt-Text
  | "title"      // Title-Tag fehlt
  | "h1"         // H1-Überschrift fehlt
  | "meta"       // Meta-Description fehlt
  | "noindex"    // Noindex blockiert Indexierung
  | "404"        // Toter Link / Seite gibt 404
  | "label"      // Formularfelder ohne Label
  | "button"     // Buttons ohne sichtbaren Text
  | "wp_outdated"     // WordPress-Core veraltet
  | "wp_login"        // /wp-login.php öffentlich
  | "xmlrpc"          // XML-RPC offen
  | "ssl"             // SSL-Zertifikat
  | "cart_fragments"  // WooCommerce cart-fragments AJAX
  | "google_fonts"    // Google Fonts ohne self-host
  | "dom_depth"       // DOM-Tiefe zu hoch (Builder-Bloat);

export type CmsContext =
  | "elementor"
  | "divi"
  | "gutenberg"
  | "astra"
  | "wpbakery"
  | "beaver"
  | "wordpress";

export type FixGuide = {
  /** Anzeigetitel der Anleitung — meist "Plattform / Builder — Schritt für Schritt:" */
  heading: string;
  /** Konkrete Schritte. Jede Zeile = ein <li>. */
  steps: string[];
  /** Optionale ergänzende Notiz (z.B. Plugin-Empfehlung). */
  note?: string;
};

// ─── Lookup-Tabelle ──────────────────────────────────────────────────────────
// Struktur: GUIDES[kind][cms] = FixGuide. Wenn ein cms-Eintrag fehlt, fällt
// getFixGuide auf "wordpress" zurück. Das macht jede Kombination aus
// (kind, cms) zwar nicht maximal spezifisch, aber nie leer.

const GUIDES: Partial<Record<FixIssueKind, Partial<Record<CmsContext, FixGuide>>>> = {
  // ─── Bilder ohne Alt-Text ──────────────────────────────────────────────
  alt: {
    elementor: {
      heading: "Elementor — Schritt für Schritt:",
      steps: [
        "Öffne die betroffene Seite im Elementor-Editor.",
        "Klicke auf das Bild-Widget mit dem fehlenden Alt-Text.",
        "Im linken Panel: Tab Inhalt → Bild → wähle 'Bild bearbeiten'.",
        "In der Medien-Bibliothek das Feld 'Alternativer Text' befüllen — kurz und beschreibend (z.B. 'Teamfoto Büro München').",
        "Speichern & Update klicken.",
      ],
      note: "Tipp: Über Elementor → Tools → Bild-Bibliothek kannst du fehlende Alt-Texte gesammelt nachpflegen.",
    },
    divi: {
      heading: "Divi — Schritt für Schritt:",
      steps: [
        "Öffne die Seite im Divi Builder (visueller Editor).",
        "Klicke das Bild-Modul an → Zahnrad-Symbol für Modul-Einstellungen.",
        "Tab Inhalt → Feld 'Alternativtext (Alt)' befüllen.",
        "Bei 'Bildtitel' ggf. denselben Wert nutzen (für SEO neutral).",
        "Speichern → Verlassen → Seite prüfen.",
      ],
    },
    gutenberg: {
      heading: "Gutenberg (Block-Editor) — Schritt für Schritt:",
      steps: [
        "Öffne die Seite/den Beitrag im Editor.",
        "Klicke den Bild-Block mit dem fehlenden Alt-Text an.",
        "Rechte Seitenleiste → Tab Block → Feld 'Alternativtext'.",
        "Kurze, beschreibende Bezeichnung eingeben (z.B. 'Teamfoto Büro München').",
        "Aktualisieren klicken.",
      ],
      note: "Dekorative Bilder dürfen ein leeres Alt-Attribut behalten — sie werden so von Screenreadern übersprungen.",
    },
    astra: {
      heading: "Astra — Schritt für Schritt:",
      steps: [
        "Astra nutzt den Standard-Block-Editor (Gutenberg).",
        "Bild-Block anklicken → rechte Seitenleiste → Alternativtext eintragen.",
        "Für Custom-Layout-Bilder: Astra → Customizer → Logo/Header → Alt-Text-Felder prüfen.",
      ],
    },
    wpbakery: {
      heading: "WPBakery — Schritt für Schritt:",
      steps: [
        "Seite im Backend-Editor (Klassik) öffnen.",
        "Bild-Element anklicken → Bleistift-Symbol → Bild bearbeiten.",
        "Im Medien-Dialog: Feld 'Alternativtext' setzen → Aktualisieren.",
      ],
    },
    beaver: {
      heading: "Beaver Builder — Schritt für Schritt:",
      steps: [
        "Seite mit Beaver Builder öffnen.",
        "Bild-Modul klicken → Werkzeugsymbol (Wrench) → Modul-Einstellungen.",
        "Tab Allgemein → Feld 'Alt-Tag' eintragen.",
        "Speichern → Veröffentlichen.",
      ],
    },
    wordpress: {
      heading: "WordPress — Schritt für Schritt:",
      steps: [
        "Im WP-Admin: Medien → Bibliothek.",
        "Klicke das Bild ohne Alt-Text an.",
        "Feld 'Alternativtext' befüllen — kurze, inhaltliche Beschreibung.",
        "Schließen — der Wert wird automatisch gespeichert und überall im Frontend übernommen.",
      ],
    },
  },

  // ─── Title-Tag fehlt ────────────────────────────────────────────────────
  title: {
    elementor: {
      heading: "Elementor — Schritt für Schritt:",
      steps: [
        "Im WP-Admin: Yoast SEO oder RankMath aktivieren (kostenlose Plugins).",
        "Seite öffnen → unter dem Editor erscheint die SEO-Sektion des Plugins.",
        "Feld 'SEO-Titel' (manchmal 'Title'): einzigartiger Titel mit Haupt-Keyword, 55–60 Zeichen.",
        "Live-Preview prüft die Vorschau — sollte vor Pixel-Cap enden.",
      ],
    },
    divi: {
      heading: "Divi — Schritt für Schritt:",
      steps: [
        "Yoast SEO oder RankMath im WP-Admin installieren/aktivieren.",
        "Seite im Divi öffnen → Backend-Editor wechseln (oben rechts).",
        "Unter dem Inhalt erscheint der SEO-Block des Plugins.",
        "Title-Tag eintragen (55–60 Zeichen, mit Haupt-Keyword).",
        "Speichern → Frontend-Editor zurück.",
      ],
    },
    gutenberg: {
      heading: "Gutenberg — Schritt für Schritt:",
      steps: [
        "SEO-Plugin (Yoast / RankMath / SEOPress) installieren — falls noch nicht vorhanden.",
        "Seite/Beitrag öffnen → SEO-Box unterhalb des Editors aufklappen.",
        "'SEO-Titel'-Feld ausfüllen, 55–60 Zeichen.",
        "Vorschau zeigt wie das Snippet bei Google erscheint.",
      ],
    },
    wordpress: {
      heading: "WordPress — Schritt für Schritt:",
      steps: [
        "Yoast SEO oder RankMath installieren.",
        "Im Editor jeder Seite: SEO-Snippet → Titel manuell setzen.",
        "Ohne SEO-Plugin nimmt WP den Beitrag-Titel als <title> — das reicht oft, ist aber nicht optimiert.",
      ],
    },
  },

  // ─── H1-Überschrift fehlt ──────────────────────────────────────────────
  h1: {
    elementor: {
      heading: "Elementor — Schritt für Schritt:",
      steps: [
        "Seite im Elementor öffnen.",
        "Heading-Widget (Überschrift) an passender Stelle hinzufügen oder bestehendes auswählen.",
        "Im Reiter Inhalt unter 'HTML-Tag': H1 wählen.",
        "Pro Seite genau eine H1 — alle weiteren Überschriften sollten H2/H3 sein.",
      ],
      note: "Achtung: Manche Themes setzen den Beitrag-Titel als H1 automatisch. Dann KEIN zweites H1-Widget einfügen — sonst Duplicate-Heading-Fehler.",
    },
    divi: {
      heading: "Divi — Schritt für Schritt:",
      steps: [
        "Seite im Divi Builder öffnen.",
        "Text- oder Heading-Modul auswählen, das die Hauptüberschrift enthält.",
        "Modul-Einstellungen → Tab Erweitert → 'CSS ID & Klassen' nicht relevant — wechsle zu Tab Inhalt.",
        "Bei Heading-Modul: Reiter Inhalt → 'Überschrift-Stufe' → H1.",
      ],
    },
    gutenberg: {
      heading: "Gutenberg — Schritt für Schritt:",
      steps: [
        "Seite im Block-Editor öffnen.",
        "Ersten Überschrift-Block auswählen (oder neuen einfügen).",
        "Toolbar oberhalb des Blocks: H-Symbol → H1 wählen.",
        "Haupt-Keyword in die H1 integrieren.",
      ],
    },
    wordpress: {
      heading: "WordPress — Schritt für Schritt:",
      steps: [
        "Klassischer Editor: oberste Zeile → Style 'Überschrift 1' wählen.",
        "Oder im Theme-Code: ein <h1>-Tag im Single/Page-Template setzen.",
        "Pro Seite genau eine H1.",
      ],
    },
  },

  // ─── Meta-Description ──────────────────────────────────────────────────
  meta: {
    elementor: {
      heading: "Elementor + SEO-Plugin — Schritt für Schritt:",
      steps: [
        "Yoast SEO / RankMath aktivieren.",
        "Seite im Backend bearbeiten → SEO-Box öffnen.",
        "Feld 'Meta-Description': 120–155 Zeichen, einladend formuliert.",
        "Snippet-Preview zeigt das Suchergebnis.",
      ],
    },
    divi: {
      heading: "Divi + SEO-Plugin — Schritt für Schritt:",
      steps: [
        "SEO-Plugin (Yoast / RankMath) aktivieren.",
        "Seite im Backend-Editor öffnen → SEO-Box → 'Meta-Description' setzen.",
        "120–155 Zeichen, mit Call-to-Action.",
      ],
    },
    gutenberg: {
      heading: "Gutenberg + SEO-Plugin — Schritt für Schritt:",
      steps: [
        "Yoast / RankMath im Editor öffnen.",
        "Feld 'Meta-Description' befüllen, 120–155 Zeichen.",
        "Vorschau prüfen — sollte das Wertversprechen der Seite klar machen.",
      ],
    },
    wordpress: {
      heading: "WordPress — Schritt für Schritt:",
      steps: [
        "Yoast / RankMath / SEOPress installieren.",
        "Pro Seite eine eindeutige Meta-Description setzen.",
        "Standard-Snippet wäre der Anfang des Inhalts — meist nicht optimal.",
      ],
    },
  },

  // ─── Noindex ─────────────────────────────────────────────────────────────
  noindex: {
    wordpress: {
      heading: "WordPress — Schritt für Schritt:",
      steps: [
        "Einstellungen → Lesen → 'Suchmaschinen davon abhalten, diese Website zu indexieren' DEAKTIVIEREN.",
        "In Yoast / RankMath pro Seite: SEO-Box → 'Erweitert' → 'Roboter-Anweisung' = 'Index'.",
        "Achtung: nur deaktivieren, wenn die Seite öffentlich auffindbar sein soll.",
      ],
    },
  },

  // ─── 404 / Tote Links ────────────────────────────────────────────────────
  "404": {
    wordpress: {
      heading: "WordPress — Schritt für Schritt:",
      steps: [
        "Plugin 'Redirection' installieren.",
        "Werkzeuge → Redirection → 'Quell-URL' (alte 404-Seite) → 'Ziel-URL' (nächstbeste Seite) eingeben → Code 301.",
        "Alternative: Seite neu erstellen oder Backup einspielen, falls sie versehentlich gelöscht wurde.",
        "Alle internen Links auf die alte URL aktualisieren — das WP-Plugin 'Better Search Replace' hilft bei Massenänderungen.",
      ],
    },
  },

  // ─── Form-Labels ─────────────────────────────────────────────────────────
  label: {
    elementor: {
      heading: "Elementor Form-Widget — Schritt für Schritt:",
      steps: [
        "Seite mit dem Formular im Elementor öffnen.",
        "Formular-Widget anklicken → Tab Inhalt → 'Felder'.",
        "Pro Feld: 'Label' eintragen ('Telefonnummer', 'E-Mail-Adresse').",
        "Optional 'Label ausblenden' DEAKTIVIEREN — das Label muss sichtbar oder zumindest aria-label-aktiv sein.",
        "Speichern.",
      ],
      note: "Placeholder-Text reicht NICHT — er verschwindet beim Tippen und Screen-Reader ignorieren ihn.",
    },
    divi: {
      heading: "Divi Contact-Form — Schritt für Schritt:",
      steps: [
        "Modul Kontaktformular auswählen → Modul-Einstellungen.",
        "Tab Inhalt → Feldliste → pro Feld 'Feldname' → Label eintragen.",
        "Tab Erweitert → 'Sichtbarkeit Label' = sichtbar.",
      ],
    },
    gutenberg: {
      heading: "Gutenberg + Form-Plugin — Schritt für Schritt:",
      steps: [
        "Mit Contact Form 7 / WPForms / Gravity Forms: Plugin-Dashboard öffnen.",
        "Formular bearbeiten → Feld auswählen → 'Feld-Label' eintragen.",
        "Bei eigenem HTML-Code: <label for=\"feld-id\">Label</label> vor jedem Input setzen.",
      ],
    },
    wordpress: {
      heading: "WordPress — Schritt für Schritt:",
      steps: [
        "Bei Contact Form 7: Formular → Editor → vor jedem [text]/[email] ein <label>-Tag setzen.",
        "Bei WPForms / Gravity Forms: Felder im UI-Builder bearbeiten → Label-Feld ausfüllen.",
        "Für eingebettete <input>-Tags: aria-label='...' Attribut setzen.",
      ],
    },
  },

  // ─── Buttons ohne Text ───────────────────────────────────────────────────
  button: {
    elementor: {
      heading: "Elementor Button — Schritt für Schritt:",
      steps: [
        "Button-Widget anklicken.",
        "Tab Inhalt → Feld 'Text' befüllen ('Jetzt Termin buchen', 'Mehr erfahren').",
        "Bei reinen Icon-Buttons: Tab Erweitert → 'Eigene Attribute' → 'aria-label|Beschreibung' hinzufügen.",
      ],
    },
    wordpress: {
      heading: "WordPress — Schritt für Schritt:",
      steps: [
        "Buttons im Editor öffnen → sichtbaren Text einfügen.",
        "Reine Icon-Buttons brauchen aria-label='Beschreibung der Aktion' im Code-Editor.",
        "Beispiel: <button aria-label='Menü öffnen'><svg ...></svg></button>",
      ],
    },
  },

  // ─── WordPress veraltet ─────────────────────────────────────────────────
  wp_outdated: {
    wordpress: {
      heading: "WordPress aktualisieren — Schritt für Schritt:",
      steps: [
        "Backup erstellen (UpdraftPlus / All-in-One WP Migration).",
        "WP-Admin → Dashboard → Updates → 'Jetzt aktualisieren'.",
        "Nach dem Update: Plugins + Theme einzeln aktualisieren.",
        "Site testen: Frontend, Login, Forms, Checkout.",
      ],
      note: "Bei großen Versionen-Sprüngen (z.B. 5.x → 6.x): erst auf Staging testen.",
    },
  },

  // ─── Login-Sicherheit ────────────────────────────────────────────────────
  wp_login: {
    wordpress: {
      heading: "WordPress-Login absichern — Schritt für Schritt:",
      steps: [
        "Plugin 'WPS Hide Login' installieren → Login-URL umbenennen (z.B. /mein-login).",
        "Plugin 'Limit Login Attempts Reloaded' installieren → max 5 Versuche pro IP.",
        "Zwei-Faktor-Authentisierung (Wordfence Login Security) aktivieren.",
        "Standard-Username 'admin' umbenennen, falls noch vorhanden.",
      ],
    },
  },

  // ─── XML-RPC ─────────────────────────────────────────────────────────────
  xmlrpc: {
    wordpress: {
      heading: "XML-RPC abschalten — Schritt für Schritt:",
      steps: [
        "Plugin 'Disable XML-RPC' installieren und aktivieren.",
        "Alternative: in der .htaccess folgenden Block einfügen: <Files xmlrpc.php> Order Allow,Deny\\nDeny from all </Files>.",
        "Nur deaktivieren, wenn KEINE App (Jetpack-App, IFTTT, alte Pingbacks) xmlrpc nutzt.",
      ],
    },
  },

  // ─── SSL ─────────────────────────────────────────────────────────────────
  ssl: {
    wordpress: {
      heading: "SSL aktivieren / verlängern — Schritt für Schritt:",
      steps: [
        "Hosting-Kontrollpanel öffnen (cPanel / Plesk / Hosting-Kunde-Login).",
        "Bereich SSL/TLS → Let's Encrypt-Zertifikat ausstellen oder verlängern.",
        "Im WP-Admin: Einstellungen → Allgemein → 'Site-URL' und 'Adresse (URL)' auf https:// umstellen.",
        "Plugin 'Really Simple SSL' aktivieren — fixt mixed-content automatisch.",
      ],
    },
  },

  // ─── Cart-Fragments (WooCommerce) ───────────────────────────────────────
  cart_fragments: {
    wordpress: {
      heading: "WooCommerce — Cart-Fragments-Performance:",
      steps: [
        "Plugin 'Disable Cart Fragments' installieren — verhindert das AJAX-Polling auf Nicht-Shop-Seiten.",
        "Alternativ: über functions.php das wc-cart-fragments-Script auf allen Nicht-Shop-Seiten dequeuen.",
        "Cache-Plugin (WP Rocket / LiteSpeed Cache) so konfigurieren, dass cart-fragments nicht in den Cache wandern.",
      ],
      note: "Cart-Fragments sind das #1-WooCommerce-Performance-Problem — kann TTI um 1–2s drücken.",
    },
  },

  // ─── Google Fonts ────────────────────────────────────────────────────────
  google_fonts: {
    wordpress: {
      heading: "Google Fonts DSGVO-konform & schnell:",
      steps: [
        "Plugin 'OMGF (Optimize My Google Fonts)' installieren.",
        "Settings → 'Detect Fonts' starten → Plugin lädt Schriften lokal herunter.",
        "Toggle 'Auto-Replace' aktivieren → Schriften werden vom eigenen Server geladen.",
        "DSGVO: keine IP-Adressen mehr an Google.",
      ],
    },
  },

  // ─── DOM-Tiefe (Builder-Bloat) ──────────────────────────────────────────
  dom_depth: {
    elementor: {
      heading: "Elementor — DOM-Tiefe reduzieren:",
      steps: [
        "Per-Seite checken: Elementor → Bearbeiten → Sektionen mit verschachtelten Spalten/Inner-Sections aufdröseln.",
        "Unnötige Innere Sektionen entfernen: 1 Sektion + 1 Spalte reicht oft, wo aktuell 3 Ebenen stehen.",
        "Plugin 'Elementor Cleaner' kann ungenutzte CSS-Klassen + DOM-Bloat reduzieren.",
        "Bei sehr alten Seiten: Einstellungen → Erweitert → 'Optimized DOM Output' aktivieren.",
      ],
    },
    divi: {
      heading: "Divi — DOM-Tiefe reduzieren:",
      steps: [
        "Theme-Optionen → Builder → Erweitert → 'Optimized Static CSS' + 'Critical CSS' aktivieren.",
        "Pro Seite: tiefe Verschachtelungen (Section → Row → Column → Module → Inner) auf max. 4 Ebenen reduzieren.",
        "Plugin 'Divi Booster' bietet weitere DOM-/CSS-Optimierungen.",
      ],
    },
    wordpress: {
      heading: "Theme-Optimierung — DOM-Tiefe reduzieren:",
      steps: [
        "Mit dem aktuellen Builder/Theme: tiefe Verschachtelungen (>5 Ebenen <div>) flach machen.",
        "Wenn das Theme-eigene Render veraltet ist: Wechsel auf ein modernes, leichtgewichtiges Theme (Astra, GeneratePress, Kadence) erwägen.",
      ],
    },
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Holt die Fix-Anleitung für (kind, cms_context). Fallback-Reihenfolge:
 *   1. exakter Match (kind, cms)
 *   2. Match (kind, "wordpress")
 *   3. null
 *
 * Damit ist garantiert: solange ein Issue-Kind im GUIDES-Mapping existiert,
 * bekommt der User mindestens die WP-Klassik-Anleitung. Wenn das Issue-Kind
 * komplett fehlt (z.B. neuer Issue-Typ ohne Mapping), bekommt er null —
 * UI rendert dann den generischen Fallback-Text.
 */
export function getFixGuide(
  kind: FixIssueKind | string | null,
  cmsContext: CmsContext | string | null,
): FixGuide | null {
  if (!kind) return null;
  const kindEntry = GUIDES[kind as FixIssueKind];
  if (!kindEntry) return null;

  // Versuche 1: exakter CMS-Match
  if (cmsContext && typeof cmsContext === "string") {
    const ctx = cmsContext.toLowerCase() as CmsContext;
    const direct = kindEntry[ctx];
    if (direct) return direct;
  }

  // Versuche 2: Fallback auf "wordpress"-Eintrag
  return kindEntry.wordpress ?? null;
}

/**
 * Liefert das CMS-Label für UI-Anzeige ("Elementor", "Divi", …).
 * Lowercase-Input, TitleCase-Output.
 */
export function cmsContextLabel(cmsContext: string | null): string {
  if (!cmsContext) return "WordPress";
  const map: Record<string, string> = {
    elementor: "Elementor",
    divi:      "Divi",
    gutenberg: "Gutenberg",
    astra:     "Astra",
    wpbakery:  "WPBakery",
    beaver:    "Beaver Builder",
    wordpress: "WordPress (Klassisch)",
  };
  return map[cmsContext.toLowerCase()] ?? cmsContext;
}
