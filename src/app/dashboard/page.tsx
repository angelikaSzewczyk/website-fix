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
  free:    { label: "Free",    color: "rgba(255,255,255,0.4)",  bg: "rgba(255,255,255,0.05)",  border: "rgba(255,255,255,0.1)" },
  pro:     { label: "Pro",     color: "#8df3d3", bg: "rgba(141,243,211,0.06)", border: "rgba(141,243,211,0.2)" },
  agentur: { label: "Agentur", color: "#7aa6ff", bg: "rgba(122,166,255,0.06)", border: "rgba(122,166,255,0.2)" },
} as const;

const TYPE_LABEL: Record<string, string> = {
  website: "Website-Check",
  wcag: "Barrierefreiheit",
  performance: "Performance",
};

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

  const scoreColor = (n: number | null) =>
    n === null ? "rgba(255,255,255,0.3)" : n === 0 ? "#8df3d3" : n <= 2 ? "#ffd93d" : "#ff6b6b";

  return (
    <>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {plan === "agentur" && (
              <div className="hide-sm" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Link href="/dashboard/clients" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Kunden</Link>
                <Link href="/dashboard/reports" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Berichte</Link>
                <Link href="/dashboard/settings" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Einstellungen</Link>
              </div>
            )}
            {plan === "pro" && (
              <Link href="/dashboard/reports" className="hide-sm" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Berichte</Link>
            )}
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" width={26} height={26} style={{ borderRadius: "50%", opacity: 0.8 }} />
            )}
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Willkommen zurück</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>{firstName}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 16,
                background: planCfg.bg, border: `1px solid ${planCfg.border}`,
                fontSize: 12, fontWeight: 600, color: planCfg.color,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: planCfg.color }} />
                {planCfg.label}
              </span>
              {plan === "free" && (
                <Link href="/fuer-agenturen" style={{
                  fontSize: 12, padding: "5px 12px", borderRadius: 16, textDecoration: "none",
                  border: "1px solid rgba(141,243,211,0.2)", color: "#8df3d3",
                }}>
                  Upgrade
                </Link>
              )}
              {plan !== "free" && <BillingPortalButton />}
            </div>
          </div>
        </div>

        {/* ONBOARDING */}
        {scans.length === 0 && (
          <div style={{
            border: "1px solid rgba(141,243,211,0.15)",
            borderRadius: 12, padding: "32px",
            marginBottom: 40,
            background: "rgba(141,243,211,0.03)",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#8df3d3", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Erster Schritt</p>
            <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700 }}>Starte deinen ersten Scan</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>
              URL eingeben — KI analysiert SEO, Barrierefreiheit und Performance in unter 60 Sekunden.
            </p>
            <Link href="/dashboard/scan" style={{
              display: "inline-block", padding: "10px 20px", borderRadius: 9, textDecoration: "none",
              background: "#fff", color: "#0b0c10", fontWeight: 700, fontSize: 14,
            }}>
              Ersten Scan starten
            </Link>
          </div>
        )}

        {/* WEBSITES (Pro/Agentur) */}
        {plan !== "free" && <WebsitesSection />}

        {/* QUICK ACTIONS */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Neuer Scan</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {[
              { href: "/dashboard/scan", label: "Website-Check", desc: "SEO, Technik, Erreichbarkeit", color: "#7aa6ff" },
              { href: "/dashboard/scan?tab=wcag", label: "Barrierefreiheit", desc: "WCAG 2.1 AA · BFSG-relevant", color: "#8df3d3" },
              { href: "/dashboard/scan?tab=performance", label: "Performance", desc: "Core Web Vitals, PageSpeed", color: "#ffd93d" },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div style={{
                  padding: "20px 22px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.02)",
                  transition: "border-color 0.15s",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, marginBottom: 14 }} />
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#fff", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{item.desc}</div>
                  <div style={{ fontSize: 13, color: item.color, marginTop: 12, fontWeight: 500 }}>Scan starten →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* SCAN HISTORY */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Letzte Scans
            </p>
            {scans.length > 0 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{scans.length} gespeichert</span>
            )}
          </div>

          {scans.length === 0 ? (
            <div style={{
              padding: "40px 20px", textAlign: "center",
              border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 12,
            }}>
              <p style={{ margin: "0 0 16px", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
                Noch keine Scans.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
              {scans.map((scan, i) => (
                <Link key={scan.id} href={`/dashboard/scans/${scan.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    padding: "14px 20px",
                    borderBottom: i < scans.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    display: "flex", alignItems: "center", gap: 16,
                    background: "rgba(255,255,255,0.01)",
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: scoreColor(scan.issue_count), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {scan.url}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                        {TYPE_LABEL[scan.type] ?? scan.type} · {new Date(scan.created_at).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {scan.issue_count !== null && (
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          color: scoreColor(scan.issue_count),
                        }}>
                          {scan.issue_count === 0 ? "Keine Fehler" : `${scan.issue_count} Probleme`}
                        </span>
                      )}
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.15)" }}>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
        </p>
      </footer>
    </>
  );
}
