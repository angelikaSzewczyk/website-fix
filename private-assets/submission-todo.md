# Submission-TODO — Stand 2026-05-12 abends

**Tagesleistung 12.05.:**
- Optimizer-ZIP bei WP.org hochgeladen (14:30 UTC) mit Pre-Empt-Text
- WP-Bridge Dead-Code aus White-Label-Settings entfernt (-194 Zeilen)
- SEO-Cluster Post #2 „XML-RPC deaktivieren" geschrieben (~2.000 Wörter, 11 Sektionen, HowTo-Schema) + Thumbnail eingebunden
- xmlrpc-disable-Snippet bekam blogPost-Outbound-Verknüpfung in der Library

**Für morgen + die nächsten Tage:**

---

## Phase 1 — Morgen früh (13.05.)

- [ ] **Bestätigungs-Mail von WordPress.org checken** ("Plugin submission received")
  - Sollte über Nacht oder morgen früh eintreffen
  - Mail-Subject typisch: "[WordPress Plugin Directory] Plugin submission received"
- [ ] **Bestätigung notieren**: Submission-ID + Datum/Uhrzeit irgendwo speichern

---

## Phase 2 — In ~24 Stunden (13.05. ab 14:30 UTC)

- [ ] **Health-Check einreichen** via [wordpress.org/plugins/developers/add/](https://wordpress.org/plugins/developers/add/)
  - ZIP: `wp-plugin/dist/websitefix-health-check-v0.4.0.zip` (15 KB)
  - Pre-Empt-Text fürs „Weitere Informationen"-Feld liegt in deinem Chat-Verlauf (oder rückwärts scrollen — wurde mit dem Optimizer-Text zusammen geliefert)
- [ ] **Zweite Bestätigungs-Mail abwarten + notieren**

---

## Phase 3 — Review-Wartezeit (5–14 Tage, async)

- [ ] **Inbox checken** auf `support@website-fix.com` (oder deine Plugin-Account-Mail)
  - Mögliche Mails vom Review-Team:
    - "Approval" → weiter zu Phase 4
    - "Iteration needed" → Liste mit Korrekturen, dann Code-Fix + Re-Send per E-Mail-Reply
    - "Rejection" → sehr selten, dann gemeinsam überlegen
- [ ] **NICHT** nachfragen oder mehrfach einreichen — Reviewer arbeiten First-In-First-Out durch eine Warteschlange

**Was du in der Zwischenzeit machen kannst — Sprint-Backlog für die Wartezeit:**

1. **SEO-Cluster Post #2 schreiben** — „XML-RPC deaktivieren in WordPress" (1.800-2.200 Wörter). Outline bereits fertig in `private-assets/blog-outlines/xmlrpc-deaktivieren-outline.md` (Master-Template mit 11 Sektionen, Defense-in-Depth-USP, Anchor-Pool, HowTo-Schema-Plan). Aufwand: ~2-3h. Output: neuer Markdown-Post unter `content/blog/xmlrpc-deaktivieren-wordpress.md` mit Frontmatter + HowTo-Schema + Smart-Fix-Library-Cluster-Link.

2. **WP.org-Profil befüllen** — Bio (1-2 Sätze auf deutsch + englisch, was WebsiteFix macht), Avatar (kann unser Plugin-Icon sein oder ein anderes Logo), Link zu website-fix.com. Wird im Plugin-Listing als „By websitefix" angezeigt → first-impression-relevant. Aufwand: ~15-20 Min.

3. **Distribution-Strategie weiterbauen** — 20-DACH-Agenturen-Outreach gemäß `todo_distribution_strategy.md`. Mail-Template + Liste der ersten 20 Ziel-Agenturen + 1 personalisierter Outreach pro Woche. Aufwand: 2-3h initial, dann 30 Min/Woche.

Reihenfolge: nach der Pause. Wenn ein anderer Sprint Vorrang bekommt — sag Bescheid.

---

## Phase 4 — Nach Approval (pro Plugin separat)

WP.org schickt eine Mail mit SVN-Credentials. Sobald die erste da ist:

- [ ] **SVN-Client installieren** falls noch nicht da
  - Windows: [TortoiseSVN](https://tortoisesvn.net/) oder via Git-Bash/WSL
- [ ] **Lokale Submission-Ordner anlegen** (siehe `asset-checklist.md` §1)
- [ ] **Assets in Standard-Namen umbenennen** (siehe `asset-checklist.md` §2)
- [ ] **PNG-Optimierung** via [TinyPNG.com](https://tinypng.com/) für alle 8 Assets
- [ ] **SVN-Workflow** pro Plugin (siehe `asset-checklist.md` §4):
  - [ ] Repo auschecken
  - [ ] trunk/ befüllen + commit
  - [ ] tag v0.x.y setzen + commit
  - [ ] assets/ befüllen + commit
- [ ] **Listing-Page verifizieren** unter `https://wordpress.org/plugins/<slug>/` (30-60 Min nach letztem Commit live)
- [ ] **Banner + Icon Sichtbarkeit checken** — wenn nicht angezeigt: Dateinamen-Tippfehler im /assets/-Ordner

---

## Phase 5 — Launch-Tag (sobald beide live)

- [ ] **Cross-Linking**: in beiden Plugin-Listings die "Author"-Sektion auf website-fix.com verlinken
- [ ] **Announcement vorbereiten**:
  - Tweet/X-Post mit Plugin-Banner-Bild + WP.org-Link
  - LinkedIn-Post (DACH-Agentur-Fokus)
  - Newsletter an bestehende WebsiteFix-Lead-Liste
  - Optional: Blog-Post auf website-fix.com mit Backlink
- [ ] **Plugin-Listing-Tags optimieren** falls erste Such-Daten zeigen, dass bestimmte Tags besser performen

---

## Phase 6 — Erste 30 Tage Post-Launch

- [ ] **Reviews-Tab beobachten** — erste 5 Reviews sind kritisch für die Algorithmen-Position
- [ ] **Support-Forum-Threads beantworten** innerhalb 24-48 h
  - Forum-URLs:
    - `https://wordpress.org/support/plugin/websitefix-one-click-optimizer/`
    - `https://wordpress.org/support/plugin/websitefix-health-check/`
- [ ] **WP.org-Stats checken** wöchentlich (Daily Installs + Active Installs)
  - Stats-URL: `https://wordpress.org/plugins/<slug>/advanced/`
- [ ] **Conversion-Funnel messen**: wie viele Plugin-Installs werden zu Lead-Captures + Subscription-Conversions?
  - Tracking via UTM-Param `utm_source=wp-plugin` ist bereits in beiden Plugins eingebaut

---

## Bei Reviewer-Feedback — Iteration-Workflow

Wenn der Reviewer Korrektur fordert:

1. Mail genau lesen, was bemängelt wird
2. Code anpassen in `wp-plugin/free/` bzw. `wp-plugin/optimizer/`
3. Version-Bump (Stable tag + Plugin-Header + Constant)
4. ZIP rebuilden
5. **Per E-Mail-Reply** dem Reviewer den neuen ZIP-Anhang schicken — NICHT erneut über das Form einreichen
6. Wartephase repeat

Das Iterations-Workflow ist in `wp-org-submission-plan.md` §4.3 detailliert.

---

## Wichtige Files für den Submission-Marathon

| Dokument | Wofür |
|----------|-------|
| `private-assets/wp-org-submission-plan.md` | Master-Doku, alle Phasen + häufige Fehler |
| `private-assets/asset-checklist.md` | SVN-Upload-Schritt-für-Schritt-Anleitung |
| `private-assets/ai-image-prompts.md` | Falls Banner/Icon nachträglich nochmal neu generiert werden müssen |
| `private-assets/plugin-free/visual-briefing.md` | Health-Check Visual-Spec |
| `private-assets/plugin-optimizer/visual-briefing.md` | Optimizer Visual-Spec |
| Dieses Dokument | Living-TODO bis Launch |

---

## Notfall-Kontakte

- Reviewer-Feedback geht an `plugins@wordpress.org`
- Antworte direkt auf die Reviewer-Mail (Reply-to bleibt in WP.org-System)
- Bei eskalierenden Problemen: WordPress-Slack `#pluginreview`-Channel
