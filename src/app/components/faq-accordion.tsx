"use client";

import { useState } from "react";

type FaqItem = { q: string; a: string };

export default function FaqAccordion({
  items,
  light = false,
}: {
  items: FaqItem[];
  light?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);

  const dividerColor  = light ? "#E2E8F0"               : "rgba(255,255,255,0.06)";
  const questionColor = light ? "#0F172A"               : "#fff";
  const answerColor   = light ? "#64748B"               : "rgba(255,255,255,0.45)";
  const iconBorder    = light ? "1px solid #CBD5E1"     : "1px solid rgba(255,255,255,0.12)";
  const iconColor     = light ? "#64748B"               : "rgba(255,255,255,0.4)";
  const iconBg        = light ? "#F1F5F9"               : "transparent";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} style={{ borderBottom: `1px solid ${dividerColor}` }}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              style={{
                width: "100%", textAlign: "left",
                padding: "20px 0",
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: questionColor, lineHeight: 1.4 }}>
                {item.q}
              </span>
              <span style={{
                flexShrink: 0,
                width: 24, height: 24, borderRadius: "50%",
                border: iconBorder, background: iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: iconColor, fontSize: 16, fontWeight: 300,
                transform: isOpen ? "rotate(45deg)" : "none",
                transition: "transform 0.2s ease",
              }}>
                +
              </span>
            </button>

            <div style={{
              overflow: "hidden",
              maxHeight: isOpen ? 400 : 0,
              transition: "max-height 0.3s ease",
            }}>
              <div style={{ paddingBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: answerColor, lineHeight: 1.8 }}>
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
