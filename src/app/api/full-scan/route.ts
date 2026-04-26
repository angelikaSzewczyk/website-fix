import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isUrlAllowed, guardRequest, isRealWebsiteContent } from "@/lib/scan-guard";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { callWithRetry } from "@/lib/ai-retry";
import { getCachedFullScan, saveFullScan, cacheTtlHours } from "@/lib/scan-cache";
import { logScan } from "@/lib/scan-logger";
import { MODELS } from "@/lib/ai-models";
import { normalizePlan, isAgency } from "@/lib/plans";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SKIP_EXT = /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|woff2|ttf|eot|otf)(\?|$)/i;

// ── Plan limits ─────────────────────────────────────────────────────────────
function getMaxPages(plan: string): number {
  const p = normalizePlan(plan);
  if (p === "agency")       return 150;
  if (p === "professional") return 25;
  if (p === "starter")      return 15;
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
  // Origin + UA guard (mirrors /api/scan)
  const guard = guardRequest(req);
  if (guard.blocked) return new Response("Ungültige Anfrage.", { status: 403 });

  const rawUrl      = req.nextUrl.searchParams.get("url");
  const forceRefresh = req.nextUrl.searchParams.get("forceRefresh") === "true";
  if (!rawUrl) return new Response("Missing url parameter", { status: 400 });

  // Max URL length check
  if (rawUrl.length > 2000) return new Response("URL zu lang.", { status: 400 });

  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

  if (!isUrlAllowed(targetUrl)) {
    return new Response("Diese URL kann nicht gescannt werden.", { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Nicht angemeldet", { status: 401 });
  }

  const plan = ((session.user as Record<string, unknown>).plan as string | undefined) ?? "starter";
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

      const fsStart = Date.now();
      try {
        // ── Full-result cache check (skip entire BFS + AI if hit) ─────────
        if (!forceRefresh) {
          const ttl    = cacheTtlHours(plan);
          const cached = await getCachedFullScan(targetUrl, ttl);
          if (cached) {
            const { cachedAt, ...payload } = cached;
            logScan({ userId: session.user!.id, url: targetUrl, scanType: "fullsite", status: "cached", fromCache: true });
            enqueue("complete", { ...payload, fromCache: true, cachedAt });
            controller.close();
            return;
          }
        }

        // ── Pre-Check: Ist die Seite überhaupt erreichbar? ────────────────
        enqueue("phase", { phase: "checking", message: "Prüfe Erreichbarkeit der Website..." });
        const preCheck = await fetchWithTimeout(targetUrl, 8000);
        if (!preCheck) {
          enqueue("error", { message: "Website konnte nicht erreicht werden – bitte prüfe die URL." });
          controller.close();
          return;
        }
        let preHtml = "";
        try { preHtml = await preCheck.text(); } catch { preHtml = ""; }
        if (!isRealWebsiteContent(preCheck, preHtml, host)) {
          enqueue("error", { message: "Website konnte nicht erreicht werden – bitte prüfe die URL." });
          controller.close();
          return;
        }

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

        // Token-optimised helpers: paths only, max 2 examples per issue
        const host0 = (() => { try { return new URL(targetUrl).host; } catch { return targetUrl; } })();
        const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u.replace(/^https?:\/\/[^/]+/, "") || "/"; } };

        const typeOverview = [...byType.entries()]
          .slice(0, 8) // cap at 8 types to bound token growth
          .map(([type, pages]) => {
            const issues = [
              pages.filter((p) => !p.title).length   > 0 ? `noTitle:${pages.filter(p=>!p.title).length}`   : null,
              pages.filter((p) => !p.h1).length      > 0 ? `noH1:${pages.filter(p=>!p.h1).length}`         : null,
              pages.filter((p) => !p.metaDescription).length > 0 ? `noMeta:${pages.filter(p=>!p.metaDescription).length}` : null,
              pages.filter((p) => p.noindex).length  > 0 ? `noindex:${pages.filter(p=>p.noindex).length}`  : null,
              pages.filter((p) => !p.ok).length      > 0 ? `down:${pages.filter(p=>!p.ok).length}`         : null,
            ].filter(Boolean).join(" ");
            return `${type}(${pages.length}): ${issues || "ok"} | ex:${toPath(pages[0].url)}`;
          })
          .join("\n");

        // 2 paths max per issue list — full URLs waste tokens
        const fmtPaths = (pages: PageData[], limit = 2) =>
          pages.slice(0, limit).map(p => toPath(p.url)).join(", ") +
          (pages.length > limit ? ` +${pages.length - limit}` : "");

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

        // Token-optimised prompt — ~2000 input tokens instead of ~3500
        const prompt = `Site-Audit: ${host0} | ${allPages.length} Seiten (${reachable.length} ok, ${brokenPages.length} defekt, ${timeoutPages.length} timeout)

SEITENTYPEN:
${typeOverview}

PROBLEME:
dupTitles:${dupTitles.length}(${dupTitles.slice(0,2).map(([t,p])=>`"${t.slice(0,40)}"x${p.length}`).join(";")})
dupMetas:${dupMetas.length}
noTitle:${missingTitle.length}(${fmtPaths(missingTitle)})
noH1:${missingH1.length}(${fmtPaths(missingH1)})
noMeta:${missingMeta.length}(${fmtPaths(missingMeta)})
noindex:${noindexPages.length}(${fmtPaths(noindexPages)})
broken:${brokenPages.length}(${brokenPages.slice(0,3).map(p=>`${toPath(p.url)}→${p.status}`).join(",")})
altMissing:${totalAltMissing}/${totalImages} Bilder auf ${pagesWithAltIssues} Seiten

Erstelle vollständigen Site-Audit auf Deutsch für Agentur-Kundenbericht:
## Zusammenfassung (3-4 Sätze, Gesamtzustand, wichtigste Erkenntnisse)
## Kritische Probleme (nach Schwere: **[🔴 KRITISCH/🟡 WICHTIG/🟢 GUT]** Titel — Beschreibung — Ausmaß — Auswirkung)
## Seitentyp-Bewertung (${byType.size} Typen, wo größter Handlungsbedarf?)
## Top ${Math.min(5, issueCount + 1)} Handlungsempfehlungen`;

        // Use cache if available, otherwise call Claude with retry
        const message = await callWithRetry(() =>
          client.messages.create({
            model: MODELS.SCAN,
            max_tokens: 2200,
            messages: [{ role: "user", content: prompt }],
          })
        );
        const diagnose = message.content[0].type === "text" ? message.content[0].text : "(Keine Diagnose)";

        // ── Save to DB (fire-and-forget) ──────────────────────────────────
        let scanId: string | null = null;
        const sql = neon(process.env.DATABASE_URL!);
        scanId = crypto.randomUUID();
        sql`ALTER TABLE scans ADD COLUMN IF NOT EXISTS total_pages INTEGER`.catch(() => null);
        sql`
          INSERT INTO scans (user_id, url, type, issue_count, result, total_pages)
          VALUES (${session.user!.id}, ${targetUrl}, 'fullsite', ${issueCount}, ${diagnose}, ${allPages.length})
        `.catch(() => null);

        // ── Persist full result to cache (skips entire BFS on next hit) ───
        await saveFullScan(targetUrl, { totalPages: allPages.length, issueCount, diagnose, scanId });

        logScan({ userId: session.user!.id, url: targetUrl, scanType: "fullsite", status: "success", durationMs: Date.now() - fsStart });
        enqueue("complete", {
          scanId,
          issueCount,
          totalPages: allPages.length,
          diagnose,
        });

        // ── Sonnet Expert-Fix (agency plans only) ─────────────────────────
        // Runs AFTER the complete event so the UI can render immediately.
        // Sends a second SSE event with before/after code fixes for top issues.
        if (isAgency(plan) && issueCount > 0 && !abortSignal?.aborted) {
          try {
            enqueue("phase", { phase: "expert", message: "KI-Experte erstellt Code-Fixes…" });

            // Build a focused list of top issues for the expert prompt
            const topIssues: string[] = [];
            if (dupTitles.length > 0)   topIssues.push(`Doppelte Title-Tags auf ${dupTitles.reduce((s,[,p])=>s+p.length,0)} Seiten`);
            if (missingH1.length > 0)   topIssues.push(`Fehlende H1-Überschriften auf ${missingH1.length} Seiten (${fmtPaths(missingH1)})`);
            if (totalAltMissing > 0)    topIssues.push(`${totalAltMissing} Bilder ohne Alt-Text (BFSG-kritisch)`);
            if (brokenPages.length > 0) topIssues.push(`${brokenPages.length} defekte Seiten: ${brokenPages.slice(0,3).map(p=>`${toPath(p.url)}→${p.status}`).join(", ")}`);
            if (missingMeta.length > 0) topIssues.push(`Fehlende Meta Descriptions auf ${missingMeta.length} Seiten`);

            const expertPrompt = `Du bist ein Senior Web-Entwickler. Erstelle für jedes der folgenden Probleme auf ${host0} einen konkreten Code-Fix mit Vorher/Nachher-Beispiel (HTML/CSS/JS, max 8 Zeilen je Block).

Probleme (${topIssues.length}):
${topIssues.slice(0, 3).map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

Format für jedes Problem:
### [Problemtitel]
**Warum:** Ein Satz Erklärung.
**Vorher:**
\`\`\`html
[fehlerhafter Code]
\`\`\`
**Nachher:**
\`\`\`html
[korrigierter Code]
\`\`\`

Sei präzise. Kein Intro, kein Outro.`;

            const expertMsg = await callWithRetry(() =>
              client.messages.create({
                model: MODELS.EXPERT,
                max_tokens: 900,
                messages: [{ role: "user", content: expertPrompt }],
              })
            );
            const expertFixes = expertMsg.content[0].type === "text" ? expertMsg.content[0].text : "";
            enqueue("expert_fixes", { fixes: expertFixes });
          } catch {
            /* expert fix is non-critical — never fail the whole scan */
          }
        }

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
