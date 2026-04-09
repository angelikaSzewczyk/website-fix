/**
 * BrandLogo — single source of truth for the WebsiteFix logo mark.
 *
 * Icon design: ">✓" combined mark
 *   - ">" (code bracket / scan):  M 4,5  L 13,14 L 7,20   — white, semi-opaque
 *   - "✓" (checkmark / fix):      M 7,20 L 13,25 L 24,6   — amber #F59E0B
 *   Both paths share (7,20), forming one visual unit that reads as ">✓".
 *
 * Wordmark: "Website" (white, weight 300) + "Fix" (amber #F59E0B, weight 800)
 *
 * Hover:    .wf-brand-logo:hover .wf-icon-box → blue glow + amber accent
 *           (defined in globals.css — .wf-brand-logo / .wf-icon-box classes)
 *
 * Usage:
 *   <BrandLogo />                   — standard nav (md)
 *   <BrandLogo size="lg" />         — auth pages
 *   <BrandLogo size="sm" />         — compact / mobile
 *   <BrandLogo href="/dashboard" /> — internal link
 *   <BrandLogo variant="powered-by" /> — white-label footer
 */

import Link from "next/link";

export type LogoSize    = "sm" | "md" | "lg";
export type LogoVariant = "default" | "powered-by";

interface BrandLogoProps {
  size?:    LogoSize;
  variant?: LogoVariant;
  /** Link target. Defaults to "/" */
  href?:    string;
}

// ── Size tokens ───────────────────────────────────────────────────────────────
const S = {
  sm: { box: 26, r:  7, sw: 2.2, fs: 13, gap: 7  },
  md: { box: 30, r:  8, sw: 2.4, fs: 15, gap: 9  },
  lg: { box: 36, r: 10, sw: 2.8, fs: 18, gap: 10 },
} satisfies Record<LogoSize, { box: number; r: number; sw: number; fs: number; gap: number }>;

// ── ">✓" SVG mark ─────────────────────────────────────────────────────────────
// viewBox 0 0 28 28 — two paths sharing point (7,20):
//   ">" = code bracket (scan symbol)  →  white / semi-transparent
//   "✓" = checkmark   (fix symbol)    →  amber #F59E0B
function LogoMark({ sw }: { sw: number }) {
  return (
    <>
      <path
        d="M 4,5 L 13,14 L 7,20"
        stroke="rgba(255,255,255,0.72)"
        strokeWidth={sw}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 7,20 L 13,25 L 24,6"
        stroke="#F59E0B"
        strokeWidth={sw}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

// ── Icon box ──────────────────────────────────────────────────────────────────
function IconBox({
  boxSize,
  borderRadius,
  sw,
  className,
}: {
  boxSize: number;
  borderRadius: number;
  sw: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius,
        background: "#0D1117",
        border: "1px solid rgba(59,130,246,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={boxSize - 6}
        height={boxSize - 6}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <LogoMark sw={sw} />
      </svg>
    </div>
  );
}

// ── Wordmark ──────────────────────────────────────────────────────────────────
function Wordmark({ fontSize }: { fontSize: number }) {
  return (
    <span
      style={{
        fontWeight: 300,
        fontSize,
        color: "#fff",
        letterSpacing: "-0.01em",
        lineHeight: 1,
      }}
    >
      Website
      <span style={{ color: "#F59E0B", fontWeight: 800 }}>Fix</span>
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BrandLogo({
  size    = "md",
  variant = "default",
  href    = "/",
}: BrandLogoProps) {
  const t = S[size];

  // ── "Powered by WebsiteFix" variant ────────────────────────────────────────
  if (variant === "powered-by") {
    return (
      <Link
        href={href}
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 400, letterSpacing: "0.02em" }}>
          Powered by
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 18, height: 18, borderRadius: 5,
            background: "#0D1117",
            border: "1px solid rgba(59,130,246,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={12} height={12} viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <LogoMark sw={2.4} />
            </svg>
          </div>
          <span style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.5)", letterSpacing: "-0.01em" }}>
            Website<span style={{ color: "#F59E0B", fontWeight: 700 }}>Fix</span>
          </span>
        </span>
      </Link>
    );
  }

  // ── Default logo ────────────────────────────────────────────────────────────
  return (
    <Link
      href={href}
      className="wf-brand-logo"
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: t.gap }}
      aria-label="WebsiteFix — zur Startseite"
    >
      <IconBox
        className="wf-icon-box"
        boxSize={t.box}
        borderRadius={t.r}
        sw={t.sw}
      />
      <Wordmark fontSize={t.fs} />
    </Link>
  );
}
