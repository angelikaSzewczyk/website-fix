"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BlogHeaderProps = {
  lang?: "de" | "en";
  active?: "blog" | "none";
  ctaLabel?: string;
};

export default function BlogHeader({
  lang = "de",
  active = "blog",
  ctaLabel,
}: BlogHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;

    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev || "";
    }

    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }

    function onResize() {
      if (window.innerWidth > 700) setMobileNavOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const t = {
    faq: "FAQ",
    blog: "Blog",
    cta: ctaLabel || (lang === "en" ? "Join waitlist" : "Zur Warteliste"),
  };

  const navItems = [
    { key: "faq", label: t.faq, href: "/#faq" },
    { key: "blog", label: t.blog, href: "/blog" },
  ];

  return (
    <>
      <header className="nav blogHeaderNav">
        <div className="brand">
          <Link href="/" className="brandLink">
            Website
            <span className="brandSpace"> </span>
            <span className="brandAccent">Fix</span>
          </Link>
        </div>

        <nav className="navLinks" aria-label="Blog Navigation">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`navLink ${
                active === "blog" && item.key === "blog" ? "isActive" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="navActions">
          <Link className="navCta navCtaDesktop" href="/#waitlist">
            {t.cta}
          </Link>

          <button
            type="button"
            className={`mobileMenuBtn ${mobileNavOpen ? "isOpen" : ""}`}
            aria-label={mobileNavOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={mobileNavOpen}
            aria-controls="blog-mobile-navigation"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={`mobileNavOverlay ${mobileNavOpen ? "isOpen" : ""}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden={!mobileNavOpen}
      />

      <nav
        id="blog-mobile-navigation"
        className={`mobileNavDrawer ${mobileNavOpen ? "isOpen" : ""}`}
        aria-label="Mobile Blog Navigation"
      >
        <div className="mobileNavInner">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`navLink ${
                active === "blog" && item.key === "blog" ? "isActive" : ""
              }`}
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <Link
            className="cta mobileNavPrimary"
            href="/#waitlist"
            onClick={() => setMobileNavOpen(false)}
          >
            {t.cta}
          </Link>
        </div>
      </nav>
    </>
  );
}