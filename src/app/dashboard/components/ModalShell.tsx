"use client";

import { useEffect, useState, type ReactNode, type CSSProperties, type MouseEvent } from "react";

/**
 * ModalShell — Hash-getriggerter Modal mit React-State-Visibility.
 *
 * Problem mit dem alten CSS-`:target`-Ansatz:
 *   `history.replaceState` ändert den URL-Hash, triggert aber WEDER
 *   `hashchange`-Event NOCH `:target`-Pseudo-Klasse-Update in Chrome.
 *   Folge: Overlay-Click schloss das Modal nicht visuell, obwohl der Hash
 *   intern weg war.
 *
 * Neuer Ansatz: useState-State, der vom hashchange-Listener gefüttert wird.
 * Render erfolgt jetzt nur wenn open=true. Beim Close setzen wir
 *   1. den lokalen State auf false (CSS-fallback raus)
 *   2. den Hash via replaceState weg (saubere URL ohne Scroll-Sprung)
 *
 * Open-Pfad bleibt URL-getrieben — `<a href="#${id}">` öffnet weiterhin,
 * Deep-Links funktionieren ohne JS-Pre-Render.
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined") return;
      setOpen(window.location.hash === `#${id}`);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate",   sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate",   sync);
    };
  }, [id]);

  function close() {
    setOpen(false);
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${id}`) return;
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onOverlayClick(e: MouseEvent<HTMLDivElement>) {
    // Schließen NUR wenn der Klick wirklich auf den Overlay-Container traf,
    // nicht auf ein Child. Inner-Card hat eigenen onClick mit stopPropagation.
    if (e.target === e.currentTarget) close();
  }

  if (!open) return null;

  return (
    <div
      id={id}
      className={className}
      onClick={onOverlayClick}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
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
