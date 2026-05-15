---
title: "XML-RPC deaktivieren in WordPress: Brute-Force-Schutz auf 3 Ebenen (2026)."
description: "Eine versteckte Datei in deinem WordPress ist 2026 das beliebteste Tor für Hacker — 1.000 Login-Versuche pro Sekunde, ohne dass dein Sicherheits-Plugin überhaupt mitkriegt, was läuft. So schließt du die Lücke, bevor Hacker deine Seite sperren — in 8 Minuten, mit Rücknahme-Sicherheit."
date: "2026-05-12"
category: "security"
tags:
  - "xmlrpc.php deaktivieren WordPress"
  - "wordpress xmlrpc abschalten"
  - "xml-rpc brute force schutz"
  - "xmlrpc.php sperren htaccess"
  - "wordpress brute force angriff verhindern"
  - "wordfence xmlrpc unzureichend"
  - "system.multicall brute force"
  - "wordpress login brute force schutz"
status: "published"
thumbnail: "/blog/xmlrpc-defense.webp"
ogImage: "/blog/xmlrpc-defense.webp"
howTo:
  name: "XML-RPC in WordPress auf Server- und Application-Ebene deaktivieren"
  description: "Defense-in-Depth-Konfiguration mit .htaccess-Regel auf Server-Level, PHP-Snippet auf App-Level und REST-API-User-Enumeration-Schutz. Inklusive automatischer Jetpack/Wordfence/Sucuri-Erkennung."
  totalTime: "PT8M"
  tool: "WordPress 5.9+, .htaccess-Zugriff (Apache) oder nginx.conf, Child-Theme oder Plugin Code Snippets"
  steps:
    - name: "Backup anlegen"
      text: "Pflicht-Schritt vor jeder Konfigurations-Änderung: Backup deiner WordPress-Site (Dateien + Datenbank) erstellen. Bei Hostern mit One-Click-Backup-Funktion reicht ein Klick im Hosting-Panel."
    - name: "Server-Level-Regel in .htaccess (oder nginx.conf) eintragen"
      text: "Auf Apache-Hostern (IONOS, Strato, All-Inkl, webgo): vier Zeilen in die .htaccess deines WordPress-Roots einfügen, die xmlrpc.php-Requests vor dem PHP-Bootstrap verwerfen. Auf nginx-Hostern (Hetzner, dedizierte Server): equivalente location-Regel in der Site-Config."
    - name: "XML-RPC-Hardening-Snippet aus dem Code-Lab kopieren"
      text: "Öffne die WebsiteFix Smart-Fix Library und kopiere den XML-RPC-Snippet (slug: xmlrpc-disable). Auto-Safety-Check erkennt aktives Jetpack, Wordfence oder Sucuri und greift in dem Fall NICHT ein."
      url: "https://website-fix.com/smart-fix-library#snippet-xmlrpc-disable"
    - name: "Snippet in functions.php einfügen"
      text: "Füge den Code am Ende der functions.php deines aktiven Child-Themes ein — oder lege ihn als neues PHP-Snippet im Plugin Code Snippets an. Speichern."
    - name: "Wirkung per curl-Test verifizieren"
      text: "Im Terminal: curl -I https://deine-site.de/xmlrpc.php — Erwartung nach korrekter Server-Level-Regel: HTTP/1.1 403 Forbidden. Bei nur App-Level-Block: HTTP/1.1 200 OK mit Response-Body 'XML-RPC services are disabled on this site'."
faq:
  - q: "Was ist xmlrpc.php in WordPress?"
    a: "xmlrpc.php ist eine PHP-Datei im WordPress-Root, die seit Version 2.6 (2008) das XML-RPC-Protokoll für Remote-Publishing bereitstellt. Sie erlaubt Drittanbieter-Apps (WordPress-Mobile, Jetpack, Hootsuite, IFTTT), Beiträge zu posten, Kommentare zu lesen oder Pingbacks zu senden — ohne dass sich der User im wp-admin einloggen muss. Genau das macht sie 2026 zur beliebten Brute-Force-Angriffsfläche: jeder POST mit Login-Versuch geht durch, ohne Captcha, ohne wp-login.php-Rate-Limiting."
  - q: "Ist xmlrpc.php wirklich gefährlich?"
    a: "Ja, aktuell mehr als wp-login.php. Der Grund: die XML-RPC-Methode 'system.multicall' bündelt bis zu 1.000 Login-Versuche in einem einzigen HTTP-Request. Login-Throttling-Plugins (Limit Login Attempts, Wordfence) zählen Requests, nicht Login-Versuche pro Request — entsprechend wirkungslos. Wordfence-Quarterly-Reports der letzten zwei Jahre zeigen konstant 35–45 % aller Brute-Force-Aktivität gegen WordPress-Sites über xmlrpc.php, nicht über wp-login.php."
  - q: "Wie sehe ich, ob mein WordPress XML-RPC aktiv ist?"
    a: "Drei Wege. (1) curl-Test im Terminal: `curl -I https://deine-site.de/xmlrpc.php` — bei aktivem XML-RPC kommt HTTP 405 (POST-only) oder 200 OK zurück, bei deaktiviertem 403 oder 404. (2) Browser-Test: dieselbe URL aufrufen, bei aktivem XML-RPC erscheint die Text-Zeile 'XML-RPC server accepts POST requests only'. (3) Im Access-Log nach /xmlrpc.php-Einträgen grep'en — wenn da pro Tag hunderte POST-Versuche von wechselnden IPs stehen, läuft eine Brute-Force-Welle gegen dich."
  - q: "Reicht es, xmlrpc.php über Wordfence zu deaktivieren?"
    a: "Nein, nicht für CPU-Schutz. Wordfence (und Sucuri, iThemes Security etc.) schalten den WordPress-Filter xmlrpc_enabled aus. Der Filter greift aber ERST nach dem kompletten WordPress-Bootstrap — wp-load.php, wp-settings.php, Plugin-Init, Theme-Init, User-Auth-Check, dann erst Filter-Auswertung. Der Brute-Force-Request hat zu diesem Zeitpunkt bereits 80–200 ms CPU, 4–8 DB-Queries und Memory belegt. Bei 10.000 Versuchen pro Tag sind das ~20 CPU-Minuten Last für absolut nichts. Eine zusätzliche Server-Level-Regel (.htaccess) verwirft den Request, BEVOR PHP überhaupt startet — null CPU-Last."
  - q: "Brauche ich xmlrpc.php für Jetpack?"
    a: "Ja — Jetpack kommuniziert mit WordPress.com über XML-RPC. Wenn du Jetpack aktiv nutzt (Stats, Backup, Akismet via Jetpack), darfst du xmlrpc.php NICHT komplett deaktivieren, sonst brechen die Jetpack-Sync-Funktionen ab. Der Smart-Fix-Snippet aus der WebsiteFix-Library erkennt aktives Jetpack automatisch (active_plugins-Check) und greift in dem Fall NICHT ein. Gleich verhält er sich bei Wordfence und Sucuri."
  - q: "Funktioniert die WordPress-Mobile-App ohne XML-RPC?"
    a: "Ja, seit WordPress 5.6 (Dezember 2020). Die offizielle Mobile-App nutzt seitdem Application-Passwords als Auth-Mechanismus — ein moderneres, sichereres Verfahren als XML-RPC-Login. Application-Passwords werden im WordPress-Admin unter Benutzer → Dein Profil → Application-Passwords erzeugt. Die App akzeptiert sie genauso wie früher den XML-RPC-Login."
  - q: "Was passiert, wenn ich xmlrpc.php einfach lösche?"
    a: "Kurz funktioniert es, beim nächsten WordPress-Update ist die Datei zurück. WordPress-Core ersetzt fehlende Core-Dateien beim Update routinemäßig. Plus: manche Server-Software meldet 500-Fehler statt 404, wenn eine erwartete Core-Datei fehlt. Sichererer Pfad: Datei behalten, aber per .htaccess-Regel den Zugriff blockieren UND per PHP-Filter die Funktionalität abschalten. Das ist die Defense-in-Depth-Variante, die dieser Post empfiehlt."
---

![XML-RPC deaktivieren — Drei-Schichten-Defense gegen Brute-Force-Angriffe auf WordPress](/blog/xmlrpc-defense.webp)

# XML-RPC deaktivieren in WordPress: Brute-Force-Schutz auf 3 Ebenen (2026).

Hast du dich schon mal aus deiner eigenen WordPress-Site ausgesperrt gefühlt? Oder gehört, dass die Seite einer Bekannten plötzlich „gehackt" wurde, alle Beiträge weg, Hoster verlangt 300 €, um irgendwas zurückzuholen?

**Du bist nicht paranoid — das passiert 2026 jeden Tag, hunderttausendfach.** In deinem WordPress steckt eine versteckte Datei namens `xmlrpc.php`, die 2008 für eine längst vergessene Funktion eingebaut wurde. Heute ist sie das **beliebteste Einfallstor für Brute-Force-Angriffe**: über ein einziges Schlupfloch können Hacker **1.000 Passwort-Kombinationen pro Sekunde** durchprobieren. Selbst wenn du Wordfence, Limit Login Attempts oder ein anderes Sicherheits-Plugin installiert hast — die meisten erkennen diese Angriffsart nicht oder zu spät.

Im Frühjahr 2026 gingen laut Wordfence-Branchenreport **41 % aller Hacking-Versuche gegen WordPress über genau diese Datei**. Wenn dein Hoster dich irgendwann mit „Account temporär gesperrt — verdächtige Aktivität" überrascht, ist das in 9 von 10 Fällen der Grund.

Die gute Nachricht: du kannst die Lücke schließen, **bevor Hacker deine Seite sperren**. Ohne dass du WordPress verstehst, ohne dass du etwas auf der Seite kaputtmachst. Klick für Klick, in 8 Minuten.

> ### In 30 Sekunden zum Punkt
>
> Eine versteckte Datei in deinem WordPress (`xmlrpc.php`) lässt Hacker **1.000 Passwort-Versuche pro Sekunde** durchprobieren — und dein Sicherheits-Plugin merkt davon meistens nichts. Wenn du nichts tust, bekommst du irgendwann eine Mail vom Hoster: „**Account temporär gesperrt — verdächtige Aktivität**." Dann ist deine Seite offline, und du brauchst Hilfe vom Support, um sie wieder freischalten zu lassen.
>
> Wir zeigen dir, wie du die Lücke in **8 Minuten** schließt — mit eingebauter Sicherheits-Prüfung, die erkennt, ob du Jetpack oder ein Sicherheits-Plugin nutzt, das die Funktion noch braucht. In dem Fall stoppt sie sich selbst, du machst nichts kaputt.
>
> **Drei Wege zur Lösung — wähl, was zu dir passt:**
>
> - [Komplette Schritt-für-Schritt-Anleitung als PDF für 9,90 € →](/scan/checkout) (kein Konto nötig, mit hostspezifischen Klick-Pfaden für Strato/IONOS/All-Inkl/Hetzner)
> - [Erst scannen, ob diese Lücke bei DIR offen ist →](/scan) (kostenlos, 60 Sekunden)
> - [Code-Snippet für Selbst-Macher →](/smart-fix-library#snippet-xmlrpc-disable) (copy-paste-ready, mit Safety-Wrapper)

---

## Was XML-RPC ist und warum es heute ein Angriffsmagnet ist

XML-RPC ist ein Remote-Procedure-Call-Protokoll, das seit WordPress 2.6 (2008) im Core mitgeliefert wird. Ursprünglich für Remote-Publishing gedacht: du schreibst einen Artikel in einer Desktop-App (damals: MarsEdit, Windows Live Writer), und sie pusht den Beitrag per XML-RPC ins WordPress. Plus Trackbacks und Pingbacks zwischen Blogs.

2026 ist diese Architektur eine Sicherheits-Antiquität. Drei Gründe:

**1. `system.multicall` ist Brute-Force-Beschleuniger.**
Diese eine XML-RPC-Methode erlaubt, mehrere Calls in einem HTTP-Request zu bündeln. Angreifer nutzen das, um in einem POST 1.000 Username/Passwort-Kombinationen durchzuprobieren. Klassisches Login-Throttling, das auf „X failed logins per minute per IP" basiert, sieht nur EINEN Request und blockt nicht.

**2. Kein Captcha, kein 2FA, kein Rate-Limiting im Default.**
Die XML-RPC-Schnittstelle hat keine native Anti-Bot-Schicht. Während wp-login.php seit Jahren von hunderten Plugins gehärtet wird (Two-Factor-Auth, Captcha, Honeypot etc.), bleibt xmlrpc.php das untergeschmiedete Hinterzimmer.

**3. Die wenigsten Sites nutzen XML-RPC noch aktiv.**
Mit WordPress 5.6 (Dezember 2020) wurde Application-Passwords als modernerer Auth-Pfad eingeführt. Die offizielle Mobile-App, fast alle Headless-CMS-Integrationen und die meisten Publishing-Tools nutzen heute REST-API oder Application-Passwords. XML-RPC ist für 80–90 % der Sites Dead Weight mit aktiver Angriffsfläche.

**Cloudflare-Daten Q4 2025:** in den ausgewerteten 12 Mio. WordPress-Sites auf Cloudflare-DNS gingen ~37 % aller verworfenen Login-Requests an `/xmlrpc.php`. Bei Sites unter 10k Monthly Visitors war der Anteil sogar bei 52 % — kleine Sites werden disproportional getroffen, weil sie keine teuren Security-Plugins kaufen.

---

## Symptome auf deiner Site

Wenn drei dieser Indikatoren bei dir zutreffen, läuft mit hoher Wahrscheinlichkeit eine XML-RPC-Brute-Force-Welle:

- **Plötzliche CPU-Spitzen** ohne entsprechenden Frontend-Traffic. Du siehst im Hosting-Panel oder via `top` einen anhaltend hohen PHP-Worker-Verbrauch, obwohl der Frontend-Traffic flach ist.
- **Access-Log voller `POST /xmlrpc.php`-Einträge**, IPs bunt gemischt aus DE/RU/CN/US — verteilte Botnets, nicht einzelne Angreifer.
- **Wordfence- oder Sucuri-Dashboard zeigt XML-RPC-Blocks im vierstelligen Bereich pro Tag.** Du denkst „gut, wird ja geblockt" — siehe Sektion zum Wordfence-Trick weiter unten, das ist trügerisch.
- **Hoster-Warn-Mails** mit Betreff „erhöhter Ressourcen-Verbrauch", „CPU-Limit überschritten" oder „IO-Operationen erhöht". Vor allem Strato und IONOS verschicken die routinemäßig.
- **HEAD-Test gibt 200 OK statt 403/404:** `curl -I https://deine-site.de/xmlrpc.php`. Bei aktivem XML-RPC bekommst du Status 405 (Method Not Allowed) oder 200 — beides Hinweis, dass die Datei vom Server angenommen + von PHP geladen wird.

Wenn keines davon zutrifft, betreibst du wahrscheinlich eine Hochsicherheits-Site oder einen Hoster mit gutem Edge-Filtering. Wenn mehrere zutreffen: weiterlesen, das ist genau dein Schmerzpunkt.

---

## Der Wordfence-Trick: warum „blocken" oft nicht reicht

Hier ist die unbequeme Wahrheit, die kaum ein Security-Plugin-Tutorial offen ausspricht: **Wordfence, Sucuri und iThemes Security blockieren XML-RPC technisch zu spät.**

So sieht der Bootstrap-Pfad eines WordPress-Requests aus, wenn jemand `POST /xmlrpc.php` mit einem brute-force-Login-Payload an deinen Server schickt:

```
Apache/nginx empfängt Request
         ↓
PHP-FPM startet Worker-Prozess
         ↓
WordPress wp-load.php (loaded)
         ↓
wp-settings.php (Plugin-Loader)
         ↓
Aktive Plugins werden initialisiert (inkl. Wordfence)
         ↓
Theme wird geladen + functions.php
         ↓
Authentication-Check (Cookies, Headers)
         ↓
xmlrpc.php-Endpoint-Logik beginnt
         ↓
apply_filters( 'xmlrpc_enabled', true ) — JETZT erst checkt Wordfence
         ↓
"disabled" → Response zurück
```

Bis zum Filter-Check sind **80–200 ms CPU-Zeit verbraucht**, je nach Plugin-Stack zwischen 4 und 12 DB-Queries gelaufen, und der Memory-Peak hat 16–48 MB belegt. Pro Request. Bei einer Brute-Force-Welle mit 10.000 Versuchen pro Tag ergibt das:

| Kennzahl | Pro Tag |
|----------|---------|
| Verbrauchte CPU-Zeit (nur für abgewiesene XML-RPC-Calls) | ~20–35 Minuten |
| Lese-Queries auf wp_options + wp_users | 40.000–120.000 |
| Memory-Peaks > 32 MB | ~10.000 |

Dein Wordfence-Dashboard zeigt „10.000 Blocks heute" — und du denkst, du bist geschützt. Du bist es technisch auf Login-Ebene, aber dein Hoster verrechnet trotzdem die CPU-Last. Bei Shared-Hosting-Plänen mit hartem CPU-Quota landest du regelmäßig im 503-Timeout, obwohl deine eigentliche Site kaum Traffic hat.

**Lösung: den Request schon auf Server-Level abweisen, bevor PHP überhaupt startet.** Genau das macht Schicht 1.

---

## Schicht 1: Server-Level-Block (Apache + nginx)

Die effektivste Verteidigung passiert vor dem WordPress-Bootstrap.

### Apache (.htaccess) — Standard für IONOS, Strato, All-Inkl, webgo

Öffne die `.htaccess` im WordPress-Root (gleiche Ebene wie wp-config.php) und füge die folgenden Zeilen ein, am besten am Anfang:

```apache
# XML-RPC vor WordPress-Bootstrap blockieren
<Files xmlrpc.php>
    Require all denied
</Files>
```

Wirkung: Apache schickt sofort 403 Forbidden zurück, sobald die URL auf `xmlrpc.php` matched. WordPress wird nie geladen. Null PHP-Cost. Null DB-Query. Null Memory.

### nginx (nginx.conf oder Site-Config) — für Hetzner, dedizierte Server, manche Managed-WordPress-Hoster

In deine Site-Config (typisch `/etc/nginx/sites-available/deine-site.conf`):

```nginx
location = /xmlrpc.php {
    deny all;
    access_log off;
    log_not_found off;
    return 444;
}
```

`return 444` ist nginx-spezifisch und schließt die Verbindung ohne Response — Bots bekommen nicht mal ein Status-Code-Feedback, was sie konfusioniert und manche Brute-Force-Frameworks zum Rückzug bewegt. `access_log off` plus `log_not_found off` verhindern, dass dein Server-Log mit 10.000 Brute-Force-Zeilen pro Tag voll-läuft.

### Was tun, wenn du keinen Server-Zugriff hast

Bei stark managed WordPress-Hostern (manche Strato-Tarife, Hostpoint, Webhostone) hast du eventuell keinen .htaccess-Zugriff und keinen nginx-Edit-Pfad. In dem Fall: **App-Level-Block (Schicht 2) reicht als alleinige Verteidigung, du verschenkst aber den Bootstrap-Schutz.** Optional: Cloudflare-DNS mit eigener Firewall-Regel auf `/xmlrpc.php` einrichten — Free-Plan reicht für eine simple Block-Regel.

---

## Schicht 2: PHP-Snippet aus der Smart-Fix-Library

Die zweite Schicht greift, wenn (a) du kein Server-Level-Zugriff hast, (b) als Defense-in-Depth-Backup für den Fall, dass die .htaccess-Regel mal versehentlich gelöscht wird (passiert bei Theme-Migrationen häufiger als man denkt), und (c) für die Pingback-Funktionalität und User-Enumeration-Hardening, die auf Server-Level nicht abgedeckt sind.

Der vollständige Snippet — inklusive Auto-Safety-Check, Pingback-Header-Cleanup und REST-API-User-Enumeration-Schutz — liegt copy-paste-ready hier:

> **[XML-RPC-Hardening-Snippet im Code-Lab öffnen →](/smart-fix-library#snippet-xmlrpc-disable)**

Der Kern in zwei Filtern:

```php
// XML-RPC vollständig deaktivieren
add_filter( 'xmlrpc_enabled', '__return_false' );

// Pingback-Methoden zusätzlich aus der xmlrpc-Methods-Liste werfen
add_filter( 'xmlrpc_methods', function( $methods ) {
    unset( $methods['pingback.ping'] );
    unset( $methods['pingback.extensions.getPingbacks'] );
    return $methods;
}, 10, 1 );
```

Das ist Defense-in-Depth: selbst wenn ein Plugin den `xmlrpc_enabled`-Filter überschreibt, ist `pingback.ping` separat entfernt. Plus: ausgehende Pingbacks werden abgeschaltet (`pre_option_default_pingback_flag` → zero) und der `X-Pingback`-Header verschwindet aus den HTTP-Responses — Bots erkennen WordPress-Sites oft an diesem Header.

**Der Killer-Vorteil gegenüber einem Plugin:** der Snippet enthält einen Auto-Safety-Check, der die `active_plugins`-Liste auf konkurrierende Security-Plugins prüft. Wenn Jetpack, Wordfence oder Sucuri aktiv sind, bricht der Snippet mit `return` ab und schreibt nur einen WP_DEBUG-Log-Eintrag. Du läufst nie in eine Doppel-Konfiguration, die sich gegenseitig überschreibt.

Warum überhaupt ein Snippet statt eines Plugins? Drei Gründe: keine Update-Overhead (Plugin-Maintainer kann aufgeben, Snippet bleibt unverändert dein), kein zusätzlicher Plugin-Slot (ein weniger im wp-admin), und version-controlled im Child-Theme oder Code-Snippets-Plugin — bei Site-Migrationen wandert die Konfiguration automatisch mit.

---

## Schicht 3: REST-API-Hardening gegen User-Enumeration

Das ist die Sektion, die in 9 von 10 XML-RPC-Härtungs-Anleitungen fehlt — und gleichzeitig der bequemste Brute-Force-Vorbereitungs-Trick für Angreifer.

WordPress' REST-API bietet seit Version 4.7 (Dezember 2016) den Endpunkt `/wp-json/wp/v2/users`. Bei Standard-Konfiguration listet er ALLE Benutzer der Site auf, ohne Authentifizierung. Was siehst du da? User-ID, Slug, Anzeige-Name — und bei manchen Konfigurationen sogar den `username`, mit dem der User sich einloggt.

Probiere es jetzt: `curl https://deine-site.de/wp-json/wp/v2/users`. Wenn JSON mit Usernames zurückkommt: Angreifer wissen, wen sie via xmlrpc.php knacken müssen. Sie brauchen nicht raten — der Username liegt offen.

Der Snippet aus der Library enthält dafür einen REST-Authentication-Filter:

```php
add_filter( 'rest_authentication_errors', function( $result ) {
    if ( ! is_user_logged_in() && ! empty( $_SERVER['REQUEST_URI'] )
         && false !== strpos( wp_unslash( $_SERVER['REQUEST_URI'] ), '/wp-json/wp/v2/users' ) ) {
        return new WP_Error( 'rest_not_logged_in', 'Anmeldung erforderlich.', array( 'status' => 401 ) );
    }
    return $result;
}, 10, 1 );
```

Wirkung: anonyme Anfragen auf `/wp-json/wp/v2/users` werden mit 401 abgewiesen. Angemeldete Admin-User können den Endpunkt weiterhin nutzen (Funktionalität bleibt für legitime Use-Cases erhalten). Test: `curl https://deine-site.de/wp-json/wp/v2/users` → sollte jetzt `{"code":"rest_not_logged_in","message":"Anmeldung erforderlich.","data":{"status":401}}` zurückgeben.

---

## Wann XML-RPC LASSEN — die vier Ausnahmen

Vier Szenarien, in denen du XML-RPC NICHT deaktivieren solltest, oder zumindest sehr vorsichtig sein musst:

**1. Jetpack aktiv.**
Jetpack kommuniziert mit WordPress.com über XML-RPC. Wenn du Jetpack für Stats, Backup, Akismet oder die Mobile-Sync nutzt: NICHT deaktivieren. Der Snippet aus der Library erkennt das automatisch und macht ein No-op. Solltest du Jetpack später wieder deinstallieren, greift der Filter beim nächsten Page-Load und xmlrpc.php ist dann auch ohne manuelles Eingreifen geschlossen.

**2. WordPress-Mobile-App im Team-Einsatz mit Pre-5.6-Setup.**
Die offizielle App nutzt seit WP 5.6 (Dezember 2020) Application-Passwords statt XML-RPC. Wenn ihr aber ältere Custom-Apps oder Drittanbieter-Editoren (MarsEdit, BlogPress) im Einsatz habt: erst auf Application-Passwords migrieren, DANN xmlrpc.php schließen. Der Migrations-Pfad ist im WordPress-Profil-Bereich unter „Application-Passwords" sichtbar.

**3. Marketing-Suites (Hootsuite, Buffer, IFTTT-Recipes).**
Manche Social-Publishing-Tools posten Beiträge via XML-RPC. Hootsuite + Buffer haben seit 2021 alternative REST-API-Pfade, aber alte IFTTT-Recipes hängen oft an XML-RPC fest. Bevor du blockst: in den Tool-Settings prüfen, welche API-Methode genutzt wird.

**4. WordPress.com-Importer/-Exporter und Klone.**
Wenn du Sites von einer WordPress-Installation auf eine andere klonen willst und dabei den nativen Importer nutzt: temporär deaktiviert lassen, klonen, dann wieder aktivieren. Die meisten Backup-/Klone-Plugins (Duplicator, UpdraftPlus, Migrate Guru) nutzen aber ihre eigenen Protokolle und sind nicht betroffen.

---

## Verifizieren: hast du es richtig gemacht?

Drei Tests, vom oberflächlichsten zum gründlichsten — gehe alle drei durch, bevor du das Setup als „fertig" abhakst.

**Test 1 — Browser:**
`https://deine-site.de/xmlrpc.php` aufrufen.
- Bei korrekt gesetzter .htaccess: **403 Forbidden** (Apache-Default-Error-Page) oder leere Response (nginx mit `return 444`).
- Bei nur App-Level-Block: 200 OK mit Body „XML-RPC services are disabled on this site".
- Bei aktivem XML-RPC: „XML-RPC server accepts POST requests only." (HTTP 405).

**Test 2 — curl mit Header-Inspection:**
```bash
curl -I https://deine-site.de/xmlrpc.php
```
- Erwarteter Status-Code: `HTTP/1.1 403 Forbidden` (Server-Level-Block aktiv).

**Test 3 — Brute-Force-Simulation:**
Online-Tools wie [WPScan](https://wpscan.com/wordpress-security-scanner) prüfen die XML-RPC-Verfügbarkeit als Teil ihres Standard-Scans. Nach korrektem Server-Level-Block gibt's die Meldung „xmlrpc.php returns HTTP 403 — protected". Vor dem Setup steht da typisch „xmlrpc.php is accessible (HTTP 405)".

**Plus REST-API-Test:**
```bash
curl https://deine-site.de/wp-json/wp/v2/users
```
Erwartete Antwort nach Schicht 3:
```json
{"code":"rest_not_logged_in","message":"Anmeldung erforderlich.","data":{"status":401}}
```
Falls da immer noch eine User-Liste mit Slug + display_name zurückkommt: Snippet wurde nicht geladen oder ein Plugin überschreibt den Filter.

---

## Erweiterte Strategie für Agenturen

Für Sie als Agentur multipliziert sich der Effekt mit jeder Kundensite, die Sie betreuen. Beispiel-Rechnung für eine mittelgroße Agentur:

| Kennzahl | Ohne Schutz | Mit Schicht 1+2+3 |
|----------|-------------|-------------------|
| Kundensites | 30 | 30 |
| XML-RPC-Brute-Force-Versuche pro Site pro Tag (ø) | 5.000 | 5.000 (weiterhin Bot-Traffic) |
| CPU-Zeit pro abgewiesenem Versuch (App-Level) | ~100 ms | ~1 ms (Server-Level) |
| Tägliche CPU-Last allein durch XML-RPC | ~75 Minuten | <1 Minute |
| 503-Errors auf Kundensites / Monat (ø) | 12–20 | 0–1 |
| Hoster-Eskalations-Mails / Monat (ø) | 2–4 | 0 |

Bulk-Rollout-Empfehlung:
1. **MU-Plugin auf zentral verwalteter Site-Foundation** ablegen, das für alle Kundensites identisch ist. Der WebsiteFix One-Click Optimizer macht genau das: schreibt den Snippet als `mu-plugin` ins `/wp-content/mu-plugins/`-Verzeichnis und greift damit netzwerk-weit ohne Theme-Edit.
2. **.htaccess-Template** für die Foundation, das beim Site-Setup ausgerollt wird (Ansible, WP-CLI-Script, oder manuell beim Bereitstellen).
3. **Monitoring**: in der [WebsiteFix-Agency-Konsole](/fuer-agenturen) sehen Sie pro Kundensite, ob xmlrpc.php noch erreichbar ist plus die täglichen Brute-Force-Versuche — als ein einziges Dashboard-Widget.

---

## Weiterführend

Drei thematisch passende Anschluss-Lektüren, wenn dieser Post deinen XML-RPC-Schmerz aufgelöst hat:

- [Sicherheits-Check: 7 Warnzeichen, die du übersehen hast](/blog/ist-deine-website-unsicher) — wenn xmlrpc.php geschlossen ist, sind das die nächsten häufigsten Lücken.
- [Nach Security der Performance-Hebel: Heartbeat-API drosseln](/blog/wordpress-heartbeat-drosseln) — die zweite WordPress-Standardkonfiguration, die deinen Hoster grundlos belastet.
- [Alle 5 kuratierten Code-Snippets im Lab](/smart-fix-library) — der vollständige Smart-Fix-Katalog mit Heartbeat, jQuery-Migrate, Emojis, Query-Strings und XML-RPC.

Wenn du sofort messen willst, welche dieser Härtungs- und Optimierungs-Schritte für DEINE Site am dringendsten sind: der [92-Punkt Deep-Audit](/scan) liefert die individuelle Priorisierung in 60 Sekunden — ohne dass du ein Plugin installieren musst.
