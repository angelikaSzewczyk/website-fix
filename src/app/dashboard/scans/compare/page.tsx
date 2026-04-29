import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import { isAtLeastProfessional, normalizePlan } from "@/lib/plans";
import CompareClient from "./compare-client";

export const metadata: Metadata = {
  title: "Scan-Vergleich — WebsiteFix",
  robots: { index: false },
};

type ScanRow = {
  id:               string;
  url:              string;
  created_at:       string;
  issue_count:      number | null;
  speed_score:      number | null;
  issues_json:      string | null;
  tech_fingerprint: {
    cms?:       { value?: string; confidence?: number };
    builder?:   { value?: string; confidence?: number };
    ecommerce?: { value?: string; confidence?: number };
  } | null;
  meta_json: {
    woo_audit?: {
      addToCartButtons: number; cartButtonsBlocked: boolean;
      pluginImpact: Array<{ name: string; impactScore: number; reason: string }>;
      outdatedTemplates: boolean; revenueRiskPct: number;
    } | null;
    builder_audit?: {
      builder: string | null; maxDomDepth: number; divCount: number;
      googleFontFamilies: string[]; cssBloatHints: string[]; stylesheetCount: number;
    } | null;
  } | null;
};

type ParsedIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  category: "recht" | "speed" | "technik" | "shop" | "builder";
  count?: number;
};

export default async function ComparePage({ searchParams }: { searchParams: { a?: string; b?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (normalizePlan(plan) === null) redirect("/fuer-agenturen");
  // Vergleichs-Modus: Pro & Agency only
  if (!isAtLeastProfessional(plan)) {
    redirect("/dashboard/scans?upgrade=compare");
  }

  const idA = searchParams.a;
  const idB = searchParams.b;
  if (!idA || !idB) redirect("/dashboard/scans");

  const sql = neon(process.env.DATABASE_URL!);
  let rows: ScanRow[] = [];
  try {
    rows = await sql`
      SELECT id::text, url, created_at::text, issue_count, speed_score,
             issues_json::text AS issues_json, tech_fingerprint, meta_json
      FROM scans
      WHERE user_id = ${session.user.id} AND id::text IN (${idA}, ${idB})
      ORDER BY created_at ASC
    ` as ScanRow[];
  } catch {
    redirect("/dashboard/scans");
  }

  if (rows.length !== 2) {
    redirect("/dashboard/scans?err=compare-notfound");
  }

  // Older scan = "before", newer scan = "after"
  const [before, after] = rows;

  // Parse issues
  function parseIssues(raw: string | null): ParsedIssue[] {
    if (!raw) return [];
    try { return JSON.parse(raw) as ParsedIssue[]; } catch { return []; }
  }
  const issuesBefore = parseIssues(before.issues_json);
  const issuesAfter  = parseIssues(after.issues_json);

  // Sanitize tech_fingerprint: leeres Objekt {} aus DB → NULL behandeln.
  // Sonst crasht der Client-Code mit `fingerprint && fingerprint.ecommerce.value`.
  // Mindest-Strukturcheck: TechFingerprint hat immer cms-Feld.
  function sanitizeFingerprint(raw: unknown): ScanRow["tech_fingerprint"] {
    if (!raw || typeof raw !== "object") return null;
    if (Object.keys(raw).length === 0) return null;
    if (!("cms" in raw)) return null;
    return raw as ScanRow["tech_fingerprint"];
  }
  const fingerprintBefore = sanitizeFingerprint(before.tech_fingerprint);
  const fingerprintAfter  = sanitizeFingerprint(after.tech_fingerprint);

  return (
    <CompareClient
      before={{
        id:           before.id,
        url:          before.url,
        createdAt:    before.created_at,
        issueCount:   before.issue_count ?? 0,
        speedScore:   before.speed_score ?? 0,
        issues:       issuesBefore,
        techFingerprint: fingerprintBefore,
        wooAudit:     before.meta_json?.woo_audit ?? null,
        builderAudit: before.meta_json?.builder_audit ?? null,
      }}
      after={{
        id:           after.id,
        url:          after.url,
        createdAt:    after.created_at,
        issueCount:   after.issue_count ?? 0,
        speedScore:   after.speed_score ?? 0,
        issues:       issuesAfter,
        techFingerprint: fingerprintAfter,
        wooAudit:     after.meta_json?.woo_audit ?? null,
        builderAudit: after.meta_json?.builder_audit ?? null,
      }}
    />
  );
}
