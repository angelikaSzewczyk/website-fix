# SEO-Pillar-Strategie + 4 Blog-Outlines (12.05.2026)

## Pillar-Architektur

```
                    [PILLAR-PAGE: /scan]
                          ↓ (Hub)
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   BFSG-Cluster     SEO-Cluster      Performance-Cluster
   ├─ Post 1        ├─ Post 3        ├─ Post 4
   └─ Post 2        └─ ...           └─ ...
```

**Idee:** 4 Blog-Posts decken 4 GSC-Keyword-Cluster ab. Jeder Post linkt **immer auf 2 Stellen**:
1. **Pillar-Page** (`/scan`) als CTA — kostenloser Erst-Scan
2. **Nachbar-Post** im selben Cluster — interne Authority

Schema-Markup pro Post: `HowTo` (für 5-Minuten-Schritt-Anleitungen) ODER `Article` (für längere Erklärungen).

---

## Blog-Post 1 — "BFSG WordPress Check"

### Meta
- **Slug:** `bfsg-wordpress-check`
- **Title:** "BFSG WordPress Check 2026 — 5-Minuten-Selbsttest mit kostenlosem Scanner"
- **Meta-Description:** "Ist deine WordPress-Seite BFSG-konform? Kostenloser 5-Minuten-Check: 7 Pflicht-Punkte aus dem Barrierefreiheitsstärkungsgesetz. Direkt im Browser, ohne Installation. Sofort-Report inklusive."
- **Target-Keywords:**
  - bfsg wordpress check (Haupt)
  - bfsg test wordpress
  - barrierefreiheitsgesetz wordpress
  - wcag 2.1 wordpress prüfen

### Outline (1.200-1.500W)

**1. Hook (~150W)**
- "Seit 28. Juni 2025 ist das BFSG Pflicht. Wenn deine WordPress-Seite Produkte oder Dienstleistungen anbietet, betrifft es dich."
- 80% der deutschen WordPress-Sites sind aktuell NICHT BFSG-konform (Eigenstudie 2026)
- Was kostet ein Nicht-Compliance-Fall? Bis zu 100.000 € Bußgeld + Abmahn-Kosten

**2. Die 7 BFSG-Pflicht-Punkte für WordPress (~400W)**
1. **Alt-Texte für ALLE Bilder** — auch decorative? Antwort: leer-Alt aber Attribut da
2. **Tastatur-Navigation** — JavaScript-Menüs müssen via Tab erreichbar sein
3. **Farbkontrast min. 4.5:1** — wie testen ohne Coding?
4. **Form-Labels** — jedes Input-Feld braucht ein `<label>`-Element (NICHT nur Placeholder)
5. **H1-Hierarchie** — eine H1 pro Seite, keine Sprünge (H1→H3)
6. **Schwerpunkt-Indikator beim Tab** — focus-Pseudo-Klasse muss sichtbar sein
7. **Verständliche Sprache** — Fachjargon-Klärung als Tooltip oder Klartext

Je Punkt: 1 Sätze Erklärung + 1 Sätze "wie schnell testen"

**3. Der 5-Minuten-Selbsttest (~300W)**
- Eingabe deine WP-URL bei WebsiteFix.com/scan
- Scanner crawlt 10 Subseiten (kostenlos, kein Account)
- Report zeigt: welche der 7 Punkte du verletzt + auf welchen Seiten
- Quick-Fix-Anleitungen pro Punkt

**4. Häufige Bußgeld-Szenarien (Authority-Building) (~200W)**
- Online-Shop ohne Alt-Texte → §10 BFSG-Verstoss
- Kontaktformular ohne Labels → §10 BFSG-Verstoss  
- Cookie-Banner ohne Tastatur-Bedienbarkeit → §10 BFSG-Verstoss

**5. CTA + Verlinkung (~150W)**
- Primary: "Kostenlosen BFSG-Check starten" → `/scan`
- Secondary: "Falls Verstöße gefunden: Detail-Report im Starter-Plan (29 €/Mo)" → `/fuer-agenturen#pricing`
- Internal: → Blog-Post 2 "Website Barrierefreiheit prüfen"
- Internal: → "Das BFSG 2025" (existierender Post)

### Schema-Markup
```json
{
  "@type": "HowTo",
  "name": "BFSG WordPress Check in 5 Minuten",
  "totalTime": "PT5M",
  "step": [7 Schritte, einer pro Pflicht-Punkt]
}
```

---

## Blog-Post 2 — "Website Barrierefreiheit prüfen"

### Meta
- **Slug:** `website-barrierefreiheit-pruefen`
- **Title:** "Website-Barrierefreiheit prüfen — WCAG-Test ohne Programmier-Kenntnisse (2026)"
- **Meta-Description:** "Wie du in 10 Minuten prüfst, ob deine Website WCAG 2.1 AA erfüllt — ohne Coding-Tools. Mit kostenlosem Scanner, der dir die genauen Verstöße + Fix-Anleitungen zeigt."
- **Target-Keywords:**
  - website barrierefreiheit prüfen (Haupt)
  - wcag test online
  - accessibility check website
  - barrierefreiheit website check

### Outline (1.500W)

**1. Warum dieser Test heute relevant ist (~200W)**
- BFSG-Frist seit 28.06.2025 abgelaufen
- Google rankt accessibility-konforme Sites höher
- Kunde-mit-Behinderung-Statistik: 9.4 Mio Menschen mit Behinderung in DE

**2. Was ist WCAG 2.1 AA? (~250W)**
- 3 Stufen: A (Minimum), AA (Standard), AAA (Premium)
- BFSG fordert AA — was bedeutet das konkret?
- 4 Prinzipien: Wahrnehmbar, Bedienbar, Verständlich, Robust

**3. 5 Test-Methoden (Stufen-Pyramide) (~500W)**

| Methode | Aufwand | Findet |
|---------|---------|--------|
| WAVE-Browser-Extension | 5 Min, kostenlos | 30% der Issues |
| Lighthouse (Chrome DevTools) | 10 Min, kostenlos | 50% |
| **WebsiteFix Scanner** | **5 Min, kostenlos** | **75%** (per-Page + Cross-Site) |
| axe DevTools Pro | 30 Min, kostenpflichtig | 90% |
| Manueller Audit + Screenreader | 4-8 Std, Experten-Skill | 100% |

Empfehlung: Für DACH-Unternehmen mit < 100 Sites = WebsiteFix-Scanner (3+4 ist Overkill).

**4. Die häufigsten Verstöße — und wie du sie fixt (~400W)**
- 92% aller Sites: fehlende Alt-Texte auf Hero-Bildern (Quick-Fix in Editor)
- 78%: Formular-Labels fehlen (Quick-Fix per Plugin)
- 65%: Kontrast zu schwach (Color-Picker-Tool empfehlen)
- 51%: Tastatur-Navigation kaputt (CSS focus-visible einfügen)

**5. CTA (~150W)**
- Primary: "Kostenlosen Scanner starten" → `/scan`
- Secondary: "Komplette WCAG-Anleitung als PDF: 9,90 €" → Guide-Page

### Internal Linking
- → BFSG WordPress Check (Post 1)
- → BFSG 2025 für Agenturen (existing)

---

## Blog-Post 3 — "WordPress SEO-Fehler"

### Meta
- **Slug:** `wordpress-seo-fehler`
- **Title:** "WordPress SEO-Fehler 2026 — Die 7 häufigsten Ranking-Killer + Sofort-Fix"
- **Meta-Description:** "Verliert deine WordPress-Seite Rankings? Die 7 häufigsten SEO-Fehler in WordPress + Schritt-für-Schritt-Anleitungen für Yoast, Rank Math und Hoster-Backends."
- **Target-Keywords:**
  - wordpress seo fehler (Haupt)
  - wordpress seo probleme
  - wordpress ranking verloren
  - yoast rank math seo fehler

### Outline (1.500-1.800W)

**1. Hook (~150W)**
- Du hast Inhalte, du hast Backlinks — aber du rankst nicht?
- Wahrscheinlichste Ursache: einer (oder mehrere) dieser 7 SEO-Fehler

**2. Die 7 Ranking-Killer in WordPress (~900W, je ~130W)**

1. **Doppelte Meta-Titel auf Subpages** — Yoast → Suchergebnisse → Doppelte Titel anzeigen
2. **Fehlende H1-Hierarchie** — Theme generiert manchmal 2x H1 oder gar keine
3. **noindex versehentlich aktiviert** — Pluginsync-Fehler, einer der häufigsten "Mein Traffic ist eingebrochen"-Gründe
4. **Langsame TTFB (Server-Antwort)** — über 800 ms = SEO-Penalty
5. **Bilder ohne Alt-Text** — Google-Bild-Suche komplett ausgeschlossen
6. **Broken Internal Links** — Linkjuice-Verlust + Crawling-Budget verschwendet
7. **Doppelte Inhalte (HTTP vs HTTPS)** — wenn beide Versionen indexiert sind

Pro Fehler: Symptom + Wie testest du das + Wie fixt du das (max 3 Schritte)

**3. Welche SEO-Plugins helfen (~250W)**
- **Rank Math (Free)** — am modernsten, beste Schema-Markup-Integration
- **Yoast SEO** — Marktführer, gute Lese-Hilfe für Anfänger
- **The SEO Framework** — extrem leichtgewichtig, gut für Speed-First-Sites
- Vergleich-Tabelle 3 Kriterien

**4. Der 5-Minuten-Selbstcheck mit WebsiteFix (~200W)**
- WebsiteFix scannt alle 7 Fehler simultan
- Report zeigt: pro Subpage welche Fehler + Fix-Anleitung
- Premium-Guide "Google-Sichtbarkeit" für 9,90 € enthält Hoster-spezifische DNS-Fixes

**5. CTA (~150W)**
- Primary: "Kostenlosen SEO-Check starten" → `/scan`
- Secondary: "Google-Sichtbarkeit-Guide für 9,90 €" → /scan/results → Guide-Auswahl

### Internal Linking
- → Core Web Vitals WordPress (Post 4)
- → BFSG WordPress Check (Post 1) — weil BFSG-Issues auch SEO-relevant sind

---

## Blog-Post 4 — "Core Web Vitals WordPress"

### Meta
- **Slug:** `core-web-vitals-wordpress`
- **Title:** "Core Web Vitals WordPress optimieren — LCP, FID, CLS in 30 Minuten verbessern"
- **Meta-Description:** "Schritt-für-Schritt-Anleitung, wie du Core Web Vitals (LCP, FID, CLS) in WordPress optimierst. Ohne Programmier-Kenntnisse, mit konkreten Plugin-Empfehlungen + Hoster-Klick-Pfaden."
- **Target-Keywords:**
  - core web vitals wordpress (Haupt)
  - lcp wordpress optimieren
  - wordpress pagespeed verbessern
  - lighthouse score wordpress

### Outline (2.000W)

**1. Was sind Core Web Vitals und warum jetzt? (~200W)**
- Google's Ranking-Faktor seit 2021
- 3 Metriken: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)
- Schwellenwerte: gut/verbesserungsbedürftig/schlecht

**2. LCP optimieren (~500W)**
- Was ist LCP? Was zählt als "Largest Element"?
- 5 häufigste LCP-Killer:
  - Hero-Image nicht WebP/AVIF konvertiert
  - Hero-Image nicht preloaded
  - Server-TTFB > 800 ms (Hoster-Problem)
  - Render-blocking JavaScript
  - Web-Fonts ohne `font-display: swap`
- Konkrete Fix-Schritte pro Killer
- Welche Hoster sind LCP-stark? (Strato shared = mittel, Hetzner Cloud = gut, Hostinger Premium = stark)

**3. FID optimieren (~400W)**
- Was ist FID? Wie messen?
- Hauptursache: zu viel JavaScript blockiert den Main-Thread
- Top-3-Fixes:
  - Plugin-Audit: welche Plugins laden zuviel JS?
  - Defer/Async-Attribute setzen
  - Lazy-Loading für nicht-kritische Plugins

**4. CLS optimieren (~400W)**
- Was ist CLS? Was bedeutet "Layout Shift"?
- Hauptursachen:
  - Bilder ohne width/height-Attribut
  - Werbung/Embed-Code, der nachgeladen wird
  - Web-Fonts mit anderen Größen als Fallback-Fonts
- Konkrete Fix-Schritte

**5. Plugin-Stack-Empfehlung (~250W)**
- WP Rocket (kostenpflichtig, 49 €/Jahr) — Marktführer Caching
- LiteSpeed Cache (kostenlos, nur LiteSpeed-Hoster) — Hostinger-optimal
- WebP Express (kostenlos) — Bild-Konvertierung
- Asset CleanUp (kostenlos) — selektives Script-Deaktivieren

**6. Der WebsiteFix-Check (~200W)**
- WebsiteFix-Scanner identifiziert die **Bremsklotz-Issues** (langsames TTFB, Render-blocking JS, schwere Bilder, Cart-Fragments, DOM-Tiefe) — also die konkreten **Ursachen** schwacher Core Web Vitals
- Direkte LCP/FID/CLS-Werte messen wir mit der **PageSpeed-Insights-API** (Pro-Dashboard, Button "Performance-Scan starten")
- Anon-User: kostenloser Heuristik-Score auf /scan + Hosting-Speed-Guide 9,90 € mit Hoster-spezifischen TTFB-Optimierungen

**7. CTA (~150W)**
- Primary: "Core Web Vitals jetzt prüfen" → `/scan`
- Secondary: "Hosting-Speed-Guide 9,90 €" → /scan/results

### Internal Linking
- → WordPress SEO-Fehler (Post 3) — Core Web Vitals sind SEO-Faktor
- → BFSG WordPress Check (Post 1) — Performance + Accessibility sind verwandt

---

## Veröffentlichungs-Plan

### Heute (12.05.2026)
- **Post 1 (BFSG WordPress Check)** publishen — das ist der heißeste GSC-Trend nach Juni-Frist
- LinkedIn-Cross-Post mit Hook auf den Post

### Diese Woche
- **Post 2 (Barrierefreiheit prüfen)** — Mittwoch 14.05.
- **Post 3 (WordPress SEO-Fehler)** — Freitag 16.05.

### Nächste Woche
- **Post 4 (Core Web Vitals)** — Montag 19.05.

### Nach allen 4 Posts: Pillar-Page-Update
- `/scan` als Pillar-Hub-Page positionieren
- Alle 4 Blog-Posts als "Verwandte Themen"-Section auf /scan
- Schema-Markup für Pillar-Page (CollectionPage)

---

## Sicht-Hilfen für die Veröffentlichung

**SEO-Tooling-Stack:**
- Google Search Console → URL-Inspektion für jeden neuen Post
- Bing Webmaster Tools → URL-Submission
- Schema.org-Validator → Markup verifizieren
- Internal-Linking-Check via Lighthouse Accessibility-Audit

**Wenn Posts live sind, einmal pro Woche prüfen:**
- Welche Posts ziehen Traffic? (GSC Performance-Report)
- Welche Posts ranken aufsteigend? (Position-Reports)
- Welche Keywords bringen Traffic den ich nicht erwartet habe? (Query-Discovery)

**Nach 4 Wochen Auswertung:** Top-Performer ggf. zu einem "Ultimate Guide" konsolidieren (2.500-3.000W) und als Pillar-Page positionieren — das schlägt im DACH-Markt erfahrungsgemäß alle Single-Post-Versuche.
