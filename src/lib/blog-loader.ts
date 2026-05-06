/**
 * blog-loader.ts — Single Source für Blog-Frontmatter-Lookups.
 *
 * Liest alle Markdown-Dateien aus content/blog beim Build (server-side fs).
 * Wird von / und /fuer-agenturen für die Logbook-Teaser konsumiert.
 *
 * Kategorien (siehe content/blog/*.md frontmatter `category`):
 *   - "agency"      → Posts für Agentur-Inhaber (Skalierung, White-Label,
 *                     Wartungsverträge, BFSG-Haftung)
 *   - "wordpress"   → WP-Notfall-Themen (Critical Error, weiße Seite,
 *                     Hack, Login kaputt) — End-User
 *   - "performance" → Speed-, Core-Web-Vitals-Themen — End-User
 *   - "seo"         → Sichtbarkeit, Google-Findbarkeit — End-User
 *   - "compliance"  → DSGVO, BFSG für Endkunden — End-User
 *
 * Filter-Regel für die Pages:
 *   /              → ALLE außer "agency" (End-User-Audience)
 *   /fuer-agenturen → NUR "agency" (Inhaber-Audience)
 *
 * Bei Datei-Fehlern oder kaputter Frontmatter: stumm überspringen, KEIN Crash.
 * Caller fällt dann auf statischen Default zurück.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type PostMeta = {
  slug:        string;
  title:       string;
  description: string;
  category:    string;
  date:        string;        // ISO YYYY-MM-DD
};

const BLOG_DIR = path.join(process.cwd(), "content/blog");

/** Liest alle .md aus content/blog, gibt sortiertes Array (date desc) zurück. */
export function loadAllPosts(): PostMeta[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".md"));
  } catch { return []; }

  const posts: PostMeta[] = [];
  for (const file of files) {
    try {
      const slug = file.replace(/\.md$/, "");
      const fileContent = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data } = matter(fileContent);
      if (typeof data.title !== "string" || typeof data.date !== "string") continue;
      posts.push({
        slug,
        title:       data.title,
        description: typeof data.description === "string" ? data.description : "",
        category:    typeof data.category    === "string" ? data.category.toLowerCase() : "wordpress",
        date:        data.date,
      });
    } catch { /* skip kaputte Datei */ }
  }

  // Date-desc sort — neueste zuerst
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

/** Jüngster Post für End-User — alle Kategorien AUSSER "agency".
 *  Wird auf der Homepage / im Logbook-Teaser angezeigt. */
export function getLatestEndUserPost(): PostMeta | null {
  const posts = loadAllPosts().filter(p => p.category !== "agency");
  return posts[0] ?? null;
}

/** Jüngster Post für Agentur-Inhaber — Kategorie "agency".
 *  Wird auf /fuer-agenturen im Experten-Logbuch angezeigt. */
export function getLatestAgencyPost(): PostMeta | null {
  const posts = loadAllPosts().filter(p => p.category === "agency");
  return posts[0] ?? null;
}

/** UI-Theme pro Kategorie-Badge — KEEP SYNCED mit der categoryTheme-Funktion
 *  in src/app/page.tsx (wenn der dort später ausgelagert wird, hier
 *  importieren statt duplizieren). */
export function categoryTheme(category: string): { label: string; color: string; bg: string; border: string } {
  switch (category.toLowerCase()) {
    case "agency":      return { label: "Agentur · Skalierung",  color: "#10B981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.30)"  };
    case "performance": return { label: "Hosting · Speed",        color: "#22d3ee", bg: "rgba(34,211,238,0.12)",  border: "rgba(34,211,238,0.30)"  };
    case "seo":         return { label: "Google · Sichtbarkeit",  color: "#7aa6ff", bg: "rgba(122,166,255,0.12)", border: "rgba(122,166,255,0.30)" };
    case "wordpress":   return { label: "WordPress · Notfall",    color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.30)"  };
    case "compliance":  return { label: "Recht · Compliance",     color: "#c084fc", bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.30)" };
    default:            return { label: "Experten-Wissen",        color: "#7aa6ff", bg: "rgba(122,166,255,0.12)", border: "rgba(122,166,255,0.20)" };
  }
}
