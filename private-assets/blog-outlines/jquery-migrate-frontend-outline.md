# Post #3 — Outline: „jQuery-Migrate aus dem WordPress-Frontend entfernen"

**Status:** Planning · Stand 2026-05-13
**Reihenfolge im Sprint:** #3 nach Heartbeat + XML-RPC
**Erwartete Wortzahl:** 1.700–2.000
**Target-Position:** Top 3 für „jquery migrate entfernen wordpress" innerhalb 60–90 Tagen

---

## 1. Keyword-Cluster

### Primary Keyword
**`jquery migrate entfernen wordpress`** — ~480 monatliche Suchen DACH, KD 18 (low), SERP dominiert von 2019er-WPBeginner-DE-Stub + Plugin-Listings.

### Secondary Keywords (Body verteilen, Anchor-Variation)
- `jquery-migrate deaktivieren` (320 / Mo)
- `jquery migrate console warning` (210 / Mo)
- `wordpress legacy javascript entfernen` (170 / Mo)
- `render blocking jquery migrate` (150 / Mo)
- `wordpress lighthouse jquery migrate` (90 / Mo)

### Long-Tail (H3/FAQ)
- „jqmigrate is installed version 3"
- „wordpress jquery migrate deaktivieren plugin"
- „jquery migrate brauche ich das noch"
- „jquery migrate weg ohne theme zu brechen"

### Search-Intent
Stark transaktional. User hat Lighthouse-Audit oder Console-Warning gesehen, will Lösung — mit „darf ich das überhaupt?"-Vorlauf. Perfekter Pillar: kurzer Reality-Check + sofortiger Code-Fix.

---

## 2. SERP-Analyse — Wettbewerbs-Lage

| Rank | Aktuelles Ergebnis | Schwäche |
|------|---------------------|----------|
| 1 | Plugin-Listing „Disable jQuery Migrate" (WP.org) | Nur Plugin-Page, keine Erklärung |
| 2 | WPBeginner DE 2019 | Veraltet, empfiehlt nur Plugin, kein Frontend-only-Argument |
| 3 | Kinsta-Blog EN | Generisch, kein Lighthouse-Kontext |
| 4 | Perfmatters-Doku | Promotet Eigen-Plugin |
| 5–10 | Foren-Threads (StackOverflow, WP-Support) | Keine zusammenhängende Pillar-Antwort |

**Strategische Lücke:** Es fehlt ein **deutscher, technisch fundierter Pillar mit Frontend-only-Strategie und 2026er Reality-Check**, der erklärt warum die Plugin-Lösungen alle „Total-Off" machen statt surgical.

---

## 3. USP-Argumentation

**Kern-Insight, der den Post von der Konkurrenz absetzt:**

> Plugins wie „Disable jQuery Migrate" entfernen Migrate **überall** — auch im Admin. Perfmatters macht einen Pauschal-Toggle. Beide brechen ältere Gutenberg-Blöcke und Builder-Admin-UIs, die noch jQuery-1.x-Syntax nutzen. Das Snippet in der Smart-Fix-Library entfernt Migrate **nur im Frontend** und lässt es im Admin aktiv — der einzige Ort, wo es noch echten Wert hat. **Best of both worlds: schnelles Frontend, kompatibler Editor.**

**Zweite USP-Schicht — Reality-Check 2026:**

WordPress 5.5 (Aug 2020) hat jQuery von 1.x auf 3.5 upgegradet. Seit 6 Jahren laufen alle Core-Komponenten auf modernem jQuery. Themes, die nach Mitte 2020 entwickelt wurden, brauchen Migrate praktisch nie. Wer „lieber drinlassen, könnte kaputt gehen" sagt, traut sich nicht, sein Theme als veraltet einzustufen — was es objektiv ist.

**Dritte USP-Schicht — Lighthouse-Impact konkret:**

- Migrate ist 11 KB minified, 30 KB unminified
- Render-blocking im `<head>`, weil als jQuery-Dependency geladen
- Lighthouse-Audit „Reduce unused JavaScript" zeigt Migrate als Top-Hit auf 70 % aller WP-Sites
- Mobile-3G-Test: 50–150 ms Parse + Execute pro Page

Diese drei Argumente gehören prominent in den Post.

---

## 4. Post-Outline

### Frontmatter (Planung)

```yaml
title: "jQuery-Migrate aus dem WordPress-Frontend entfernen — ohne den Admin zu brechen (2026)"
description: "Lighthouse meckert jquery-migrate.min.js als Render-Blocker an? Plugin-Lösungen entfernen es überall und brechen Gutenberg. So entfernst du es surgical nur im Frontend — mit Code-Snippet, Auto-Safety-Check und 2026er Reality-Check."
date: "2026-05-13"
category: "performance"
tags:
  - "jquery migrate entfernen wordpress"
  - "jquery-migrate deaktivieren"
  - "jquery migrate console warning"
  - "wordpress legacy javascript"
  - "render blocking jquery migrate"
  - "jqmigrate version 3"
status: "published"
thumbnail: "/blog/jquery-migrate-frontend.webp"
ogImage: "/blog/jquery-migrate-frontend.webp"
howTo:
  - Backup anlegen
  - Snippet aus dem Code-Lab kopieren
  - In functions.php oder Code-Snippets einfügen
  - Frontend testen (DevTools-Console + Network-Tab)
```

### H1
**„jQuery-Migrate aus dem WordPress-Frontend entfernen — ohne den Admin zu brechen (2026)."**

### Hero-Hook
> Lighthouse meldet auf 70 % aller WordPress-Sites `jquery-migrate.min.js` als „Reduce unused JavaScript"-Top-Hit. Die Browser-Console wirft `JQMIGRATE: Migrate is installed, version 3.4.x` auf jeder Page. Und auf jedem Mobile-3G-Test rechnest du 50–150 ms Parse-Cost für eine Library, die WordPress seit 2020 nicht mehr braucht.

### TL;DR-Box (Featured-Snippet-Bait)

```
> ### TL;DR — Migrate in 4 Minuten sicher entfernen
> 1. Frontend-only: Snippet aus der Smart-Fix-Library entfernt jquery-migrate.min.js nur auf öffentlichen Seiten, lässt es im Admin aktiv.
> 2. Auto-Safety-Check erkennt „Disable jQuery Migrate" + Perfmatters und greift dann nicht ein.
> 3. Wirkung: 11 KB weniger Frontend-JS, keine Console-Warnings, Lighthouse-Score +2 bis +5 Punkte mobile.
> Direkt zur Lösung: [jQuery-Migrate-Drossel-Code im Lab →](/smart-fix-library#snippet-jquery-migrate-drosseln)
```

### Sektion 1 — Was jQuery-Migrate ist und warum es noch da ist
- 2013 als Bridge eingeführt: jQuery 1.9 → spätere Versionen, ohne dass alter Plugin-Code (`$.browser`, `$.live()`, `.size()`, alte `.toggle()`-Signaturen) bricht
- WordPress lädt es bis heute automatisch als jQuery-Dependency — auch wenn längst kein Plugin mehr alte Syntax nutzt
- Pfad: `/wp-includes/js/jquery/jquery-migrate.min.js`

### Sektion 2 — Symptome auf deiner Site
- Browser-Console: `JQMIGRATE: Migrate is installed, version 3.4.x with logging active`
- Lighthouse-Audit: „Reduce unused JavaScript" mit jquery-migrate als Top-Eintrag
- PageSpeed-Insights: 11 KB Transfer + 30 KB unminified Parse-Cost
- DevTools Network-Tab: jquery-migrate.min.js wird im `<head>` als blocking Resource geladen
- WP-Theme-Inspector zeigt jquery + jquery-migrate als 2 separate Dependencies

### Sektion 3 — **Reality-Check 2026: brauchst du Migrate überhaupt noch?** (USP-Sektion)
- WordPress 5.5 (Aug 2020) hat jQuery von 1.x auf 3.5 upgegradet
- 6 Jahre Migrationsfenster: Themes und Plugins, die nach 2020 weiterentwickelt wurden, sind angepasst
- jQuery-Migrate hat 2 Hauptaufgaben heute:
  1. **Stille Patches** für Code, der `$.browser` / `$.live()` / `.size()` / `.toggle(handler1, handler2)` nutzt
  2. **Console-Warnings**, die dir sagen wo solcher Code ist — paradoxerweise nützlicher als die Patches selbst
- Wenn dein Theme seit 2020 nicht mehr geupdatet wurde: Migrate raus ist nur das zweitgrößte Problem
- Wenn dein Theme aktiv gepflegt ist: Migrate raus ist meist No-op

### Sektion 4 — **Frontend-only vs. Plugin-Total-Off** (USP-Sektion 2)
- Plugin „Disable jQuery Migrate" — entfernt Migrate überall, auch Admin
- Perfmatters — Pauschal-Toggle, ohne Admin/Frontend-Unterscheidung
- WP Rocket — keine eigene Migrate-Option, nutzt Plugin-Hooks
- **Snippet aus der Library:** Frontend raus, Admin bleibt. Warum?
  - Im Admin nutzen einige Gutenberg-Blöcke + Builder-Admin-UIs (Elementor-Editor, älterer Divi-Builder) noch jQuery-1.x-Patterns
  - Im Frontend ist Migrate seit Jahren toter Ballast
  - Surgical statt Pauschal = kompatibler

### Sektion 5 — Schicht 1: das Snippet aus der Smart-Fix-Library
- Kurz-Auszug der Filter-Logik inline (max. 6 Zeilen):
```php
add_action( 'wp_default_scripts', function( $scripts ) {
    if ( is_admin() ) return;
    if ( ! empty( $scripts->registered['jquery'] ) ) {
        $scripts->registered['jquery']->deps = array_diff(
            (array) $scripts->registered['jquery']->deps,
            array( 'jquery-migrate' )
        );
    }
}, 1, 1 );
```
- Verlinkung zum Library-Snippet mit Anchor: **„jQuery-Migrate-Drossel-Code im Lab"**
- Auto-Safety-Check: erkennt aktive Plugin-Versionen und macht No-op
- Optionaler zweiter Filter (`script_loader_tag`) räumt nachgelagerten Migrate-Output auf

### Sektion 6 — Verifizieren
- **Browser-Console:** keine JQMIGRATE-Meldung mehr
- **DevTools Network-Tab:** jquery-migrate.min.js fehlt im Frontend, ist im Admin weiter sichtbar
- **Lighthouse-Re-Audit:** Score-Bewegung +2 bis +5 mobile, „Reduce unused JavaScript" verliert den Migrate-Eintrag
- **curl-Test:** `curl -s https://deine-site.de | grep -c jquery-migrate` → 0

### Sektion 7 — Wann Migrate BEHALTEN — die drei Ausnahmen
1. **Theme von vor 2020 ohne Update-Plan** — Migrate ist das Pflaster, nicht das Problem
2. **Custom-Code mit `$.browser` / `$.live()` / `.size()`** — Audit nötig, vorher fixen
3. **Alte Page-Builder-Versionen (Visual Composer < 6, Themify < 5)** — Builder-Admin bricht ohne Migrate

### Sektion 8 — Erweiterte Strategie für Agenturen
| Kennzahl | Ohne Schnitt | Mit Frontend-Removal |
|---|---|---|
| Kunden-Sites (ø Theme nach 2020) | 30 | 30 |
| Frontend-JS-Transfer / Page-Load | 30 KB unminified | 19 KB |
| Lighthouse-Score-Median | 78 mobile | 82 mobile |
| Console-Warnings im SEO-Audit | 30 sites × ja | 30 sites × nein |
- Rollout via MU-Plugin (One-Click Optimizer)
- Monitoring über Agency-Konsole

### Sektion 9 — Weiterführend
Drei interne Links mit **diversifizierten Anchor-Texten** (KEINE Wiederholung aus Heartbeat/XML-RPC):

- [Elementor & Divi ohne Speed-Verlust](/blog/elementor-divi-ohne-speed-verlust) — Anchor: „Wenn Migrate raus ist: die nächsten Builder-Hebel"
- [WordPress Heartbeat drosseln](/blog/wordpress-heartbeat-drosseln) — Anchor: „Nach Frontend-JS die admin-ajax-Last reduzieren"
- [Smart-Fix-Library](/smart-fix-library) — Anchor: „Alle 5 Snippets im Performance-Lab"

### Sektion 10 — FAQ (für UI, kein FAQ-Schema)
1. „Was ist jQuery-Migrate in WordPress?"
2. „Brauche ich jQuery-Migrate 2026 überhaupt noch?"
3. „Was passiert wenn ich Migrate komplett entferne (auch im Admin)?"
4. „Warum entfernt das Snippet Migrate nur im Frontend?"
5. „Kollidiert das mit Disable jQuery Migrate Plugin oder Perfmatters?"
6. „Wie sehe ich, ob mein Theme noch Migrate braucht?"
7. „Verbessert das Lighthouse messbar?"

---

## 5. Anchor-Text-Diversity-Plan (Update)

Anchor-Pool aus XML-RPC-Outline §5, hier der jQuery-Migrate-Eintrag:

| Genutzt in | Anchor-Text |
|------------|-------------|
| jQuery-Migrate-Post #1 (dieser) | „jQuery-Migrate-Drossel-Code im Lab" |
| (reserviert für späteren Cluster) | „Frontend-only Migrate-Removal als Code-Snippet" |
| (reserviert) | „Surgical jQuery-Migrate-Snippet inkl. Admin-Fallback" |

---

## 6. Library-Update nach Veröffentlichung

In `src/lib/smartfix-snippets.ts` beim Snippet `jquery-migrate-drosseln`:
```ts
blogPost: {
  slug:       "jquery-migrate-wordpress-entfernen",
  anchorText: "Frontend-only vs. Plugin-Total-Off — der Unterschied im Detail",
},
```

Auto-Render in `SmartFixCard` greift automatisch.

---

## 7. Thumbnail-Briefing

**Dateiname:** `/blog/jquery-migrate-frontend.webp`

**Komposition:** Split-Screen:
- Links: Browser-Frontend-Mockup, jquery-migrate.min.js durchgestrichen, grüner Häkchen
- Rechts: WP-Admin-Mockup, Gutenberg-Editor sichtbar, jquery-migrate.min.js weiterhin geladen
- Verbindendes Element: ein „surgical scalpel"-Icon dazwischen — symbolisiert chirurgische Entfernung

Stilistisch passend zu Heartbeat + XML-RPC (dunkler Hintergrund, Lighthouse-Grün-Akzent `#4ade80`, Glas-Cards-Ästhetik).

Code-Akzent: `array_diff( ..., array('jquery-migrate') )` in Mono-Font.

---

## 8. Sprint-Reihenfolge nach jQuery-Migrate

| # | Slug | Snippet-Match | Erwartete SERP-Schwäche |
|---|------|---------------|-------------------------|
| 4 | `wordpress-emojis-embeds-deaktivieren` | emojis-embeds-bloat-remove | Hoch — wpbeginner-DE rankt thin |
| 5 | `query-strings-wordpress-entfernen` | query-string-cleaner | Mittel — Plugin-Listings dominieren |

---

## 9. Monitoring nach Veröffentlichung

- GSC: Query-Filter „jquery migrate" — Impressionen 14/30/60 Tage
- Lighthouse-Score-Median im Pro-Dashboard: Vergleich aller Sites die Snippet appliziert haben
- Library-Outbound-Click-Rate auf dem Snippet — Ziel > 5 %
