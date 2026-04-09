/**
 * BrandLogo — single source of truth for the WebsiteFix logo mark.
 * Edit this file to update the logo everywhere.
 *
 * Usage:
 *   <BrandLogo />                         — standard nav logo (md)
 *   <BrandLogo size="lg" />               — auth pages
 *   <BrandLogo size="sm" />               — consent banner / mobile bar
 *   <BrandLogo href="/dashboard" />       — dashboard (links inside app)
 *   <BrandLogo variant="powered-by" />    — white-label footer / reports
 */

import Link from "next/link";

export type LogoSize    = "sm" | "md" | "lg";
export type LogoVariant = "default" | "powered-by";

interface BrandLogoProps {
  size?:    LogoSize;
  variant?: LogoVariant;
  /** Where the logo links to. Defaults to "/" */
  href?:    string;
}

// ── Token map ────────────────────────────────────────────────────────────────
const S = {
  sm:  { box: 28, r:  8, svg: 14, fs: 13, gap: 8  },
  md:  { box: 30, r:  8, svg: 15, fs: 15, gap: 9  },
  lg:  { box: 36, r: 10, svg: 17, fs: 18, gap: 10 },
} satisfies Record<LogoSize, { box: number; r: number; svg: number; fs: number; gap: number }>;

// ── Shield icon (inline to keep the component self-contained) ─────────────────
function ShieldIcon({ size }: { size: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ── The icon box (gradient square + shield) ───────────────────────────────────
function IconBox({ boxSize, borderRadius, svgSize }: { boxSize: number; borderRadius: number; svgSize: number }) {
  return (
    <div style={{
      width: boxSize, height: boxSize, borderRadius,
      background: "linear-gradient(135deg, #007BFF, #0057b8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 2px 8px rgba(0,123,255,0.35)",
    }}>
      <ShieldIcon size={svgSize} />
    </div>
  );
}

// ── Wordmark ─────────────────────────────────────────────────────────────────
function Wordmark({ fontSize }: { fontSize: number }) {
  return (
    <span style={{ fontWeight: 800, fontSize, color: "#fff", letterSpacing: "-0.02em" }}>
      Website<span style={{ color: "#007BFF" }}>Fix</span>
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function BrandLogo({ size = "md", variant = "default", href = "/" }: BrandLogoProps) {
  const t = S[size];

  // ── "Powered by WebsiteFix" ── for white-label reports / client dashboards
  if (variant === "powered-by") {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500, letterSpacing: "0.02em" }}>
          Powered by
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{
            width: 18, height: 18, borderRadius: 5,
            background: "linear-gradient(135deg, #007BFF, #0057b8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <ShieldIcon size={9} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "-0.01em" }}>
            Website<span style={{ color: "#007BFF" }}>Fix</span>
          </span>
        </div>
      </Link>
    );
  }

  // ── Default logo ──────────────────────────────────────────────────────────
  return (
    <Link href={href} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: t.gap }}>
      <IconBox boxSize={t.box} borderRadius={t.r} svgSize={t.svg} />
      <Wordmark fontSize={t.fs} />
    </Link>
  );
}
