import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";

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

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:    { label: "Free",    color: "rgba(255,255,255,0.3)" },
  pro:     { label: "Pro",     color: "#8df3d3" },
  agentur: { label: "Agentur", color: "#7aa6ff" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const plan = (session.user as { plan?: string }).plan ?? "free";

  const scans = await sql`
    SELECT id, url, type, created_at, issue_count
    FROM scans
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 20
  ` as Scan[];

  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free;

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17 }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{session.user.email}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button type="submit" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}>
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px" }}>
        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Willkommen zurück</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 16px" }}>
            {session.user.name?.split(" ")[0] ?? "Dashboard"}
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(255,255,255,0.06)", border: `1px solid ${planInfo.color}33`,
              fontSize: 13, fontWeight: 600, color: planInfo.color,
            }}>
              ● {planInfo.label}
            </span>
            {plan === "free" && (
              <Link href="/fuer-agenturen" className="cta" style={{ fontSize: 13, padding: "5px 14px" }}>
                Upgrade →
              </Link>
            )}
            {plan !== "free" && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                Unbegrenzte Scans · Vollständige Reports
              </span>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 48 }}>
          <Link href="/scan" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 24 }}>🔍</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Neuer Website-Check</div>
              <div className="cardSub" style={{ fontSize: 13 }}>SEO, Erreichbarkeit, technische Fehler</div>
            </div>
          </Link>
          <Link href="/scan?tab=wcag" style={{ textDecoration: "none" }}>
            <div className="card" style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 24 }}>♿</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>WCAG-Scan</div>
              <div className="cardSub" style={{ fontSize: 13 }}>Barrierefreiheit · BFSG-relevant</div>
            </div>
          </Link>
          {plan === "agentur" && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 0.6 }}>
              <div style={{ fontSize: 24 }}>🏷️</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>White-Label Report</div>
              <div className="cardSub" style={{ fontSize: 13 }}>Kommt in Phase 2</div>
            </div>
          )}
        </div>

        {/* SCAN HISTORY */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Letzte Scans</h2>

          {scans.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <p className="muted" style={{ margin: "0 0 16px" }}>Noch keine Scans. Starte deinen ersten Scan!</p>
              <Link href="/scan" className="cta" style={{ fontSize: 14, padding: "11px 24px" }}>
                Jetzt scannen →
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {scans.map((scan) => (
                <div key={scan.id} className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px" }}>
                  <div style={{ fontSize: 20 }}>{scan.type === "wcag" ? "♿" : "🔍"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {scan.url}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                      {scan.type === "wcag" ? "WCAG-Scan" : "Website-Check"} · {new Date(scan.created_at).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                  {scan.issue_count !== null && (
                    <div style={{
                      padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                      background: scan.issue_count === 0 ? "rgba(141,243,211,0.1)" : "rgba(255,107,107,0.1)",
                      color: scan.issue_count === 0 ? "#8df3d3" : "#ff6b6b",
                      border: `1px solid ${scan.issue_count === 0 ? "rgba(141,243,211,0.2)" : "rgba(255,107,107,0.2)"}`,
                    }}>
                      {scan.issue_count === 0 ? "✓ Keine Fehler" : `${scan.issue_count} Probleme`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 20px", textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {`© ${new Date().getFullYear()} website-fix.com · `}
          <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Startseite</Link>
        </p>
      </footer>
    </>
  );
}
