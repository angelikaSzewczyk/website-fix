import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";
import BlogHeader from "../components/blog-header";

export const metadata: Metadata = {
  title: "Blog — WebsiteFix",
  description: "Praktische Guides zu Website-Problemen: Form, Speed, Mobile, Tracking & Conversion.",
};

const CATEGORY_COLORS: Record<string, string> = {
  SEO: "#7aa6ff",
  Speed: "#8df3d3",
  WCAG: "#f3d38d",
  Sicherheit: "#f38d8d",
  Conversion: "#c38df3",
  Mobile: "#8df3d3",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <BlogHeader active="blog" lang="de" />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ marginBottom: 56 }}>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            Blog
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 520, margin: 0 }}>
            Kurze, praktische Fix-Guides — damit du weniger Bugs hast und mehr Anfragen bekommst.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}>
          {posts.map((p) => {
            const fm = p.frontmatter;
            const catColor = CATEGORY_COLORS[fm.category ?? ""] ?? "#8df3d3";
            return (
              <article key={p.slug} style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {fm.category && (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: catColor }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: catColor, display: "inline-block", flexShrink: 0 }} />
                      {fm.category}
                    </span>
                  )}
                  <time style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }} dateTime={fm.date}>
                    {fm.date}
                  </time>
                </div>

                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.4 }}>
                  <Link href={`/blog/${p.slug}`} style={{ color: "#fff", textDecoration: "none" }}>
                    {fm.title}
                  </Link>
                </h2>

                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0, flexGrow: 1 }}>
                  {fm.description}
                </p>

                {(fm.tags ?? []).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(fm.tags ?? []).slice(0, 4).map((t: string) => (
                      <span key={t} style={{
                        fontSize: 11, color: "rgba(255,255,255,0.35)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 4, padding: "2px 8px",
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                  <Link href={`/blog/${p.slug}`} style={{
                    fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                  }}>
                    Weiterlesen →
                  </Link>
                  <Link href="/scan" style={{
                    fontSize: 12, color: "rgba(255,255,255,0.35)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6, padding: "5px 12px", textDecoration: "none",
                  }}>
                    Jetzt scannen
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      <section style={{
        background: "linear-gradient(135deg, rgba(141,243,211,0.06) 0%, rgba(122,166,255,0.06) 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "64px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Bereit deine Website zu prüfen?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, margin: "0 0 28px", lineHeight: 1.7 }}>
            WebsiteFix scannt jede Website auf Fehler, Speed-Probleme und SEO-Lücken — in unter 60 Sekunden.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/scan" style={{
              padding: "12px 24px", borderRadius: 9, fontWeight: 700, fontSize: 14,
              background: "#fff", color: "#0b0c10", textDecoration: "none",
            }}>
              Jetzt kostenlos scannen
            </Link>
            <Link href="/fuer-agenturen" style={{
              padding: "12px 20px", borderRadius: 9, fontSize: 14,
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
            }}>
              Für Agenturen →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
