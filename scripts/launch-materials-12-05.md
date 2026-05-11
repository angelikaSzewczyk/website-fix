# LinkedIn-Launch-Materialien — 12.05.2026

Drafts für den heutigen Launch. Beide Texte sind pricing-strict (keine Phantom-Versprechen) und nutzen wortgleich die Begriffe aus der Pricing-Card.

---

## 1) LinkedIn-Post — "Röntgenblick"

### Variante A (kürzer, ~150 Wörter)

```
Du betreust WordPress-Sites.
Du nutzt einen Online-Scanner.
Du bekommst: "Komprimiere Bilder. Aktiviere Caching. Update PHP."

→ Generisch. Hilft niemandem.

Was Online-Scanner NICHT sehen:
· Plugin-Versionen, die das Rendering blockieren
· PHP-Error-Log mit 200+ Fatal Errors pro Tag
· Datenbank-Queries, die 2 Sekunden dauern
· Theme-Overrides, die WooCommerce-Carts kaputt machen

Wir bauen WebsiteFix.

Externer Crawl liefert 12 Parameter.
Unser Read-Only-Plugin (kein Schreibzugriff, kein Passwort-Sharing)
liefert 80 zusätzliche aus dem WordPress-Backend.

Smart-Fix-Drawer zeigt dir: Datei. Zeile. Copy-Paste-Lösung.

Pay-per-Fix ab 9,90 €. Kein Abo, kein Account nötig.
Starter ab 29 €/Mo — 10 Deep-Scans + Read-Only-Plugin inklusive.

Heute live: https://website-fix.com

#WordPress #WordPressDevelopment #BFSG #SaaS
```

### Variante B (länger, ~280 Wörter, mit Story-Arc)

```
"Warum ist deine Seite langsam?"

Die Antwort der meisten Tools:
"Deine Bilder sind zu groß. Caching ist aus. PHP veraltet."

→ Stimmt vielleicht. Hilft dir nicht.

Denn die echten Bremsklötze siehst du erst, wenn du IM WordPress drin bist:

· 3 Plugins blockieren JavaScript-Render — Heartbeat-API läuft alle 15 Sek
· wp_options-Table mit 4.000 Auto-Loaded-Einträgen, 280 ms pro Request
· Theme-Function-Override macht WooCommerce-Cart-Fragments zu Single-Request → 2 Sek bei jedem Klick

Ein externer Scanner SIEHT das nicht. Er sieht nur, was die Website öffentlich rausgibt.

Wir haben WebsiteFix gebaut — den ersten Hybrid-Scanner für WordPress.

So funktioniert's:
1. Externer Crawl: 12 SEO/Performance-Parameter (wie ein Online-Tool)
2. Read-Only-Plugin installieren: 80 zusätzliche Parameter aus dem Backend
3. Smart-Fix-Drawer mit Code-Snippets — Datei + Zeile + Copy-Paste-Lösung

Was uns wichtig war:
· Plugin ist Read-ONLY (kein Schreibzugriff auf wp_options)
· Kein Passwort-Sharing nötig
· Rechtlich sauber für Wartungsverträge

3 Tarife:
· Pay-per-Fix 9,90 € — Einzel-Guide, kein Konto
· Starter 29 €/Mo — 10 Deep-Scans + Plugin + alle Fix-Anleitungen
· Agency Scale 249 €/Mo — bis zu 50 Kunden mit White-Label

BFSG-Pflicht ab Juni 2025 macht das doppelt relevant — Compliance + Performance in einem Scan.

Heute live: https://website-fix.com

Bin gespannt auf euer Feedback. Was vermisst ihr aktuell in WordPress-Diagnose-Tools?

#WordPress #BFSG #Webentwicklung #SaaS #PWA
```

### Bildempfehlung
Screenshot vom **XrayCompareCard im Dashboard**, der "12 (extern) vs 92 (mit Plugin) Parameter" nebeneinander zeigt. Das ist der Aha-Moment.

---

## 2) Blog-Struktur — "WordPress kritischer Fehler beheben"

### Meta-Daten
- **Slug:** `wordpress-kritischer-fehler-beheben`
- **Title (SEO):** "WordPress: 'Es gab einen kritischen Fehler' beheben — Schritt-für-Schritt-Anleitung (2026)"
- **Meta-Description:** "WordPress zeigt 'Es gab einen kritischen Fehler'? Recovery-Mail, Debug-Log, Plugin-Deaktivierung und Backup-Restore — die 6 Schritte mit Hoster-spezifischen Klick-Pfaden (Strato, IONOS, All-Inkl, Hostinger, Hetzner)."
- **Target-Keywords (GSC-Top-Suchen):**
  - "wordpress kritischer fehler beheben" (Haupt-Keyword)
  - "wordpress es gab einen kritischen fehler"
  - "wordpress white screen of death"
  - "wordpress 500 internal server error"
  - "wp_critical_error_handler" (Tech-User)

### Outline (1.500-2.000 Wörter)

**1. Intro (~150 Wörter)**
- Hook: "Deine WordPress-Seite zeigt seit gestern Abend 'Es gab einen kritischen Fehler'. Du hast Auto-Update aktiviert, jetzt funktioniert nichts mehr."
- Was dieser Artikel liefert: 6 Schritte in genauer Reihenfolge, plus Hoster-Klick-Pfade
- Versprechen: "Wenn du nach Schritt 4 noch immer im Crash bist, ist es kein Plugin-Crash sondern ein Datenbank-Problem — dann hilft Schritt 5 oder unser Read-Only-Plugin."

**2. Schritt 1: Recovery-Mail prüfen (~200 Wörter)**
- WordPress 5.2+ sendet automatisch eine Recovery-Mail an die Admin-Adresse
- Wo gucken: Inbox, Spam-Ordner, ggf. SMTP-Logs
- Inhalt der Mail: Link zum Recovery-Modus, der das fehlerhafte Plugin auflistet
- Wenn keine Mail kommt: Mail-Server-Issue, weiter zu Schritt 2

**3. Schritt 2: Debug-Log aktivieren (~250 Wörter)**
- Code-Snippet für wp-config.php:
  ```php
  define( 'WP_DEBUG', true );
  define( 'WP_DEBUG_LOG', true );
  define( 'WP_DEBUG_DISPLAY', false );
  ```
- Wo findest du das Log: `wp-content/debug.log`
- Häufige Error-Pattern erklärt: Fatal Error, Allowed Memory exhausted, syntax error
- Quick-Fix für Memory: `define( 'WP_MEMORY_LIMIT', '512M' );`

**4. Schritt 3: Plugins via FTP deaktivieren (~250 Wörter)**
- FTP-Client öffnen (FileZilla, Cyberduck)
- Pfad: `wp-content/plugins/` umbenennen zu `plugins_disabled`
- WordPress lädt jetzt OHNE Plugins → Login möglich
- Plugins einzeln re-aktivieren um den Übeltäter zu finden
- **Hoster-Hinweis:** Bei manchen Hostern brauchst du SSH statt FTP (z.B. Hetzner Cloud)

**5. Schritt 4: Theme auf Standard zurücksetzen (~150 Wörter)**
- Wenn Plugins-Schritt nicht hilft: das Theme ist der Crash-Auslöser
- Via FTP: `wp-content/themes/dein-theme/` umbenennen
- WordPress fällt auf "Twenty Twenty-Four" zurück
- Bei Custom-Theme: Funktionen einzeln deaktivieren (functions.php)

**6. Schritt 5: Backup-Restore (Hoster-spezifisch) (~300 Wörter)**

*Hoster-spezifische Klick-Pfade — direkt aus unseren Premium-Guides:*

**Strato:**
1. https://www.strato.de/apps/CustomerService → Hosting → Sicherungen
2. Strato hält 14 Tage tägliche Snapshots automatisch
3. Letzter gesunder Tag wählen → "Wiederherstellen"

**IONOS:**
1. https://login.ionos.de → Hosting & WordPress → Backups
2. **Selektive Wiederherstellung**: nur `wp-content/plugins` zurückspielen, Datenbank intakt lassen
3. WordPress-Auto-Updates auf manuell setzen

**All-Inkl:**
1. https://kas.all-inkl.com → Tools → Datensicherung
2. Backup vor dem Crash → Webspace-only oder Database+Webspace
3. PHP-Version auf 8.2 (FastCGI) prüfen

**Hostinger:**
1. https://hpanel.hostinger.com → Hosting → Backups
2. **Erst Datenbank-only restoren**, dann Files separat
3. LiteSpeed-Cache leeren

**Hetzner KonsoleH:**
1. https://konsoleh.hetzner.com → Webspace → Backup-Center
2. 14 Tage Snapshots automatisch
3. File-only oder Database+File-Restore

**7. Schritt 6: PHP-Version + OPcache prüfen (~150 Wörter)**
- PHP 8.2 ist ab 2024 Standard
- OPcache-Aktivierung verhindert Re-Crashs nach Plugin-Updates
- Hoster-Backend → PHP-Konfiguration → OPcache Checkbox

**8. Wenn nichts hilft: das Tiefe-Problem (~200 Wörter)**
- Du hast alle 6 Schritte durch — die Site crasht weiter
- Wahrscheinliche Ursachen: kompromittiertes Theme-File, defekte Datenbank-Tabelle, Hoster-PHP-Mismatch
- Externe Online-Scanner können das **NICHT** diagnostizieren
- Hier kommt WebsiteFix:
  - Read-Only-Plugin liest deine Error-Logs aus
  - Diagnose: Datei + Zeile + Copy-Paste-Fix
  - 9,90 € für genau diesen Fix-Guide ODER 29 €/Mo Starter mit allen Guides

**9. CTA (~100 Wörter)**
- Primary CTA: **"Jetzt Scan starten — 5 Minuten"** → `/scan`
- Secondary CTA: **"WP-Critical-Error-Guide für 9,90 €"** → `/scan/results` → Guide-Auswahl
- Trust-Signal: "Über 1.200 WordPress-Seiten optimiert"

### Interne Verlinkung
- → Blog-Post "BFSG 2025 für Agenturen"
- → /scan (Scan-Eingabe)
- → /fuer-agenturen (Agency-Pricing)

### SEO-Tipps für die Veröffentlichung
- Schema-Markup: `HowTo` mit den 6 Schritten
- Bilder: Screenshots vom Recovery-Modus, FTP-Client, Hoster-Backend (zumindest Strato + IONOS für DACH-Top-Conversion)
- Internal-Anchor: `#schritt-3-plugin-deaktivieren` für direkten Sprung aus Suchergebnissen
- FAQ-Sektion am Ende mit 5 Q&A: "Was tun wenn der Recovery-Modus nicht erreichbar ist?", "Wie lange dauert ein Backup-Restore?", etc.

---

## 3) Posting-Reihenfolge (Tag-Plan)

### Morgens (10:00)
- Blog-Post live schalten (slug: `wordpress-kritischer-fehler-beheben`)
- Google Search Console: URL einreichen für Indexierung
- Bing Webmaster Tools: dito

### Mittags (12:30)
- LinkedIn-Post (Variante B) posten
- Tagging: 2-3 WordPress-Influencer im DACH-Raum + Hashtags
- Bild: XrayCompareCard-Screenshot

### Nachmittags (15:00)
- Twitter/X-Cross-Post mit Kurzfassung (Variante A, gekürzt auf 280 Zeichen)
- Reddit r/Wordpress: Blog-Post-Link mit kurzem Lead
- Facebook-WordPress-Gruppen (DACH): wenn aktiv

### Abends (17:00)
- E-Mail an Beta-Tester / Erste-User-Liste: "Tool ist live, hier dein 9,90 €-Erste-Fix-Guide-Link"
- Sentry/Plausible-Logs prüfen — gibt's Errors/Crashes?
