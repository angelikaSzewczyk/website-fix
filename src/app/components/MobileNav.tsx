"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
          <Link href="#pricing" className="navLink" onClick={close}
            style={{ fontSize: 16, fontWeight: 500 }}>
            Preise
          </Link>
          <Link href="/fuer-agenturen" className="navLink" onClick={close}
            style={{ fontSize: 16, fontWeight: 500 }}>
            Für Agenturen
          </Link>
          <Link href="/login" className="navLink" onClick={close}
            style={{ fontSize: 16, fontWeight: 500 }}>
            Anmelden
          </Link>
          {/* Primärer CTA */}
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
              marginTop: 4,
            }}
          >
            Jetzt scannen →
          </Link>
        </div>
      </nav>
    </>
  );
}
