# AI-Image-Prompts — WP.org Plugin-Assets

**Zweck:** Copy-paste-fertige Prompts für die 4 Assets, die wir für die WordPress.org-Submission brauchen.

**Tool-Empfehlung in der Reihenfolge:**
1. **Gemini 2.5 Pro / Imagen 3** — beste Qualität für minimalistische, technische Composings 2026, freies Quota
2. **Midjourney v6.1** — beste Banner-Quality (Aspect-Ratio-Support via `--ar`)
3. **DALL-E 3** (über ChatGPT Plus oder API) — gut für Icons, hat aber Probleme mit ultra-wide Aspect-Ratios

**Wichtig:** Jeder Prompt sollte 3–5× generiert werden bis das richtige Ergebnis dabei ist. AI-Image-Output ist nicht-deterministisch.

---

## 1. Health-Check Banner (772×250)

### Prompt — universell (für Gemini, ChatGPT/DALL-E, Imagen)

```
Wide horizontal banner image, aspect ratio 772x250 pixels (or as close
to 3.1:1 as possible). Professional WordPress plugin banner with a dark
navy background (hex #0a0c10) overlaid by a subtle green grid pattern
(very faint, like blueprint paper).

LEFT 40%: Bold sans-serif text reading "WebsiteFix Health Check" — the
word "WebsiteFix" in white, "Health Check" in a lighthouse-green gradient
(#4ade80 to #22c55e). Below in smaller subtitle: "5 Kennzahlen, die
zeigen wo dein Hoster bremst" in light gray.

CENTER 30%: A stylized circular WordPress "W" logo with concentric
pulse rings (like a heartbeat monitor signal) emanating outward in
lighthouse green, with soft outer glow. The logo should have an
animated-looking radial pulse vibe but as a still image.

RIGHT 30%: Two small glassmorphism cards stacked vertically. Top card
shows "TTFB: 412 ms" with a green downward arrow indicating improvement.
Bottom card shows "Heartbeat: 60s · OK" with a green status dot.

Style: minimalist, technical, developer-tool-aesthetic, glassmorphism
on dark mode. No people, no stock-photo icons, no emojis. Inter
ExtraBold typography. High contrast white-on-dark. Glow effects in
lighthouse green only.
```

**Midjourney-Variante** (kürzer, mit Aspect-Ratio-Param):
```
Professional WordPress plugin banner, dark navy background #0a0c10
with subtle green grid pattern. Left: bold text "WebsiteFix Health
Check" white + green gradient. Center: stylized W logo with
concentric pulse rings, lighthouse green glow. Right: two minimal
glassmorphism cards showing TTFB metric and Heartbeat status.
Minimalist, technical, dev-tool aesthetic, high contrast, no people
no emojis. --ar 772:250 --v 6
```

---

## 2. Health-Check Icon (256×256)

### Prompt — universell

```
Square plugin icon, 256x256 pixels. Dark navy circular background
(hex #0a0c10) filling the canvas, with a thin lighthouse-green border
(1px, #4ade80 at 30% opacity). Centered glyph: a stylized letter "W"
intertwined with an EKG/heartbeat pulse line that runs horizontally
through the W, both rendered in lighthouse green (#4ade80) with an
8-pixel stroke and soft outer glow. The combined glyph should be
read as "WordPress under health monitoring".

Style: clean, technical, modern symbol design. No text, no emojis,
no gradients except the glow. Sharp edges, vector-like quality.
Background-circle should NOT fill the entire canvas — leave a small
margin so it's visible as a circle, not a square.
```

**Midjourney-Variante:**
```
Square plugin icon, 256x256 pixels, dark navy circular background
#0a0c10 with thin lighthouse-green border #4ade80. Center: stylized
letter W intertwined with EKG heartbeat pulse line, lighthouse green
8px stroke, soft glow. No text, no emojis, vector-clean. --ar 1:1 --v 6
```

---

## 3. Optimizer Banner (772×250)

### Prompt — universell

```
Wide horizontal banner image, aspect ratio 772x250 pixels (or as close
to 3.1:1 as possible). Professional WordPress plugin banner with a dark
navy background (hex #0a0c10) overlaid by a subtle green grid pattern.

LEFT 45%: Bold sans-serif text reading "WebsiteFix" in white above
"One-Click Optimizer" in a lighthouse-green gradient (#4ade80 to
#22c55e). Below in smaller subtitle: "7 WordPress-Performance-Killer
mit einem Klick" in light gray.

CENTER 25%: A large stylized lightning bolt symbol in lighthouse green
with a soft outer glow. The bolt should have a slightly curved,
dynamic shape suggesting action and energy. Below the bolt, three
small stacked rectangles like UI buttons — one filled green (active),
two outlined.

RIGHT 30%: Two before/after comparison cards stacked vertically.
Top card: "Heartbeat: 15s → 60s ✓" — the 15s in faded red, the 60s
in bright white, the checkmark in green. Bottom card: "XML-RPC:
open → closed ✓" with the same styling pattern.

Style: minimalist, technical, action-oriented developer-tool aesthetic,
glassmorphism on dark mode. No people, no stock-photo icons, no emojis
(checkmarks rendered as clean SVG-like graphics, not emoji-style).
Inter ExtraBold typography. High contrast white-on-dark.
```

**Midjourney-Variante:**
```
Professional WordPress plugin banner, dark navy background #0a0c10
with green grid pattern. Left: bold text "WebsiteFix One-Click
Optimizer" white + green gradient. Center: large stylized lightning
bolt in lighthouse green with soft glow, three small stacked button
shapes below. Right: two before/after metric cards with green
checkmarks. Minimalist, technical, action-oriented dev-tool
aesthetic, no people no emojis. --ar 772:250 --v 6
```

---

## 4. Optimizer Icon (256×256)

### Prompt — universell

```
Square plugin icon, 256x256 pixels. Dark navy circular background
(hex #0a0c10) filling most of the canvas, with a thin lighthouse-
green border (1px, #4ade80 at 30% opacity). Centered glyph: a bold,
slightly-curved lightning bolt in lighthouse green (#4ade80) with a
10-pixel stroke and a soft outer glow that fills the inner circle
with a faint green halo.

The bolt should be the dominant element, taking ~60% of the inner
circle area. Optional accent: tiny floating particle dots around the
bolt to suggest energy or speed.

Style: clean, technical, modern symbol design. No text, no emojis,
sharp vector-like edges. Background-circle should NOT fill the entire
canvas — leave a small margin so it's visible as a circle, not a
square.
```

**Midjourney-Variante:**
```
Square plugin icon, 256x256 pixels, dark navy circular background
#0a0c10 with thin lighthouse-green border. Center: bold curved
lightning bolt, lighthouse green #4ade80 10px stroke, soft outer
glow, tiny energy particle accents. No text, vector-clean, no
emojis. --ar 1:1 --v 6
```

---

## Post-Generation Workflow

### Was du nach dem AI-Output machen musst

1. **Aspect Ratio prüfen.** Falls Banner nicht exakt 772×250 ist:
   - Photoshop / GIMP / Photopea (kostenlos im Browser): "Canvas Size" auf 772×250 setzen, Bild zentrieren, Hintergrund-Farbe `#0a0c10` für Padding.
   - PowerShell-Variante mit ImageMagick (falls installiert):
     ```powershell
     magick.exe convert input.png -resize 772x250^ -gravity center -extent 772x250 -background "#0a0c10" banner-772x250.png
     ```

2. **Icon-Größen erstellen.** Aus dem 1024×1024 AI-Output zwei Versionen:
   - `icon-256x256.png` — Retina, Pflicht
   - `icon-128x128.png` — Standard, Pflicht
   - Sicherste Methode: in Photopea öffnen, "Image → Image Size" → erst auf 256, dann separat auf 128 downsizen. Beide PNG-export.

3. **PNG-Optimierung.** WP.org limitiert Asset-Größe nicht hart, aber kleinere = besser:
   - [TinyPNG.com](https://tinypng.com/) — drag-and-drop, lossless-ish, typisch 50–70 % Größenreduktion.
   - [Squoosh.app](https://squoosh.app/) — open-source Google-Tool, mehr Kontrolle.

4. **Banner-Retina-Variante.** 1544×500 ist optional aber empfohlen für hi-DPI-Displays:
   - Einfach den AI-Output bei 1544×500 nochmal generieren (oder den 772×250 mit 2x AI-Upscale), nicht hochskalieren (Detailverlust).

### Was du beim AI-Output checkst (Quality-Gate)

- [ ] Keine wirren Buchstaben oder Schrift-Artefakte (AI generiert oft kaputten Text)
- [ ] Farben matchen Brand-Tokens (Lighthouse-Grün, kein Verbiegen ins Blaue/Gelbe)
- [ ] Kein Emoji-Charakter — Checkmarks, Bolts etc. müssen wie SVG-Icons aussehen, nicht wie 😊-Emojis
- [ ] Keine seltsamen Anatomie/Personen-Artefakte (AI macht das auch ohne People-Prompt manchmal)
- [ ] Lesbarkeit bei 128×128 (Icon shrink-test): zoom mental auf Icon, ist der Glyph noch erkennbar?

---

## Fallback: Manuelle Komposition

Wenn AI nach 5 Iterations das Banner nicht hinbekommt — was bei 772:250 leicht passieren kann, weil das eine ungewöhnliche Aspect-Ratio ist:

**Plan B: Figma / Canva mit eigenem Asset-Setup**

1. Figma- oder Canva-Account (beide free-tier ausreichend)
2. Custom-Canvas 772×250 anlegen
3. Hintergrund: Rectangle 100 % gefüllt mit `#0a0c10`
4. Grid-Pattern: 32×32-px grid, 1px Stroke, `#4ade80` mit 2-3 % Opacity (sehr subtil)
5. Headlines mit Inter ExtraBold installieren (Google Fonts kostenlos)
6. WordPress-Logo aus official-WordPress-brand-assets-page laden (PNG mit Alpha)
7. Lightning-Bolt-Glyph aus Heroicons / Lucide / Feather Icons (alle kostenlos)
8. Composing per Drag-and-Drop, Export als PNG

Geht in 30-60 Min, Result ist 100 % brand-konsistent, kein „AI sieht halt anders aus"-Risiko.

**Fonts/Icon-Quellen:**
- Inter: [rsms.me/inter/](https://rsms.me/inter/)
- WordPress-Logo: [s.w.org/style/images/about/WordPress-logotype-standard.png](https://s.w.org/style/images/about/WordPress-logotype-standard.png)
- Lucide-Icons: [lucide.dev](https://lucide.dev/icons/) — der Lightning-Bolt heißt `zap`
- Heroicons: [heroicons.com](https://heroicons.com/) — der Bolt heißt `bolt`

---

## Datei-Output-Ziele

Nach Generierung + Post-Processing solltest du diese 8 Dateien haben:

```
banner-health-check-772x250.png
banner-health-check-1544x500.png    (optional, Retina)
icon-health-check-256x256.png
icon-health-check-128x128.png

banner-optimizer-772x250.png
banner-optimizer-1544x500.png       (optional, Retina)
icon-optimizer-256x256.png
icon-optimizer-128x128.png
```

Diese werden später im SVN-Repo unter `/assets/` (außerhalb von trunk/) abgelegt — siehe `wp-org-submission-plan.md` §5.3.

---

## Schneller Start

Wenn du jetzt einsteigen willst:

1. **Gemini öffnen** → ersten Prompt (Health-Check Banner) reinkopieren → generieren
2. Beste der 3-5 Outputs auswählen
3. Bei TinyPNG hochladen → optimieren → speichern als `banner-health-check-772x250.png`
4. Wiederholen für die anderen 3 Assets

In ~30-45 Min hast du alle 4 Assets fertig.
