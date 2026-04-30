/**
 * UIHelpers — Phase-2-Iter-3 Shared-Helpers.
 *
 * Designtokens (D) und kleine UI-Bausteine (Card, SectionLabel, SectionHead,
 * Pill, BtnPrimary, BtnGhost, Divider, SevBadge, LockIco, hexToRgb) — vorher
 * in jedem Variant dupliziert, jetzt zentral hier.
 *
 * Single-Source-of-Truth für die Dashboard-Tokens. Wenn Farben/Radii sich
 * ändern, passiert das hier — kein Drift mehr zwischen Starter/Pro/Agency.
 */

import Link from "next/link";

export const D = {
  // Backgrounds
  page:         "#0b0c10",
  sidebar:      "#0A192F",
  card:         "rgba(255,255,255,0.03)",
  cardHover:    "rgba(255,255,255,0.05)",
  topbar:       "rgba(11,12,16,0.96)",

  // Borders
  border:       "rgba(255,255,255,0.07)",
  borderMid:    "rgba(255,255,255,0.1)",
  borderStrong: "rgba(255,255,255,0.14)",
  divider:      "rgba(255,255,255,0.06)",
  sidebarBdr:   "rgba(255,255,255,0.06)",

  // Typography
  text:         "#ffffff",
  textSub:      "rgba(255,255,255,0.5)",
  textMuted:    "rgba(255,255,255,0.3)",
  textFaint:    "rgba(255,255,255,0.18)",

  // Brand blue (primary)
  blue:         "#007BFF",
  blueSoft:     "#7aa6ff",
  blueBg:       "rgba(0,123,255,0.08)",
  blueBorder:   "rgba(0,123,255,0.25)",
  blueGlow:     "0 2px 14px rgba(0,123,255,0.35)",

  // Functional
  red:          "#c07070",
  redBg:        "rgba(160,80,80,0.08)",
  redBorder:    "rgba(160,80,80,0.18)",
  amber:        "#fbbf24",
  amberBg:      "rgba(251,191,36,0.1)",
  amberBorder:  "rgba(251,191,36,0.25)",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.1)",
  greenBorder:  "rgba(74,222,128,0.25)",

  // Shapes
  radius:   14,
  radiusSm: 8,
  radiusXs: 6,
} as const;

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Dark card matching marketing-site feature cards */
export function Card({
  children,
  style,
  accent,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}) {
  const border = accent ? `rgba(${hexToRgb(accent)},0.2)` : D.border;
  const bg     = accent ? `rgba(${hexToRgb(accent)},0.04)` : D.card;
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: D.radius,
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Label above sections — same style as marketing site */
export function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{
      margin: "0 0 6px",
      fontSize: 11, fontWeight: 700,
      color: color ?? D.textMuted,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    }}>
      {children}
    </p>
  );
}

/** Section heading */
export function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      margin: "0 0 20px",
      fontSize: 20, fontWeight: 800,
      color: D.text,
      letterSpacing: "-0.02em",
    }}>
      {children}
    </h2>
  );
}

/** Pill / badge — same language as marketing site pills */
export function Pill({
  children,
  color,
  size = "sm",
}: {
  children: React.ReactNode;
  color: string;
  size?: "xs" | "sm";
}) {
  const pad = size === "xs" ? "2px 7px" : "3px 10px";
  const fs  = size === "xs" ? 10 : 11;
  return (
    <span style={{
      display: "inline-block",
      fontSize: fs, fontWeight: 700,
      padding: pad,
      borderRadius: 20,
      background: `rgba(${hexToRgb(color)},0.12)`,
      border: `1px solid rgba(${hexToRgb(color)},0.28)`,
      color,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

/** Primary button — same as marketing site */
export function BtnPrimary({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) {
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 20px", borderRadius: D.radiusSm,
    background: D.blue, color: "#fff",
    fontSize: 13, fontWeight: 700,
    textDecoration: "none", border: "none", cursor: "pointer",
    boxShadow: D.blueGlow,
    fontFamily: "inherit",
  };
  if (href) return <Link href={href} style={style}>{children}</Link>;
  return <button onClick={onClick} style={style}>{children}</button>;
}

/** Ghost button */
export function BtnGhost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center",
      padding: "9px 18px", borderRadius: D.radiusSm,
      border: `1px solid ${D.borderStrong}`,
      color: D.textSub, fontSize: 13,
      textDecoration: "none",
    }}>
      {children}
    </Link>
  );
}

/** Horizontal divider */
export function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ borderTop: `1px solid ${D.divider}`, ...style }} />;
}

// ─── Severity badge ───────────────────────────────────────────────────────────
export function SevBadge({ sev }: { sev: "red" | "yellow" | "green" }) {
  const map = {
    // Severity-Color-Sync: red ist konsistent rot (#EF4444) — vorher gold-getönt
    red:    { label: "Prio",          color: "#EF4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)" },
    yellow: { label: "Optimierung",  color: D.amber, bg: D.amberBg, border: D.amberBorder },
    green:  { label: "Hinweis",      color: D.green, bg: D.greenBg, border: D.greenBorder },
  };
  const s = map[sev];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}


// ─── Lock icon ────────────────────────────────────────────────────────────────
export function LockIco({ size = 16, color = D.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ─── Hex → "r,g,b" helper ─────────────────────────────────────────────────────
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r},${g},${b}`;
  }
  return "255,255,255";
}
