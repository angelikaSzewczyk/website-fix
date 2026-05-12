# WordPress.org Plugin-Submission-Plan

**Geltungsbereich:** beide WebsiteFix-Free-Plugins parallel einreichen — **Health Check v0.3.0** + **One-Click Optimizer v0.2.0**.

**Stand:** 2026-05-12. Diese Anleitung ist Stand der WP.org-Submission-Pipeline 2026. Verfahren ändert sich gelegentlich — bei Abweichungen offizielle Doku auf [developer.wordpress.org/plugins/wordpress-org/](https://developer.wordpress.org/plugins/wordpress-org/) konsultieren.

---

## 0. Strategische Entscheidung: parallel statt sequenziell

Zwei Plugins gleichzeitig einreichen — Vorteil:
- **SEO-Effekt im WP.org-Repo:** zwei verlinkte „WebsiteFix"-Listings statt einem
- **Brand-Konsistenz:** identische Banner/Icon-Sprache, doppelter Wiedererkennungswert
- **Review-Pipelining:** beide Reviews laufen parallel; einer hängt, der andere läuft weiter

Risiken:
- Doppelter Korrektur-Aufwand wenn Reviewer Style-Feedback gibt
- Wenn beide gleichzeitig durch sind, doppelter Initial-Marketing-Push nötig

**Empfehlung:** einreichen mit ~24 h Versatz (Optimizer zuerst, Health-Check 24 h später) — Reviewer sieht erste Iteration und kann Feedback auf zweite anwenden.

---

## 1. Pre-Submission — einmalig (Account-Setup)

### 1.1 WP.org-Account
- Account auf [login.wordpress.org](https://login.wordpress.org) erstellen, falls noch nicht da.
- **Username = Contributor-Slug** = wird im Plugin-Listing als „By websitefix" angezeigt.
  - In beiden readme.txts steht bereits `Contributors: websitefix` — Username MUSS dazu passen
  - Falls Username anders ist: entweder readme.txt anpassen ODER Account-Username ändern (geht über WP.org-Profil → Edit)

### 1.2 Plugin-Check installieren (lokal)
Das offizielle Plugin-Check-Plugin ist **Pflicht** vor jeder Submission:

```
https://wordpress.org/plugins/plugin-check/
```

Lokal auf deinem InstaWP installieren, dann beide WebsiteFix-Plugins durchchecken. Plugin-Check meldet:
- Fehler (Submission wird abgelehnt)
- Warnungen (Submission oft ok, aber bessere Vermeidung)
- Hinweise (kosmetisch)

**Erwartung bei unseren Plugins:**
- Health-Check: minimal-Plugin, sollte 0 Errors haben
- Optimizer: könnte Warnungen für das Schreiben in mu-plugins generieren — wir müssen das in der Plugin-Beschreibung **explizit + transparent** erklären (siehe Submission-Form-Felder unten)

### 1.3 Plugin-Versionen final freezen
Vor Submission **nichts mehr** im Code ändern — Reviewer testet exakt diese Versionen.

| Plugin | Submission-Version | Source-Pfad |
|--------|-------------------|-------------|
| Health Check | 0.3.0 | `wp-plugin/free/` |
| One-Click Optimizer | 0.2.0 | `wp-plugin/optimizer/` (nach Erweiterung in Task 17) |

Klare Versions-Diszplin: nach Submission keine Edits in `wp-plugin/free/` oder `wp-plugin/optimizer/`, bis Approval oder Reject + Feedback da ist.

---

## 2. Code-Review-Checks (Pflicht vor Submission)

WP.org-Reviewer prüfen manuell. Was sie ablehnen / Korrektur fordern:

### 2.1 Sicherheit
- [ ] **Output-Escaping:** jeder Output via `esc_html()`, `esc_attr()`, `esc_url()`. Niemals `echo $var` ohne Escape.
- [ ] **Input-Sanitization:** jeder `$_POST`, `$_GET`, `$_REQUEST` via `sanitize_*` oder `wp_unslash` + `sanitize_text_field` (oder spezialisierter).
- [ ] **Nonce-Checks:** jedes Form-Submit hat `wp_nonce_field()` + `check_admin_referer()`.
- [ ] **Capability-Checks:** Admin-only-Actions hinter `current_user_can('manage_options')`.
- [ ] **SQL-Prepared-Statements:** `$wpdb->prepare()` bei Variable in Query (wir haben das im Connector, beide Free-Plugins haben keine eigenen Queries).

### 2.2 Lizenz + Attribution
- [ ] **GPL v2 oder kompatibel** im Plugin-Header + readme.txt
- [ ] **Keine fremde GPL-inkompatible Library bundled** (Health-Check + Optimizer haben keine externen Libraries — gut)
- [ ] **Keine "powered by"-Links auf eigene Website ohne Disclosure** (Marketing-Links sind ok, müssen aber als solche kenntlich sein)

### 2.3 Plugin-Header
- [ ] `Plugin Name`, `Description`, `Version`, `License`, `Text Domain` korrekt gesetzt
- [ ] `Tested up to` matched aktuelle WP-Version (6.7 in 2026)
- [ ] `Requires at least` ist niedrig genug (5.9 ist ok, 6.0+ wäre exklusiv)

### 2.4 readme.txt
- [ ] `Stable tag` ist NICHT „trunk" — muss EINE konkrete Version sein (z.B. `0.3.0`)
- [ ] `Tags` sind max. 5, keyword-relevant, lowercase, hyphen-getrennt
- [ ] Short Description ≤ 150 Zeichen, präzise was das Plugin tut
- [ ] Mindestens 1 Screenshot in `== Screenshots ==` referenziert (auch wenn noch nicht hochgeladen — Reviewer toleriert „coming soon")
- [ ] Changelog mit echter Version-History
- [ ] FAQ mit echten Fragen (nicht „is this plugin good?")

### 2.5 Spezifisch unsere Plugins
- [ ] **Health Check** schreibt nichts → easy zu reviewen
- [ ] **Optimizer** schreibt in `mu-plugins/` → Reviewer wird das hinterfragen. **Pre-empt: in der Plugin-Description explizit erklären:**
  > "Plugin schreibt seine Fix-Snippets in /wp-content/mu-plugins/ (mit Präfix wf-optimizer-). Das ist die WordPress-Standard-Methode für globale Code-Hooks. Plugin-Deinstallation entfernt alle eigenen Dateien automatisch. Es werden keine fremden Dateien angerührt."
- [ ] **Optimizer** hat User-Confirmation vor Apply (haben wir via Button-Klick + die `wp_nonce_field`)

---

## 3. Submission via WP.org-Form

### 3.1 Form-URL
```
https://wordpress.org/plugins/developers/add/
```

### 3.2 Form-Felder

| Feld | Eintrag für Health Check | Eintrag für Optimizer |
|------|--------------------------|----------------------|
| Plugin Name | WebsiteFix Health Check & Deep Audit | WebsiteFix One-Click Performance Optimizer |
| Plugin URL/Slug | `websitefix-health-check` | `websitefix-one-click-optimizer` |
| Plugin Description | aus readme.txt's „== Description ==" (erste 2-3 Absätze) | analog |
| Plugin ZIP | `wp-plugin/dist/websitefix-health-check-v0.3.0.zip` | `wp-plugin/dist/websitefix-one-click-optimizer-v0.2.0.zip` |

### 3.3 Was als Anhang in der Description landen sollte
WP.org-Reviewer mag Transparenz. In der Plugin-Description (nicht im readme.txt sondern im Form-Description-Feld):

> "Hi WordPress.org Plugin-Review-Team,
>
> This is a free, GPL-licensed plugin from our German WordPress diagnostic SaaS [website-fix.com](https://website-fix.com). Both this plugin and our companion plugin "WebsiteFix Health Check" are intended as standalone, self-contained tools — they have no telemetry, no premium upsell that locks features, and no account requirement.
>
> The Optimizer plugin specifically writes its applied fixes to /wp-content/mu-plugins/ (with wf-optimizer- prefix) — this is documented WordPress behavior for must-use plugins. The plugin's uninstall handler removes ONLY its own files (identified by a marker header). Code preview before apply is shown to the user.
>
> The 5 fixes themselves are well-known WordPress optimizations (Heartbeat throttling, XML-RPC disabling, etc.) bundled in one UX-consistent tool with auto-safety-checks for conflicting plugins.
>
> Happy to address any review feedback. Contact: support@website-fix.com"

---

## 4. Review-Phase (5–14 Tage)

### 4.1 Was passiert
- **Tag 1–3:** Auto-Bot prüft ZIP-Struktur, readme.txt-Syntax, Lizenz-Header. Wenn fail → sofortige E-Mail.
- **Tag 3–14:** Human-Reviewer testet manuell. Kann zurückkommen mit:
  - „Approval, Plugin ist live"
  - „Mehrere Iterationen nötig" (Liste mit Code-Issues)
  - „Reject" (selten, üblicherweise nur bei groben Verletzungen wie Crypto-Mining oder GPL-Inkompatibilität)

### 4.2 Häufiges Reviewer-Feedback
Vorbereitet auf:
- „Why does your plugin write files to mu-plugins?" → wir haben die Erklärung in der Description, aber Reviewer kann es nochmal fragen. Standardantwort: „Standard WordPress must-use plugins location for code that must load before regular plugins. We chose this over functions.php editing for safety (theme-update-resistant) and over a regular plugin for guaranteed early-loading."
- „Your plugin includes hardcoded URLs to website-fix.com" → wir haben `WFHC_BASEURL` als Konstante und `wfhc_report_path` für Lead-Capture. Reviewer findet das ok, solange es:
  - Nicht als Telemetrie missbraucht wird (kein automatischer Ping)
  - Im UI klar als Link zur eigenen Site gekennzeichnet ist (haben wir)
- „Add a screenshot before submission" → falls noch keiner da: schreiben „upcoming in next version" — meist toleriert

### 4.3 Iteration-Workflow
Wenn Reviewer eine Korrektur fordert:
1. Code anpassen in `wp-plugin/free/` bzw `wp-plugin/optimizer/`
2. ZIP rebuilden (`dist/websitefix-<plugin>-vX.Y.Z.zip` mit incrementierter Version)
3. Per E-Mail dem Reviewer den neuen ZIP-Anhang schicken — Reply auf die Reviewer-Mail, nicht über das Form erneut einreichen
4. Wartephase repeat

---

## 5. Post-Approval: SVN-Setup

WP.org nutzt **Subversion (SVN)**, kein Git. Pro Plugin gibt's ein SVN-Repo:

```
https://plugins.svn.wordpress.org/websitefix-health-check/
https://plugins.svn.wordpress.org/websitefix-one-click-optimizer/
```

### 5.1 SVN-Client
Auf Windows: [TortoiseSVN](https://tortoisesvn.net/) oder via WSL/Git-Bash:
```bash
svn checkout https://plugins.svn.wordpress.org/websitefix-health-check/ wp-svn-health-check
```

Verzeichnis-Struktur nach Checkout:
```
wp-svn-health-check/
├── trunk/           ← aktueller Stand des Plugins
├── tags/            ← Versions-Archiv (jedes Release = ein Subfolder)
├── branches/        ← praktisch nie verwendet
└── assets/          ← Banner + Icon + Screenshots (NICHT im trunk!)
```

### 5.2 Trunk befüllen
```bash
cd wp-svn-health-check/trunk
cp -r /pfad/zu/wp-plugin/free/* ./
svn add --force *
svn commit -m "Initial release v0.3.0"
```

Wichtig: `Stable tag: 0.3.0` in readme.txt (NICHT „trunk"). WP.org liefert dem User die Version aus, die in `Stable tag` steht — typisch ist das die in `tags/` liegende. Daher dann:

```bash
cd ..  # zurück nach wp-svn-health-check/
svn cp trunk tags/0.3.0
svn commit -m "Tag v0.3.0"
```

### 5.3 Assets befüllen
```bash
cd wp-svn-health-check/assets/
# Banner, Icon, Screenshots hier ablegen (siehe Visual-Briefing)
svn add *
svn commit -m "Add banner, icon, screenshots"
```

Asset-Dateinamen sind STANDARDISIERT — WP.org erkennt sie automatisch:
- `banner-772x250.png` (Standard) + `banner-1544x500.png` (Retina, optional)
- `icon-128x128.png` (Standard) + `icon-256x256.png` (Retina, empfohlen)
- `screenshot-1.png`, `screenshot-2.png`, etc.

### 5.4 Listing-Aktivierung
Nach erstem `svn commit` in `tags/` UND Assets-Upload erscheint das Plugin innerhalb von 30–60 Min auf:
```
https://wordpress.org/plugins/websitefix-health-check/
https://wordpress.org/plugins/websitefix-one-click-optimizer/
```

---

## 6. Update-Workflow (für künftige Versionen)

Wenn du nach Launch v0.3.0 → v0.3.1 (Bug-Fix) oder v0.4.0 (Feature) updaten willst:

1. Code in `wp-plugin/free/` oder `wp-plugin/optimizer/` anpassen
2. Version-Bump in:
   - Plugin-Header (`Version: 0.3.1`)
   - Constant (`WFHC_VERSION` / `WFOCO_VERSION`)
   - readme.txt (`Stable tag: 0.3.1` + neuer Changelog-Block)
3. Dist-ZIP rebuilden
4. SVN-Workflow:
   ```bash
   cd wp-svn-health-check/trunk
   cp -r /pfad/zu/wp-plugin/free/* ./
   svn add --force *  # neue Files
   svn commit -m "Update to v0.3.1"

   cd ..
   svn cp trunk tags/0.3.1
   svn commit -m "Tag v0.3.1"
   ```
5. WP.org propagiert Update an alle Installer innerhalb von ~6 h (auto-update für User mit aktiviertem Auto-Update). Dashboard zeigt „Update verfügbar" innerhalb von 24 h.

---

## 7. Post-Launch-Monitoring

### 7.1 Erste 30 Tage
- **Install-Counter:** WP.org-Stats-Page zeigt Daily-Installs + Active-Installs. Erste 30 Tage typische Range: 50–500 Installs, abhängig von SEO + Marketing.
- **Reviews:** User können 1–5 Sterne geben + Text-Review schreiben. Erste 5 Reviews sind kritisch — wer früh 3-Sterne kassiert, hat schwer aufzuholen.
- **Support-Forum:** Pro Plugin gibt's ein Forum unter `wordpress.org/support/plugin/<slug>/`. **Pflicht:** Threads beantworten innerhalb 24–48 h. WP.org-Algorithmus penalisiert unbeantwortete Threads.

### 7.2 Tools für's Monitoring
- WP.org-Stats: integriert, zeigt Installs + Active-Installs (geschätzt)
- WP-Hive: externer Drittparteien-Tracker, oft präziser
- E-Mail-Benachrichtigungen für neue Reviews + Forum-Threads — im WP.org-Profil aktivieren

### 7.3 Marketing-Push am Launch-Tag
- **Tweet/X-Post** mit Plugin-Banner-Bild + WP.org-Link
- **LinkedIn-Post** für DACH-Agenturen
- **Newsletter** an bestehende WebsiteFix-Lead-Liste
- **Blog-Post** auf website-fix.com — Backlink + SEO-Push
- **Plugin-Listing-SEO:** Title-Tag der WP.org-Page wird über deine readme.txt's „Plugin Name" + Tags generiert. Daher sind die Tags hochrelevant.

---

## 8. Spezifische Check-Listen pro Plugin

### 8.1 Health Check v0.3.0 — Submission-Checkliste
- [ ] `wp-plugin/free/websitefix-health-check.php` Plugin-Header zeigt `Version: 0.3.0`
- [ ] `wp-plugin/free/readme.txt` zeigt `Stable tag: 0.3.0`
- [ ] Plugin-Check lokal grün
- [ ] InstaWP-Test: alle 5 Kennzahlen rendern korrekt
- [ ] Banner 772×250 PNG vorbereitet
- [ ] Icon 256×256 PNG vorbereitet
- [ ] Screenshot 1 (Dashboard-Widget) vorbereitet
- [ ] Description-Text für Submission-Form geschrieben (Form akzeptiert Markdown — kann readme.txt's Description sein)

### 8.2 One-Click Optimizer v0.2.0 — Submission-Checkliste
- [ ] `wp-plugin/optimizer/websitefix-one-click-optimizer.php` zeigt `Version: 0.2.0`
- [ ] `wp-plugin/optimizer/readme.txt` zeigt `Stable tag: 0.2.0`
- [ ] Plugin-Check lokal grün
- [ ] Snippet-Library hat alle 7 Snippets (5 original + 2 neue aus Task 17)
- [ ] InstaWP-Test: alle 7 Fixes aktivierbar + deaktivierbar
- [ ] InstaWP-Test: Critical-Error-Reproduktion mit allen 7 → keiner mehr
- [ ] Banner 772×250 PNG vorbereitet
- [ ] Icon 256×256 PNG vorbereitet
- [ ] Screenshot 1 (Cards-Grid) + Screenshot 2 (Code-Preview ausgeklappt) vorbereitet
- [ ] **Description Pre-empt-Text** für mu-plugins-Schreibrechte (siehe Abschnitt 3.3)

---

## 9. Realistischer Zeitplan

| Phase | Dauer | Was passiert |
|-------|-------|--------------|
| Vorbereitung (Visuals + Plugin-Check) | 1–2 Tage | Banner/Icon/Screenshots erstellen, Plugin-Check beheben |
| Submission selbst | 30 Min | Form ausfüllen, ZIP hochladen, beide Plugins |
| Auto-Bot-Check | 1–3 Tage | Automatische Validierung |
| Human-Review | 3–14 Tage | Manueller Review-Pass, evtl. Iteration |
| Approval | sofort danach | E-Mail mit SVN-Credentials |
| SVN-Setup + Assets-Upload | 30–60 Min | Trunk, Tag, Assets pushen |
| Listing geht live | 30–60 Min | URL erreichbar, im Plugin-Repo durchsuchbar |
| Erste Installs | sofort | WP.org-Search-Index braucht ~24 h für volle Indexierung |

**Realistisch von „heute" bis „live":** 7–18 Tage, üblicherweise 10–12.

---

## 10. Häufige Anfänger-Fehler vermeiden

- **`Stable tag: trunk`** statt konkreter Version → WP.org liefert die `trunk`-Files aus. Funktioniert, aber das Tag-Ökosystem ist dann obsolete. Immer auf konkrete Version setzen.
- **ZIP enthält Subfolder mit Plugin-Slug** (z.B. ZIP enthält `websitefix-health-check/websitefix-health-check.php`) → WP.org erwartet das. WordPress-Admin-Upload entpackt richtig.
- **ZIP enthält Plugin-Files DIREKT** (ohne Subfolder) → WordPress-Admin-Upload entpackt in falschen Ordner. UNBEDINGT mit Subfolder packen.
- **Eigene Plugin-Updates ohne Tag** im SVN → Auto-Update-Mechanismus von WordPress funktioniert nicht zuverlässig.
- **Forum-Threads nicht beantworten** → WP.org-Algo penalisiert.
- **Code-Edits direkt im SVN trunk ohne Tag** → wer noch v0.3.0 installiert hat, bekommt nicht den Update, weil `Stable tag` nicht stimmt.

---

## 11. Notfall-Plan: Rejection

Falls Reviewer ein Plugin ablehnt (selten):
1. Genau lesen, was bemängelt wird — meist sehr spezifisch
2. **NICHT** versuchen, das Plugin neu einzureichen ohne die Korrektur — wird wieder abgelehnt + dauert länger
3. Code anpassen, Plugin-Check nochmal laufen, dann Antwort per E-Mail
4. Bei grundsätzlichen Problemen (z.B. „Plugin schreibt Dateien" wird mehrfach abgelehnt) → Plugin-Architektur überdenken, NICHT mit dem Reviewer in eine Streiterei einsteigen

---

## 12. Nach Listing — was die nächsten Sprints sind

Nicht in diesem Doc, aber als Wegmarker:
- **Sprint A:** Reviews + Forum-Threads beantworten (erste 30 Tage)
- **Sprint B:** SEO-Optimierung der WP.org-Listings (Tags-Refinement nach Search-Volume-Daten)
- **Sprint C:** Erste Update-Iterationen (v0.3.1, v0.2.1) auf User-Feedback-Basis
- **Sprint D:** Cross-Linking — beide Plugin-Listings haben Author-Links zu website-fix.com, sollten zueinander linken
- **Sprint E:** Funnel-Tracking — Plugin → Smart-Fix-Library → Dashboard-Signup, Conversion messen
