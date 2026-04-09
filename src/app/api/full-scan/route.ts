import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isUrlAllowed } from "@/lib/scan-guard";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SKIP_EXT = /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|woff2|ttf|eot|otf)(\?|$)/i;

// ── Plan limits ─────────────────────────────────────────────────────────────
function getMaxPages(plan: string): number {
  if (plan === "agency_scale") return 150;
  if (plan === "agency_core" || plan === "agentur") return 50;
  if (plan === "pro" || plan === "freelancer") return 25;
  return 10;
}

// ── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, ms = 7000): Promise<Response | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "WebsiteFix-Scanner/1.0" },
    });
    clearTimeout(t);
    return r;
  } catch {
    clearTimeout(t);
    return null;
  }
}

function extractBetween(html: string, start: string, end: string): string {
  const s = html.toLowerCase().indexOf(start.toLowerCase());
  if (s === -1) return "";
  const e = html.indexOf(end, s + start.length);
  return e === -1 ? "" : html.slice(s + start.length, e).trim();
}

function extractMeta(html: string, name: string): string {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i")) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, "i"));
  return m ? m[1] : "";
}

function extractInternalLinks(html: string, host: string): string[] {
  const links = new Set<string>();
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1].trim();
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    )
      continue;
    if (SKIP_EXT.test(href)) continue;
    try {
      const u = href.startsWith("http") ? new URL(href) : new URL(href, `https://${host}`);
      if (u.host === host) {
        links.add(`${u.protocol}//${u.host}${u.pathname}`.replace(/\/$/, "") || `https://${host}`);
      }
    } catch {
      /* ignore malformed */
    }
  }
  return [...links];
}

function countMissingAlt(html: string): { missing: number; total: number } {
  const imgs = html.match(/<img[^>]*>/gi) ?? [];
  return {
    missing: imgs.filter((t) => !t.match(/alt=["'][^"']+["']/i)).length,
    total: imgs.length,
  };
}

// ── Page type classifier ─────────────────────────────────────────────────────
function classifyPageType(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (path === "/" || path === "") return "Startseite";
    if (/\/(blog|news|artikel|post|beitrag|aktuell)/.test(path)) return "Blog/News";
    if (/\/(product|produkt|shop|ware|item|artikel\/[^/]+$)/.test(path)) return "Produktseite";
    if (/\/(about|uber-uns|ueber-uns|about-us|ueber|wir|team)/.test(path)) return "Über uns";
    if (/\/(contact|kontakt|ansprechpartner)/.test(path)) return "Kontakt";
    if (/\/(impressum|datenschutz|legal|agb|privacy|terms|cookie)/.test(path)) return "Rechtliches";
    if (/\/(service|leistung|dienstleistung|angebot|loesungen)/.test(path)) return "Leistungen";
    if (/\/(jobs|karriere|career|stellenangebote)/.test(path)) return "Karriere";
    if (/\/(faq|hilfe|help|support|wissen)/.test(path)) return "FAQ/Support";
    const depth = path.split("/").filter(Boolean).length;
    if (depth === 1) return "Top-Level-Seite";
    return "Unterseite";
  } catch {
    return "Unterseite";
  }
}

// ── Page data type ───────────────────────────────────────────────────────────
type PageData = {
  url: string;
  pageType: string;
  ok: boolean;
  status: number;
  title: string;
  h1: string;
  metaDescription: string;
  noindex: boolean;
  canonical: string;
  altMissing: number;
  altTotal: number;
};

async function scanPage(url: string, host: string): Promise<{ data: PageData; links: string[] }> {
  const empty: PageData = {
    url,
    pageType: classifyPageType(url),
    ok: false,
    status: 0,
    title: "",
    h1: "",
    metaDescription: "",
    noindex: false,
    canonical: "",
    altMissing: 0,
    altTotal: 0,
  };
  const res = await fetchWithTimeout(url, 6000);
  if (!res) return { data: empty, links: [] };

  let html = "";
  try {
    html = await res.text();
  } catch {
    return { data: { ...empty, ok: res.ok, status: res.status }, links: [] };
  }

  const alt = countMissingAlt(html);
  const links = extractInternalLinks(html, host);

  return {
    data: {
      url,
      pageType: classifyPageType(url),
      ok: res.ok,
      status: res.status,
      title: extractBetween(html, "<title>", "</title>").replace(/\s+/g, " ").trim(),
      h1: extractBetween(html, "<h1", "</h1>")
        .replace(/<[^>]+>/g, "")
        .trim(),
      metaDescription: extractMeta(html, "description"),
      noindex: extractMeta(html, "robots").includes("noindex"),
      canonical: (() => {
        const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
        return m ? m[1] : "";
      })(),
      altMissing: alt.missing,
      altTotal: alt.total,
    },
    links,
  };
}

// ── SSE event helper ─────────────────────────────────────────────────────────
const enc = new TextEncoder();
function sseEvent(event: string, data: object): Uint8Array {
  return enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Main GET handler (SSE) ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) return new Response("Missing url parameter", { status: 400 });

  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

  if (!isUrlAllowed(targetUrl)) {
    return new Response("Diese URL kann nicht gescannt werden.", { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Nicht angemeldet", { status: 401 });
  }

  const plan = ((session.user as Record<string, unknown>).plan as string | undefined) ?? "free";
  const maxPages = getMaxPages(plan);

  let host: string;
  try {
    host = new URL(targetUrl).host;
  } catch {
    return new Response("Ungültige URL", { status: 400 });
  }

  const abortSignal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      function enqueue(event: string, data: object) {
        try {
          controller.enqueue(sseEvent(event, data));
        } catch {
          /* controller closed */
        }
      }

      try {
        // ── Phase 1: BFS Crawl ─────────────────────────────────────────────
        enqueue("phase", { phase: "crawling", message: "Starte Crawl der gesamten Website..." });

        const visited = new Set<string>();
        const normalize = (u: string) => u.replace(/\/$/, "") || `https://${host}`;
        const queue: string[] = [normalize(targetUrl)];
        const allPages: PageData[] = [];

        // Seed from sitemap
        try {
          const sitemapRes = await fetchWithTimeout(`https://${host}/sitemap.xml`, 5000);
          if (sitemapRes?.ok) {
            const xml = await sitemapRes.text();
            const sitemapUrls = (xml.match(/<loc>([^<]+)<\/loc>/g) ?? [])
              .map((m) => m.replace(/<\/?loc>/g, "").trim())
              .filter((u) => {
                try {
                  return !u.endsWith(".xml") && new URL(u).host === host;
                } catch {
                  return false;
                }
              });
            for (const u of sitemapUrls) {
              const n = normalize(u);
              if (!queue.includes(n)) queue.push(n);
            }
          }
        } catch {
          /* sitemap optional */
        }

        // BFS with batch size 5
        while (queue.length > 0 && visited.size < maxPages) {
          if (abortSignal?.aborted) break;

          const batch = queue.splice(0, 5).filter((u) => !visited.has(u));
          if (batch.length === 0) continue;
          batch.forEach((u) => visited.add(u));

          const results = await Promise.all(batch.map((u) => scanPage(u, host)));

          for (const { data, links } of results) {
            allPages.push(data);
            for (const l of links) {
              const n = normalize(l);
              if (!visited.has(n) && !queue.includes(n)) queue.push(n);
            }
          }

          enqueue("progress", {
            phase: "crawling",
            found: visited.size,
            remaining: Math.min(queue.length, maxPages - visited.size),
            message: `Crawle... ${visited.size} Seiten gefunden`,
          });

          // Polite delay between batches
          await new Promise((r) => setTimeout(r, 150));
        }

        if (allPages.length === 0) {
          enqueue("error", { message: "Website nicht erreichbar oder keine Seiten gefunden." });
          controller.close();
          return;
        }

        // ── Phase 2: Aggregate Issues ──────────────────────────────────────
        enqueue("phase", {
          phase: "analyzing",
          message: `${allPages.length} Seiten gecrawlt — analysiere Probleme...`,
        });

        const reachable = allPages.filter((p) => p.ok);

        // Duplicate titles
        const titleMap = new Map<string, PageData[]>();
        for (const p of reachable.filter((p) => p.title)) {
          const k = p.title.toLowerCase().trim();
          titleMap.set(k, [...(titleMap.get(k) ?? []), p]);
        }
        const dupTitles = [...titleMap.entries()].filter(([, pages]) => pages.length > 1);

        // Duplicate meta descriptions
        const metaMap = new Map<string, PageData[]>();
        for (const p of reachable.filter((p) => p.metaDescription)) {
          const k = p.metaDescription.toLowerCase().trim();
          metaMap.set(k, [...(metaMap.get(k) ?? []), p]);
        }
        const dupMetas = [...metaMap.entries()].filter(([, pages]) => pages.length > 1);

        const missingTitle = reachable.filter((p) => !p.title);
        const missingH1 = reachable.filter((p) => !p.h1);
        const missingMeta = reachable.filter((p) => !p.metaDescription);
        const noindexPages = reachable.filter((p) => p.noindex);
        const brokenPages = allPages.filter((p) => !p.ok && p.status !== 0);
        const timeoutPages = allPages.filter((p) => !p.ok && p.status === 0);
        const totalAltMissing = allPages.reduce((s, p) => s + p.altMissing, 0);
        const totalImages = allPages.reduce((s, p) => s + p.altTotal, 0);
        const pagesWithAltIssues = allPages.filter((p) => p.altMissing > 0).length;

        // Group by page type — pick 1 representative each
        const byType = new Map<string, PageData[]>();
        for (const p of allPages) {
          byType.set(p.pageType, [...(byType.get(p.pageType) ?? []), p]);
        }

        // ── Phase 3: AI Analysis ───────────────────────────────────────────
        enqueue("phase", { phase: "ai", message: "KI erstellt Site-Report..." });

        const typeOverview = [...byType.entries()]
          .map(([type, pages]) => {
            const noT = pages.filter((p) => !p.title).length;
            const noH = pages.filter((p) => !p.h1).length;
            const noM = pages.filter((p) => !p.metaDescription).length;
            const noI = pages.filter((p) => p.noindex).length;
            const broken = pages.filter((p) => !p.ok).length;
            const lines = [
              `${type} (${pages.length} Seiten)`,
              noT > 0 ? `  - Kein Title: ${noT}/${pages.length}` : null,
              noH > 0 ? `  - Kein H1: ${noH}/${pages.length}` : null,
              noM > 0 ? `  - Keine Meta Description: ${noM}/${pages.length}` : null,
              noI > 0 ? `  - Noindex gesetzt: ${noI}/${pages.length}` : null,
              broken > 0 ? `  - Nicht erreichbar: ${broken}/${pages.length}` : null,
              `  - Beispiel: ${pages[0].url}`,
            ].filter(Boolean);
            return lines.join("\n");
          })
          .join("\n\n");

        const formatUrls = (pages: PageData[], limit = 4) => {
          const shown = pages.slice(0, limit).map((p) => `    • ${p.url}`);
          const more = pages.length > limit ? `    ... und ${pages.length - limit} weitere` : null;
          return [...shown, ...(more ? [more] : [])].join("\n");
        };

        const issueCount = [
          dupTitles.length > 0,
          dupMetas.length > 0,
          missingTitle.length > 0,
          missingH1.length > 0,
          missingMeta.length > 0,
          noindexPages.length > 0,
          brokenPages.length > 0,
          totalAltMissing > 0,
        ].filter(Boolean).length;

        const prompt = `Du bist ein professioneller Website-Auditor der Agenturen hilft, Berichte für ihre Kunden zu erstellen.

Website: ${targetUrl}
Gesamt analysierte Seiten: ${allPages.length} (${reachable.length} erreichbar, ${brokenPages.length} defekt, ${timeoutPages.length} Timeout)
Plan-Limit: ${maxPages} Seiten

SEITENTYPEN-ANALYSE:
${typeOverview}

AGGREGIERTE PROBLEME (site-weit):

1. Doppelte Title-Tags (${dupTitles.length} Duplikat-Gruppen, betrifft ${dupTitles.reduce((s, [, p]) => s + p.length, 0)} Seiten):
${
  dupTitles.length > 0
    ? dupTitles
        .slice(0, 4)
        .map(([title, pages]) => `   "${title.slice(0, 70)}" → ${pages.length} Seiten\n${formatUrls(pages, 2)}`)
        .join("\n")
    : "   Keine Duplikate"
}

2. Doppelte Meta Descriptions (${dupMetas.length} Duplikat-Gruppen):
${
  dupMetas.length > 0
    ? dupMetas
        .slice(0, 4)
        .map(([meta, pages]) => `   "${meta.slice(0, 70)}" → ${pages.length} Seiten`)
        .join("\n")
    : "   Keine Duplikate"
}

3. Fehlende Title-Tags: ${missingTitle.length} Seiten
${missingTitle.length > 0 ? formatUrls(missingTitle) : "   Alle Seiten haben einen Title — gut!"}

4. Fehlende H1-Überschriften: ${missingH1.length} Seiten
${missingH1.length > 0 ? formatUrls(missingH1) : "   Alle Seiten haben H1 — gut!"}

5. Fehlende Meta Descriptions: ${missingMeta.length} Seiten
${missingMeta.length > 0 ? formatUrls(missingMeta) : "   Alle Seiten haben Meta Description — gut!"}

6. Ungewollte Noindex-Seiten: ${noindexPages.length} Seiten
${noindexPages.length > 0 ? formatUrls(noindexPages) : "   Keine Noindex-Probleme"}

7. Defekte Seiten (4xx/5xx): ${brokenPages.length}
${brokenPages.length > 0 ? brokenPages.slice(0, 5).map((p) => `   ${p.url} → Status ${p.status}`).join("\n") : "   Keine defekten Seiten — gut!"}

8. Fehlende Alt-Texte: ${totalAltMissing} Bilder ohne Alt-Text auf ${pagesWithAltIssues} Seiten (${totalImages} Bilder gesamt)

Erstelle einen vollständigen Site-Audit-Report auf Deutsch:

## Zusammenfassung
3-4 Sätze: Gesamtzustand der Website (${allPages.length} Seiten analysiert). Was sind die wichtigsten Erkenntnisse und der dringendste Handlungsbedarf?

## Kritische Probleme (site-weit)
Für jedes Problem das auf mehreren Seiten auftritt (nach Schwere sortiert):
**[🔴 KRITISCH / 🟡 WICHTIG / 🟢 GUT]** Titel des Problems
Beschreibung: Erkläre das Problem kurz und verständlich.
Ausmaß: Wie viele Seiten/Prozent betroffen?
Auswirkung: SEO-Verlust / Haftungsrisiko / Nutzererfahrung

## Seitentyp-Bewertung
Kurze Bewertung der ${byType.size} gefundenen Seitentypen — wo liegt der größte Handlungsbedarf?

## Top ${Math.min(5, issueCount + 1)} Handlungsempfehlungen (nach Priorität)
1. [Konkrete Maßnahme — direkt umsetzbar]
2. ...
3. ...

Schreib professionell aber verständlich. Dieser Report wird von einer Agentur direkt an den Kunden weitergegeben.`;

        const message = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2200,
          messages: [{ role: "user", content: prompt }],
        });
        const diagnose =
          message.content[0].type === "text" ? message.content[0].text : "(Keine Diagnose)";

        // ── Save to DB ────────────────────────────────────────────────────
        let scanId: string | null = null;
        try {
          const sql = neon(process.env.DATABASE_URL!);
          await sql`ALTER TABLE scans ADD COLUMN IF NOT EXISTS total_pages INTEGER`;
          const rows = await sql`
            INSERT INTO scans (user_id, url, type, issue_count, result, total_pages)
            VALUES (${session.user!.id}, ${targetUrl}, 'fullsite', ${issueCount}, ${diagnose}, ${allPages.length})
            RETURNING id
          `;
          scanId = (rows[0]?.id as string) ?? null;
        } catch {
          /* DB save optional */
        }

        enqueue("complete", {
          scanId,
          issueCount,
          totalPages: allPages.length,
          diagnose,
        });
        controller.close();
      } catch (err) {
        console.error("Full-scan error:", err);
        try {
          controller.enqueue(
            sseEvent("error", { message: "Scan fehlgeschlagen. Bitte erneut versuchen." })
          );
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
