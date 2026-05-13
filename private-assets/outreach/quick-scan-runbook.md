# Quick-Scan-Runbook — von URL zur personalisierten Mail

**Ziel:** In ~12 Minuten pro Agentur eine konkrete, befund-basierte Cold-Mail rausschicken.

**Wenn länger als 15 Min:** Befunde nicht aussagekräftig genug → Agentur in `agencies-dach.md` als `lost` markieren mit Note "kein Hook gefunden", weiter zur nächsten.

---

## Schritt 1 — Scan (3 Min)

1. Öffne `https://website-fix.com/scan` im Browser (oder produktiv lokal über Dashboard-Account).
2. Agentur-URL eingeben, Scan starten.
3. Während der Scan läuft: Impressum öffnen, Kontaktname + Mail notieren.

**Note:** Free-Scan-Limit ist 2/24h pro IP. Falls Limit hart wird: VPN oder erst ab Pro-Dashboard arbeiten.

## Schritt 2 — Top-3-Befunde extrahieren (4 Min)

Aus den Scan-Ergebnissen 3 Befunde wählen, die folgende Kriterien erfüllen:

1. **Konkret mit Zahl** — "87 MB Autoload" schlägt "großer Autoload".
2. **Geschäftlich relevant** — Performance-Auswirkung in ms / Sicherheitslücke / SEO-Effekt. Nicht: "fehlt `wp-config.php` ein Constant".
3. **Selbst nicht trivial gefixt** — Wenn der Befund 30-Sek-Aufgabe wäre, hat die Agentur ihn vor 5 Jahren gemacht.

**Prioritäts-Reihenfolge der Befund-Typen:**

| Typ | Beispiel | Hook-Stärke |
|---|---|---|
| Autoload-Größe | "wp_options bei 87 MB" | ⭐⭐⭐ |
| Veraltete PHP-Version | "PHP 7.4 läuft noch" | ⭐⭐⭐ |
| Heartbeat-Frequenz | "wp-admin Heartbeat alle 15s" | ⭐⭐⭐ |
| Render-Blocking JS | "8 blocking Scripts im Header" | ⭐⭐ |
| Inaktive Plugins | "12 inaktive Plugins" | ⭐⭐ |
| XML-RPC offen | "xmlrpc.php nicht gesperrt" | ⭐⭐ |
| Brotli/Gzip fehlt | "keine Compression auf CSS/JS" | ⭐ |
| Cache-Headers schlecht | "kein max-age auf statischen Assets" | ⭐ |

**Regel:** Mindestens EIN ⭐⭐⭐-Befund pro Mail. Wenn keiner verfügbar: nicht senden, Agentur als `lost — keine starken Befunde` markieren.

## Schritt 3 — Befund-Screenshot (1 Min)

`Win + Shift + S` → Rechteckiger Snip um den Befund im Scan-Result.

**Optional:** Screenshot in OneDrive ablegen unter `Outreach-Screenshots/[YYYY-MM-DD]-[agentur].png`. Falls die Agentur fragt "wo seht ihr das genau" hast du es parat.

## Schritt 4 — Mail personalisieren (3 Min)

1. `email-templates.md` öffnen → passende Cold-Mail-Variante (Du/Sie) kopieren.
2. Platzhalter füllen:
   - `[Vorname]` / `[Frau/Herr Nachname]`
   - `[Agentur-Domain]`
   - `[BEFUND 1]` mit konkreten Zahlen
   - `[BEFUND 2]` + `[BEFUND 3]`
3. **Vor dem Senden noch mal lesen:** Klingt jeder Befund wie etwas, das die Agentur ernst nehmen würde, oder wie generisches Tool-Geschwurbel?

**Selbst-Check:** Würdest du diese Mail beantworten, wenn sie dir ankäme? Wenn nein → einer der Befunde ist zu generisch, überarbeiten oder Agentur skippen.

## Schritt 5 — Send + Tracking (1 Min)

1. Send.
2. In `agencies-dach.md`:
   - `Status` → `sent-1`
   - `Erstkontakt` → heutiges Datum
   - `Befund-Hook` → der ⭐⭐⭐-Befund (1 Zeile, für Follow-up nachvollziehbar)

## Schritt 6 — Reminder setzen (10 Sek)

Outlook/Google-Calendar: 4 Tage später Reminder "F-up 1 [Agentur]".

---

## Häufige Stolperfallen

- **Falsche Person:** Bei Agentur-Mini-Teams gibt es oft "info@" + persönliche Mail-Adresse. **Immer die persönliche nehmen.** "info@" liest niemand.
- **DSGVO-Sorge:** Cold-Mails an Geschäftskontakte sind in DE im B2B grundsätzlich zulässig wenn ein berechtigtes Interesse erkennbar ist (UWG §7 Abs. 3). Ein konkreter Performance-Befund zur eigenen Site = berechtigtes Interesse. Bei Unsicherheit: Erstkontakt höflich + Opt-out-Hinweis am Schluss anbieten.
- **Scan liefert nichts spektakuläres:** Manche Agentur-Sites sind tatsächlich gut gepflegt — dann ist die Agentur ohnehin nicht der dringendste Lead. Trotzdem ablegen, später nochmal versuchen mit anderem Hook (z. B. "wie macht ihr Multi-Site-Monitoring?").
- **Free-Scan-Limit (2/24h) hart:** Wenn du am Tag 4-5 Agenturen anschreiben willst, vorher den Dashboard-Account (eingeloggt = höheres Limit) öffnen oder mit Pro-Account scannen.

---

## Tages-Rhythmus (wenn 4 Mails/Tag = Wochen 2-4)

| Block | Dauer | Was |
|---|---|---|
| Morgen-Block | 50 Min | 4 Scans + 4 Mails raus |
| Mittags-Check | 5 Min | Replies sichten, dringend antworten |
| Abend-Block | 10 Min | Follow-ups versenden für Mails von vor 4/10 Tagen |

**Nicht:** Den ganzen Vormittag in Outreach versinken. 60 Min ist genug, danach zurück zum Produkt.
