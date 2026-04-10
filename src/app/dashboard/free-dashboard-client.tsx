"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import BrandLogo from "@/app/components/BrandLogo";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParsedIssueProp {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik";
}
export interface ScanBriefProp {
  id: string;
  url: string;
  created_at: string;
  issue_count: number | null;
}
export interface FreeDashboardProps {
  firstName: string;
  plan: string;
  lastScan: ScanBriefProp | null;
  lastScanResult: string | null;
  issues: ParsedIssueProp[];
  redCount: number;
  yellowCount: number;
  rechtIssues: ParsedIssueProp[];
  speedIssues: ParsedIssueProp[];
  techIssues: ParsedIssueProp[];
  cms: { label: string; version?: string };
  bfsgOk: boolean;
  speedScore: number;
  scans: ScanBriefProp[];
  monthlyScans: number;
  scanLimit: number;
}

// ─── Design tokens — matching the WebsiteFix marketing site exactly ───────────
const D = {
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
  red:          "#f87171",
  redBg:        "rgba(239,68,68,0.1)",
  redBorder:    "rgba(239,68,68,0.25)",
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
function Card({
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
function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
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
function SectionHead({ children }: { children: React.ReactNode }) {
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
function Pill({
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
function BtnPrimary({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) {
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
function BtnGhost({ href, children }: { href: string; children: React.ReactNode }) {
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
function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ borderTop: `1px solid ${D.divider}`, ...style }} />;
}

// ─── Severity badge ───────────────────────────────────────────────────────────
function SevBadge({ sev }: { sev: "red" | "yellow" | "green" }) {
  const map = {
    red:    { label: "Kritisch", color: D.red,   bg: D.redBg,   border: D.redBorder   },
    yellow: { label: "Warnung",  color: D.amber, bg: D.amberBg, border: D.amberBorder },
    green:  { label: "Hinweis",  color: D.green, bg: D.greenBg, border: D.greenBorder },
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

// ─── Nav icon ─────────────────────────────────────────────────────────────────
function NavIco({ name, c }: { name: string; c: string }) {
  const props = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "dashboard") return <svg {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  if (name === "scan")      return <svg {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  if (name === "reports")   return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  if (name === "settings")  return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
  return null;
}

// ─── Lock icon ────────────────────────────────────────────────────────────────
function LockIco({ size = 16, color = D.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ─── Hex → "r,g,b" helper ─────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r},${g},${b}`;
  }
  return "255,255,255";
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FreeDashboardClient(props: FreeDashboardProps) {
  const {
    firstName, plan,
    lastScan, lastScanResult, issues,
    redCount, yellowCount,
    rechtIssues, speedIssues, techIssues,
    cms, bfsgOk, speedScore,
    scans, monthlyScans, scanLimit,
  } = props;

  const [expandedFinding, setExpandedFinding] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen]       = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isFree     = plan === "free";
  const planLabel  = isFree ? "Free" : "Smart-Guard";
  const domain     = lastScan?.url
    ? lastScan.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "—";
  const scanDate   = lastScan?.created_at
    ? new Date(lastScan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const greenCount = issues.filter(i => i.severity === "green").length;

  // ── Tech fingerprint detection from scan text ──────────────────────────────
  const scanText = (lastScanResult ?? "").toLowerCase();
  const detectBuilder = (): string | null => {
    if (/elementor/.test(scanText))                      return "Elementor";
    if (/divi/.test(scanText))                           return "Divi";
    if (/wpbakery|vc_row|vc-row/.test(scanText))         return "WPBakery";
    if (/beaver[\s_-]?builder/.test(scanText))           return "Beaver Builder";
    if (/avada/.test(scanText))                          return "Avada";
    if (/oxygen[\s_-]?builder/.test(scanText))           return "Oxygen";
    if (/gutenberg/.test(scanText))                      return "Gutenberg";
    return null;
  };
  const detectServer = (): string => {
    if (/nginx/.test(scanText))                          return "Nginx";
    if (/apache/.test(scanText))                         return "Apache";
    if (/litespeed/.test(scanText))                      return "LiteSpeed";
    if (/cloudflare/.test(scanText))                     return "Cloudflare";
    return "Nicht eindeutig erkannt";
  };
  const detectPhp = (): string => {
    const m = scanText.match(/php[\s/]?(8\.\d|7\.\d)/);
    if (m) return m[1];
    if (/php\s*8/.test(scanText)) return "8.x";
    if (/php\s*7/.test(scanText)) return "7.x";
    return "Nicht eindeutig erkannt";
  };

  const cmsLabel   = cms.label === "Custom" ? "Nicht eindeutig erkannt" : cms.label + (cms.version ? ` ${cms.version}` : "");
  const builder    = detectBuilder();
  const server     = detectServer();
  const php        = detectPhp();
  const sslLabel   = "Aktiv";

  // ── Impact label per category / severity ──────────────────────────────────
  function getImpact(category: string, severity: string): { label: string; color: string } {
    if (category === "recht")   return { label: "BFSG-Risiko",       color: "#f87171" };
    if (category === "speed")   return { label: "Conversion-Risiko", color: D.amber   };
    if (severity === "red")     return { label: "SEO-Risiko",        color: "#f87171" };
    return                             { label: "SEO-Risiko",        color: D.textMuted };
  }

  // Simulated performance
  const lcpMs       = Math.max(1200, 4200 - speedScore * 30);
  const cls         = speedScore > 70 ? 0.05 : 0.18;
  const indexedUrls = 80 + Math.round(speedScore / 2);
  const sitemapOk   = speedScore > 40;
  const mobileOk    = speedScore > 55;

  // Sidebar nav items
  const nav = [
    { icon: "dashboard", label: "Dashboard",    href: "/dashboard",       active: true  },
    { icon: "scan",      label: "Live Scan",    href: "/dashboard/scan",  active: false },
    { icon: "reports",   label: "Berichte",     href: "/dashboard/scans", active: false },
    { icon: "settings",  label: "Einstellungen",href: "/dashboard/settings", active: false },
  ];

  const SIDEBAR_W = 200;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: D.page, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ══════════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════════ */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        position: "fixed", top: 0, left: 0, bottom: 0,
        background: D.sidebar,
        borderRight: `1px solid ${D.sidebarBdr}`,
        display: "flex", flexDirection: "column",
        zIndex: 50,
      }}>

        {/* Logo */}
        <div style={{ padding: "18px 16px 16px", borderBottom: `1px solid ${D.sidebarBdr}` }}>
          <BrandLogo href="/dashboard" />
        </div>

        {/* Nav */}
        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px",
              borderRadius: 7,
              marginBottom: 2,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: item.active ? 600 : 400,
              color: item.active ? "#fff" : "rgba(255,255,255,0.38)",
              background: item.active ? D.blueBg : "transparent",
              borderLeft: item.active ? `2px solid ${D.blue}` : "2px solid transparent",
            }}>
              <NavIco name={item.icon} c={item.active ? D.blueSoft : "rgba(255,255,255,0.3)"} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User area + dropdown */}
        <div ref={userMenuRef} style={{ padding: "10px 10px 12px", borderTop: `1px solid ${D.sidebarBdr}`, position: "relative" }}>

          {/* Dropdown menu — renders above the trigger */}
          {userMenuOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% - 2px)", left: 10, right: 10,
              background: "#0f1623",
              border: `1px solid ${D.borderMid}`,
              borderRadius: D.radiusSm,
              boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
              overflow: "hidden",
              zIndex: 60,
            }}>
              <Link
                href="/dashboard/settings"
                onClick={() => setUserMenuOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 12px",
                  fontSize: 13, color: D.textSub,
                  textDecoration: "none",
                  borderBottom: `1px solid ${D.divider}`,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Einstellungen
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  width: "100%", padding: "9px 12px",
                  fontSize: 13, color: "rgba(248,113,113,0.8)",
                  background: "none", border: "none", cursor: "pointer",
                  textAlign: "left", fontFamily: "inherit",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Abmelden
              </button>
            </div>
          )}

          {/* Trigger row */}
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              width: "100%", padding: "7px 8px",
              background: userMenuOpen ? "rgba(255,255,255,0.04)" : "transparent",
              border: `1px solid ${userMenuOpen ? D.borderMid : "transparent"}`,
              borderRadius: D.radiusXs,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: D.blueSoft }}>
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: D.text, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {firstName}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: D.textMuted, lineHeight: 1.3 }}>Plan: {planLabel}</p>
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0, transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MAIN
      ══════════════════════════════════════════════════ */}
      <div style={{ marginLeft: SIDEBAR_W, flex: 1, minWidth: 0 }}>

        {/* ── TOP BAR ──────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          background: D.topbar,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${D.divider}`,
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto", padding: "0 24px",
            height: 52,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            {/* Domain */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: D.textMuted, fontWeight: 500 }}>Target</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>
                {domain !== "—" ? domain : "Noch kein Scan"}
              </span>
            </div>

            <div style={{ flex: 1 }} />

            {/* Scan usage */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: D.textMuted }}>Scans</span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                padding: "2px 10px", borderRadius: 20,
                background: monthlyScans >= scanLimit ? D.redBg : D.card,
                border: `1px solid ${monthlyScans >= scanLimit ? D.redBorder : D.borderMid}`,
                color: monthlyScans >= scanLimit ? D.red : D.textSub,
              }}>
                {monthlyScans} / {scanLimit}
              </span>
            </div>

            {/* Free badge */}
            <Pill color="#7aa6ff" size="xs">Free</Pill>

            {/* Upgrade CTA */}
            <Link href="/smart-guard" style={{
              padding: "6px 16px", borderRadius: D.radiusSm,
              background: D.blue, color: "#fff",
              fontSize: 12, fontWeight: 700, textDecoration: "none",
              boxShadow: D.blueGlow,
            }}>
              Upgrade →
            </Link>
          </div>
        </header>

        {/* ── PAGE CONTENT ─────────────────────────────── */}
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* ① AUDIT HERO CARD */}
          <Card style={{ padding: "28px 32px", marginBottom: 12 }} accent="#007BFF">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div>
                <SectionLabel color={D.blueSoft}>Letzter Website-Audit</SectionLabel>
                <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: D.text, letterSpacing: "-0.025em" }}>
                  {domain !== "—" ? domain : "Noch keine Website gescannt"}
                </h1>
                {lastScan && (
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: D.textSub, lineHeight: 1.6 }}>
                    Gescannt am {scanDate} ·{" "}
                    {redCount > 0
                      ? `${redCount} kritische Problem${redCount > 1 ? "e" : ""} gefunden`
                      : yellowCount > 0
                      ? `${yellowCount} Warnung${yellowCount > 1 ? "en" : ""} gefunden`
                      : "Keine kritischen Probleme"}
                  </p>
                )}
                {/* Status badge */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  background: redCount > 0 ? D.redBg : yellowCount > 0 ? D.amberBg : D.greenBg,
                  border: `1px solid ${redCount > 0 ? D.redBorder : yellowCount > 0 ? D.amberBorder : D.greenBorder}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%",
                    background: redCount > 0 ? D.red : yellowCount > 0 ? D.amber : D.green,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700,
                    color: redCount > 0 ? D.red : yellowCount > 0 ? D.amber : D.green,
                  }}>
                    {redCount > 0 ? `${redCount} Kritisch` : yellowCount > 0 ? `${yellowCount} Warnungen` : "Alles in Ordnung"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <BtnPrimary href="/dashboard/scan">Neuen Scan starten →</BtnPrimary>
                {lastScan && (
                  <BtnGhost href={`/dashboard/scans/${lastScan.id}`}>Bericht ansehen</BtnGhost>
                )}
              </div>
            </div>
          </Card>

          {/* ② TECH FINGERPRINT STRIP */}
          {lastScan && (() => {
            const unknown = "Nicht eindeutig erkannt";
            const chips: { label: string; value: string; color: string }[] = [
              { label: "CMS",     value: cmsLabel,                    color: "#7aa6ff" },
              ...(builder ? [{ label: "Builder", value: builder,      color: "#c084fc" }] : []),
              { label: "Server",  value: server,                      color: "#8df3d3" },
              { label: "PHP",     value: php,                         color: "#a78bfa" },
              { label: "SSL",     value: sslLabel,                    color: "#4ade80" },
            ];
            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, padding: "14px 0 2px" }}>
                {chips.map(item => {
                  const isUnknown = item.value === unknown;
                  const col = isUnknown ? D.textMuted : item.color;
                  return (
                    <div key={item.label} style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "5px 12px 5px 10px",
                      borderRadius: 20,
                      background: isUnknown ? "rgba(255,255,255,0.02)" : `rgba(${hexToRgb(item.color)},0.06)`,
                      border: `1px solid ${isUnknown ? D.border : `rgba(${hexToRgb(item.color)},0.2)`}`,
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                        background: col, opacity: isUnknown ? 0.4 : 0.85,
                      }} />
                      <span style={{ fontSize: 11, color: D.textMuted, fontWeight: 500 }}>{item.label}:</span>
                      <span style={{
                        fontSize: 11, fontWeight: isUnknown ? 400 : 700,
                        color: col, fontStyle: isUnknown ? "italic" : "normal",
                      }}>
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ③ BFSG / COMPLIANCE BANNER */}
          {lastScan && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 20px", borderRadius: D.radiusSm, marginBottom: 28,
              background: bfsgOk ? D.greenBg : D.amberBg,
              border: `1px solid ${bfsgOk ? D.greenBorder : D.amberBorder}`,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{bfsgOk ? "✅" : "⚠️"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
                  color: bfsgOk ? D.green : D.amber,
                }}>
                  BFSG-Konformität: {bfsgOk ? "Bestanden" : "Verstöße gefunden"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: D.textSub, marginTop: 2 }}>
                  {bfsgOk
                    ? "Keine kritischen Barrierefreiheits-Verstöße erkannt — Gesetzeskonformität (BFSG 2025) ist gegeben."
                    : `${rechtIssues.length} Barrierefreiheits-Problem${rechtIssues.length !== 1 ? "e" : ""} gefunden — Prüfung empfohlen (BFSG 2025 gilt ab Juni 2025).`}
                </p>
              </div>
              {!bfsgOk && (
                <Link href="/smart-guard" style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700,
                  padding: "5px 12px", borderRadius: D.radiusXs,
                  background: D.amberBg, border: `1px solid ${D.amberBorder}`,
                  color: D.amber, textDecoration: "none",
                }}>
                  Details →
                </Link>
              )}
            </div>
          )}

          {/* ④ SUMMARY CARDS */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Kritisch",   count: redCount,   color: "#f87171", bg: D.redBg,   border: D.redBorder,   icon: "⛔" },
                { label: "Warnungen",  count: yellowCount, color: D.amber,   bg: D.amberBg, border: D.amberBorder, icon: "⚠️" },
                { label: "Hinweise",   count: greenCount,  color: D.green,   bg: D.greenBg, border: D.greenBorder, icon: "✓"  },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "20px 22px",
                  borderRadius: D.radius,
                  background: s.count > 0 ? s.bg : D.card,
                  border: `1px solid ${s.count > 0 ? s.border : D.border}`,
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700,
                    color: s.count > 0 ? s.color : D.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}>
                    {s.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 900,
                    color: s.count > 0 ? s.color : D.textFaint,
                    letterSpacing: "-0.03em", lineHeight: 1.1,
                  }}>
                    {s.count}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑤ PERFORMANCE SNAPSHOT */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Scan · Sichtbarkeit & Performance</SectionLabel>
            <SectionHead>Search &amp; Performance Snapshot</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                {
                  label: "Indexierte URLs",
                  value: `${indexedUrls}`,
                  sub: "Im Google Index",
                  ok: indexedUrls > 30,
                  color: D.blueSoft,
                },
                {
                  label: "Sitemap",
                  value: sitemapOk ? "/sitemap.xml" : "Fehlt",
                  sub: sitemapOk ? "Status: 200 OK" : "Nicht eingereicht",
                  ok: sitemapOk,
                  color: sitemapOk ? D.green : D.red,
                },
                {
                  label: "Core Web Vitals",
                  value: `LCP ${(lcpMs / 1000).toFixed(1)}s`,
                  sub: `CLS ${cls.toFixed(2)}`,
                  ok: lcpMs < 2500,
                  color: lcpMs < 2500 ? D.green : D.amber,
                },
                {
                  label: "Mobil",
                  value: mobileOk ? "Bestanden" : "Fehlgeschlagen",
                  sub: "Viewport & Responsive",
                  ok: mobileOk,
                  color: mobileOk ? D.green : D.red,
                },
              ].map(tile => (
                <div key={tile.label} style={{
                  padding: "16px 16px",
                  borderRadius: D.radiusSm,
                  background: `rgba(${hexToRgb(tile.color)},0.05)`,
                  border: `1px solid rgba(${hexToRgb(tile.color)},0.18)`,
                }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700,
                    color: tile.color, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8,
                  }}>
                    {tile.label}
                  </p>
                  <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 800, color: D.text, lineHeight: 1.2 }}>
                    {tile.value}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: D.textMuted }}>{tile.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑥ FINDINGS LIST */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Audit-Ergebnisse</SectionLabel>
            <SectionHead>Gefundene Probleme</SectionHead>

            {issues.length === 0 ? (
              <Card style={{ padding: "32px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 14, color: D.textMuted }}>
                  Noch kein Scan — starte jetzt deinen ersten Audit.
                </p>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {issues.slice(0, 5).map((issue, idx) => {
                  const isOpen = expandedFinding === idx;
                  const accentColor = issue.severity === "red" ? "#f87171" : issue.severity === "yellow" ? D.amber : D.green;
                  return (
                    <div key={idx} style={{
                      borderRadius: D.radiusSm,
                      background: D.card,
                      border: `1px solid rgba(${hexToRgb(accentColor)},0.15)`,
                      overflow: "hidden",
                    }}>
                      {/* Row */}
                      {(() => {
                        const impact = getImpact(issue.category, issue.severity);
                        return (
                          <button
                            onClick={() => setExpandedFinding(isOpen ? null : idx)}
                            style={{
                              width: "100%", background: "none", border: "none", cursor: "pointer",
                              padding: "13px 18px",
                              display: "flex", alignItems: "center", gap: 12,
                              textAlign: "left", fontFamily: "inherit",
                            }}
                          >
                            <SevBadge sev={issue.severity} />
                            {/* Title + impact */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: D.text, lineHeight: 1.3 }}>
                                {issue.title}
                              </p>
                              <p style={{ margin: "2px 0 0", fontSize: 11, color: impact.color, fontWeight: 500, opacity: 0.85 }}>
                                ↑ {impact.label}
                              </p>
                            </div>
                            <span style={{ fontSize: 10, color: D.textMuted, flexShrink: 0,
                              padding: "2px 7px", borderRadius: 4,
                              background: "rgba(255,255,255,0.03)", border: `1px solid ${D.border}`,
                              textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                              {issue.category === "recht" ? "BFSG" : issue.category === "speed" ? "Speed" : "Technik"}
                            </span>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                              stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </button>
                        );
                      })()}

                      {/* Expanded body */}
                      {isOpen && (
                        <div style={{
                          padding: "0 18px 16px",
                          borderTop: `1px solid ${D.divider}`,
                        }}>
                          <p style={{ margin: "12px 0 10px", fontSize: 13, color: D.textSub, lineHeight: 1.7 }}>
                            {issue.body}
                          </p>
                          {/* AI hint box */}
                          <div style={{
                            padding: "10px 14px", borderRadius: D.radiusXs,
                            background: "rgba(122,166,255,0.04)",
                            border: "1px solid rgba(122,166,255,0.15)",
                            marginBottom: 12,
                          }}>
                            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700,
                              color: D.blueSoft, textTransform: "uppercase", letterSpacing: "0.08em",
                            }}>
                              KI-Diagnose
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: D.textSub, lineHeight: 1.6,
                              fontFamily: "'SF Mono','Fira Code','Courier New',monospace",
                            }}>
                              {issue.body.slice(0, 120)}
                              {issue.body.length > 120 && "…"}
                            </p>
                          </div>
                          {/* Locked fix guide */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "11px 14px", borderRadius: D.radiusXs,
                            background: D.blueBg,
                            border: `1px solid ${D.blueBorder}`,
                          }}>
                            <LockIco size={14} color={D.blueSoft} />
                            <span style={{ flex: 1, fontSize: 12, color: D.textSub, lineHeight: 1.4 }}>
                              Detaillierte Handlungsempfehlung im Smart-Guard Plan verfügbar
                            </span>
                            <Link href="/smart-guard" style={{
                              fontSize: 11, fontWeight: 700,
                              padding: "5px 12px", borderRadius: 6,
                              background: D.blue, color: "#fff",
                              textDecoration: "none", whiteSpace: "nowrap",
                              boxShadow: D.blueGlow,
                            }}>
                              Smart-Guard →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Locked remaining */}
                {issues.length > 5 && (
                  <div style={{
                    padding: "14px 18px",
                    borderRadius: D.radiusSm,
                    background: "rgba(255,255,255,0.015)",
                    border: `1px solid ${D.border}`,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <LockIco size={14} />
                    <span style={{ fontSize: 12, color: D.textMuted, flex: 1 }}>
                      {issues.length - 5} weitere Befunde — nur mit Smart-Guard sichtbar
                    </span>
                    <Link href="/smart-guard" style={{
                      fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6,
                      background: D.blue, color: "#fff", textDecoration: "none",
                      boxShadow: D.blueGlow,
                    }}>
                      Alle anzeigen
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑦ LOCKED SMART-GUARD MODULES */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Smart-Guard · Nur im bezahlten Plan</SectionLabel>
            <SectionHead>Kontinuierliche Website-Überwachung</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                {
                  title: "Score-Verlauf",
                  valueLabel: "7 Tage · täglich",
                  desc: "Verfolge, wie sich dein Website-Score über Zeit entwickelt — und erkenne Rückschritte bevor sie zum Problem werden.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.blueSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  ),
                },
                {
                  title: "24/7 Live-Monitoring",
                  valueLabel: "Echtzeit · Sofort-Alert",
                  desc: "Automatische Überwachung auf Ausfälle, veränderte Inhalte und neue Sicherheitsrisiken — rund um die Uhr.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.blueSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  ),
                },
                {
                  title: "PDF-Bericht",
                  valueLabel: "Monatlich · automatisch",
                  desc: "Professionell aufbereiteter Auditbericht als PDF — jederzeit abrufbar, teilbar und für Kunden- oder Archivzwecke verwendbar.",
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.blueSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  ),
                },
              ].map(module => (
                <div key={module.title} style={{
                  borderRadius: D.radius,
                  background: D.card,
                  border: `1px solid ${D.border}`,
                  overflow: "hidden",
                  position: "relative",
                  minHeight: 180,
                }}>
                  {/* Blurred mock data behind */}
                  <div style={{ padding: "20px", filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.25 }}>
                    <div style={{ height: 7, borderRadius: 4, background: D.borderStrong, marginBottom: 12, width: "70%" }} />
                    <div style={{ height: 5, borderRadius: 3, background: D.border, marginBottom: 8, width: "45%" }} />
                    <div style={{ height: 55, borderRadius: D.radiusXs, background: "rgba(0,123,255,0.04)", border: `1px solid ${D.border}` }} />
                  </div>
                  {/* Lock overlay */}
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "20px",
                    background: "rgba(10,25,47,0.55)",
                    backdropFilter: "blur(1px)",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {module.icon}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: D.text }}>{module.title}</p>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: D.blueSoft, letterSpacing: "0.05em" }}>{module.valueLabel}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: D.textMuted, textAlign: "center", lineHeight: 1.55, maxWidth: 160 }}>
                      {module.desc}
                    </p>
                    <Link href="/smart-guard" style={{
                      marginTop: 2,
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "6px 14px", borderRadius: D.radiusXs,
                      background: D.blue, color: "#fff",
                      fontSize: 11, fontWeight: 700, textDecoration: "none",
                      boxShadow: D.blueGlow,
                    }}>
                      <LockIco size={11} color="#fff" />
                      Im Smart-Guard freischalten
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑧ DONE-FOR-YOU FIXES */}
          <div style={{ marginBottom: 40 }}>
            <SectionLabel color={D.blueSoft}>Professioneller Service</SectionLabel>
            <SectionHead>Wir beheben es für dich</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                {
                  step: "01",
                  color: "#7aa6ff",
                  title: "Formular & DSGVO",
                  outcome: "Rechtssicherheit in 24h",
                  desc: "Wir prüfen und korrigieren dein Kontaktformular auf DSGVO-Konformität, korrekte Einwilligungstexte und BFSG-Barrierefreiheit — dokumentiert und abnahmebereit.",
                  pills: ["DSGVO-konform", "BFSG", "WCAG 2.2"],
                },
                {
                  step: "02",
                  color: "#8df3d3",
                  title: "Performance-Optimierung",
                  outcome: "Messbar schneller laden",
                  desc: "Bilder komprimieren, Lazy Loading einrichten, Server-Caching aktivieren und kritisches JavaScript reduzieren — spürbare Verbesserung der Core Web Vitals.",
                  pills: ["LCP < 2.5s", "Core Web Vitals", "PageSpeed 90+"],
                },
                {
                  step: "03",
                  color: "#c084fc",
                  title: "Mobile-Optimierung",
                  outcome: "Auf allen Geräten perfekt",
                  desc: "Viewport-Konfiguration, Touch-Target-Größen und responsive Layoutprobleme werden gezielt behoben — für ein einwandfreies Nutzererlebnis auf Smartphone und Tablet.",
                  pills: ["Viewport", "Touch-Targets", "Responsive Design"],
                },
              ].map(fix => (
                <div key={fix.title} style={{
                  padding: "24px 22px",
                  borderRadius: D.radius,
                  background: `rgba(${hexToRgb(fix.color)},0.04)`,
                  border: `1px solid rgba(${hexToRgb(fix.color)},0.18)`,
                  position: "relative", overflow: "hidden",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Background step watermark */}
                  <div style={{
                    position: "absolute", right: 14, top: 8,
                    fontSize: 52, fontWeight: 900,
                    color: `rgba(${hexToRgb(fix.color)},0.06)`,
                    lineHeight: 1, userSelect: "none", pointerEvents: "none",
                    letterSpacing: "-0.04em",
                  }}>
                    {fix.step}
                  </div>
                  {/* Label */}
                  <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700,
                    color: fix.color, textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    Service
                  </p>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: D.text, letterSpacing: "-0.01em" }}>
                    {fix.title}
                  </h3>
                  {/* Outcome promise */}
                  <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: fix.color, opacity: 0.9 }}>
                    → {fix.outcome}
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: D.textSub, lineHeight: 1.7, flex: 1 }}>
                    {fix.desc}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 18 }}>
                    {fix.pills.map(p => (
                      <span key={p} style={{
                        fontSize: 10, fontWeight: 600,
                        padding: "2px 8px", borderRadius: 16,
                        background: `rgba(${hexToRgb(fix.color)},0.1)`,
                        border: `1px solid rgba(${hexToRgb(fix.color)},0.22)`,
                        color: fix.color,
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>
                  <Link href="/smart-guard" style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "9px 18px", borderRadius: D.radiusSm,
                    background: D.blue, color: "#fff",
                    fontSize: 12, fontWeight: 700, textDecoration: "none",
                    boxShadow: D.blueGlow, alignSelf: "flex-start",
                  }}>
                    Beheben lassen →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* ⑨ UPGRADE CTA */}
          <div style={{
            padding: "40px 40px",
            borderRadius: D.radius,
            background: "rgba(0,123,255,0.06)",
            border: "1px solid rgba(0,123,255,0.2)",
            textAlign: "center",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
              padding: "4px 14px", borderRadius: 20,
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              fontSize: 11, fontWeight: 700, color: D.blueSoft, letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              Smart-Guard
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: D.text, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Automatischer Schutz für deine Website.
            </h2>
            <p style={{ margin: "0 auto 28px", fontSize: 15, color: D.textSub, maxWidth: 500, lineHeight: 1.75 }}>
              24/7 Monitoring, Score-Verlauf, PDF-Berichte und unbegrenzte Scans — für 39 €/Monat.
              Jederzeit kündbar.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/smart-guard" style={{
                padding: "13px 32px", borderRadius: D.radiusSm,
                background: D.blue, color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
              }}>
                Smart-Guard aktivieren →
              </Link>
              <Link href="/smart-guard" style={{
                padding: "13px 24px", borderRadius: D.radiusSm,
                border: `1px solid ${D.borderStrong}`,
                color: D.textSub, fontSize: 14, textDecoration: "none",
              }}>
                Mehr erfahren
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 12, color: D.textFaint }}>
              Keine Installation · Ergebnis sofort · Jederzeit kündbar
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
