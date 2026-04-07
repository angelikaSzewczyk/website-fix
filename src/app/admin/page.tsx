import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — WebsiteFix",
  robots: { index: false, follow: false },
};

const ADMIN_EMAIL = "angelika.szewczyk87@gmail.com";

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  pro: 29,
  agentur: 99,
};

type UserRow = {
  id: number;
  name: string | null;
  email: string;
  plan: string;
  created_at: string;
  scan_count: number;
  website_count: number;
  last_scan_at: string | null;
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.email !== ADMIN_EMAIL) redirect("/");

  const sql = neon(process.env.DATABASE_URL!);

  const [users, scanStats, websiteStats] = await Promise.all([
    sql`
      SELECT
        u.id, u.name, u.email, u.plan, u.created_at,
        COUNT(DISTINCT s.id)::int AS scan_count,
        COUNT(DISTINCT sw.id)::int AS website_count,
        MAX(s.created_at) AS last_scan_at
      FROM users u
      LEFT JOIN scans s ON s.user_id = u.id
      LEFT JOIN saved_websites sw ON sw.user_id = u.id
      GROUP BY u.id, u.name, u.email, u.plan, u.created_at
      ORDER BY u.created_at DESC
    ` as unknown as UserRow[],
    sql`SELECT COUNT(*)::int AS total FROM scans`,
    sql`SELECT COUNT(*)::int AS total FROM saved_websites`,
  ]);

  const totalUsers = users.length;
  const byPlan = {
    free: users.filter(u => u.plan === "free").length,
    pro: users.filter(u => u.plan === "pro").length,
    agentur: users.filter(u => u.plan === "agentur").length,
  };
  const mrr = byPlan.pro * 29 + byPlan.agentur * 99;
  const totalScans = (scanStats[0]?.total as number) ?? 0;
  const totalWebsites = (websiteStats[0]?.total as number) ?? 0;

  const cell: React.CSSProperties = {
    padding: "12px 16px",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    whiteSpace: "nowrap",
  };

  const planColor = (plan: string) =>
    plan === "agentur" ? "#7aa6ff" : plan === "pro" ? "#8df3d3" : "rgba(255,255,255,0.3)";

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.96)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 16 }}>
              Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
            </Link>
            <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(255,107,107,0.15)", color: "#ff6b6b", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Admin
            </span>
          </div>
          <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 40 }}>
          {[
            { label: "MRR", value: `${mrr}€`, sub: "monatlich", color: "#8df3d3" },
            { label: "ARR", value: `${mrr * 12}€`, sub: "jährlich", color: "#7aa6ff" },
            { label: "Nutzer gesamt", value: totalUsers, sub: `${byPlan.free} Free · ${byPlan.pro} Pro · ${byPlan.agentur} Agentur` },
            { label: "Scans gesamt", value: totalScans, sub: "alle Nutzer" },
            { label: "Websites monitored", value: totalWebsites, sub: "gespeichert" },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: "20px 20px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color ?? "#fff", letterSpacing: "-0.02em" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* PLAN BREAKDOWN */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 40 }}>
          {[
            { plan: "Free", count: byPlan.free, price: 0, color: "rgba(255,255,255,0.3)" },
            { plan: "Pro", count: byPlan.pro, price: 29, color: "#8df3d3" },
            { plan: "Agentur", count: byPlan.agentur, price: 99, color: "#7aa6ff" },
          ].map(p => (
            <div key={p.plan} style={{
              padding: "16px 20px",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${p.color}25`,
              borderRadius: 12,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.plan}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 4 }}>{p.count}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>MRR</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: p.color }}>{p.count * p.price}€</div>
              </div>
            </div>
          ))}
        </div>

        {/* USER TABLE */}
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Alle Nutzer ({totalUsers})
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Name", "E-Mail", "Plan", "Scans", "Websites", "Letzter Scan", "Angemeldet"].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 600,
                    color: "rgba(255,255,255,0.3)",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ transition: "background 0.1s" }}>
                  <td style={cell}>{user.name ?? "—"}</td>
                  <td style={cell}>{user.email}</td>
                  <td style={{ ...cell }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                      color: planColor(user.plan),
                      background: `${planColor(user.plan)}15`,
                    }}>
                      {user.plan}
                    </span>
                  </td>
                  <td style={{ ...cell, color: user.scan_count > 0 ? "#fff" : "rgba(255,255,255,0.25)" }}>
                    {user.scan_count}
                  </td>
                  <td style={{ ...cell, color: user.website_count > 0 ? "#fff" : "rgba(255,255,255,0.25)" }}>
                    {user.website_count}
                  </td>
                  <td style={cell}>
                    {user.last_scan_at
                      ? new Date(user.last_scan_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
                      : "—"}
                  </td>
                  <td style={cell}>
                    {new Date(user.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </>
  );
}
