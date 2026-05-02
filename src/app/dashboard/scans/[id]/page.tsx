import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { IssueProp } from "@/components/dashboard/variants/_shared/IssueList";
import { isAtLeastProfessional } from "@/lib/plans";
import { getIntegrationSettings, connectionStatus } from "@/lib/integrations";
import ScanDetailClient from "./scan-detail-client";

type ScanIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik" | "shop" | "builder";
  url?: string;
  count: number;
};

type Scan = {
  id: string;
  url: string;
  type: string;
  created_at: string;
  issue_count: number | null;
  issues_json: string | null;
  unterseiten_json: string | null;
  speed_score: number | null;
  result: string | null;
  total_pages: number | null;
};

// ─── Consolidation helpers ─────────────────────────────────────────────────────

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
  const stripped = raw
    .replace(/\s+auf\s+(https?:\/\/\S+|\/\S+|\S+\.(html|php|aspx))\s*$/i, "")
    .replace(/\s+\(https?:\/\/\S+\)\s*$/, "")
    .trim();

  return stripped
    .replace(/^BFSG-Verstoß:\s*fehlendes?\s+alt-attribut$/i,   "Barrierefreiheit: Bilder-Beschreibung fehlt")
    .replace(/^BFSG-Verstoß:\s*fehlendes?\s+alt-text(e)?\s*$/i, "Barrierefreiheit: Bilder-Beschreibung fehlt")
    .replace(/^BFSG-Verstoß:\s*/i,                              "Barrierefreiheit: ")
    .replace(/^Fehlendes?\s+alt-attribut$/i,                    "Barrierefreiheit: Bilder-Beschreibung fehlt")
    .replace(/^Fehlendes?\s+alt-text(e)?\s*$/i,                 "Barrierefreiheit: Bilder-Beschreibung fehlt");
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function ScanDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT id, url, type, created_at, issue_count,
           issues_json::text       AS issues_json,
           unterseiten_json::text  AS unterseiten_json,
           speed_score, result, total_pages
    FROM scans
    WHERE id = ${params.id} AND user_id = ${session.user.id}
    LIMIT 1
  ` as Scan[];

  if (!rows[0]) notFound();

  const scan = rows[0];
  const plan = (session.user as { plan?: string }).plan ?? "starter";

  // Parse + consolidate issues from JSON column
  let rawIssues: ScanIssue[] = [];
  try {
    if (scan.issues_json) rawIssues = JSON.parse(scan.issues_json) as ScanIssue[];
  } catch { /* malformed JSON — treat as empty */ }

  // Parse unterseiten — die Per-Page-Daten für den Issue-Detail-Drawer
  // (Liste der konkreten Bilder ohne Alt, Form-Felder ohne Label, etc.).
  // Bei alten Scans ohne unterseiten_json bleibt das Array leer und der
  // Client zeigt den Drawer nicht.
  type UnterseiteRaw = {
    url: string; erreichbar: boolean; title: string; h1?: string;
    noindex: boolean; altMissing: number; altMissingImages?: string[];
    metaDescription?: string;
    inputsWithoutLabel?: number; inputsWithoutLabelFields?: string[];
    buttonsWithoutText?: number; foundVia?: string;
  };
  let unterseiten: UnterseiteRaw[] = [];
  try {
    if (scan.unterseiten_json) unterseiten = JSON.parse(scan.unterseiten_json) as UnterseiteRaw[];
  } catch { /* malformed JSON — treat as empty */ }

  const panelIssues = consolidate(rawIssues);
  const redCount    = panelIssues.filter(i => i.severity === "red").reduce((s, i) => s + (i.count ?? 1), 0);
  const yellowCount = panelIssues.filter(i => i.severity === "yellow").reduce((s, i) => s + (i.count ?? 1), 0);

  // Use persisted speed_score when available (stored at scan time, same formula as live dashboard).
  // Fallback: estimate from speed/tech issue count for older scans without the column.
  const techIssueCount = panelIssues.filter(i => i.category === "speed" || i.category === "technik").length;
  const speedScore = scan.speed_score
    ?? (scan.issue_count === null ? 72 : Math.max(10, Math.min(92, 100 - techIssueCount * 12)));

  // Integrations-Status für die Issue-Action-Bar — identisch zur Logik in
  // dashboard/page.tsx. Pro+ kriegt die Asana/Slack-Buttons; bei Failure
  // bleibt es leer und der User sieht nur die "Provider verbinden →"-Hints.
  let integrationsStatus: { asana: boolean; slack: boolean } | null = null;
  if (isAtLeastProfessional(plan)) {
    try {
      const settings = await getIntegrationSettings(session.user.id as string);
      const s = connectionStatus(settings);
      integrationsStatus = { asana: s.asana, slack: s.slack };
    } catch (err) {
      console.error("[scans/[id]] integrations status load failed:", err);
    }
  }

  return (
    <ScanDetailClient
      url={scan.url}
      createdAt={scan.created_at}
      plan={plan}
      issues={panelIssues}
      redCount={redCount}
      yellowCount={yellowCount}
      speedScore={speedScore}
      scanId={scan.id}
      integrationsStatus={integrationsStatus}
      unterseiten={unterseiten}
      diagnose={scan.result ?? ""}
      totalPages={scan.total_pages ?? unterseiten.length}
      issueCount={scan.issue_count ?? panelIssues.reduce((s, i) => s + (i.count ?? 1), 0)}
    />
  );
}
