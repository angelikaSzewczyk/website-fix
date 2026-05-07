-- ════════════════════════════════════════════════════════════════════════════
-- Premium-Guide-Content-Update (07.05.2026) — separat ausführbar in Neon
-- ════════════════════════════════════════════════════════════════════════════
-- Erweitert die drei rescue_guides um die 3-Säulen-Premium-Struktur:
--   - tldr            (2-Satz-Zusammenfassung in lila/gold-Box)
--   - pillars         (band_aid / diagnosis / pro_tools)
--   - not_solved      (Notfall-Fallschirm-Sektion am Ende)
--   - psychological_close (Pro-Upsell-Close vor der Checkliste)
--   - screenshot_url + screenshot_alt pro Step (Placeholder bei null)
--
-- Plus: Hoster-Variants nachgezogen für google-visibility und
-- wp-critical-error (vorher hatten nur hosting-speed welche).
--
-- Idempotent — Re-Runs überschreiben einfach mit dem aktuellen Content.
-- Keine Schema-Änderungen, nur UPDATEs auf content_json.

-- ────────────────────────────────────────────────────────────────────────────
-- 1) hosting-speed
-- ────────────────────────────────────────────────────────────────────────────
UPDATE rescue_guides SET content_json = $${
  "tldr": "Dein Server antwortet zu langsam — meist liegt es an PHP < 8.2 oder fehlendem Caching. Diese Anleitung halbiert deine Antwortzeit in 5 Minuten, egal welcher Hoster.",
  "intro": "Antwortzeit über 800 ms killt Conversion und Google-Ranking. In 95 % der Fälle reichen drei Stellschrauben: aktuelle PHP-Version, ein Caching-Plugin und GZIP-Kompression.",
  "pillars": {
    "band_aid": {
      "title": "Sofort-Fix · Site jetzt schneller machen",
      "steps": [
        {
          "title": "WP-Caching-Plugin installieren",
          "body": "WordPress-Backend → Plugins → Installieren → WP Super Cache suchen → Installieren → Aktivieren. Dann unter Einstellungen → WP Super Cache → Caching-Status auf ON. Halbiert die Antwortzeit binnen 30 Sekunden.",
          "screenshot_url": null,
          "screenshot_alt": "WordPress-Plugin-Suche mit WP Super Cache Ergebnis und Aktivieren-Button",
          "screenshot": null
        },
        {
          "title": "GZIP-Kompression via .htaccess aktivieren",
          "body": "Per FTP / File-Manager .htaccess im WP-Root öffnen. Den nachfolgenden Block vor # BEGIN WordPress einfügen. Spart 60-80 % Bandbreite.",
          "screenshot_url": null,
          "screenshot_alt": ".htaccess-Datei mit eingefügtem mod_deflate-Block, sichtbar in einem File-Editor",
          "screenshot": null,
          "code": {
            "language": "apache",
            "snippet": "<IfModule mod_deflate.c>\n  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json\n  AddOutputFilterByType DEFLATE application/xml text/xml image/svg+xml\n</IfModule>"
          }
        },
        {
          "title": "PHP-Version auf 8.2+ wechseln",
          "body": "Im Hoster-Backend PHP-Version-Wechsel suchen → 8.2 wählen → Speichern. Allein der Wechsel von PHP 7.4 → 8.2 bringt 30-50 % schnellere Skript-Laufzeit, ohne Code-Änderung.",
          "screenshot_url": null,
          "screenshot_alt": "Hoster-Panel mit PHP-Versions-Dropdown, 8.2 ausgewählt",
          "screenshot": null
        }
      ]
    },
    "diagnosis": {
      "title": "Warum das passiert ist",
      "body": "Drei Hauptursachen verlangsamen WordPress-Sites: (1) Veraltete PHP-Version — vor PHP 8 ist der Interpreter messbar langsamer. (2) Kein Caching — bei jedem Page-Load werden Datenbank-Queries neu ausgeführt, statt einmalig in HTML gerendert. (3) Unkomprimierte Assets — HTML/CSS/JS gehen in voller Größe übers Netz, obwohl sie 70 % kleiner sein könnten.",
      "plugin_hint": "Wir vermuten basierend auf dem externen Scan, dass es bei dir eine Kombination dieser drei Faktoren ist. Mit dem Read-Only-Plugin sehen wir den exakten memory_limit-Wert, die aktive PHP-Version und die Slow-Query-Anzahl — keine Vermutung mehr."
    },
    "pro_tools": {
      "title": "Profi-Skripte · Senior-Dev-Toolset",
      "items": [
        {
          "label": "OPcache-Status checken (PHP-Konsole oder phpinfo.php)",
          "language": "php",
          "code": "<?php\nif (function_exists('opcache_get_status')) {\n  $s = opcache_get_status();\n  echo 'OPcache aktiv: ' . ($s['opcache_enabled'] ? 'ja' : 'nein') . \"\\n\";\n  echo 'Hit-Rate: ' . round($s['opcache_statistics']['opcache_hit_rate'], 2) . \" %\\n\";\n  echo 'Memory used: ' . round($s['memory_usage']['used_memory'] / 1024 / 1024, 1) . \" MB\\n\";\n} else { echo 'OPcache nicht installiert.'; }",
          "note": "OPcache cached den kompilierten PHP-Bytecode. Hit-Rate < 95 % deutet auf zu kleine memory_consumption hin."
        },
        {
          "label": "MySQL Slow-Queries der letzten 7 Tage finden",
          "language": "sql",
          "code": "SELECT \n  SUBSTRING(sql_text, 1, 80) AS query,\n  query_time,\n  rows_examined\nFROM mysql.slow_log\nWHERE start_time > NOW() - INTERVAL 7 DAY\nORDER BY query_time DESC\nLIMIT 10;",
          "note": "Nur möglich wenn slow_query_log = ON. Identifiziert die teuersten DB-Abfragen — meistens Plugin-Verursacher."
        },
        {
          "label": "Browser-Caching via Expires-Headers (.htaccess)",
          "language": "apache",
          "code": "<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType image/jpg              \"access plus 1 year\"\n  ExpiresByType image/png              \"access plus 1 year\"\n  ExpiresByType image/webp             \"access plus 1 year\"\n  ExpiresByType text/css               \"access plus 1 month\"\n  ExpiresByType application/javascript \"access plus 1 month\"\n</IfModule>",
          "note": "Wiederbesucher laden nur HTML neu, nicht alle Bilder/Fonts."
        }
      ]
    }
  },
  "variants": {
    "default": {
      "steps": [
        { "title": "PHP-Version prüfen",   "body": "Veraltete PHP-Versionen sind oft 30-50 % langsamer. Update auf PHP 8.2+.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "PHP-Versions-Wahl im Hoster-Backend" },
        { "title": "GZIP/Brotli aktivieren","body": "Komprimiert HTML/CSS/JS um 60-80 %.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "GZIP-Konfiguration in .htaccess" },
        { "title": "Caching konfigurieren", "body": "Plugin wie WP Rocket oder W3 Total Cache aktivieren.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Caching-Plugin-Settings" },
        { "title": "Bilder optimieren",     "body": "WebP + lazy-loading reduzieren Bandbreite um Faktor 3-5.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Bild-Optimizer-Plugin" },
        { "title": "DNS-TTL anpassen",      "body": "Niedrige TTL für schnelle Updates, hohe TTL für Performance.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "DNS-Records mit TTL-Spalte" }
      ]
    },
    "strato": {
      "steps": [
        { "title": "Strato-Login öffnen", "body": "https://www.strato.de/apps/CustomerService — mit Kunden-ID + Master-Passwort einloggen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato-Login-Maske" },
        { "title": "PHP-Version-Wechsel", "body": "Hosting → Domain auswählen → PHP-Version → 8.2 wählen → Speichern. Wirksam binnen 1-2 Min.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato Hosting-Verwaltung mit PHP-Dropdown" },
        { "title": "GZIP via .htaccess", "body": "Im File-Manager .htaccess editieren, mod_deflate-Block aus dem Sofort-Fix oben einfügen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato File-Manager mit .htaccess-Datei" }
      ]
    },
    "ionos": {
      "steps": [
        { "title": "IONOS Cloud-Panel öffnen", "body": "Login via https://login.ionos.de — auf Hosting & Domains → entsprechendes Hosting-Paket auswählen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Cloud-Panel-Übersicht" },
        { "title": "PHP-Version anpassen", "body": "Im Hosting-Paket PHP-Einstellungen → Version 8.2 wählen → OPcache aktivieren-Haken setzen → Speichern.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS PHP-Einstellungen-Dialog" },
        { "title": "Performance-Modus aktivieren", "body": "Im Performance-Bereich High-Performance-Cache aktivieren — IONOS-spezifisches Caching auf Server-Ebene.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Performance-Tab mit Cache-Toggle" }
      ]
    },
    "all-inkl": {
      "steps": [
        { "title": "All-Inkl-KAS öffnen", "body": "https://kas.all-inkl.com — Login mit Kunden-ID + Passwort. KAS = Kunden-Administrations-System.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl KAS-Login" },
        { "title": "PHP-Version-Auswahl", "body": "KAS → Domain → PHP-Version → PHP 8.2 (FastCGI) wählen. Wichtig: FastCGI (nicht CGI), das ist signifikant schneller.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl PHP-Version-Auswahl mit FastCGI-Hinweis" },
        { "title": "OPcache-Settings prüfen", "body": "KAS → Tools → PHP-OPcache aktivieren. Hilft besonders bei Builder-Themes.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl OPcache-Konfiguration" }
      ]
    },
    "hostinger": {
      "steps": [
        { "title": "Hostinger hPanel öffnen", "body": "https://hpanel.hostinger.com — auf der Startseite die betroffene Website-Card anklicken.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger hPanel-Übersicht" },
        { "title": "PHP-Konfiguration", "body": "Erweitert → PHP-Konfiguration → Version: 8.2 → unten Erweiterungen → opcache aktivieren → Speichern.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger PHP-Konfiguration mit OPcache-Checkbox" },
        { "title": "LiteSpeed-Cache aktivieren", "body": "Plugins-Tab → LiteSpeed Cache installieren (falls nicht vorinstalliert) → in WordPress aktivieren. Hostinger nutzt LiteSpeed-Server, das Plugin ist optimal abgestimmt.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "LiteSpeed Cache-Plugin im WordPress-Plugin-Bereich" }
      ]
    }
  },
  "checklist": [
    { "id": "php-update",   "text": "PHP-Version auf 8.2 oder höher aktualisiert" },
    { "id": "gzip",         "text": "GZIP/Brotli-Kompression aktiviert" },
    { "id": "cache",        "text": "Caching-Plugin installiert und konfiguriert" },
    { "id": "images",       "text": "Bilder zu WebP konvertiert, lazy-loading aktiv" },
    { "id": "dns-ttl",      "text": "DNS-TTL geprüft und angepasst" }
  ],
  "not_solved": {
    "title": "Immer noch nicht gelöst?",
    "body": "Manche Hoster-Konfigurationen haben Custom-Setups (Cloudflare-Worker, eigene Redis-Layer, custom Nginx-Configs). Wenn die drei Sofort-Fixes oben keine Verbesserung bringen, kopiere deinen Scan-Report aus dem Dashboard und sende ihn an support@website-fix.com — Antwort innerhalb von 24 h. Pro-Plan-Kunden nutzen den Priority-Chat (Antwort < 4 h)."
  },
  "psychological_close": "Dieser Speed-Fix wurde einmalig durchgezogen. Damit dein Hosting nie wieder bremst — und du nicht jedes Quartal wieder hier landest — übernimmt der Professional-Plan das Monitoring: tägliche TTFB-Messung, Alerts bei > 800 ms, Trend-Charts über 90 Tage. Ab 89 €/Monat."
}$$::jsonb
WHERE id = 'hosting-speed';

-- ────────────────────────────────────────────────────────────────────────────
-- 2) google-visibility
-- ────────────────────────────────────────────────────────────────────────────
UPDATE rescue_guides SET content_json = $${
  "tldr": "Google findet deine Seite nicht — fast immer wegen einer falsch gesetzten Indexierungs-Einstellung oder eines noindex-Tags. Diese 5-Punkte-Diagnose findet die Ursache in 10 Minuten.",
  "intro": "Wenn deine Seite nicht in der Google-Suche erscheint, liegt es fast nie am Content. Es liegt an einer von fünf Konfigurations-Stellen, die Google die Indexierung blockieren. Wir gehen sie der Reihe nach durch.",
  "pillars": {
    "band_aid": {
      "title": "Sofort-Fix · Indexierung freischalten",
      "steps": [
        {
          "title": "WordPress-Suchmaschinen-Block deaktivieren",
          "body": "WordPress-Backend → Einstellungen → Lesen. Wenn der Haken bei Suchmaschinen davon abhalten, diese Website zu indexieren gesetzt ist — sofort entfernen → Speichern. Das ist der häufigste Killer und wird bei der WordPress-Installation oft als Schutz gesetzt und vergessen.",
          "screenshot_url": null,
          "screenshot_alt": "WordPress-Einstellungen Lesen mit hervorgehobenem Suchmaschinen-Block-Haken",
          "screenshot": null
        },
        {
          "title": "robots.txt prüfen",
          "body": "Im Browser https://deine-seite.de/robots.txt direkt aufrufen. Wenn dort Disallow: / steht — STOP, das blockiert Google komplett. Lösung: bei WordPress siehe Schritt 1; bei statischen Seiten die robots.txt-Datei im Webspace-Root suchen und Disallow: / zu Allow: / ändern (oder Zeile entfernen).",
          "screenshot_url": null,
          "screenshot_alt": "Browser-View der robots.txt mit hervorgehobener Disallow-Zeile",
          "screenshot": null,
          "code": {
            "language": "text",
            "snippet": "User-agent: *\nAllow: /\nSitemap: https://deine-seite.de/sitemap.xml"
          }
        },
        {
          "title": "Indexierung in der Google Search Console beantragen",
          "body": "Search Console öffnen → links URL-Prüfung → URL deiner Startseite eingeben → Indexierung beantragen. Beschleunigt die Wieder-Erfassung von 1-2 Wochen auf 1-2 Tage.",
          "screenshot_url": null,
          "screenshot_alt": "Google Search Console URL-Prüfung mit Indexierung beantragen-Button",
          "screenshot": null
        }
      ]
    },
    "diagnosis": {
      "title": "Warum das passiert ist",
      "body": "Fünf Stellen können Google blockieren — du musst alle prüfen, eine reicht: (1) WordPress-Suchmaschinen-Block aus der Einstellungen → Lesen. (2) robots.txt mit Disallow: /. (3) noindex-Meta-Tag im HTML-Head. (4) Sitemap nicht eingereicht. (5) Falsch gesetzter Canonical auf eine andere URL. Google entdeckt deine Seite, sieht eine dieser Sperren und überspringt sie. Bis zum nächsten Crawl (kann Monate dauern) bleibst du unsichtbar.",
      "plugin_hint": "Mit dem Read-Only-Plugin können wir prüfen, ob auf jeder einzelnen Seite (nicht nur der Startseite) ein noindex-Tag gesetzt ist — und in welchem WordPress-SEO-Plugin (Yoast / Rank Math) der Wert herkommt. Externer Scan sieht nur die Startseite."
    },
    "pro_tools": {
      "title": "Profi-Skripte · Senior-Dev-Toolset",
      "items": [
        {
          "label": "Sitemap programmatisch an Google submitten (curl)",
          "language": "bash",
          "code": "# Submit sitemap directly to Google\ncurl \"https://www.google.com/ping?sitemap=https://deine-seite.de/sitemap.xml\"\n\n# Bing parallel (oft vergessen, hilft aber)\ncurl \"https://www.bing.com/ping?sitemap=https://deine-seite.de/sitemap.xml\"",
          "note": "Inoffizieller Ping-Endpoint — für offizielles Tracking trotzdem in Search Console einreichen."
        },
        {
          "label": "Alle indexierten Seiten via site:-Operator zählen",
          "language": "bash",
          "code": "# Im Browser eingeben — Google zeigt geschätzten Index-Stand\nsite:deine-seite.de\n\n# Spezifisch nach unsichtbaren Seiten\nsite:deine-seite.de inurl:kontakt OR inurl:impressum",
          "note": "Wenn Google 0 Treffer zeigt: keine einzige Seite ist indexiert. < 5: starke Blockade."
        },
        {
          "label": "noindex-Header per .htaccess setzen oder entfernen",
          "language": "apache",
          "code": "# noindex GLOBAL entfernen (falls per Header gesetzt war):\n<IfModule mod_headers.c>\n  Header unset X-Robots-Tag\n</IfModule>\n\n# Nur bestimmte Pfade indexieren lassen:\n<FilesMatch \"\\.(html|php)$\">\n  Header set X-Robots-Tag \"index, follow\"\n</FilesMatch>",
          "note": "Server-seitiger noindex via Header ist häufiger als gedacht. Wird oft vom Hoster bei Staging-Sites gesetzt und vergessen beim Go-Live."
        }
      ]
    }
  },
  "variants": {
    "default": {
      "steps": [
        { "title": "Schritt 1 — Google Search Console einrichten", "body": "https://search.google.com/search-console — Property hinzufügen, URL-Präfix wählen, Eigentum via HTML-Tag-Methode bestätigen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Search Console Property-Hinzufügen-Wizard" },
        { "title": "Schritt 2 — robots.txt prüfen", "body": "https://deine-seite.de/robots.txt im Browser öffnen — Disallow: / killt alles.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "robots.txt im Browser geöffnet" },
        { "title": "Schritt 3 — Sitemap.xml einreichen", "body": "Yoast/Rank-Math-Plugin generiert sie automatisch. In Search Console links Sitemaps → URL eintragen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Search Console Sitemap-Einreichung" },
        { "title": "Schritt 4 — noindex-Tags entfernen", "body": "Yoast/Rank-Math pro Seite öffnen → SEO-Box → Suchergebnisse anzeigen: JA.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Yoast SEO-Box mit Indexierungs-Toggle" },
        { "title": "Schritt 5 — Title + Meta-Description prüfen", "body": "Pro Seite eindeutigen Title (max 60 Zeichen) + Meta-Description (max 155 Zeichen) eintragen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Yoast SEO-Snippet-Vorschau mit Title + Meta-Description" }
      ]
    },
    "strato": {
      "steps": [
        { "title": "Strato-Login + Domain-Verwaltung", "body": "https://www.strato.de/apps/CustomerService → Kunden-ID + Master-Passwort. Im linken Menü Domains → entsprechende Domain anklicken.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato Domain-Übersicht" },
        { "title": "DNS-Records prüfen", "body": "Domain → Erweitert → DNS-Verwaltung. A-Record auf richtige IP, www-CNAME auf Hauptdomain. Falsche DNS = Google sieht 404.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato DNS-Records-Tabelle mit A-Record und CNAME" },
        { "title": "Robots-Header per Strato-Webspace deaktivieren", "body": "Webspace-Verwaltung → Datei-Manager → .htaccess editieren → wenn dort Header set X-Robots-Tag \"noindex\" steht: Zeile entfernen + Speichern.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato File-Manager mit .htaccess-Editor" }
      ]
    },
    "ionos": {
      "steps": [
        { "title": "IONOS Login + Domain-Center", "body": "https://login.ionos.de → Domains & SSL → entsprechende Domain auswählen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Domains-Center" },
        { "title": "DNS-Einstellungen prüfen", "body": "Domain → DNS → Records-Tabelle. A-Record + CNAME für www müssen korrekt sein. Fehlerhafte CNAME-Records sind häufige IONOS-Fehlerquelle.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS DNS-Records-Editor" },
        { "title": "Hosting → Schutz-Modus prüfen", "body": "Hosting → entsprechender Tarif → Erweitert. Falls Wartungsmodus oder Passwort-Schutz aktiv ist: deaktivieren — Google kann sonst nicht crawlen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Hosting Erweiterte Einstellungen mit Wartungsmodus-Toggle" }
      ]
    },
    "all-inkl": {
      "steps": [
        { "title": "All-Inkl-KAS Login", "body": "https://kas.all-inkl.com → Kunden-ID + Passwort.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl KAS-Login-Maske" },
        { "title": "Domain-Einstellungen prüfen", "body": "KAS → Domain → entsprechende Domain. Reiter SSL-Schutz + Verzeichnisschutz: beide auf KEIN Verzeichnisschutz, sonst kann Google nicht crawlen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl Domain-Einstellungen Verzeichnisschutz-Tab" },
        { "title": "Webspace .htaccess editieren", "body": "KAS → Tools → Datei-Manager → public_html/.htaccess öffnen. Wenn X-Robots-Tag oder Disallow-Anweisungen drin sind, entfernen + Speichern.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl File-Manager mit geöffneter .htaccess" }
      ]
    },
    "hostinger": {
      "steps": [
        { "title": "Hostinger hPanel + Website-Bereich", "body": "https://hpanel.hostinger.com → entsprechende Website-Card klicken.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger hPanel Website-Card" },
        { "title": "Domain-DNS-Zone prüfen", "body": "Domain → DNS / Nameserver → DNS-Zonen-Editor. A-Record und CNAME für www müssen aktiv sein. Alte Hostinger-DNS-Templates haben manchmal fehlerhafte CNAMEs.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger DNS-Zonen-Editor mit Records-Tabelle" },
        { "title": "Coming-Soon-Page deaktivieren", "body": "Website → Erweitert → Maintenance Mode / Coming Soon. Falls aktiv: deaktivieren. Hostinger zeigt sonst eine Platzhalter-Seite, die Google indexiert statt deiner echten Inhalte.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger Maintenance-Mode-Toggle" }
      ]
    }
  },
  "checklist": [
    { "id": "search-console", "text": "Google Search Console eingerichtet und Besitz bestätigt" },
    { "id": "robots-txt",     "text": "robots.txt blockiert Google nicht" },
    { "id": "sitemap",        "text": "Sitemap.xml in Search Console eingereicht und akzeptiert" },
    { "id": "noindex",        "text": "Keine noindex-Tags auf wichtigen Seiten" },
    { "id": "titles-metas",   "text": "Title-Tag und Meta-Description pro Seite eindeutig befüllt" }
  ],
  "not_solved": {
    "title": "Immer noch nicht gelöst?",
    "body": "Manche Sites haben Sonderfälle: JavaScript-Frameworks ohne SSR (React/Vue ohne Next.js), Cloudflare-Bot-Protection blockt Googlebot, Geo-Targeting falsch gesetzt. Wenn die drei Sofort-Fixes oben + die Hoster-Schritte nicht greifen, kopiere deinen Scan-Report aus dem Dashboard und sende ihn an support@website-fix.com — Antwort < 24 h. Pro-Plan: Priority-Chat < 4 h."
  },
  "psychological_close": "Diese Indexierungs-Sperre wurde einmalig gefixt. Damit Google nie wieder eine Seite übersieht, monitort der Professional-Plan automatisch: tägliche Index-Coverage-Prüfung in Search Console, Alert bei neuen noindex-Tags, robots.txt-Diff-Tracking. Ab 89 €/Monat."
}$$::jsonb
WHERE id = 'google-visibility';

-- ────────────────────────────────────────────────────────────────────────────
-- 3) wp-critical-error
-- ────────────────────────────────────────────────────────────────────────────
UPDATE rescue_guides SET content_json = $${
  "tldr": "Weiße Seite oder Es gab einen kritischen Fehler? In 90 % der Fälle ist es ein Plugin-Konflikt nach Update. Diese Anleitung führt dich vom Recovery-Modus bis zur sauberen Wiederherstellung — ohne Code-Wissen.",
  "intro": "Der kritische Fehler hat fast immer eine von drei Ursachen: Plugin-Konflikt nach Update, zu alte PHP-Version, oder ein kaputtes Theme. Wir diagnostizieren das systematisch — beginne mit Schritt 1 und arbeite dich der Reihe nach durch.",
  "pillars": {
    "band_aid": {
      "title": "Sofort-Fix · Site wieder online bringen",
      "steps": [
        {
          "title": "Recovery-Mail prüfen (1 Min)",
          "body": "Schau in dein Admin-Postfach (auch Spam!) nach einer Mail mit Betreff Auf deiner Website [...] gab es ein technisches Problem. Klick den Link in der Mail — das öffnet das Backend im Recovery-Modus, in dem das fehlerhafte Plugin/Theme bereits markiert ist.",
          "screenshot_url": null,
          "screenshot_alt": "Email-Inbox mit WordPress-Recovery-Mail",
          "screenshot": null
        },
        {
          "title": "Alle Plugins via FTP deaktivieren (3 Min)",
          "body": "Wenn du nicht ins Backend kommst: per FTP zu wp-content/plugins/ navigieren. Den ganzen Ordner plugins in plugins_OFF umbenennen. WordPress findet jetzt keine Plugins mehr → Site sollte wieder laden. Dann ins Backend einloggen, Ordner zurück in plugins umbenennen — alle Plugins erscheinen DEAKTIVIERT. Eines nach dem anderen aktivieren bis Site bricht = Schuldiger gefunden.",
          "screenshot_url": null,
          "screenshot_alt": "FileZilla mit umbenanntem plugins_OFF-Ordner",
          "screenshot": null
        },
        {
          "title": "wp-config.php Memory-Limit erhöhen (2 Min)",
          "body": "Per FTP wp-config.php öffnen. Vor der Zeile /* That's all, stop editing! */ folgenden Block einfügen. 90 % aller Memory-Limit-bezogenen Critical-Errors sind damit weg.",
          "screenshot_url": null,
          "screenshot_alt": "wp-config.php-Editor mit hervorgehobenen Memory-Limit-Zeilen",
          "screenshot": null,
          "code": {
            "language": "php",
            "snippet": "define('WP_MEMORY_LIMIT', '256M');\ndefine('WP_MAX_MEMORY_LIMIT', '512M');"
          }
        }
      ]
    },
    "diagnosis": {
      "title": "Warum das passiert ist",
      "body": "Drei Hauptursachen für den kritischen WordPress-Fehler: (1) Plugin-Konflikt nach Update — Plugin A erwartet Funktion X, die in Plugin-B-Update entfernt wurde. (2) PHP-Version-Mismatch — WordPress 6+ braucht PHP 7.4+, alte Plugins brechen unter PHP 8.x. (3) Memory-Exhaustion — gehäuft bei aktiven Buildern (Elementor, Divi) wenn das memory_limit unter 256M liegt. Der White-Screen ist die Folge: PHP scheitert, sendet keinen HTML-Body, Browser zeigt nichts.",
      "plugin_hint": "Mit dem Read-Only-Plugin lesen wir den exakten Fehler aus der wp-content/debug.log + die genaue Plugin-Liste mit Versionen aus. Dann sehen wir nicht nur dass etwas kaputt ist, sondern welche zwei Plugins kollidieren."
    },
    "pro_tools": {
      "title": "Profi-Skripte · Senior-Dev-Toolset",
      "items": [
        {
          "label": "Alle Plugins per SQL deaktivieren (phpMyAdmin)",
          "language": "sql",
          "code": "-- Alle aktiven Plugins in einem Schritt deaktivieren\nUPDATE wp_options\nSET option_value = 'a:0:{}'\nWHERE option_name = 'active_plugins';\n\n-- Wenn dein WP-Prefix abweicht: prefix-Spalten erst checken\nSELECT TABLE_NAME FROM information_schema.tables\nWHERE TABLE_NAME LIKE '%options';",
          "note": "Wirkt sofort — kein FTP nötig. Nach Wiederherstellung Plugins einzeln im Backend reaktivieren."
        },
        {
          "label": "Debug-Log aktivieren + auswerten",
          "language": "php",
          "code": "// In wp-config.php einfügen — ÜBER /* That's all... */\ndefine('WP_DEBUG', true);\ndefine('WP_DEBUG_LOG', true);\ndefine('WP_DEBUG_DISPLAY', false);\ndefine('SCRIPT_DEBUG', true);\n\n// Nach Reproduzieren des Fehlers: wp-content/debug.log öffnen\n// Letzte Zeile zeigt das verursachende Plugin/Theme + Datei + Zeile",
          "note": "Nach erfolgreicher Reparatur unbedingt WP_DEBUG = false zurücksetzen — sonst leakt Pfad-Info im Frontend."
        },
        {
          "label": ".maintenance-Lock entfernen (steckt nach Update)",
          "language": "bash",
          "code": "# Per SSH oder File-Manager\nrm -f /pfad/zu/wordpress/.maintenance\n\n# Falls per FTP: Datei .maintenance im WP-Root suchen + löschen\n# Sie wird beim Update angelegt und manchmal nicht entfernt — Site\n# zeigt dann Briefly Unavailable for Scheduled Maintenance",
          "note": "Häufiges Symptom nach Plugin-Update-Crash: Site zeigt Maintenance-Page obwohl kein Update mehr läuft."
        }
      ]
    }
  },
  "variants": {
    "default": {
      "steps": [
        { "title": "Schritt 1 — Recovery-Mail prüfen", "body": "Im Admin-Postfach nach WordPress-Recovery-Mail suchen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Email-Inbox mit WP-Recovery-Mail" },
        { "title": "Schritt 2 — Debug-Log aktivieren", "body": "WP_DEBUG-Konstanten in wp-config.php setzen, dann debug.log auswerten.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "wp-config.php mit WP_DEBUG-Flags" },
        { "title": "Schritt 3 — Plugins via FTP deaktivieren", "body": "wp-content/plugins-Ordner umbenennen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "FTP-Client mit plugins-Ordner" },
        { "title": "Schritt 4 — Theme zurücksetzen", "body": "Auf Standard-Theme (Twenty Twenty-Four) wechseln.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "WordPress Theme-Auswahl" },
        { "title": "Schritt 5 — PHP-Version aktualisieren", "body": "Im Hoster-Backend PHP 8.2 wählen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hoster PHP-Version-Selector" },
        { "title": "Schritt 6 — Backup wiederherstellen", "body": "Letzten gesunden Stand zurückspielen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Backup-Restore-Dialog" }
      ]
    },
    "strato": {
      "steps": [
        { "title": "Strato Backup-Center öffnen", "body": "https://www.strato.de/apps/CustomerService → Hosting → entsprechende Domain → Sicherungen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato Sicherungen-Übersicht" },
        { "title": "Snapshot vor dem Crash auswählen", "body": "Strato hält 14 Tage Snapshots — den letzten gesunden Tag wählen, Wiederherstellen klicken.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato Snapshot-Liste mit Wiederherstellen-Button" },
        { "title": "PHP-Version sicherheitshalber wechseln", "body": "Hosting → PHP-Version → 8.2 nach Wiederherstellung — vermeidet Re-Crash bei Plugin-Inkompatibilität.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato PHP-Versions-Selector" }
      ]
    },
    "ionos": {
      "steps": [
        { "title": "IONOS Backup-Manager", "body": "https://login.ionos.de → Hosting & WordPress → entsprechendes Hosting → Backups.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Backup-Manager-Liste" },
        { "title": "Selektive Wiederherstellung", "body": "IONOS erlaubt Datei-spezifische Restores: nur wp-content/plugins zurückspielen, Datenbank intakt lassen — schneller als Full-Restore.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Selective-Restore-Wizard" },
        { "title": "WordPress-Update via IONOS-Manager", "body": "Hosting → WordPress-Manager → Plugin-Updates auf manuell setzen — verhindert dass IONOS auto-updated und nochmal crasht.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS WordPress-Manager Auto-Update-Toggle" }
      ]
    },
    "all-inkl": {
      "steps": [
        { "title": "All-Inkl Backup-System öffnen", "body": "https://kas.all-inkl.com → Tools → Datensicherung. Manuelle Backups + Auto-Backups der letzten 7 Tage.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl Datensicherung-Übersicht" },
        { "title": "Webspace-Restore", "body": "Backup vor dem Crash auswählen → Wiederherstellen → Webspace-only oder Database+Webspace wählen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl Restore-Optionen" },
        { "title": "PHP-Version für FastCGI prüfen", "body": "KAS → Domain → PHP-Version: 8.2 (FastCGI) sollte gewählt sein. Bei Custom-CGI kann der Crash wieder auftreten.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl PHP-Version mit FastCGI-Variante" }
      ]
    },
    "hostinger": {
      "steps": [
        { "title": "Hostinger Backup-Übersicht", "body": "https://hpanel.hostinger.com → Hosting → Backups. Daily-Backups der letzten 7 Tage automatisch.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger Backups-Liste mit täglichen Snapshots" },
        { "title": "Restore mit Vorschau", "body": "Backup vor dem Crash auswählen → Vorschau anzeigen prüfen → Wiederherstellen. Wichtig: erst Datenbank-only restoren, dann files separat — Hostinger crashed gelegentlich beim Combined-Restore.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger Restore-Dialog mit Vorschau-Option" },
        { "title": "LiteSpeed-Cache nach Restore leeren", "body": "WordPress-Backend → LiteSpeed Cache → Toolbox → Purge All. Sonst zeigt der Browser den alten Crash-State weiter.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "LiteSpeed Cache Purge-All-Button" }
      ]
    }
  },
  "checklist": [
    { "id": "recovery-mail",  "text": "Recovery-Mail im Admin-Postfach geprüft" },
    { "id": "debug-mode",     "text": "WP_DEBUG aktiviert und debug.log ausgewertet" },
    { "id": "plugins-off",    "text": "Plugins via FTP deaktiviert und einzeln getestet" },
    { "id": "theme-default",  "text": "Auf Standard-Theme zurückgewechselt zur Prüfung" },
    { "id": "php-update",     "text": "PHP-Version auf 8.2 aktualisiert" },
    { "id": "backup-restore", "text": "Backup-Wiederherstellung durchgeführt oder ausgeschlossen" }
  ],
  "not_solved": {
    "title": "Immer noch nicht gelöst?",
    "body": "Manche Crashes sind tückisch — Multisite-Konfigurationen, Custom-Loadbalancer-Setups, kompromittierte Themes durch Hack. Wenn die drei Sofort-Fixes + Hoster-Restore-Schritte nicht greifen, kopiere deinen kompletten Fehlerbericht (Recovery-Mail + debug.log-Auszug) und sende ihn an support@website-fix.com — Antwort < 24 h. Pro-Plan-Kunden: Priority-Chat < 4 h, dazu Live-Screenshare-Diagnose."
  },
  "psychological_close": "Dieser kritische Fehler wurde einmalig behoben. Damit er nie wieder kommt: der Professional-Plan überwacht Plugin-Updates 24/7 und alarmiert dich BEVOR ein neues Plugin auf deine Site rollt — staging-test, dann optional auto-rollout. Plus: täglicher Backup-Snapshot mit 1-Klick-Restore. Ab 89 €/Monat."
}$$::jsonb
WHERE id = 'wp-critical-error';

-- ── Trigger nachpflegen für google-visibility (Hoster-Variants brauchen Match-Rules)
INSERT INTO rescue_guide_triggers (guide_id, match_type, match_value, priority) VALUES
  ('google-visibility', 'title_keyword', 'canonical',         110),
  ('google-visibility', 'title_keyword', 'sitemap fehlt',     130)
ON CONFLICT DO NOTHING;

-- ── Verify-Query: schaut ob alle 3 Guides den neuen Schema-Block haben
SELECT
  id,
  content_json ? 'tldr'                AS has_tldr,
  content_json ? 'pillars'             AS has_pillars,
  content_json ? 'not_solved'          AS has_not_solved,
  content_json ? 'psychological_close' AS has_close,
  jsonb_array_length(content_json->'pillars'->'pro_tools'->'items') AS pro_tools_count
FROM rescue_guides
WHERE id IN ('hosting-speed', 'google-visibility', 'wp-critical-error');
