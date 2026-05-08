-- ─────────────────────────────────────────────────────────────────────────────
-- 2026-05-08: Guide-Bibliothek erweitert um 4 neue Premium-Guides
--
-- Neue Guides:
--   1. bfsg-accessibility   — Barrierefreiheit / BFSG-Compliance
--   2. security-hardening   — WordPress-Sicherheits-Härtung
--   3. mobile-performance   — Mobile-Speed & Lighthouse-Score
--   4. dsgvo-compliance     — Cookie-Banner, Tracking, Datenschutz
--
-- Tonalität: Solo-Arzt-Praxis-Stil — zugänglich, keine Senior-Dev-Sprache
-- im Hauptteil. Pro-Tools-Snippets framed als "für deinen Webentwickler".
-- Plugin-Empfehlungen explizit drin (Read-Only-Plugin als Pro-Hint im
-- diagnosis.plugin_hint, Drittanbieter-Plugins im band_aid).
--
-- Idempotent via ON CONFLICT (id) DO UPDATE — Re-Run aktualisiert Inhalt.
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- GUIDE 1: bfsg-accessibility
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO rescue_guides (id, title, problem_label, preview, price_cents,
                           stripe_price_id, estimated_minutes, content_json, active)
VALUES (
  'bfsg-accessibility',
  'Deine Seite barrierefrei machen — BFSG-Pflicht seit 2025',
  'Bilder ohne Alt-Text, Formulare ohne Beschriftung, schlechter Kontrast',
  'Seit dem 28.06.2025 ist Barrierefreiheit für gewerbliche Websites Pflicht (BFSG). Diese Anleitung zeigt dir die drei kritischen Stellen — und wie du sie in 15 Minuten löst, ohne Programmierer.',
  990,
  NULL,
  15,
  $json$
  {
    "tldr": "Seit Juni 2025 müssen gewerbliche Websites in Deutschland barrierefrei sein (BFSG). Die drei häufigsten Probleme — Bilder ohne Beschreibung, Formulare ohne Labels und schwacher Kontrast — beheben wir in 15 Minuten mit zwei kostenlosen Plugins, kein Programmieren nötig.",
    "intro": "Barrierefreiheit klingt kompliziert, ist aber in der Praxis eine kleine Liste konkreter Schritte. Wir gehen die drei wichtigsten Punkte durch, die fast jede Praxis-Website betreffen.",
    "pillars": {
      "band_aid": {
        "title": "Sofort-Fix · die drei wichtigsten Punkte heute lösen",
        "steps": [
          {
            "title": "Plugin „WP Accessibility“ installieren",
            "body": "WordPress-Backend → Plugins → Installieren → Suche „WP Accessibility“ → Installieren → Aktivieren. Das Plugin fügt automatisch Skip-Links, Sprach-Attribute und Tastatur-Fokus-Indikatoren hinzu — drei BFSG-Anforderungen sind damit sofort erfüllt, ohne dass du etwas konfigurieren musst.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "WordPress-Plugin-Suche mit „WP Accessibility“-Ergebnis"
          },
          {
            "title": "Alt-Texte für alle Bilder ergänzen",
            "body": "WordPress-Backend → Medien → Alle Bilder anklicken → unter „Alternativtext“ kurz beschreiben, was zu sehen ist. Beispiel: „Tierärztin untersucht Hund auf Behandlungstisch“ statt „IMG_2034“. Pro Bild 10 Sekunden. Diese Texte werden von Screenreadern vorgelesen und sind BFSG-Pflicht. Tipp: Plugin „Alt Text Saver“ kann dir helfen, fehlende Alt-Texte automatisch zu finden.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "WordPress-Mediathek mit Alt-Text-Eingabefeld"
          },
          {
            "title": "Kontrast prüfen mit „WAVE“",
            "body": "Öffne https://wave.webaim.org/ → URL deiner Seite eingeben → „Contrast Errors“ in der linken Spalte. WAVE markiert genau die Stellen, wo Text auf Hintergrund schwer lesbar ist (z.B. helles Grau auf Weiß). Im WordPress-Customizer (Design → Anpassen → Farben) den Text dunkler oder den Hintergrund heller machen. Faustregel: dunkles Anthrazit (#222) auf Weiß ist immer sicher.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "WAVE-Tool mit Kontrast-Fehler-Übersicht"
          }
        ]
      },
      "diagnosis": {
        "title": "Was du wissen solltest",
        "body": "Das Barrierefreiheitsstärkungsgesetz (BFSG) ist seit dem 28.06.2025 in Kraft und gilt für alle gewerblichen Websites — auch für Praxen, Kanzleien, Handwerker und kleine Online-Shops. Die häufigsten Fallen:\n\n• Bilder ohne Alt-Text — blinde Menschen können nicht erkennen, was darauf zu sehen ist.\n• Formularfelder ohne Beschriftung — Screenreader sagen nur „Eingabefeld“, ohne den Zweck.\n• Kontrast zu schwach — Menschen mit Sehschwäche können den Text nicht lesen.\n• Keine Tastaturbedienbarkeit — wer keine Maus benutzen kann, strandet auf der Seite.\n\nDie gute Nachricht: für eine Praxis-Website mit 5-15 Seiten ist das in einer Stunde erledigt. Bei größeren Seiten (Online-Shops, Foren) wird's mehr Arbeit.",
        "plugin_hint": "Unser externer Scan erkennt fehlende Alt-Texte, Kontrast-Probleme und Inputs ohne Label aus dem HTML. Mit dem Read-Only-Plugin sehen wir zusätzlich die WordPress-interne Struktur (z.B. ob ein Theme schon Skip-Links eingebaut hat) — keine Vermutung mehr, sondern eine genaue Liste pro Seite."
      },
      "pro_tools": {
        "title": "Profi-Tools · für deinen Webentwickler oder Webdesigner",
        "items": [
          {
            "label": "Lighthouse-Accessibility-Audit (Browser-Konsole)",
            "code": "// In Chrome: F12 → Lighthouse-Tab → „Accessibility“ aktivieren → „Generate report“\n// Oder via CLI:\nnpx lighthouse https://deine-praxis.de --only-categories=accessibility --view",
            "language": "bash",
            "note": "Lighthouse gibt einen Score 0-100 und listet jeden A11y-Verstoß mit Code-Position. Score über 90 = BFSG-konform; unter 70 = Handlungsbedarf."
          },
          {
            "label": "ARIA-Labels per CSS-Selektor finden",
            "code": "/* Im Browser-DevTools-Console: */\ndocument.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach(el => {\n  console.warn('Input ohne Label:', el);\n  el.style.outline = '3px solid red';\n});",
            "language": "javascript",
            "note": "Findet sofort alle Inputs ohne Beschriftung und markiert sie rot auf der Seite. Praktisch für Webentwickler bei der Korrektur."
          },
          {
            "label": "Automatischer Kontrast-Check via axe-core",
            "code": "// In package.json:\n//   \"devDependencies\": { \"axe-core\": \"^4.10.0\" }\n// In Browser-Konsole nach Seitenaufruf:\nimport axe from 'axe-core';\naxe.run().then(results => {\n  console.table(results.violations.map(v => ({ id: v.id, impact: v.impact, count: v.nodes.length })));\n});",
            "language": "javascript",
            "note": "axe-core ist der Industriestandard für A11y-Tests. Unsere Pro-Plus-Pläne nutzen genau diese Library für tägliche Scans."
          }
        ]
      }
    },
    "variants": {
      "default": {
        "steps": [
          {
            "title": "Plugin „WP Accessibility“ installieren",
            "body": "Liefert Skip-Links, Sprach-Attribute, Tastatur-Fokus — drei BFSG-Anforderungen mit einem Klick.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "WP Accessibility Plugin-Installation"
          },
          {
            "title": "Alt-Texte für alle Bilder ergänzen",
            "body": "WordPress → Medien → Alt-Text-Feld pro Bild ausfüllen. Beschreibend, nicht „Bild1.jpg“.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "Alt-Text-Eingabe in der Mediathek"
          },
          {
            "title": "Formular-Labels prüfen (Contact Form 7, WPForms, etc.)",
            "body": "In den Plugin-Einstellungen für jedes Feld ein <label>-Tag oder aria-label setzen. Faustregel: jedes <input> braucht ein sichtbares „Was kommt hier rein“-Label.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "Contact Form 7 Editor mit Label-Feld"
          },
          {
            "title": "Kontrast prüfen via WAVE",
            "body": "https://wave.webaim.org/ → URL eingeben → Contrast-Fehler im Customizer beheben.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "WAVE Kontrast-Report"
          },
          {
            "title": "Tastatur-Test: nur mit Tab durch deine Seite",
            "body": "Browser öffnen → Tab-Taste drücken → durch alle Links/Buttons springen. Kommt der Fokus überall sichtbar an? Wenn nein: Theme-Anpassung nötig oder Plugin „a11y - Web Accessibility“ installieren.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "Browser mit sichtbarem Fokus-Indikator beim Tabben"
          }
        ]
      }
    },
    "checklist": [
      { "id": "wp-a11y-plugin",     "text": "Plugin „WP Accessibility“ installiert und aktiviert" },
      { "id": "alt-texts-done",      "text": "Alle Bilder haben sinnvolle Alt-Texte" },
      { "id": "form-labels",         "text": "Alle Formular-Felder haben sichtbare Labels" },
      { "id": "contrast-check",      "text": "WAVE-Kontrast-Test zeigt 0 Fehler" },
      { "id": "keyboard-test",       "text": "Tab-Navigation durch alle wichtigen Bereiche möglich" },
      { "id": "lighthouse-score",    "text": "Lighthouse-Accessibility-Score über 90" }
    ],
    "not_solved": {
      "title": "Immer noch nicht sicher?",
      "body": "Manche Themes (Elementor-Templates, Divi) haben tief verbaute Accessibility-Mängel, die ein Plugin allein nicht kompensiert. Wenn nach dem Sofort-Fix Lighthouse immer noch unter 80 zeigt, schreib uns mit deinem Theme-Namen + Plugin-Liste an support@website-fix.com. Wir schicken dir eine Theme-spezifische Anleitung."
    },
    "psychological_close": "BFSG-Compliance ist kein einmaliger Job — bei jedem neuen Bild und jedem neuen Formular musst du dran denken. Unser Professional-Plan überwacht das automatisch: tägliche A11y-Scans, Alert wenn ein neues Bild ohne Alt-Text hochgeladen wird, monatlicher Compliance-Report als PDF. Ab 89 €/Mo, monatlich kündbar."
  }
  $json$::jsonb,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  problem_label = EXCLUDED.problem_label,
  preview       = EXCLUDED.preview,
  content_json  = EXCLUDED.content_json,
  active        = EXCLUDED.active;

-- Trigger für bfsg-accessibility
INSERT INTO rescue_guide_triggers (guide_id, match_type, match_value, priority) VALUES
  ('bfsg-accessibility', 'category',      'accessibility',           220),
  ('bfsg-accessibility', 'title_keyword', 'alt-text',                200),
  ('bfsg-accessibility', 'title_keyword', 'alt text',                200),
  ('bfsg-accessibility', 'title_keyword', 'bilder ohne alt',         210),
  ('bfsg-accessibility', 'title_keyword', 'barrierefrei',            230),
  ('bfsg-accessibility', 'title_keyword', 'bfsg',                    240),
  ('bfsg-accessibility', 'title_keyword', 'kontrast',                170),
  ('bfsg-accessibility', 'title_keyword', 'label fehlt',             160),
  ('bfsg-accessibility', 'title_keyword', 'inputs ohne label',       180),
  ('bfsg-accessibility', 'title_keyword', 'buttons ohne text',       180),
  ('bfsg-accessibility', 'title_keyword', 'screenreader',            150),
  ('bfsg-accessibility', 'title_keyword', 'a11y',                    150),
  ('bfsg-accessibility', 'title_keyword', 'accessibility',           160)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- GUIDE 2: security-hardening
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO rescue_guides (id, title, problem_label, preview, price_cents,
                           stripe_price_id, estimated_minutes, content_json, active)
VALUES (
  'security-hardening',
  'Deine WordPress-Seite vor Hackern schützen — Basis-Härtung in 20 Minuten',
  'XML-RPC offen, kein HTTPS, schwache Login-Sicherheit',
  '95 % aller WordPress-Hacks sind durch drei Konfigurations-Fehler möglich. Diese Anleitung schließt sie alle — mit zwei Plugins und einer kleinen .htaccess-Anpassung.',
  990,
  NULL,
  20,
  $json$
  {
    "tldr": "Die meisten WordPress-Hacks passieren durch drei offene Türen: ungeschützte Login-Seite, aktivierte XML-RPC-Schnittstelle und fehlende HTTPS-Verschlüsselung. Wir schließen alle drei in 20 Minuten — mit zwei kostenlosen Plugins, kein Programmieren nötig.",
    "intro": "Du musst kein IT-Experte sein, um deine Seite vor 95 % aller Hacking-Versuche zu schützen. Es geht nicht um perfekte Sicherheit, sondern darum, die offensichtlichen Lücken zu schließen — und damit für Bots uninteressant zu werden.",
    "pillars": {
      "band_aid": {
        "title": "Sofort-Fix · die drei wichtigsten Schutzmaßnahmen heute",
        "steps": [
          {
            "title": "Plugin „Wordfence Security“ installieren",
            "body": "WordPress-Backend → Plugins → Installieren → Suche „Wordfence Security“ → Installieren → Aktivieren. Das Plugin blockiert automatisch verdächtige Login-Versuche, scannt nach Schadcode und schließt XML-RPC ab. Nach Aktivierung: E-Mail eingeben (für Sicherheits-Warnungen) → „Continue“. Der Free-Plan reicht für eine Praxis-Website komplett.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "WordPress-Plugin-Suche mit Wordfence-Ergebnis"
          },
          {
            "title": "HTTPS erzwingen (kostenlos via Hoster)",
            "body": "Wenn deine Seite noch über http:// statt https:// läuft, ist das ein riesiges Sicherheits- und SEO-Problem. Bei All-Inkl, IONOS, Strato und Hostinger gibt es kostenlose SSL-Zertifikate per Klick: Hoster-Backend → SSL-Einstellungen → „Let's Encrypt aktivieren“. Anschließend in WordPress → Einstellungen → Allgemein die URL von http:// auf https:// ändern. Plugin „Really Simple SSL“ kann das automatisch (Plugins → Installieren → „Really Simple SSL“ → einmal aktivieren, fertig).",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "Hoster-Panel mit Let's-Encrypt-Aktivieren-Button"
          },
          {
            "title": "Login-Seite verstecken (Plugin „WPS Hide Login“)",
            "body": "Bots versuchen massenhaft Logins über die Standard-URL /wp-admin und /wp-login.php. Wenn du diese URL änderst, werden 90 % aller Brute-Force-Angriffe ins Leere laufen. WordPress → Plugins → „WPS Hide Login“ installieren → Einstellungen → Login-URL → eigenen Pfad eingeben (z.B. /mein-praxis-login). Speichern. Wichtig: den neuen Pfad als Lesezeichen speichern, sonst kommst du selbst nicht mehr rein.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "WPS Hide Login Konfiguration"
          }
        ]
      },
      "diagnosis": {
        "title": "Was du wissen solltest",
        "body": "WordPress wird auf 43 % aller Websites eingesetzt — das macht es zum lohnendsten Ziel für automatisierte Angriffe. Die meisten „Hacks“ sind keine gezielten Aktionen, sondern Bots, die ständig Standard-Schwachstellen abscannen:\n\n• Standard-Login-URL /wp-admin → Brute-Force mit Passwort-Listen\n• XML-RPC-Schnittstelle (für Pingbacks) → kann für Massive-Login-Angriffe missbraucht werden\n• Fehlendes HTTPS → Passwörter und Daten werden im Klartext übertragen\n• Veraltete Plugins → bekannte Sicherheitslücken die monatelang ungepatched bleiben\n• Schwache Admin-Passwörter („admin123“) → in 0,01 Sekunden geknackt\n\nMit dem Sofort-Fix oben deckst du die ersten drei Punkte ab. Plugins solltest du regelmäßig (alle 1-2 Wochen) updaten — Wordfence warnt dich automatisch.",
        "plugin_hint": "Unser externer Scan erkennt nur HTTPS und XML-RPC-Status von außen. Mit dem Read-Only-Plugin sehen wir auch: aktive WordPress-Version, veraltete Plugins, fehlende Security-Headers (X-Frame-Options, CSP), und ob debug.log mit sensitiven Daten öffentlich liegt — die Sachen, die ein Hacker als erstes prüft."
      },
      "pro_tools": {
        "title": "Profi-Tools · für deinen Webentwickler oder Webdesigner",
        "items": [
          {
            "label": ".htaccess-Härtung — wp-config.php blockieren",
            "code": "# In .htaccess im WP-Root einfügen, vor # BEGIN WordPress:\n<Files wp-config.php>\n  Order allow,deny\n  Deny from all\n</Files>\n\n# Verzeichnis-Listing abschalten\nOptions -Indexes\n\n# XML-RPC komplett blockieren\n<Files xmlrpc.php>\n  Order Deny,Allow\n  Deny from all\n</Files>",
            "language": "apache",
            "note": "Schützt wp-config.php (enthält DB-Passwort) vor direktem Web-Zugriff, deaktiviert XML-RPC vollständig und blockiert das Auflisten von Ordner-Inhalten."
          },
          {
            "label": "Security-Headers via PHP (in functions.php)",
            "code": "// In functions.php des aktiven Themes (besser im Child-Theme):\nadd_action('send_headers', function() {\n  header('X-Frame-Options: SAMEORIGIN');\n  header('X-Content-Type-Options: nosniff');\n  header('Referrer-Policy: strict-origin-when-cross-origin');\n  header('Permissions-Policy: geolocation=(), camera=(), microphone=()');\n});",
            "language": "php",
            "note": "Schützt vor Clickjacking, MIME-Sniffing und unkontrolliertem Browser-API-Zugriff. Standard in jedem modernen Security-Audit."
          },
          {
            "label": "Debug-Log-Risiko prüfen (CLI oder File-Manager)",
            "code": "# Im Hoster-File-Manager oder via SSH:\n# Diese Datei darf NICHT öffentlich erreichbar sein:\nls -la wp-content/debug.log\n\n# Falls vorhanden + > 0 Bytes: in wp-config.php prüfen ob WP_DEBUG_LOG = false\n# Plus diese Zeile in .htaccess:\n# <Files debug.log>\n#   Order allow,deny\n#   Deny from all\n# </Files>",
            "language": "bash",
            "note": "wp-content/debug.log enthält oft Stack-Traces mit Datenbank-Strukturen. Auf vielen WordPress-Installationen aus Versehen aktiviert."
          }
        ]
      }
    },
    "variants": {
      "default": {
        "steps": [
          {
            "title": "Wordfence Security installieren + Basis-Konfiguration",
            "body": "Plugins → Installieren → „Wordfence Security“ → Aktivieren → E-Mail-Adresse eingeben → Free-Plan wählen. Standardeinstellungen sind sinnvoll, kein Tuning nötig.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Wordfence Initial-Setup"
          },
          {
            "title": "HTTPS via Hoster + Really Simple SSL",
            "body": "Hoster-Panel → SSL → Let's Encrypt aktivieren. Plus Plugin „Really Simple SSL“ in WordPress aktivieren — leitet automatisch alle http-URLs auf https um.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Really Simple SSL Aktivierung"
          },
          {
            "title": "Admin-Login-URL ändern (WPS Hide Login)",
            "body": "Plugin „WPS Hide Login“ → Einstellungen → eigenen Pfad eingeben. Wichtig: Lesezeichen speichern.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Custom Login URL gesetzt"
          },
          {
            "title": "Starkes Admin-Passwort + 2FA",
            "body": "WordPress → Benutzer → eigenes Profil → Passwort generieren (mindestens 16 Zeichen). Wordfence-Settings → Login Security → 2FA aktivieren (per Authenticator-App wie Google Authenticator).",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Wordfence 2FA-Setup"
          },
          {
            "title": "Wöchentlicher Plugin-Update-Check",
            "body": "Wordfence → Tools → Plugin Updates wöchentlich prüfen. Veraltete Plugins sind das Haupt-Einfallstor. Auto-Updates für vertrauenswürdige Plugins (Wordfence selbst, Akismet, etc.) aktivieren.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Plugin-Update-Übersicht"
          }
        ]
      }
    },
    "checklist": [
      { "id": "wordfence-active",   "text": "Wordfence Security installiert und aktiv" },
      { "id": "https-forced",       "text": "Seite läuft über https:// (kein Mixed-Content)" },
      { "id": "login-url-changed",  "text": "Admin-Login-URL ist nicht mehr /wp-admin" },
      { "id": "strong-password",    "text": "Admin-Passwort hat mindestens 16 Zeichen + 2FA aktiv" },
      { "id": "plugins-updated",    "text": "Alle Plugins sind aktuell" },
      { "id": "xmlrpc-blocked",     "text": "XML-RPC ist deaktiviert oder blockiert" }
    ],
    "not_solved": {
      "title": "Bist du schon gehackt?",
      "body": "Wenn deine Seite seltsame Pop-ups zeigt, auf andere Domains weiterleitet oder im Google-Search-Console eine „Malware“-Warnung steht, hast du wahrscheinlich schon einen aktiven Hack. Sofort-Schritte: (1) Wordfence → Scan starten, (2) verdächtige Plugins/Themes löschen, (3) alle Passwörter neu setzen. Bei größerem Befall: support@website-fix.com mit Scan-Report — wir empfehlen einen erfahrenen WordPress-Forensiker."
    },
    "psychological_close": "Sicherheit ist kein Zustand, sondern ein Prozess — neue Plugin-Lücken werden ständig entdeckt. Unser Professional-Plan überwacht das automatisch: tägliche Scans gegen die WPVulnDB-Datenbank, Alert bei neuen Schwachstellen, monatliche Security-Audits. Ab 89 €/Mo, monatlich kündbar."
  }
  $json$::jsonb,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  problem_label = EXCLUDED.problem_label,
  preview       = EXCLUDED.preview,
  content_json  = EXCLUDED.content_json,
  active        = EXCLUDED.active;

INSERT INTO rescue_guide_triggers (guide_id, match_type, match_value, priority) VALUES
  ('security-hardening', 'category',      'security',                220),
  ('security-hardening', 'title_keyword', 'https fehlt',             230),
  ('security-hardening', 'title_keyword', 'kein https',              230),
  ('security-hardening', 'title_keyword', 'ssl',                     200),
  ('security-hardening', 'title_keyword', 'xml-rpc',                 220),
  ('security-hardening', 'title_keyword', 'xmlrpc',                  220),
  ('security-hardening', 'title_keyword', 'sicherheit',              210),
  ('security-hardening', 'title_keyword', 'gehackt',                 240),
  ('security-hardening', 'title_keyword', 'malware',                 230),
  ('security-hardening', 'title_keyword', 'security-header',         180),
  ('security-hardening', 'title_keyword', 'wp-config',               190),
  ('security-hardening', 'title_keyword', 'brute',                   200),
  ('security-hardening', 'title_keyword', 'login geschützt',         180)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- GUIDE 3: mobile-performance
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO rescue_guides (id, title, problem_label, preview, price_cents,
                           stripe_price_id, estimated_minutes, content_json, active)
VALUES (
  'mobile-performance',
  'Deine Seite auf dem Smartphone schneller machen — Mobile-Score-Boost',
  'Bilder zu groß, Mobile-Score niedrig, Seite ruckelt auf dem Handy',
  'Über 60 % deiner Besucher kommen vom Smartphone. Wenn die Seite dort langsam ist, springen sie ab. Diese Anleitung halbiert die Mobile-Ladezeit — mit einem Plugin und 5 Klicks.',
  990,
  NULL,
  10,
  $json$
  {
    "tldr": "Mobile-Performance entscheidet, ob deine Patienten dranbleiben oder zur nächsten Praxis-Website weiterklicken. Die häufigste Ursache für eine langsame Mobile-Seite: zu große Bilder. Mit einem Bild-Optimierungs-Plugin halbierst du die Ladezeit, ohne ein einziges Bild manuell zu bearbeiten.",
    "intro": "Über 60 % aller Praxis-Website-Besucher kommen vom Smartphone. Wenn deine Seite dort länger als 3 Sekunden zum Laden braucht, springen die Hälfte ab — bevor sie überhaupt deine Telefonnummer gesehen haben.",
    "pillars": {
      "band_aid": {
        "title": "Sofort-Fix · drei einfache Schritte für eine schnellere Mobile-Seite",
        "steps": [
          {
            "title": "Plugin „Smush“ installieren — komprimiert alle Bilder automatisch",
            "body": "WordPress → Plugins → Installieren → „Smush“ → Aktivieren → kostenlosen Tarif wählen. Das Plugin verkleinert vorhandene Bilder im Hintergrund (kann 30 Min dauern bei vielen Bildern) und optimiert jedes neue Bild beim Hochladen automatisch. Im Schnitt 60-80 % kleiner, ohne sichtbaren Qualitätsverlust.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "Smush Plugin Bulk-Optimierung"
          },
          {
            "title": "Lazy-Load aktivieren — Bilder erst laden, wenn sie sichtbar werden",
            "body": "In Smush-Einstellungen → „Lazy Load“ → Toggle auf „Aktiv“. Alternative: WordPress macht das seit Version 5.5 automatisch, aber Smush hat eine bessere Implementierung mit Platzhaltern. Resultat: deine Seite zeigt Text und ersten Bildschirm sofort, weitere Bilder erst beim Runterscrollen — 3x schneller wahrgenommene Ladezeit.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "Smush Lazy-Load Toggle"
          },
          {
            "title": "WebP-Format aktivieren — Bilder 30 % kleiner als JPG",
            "body": "Smush Pro hat das eingebaut, im Free-Plan: Plugin „WebP Express“ zusätzlich installieren. Plugins → Installieren → „WebP Express“ → Aktivieren. WebP ist ein modernes Bildformat, das alle aktuellen Browser unterstützen und 30 % kleinere Dateien produziert als JPG. Deine vorhandenen Bilder werden automatisch konvertiert und zur richtigen Version ausgeliefert.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "WebP Express Aktivierung"
          }
        ]
      },
      "diagnosis": {
        "title": "Was du wissen solltest",
        "body": "Google misst seit 2021 die „Core Web Vitals“ — drei Werte, die bestimmen, wie deine Seite mobil eingestuft wird:\n\n• LCP (Largest Contentful Paint) — wie schnell das größte sichtbare Element lädt. Sollte unter 2,5 Sek sein.\n• FID/INP (First Input Delay/Interaction to Next Paint) — wie schnell die Seite auf Klicks reagiert.\n• CLS (Cumulative Layout Shift) — wie sehr die Seite während des Ladens „zuckt“ (springt der Text nach unten, weil ein Bild später lädt?).\n\nGroße Bilder sind der häufigste LCP-Killer. Mit dem Sofort-Fix oben (Bild-Komprimierung + Lazy-Load + WebP) löst du in 90 % der Fälle alle drei Werte gleichzeitig.\n\nTipp: kostenlos testen unter https://pagespeed.web.dev/ — gib deine URL ein, du bekommst einen Mobile-Score 0-100 plus konkrete Verbesserungs-Vorschläge.",
        "plugin_hint": "Unser externer Scan erkennt die Größe und das Format der Bilder von außen. Mit dem Read-Only-Plugin sehen wir zusätzlich: welche Plugins die meisten DB-Queries laden, ob Render-Blocking-Scripts den ersten Bildaufbau verzögern und ob das Theme bereits Critical-CSS nutzt — also die echten Engpässe, nicht nur die offensichtlichen Bilder."
      },
      "pro_tools": {
        "title": "Profi-Tools · für deinen Webentwickler oder Webdesigner",
        "items": [
          {
            "label": "PageSpeed Insights via API (für Monitoring-Setups)",
            "code": "// Browser-Konsole oder Node.js:\nconst url = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed' +\n            '?url=https://deine-praxis.de&strategy=mobile&category=performance';\nfetch(url).then(r => r.json()).then(d => {\n  const score = d.lighthouseResult.categories.performance.score * 100;\n  console.log('Mobile-Score:', score, '/100');\n  console.table(d.lighthouseResult.audits['largest-contentful-paint']);\n});",
            "language": "javascript",
            "note": "Liefert den exakten Lighthouse-Mobile-Score plus alle Detail-Metriken. Praktisch für tägliche Monitoring-Cronjobs."
          },
          {
            "label": "Critical-CSS extrahieren via npm-Tool",
            "code": "# Im Build-Prozess deines Themes:\nnpm install -g critical\ncritical https://deine-praxis.de \\\n  --inline \\\n  --target=critical.css \\\n  --width=375 --height=812\n# Den generierten CSS-Block in <head> als <style> einfügen\n# → Above-the-fold lädt 1-2 Sekunden schneller",
            "language": "bash",
            "note": "Critical-CSS = das CSS, das für den initial sichtbaren Bereich gebraucht wird. Inline laden, Rest async — der Browser kann sofort rendern statt zu warten."
          },
          {
            "label": ".htaccess Browser-Caching für Bilder",
            "code": "<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType image/webp \"access plus 1 year\"\n  ExpiresByType image/jpg  \"access plus 1 year\"\n  ExpiresByType image/png  \"access plus 1 year\"\n  ExpiresByType text/css   \"access plus 1 month\"\n</IfModule>",
            "language": "apache",
            "note": "Wiederbesucher (z.B. Stammpatienten) laden Bilder gar nicht neu — alles aus dem Browser-Cache."
          }
        ]
      }
    },
    "variants": {
      "default": {
        "steps": [
          {
            "title": "Bild-Optimierungs-Plugin installieren",
            "body": "Smush, EWWW Image Optimizer oder ShortPixel — alle drei sind solide. Smush ist am einfachsten zu konfigurieren.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Plugin-Auswahl"
          },
          {
            "title": "Lazy-Loading aktivieren",
            "body": "WordPress-internes Lazy-Load (ab 5.5 default) reicht meistens. Plugin-Lazy-Load nur wenn die Standard-Variante nicht greift.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Lazy-Load Toggle"
          },
          {
            "title": "WebP-Format aktivieren",
            "body": "WebP Express oder vergleichbares Plugin. WordPress allein kann kein WebP konvertieren.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "WebP Konfiguration"
          },
          {
            "title": "Caching-Plugin aktivieren",
            "body": "WP Super Cache, W3 Total Cache oder LiteSpeed Cache (je nach Hoster). Halbiert Server-Antwortzeit.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Caching-Plugin Setup"
          },
          {
            "title": "Mobile-Score testen",
            "body": "https://pagespeed.web.dev/ → URL eingeben → Mobile-Score notieren. Vor und nach dem Sofort-Fix vergleichen.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "PageSpeed Mobile Score"
          }
        ]
      }
    },
    "checklist": [
      { "id": "smush-active",      "text": "Bild-Optimierungs-Plugin installiert und Bulk-Optimierung gelaufen" },
      { "id": "lazy-load-on",      "text": "Lazy-Load aktiv (Bilder laden erst beim Scrollen)" },
      { "id": "webp-active",       "text": "WebP-Format wird ausgeliefert" },
      { "id": "caching-on",        "text": "Caching-Plugin installiert und konfiguriert" },
      { "id": "mobile-score-70",   "text": "PageSpeed Mobile-Score über 70" },
      { "id": "lcp-under-25",      "text": "LCP unter 2,5 Sekunden" }
    ],
    "not_solved": {
      "title": "Mobile-Score immer noch unter 70?",
      "body": "Wenn nach allen Schritten der Mobile-Score auf pagespeed.web.dev unter 70 bleibt, liegt es meist am Theme oder an Render-Blocking-Plugins (z.B. Page-Builder wie Elementor mit vielen Widgets). Schick uns deine URL plus die PageSpeed-Insights-Auswertung an support@website-fix.com — wir geben dir einen Theme-spezifischen Tipp."
    },
    "psychological_close": "Mobile-Performance verschlechtert sich mit jeder neuen Seite, jedem neuen Bild, jedem neuen Plugin. Unser Professional-Plan misst täglich den Mobile-Score und schlägt Alarm, wenn er unter 70 fällt — bevor Google deine Rankings senkt. Ab 89 €/Mo, monatlich kündbar."
  }
  $json$::jsonb,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  problem_label = EXCLUDED.problem_label,
  preview       = EXCLUDED.preview,
  content_json  = EXCLUDED.content_json,
  active        = EXCLUDED.active;

INSERT INTO rescue_guide_triggers (guide_id, match_type, match_value, priority) VALUES
  ('mobile-performance', 'title_keyword', 'mobile',                  220),
  ('mobile-performance', 'title_keyword', 'lighthouse',              200),
  ('mobile-performance', 'title_keyword', 'lazy-load',               180),
  ('mobile-performance', 'title_keyword', 'lazyload',                180),
  ('mobile-performance', 'title_keyword', 'webp',                    180),
  ('mobile-performance', 'title_keyword', 'bilder zu groß',          200),
  ('mobile-performance', 'title_keyword', 'lcp',                     190),
  ('mobile-performance', 'title_keyword', 'core web vitals',         210),
  ('mobile-performance', 'title_keyword', 'pagespeed',               180),
  ('mobile-performance', 'title_keyword', 'cls',                     170),
  ('mobile-performance', 'title_keyword', 'render-blocking',         170),
  ('mobile-performance', 'title_keyword', 'mobile speed',            220),
  ('mobile-performance', 'title_keyword', 'smartphone langsam',      210)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- GUIDE 4: dsgvo-compliance
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO rescue_guides (id, title, problem_label, preview, price_cents,
                           stripe_price_id, estimated_minutes, content_json, active)
VALUES (
  'dsgvo-compliance',
  'Deine Seite DSGVO-konform machen — Cookie-Banner, Tracking, Datenschutz',
  'Cookie-Banner fehlt, Google Fonts extern geladen, Tracking ohne Einwilligung',
  'Eine Praxis-Website ohne korrekten Cookie-Banner riskiert Abmahnungen ab 800 €. Diese Anleitung schließt die häufigsten DSGVO-Fallen — mit einem Plugin und 10 Min Konfiguration.',
  990,
  NULL,
  10,
  $json$
  {
    "tldr": "Die häufigsten DSGVO-Abmahnungen treffen Websites mit drei Stellschrauben: kein korrekter Cookie-Banner, Google Fonts extern geladen, Tracking ohne Einwilligung. Wir lösen alle drei in 10 Minuten — mit einem Plugin und einer Code-Zeile, die Google Fonts auf den eigenen Server holt.",
    "intro": "DSGVO-Pflichten klingen einschüchternd, sind aber für eine kleine Praxis-Website mit 3 konkreten Schritten erledigt. Wichtig: nicht „irgendwas“ tun — sondern das Richtige, sonst hast du am Ende einen Cookie-Banner, der falsch ist und trotzdem abgemahnt werden kann.",
    "pillars": {
      "band_aid": {
        "title": "Sofort-Fix · DSGVO-Pflichten heute erfüllen",
        "steps": [
          {
            "title": "Plugin „Real Cookie Banner“ installieren — der einzige der wirklich DSGVO-konform ist",
            "body": "WordPress → Plugins → Installieren → „Real Cookie Banner“ → Aktivieren. Im Setup-Wizard die Branchenfrage beantworten („Praxis/Gesundheit“ wählen), Tracking-Tools auswählen die du nutzt (Google Analytics, Facebook Pixel, etc.). Das Plugin generiert automatisch eine rechtssichere Banner-Konfiguration mit Opt-In, Opt-Out und Detail-Einstellungen. Wichtig: kostenlose Plugins wie „Cookie Notice“ sind rechtlich NICHT ausreichend — sie blockieren Tracker nicht aktiv. Real Cookie Banner ist im Free-Plan voll DSGVO-konform.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "Real Cookie Banner Setup-Wizard"
          },
          {
            "title": "Google Fonts lokal hosten — gegen 800-Euro-Abmahnung",
            "body": "Das LG München (Urteil 3 O 17493/20) hat bestätigt: jede externe Google-Fonts-Anfrage ohne Einwilligung ist abmahnbar. Lösung: Plugin „OMGF | Host Google Fonts Locally“ installieren → Aktivieren → „Optimize Now“-Button klicken. Das Plugin lädt alle Google-Fonts auf deinen eigenen Server, ersetzt die externen Links und zerstört damit die DSGVO-Falle in 30 Sekunden — null Tracking-Anfragen mehr an Google.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "OMGF Optimize Now Button"
          },
          {
            "title": "Datenschutzerklärung aktualisieren",
            "body": "Wenn du Real Cookie Banner installiert hast, generiert das Plugin im Footer automatisch einen Hinweis-Link „Cookie-Einstellungen“. Was noch fehlt: eine aktuelle Datenschutzerklärung. Kostenloser Generator: https://www.e-recht24.de/muster-datenschutzerklaerung.html → Branchenangabe „Arzt/Therapie“ → Tools auswählen die du nutzt → Text generieren → in WordPress unter Seite „Datenschutz“ einfügen. Pflicht-Inhalt: welche Daten werden erhoben, wie lange gespeichert, mit wem geteilt, welche Rechte hat der Nutzer.",
            "screenshot": null,
            "screenshot_url": null,
            "screenshot_alt": "e-recht24 Datenschutz-Generator"
          }
        ]
      },
      "diagnosis": {
        "title": "Was du wissen solltest",
        "body": "DSGVO-Abmahnungen sind in den letzten 2 Jahren explodiert — vor allem für Praxen, weil sie als „kommerzielle Anbieter“ gelten und Patientendaten verarbeiten. Die häufigsten Abmahn-Auslöser:\n\n• Google Fonts extern geladen — automatische IP-Übertragung an Google ohne Einwilligung. Pauschal 100-300 € pro Abmahnung, manchmal mehr.\n• Cookie-Banner mit „Akzeptieren“-Default — DSGVO verlangt aktive Einwilligung, kein Opt-Out.\n• Google Analytics ohne Consent — Tracking startet sofort beim Seitenbesuch, statt erst nach „OK“-Klick.\n• Kontaktformular speichert IP-Adresse ohne Hinweis in der Datenschutzerklärung.\n• Newsletter-Anmeldung ohne Double-Opt-In.\n\nMit dem Sofort-Fix oben sind 90 % aller typischen Praxis-Konfigurationen abgedeckt. Bei besonderen Fällen (Online-Terminbuchung, Patienten-Portal, Telemedizin) brauchst du eine erweiterte Datenschutzerklärung — am besten von einem Fachanwalt prüfen lassen.",
        "plugin_hint": "Unser externer Scan erkennt Google Fonts, Tracking-Scripts und Cookie-Banner-Existenz von außen. Mit dem Read-Only-Plugin sehen wir zusätzlich: welche Plugins selbst extern Daten senden (z.B. Update-Pings an Hersteller-Server), ob WP Multisite oder Cookie-Caching die Banner-Logik aushebelt — die typischen versteckten DSGVO-Lecks."
      },
      "pro_tools": {
        "title": "Profi-Tools · für deinen Webentwickler oder Webdesigner",
        "items": [
          {
            "label": "Externe Requests beim Seitenaufruf prüfen",
            "code": "// Im Browser: F12 → Netzwerk-Tab → Filter „Domain: -deine-praxis.de“\n// Listet alle Requests an externe Server beim Seitenladen auf.\n// In der Konsole für eine schnelle Übersicht:\nperformance.getEntries()\n  .map(e => new URL(e.name).hostname)\n  .filter(h => !h.includes('deine-praxis.de'))\n  .reduce((a, h) => (a[h] = (a[h] || 0) + 1, a), {});",
            "language": "javascript",
            "note": "Listet jede externe Domain auf, die deine Seite kontaktiert (Google, Facebook, etc.). Jeder Eintrag braucht entweder eine Cookie-Banner-Einwilligung oder muss lokal gehostet werden."
          },
          {
            "label": "Cookie-Banner Compliance-Test",
            "code": "// Wenn du Real Cookie Banner nutzt:\n// 1. Inkognito-Tab öffnen\n// 2. Seite laden → DevTools öffnen → Application-Tab → Cookies\n// 3. Erwartung: nur \"essenzielle\" Cookies vor Banner-Klick (PHPSESSID o.ä.)\n// 4. Falls Google Analytics, Facebook Pixel etc. vor Klick auftauchen:\n//    Tracking startet ohne Einwilligung → DSGVO-Verstoß",
            "language": "javascript",
            "note": "Standard-Test, ob der Cookie-Banner technisch korrekt blockiert. Real Cookie Banner besteht diesen Test, viele „Cookie Notice“-Plugins nicht."
          },
          {
            "label": "Datenschutz-Output validieren via PrivacyBee",
            "code": "# Online-Scanner für DSGVO-Konformität:\n# https://www.privacybee.io/free-tools/website-scanner\n# Eingabe: deine URL\n# Ausgabe: \n#   - Cookies vor Einwilligung\n#   - Externe Tracker erkannt\n#   - Datenschutzerklärung Score\n#   - Konkrete Risiko-Punkte mit Abmahn-Wahrscheinlichkeit",
            "language": "bash",
            "note": "Liefert einen externen Compliance-Report ohne Login. Praktisch für Quartal-Audits oder als „zweites Paar Augen“."
          }
        ]
      }
    },
    "variants": {
      "default": {
        "steps": [
          {
            "title": "Real Cookie Banner installieren + Setup-Wizard",
            "body": "Branche „Praxis/Gesundheit“, Tools auswählen (Analytics, Pixel, etc.). Plugin generiert rechtssichere Konfiguration.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Real Cookie Banner Wizard"
          },
          {
            "title": "OMGF — Google Fonts lokal hosten",
            "body": "Plugin installieren → „Optimize Now“ klicken. Externe Google-Fonts-Anfragen werden eliminiert.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "OMGF Optimization"
          },
          {
            "title": "Datenschutzerklärung mit e-recht24 generieren",
            "body": "https://www.e-recht24.de/muster-datenschutzerklaerung.html → Tools auswählen → Text in WordPress-Seite „Datenschutz“ einfügen.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Datenschutzerklärung-Generator"
          },
          {
            "title": "Impressum-Pflicht prüfen",
            "body": "Praxen brauchen vollständiges Impressum mit Kammer-Mitgliedschaft, Berufsbezeichnung und zuständiger Aufsichtsbehörde. Generator: https://www.e-recht24.de/impressum-generator.html",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "Impressum-Generator"
          },
          {
            "title": "Test im Inkognito-Modus",
            "body": "Inkognito-Browser → Seite öffnen → DevTools → Network-Tab. Erwartung: keine Requests an Google/Facebook vor Cookie-Banner-Klick.",
            "screenshot": null, "screenshot_url": null, "screenshot_alt": "DevTools Network-Tab"
          }
        ]
      }
    },
    "checklist": [
      { "id": "cookie-banner",     "text": "Real Cookie Banner installiert und konfiguriert" },
      { "id": "fonts-local",       "text": "Google Fonts werden lokal vom eigenen Server geladen" },
      { "id": "datenschutz",       "text": "Aktuelle Datenschutzerklärung im Footer verlinkt" },
      { "id": "impressum",         "text": "Vollständiges Impressum mit Kammer/Aufsicht-Angabe" },
      { "id": "incognito-test",    "text": "Inkognito-Test zeigt keine Tracker vor Einwilligung" },
      { "id": "consent-stored",    "text": "Cookie-Einwilligungen werden 1 Jahr gespeichert (Pflicht)" }
    ],
    "not_solved": {
      "title": "Hast du eine besondere Konfiguration?",
      "body": "Wenn du eine Online-Terminbuchung, ein Patienten-Portal oder Telemedizin-Tools nutzt, brauchst du eine erweiterte Datenschutzerklärung mit Auftragsverarbeitungs-Verträgen. Schick uns deine URL plus eine kurze Beschreibung an support@website-fix.com — wir nennen dir konkrete Punkte, die zusätzlich rein müssen. Bei rechtlich strittigen Konstellationen empfehlen wir einen IT-Fachanwalt (~250-400 € einmalig)."
    },
    "psychological_close": "DSGVO-Compliance ist kein Einmal-Job — bei jedem neuen Plugin und jedem neuen Tracking-Tool musst du den Cookie-Banner anpassen. Unser Professional-Plan überwacht das automatisch: tägliche Scans nach neuen externen Trackern, Alert bei DSGVO-Risiko, monatlicher Compliance-Report mit Abmahn-Risiko-Score. Ab 89 €/Mo, monatlich kündbar."
  }
  $json$::jsonb,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  title         = EXCLUDED.title,
  problem_label = EXCLUDED.problem_label,
  preview       = EXCLUDED.preview,
  content_json  = EXCLUDED.content_json,
  active        = EXCLUDED.active;

INSERT INTO rescue_guide_triggers (guide_id, match_type, match_value, priority) VALUES
  ('dsgvo-compliance', 'title_keyword', 'dsgvo',                     250),
  ('dsgvo-compliance', 'title_keyword', 'gdpr',                      230),
  ('dsgvo-compliance', 'title_keyword', 'cookie-banner',             230),
  ('dsgvo-compliance', 'title_keyword', 'cookie banner',             230),
  ('dsgvo-compliance', 'title_keyword', 'google fonts',              240),
  ('dsgvo-compliance', 'title_keyword', 'datenschutz',               220),
  ('dsgvo-compliance', 'title_keyword', 'tracking',                  200),
  ('dsgvo-compliance', 'title_keyword', 'consent',                   200),
  ('dsgvo-compliance', 'title_keyword', 'einwilligung',              210),
  ('dsgvo-compliance', 'title_keyword', 'abmahn',                    230),
  ('dsgvo-compliance', 'title_keyword', 'externe schrift',           220),
  ('dsgvo-compliance', 'title_keyword', 'analytics',                 180),
  ('dsgvo-compliance', 'title_keyword', 'facebook pixel',            190)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────────────────────
SELECT id, title, active,
       jsonb_array_length(content_json -> 'pillars' -> 'band_aid' -> 'steps') AS band_aid_steps,
       jsonb_array_length(content_json -> 'checklist') AS checklist_items
FROM rescue_guides
ORDER BY id;
