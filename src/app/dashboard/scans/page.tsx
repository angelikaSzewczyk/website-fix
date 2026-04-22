import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import ScansClient from "./scans-client";
import type { ScanRow } from "./scans-client";

export const metadata: Metadata = {
  title: "Berichte — WebsiteFix",
  robots: { index: false },
};

const SCAN_LIMIT = 3;

// Normalise title for grouping — mirrors the logic in the detail page and free-dashboard-client
function normKey(title: string): string {
  return title
    .replace(/\s+auf\s+(https?:\/\/\S+|\/\S+|\S+\.(html|php|aspx))\s*$/i, "")
    .replace(/\s+\(https?:\/\/\S+\)\s*$/, "")
    .replace(/^BFSG-Verstoß:\s*/i, "")
    .replace(/^Barrierefreiheit:\s*/i, "")
    .trim().toLowerCase();
}

// Count distinct consolidated issues per severity — same logic as StarterResultsPanel
function countIssues(issuesJson: string | null): { red: number; yellow: number } {
  if (!issuesJson) return { red: 0, yellow: 0 };
  try {
    const raw = JSON.parse(issuesJson) as { severity: string; title: string }[];
    const seen = new Set<string>();
    let red = 0, yellow = 0;
    for (const issue of raw) {
      const key = `${issue.severity}||${normKey(issue.title)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (issue.severity === "red") red++;
      else if (issue.severity === "yellow") yellow++;
    }
    return { red, yellow };
  } catch { return { red: 0, yellow: 0 }; }
}

const PRO_PLANS = ["professional", "smart-guard", "agency", "agency-starter", "agency-pro"];

export default async function ScansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? "User";
  const plan = (session.user as { plan?: string }).plan ?? "starter";
  const isPro = PRO_PLANS.includes(plan);

  let scans: ScanRow[] = [];
  let monthlyScans = 0;

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const [scanRows, countRow] = await Promise.all([
      sql`
        SELECT
          id::text, url, created_at::text, issue_count,
          issues_json::text AS issues_json,
          share_token::text AS share_token,
          view_count, download_count,
          last_viewed_at::text AS last_viewed_at
        FROM scans
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC
        LIMIT 20
      ` as unknown as Promise<{
        id: string; url: string; created_at: string; issue_count: number | null;
        issues_json: string | null; share_token: string | null;
        view_count: number; download_count: number; last_viewed_at: string | null;
      }[]>,
      sql`
        SELECT COUNT(*)::int AS cnt
        FROM scans
        WHERE user_id = ${session.user.id}
          AND created_at >= date_trunc('month', NOW())
      ` as unknown as Promise<{ cnt: number }[]>,
    ]);

    scans = scanRows.map(row => {
      const { red, yellow } = countIssues(row.issues_json);
      return {
        id: row.id,
        url: row.url,
        created_at: row.created_at,
        issue_count: row.issue_count,
        red_count: red,
        yellow_count: yellow,
        share_token: row.share_token,
        view_count: row.view_count ?? 0,
        download_count: row.download_count ?? 0,
        last_viewed_at: row.last_viewed_at ?? null,
      };
    });

    monthlyScans = countRow[0]?.cnt ?? 0;
  } catch { /* non-critical */ }

  return (
    <ScansClient
      firstName={firstName}
      monthlyScans={monthlyScans}
      scanLimit={SCAN_LIMIT}
      scans={scans}
      plan={plan}
      isPro={isPro}
    />
  );
}
