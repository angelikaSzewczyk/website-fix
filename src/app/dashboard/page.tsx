import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import BillingPortalButton from "../components/billing-portal-button";
import WebsitesSection from "../components/websites-section";

export const metadata: Metadata = {
  title: "Dashboard — WebsiteFix",
  robots: { index: false },
};

type Scan = {
  id: string;
  url: string;
  type: string;
  created_at: string;
  issue_count: number | null;
};

const PLAN_CONFIG = {
  free:    { label: "Free",    color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)" },
  pro:     { label: "Pro",     color: "#8df3d3", bg: "rgba(141,243,211,0.08)", border: "rgba(141,243,211,0.2)" },
  agentur: { label: "Agentur", color: "#7aa6ff", bg: "rgba(122,166,255,0.08)", border: "rgba(122,166,255,0.2)" },
} as const;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const plan = ((session.user as { plan?: string }).plan ?? "free") as keyof typeof PLAN_CONFIG;
  const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;

  const scans = await sql`
    SELECT id, url, type, created_at, issue_count
    FROM scans
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 20
  ` as Scan[];

  const firstName = session.user.name?.split(" ")[0] ?? "Dashboard";

  return (
    <>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" width={28} height={28} style={{ borderRadius: "50%", opacity: 0.9 }} />
            )}
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>{session.user.email}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "52px 20px 80px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>Willkommen zurück</p>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 20px", letterSpacing: "-0.02em" }}>{firstName}</h1>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20,
              background: planCfg.bg, border: `1px solid ${planCfg.border}`,
              fontSize: 13, fontWeight: 600, color: planCfg.color,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: planCfg.color, display: "inline-block" }} />
              {planCfg.label}
            </span>

            {plan === "free" && (
              <Link href="/fuer-agenturen" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 14px", borderRadius: 20, textDecoration: "none",
                background: "linear-gradient(90deg, rgba(141,243,211,0.15), rgba(122,166,255,0.15))",
                border: "1px solid rgba(141,243,211,0.25)",
                fontSize: 13, fontWeight: 600, color: "#8df3d3",
              }}>
                Upgrade auf Pro →
              </Link>
            )}

            {plan !== "free" && (
              <>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                  Unbegrenzte Scans · Vollständige Reports
                </span>
                <BillingPortalButton />
              </>
            )}
          </div>
        </div>

        {/* ONBOARDING — nur wenn noch keine Scans */}
        {scans.length === 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(141,243,211,0.06), rgba(122,166,255,0.06))",
            border: "1px solid rgba(141,243,211,0.15)",
            borderRadius: 16, padding: "28px 32px", marginBottom: 40,
            display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "#8df3d3", fontWeight: 650 }}>Willkommen bei WebsiteFix 👋</p>
              <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700 }}>Starte deinen ersten Scan</h2>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Gib eine beliebige Website-URL ein — die KI analysiert SEO, Barrierefreiheit und Performance in unter 60 Sekunden.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/dashboard/scan" style={{
                  padding: "10px 20px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 700,
                  background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", color: "#0b0c10",
                }}>
                  Ersten Scan starten →
                </Link>
                <Link href="/dashboard/scan?tab=wcag" style={{
                  padding: "10px 20px", borderRadius: 10, textDecoration: "none", fontSize: 14,
                  border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
                }}>
                  WCAG-Scan testen
                </Link>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 200 }}>
              {[
                { icon: "🔍", text: "Website-Check: SEO & Technik" },
                { icon: "♿", text: "Barrierefreiheit: WCAG 2.1 AA" },
                { icon: "⚡", text: "Performance: Core Web Vitals" },
              ].map((item) => (
                <div key={item.text} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
                  <span>{item.icon}</span> {item.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEBSITES */}
        {plan !== "free" && <WebsitesSection />}

        {/* QUICK ACTIONS */}
        <div style={{ marginBottom: 52 }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Neuer Scan</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {[
              {
                href: "/dashboard/scan",
                icon: "🔍",
                title: "Website-Check",
                desc: "SEO, Erreichbarkeit, technische Fehler",
                color: "#7aa6ff",
              },
              {
                href: "/dashboard/scan?tab=wcag",
                icon: "♿",
                title: "WCAG-Scan",
                desc: "Barrierefreiheit · BFSG-relevant",
                color: "#8df3d3",
              },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: "24px 22px",
                  cursor: "pointer", transition: "border-color 0.15s",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ fontSize: 28 }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{item.desc}</div>
                  <div style={{ fontSize: 13, color: item.color, marginTop: 4, fontWeight: 600 }}>
                    Scan starten →
                  </div>
                </div>
              </Link>
            ))}

            {plan === "agentur" && (
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "24px 22px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ fontSize: 28, opacity: 0.5 }}>🏷️</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "rgba(255,255,255,0.4)" }}>White-Label Report</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Kommt in Phase 2</div>
              </div>
            )}
          </div>
        </div>

        {/* SCAN HISTORY */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Letzte Scans</p>
            {scans.length > 0 && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>{scans.length} gespeichert</span>
            )}
          </div>

          {scans.length === 0 ? (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "48px 20px", textAlign: "center",
            }}>
              <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.35)", fontSize: 15 }}>
                Noch keine Scans gespeichert.
              </p>
              <Link href="/dashboard/scan" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 12, textDecoration: "none",
                background: "linear-gradient(90deg,#8df3d3,#7aa6ff)",
                color: "#0b0c10", fontWeight: 700, fontSize: 14,
              }}>
                Ersten Scan starten →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {scans.map((scan) => {
                const typeIcon = scan.type === "wcag" ? "♿" : scan.type === "performance" ? "⚡" : "🔍";
                const typeLabel = scan.type === "wcag" ? "Barrierefreiheit" : scan.type === "performance" ? "Performance" : "Website-Check";
                return (
                <Link key={scan.id} href={`/dashboard/scans/${scan.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12, padding: "14px 20px",
                    display: "flex", alignItems: "center", gap: 16,
                    cursor: "pointer", transition: "border-color 0.15s",
                  }}>
                    <div style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {scan.url}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                        {typeLabel} · {new Date(scan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {scan.issue_count !== null && (
                        <div style={{
                          padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                          background: scan.issue_count === 0 ? "rgba(141,243,211,0.08)" : "rgba(255,107,107,0.08)",
                          color: scan.issue_count === 0 ? "#8df3d3" : "#ff6b6b",
                          border: `1px solid ${scan.issue_count === 0 ? "rgba(141,243,211,0.2)" : "rgba(255,107,107,0.2)"}`,
                        }}>
                          {scan.issue_count === 0 ? "✓ Keine Fehler" : `${scan.issue_count} Probleme`}
                        </div>
                      )}
                      <span style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>→</span>
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          )}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "28px 20px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          {`© ${new Date().getFullYear()} website-fix.com · `}
          <Link href="/" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Startseite</Link>
        </p>
      </footer>
    </>
  );
}
