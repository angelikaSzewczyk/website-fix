=== WebsiteFix One-Click Performance Optimizer ===
Contributors: websitefix
Tags: performance, optimization, heartbeat, xmlrpc, jquery
Requires at least: 5.9
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Aktiviere 5 kuratierte WordPress-Performance-Fixes mit einem Klick. Sicher, reversibel, ohne Code-Editing.

== Description ==

Du hast schon mal gehört „du solltest die Heartbeat-API drosseln" oder „xmlrpc.php solltest du eigentlich abschalten"? Aber jedes Mal landest du in einem Forenthread mit 12 widersprüchlichen Code-Snippets, von denen 3 deine Site zerlegen.

**WebsiteFix One-Click Optimizer** löst genau dieses Problem. Fünf hand-kuratierte Performance-Fixes, jeder mit Safety-Check (erkennt konfligierende Plugins automatisch und greift dann NICHT ein), jeder per Klick aktivierbar und genauso per Klick wieder weg.

= Die 5 Fixes =

**1. Heartbeat-API drosseln**
Reduziert die WordPress-Heartbeat-Frequenz kontextabhängig: 60 s im Admin, 120 s im Post-Editor (statt 15 s), Frontend praktisch aus. Typische Ersparnis: 75–85 % weniger admin-ajax.php-Last → niedrigere CPU-Drosselung beim Hoster, deutlich niedrigerer TTFB-Wert.

**2. XML-RPC & Pingbacks deaktivieren**
Schließt den XML-RPC-Endpoint (mit Abstand die häufigste Brute-Force-Angriffsfläche auf WordPress) und schaltet ausgehende Pingbacks ab. Auto-Safety-Check: wenn Jetpack, Wordfence oder Sucuri aktiv sind, greift der Fix NICHT ein — du musst dich nicht zwischen Security-Plugin und xmlrpc-Hardening entscheiden. Plus REST-API-User-Enumeration-Schutz für anonyme Anfragen.

**3. Emojis & oEmbed-Discovery entfernen**
Entfernt die WordPress-Emoji-Polyfill-Scripte (`wp-emoji-release.min.js`, ~14 KB) und die oEmbed-Auto-Discovery-Routen. Spart 2–3 HTTP-Requests pro Page-Load. URL-Embeds im Editor bleiben funktional — nur die öffentliche Discovery wird abgeschaltet.

**4. Query-Strings aus statischen Assets entfernen**
Strippt `?ver=…` aus CSS/JS-Asset-Pfaden. Proxy- und CDN-Caches (Cloudflare, Hoster-Cache) können die Assets jetzt sauber cachen. Auto-Safety-Check: bei WP Rocket / W3 Total Cache / WP Super Cache greift der Fix NICHT ein — die Caching-Plugins machen das selbst.

**5. jQuery-Migrate aus dem Frontend entfernen**
Entfernt `jquery-migrate.min.js` (~11 KB) aus dem Frontend, lässt sie im Admin aber aktiv. Auf modernen Themes (2020+) ist Migrate überflüssig. Lighthouse-Performance-Score steigt typisch um 1–3 Punkte.

= Wie es technisch funktioniert =

Wenn du einen Fix aktivierst, schreibt das Plugin eine einzelne PHP-Datei nach `/wp-content/mu-plugins/wf-optimizer/<fix-slug>.php`. WordPress lädt Must-Use-Plugins **automatisch vor allen regulären Plugins** — kein Activation-Workflow nötig, kein Reload-Trick, der Fix greift sofort.

Beim Deaktivieren wird die Datei gelöscht. Standard-WordPress-Verhalten ist sofort wieder aktiv. Beim Deinstallieren des Plugins selbst werden ALLE Fix-Dateien automatisch entfernt.

**Wir editieren NIE deine functions.php.** Wir berühren keine Theme-Dateien, keine wp-config.php, keine bestehenden Plugins. Jeder Fix ist isoliert in seiner eigenen Datei — du kannst sie selbst inspizieren, und du kannst sie genauso einfach manuell löschen, wenn du das Plugin nicht mehr nutzen willst.

= Was es NICHT macht =

* Es schreibt nichts in deine Datenbank (`wp_options`-Eintrag mit der Liste aktiver Fixes ausgenommen — 50 Bytes).
* Es modifiziert keine Theme-Dateien, keine `functions.php`, keine `wp-config.php`.
* Es deaktiviert keine bestehenden Plugins automatisch — Auto-Safety-Check erkennt Konflikte und überspringt den Fix.
* Es sendet keine User-Daten an externe Server. Komplett offline-fähig.
* Es zeigt keine Werbe-Banner, keinen Nag-Screen, keinen Trial-Ablauf.

= Wer dahinter steht =

WebsiteFix ist ein in Frankfurt entwickeltes WordPress-Diagnose-Tool. Die fünf Snippets sind 1:1 aus unserer kostenlosen Smart-Fix-Library auf [website-fix.com/smart-fix-library](https://website-fix.com/smart-fix-library) portiert. Plugin ist Open-Source unter GPL, Feedback/Bugs: support@website-fix.com.

== Installation ==

1. Plugin im WordPress-Admin unter „Plugins → Installieren" suchen („WebsiteFix One-Click Optimizer") und aktivieren.
2. Unter „Werkzeuge → WebsiteFix Optimizer" findest du die 5 Fix-Cards.
3. Pro Card: Beschreibung lesen, optional „Code anzeigen" zur Inspektion ausklappen, dann „Fix aktivieren" klicken.
4. Oder oben „Alle 5 Fixes auf einmal aktivieren" für den schnellen Setup.
5. Frontend neu laden — Effekte greifen sofort.

**Hinweis zu Schreibrechten:** Der Plugin braucht Schreibzugriff auf `/wp-content/mu-plugins/`. Bei den meisten deutschen Hostern (IONOS, Strato, All-Inkl, Hetzner, webgo) ist das Standard. Falls das Plugin eine Schreibrechte-Warnung zeigt: Hosting-Support kontaktieren oder CHMOD auf 755 setzen.

== Frequently Asked Questions ==

= Wird mein Theme oder meine functions.php verändert? =

Nein. Das Plugin schreibt ausschließlich in `/wp-content/mu-plugins/wf-optimizer/` und legt dort pro aktivem Fix eine eigene PHP-Datei an. Dein Theme, deine `functions.php`, deine `wp-config.php` werden nie angerührt.

= Was passiert, wenn ich das Plugin deaktiviere? =

Die mu-plugin-Fix-Dateien bleiben aktiv — das ist Absicht. Du hast die Optimierungen bewusst aktiviert, sie sollen weiterlaufen, auch wenn du das Verwaltungs-UI nicht mehr brauchst. Wenn du wirklich alles aufräumen willst: erst alle Fixes im Admin-UI deaktivieren, dann das Plugin deinstallieren („Delete" statt nur „Deactivate").

= Was passiert, wenn ich das Plugin lösche? =

Beim Löschen (Uninstall) werden ALLE Fix-Dateien automatisch entfernt und die Optionen aufgeräumt. Standard-WordPress-Verhalten kehrt zurück.

= Wie kann ich sehen, was genau geschrieben wird, BEVOR ich auf Aktivieren klicke? =

Jede Card hat einen Toggle „Code anzeigen". Klick drauf und du siehst exakt den PHP-Code mit allen Safety-Checks, der in die mu-plugin-Datei geschrieben wird. Vollständig transparent.

= Wie sehe ich, ob mein Hoster meine WordPress-Site drosselt? =

Drei Indikatoren: Server-Response-Wert (TTFB) über 800 ms bei normaler Last, regelmäßige 503-/504-Fehler zu Bürozeiten, und Mails vom Hoster mit Betreff „CPU-Verbrauch erhöht". Häufigster Verursacher: die WordPress-Heartbeat-API. Aktiviere den Heartbeat-Fix — meistens normalisiert sich die CPU-Last innerhalb von 24 Stunden.

= Wie reduziere ich die WordPress-Heartbeat-API-Last? =

Heartbeat ruft sich standardmäßig alle 15 Sekunden im Admin auf. Der „Heartbeat-API drosseln"-Fix dieses Plugins reduziert die Frequenz kontextabhängig auf 60 s im Admin, 120 s im Post-Editor, 300 s im Frontend. Typische Ersparnis: 75–85 % weniger admin-ajax.php-Last.

= Wie deaktiviere ich xmlrpc.php in WordPress? =

Der „XML-RPC & Pingbacks deaktivieren"-Fix dieses Plugins schaltet xmlrpc.php sicher ab. Auto-Safety-Check erkennt aktives Jetpack, Wordfence oder Sucuri und greift in dem Fall NICHT ein — du musst dich nicht zwischen Security-Plugin und xmlrpc-Hardening entscheiden.

= Funktioniert das Plugin mit WordPress-Multisite? =

Ja. Da Fixes als Must-Use-Plugins abgelegt werden, gelten sie automatisch netzwerk-weit — eine einmalige Aktivierung reicht für alle Sites im Network.

= Was, wenn ich schon Heartbeat Control / WP Rocket / Wordfence nutze? =

Jeder Fix hat einen Auto-Safety-Check, der konfligierende Plugins erkennt und sich dann selbst deaktiviert. Du läufst nicht in Doppelt-Konfigurationen.

= Welche Daten werden an externe Server gesendet? =

Keine. Das Plugin ist vollständig offline-fähig. Keine Telemetrie, kein Auto-Update-Server, kein Analytics-Tracking.

= Was unterscheidet das Plugin von „Heartbeat Control" / „Disable Emojis" / „Disable XML-RPC"? =

Diese Einzel-Plugins lösen je eine Sache. Wir bündeln fünf häufige Performance-Killer in einem Tool mit konsistenter UX, Auto-Safety-Check pro Fix, transparenter Code-Preview vor jedem Apply, und einer Architektur (mu-plugins-Dateien), die zur Theme-Update-Zeit nicht überschrieben wird. Plus: ein einziges Plugin im Admin statt fünf.

= Ist das Plugin GDPR-/DSGVO-konform? =

Ja. Es verarbeitet keine personenbezogenen Daten, sendet nichts an externe Server und speichert nur die Liste aktiver Fix-Slugs in der WordPress-Optionen-Tabelle (Format: `["heartbeat-throttle","xmlrpc-disable"]`, ~50 Bytes).

== Screenshots ==

1. Die Settings-Page mit den 5 Fix-Cards und Live-Status-Pillen.
2. Eine einzelne Card mit ausgeklapptem Code-Preview vor dem Apply.
3. Die Master-Bar „Alle 5 Fixes auf einmal aktivieren".

== Changelog ==

= 0.1.0 — 2026-05-13 =
* Erste öffentliche Beta-Version.
* 5 Fix-Cards: Heartbeat, XML-RPC, Emojis & oEmbed, Query-Strings, jQuery-Migrate.
* Apply/Revert via Must-Use-Plugin-Dateien in `/wp-content/mu-plugins/wf-optimizer/`.
* Auto-Safety-Check pro Fix (erkennt konfligierende Plugins).
* Live-Diagnostic pro Card (zeigt aktuellen Status: aktiv/inaktiv + Detail).
* Code-Preview-Toggle pro Card (volle Transparenz vor Apply).
* Master-Action „Alle 5 Fixes auf einmal aktivieren / deaktivieren".
* Atomic File-Writes (rename-after-tmp).
* Sauberer Uninstall-Pfad — alle Fix-Dateien werden beim Plugin-Delete entfernt.

== Upgrade Notice ==

= 0.1.0 =
Erste öffentliche Beta. Aktiv getestet auf den fünf größten deutschen Shared-Hosting-Anbietern (IONOS, Strato, All-Inkl, Hetzner, webgo) und unter WordPress-Multisite.
