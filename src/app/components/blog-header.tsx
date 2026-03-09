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
    fixes: lang === "en" ? "Fixes" : "Fixes",
    about: lang === "en" ? "About" : "Über uns",
    bundles: "Bundles",
    how: lang === "en" ? "How it works" : "Ablauf",
    examples: lang === "en" ? "Examples" : "Beispiele",
    faq: "FAQ",
    blog: "Blog",
    book: lang === "en" ? "Request" : "Anfrage",
    cta: ctaLabel || (lang === "en" ? "Choose a fix" : "Fix auswählen"),
  };

  const navItems = [
    { key: "fixes", label: t.fixes, href: "/#fixes" },
    { key: "about", label: t.about, href: "/#about" },
    { key: "bundles", label: t.bundles, href: "/#bundles" },
    { key: "how", label: t.how, href: "/#ablauf" },
    { key: "examples", label: t.examples, href: "/#beispiele" },
    { key: "faq", label: t.faq, href: "/#faq" },
    { key: "blog", label: t.blog, href: "/blog" },
    { key: "book", label: t.book, href: "/#book" },
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
          <Link className="navCta navCtaDesktop" href="/#fixes">
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
            href="/#fixes"
            onClick={() => setMobileNavOpen(false)}
          >
            {t.cta}
          </Link>
        </div>
      </nav>
    </>
  );
}