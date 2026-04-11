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
  const [hovered, setHovered] = useState<number | null>(null);

  const dividerColor  = light ? "#E2E8F0"               : "rgba(255,255,255,0.10)";
  const questionColor = light ? "#0F172A"               : "#fff";
  const answerColor   = light ? "#64748B"               : "rgba(255,255,255,0.50)";
  const iconBorder    = light ? "1px solid #CBD5E1"     : "1px solid rgba(255,255,255,0.12)";
  const iconBorderHov = light ? "1px solid #94A3B8"     : "1px solid rgba(122,166,255,0.45)";
  const iconColor     = light ? "#64748B"               : "rgba(255,255,255,0.45)";
  const iconColorHov  = light ? "#0F172A"               : "#7aa6ff";
  const iconBg        = light ? "#F1F5F9"               : "transparent";
  const iconBgHov     = light ? "#E2E8F0"               : "rgba(122,166,255,0.08)";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const isHov  = hovered === i;

        const iconTransform = isOpen
          ? "rotate(45deg)"
          : isHov
          ? "rotate(90deg)"
          : "rotate(0deg)";

        return (
          <div
            key={i}
            style={{ borderBottom: `1px solid ${dividerColor}` }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="wf-faq-btn"
              style={{
                width: "100%", textAlign: "left",
                padding: "24px 4px 24px 0",
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              }}
            >
              <span style={{
                fontSize: 15, fontWeight: 600, color: questionColor, lineHeight: 1.45,
                transition: "color 0.2s ease",
              }}>
                {item.q}
              </span>
              <span style={{
                flexShrink: 0,
                width: 26, height: 26, borderRadius: "50%",
                border: isHov || isOpen ? iconBorderHov : iconBorder,
                background: isHov || isOpen ? iconBgHov : iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isHov || isOpen ? iconColorHov : iconColor,
                fontSize: 18, fontWeight: 300, lineHeight: 1,
                transform: iconTransform,
                transition: "transform 0.25s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
              }}>
                +
              </span>
            </button>

            <div style={{
              overflow: "hidden",
              maxHeight: isOpen ? 600 : 0,
              transition: "max-height 0.3s ease",
            }}>
              <div style={{ paddingBottom: 24 }}>
                <p style={{ margin: 0, fontSize: 14, color: answerColor, lineHeight: 1.85 }}>
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
