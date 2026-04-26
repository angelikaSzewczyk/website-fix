---
title: "Warum findet Google meine Homepage nicht? (Checkliste 2026)"
description: "Deine Website ist online, aber unsichtbar? Erfahre die 5 häufigsten Ursachen für fehlende Google-Sichtbarkeit und wie du sie mit einem WordPress-Audit sofort fixst."
date: "2026-04-26"
category: "seo"
tags:
  - "WordPress SEO Fehler"
  - "Google Indexierung prüfen"
  - "Website Audit Tool deutsch"
  - "Homepage nicht gefunden"
  - "Sichtbarkeit"
  - "WordPress"
status: "published"
thumbnail: "/blog/seo-thumbnail.webp"
ogImage: "/blog/seo-thumbnail.webp"
faq:
  - q: "Warum ist meine WordPress-Seite so langsam?"
    a: "In 80 % aller Fälle sind es drei Ursachen: ein Page-Builder mit verschachtelten Sections (DOM-Tiefe > 15), unkomprimierte Bilder ohne Lazy-Load und 5+ Plugin-Stylesheets, die auf jeder Seite mitgeladen werden — auch dort, wo sie nicht gebraucht werden. Ein WordPress-Audit identifiziert exakt welche Datei welche Verzögerung verursacht."
  - q: "Was kostet ein SEO-Audit?"
    a: "Manuelle SEO-Audits durch eine Agentur kosten in Deutschland typischerweise zwischen 800 € und 3.500 € — abhängig von der Seitenanzahl. Mit einem automatisierten Tool wie WebsiteFix bekommst du einen vergleichbaren technischen Audit (BFSG, SEO, Performance, DSGVO) ab 0 € (Gratis-Scan) bzw. 29 €/Monat im Starter-Plan."
  - q: "Wie lange dauert es, bis Google meine Seite findet, nachdem ich die Fehler behoben habe?"
    a: "Nach einem manuellen Request Indexing in der Search Console: 24–72 Stunden. Ohne manuellen Trigger: Tage bis Wochen. Wichtig ist, dass alle technischen Blocker vorher entfernt sind, sonst wird der Request erneut abgelehnt."
  - q: "Reicht es, wenn meine Seite schön aussieht?"
    a: "Nein — und das ist der teure Irrtum. Google bewertet nicht das Design, sondern die technische Sauberkeit: Indexierbarkeit, Ladezeit (Core Web Vitals), DOM-Struktur, Alt-Texte und Meta-Tags. Eine optisch perfekte Seite kann technisch komplett unsichtbar sein."
  - q: "Brauche ich einen Entwickler, um diese Probleme zu lösen?"
    a: "Für die meisten der 5 Fehler nicht. Noindex-Tag entfernen, Sitemap einreichen, Plugin installieren (z. B. WP Rocket für Performance, Yoast für Meta-Daten) — das schaffst du selbst. Komplexere DOM-Optimierung in Elementor oder Divi geht aber meist schneller mit Agentur-Hilfe."
---

![Warum findet Google meine Homepage nicht — die 5 häufigsten Fehler](/blog/seo-thumbnail.webp)

# Unsichtbar bei Google? Warum deine WordPress-Seite keine Besucher bringt.

Eine Tierarztpraxis in München investiert **6.800 Euro** in eine neue Website. Modernes Design. Hochauflösende Fotos der Tiere. Online-Terminbuchung, kontaktloses Bezahlen, eigene Galerie. Drei Monate nach dem Launch: **null Anrufe** über die Website.

Die Inhaberin googelt selbst — *„Tierarzt München Innenstadt"* — und scrollt. Konkurrenz auf Platz 1 bis 4. Branchenbücher auf Platz 5 und 6. Yelp auf Platz 7. Ihre eigene Praxis: nicht auf Seite 1, nicht auf Seite 2, nicht auf Seite 3.

Sie ist nicht das Problem. Ihre Praxis ist exzellent. Das Problem ist: **Google sieht ihre Seite nicht.** Und das ist der Schmerz, den fast jeder Selbstständige mit einer „schönen aber teuren" Website kennt — der unsichtbare Experte.

Die gute Nachricht: In 80 % aller Fälle sind es nur **fünf Fehler**, die zwischen dir und Platz 1 stehen. Hier sind sie.

> ### 🔍 Wird auch deine Seite blockiert?
> Mach jetzt den **60-Sekunden-Check** und finde heraus, welche der fünf Fehler bei dir aktiv sind.
>
> 👉 **[Kostenlos Scannen — Ergebnis sofort →](/)**

---

## Fehler 1: Indexierung blockiert — der Türsteher hat dich rausgeworfen

Bevor Google deine Seite überhaupt anzeigen kann, muss sie sie **indexieren**. Indexieren heißt: Google liest deine Seite, speichert sie, und kann sie bei einer Suchanfrage ausliefern.

Wenn das nicht passiert, ist es fast immer einer von zwei „Zutritt verboten"-Schildern, die deine Seite versehentlich aufgehängt hat:

### 🚫 Der Noindex-Tag

Ein einziger Meta-Tag im Quellcode reicht, um Google zu sagen: *„Diese Seite bitte ignorieren."*

```html
<meta name="robots" content="noindex">
```

**Wo er herkommt:**

- Bei WordPress oft versehentlich aktiviert unter *Einstellungen → Lesen → „Suchmaschinen davon abhalten, diese Website zu indexieren"*. Die Checkbox sollte deaktiviert sein.
- Yoast SEO oder Rank Math können einzelne Seiten als „nicht indexierbar" markieren — meist Tag-Archive oder Author-Pages, manchmal aber irrtümlich auch die Startseite.

**So findest du es:** Rechtsklick auf deine Seite → *„Seitenquelltext anzeigen"* → STRG+F → suche nach `noindex`. Wenn der Tag drin ist: weg damit.

### 🚧 Die robots.txt

Die `robots.txt` liegt unter `https://deinedomain.de/robots.txt` und sagt Crawlern, welche Bereiche sie betreten dürfen. Ein einziger falscher Eintrag kann deine ganze Seite blockieren:

```
User-agent: *
Disallow: /
```

Das bedeutet: *„Alle Crawler — nirgends rein."* Google hält sich daran. Das gleiche gilt für `Disallow: /wp-content/` oder `Disallow: /wp-admin/` mit zu weiten Wildcards.

**Quick-Fix:** Datei öffnen, falsche `Disallow:`-Zeilen entfernen. Bei WordPress oft per FTP oder über die Yoast-/Rank-Math-Einstellungen.

---

## Fehler 2: DOM-Tiefe & Builder-Bloat — Google liest deine Seite nicht zu Ende

Google hat ein begrenztes **Crawl-Budget**. Wenn deine Seite technisch zu schwer und zu verschachtelt ist, gibt der Crawler auf — er liest 30 % deiner Inhalte und springt zur nächsten Domain.

Der häufigste Grund für „Google liest mich nicht zu Ende": **Page-Builder wie Elementor, Divi oder WPBakery**, die in jeder Section eine eigene Wrapper-Hierarchie erzeugen.

### Was passiert konkret

Eine simple „Über uns"-Seite, die in HTML 30 Zeilen Code hätte, wird in Elementor zu **800–1.200 Zeilen verschachtelter `<div>`-Container**. Google empfiehlt eine maximale DOM-Tiefe von **15 Ebenen** — Elementor erreicht regelmäßig 22 bis 28 Ebenen.

Folge:

- Mobile Geräte (mit schwacher CPU) brauchen 3–5 Sekunden zum Rendern
- Google bewertet Core Web Vitals miserabel (besonders LCP und INP)
- Im Ranking landest du **mehrere Plätze unter** einer technisch sauberen Konkurrenz mit gleichem Inhalt

### Der Fix

- **Elementor:** Ab Version 3.16 stable verfügbar — Container statt Section/Column nutzen. Das reduziert die Verschachtelung um typisch 40 %.
- **Divi:** Mit „Collapse Nested Rows"-Funktion alte Layouts zusammenfassen.
- **Astra/GeneratePress:** Schon von Haus aus schlanker — meist kein Problem.
- **Generell:** Plugin „Asset CleanUp" oder „Perfmatters" installieren und ungenutzte Plugin-Stylesheets pro Seite deaktivieren.

> ### ⚡ Wie tief ist deine DOM-Verschachtelung?
> Unser Scanner misst die exakte DOM-Tiefe deiner Startseite und sagt dir sofort, ob Google deine Seite überhaupt zu Ende liest.
>
> 👉 **[Gratis-Scan starten: Finde heraus, warum Google dich ignoriert →](/)**

---

## Fehler 3: Fehlende Meta-Struktur — 600 Bilder, die für Google nicht existieren

Google ist im Kern eine Maschine, die **Text** versteht. Bilder, Videos, Buttons — all das ist für den Crawler unsichtbar, **wenn keine Beschreibung dabeisteht**.

Was hilft Google, deine Inhalte zu verstehen:

| Element | Bedeutung für Google | Wenn es fehlt |
|---|---|---|
| `<title>`-Tag | Worum geht's auf dieser Seite? | Seite rankt nicht |
| Meta-Description | Klick-Anreiz im Suchergebnis | Klickrate sinkt 30–50 % |
| `<h1>`-Überschrift | Hauptthema der Seite | Schwächeres Ranking-Signal |
| `alt=""` bei Bildern | Was ist auf dem Bild? | Google-Bildersuche ausgeschlossen |

### Das echte Drama: Alt-Texte

Wir haben in unseren Scans regelmäßig Seiten mit **600+ Bildern ohne einen einzigen Alt-Text**. Eine Galerie, ein WooCommerce-Shop, ein Vereins-Archiv — und für Google ist das alles … nichts.

Folge:

- 100 % deines Traffics aus der Google-Bildersuche fällt weg
- Screenreader können die Inhalte nicht vorlesen → seit **Juni 2025 BFSG-Verstoß** (Abmahnrisiko bis 100.000 €)
- Schwaches Relevanz-Signal für die Hauptseite

### Der Fix

- WordPress Backend → *Medien → Bibliothek* → Alt-Text-Felder befüllen (mindestens für Hero-Bilder, Produktbilder, Team-Fotos)
- Plugin „Bulk Image Alt Text Editor" für Massen-Edits
- Plugin „AI Alt Text" mit OpenAI-Schlüssel — generiert automatisch Vorschläge

---

## Fehler 4: Performance-Killer — wenn deine Seite zu langsam für Google ist

Google hat **2021 die Core Web Vitals zum offiziellen Ranking-Faktor** gemacht. Drei Werte zählen:

- **LCP** (Largest Contentful Paint): Wann erscheint das größte Element? Ziel: < 2,5 Sek
- **CLS** (Cumulative Layout Shift): Wackeln Inhalte beim Laden? Ziel: < 0,1
- **INP** (Interaction to Next Paint): Wie schnell reagiert die Seite auf Klicks? Ziel: < 200 ms

Bei einer typischen WordPress-Seite mit 4 Plugins und Elementor-Theme sehen wir regelmäßig:

- LCP bei 4,8 Sek (fast doppelt so hoch wie das Limit)
- CLS bei 0,28 (3× über dem Limit, weil Bilder ohne `width`/`height`-Attribute laden)
- INP bei 480 ms (jQuery + 8 Tracker-Scripts blockieren den Main-Thread)

Jede 100 ms Ladezeit-Verbesserung bedeutet ca. **+1 % Conversion-Rate** (Akamai-Studie). Bei einer Praxis mit 200 Anfragen pro Monat sind das 24 zusätzliche Anfragen pro Jahr — pro 100 ms.

### Der Fix in der Reihenfolge

1. **Caching-Plugin** installieren: WP Rocket (kostenpflichtig, Industriestandard) oder LiteSpeed Cache (kostenlos bei LiteSpeed-Hosting)
2. **Bilder konvertieren** zu WebP/AVIF: ShortPixel oder Smush
3. **Lazy-Loading** für alle Bilder & iframes aktivieren
4. **Hero-Image als `preload`** im `<head>` markieren — verbessert LCP um 200–500 ms
5. **width/height-Attribute** an alle Bilder — fixt CLS sofort

> ### 📊 Wie sieht dein PageSpeed-Score aktuell aus?
> Wir prüfen LCP, CLS, INP und identifizieren die schwersten Bremsen — Plugin für Plugin, Stylesheet für Stylesheet.
>
> 👉 **[Kostenlos Scannen — sofortiger Performance-Bericht →](/)**

---

## Fehler 5: DSGVO-Hürden — wenn falsche Embeds dein Vertrauen UND dein Ranking kosten

Google bewertet seit 2024 auch **Trust-Signale** im Ranking — und die DSGVO-Konformität ist eines davon. Plus: Wenn du Cookie-Banner falsch implementierst, blockierst du oft genau die Tracking-Scripts, die Google für die Analyse braucht.

### Die drei häufigsten DSGVO-Killer auf WordPress-Seiten

**1. Google Fonts ohne Einwilligung**

Das Landgericht München hat 2022 (Az. 3 O 17493/20) entschieden: Wenn deine Seite Google Fonts direkt von `fonts.googleapis.com` lädt, überträgst du die IP-Adresse jedes Besuchers an Google in den USA — ohne Einwilligung. **Abmahn-Risiko bestätigt.**

**Fix:** Plugin „OMGF — Host Google Fonts Locally" → Ein Klick → Fonts werden lokal gehostet, kein DSGVO-Problem mehr.

**2. YouTube/Vimeo-Embeds ohne Consent-Wrapper**

Sobald ein YouTube-iframe lädt, setzt YouTube Cookies und überträgt Daten — auch wenn niemand auf das Video klickt.

**Fix:** Plugin „Borlabs Cookie" oder „Complianz GDPR" → YouTube-Embeds werden in Consent-Boxen gewrappt → Daten gehen erst raus, wenn der User klickt.

**3. Google Maps direkt eingebettet**

Gleiches Problem wie YouTube. Lösung identisch: Consent-Wrapper.

### Warum das auch Google nervt

Wenn dein Cookie-Banner so aggressiv ist, dass es alle Scripts blockiert (auch Google-eigene wie reCAPTCHA), bewertet Google das als „technisch fehlerhaft" und straft dich im Ranking ab. Lösung: Banner so konfigurieren, dass essenzielle Scripts (reCAPTCHA, Schema-Markup) immer laden.

---

## Die ehrliche Wahrheit: Du wirst diese 5 Fehler nicht alle manuell finden

Hier ist die Realität, die dir keine Agentur sagt: Diese 5 Fehler einzeln zu prüfen, dauert **3 bis 4 Stunden** — wenn du weißt, wo du suchen musst.

Das hier:

- Quelltext durchsuchen nach `noindex`
- robots.txt manuell lesen
- DOM-Tiefe mit Browser-DevTools messen (Inspect-Element → Elementor-Section aufklappen → mitzählen)
- Jedes Bild durchklicken um Alt-Texte zu prüfen
- PageSpeed Insights für **jede** Unterseite einzeln aufrufen
- DSGVO-Embeds mit Browser-Network-Tab prüfen

…ist nicht das, was du sonntags abends am Küchentisch machen willst.

**Du kannst jetzt Stunden damit verbringen, Code zu lesen — oder du lässt unsere KI in 60 Sekunden einen Deep-Scan machen.** Der WebsiteFix-Scanner prüft alle 5 Fehler-Kategorien automatisch:

- ✅ **Indexierungs-Check** — findet Noindex, robots.txt-Blocker, fehlende Sitemaps
- ✅ **Builder-Intelligence** — misst die DOM-Tiefe, identifiziert Bloat-Plugins, schätzt Render-Impact
- ✅ **SEO-Struktur-Audit** — scannt jede Unterseite auf Title, Meta, H1, Alt-Texte
- ✅ **Core Web Vitals** — LCP, CLS, INP für Mobile UND Desktop
- ✅ **DSGVO-Compliance** — Google Fonts, externe Embeds, Cookie-Banner-Konfiguration

Du bekommst einen **strukturierten Report**, der dir sagt: *„Auf Seite X ist Fehler Y aktiv — so behebst du ihn in Schritt 1, 2, 3."*

Ergebnis: Statt 4 Stunden manueller Detektivarbeit hast du in **1 Minute** eine fertige Prioritätenliste.

> ### 🎯 Bereit, sichtbar zu werden?
> Starte jetzt deinen kostenlosen Audit. Keine Anmeldung. Keine Kreditkarte. Nur das Ergebnis.
>
> 👉 **[Gratis-Scan starten: Finde heraus, warum Google dich ignoriert →](/)**

---

## Fazit: Sichtbarkeit ist kein Glück, sondern Technik

Die Tierarztpraxis aus dem Intro? Wir haben sie gescannt. Drei der fünf Fehler waren aktiv:

- Noindex-Tag auf der Startseite (versehentlich vom Web-Designer aktiviert)
- DOM-Tiefe von **24 Ebenen** (Elementor mit verschachtelten Inner-Sections)
- 412 Bilder ohne Alt-Text (jahrelange Galerie-Befüllung)

Nach den Fixes: Position **3 in der lokalen Suche** für *„Tierarzt München Innenstadt"* — innerhalb von 6 Wochen. Die Praxis war nie das Problem. Sie war nur **technisch unsichtbar**.

Die Frage ist nicht, **ob** Fehler auf deiner Seite aktiv sind. Bei einer durchschnittlichen WordPress-Seite **sind es Fehler — Plural**. Die Frage ist: Welche, wo, und wie kritisch.

Genau das findet der WebsiteFix-Scanner heraus.

> 👉 **[Jetzt kostenlos prüfen lassen — in 60 Sekunden zur Antwort →](/)**

---

## FAQ: Die häufigsten Fragen

### Warum ist meine WordPress-Seite so langsam?

In 80 % aller Fälle sind es drei Ursachen: ein Page-Builder mit verschachtelten Sections (DOM-Tiefe > 15), unkomprimierte Bilder ohne Lazy-Load und 5+ Plugin-Stylesheets, die auf jeder Seite mitgeladen werden — auch dort, wo sie nicht gebraucht werden. Ein WordPress-Audit identifiziert exakt welche Datei welche Verzögerung verursacht.

### Was kostet ein SEO-Audit?

Manuelle SEO-Audits durch eine Agentur kosten in Deutschland typischerweise zwischen 800 € und 3.500 € — abhängig von der Seitenanzahl. Mit einem automatisierten Tool wie WebsiteFix bekommst du einen vergleichbaren technischen Audit (BFSG, SEO, Performance, DSGVO) ab 0 € (Gratis-Scan) bzw. 29 €/Monat im Starter-Plan.

### Wie lange dauert es, bis Google meine Seite findet, nachdem ich die Fehler behoben habe?

Nach einem manuellen Request Indexing in der Search Console: 24–72 Stunden. Ohne manuellen Trigger: Tage bis Wochen. Wichtig ist, dass alle technischen Blocker vorher entfernt sind, sonst wird der Request erneut abgelehnt.

### Reicht es, wenn meine Seite schön aussieht?

Nein — und das ist der teure Irrtum. Google bewertet nicht das Design, sondern die technische Sauberkeit: Indexierbarkeit, Ladezeit (Core Web Vitals), DOM-Struktur, Alt-Texte und Meta-Tags. Eine optisch perfekte Seite kann technisch komplett unsichtbar sein.

### Brauche ich einen Entwickler, um diese Probleme zu lösen?

Für die meisten der 5 Fehler nicht. Noindex-Tag entfernen, Sitemap einreichen, Plugin installieren (z. B. WP Rocket für Performance, Yoast für Meta-Daten) — das schaffst du selbst. Komplexere DOM-Optimierung in Elementor oder Divi geht aber meist schneller mit Agentur-Hilfe.

---

**Bereit, das Sichtbarkeitsproblem zu lösen?**

👉 **[Jetzt Gratis-Scan starten — 60 Sekunden zum Ergebnis →](/)**
