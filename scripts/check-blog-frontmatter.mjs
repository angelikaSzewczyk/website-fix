#!/usr/bin/env node
/**
 * check-blog-frontmatter.mjs
 *
 * Validiert jedes .md-File unter content/blog/ über gray-matter (denselben
 * YAML-Parser, den Next.js beim Build verwendet). Reproduziert den
 * YAMLException-Fehler, der den Vercel-Build am 04.06.2026 brach (gemischte
 * deutsche/ASCII-Anführungszeichen → vorzeitig geschlossener YAML-String).
 *
 * Aufruf: node scripts/check-blog-frontmatter.mjs
 * Exit-Code: 0 = alle Posts clean, 1 = mindestens ein Post broken
 *
 * Wird aufgerufen von:
 *   - .git/hooks/pre-commit (siehe scripts/install-pre-commit.sh)
 *   - npm run check:blog
 */

import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname  = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR   = join(__dirname, "..", "content", "blog");
const FAIL_ICON  = "FAIL";
const OK_ICON    = "OK  ";

async function main() {
  let files;
  try {
    files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith(".md"));
  } catch (err) {
    console.error(`[check-blog] Konnte ${BLOG_DIR} nicht lesen:`, err.message);
    process.exit(2);
  }

  const failures = [];

  for (const file of files) {
    const path = join(BLOG_DIR, file);
    try {
      const raw = await readFile(path, "utf8");
      // gray-matter wirft synchron bei YAML-Parse-Errors — das ist genau das
      // Verhalten, das Vercel im Build trifft und mit YAMLException abbricht.
      // Wir reproduzieren das hier 1:1, ohne zusätzliche Field-Required-Checks
      // (der Loader in src/lib/blog-loader.ts macht selbst keine harten
      // Required-Asserts, also wäre eine strengere Prüfung hier nur Lärm).
      matter(raw);
      console.log(`${OK_ICON} ${file}`);
    } catch (err) {
      failures.push({ file, reason: err.message });
      console.error(`${FAIL_ICON} ${file}`);
      // YAMLException liefert line/column im err — wenn vorhanden, hervorheben
      const lineHint = err.mark
        ? ` (Zeile ${err.mark.line + 1}, Spalte ${err.mark.column + 1})`
        : "";
      console.error(`     ${err.message.split("\n")[0]}${lineHint}`);
      console.error(`     Häufige Ursachen: gemischte „...\\" (deutsch öffnend + ASCII schließend),`);
      console.error(`     fehlender Frontmatter-Separator ---, Apostroph in single-quoted String.`);
    }
  }

  console.log("");
  if (failures.length) {
    console.error(`[check-blog] ${failures.length} von ${files.length} Posts haben Frontmatter-Probleme.`);
    console.error(`[check-blog] Vercel würde an genau diesen Files den Build abbrechen.`);
    process.exit(1);
  } else {
    console.log(`[check-blog] Alle ${files.length} Blog-Posts haben gültiges Frontmatter.`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[check-blog] Unerwarteter Fehler:", err);
  process.exit(2);
});
