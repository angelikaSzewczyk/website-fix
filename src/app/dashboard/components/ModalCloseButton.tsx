"use client";

import type { ReactNode, CSSProperties } from "react";

/**
 * Schließt ein CSS-:target-basiertes Modal ohne Scroll-Sprung zum Seitenanfang.
 * Klassisches `<a href="#">` löst zwar das `:target` aber scrollt nach oben —
 * `history.replaceState` clearted nur den Hash und lässt die Scroll-Position
 * unangetastet.
 */
export default function ModalCloseButton({
  children,
  style,
  ariaLabel,
}: {
  children: ReactNode;
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(e) => {
        e.preventDefault();
        if (typeof window !== "undefined" && window.location.hash) {
          // Hash entfernen ohne Scroll-Position zu verlieren
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        font: "inherit",
        padding: 0,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
