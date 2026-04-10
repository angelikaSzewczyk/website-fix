"use client";

import { useState } from "react";
import Link from "next/link";

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

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  pageBg:    "#F5F6FA",
  sidebar:   "#1A1C23",
  sidebarBorder: "#2A2C35",
  card:      "#FFFFFF",
  border:    "#E5E7EB",
  divider:   "#F3F4F6",
  text:      "#111827",
  sub:       "#6B7280",
  muted:     "#9CA3AF",
  blue:      "#2563EB",
  blueBg:    "#EFF6FF",
  blueBorder:"#BFDBFE",
  red:       "#EF4444",
  redBg:     "#FEF2F2",
  redBorder: "#FECACA",
  amber:     "#F59E0B",
  amberBg:   "#FFFBEB",
  amberBorder:"#FDE68A",
  green:     "#22C55E",
  greenBg:   "#F0FDF4",
  greenBorder:"#BBF7D0",
  shadow:    "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)",
} as const;

// ─── Small helpers ─────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      boxShadow: T.shadow,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {children}
    </p>
  );
}

function SevBadge({ severity }: { severity: "red" | "yellow" | "green" }) {
  const map = {
    red:    { label: "Kritisch", color: T.red,   bg: T.redBg,   border: T.redBorder },
    yellow: { label: "Warnung",  color: T.amber, bg: T.amberBg, border: T.amberBorder },
    green:  { label: "OK",       color: T.green, bg: T.greenBg, border: T.greenBorder },
  };
  const s = map[severity];
  return (
    <span style={{
      display: "inline-block",
      fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function FreeDashboardClient(props: FreeDashboardProps) {
  const {
    firstName,
    plan,
    lastScan,
    issues,
    redCount,
    yellowCount,
    cms,
    speedScore,
    monthlyScans,
    scanLimit,
  } = props;

  const [findingsOpen, setFindingsOpen] = useState(true);

  const okCount     = issues.filter(i => i.severity === "green").length;
  const domain      = lastScan?.url
    ? lastScan.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "—";
  const isFree      = plan === "free";
  const planLabel   = isFree ? "Free" : "Smart-Guard";

  // Simulated tech details
  const server = "Nginx";
  const php    = "8.2";
  const ssl    = "Aktiv";

  // Performance simulation
  const lcpMs  = Math.max(1200, 4200 - speedScore * 30);
  const cls    = speedScore > 70 ? 0.05 : 0.18;
  const fid    = speedScore > 60 ? 42 : 180;

  const navItems = [
    { label: "Dashboard",    href: "/dashboard",         active: true  },
    { label: "Live Scan",    href: "/dashboard/scan",    active: false },
    { label: "Monitoring",   href: "/dashboard/monitor", active: false },
    { label: "Reports",      href: "/dashboard/scans",   active: false },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        position: "fixed", top: 0, left: 0, bottom: 0,
        background: T.sidebar,
        borderRight: `1px solid ${T.sidebarBorder}`,
        display: "flex", flexDirection: "column",
        zIndex: 40,
        overflowY: "auto",
      }}>

        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${T.sidebarBorder}` }}>
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: T.blue,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              WebsiteFix
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px 12px", flex: 1 }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 7,
              textDecoration: "none",
              marginBottom: 2,
              background: item.active ? "rgba(255,255,255,0.07)" : "transparent",
              color: item.active ? "#FFFFFF" : "#9CA3AF",
              fontSize: 14, fontWeight: item.active ? 600 : 400,
              transition: "background 0.15s",
            }}>
              <NavIcon name={item.label} active={item.active} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.sidebarBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#2A2C35",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF" }}>
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{firstName}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#6B7280" }}>Plan: {planLabel}</p>
            </div>
          </div>
        </div>

      </aside>

      {/* ── MAIN ─────────────────────────────────────────────────────────────── */}
      <div style={{ marginLeft: 240, flex: 1, minWidth: 0, background: T.pageBg, minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
            marginBottom: 24,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: T.muted, fontWeight: 500, marginBottom: 2 }}>Target</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>{domain}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                padding: "7px 14px", borderRadius: 8,
                background: T.card, border: `1px solid ${T.border}`,
                fontSize: 13, color: T.sub, fontWeight: 500,
              }}>
                Scan-Nutzung: <strong style={{ color: T.text }}>{monthlyScans} / {scanLimit}</strong>
              </div>
              <Link href="/smart-guard" style={{
                padding: "7px 16px", borderRadius: 8,
                background: T.blue, color: "#fff",
                fontSize: 13, fontWeight: 600,
                textDecoration: "none",
              }}>
                Upgrade
              </Link>
            </div>
          </div>

          {/* ── TECH STRIP ─────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", gap: 8, flexWrap: "wrap",
            marginBottom: 28,
          }}>
            {[
              { label: "CMS",    value: cms.label + (cms.version ? ` ${cms.version}` : "") },
              { label: "Server", value: server },
              { label: "PHP",    value: php },
              { label: "SSL",    value: ssl },
            ].map(item => (
              <div key={item.label} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 6,
                background: T.card, border: `1px solid ${T.border}`,
                fontSize: 12,
              }}>
                <span style={{ color: T.muted, fontWeight: 500 }}>{item.label}:</span>
                <span style={{ color: T.text, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* ── SECTION 1: STATUS ──────────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>Status</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <Card style={{ padding: "18px 20px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: T.red }}>Kritisch</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text }}>{redCount}</p>
              </Card>
              <Card style={{ padding: "18px 20px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: T.amber }}>Warnungen</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text }}>{yellowCount}</p>
              </Card>
              <Card style={{ padding: "18px 20px" }}>
                <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: T.green }}>OK</p>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: T.text }}>{okCount}</p>
              </Card>
            </div>
          </div>

          {/* ── SECTION 2: PERFORMANCE ─────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>Performance</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                {
                  metric: "LCP",
                  value: `${(lcpMs / 1000).toFixed(1)}s`,
                  label: "Largest Contentful Paint",
                  ok: lcpMs < 2500,
                },
                {
                  metric: "CLS",
                  value: cls.toFixed(2),
                  label: "Cumulative Layout Shift",
                  ok: cls < 0.1,
                },
                {
                  metric: "FID",
                  value: `${fid}ms`,
                  label: "First Input Delay",
                  ok: fid < 100,
                },
              ].map(p => (
                <Card key={p.metric} style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{p.metric}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                      color: p.ok ? T.green : T.amber,
                      background: p.ok ? T.greenBg : T.amberBg,
                      border: `1px solid ${p.ok ? T.greenBorder : T.amberBorder}`,
                    }}>
                      {p.ok ? "Gut" : "Prüfen"}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: T.text }}>{p.value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{p.label}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* ── SECTION 3: FINDINGS ────────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SectionTitle>Befunde</SectionTitle>
              {issues.length > 0 && (
                <button
                  onClick={() => setFindingsOpen(o => !o)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: T.blue, fontWeight: 600, padding: 0 }}
                >
                  {findingsOpen ? "Einklappen" : `Alle anzeigen (${issues.length})`}
                </button>
              )}
            </div>
            <Card>
              {issues.length === 0 ? (
                <div style={{ padding: "24px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                  Keine Befunde gefunden.
                </div>
              ) : (
                <>
                  {(findingsOpen ? issues.slice(0, 5) : issues.slice(0, 3)).map((issue, idx) => (
                    <div key={idx} style={{
                      display: "flex", alignItems: "flex-start", gap: 14,
                      padding: "14px 20px",
                      borderBottom: `1px solid ${T.divider}`,
                    }}>
                      <div style={{ paddingTop: 1 }}>
                        <SevBadge severity={issue.severity} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: T.text }}>{issue.title}</p>
                        <p style={{ margin: 0, fontSize: 12, color: T.sub, lineHeight: 1.5 }}>
                          {issue.body.length > 100 ? issue.body.slice(0, 100) + "…" : issue.body}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Locked fix guide */}
                  <div style={{
                    padding: "14px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                    background: "#FAFAFA",
                    borderRadius: "0 0 10px 10px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>🔒</span>
                      <span style={{ fontSize: 13, color: T.sub, fontWeight: 500 }}>
                        Vollständige Anleitungen gesperrt
                      </span>
                    </div>
                    <Link href="/smart-guard" style={{
                      padding: "7px 14px", borderRadius: 7,
                      background: T.blue, color: "#fff",
                      fontSize: 12, fontWeight: 600,
                      textDecoration: "none",
                    }}>
                      Anleitungen freischalten
                    </Link>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* ── SECTION 4: LOCKED ──────────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <SectionTitle>Premium-Funktionen</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {[
                { title: "Score-Verlauf", desc: "Entwicklung deines Website-Scores über Zeit" },
                { title: "Live Monitoring", desc: "24/7 Überwachung mit sofortiger Alarmierung" },
              ].map(block => (
                <Card key={block.title} style={{ padding: "20px", position: "relative", overflow: "hidden" }}>
                  {/* Blurred content behind */}
                  <div style={{ filter: "blur(3px)", pointerEvents: "none", userSelect: "none", opacity: 0.4 }}>
                    <div style={{ height: 8, borderRadius: 4, background: T.border, marginBottom: 10 }} />
                    <div style={{ height: 8, borderRadius: 4, background: T.border, width: "70%", marginBottom: 10 }} />
                    <div style={{ height: 60, borderRadius: 6, background: T.divider }} />
                  </div>
                  {/* Lock overlay */}
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: T.card, border: `1px solid ${T.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: T.shadow,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{block.title}</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted, textAlign: "center", maxWidth: 180 }}>{block.desc}</p>
                    <Link href="/smart-guard" style={{
                      marginTop: 4,
                      padding: "6px 14px", borderRadius: 7,
                      background: T.blue, color: "#fff",
                      fontSize: 12, fontWeight: 600,
                      textDecoration: "none",
                    }}>
                      Freischalten
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── SECTION 5: FIXES ───────────────────────────────────────────── */}
          <div>
            <SectionTitle>Sofort-Fixes</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {[
                { title: "Formular Fix",  desc: "Kontaktformular auf Datenschutz & Barrierefreiheit prüfen" },
                { title: "Speed Fix",     desc: "Bilder komprimieren, Caching aktivieren, JS minimieren" },
                { title: "Mobile Fix",    desc: "Viewport, Touch-Targets und responsive Layouts prüfen" },
              ].map(fix => (
                <Card key={fix.title} style={{ padding: "18px 20px" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: T.text }}>{fix.title}</p>
                  <p style={{ margin: "0 0 14px", fontSize: 12, color: T.sub, lineHeight: 1.5 }}>{fix.desc}</p>
                  <Link href="/smart-guard" style={{
                    display: "inline-block",
                    padding: "7px 14px", borderRadius: 7,
                    background: T.blueBg, color: T.blue,
                    border: `1px solid ${T.blueBorder}`,
                    fontSize: 12, fontWeight: 600,
                    textDecoration: "none",
                  }}>
                    Jetzt beheben
                  </Link>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Nav icon helper ───────────────────────────────────────────────────────────
function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? "#FFFFFF" : "#6B7280";
  const w = 16;
  switch (name) {
    case "Dashboard":
      return (
        <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      );
    case "Live Scan":
      return (
        <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      );
    case "Monitoring":
      return (
        <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      );
    case "Reports":
      return (
        <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      );
    default:
      return null;
  }
}
