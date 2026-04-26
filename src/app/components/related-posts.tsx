import Link from "next/link";
import { getRelatedPosts } from "@/lib/blog";

const CATEGORY_COLOR: Record<string, string> = {
  "Recht & WCAG":  "#7aa6ff",
  "BFSG & Recht":  "#7aa6ff",
  compliance:      "#7aa6ff",
  SEO:             "#10B981",
  seo:             "#10B981",
  Speed:           "#10B981",
  Performance:     "#10B981",
  Sicherheit:      "#ff6b6b",
  Conversion:      "#c084fc",
  Mobile:          "#ffd93d",
  wordpress:       "#10B981",
};

function catColor(cat?: string) {
  return cat ? (CATEGORY_COLOR[cat] ?? "#10B981") : "#10B981";
}

export default function RelatedPosts({ slug, lang = "de" }: { slug: string; lang?: "de" | "en" }) {
  const posts = getRelatedPosts(slug, 4);
  if (!posts.length) return null;

  const title = lang === "en" ? "Related articles" : "Ähnliche Artikel";

  return (
    <section className="wf-related" style={{ marginTop: 64, paddingTop: 44, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <style>{`
        /* ── Card-Hover-Glow per CSS-Variable, damit jede Card ihre eigene Akzentfarbe nutzt ── */
        .wf-related-card {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 22px 24px;
          background: rgba(255, 255, 255, 0.035);
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(0.22,1,0.36,1),
                      border-color 0.2s ease,
                      box-shadow 0.28s ease,
                      background 0.2s ease;
        }
        .wf-related-card::before {
          content: "";
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--wf-related-accent), transparent);
          opacity: 0.55;
          transition: opacity 0.3s ease;
        }
        .wf-related-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.055);
          border-color: rgba(var(--wf-related-accent-rgb), 0.45);
          box-shadow:
            0 0 0 1px rgba(var(--wf-related-accent-rgb), 0.25),
            0 14px 40px rgba(0, 0, 0, 0.35),
            0 0 36px rgba(var(--wf-related-accent-rgb), 0.18);
        }
        .wf-related-card:hover::before { opacity: 1; }

        /* Pfeil-Animation auf Hover */
        .wf-related-card .wf-related-arrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: gap 0.25s ease, color 0.2s ease;
        }
        .wf-related-card:hover .wf-related-arrow { gap: 12px; }
        .wf-related-card .wf-related-arrow svg {
          transition: transform 0.25s ease;
        }
        .wf-related-card:hover .wf-related-arrow svg {
          transform: translateX(3px);
        }

        /* Body wächst, Footer bleibt unten — equal-height Cards im Grid */
        .wf-related-card .wf-related-title {
          flex: 1 1 auto;
        }

        /* ── Desktop / Tablet: Grid mit luftigem Spacing ── */
        .wf-related-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 18px;
        }

        /* ── Mobile: horizontaler Snap-Slider statt Stack ── */
        @media (max-width: 720px) {
          .wf-related-grid {
            display: flex;
            grid-template-columns: none;
            gap: 14px;
            overflow-x: auto;
            overflow-y: visible;
            padding-bottom: 14px;
            margin: 0 -20px;
            padding-left: 20px;
            padding-right: 20px;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.18) transparent;
          }
          .wf-related-grid::-webkit-scrollbar { height: 6px; }
          .wf-related-grid::-webkit-scrollbar-track { background: transparent; }
          .wf-related-grid::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.14);
            border-radius: 3px;
          }
          .wf-related-grid > a {
            flex: 0 0 78%;
            scroll-snap-align: start;
            max-width: 320px;
          }
        }
      `}</style>

      {/* Header — kompakt, edel, mit dezentem Hint auf den Slider */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 22, flexWrap: "wrap" as const }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", margin: 0 }}>
          {title}
        </p>
        <p className="wf-related-mobile-hint" style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", margin: 0, display: "none" }}>
          ← wischen →
        </p>
        <style>{`
          @media (max-width: 720px) {
            .wf-related-mobile-hint { display: block !important; }
          }
        `}</style>
      </div>

      <div className="wf-related-grid">
        {posts.map((post) => {
          const color = catColor(post.frontmatter.category);
          // Hex → rgb für rgba-Glow
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);

          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <article
                className="wf-related-card"
                style={{
                  // CSS-Variablen: pro Card unterschiedliche Akzentfarbe
                  ["--wf-related-accent" as string]: color,
                  ["--wf-related-accent-rgb" as string]: `${r},${g},${b}`,
                }}
              >
                {/* Kategorie als Dot + Text — viel dezenter als Badge */}
                {post.frontmatter.category && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 8px ${color}80`,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 10.5, fontWeight: 700,
                      color: "rgba(255,255,255,0.55)",
                      letterSpacing: "0.1em", textTransform: "uppercase" as const,
                    }}>
                      {post.frontmatter.category}
                    </span>
                  </div>
                )}

                {/* Title — größere Font-Weight, klare Hierarchie */}
                <h3 className="wf-related-title" style={{
                  margin: "0 0 18px",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1.4,
                  letterSpacing: "-0.018em",
                }}>
                  {post.frontmatter.title}
                </h3>

                {/* Lesen-Pfeil — animierte Translation auf Hover */}
                <span
                  className="wf-related-arrow"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color,
                    letterSpacing: "0.01em",
                  }}
                >
                  Lesen
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
