import Link from "next/link";
import { getRelatedPosts } from "@/lib/blog";

export default function RelatedPosts({ slug, lang = "de" }: { slug: string; lang?: "de" | "en" }) {
  const posts = getRelatedPosts(slug, 4);
  if (!posts.length) return null;

  const title = lang === "en" ? "Related articles" : "Ähnliche Artikel";

  return (
    <section style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
        {title}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{
              display: "block",
              padding: "14px 16px",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8,
              textDecoration: "none",
              color: "rgba(255,255,255,0.65)",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "#8df3d3", marginRight: 8, fontSize: 12 }}>→</span>
            {post.frontmatter.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
