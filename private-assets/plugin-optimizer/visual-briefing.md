# WordPress.org Plugin-Assets — Visual-Briefing

**Plugin:** WebsiteFix One-Click Performance Optimizer (Free, WordPress.org)
**Version:** 0.2.0 (Stand 2026-05-12)
**Plugin-Source:** `wp-plugin/optimizer/` — Source of Truth
**Dist-ZIP:** `wp-plugin/dist/websitefix-one-click-optimizer-v0.2.0.zip`

**Geschwister-Plugin:** [Health-Check Visual-Briefing](../plugin-free/visual-briefing.md). Beide Plugins teilen Brand-Sprache + Farbpalette, unterscheiden sich nur in Glyph + Headline-Hook.

**Brand-Token:**
- Primary: Lighthouse-Grün `#4ade80`
- Secondary: Tiefes Grün `#22c55e`
- Background: Deep-Navy `#0a0c10`
- Surface: `rgba(255,255,255,0.04)` glas
- Accent-Glow: `rgba(74,222,128,0.30)`
- Typeface: Inter (Headlines), `ui-monospace` / SF Mono (Code-Akzente)

---

## 1. Plugin-Banner — 772×250 (high-DPI: 1544×500)

**Dateiname:** `banner-772x250.png` (+ `banner-1544x500.png` für Retina)
**Format:** PNG, ≤ 200 KB. Hintergrund nicht-transparent.

### Layout — drei Zonen

```
┌──────────────────────────────────────────────────────────────────────┐
│  ZONE A (45 %)            │  ZONE B (25 %)  │  ZONE C (30 %)         │
│                           │                 │                        │
│  WebsiteFix               │      ⚡         │   ┌─ Heartbeat ─────┐  │
│  ONE-CLICK OPTIMIZER      │   ◀━━━━━▶       │   │ 15s  → 60s  ✓  │  │
│                           │                 │   └─────────────────┘  │
│  7 WordPress-             │   ▢▢▢ ▶▶▶       │   ┌─ XML-RPC ──────┐  │
│  Performance-Killer       │  „Apply"        │   │ open → closed ✓│  │
│  mit einem Klick.         │                 │   └─────────────────┘  │
│                           │                 │                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Zone A — Headline-Block (linke 45 %)

- Hintergrund: Deep-Navy mit subtilem Grid-Pattern (Linien `rgba(74,222,128,0.025)`, 32 px-Raster) — identisch zum Health-Check-Banner.
- **Pre-Headline** (Mono, 11 px, Lighthouse-Grün, uppercase, letter-spacing 0.08em):
  `// WordPress Plugin`
- **Headline-Zeile 1** (Inter ExtraBold, ~30 px, weiß):
  `WebsiteFix`
- **Headline-Zeile 2** (Inter Bold, ~22 px, Lighthouse-Grün → Tief-Grün-Gradient `linear-gradient(90deg, #4ade80, #22c55e)`):
  `One-Click Optimizer`
- **Tagline** (Inter Regular, 13 px, `rgba(255,255,255,0.65)`, 2 Zeilen):
  „7 WordPress-Performance-Killer mit einem Klick. Sicher, reversibel, ohne Code-Editing."

### Zone B — Action-Visual (mittig)

Differenzierung zum Health-Check-Banner: hier geht's um Action/Apply, nicht Diagnose.

- **Großer Blitz-Glyph** (Lightning-Bolt-SVG, 80×80 px) zentriert. Fill: Lighthouse-Grün-Gradient. Soft outer glow `0 0 32px rgba(74,222,128,0.40)`.
- Unter dem Blitz: **Stilisierte Step-Bullets** — drei Quadrate, einer davon „aktiv" (gefüllt mit Grün), die anderen zwei outline.
- Daneben Mono-Text 10 px: `„Apply"` als Andeutung des UX-Patterns.

Alternative-Glyph wenn Blitz zu generisch wirkt: **Schraubenschlüssel** (Lucide-Wrench-SVG) — passt zum „Optimizer"-Konzept.

### Zone C — Effekt-Preview-Cards (rechte 30 %)

Zwei kleine Glassmorphism-Cards übereinander, beide:
- Background `rgba(255,255,255,0.04)`, Border `1px solid rgba(255,255,255,0.10)`, BorderRadius 10 px.
- Inner-Padding 12 px.

**Card 1 — Heartbeat-Vorher/Nachher:**
- Label (Mono 10 px, `rgba(255,255,255,0.42)`): „Heartbeat-Frequenz"
- Vorher (Mono 12 px, rot-getönt): `15 s`
- Pfeil → grün
- Nachher (Mono 14 px, weiß bold): `60 s ✓`

**Card 2 — XML-RPC-Vorher/Nachher:**
- Label: „XML-RPC"
- Vorher (rot): `open`
- Pfeil → grün
- Nachher (weiß bold): `closed ✓`

### Don'ts für den Banner
- Keine Emojis, keine generischen Speed-Tachos (zu billig).
- Kein lautes „SAVE 70% CPU!"-Marketing-Sprech — Reviewer mag es nüchtern.
- Kein WordPress-Standard-Blau `#21759b`.

---

## 2. Plugin-Icon — 256×256 (+ 128×128 Hi-DPI-Variante)

**Dateiname:** `icon-256x256.png` (+ `icon-128x128.png`)
**Format:** PNG mit Alpha (transparenter Hintergrund optional — wegen WP-Repo-Tile-View safer mit eigenem dunklen Bg).

### Komposition

```
        ┌─────────────────────────────┐
        │                             │
        │            ╱│               │
        │           ╱ │               │
        │          ╱  │       ⚡       │
        │         ╱   │  ◀━━━ Bolt     │
        │        ╱    │                │
        │       ╱     │                │
        │      └──────┘                │
        │                             │
        │      Klick-Bolt              │
        │      (geschwungen)           │
        └─────────────────────────────┘
```

### Elemente

- **Hintergrund:** Dunkler Kreis (Durchmesser ~224 px), Fill `#0a0c10`, mit feinem `1px` Inner-Border `rgba(74,222,128,0.30)`.
- **Glyph:** Stilisierter **Blitz** (lightning bolt) der in einem geschwungenen Bogen das Kreis-Innere durchquert. Stroke 10 px, Fill Lighthouse-Grün-Gradient `linear-gradient(135deg, #4ade80, #22c55e)`.
- **Glow:** Aussen-Glow `0 0 32px rgba(74,222,128,0.45)`, innen-Glow `inset 0 0 16px rgba(74,222,128,0.20)`.
- **Kein Text** — bei 128 px nicht lesbar.

### Unterscheidung zum Health-Check-Icon

Health-Check (Schwester-Plugin) hat ein **Pulse-/Heartbeat-Glyph** (Diagnose-Konnotation).
Optimizer hat ein **Lightning-Bolt-Glyph** (Action-Konnotation).

Beide auf gleichem dunklen Kreis-Bg + gleichem Grün-Stroke — als Set sofort wiedererkennbar, aber thematisch klar unterschieden.

---

## 3. Screenshots — 1280×800 (jeweils PNG, ≤ 500 KB)

Im readme.txt sind aktuell nur 3 Screenshots referenziert. Empfehlung: auf 4 erweitern für vollständige UX-Story.

| # | Was zeigt es | Wesentliche Elemente |
|---|--------------|----------------------|
| 1 | Hauptansicht der Settings-Page | 7 Cards im Grid, alle inaktiv. Master-Bar oben („Alle 7 aktivieren"). Sauberes UI ohne aktivierten Status. |
| 2 | Eine Card mit ausgeklapptem „Code anzeigen" | Heartbeat-Card mit dem Code-Preview-Block sichtbar — voller PHP-Code mit Safety-Check + Body. Zeigt Transparenz. |
| 3 | Nach Klick auf „Alle 7 aktivieren" | Alle Cards mit grünem Hintergrund + „● aktiv"-Pille + Live-Diagnostic („gedrosselt, 60 s", „deaktiviert", etc.). |
| 4 | Mu-Plugin-Files in WordPress-Site-Health | Werkzeuge → Site-Zustand → Info → Verzeichnisse → Must-Use-Plugins zeigt 7 wf-optimizer-*.php-Files. Beweist die saubere File-Erstellung. |

Alle Screenshots im echten Plugin-UI rendern. Bei InstaWP-Aufnahme: Browser-Window auf 1280×800 setzen, dann normaler Screenshot.

---

## 4. Generierungs-Briefing für AI-Tools (falls genutzt)

Falls Banner/Icon mit Midjourney, DALL-E, Gemini erzeugt werden:

**Banner:**
```
Professional WordPress plugin banner, 772x250 pixels, dark navy
background (#0a0c10) with subtle grid pattern. Left side: bold sans-
serif headline "WebsiteFix One-Click Optimizer" in white and
lighthouse-green gradient (#4ade80 to #22c55e), with tagline "7
WordPress performance killers with one click". Center: large
stylized lightning bolt symbol with soft glow, in lighthouse green.
Right side: two before/after dashboard cards showing "Heartbeat: 15s
→ 60s" and "XML-RPC: open → closed" with green checkmarks. Glass-
morphism cards on dark background. Minimalist, technical, dev-
focused, no people, no emojis. Inter ExtraBold typography. High
contrast. Action-oriented mood.
```

**Icon:**
```
Square plugin icon, 256x256 pixels, dark navy circular background
(#0a0c10) with thin lighthouse-green border. Center: stylized
lightning bolt in lighthouse green (#4ade80), 10-pixel stroke, with
soft outer glow. The bolt should be slightly curved, suggesting
action and energy. No text. Clean, technical, modern. No emojis.
```

---

## 5. Datei-Struktur fürs WP.org-SVN-Repo

```
/assets
  banner-772x250.png           ← Plugin-Listing-Banner
  banner-1544x500.png          ← Retina-Variante (optional, empfohlen)
  icon-128x128.png             ← Plugin-Listing-Icon (Standard)
  icon-256x256.png             ← Plugin-Listing-Icon (Retina)
  screenshot-1.png             ← Cards-Grid inaktiv
  screenshot-2.png             ← Code-Preview ausgeklappt
  screenshot-3.png             ← Alle 7 aktiviert
  screenshot-4.png             ← mu-plugin-Files in Site-Health
/trunk
  websitefix-one-click-optimizer.php  ← Main Plugin-File
  uninstall.php
  readme.txt
  /includes
    class-snippet-library.php
    class-optimizer.php
    class-diagnostics.php
    class-admin-page.php
```

`assets/`-Ordner liegt OUTSIDE von `trunk/` — WordPress.org SVN-Convention.

---

## 6. Submission-Checkliste (spezifisch für dieses Plugin)

- [ ] Banner-PNG 772×250 produziert (siehe Sektion 1)
- [ ] Icon-PNG 256×256 produziert (siehe Sektion 2)
- [ ] Screenshots 1–4 produziert (siehe Sektion 3)
- [ ] Plugin-Check lokal grün
- [ ] InstaWP-Test mit allen 7 Fixes — alle aktivierbar/deaktivierbar
- [ ] Critical-Error-Reproduktion mit allen 7 → keiner mehr
- [ ] Hochladen via [wordpress.org/plugins/developers/add/](https://wordpress.org/plugins/developers/add/)
- [ ] Pre-empt-Text für mu-plugins-Schreibrechte in Submission-Form-Description (siehe `wp-org-submission-plan.md` §3.3)
