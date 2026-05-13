---
title: "jQuery-Migrate aus dem WordPress-Frontend entfernen — ohne den Admin zu brechen (2026)."
description: "Lighthouse meckert jquery-migrate.min.js als Render-Blocker an? Plugin-Lösungen entfernen es überall und brechen Gutenberg. So entfernst du es chirurgisch nur im Frontend — mit Code-Snippet, Auto-Safety-Check und 2026er Reality-Check."
date: "2026-05-13"
category: "performance"
tags:
  - "jquery migrate entfernen wordpress"
  - "jquery-migrate deaktivieren"
  - "jquery migrate console warning"
  - "wordpress legacy javascript"
  - "render blocking jquery migrate"
  - "jqmigrate version 3"
  - "wordpress lighthouse jquery migrate"
status: "published"
thumbnail: "/blog/jquery-migrate-frontend.webp"
ogImage: "/blog/jquery-migrate-frontend.webp"
howTo:
  name: "jQuery-Migrate aus dem WordPress-Frontend entfernen, im Admin aktiv lassen"
  description: "Frontend-only Removal von jquery-migrate.min.js per PHP-Snippet — Lighthouse-Score steigt, Gutenberg-Editor und ältere Page-Builder-Admin-UIs bleiben unangetastet. Inklusive automatischer Erkennung konkurrierender Plugins."
  totalTime: "PT4M"
  tool: "WordPress 5.5+, Child-Theme oder Plugin Code Snippets"
  steps:
    - name: "Backup anlegen"
      text: "Pflicht-Schritt vor jeder Code-Änderung: Backup der functions.php deines aktiven Child-Themes oder vollständiges Site-Backup. Bei Hostern mit One-Click-Backup reicht ein Klick im Hosting-Panel."
    - name: "jQuery-Migrate-Snippet aus dem Code-Lab kopieren"
      text: "Öffne die WebsiteFix Smart-Fix Library und kopiere den jQuery-Migrate-Snippet (slug: jquery-migrate-drosseln). Auto-Safety-Check erkennt aktive Versionen von 'Disable jQuery Migrate' oder Perfmatters und greift in dem Fall NICHT ein."
      url: "https://website-fix.com/smart-fix-library#snippet-jquery-migrate-drosseln"
    - name: "Snippet in functions.php einfügen"
      text: "Füge den Code am Ende der functions.php des aktiven Child-Themes ein — oder lege ihn als neues PHP-Snippet im Plugin Code Snippets an. Speichern."
    - name: "Frontend testen — Console + Network-Tab"
      text: "Öffne deine Site im Browser, F12 für DevTools. Console: kein 'JQMIGRATE: Migrate is installed'-Warning mehr. Network-Tab nach 'jquery-migrate' filtern: nichts mehr im Frontend, im wp-admin weiterhin sichtbar."
faq:
  - q: "Was ist jQuery-Migrate in WordPress?"
    a: "jQuery-Migrate ist eine Brücken-Bibliothek, die seit 2013 von WordPress mitgeliefert wird. Sie patcht stillschweigend Funktionen, die in modernen jQuery-Versionen entfernt wurden — `$.browser`, `$.live()`, `.size()`, die alte zwei-Handler-Signatur von `.toggle()` und ein paar Dutzend weitere veraltete APIs. Wenn dein Theme oder Plugin solche Aufrufe noch nutzt, würden sie ohne Migrate einen JavaScript-Fehler werfen. WordPress lädt Migrate deshalb automatisch als Dependency neben jQuery, im Frontend wie im Backend."
  - q: "Brauche ich jQuery-Migrate 2026 überhaupt noch?"
    a: "Mit hoher Wahrscheinlichkeit nein, zumindest nicht im Frontend. WordPress 5.5 (August 2020) hat jQuery von 1.x auf 3.5 upgegradet — seit fast sechs Jahren laufen alle Core-Komponenten auf modernem jQuery. Themes und Plugins, die nach Mitte 2020 weiterentwickelt wurden, sind angepasst und brauchen Migrate praktisch nie. Wenn dein Theme zuletzt 2019 ein Update bekommen hat: Migrate ist nicht das Problem, das veraltete Theme ist es. Wenn dein Theme aktiv gepflegt wird: Migrate raus aus dem Frontend ist meist No-op."
  - q: "Was passiert, wenn ich Migrate komplett entferne (auch im Admin)?"
    a: "In den meisten Fällen funktioniert WP weiter normal. Aber: einige ältere Gutenberg-Custom-Blöcke und Page-Builder-Admin-UIs (Elementor-Editor in Versionen vor 3.18, älterer Divi-Builder, Visual Composer < 6) nutzen im Admin-Kontext noch jQuery-1.x-Patterns. Ohne Migrate werfen sie JavaScript-Errors, der Editor wird unbrauchbar. Genau deshalb ist die Frontend-only-Strategie sicherer: alle Performance-Gewinne im Frontend mitnehmen, das volle Admin-Risiko aber vermeiden."
  - q: "Warum entfernt das Snippet Migrate nur im Frontend?"
    a: "Im Frontend liefert Migrate seit Jahren keinen Mehrwert mehr. Es kostet aber 11 KB Transfer, 30 KB Parse-Cost und einen render-blocking Request im `<head>`. Im Admin dagegen hängen einige ältere Block- und Builder-UIs am Migrate-Layer — wenn die brechen, ist deine Editor-Erfahrung ruiniert, ohne dass es einem Site-Besucher hilft. Surgical Frontend-only ist deshalb der Best-of-Both-Worlds-Ansatz: Lighthouse-Score-Boost ohne Editor-Risiko."
  - q: "Kollidiert das mit Disable jQuery Migrate, Perfmatters oder WP Rocket?"
    a: "Der Snippet enthält einen Auto-Safety-Check, der die `active_plugins`-Liste auf 'Disable jQuery Migrate' und Perfmatters prüft. Findet er eines aktiv, bricht er mit `return` ab und schreibt nur einen WP_DEBUG-Log-Eintrag. WP Rocket hat keinen eigenen Migrate-Toggle, lässt sich also problemlos parallel betreiben. Du läufst nicht in Doppel-Konfigurationen, die sich gegenseitig überschreiben."
  - q: "Wie sehe ich, ob mein Theme noch Migrate braucht?"
    a: "Drei Wege. (1) Browser-Console im Frontend öffnen — wenn dort `JQMIGRATE: ...is deprecated`-Warnings stehen (nicht nur das harmlose 'is installed'-Notice), nutzt JS-Code aktiv veraltete Patterns. (2) WP-Theme im Staging laden, Snippet apply, alle Frontend-Funktionen durchklicken (Slider, Cookie-Banner, Custom-Forms, AJAX-Filter). Brechen welche → Theme hängt an Migrate. (3) `grep -rn '$.browser\\|$.live(\\|.size()\\|$.fn.size' wp-content/themes/<dein-theme>` im SSH liefert die problematischen Stellen direkt."
  - q: "Verbessert das Lighthouse messbar?"
    a: "Auf einer typischen WordPress-Site, die vorher ein Mobile-Score von 75–80 hatte: 2–5 Punkte Verbesserung sind realistisch. Der Audit 'Reduce unused JavaScript' verliert den jquery-migrate-Eintrag (oft ein Top-3-Treiber), der Audit 'Eliminate render-blocking resources' wird kürzer. Auf High-End-Sites (Score schon > 90) ist der Effekt weniger sichtbar, dort liegen die Engpässe an anderer Stelle. Bei mobilen 3G-Tests, wo Parse-Cost überdurchschnittlich teuer ist, kann der Effekt auf den Largest Contentful Paint 50–150 ms ausmachen."
---

![jQuery-Migrate aus dem WordPress-Frontend entfernen — Surgical Frontend-Removal mit aktivem Admin-Fallback](/blog/jquery-migrate-frontend.webp)

# jQuery-Migrate aus dem WordPress-Frontend entfernen — ohne den Admin zu brechen (2026).

Lighthouse meldet auf rund 70 % aller WordPress-Sites `jquery-migrate.min.js` als Top-Hit im Audit „Reduce unused JavaScript". Die Browser-Console wirft auf jeder Page das gleiche Notice: `JQMIGRATE: Migrate is installed, version 3.4.x`. Und auf einem ehrlichen Mobile-3G-Test summiert sich der Parse-Cost dieser Bibliothek auf 50 bis 150 ms — für Code, den WordPress-Core seit August 2020 nicht mehr braucht.

Die gängige Antwort auf das Problem lautet: „Installier das Plugin *Disable jQuery Migrate*" oder „nimm Perfmatters und klick den Toggle". Beide Lösungen entfernen Migrate dann allerdings **überall** — auch im wp-admin. Das wiederum bricht Gutenberg-Custom-Blöcke, den älteren Elementor-Editor und ein paar Dutzend andere Page-Builder-Admin-UIs, die noch auf jQuery-1.x-Syntax bauen. Du gewinnst 11 KB im Frontend und verlierst dafür die Hälfte deines Editors.

Dieser Post zeigt dir den chirurgischen Mittelweg: ein Code-Snippet, das Migrate **nur im Frontend** entfernt und im Admin aktiv lässt. Lighthouse-Score-Boost ohne Editor-Risiko. Vier Minuten Setup, kein Plugin.

> ### TL;DR — Migrate in 4 Minuten sicher aus dem Frontend entfernen
> 1. **Frontend-only:** Der Snippet aus der Smart-Fix-Library hängt sich in `wp_default_scripts` und entfernt `jquery-migrate` aus den jQuery-Dependencies — aber nur auf öffentlichen Seiten. Im Admin bleibt alles unverändert.
> 2. **Auto-Safety-Check:** das Snippet erkennt aktive Versionen von „Disable jQuery Migrate" oder Perfmatters und macht in dem Fall ein No-op. Doppel-Konfigurationen ausgeschlossen.
> 3. **Wirkung:** 11 KB weniger Frontend-JS, keine `JQMIGRATE`-Console-Warnings, Lighthouse-Mobile-Score plus 2 bis 5 Punkte. Editor-Erfahrung im wp-admin unangetastet.
>
> **[jQuery-Migrate-Drossel-Code im Lab öffnen →](/smart-fix-library#snippet-jquery-migrate-drosseln)**

---

## Was jQuery-Migrate ist und warum es 2026 noch da ist

jQuery-Migrate ist eine Brücken-Bibliothek, die das jQuery-Team 2013 zusammen mit jQuery 1.9 veröffentlicht hat. Ihr Zweck: APIs, die in jQuery 1.9 entfernt wurden, weiter aufrufbar machen — damit Plugin- und Theme-Code, der noch jQuery 1.6 oder 1.7 voraussetzt, nicht stillschweigend brechen muss.

Die häufigsten Patches:

| Veraltete API | Migrate emuliert |
|---|---|
| `$.browser` (UA-Sniffing) | gibt 2026 oft falsche Werte zurück, läuft aber durch |
| `$.live()` (Event-Binding) | wird intern auf `$.on()` umgeleitet |
| `.size()` (Element-Count) | wird zu `.length` |
| `.toggle(handler1, handler2)` | alte Zwei-Funktionen-Signatur |
| `$.fn.attr()` mit `null`-Default | Migrate liefert das alte Verhalten |

WordPress liefert Migrate seit Version 3.6 (2013) standardmäßig mit. Bis WordPress 5.5 (August 2020) lief im Core noch jQuery 1.12 — Migrate war an dieser Stelle für viele Themes echte Pflicht. Mit 5.5 sprang der Core auf jQuery 3.5, und mit den späteren 5.6er-Releases auf 3.6. Seit dem Sprung sind sechs Jahre vergangen. Sechs Jahre, in denen Theme- und Plugin-Autoren Zeit hatten, ihren Code anzupassen.

Trotzdem lädt WordPress Migrate weiterhin automatisch als jQuery-Dependency — in jedem Frontend, auf jeder Page. Der Grund ist konservativ: WordPress will keine Sites brechen, die noch von einem 2018er Theme leben. Die Folge: 80 % aller WordPress-Sites schleppen 11 KB toten Code mit sich, weil 20 % der Sites ihn theoretisch noch brauchen könnten.

---

## Symptome auf deiner Site

Du weißt, dass dich Migrate betrifft, wenn du eines davon siehst:

- **Browser-Console im Frontend** zeigt `JQMIGRATE: Migrate is installed, version 3.4.x with logging active` — auf jeder Page, schon vor jedem Klick.
- **Lighthouse-Audit** (Chrome DevTools → Lighthouse → Performance) im Bereich „Reduce unused JavaScript" listet `jquery-migrate.min.js` als einen der Top-3-Einträge.
- **PageSpeed-Insights** (web.dev/measure) zeigt unter „Diagnostics" denselben Eintrag mit konkretem Transfer-Saving („Potential savings of 11 KiB").
- **DevTools Network-Tab** im Frontend gefiltert auf `jquery`: zwei Einträge, `jquery.min.js` und `jquery-migrate.min.js`, beide blocking im `<head>` geladen.
- **WP-Theme-Inspector-Tools** (Query Monitor) zeigen jQuery + Migrate als zwei separate registrierte Scripts mit Dependencies-Kette.

Auf reinen Marketing-Sites ohne komplexe Interaktion summiert sich der Performance-Verlust auf 50–150 ms Parse-Cost pro Page-Load. Auf E-Commerce-Sites mit dichten Frontend-Skripten potenziert es sich: Migrate konkurriert mit jedem anderen JS-Block um die Main-Thread-Zeit des Browsers.

---

## Reality-Check 2026: brauchst du Migrate überhaupt noch?

Die Frage, die in fast keinem Tutorial ehrlich beantwortet wird, lautet: **wofür ist diese Bibliothek 2026 noch da?** Drei mögliche Antworten, alle drei kommen in der Praxis vor:

**Antwort 1 — stille Patches für veralteten Theme-/Plugin-Code.**
Wenn dein Theme oder ein aktives Plugin noch `$.browser`, `$.live()`, `.size()` oder die alte `.toggle()`-Signatur nutzt, bricht JavaScript ohne Migrate. Das passiert in der Praxis bei Themes, die zuletzt vor 2020 ein ernsthaftes Update bekommen haben — also bei einer ehrlichen Schätzung 15 bis 25 % aller WordPress-Sites im DACH-Raum.

**Antwort 2 — Console-Warnings als Diagnose-Tool.**
Migrate gibt im WP_DEBUG-Modus präzise Warnungen aus, sobald veralteter Code aufgerufen wird (`JQMIGRATE: jQuery.browser is deprecated`). Das ist paradoxerweise oft wertvoller als der Patch selbst — du erfährst, **wo** der veraltete Code sitzt. Für Entwickler ist Migrate damit ein Audit-Tool, nicht primär eine Bridge.

**Antwort 3 — historische Vorsicht des WordPress-Core-Teams.**
Migrate würde nicht weiter automatisch geladen werden, wenn das Core-Team nicht 2020 entschieden hätte: lieber 11 KB Ballast für alle als eine kleine Anzahl gebrochener Legacy-Sites. Diese Entscheidung ist sechs Jahre alt. Sie ist defensiv, nicht performance-orientiert.

**Konsequenz für deine Site:**

- Wenn dein Theme nach Mitte 2020 weiterentwickelt wurde und alle aktiven Plugins regelmäßige Updates bekommen → Migrate raus aus dem Frontend ist mit hoher Wahrscheinlichkeit No-op. Effekt: Score-Boost, keine Funktions-Verluste.
- Wenn dein Theme seit 2019 keinen Major-Release mehr hatte → Migrate ist das Pflaster, das den Theme-Code zusammenhält. Migrate-Removal würde das Symptom angehen, das veraltete Theme bliebe das eigentliche Problem.
- Wenn du es nicht weißt → Snippet im Staging testen, alle Frontend-Funktionen durchklicken (Slider, Cookie-Banner, AJAX-Filter, Custom-Forms). Bricht etwas, hast du eine echte Migrate-Abhängigkeit.

Die Frontend-only-Strategie macht den Test fair: im Admin bleibt Migrate aktiv, du riskierst nicht den Editor. Bricht nur das Frontend, kannst du den Snippet in 30 Sekunden wieder rausnehmen.

---

## Frontend-only vs. Plugin-Total-Off — warum chirurgisch besser ist

Die drei populären Lösungen im DACH-Markt machen alle den gleichen Fehler: sie unterscheiden nicht zwischen Frontend und Admin.

**Plugin *Disable jQuery Migrate* (WordPress.org, ~200.000 aktive Installs):**
Deregistriert Migrate global. Im Frontend und im Admin. Drei Zeilen Code, kein Auto-Safety-Check, keine Kontext-Logik. Risiko: ältere Gutenberg-Custom-Blöcke und Page-Builder-Admin-UIs brechen.

**Perfmatters (Premium-Plugin, ~50.000 aktive Installs):**
Hat einen Toggle „Disable jQuery Migrate". Wirkt identisch zum Free-Plugin oben — global an oder global aus. Differenziert nicht nach Kontext.

**WP Rocket (Premium, ~3 Millionen aktive Installs):**
Hat keine eigene Migrate-Option. Wenn du Migrate raus haben willst, kombinierst du WP Rocket mit *Disable jQuery Migrate* oder Perfmatters — und landest wieder beim Total-Off-Problem.

**Der Snippet aus der Smart-Fix-Library macht es anders:**

```php
add_action( 'wp_default_scripts', function( $scripts ) {
    if ( is_admin() ) {
        return; // im Admin bleibt Migrate aktiv
    }
    if ( ! empty( $scripts->registered['jquery'] ) ) {
        $deps = $scripts->registered['jquery']->deps;
        $scripts->registered['jquery']->deps = array_diff(
            (array) $deps,
            array( 'jquery-migrate' )
        );
    }
}, 1, 1 );
```

Der Filter hakt sich in `wp_default_scripts` ein, prüft `is_admin()` und greift nur im Frontend ein. Migrate wird aus der Dependencies-Kette von jQuery entfernt, der zweite registrierte Script-Eintrag bleibt ungeladen, das `<script>`-Tag im Header verschwindet.

Im wp-admin läuft Migrate dagegen unverändert weiter. Gutenberg-Blöcke, Elementor-Editor, Divi-Builder — alle bekommen das gewohnte jQuery-1.x-Verhalten.

---

## Das vollständige Snippet aus der Library

Der Kern oben sind acht Zeilen. Das vollständige Snippet aus der Smart-Fix-Library hat zwei zusätzliche Komponenten, die in Production wichtig sind:

> **[jQuery-Migrate-Drossel-Code im Lab öffnen →](/smart-fix-library#snippet-jquery-migrate-drosseln)**

**Komponente 1 — Auto-Safety-Check.**
Der Snippet liest `active_plugins` und prüft auf zwei konkurrierende Lösungen:

```php
$wf_active = (array) get_option( 'active_plugins' );
foreach ( array(
    'disable-jquery-migrate/disable-jquery-migrate.php',
    'perfmatters/perfmatters.php',
) as $wf_skip ) {
    if ( in_array( $wf_skip, $wf_active, true ) ) {
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            error_log( 'WebsiteFix Smart-Fix [jquery-migrate]: skipped — handled by ' . $wf_skip . '.' );
        }
        return;
    }
}
```

Findet er eines der beiden aktiv, bricht der Snippet sofort mit `return` ab. Im WP_DEBUG-Modus erscheint ein Log-Eintrag, im Production-Mode passiert lautlos nichts. Du läufst nie in Doppel-Konfigurationen, die sich gegenseitig überschreiben — auch wenn ein Team-Mitglied später eines der Plugins installiert.

**Komponente 2 — `script_loader_tag`-Filter als Backup.**
Falls ein anderes Plugin Migrate-Output nachträglich wieder ins Frontend rendert, fängt ein zweiter Filter den Output ab und liefert einen leeren Tag zurück:

```php
add_filter( 'script_loader_tag', function( $tag, $handle ) {
    if ( 'jquery-migrate' === $handle && ! is_admin() ) {
        return '';
    }
    return $tag;
}, 10, 2 );
```

Das ist Defense-in-Depth: selbst wenn ein Drittanbieter-Plugin Migrate per Force-Enqueue zurückbringt, verschwindet das `<script>`-Tag im Frontend trotzdem aus dem HTML.

**Warum überhaupt ein Snippet statt eines Plugins?**

Drei Gründe: keine Update-Verantwortung gegenüber einem Plugin-Maintainer (Migrate-Patches sind seit 2019 quasi gefroren — kein Update-Bedarf), kein zusätzlicher Plugin-Slot in einer Site, die ohnehin schon zu viele lädt, und version-controlled im Child-Theme oder Code-Snippets-Plugin — bei Site-Migrationen wandert die Konfiguration automatisch mit.

---

## Wann Migrate BEHALTEN — die drei Ausnahmen

Drei Szenarien, in denen du Migrate **nicht** rauswerfen solltest, oder zumindest sehr vorsichtig sein musst:

**1. Theme von vor 2020 ohne aktiven Update-Plan.**
Wenn dein Theme zuletzt 2019 ein ernsthaftes Update bekommen hat, nutzt es mit hoher Wahrscheinlichkeit noch jQuery-1.x-Patterns. Migrate ist das Pflaster, das den Theme-Code zusammenhält. Lösung: Theme erst updaten oder ersetzen, dann Migrate raus. Das ist die ehrlichere Reihenfolge.

**2. Custom-Code im Child-Theme oder in Custom-Scripts.**
Du hast eigene jQuery-Snippets, die irgendwann mal von einem Freelancer kamen. `$.browser`, `$.live()`, `.size()` — wenn du diese Patterns im eigenen Code nutzt, fliegen JS-Errors, sobald Migrate weg ist. SSH-Test, der dir das verrät:

```bash
grep -rn '\$\.browser\|\$\.live(\|\.size()\|\$\.fn\.size' wp-content/themes/<dein-theme>
```

Findest du Treffer → Custom-Code modernisieren, dann Migrate raus.

**3. Page-Builder-Versionen, die im Frontend rendern.**
Manche älteren Page-Builder (Visual Composer < 6, Themify < 5) generieren im Frontend-Output JavaScript-Hooks, die jQuery-1.x-Syntax voraussetzen. Builder-Updates lösen das in den meisten Fällen, aber wenn deine Lizenz abgelaufen ist und du auf einer alten Version festhängst: Migrate behalten, oder Builder zuerst updaten.

In allen drei Fällen ist die saubere Reihenfolge: **Root-Cause fixen, dann Migrate raus.** Der Snippet ist kein Vorwand, technische Schulden weiter zu verschieben.

---

## Verifizieren: hat es geklappt?

Drei Tests, jeweils 30 Sekunden, vom schnellsten zum gründlichsten.

**Test 1 — Browser-Console.**
Öffne dein Frontend ohne Login. F12 → Console-Tab. Lade die Seite neu. Erwartung: kein `JQMIGRATE: Migrate is installed`-Eintrag mehr. Vor dem Snippet stand er auf jeder Page-Load oben drin, nach dem Snippet ist Console im Frontend Migrate-frei.

Logge dich jetzt ins wp-admin ein, öffne wieder F12 → Console. Im Admin sollte der `JQMIGRATE`-Eintrag weiterhin sichtbar sein. Falls ja: alles korrekt, das Snippet wirkt nur im Frontend.

**Test 2 — DevTools Network-Tab.**
F12 → Network → Filter auf `jquery`. Im Frontend lädt nur noch `jquery.min.js`, kein zweiter Eintrag mit `migrate`. Im Admin sind weiterhin beide Dateien zu sehen.

**Test 3 — curl-HTML-Check.**
Im Terminal:

```bash
curl -s https://deine-site.de | grep -c 'jquery-migrate'
```

Erwartung: `0`. Vor dem Snippet hätte da `1` oder `2` gestanden (je nachdem, wie viele Stellen die Migrate-Referenz hatten).

**Test 4 — Lighthouse-Re-Audit.**
Chrome → DevTools → Lighthouse → Mobile + Performance + Run. Im Diagnostics-Bereich „Reduce unused JavaScript" sollte der `jquery-migrate.min.js`-Eintrag verschwunden sein. Im Schnitt verbessert sich der Performance-Score um 2 bis 5 Punkte — auf Mobile-3G-Tests teilweise mehr.

Falls keiner der vier Tests die erwartete Wirkung zeigt: Caching-Layer (WP Rocket, LiteSpeed Cache, Cloudflare) leert nach dem Snippet-Apply, oder ein anderes Plugin schreibt Migrate über einen eigenen Force-Enqueue zurück. Im WP_DEBUG-Log nach dem Tag des Snippet-Apply schauen — der Auto-Safety-Check loggt, wenn er einen Konflikt sieht.

---

## Erweiterte Strategie für Agenturen

Für Sie als Agentur multipliziert sich der Effekt mit jeder Kundensite. Beispiel-Rechnung für eine 30-Sites-Agentur, in der die meisten Themes nach 2020 entwickelt wurden:

| Kennzahl | Ohne Schnitt | Mit Frontend-Removal |
|----------|--------------|----------------------|
| Kundensites mit Theme nach 2020 | 30 | 30 |
| Frontend-JS-Transfer pro Page-Load | ø 30 KB unminified | ø 19 KB |
| Render-blocking Scripts im `<head>` | jQuery + Migrate | nur jQuery |
| Lighthouse-Mobile-Median | 78 | 82 |
| Console-Warnings beim SEO-Audit | 30 Sites × ja | 30 Sites × nein |

Bulk-Rollout-Empfehlung:

1. **MU-Plugin auf der Foundation.** Der [WebsiteFix One-Click Optimizer](/wp-plugin) schreibt den Snippet als `mu-plugin` ins `/wp-content/mu-plugins/`-Verzeichnis. Greift netzwerk-weit, ohne dass jedes Kunden-Theme angefasst werden muss. Beim nächsten Theme-Update der Kundensite bleibt der Snippet trotzdem aktiv.
2. **Erst auf einer Pilot-Site mit aktivem Theme testen.** 24-Stunden-Fenster. Alle Frontend-Funktionen (Slider, Forms, AJAX-Filter, Cookie-Banner) durchklicken. Bricht nichts → Rollout.
3. **Monitoring in der [WebsiteFix Agency-Konsole](/fuer-agenturen).** Pro Site sehen Sie, ob Migrate noch im Frontend lädt, plus den Lighthouse-Verlauf vor und nach Snippet-Apply.

Pragmatischer Hinweis: bei den 15–25 % älteren Sites in jedem Agentur-Portfolio funktioniert der Snippet nicht ohne Theme-Modernisierung. Ehrliche Kommunikation gegenüber dem Kunden: „Wir können das Frontend deutlich beschleunigen, aber dafür muss das Theme zuerst auf eine aktuelle Version, weil sonst Funktionen brechen."

---

## Weiterführend

Drei thematisch passende Anschluss-Lektüren, wenn dieser Post deinen Frontend-JS-Schmerz aufgelöst hat:

- [Wenn Migrate raus ist: die nächsten Builder-Hebel](/blog/elementor-divi-ohne-speed-verlust) — Page-Builder-Performance jenseits von jQuery, mit 8 konkreten Optimierungs-Knöpfen.
- [Nach Frontend-JS die admin-ajax-Last reduzieren](/blog/wordpress-heartbeat-drosseln) — Heartbeat-Drosselung als zweiter Hebel gegen TTFB und CPU-Druck im Backend.
- [Alle 5 Snippets im Performance-Lab](/smart-fix-library) — der vollständige Smart-Fix-Katalog mit Heartbeat, jQuery-Migrate, Emojis, Query-Strings und XML-RPC.

Wenn du sofort messen willst, welche dieser Frontend-Hebel für DEINE Site den größten Effekt bringen: der [92-Punkt Deep-Audit](/scan) liefert die individuelle Priorisierung in 60 Sekunden — ohne dass du ein Plugin installieren musst.
