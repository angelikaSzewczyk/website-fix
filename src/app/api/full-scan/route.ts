/**
 * GET /api/full-scan?url=...&forceRefresh=...
 *
 * Server-Sent Events stream over BFS-Crawl + Engine-Audit + AI-Diagnose.
 *
 * Operation Unified Core, Phase B:
 *   - Pro gecrawlter Page wird der WebsiteAuditor aufgerufen → strukturierte
 *     PageAudit mit allen DOM-Befunden + per-page ScanIssues.
 *   - consolidateScans() aggregiert alle PageAudits + SiteContext zu einem
 *     vollständigen ScanResult mit issues_json, scope-Klassifikation,
 *     Site-Wide-Metrics (Avg-TTFB, WCAG-Heuristik).
 *   - DB-INSERT schreibt ALLE 11 Spalten — keine NULL-Felder, leere Objekte
 *     für noch nicht migrierte Audit-Layer (tech_fingerprint, builder_audit,
 *     woo_audit kommen in Phase A2).
 *   - Cache-Schema-Bump (v2): alte v1-Caches werden ignoriert, gen neuer
 *     Cache-Eintrag mit dem ScanResult.
 *
 * Was bewahrt bleibt:
 *   - SSE-Streaming-Logik mit progress/phase/complete/error/expert_fixes
 *   - BFS-Crawl mit Sitemap-Seeding und Batch-Size 5
 *   - Plan-spezifisches maxPages (15/25/150)
 *   - Agency-only Expert-Fix nach dem Haupt-Scan
 *
 * Was wegfällt:
 *   - PageData-Type (ersetzt durch PageAudit aus der Engine)
 *   - Manuelle Aggregation (dupTitles, missingH1, brokenPages — kommt jetzt
 *     aus consolidateScans)
 *   - "Issue-Count via Boolean-Flags zählen" — issueCount = ScanResult.issues.length
 *   - AI-Prompt nutzt strukturierte Issues statt Aggregat-Counts
 */

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
import { WebsiteAuditor } from "@/lib/scan-engine/auditor";
import { consolidateScans } from "@/lib/scan-engine/aggregator";
import { checkSslCert } from "@/lib/scan-engine/ssl-check";
import type { PageAudit, SiteContext, ScanResult } from "@/lib/scan-engine/types";

export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Skip-Extension-Filter — Bilder, PDFs, Asset-Files werden nie gecrawlt.
const SKIP_EXT = /\.(jpg|jpeg|png|gif|svg|webp|pdf|zip|mp4|mp3|css|js|ico|woff|woff2|ttf|eot|otf)(\?|$)/i;

// ── Plan limits ─────────────────────────────────────────────────────────────
function getMaxPages(plan: string): number {
  const p = normalizePlan(plan);
  if (p === "agency")       return 150;
  if (p === "professional") return 25;
  if (p === "starter")      return 15;
  return 10;
}

// ── Fetch helper mit TTFB-Messung ───────────────────────────────────────────
/** Rohe fetch + TTFB-Messung. TTFB ist hier die Zeit bis Headers da sind
 *  (`fetch()`-resolve), nicht bis erstes Byte des Bodies. Reicht für unsere
 *  Performance-Heuristik — echtes TTFB würde Connection-Hooks brauchen. */
async function fetchWithTtfb(url: string, ms = 7000): Promise<{
  res:    Response | null;
  html:   string;
  ttfbMs: number | null;
}> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { "User-Agent": "WebsiteFix-Scanner/1.0" },
    });
    const ttfbMs = Math.round(performance.now() - t0);
    let html = "";
    try { html = await res.text(); } catch { /* read-error → leeres html */ }
    clearTimeout(t);
    return { res, html, ttfbMs };
  } catch {
    clearTimeout(t);
    return { res: null, html: "", ttfbMs: null };
  }
}

// ── HTML-Helper für Crawl-Steuerung (NICHT für Audit — das macht die Engine) ─

/** Internal-Links extrahieren — nur für die Crawl-Queue. Same-host, Skip-Ext. */
function extractCrawlLinks(html: string, baseUrl: string, host: string): string[] {
  const matches = html.match(/<a[^>]+href=["']([^"']+)["']/gi) ?? [];
  const links = new Set<string>();
  for (const m of matches) {
    const href = m.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) continue;
    try {
      const abs = new URL(href, baseUrl);
      if (abs.host !== host) continue;
      if (SKIP_EXT.test(abs.pathname)) continue;
      abs.hash = "";
      links.add(abs.toString());
    } catch { /* malformed — skip */ }
  }
  return Array.from(links);
}

/** Sitemap-URLs aus XML extrahieren. */
function extractSitemapUrls(xml: string): string[] {
  return (xml.match(/<loc>([^<]+)<\/loc>/g) ?? [])
    .map(m => m.replace(/<\/?loc>/g, "").trim());
}

/** WP-Version aus Generator-Tag. Null wenn nicht WordPress oder versteckt. */
function extractWpVersion(html: string): string | null {
  const m = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress\s+([\d.]+)/i);
  return m ? m[1] : null;
}

// ── SiteContext-Builder (einmal pro Scan, vor consolidateScans aufgerufen) ──

async function buildSiteContext(rootUrl: string, rootHtml: string): Promise<SiteContext> {
  let origin: string;
  try { origin = new URL(rootUrl).origin; } catch { origin = rootUrl; }

  // /robots.txt — Disallow: / für User-agent: *?
  let robotsBlockiertAlles = false;
  try {
    const robotsRes = await fetchWithTtfb(`${origin}/robots.txt`, 3000);
    if (robotsRes.res?.ok && robotsRes.html) {
      // Strikt: User-agent: * gefolgt von Disallow: / am Zeilenende oder vor neuem User-agent
      const generalSection = robotsRes.html.match(/User-agent:\s*\*([\s\S]*?)(?=User-agent:|$)/i);
      if (generalSection) {
        robotsBlockiertAlles = /^\s*Disallow:\s*\/\s*$/im.test(generalSection[1]);
      }
    }
  } catch { /* probe-failure ist non-fatal */ }

  // /sitemap.xml — existiert?
  let sitemapVorhanden = false;
  try {
    const sitemapRes = await fetchWithTtfb(`${origin}/sitemap.xml`, 3000);
    sitemapVorhanden = sitemapRes.res?.ok ?? false;
  } catch { /* probe-failure ist non-fatal */ }

  // ── Phase A3: SSL-Cert-Inspection via tls.connect ──
  // Hartes Timeout 4s (wir wollen keinen blockierten Scan wegen einer
  // hängenden TLS-Verbindung). Failure → null, Aggregator generiert dann
  // kein SSL-Issue. Funktioniert nur für https-URLs.
  let sslExpiresAt: string | null = null;
  try {
    const ssl = await checkSslCert(rootUrl, 4000);
    sslExpiresAt = ssl.expiresAt;
  } catch (err) {
    console.error("[full-scan] SSL-Check failed:", err);
  }

  return {
    rootUrl,
    https:                rootUrl.startsWith("https://"),
    sitemapVorhanden,
    robotsBlockiertAlles,
    wpVersion:            extractWpVersion(rootHtml),
    sslExpiresAt,
  };
}

// ── SSE event helper ────────────────────────────────────────────────────────
const enc = new TextEncoder();
function sseEvent(event: string, data: object): Uint8Array {
  return enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Main GET handler (SSE) ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const guard = guardRequest(req);
  if (guard.blocked) return new Response("Ungültige Anfrage.", { status: 403 });

  const rawUrl       = req.nextUrl.searchParams.get("url");
  const forceRefresh = req.nextUrl.searchParams.get("forceRefresh") === "true";
  if (!rawUrl) return new Response("Missing url parameter", { status: 400 });
  if (rawUrl.length > 2000) return new Response("URL zu lang.", { status: 400 });

  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;
  if (!isUrlAllowed(targetUrl)) {
    return new Response("Diese URL kann nicht gescannt werden.", { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) return new Response("Nicht angemeldet", { status: 401 });

  const plan     = ((session.user as Record<string, unknown>).plan as string | undefined) ?? "starter";
  const maxPages = getMaxPages(plan);

  let host: string;
  try { host = new URL(targetUrl).host; } catch { return new Response("Ungültige URL", { status: 400 }); }

  const abortSignal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      function enqueue(event: string, data: object) {
        try { controller.enqueue(sseEvent(event, data)); }
        catch { /* controller closed */ }
      }

      const fsStart = Date.now();
      try {
        // ── Cache-Hit-Check (v2-Schema; v1 wird automatisch ignoriert) ────
        if (!forceRefresh) {
          const ttl    = cacheTtlHours(plan);
          const cached = await getCachedFullScan(targetUrl, ttl);
          if (cached) {
            logScan({ userId: session.user!.id, url: targetUrl, scanType: "fullsite", status: "cached", fromCache: true });
            enqueue("complete", {
              scanId:             cached.scanId,
              issueCount:         cached.scanResult.issueCount,
              totalPages:         cached.scanResult.totalPages,
              diagnose:           cached.scanResult.diagnose,
              avgTtfbMs:          cached.scanResult.avgTtfbMs,
              wcagHeuristicScore: cached.scanResult.wcagHeuristicScore,
              fromCache:          true,
              cachedAt:           cached.cachedAt,
            });
            controller.close();
            return;
          }
        }

        // ── Pre-Check: ist die Root überhaupt erreichbar? ─────────────────
        enqueue("phase", { phase: "checking", message: "Prüfe Erreichbarkeit der Website..." });
        const preCheck = await fetchWithTtfb(targetUrl, 8000);
        if (!preCheck.res || !isRealWebsiteContent(preCheck.res, preCheck.html, host)) {
          enqueue("error", { message: "Website konnte nicht erreicht werden – bitte prüfe die URL." });
          controller.close();
          return;
        }

        // ── SiteContext bauen (einmal, bevor der Crawl startet) ───────────
        // robots.txt + sitemap.xml + WP-Version. Async, läuft parallel zum
        // ersten Audit-Aufruf gleich danach.
        const siteContextPromise = buildSiteContext(targetUrl, preCheck.html);

        // ── Auditor-Instanz (eine pro Scan) ───────────────────────────────
        const auditor = new WebsiteAuditor({ rootUrl: targetUrl, plan });

        // ── Phase 1: BFS-Crawl mit per-Page Audit ─────────────────────────
        enqueue("phase", { phase: "crawling", message: "Starte Crawl der gesamten Website..." });

        const visited = new Set<string>();
        const normalize = (u: string) => u.replace(/\/$/, "") || `https://${host}`;
        const queue: string[] = [normalize(targetUrl)];
        const allPages: PageAudit[] = [];

        // Root-Page-Audit ZUERST verarbeiten — wir haben das HTML schon vom
        // pre-check, brauchen kein zweites fetch. Garantiert auch, dass
        // pages[0] immer die Root ist (wichtig für SiteContext-Aware-Logik).
        const rootAudit = await auditor.analyze({
          html:    preCheck.html,
          url:     normalize(targetUrl),
          headers: preCheck.res.headers,
          status:  preCheck.res.status,
          ttfbMs:  preCheck.ttfbMs ?? undefined,
        });
        allPages.push(rootAudit);
        visited.add(normalize(targetUrl));

        // Initial-Queue: aus Root-HTML extrahierte Links + Sitemap-URLs.
        const rootLinks = extractCrawlLinks(preCheck.html, targetUrl, host);
        for (const l of rootLinks) {
          const n = normalize(l);
          if (!visited.has(n) && !queue.includes(n)) queue.push(n);
        }

        // Sitemap-Seeding (parallel zum ersten Audit)
        try {
          const sitemapRes = await fetchWithTtfb(`https://${host}/sitemap.xml`, 5000);
          if (sitemapRes.res?.ok && sitemapRes.html) {
            const urls = extractSitemapUrls(sitemapRes.html)
              .filter(u => { try { return !u.endsWith(".xml") && new URL(u).host === host; } catch { return false; } });
            for (const u of urls) {
              const n = normalize(u);
              if (!visited.has(n) && !queue.includes(n)) queue.push(n);
            }
          }
        } catch { /* sitemap optional */ }

        // Queue-Index: Root ist schon visited, also queue.shift() vom ersten Element.
        // BFS mit batch=5: parallel fetchen+auditieren für Crawl-Speed.
        while (queue.length > 0 && visited.size < maxPages) {
          if (abortSignal?.aborted) break;

          const batch = queue.splice(0, 5).filter(u => !visited.has(u));
          if (batch.length === 0) continue;
          batch.forEach(u => visited.add(u));

          const fetched = await Promise.all(batch.map(async (url) => {
            const { res, html, ttfbMs } = await fetchWithTtfb(url, 6000);
            const audit = await auditor.analyze({
              html:    html,
              url:     url,
              headers: res?.headers ?? new Headers(),
              status:  res?.status ?? 0,
              ttfbMs:  ttfbMs ?? undefined,
            });
            const links = res?.ok ? extractCrawlLinks(html, url, host) : [];
            return { audit, links };
          }));

          for (const { audit, links } of fetched) {
            allPages.push(audit);
            for (const l of links) {
              const n = normalize(l);
              if (!visited.has(n) && !queue.includes(n) && visited.size + queue.length < maxPages) {
                queue.push(n);
              }
            }
          }

          enqueue("progress", {
            phase:      "crawling",
            found:      visited.size,
            queued:     queue.length,
            maxPages,
            currentUrl: batch[batch.length - 1],
          });
        }

        // ── Phase 2: SiteContext finalisieren + Aggregator ────────────────
        enqueue("phase", { phase: "analyzing", message: `${allPages.length} Seiten analysiert — konsolidiere Probleme...` });
        const siteContext = await siteContextPromise;

        const scanResult: ScanResult = consolidateScans(allPages, siteContext, {
          rootUrl: targetUrl,
          plan,
          type:    "fullsite",
        });

        // ── Phase 3: AI-Diagnose-Text aus dem strukturierten Scan-Result ──
        // Anders als vorher: wir generieren KEINE Issues mehr aus AI-Text,
        // sondern lassen Claude einen Erklär-Text für die `result`-Spalte
        // schreiben — basierend auf den schon vorhandenen, strukturierten
        // ScanResult.issues. issue_count + issues_json bleiben deterministisch.
        enqueue("phase", { phase: "writing-summary", message: "KI erstellt Bericht..." });

        const reds    = scanResult.issues.filter(i => i.severity === "red");
        const yellows = scanResult.issues.filter(i => i.severity === "yellow");
        const topReds    = reds.slice(0, 6).map(i => `- ${i.title}`).join("\n");
        const topYellows = yellows.slice(0, 4).map(i => `- ${i.title}`).join("\n");

        const prompt = `Site-Audit: ${host} | ${scanResult.totalPages} Seiten analysiert
Probleme: ${reds.length} kritisch · ${yellows.length} Hinweise
Avg-TTFB: ${scanResult.avgTtfbMs ?? "—"}ms · WCAG-Heuristik: ${scanResult.wcagHeuristicScore}/100

KRITISCHE BEFUNDE:
${topReds || "(keine kritischen Befunde)"}

HINWEISE:
${topYellows || "(keine Hinweise)"}

Erstelle Site-Audit-Bericht auf Deutsch (für Agentur-Kundenbericht):
## Zusammenfassung (3-4 Sätze, Gesamtzustand, wichtigste Erkenntnisse)
## Kritische Probleme (top ${Math.min(reds.length, 5)} mit Erklärung der Auswirkung)
## Top ${Math.min(scanResult.issueCount, 5)} Handlungsempfehlungen`;

        let diagnose = "";
        try {
          const message = await callWithRetry(() =>
            client.messages.create({
              model:      MODELS.SCAN,
              max_tokens: 2200,
              messages:   [{ role: "user", content: prompt }],
            })
          );
          diagnose = message.content[0].type === "text" ? message.content[0].text : "";
        } catch {
          // Diagnose-Failure ist non-fatal — issues_json hat die Truth.
          diagnose = `Site-Audit für ${host}: ${scanResult.issueCount} Probleme auf ${scanResult.totalPages} Seiten gefunden. Detail-Befunde im strukturierten Bericht.`;
        }
        scanResult.diagnose = diagnose;

        // ── Phase 4: DB-INSERT mit ALLEN 11 Spalten ───────────────────────
        // Pflicht: kein Feld bleibt NULL. Audit-Layer-Felder, die in Phase A2
        // verkabelt werden, kriegen leere Objekte → kein UI-Crash beim Lesen.
        const scanId = crypto.randomUUID();
        const sql = neon(process.env.DATABASE_URL!);

        // Schema-Ensure einmalig (Idempotent — verhindert Crash auf
        // Instances die vor diesem Refactor angelegt wurden ohne total_pages).
        sql`ALTER TABLE scans ADD COLUMN IF NOT EXISTS total_pages INTEGER`.catch(() => null);

        try {
          // tech_fingerprint MUSS NULL sein wenn nicht verkabelt — KEIN leeres
          // Objekt {}. Frontend hat checks wie `fingerprint && fingerprint.ecommerce.value`,
          // die mit `{}` (truthy aber sub-Felder undefined) crashen würden.
          // Mit NULL greift der falsy-Check sauber → "kein Fingerprint" Pfad.
          // Phase A2 verkabelt buildFingerprintFromRaw und ersetzt das null.
          const fingerprintJson = scanResult.techFingerprint
            ? JSON.stringify(scanResult.techFingerprint)
            : null;

          await sql`
            INSERT INTO scans (
              id, user_id, url, type,
              issue_count, result, issues_json,
              speed_score, tech_fingerprint, total_pages,
              unterseiten_json, meta_json
            )
            VALUES (
              ${scanId},
              ${session.user!.id},
              ${targetUrl},
              ${"fullsite"},
              ${scanResult.issueCount},
              ${diagnose},
              ${JSON.stringify(scanResult.issues)}::jsonb,
              ${scanResult.speedScore},
              ${fingerprintJson}::jsonb,
              ${scanResult.totalPages},
              ${JSON.stringify(scanResult.unterseiten)}::jsonb,
              ${JSON.stringify({
                ...scanResult.meta,
                avg_ttfb_ms:           scanResult.avgTtfbMs,
                wcag_heuristic_score:  scanResult.wcagHeuristicScore,
              })}::jsonb
            )
          `;
        } catch (err) {
          // DB-Failure: scan ist trotzdem in der Cache und SSE — User sieht
          // das Result, aber es ist nicht historisch persistiert. Loggen + weiter.
          console.error("[full-scan] DB INSERT failed:", err);
        }

        // ── Phase 5: Cache speichern (v2-Schema) ──────────────────────────
        await saveFullScan(targetUrl, scanResult, scanId);

        logScan({
          userId:     session.user!.id,
          url:        targetUrl,
          scanType:   "fullsite",
          status:     "success",
          durationMs: Date.now() - fsStart,
        });

        // ── SSE: complete-Event ───────────────────────────────────────────
        // Schickt Legacy-Felder (scanId, issueCount, totalPages, diagnose)
        // PLUS die neuen Site-Wide-Metrics. Frontend kann inkrementell
        // die neuen Felder rendern, alte UIs bleiben funktional.
        enqueue("complete", {
          scanId,
          issueCount:         scanResult.issueCount,
          totalPages:         scanResult.totalPages,
          diagnose,
          avgTtfbMs:          scanResult.avgTtfbMs,
          wcagHeuristicScore: scanResult.wcagHeuristicScore,
        });

        // ── Phase 6: Agency-Expert-Fix (separater SSE-Event) ──────────────
        // Wie bisher — feuert nach dem complete-Event, blockiert die UI nicht.
        if (isAgency(plan) && scanResult.issueCount > 0 && !abortSignal?.aborted) {
          try {
            enqueue("phase", { phase: "expert", message: "KI-Experte erstellt Code-Fixes…" });

            const topIssueTitles = scanResult.issues
              .filter(i => i.severity === "red")
              .slice(0, 3)
              .map(i => i.title);
            if (topIssueTitles.length === 0) {
              // Wenn keine roten — nutze die ersten 3 yellow für Expert-Fix
              topIssueTitles.push(...yellows.slice(0, 3).map(i => i.title));
            }

            const expertPrompt = `Du bist ein Senior Web-Entwickler. Erstelle für jedes der folgenden Probleme auf ${host} einen konkreten Code-Fix mit Vorher/Nachher-Beispiel (HTML/CSS/JS, max 8 Zeilen je Block).

Probleme:
${topIssueTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

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
                model:      MODELS.EXPERT,
                max_tokens: 900,
                messages:   [{ role: "user", content: expertPrompt }],
              })
            );
            const expertFixes = expertMsg.content[0].type === "text" ? expertMsg.content[0].text : "";
            enqueue("expert_fixes", { fixes: expertFixes });
          } catch { /* non-critical */ }
        }

        controller.close();
      } catch (err) {
        console.error("Full-scan error:", err);
        try {
          controller.enqueue(sseEvent("error", { message: "Scan fehlgeschlagen. Bitte erneut versuchen." }));
          controller.close();
        } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":     "text/event-stream",
      "Cache-Control":    "no-cache, no-transform",
      "Connection":       "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
