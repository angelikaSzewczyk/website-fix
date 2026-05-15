---
title: "WordPress Heartbeat drosseln: CPU-Last senken ohne Plugin."
description: "Lädt deine WordPress-Seite zäh, obwohl niemand drauf ist? Eine versteckte Standard-Funktion schickt alle 15 Sekunden eine unnötige Anfrage an deinen Server — und kostet dich Kunden. So schaltest du sie ab: in 5 Minuten, ohne Programmieren, mit Rücknahme-Sicherheit."
date: "2026-05-13"
category: "performance"
tags:
  - "WordPress Heartbeat drosseln"
  - "heartbeat api cpu last"
  - "admin-ajax.php drosseln"
  - "wordpress heartbeat control alternative"
  - "wordpress ttfb optimieren"
  - "hosting cpu limit wordpress"
  - "wp_heartbeat_settings filter"
  - "wordpress performance snippet"
status: "published"
thumbnail: "/blog/heartbeat-throttle.webp"
ogImage: "/blog/heartbeat-throttle.webp"
howTo:
  name: "WordPress Heartbeat-API per PHP-Snippet kontextabhängig drosseln"
  description: "Reduziert die WordPress-Heartbeat-Frequenz auf 60 s im Admin, 120 s im Post-Editor und 300 s im Frontend — ohne zusätzliches Plugin."
  totalTime: "PT5M"
  tool: "WordPress 5.9+ mit Child-Theme oder Plugin Code Snippets"
  steps:
    - name: "Backup anlegen"
      text: "Erstelle ein vollständiges Backup oder zumindest eine Kopie der functions.php deines aktiven Child-Themes. Pflicht-Schritt vor jeder direkten Code-Änderung."
    - name: "Heartbeat-Drossel-Snippet kopieren"
      text: "Öffne die WebsiteFix Smart-Fix Library und kopiere den Heartbeat-Drossel-Snippet (slug: heartbeat-drosselung) inklusive Auto-Safety-Check, der Kollisionen mit Heartbeat Control oder WP Rocket erkennt."
      url: "https://website-fix.com/smart-fix-library#snippet-heartbeat-drosselung"
    - name: "Snippet in functions.php einfügen"
      text: "Füge den Code am Ende der functions.php des aktiven Child-Themes ein — oder lege ihn als neues PHP-Snippet im Plugin Code Snippets an und aktiviere es im Frontend- und Backend-Kontext."
    - name: "Wirkung im Network-Tab validieren"
      text: "Lade das Frontend neu, öffne die Browser-DevTools im Network-Tab und filtere nach admin-ajax.php. Im Frontend dürfen keine Heartbeat-Polls mehr erscheinen, im Admin maximal alle 60 Sekunden ein POST mit action=heartbeat."
faq:
  - q: "Was ist die WordPress-Heartbeat-API überhaupt?"
    a: "Die Heartbeat-API ist ein eingebauter WordPress-Mechanismus, der ab Version 3.6 (2013) im Hintergrund per AJAX-Request auf /wp-admin/admin-ajax.php pollt. Im Admin standardmäßig alle 15 Sekunden, im Post-Editor sogar alle 15–30 Sekunden für Autosave und Post-Locking. Sie liefert Funktionen wie Auto-Save, Session-Heartbeat, Multi-User-Edit-Conflict-Detection und Live-Notifications. Ohne Drosselung verursacht sie auf Shared-Hosting messbare CPU-Last."
  - q: "Wie viel CPU spart die Heartbeat-Drosselung wirklich?"
    a: "Auf einer typischen WooCommerce-Site mit 3 Admins, die parallel arbeiten, sinkt die admin-ajax.php-Last um 75–85 %, weil die Polling-Frequenz von 15 s auf 60–120 s reduziert wird. Im Frontend (wo Heartbeat ohne Login meist nutzlos ist) wird die CPU-Last komplett eliminiert. Bei IONOS-, Strato- oder All-Inkl-Shared-Plänen mit harten CPU-Limits ist das oft der Unterschied zwischen täglichen 503-Errors und stabilem Betrieb."
  - q: "Was passiert mit dem Autosave im Gutenberg-Editor?"
    a: "Bei der hier empfohlenen Konfiguration (120 s im Post-Editor) speichert WordPress automatisch alle 2 Minuten statt alle 60 Sekunden. Für die meisten Workflows ein akzeptabler Tradeoff — Strg+S funktioniert weiterhin manuell. Falls dein Team in 15-Sekunden-Intervallen tippt und Crashs nicht riskieren will, setz den Editor-Wert auf 60 statt 120."
  - q: "Konflikt mit dem Plugin Heartbeat Control oder WP Rocket?"
    a: "Der Snippet enthält einen Auto-Safety-Check: Wenn Heartbeat Control oder WP Rocket aktiv sind, bricht er sofort mit return ab und schreibt einen WP_DEBUG-Log-Eintrag. Du läufst also nicht in Doppel-Konfigurationen, die sich gegenseitig überschreiben."
  - q: "Funktioniert die Drosselung auch für WooCommerce-Carts mit Live-Sync?"
    a: "Vorsicht: WooCommerce-Cart-Fragmente und einige Live-Notification-Plugins (BuddyPress, Buddy Boss) brauchen den Frontend-Heartbeat. Wenn dein Shop ein Mini-Cart im Header mit Live-Update hat, wirkt sich das wp_deregister_script('heartbeat') aus dem Snippet aus. Lösung: den Frontend-Deregister-Block auskommentieren und nur die Drosselung auf 300 s aktiv lassen — Live-Sync läuft weiter, aber seltener."
  - q: "Wie messe ich vor und nach der Drosselung den CPU-Effekt?"
    a: "Drei Wege: 1) Im Hosting-Panel das CPU-/IO-Diagramm vor und nach dem Snippet vergleichen (24 h Range). 2) Per Browser-DevTools im Network-Tab admin-ajax.php beobachten — sollte von alle 15 s auf alle 60–120 s droppen. 3) Im 92-Punkt Deep-Audit zeigt WebsiteFix automatisch die Heartbeat-Frequenz und das errechnete Polling-Volumen pro Stunde."
---

![WordPress Heartbeat drosseln — CPU-Last-Kurve und admin-ajax-Polling-Visualisierung](/blog/heartbeat-throttle.webp)

# WordPress Heartbeat drosseln: CPU-Last senken ohne Plugin.

Dein Hoster meckert wieder per Mail wegen „CPU-Verbrauch erhöht". Im Backend ist alles ruhig. Die Seite fühlt sich trotzdem zäh an. Besucher landen drauf — und sind weg, bevor sie etwas sehen. Klingt vertraut?

**Du bist nicht alleine.** WordPress hat eine versteckte Standard-Funktion, die alle 15 Sekunden im Hintergrund mit deinem Server „spricht" — auch wenn gerade niemand auf der Seite ist. Bei zwei Personen, die parallel im Backend arbeiten, sind das **8.640 Klicks pro Tag**, die niemand braucht. Dein Hoster zahlst du dafür, dass er das mitmacht.

Die gute Nachricht: du kannst das abstellen. **Ohne Plugin, ohne Risiko, in 5 Minuten** — und falls dir der Code-Teil Angst macht, gibt's am Ende eine Klick-für-Klick-Anleitung als PDF, mit eingebauter Rücknahme-Sicherheit.

> ### In 30 Sekunden zum Punkt
>
> Lädt deine Seite über 2 Sekunden? Dann **verlierst du laut Google bis zu 35 % deiner Besucher**, bevor sie überhaupt etwas sehen. Eine der häufigsten Ursachen: WordPress spricht alle 15 Sekunden mit sich selbst — auch wenn niemand auf der Seite ist. Das frisst CPU bei deinem Hoster und kostet dich Antwortzeit auf jeder Seite.
>
> Wir zeigen dir, wie du das in **5 Minuten** abstellst — bei dir reduziert sich die unnötige Server-Last typischerweise um 75–85 %. Mit eingebauter Sicherheits-Prüfung, die erkennt, ob bei dir gefährliche Plugin-Kollisionen drohen, und sich dann selbst stoppt.
>
> **Drei Wege zur Lösung — wähl, was zu dir passt:**
>
> - [Komplette Schritt-für-Schritt-Anleitung als PDF für 9,90 € →](/scan/checkout) (kein Konto nötig, kommt direkt per Mail)
> - [Erst scannen, ob das wirklich DEIN Problem ist →](/scan) (kostenlos, 60 Sekunden)
> - [Code-Snippet für Selbst-Macher →](/smart-fix-library#snippet-heartbeat-drosselung) (copy-paste-ready, mit Safety-Wrapper)

---

## Symptome — daran erkennst du das Problem

Wenn drei dieser Punkte auf deine Site zutreffen, ist Heartbeat ein heißer Kandidat:

- **Deine Seite braucht über eine Sekunde, bis sie reagiert.** Auch ohne dass viel Traffic drauf ist. Du klickst dich durchs Backend und es fühlt sich „schwerfällig" an — als würde dein Server „nachdenken" müssen.
- **Dein Hoster mailt dir wegen Überlastung.** Betreffzeilen wie *„CPU-Verbrauch erhöht"* (IONOS, Strato, All-Inkl, Hetzner) — vielleicht hast du die längst weggeklickt. Bedeutet aber: dein Account ist auf der internen „Demnächst-Drosseln"-Liste.
- **Das Speichern-Symbol im Editor dreht sich gefühlt ständig.** WordPress speichert automatisch alle 15 Sekunden — was sich sicher anfühlt, auf langsamen Servern aber bei jedem Speichern 0,3–0,5 Sekunden Verzögerung kostet.
- **Online-Shop läuft zäh, wenn zwei Personen gleichzeitig im Backend arbeiten.** Bestellungen, Lager, Produkte editieren — alles wird langsam, weil beide Backends gleichzeitig „Lebenszeichen" senden.
- **Plötzliche „Diese Seite ist nicht verfügbar"-Fehler zu Bürozeiten**, obwohl kaum Besucher da sind. Klassisches Zeichen, dass dein Server überfordert ist.

Wenn keines davon zutrifft, hat dein Hoster wahrscheinlich genug Reserven und du brauchst diese Optimierung nicht zwingend. Wenn mehrere zutreffen: weiterlesen.

---

## Was die WordPress-Heartbeat-API technisch macht

Die Heartbeat-API ist ein 2013 mit WordPress 3.6 eingeführter Mechanismus für serverseitig getriebene Live-Kommunikation. Sie löst drei reale Probleme:

1. **Autosave** — der Post-Editor speichert Entwürfe ohne expliziten Save-Click.
2. **Post-Locking** — wenn Autor A einen Artikel öffnet, sehen Autor B und C einen Hinweis, dass der Artikel gerade bearbeitet wird.
3. **Session-Heartbeat** — Login-Sessions werden verlängert, solange der Benutzer aktiv arbeitet.

Technisch funktioniert das so: WordPress lädt im Admin und auf einigen Frontend-Kontexten das Script `wp-includes/js/heartbeat.js`. Dieses Script führt alle 15–60 Sekunden einen `POST`-Request auf `/wp-admin/admin-ajax.php` aus, mit `action=heartbeat` als Parameter. Der Server feuert dann eine Reihe von WordPress-Hooks (`heartbeat_received`, `heartbeat_send`), die Plugins für eigene Live-Funktionen nutzen können.

**Standard-Intervalle (WordPress-Defaults 2026):**

| Kontext         | Default-Frequenz | Polls pro Stunde |
|-----------------|------------------|------------------|
| Post/Page-Editor | 15 s            | 240              |
| Admin (übriger Bereich) | 60 s     | 60               |
| Frontend (eingeloggt) | 60 s        | 60               |
| Frontend (anonym) | nicht aktiv    | 0                |

Auf einer Site mit zwei Editoren, die jeweils zwei Stunden am Tag im Editor arbeiten, sind das **960 zusätzliche PHP-Requests pro Tag** — allein durch Heartbeat, ohne dass ein einziger Besucher die Site aufruft.

Jeder dieser Requests durchläuft den kompletten WordPress-Bootstrap (`wp-load.php`, Plugin-Init, Theme-Setup), bevor er die Heartbeat-Action erreicht. Auf gut konfigurierten Servern ist das ein 30–80 ms CPU-Vorgang. Auf Shared-Hosting mit kaltem OPCache: 200–500 ms pro Call. Multipliziert mit 240 Polls pro Stunde: **bis zu 2 Minuten reine CPU-Zeit pro Stunde pro Editor**, ohne dass irgendwer aktiv arbeitet.

---

## Diagnose: misst du das Problem überhaupt?

Bevor du Code änderst, prüf ob die Heartbeat-API auf deiner Site wirklich CPU frisst. Drei Wege, vom schnellen zum gründlichen Check:

**Schnellcheck im Browser (30 Sekunden):**
Logge dich in dein WordPress-Backend ein. Öffne die DevTools (F12), Tab `Network`. Setz den Filter auf `admin-ajax`. Jetzt warte 60 Sekunden. Du wirst alle 15–60 Sekunden einen POST sehen — das ist Heartbeat. Wechsle in den Post-Editor, warte nochmal eine Minute. Die Frequenz nimmt zu.

**Mittelcheck per Access-Log (5 Minuten):**
Wenn du SSH-Zugang hast, läuft folgender Befehl auf den letzten 1.000 Log-Zeilen und zählt admin-ajax-Calls:

```bash
tail -1000 /var/log/nginx/access.log | grep -c "admin-ajax.php"
```

Wert über 200 bei einer Site mit moderatem Traffic? Heartbeat ist mit hoher Wahrscheinlichkeit ein dominanter Faktor.

**Vollchecknach: 92-Punkt Audit (60 Sekunden, ohne SSH):**
Wenn du den Hoster-Zugang nicht hast oder lieber eine objektive Messung willst, gibt dir der [WebsiteFix Deep-Audit](/scan) die Heartbeat-Frequenz pro Kontext, die Polls-pro-Stunde-Rechnung und einen direkten Vergleich vor/nach dem Snippet-Apply. Read-only, kein Plugin nötig.

---

## Die Lösung: kontextabhängige Drosselung per Snippet

Statt Heartbeat global zu deaktivieren (was Autosave und Post-Locking zerstören würde), drosseln wir kontextabhängig:

- **Post/Page-Editor: 120 s** — Autosave läuft seltener, aber zuverlässig.
- **Restlicher Admin: 60 s** — Session-Heartbeat bleibt, CPU-Druck sinkt um 75 %.
- **Frontend: 300 s** — fast aus. Optional komplett deregistriert, wenn du kein Live-WooCommerce-Cart nutzt.

Die Drosselung greift in den eingebauten Filter `heartbeat_settings`. Der entscheidende Hook:

> **Keine Sorge, falls dir Code Angst macht.** Wenn etwas schiefgeht, nimmst du den Code einfach wieder raus — WordPress kehrt sofort zurück zum Standard-Verhalten, **keine bleibende Änderung an deiner Datenbank, keine Theme-Datei beschädigt**. Falls du dich trotzdem nicht traust: in der [9,90-€-Anleitung](/scan/checkout) führen wir dich Klick für Klick durch jeden Schritt, inklusive Backup-Vorgehen und Rollback-Anleitung.

```php
add_filter( 'heartbeat_settings', function( $settings ) {
    if ( is_admin() ) {
        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        if ( $screen && in_array( $screen->base, array( 'post', 'page' ), true ) ) {
            $settings['interval'] = 120;
        } else {
            $settings['interval'] = 60;
        }
    } else {
        $settings['interval'] = 300;
    }
    return $settings;
}, 10, 1 );
```

Der vollständige Code mit Auto-Safety-Check (erkennt Heartbeat Control + WP Rocket und bricht in dem Fall ab) und Frontend-Deregister-Option liegt copy-paste-ready in der Library:

> **[Vollständigen Code samt Safety-Wrapper im Code-Lab öffnen →](/smart-fix-library#snippet-heartbeat-drosselung)**
>
> Inklusive Sicherheits-Wrapper, 1-2-3 Install-Anleitung und Rollback-Hinweis.

**Warum nicht einfach das Plugin Heartbeat Control nehmen?**
Heartbeat Control ist solide, aber es ist ein zusätzliches Plugin, das geladen, geupdatet und verwaltet werden muss. Für eine 8-Zeilen-Konfiguration auf 30 Agentur-Sites lieber den Code direkt ins Child-Theme legen — version-controlled, ohne Plugin-Repository-Abhängigkeit, ohne separates Settings-UI.

---

## Was nicht (mehr) klappt — Risiken & Side-Effects

Ehrlicher Hinweis vor dem Apply — drei Dinge, die du verlierst oder anders konfigurieren musst:

1. **Autosave-Dichte im Editor sinkt.** Mit dem Snippet speichert WordPress alle 120 Sekunden statt alle 15. Wenn dein Team in einer extrem unzuverlässigen Browser-/Tab-Umgebung arbeitet, könnte das in seltenen Crash-Szenarien 2 Minuten Arbeit kosten. Workaround: Editor-Interval auf 60 statt 120 setzen.

2. **WooCommerce-Cart-Fragmente live-Update.** Wenn du einen Live-Cart-Indicator im Header hast (z. B. „3 Artikel im Warenkorb"-Counter, der ohne Reload aktualisiert), nutzt der eventuell den Frontend-Heartbeat. Der Snippet deaktiviert per `wp_deregister_script('heartbeat')` Heartbeat auf nicht-Admin-Seiten komplett. Lösung: diesen Block im Snippet auskommentieren — Heartbeat läuft weiter im Frontend, aber nur alle 300 Sekunden statt 60.

3. **BuddyPress / BuddyBoss / Live-Notification-Plugins.** Wenn dein Frontend Live-Benachrichtigungen ohne Reload zeigt, brauchst du Heartbeat im Frontend. Gleiche Lösung wie oben: nur drosseln, nicht deregistrieren.

Der Auto-Safety-Check des Snippets fängt die häufigsten Plugin-Kollisionen ab, kann aber keine Custom-Lösungen erkennen. Im Zweifel: **In der Staging-Umgebung testen.**

---

## Wann macht das Snippet KEINEN Sinn?

Vier Szenarien, in denen die Drosselung Nachteile bringt oder überflüssig ist:

- Du nutzt bereits **Heartbeat Control** oder **Perfmatters** mit eigener Heartbeat-Konfiguration. Der Auto-Safety-Check würde abbrechen — kein Schaden, aber auch kein Nutzen.
- Deine Site läuft auf **dediziertem Hosting mit CPU-Reserven** und du hast keine messbaren TTFB-Probleme.
- Du nutzt ein **Real-Time-Collaboration-Plugin** (z. B. Multi-User-Live-Editing wie Frase oder Doppelganger), das auf hohe Heartbeat-Frequenz angewiesen ist.
- Deine Site hat **nur einen Admin, der selten parallel arbeitet** — der Effekt wäre messbar, aber nicht wirtschaftlich relevant.

---

## Erweiterte Strategie für Agenturen

Für Sie als Agentur lohnt die Drosselung skalierend. Wenn Sie 30 Kundensites betreuen:

| Kennzahl                | Vor Drosselung | Nach Drosselung |
|-------------------------|----------------|-----------------|
| admin-ajax-Calls / Tag  | ~270.000       | ~50.000         |
| CPU-Sekunden / Tag      | ~135 Minuten   | ~25 Minuten     |
| 503-Errors / Monat (ø)  | 8–12           | 1–2             |
| Hosting-Eskalations-Mails| ~3 / Monat    | praktisch 0     |

Empfohlenes Rollout-Vorgehen:
1. **Eine Pilot-Site** mit dem Snippet ausstatten (idealerweise die mit den meisten 503-Errors). 24h Beobachtungsfenster.
2. **CPU-Verlauf im Hosting-Panel** vor/nach vergleichen.
3. **Rollout auf alle Kundensites** über ein zentral verwaltetes Snippet (z. B. via MU-Plugin, Git-deployed Child-Theme, oder Agency-Scale Auto-Fix-Funktion).
4. **Monitoring einrichten**, das den Effekt langfristig sichtbar macht.

Wenn Sie Schritt 4 nicht selbst aufsetzen wollen: die [WebsiteFix Agency-Konsole](/fuer-agenturen) misst die Heartbeat-Frequenz auf jeder verbundenen Site automatisch und zeigt Regressionen, falls ein späteres Update den Snippet überschreibt.

---

## Weiterführend

Drei direkte Anschluss-Lektüren, wenn dieser Post deinen TTFB-Schmerz aufgelöst hat:

- [Webhosting zu langsam? Warum WordPress-Seiten 2026 wirklich hängen](/blog/website-laedt-extrem-langsam) — die nicht-Heartbeat-Ursachen für hohen TTFB (DOM-Bloat, Page-Builder, Cart-Fragmente).
- [Elementor & Divi ohne Speed-Verlust: 8 Hebel für PageSpeed > 90](/blog/elementor-divi-ohne-speed-verlust) — wenn du Page-Builder nutzt, ist Heartbeat selten dein größtes Problem.
- [Smart-Fix-Library: alle 5 Performance-Snippets im Überblick](/smart-fix-library) — neben Heartbeat noch jQuery-Migrate, Emojis, Query-Strings und XML-RPC.

Wenn du sofort messen willst, welche dieser Optimierungen für DEINE Site relevant sind: der [92-Punkt Deep-Audit](/scan) liefert die individuelle Priorisierung in 60 Sekunden — ohne dass du ein Plugin installieren musst.
