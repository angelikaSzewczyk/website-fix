---
title: "Kontaktformular funktioniert nicht? 9 Ursachen + schnelle Fixes"
description: "Wenn dein Kontaktformular keine E-Mails sendet: Hier sind die häufigsten Ursachen (Spam, Absender, SMTP, Plugins) inkl. Checkliste & Lösungen."
date: "2026-02-10"
category: "Conversion"
tags: ["kontaktformular", "leads", "wordpress", "smtp"]
status: "published"
---

Wenn dein **Kontaktformular nicht funktioniert**, verlierst du Anfragen – und damit Umsatz. Die gute Nachricht: In den meisten Fällen liegt es an **ein paar typischen Ursachen**, die sich schnell prüfen (und oft in Minuten lösen) lassen.

## Schnellcheck in 3 Minuten (mach das zuerst)
Bevor du tief einsteigst, prüfe diese Punkte:

- **Spam-Ordner**: Liegt die Formular-Mail im Spam?
- **Test an 2 Empfänger**: Sende an Gmail + eine zweite Adresse (z. B. Outlook).
- **Absender/Reply-To**: Ist als Absender *deine Domain* eingestellt (nicht „info@gmail.com“)?
- **Formular-Plugin**: Gibt es Fehlermeldungen im Plugin (z. B. Contact Form 7)?
- **Hosting-Mail**: Funktioniert “normale” E-Mail von deiner Domain grundsätzlich?

Wenn nach diesem Check **keine Mail ankommt**, sind diese Ursachen am wahrscheinlichsten:

## 1) Mails landen im Spam (sehr häufig)
**Symptom:** Mail kommt an, aber nur im Spam.

**Fix:**
- Verwende als Absender eine Adresse deiner Domain (z. B. `kontakt@deine-domain.de`)
- Setze **Reply-To** auf die E-Mail des Website-Besuchers (damit du antworten kannst)
- Prüfe SPF/DKIM beim Domain-Provider (wenn möglich)

## 2) Falscher Absender (DMARC blockt)
Wenn dein Formular “im Namen” fremder Domains sendet (z. B. gmail.com), blocken viele Mailserver das.

**Fix:**
- Absender = Domain-Mail (z. B. `kontakt@…`)
- Reply-To = Besucher-Mail

## 3) SMTP fehlt (WordPress & viele Hoster)
**Symptom:** Formular “sendet”, aber es kommt nie etwas an.  
Viele Setups verschicken Mails unsauber (PHP mail), was oft geblockt wird.

**Fix (Best Practice):**
- SMTP einrichten (Plugin + SMTP-Zugang)  
- Danach **End-to-End testen** (Formular → Mailzustellung → Antwortfunktion)

## 4) Form-Plugin/Integration ist falsch konfiguriert
**Symptom:** Submit klappt, aber Empfänger-Adresse ist leer/falsch oder Template kaputt.

**Fix:**
- Empfängeradresse prüfen (Tippfehler, Leerzeichen, Kommas)
- Mail-Template im Plugin checken
- Testweise auf eine “simple” Mail reduzieren (nur Name + Nachricht)

## 5) Captcha/Spam-Schutz blockiert echte Leads
**Symptom:** Auf manchen Geräten klappt es, auf anderen nicht. Oder Form hängt.

**Fix:**
- Captcha testweise deaktivieren
- Alternativ: Honeypot + Rate Limit nutzen
- Danach wieder aktivieren und erneut testen

## 6) Pflichtfelder/Validierung verhindert Versand
**Symptom:** Nutzer klicken „Senden“, aber es passiert nichts oder Feldfehler werden übersehen.

**Fix:**
- Pflichtfelder reduzieren
- Fehlermeldungen sichtbar machen (nicht nur rot umrandet)
- Mobil testen (kleine Screens!)

## 7) Caching/Minify bricht das Formular (häufig bei Performance-Plugins)
**Symptom:** Form funktioniert im Admin/ohne Cache, aber nicht “live”.

**Fix:**
- JS-Minify/Combine für Form-Skripte deaktivieren
- Formular-Seite vom Cache ausschließen
- Danach testen

## 8) Weiterleitung/Thank-you Page ist falsch
**Symptom:** Nutzer denkt, es ging nicht raus – aber eigentlich schon (oder umgekehrt).

**Fix:**
- Klare Erfolgsmeldung (“Danke, wir melden uns…”)
- Optional: Bestätigungs-Mail an Nutzer
- Tracking-Event auf Erfolg (Conversion)

## 9) E-Mails gehen an falsche Empfänger / Alias
**Symptom:** Mail kommt an, aber nicht im erwarteten Postfach.

**Fix:**
- Alias/Weiterleitungen prüfen
- Empfänger in Formular-Konfig checken
- Test an eine externe Adresse (Gmail) als Referenz

---

## Wann sich ein Fix lohnt (und warum es oft schneller ist)
Wenn du nach den Checks immer noch keine Zustellung hast, kostet dich das schnell:
- Zeit (Debugging, Hosting, DNS, Plugins)
- Nerven (sporadische Fehler)
- echte Leads

**Wenn du willst, übernehmen wir das sauber end-to-end**: Formular, Zustellung, Validierung, finaler Test.

👉 **Fix #1 – Kontaktformular reparieren:**  
[Zum Fix auswählen](/#fixes)

---

## FAQ
### Warum kommen Kontaktformular-Mails nicht an?
Meist wegen Spam/DMARC, falschem Absender, fehlendem SMTP oder Plugin-/Caching-Konflikten.

### Was ist die schnellste Lösung?
In vielen Fällen: **Absender korrekt setzen** + **SMTP einrichten** + **End-to-End Test**.

### Gilt das auch für WordPress?
Ja – besonders häufig bei WordPress, weil Plugins, Caching und PHP-Mail oft Probleme machen.

### Kann ich prüfen, ob das Formular überhaupt sendet?
Ja: Test an 2 Empfänger, Plugin-Logs prüfen, Captcha testweise aus, Cache deaktivieren und erneut testen.
