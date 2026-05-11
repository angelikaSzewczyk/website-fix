---
title: "WordPress-Fehler finden und fixen: Warum Standard-Tools bei echten Problemen versagen"
description: "Kritischer Fehler in WordPress oder Google-Sichtbarkeit verloren? Lerne, wie du mit dem WebsiteFix Röntgenblick tiefliegende Bremsen löst — die externe Scanner nicht sehen."
date: "2026-05-11"
category: "wordpress"
tags:
  - "WordPress kritischer Fehler"
  - "Warum findet Google meine Website nicht"
  - "PHP Error Log WordPress finden"
  - "WordPress Fehler beheben"
  - "WordPress nicht indexiert"
  - "WordPress Plugin-Konflikt"
  - "wp-options Datenbank langsam"
  - "Hoster-Logs Strato IONOS Hetzner"
status: "published"
thumbnail: "/blog/wordpress-roentgenblick.webp"
ogImage: "/blog/wordpress-roentgenblick.webp"
faq:
  - q: "Wie finde ich die Ursache für einen kritischen WordPress-Fehler?"
    a: "In über 80 % der Fälle steckt entweder ein PHP-Fehler oder ein Plugin-Konflikt dahinter. Aktiviere zuerst `WP_DEBUG = true` in der `wp-config.php` und prüfe das PHP-Error-Log (`/wp-content/debug.log` oder das Hoster-Log-Verzeichnis). Der erste Eintrag mit `Fatal error` zeigt dir Datei und Zeilennummer der Ursache. Wenn das Log leer bleibt oder du keinen Zugang hast, hilft ein Deep-Audit-Plugin: es liest die Logs direkt aus dem WordPress-Kern und nennt dir Datei + Zeile in 60 Sekunden."
  - q: "Warum zeigt mein Scanner keine Fehler an, obwohl die Seite langsam ist?"
    a: "Standard-Scanner sehen nur die Fassade — also das ausgelieferte HTML. Sie haben keinen Einblick in die Datenbank (`wp_options` bläht sich oft auf 50+ MB an Autoload-Daten auf), den Object-Cache, fehlerhafte Cronjobs oder PHP-Memory-Limits. Genau diese serverseitigen Bremsen verursachen langsame TTFB-Zeiten, ohne dass im HTML-Code etwas auffällt. Nur ein Deep-Audit-Plugin oder ein direkter Server-Zugriff bringt die echten Ursachen ans Licht."
  - q: "Wie sicher ist ein Deep-Audit-Plugin?"
    a: "Sicher, wenn es nach dem Hybrid-Prinzip arbeitet: Default Read-Only — das Plugin liest nur Konfiguration, Logs und Performance-Metriken aus, ohne Schreibzugriff. Schreibvorgänge passieren ausschließlich nach explizitem Klick durch dich. Das WebsiteFix-Plugin folgt diesem Prinzip: keine automatischen Änderungen, kein Remote-Code-Execution, jede Aktion ist im Aktivitätslog protokolliert (Art. 30 DSGVO-tauglich)."
  - q: "Was tun, wenn Google die neue Seite nicht indexiert?"
    a: "Drei häufige technische Blockaden: Erstens `noindex`-Meta-Tag oder `robots.txt`-Disallow auf der URL. Zweitens fehlende oder kaputte XML-Sitemap (Search Console → Sitemaps-Bericht). Drittens — der unterschätzte Punkt — Performance-Probleme: Wenn LCP über 4 Sekunden liegt oder der Googlebot in Timeouts läuft, brichtt er das Crawling ab. Prüfe in dieser Reihenfolge, dann fordere im Search-Console-URL-Inspector eine erneute Indexierung an."
  - q: "Wie lese ich den PHP-Error-Log bei Strato oder IONOS aus?"
    a: "Bei Strato: Kundencenter → 'Paket verwalten' → 'PHP & Datenbank' → 'PHP-Einstellungen' → 'Error-Log einsehen' (die letzten 1.000 Zeilen werden angezeigt). Bei IONOS: 'Hosting' → 'Performance' → 'Logs' → 'PHP-Fehlerprotokoll herunterladen'. Bei Hetzner (konsoleH): 'Tools' → 'Log-Dateien' → 'error.log'. Wer mehrere Hoster betreut, spart sich die Klick-Wanderung mit einem Deep-Audit-Plugin, das diese Logs direkt im Dashboard zusammenführt."
---

![Standard-Scan vs Röntgenblick — wo bremst WordPress wirklich](/blog/wordpress-roentgenblick.webp)

## Der Arzt, der nur den Puls misst

Du kennst diesen Moment. Du rufst deine WordPress-Seite auf — und siehst nur eine weiße Fläche. Oder die nüchterne Meldung: **„Es gab einen kritischen Fehler auf deiner Website."** Oder, noch fieser: Die Seite läuft, aber Google ignoriert dich seit Wochen. Keine Indexierung, kein Ranking, keine Anfragen.

Dein erster Reflex: einen Online-Scanner laufen lassen. Du gibst die URL ein, wartest 30 Sekunden, bekommst einen grünen Häkchen-Bericht — „Alles okay" — und stehst wieder am Anfang.

Das Problem ist nicht der Fehler. Das Problem ist das Werkzeug.

Ein Arzt, der nur den Puls misst, sieht keinen Knochenbruch. Genauso sehen Standard-Scanner nur die **Fassade** deiner Website — das ausgelieferte HTML, die geladenen Assets, die HTTP-Header. Die echten Bremsen liegen darunter: in der Datenbank, im PHP-Error-Log, in den Cronjobs, in der `functions.php`.

In diesem Beitrag zeigen wir dir, **warum** dein Standard-Tool die Wahrheit nicht sehen kann — und wie du mit dem **Röntgenblick** an die Wurzel kommst.

## Warum Google deine Seite übersieht

Google rankt Geschwindigkeit. Aber Geschwindigkeit ist nicht nur „Ladezeit im Browser". Sie ist eine Kette aus dutzenden Faktoren, die fast alle hinter den Kulissen passieren.

**Beispiel: Die `wp_options`-Tabelle.** Bei jeder Seitenanforderung lädt WordPress automatisch alle Optionen mit `autoload = 'yes'` aus dieser Tabelle in den RAM. Bei einer frischen Installation sind das ~200 KB. Bei einer drei Jahre alten Seite mit 40 Plugins (Aktiv + Reste deinstallierter): oft **50 bis 200 MB**.

Was passiert dann?

- **TTFB explodiert**: Time to First Byte schießt von 200 ms auf 2.500 ms.
- **PHP-Memory-Limit wird gefressen**: Plugins stürzen ab, weil kein RAM mehr da ist.
- **Googlebot bricht ab**: Wenn der Bot zu lange wartet, killt er das Crawling — deine Seite bleibt im Index-Limbo.

Ein externer Scanner sieht davon **nichts**. Er sieht nur, dass die Homepage in 3,2 Sekunden geladen ist. Er sieht nicht, dass ein einziger autoload-`option`-Eintrag aus einem 2019 deinstallierten Slider-Plugin 45 MB pro Request frisst.

**Die Indexierungs-Kette ist:**

1. Datenbank-Bloat → 2. Langsamer TTFB → 3. Googlebot-Timeout → 4. Sichtbarkeitsverlust

Wer Schritt 4 fixen will, muss bei Schritt 1 anfangen. Genau hier scheitert die externe Diagnose.

<div style="margin: 40px 0; padding: 28px 28px 24px; background: rgba(141,243,211,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;">
  <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #8df3d3; letter-spacing: 0.08em; text-transform: uppercase;">Gratis-Scan · 60 Sekunden</p>
  <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.02em;">Wo bremst deine Seite Google aus?</h3>
  <p style="margin: 0 0 20px; font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7;">Externer Scan mit Sichtbarkeits-Score, Hoster-Erkennung und Top-Optimierungen. Kein Login nötig.</p>
  <a href="/scan" style="display: inline-block; padding: 11px 22px; background: #fff; color: #0b0c10; border-radius: 9px; font-weight: 700; font-size: 14px; text-decoration: none;">Jetzt kostenlos scannen →</a>
  <p style="font-size: 11px; color: rgba(255,255,255,0.25); margin: 10px 0 0;">Kostenlos · Keine Anmeldung · DSGVO-konform</p>
</div>

## Der Mythos vom „externen Scan"

Externe SEO-Tools — GTmetrix, Lighthouse, PageSpeed Insights, Standard-SEO-Scanner — sind großartig. Aber sie sind **Beobachter**, keine Diagnostiker. Sie sehen das, was ein anonymer Browser sieht. Mehr nicht.

Was sie **niemals** sehen können:

**1. Plugin-Konflikte in der `functions.php`**
Wenn dein Custom-Theme oder ein Child-Theme einen `add_filter()`-Hook auf `the_content` registriert, der gleichzeitig von einem SEO-Plugin überschrieben wird, ist das Resultat: stille Seitenfehler, leere Meta-Descriptions, kaputte Excerpts. Im HTML siehst du nur das Endergebnis — nie die Kollision.

**2. Fehlerhafte Cronjobs**
WordPress hat kein echtes Cron — es ist „Pseudo-Cron", getriggert durch Seitenaufrufe. Wenn ein Plugin einen Hook auf `wp_scheduled_event` registriert, der pro Aufruf eine DB-Abfrage über 500.000 Zeilen macht, hast du eine Bremse, die nur unter Last sichtbar ist. Ein einmaliger Scan trifft sie nicht.

**3. PHP-Error-Log-Inhalte**
Hier liegen die Wahrheiten: `PHP Fatal error: Allowed memory size of 268435456 bytes exhausted in /wp-content/plugins/elementor-pro/modules/forms/...` — Datei und Zeilennummer, sauber dokumentiert. **Aber kein externer Scanner kann auf dein Server-Log zugreifen.** Niemals. Das ist eine fundamentale Limitierung der Architektur, kein Bug.

**4. Object-Cache-Status**
Ist Redis aktiv? Memcached? File-basiertes Caching? Oder läuft jede Abfrage roh gegen die Datenbank? Das HTML verrät es nicht. Der Server weiß es. Du brauchst Zugriff auf den Server, um es zu sehen.

Externe Scans sind ein guter Anfang. Aber sie sind ein **Symptom-Detektor**, kein **Ursachen-Diagnostiker**.

## Der WebsiteFix Röntgenblick

Genau für diese Lücke haben wir das **Hybrid-Scan-Modell** gebaut.

**Schicht 1 — Externer Crawl (kostenlos, ohne Login):**
- 92 technische Parameter (Performance, SEO, Accessibility, Best Practices)
- Hoster-Erkennung (Strato, IONOS, Hetzner, all-inkl, Goneo)
- Sichtbarkeits-Score mit konkreten Aufgaben
- Echte Google PageSpeed Insights LCP/CLS-Werte auf Klick

**Schicht 2 — Deep-Audit-Plugin (Pro-Abo, Read-Only):**
- Direktzugriff auf `wp_options`-Bloat-Analyse
- PHP-Error-Log-Auswertung mit **Datei und Zeilennummer** des Fehlers
- Cronjob-Audit (Welcher Hook frisst Zeit?)
- Plugin-Kollisions-Erkennung in `functions.php` und Hook-Chain
- DB-Health: Index-Fragmentierung, Auto-Load-Größe, Slow-Query-Log

**Wichtig zur Sicherheit:** Das Plugin arbeitet **Default Read-Only** — es liest nur. Schreibzugriffe passieren ausschließlich nach explizitem Klick durch dich (kein automatisches Fixen, kein Remote-Code). Jede Aktion landet im Aktivitätslog. EU-Hosting (Frankfurt), DSGVO-AVV-Vorlage liegt bei.

**Konkret beim Diagnose-Fall:**

> *Statt „Performance: 47/100 — bitte optimieren"*
> bekommst du:
> *„Fatal Error in `/wp-content/plugins/wpforms/src/Frontend/Frontend.php`, Zeile 312 — Memory-Limit überschritten. Empfehlung: PHP-Memory auf 512 MB anheben oder WPForms-Asset-Caching deaktivieren."*

Das ist der Unterschied zwischen einem Symptom-Detektor und einem Mechaniker mit Diagnose-Gerät.

<div style="margin: 40px 0; padding: 28px 28px 24px; background: rgba(141,243,211,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;">
  <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #c084fc; letter-spacing: 0.08em; text-transform: uppercase;">Deep-Audit · Pro-Plan</p>
  <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.02em;">Plugin verbinden, Server-Wahrheit sehen.</h3>
  <p style="margin: 0 0 20px; font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7;">92-Punkt-Hybrid-Scan mit Datei + Zeilennummer-Diagnose. Read-Only, EU-Hosting, jederzeit kündbar.</p>
  <a href="/fuer-agenturen#pricing" style="display: inline-block; padding: 11px 22px; background: #fff; color: #0b0c10; border-radius: 9px; font-weight: 700; font-size: 14px; text-decoration: none;">Pro-Plan ansehen →</a>
</div>

## Die 9,90-€-Soforthilfe für Nicht-Techniker

Du willst kein Abo. Du willst kein Plugin installieren. Du willst **diesen einen** Fehler heute Abend behoben haben, am besten in 20 Minuten, ohne Anruf bei einer Agentur für 150 € pro Stunde.

Genau dafür gibt es die **Rescue-Guides** für 9,90 € — Hoster-spezifische Schritt-für-Schritt-Anleitungen, kein Konto nötig, sofortiger PDF-Download.

**Beispiel: Du hast einen kritischen Fehler bei Strato.**
Der Guide zeigt dir:

1. Strato-Login → exakter Klick-Pfad zum PHP-Error-Log (mit Screenshot)
2. Wie du die `wp-config.php` per Strato-Filemanager öffnest
3. Welche Zeile du wo einfügst, um den Debug-Modus zu aktivieren
4. Wie du Plugins per Strato-Datenbank-Tool deaktivierst, falls das Backend tot ist
5. Strato-spezifischer Trick: PHP-Version-Wechsel im Strato-Cockpit (oft die schnellste Lösung)

Die gleiche Tiefe für **IONOS, Hetzner, all-inkl, Goneo, 1&1, Webgo** — jeder Guide enthält die exakten Menü-Pfade, Datei-Positionen und PHP-Befehle für deinen Hoster. Keine generische Anleitung, die für niemanden passt.

**Was du bekommst:**
- 4 Wochen Online-Zugriff über sicheren Token (kein Login)
- PDF zum Download (unbegrenzt aufbewahren)
- Smart-Fix-Drawer: präzise Code-Snippets zum Kopieren
- Versprechen: Wenn du den Fehler nicht löst, bekommst du den Betrag zurück

**Wann der Guide nicht reicht:** Bei tief sitzenden Datenbank-Inkonsistenzen, Multi-Site-Konfigurationen oder bei Seiten mit Custom-Code, der vor Jahren von einem Entwickler hinterlassen wurde. Da ist der Deep-Audit-Plugin der ehrlichere Weg.

<div style="margin: 40px 0; padding: 28px 28px 24px; background: rgba(141,243,211,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;">
  <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #fbbf24; letter-spacing: 0.08em; text-transform: uppercase;">9,90 € Soforthilfe · kein Abo</p>
  <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.02em;">Hoster-spezifischer Rescue-Guide.</h3>
  <p style="margin: 0 0 20px; font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7;">Erst Scan starten — der Hoster wird automatisch erkannt, du bekommst den passenden Guide direkt vorgeschlagen.</p>
  <a href="/scan" style="display: inline-block; padding: 11px 22px; background: #fff; color: #0b0c10; border-radius: 9px; font-weight: 700; font-size: 14px; text-decoration: none;">Hoster prüfen, Guide finden →</a>
</div>

## Wie du jetzt weitermachst

Drei klare Wege, in absteigender Reihenfolge der Investition:

**1. Du willst erst mal verstehen, was los ist.** → Starte den **kostenlosen Scan**. Du bekommst den Sichtbarkeits-Score, die 92-Punkte-Diagnose und eine Hoster-Erkennung. Keine Email, kein Konto. Wenn du auf den Live-Daten-Button klickst, holen wir dir auch die echten Google PageSpeed Insights LCP- und CLS-Werte direkt von Google's Servern.

**2. Du willst diesen einen Fehler heute Abend lösen.** → Nach dem Scan zeigen wir dir den **passenden 9,90-€-Rescue-Guide für deinen Hoster**. Sofortiger Download, kein Konto.

**3. Du betreust mehrere Seiten oder willst Server-Wahrheit dauerhaft.** → Das **Pro-Abo** mit Deep-Audit-Plugin gibt dir Datei- und Zeilennummer-Diagnose, monatliche Hybrid-Scans und unlimitierte Smart-Fix-Guides. Read-Only-Architektur, EU-Hosting, jederzeit kündbar.

Die wichtigste Erkenntnis aus diesem Beitrag: Ein externer Scan ist ein guter Start. Aber wenn Google deine Seite nicht sieht oder du den „kritischen Fehler" nicht wegbekommst, dann liegt die Antwort fast immer dort, wo dein Tool nicht hinsehen kann — im Server, in der Datenbank, im PHP-Log.

Der Röntgenblick ist kein Marketing-Wort. Er ist die einzige Methode, die funktioniert, wenn die Fassade dich anlügt.
