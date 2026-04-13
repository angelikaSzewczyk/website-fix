"use client";

import { useState } from "react";
import Link from "next/link";

type Post = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  category?: string;
  tags?: string[];
  readMinutes: number;
};

type FilterKey = "alle" | "compliance" | "agency" | "wordpress";

const CATEGORY_COLOR: Record<string, string> = {
  compliance: "#7aa6ff",
  agency:     "#c084fc",
  wordpress:  "#8df3d3",
};

function cardColor(category?: string, tags?: string[]): string {
  const cat = category?.toLowerCase() ?? "";
  if (CATEGORY_COLOR[cat]) return CATEGORY_COLOR[cat];
  if (tags?.some(t => t.toLowerCase().includes("wordpress"))) return CATEGORY_COLOR.wordpress;
  return "#8df3d3";
}

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: "alle",        label: "Alle",        color: "rgba(255,255,255,0.5)" },
  { key: "compliance",  label: "Compliance",  color: "#7aa6ff" },
  { key: "agency",      label: "Agency",      color: "#c084fc" },
  { key: "wordpress",   label: "WordPress",   color: "#8df3d3" },
];

function matchesFilter(post: Post, filter: FilterKey): boolean {
  if (filter === "alle") return true;
  if (filter === "wordpress") return !!(post.tags?.some(t => t.toLowerCase().includes("wordpress")));
  return post.category?.toLowerCase() === filter;
}

export default function BlogGrid({ posts }: { posts: Post[] }) {
  const [active, setActive] = useState<FilterKey>("alle");
  const [hovered, setHovered] = useState<string | null>(null);

  const visible = posts.filter(p => matchesFilter(p, active));

  return (
    <>
      {/* ── Filter badges ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
        {FILTERS.map(f => {
          const isActive = active === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              style={{
                fontSize: 12, fontWeight: 600, padding: "5px 14px",
                borderRadius: 20, cursor: "pointer",
                border: `1px solid ${isActive ? f.color : "rgba(255,255,255,0.1)"}`,
                background: isActive ? `${f.color}18` : "transparent",
                color: isActive ? f.color : "rgba(255,255,255,0.35)",
                transition: "all 0.15s",
                letterSpacing: "0.04em",
              }}
            >
              {f.label}
              {f.key !== "alle" && (
                <span style={{ marginLeft: 5, opacity: 0.6, fontWeight: 400 }}>
                  {posts.filter(p => matchesFilter(p, f.key)).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Cards grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
        gap: 12,
      }}>
        {visible.map((p) => {
          const color = cardColor(p.category, p.tags);
          const isHovered = hovered === p.slug;
          const dateStr = p.date
            ? new Date(p.date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
            : "";

          return (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              style={{ textDecoration: "none", display: "block" }}
              onMouseEnter={() => setHovered(p.slug)}
              onMouseLeave={() => setHovered(null)}
            >
              <article style={{
                height: "100%",
                padding: "28px",
                background: "#13151a",
                border: `1px solid ${isHovered ? color + "50" : color + "18"}`,
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                position: "relative",
                overflow: "hidden",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isHovered ? `0 8px 32px ${color}20` : "none",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              }}>
                {/* Top color stripe */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${color}, ${color}44)`,
                }} />

                {/* Category + date + reading time */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                  {p.category && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                      background: `${color}14`, color,
                      border: `1px solid ${color}28`, letterSpacing: "0.05em",
                      textTransform: "capitalize",
                    }}>
                      {p.category}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>
                    {dateStr}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
                    · {p.readMinutes} Min.
                  </span>
                </div>

                {/* Title */}
                <h2 style={{
                  margin: "0 0 12px", fontSize: 17, fontWeight: 700,
                  color: "#fff", lineHeight: 1.35, letterSpacing: "-0.015em",
                  flexGrow: 1,
                }}>
                  {p.title}
                </h2>

                {/* Excerpt */}
                {p.description && (
                  <p style={{
                    margin: "0 0 24px", fontSize: 13.5, color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.7,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {p.description}
                  </p>
                )}

                {/* Footer row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                    {p.tags?.[0] ?? "Artikel"}
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

      {visible.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
          Keine Artikel in dieser Kategorie.
        </p>
      )}
    </>
  );
}
