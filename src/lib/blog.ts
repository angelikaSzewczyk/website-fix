// src/lib/blog.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string; // ISO recommended: "2026-02-10"
  category?: string;
  tags?: string[];
};

export type BlogPost = {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
};

function toStringOrEmpty(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeTags(v: unknown): string[] | undefined {
  if (!v) return undefined;

  if (Array.isArray(v)) {
    const arr = v
      .map((x) => toStringOrEmpty(x).trim())
      .filter(Boolean);
    return arr.length ? arr : undefined;
  }

  if (typeof v === "string") {
    // allows "a, b, c" OR "a|b|c"
    const arr = v
      .split(/[,|]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return arr.length ? arr : undefined;
  }

  return undefined;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"));

  const posts: BlogPost[] = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const filePath = path.join(BLOG_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    const title = toStringOrEmpty((data as any).title);
    const description = toStringOrEmpty((data as any).description);
    const date = toStringOrEmpty((data as any).date);
    const categoryRaw = (data as any).category;
    const category =
      typeof categoryRaw === "string" && categoryRaw.trim()
        ? categoryRaw.trim()
        : undefined;

    const tags = normalizeTags((data as any).tags);

    return {
      slug,
      frontmatter: {
        title: title || slug.replace(/-/g, " "),
        description,
        date,
        category,
        tags,
      },
      content,
    };
  });

  return posts.sort((a, b) => {
    const ta = Date.parse(a.frontmatter.date);
    const tb = Date.parse(b.frontmatter.date);
    // invalid dates go last
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return tb - ta;
  });
}
