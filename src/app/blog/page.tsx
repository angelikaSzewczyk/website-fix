import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";
import BlogHeader from "../components/blog-header";

export const metadata: Metadata = {
  title: "Blog — WebsiteFix",
  description: "Tipps, Rechtliches und Best Practices rund um WCAG, Performance und Web-Wartung für Agenturen.",
};

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

function categoryColor(cat?: string) {
  if (!cat) return "#8df3d3";
  return CATEGORY_COLOR[cat] ?? "#8df3d3";
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <BlogHeader active="blog" lang="de" />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 56 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Blog
          </p>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            Wissen für Web-Agenturen
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 480, margin: 0 }}>
            WCAG, Recht, Performance — kompakt aufbereitet, damit du deine Kunden besser berätst.
          </p>
        </div>

        {/* Articles grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 12,
        }}>
          {posts.map((p) => {
            const fm = p.frontmatter;
            const color = categoryColor(fm.category);
            const dateStr = fm.date
              ? new Date(fm.date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
              : "";

            return (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <article style={{
                  height: "100%",
                  padding: "28px",
                  background: "#13151a",
                  border: `1px solid ${color}18`,
                  borderRadius: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Subtle color top stripe */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 3,
                    background: `linear-gradient(90deg, ${color}, ${color}44)`,
                  }} />

                  {/* Category + date row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                    {fm.category && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                        background: `${color}14`, color,
                        border: `1px solid ${color}28`, letterSpacing: "0.05em",
                      }}>
                        {fm.category}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>
                      {dateStr}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 style={{
                    margin: "0 0 12px", fontSize: 17, fontWeight: 700,
                    color: "#fff", lineHeight: 1.35, letterSpacing: "-0.015em",
                    flexGrow: 1,
                  }}>
                    {fm.title}
                  </h2>

                  {/* Excerpt */}
                  {fm.description && (
                    <p style={{
                      margin: "0 0 24px", fontSize: 13.5, color: "rgba(255,255,255,0.4)",
                      lineHeight: 1.7,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {fm.description}
                    </p>
                  )}

                  {/* CTA */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                      {fm.tags?.[0] ?? "Artikel"}
                    </span>
                    <span style={{ fontSize: 13, color, fontWeight: 600 }}>
                      Jetzt lesen →
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {posts.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Keine Artikel vorhanden.</p>
        )}
      </main>

      {/* CTA Banner */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "64px 24px",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.025em" }}>
            Deine Website jetzt prüfen?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: "0 0 28px", lineHeight: 1.7 }}>
            WCAG, SEO, Performance — vollautomatisch, Ergebnis in 60 Sekunden.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/scan" style={{
              padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14,
              background: "linear-gradient(90deg, #007BFF, #0057b8)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,123,255,0.35)",
            }}>
              Jetzt kostenlos scannen →
            </Link>
            <Link href="/fuer-agenturen" style={{
              padding: "12px 20px", borderRadius: 10, fontSize: 14,
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
            }}>
              Für Agenturen
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
