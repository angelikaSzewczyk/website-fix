"use client";

import { useEffect, type ReactNode, type CSSProperties, type MouseEvent } from "react";

/**
 * ModalShell — Wrapper für CSS-:target-basierte Modals mit:
 *   - Overlay-Click-Close (Klick außerhalb der Inner-Card schließt)
 *   - ESC-Key-Close (window keydown listener, nur active wenn Modal offen)
 *
 * Beide Pfade nutzen `history.replaceState` (kein Scroll-Sprung), passend
 * zur ModalCloseButton-Mechanik. Der Open-Pfad bleibt CSS-:target — eine
 * `<a href="#${id}">` zeigt das Modal, ohne dass JS aktiv werden muss.
 *
 * Warum kein useState? Der Open-Zustand wird vom URL-Hash gehalten — das
 * macht Deep-Links robust (per E-Mail / Slack: "klick hier um Kunden
 * anzulegen" → /dashboard#modal-new-client öffnet das Modal direkt).
 */
export default function ModalShell({
  id,
  className,
  innerStyle,
  children,
}: {
  id:        string;
  className?: string;
  innerStyle?: CSSProperties;
  children:  ReactNode;
}) {
  function isOpen(): boolean {
    return typeof window !== "undefined" && window.location.hash === `#${id}`;
  }

  function close() {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${id}`) return;
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen()) {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onOverlayClick(e: MouseEvent<HTMLDivElement>) {
    // Schließen NUR wenn der Klick wirklich auf den Overlay-Container traf,
    // nicht auf ein Child. Inner-Card hat eigenen onClick mit stopPropagation.
    if (e.target === e.currentTarget) close();
  }

  return (
    <div id={id} className={className} onClick={onOverlayClick}>
      <div
        style={innerStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
