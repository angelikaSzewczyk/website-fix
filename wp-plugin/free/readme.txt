=== WebsiteFix Health Check & Deep Audit ===
Contributors: websitefix
Tags: performance, optimization, monitoring, security, diagnostics
Requires at least: 5.9
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 0.3.0
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

5 Kennzahlen direkt im WordPress-Dashboard zeigen, ob dein Hoster dich bremst: Server-Response, Heartbeat-Last, DB-Bloat, Memory, Update-Backlog.

== Description ==

Du hast den Verdacht, dass deine WordPress-Site langsamer ist als sie sein müsste? Dass dein Hoster „CPU-Überschreitung" meldet, obwohl gar nicht so viel los ist? Dass irgendwas im Hintergrund läuft, das du nicht siehst?

**WebsiteFix Health Check zeigt dir in 60 Sekunden, woran es liegt.** Direkt im WordPress-Dashboard. Ohne Anmeldung. Ohne Account. Read-only — das Plugin schreibt nichts in deine Site, deaktiviert nichts automatisch und sendet keine User-Daten an externe Server.

= Die 5 Kennzahlen, die zeigen, wo deine Site verliert =

**1. Server-Response-Zeit (TTFB)**
Wie lange braucht dein Hoster, bevor er überhaupt antwortet? Werte über 800 ms sind ein Warnsignal — entweder dein Hoster ist überlastet, dein Plan ist zu klein, oder ein Plugin frisst die ersten 500 ms Bootstrap-Zeit. Das Widget zeigt den Wert tagesaktuell und gibt eine Diagnose-Richtung.

**2. Heartbeat-API-Last**
Die WordPress-Heartbeat-API pollt im Hintergrund alle 15 Sekunden auf admin-ajax.php — das ist auf vielen Shared-Hosting-Plänen der häufigste Grund für CPU-Drosselung durch den Hoster. Das Widget zeigt die aktuelle Frequenz, die hochgerechnete Last pro Stunde, und verlinkt auf einen kostenlosen PHP-Snippet, der die Frequenz kontextabhängig reduziert.

**3. Datenbank-Größe & größte Tabelle**
Eine WordPress-DB sollte selten über 100–200 MB liegen. Wenn deine Site bei 1,2 GB liegt, weiß das Widget welche Tabelle das verursacht (typisch: `wp_options` mit Autoload-Bloat, `wp_postmeta` mit verwaisten Einträgen, Transients-Caches). Du siehst exakt, was Speicher und DB-CPU bei deinem Hoster frisst.

**4. PHP-Memory-Limit & aktuelle Peak-Auslastung**
Dein Hoster hat dir 128 MB, 256 MB oder 512 MB zugewiesen? Wie viel davon nutzt dein WordPress tatsächlich? Wenn du regelmäßig 85 %+ Auslastung siehst, wirst du bei Last-Spitzen die berüchtigte „Allowed memory size exhausted"-Fehlermeldung kassieren — ein Hoster-Drossel-Signal, das die meisten zu spät merken.

**5. Update-Backlog (Core · Plugins · Themes)**
Wie viele Updates hängen wirklich? Getrennt nach kritisch (Core-Update oder 5+ ausstehende Plugin-Updates) und regulär. Du siehst auf einen Blick, welche Updates dringend sind und welche warten können — ein Sicherheits- und Performance-Risiko, das Standard-WordPress nur als kleinen roten Kreis im Admin zeigt.

= Was das Plugin NICHT macht =

* Es schreibt nichts in deine Datenbank.
* Es deaktiviert keine Plugins, keine Themes, keine Funktionen.
* Es sendet keine personenbezogenen Daten an externe Server.
* Es ist kein Backup-Plugin, keine Firewall, kein Malware-Scanner.
* Es ersetzt kein professionelles Monitoring — es zeigt nur, ob du eines brauchst.

= Smart-Fix-Snippets statt Plugin-Bloat =

Für jede gefundene Schwachstelle verlinkt das Widget auf die kostenlose Smart-Fix-Library auf website-fix.com mit copy-paste-fähigen PHP-Snippets für die häufigsten Probleme:

* WordPress-Heartbeat-API kontextabhängig drosseln (60 s / 120 s / 300 s)
* xmlrpc.php deaktivieren — sicherer Brute-Force-Schutz mit Jetpack-Erkennung
* jQuery-Migrate aus dem Frontend entfernen — Lighthouse-Score-Boost
* WordPress-Emojis & oEmbed-Discovery entfernen — Render-Blocking weg
* Query-Strings aus statischen Assets entfernen — CDN-Cache-Hit-Rate hoch

Jeder Snippet kommt mit Sicherheits-Wrapper und Auto-Safety-Check, der Plugin-Kollisionen (z. B. mit WP Rocket, Heartbeat Control, Wordfence) automatisch erkennt und in dem Fall NICHT eingreift.

= Für Entwickler — Technische Details =

* **Read-Only:** keine `INSERT`/`UPDATE`/`DELETE`/`ALTER`-Statements, keine `wp_options`-Writes, keine Cron-Jobs registriert.
* **Lokale Berechnung:** alle 5 Werte aus PHP-Built-Ins (`ini_get`, `memory_get_peak_usage`, `apply_filters('heartbeat_settings', ...)`), `$wpdb`-SELECTs auf `information_schema`, und einem `wp_remote_get` auf `home_url()` zur TTFB-Messung.
* **Keine externen API-Calls** — kein Telemetry-Ping, kein Auto-Update-Server, kein Analytics-Tracking.
* **Output gehärtet:** alles via `esc_html()`, `esc_attr()`, `esc_url()` escaped.
* **Gating:** Widget rendert nur für `current_user_can('manage_options')` — Editoren und Autoren sehen es nicht.
* **Fallback-sicher:** Hoster, die `information_schema` sperren (manche Strato/All-Inkl-Pläne), liefern „n/v" statt zu crashen.

Der vollständige Quellcode ist GPL-lizenziert.

== Installation ==

1. Plugin im WordPress-Admin unter „Plugins → Installieren" suchen („WebsiteFix Health Check") und aktivieren.
2. Nach der Aktivierung erscheint das Widget oben im Dashboard.
3. Beim ersten Aufruf werden die 5 Werte live berechnet (~1 Sekunde).
4. Nur Administratoren sehen das Widget. Editoren/Autoren bleiben unbehelligt.

== Frequently Asked Questions ==

= Wie sehe ich, ob mein Hoster meine WordPress-Site drosselt? =

Drei Signale weisen auf Hoster-seitige Drosselung hin: ein Server-Response-Wert (TTFB) über 800 ms bei normaler Last, regelmäßige 503-/504-Fehler zu Bürozeiten, und Mails vom Hoster mit Betreff „CPU-Verbrauch erhöht". Das WebsiteFix Health-Check-Widget zeigt den TTFB-Wert direkt im Dashboard und vergleicht ihn mit den Branchenstandards für deutsche Shared-Hosting-Anbieter (IONOS, Strato, All-Inkl, Hetzner, webgo).

= Wie reduziere ich die WordPress-Heartbeat-API-Last? =

Die Heartbeat-API ruft sich alle 15 Sekunden im Admin auf und ist eine der häufigsten Ursachen für hohe CPU-Last auf Shared-Hosting. Das Plugin zeigt dir die aktuelle Frequenz und Polls pro Stunde. Für die Drosselung verlinkt das Widget auf einen kostenlosen PHP-Snippet, der die Frequenz kontextabhängig auf 60 s im Admin, 120 s im Post-Editor und 300 s im Frontend reduziert — typische Ersparnis: 75–85 % weniger admin-ajax.php-Last.

= Wie deaktiviere ich xmlrpc.php in WordPress? =

xmlrpc.php ist seit Jahren ein bevorzugtes Brute-Force-Angriffsziel. Wenn du keine WordPress-Mobile-App, kein Jetpack und kein externes Publishing-Tool nutzt, kannst du es gefahrlos abschalten. Der Smart-Fix-Snippet aus der Library erkennt automatisch ein aktives Jetpack/Wordfence/Sucuri und greift in dem Fall NICHT ein — du musst dich nicht zwischen Security-Plugin und xmlrpc-Hardening entscheiden.

= Wie groß darf meine WordPress-Datenbank werden? =

Faustregel: Bei einer Standard-WordPress-Site (Blog, Corporate-Website, kleine WooCommerce-Installation) liegen gesunde Datenbank-Größen zwischen 20 MB und 200 MB. Größer wird es bei Multi-Site-Setups, großen WooCommerce-Shops oder Membership-Sites. Wenn deine DB ohne ersichtlichen Grund über 500 MB wiegt, hat sie wahrscheinlich Bloat-Probleme: verwaiste Transients, autoload-belastetes `wp_options`, gelöschte Posts in `wp_postmeta`. Das Widget zeigt die größte Tabelle und ihre Größe.

= Was bedeutet ein hoher TTFB-Wert in WordPress? =

TTFB (Time to First Byte) misst, wie lange dein Server braucht, bevor er das erste Byte HTML an den Browser sendet. Werte unter 200 ms sind sehr gut, 200–500 ms okay, 500–800 ms grenzwertig, über 800 ms problematisch. Hohe TTFB-Werte kommen entweder vom Hoster (überlastet, falsche PHP-Version, kein Caching), von WordPress selbst (Heartbeat-API, zu viele autoloaded Options, schwere Plugins) oder von der Datenbank (langsame Queries, fehlende Indizes). Das Widget zeigt den Wert und gibt eine Diagnose-Richtung.

= Verlangsamt das Plugin mein Dashboard? =

Das Widget rendert beim Dashboard-Load und berechnet die 5 Werte jedes Mal neu. Die teuerste Operation ist der `wp_remote_get`-Call auf die Home-URL (6 Sekunden Timeout) für TTFB. Bei einer gesunden Site addiert das 100–800 ms zum Dashboard-Render. Wenn deine Home-URL unerreichbar ist, zeigt das Widget „n/v" statt zu hängen.

= Behebt das Plugin Probleme automatisch? =

Nein. Das Plugin ist reine Diagnose. Es gibt keinen „Click to fix"-Button, keinen Auto-Updater, keine Remote-Konfiguration. Fixes passieren über die verlinkten Smart-Fix-Snippets — copy-paste, du behältst die Kontrolle.

= Funktioniert das Plugin mit WordPress-Multisite? =

Ja. Im Network-Modus wird das Widget auf jeder Site einzeln angezeigt. Ein Network-Admin-Overview, der die Health-Werte aller Sites in einer Tabelle zeigt, ist für eine spätere Version geplant.

= Wird das Plugin bei meinem Hoster funktionieren (IONOS, Strato, All-Inkl, Hetzner, webgo)? =

Ja — getestet mit allen genannten deutschen Shared-Hostern. Bei Hostern, die `information_schema` sperren (selten — manche Strato/All-Inkl-Pläne), zeigt das Widget bei Datenbank-Größe „n/v" statt eines Wertes; alle anderen Metriken laufen weiter.

= Welche Daten werden an externe Server gesendet? =

Standardmäßig: KEINE. Alle Berechnungen passieren lokal auf deinem WordPress-Server. Das Widget macht einen einzigen ausgehenden HTTP-Request — und der geht an deine eigene Home-URL (für die TTFB-Messung). Kein Telemetry-Ping, kein Auto-Update-Server, kein Analytics. Wenn du dich später für den Tiefer-Audit auf WebsiteFix.com entscheidest, ist das eine separate Opt-in-Entscheidung mit Email-Registrierung.

= Gibt es eine kostenpflichtige Pro-Version? =

Ja. Auf website-fix.com bietet WebsiteFix einen Deep-Scan mit 92 Parametern, Auto-Fix-Funktionen und White-Label-Reports für Agenturen an. Das hier auf WordPress.org veröffentlichte Health-Check-Plugin ist vollständig kostenlos, dauerhaft nutzbar und enthält keinen Trial-Ablauf, kein Nag-Screen-Spam und keine Account-Pflicht.

== Screenshots ==

1. Das Dashboard-Widget mit den 5 Kennzahlen auf einen Blick.

== Changelog ==

= 0.3.0 — 2026-05-13 =
* Komplette Neupositionierung der 5 Kennzahlen: TTFB, Heartbeat-API-Last, Datenbank-Größe + Top-Tabelle, PHP-Memory-Auslastung, Update-Backlog. Ersetzt die generischen v0.2.0-Werte (PHP-Version, SSL, WP-Core, Plugin-Updates, SEO-Basics), die mit dem eingebauten WordPress-Site-Health zu stark überlappten.
* TTFB-Messung via `wp_remote_get` auf `home_url()` mit Branchen-Schwellen (200/500/800 ms).
* Heartbeat-Frequenz über `apply_filters('heartbeat_settings', ...)` ausgelesen — zeigt den effektiven Wert, inkl. Plugin-Modifikationen.
* Datenbank-Größe + größte Tabelle via `information_schema`-Query (Fallback auf „n/v" bei gesperrten Hostern).
* PHP-Memory-Peak-Auslastung in Prozent — Hoster-Drossel-Indikator sichtbar.
* Update-Backlog getrennt nach kritisch (Core-Update oder 5+ Plugin-Updates) und regulär.

= 0.2.0 =
* Plugin renamed to "WebsiteFix Health Check & Deep Audit".
* Dashboard widget redesigned to a calmer, information-first table layout.
* Deep-audit link now routes to the dedicated `/plugin-report` landing page with proper UTM tracking.
* Read-only constraint explicitly documented in the widget footer and in `readme.txt`.

= 0.1.0 =
* Initial release. Five quick checks in a dashboard widget. Read-only by design.

== Upgrade Notice ==

= 0.3.0 =
Strategische Neupositionierung der 5 Kennzahlen — TTFB, Heartbeat, DB-Größe, Memory, Update-Backlog statt der generischen v0.2.0-Werte. Read-only bleibt erhalten.
