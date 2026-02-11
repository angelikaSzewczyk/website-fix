import Link from "next/link";
import { getAllPosts } from "@/lib/blog";


import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Praktische Guides zu Website-Problemen: Form, Speed, Mobile, Tracking & Conversion.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className="page">
      <div className="pageHead">
        <h1 className="h1">Blog</h1>
        <p className="lead">
          Kurze, praktische Fix-Guides — damit du weniger Bugs hast und mehr Anfragen bekommst.
        </p>
      </div>

      <div className="blogGrid">
        {posts.map((p) => {
          const fm = p.frontmatter;
          return (
            <article key={p.slug} className="blogCard">
              <div className="blogMetaRow">
                {fm.category ? <span className="chip chipStrong">{fm.category}</span> : null}
                <time className="mutedSmall" dateTime={fm.date}>
                  {fm.date}
                </time>
              </div>

              <h2 className="blogTitle">
                <Link className="blogLink" href={`/blog/${p.slug}`}>
                  {fm.title}
                </Link>
              </h2>

              <p className="blogDesc">{fm.description}</p>

              <div className="blogTags">
                {(fm.tags ?? []).slice(0, 4).map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>

              <div className="blogCardFooter">
                <Link className="readMore" href={`/blog/${p.slug}`}>
                  Weiterlesen →
                </Link>

                <Link className="ghostBtn" href="/#fixes">
                  Fix auswählen
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="pageFooter">
        <Link className="textLink" href="/">
          ← Zur Startseite
        </Link>
      </div>
    </main>
  );
}
