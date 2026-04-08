"use client";

import { useState } from "react";

type FaqItem = { q: string; a: string };

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: "100%", textAlign: "left",
                padding: "20px 0",
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>
                {item.q}
              </span>
              <span style={{
                flexShrink: 0,
                width: 22, height: 22, borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)", fontSize: 14,
                transform: isOpen ? "rotate(45deg)" : "none",
                transition: "transform 0.2s ease",
              }}>
                +
              </span>
            </button>

            <div style={{
              overflow: "hidden",
              maxHeight: isOpen ? 300 : 0,
              transition: "max-height 0.25s ease",
            }}>
              <div style={{ paddingBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.75 }}>
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
