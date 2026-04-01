---
title: "WordPress zeigt nur eine weiße Seite? (White Screen of Death lösen)"
description: "Wenn deine Website plötzlich weiß bleibt, liegt oft ein PHP-Fehler oder ein Plugin-Konflikt vor. So findest du die Ursache in 5 Minuten."
date: "2026-03-19"
category: "Technik"
tags: ["wordpress fehler", "weiße seite", "wsod", "php error", "website kaputt"]
status: "draft"
---

„Ich wollte mich einloggen, aber die Seite ist komplett weiß.“

Der **White Screen of Death (WSOD)** ist einer der häufigsten WordPress-Fehler. Er ist frustrierend, weil keine Fehlermeldung angezeigt wird – nur gähnende Leere.

## Typische Symptome
- Weder Frontend noch Backend (Admin-Bereich) laden
- Nur eine komplett weiße Fläche im Browser
- Keine Fehlermeldung sichtbar

## 1) Plugin-Konflikt prüfen
**Problem:** Ein Update oder ein neues Plugin verträgt sich nicht mit deinem Theme.
**Fix:** Deaktiviere alle Plugins via FTP (Ordner umbenennen), um zu sehen, ob die Seite wieder lädt.

## 2) Das Theme als Ursache
**Problem:** Ein Fehler im Code deines Themes blockiert die gesamte Seite.
**Fix:** Aktiviere kurzzeitig ein Standard-Theme wie "Twenty Twenty-Four".

## 3) PHP-Memory-Limit erschöpft
**Problem:** Deine Website braucht mehr Arbeitsspeicher, als der Server erlaubt.
**Fix:** Das Limit in der `wp-config.php` erhöhen oder den Hoster kontaktieren.

## 4) Debug-Modus aktivieren
**Problem:** Du weißt nicht, welcher Code-Schnipsel schuld ist.
**Fix:** Aktiviere `WP_DEBUG`, um die echte Fehlermeldung im Browser zu sehen.

## Wann du Hilfe brauchst
Wenn du Angst hast, beim Editieren von Systemdateien noch mehr kaputt zu machen oder der Fehler nach 10 Minuten nicht weg ist.


👉 **WebsiteFix – schnelle Analyse und gezielte Fixes**  
[Zur Warteliste →](/#waitlist)

## FAQ
### Verliere ich meine Daten durch den Fehler?
In der Regel nicht. Meistens blockiert nur ein fehlerhafter Code den Zugriff auf die Datenbank.