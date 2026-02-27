---
title: "Google findet deine Website nicht? 11 Gründe + Fixes (Indexierung, Sitemap, Canonical)"
description: "Deine Seite taucht nicht bei Google auf? Die häufigsten Ursachen: Noindex, Canonical, Sitemap, robots.txt, Weiterleitungen – plus Quick-Wins ohne Relaunch."
date: "2026-02-18"
category: "SEO Basics"
tags: ["google", "indexierung", "search console", "sitemap", "noindex"]
status: "published"
---

Wenn deine Website **nicht in Google auftaucht**, ist das fast immer ein technisches Detail – kein „SEO-Problem“.  
Mit diesen Checks findest du die Ursache oft in **10–30 Minuten**.

## Schnellcheck (5 Minuten)
- Suche bei Google: `site:deinedomain.de`
- Öffne die Google Search Console → **Indexierung** → „Seiten“
- Prüfe: gibt es eine **Sitemap**? (z. B. `/sitemap.xml`)

## 1) Seite ist auf „noindex“ gesetzt (Klassiker)
**Quick-Win**
- Meta-Tag prüfen: `noindex`
- In WordPress: „Suchmaschinen davon abhalten“ deaktivieren

## 2) robots.txt blockiert Google
**Quick-Win**
- `https://deinedomain.de/robots.txt` öffnen
- Achte auf `Disallow: /` oder blockierte Pfade

## 3) Canonical zeigt auf die falsche URL
Google indexiert dann ggf. eine andere Version oder gar keine.

**Quick-Win**
- Canonical prüfen (Quellcode / SEO-Plugin)
- Bei http/https oder www/non-www: konsistent machen

## 4) Sitemap fehlt oder ist kaputt
**Quick-Win**
- `/sitemap.xml` testen
- In Search Console einreichen

## 5) Weiterleitungen / Redirect-Ketten
**Quick-Win**
- Seite lädt mehrfach um? (http→https→www→…)
- Ziel-URL sauber auf 1 finale Version bringen

## 6) „Duplikate“ durch Parameter / Tracking
**Quick-Win**
- Parameter reduzieren
- Canonical sauber setzen

## 7) 404 / Soft-404 Seiten im Index
**Quick-Win**
- 404 Seiten prüfen und reparieren
- Soft-404: Content verbessern oder korrekt 404/410 liefern

## 8) Seite ist technisch „zu leer“ (Thin Content)
**Quick-Win**
- Mindestens: klare Headline, Text, Nutzen, CTA
- Kein „nur Hero + Bild“

## 9) JavaScript Rendering-Probleme
**Quick-Win**
- Falls SPA/JS-heavy: prerender/SSR prüfen
- Wichtige Inhalte nicht nur via JS nachladen

## 10) Domain/Property falsch eingerichtet
**Quick-Win**
- In Search Console: richtige Property (Domain vs URL Prefix)
- Verifizierung korrekt?

## 11) Zu neu: Google braucht einfach Zeit
**Quick-Win**
- 2–4 Wochen sind normal
- Weiter Inhalte veröffentlichen + interne Links setzen

## Wann lohnt sich ein Fix?
Wenn du willst, dass Google deine Seite **sauber erfasst** und du wieder sichtbar wirst:

👉 **Fix #4 – Tracking & Analytics einrichten**  
(inkl. Basis-Daten & saubere Messbarkeit für SEO/Conversion)  
[Zum Fix auswählen](/#fixes)

## FAQ
**Wie lange dauert es, bis Google indexiert?**  
Neue Seiten: oft Tage bis Wochen. Mit sauberer Sitemap meist schneller.

**Kann ich Indexierung „erzwingen“?**  
Du kannst sie anstoßen (URL-Prüfung), aber technische Sperren müssen zuerst weg.
