import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import BrandLogo from "@/app/components/BrandLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Berichte — WebsiteFix",
  robots: { index: false },
};

// ─── Shared design tokens ─────────────────────────────────────────────────────
const D = {
  page:         "#0b0c10",
  sidebar:      "#0A192F",
  card:         "rgba(255,255,255,0.03)",
  topbar:       "rgba(11,12,16,0.96)",
  border:       "rgba(255,255,255,0.07)",
  borderMid:    "rgba(255,255,255,0.1)",
  borderStrong: "rgba(255,255,255,0.14)",
  divider:      "rgba(255,255,255,0.06)",
  sidebarBdr:   "rgba(255,255,255,0.06)",
  text:         "#ffffff",
  textSub:      "rgba(255,255,255,0.5)",
  textMuted:    "rgba(255,255,255,0.3)",
  textFaint:    "rgba(255,255,255,0.18)",
  blue:         "#007BFF",
  blueSoft:     "#7aa6ff",
  blueBg:       "rgba(0,123,255,0.08)",
  blueBorder:   "rgba(0,123,255,0.25)",
  blueGlow:     "0 2px 14px rgba(0,123,255,0.35)",
  amber:        "#fbbf24",
  amberBg:      "rgba(251,191,36,0.1)",
  amberBorder:  "rgba(251,191,36,0.25)",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.1)",
  greenBorder:  "rgba(74,222,128,0.25)",
  red:          "#f87171",
  redBg:        "rgba(239,68,68,0.1)",
  redBorder:    "rgba(239,68,68,0.25)",
  radius:       14,
  radiusSm:     8,
  radiusXs:     6,
} as const;

const SIDEBAR_W = 200;

// ─── Sidebar nav icons ────────────────────────────────────────────────────────
function NavIco({ name, active }: { name: string; active: boolean }) {
  const c = active ? "#7aa6ff" : "rgba(255,255,255,0.3)";
  const p = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "dashboard") return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  if (name === "scan")      return <svg {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
  if (name === "reports")   return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
  return null;
}

export default async function ScansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "free";
  const firstName = session.user.name?.split(" ")[0] ?? "User";

  // Fetch scan history
  let scans: { id: string; url: string; created_at: string; issue_count: number | null }[] = [];
  try {
    const sql = neon(process.env.DATABASE_URL!);
    scans = await sql`
      SELECT id::text, url, created_at::text, issue_count
      FROM scans
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 20
    ` as typeof scans;
  } catch { /* non-critical */ }

  const nav = [
    { icon: "dashboard", label: "Dashboard",  href: "/dashboard",       active: false },
    { icon: "scan",      label: "Live Scan",  href: "/dashboard/scan",  active: false },
    { icon: "reports",   label: "Berichte",   href: "/dashboard/scans", active: true  },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: D.page, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        position: "fixed", top: 0, left: 0, bottom: 0,
        background: D.sidebar,
        borderRight: `1px solid ${D.sidebarBdr}`,
        display: "flex", flexDirection: "column",
        zIndex: 50,
      }}>
        <div style={{ padding: "18px 16px 16px", borderBottom: `1px solid ${D.sidebarBdr}` }}>
          <BrandLogo href="/dashboard" />
        </div>
        <nav style={{ padding: "10px 8px", flex: 1 }}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 7, marginBottom: 2,
              textDecoration: "none", fontSize: 13,
              fontWeight: item.active ? 600 : 400,
              color: item.active ? "#fff" : "rgba(255,255,255,0.38)",
              background: item.active ? D.blueBg : "transparent",
              borderLeft: item.active ? `2px solid ${D.blue}` : "2px solid transparent",
            }}>
              <NavIco name={item.icon} active={item.active} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: "10px 10px 12px", borderTop: `1px solid ${D.sidebarBdr}` }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "7px 8px",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: D.blueSoft }}>
                {firstName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {firstName}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: D.textMuted }}>Free Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <main style={{ marginLeft: SIDEBAR_W, flex: 1, minWidth: 0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Berichte
            </p>
            <h1 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: D.text, letterSpacing: "-0.03em" }}>
              PDF-Berichte &amp; Dokumentation
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: D.textMuted, lineHeight: 1.6 }}>
              Automatisch erstellte Monatsberichte für dein Projekt — archiviert, teilbar und professionell aufbereitet.
            </p>
          </div>

          {/* ── PDF REPORTS — locked empty state ─────────────── */}
          <div style={{
            padding: "56px 40px",
            background: D.card,
            border: `1px solid ${D.border}`,
            borderRadius: D.radius,
            textAlign: "center",
            marginBottom: 32,
            position: "relative", overflow: "hidden",
          }}>
            {/* Background glow */}
            <div style={{
              position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
              width: 300, height: 300,
              background: "radial-gradient(circle, rgba(0,123,255,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* PDF icon */}
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              position: "relative", zIndex: 1,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={D.blueSoft} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>

            <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
              Noch keine Berichte vorhanden
            </h2>
            <p style={{ margin: "0 auto 28px", fontSize: 14, color: D.textMuted, lineHeight: 1.75, maxWidth: 460, position: "relative", zIndex: 1 }}>
              Deine monatlichen Experten-Berichte werden hier automatisch archiviert.
              Verfügbar im <strong style={{ color: D.text }}>Smart-Guard Plan</strong>.
            </p>

            {/* Feature list */}
            <div style={{
              display: "inline-flex", flexDirection: "column", gap: 8,
              textAlign: "left", marginBottom: 28,
              position: "relative", zIndex: 1,
            }}>
              {[
                "Automatisch erstellter PDF-Bericht jeden Monat",
                "Strukturiert aufbereitet — teilbar mit Kunden",
                "Score-Verlauf, Probleme & behobene Punkte",
                "Für interne Dokumentation und Nachweise",
              ].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={D.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: 13, color: D.textSub }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ position: "relative", zIndex: 1 }}>
              <Link href="/smart-guard" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "12px 28px", borderRadius: D.radiusSm,
                background: D.blue, color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
              }}>
                Berichte jetzt aktivieren →
              </Link>
              <p style={{ margin: "12px 0 0", fontSize: 12, color: D.textFaint }}>
                Smart-Guard Plan · 39 €/Monat · Jederzeit kündbar
              </p>
            </div>
          </div>

          {/* ── SCAN HISTORY ─────────────────────────────────── */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Scan-Verlauf
            </p>
            <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
              Vergangene Audits
            </h2>

            {scans.length === 0 ? (
              <div style={{
                padding: "28px", borderRadius: D.radiusSm,
                background: D.card, border: `1px solid ${D.border}`,
                textAlign: "center",
              }}>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: D.textMuted }}>
                  Noch keine Scans durchgeführt.
                </p>
                <Link href="/dashboard/scan" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "8px 18px", borderRadius: D.radiusXs,
                  background: D.blue, color: "#fff",
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                  boxShadow: D.blueGlow,
                }}>
                  Ersten Scan starten →
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {scans.map(scan => {
                  const domain = scan.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
                  const date   = new Date(scan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
                  const issues = scan.issue_count ?? 0;
                  const accent = issues === 0 ? D.green : issues <= 3 ? D.amber : D.red;
                  return (
                    <Link key={scan.id} href={`/dashboard/scans/${scan.id}`} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 18px", borderRadius: D.radiusSm,
                      background: D.card, border: `1px solid ${D.border}`,
                      textDecoration: "none",
                      transition: "border-color 0.15s",
                    }}>
                      {/* Severity dot */}
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: accent, flexShrink: 0,
                      }} />
                      {/* Domain */}
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {domain}
                      </span>
                      {/* Issue count */}
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        padding: "2px 9px", borderRadius: 20,
                        background: issues === 0 ? D.greenBg : issues <= 3 ? D.amberBg : D.redBg,
                        border: `1px solid ${issues === 0 ? D.greenBorder : issues <= 3 ? D.amberBorder : D.redBorder}`,
                        color: accent, whiteSpace: "nowrap",
                      }}>
                        {issues === 0 ? "Keine Probleme" : `${issues} Problem${issues > 1 ? "e" : ""}`}
                      </span>
                      {/* Date */}
                      <span style={{ fontSize: 12, color: D.textMuted, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {date}
                      </span>
                      {/* Arrow */}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0 }}>
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
