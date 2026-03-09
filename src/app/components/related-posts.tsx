import Link from "next/link";
import { getRelatedPosts } from "@/lib/blog";

export default function RelatedPosts({
  slug,
  lang = "de",
}: {
  slug: string;
  lang?: "de" | "en";
}) {
  const posts = getRelatedPosts(slug, 4);

  if (!posts.length) return null;

  const title = lang === "en" ? "Related articles" : "Ähnliche Artikel";

  return (
    <section className="relatedSection">
      <h3 className="relatedTitle">
        {title}
      </h3>

      <div className="relatedGrid">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="relatedCard"
          >
            <span className="relatedCardTitle">
              <span className="relatedArrow">→</span>
              {post.frontmatter.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}