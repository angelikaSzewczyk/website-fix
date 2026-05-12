=== WebsiteFix Health-Check — WordPress Performance & Security Diagnose ===
Contributors: websitefix
Donate link: https://website-fix.com
Tags: performance, optimization, monitoring, security, diagnostics
Requires at least: 5.9
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 0.2.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

5 Kennzahlen direkt im WordPress-Dashboard zeigen, ob dein Hoster dich bremst: Server-Response, Heartbeat-Last, DB-Bloat, Memory, Update-Backlog.

== Description ==

Du hast den Verdacht, dass deine WordPress-Site langsamer ist als sie sein müsste? Dass dein Hoster „CPU-Überschreitung" meldet, obwohl gar nicht so viel los ist? Dass irgendwas im Hintergrund läuft, das du nicht siehst?

**WebsiteFix Health-Check zeigt dir in 60 Sekunden, woran es liegt.** Direkt im WordPress-Dashboard. Ohne Anmeldung. Ohne Account. Read-only — das Plugin schreibt nichts in deine Site, deaktiviert nichts automatisch und sendet keine User-Daten an externe Server.

= Die 5 Kennzahlen, die zeigen, wo deine Site verliert =

**1. Server-Response-Zeit (TTFB)**
Wie lange braucht dein Hoster, bevor er überhaupt antwortet? Werte über 800 ms sind ein Warnsignal — entweder dein Hoster ist überlastet, dein Plan ist zu klein, oder ein Plugin frisst die ersten 500 ms Bootstrap-Zeit. Das Widget zeigt den Wert tagesaktuell und zeigt direkt, ob ein Hoster-Wechsel sinnvoll wäre.

**2. Heartbeat-API-Last**
Die WordPress-Heartbeat-API pollt im Hintergrund alle 15 Sekunden auf admin-ajax.php — das ist auf vielen Shared-Hosting-Plänen der häufigste Grund für CPU-Drosselung durch den Hoster. Das Widget zeigt die aktuelle Frequenz, die hochgerechnete Last pro Stunde, und verlinkt auf einen kostenlosen PHP-Snippet, der die Frequenz kontextabhängig reduziert.

**3. Datenbank-Größe & Top-Bloat-Tabellen**
Eine WordPress-DB sollte selten über 100–200 MB liegen. Wenn deine Site bei 1,2 GB liegt, weiß das Widget welche Tabelle das verursacht (typisch: `wp_options` mit Autoload-Bloat, `wp_postmeta` mit verwaisten Einträgen, Transients-Caches). Du siehst exakt, was Speicher und DB-CPU bei deinem Hoster frisst.

**4. PHP-Memory-Limit & aktuelle Auslastung**
Dein Hoster hat dir 128 MB, 256 MB oder 512 MB zugewiesen? Wie viel davon nutzt dein WordPress tatsächlich? Wenn du regelmäßig 90 %+ Auslastung siehst, wirst du bei Last-Spitzen die berüchtigte „Allowed memory size exhausted"-Fehlermeldung kassieren — ein Hoster-Drossel-Signal, das die meisten zu spät merken.

**5. Update-Backlog (Core · Plugins · Themes)**
Wie viele Updates hängen wirklich? Getrennt nach kritisch (Security-Fixes), regulär (Feature-Updates) und veraltet (>180 Tage ohne Update). Du siehst auf einen Blick, welche Plugins seit Monaten nicht mehr gepflegt werden — ein Sicherheits- und Performance-Risiko, das Standard-WordPress nur als kleinen roten Kreis im Admin zeigt.

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

= Wer dahinter steht =

WebsiteFix ist ein in Frankfurt entwickeltes WordPress-Diagnose-Tool. Hosting + Daten bleiben in der EU (DSGVO-konform). Das Plugin ist Open-Source unter GPL-Lizenz und wird aktiv weiterentwickelt. Feedback und Bug-Reports via support@website-fix.com.

== Installation ==

1. Plugin im WordPress-Admin unter „Plugins → Installieren" suchen („WebsiteFix Health Check") und aktivieren.
2. Nach der Aktivierung erscheint das Widget oben rechts im WordPress-Dashboard.
3. Beim ersten Aufruf führt das Plugin einen Initial-Scan durch (~30 Sekunden) — danach aktualisiert sich das Widget alle 12 Stunden automatisch über WP-Cron.
4. Optional: Unter „Einstellungen → WebsiteFix" PageSpeed-Messung ein-/ausschalten, Cron-Intervall ändern (Standard: 12 h), oder das Widget für andere Benutzerrollen sichtbar machen.

== Frequently Asked Questions ==

= Wie sehe ich, ob mein Hoster meine WordPress-Site drosselt? =

Drei Signale weisen auf Hoster-seitige Drosselung hin: ein Server-Response-Wert (TTFB) über 800 ms bei normaler Last, regelmäßige 503-/504-Fehler zu Bürozeiten, und Mails vom Hoster mit Betreff „CPU-Verbrauch erhöht". Das WebsiteFix Health-Check-Widget zeigt alle drei Indikatoren direkt im Dashboard und vergleicht deine Werte mit den Hosting-Branchenstandards für deutsche Shared-Hosting-Anbieter (IONOS, Strato, All-Inkl, Hetzner, webgo).

= Wie reduziere ich die WordPress-Heartbeat-API-Last? =

Die Heartbeat-API ruft sich alle 15 Sekunden im Admin auf und ist eine der häufigsten Ursachen für hohe CPU-Last auf Shared-Hosting. Das Plugin zeigt dir die aktuelle Frequenz. Für die Drosselung verlinkt das Widget auf einen kostenlosen PHP-Snippet, der die Frequenz kontextabhängig auf 60 s im Admin, 120 s im Post-Editor und 300 s im Frontend reduziert — typische Ersparnis: 75–85 % weniger admin-ajax.php-Last.

= Wie deaktiviere ich xmlrpc.php in WordPress? =

xmlrpc.php ist seit Jahren ein bevorzugtes Brute-Force-Angriffsziel. Wenn du keine WordPress-Mobile-App, kein Jetpack und kein externes Publishing-Tool nutzt, kannst du es gefahrlos abschalten. Der Smart-Fix-Snippet aus der Library erkennt automatisch ein aktives Jetpack/Wordfence/Sucuri und greift in dem Fall NICHT ein — du musst dich nicht zwischen Security-Plugin und xmlrpc-Hardening entscheiden.

= Wie groß darf meine WordPress-Datenbank werden? =

Faustregel: Bei einer Standard-WordPress-Site (Blog, Corporate-Website, kleine WooCommerce-Installation) liegen gesunde Datenbank-Größen zwischen 20 MB und 200 MB. Größer wird es bei Multi-Site-Setups, großen WooCommerce-Shops oder Membership-Sites. Wenn deine DB ohne ersichtlichen Grund über 500 MB wiegt, hat sie wahrscheinlich Bloat-Probleme: verwaiste Transients, autoload-belastetes wp_options, gelöschte Posts in wp_postmeta. Das Widget zeigt die drei größten Tabellen und ihren Bloat-Anteil.

= Was bedeutet ein hoher TTFB-Wert in WordPress? =

TTFB (Time to First Byte) misst, wie lange dein Server braucht, bevor er das erste Byte HTML an den Browser sendet. Werte unter 200 ms sind sehr gut, 200–500 ms okay, 500–800 ms grenzwertig, über 800 ms problematisch. Hohe TTFB-Werte kommen entweder vom Hoster (überlastet, falsche PHP-Version, kein Caching), von WordPress selbst (Heartbeat-API, zu viele autoloaded Options, schwere Plugins) oder von der Datenbank (langsame Queries, fehlende Indizes). Das Widget zeigt den Wert und gibt eine Diagnose-Richtung.

= Erkennt das Plugin Plugin-Konflikte? =

Ja. Es prüft auf bekannte Inkompatibilitäts-Patterns: deaktivierte WordPress-Core-Filter (z. B. zwei Plugins, die `wp_head` ausschalten), mehrfach registrierte Cron-Hooks, doppelte Asset-Enqueues. Das Widget nennt die wahrscheinlichen Konflikt-Quellen, deaktiviert aber nichts automatisch — die Entscheidung bleibt bei dir.

= Funktioniert das Plugin mit WordPress-Multisite? =

Ja. Im Network-Modus wird das Widget auf jeder Site einzeln angezeigt. Ein Network-Admin-Overview, der die Health-Werte aller Sites in einer Tabelle zeigt, ist für eine spätere Version geplant.

= Wird das Plugin bei meinem Hoster funktionieren (IONOS, Strato, All-Inkl, Hetzner, webgo)? =

Ja — getestet mit allen genannten deutschen Shared-Hostern. Bei Hostern, die ausgehende HTTP-Requests aus PHP-Skripten blockieren (selten), funktioniert die optionale PageSpeed-Messung nicht; alle anderen Metriken laufen weiter, weil sie lokal auf deinem WordPress-Server berechnet werden.

= Welche Daten werden an externe Server gesendet? =

Standardmäßig nur die Site-URL an die offizielle Google-PageSpeed-Insights-API (für die TTFB-Vergleichswerte). Diese Messung lässt sich in den Einstellungen abschalten — dann verlässt KEINE Information deine WordPress-Installation. Keine User-Daten, keine Inhalte, keine Login-Daten, kein Tracking.

= Wie unterscheidet sich das Plugin von Site Health (WordPress Core)? =

Site Health (im WordPress-Kern integriert) prüft hauptsächlich Server-Konfiguration und Update-Status. WebsiteFix Health-Check ergänzt fünf konkrete Performance- und Sicherheits-Kennzahlen (Heartbeat-Frequenz, DB-Bloat, PageSpeed, Plugin-Konflikte, Memory-Auslastung) und verlinkt für jede Schwachstelle auf eine konkrete Code-Lösung in der Smart-Fix-Library.

= Gibt es eine kostenpflichtige Pro-Version? =

Ja. Auf website-fix.com bietet WebsiteFix einen Deep-Scan mit 92 Parametern, Auto-Fix-Funktionen und White-Label-Reports für Agenturen an. Das hier auf WordPress.org veröffentlichte Health-Check-Plugin ist vollständig kostenlos, dauerhaft nutzbar und enthält keinen Trial-Ablauf, kein Nag-Screen-Spam und keine Account-Pflicht.

== Screenshots ==

1. Das Health-Check-Widget direkt im WordPress-Dashboard mit den 5 Kennzahlen auf einen Blick.
2. Detail-Ansicht der Heartbeat-API-Frequenz inklusive Smart-Fix-Snippet-Link.
3. Datenbank-Tab mit den drei größten Tabellen und Bloat-Anteil.
4. PageSpeed-Vergleich gegen den Hosting-Branchen-Durchschnitt.
5. Update-Backlog mit Kategorisierung (kritisch / regulär / veraltet).

== Changelog ==

= 0.2.0 — 2026-05-12 =
* Erste öffentliche Beta-Version auf WordPress.org.
* 5 Kennzahlen-Widget mit TTFB, Heartbeat-Frequenz, DB-Größe + Top-3-Bloat-Tabellen, PHP-Memory-Auslastung, Update-Backlog.
* WP-Cron-basierter Hintergrund-Scan alle 12 h.
* Verlinkung zur Smart-Fix-Library auf website-fix.com.
* Vollständig read-only — schreibt nichts in WordPress-Daten.
* DSGVO-konform — alle Berechnungen lokal, optionale PageSpeed-Messung über offizielle Google-API.

== Upgrade Notice ==

= 0.2.0 =
Erste öffentliche Beta. Aktiv getestet auf den fünf größten deutschen Shared-Hosting-Anbietern (IONOS, Strato, All-Inkl, Hetzner, webgo).
