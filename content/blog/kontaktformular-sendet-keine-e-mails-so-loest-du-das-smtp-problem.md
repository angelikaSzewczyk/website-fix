---
title: "Kontaktformular sendet keine E-Mails? So löst du das SMTP-Problem"
description: "Kunden schreiben dir, aber die Anfragen kommen nie an? Meist liegt es an fehlenden SMTP-Einstellungen oder Spam-Filtern."
date: "2026-03-16"
category: "compliance"
tags: ["kontaktformular", "email versand", "smtp", "wordpress", "anfragen kommen nicht an"]
status: "published"
---

„Ein Kunde sagte mir, er hätte geschrieben – aber ich habe nichts im Posteingang.“

Nichts ist teurer als ein **defektes Kontaktformular**. Es verbrennt Marketing-Budget und kostet dich echte Aufträge, ohne dass du es merkst.

## Woran es meistens liegt
1. **PHP Mail() Funktion:** Viele Server blockieren den Standard-Versand aus Sicherheitsgründen.
2. **Spam-Filter:** Deine E-Mails werden vom Empfänger-Server als unsicher eingestuft.
3. **Falsche Absender-Adresse:** Die E-Mail-Adresse im Formular existiert nicht wirklich.

## 1) SMTP statt PHP Mail nutzen
**Lösung:** Nutze einen echten E-Mail-Server (SMTP), um deine Formular-Daten zu senden. Das erhöht die Zustellrate auf fast 100%.

## 2) Logs prüfen
**Lösung:** Installiere ein Logging-Tool, um zu sehen, ob das Formular die Daten überhaupt verarbeitet hat.

## 3) ReCaptcha Konflikte
**Lösung:** Manchmal blockiert ein falsch konfiguriertes Google ReCaptcha den "Senden"-Button komplett.


👉 **WebsiteFix – schnelle Analyse und gezielte Fixes**  
[Zur Warteliste →](/#waitlist)