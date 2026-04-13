import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";
import BlogHeader from "../components/blog-header";
import BlogGrid from "./BlogGrid";

export const metadata: Metadata = {
  title: "Blog — WebsiteFix",
  description: "Tipps, Rechtliches und Best Practices rund um WCAG, Performance und Web-Wartung für Agenturen.",
};

function estimateReadMinutes(content: string): number {
  // Strip markdown syntax, count words, assume 200 wpm
  const text = content
    .replace(/```[\s\S]*?```/g, "")   // code blocks
    .replace(/`[^`]+`/g, "")          // inline code
    .replace(/!\[.*?\]\(.*?\)/g, "")  // images
    .replace(/\[.*?\]\(.*?\)/g, "$1") // links
    .replace(/#+\s/g, "")             // headings
    .replace(/[*_~>]/g, "");          // formatting
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function BlogIndexPage() {
  const posts = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
    description: p.frontmatter.description,
    date: p.frontmatter.date,
    category: p.frontmatter.category,
    tags: p.frontmatter.tags,
    readMinutes: estimateReadMinutes(p.content),
  }));

  return (
    <>
      <BlogHeader active="blog" lang="de" />

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 96px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
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

        {/* Grid with filters — client component */}
        <BlogGrid posts={posts} />

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
          <p style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
            Jederzeit kündbar · Sicher bezahlen
          </p>
        </div>
      </section>
    </>
  );
}
