import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kunden-Websites — WebsiteFix",
  robots: { index: false },
};

type Website = {
  id: string;
  url: string;
  name: string | null;
  last_issue_count: number | null;
  last_scan_at: string | null;
  last_scan_type: string | null;
  scan_count: number;
};

const issueColor = (n: number | null) =>
  n === null ? "rgba(255,255,255,0.3)" : n === 0 ? "#8df3d3" : n <= 3 ? "#ffd93d" : "#ff6b6b";

const typeIcon = (t: string | null) =>
  t === "wcag" ? "♿" : t === "performance" ? "⚡" : "🔍";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan;
  if (plan !== "agentur") redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);

  const websites = await sql`
    SELECT
      sw.id, sw.url, sw.name,
      sw.last_issue_count, sw.last_scan_at, sw.last_scan_type,
      COUNT(s.id)::int AS scan_count
    FROM saved_websites sw
    LEFT JOIN scans s ON s.url = sw.url AND s.user_id = sw.user_id
    WHERE sw.user_id = ${session.user.id}
    GROUP BY sw.id, sw.url, sw.name, sw.last_issue_count, sw.last_scan_at, sw.last_scan_type
    ORDER BY sw.last_scan_at DESC NULLS LAST
  ` as Website[];

  const total = websites.length;
  const ok = websites.filter(w => w.last_issue_count === 0).length;
  const issues = websites.filter(w => w.last_issue_count !== null && w.last_issue_count > 0).length;
  const unscanned = websites.filter(w => w.last_scan_at === null).length;

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
          <div className="hide-sm" style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/dashboard/settings" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Einstellungen</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "52px 20px 80px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>Agentur-Dashboard</p>
          <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 24px", letterSpacing: "-0.02em" }}>Kunden-Websites</h1>

          {/* STATS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { label: "Websites gesamt", value: total, color: "rgba(255,255,255,0.6)" },
              { label: "Alles OK", value: ok, color: "#8df3d3" },
              { label: "Mit Problemen", value: issues, color: "#ff6b6b" },
              { label: "Noch nicht gescannt", value: unscanned, color: "#ffd93d" },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: "16px 18px", borderRadius: 12,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WEBSITE LIST */}
        {websites.length === 0 ? (
          <div style={{
            padding: "48px 20px", textAlign: "center",
            background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16,
          }}>
            <p style={{ margin: "0 0 20px", color: "rgba(255,255,255,0.35)" }}>
              Noch keine Kunden-Websites gespeichert.
            </p>
            <Link href="/dashboard" style={{
              padding: "10px 22px", borderRadius: 10, textDecoration: "none",
              background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", color: "#0b0c10", fontWeight: 700, fontSize: 14,
            }}>
              Zum Dashboard →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {websites.map(site => (
              <div key={site.id} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 20px", borderRadius: 14,
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{typeIcon(site.last_scan_type)}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {site.name ?? site.url}
                  </div>
                  {site.name && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {site.url}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>
                    {site.last_scan_at
                      ? `Letzter Scan: ${new Date(site.last_scan_at).toLocaleDateString("de-DE")} · ${site.scan_count} Scan${site.scan_count !== 1 ? "s" : ""} gesamt`
                      : "Noch nicht gescannt"}
                  </div>
                </div>

                <div style={{
                  padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  color: issueColor(site.last_issue_count),
                  border: `1px solid ${issueColor(site.last_issue_count)}30`,
                  background: `${issueColor(site.last_issue_count)}10`,
                }}>
                  {site.last_issue_count === null ? "—" : site.last_issue_count === 0 ? "✓ OK" : `${site.last_issue_count} Probleme`}
                </div>

                <Link
                  href={`/dashboard/scan?url=${encodeURIComponent(site.url)}`}
                  style={{
                    padding: "7px 14px", borderRadius: 9, textDecoration: "none", fontSize: 13, fontWeight: 600,
                    border: "1px solid rgba(141,243,211,0.2)", color: "#8df3d3",
                    background: "rgba(141,243,211,0.05)", whiteSpace: "nowrap",
                  }}
                >
                  Neu scannen
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
