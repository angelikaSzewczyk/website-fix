import Link from "next/link";
import { getAllPosts } from "@/lib/blog";


import type { Metadata } from "next";
import BlogHeader from "../components/blog-header";

export const metadata: Metadata = {
  title: "Blog",
  description: "Praktische Guides zu Website-Problemen: Form, Speed, Mobile, Tracking & Conversion.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
     <><BlogHeader active="blog" lang="de" /><main className="page">
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

                <Link className="ghostBtn" href="/scan">
                  Jetzt scannen
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

    <section style={{
      background: "linear-gradient(135deg, rgba(141,243,211,0.08) 0%, rgba(122,166,255,0.08) 100%)",
      borderTop: "1px solid rgba(141,243,211,0.15)",
      padding: "64px 20px",
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(22px, 4vw, 30px)", margin: "0 0 12px" }}>
          Bereit deine Website zu prüfen?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
          WebsiteFix scannt jede Website automatisch auf Fehler, Speed-Probleme und SEO-Lücken — in unter 60 Sekunden.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/scan" className="cta" style={{ fontSize: 15, padding: "13px 28px" }}>
            Jetzt kostenlos scannen
          </a>
          <a href="/fuer-agenturen" className="ghost" style={{ fontSize: 14 }}>
            Für Agenturen →
          </a>
        </div>
      </div>
    </section>
    </>
  );
}
