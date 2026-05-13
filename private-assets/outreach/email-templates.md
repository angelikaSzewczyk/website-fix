# Mail-Vorlagen — Cold Outreach DACH-Agenturen

**Prinzip:** Jede Mail muss einen *konkreten Befund* zur Agentur-Site enthalten. Keine Befund → keine Mail.

**Sprache:** Du-Form bei Solos, Sie-Form bei Mini-Team-GmbHs (Faustregel: Impressum gibt es vor). Bei Schweizer Agenturen "Sie" als Default.

**Absender-Setup:**
- From: `angelika@website-fix.com`
- Reply-To: identisch (keine Forwards)
- Signatur kurz: Name + 1 Zeile + Website + (optional) LinkedIn

---

## 1. Cold-Mail (Erstkontakt)

### Subject-Varianten (rotieren, A/B testen)

1. `[Agentur].de — Quick-Befund zu eurer Site`
2. `Befund zur [Agentur]-Website (87 MB Autoload)`
3. `Kurze Frage zu eurer WordPress-Maintenance, [Vorname]`
4. `[Vorname], hab eure Site kurz gescannt`

**Anti-Muster:** "Hi", "Wichtige Info", "Wir helfen Ihnen…" — landen im Spam oder werden ignoriert.

### Body — Du-Form (Solos)

```
Hallo [Vorname],

ich habe [Agentur-Domain] vorhin kurz mit WebsiteFix gescannt — drei Befunde, einer fällt direkt auf:

[BEFUND 1 — konkret mit Zahl, z. B. "wp_options läuft bei 87 MB Autoload, das drückt euer TTFB auf jeder Page direkt 200-400 ms runter."]

Außerdem:
- [BEFUND 2 — z. B. "12 inaktive Plugins liegen noch im Plugins-Ordner"]
- [BEFUND 3 — z. B. "kein Brotli/Gzip auf den statischen Assets"]

Hintergrund: Ich baue WebsiteFix.com — Performance- und Maintenance-Tool für WP-Agenturen, das genau solche Befunde automatisch über alle deine Kundenseiten hinweg liefert (statt jede Site einzeln durchzuklicken).

Falls relevant: Ich gebe Agenturen 1 Monat Pro-Plan gratis gegen ehrliches Feedback zur Dashboard-UX. Kein Verkaufsgespräch, kein Vertrag — wirklich nur Feedback.

Interesse?

Beste Grüße
Angelika

—
Angelika Szewczyk · WebsiteFix
Performance & Health Monitoring für WordPress
website-fix.com
```

### Body — Sie-Form (Mini-Team / GmbHs)

```
Hallo [Frau/Herr Nachname],

ich habe [Agentur-Domain] vorhin kurz mit WebsiteFix gescannt — drei Befunde, einer fällt direkt auf:

[BEFUND 1 — konkret mit Zahl]

Außerdem:
- [BEFUND 2]
- [BEFUND 3]

Hintergrund: Ich baue WebsiteFix.com — Performance- und Maintenance-Tool für WP-Agenturen, das genau solche Befunde automatisch über alle Kundenseiten hinweg liefert (statt jede Site einzeln durchzuklicken).

Falls für Ihre Maintenance-Kunden relevant: Ich gebe Agenturen 1 Monat Pro-Plan gratis gegen ehrliches Feedback zur Dashboard-UX. Kein Verkaufsgespräch — wirklich nur Feedback.

Interesse?

Beste Grüße
Angelika Szewczyk

—
WebsiteFix · Performance & Health Monitoring für WordPress
website-fix.com
```

---

## 2. Follow-up 1 — Tag 4 (wenn keine Antwort)

### Subject (im selben Thread, kein neues Subject)

`Re: [Original-Subject]`

### Body

```
Hallo [Vorname],

kurzer Reminder — Befund-Mail von Montag ist unten.

Falls die Free-Pro-Monat-Sache nicht passt: Ich habe auf website-fix.com/scan einen anonymen Scan, der die Befunde auch ohne Account zeigt. Vielleicht spannender als die Mail.

Wenn ich an der falschen Person bin: Wer macht bei euch Performance/Maintenance?

Beste Grüße
Angelika
```

---

## 3. Follow-up 2 — Tag 10 (letzter Touch, Breakup-Mail)

### Subject

`Re: [Original-Subject]` *(weiterhin selber Thread)*

### Body

```
Hallo [Vorname],

letzter Versuch — ich nehme [Agentur] dann aus der Liste raus.

Falls WebsiteFix später mal relevant wird: einfach kurz auf diese Mail antworten, ich antworte direkt.

Falls Performance/Maintenance kein Thema für euch ist: Sag mir gern Bescheid, dann höre ich auf.

Beste Grüße
Angelika
```

**Wichtig:** Bei Follow-up 2 wirklich Schluss machen. Vierte Mail ist Stalking.

---

## 4. Reply-Templates (wenn jemand antwortet)

### A — "Interessant, schick mir mehr Infos"

```
Hallo [Vorname],

freut mich. Drei Optionen, je nachdem wie viel Zeit du gerade hast:

1. **5 Min:** Probier den Scan einer eurer Kunden-Sites — website-fix.com/scan, kein Account nötig.
2. **15 Min:** Ich richte dir den Pro-Account ein und du klickst dich durch. Schick mir dafür: Vor-/Nachname + Mail-Adresse.
3. **30 Min Call:** Ich zeig dir das Tool an einer eurer echten Kunden-Sites, du sagst was fehlt. Termin: [calendly-link oder 2-3 konkrete Slots].

Was passt am besten?

Angelika
```

### B — "Was kostet das?"

```
Hallo [Vorname],

Plans liegen auf website-fix.com/preise — Pro-Plan ist 89 €/Mo bei jährlicher Zahlung, Scale (Multi-Kunden + White-Label) bei 249 €/Mo.

Für dich als Feedback-Agentur: 30 Tage Pro gratis, danach entscheidest du. Kein Auto-Charge, kein Kündigungs-Theater — ich brauche das Feedback, du das Tool.

Soll ich den Test-Account einrichten? Brauche nur Vor-/Nachname + Mail.

Angelika
```

### C — "Nicht relevant für uns / Kein Bedarf"

```
Hallo [Vorname],

alles klar, danke für die Rückmeldung. Falls sich das mal ändert: Du weißt jetzt wo du mich findest.

Eine Bitte, falls du noch 30 Sekunden hast: Was hat dich konkret abgehalten? (Preis / Tool macht zu wenig / habt schon was Vergleichbares / WordPress-Maintenance nicht mehr Kern-Geschäft / sonstiges?) Das hilft mir die Positionierung zu schärfen.

Beste Grüße
Angelika
```

---

## Anti-Muster (NICHT senden)

- ❌ "Ich hoffe Sie hatten ein schönes Wochenende"
- ❌ Generische Performance-Aussagen ohne Zahl ("Ihre Site könnte schneller sein")
- ❌ Mehr als 3 Bulletpoints in der Cold-Mail
- ❌ "Lass uns einen 30-Min-Call vereinbaren" als erste CTA — zu hohe Reibung
- ❌ Mehrere Links in der Cold-Mail (max 1 Domain)
- ❌ PS-Zeile mit zweitem CTA
- ❌ "Wir sind eine Plattform, die…"

## Tracking-Note

Bei jedem Send: Datum + Status in `agencies-dach.md` updaten. Bei Reply: 2-Min-Update der Outcome-Spalte mit Tenor der Antwort (z. B. `replied — interessiert, will Demo nächste Woche`).
