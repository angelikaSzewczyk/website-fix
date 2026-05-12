# WordPress.org Plugin-Assets — Visual-Briefing

**Plugin:** WebsiteFix Health-Check (Free, WordPress.org)
**Brand-Token:**
- Primary: Lighthouse-Grün `#4ade80` (matched mit dem Hauptprodukt)
- Secondary: Tiefes Grün `#22c55e`
- Background: Deep-Navy `#0a0c10`
- Surface: `rgba(255,255,255,0.04)` glas
- Accent-Glow: `rgba(74,222,128,0.30)`
- Typeface: Inter (Headlines), `ui-monospace` / SF Mono (Code-Akzente)

---

## 1. Plugin-Banner — 772×250 (high-DPI: 1544×500)

**Dateiname:** `banner-772x250.png` (+ `banner-1544x500.png` für Retina)
**Format:** PNG, ≤ 200 KB. Hintergrund nicht-transparent.

### Layout

Drei-Zonen-Aufbau, von links nach rechts:

```
┌──────────────────────────────────────────────────────────────────────┐
│  ZONE A (40 %)       │  ZONE B (30 %)          │  ZONE C (30 %)       │
│                      │                         │                      │
│  WebsiteFix          │   ●  ●  ●               │   ┌─ TTFB ────────┐ │
│  HEALTH-CHECK        │   {} heartbeat_settings │   │ 412 ms        │ │
│                      │   add_filter( …, 60 );  │   │  ▼ -64 %      │ │
│  5 Kennzahlen,       │                         │   └───────────────┘ │
│  die zeigen wo       │   [WP-Logo, grün        │   ┌─ Heartbeat ───┐ │
│  dein Hoster bremst. │    pulsierender Ring]   │   │ 60s · OK      │ │
│                      │                         │   └───────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Zone A — Headline-Block (linke 40 %)

- Hintergrund: Deep-Navy mit subtilem Grid-Pattern (Linien `rgba(74,222,128,0.025)`, 32 px-Raster), wie auf der EngineeringSection-Page.
- **Pre-Headline** (Mono, 11 px, Lighthouse-Grün, uppercase, letter-spacing 0.08em):
  `// WordPress Plugin`
- **Headline** (Inter ExtraBold, ~32 px, weiß):
  `WebsiteFix`
- **Sub-Headline** (Inter Bold, ~26 px, Lighthouse-Grün → Tief-Grün-Gradient `linear-gradient(90deg, #4ade80, #22c55e)`):
  `Health-Check`
- **Tagline** (Inter Regular, 13 px, `rgba(255,255,255,0.65)`, max 2 Zeilen):
  „5 Kennzahlen, die zeigen wo dein Hoster bremst."

### Zone B — Code-Visual (mittig)

- WordPress-Logo (offizielles W-Glyph) als zentraler Anker — durchgehender Lighthouse-Grün-Stroke statt Standard-Blau.
- Drumherum zwei pulsierende Heartbeat-Ringe (8 px Stroke, opacity 0.4 → 0.8, animated im Live-PNG nicht möglich — also Statisch mit Glow-Verlauf).
- Über/unter dem W-Logo zwei Code-Snippet-Schnipsel in Mono-Font, 11 px, `rgba(255,255,255,0.55)`:
  - `add_filter( 'heartbeat_settings', …, 60 );`
  - `wp_deregister_script( 'heartbeat' );`
- Subtiler Glow `0 0 48px rgba(74,222,128,0.25)` um das W-Logo.

### Zone C — Dashboard-Mock (rechte 30 %)

Zwei kleine Glassmorphism-Cards übereinander, beide:
- Background `rgba(255,255,255,0.04)`, Border `1px solid rgba(255,255,255,0.10)`, BorderRadius 10 px.
- Inner-Padding 12 px.

**Card 1 — TTFB:**
- Label (Mono 10 px, `rgba(255,255,255,0.42)`): „TTFB"
- Value (Inter ExtraBold 22 px, weiß): „412 ms"
- Trend-Pill (Mono 11 px, Grün auf Grün-Bg-Pille): „▼ -64 %"

**Card 2 — Heartbeat:**
- Label: „Heartbeat-Frequenz"
- Value: „60 s"
- Status-Dot (8 px, Grün, Glow): „OK"

### Don'ts für den Banner
- Keine Emojis, keine Stock-Photo-Personen, keine generischen „Speed"-Tachos (zu billig).
- Kein Roter Alarm-Ton — der Banner soll Lösung kommunizieren, nicht Panik.
- Kein WordPress-Standard-Blau `#21759b` (kollidiert mit Markenton).

---

## 2. Plugin-Icon — 256×256 (+ 128×128 Hi-DPI-Variante)

**Dateiname:** `icon-256x256.png` (+ `icon-128x128.png`)
**Format:** PNG mit Alpha (transparenter Hintergrund optional — viele WP-Repos nutzen einen Tile-View mit eigenem Background, daher safer mit eigenem dunklen Bg-Kreis).

### Komposition

Quadratisches Canvas, zentrierter Glyph mit Glow.

```
        ┌─────────────────────────────┐
        │                             │
        │         ╭───────╮           │
        │       ╭─┤  ▲  ▲ ├─╮         │
        │       │ │ ┌─┐│ │ │         │
        │      ─┤ │─┘ ▼┘ ▼─├─        │  ←  Pulse-Welle in Grün
        │       │ │       │ │         │
        │       ╰─┤   W   ├─╯         │
        │         ╰───────╯           │
        │                             │
        └─────────────────────────────┘
```

### Elemente

- **Hintergrund:** Dunkler Kreis (Durchmesser ~224 px), Fill `#0a0c10`, mit feinem `1px` Inner-Border `rgba(74,222,128,0.30)`.
- **Glyph:** Stilisiertes „W" (für WebsiteFix, NICHT WordPress) — verschmolzen mit einer EKG-/Heartbeat-Pulse-Linie, die durch das W läuft. Stroke 8 px, Farbe `#4ade80`. Die Linie soll andeuten: „WordPress unter Beobachtung — wir messen den Puls."
- **Glow:** Aussen-Glow `0 0 32px rgba(74,222,128,0.35)`, innen-Glow `inset 0 0 16px rgba(74,222,128,0.15)`.
- **Kein Text** — bei 128 px nicht lesbar, daher rein symbolisch.

### Alternativvariante (falls Pulse-Linie zu komplex)

Reines „WF"-Monogramm mit Lighthouse-Grün-Gradient-Fill, freistehend auf transparentem Bg, mit subtiler Drop-Shadow. Schlichter, aber weniger thematisch.

**Empfehlung:** Variante A (Pulse-im-W). Direkter visueller Hook zum Plugin-Zweck — Diagnose.

---

## 3. Screenshots — 1280×800 (jeweils PNG, ≤ 500 KB)

WordPress.org zeigt diese in der Listing-Galerie. Die `readme.txt` referenziert sie als `screenshot-1.png` … `screenshot-5.png`. Korrespondieren 1:1 zu den `== Screenshots ==`-Einträgen.

| # | Was zeigt es | Wesentliche Elemente |
|---|--------------|----------------------|
| 1 | Widget im Dashboard | WordPress-Admin-Mock mit dem Health-Check-Widget oben rechts, alle 5 Kennzahlen sichtbar, jede mit Status-Dot (grün/gelb/rot) |
| 2 | Heartbeat-Detail | Expanded-View der Heartbeat-Card mit Frequenz, hochgerechneter Stunden-Last, „Smart-Fix öffnen"-Button |
| 3 | DB-Bloat-Tabelle | Tabelle mit den drei größten Tabellen, Größen-Balken, Bloat-Prozentsatz |
| 4 | PageSpeed-Vergleich | Balkendiagramm „deine Site vs. Hosting-Branchen-Durchschnitt" für TTFB + LCP |
| 5 | Update-Backlog | Kategorisierte Liste (kritisch / regulär / veraltet), Plugin-Namen, letzte Update-Daten |

Alle Screenshots im echten Plugin-UI rendern (kein Mockup), wenn das UI fertig ist. Bis dahin: Figma-Mockup im exakten Stil der bestehenden EngineeringSection.

---

## 4. Generierungs-Briefing für AI-Tools (falls genutzt)

Falls Banner/Icon mit Midjourney, DALL-E, Gemini erzeugt werden, ist dieser Prompt der Anker:

```
Professional WordPress plugin banner, 772x250 pixels, dark navy
background (#0a0c10) with subtle grid pattern. Left side: bold sans-
serif headline "WebsiteFix Health-Check" in white and lighthouse-green
gradient (#4ade80 to #22c55e). Center: stylized WordPress W-logo with
pulsing green concentric rings, monospace code snippets floating
nearby (add_filter heartbeat_settings, 60). Right side: two glass-
morphism dashboard cards showing TTFB "412 ms" and Heartbeat "60 s"
with downward trend arrows. Minimalist, technical, dev-focused, no
people, no stock-style icons. Glow effects in lighthouse green.
Inter ExtraBold typography. High contrast. No emojis.
```

Für das Icon:
```
Square plugin icon, 256x256 pixels, dark navy circular background
(#0a0c10) with thin lighthouse-green border. Center: stylized "W"
letter merged with an EKG/heartbeat pulse line passing through it,
in lighthouse green (#4ade80), 8-pixel stroke, with soft outer glow.
No text. Symbolic representation of WordPress health monitoring.
Clean, technical, modern. No emojis, no gradients except the glow.
```

---

## 5. Datei-Struktur fürs WP.org-Submission-Repo

```
/assets
  banner-772x250.png           ← Plugin-Listing-Banner
  banner-1544x500.png          ← Retina-Variante (optional, empfohlen)
  icon-128x128.png             ← Plugin-Listing-Icon (Standard)
  icon-256x256.png             ← Plugin-Listing-Icon (Retina)
  screenshot-1.png             ← Widget im Dashboard
  screenshot-2.png             ← Heartbeat-Detail
  screenshot-3.png             ← DB-Bloat
  screenshot-4.png             ← PageSpeed-Vergleich
  screenshot-5.png             ← Update-Backlog
/trunk
  websitefix-health-check.php  ← Main Plugin-File
  readme.txt                   ← (vorhanden, finalisiert)
  /includes
  /admin
  /assets
```

`assets/`-Ordner liegt OUTSIDE von `trunk/` — WordPress.org SVN-Convention. Erst NACH erfolgreicher Plugin-Submission via SVN-commit auf `assets/`-Pfad pushen.

---

## 6. Submission-Checkliste

- [ ] Plugin auf WordPress.org einreichen (`https://wordpress.org/plugins/developers/add/`)
- [ ] Slug `websitefix-health-check` reservieren
- [ ] Manuelles Review abwarten (typisch 5–14 Tage)
- [ ] Nach Approval: SVN-Repo befüllen (trunk + assets)
- [ ] Banner + Icon + 5 Screenshots in `/assets` pushen
- [ ] Plugin-Listing aktivieren
- [ ] Tag `0.2.0` in SVN erstellen (`svn copy trunk tags/0.2.0`)
- [ ] First-Day-Traffic monitoren via WordPress.org-Stats-Page
