import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

type ScanIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik";
  url?: string;
};

type Unterseite = {
  url: string;
  erreichbar: boolean;
  altMissing: number;
  noindex: boolean;
  altMissingImages?: string[];
};

/** Build structured issues from the sessionStorage scan data (same logic as buildIssuesJson in route.ts) */
function buildIssuesFromClaim(body: {
  https?: boolean; hasTitle?: boolean; hasMeta?: boolean; hasH1?: boolean;
  hasSitemap?: boolean; robotsBlocked?: boolean; noIndex?: boolean;
  altMissingCount?: number; brokenLinksCount?: number; duplicateTitlesCount?: number;
  duplicateMetasCount?: number; hasUnreachable?: boolean; orphanedPagesCount?: number;
  unterseiten?: Unterseite[];
}): ScanIssue[] {
  const issues: ScanIssue[] = [];
  const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };
  const pages = body.unterseiten ?? [];

  if (body.https === false)
    issues.push({ severity: "red", title: "Kein HTTPS", body: "Sicherheitsrisiko und Google-Ranking-Nachteil.", category: "technik" });
  if (!body.hasTitle)
    issues.push({ severity: "red", title: "Title-Tag fehlt (Startseite)", body: "Fehlender Title schadet dem Google-Ranking.", category: "technik" });
  if (!body.hasMeta)
    issues.push({ severity: "yellow", title: "Meta-Description fehlt (Startseite)", body: "Google zeigt zufälligen Seitenausschnitt.", category: "technik" });
  if (!body.hasH1)
    issues.push({ severity: "red", title: "H1-Tag fehlt (Startseite)", body: "Fehlende H1 schwächt SEO-Signal.", category: "technik" });
  if (body.robotsBlocked)
    issues.push({ severity: "red", title: "robots.txt blockiert alle Crawler", body: "Google kann die Seite nicht indexieren.", category: "technik" });
  if (body.noIndex)
    issues.push({ severity: "red", title: "Noindex auf Startseite", body: "Startseite ist für Suchmaschinen unsichtbar.", category: "technik" });
  if (!body.hasSitemap)
    issues.push({ severity: "yellow", title: "Sitemap.xml fehlt", body: "Ohne Sitemap findet Google neue Seiten langsamer.", category: "technik" });

  const altMissing = body.altMissingCount ?? 0;
  if (altMissing > 0)
    issues.push({ severity: "red", title: `${altMissing} Bilder ohne Alt-Text (BFSG 2025 Pflicht)`, body: "Barrierefreiheitspflicht ab 06/2025 — Abmahnrisiko.", category: "recht" });
  if ((body.brokenLinksCount ?? 0) > 0)
    issues.push({ severity: "red", title: `${body.brokenLinksCount} Broken Link${body.brokenLinksCount !== 1 ? "s" : ""} (404)`, body: "Fehlerhafte Links schaden UX und SEO.", category: "technik" });
  if ((body.duplicateTitlesCount ?? 0) > 0)
    issues.push({ severity: "red", title: `${body.duplicateTitlesCount}× doppelter Title-Tag`, body: "Doppelte Titles verwirren Google.", category: "technik" });
  if ((body.duplicateMetasCount ?? 0) > 0)
    issues.push({ severity: "yellow", title: `${body.duplicateMetasCount}× doppelte Meta-Description`, body: "", category: "technik" });
  if (body.hasUnreachable)
    issues.push({ severity: "red", title: "Unterseiten nicht erreichbar (404/5xx)", body: "Fehlerhafte Unterseiten schaden UX und SEO.", category: "technik" });
  if ((body.orphanedPagesCount ?? 0) > 0)
    issues.push({ severity: "yellow", title: `${body.orphanedPagesCount} verwaiste Unterseiten`, body: "Keine internen Links zeigen auf diese Seiten.", category: "technik" });

  // Per-page issues
  for (const p of pages) {
    const path = toPath(p.url);
    if (!p.erreichbar)
      issues.push({ severity: "red", title: `Unterseite nicht erreichbar: ${path}`, body: "4xx/5xx-Fehler.", category: "technik", url: p.url });
    if (p.altMissing > 0)
      issues.push({ severity: "red", title: `${p.altMissing}× Alt-Text fehlt: ${path}`, body: `${p.altMissing} Bilder ohne Alt-Text (BFSG 2025).`, category: "recht", url: p.url });
    if (p.noindex)
      issues.push({ severity: "yellow", title: `Noindex: ${path}`, body: "Für Google unsichtbar.", category: "technik", url: p.url });
  }

  return issues;
}

// Speichert einen anonymen Scan (aus sessionStorage) für den eingeloggten User in der DB.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
    }

    const body = await req.json() as {
      url?: string; diagnose?: string; issueCount?: number; techFingerprint?: unknown;
      unterseiten?: Unterseite[]; totalPages?: number | null;
      altMissingCount?: number; brokenLinksCount?: number;
      duplicateTitlesCount?: number; duplicateMetasCount?: number;
      hasUnreachable?: boolean; orphanedPagesCount?: number;
      https?: boolean; hasTitle?: boolean; hasMeta?: boolean; hasH1?: boolean;
      hasSitemap?: boolean; robotsBlocked?: boolean; noIndex?: boolean;
    };

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json({ error: "Ungültige URL." }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Verhindere Duplikate
    const existing = await sql`
      SELECT id FROM scans
      WHERE user_id = ${session.user.id} AND url = ${body.url}
      ORDER BY created_at DESC LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ ok: true, scanId: existing[0].id, duplicate: true });
    }

    // Build structured issues from frontend data — same ground truth as the live scan showed
    const issuesJson = buildIssuesFromClaim(body);

    const rows = await sql`
      INSERT INTO scans (user_id, url, type, issue_count, result, issues_json, tech_fingerprint, total_pages, unterseiten_json)
      VALUES (
        ${session.user.id},
        ${body.url},
        'website',
        ${issuesJson.filter(i => i.severity === "red").length},
        ${body.diagnose ?? ""},
        ${JSON.stringify(issuesJson)},
        ${body.techFingerprint ? JSON.stringify(body.techFingerprint) : null},
        ${body.totalPages ?? null},
        ${body.unterseiten && body.unterseiten.length > 0 ? JSON.stringify(body.unterseiten) : null}
      )
      RETURNING id::text
    ` as { id: string }[];

    return NextResponse.json({ ok: true, scanId: rows[0]?.id });
  } catch (err) {
    console.error("scan/claim error:", err);
    return NextResponse.json({ error: "Fehler beim Speichern." }, { status: 500 });
  }
}
