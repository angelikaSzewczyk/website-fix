import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import PrintButton from "./print-button";
import IssueCardsClient, { type IssueBlock } from "./issue-cards-client";

// ─── Light-mode tokens ────────────────────────────────────────────────────────
const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  divider:     "#F1F5F9",
  shadow:      "0 1px 4px rgba(0,0,0,0.07)",
  shadowMd:    "0 2px 8px rgba(0,0,0,0.09)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenDot:    "#22C55E",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberBorder: "#FDE68A",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redBorder:   "#FCA5A5",
  redDot:      "#EF4444",
};

type Scan = {
  id: string; url: string; type: string;
  created_at: string; issue_count: number | null; result: string | null;
};

type AgencySettings = {
  agency_name: string | null; logo_url: string | null; primary_color: string | null;
};


function parseIssues(text: string): IssueBlock[] {
  const issues: IssueBlock[] = [];
  let current: IssueBlock | null = null;

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("# ") || line.startsWith("## ")) {
      continue;
    }
    if (line.startsWith("**🔴") || line.startsWith("**🔴")) {
      if (current) issues.push(current);
      current = { severity: "red", emoji: "🔴", title: line.replace(/\*\*/g, "").replace(/^🔴\s*/, "").trim(), body: [], steps: [] };
    } else if (line.startsWith("**🟡")) {
      if (current) issues.push(current);
      current = { severity: "yellow", emoji: "🟡", title: line.replace(/\*\*/g, "").replace(/^🟡\s*/, "").trim(), body: [], steps: [] };
    } else if (line.startsWith("**🟢")) {
      if (current) issues.push(current);
      current = { severity: "green", emoji: "🟢", title: line.replace(/\*\*/g, "").replace(/^🟢\s*/, "").trim(), body: [], steps: [] };
    } else if (current) {
      if (line.match(/^\d+\./)) {
        current.steps.push(line);
      } else {
        current.body.push(line);
      }
    }
  }
  if (current) issues.push(current);
  return issues;
}

function HealthRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 80 ? C.green : score >= 50 ? C.amber : C.red;
  const bg = score >= 80 ? C.greenBg : score >= 50 ? C.amberBg : C.redBg;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px 32px", background: bg,
      border: `1px solid ${score >= 80 ? "#A7F3D0" : score >= 50 ? C.amberBorder : C.redBorder}`,
      borderRadius: 16, minWidth: 160,
    }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="60" cy="60" r={r} fill="none" stroke={`${color}20`} strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Score</span>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginTop: 8 }}>
        {score >= 80 ? "Sehr gut" : score >= 60 ? "Gut" : score >= 40 ? "Verbesserungsbedarf" : "Kritisch"}
      </span>
    </div>
  );
}

/* Fallback: render non-issue lines as a readable text block */
function FallbackDiagnose({ text }: { text: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "28px 28px", boxShadow: C.shadow }}>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 16, margin: "20px 0 8px", fontWeight: 700, color: C.text, borderBottom: `1px solid ${C.divider}`, paddingBottom: 8 }}>{line.replace("## ", "")}</h3>;
        if (line.startsWith("# ")) return null;
        if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
        if (line.match(/^\d+\./)) return <div key={i} style={{ margin: "6px 0", paddingLeft: 18, color: C.textSub, fontSize: 14, lineHeight: 1.7 }}>{line}</div>;
        return <p key={i} style={{ margin: "4px 0", color: C.textSub, fontSize: 14, lineHeight: 1.75 }}>{line}</p>;
      })}
    </div>
  );
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  website:     { label: "Website-Check",    color: C.blue },
  wcag:        { label: "Barrierefreiheit", color: "#059669" },
  performance: { label: "Performance",      color: C.amber },
};

export default async function ScanDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id, url, type, created_at, issue_count, result
    FROM scans WHERE id = ${params.id} LIMIT 1
  ` as Scan[];

  const plan = (session.user as { plan?: string }).plan;
  let agencySettings: AgencySettings | null = null;
  if (plan === "agentur") {
    const ag = await sql`SELECT agency_name, logo_url, primary_color FROM agency_settings WHERE user_id = ${session.user.id} LIMIT 1`;
    if (ag[0]) agencySettings = ag[0] as AgencySettings;
  }

  if (!rows[0]) notFound();

  const prevRows = await sql`
    SELECT issue_count FROM scans
    WHERE url = ${rows[0].url} AND type = ${rows[0].type}
      AND id != ${params.id} AND user_id = ${session.user.id}
    ORDER BY created_at DESC LIMIT 1
  ` as { issue_count: number | null }[];

  const scan = rows[0];
  const typeInfo = TYPE_LABELS[scan.type] ?? TYPE_LABELS.website;
  const issues = scan.result ? parseIssues(scan.result) : [];
  const hasIssueCards = issues.length > 0;

  // Health score
  const healthScore = scan.issue_count === null
    ? null
    : Math.max(0, Math.round(100 - (scan.issue_count * 8)));

  const prev = prevRows[0];

  return (
    <>
      {/* WHITE-LABEL PRINT HEADER */}
      {agencySettings?.agency_name && (
        <div className="print-only" style={{ display: "none", padding: "24px 40px 16px", borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {agencySettings.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agencySettings.logo_url} alt="" style={{ height: 40, objectFit: "contain" }} />
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>{agencySettings.agency_name}</div>
              <div style={{ fontSize: 12, color: "#666" }}>Website-Analyse Report</div>
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* BACK */}
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.textSub, textDecoration: "none", marginBottom: 24, padding: "7px 14px", borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Zurück zur Übersicht
        </Link>

        {/* PAGE HEADER */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap" }}>
          {/* Left: title + meta */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{
                padding: "4px 12px", borderRadius: 16, fontSize: 12, fontWeight: 700,
                background: `${typeInfo.color}12`, border: `1px solid ${typeInfo.color}30`, color: typeInfo.color,
                letterSpacing: "0.04em",
              }}>
                {typeInfo.label}
              </span>
              <span style={{ fontSize: 12, color: C.textMuted }}>
                {new Date(scan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 14px", color: C.text, letterSpacing: "-0.01em", wordBreak: "break-all" }}>
              {scan.url}
            </h1>

            {/* Issue count summary */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {scan.issue_count !== null && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: scan.issue_count === 0 ? C.greenBg : scan.issue_count <= 3 ? C.amberBg : C.redBg,
                  border: `1px solid ${scan.issue_count === 0 ? "#A7F3D0" : scan.issue_count <= 3 ? C.amberBorder : C.redBorder}`,
                  color: scan.issue_count === 0 ? C.green : scan.issue_count <= 3 ? C.amber : C.red,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
                  {scan.issue_count === 0 ? "Keine Probleme" : `${scan.issue_count} Problem${scan.issue_count !== 1 ? "e" : ""} gefunden`}
                </span>
              )}
              {prev && scan.issue_count !== null && prev.issue_count !== null && (
                <span style={{ fontSize: 13, color: C.textMuted }}>
                  {scan.issue_count < prev.issue_count
                    ? <span style={{ color: C.green, fontWeight: 600 }}>↓ {prev.issue_count - scan.issue_count} weniger als letzter Scan</span>
                    : scan.issue_count > prev.issue_count
                      ? <span style={{ color: C.red, fontWeight: 600 }}>↑ {scan.issue_count - prev.issue_count} mehr als letzter Scan</span>
                      : <span>= unverändert</span>
                  }
                </span>
              )}
            </div>
          </div>

          {/* Right: Health Score ring */}
          {healthScore !== null && <HealthRing score={healthScore} />}
        </div>

        {/* ISSUE CARDS or fallback text */}
        {scan.result ? (
          hasIssueCards ? (
            <IssueCardsClient issues={issues} />
          ) : (
            <FallbackDiagnose text={scan.result} />
          )
        ) : (
          <div style={{ padding: "48px 20px", textAlign: "center", background: C.card, border: `1px dashed ${C.border}`, borderRadius: 14, color: C.textMuted }}>
            Keine Diagnose gespeichert — bitte starte einen neuen Scan.
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }} className="no-print">
          <Link href="/dashboard/scan" style={{
            padding: "10px 22px", borderRadius: 10, textDecoration: "none", fontSize: 14, fontWeight: 700,
            background: C.blue, color: "#fff",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}>
            Neuer Scan →
          </Link>

          {/* PDF Export: White-Label für Agency-Pläne */}
          {(plan === "agentur" || plan === "pro" || plan === "enterprise" || plan === "single") ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PrintButton url={scan.url} type={typeInfo.label} date={new Date(scan.created_at).toLocaleDateString("de-DE")} />
              {(plan === "agentur" || plan === "pro" || plan === "enterprise") && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: "#F0FDF4", border: "1px solid #A7F3D0", color: "#16A34A" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Neutrales Branding aktiv
                </span>
              )}
            </div>
          ) : (
            <PrintButton url={scan.url} type={typeInfo.label} date={new Date(scan.created_at).toLocaleDateString("de-DE")} />
          )}

          <Link href="/dashboard" style={{
            padding: "10px 22px", borderRadius: 10, textDecoration: "none", fontSize: 14,
            border: `1px solid ${C.border}`, color: C.textSub, background: C.card,
          }}>
            Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
