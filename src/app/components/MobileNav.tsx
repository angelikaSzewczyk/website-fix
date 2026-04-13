"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const pathname = usePathname();

  const onAgencyPage = pathname === "/fuer-agenturen";
  const onBlogPage   = pathname.startsWith("/blog");

  // Preise-Link: auf /fuer-agenturen zum internen Anker, sonst zur Home-Seite mit Anker
  const preisHref = onAgencyPage ? "#pricing" : "/#pricing";

  return (
    <>
      {/* Burger-Button — sichtbar nur auf Mobile via .mobileMenuBtn CSS */}
      <button
        className={`mobileMenuBtn${open ? " isOpen" : ""}`}
        onClick={() => setOpen((p) => !p)}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Backdrop */}
      <div
        className={`mobileNavOverlay${open ? " isOpen" : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Slide-In Drawer */}
      <nav
        className={`mobileNavDrawer${open ? " isOpen" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Hauptnavigation"
      >
        <div className="mobileNavInner">

          {/* Preise — immer vorhanden */}
          <Link href={preisHref} className="navLink" onClick={close}
            style={{ fontSize: 16, fontWeight: 500 }}>
            Preise
          </Link>

          {/* Kontext-Link: auf /fuer-agenturen → Home, sonst → Für Agenturen */}
          {onAgencyPage ? (
            <Link href="/" className="navLink" onClick={close}
              style={{ fontSize: 16, fontWeight: 500 }}>
              Home
            </Link>
          ) : (
            <Link href="/fuer-agenturen" className="navLink" onClick={close}
              style={{ fontSize: 16, fontWeight: 500 }}>
              Für Agenturen
            </Link>
          )}

          {/* Blog — immer vorhanden, aktive Seite dezent markiert */}
          <Link href="/blog" className="navLink" onClick={close}
            style={{
              fontSize: 16,
              fontWeight: onBlogPage ? 700 : 500,
              color: onBlogPage ? "rgba(255,255,255,0.45)" : undefined,
              pointerEvents: onBlogPage ? "none" : undefined,
            }}>
            Blog{onBlogPage ? " ·" : ""}
          </Link>

          {/* Anmelden */}
          <Link href="/login" className="navLink" onClick={close}
            style={{ fontSize: 16, fontWeight: 500 }}>
            Anmelden
          </Link>

          {/* Primärer CTA — immer ganz unten */}
          <Link
            href="/scan"
            onClick={close}
            style={{
              display: "block",
              textAlign: "center",
              padding: "14px 20px",
              borderRadius: 14,
              background: "#007BFF",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
              marginTop: 8,
            }}
          >
            Jetzt scannen →
          </Link>
        </div>
      </nav>
    </>
  );
}
