"use client";

import { useEffect, useRef, useState } from "react";

export default function TestimonialDots({ count }: { count: number }) {
  const [active, setActive] = useState(0);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Find the sibling grid via the shared wrapper
    const wrapper = document.querySelector(".wf-testimonial-wrapper");
    const grid = wrapper?.querySelector(".wf-testimonial-grid") as HTMLDivElement | null;
    if (!grid) return;
    gridRef.current = grid;

    const onScroll = () => {
      const cards = grid.querySelectorAll<HTMLElement>(".wf-testimonial-card");
      if (!cards.length) return;
      const scrollLeft = grid.scrollLeft;
      const cardWidth = cards[0].offsetWidth + 14; // card + gap
      const idx = Math.round(scrollLeft / cardWidth);
      setActive(Math.min(idx, count - 1));
    };

    grid.addEventListener("scroll", onScroll, { passive: true });
    return () => grid.removeEventListener("scroll", onScroll);
  }, [count]);

  return (
    <div className="wf-swipe-hint">
      <span style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        Wischen für mehr
      </span>
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 6, borderRadius: 3,
              width: i === active ? 18 : 6,
              background: i === active ? "rgba(122,166,255,0.7)" : "rgba(255,255,255,0.18)",
              transition: "width 0.25s ease, background 0.25s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
