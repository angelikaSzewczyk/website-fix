import { neon } from "@neondatabase/serverless";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ViewClient from "./view-client";
import type { IssueProp } from "@/components/dashboard/variants/_shared/IssueList";

export const metadata: Metadata = { robots: { index: false } };
export const dynamic = "force-dynamic";

type ScanIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik" | "shop" | "builder";
  url?: string;
  count: number;
};

type Row = {
  id: string;
  url: string;
  created_at: string;
  issues_json: string | null;
  speed_score: number | null;
  meta_json: {
    executive_summary?: string;
    builder_audit?: {
      builder: string | null; maxDomDepth: number; divCount: number;
      googleFontFamilies: string[]; cssBloatHints: string[]; stylesheetCount: number;
    } | null;
  } | null;
  tech_fingerprint: {
    ecommerce?: { value?: string; confidence?: number };
    builder?:   { value?: string; confidence?: number };
  } | null;
  agency_name: string | null;
  agency_website: string | null;
  logo_url: string | null;
  primary_color: string | null;
};

function normaliseTitleKey(raw: string): string {
  return raw
    .replace(/\s+auf\s+(https?:\/\/\S+|\/\S+|\S+\.(html|php|aspx))\s*$/i, "")
    .replace(/\s+\(https?:\/\/\S+\)\s*$/, "")
    .replace(/^BFSG-Verstoß:\s*/i, "")
    .replace(/^Barrierefreiheit:\s*/i, "")
    .trim()
    .toLowerCase();
}

function friendlyTitle(raw: string): string {
  return raw
    .replace(/\s+auf\s+(https?:\/\/\S+|\/\S+|\S+\.(html|php|aspx))\s*$/i, "")
    .replace(/\s+\(https?:\/\/\S+\)\s*$/, "")
    .trim()
    .replace(/^BFSG-Verstoß:\s*fehlendes?\s+alt-attribut$/i,    "Barrierefreiheit: Bilder-Beschreibung fehlt")
    .replace(/^BFSG-Verstoß:\s*fehlendes?\s+alt-text(e)?\s*$/i, "Barrierefreiheit: Bilder-Beschreibung fehlt")
    .replace(/^BFSG-Verstoß:\s*/i,                               "Barrierefreiheit: ")
    .replace(/^Fehlendes?\s+alt-attribut$/i,                     "Barrierefreiheit: Bilder-Beschreibung fehlt")
    .replace(/^Fehlendes?\s+alt-text(e)?\s*$/i,                  "Barrierefreiheit: Bilder-Beschreibung fehlt");
}

function consolidate(raw: ScanIssue[]): IssueProp[] {
  const map = new Map<string, IssueProp & { totalCount: number }>();
  for (const issue of raw) {
    const key = `${issue.severity}||${normaliseTitleKey(issue.title)}`;
    if (map.has(key)) {
      map.get(key)!.totalCount += issue.count ?? 1;
    } else {
      map.set(key, {
        severity: issue.severity,
        title: friendlyTitle(issue.title),
        body: issue.body,
        category: issue.category,
        count: issue.count ?? 1,
        totalCount: issue.count ?? 1,
      });
    }
  }
  return Array.from(map.values()).map(({ totalCount, ...rest }) => ({ ...rest, count: totalCount }));
}

export default async function ViewPage({ params }: { params: { token: string } }) {
  const sql = neon(process.env.DATABASE_URL!);

  let rows: Row[];
  try {
    rows = await sql`
      SELECT
        s.id, s.url, s.created_at,
        s.issues_json::text AS issues_json,
        s.speed_score,
        s.meta_json,
        s.tech_fingerprint,
        a.agency_name,
        a.agency_website,
        a.logo_url,
        a.primary_color
      FROM scans s
      LEFT JOIN agency_settings a ON a.user_id = s.user_id
      WHERE s.share_token = ${params.token}::uuid
      LIMIT 1
    ` as Row[];
  } catch {
    notFound();
  }

  // Fire-and-forget: increment view_count + set last_viewed_at (never blocks render)
  sql`
    UPDATE scans
    SET view_count = view_count + 1, last_viewed_at = NOW()
    WHERE share_token = ${params.token}::uuid
  `.catch(() => {});

  if (!rows[0]) notFound();
  const scan = rows[0];

  let rawIssues: ScanIssue[] = [];
  try {
    if (scan.issues_json) rawIssues = JSON.parse(scan.issues_json) as ScanIssue[];
  } catch { /* malformed */ }

  const issues     = consolidate(rawIssues);
  const redCount   = issues.filter(i => i.severity === "red").reduce((s, i) => s + (i.count ?? 1), 0);
  const yellowCount = issues.filter(i => i.severity === "yellow").reduce((s, i) => s + (i.count ?? 1), 0);
  const techCount  = issues.filter(i => i.category === "speed" || i.category === "technik").length;
  const speedScore = scan.speed_score ?? Math.max(10, Math.min(92, 100 - techCount * 12));

  const execSummary = scan.meta_json?.executive_summary ?? null;
  const isWooCommerce =
    scan.tech_fingerprint?.ecommerce?.value === "WooCommerce" &&
    (scan.tech_fingerprint?.ecommerce?.confidence ?? 0) >= 0.45;
  const builderAudit = scan.meta_json?.builder_audit ?? null;

  return (
    <ViewClient
      url={scan.url}
      createdAt={scan.created_at}
      issues={issues}
      redCount={redCount}
      yellowCount={yellowCount}
      speedScore={speedScore}
      execSummary={execSummary}
      agencyName={scan.agency_name}
      agencyWebsite={scan.agency_website}
      logoUrl={scan.logo_url}
      primaryColor={scan.primary_color ?? "#8df3d3"}
      shareToken={params.token}
      isWooCommerce={isWooCommerce}
      builderAudit={builderAudit}
    />
  );
}
