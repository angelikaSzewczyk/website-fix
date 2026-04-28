/**
 * GET /api/export/pdf?scanId=<uuid>
 *
 * Liefert ein professionelles Executive-Summary-PDF für einen einzelnen
 * Website-Scan zurück. Nur Scan-Owner darf herunterladen — wir checken
 * user_id gegen die Session, bevor wir Daten ausliefern.
 *
 * White-Label: Der `agency`-Prop des PDF-Components ist bereits im
 * Renderer verdrahtet. Sobald wir agency_settings (Logo, Primärfarbe)
 * laden wollen, hier den fetch hinzufügen und das Objekt durchreichen.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { renderToBuffer } from "@react-pdf/renderer";
import { ScanReportPdf, type PdfScanIssue } from "@/lib/pdf/scan-report-pdf";
import { classifyDisplayCategory, quickCategoryScore, DISPLAY_CATEGORIES, type DisplayCategory } from "@/lib/issue-categories";

export const runtime     = "nodejs";  // @react-pdf/renderer braucht Node.js APIs
export const maxDuration = 30;

// ─── Types matching DB shape ────────────────────────────────────────────────
type ScanRow = {
  url:               string;
  speed_score:       number | null;
  issue_count:       number;
  issues_json:       PdfScanIssue[] | null;
  meta_json:         Record<string, unknown> | null;
  tech_fingerprint:  Record<string, unknown> | null;
  total_pages:       number | null;
  created_at:        string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Extrahiert die WordPress-Version aus der Issue-Liste (Stale-Warnung) oder
 *  als Fallback aus tech_fingerprint.cms.evidence. Gibt null zurück, wenn
 *  weder das eine noch das andere greift (gehärtete WP-Sites blenden den
 *  Generator-Tag aus → für die unbekannt). */
function extractWpVersion(
  issues: PdfScanIssue[] | null,
  fingerprint: Record<string, unknown> | null,
): string | null {
  // 1. Stale-Warnung enthält die Version direkt im Titel
  const staleIssue = issues?.find(i => /WordPress veraltet: ([\d.]+)/i.test(i.title));
  if (staleIssue) {
    const m = staleIssue.title.match(/WordPress veraltet: ([\d.]+)/i);
    if (m?.[1]) return m[1];
  }

  // 2. Fingerprint-Evidence — Strings wie "WordPress 6.5 (Generator-Tag)"
  const cms = fingerprint?.cms as { evidence?: string[] } | undefined;
  if (Array.isArray(cms?.evidence)) {
    for (const ev of cms.evidence) {
      const m = ev.match(/WordPress\s+(\d+\.\d+(?:\.\d+)?)/i);
      if (m?.[1]) return m[1];
    }
  }

  return null;
}

/** Sortiert Issues nach Severity (red → yellow → green) und within severity
 *  nach count desc. Liefert die Top-N als "Wachstums-Bremsen". */
function selectTopIssues(issues: PdfScanIssue[] | null, n: number): PdfScanIssue[] {
  if (!Array.isArray(issues)) return [];
  const rank: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  return [...issues]
    .sort((a, b) => {
      const r = (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9);
      if (r !== 0) return r;
      return (b.count ?? 0) - (a.count ?? 0);
    })
    .slice(0, n);
}

function safeFilename(url: string, scannedAt: string): string {
  let host = url;
  try { host = new URL(url).hostname; } catch { /* keep as-is */ }
  const date = scannedAt.slice(0, 10); // YYYY-MM-DD
  const sanitised = host.replace(/[^a-z0-9.-]/gi, "_");
  return `WebsiteFix-Audit-${sanitised}-${date}.pdf`;
}

// ─── Route Handler ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Auth gate
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  // Param check
  const scanId = req.nextUrl.searchParams.get("scanId")?.trim();
  if (!scanId || !isValidUuid(scanId)) {
    return NextResponse.json({ error: "scanId fehlt oder ist ungültig." }, { status: 400 });
  }

  // DB fetch (ownership-checked in same query — kein 404/403-Leak)
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT url, speed_score, issue_count, issues_json, meta_json,
           tech_fingerprint, total_pages, created_at
    FROM scans
    WHERE id = ${scanId}::uuid AND user_id = ${userId}
    LIMIT 1
  ` as ScanRow[];

  if (rows.length === 0) {
    return NextResponse.json({ error: "Scan nicht gefunden." }, { status: 404 });
  }

  const row = rows[0];

  // Daten aufbereiten
  const speedScore = typeof row.speed_score === "number" ? row.speed_score : 0;
  const meta       = row.meta_json ?? {};
  const ttfbMs     = typeof meta.ttfb_ms === "number" ? meta.ttfb_ms : null;
  const wpVersion  = extractWpVersion(row.issues_json, row.tech_fingerprint);
  const topIssues  = selectTopIssues(row.issues_json, 5);
  const scannedAt  = typeof row.created_at === "string" ? row.created_at : new Date().toISOString();

  // Phase-3: 4 Anzeige-Kategorie-Scores (Performance / SEO / Best Practices / Accessibility)
  const allIssues = (row.issues_json ?? []) as PdfScanIssue[];
  const categoryScores: Record<DisplayCategory, number> = {
    performance:   quickCategoryScore(allIssues, "performance",   speedScore),
    seo:           quickCategoryScore(allIssues, "seo",           100),
    bestPractices: quickCategoryScore(allIssues, "bestPractices", 100),
    accessibility: quickCategoryScore(allIssues, "accessibility", 100),
  };
  const categoryIssueCounts: Record<DisplayCategory, number> = {
    performance:   allIssues.filter(i => classifyDisplayCategory(i) === "performance").length,
    seo:           allIssues.filter(i => classifyDisplayCategory(i) === "seo").length,
    bestPractices: allIssues.filter(i => classifyDisplayCategory(i) === "bestPractices").length,
    accessibility: allIssues.filter(i => classifyDisplayCategory(i) === "accessibility").length,
  };
  // Suppress lint warnings for arrays we only need for type hints
  void DISPLAY_CATEGORIES;

  // White-Label-Branding: agency_settings vom User laden. Existiert kein
  // Eintrag oder sind alle Felder leer → undefined → PDF nutzt WebsiteFix-Defaults.
  // Bei Pro+/Agency-Kunden mit hinterlegtem Branding ersetzt das Logo + Farbe
  // automatisch das WebsiteFix-Default in <ScanReportPdf>.
  let agencyBranding: { name?: string; logoUrl?: string; primaryColor?: string } | undefined;
  try {
    const settings = await sql`
      SELECT agency_name, logo_url, primary_color
      FROM agency_settings
      WHERE user_id = ${userId}
      LIMIT 1
    ` as { agency_name: string | null; logo_url: string | null; primary_color: string | null }[];
    if (settings.length > 0) {
      const s = settings[0];
      const name         = s.agency_name?.trim() || undefined;
      const logoUrl      = s.logo_url?.trim() || undefined;
      const primaryColor = s.primary_color?.trim() || undefined;
      // Nur durchreichen wenn mindestens ein Feld gesetzt ist
      if (name || logoUrl || primaryColor) {
        agencyBranding = { name, logoUrl, primaryColor };
      }
    }
  } catch {
    // agency_settings-Tabelle könnte fehlen oder Migration ausstehen — silent fallback
    agencyBranding = undefined;
  }

  const buffer = await renderToBuffer(
    <ScanReportPdf
      url={row.url}
      scannedAt={scannedAt}
      speedScore={speedScore}
      issueCount={row.issue_count}
      totalPages={row.total_pages}
      ttfbMs={ttfbMs}
      wpVersion={wpVersion}
      topIssues={topIssues}
      categoryScores={categoryScores}
      categoryIssueCounts={categoryIssueCounts}
      agency={agencyBranding}
    />,
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="${safeFilename(row.url, scannedAt)}"`,
      // Cache pro Scan-ID — Scans sind immutable, sicher fürs CDN.
      "Cache-Control":       "private, max-age=3600",
    },
  });
}
