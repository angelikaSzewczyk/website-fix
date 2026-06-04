---
title: "WordPress-Datenbank ohne Plugin bereinigen — sicher"
description: 'phpMyAdmin? Ein falscher Klick = Kunden-Daten weg. Wir zeigen den sicheren Weg + die 1-Klick-Rettung für Nicht-Techniker. In 5 Min.'
date: "2026-06-04"
category: "performance"
tags:
  - "wordpress datenbank bereinigen ohne plugin"
  - "wp_options bloat entfernen"
  - "wordpress transients löschen"
  - "phpmyadmin wp_options aufräumen"
  - "wordpress datenbank optimieren"
  - "wp_postmeta verwaiste einträge"
  - "wordpress datenbank entrümpeln"
  - "autoload bloat wordpress"
status: "published"
thumbnail: "/blog/hosting-schlamm.webp"
ogImage: "/blog/hosting-schlamm.webp"
faq:
  - q: "Warum wird meine WordPress-Datenbank über die Zeit so groß und langsam?"
    a: "WordPress speichert mit jedem Plugin, jedem Beitragsentwurf und jedem Plugin-Update Daten in der Datenbank — und löscht sie nur selten von selbst. Die häufigsten Bloat-Quellen: (1) Verwaiste Transients (Cache-Einträge von deinstallierten Plugins, die nie aufgeräumt werden), (2) Post-Revisionen (jeder gespeicherte Beitragsentwurf erzeugt einen kompletten Klon in wp_posts), (3) Autoload-Müll (Plugin-Optionen, die als 'autoload=yes' auf jeder Page-Load gezogen werden, obwohl sie nicht mehr gebraucht werden), (4) Spam-Kommentare und Pingback-Spam in wp_comments. Eine 5 Jahre alte WordPress-Seite ohne Pflege hat oft 80–90 % Bloat in der Datenbank."
  - q: "Ist es gefährlich, in der WordPress-Datenbank manuell aufzuräumen?"
    a: "Ja, ohne Backup ist es riskant. Ein falscher SQL-Befehl im phpMyAdmin (DELETE ohne WHERE-Klausel, TRUNCATE auf der falschen Tabelle) kann Kunden-Daten, Bestellungen oder den kompletten Beitragsinhalt löschen — und das ist im phpMyAdmin nicht rückgängig zu machen. Vor jeder DB-Aktion: Backup der gesamten Datenbank exportieren (phpMyAdmin → Exportieren → SQL-Format). Erst dann SQL-Befehle ausführen. Wer sich das nicht zutraut, sollte den Weg über ein geprüftes Plugin oder einen externen Scanner gehen — beide arbeiten mit Sicherheits-Guards."
  - q: "Was sind WordPress-Transients und warum machen sie die Datenbank langsam?"
    a: "Transients sind Cache-Einträge mit Verfallsdatum, die WordPress und Plugins in die `wp_options`-Tabelle schreiben (Prefix `_transient_`). Sie sind gedacht für schnelle Wiederabrufe, sollen aber nach Ablauf wieder gelöscht werden. Das Problem: viele Plugins räumen abgelaufene Transients nicht auf, weil der WordPress-Garbage-Collector unzuverlässig läuft. Auf einer 3 Jahre alten Seite finden sich oft 50.000 abgelaufene Transients — bei jedem Page-Load wird die ganze `wp_options` mitgeladen, weil Autoload-Felder Standard sind. Das verlangsamt TTFB drastisch."
  - q: "Welche WordPress-Tabellen darf ich auf keinen Fall löschen oder leeren?"
    a: "`wp_users`, `wp_usermeta`, `wp_posts`, `wp_postmeta`, `wp_terms`, `wp_term_relationships`, `wp_term_taxonomy`, `wp_options` (komplettes Löschen — einzelne Zeilen mit Filter-WHERE-Klausel sind okay). Bei WooCommerce zusätzlich: `wp_wc_*`, `wp_woocommerce_*`. Bei einigen Plugins schaffen sie eigene Tabellen — `wpforms_*`, `wpse_*`, `learndash_*`. Niemals mit DROP TABLE oder TRUNCATE arbeiten, ohne den Inhalt vorher geprüft zu haben. Im Zweifel: nichts anfassen, externes Tool nutzen."
  - q: "Kann ich die WordPress-Datenbank auch ohne phpMyAdmin und ohne Plugin bereinigen?"
    a: "Ja, drei Wege: (1) WP-CLI auf der Shell (`wp transient delete --expired`, `wp post delete $(wp post list --post_status=auto-draft --format=ids) --force`) — setzt SSH-Zugang voraus. (2) Externer Scanner, der dir die Bloat-Quellen auflistet und konkrete Cleanup-Befehle gibt (ohne dass du selbst die DB öffnest). (3) Manuell per phpMyAdmin mit dokumentierten Sicherheits-Queries (siehe Abschnitt 'Wenn du es selbst machst' weiter unten). Variante 1 ist die schnellste für Erfahrene, Variante 2 die sicherste für Solos."
  - q: "Wie oft sollte ich meine WordPress-Datenbank bereinigen?"
    a: "Mindestens alle 3 Monate für Blogs und Coaching-Sites, monatlich für aktive Shops mit > 100 Bestellungen/Monat. Faustregel: Wenn dein TTFB (Time to First Byte) über 600 ms liegt und sich auch nach Cache-Aktivierung nicht verbessert, ist DB-Bloat ein wahrscheinlicher Verdächtiger. Eine saubere Datenbank reduziert TTFB oft um 100–300 ms — das ist messbarer Ladezeit-Gewinn ohne Code-Änderungen."
---

![WordPress-Datenbank bereinigen ohne Plugin — der sichere Weg ohne Datenverlust](/blog/hosting-schlamm.webp)

# WordPress-Datenbank ohne Plugin bereinigen — ohne deine Kunden-Daten zu zerstören

Stell dir deine WordPress-Datenbank vor wie den Aktenschrank in deinem Coaching-Büro. Jede Klientin, jeder Beitragsentwurf, jede E-Mail-Vorlage, jedes Plugin-Setting — alles landet in diesem Schrank. Über Jahre wachsen die Ordner. Niemand räumt auf. Irgendwann ist der Schrank so voll, dass du **30 Sekunden** brauchst, um eine einzelne Klientenakte zu finden. Genau dasselbe passiert mit deiner WordPress-Datenbank: bei jedem Page-Load wird der ganze Schrank durchsucht — und je voller er ist, desto langsamer wird deine Seite.

Die Lösung scheint simpel: aufräumen. Aber wer schon mal **phpMyAdmin** geöffnet hat, weiß das Problem: zwischen den Tabellen sind die Kunden-Daten, die Bestellungen, die Inhalte deiner Beiträge. **Ein falscher Klick mit DELETE-Button — und genau diese Daten sind weg, ohne Wiederherstellungs-Möglichkeit.**

Dieser Post zeigt dir den **sicheren Weg**, deine WordPress-Datenbank zu entrümpeln — entweder selbst über phpMyAdmin (mit ausgehärteten SQL-Queries, die nichts Falsches treffen können) oder über die 1-Klick-Alternative, die keinerlei DB-Wissen voraussetzt.

> ### Keine Zeit für SQL-Befehle?
>
> **Unser Sofort-Scan zeigt dir die Bloat-Tabellen in 60 Sekunden** — wp_options-Autoload-Größe, verwaiste Transients, alte Post-Revisionen, Spam-Kommentare. Du bekommst genau die Top-3-Cleanup-Empfehlungen, ohne phpMyAdmin zu öffnen.
>
> [→ Jetzt kostenlos scannen](/scan) · [→ DB-Cleanup-Schritt-für-Schritt-PDF für 9,90 €](/scan/checkout)

---

## Warum die WordPress-Datenbank über die Zeit so verkrustet

WordPress ist sympathisch, weil es alles speichert. Jeder gespeicherte Entwurf, jede Plugin-Aktivierung, jeder Cache-Eintrag — alles landet in der **MySQL-Datenbank** (technisch heute meistens MariaDB, aber das ist dasselbe für unsere Zwecke). Das Problem ist: WordPress räumt das Gespeicherte praktisch nie wieder auf. Plugins kommen und gehen — ihre Datenbank-Einträge bleiben.

Die fünf häufigsten **Bloat-Quellen** auf einer 3 Jahre alten Solo-Site:

### 1. Verwaiste Transients (Cache-Einträge ohne Garbage Collection)

Transients sind temporäre Cache-Einträge mit Verfallsdatum. Plugins nutzen sie für schnelle Wiederabrufe (z.B. *„API-Antwort von Stripe für 1 Stunde merken"*). Theoretisch löscht WordPress sie nach Ablauf — praktisch läuft der Garbage-Collector aber nur unregelmäßig, und viele Plugins räumen ihre eigenen Transients nicht auf, wenn sie deaktiviert werden.

**Typischer Befund:** Eine Coaching-Site mit 2 Jahren Laufzeit hat oft 30.000–80.000 abgelaufene Transients in `wp_options`. Bei jedem Page-Load werden alle Autoload-Optionen geladen — die ganze 12-MB-`wp_options`-Tabelle muss durch die Leitung.

### 2. Post-Revisionen (jeder Entwurf erzeugt einen Klon)

Wenn du an einem Beitrag arbeitest und alle 30 Sekunden auf *„Entwurf speichern"* drückst, erzeugt WordPress jedes Mal eine vollständige Kopie in der `wp_posts`-Tabelle. Bei einem 20.000-Wörter-Cornerstone-Beitrag und 50 Speicher-Vorgängen sind das **50 vollständige Klone** — Datenbank-Bloat ohne Wert.

**Default:** WordPress speichert unbegrenzt viele Revisionen. Best Practice: Limit auf 5 setzen.

### 3. Spam-Kommentare und Pingback-Spam

Auch wenn du die Kommentare via Plugin (Akismet, Antispam Bee) als Spam markiert hast — sie liegen weiterhin in der `wp_comments`-Tabelle, bis du sie aktiv löschst. Auf einer beliebten Blog-Seite sammeln sich 5.000–20.000 Spam-Einträge pro Jahr.

### 4. Autoload-Bloat in wp_options

`wp_options` hat ein Feld `autoload`. Optionen mit `autoload=yes` werden bei **jedem einzelnen Page-Load** geladen, automatisch — ob sie gebraucht werden oder nicht. Viele Plugins setzen ihre Settings auf `autoload=yes`, ohne sie nach Deinstallation aufzuräumen. Über Jahre wächst die Autoload-Last auf 5–15 MB pro Page-Load — direkt sichtbar in deinem TTFB.

### 5. Verwaiste Postmeta von gelöschten Plugins

Plugins wie WPForms, Yoast SEO, Rank Math schreiben pro Beitrag mehrere Metadaten-Einträge in `wp_postmeta`. Wenn du das Plugin deaktivierst oder deinstallierst: Einträge bleiben. Bei 1.000 Beiträgen und 5 alten Plugins können das **5.000–25.000 verwaiste Einträge** sein.

---

## Der riskante Weg: phpMyAdmin selbst öffnen

phpMyAdmin ist das Standard-DB-Tool, das fast jeder Hoster mitbringt. Und es ist die schnellste Methode, deine Datenbank zu zerstören.

> **Pattern Interrupt — bitte lesen, bevor du klickst:**
>
> Wenn du im phpMyAdmin den falschen DELETE-Button erwischst oder eine SQL-Query mit zu loser WHERE-Klausel laufen lässt, sind deine Kunden-Daten, Bestellungen oder Beiträge **weg**. Es gibt keine Undo-Funktion. Es gibt keine Papierkorb-Wiederherstellung. Das einzige, was dich rettet, ist ein **Backup**.

Wenn du trotzdem manuell aufräumen willst, hier die **dokumentierten Sicherheits-Queries**, die nichts Falsches treffen können — aber nur mit Backup davor.

### Schritt 1 (Pflicht): Vollständiges DB-Backup

phpMyAdmin → links die Datenbank auswählen → oben „Exportieren" → Format „SQL" → „OK". Die `.sql`-Datei lokal speichern. **Jetzt bist du safe.**

Alternativ: phpMyAdmin → SQL-Tab → einfach so ausführen:

```sql
-- Statt phpMyAdmin-Klicks: einfach Backup übers Hoster-Panel ziehen.
-- Bei All-Inkl: KAS → Mein KAS → Datenbanken → MariaDB-Backup
-- Bei IONOS:    Dashboard → Hosting → MySQL → Backup
-- Bei Hetzner:  Konsole → Webhosting → Datenbanken → Datensicherung
```

### Schritt 2: Abgelaufene Transients löschen (sicher)

Im phpMyAdmin → Datenbank wählen → SQL-Tab:

```sql
DELETE FROM wp_options 
WHERE option_name LIKE '_transient_timeout_%' 
AND option_value < UNIX_TIMESTAMP();

DELETE FROM wp_options 
WHERE option_name LIKE '_transient_%' 
AND option_name NOT LIKE '_transient_timeout_%' 
AND option_name NOT IN (
  SELECT REPLACE(option_name, '_transient_timeout_', '_transient_') 
  FROM (SELECT option_name FROM wp_options WHERE option_name LIKE '_transient_timeout_%') AS t
);
```

**Was diese Query macht:** Sie löscht nur abgelaufene Transients (deren Verfallsdatum bereits in der Vergangenheit liegt) und ihre korrespondierenden Zeitstempel. Aktive Transients (mit gültigem Timeout) bleiben unangetastet.

### Schritt 3: Alte Post-Revisionen löschen (über 30 Tage)

```sql
DELETE FROM wp_posts 
WHERE post_type = 'revision' 
AND post_date < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

**Was die Query macht:** Sie löscht ausschließlich Beitrags-Versionen vom Typ `revision`, die älter als 30 Tage sind. Originale Beiträge (`post`, `page`, `product` etc.) bleiben unangetastet.

### Schritt 4: Spam-Kommentare löschen

```sql
DELETE FROM wp_comments WHERE comment_approved = 'spam';
DELETE FROM wp_commentmeta WHERE comment_id NOT IN (SELECT comment_ID FROM wp_comments);
```

### Schritt 5: Verwaiste Postmeta aufräumen

```sql
DELETE pm FROM wp_postmeta pm 
LEFT JOIN wp_posts p ON p.ID = pm.post_id 
WHERE p.ID IS NULL;
```

### Schritt 6: Autoload-Bloat finden

Diese Query **löscht nichts**, sondern zeigt dir nur die größten Autoload-Sünder:

```sql
SELECT option_name, LENGTH(option_value) AS size_bytes 
FROM wp_options 
WHERE autoload = 'yes' 
ORDER BY size_bytes DESC 
LIMIT 20;
```

Du bekommst eine Liste der 20 größten Autoload-Einträge. Wenn du Plugin-Settings von **deinstallierten** Plugins siehst (z.B. `wp_super_cache_settings`, obwohl du WP Super Cache vor 2 Jahren gelöscht hast), kannst du diese gezielt löschen:

```sql
DELETE FROM wp_options WHERE option_name = 'wp_super_cache_settings';
```

**Niemals** mit DELETE-WHERE-LIKE arbeiten, das trifft zu viele Zeilen — immer mit exaktem `=`.

---

## Der sichere Weg: 1-Klick-Optimizer, der keine DB-Risiken hat

Wenn dir die SQL-Queries zu technisch sind oder du das Risiko nicht willst, gibt es eine grundsätzlich andere Lösung: ein **Plugin, das die häufigsten Bloat-Quellen für dich entfernt — aber selbst nichts in deine Datenbank schreibt.**

Der **WebsiteFix One-Click Performance Optimizer** (Free auf WordPress.org) geht den umgekehrten Weg von typischen „DB-Cleaner"-Plugins: **er hat keinen DB-Schreibzugriff überhaupt.** Stattdessen aktiviert er gezielt Performance-Snippets als isolierte PHP-Files unter `/wp-content/mu-plugins/`. Diese Snippets verhindern den **Entstehungsmechanismus** der häufigsten DB-Bloat-Quellen:

| Bloat-Quelle | Optimizer-Snippet | Effekt |
|---|---|---|
| Heartbeat-API erzeugt admin-ajax-Last + DB-Pings | `heartbeat-throttle` | 60s statt 15s im Admin, Frontend praktisch aus |
| XML-RPC-Pingback-Spam in wp_comments | `xmlrpc-disable` | XML-RPC-Endpoint geschlossen, kein Pingback-Spam mehr |
| Query-String-Cache-Misses | `query-string-cleaner` | Asset-URLs ohne ?ver=, sauberer Browser-Cache |
| Author-Enumeration-Brute-Force erzeugt Login-Logs | `author-archive-block` | /?author=N geblockt, keine Brute-Force-Spam-Logs |

Bei DB-Bloat, der schon entstanden ist, hilft der Optimizer nicht — das ist Cleanup-Arbeit, die phpMyAdmin oder ein dezidiertes Cleanup-Plugin macht. **Aber:** wenn du heute aufräumst und gleichzeitig den Optimizer aktivierst, sammelt sich der Müll deutlich langsamer wieder an.

> ### WebsiteFix Optimizer aus dem WordPress-Marketplace
> Free, 7 Performance-Fixes als isolierte mu-plugin-Dateien, kein DB-Schreibzugriff, jeder Fix einzeln reversibel.
>
> 👉 **[Plugin auf WordPress.org installieren →](https://wordpress.org/plugins/websitefix-one-click-performance-optimizer/)** · [Mehr zur Landingpage →](/plugin/optimizer)

---

## Was du dauerhaft änderst, damit der Bloat nicht zurückkommt

Aufräumen ist ein Anfang — der eigentliche Gewinn liegt darin, das Wiederzuwachsen zu drosseln. Drei dauerhafte Settings, die jeden zukünftigen DB-Müll-Berg um 70–90 % reduzieren.

### Setting A: Post-Revisionen limitieren

In `wp-config.php` (Hauptverzeichnis, per FTP öffnen) **vor** der Zeile `/* That's all, stop editing! */` einfügen:

```php
define('WP_POST_REVISIONS', 5);
define('AUTOSAVE_INTERVAL', 300);
```

`WP_POST_REVISIONS` = maximale Anzahl gespeicherter Versionen pro Beitrag (5 reicht für 99 % der Fälle).
`AUTOSAVE_INTERVAL` = WordPress speichert Auto-Drafts nur noch alle 5 Minuten statt alle 60 Sekunden.

### Setting B: Trash-Frist verkürzen

Im selben `wp-config.php`-Block:

```php
define('EMPTY_TRASH_DAYS', 7);
```

WordPress leert den Papierkorb (gelöschte Beiträge) nach 7 Tagen automatisch, statt nach 30. Spart laufend Platz in `wp_posts`.

### Setting C: Spam-Filter aktivieren

**Akismet** (von WordPress mitgeliefert) oder **Antispam Bee** (Free) installieren und aktivieren. Sie filtern Spam-Kommentare schon **vor** dem Speichern in der DB — keine Aufräum-Arbeit nötig.

### Setting D: Heartbeat-API drosseln

Standard sind alle 15 Sekunden ein Heartbeat-Ping an `admin-ajax.php` — auf jeder offenen wp-admin-Seite. Auf vielen Shared-Hostern produziert das tausende Datenbank-Pings pro Tag. Lösung: Heartbeat auf 60 s im Admin, praktisch aus im Frontend. Geht entweder per `functions.php`-Snippet oder via Optimizer-Plugin mit einem Klick.

---

## Wenn du den Bloat erst mal messen willst

Bevor du anfängst zu löschen, lohnt sich ein Status-Check. Drei Tools dafür:

### Option 1: phpMyAdmin-Quick-Audit

In phpMyAdmin → Datenbank wählen → SQL-Tab:

```sql
SELECT 
  table_name AS 'Tabelle',
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Größe (MB)',
  table_rows AS 'Zeilen'
FROM information_schema.TABLES 
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC
LIMIT 20;
```

Du bekommst die 20 größten Tabellen sortiert nach Größe. Verdächtig:
- `wp_options` über 3 MB → Autoload-Bloat
- `wp_postmeta` über 50 MB → verwaiste Plugin-Daten
- `wp_comments` über 5 MB → Spam-Backlog
- `wp_posts` mit > 5.000 Zeilen bei < 200 Beiträgen → Revisionen-Bloat

### Option 2: Externer Scanner

Wenn du nicht in phpMyAdmin willst: der WebsiteFix-Scanner prüft externe Marker, die mit DB-Bloat korrelieren (TTFB-Trend, Cache-Header, doppelte Asset-Loads, fehlerhafte Sitemap-Größen) und gibt dir eine Einschätzung, ob deine DB der wahrscheinlichste Engpass ist.

### Option 3: WP-CLI (für die Erfahrenen)

Per SSH:

```bash
wp db size --tables
wp transient list --expired | wc -l
wp post list --post_type=revision --format=count
```

In 30 Sekunden hast du den Bloat-Status, ohne phpMyAdmin zu öffnen. Setzt SSH-Zugang voraus (Hetzner, All-Inkl Premium, SiteGround Cloud bieten das, IONOS Shared meist nicht).

---

## Fazit: DB-Aufräumen ist nötig — aber bitte mit Sicherheits-Gurt

Die WordPress-Datenbank ist über Jahre die häufigste, unsichtbare Performance-Bremse. Sie macht TTFB schlechter, das verschlechtert deine **Core Web Vitals**, das verschlechtert dein Google-Ranking. Ein einmaliges Aufräumen kann Ladezeit um 30–50 % verbessern. Drei Strategien:

1. **Sicherheitsorientiert** (für Solos ohne SQL-Confidence): Externen Scanner → konkrete Top-3-Empfehlungen → entweder selbst per phpMyAdmin mit getesteten Queries (Backup zuerst!) oder vom Entwickler einmalig in 1–2 Stunden.
2. **Pragmatisch** (für Technik-Affine): phpMyAdmin → die 6 dokumentierten Queries aus diesem Post ausführen → Heartbeat drosseln, Spam-Filter aktivieren, Post-Revisions limitieren.
3. **Präventiv** (für alle): WebsiteFix Optimizer installieren + Heartbeat-Throttling + Author-Block + Query-String-Cleaner aktivieren. Das verhindert, dass sich neuer Bloat bildet.

**Wenn dein TTFB konstant über 600 ms liegt** und auch mit Cache-Plugin nicht besser wird, ist DB-Bloat sehr wahrscheinlich der Hauptverdächtige. Der externe Scan zeigt dir in 60 Sekunden, ob diese Hypothese stimmt — und liefert die Top-3-Cleanup-Schritte, ohne dass du selbst phpMyAdmin öffnen musst.

**Übrigens:** Wenn deine Seite gerade nicht nur langsam, sondern **gar nicht mehr lädt** (Critical Error oder White Screen), ist das meist kein DB-Problem, sondern ein Plugin-Crash. Hier ist die Erste-Hilfe-Anleitung: [WordPress kritischer Fehler — in 2 Min selbst retten](/blog/wordpress-critical-error). Und wenn du nach dem Aufräumen merkst, dass deine [Seite weiterhin extrem langsam](/blog/website-laedt-extrem-langsam) ist, der Hoster aber gut aussieht — die wahren Bremser sitzen oft im Frontend.

> ### Bloat-Status in 60 Sekunden checken
> Der externe Scan misst TTFB, Cache-Header, Asset-Doubles, Sitemap-Größe — alles Marker, die mit DB-Bloat korrelieren. Du bekommst die wahrscheinlichste Engpass-Quelle direkt geliefert.
>
> 👉 **[Kostenlos scannen — DB-Bloat-Diagnose →](/scan?problem=database)**

---

## FAQ: Die häufigsten Fragen zur WordPress-Datenbank-Bereinigung

### Warum wird meine WordPress-Datenbank über die Zeit so groß und langsam?

WordPress speichert mit jedem Plugin, jedem Beitragsentwurf und jedem Plugin-Update Daten in der Datenbank — und löscht sie nur selten von selbst. Die häufigsten Bloat-Quellen: (1) Verwaiste Transients (Cache-Einträge von deinstallierten Plugins, die nie aufgeräumt werden), (2) Post-Revisionen (jeder gespeicherte Beitragsentwurf erzeugt einen kompletten Klon in `wp_posts`), (3) Autoload-Müll (Plugin-Optionen, die als `autoload=yes` auf jeder Page-Load gezogen werden, obwohl sie nicht mehr gebraucht werden), (4) Spam-Kommentare und Pingback-Spam in `wp_comments`. Eine 5 Jahre alte WordPress-Seite ohne Pflege hat oft 80–90 % Bloat in der Datenbank.

### Ist es gefährlich, in der WordPress-Datenbank manuell aufzuräumen?

Ja, ohne Backup ist es riskant. Ein falscher SQL-Befehl im phpMyAdmin (`DELETE` ohne WHERE-Klausel, `TRUNCATE` auf der falschen Tabelle) kann Kunden-Daten, Bestellungen oder den kompletten Beitragsinhalt löschen — und das ist im phpMyAdmin nicht rückgängig zu machen. Vor jeder DB-Aktion: Backup der gesamten Datenbank exportieren (phpMyAdmin → Exportieren → SQL-Format). Erst dann SQL-Befehle ausführen. Wer sich das nicht zutraut, sollte den Weg über ein geprüftes Plugin oder einen externen Scanner gehen — beide arbeiten mit Sicherheits-Guards.

### Was sind WordPress-Transients und warum machen sie die Datenbank langsam?

Transients sind Cache-Einträge mit Verfallsdatum, die WordPress und Plugins in die `wp_options`-Tabelle schreiben (Prefix `_transient_`). Sie sind gedacht für schnelle Wiederabrufe, sollen aber nach Ablauf wieder gelöscht werden. Das Problem: viele Plugins räumen abgelaufene Transients nicht auf, weil der WordPress-Garbage-Collector unzuverlässig läuft. Auf einer 3 Jahre alten Seite finden sich oft 50.000 abgelaufene Transients — bei jedem Page-Load wird die ganze `wp_options` mitgeladen, weil Autoload-Felder Standard sind. Das verlangsamt TTFB drastisch.

### Welche WordPress-Tabellen darf ich auf keinen Fall löschen oder leeren?

`wp_users`, `wp_usermeta`, `wp_posts`, `wp_postmeta`, `wp_terms`, `wp_term_relationships`, `wp_term_taxonomy`, `wp_options` (komplettes Löschen — einzelne Zeilen mit Filter-WHERE-Klausel sind okay). Bei WooCommerce zusätzlich: `wp_wc_*`, `wp_woocommerce_*`. Bei einigen Plugins schaffen sie eigene Tabellen — `wpforms_*`, `wpse_*`, `learndash_*`. Niemals mit `DROP TABLE` oder `TRUNCATE` arbeiten, ohne den Inhalt vorher geprüft zu haben. Im Zweifel: nichts anfassen, externes Tool nutzen.

### Kann ich die WordPress-Datenbank auch ohne phpMyAdmin und ohne Plugin bereinigen?

Ja, drei Wege: (1) WP-CLI auf der Shell (`wp transient delete --expired`, `wp post delete $(wp post list --post_status=auto-draft --format=ids) --force`) — setzt SSH-Zugang voraus. (2) Externer Scanner, der dir die Bloat-Quellen auflistet und konkrete Cleanup-Befehle gibt (ohne dass du selbst die DB öffnest). (3) Manuell per phpMyAdmin mit dokumentierten Sicherheits-Queries (siehe Abschnitt *„Wenn du es selbst machst"* weiter oben). Variante 1 ist die schnellste für Erfahrene, Variante 2 die sicherste für Solos.

### Wie oft sollte ich meine WordPress-Datenbank bereinigen?

Mindestens alle 3 Monate für Blogs und Coaching-Sites, monatlich für aktive Shops mit > 100 Bestellungen/Monat. Faustregel: Wenn dein TTFB (Time to First Byte) über 600 ms liegt und sich auch nach Cache-Aktivierung nicht verbessert, ist DB-Bloat ein wahrscheinlicher Verdächtiger. Eine saubere Datenbank reduziert TTFB oft um 100–300 ms — das ist messbarer Ladezeit-Gewinn ohne Code-Änderungen.

---

### Du willst nicht selbst in phpMyAdmin?

Der **WebsiteFix-Scanner** prüft 30+ externe Marker, die mit DB-Bloat korrelieren — TTFB-Trend, Cache-Header, Asset-Doubles, Sitemap-Größe, fehlende WordPress-Standard-Routen. Du bekommst die Top-3-Cleanup-Empfehlungen mit konkreter Reihenfolge, ohne deine Datenbank selbst zu öffnen.

👉 **[Jetzt kostenlos prüfen — DB-Bloat-Diagnose in 60 Sekunden →](/scan?problem=database)**

*Kein Login, kein phpMyAdmin-Zugang, keine Kreditkarte. Mit konkreter Cleanup-Reihenfolge, nicht nur einer Liste.*
