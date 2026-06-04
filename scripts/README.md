# scripts/ — Build- und Repo-Tools

## check-blog-frontmatter.mjs

Validiert YAML-Frontmatter aller Blog-Posts unter `content/blog/`. Reproduziert
den Fehler, der den Vercel-Build am 04.06.2026 brach (gemischte deutsche/ASCII-
Anführungszeichen → vorzeitig geschlossener YAML-String → `YAMLException`).

**Manuell ausführen:**
```bash
npm run check:blog
```

**Im Pre-Commit-Hook (siehe unten):** läuft automatisch bei jedem Commit, der
`content/blog/*.md` betrifft.

## Pre-Commit-Hook (einmaliges Setup)

Damit der Frontmatter-Check vor jedem `git commit` läuft (statt erst im
Vercel-Build), brauchst du den Hook unter `.githooks/pre-commit`. Der Hook ist
im Repo versioniert, aber Git nutzt ihn erst nach einem einmaligen Setup:

```bash
git config core.hooksPath .githooks
```

**Verify:**
```bash
git config --get core.hooksPath
# Erwartet: .githooks
```

Ab jetzt:
- `git commit` mit Blog-MD-Änderungen → führt `npm run check:blog` aus
- Falls Frontmatter kaputt → Commit blockt, du fixt
- Commits ohne Blog-MD-Änderungen → kein Overhead

**Bypass im Notfall:** `git commit --no-verify`
(Nicht empfohlen — Vercel wird denselben Fehler werfen.)

## Sonstige Scripts

Siehe `scripts/`-Folder für weitere Hilfsscripts (z.B. `smoketest-pro-agency-checkout.md`,
`test-anon-checkout.md`, etc.).
