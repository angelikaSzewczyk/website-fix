import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import PrintButton from "./print-button";

type Scan = {
  id: string;
  url: string;
  type: string;
  created_at: string;
  issue_count: number | null;
  result: string | null;
};

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  website:     { label: "Website-Check",    icon: "🔍", color: "#7aa6ff" },
  wcag:        { label: "Barrierefreiheit", icon: "♿", color: "#8df3d3" },
  performance: { label: "Performance",      icon: "⚡", color: "#ffd93d" },
};

function renderDiagnose(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return <h3 key={i} style={{ fontSize: 17, margin: "24px 0 10px", fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 8 }}>{line.replace("## ", "")}</h3>;
    }
    if (line.startsWith("**🔴")) return <div key={i} style={{ margin: "12px 0 4px", fontWeight: 700, color: "#ff6b6b", fontSize: 15 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟡")) return <div key={i} style={{ margin: "12px 0 4px", fontWeight: 700, color: "#ffd93d", fontSize: 15 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟢")) return <div key={i} style={{ margin: "12px 0 4px", fontWeight: 700, color: "#8df3d3", fontSize: 15 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.match(/^\d+\./)) return <div key={i} style={{ margin: "6px 0", paddingLeft: 20, color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6 }}>{line}</div>;
    if (line.startsWith("# ")) return null;
    if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ margin: "4px 0", color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.7 }}>{line}</p>;
  });
}

export default async function ScanDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id, url, type, created_at, issue_count, result
    FROM scans
    WHERE id = ${params.id}
    LIMIT 1
  ` as Scan[];

  if (!rows[0]) notFound();
  const scan = rows[0];
  const typeInfo = TYPE_LABELS[scan.type] ?? TYPE_LABELS.website;

  const scoreColor = (n: number | null) =>
    n === null ? "rgba(255,255,255,0.4)" : n === 0 ? "#8df3d3" : n <= 2 ? "#ffd93d" : "#ff6b6b";

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "48px 20px 80px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{
              padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600,
              background: `${typeInfo.color}15`, border: `1px solid ${typeInfo.color}30`, color: typeInfo.color,
            }}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              {new Date(scan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em", wordBreak: "break-all" }}>
            {scan.url}
          </h1>
          {scan.issue_count !== null && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: `${scoreColor(scan.issue_count)}15`,
              border: `1px solid ${scoreColor(scan.issue_count)}30`,
              color: scoreColor(scan.issue_count),
            }}>
              {scan.issue_count === 0 ? "✓ Keine Probleme gefunden" : `${scan.issue_count} Problem${scan.issue_count !== 1 ? "e" : ""} gefunden`}
            </div>
          )}
        </div>

        {/* DIAGNOSE */}
        {scan.result ? (
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16, padding: "32px 32px",
          }}>
            {renderDiagnose(scan.result)}
          </div>
        ) : (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            Keine Diagnose gespeichert — bitte starte einen neuen Scan.
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" }} className="no-print">
          <Link href="/dashboard/scan" style={{
            padding: "11px 22px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 600,
            background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", color: "#0b0c10",
          }}>
            Neuer Scan →
          </Link>
          <PrintButton url={scan.url} type={typeInfo.label} date={new Date(scan.created_at).toLocaleDateString("de-DE")} />
          <Link href="/dashboard" style={{
            padding: "11px 22px", borderRadius: 10, textDecoration: "none", fontSize: 14,
            border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
          }}>
            Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
