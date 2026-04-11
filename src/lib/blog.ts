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
    const arr = v
      .split(/[,|]/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return arr.length ? arr : undefined;
  }

  return undefined;
}

function scoreRelatedness(current: BlogPost, candidate: BlogPost): number {
  let score = 0;

  const currentCategory = current.frontmatter.category?.toLowerCase().trim();
  const candidateCategory = candidate.frontmatter.category?.toLowerCase().trim();

  if (currentCategory && candidateCategory && currentCategory === candidateCategory) {
    score += 4;
  }

  const currentTags = new Set(
    (current.frontmatter.tags ?? []).map((tag) => tag.toLowerCase().trim())
  );
  const candidateTags = (candidate.frontmatter.tags ?? []).map((tag) =>
    tag.toLowerCase().trim()
  );

  for (const tag of candidateTags) {
    if (currentTags.has(tag)) score += 2;
  }

  const currentWords = new Set(current.slug.toLowerCase().split("-"));
  const candidateWords = candidate.slug.toLowerCase().split("-");

  for (const word of candidateWords) {
    if (currentWords.has(word)) score += 1;
  }

  return score;
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

    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;

    return tb - ta;
  });
}

export function getPostsByTag(tag: string, limit?: number): BlogPost[] {
  const all = getAllPosts();
  const filtered = all.filter(p =>
    (p.frontmatter.tags ?? []).some(t => t.toLowerCase() === tag.toLowerCase())
  );
  return limit ? filtered.slice(0, limit) : filtered;
}

export function getRelatedPosts(currentSlug: string, limit = 4): BlogPost[] {
  const posts = getAllPosts();
  const currentPost = posts.find((post) => post.slug === currentSlug);

  if (!currentPost) {
    return posts.filter((post) => post.slug !== currentSlug).slice(0, limit);
  }

  return posts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => ({
      post,
      score: scoreRelatedness(currentPost, post),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}