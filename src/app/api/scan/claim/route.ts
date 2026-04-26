import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

type ScanIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik" | "shop" | "builder";
  url?: string;
  count: number;
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
    issues.push({ severity: "red", title: "Sicherheitsrisiko: Keine verschlüsselte Verbindung (HTTPS fehlt)", body: "Besucher sehen eine Browser-Warnung — Google stuft unverschlüsselte Seiten im Ranking ab.", category: "technik", count: 1 });
  if (!body.hasTitle)
    issues.push({ severity: "red", title: "Unsichtbar bei Google: Title-Tag fehlt (Startseite)", body: "Ohne Title-Tag fehlt das wichtigste On-Page-SEO-Signal — kein Ranking-Snippet in der Suche möglich.", category: "technik", count: 1 });
  if (!body.hasMeta)
    issues.push({ severity: "yellow", title: "Schlechte Klickrate: Meta-Description fehlt (Startseite)", body: "Google wählt einen zufälligen Seitenausschnitt als Vorschautext — Klicks und Conversions sinken messbar. Das Snippet sollte gezielt formuliert sein.", category: "technik", count: 1 });
  if (!body.hasH1)
    issues.push({ severity: "red", title: "SEO-Schwäche: H1-Hauptüberschrift fehlt (Startseite)", body: "Ohne H1 fehlt das wichtigste Inhaltssignal für Google — das Ranking leidet direkt darunter.", category: "technik", count: 1 });
  if (body.robotsBlocked)
    issues.push({ severity: "red", title: "Kritisch: robots.txt blockiert Google komplett", body: "Die gesamte Website ist für alle Suchmaschinen-Crawler gesperrt — kein Seiteninhalt wird indexiert.", category: "technik", count: 1 });
  if (body.noIndex)
    issues.push({ severity: "red", title: "Kritisch: Startseite für Google unsichtbar (noindex gesetzt)", body: "Der noindex-Tag macht die Startseite für Suchmaschinen komplett unsichtbar.", category: "technik", count: 1 });
  if (!body.hasSitemap)
    issues.push({ severity: "yellow", title: "Langsame Indexierung: Sitemap.xml fehlt", body: "Ohne Sitemap findet Google neue Inhalte langsamer — besonders kritisch nach Relaunch oder bei neu veröffentlichten Seiten.", category: "technik", count: 1 });

  const altMissing = body.altMissingCount ?? 0;
  if (altMissing > 0)
    issues.push({ severity: "red", title: `Barrierefreiheits-Verstoß: ${altMissing} Bilder für Screenreader unsichtbar (BFSG-Risiko)`, body: "Ab 06/2025 gesetzlich vorgeschrieben — konkrete Abmahngefahr.", category: "recht", count: altMissing });
  if ((body.brokenLinksCount ?? 0) > 0)
    issues.push({ severity: "red", title: `Geschäftsschädigend: ${body.brokenLinksCount} tote Link${body.brokenLinksCount !== 1 ? "s" : ""} (404) führen ins Leere`, body: "Fehlerhafte Links frustrieren Besucher, schaden dem Ranking und kosten Conversions.", category: "technik", count: body.brokenLinksCount! });
  if ((body.duplicateTitlesCount ?? 0) > 0)
    issues.push({ severity: "red", title: `Google-Verwirrung: ${body.duplicateTitlesCount}× identischer Title-Tag (Ranking-Verlust)`, body: "Doppelte Titles führen zu Duplicate-Content-Problemen bei Google.", category: "technik", count: body.duplicateTitlesCount! });
  if ((body.duplicateMetasCount ?? 0) > 0)
    issues.push({ severity: "yellow", title: `Schwache Klickrate: ${body.duplicateMetasCount}× identische Meta-Description`, body: "Identische Vorschautexte — Google ignoriert sie oder wählt beliebige Textausschnitte.", category: "technik", count: body.duplicateMetasCount! });
  if (body.hasUnreachable)
    issues.push({ severity: "red", title: "Toter Link: Unterseiten geben 404/5xx zurück", body: "Besucher und Crawler landen auf Fehlerseiten — UX-Schaden und Ranking-Verlust.", category: "technik", count: 1 });
  if ((body.orphanedPagesCount ?? 0) > 0)
    issues.push({ severity: "yellow", title: `Versteckter Content: ${body.orphanedPagesCount} Seiten ohne interne Verlinkung (nicht auffindbar)`, body: "Keine internen Links zeigen auf diese Seiten — Google und Besucher finden sie kaum.", category: "technik", count: body.orphanedPagesCount! });

  // Per-page issues
  for (const p of pages) {
    const path = toPath(p.url);
    if (!p.erreichbar)
      issues.push({ severity: "red", title: `Toter Link: ${path} gibt 404/5xx zurück`, body: "Besucher und Crawler landen auf einer Fehlerseite — direkter UX-Schaden und Ranking-Verlust.", category: "technik", url: p.url, count: 1 });
    if (p.altMissing > 0)
      issues.push({ severity: "red", title: `BFSG-Verstoß: ${p.altMissing}× fehlendes Alt-Attribut auf ${path}`, body: `${p.altMissing} Bilder ohne Alt-Text — Barrierefreiheitsgesetz ab 06/2025 verpflichtend.`, category: "recht", url: p.url, count: p.altMissing });
    if (p.noindex)
      issues.push({ severity: "yellow", title: `Für Google gesperrt: noindex auf ${path}`, body: "Diese Unterseite ist für Suchmaschinen komplett unsichtbar — ist das beabsichtigt?", category: "technik", url: p.url, count: 1 });
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
        ${issuesJson.reduce((acc, i) => acc + i.count, 0)},
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
