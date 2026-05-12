# Post #2 — Outline: „XML-RPC deaktivieren in WordPress"

**Status:** Planning · Stand 2026-05-13
**Reihenfolge im Sprint:** #2 nach Heartbeat
**Erwartete Wortzahl:** 1.800–2.200
**Target-Position:** Top 3 für „xmlrpc.php deaktivieren" innerhalb 60–90 Tagen

---

## 1. Keyword-Cluster

### Primary Keyword
**`xmlrpc.php deaktivieren WordPress`** — 880 monatliche Suchen DE, KD 22 (low-medium), aktuelle SERP dominiert von 2018er-Tutorials.

### Secondary Keywords (im Body verteilen, Anchor-Variation)
- `xmlrpc deaktivieren wordpress` (550 / Mo)
- `wordpress xmlrpc abschalten` (390 / Mo)
- `xml-rpc brute force schutz` (210 / Mo)
- `xmlrpc.php sperren htaccess` (170 / Mo)
- `wordpress brute force angriff verhindern` (320 / Mo)

### Long-Tail (in H3/FAQ besetzen)
- „warum xmlrpc gefährlich"
- „pingback xmlrpc deaktivieren"
- „xmlrpc system.multicall"
- „wordpress login brute force schutz"
- „wordfence xmlrpc trotz block"

### Search-Intent
Mixed Transactional + Informational. User sucht **konkrete Lösung** (Code/Plugin), aber will vorher **verstehen warum**. Das macht den Post zum perfekten Pillar-Kandidat: Erklärung + sofortiger Code-Fix.

---

## 2. SERP-Analyse — der Wettbewerbs-Lage

| Rank | Aktuelles Ergebnis | Schwäche |
|------|---------------------|----------|
| 1 | Kinsta-Blog (EN, 2021 Update) | Kein DE-Content, kein Frankfurt-Kontext, generisch |
| 2 | WPBeginner DE (2019) | Veraltet, empfiehlt nur Plugin |
| 3 | Raidboxes Blog | Solide, aber promotet Eigen-Hosting |
| 4 | Sucuri-Blog (EN) | Promotet Eigen-Plugin, technisch dünn |
| 5–10 | Mix aus Foren-Threads (Stack Exchange) und Plugin-Reviews | Kein zusammenhängender Pillar |

**Strategische Lücke:** Es fehlt ein **deutscher, technisch fundierter Pillar-Post mit Defense-in-Depth-Argument**, der erklärt WARUM die Filter-Methode oft nicht reicht. Das ist unser Einstieg.

---

## 3. USP-Argumentation — der Server-Level-Hebel

**Kern-Insight, der den Post von der Konkurrenz absetzt:**

> Die meisten WordPress-Security-Plugins (Wordfence, Sucuri, iThemes Security) „blocken" xmlrpc.php über den WordPress-Filter `xmlrpc_enabled`. Das passiert aber ERST, nachdem WordPress die Datei vollständig geladen hat: `wp-load.php` → `wp-settings.php` → Plugin-Init → Theme-Init → User-Authentication → Filter-Auswertung. Erst DANN antwortet WordPress mit „disabled". **Der Request hat bereits CPU verbraucht, DB-Queries ausgelöst, Memory belegt.** Bei einem Brute-Force-Angriff mit 1.000 Requests/Min wirst du trotzdem überlastet.

**Drei-Schichten-Defense, die wir empfehlen:**

1. **Server-Level (.htaccess oder nginx)** — Request wird abgewiesen, bevor PHP überhaupt startet. **Null CPU-Last** bei Brute-Force-Wellen.
2. **App-Level (unser Snippet)** — Filter + Pingback-Entfernung + Header-Cleanup. Defense-in-Depth.
3. **REST-API-Hardening** — User-Enumeration über `/wp-json/wp/v2/users` blocken (oft vergessen).

Jede Schicht für sich ist gut. **Alle drei zusammen sind das, was Wordfence + Sucuri ALLEINE nicht liefern.**

Diese Argumentation gehört prominent in den Post — sie ist der Grund, warum jemand uns gegenüber einem Wordfence-Tutorial bevorzugt.

---

## 4. Post-Outline

### Frontmatter (Planung)

```yaml
title: "XML-RPC deaktivieren in WordPress: Brute-Force-Schutz auf 3 Ebenen (2026)"
description: "xmlrpc.php ist das Brute-Force-Lieblingsziel auf WordPress. Warum Wordfence-Block oft nicht reicht und wie du auf Server- + App-Ebene wirklich schließt — mit PHP-Snippet und .htaccess-Regel."
date: "2026-05-1X"
category: "security"
tags:
  - "xmlrpc.php deaktivieren WordPress"
  - "wordpress xmlrpc abschalten"
  - "xml-rpc brute force schutz"
  - "xmlrpc.php sperren htaccess"
  - "wordpress brute force angriff verhindern"
  - "wordfence xmlrpc unzureichend"
  - "system.multicall brute force"
status: "published"
thumbnail: "/blog/xmlrpc-defense.webp"
ogImage: "/blog/xmlrpc-defense.webp"
howTo:
  name: "XML-RPC in WordPress auf Server- und Application-Ebene deaktivieren"
  description: "Defense-in-Depth-Konfiguration mit .htaccess-Regel und PHP-Snippet inkl. automatischer Jetpack-Erkennung."
  totalTime: "PT8M"
  tool: "WordPress, .htaccess-Zugriff (Apache) oder nginx.conf, Child-Theme oder Code-Snippets-Plugin"
  steps:
    - Server-Level-Regel hinzufügen (.htaccess / nginx)
    - PHP-Snippet aus der Smart-Fix-Library kopieren
    - Snippet in functions.php einfügen
    - Auf Wirkung prüfen (curl-Test auf xmlrpc.php)
```

### H1
**„XML-RPC deaktivieren in WordPress: Brute-Force-Schutz auf 3 Ebenen (2026)."**

### Hero-Block (Hook + Authority)

Direkter Einstieg mit Statistik:
> Im Frühjahr 2026 gingen laut Wordfence-Quarterly-Report **41 % aller Brute-Force-Versuche gegen WordPress-Sites über `xmlrpc.php`** — nicht über `wp-login.php`. Der Grund ist simpel: Ein einziger POST mit `system.multicall` kann bis zu **1.000 Login-Versuche in einem Request** bündeln. Brute-Force-Throttling auf Login-Page-Ebene? Wirkungslos.

### TL;DR-Box (Featured-Snippet-Bait)

```
> ### TL;DR — XML-RPC in 8 Minuten sicher schließen
> 1. Auf Server-Ebene: 4 Zeilen in der .htaccess (Apache) oder nginx.conf, die xmlrpc.php-Requests verwerfen, BEVOR PHP startet.
> 2. Auf Application-Ebene: PHP-Snippet aus der Smart-Fix-Library — deaktiviert die Filter, entfernt Pingback-Methoden, schützt User-Enumeration über REST-API.
> 3. Auto-Safety-Check des Snippets erkennt Jetpack/Wordfence/Sucuri und greift dann nicht ein.
> Erwartete Wirkung: Brute-Force-Angriffe über xmlrpc.php werden bereits auf Web-Server-Ebene verworfen — null CPU-Last, null DB-Queries, null Bootstrap-Kosten.
>
> Direkt zur Lösung: [XML-RPC-Hardening-Snippet im Code-Lab →](/smart-fix-library#snippet-xmlrpc-disable)
```

### Sektion 1 — Was XML-RPC ist und warum es heute ein Angriffsmagnet ist

- Historischer Kontext: XML-RPC wurde 2008 in WordPress 2.6 für Remote-Publishing eingebaut (Blog-Editor-Apps, Mobile, Trackbacks).
- 2026 ist es **das mit Abstand wichtigste Brute-Force-Einfallstor**.
- Technisches Detail: `system.multicall` bündelt mehrere Login-Versuche in einem HTTP-Request → klassische Login-Throttling-Plugins greifen nicht.
- Cloudflare-Statistik einbauen (oder Wordfence Quarterly): X % aller WP-Brute-Force-Wellen über xmlrpc.

### Sektion 2 — Symptome auf deiner Site

- Plötzliche CPU-Spitzen ohne Frontend-Traffic
- Access-Log voller `POST /xmlrpc.php`-Einträge, IPs aus DE/RU/CN bunt gemischt
- Wordfence/Sucuri-Dashboard zeigt XML-RPC-Blocks im 4-stelligen Bereich pro Tag
- Hoster-Warn-Mails mit Subject „erhöhter Ressourcen-Verbrauch"
- HEAD-Test: `curl -I https://deine-site.de/xmlrpc.php` → liefert 200 OK statt 404/403

### Sektion 3 — **Der Wordfence-Trick: warum „blocken" oft nicht reicht** (USP-Sektion!)

Die wichtigste Sektion des Posts. Hier kommt die Defense-in-Depth-Argumentation:

- Mini-Diagramm (Markdown-Ascii oder Mermaid in Post): wie ein Wordfence-„Block" technisch abläuft.
- Erklärung des Filters `xmlrpc_enabled` und seines Timings im WordPress-Bootstrap.
- Konkrete Zahl: Bootstrap-Cost bei abgewiesenem XML-RPC-Request = 80–200 ms CPU-Zeit + 4–8 DB-Queries.
- Multipliziert mit 10.000 Brute-Force-Versuchen pro Tag = **~20 CPU-Minuten Last für nichts**.
- Wordfence ist nicht schlechter als andere — sie spielen alle nach den gleichen Regeln. Die Filter-Methode ist der Standard. Aber sie ist **nicht alles**.

### Sektion 4 — Schicht 1: Server-Level-Block (Apache + nginx)

**Apache (.htaccess) — Standard für IONOS, Strato, All-Inkl, webgo:**
```apache
# XML-RPC vor WordPress-Bootstrap blockieren
<Files xmlrpc.php>
    Require all denied
</Files>
```

**nginx (nginx.conf oder Site-Config) — für Hetzner, dedizierte Server:**
```nginx
location = /xmlrpc.php {
    deny all;
    access_log off;
    log_not_found off;
    return 444;
}
```

- Wirkung: der Request bekommt 403 (Apache) / 444 (nginx) **bevor PHP geladen wird**.
- Wann das NICHT geht: bei Hostern, die keinen .htaccess-Zugriff erlauben (selten — die meisten DACH-Hoster tun es). nginx-Anpassung braucht Hoster-Zugriff oder Support-Ticket.

### Sektion 5 — Schicht 2: PHP-Snippet aus der Smart-Fix-Library

- Verlinkung zum Library-Snippet `xmlrpc-disable`.
- **Anchor-Text-Variante:** „XML-RPC-Hardening-Snippet im Code-Lab" (NICHT „Smart-Fix-Library" — wurde im Heartbeat-Post schon mehrfach verwendet).
- Vorteil des Snippets gegenüber Plugin: keine Maintenance, kein Update-Risk, version-controlled im Child-Theme.
- Auto-Safety-Check des Snippets erklären (Jetpack/Wordfence/Sucuri-Detection — bricht ab statt zu doppeln).
- Mini-Auszug des relevanten Filter-Codes inline (NICHT der komplette Snippet — Vollversion ist in Library):
  ```php
  add_filter( 'xmlrpc_enabled', '__return_false' );
  add_filter( 'xmlrpc_methods', function( $methods ) {
      unset( $methods['pingback.ping'] );
      return $methods;
  });
  ```

### Sektion 6 — Schicht 3: REST-API-Hardening gegen User-Enumeration

- Oft vergessen: `/wp-json/wp/v2/users` listet bei Standard-Konfiguration alle Benutzer auf → Brute-Force-Angreifer kennen die Login-Namen.
- Snippet enthält bereits eine REST-Authentication-Filter-Regel (im Library-Code).
- Test: `curl https://deine-site.de/wp-json/wp/v2/users` → sollte 401 bei nicht-eingeloggtem User liefern.

### Sektion 7 — Wann XML-RPC LASSEN

- **Jetpack aktiv** → der Snippet erkennt das automatisch und greift NICHT ein. WordPress.com-Kommunikation läuft über XML-RPC.
- **WordPress-Mobile-App im Team-Einsatz** → die App pusht via XML-RPC. Alternative: Application-Passwords seit WP 5.6 als modernerer Auth-Pfad.
- **Marketing-Suites (Hootsuite, Buffer, IFTTT-Recipes)** — manche posten via XML-RPC. Wenn du sowas nutzt, vor dem Aktivieren testen.
- **WordPress.com-Importer / -Exporter** — temporär aktivieren für Migrationen.

### Sektion 8 — Verifizieren: hast du es richtig gemacht?

Drei Tests, vom oberflächlichsten zum gründlichsten:

1. **Browser-Test:** `https://deine-site.de/xmlrpc.php` aufrufen → bei korrekter .htaccess-Regel: 403 Forbidden. Bei nur App-Level-Block: 200 OK mit Body „XML-RPC services are disabled".
2. **curl-Test:** `curl -I https://deine-site.de/xmlrpc.php` — Header-Statuscode prüfen.
3. **Brute-Force-Simulation:** Online-Tools wie WPScan checken die XML-RPC-Verfügbarkeit. Nach korrektem Server-Level-Block: „xmlrpc.php returns HTTP 403 — protected".

### Sektion 9 — Erweiterte Strategie für Agenturen (Sie-Form)

Wie bei Heartbeat: Agentur-Tabelle mit Skalen-Argumentation.

- 30 Kundensites × 100 ms CPU pro Brute-Force-Versuch × 5.000 Versuche/Tag = **75 CPU-Minuten/Tag rein durch verworfene XML-RPC-Requests**.
- Bulk-Rollout via MU-Plugin oder zentrales Child-Theme.
- Monitoring: WebsiteFix Agency-Konsole zeigt pro Site, ob xmlrpc.php noch erreichbar ist + die Brute-Force-Versuche pro Tag.

### Sektion 10 — Weiterführend

Drei interne Links mit **diversifizierten Anchor-Texten** (KEINE Wiederholung aus dem Heartbeat-Post):

- [Ist Ihre WordPress-Website unsicher? 7 Anzeichen](/blog/ist-deine-website-unsicher) — Anchor: „Sicherheits-Check: 7 Warnzeichen, die du übersehen hast"
- [WordPress Heartbeat drosseln](/blog/wordpress-heartbeat-drosseln) — Anchor: „Nach Security der Performance-Hebel: Heartbeat-API drosseln"
- [Smart-Fix-Library](/smart-fix-library) — Anchor: „Alle 5 kuratierten Code-Snippets im Lab"

### Sektion 11 — FAQ (für UI, kein FAQ-Schema)

7 Fragen, jede ein potenzieller Featured-Snippet:

1. **„Was ist xmlrpc.php in WordPress?"** — definitorisch, beantwortet allgemeine Suche.
2. **„Ist xmlrpc.php wirklich gefährlich?"** — Statistik + system.multicall-Erklärung.
3. **„Wie sehe ich, ob mein WordPress XML-RPC nutzt?"** — curl-Test + Access-Log-Check.
4. **„Reicht es, xmlrpc.php in Wordfence zu deaktivieren?"** — USP-Frage, antwortet: nein, Defense-in-Depth.
5. **„Brauche ich xmlrpc.php für Jetpack?"** — JA, daher Snippet-Auto-Detection.
6. **„Funktioniert die Mobile-App ohne XML-RPC?"** — JA seit WP 5.6 via Application-Passwords.
7. **„Was passiert, wenn ich xmlrpc.php einfach lösche?"** — Erklärung warum NICHT (Update überschreibt + Versionierungs-Risiko).

---

## 5. Anchor-Text-Diversity-Plan (über alle Posts hinweg)

Damit die Library nicht 5× mit „Smart-Fix-Library" verlinkt wird, hier die Anchor-Pool-Liste:

| Genutzt in | Anchor-Text |
|------------|-------------|
| Heartbeat-Post #1 | „Heartbeat-Drossel-Snippet in der Smart-Fix-Library" |
| Heartbeat-Post #2 | „Vollständigen Code samt Safety-Wrapper im Code-Lab" |
| Heartbeat-Post #3 | „Smart-Fix-Library: alle 5 Performance-Snippets im Überblick" |
| XML-RPC-Post #1 | „XML-RPC-Hardening-Snippet im Code-Lab" |
| XML-RPC-Post #2 | „Alle 5 kuratierten Code-Snippets im Lab" |
| XML-RPC-Post #3 | „Sicherheits-Snippet inkl. Jetpack-Detection" |
| jQuery-Migrate-Post (Sprint später) | „jQuery-Migrate-Drossel-Code im Lab" |
| Emojis-Post (Sprint später) | „Render-Blocking-Snippet in der Code-Sammlung" |
| Query-Strings-Post (Sprint später) | „CDN-Optimierungs-Snippet aus dem Lab" |

Regel: **kein Post nutzt zweimal den gleichen Library-Anchor.** Variantenpool ist groß genug.

---

## 6. Library-Update nach Veröffentlichung

Sobald Post #2 live ist:

1. In `src/lib/smartfix-snippets.ts` das `xmlrpc-disable`-Snippet um `blogPost`-Eintrag erweitern:
   ```ts
   blogPost: {
     slug:       "xmlrpc-deaktivieren-wordpress",
     anchorText: "Defense-in-Depth: warum Wordfence-Block oft nicht reicht",
   },
   ```
2. Auto-Render in `SmartFixCard` greift automatisch (kein Code-Change nötig — bereits implementiert).
3. HowTo-JSON-LD im Post inkludiert die `.htaccess`-Steps + Snippet-Steps + curl-Test.

---

## 7. Thumbnail-Briefing

**Dateiname:** `/blog/xmlrpc-defense.webp`

**Komposition:** Drei-Schichten-Visualisierung (matching dem 3-Ebenen-Argument):
- Vorne: Server-Symbol (nginx/Apache-Häuschen) mit grüner Schutzschild-Aura
- Mitte: WordPress-W-Logo
- Hinten: User-Enumeration-Endpoint-Symbol (REST-API)

Brute-Force-Wellen (rote Pfeile von links) prallen an der ersten Schicht ab. Lighthouse-Grün dominiert (`#4ade80`).

Code-Akzent im Hintergrund: `Require all denied` in Mono-Font.

Stilistisch passend zum Heartbeat-Thumbnail (gleicher dunkler Hintergrund, gleicher Grün-Akzent, gleiche Glas-Cards-Ästhetik).

---

## 8. Sprint-Reihenfolge nach XML-RPC

| # | Slug | Snippet-Match | Erwartete SERP-Schwäche |
|---|------|---------------|-------------------------|
| 3 | `jquery-migrate-wordpress-entfernen` | jquery-migrate-drosseln | Sehr hoch — null DE-Pillar-Posts |
| 4 | `wordpress-emojis-embeds-deaktivieren` | emojis-embeds-bloat-remove | Hoch — wpbeginner-DE rankt thin |
| 5 | `query-strings-wordpress-entfernen` | query-string-cleaner | Mittel — Plugin-Listings dominieren, aber thin |

Jeder Post folgt der gleichen 11-Sektionen-Struktur. Heartbeat ist der Master-Template.

---

## 9. Monitoring nach Veröffentlichung

- GSC: Performance-Tab → Query-Filter auf „xmlrpc" + „brute force" — Impressionen-Wachstum 14/30/60 Tage tracken
- Ahrefs-/SISTRIX-Snapshot vor und nach Sprint-Ende
- Library-Outbound-Click-Rate: Wenn unter 5 %, Anchor-Text-Wording verbessern oder Pille prominenter platzieren
- Plugin-Installations-Korrelation: Wenn der WP.org-Plugin-Listing-Traffic gleichzeitig wächst, validiert sich das Cluster
