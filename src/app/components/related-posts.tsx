import Link from "next/link";
import { getRelatedPosts } from "@/lib/blog";

const CATEGORY_COLOR: Record<string, string> = {
  "Recht & WCAG":  "#7aa6ff",
  "BFSG & Recht":  "#7aa6ff",
  SEO:             "#8df3d3",
  Speed:           "#8df3d3",
  Performance:     "#8df3d3",
  Sicherheit:      "#ff6b6b",
  Conversion:      "#c084fc",
  Mobile:          "#ffd93d",
};

function catColor(cat?: string) {
  return cat ? (CATEGORY_COLOR[cat] ?? "#8df3d3") : "#8df3d3";
}

export default function RelatedPosts({ slug, lang = "de" }: { slug: string; lang?: "de" | "en" }) {
  const posts = getRelatedPosts(slug, 4);
  if (!posts.length) return null;

  const title = lang === "en" ? "Related articles" : "Ähnliche Artikel";

  return (
    <section style={{ marginTop: 56, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>
        {title}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {posts.map((post) => {
          const color = catColor(post.frontmatter.category);
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div style={{
                padding: "18px 20px",
                background: "#13151a",
                border: `1px solid ${color}18`,
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${color}, ${color}44)`,
                }} />
                {post.frontmatter.category && (
                  <span style={{
                    display: "inline-block", marginBottom: 10,
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                    background: `${color}14`, color, border: `1px solid ${color}28`,
                    letterSpacing: "0.04em",
                  }}>
                    {post.frontmatter.category}
                  </span>
                )}
                <p style={{
                  margin: "0 0 12px", fontSize: 14, fontWeight: 600,
                  color: "#fff", lineHeight: 1.4, letterSpacing: "-0.01em",
                }}>
                  {post.frontmatter.title}
                </p>
                <span style={{ fontSize: 12, color, fontWeight: 600 }}>Lesen →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
