import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/blog";

export const runtime = "nodejs"; // wichtig: fs läuft nur in node runtime

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "3");

  const posts = getAllPosts()
    .slice(0, Number.isFinite(limit) ? limit : 3)
    .map((p) => ({
      slug: p.slug,
      frontmatter: {
        title: p.frontmatter.title,
        description: p.frontmatter.description,
        date: p.frontmatter.date,
        category: p.frontmatter.category ?? null,
        tags: (p.frontmatter as any).tags ?? [], // falls du tags hast
      },
    }));

  return NextResponse.json({ posts });
}
