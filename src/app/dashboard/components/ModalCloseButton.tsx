"use client";

import type { ReactNode, CSSProperties } from "react";

/**
 * Schließt ein Modal das per URL-Hash geöffnet wurde.
 *
 * Mechanik:
 *   1. history.replaceState entfernt den Hash ohne Scroll-Sprung
 *      (ein klassisches <a href=""> würde zum Seitenanfang scrollen)
 *   2. window.dispatchEvent(new Event("hashchange")) wird MANUELL
 *      gefeuert, weil replaceState das Event NICHT automatisch auslöst.
 *      Ohne diesen Schritt bekäme der ModalShell-useEffect das Schließen
 *      nicht mit, und das Modal bliebe trotz entferntem Hash sichtbar
 *      (genau dieser Bug — nur ESC funktionierte, weil ESC den
 *      State direkt im Shell setzt, nicht über den Hash).
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
        if (typeof window === "undefined") return;
        if (window.location.hash) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        // Manuell hashchange feuern — replaceState löst es nicht aus,
        // aber ModalShell hört darauf, um setOpen(false) zu setzen.
        window.dispatchEvent(new Event("hashchange"));
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
