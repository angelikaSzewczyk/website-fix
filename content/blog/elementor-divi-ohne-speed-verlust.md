---
title: "Elementor & Divi ohne Speed-Verlust: Das Geheimnis sauberer Page-Builder-Seiten."
description: "Page-Builder lieben und gleichzeitig Top-Google-Werte? Die 8 Hebel, mit denen Elementor- und Divi-Profis 2026 PageSpeed > 90 erreichen — ohne den Builder aufzugeben."
date: "2026-04-26"
category: "performance"
tags:
  - "Elementor SEO Einstellungen"
  - "Divi Geschwindigkeit optimieren"
  - "WordPress Page Builder Performance Guide"
  - "DOM-Tiefe reduzieren"
  - "elementor container"
  - "divi performance"
  - "page builder seo"
  - "core web vitals wordpress"
status: "published"
thumbnail: "/blog/builder-friede.webp"
ogImage: "/blog/builder-friede.webp"
faq:
  - q: "Sind Elementor und Divi wirklich schlecht für SEO?"
    a: "Nicht per se — aber falsch konfiguriert ja. Out-of-the-box erzeugen beide Builder DOM-Tiefen von 22–28 Ebenen (Google empfiehlt max. 15) und laden ihre kompletten Stylesheets auf jeder Seite. Mit den richtigen Settings (Elementor-Container, Divi Dynamic CSS, Asset CleanUp) kommen beide Builder problemlos auf PageSpeed > 85 Mobile."
  - q: "Lohnt sich der Wechsel von Elementor zu Container-Layout?"
    a: "Ja, fast immer. Container reduzieren die DOM-Verschachtelung um typisch 40 %, verbessern den LCP um 1–2 Sekunden auf Mobile und sind seit Elementor 3.16 stable. Migration einer mittelgroßen Page (10 Sections) dauert 30–60 Minuten. Bei sehr großen Seiten (Custom-Themes mit Hooks): Schritt für Schritt, Section für Section migrieren — nicht alles gleichzeitig."
  - q: "Wie reduziere ich die DOM-Tiefe bei Divi?"
    a: "Drei Hebel: 1) 'Collapse Nested Rows' nutzen — fasst Sections mit nur einer Row zusammen. 2) Globale Module statt Custom-Inline-CSS verwenden. 3) Im Theme Customizer auf 'Plain Container' / 'Fluid Container' umstellen statt 'Boxed'. Plus: Divi 'Dynamic CSS' und 'Critical CSS' im Performance-Tab aktivieren — entfernt ungenutzte CSS-Regeln pro Seite."
  - q: "Welcher Page-Builder ist am schnellsten 2026?"
    a: "Mit Standard-Setup: Astra Pro Builder (basiert auf Gutenberg, sehr schlank). Mit Optimierung: Elementor mit Container-Layout fast gleichauf. Divi schneidet ohne Optimierung am schwächsten ab, mit Dynamic CSS aber konkurrenzfähig. WPBakery und Beaver Builder sind veraltet — meiden bei Neuprojekten."
  - q: "Brauche ich WP Rocket, wenn ich schon einen Page-Builder nutze?"
    a: "Ja — und es ist die wertvollste Investition. WP Rocket adressiert Page-Cache, Critical CSS und Lazy-Load — alles Bereiche, wo Page-Builder schwach sind. Alternative kostenlos: LiteSpeed Cache (nur bei LiteSpeed-Hostern). FlyingPress als Premium-Konkurrent zu WP Rocket — beide funktionieren mit Elementor und Divi tadellos."
  - q: "Wie messe ich, ob mein Builder zu viel DOM erzeugt?"
    a: "Browser-DevTools öffnen (F12) → Elements-Panel → tiefste verschachtelte Box anklicken → Pfad mitzählen (html > body > div > section > div > div > … ). Über 15 ist suboptimal, über 22 kritisch. Schneller: WebsiteFix-Scan — misst die DOM-Tiefe automatisch und gibt builder-spezifische Empfehlungen."
---

![Elementor und Divi ohne Speed-Verlust — Blueprint sauberer Page-Builder-Seiten](/blog/builder-friede.webp)

# Elementor & Divi ohne Speed-Verlust: Das Geheimnis sauberer Page-Builder-Seiten.

Du liebst Elementor. Oder Divi. Vielleicht beides. Und ehrlich gesagt — du hast gute Gründe dafür: Visual Builder, Live-Preview, riesige Template-Library, schnellere Kunden-Iterationen. **Kein Designer, der einmal mit einem guten Page-Builder gearbeitet hat, will zurück zu reinem HTML/CSS.**

Aber du kennst auch das Gefühl: Du baust eine optisch perfekte Seite, lieferst sie aus, und dann macht der Kunde einen PageSpeed-Insights-Test. Score: 42. Mobile: 28. *„Warum ist die Seite so langsam?"* — Stille im Meeting-Raum.

**Hier ist die gute Nachricht:** Du musst dich nicht entscheiden zwischen *„Builder nutzen"* und *„guter PageSpeed-Score"*. Du musst nur wissen, wo die Stellschrauben sind. Mit den richtigen 8 Einstellungen erreichen Elementor- und Divi-Seiten 2026 PageSpeed-Werte **> 90 auf Desktop und > 75 auf Mobile** — ohne den Builder aufzugeben.

Das ist kein Marketing-Versprechen. Das ist gemessene Realität — wenn du diese Anleitung Schritt für Schritt durchgehst.

> ### ⚡ Wo steht deine Builder-Seite gerade?
> Bevor du optimierst: Lass den Scanner messen, wo deine Elementor-/Divi-Seite gerade steht. Du bekommst sofort die Builder-Detection, DOM-Tiefe und konkrete Empfehlungen — ob Container-Migration sinnvoll ist, welche Plugins zu schwer sind, was zuerst fixen.
>
> 👉 **[Page-Builder-Audit in 60 Sekunden — Gratis-Scan →](/)**

---

## Warum Page-Builder eigentlich langsam sind (Ehrliche Diagnose)

Bevor wir an die Lösungen gehen — du solltest verstehen, **warum** dein Builder out-of-the-box langsam ist. Wenn du das Problem kennst, fixt du es nachhaltig.

### Problem 1: DOM-Verschachtelung explodiert

Eine simple "Über uns"-Seite, die in HTML 30 Zeilen Code hätte, wird in Elementor zu **800–1.200 verschachtelten `<div>`-Containern**. Jede Section hat einen Wrapper. Jede Column einen. Jede Inner-Section noch einen. Plus Widget-Wrapper. Plus Background-Overlay-Wrapper.

Das Ergebnis: **DOM-Tiefe von 22–28 Ebenen**. Google empfiehlt maximal 15.

**Was die Browser-Engine macht:**
- Bei jedem Layout-Reflow wird der gesamte Baum durchgegangen
- Bei tiefen Bäumen wird das exponentiell teurer
- Mobile-CPUs (mit weniger Power) brauchen 2–4 zusätzliche Sekunden

### Problem 2: Asset-Bloat auf jeder Seite

Standard-Setup von Elementor: Lädt das **komplette Elementor-CSS** (~180 KB) auf jeder Seite — auch auf Pages, wo nur 2 Widgets verwendet werden. Plus Font Awesome, plus eicons, plus Frontend-Bundle.

Bei Divi: Das `et-builder.css` wiegt unkomprimiert ~250 KB. Plus jQuery 3.6, plus Magnific Popup, plus Salvattore.

Auf jeder. Einzelnen. Seite.

### Problem 3: Render-Blocking JavaScript

Die meisten Builder-Themes laden ihr JavaScript synchron im `<head>`. Das blockiert das Rendering und drückt den **First Contentful Paint** um 800–1.500 ms.

Plus: Tracking-Scripts, Cookie-Banner, Custom-Animations — alle wollen vorne dabei sein.

### Problem 4: Bilder ohne Optimierung

Elementor und Divi haben native Lazy-Load — aber nicht für Background-Images. Und die meisten Designer laden Hero-Images als JPG mit 3–5 MB unkomprimiert hoch.

---

## Die 8 Hebel für saubere Page-Builder-Seiten

Hier ist die priorisierte Liste — sortiert nach Impact. Wenn du nur Zeit für 3 Hebel hast: 1, 2 und 6 sind die wichtigsten.

### Hebel 1: Container-Layout (Elementor)

**Impact:** Höchster — reduziert DOM-Tiefe um typisch 40 %.

Seit Elementor 3.16 (Mitte 2023) ist das **Flexbox-Container-System** stable. Es ersetzt die alte Section-Column-Inner-Section-Hierarchie durch flexible, schlanke Container.

**So aktivierst du es:**

1. WP-Admin → Elementor → Settings → Features
2. *„Flexbox Container"* auf **„Active"** stellen
3. Bei neuen Pages: nur noch Container nutzen (sind im Widget-Panel ganz oben)

**Bestehende Pages migrieren:**

1. Editor öffnen
2. Rechtsklick auf eine Section → *„Edit as Container"*
3. Section/Column wird automatisch zu Container konvertiert
4. Verschachtelte Inner-Sections händisch entfernen (oft nicht mehr nötig wegen Flex-Direction)

**Wichtig:** Backup vor der Migration. Container sind nicht 1:1 reversibel.

### Hebel 2: Asset CleanUp / Perfmatters (Beide Builder)

**Impact:** Hoch — spart 80–250 KB pro Seite.

Plugin installieren (entweder *Asset CleanUp Pro* oder *Perfmatters*). Das Tool scannt deine Seite und zeigt, welche CSS/JS-Files auf welcher Page geladen werden. Du deaktivierst dann gezielt:

- Elementor-Frontend-Bundle auf Pages, die kein Elementor nutzen
- Font Awesome auf Pages ohne fa-Icons
- WooCommerce-Scripts auf Nicht-Shop-Pages
- Contact Form 7 auf Pages ohne Formular

**Realer Impact:** Eine typische "Über uns"-Seite, die 8 Plugin-Stylesheets lädt, kann auf 2 reduziert werden. Spart 150–250 KB initial Page-Size.

### Hebel 3: WP Rocket — Page-Cache + Asset-Optimierung

**Impact:** Sehr hoch — 1.5–3 Sekunden Ladezeit-Verbesserung.

WP Rocket ist der Industriestandard, weil es alle Performance-Hebel in einem Plugin bündelt:

- Page-Cache (komplette HTML-Snapshots)
- CSS/JS-Minification + Combine
- Lazy-Load für Bilder + iframes
- **„Delay JavaScript Execution"** — verschiebt nicht-kritisches JS bis nach User-Interaction
- Preload für kritische Assets

**Setup:** 5 Minuten. Aktivieren der Standard-Settings reicht für 80 % der Seiten.

**Kostenlose Alternative:** *LiteSpeed Cache* (wenn du auf LiteSpeed-Hosting bist) oder *W3 Total Cache* (komplexerer Setup, aber umsonst).

### Hebel 4: Divi Dynamic CSS + Critical CSS

**Impact:** Hoch — spart 60–80 % des Divi-CSS pro Page.

In Divi: WP-Admin → Divi → Theme Options → **Performance**

Aktivieren:
- ✅ **Dynamic CSS** — generiert CSS nur für Module, die auf der Page tatsächlich genutzt werden
- ✅ **Critical CSS** — inline-CSS für Above-the-Fold, Rest async geladen
- ✅ **Defer jQuery & jQuery Migrate** — entlastet den Main-Thread
- ✅ **Improved Google Fonts Loading** — async statt blocking

Bei mittelgroßen Divi-Seiten reduziert das den Divi-CSS-Footprint von 250 KB auf 60–80 KB pro Page.

### Hebel 5: Bilder zu WebP/AVIF konvertieren

**Impact:** Hoch — verbessert LCP um 1–2 Sekunden.

Plugin: **ShortPixel** oder **Smush**.

- Bestehende Bilder bulk konvertieren (alle JPG/PNG → WebP)
- Lazy-Load für Background-Images aktivieren
- `width`- und `height`-Attribute an alle `<img>` (verhindert Layout-Shifts)
- Bei Hero-Images: `<link rel="preload">` im `<head>` setzen

**Mit ShortPixel:** Etwa 4 €/Monat für 5.000 Bilder. ROI in der Regel < 1 Monat.

### Hebel 6: DOM-Tiefe gezielt reduzieren

**Impact:** Hoch — direkter Effekt auf LCP, INP und PageSpeed-Score.

Wenn du Elementor nutzt und schon Container hast, ist die DOM-Tiefe meist okay. Bei Divi und alten Elementor-Layouts brauchst du gezieltes Refactoring:

**Elementor-Cleanup:**
- Container statt Section (siehe Hebel 1)
- Doppelte Wrapper entfernen (Section mit nur einer Column → Section direkt)
- Custom-Backgrounds: nicht für jede Box ein eigener Wrapper, sondern globale Container-Backgrounds

**Divi-Cleanup:**
- *„Collapse Nested Rows"* — Sections mit einer einzelnen Row zusammenfassen
- Im Customizer: *„Plain Container"* statt *„Boxed"*
- Zusatzklassen wie `.et_pb_text_inner`, `.et_pb_with_border` ohne visuellen Effekt entfernen

**Generell für beide:**
- CSS-Grid und Flexbox einsetzen, statt verschachtelte Rows nachzubilden
- Pre-Made Templates kritisch prüfen — viele sind über-engineered

### Hebel 7: Google Fonts lokal hosten

**Impact:** Mittel — spart einen DNS-Lookup + DSGVO-konform.

LG München (Az. 3 O 17493/20): Externe Google-Fonts ohne Einwilligung sind DSGVO-Verstoß. Plus: jeder externe Font-Request ist 100–200 ms Latenz.

**Plugin: OMGF | Host Google Fonts Locally**

Ein Klick → Google Fonts werden lokal kopiert → kein externer Request mehr.

**Bonus:** In Elementor Site-Settings unter Typography auch nicht zu viele Font-Familien laden. Best Practice: max. 2 (Heading + Body).

### Hebel 8: Render-Blocking JavaScript bändigen

**Impact:** Mittel — verbessert FCP und INP.

WP Rocket hat dafür ein eigenes Feature: **„Delay JavaScript Execution"**.

Aktivieren und alle nicht-kritischen Scripts in die Liste setzen:
- Tracking-Pixel (GA, Meta, TikTok, Pinterest)
- Cookie-Banner-Scripts (außer der Banner selbst)
- Chat-Widgets
- Heatmap-Tools (Hotjar, Microsoft Clarity)

Diese laden erst **nach** User-Interaction → verbessert FCP dramatisch.

> ### 🎯 Welche dieser 8 Hebel ziehen bei dir den größten Effekt?
> Lass den Scanner messen, was bei deiner Seite gerade aktiv ist und was nicht. Du bekommst eine priorisierte Liste — kein Rätselraten.
>
> 👉 **[Builder-Performance-Audit — Gratis-Scan starten →](/)**

---

## Builder-Vergleich 2026: Was bringt welcher Builder?

| Builder | DOM-Tiefe Default | DOM-Tiefe optimiert | PageSpeed Mobile (mit allen Hebeln) | Empfehlung |
|---|---|---|---|---|
| **Elementor + Container** | 12–15 | 10–12 | 80–92 | ✅ Top-Wahl 2026 |
| **Astra Pro Builder** | 8–12 | 6–10 | 88–95 | ✅ Schlankste Option |
| **Divi + Dynamic CSS** | 18–22 | 14–18 | 75–85 | ✅ Mit Tuning gut |
| **Elementor (alt, ohne Container)** | 22–26 | 16–20 | 65–78 | ⚠️ Migration nötig |
| **WPBakery** | 24–30 | 20–25 | 50–65 | ❌ Bei Neuprojekten meiden |
| **Beaver Builder** | 18–22 | 14–18 | 70–80 | ⚠️ Veraltet, aber okay |

---

## Der typische Workflow für eine optimierte Page-Builder-Seite

So gehst du bei einer neuen Kunden-Seite vor:

1. **Hosting-Check** — PHP 8.2+, Object-Cache verfügbar?
2. **Theme-Wahl** — Astra (für maximale Performance) oder Hello Elementor (Builder-spezifisch)
3. **Builder konfigurieren** — Container in Elementor, Dynamic CSS in Divi
4. **Performance-Plugin** — WP Rocket installieren, Standard-Settings aktivieren
5. **Asset CleanUp** — pro Page-Typ Plugins selektiv deaktivieren
6. **Bilder-Pipeline** — ShortPixel mit Auto-Optimize-on-Upload
7. **Google Fonts lokal** — OMGF aktivieren
8. **Test mit PageSpeed Insights** — Mobile + Desktop, Werte dokumentieren

**Realistisches Ziel für eine optimierte Page-Builder-Seite 2026:**
- PageSpeed Mobile: **> 75**
- PageSpeed Desktop: **> 90**
- LCP: **< 2.5 s**
- CLS: **< 0.1**
- INP: **< 200 ms**

Das ist absolut machbar — auch mit Elementor oder Divi. Nicht trotz, sondern mit dem Builder.

---

## Warum WebsiteFix dir hier 5 Stunden Arbeit spart

Diese 8 Hebel manuell durchzugehen — Plugin für Plugin, Setting für Setting, Page für Page — ist Detektivarbeit. Du musst:

- DOM-Tiefe in jedem Browser-DevTool zählen
- PageSpeed Insights für **jede** Page einzeln durchprüfen
- Im Network-Tab analysieren, welche Assets blockieren
- Asset-CleanUp-Settings pro Page-Type austüfteln
- Plugin-Dependencies durchspielen

Das sind **3–5 Stunden** für eine vollständige Builder-Diagnose. Mit WebsiteFix:

- ✅ **Builder-Detection** (Elementor / Divi / Astra) automatisch
- ✅ **DOM-Tiefe gemessen** mit konkreter Empfehlung *„Container-Migration spart 8 Ebenen"*
- ✅ **Plugin-Impact-Score** — Top 3 Plugins, die deine Seite am stärksten bremsen
- ✅ **Google Fonts erkannt** mit DSGVO-Hinweis
- ✅ **Cart-Fragments-Check** für WooCommerce + Builder-Kombi
- ✅ **Optimierungs-Plan PDF** — fertige Maßnahmenliste, die du an dein Team weitergibst

Und das Ganze in **60 Sekunden**.

> ### 🚀 Bereit für saubere Builder-Performance?
> Starte den Audit. Du bekommst sofort die Builder-Detection, alle Hebel-Empfehlungen und die DOM-Tiefe.
>
> 👉 **[WordPress Page Builder Performance Guide — Jetzt Gratis-Scan →](/)**

---

## Fazit: Page-Builder sind kein SEO-Killer — falsche Konfiguration ist es

Wenn du diesen Beitrag bis hier gelesen hast, hast du jetzt das, was die meisten Designer und Agenturen nie hatten: **Klarheit.**

Elementor ist nicht das Problem. Divi ist nicht das Problem. Das Problem ist immer dasselbe — Out-of-the-Box-Defaults, die für Marketing optimiert sind, nicht für Performance. Sobald du die 8 Hebel kennst, hast du beide Welten:

- **Designer-Komfort:** Visual Builder, schnelle Iterationen, Template-Library
- **SEO-Performance:** PageSpeed > 85, saubere DOM-Tiefe, Top Core Web Vitals

Die Reihenfolge ist wichtig:

1. Container-Migration (Elementor) bzw. Dynamic CSS (Divi) — größter DOM-Hebel
2. WP Rocket installieren — größter Caching-Hebel
3. Asset CleanUp — ungenutzte Plugins selektiv deaktivieren
4. Bilder zu WebP — größter LCP-Hebel
5. Google Fonts lokal + Render-Blocking JS bändigen

Wer diese fünf Schritte konsequent durchgeht, kommt auf **PageSpeed > 80 Mobile** — und das mit Elementor oder Divi.

> ### Bereit, deine Builder-Seite auf Top-Performance zu bringen?
> 60 Sekunden Audit, kein Account, sofortige Diagnose mit builder-spezifischen Empfehlungen.
>
> 👉 **[Jetzt scannen — DOM-Tiefe und alle Hebel messen →](/)**

---

## FAQ: Page-Builder Performance

### Sind Elementor und Divi wirklich schlecht für SEO?

Nicht per se — aber falsch konfiguriert ja. Out-of-the-box erzeugen beide Builder DOM-Tiefen von 22–28 Ebenen (Google empfiehlt max. 15) und laden ihre kompletten Stylesheets auf jeder Seite. Mit den richtigen Settings (Elementor-Container, Divi Dynamic CSS, Asset CleanUp) kommen beide Builder problemlos auf PageSpeed > 85 Mobile.

### Lohnt sich der Wechsel von Elementor zu Container-Layout?

Ja, fast immer. Container reduzieren die DOM-Verschachtelung um typisch 40 %, verbessern den LCP um 1–2 Sekunden auf Mobile und sind seit Elementor 3.16 stable. Migration einer mittelgroßen Page (10 Sections) dauert 30–60 Minuten. Bei sehr großen Seiten (Custom-Themes mit Hooks): Schritt für Schritt, Section für Section migrieren — nicht alles gleichzeitig.

### Wie reduziere ich die DOM-Tiefe bei Divi?

Drei Hebel: 1) *„Collapse Nested Rows"* nutzen — fasst Sections mit nur einer Row zusammen. 2) Globale Module statt Custom-Inline-CSS verwenden. 3) Im Theme Customizer auf *„Plain Container"* / *„Fluid Container"* umstellen statt *„Boxed"*. Plus: Divi *„Dynamic CSS"* und *„Critical CSS"* im Performance-Tab aktivieren — entfernt ungenutzte CSS-Regeln pro Seite.

### Welcher Page-Builder ist am schnellsten 2026?

Mit Standard-Setup: Astra Pro Builder (basiert auf Gutenberg, sehr schlank). Mit Optimierung: Elementor mit Container-Layout fast gleichauf. Divi schneidet ohne Optimierung am schwächsten ab, mit Dynamic CSS aber konkurrenzfähig. WPBakery und Beaver Builder sind veraltet — meiden bei Neuprojekten.

### Brauche ich WP Rocket, wenn ich schon einen Page-Builder nutze?

Ja — und es ist die wertvollste Investition. WP Rocket adressiert Page-Cache, Critical CSS und Lazy-Load — alles Bereiche, wo Page-Builder schwach sind. Alternative kostenlos: LiteSpeed Cache (nur bei LiteSpeed-Hostern). FlyingPress als Premium-Konkurrent zu WP Rocket — beide funktionieren mit Elementor und Divi tadellos.

### Wie messe ich, ob mein Builder zu viel DOM erzeugt?

Browser-DevTools öffnen (F12) → Elements-Panel → tiefste verschachtelte Box anklicken → Pfad mitzählen (`html > body > div > section > div > div > …`). Über 15 ist suboptimal, über 22 kritisch. Schneller: WebsiteFix-Scan — misst die DOM-Tiefe automatisch und gibt builder-spezifische Empfehlungen.

---

**Bereit, deine Builder-Seite zu zähmen?**

👉 **[Elementor SEO Einstellungen prüfen — Jetzt Gratis-Scan →](/)**
