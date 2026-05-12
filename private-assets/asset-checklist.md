# Submission-Asset-Checkliste — Spickzettel für SVN-Upload

**Stand 2026-05-12.** Beide Plugins haben alle Pflicht-Assets bereit. Diese Datei ist deine Schritt-für-Schritt-Anleitung für den Moment, in dem WP.org dir SVN-Credentials gibt (nach erfolgreichem Review).

---

## 1. Lokale Datei-Struktur — bevor du SVN anfasst

Lege auf deinem Rechner zwei Ordner an, einer pro Plugin:

```
~/Submissions/
├── websitefix-health-check/
│   ├── assets/                       ← geht in SVN /assets/ (NICHT trunk)
│   │   ├── banner-772x250.png        ← Health-Check Banner v3 (Pflicht)
│   │   ├── banner-1544x500.png       ← Retina-Variante (optional, empfohlen)
│   │   ├── icon-256x256.png          ← Retina (empfohlen)
│   │   ├── icon-128x128.png          ← Standard (Pflicht)
│   │   └── screenshot-1.png          ← Widget-Live-Daten 1280×800
│   └── trunk/                        ← geht in SVN /trunk/
│       ├── websitefix-health-check.php
│       ├── readme.txt
│       └── includes/
│           ├── class-dashboard-widget.php
│           └── class-quick-check.php
│
└── websitefix-one-click-optimizer/
    ├── assets/
    │   ├── banner-772x250.png        ← Bolt-Gradient Banner #1 (Pflicht)
    │   ├── banner-1544x500.png       ← Retina (optional)
    │   ├── icon-256x256.png          ← Retina (empfohlen)
    │   ├── icon-128x128.png          ← Standard (Pflicht)
    │   └── screenshot-1.png          ← 7-Cards-Grid 1280×800
    └── trunk/
        ├── websitefix-one-click-optimizer.php
        ├── uninstall.php
        ├── readme.txt
        └── includes/
            ├── class-snippet-library.php
            ├── class-optimizer.php
            ├── class-diagnostics.php
            └── class-admin-page.php
```

**Wichtig:** die `assets/`- und `trunk/`-Ordner sind GETRENNT — `assets/` landet im SVN-Root außerhalb von trunk. WordPress.org erwartet diese Trennung.

---

## 2. Datei-Renaming-Mapping (von Download-Namen zu SVN-Namen)

Wenn du die AI-generierten + InstaWP-Screenshots in den Submission-Ordner kopierst, benenne sie EXAKT um — WP.org erkennt sie nur unter Standard-Namen.

### Health-Check
| Quelle (Download oder Screenshot) | → SVN-Name |
|-----------------------------------|------------|
| `Gemini_Generated_..._banner-v3...` | `banner-772x250.png` |
| Gleicher Banner in 1544×500 (falls separat generiert) | `banner-1544x500.png` |
| `Gemini_Generated_..._icon-3...` (256×256) | `icon-256x256.png` |
| Downsized auf 128×128 | `icon-128x128.png` |
| InstaWP Dashboard-Widget Screenshot (1280×800) | `screenshot-1.png` |

### Optimizer
| Quelle | → SVN-Name |
|--------|------------|
| `Gemini_Generated_..._bolt-banner-1...` | `banner-772x250.png` |
| Gleicher Banner in 1544×500 | `banner-1544x500.png` |
| `Gemini_Generated_..._bolt-icon...` (256×256) | `icon-256x256.png` |
| Downsized auf 128×128 | `icon-128x128.png` |
| InstaWP Optimizer-Tools-Page (7 Cards) Screenshot (1280×800) | `screenshot-1.png` |

---

## 3. Pre-Upload-Last-Mile-Checks

Bevor du SVN anfasst, pro Asset einmal durchgehen:

### Banner (alle 4 Dateien)
- [ ] PNG-Format (nicht JPG)
- [ ] Exakt 772×250 bzw. 1544×500
- [ ] ≤ 200 KB pro Datei (durch TinyPNG.com)
- [ ] Kein offizielles WordPress-Logo enthalten
- [ ] Keine Spelling-Fehler oder kaputten Text-Glyphen

### Icons (alle 4 Dateien)
- [ ] PNG-Format mit transparentem ODER schwarzem Background
- [ ] Exakt 256×256 bzw. 128×128
- [ ] Bei 128×128 noch erkennbar (zoom-test im Browser-Tab)
- [ ] ≤ 50 KB pro Datei

### Screenshots (2 Dateien)
- [ ] PNG-Format
- [ ] 1280×800 oder ähnliche Ratio (~16:10)
- [ ] Echte Daten, keine Lorem-Ipsum-Mockups
- [ ] ≤ 500 KB pro Datei

### Code (trunk-Ordner)
- [ ] `Stable tag: 0.4.0` in Health-Check `readme.txt`
- [ ] `Stable tag: 0.3.0` in Optimizer `readme.txt`
- [ ] `Plugin-Check`-Lauf grün (0 Errors, 0 Warnings)

---

## 4. SVN-Workflow (nach Approval-E-Mail)

Du bekommst von WP.org eine Mail mit dem SVN-URL pro Plugin:
```
https://plugins.svn.wordpress.org/websitefix-health-check/
https://plugins.svn.wordpress.org/websitefix-one-click-optimizer/
```

### Schritt-für-Schritt für JEDES Plugin

**a) Repo auschecken** (einmalig)
```bash
svn checkout https://plugins.svn.wordpress.org/websitefix-health-check/ wp-svn-health-check
cd wp-svn-health-check
```

Du siehst leere `trunk/`, `tags/`, `branches/`-Ordner.

**b) trunk befüllen**
```bash
cp -r ~/Submissions/websitefix-health-check/trunk/* trunk/
cd trunk
svn add --force *
svn commit -m "Initial release v0.4.0"
```

**c) Tag setzen**
```bash
cd ..  # zurück nach wp-svn-health-check/
svn cp trunk tags/0.4.0
svn commit -m "Tag v0.4.0"
```

**d) Assets befüllen**
```bash
cp -r ~/Submissions/websitefix-health-check/assets/* assets/
cd assets
svn add *
svn commit -m "Add banner, icon, screenshots"
```

**e) Verifikation**
30–60 Min nach dem letzten Commit ist deine Plugin-Listing-Page live unter:
- `https://wordpress.org/plugins/websitefix-health-check/`
- `https://wordpress.org/plugins/websitefix-one-click-optimizer/`

Banner + Icon werden in der Listing-Page-Sidebar oben rechts angezeigt. Screenshots im Tab „Screenshots".

---

## 5. Häufige SVN-Fehler vermeiden

- **`svn: E155007`** = Verzeichnis ist kein Working Copy → Du hast nicht im richtigen Ordner gearbeitet, `cd` zurück zum Repo-Root.
- **`svn add` zeigt Files nicht an** → Du hast `*` aus einem Ordner gemacht, der schon versioniert war. Mit `svn status` checken was nicht versioniert ist (`?` davor).
- **Banner erscheint nicht im Listing** → Dateiname ist nicht exakt `banner-772x250.png` (Bindestriche, Kleinbuchstaben, keine Leerzeichen). Oder Assets liegen versehentlich in `trunk/assets/` statt `/assets/` auf Repo-Root.
- **Plugin-Update wird nicht propagiert** → `Stable tag` in readme.txt wurde nicht angepasst. WP.org liefert Updates IMMER nach dem `Stable tag`, NICHT nach dem Tag-Ordner.

---

## 6. Letzte Sanity-Checks vor SVN-Commit

```bash
# Im trunk/-Ordner pro Plugin:
grep -E "^(Version:|Stable tag:)" *.php readme.txt
```

Erwartete Ausgabe Health-Check:
```
websitefix-health-check.php: * Version:           0.4.0
readme.txt:Stable tag: 0.4.0
```

Erwartete Ausgabe Optimizer:
```
websitefix-one-click-optimizer.php: * Version:           0.3.0
readme.txt:Stable tag: 0.3.0
```

Stimmen die nicht → erst fixen, DANN committen.

---

## 7. Asset-Ursprung (für deine eigenen Records)

Falls du später ein Asset neu generieren musst:

| Asset | Erstellt mit | Prompt-Quelle |
|-------|--------------|---------------|
| Health-Check Banner v3 | Gemini Imagen 3 | `private-assets/ai-image-prompts.md` §1 + Fix-Iteration (custom W statt WP-Logo) |
| Health-Check Icon | Gemini Imagen 3 | `ai-image-prompts.md` §2 |
| Health-Check Screenshot | InstaWP-Browser, `/wp-admin/index.php` | Live Plugin-Output |
| Optimizer Banner #1 | Gemini Imagen 3 | `ai-image-prompts.md` §3 |
| Optimizer Icon | Gemini Imagen 3 | `ai-image-prompts.md` §4 |
| Optimizer Screenshot | InstaWP-Browser, `/wp-admin/tools.php?page=websitefix-one-click-optimizer` | Live Plugin-Output |

---

## 8. After-Launch (in den ersten 30 Tagen)

- WP.org-Stats-Page besuchen: `https://wordpress.org/plugins/<slug>/advanced/` zeigt Daily Installs + Active Installs
- Support-Forum-Threads beantworten innerhalb 24–48 h (WP.org-Algo penalisiert unbeantwortete Threads)
- Reviews-Tab beobachten — die ersten 5 Reviews sind kritisch
- Bei kritischem Reviewer-Feedback nach Launch: Update vorbereiten, neue Version-Tag setzen via SVN-Workflow §4

---

## 9. Optional: zweite Plugin-Submission zeitversetzt

Wir hatten empfohlen, Optimizer und Health-Check **nicht gleichzeitig** einzureichen — sondern mit 24 h Versatz. Dann sieht der Reviewer die erste Iteration und kann sein Feedback auf die zweite anwenden. Spart Korrektur-Schleifen.

**Reihenfolge:**
1. **Optimizer zuerst** einreichen (komplexer, hat mu-plugins-Schreibrechte — Reviewer-Feedback dort wahrscheinlicher)
2. 24 h warten
3. **Health-Check** einreichen (einfacher, read-only, sollte schneller durch)

Bei beiden im Submission-Form-Description-Feld der Pre-Empt-Text aus `wp-org-submission-plan.md §3.3` rein.

---

**Ready. Viel Erfolg.**
