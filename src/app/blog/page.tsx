import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";
import BlogHeader from "../components/blog-header";
import BlogGrid from "./BlogGrid";
import SiteFooter from "../components/SiteFooter";

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
            Deine WordPress-Website jetzt prüfen?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: "0 0 28px", lineHeight: 1.7 }}>
            WordPress-Deep-Scan in unter 60 Sekunden – ohne Plugin-Installation.
          </p>

          {/* Buttons — stacked on mobile, inline on desktop */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexDirection: "column", alignItems: "center" }}
            className="blog-cta-buttons">
            <Link href="/scan" style={{
              display: "block", width: "100%", maxWidth: 320, textAlign: "center",
              padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15,
              background: "linear-gradient(90deg, #007BFF, #0057b8)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,123,255,0.35)",
            }}>
              Jetzt kostenlos scannen →
            </Link>
            <Link href="/fuer-agenturen" style={{
              display: "block", width: "100%", maxWidth: 320, textAlign: "center",
              padding: "12px 20px", borderRadius: 10, fontSize: 14,
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
            }}>
              Für Agenturen
            </Link>
          </div>

          {/* Trust-Bar */}
          <div style={{ marginTop: 20, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {["DSGVO-konform", "Jederzeit kündbar", "Sicherer Stripe-Checkout"].map(t => (
              <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
