---
title: "PHP-Fehler im Header? In 90 Sekunden weg vom Schirm"
description: 'Hässliche Code-Zeilen vor jedem Besucher? Hier die saubere Copy-Paste-Lösung — plus warum „verstecken" allein nicht reicht.'
date: "2026-06-04"
category: "wordpress"
tags:
  - "php fehlermeldungen wordpress deaktivieren"
  - "wp_debug ausschalten"
  - "php notice warning im frontend"
  - "deprecated warning wordpress entfernen"
  - "wp-config.php fehleranzeige aus"
  - "wordpress fehler vor besuchern verstecken"
  - "php notice undefined index wordpress"
  - "display_errors off wordpress"
status: "published"
thumbnail: "/blog/panik-stopper.webp"
ogImage: "/blog/panik-stopper.webp"
faq:
  - q: "Warum stehen plötzlich PHP-Fehlermeldungen sichtbar auf meiner WordPress-Website?"
    a: "Drei häufige Auslöser: (1) Dein Hoster hat im Update den PHP-Display-Errors-Wert auf 'On' gesetzt (passiert oft bei Strato/IONOS-Wartungsfenstern), (2) ein Plugin- oder Theme-Update hat WP_DEBUG aktiviert ohne WP_DEBUG_DISPLAY zu deaktivieren, (3) ein Entwickler hat zum Debuggen die wp-config.php geändert und vergessen die Änderung rückgängig zu machen. In allen Fällen werden Notices, Warnings und Deprecated-Hinweise direkt im HTML-Output angezeigt — sichtbar für jeden Besucher, auch für Google-Crawler."
  - q: "Sind sichtbare PHP-Fehlermeldungen ein Sicherheitsrisiko?"
    a: "Ja, ernsthaft. Sie verraten Angreifern: (1) deinen exakten Server-Pfad (z.B. /var/www/vhosts/coachingbusiness.de/httpdocs/wp-content/plugins/...), (2) deine Plugin-Versionen, (3) PHP-Version, (4) bei manchen Notices sogar Variableninhalte, in denen Datenbankzugangsdaten oder API-Keys stehen können. Automatisierte Scanner-Bots (Shodan, Nmap-Scripts) erfassen solche Leaks und nutzen sie für gezielte Angriffe. Außerdem deindexiert Google Seiten mit sichtbaren Fehlermeldungen schneller, weil sie als 'Soft 404' oder 'Low Quality' eingestuft werden."
  - q: "Wie deaktiviere ich PHP-Fehlermeldungen in WordPress dauerhaft?"
    a: "Per FTP die wp-config.php im Hauptverzeichnis öffnen. Suche die Zeile `define('WP_DEBUG', true);` und ändere zu `define('WP_DEBUG', false);`. Falls die Zeile fehlt, füge VOR dem Kommentar `/* That's all, stop editing! */` ein: `define('WP_DEBUG', false);`. Wenn das Problem auch danach besteht (Hoster setzt PHP-Settings über): zusätzlich `ini_set('display_errors', 0);` und `error_reporting(0);` direkt nach `<?php` einfügen. Speichern, hochladen, Seite neu laden — die Fehler sind weg."
  - q: "Was ist der Unterschied zwischen WP_DEBUG, WP_DEBUG_LOG und WP_DEBUG_DISPLAY?"
    a: "WP_DEBUG (true/false) schaltet WordPress-internes Error-Reporting an oder aus. WP_DEBUG_LOG (true/false) schreibt Fehler in eine Log-Datei unter /wp-content/debug.log statt sie öffentlich anzuzeigen. WP_DEBUG_DISPLAY (true/false) bestimmt, ob Fehler im HTML-Output erscheinen — auf einer Live-Site sollte das immer false sein. Die saubere Production-Kombination: WP_DEBUG=true + WP_DEBUG_LOG=true + WP_DEBUG_DISPLAY=false. So bekommst du die Fehler privat in der Log-Datei, deine Besucher sehen nichts."
  - q: "Verschwindet das Problem wirklich, wenn ich nur die Anzeige deaktiviere?"
    a: "Nein — du versteckst es nur. Der zugrundeliegende PHP-Fehler läuft weiterhin, kostet Performance (jeder Notice schreibt in Log-Dateien, das verbraucht Schreibzyklen), und führt bei Deprecated-Warnings dazu, dass beim nächsten WordPress- oder PHP-Update die Funktion komplett verschwindet — und das Plugin endgültig kracht. Dauerhafte Lösung: in der Log-Datei nachsehen, welches Plugin oder Theme die Notices erzeugt, dieses Plugin updaten oder ersetzen, oder den Code in der functions.php des Child-Themes korrigieren."
  - q: "Wie finde ich heraus, welches Plugin die PHP-Notices erzeugt?"
    a: "Drei Wege: (1) In der debug.log unter /wp-content/debug.log nach dem Plugin-Pfad in den Fehlermeldungen suchen (Format: '... in /wp-content/plugins/PLUGIN-NAME/...'). (2) Plugins einzeln deaktivieren bis die Notices verschwinden — beim letzten deaktivierten Plugin lag das Problem. (3) Mit dem externen WebsiteFix-Scanner: er erkennt im HTML-Output Notice-Marker (typische PHP-Strings wie 'Notice:', 'Warning:', 'Deprecated:') und identifiziert das wahrscheinliche Quell-Plugin anhand der ?ver=-Strings und Asset-Pfade."
---

![PHP-Fehler im WordPress-Header — schnell weg vom Schirm, dann den echten Übeltäter finden](/blog/panik-stopper.webp)

# PHP-Fehler im Header? In 90 Sekunden vom Schirm — sauber.

Stell dir vor, du gibst gerade einer Klientin deine Visitenkarte — und auf der Rückseite hat jemand mit Edding *„Server-Fehler in Zeile 142"* gekritzelt. Genau so wirken **PHP-Fehlermeldungen oben auf deiner WordPress-Seite**: hässlich, unprofessionell, leakend, peinlich. Coaching-Klienten, Beratungs-Interessenten und Google-Crawler sehen statt deines Headers eine technische Code-Zeile, die deine Vertrauenswürdigkeit in 0.3 Sekunden zertrümmert.

Die gute Nachricht: **Das Wegmachen dauert 90 Sekunden.** Du brauchst nur FTP-Zugang und eine einzige Konfigurationsdatei. Die schlechte Nachricht ist subtil — und wichtig: *Wegmachen* heißt nicht *Beheben*. Der Fehler läuft im Hintergrund weiter, kostet Performance und wird beim nächsten PHP-Update zur tickenden Zeitbombe. Wir kümmern uns also um beides: erst die Anzeige weg vom Schirm, dann den echten Auslöser finden.

> ### Keine Zeit zum Lesen?
>
> **Unser Sofort-Scan findet das Quell-Plugin in 60 Sekunden** — er erkennt PHP-Notice-Marker im HTML-Output und identifiziert anhand von Asset-Versionen und Plugin-Fingerprints den wahrscheinlichen Verursacher. Plus konkrete Copy-Paste-Anleitung für die wp-config.php.
>
> [→ Jetzt kostenlos scannen](/scan) · [→ Schritt-für-Schritt-PDF zur PHP-Error-Bereinigung für 9,90 €](/scan/checkout)

---

## Was du da eigentlich siehst — die 4 PHP-Fehler-Kategorien

PHP unterscheidet Fehler-Schweregrade. Was bei dir oben auf der Seite steht, ist mit hoher Wahrscheinlichkeit einer dieser vier:

### 1. Notice (kleinste Stufe)

```
Notice: Undefined index: post_id in /wp-content/plugins/mein-plugin/main.php on line 87
```

Heißt: Ein Plugin greift auf eine Variable zu, die noch nicht gesetzt ist. Stört die Funktion nicht — aber jeder Aufruf erzeugt diese Zeile. Kommen leicht 200–500 Notices pro Page-Load zusammen.

### 2. Warning

```
Warning: file_get_contents(/tmp/cache.txt): Failed to open stream in /wp-content/themes/mein-theme/functions.php on line 23
```

Heißt: Etwas ist schiefgelaufen, aber PHP läuft weiter. Häufig bei fehlenden Dateirechten, vollen Speicherorten, abgelaufenen API-Tokens.

### 3. Deprecated

```
Deprecated: Function get_magic_quotes_gpc() is deprecated in /wp-content/plugins/altes-plugin/...
```

Heißt: Das Plugin nutzt eine PHP-Funktion, die in zukünftigen PHP-Versionen **wegfällt**. Tickende Zeitbombe — beim nächsten PHP-Update kracht das Plugin garantiert.

### 4. Fatal Error

```
Fatal error: Uncaught Error: Call to undefined function...
```

Heißt: Hier ist Schluss, PHP bricht ab. Wenn du das siehst, ist deine Seite oft komplett tot (White Screen oder *„Es gab einen kritischen Fehler"*). Für diesen Fall: [WordPress kritischer Fehler — in 2 Min selbst retten](/blog/wordpress-critical-error).

**Alle vier** lassen sich aus dem Frontend wegbekommen mit den gleichen wp-config.php-Settings. Nur den Fatal Error kannst du nicht „verstecken", weil PHP danach gar nichts mehr ausliefert — den musst du beheben.

---

## Sofort-Lösung: Copy-Paste in die wp-config.php

Die schnellste Methode. 90 Sekunden, FTP-Zugang reicht.

### Schritt 1: wp-config.php per FTP öffnen

Verbinde dich mit FileZilla, Cyberduck oder dem Hoster-Dateimanager. Navigiere ins WordPress-Hauptverzeichnis (oft `/httpdocs/`, `/public_html/` oder direkt im Domain-Root). Dort liegt `wp-config.php`.

**Wichtig:** Mach vorher eine Kopie — `wp-config.php` → `wp-config.php.backup`. Wenn du dich vertippst, kannst du sie wiederherstellen.

### Schritt 2: Die richtige Stelle finden

Öffne `wp-config.php` in einem Text-Editor (Notepad++, VS Code, oder dem Hoster-Dateimanager-Editor). Suche nach diesem Block (meist in der Mitte der Datei):

```php
/**
 * Für Entwickler: WordPress-Debug-Modus.
 *
 * Setze diesen Wert auf "true", um Hinweise während der Entwicklung anzuzeigen.
 * ...
 */
define('WP_DEBUG', false);
```

### Schritt 3: Den Block ersetzen

Ersetze den Block durch diesen sauberen Production-Block:

```php
// Production-Settings: Fehler privat loggen, nichts öffentlich zeigen
define('WP_DEBUG', false);
define('WP_DEBUG_LOG', false);
define('WP_DEBUG_DISPLAY', false);
@ini_set('display_errors', 0);
@ini_set('display_startup_errors', 0);
error_reporting(0);
```

**Was jede Zeile macht:**

| Direktive | Bedeutung |
|---|---|
| `WP_DEBUG = false` | WordPress eigenes Debug aus |
| `WP_DEBUG_LOG = false` | Keine Log-Datei mehr schreiben (spart Schreibzyklen) |
| `WP_DEBUG_DISPLAY = false` | Im HTML-Output erscheinen keine Fehler |
| `@ini_set('display_errors', 0)` | Notfall-Sicherung gegen Hoster-PHP-Override |
| `@ini_set('display_startup_errors', 0)` | Auch frühe PHP-Boot-Errors versteckt |
| `error_reporting(0)` | PHP-eigenes Reporting komplett aus |

Das `@` vor `ini_set` unterdrückt Warnings, falls dein Hoster die PHP-Direktiven gelocked hat — die Zeile gibt dann einfach `false` zurück und macht nichts kaputt.

### Schritt 4: Speichern, hochladen, Seite neu laden

Datei speichern, per FTP überschreiben, dann **Strg+F5 / Cmd+Shift+R** im Browser zum Hard-Refresh. Die Fehler-Zeilen müssen weg sein.

**Wenn sie noch da sind:** Dein Hoster überschreibt die `wp-config.php`-Settings auf Server-Ebene. Lösung — eine `.user.ini`-Datei (oder `.htaccess`-Block):

In `.htaccess` im WordPress-Hauptverzeichnis am Anfang einfügen:

```apache
php_flag display_errors Off
php_flag display_startup_errors Off
php_value error_reporting 0
```

Bei Nginx-Hostern (Raidboxes, manche SiteGround-Tarife) geht `.htaccess` nicht — dort musst du dem Hoster-Support schreiben: *„Bitte PHP-Direktive display_errors auf Off setzen für Domain XYZ."*

---

## Warum „verstecken" allein nicht reicht

Du hast jetzt die hässlichen Zeilen weg vom Schirm. **Aber:** der zugrundeliegende PHP-Fehler läuft trotzdem weiter, bei jedem Page-Load. Das hat drei Konsequenzen:

### Konsequenz 1: Performance-Verlust

Jeder Notice/Warning wird intern verarbeitet — auch wenn er nicht ausgegeben wird. Auf typischen Solo-Sites mit Plugin-Konflikten kommen 200–500 Notices pro Page-Load zusammen. Das kostet:

- 30–80 ms Render-Zeit (TTFB-Verschlechterung)
- bei aktivem `WP_DEBUG_LOG`: Schreibzyklen auf der `debug.log`-Datei (bei Shared-Hosting können die Storage-Limits sprengen)
- erhöhte CPU-Last → bei vielen Shared-Hosters → CPU-Throttling-Warning vom Hoster

### Konsequenz 2: Deprecated = Zeitbombe

Deprecated-Warnings sind PHP, das dir sagt: *„Diese Funktion verschwindet im nächsten Major-Release."* Wenn du sie versteckst, vergisst du sie — und beim PHP-7.4-zu-PHP-8.x-Update knallt dein Plugin mit einem Fatal Error. Plötzlich ist deine Seite tot, und du suchst Stunden nach dem Auslöser.

### Konsequenz 3: SEO-Schaden

Google sieht (oder hat in den letzten Crawls gesehen) die Fehler-Zeilen oben auf deiner Seite. Solche HTML-Verschmutzungen werden als **„Low Quality"** oder **„Soft 404"** eingestuft. Selbst wenn du sie jetzt versteckst, dauert es 2–6 Wochen, bis Google deinen Re-Crawl bewertet hat. Bis dahin sinkst du in Rankings.

**Was du also nach dem Verstecken zusätzlich tust:**

1. `WP_DEBUG_LOG = true` einmalig setzen (siehe nächster Abschnitt)
2. Die `/wp-content/debug.log` öffnen und schauen, **welches Plugin** die Fehler erzeugt
3. Dieses Plugin updaten oder ersetzen
4. Wieder `WP_DEBUG = false` setzen, Log löschen — saubere Ausgangslage

---

## Den echten Auslöser finden — mit dem Log-Trick

Wenn du wissen willst, **was** die Notices erzeugt (statt sie nur zu unterdrücken), brauchst du **Log-Modus** statt Display-Modus. Eine alternative `wp-config.php`-Config — temporär für die Diagnose:

```php
// DIAGNOSE-MODUS: Fehler in Log-Datei schreiben, nicht öffentlich anzeigen
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
@ini_set('display_errors', 0);
```

Wichtig: **`WP_DEBUG_DISPLAY` bleibt `false`** — sonst sehen Besucher trotzdem die Fehler.

Speichern. Seite normal benutzen (am besten 5–10 verschiedene Seiten aufrufen, Backend einmal komplett durchklicken). Dann per FTP nach `/wp-content/debug.log` schauen.

In der Datei stehen Zeilen wie:

```
[04-Jun-2026 14:23:11 UTC] PHP Notice: Undefined index: post_id in 
/wp-content/plugins/mein-plugin/main.php on line 87
```

→ Klare Aussage: Das Plugin `mein-plugin` ist schuld. Plugin-Update oder Ersatz.

```
[04-Jun-2026 14:24:02 UTC] PHP Deprecated: Function create_function() is 
deprecated in /wp-content/themes/altes-theme/lib/widgets.php
```

→ Dein Theme ist veraltet, nutzt eine seit PHP 7.2 verschwundene Funktion.

```
[04-Jun-2026 14:25:30 UTC] PHP Warning: Cannot modify header information in 
/wp-content/plugins/X/init.php
```

→ Plugin X gibt zu früh Output aus, vor den Headers. Update oder Deaktivierung.

**Wichtig nach der Diagnose:**

- `WP_DEBUG = false`, `WP_DEBUG_LOG = false` zurücksetzen
- `/wp-content/debug.log` löschen (sonst wird sie irgendwann zu groß)
- Bei Verdacht auf sensible Daten in den Logs: vor dem Löschen `cat debug.log | grep -E "password|api_key|token"` (per SSH) — wenn da was steht, ist die Datei ein Sicherheitsrisiko.

---

## Wenn der Übeltäter klar ist — was du dann tust

Je nach Notice-Quelle:

### Plugin verursacht Notices

1. Plugin auf neueste Version updaten
2. Wenn das Plugin seit > 12 Monaten nicht aktualisiert wurde: Ersatz suchen
3. Bei Custom-Plugins ohne Update-Pfad: deaktivieren + alternative Lösung

### Theme verursacht Notices/Deprecated

1. Theme updaten (Premium-Themes meist über Theme-eigenes Update-Center)
2. Bei veralteten Custom-Themes: Migration zu modernem Theme (Astra, GeneratePress, Kadence) — 2–8 Stunden Aufwand, aber dauerhafte Lösung
3. Bei kleinen Theme-Bugs: Fix in `functions.php` des **Child-Themes** (niemals im Eltern-Theme, das überschreibt das nächste Update)

### Hoster verursacht (PHP-Version too old)

Wenn deine PHP-Version 7.4 oder älter ist, sehen viele modernere Plugins Deprecated-Warnings. Lösung:
- Im Hoster-Panel auf PHP 8.2 oder 8.3 umstellen (1-Klick bei All-Inkl, Strato, IONOS, Hetzner)
- Vorher: Staging-Test, weil veraltete Plugins durch PHP-Upgrade krachen können

---

## Verhindern statt aufräumen: Setup von Anfang an sauber

Drei Routinen, die PHP-Notices erst gar nicht ins Frontend lassen:

### Routine A: Production-Mode-Standard

Jede neue WordPress-Site bekommt von Anfang an den Production-Block aus dem Sofort-Lösungs-Abschnitt. **Niemals** auf Live-Sites `WP_DEBUG = true` mit `WP_DEBUG_DISPLAY = true`.

### Routine B: Plugin-Hygiene

Vor Aktivierung eines neuen Plugins: WordPress.org-Listing checken — **letzte Aktualisierung** muss innerhalb der letzten 12 Monate sein, **Tested up to** muss aktuelle WordPress-Version sein. Damit filterst du 80 % der Notice-erzeugenden Plugins vorab raus.

### Routine C: Performance-Optimizer einsetzen

Schlanke Performance-Plugins erzeugen keine eigenen Notices, weil sie keine eigene Codebasis haben, die altert. Der **WebsiteFix One-Click Performance Optimizer** (Free auf WordPress.org) ist nach diesem Prinzip gebaut: 7 isolierte Snippet-Files unter `/wp-content/mu-plugins/`, jeder Snippet < 5 KB Code, keine Plugin-Dependencies. Damit kannst du Performance-Fixes aktivieren, ohne neue Notice-Quellen einzuführen.

> ### Schlanken Optimizer einsetzen
> Free auf WordPress.org, sofort einsatzbereit. 7 Performance-Snippets als isolierte mu-plugin-Files, keine Notice-Quellen, einzeln reversibel.
>
> 👉 **[Plugin auf WordPress.org installieren →](https://wordpress.org/plugins/websitefix-one-click-performance-optimizer/)** · [Mehr zur Landingpage →](/plugin/optimizer)

---

## Fazit: 90 Sekunden zum sauberen Frontend — und dann die echte Arbeit

PHP-Fehlermeldungen im WordPress-Frontend sind in 90 Sekunden weg, wenn du den Production-Config-Block aus diesem Post in deine `wp-config.php` einsetzt. Das ist die **Notfall-Maßnahme** — die schämstdich-vor-Klienten-Pflicht.

Die **dauerhafte Lösung** liegt darunter:

1. **Verstecken** (sofort): Production-Config-Block einsetzen, Fehler weg vom Schirm.
2. **Diagnose** (5 Minuten): Log-Modus einschalten, `debug.log` lesen, Plugin- oder Theme-Verursacher identifizieren.
3. **Beheben** (15 Minuten): Plugin updaten, Theme migrieren, oder PHP-Version hochziehen.
4. **Verhindern** (dauerhaft): Production-Mode-Standard, Plugin-Hygiene, schlanke Plugin-Architektur.

Wenn der externe Scan dir den wahrscheinlichen Notice-Verursacher direkt nennt — ohne dass du selbst durch debug.log gehst — geht der Schritt 2 von 5 Minuten auf 60 Sekunden.

**Wenn die PHP-Fehler bei dir nicht nur „im Header" stehen, sondern deine Seite gar nicht mehr lädt** (kompletter weißer Bildschirm oder *„Es gab einen kritischen Fehler"*-Meldung): das ist ein Fatal Error, kein Display-Problem. Hier ist der Notfall-Guide: [WordPress kritischer Fehler — in 2 Min selbst retten](/blog/wordpress-critical-error). Und wenn deine Seite zwar wieder läuft, aber [extrem langsam](/blog/website-laedt-extrem-langsam) ist — Notices kosten messbar Performance, und die saubere wp-config.php ist oft schon der erste TTFB-Gewinn.

> ### Notice-Quelle in 60 Sekunden identifizieren
> Der externe Scan erkennt PHP-Notice-Marker im HTML-Output und identifiziert anhand von Asset-Versionen und Plugin-Fingerprints das wahrscheinliche Quell-Plugin. Plus konkrete wp-config.php-Anleitung.
>
> 👉 **[Kostenlos scannen — PHP-Fehler-Diagnose →](/scan?problem=php-errors)**

---

## FAQ: Die häufigsten Fragen zu PHP-Fehlermeldungen in WordPress

### Warum stehen plötzlich PHP-Fehlermeldungen sichtbar auf meiner WordPress-Website?

Drei häufige Auslöser: (1) Dein Hoster hat im Update den PHP-Display-Errors-Wert auf *„On"* gesetzt (passiert oft bei Strato/IONOS-Wartungsfenstern), (2) ein Plugin- oder Theme-Update hat `WP_DEBUG` aktiviert ohne `WP_DEBUG_DISPLAY` zu deaktivieren, (3) ein Entwickler hat zum Debuggen die `wp-config.php` geändert und vergessen die Änderung rückgängig zu machen. In allen Fällen werden Notices, Warnings und Deprecated-Hinweise direkt im HTML-Output angezeigt — sichtbar für jeden Besucher, auch für Google-Crawler.

### Sind sichtbare PHP-Fehlermeldungen ein Sicherheitsrisiko?

Ja, ernsthaft. Sie verraten Angreifern: (1) deinen exakten Server-Pfad (z.B. `/var/www/vhosts/coachingbusiness.de/httpdocs/wp-content/plugins/...`), (2) deine Plugin-Versionen, (3) PHP-Version, (4) bei manchen Notices sogar Variableninhalte, in denen Datenbankzugangsdaten oder API-Keys stehen können. Automatisierte Scanner-Bots (Shodan, Nmap-Scripts) erfassen solche Leaks und nutzen sie für gezielte Angriffe. Außerdem deindexiert Google Seiten mit sichtbaren Fehlermeldungen schneller, weil sie als *„Soft 404"* oder *„Low Quality"* eingestuft werden.

### Wie deaktiviere ich PHP-Fehlermeldungen in WordPress dauerhaft?

Per FTP die `wp-config.php` im Hauptverzeichnis öffnen. Suche die Zeile `define('WP_DEBUG', true);` und ändere zu `define('WP_DEBUG', false);`. Falls die Zeile fehlt, füge VOR dem Kommentar `/* That's all, stop editing! */` ein: `define('WP_DEBUG', false);`. Wenn das Problem auch danach besteht (Hoster setzt PHP-Settings über): zusätzlich `ini_set('display_errors', 0);` und `error_reporting(0);` direkt nach `<?php` einfügen. Speichern, hochladen, Seite neu laden — die Fehler sind weg.

### Was ist der Unterschied zwischen WP_DEBUG, WP_DEBUG_LOG und WP_DEBUG_DISPLAY?

`WP_DEBUG` (true/false) schaltet WordPress-internes Error-Reporting an oder aus. `WP_DEBUG_LOG` (true/false) schreibt Fehler in eine Log-Datei unter `/wp-content/debug.log` statt sie öffentlich anzuzeigen. `WP_DEBUG_DISPLAY` (true/false) bestimmt, ob Fehler im HTML-Output erscheinen — auf einer Live-Site sollte das immer `false` sein. Die saubere Production-Kombination: `WP_DEBUG=true` + `WP_DEBUG_LOG=true` + `WP_DEBUG_DISPLAY=false`. So bekommst du die Fehler privat in der Log-Datei, deine Besucher sehen nichts.

### Verschwindet das Problem wirklich, wenn ich nur die Anzeige deaktiviere?

Nein — du versteckst es nur. Der zugrundeliegende PHP-Fehler läuft weiterhin, kostet Performance (jeder Notice schreibt in Log-Dateien, das verbraucht Schreibzyklen), und führt bei Deprecated-Warnings dazu, dass beim nächsten WordPress- oder PHP-Update die Funktion komplett verschwindet — und das Plugin endgültig kracht. Dauerhafte Lösung: in der Log-Datei nachsehen, welches Plugin oder Theme die Notices erzeugt, dieses Plugin updaten oder ersetzen, oder den Code in der `functions.php` des Child-Themes korrigieren.

### Wie finde ich heraus, welches Plugin die PHP-Notices erzeugt?

Drei Wege: (1) In der `debug.log` unter `/wp-content/debug.log` nach dem Plugin-Pfad in den Fehlermeldungen suchen (Format: *„… in /wp-content/plugins/PLUGIN-NAME/…"*). (2) Plugins einzeln deaktivieren bis die Notices verschwinden — beim letzten deaktivierten Plugin lag das Problem. (3) Mit dem externen WebsiteFix-Scanner: er erkennt im HTML-Output Notice-Marker (typische PHP-Strings wie *„Notice:"*, *„Warning:"*, *„Deprecated:"*) und identifiziert das wahrscheinliche Quell-Plugin anhand der `?ver=`-Strings und Asset-Pfade.

---

### Du hast die Fehler versteckt — aber findest den Auslöser nicht?

Der **WebsiteFix-Scanner** erkennt PHP-Notice-Marker im HTML-Output (selbst wenn sie kurz waren) und identifiziert anhand von Asset-Fingerprints, ?ver=-Strings und Plugin-Routen das wahrscheinliche Quell-Plugin. Du brauchst nur deine Domain, kein FTP-Zugang, kein Log-File-Lesen.

👉 **[Jetzt kostenlos prüfen — PHP-Fehler-Diagnose in 60 Sekunden →](/scan?problem=php-errors)**

*Kein Login, kein FTP, keine Kreditkarte. Mit konkretem Plugin-Namen, nicht nur einer Fehlerliste.*
