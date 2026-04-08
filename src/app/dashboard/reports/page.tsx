import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import ReportActions from "./report-actions";

type ReportRow = {
  id: number;
  month: string;
  sent_at: string;
  website_count: number;
  ok_count: number;
  issue_count: number;
  avg_uptime_pct: number;
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);

  const [user] = (await sql`
    SELECT id, plan FROM users WHERE email = ${session.user.email}
  `) as { id: number; plan: string }[];

  if (!user || !["pro", "agentur"].includes(user.plan)) {
    redirect("/dashboard");
  }

  const reports = (await sql`
    SELECT id, month, sent_at, website_count, ok_count, issue_count, avg_uptime_pct
    FROM monthly_reports
    WHERE user_id = ${user.id}
    ORDER BY month DESC
    LIMIT 24
  `) as ReportRow[];

  // Current month string for the send button
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Monatsberichte
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Automatisch generiert am 1. jedes Monats und per E-Mail versandt.
            </p>
          </div>

          <ReportActions currentMonth={currentMonth} />
        </div>

        {reports.length === 0 ? (
          <div style={{
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
            padding: "48px 32px", textAlign: "center",
          }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 8px" }}>
              Noch kein Bericht vorhanden.
            </p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, margin: 0 }}>
              Der erste Bericht wird am 1. des nächsten Monats automatisch verschickt. Du kannst auch jetzt einen Testbericht senden.
            </p>
          </div>
        ) : (
          <div className="scroll-x-sm" style={{
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 80px 80px 80px 120px",
              minWidth: 580,
              padding: "10px 20px",
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {["Monat", "Websites", "OK", "Probleme", "Ø Uptime", "Versandt"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {h}
                </span>
              ))}
            </div>

            {reports.map((r, i) => {
              const date = new Date(r.month);
              const monthLabel = date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
              const sentDate = new Date(r.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

              return (
                <div key={r.id} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 100px 80px 80px 80px 120px",
                  minWidth: 580,
                  padding: "16px 20px",
                  borderBottom: i < reports.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{monthLabel}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{r.website_count}</span>
                  <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 600 }}>{r.ok_count}</span>
                  <span style={{ fontSize: 14, color: r.issue_count > 0 ? "#ef4444" : "rgba(255,255,255,0.35)", fontWeight: r.issue_count > 0 ? 600 : 400 }}>
                    {r.issue_count}
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                    {r.avg_uptime_pct > 0 ? `${r.avg_uptime_pct}%` : "—"}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{sentDate}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0, lineHeight: 1.6 }}>
            Berichte werden automatisch am 1. jeden Monats für den Vormonat generiert und an deine E-Mail-Adresse gesendet.
            Mit dem Button oben kannst du jederzeit einen Bericht für den aktuellen Monat manuell auslösen.
          </p>
        </div>
      </main>
    </>
  );
}
