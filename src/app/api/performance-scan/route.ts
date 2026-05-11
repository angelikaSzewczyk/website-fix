import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { guardRequest } from "@/lib/scan-guard";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { MODELS } from "@/lib/ai-models";
import { checkIpRateLimitPsi } from "@/lib/ip-rate-limit";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type LighthouseCategory = { score: number | null };
type LighthouseAudit = {
  score: number | null;
  displayValue?: string;
  title: string;
  /** Roher Wert eines Lighthouse-Audits — bei Byte-Savings-Audits sind das Bytes. */
  numericValue?: number;
  /** Einheit des numericValue: "byte" für Speicher-Audits, "millisecond" für Time-Audits, etc. */
  numericUnit?: string;
  details?: { overallSavingsBytes?: number; overallSavingsMs?: number };
};

/** Lighthouse-Audit-IDs, die echte Byte-Savings liefern (Reduce/Defer/Eliminate). */
const BYTE_SAVING_AUDITS = new Set([
  "unused-css-rules",
  "unused-javascript",
  "render-blocking-resources",
  "unminified-css",
  "unminified-javascript",
  "modern-image-formats",
  "uses-optimized-images",
  "uses-text-compression",
  "uses-responsive-images",
  "efficient-animated-content",
  "duplicated-javascript",
  "legacy-javascript",
]);

/** Extrahiert KB-Ersparnis aus einem Lighthouse-Audit, falls vorhanden. */
function extractKbSavings(audit: LighthouseAudit): number | null {
  const bytes = audit.details?.overallSavingsBytes
    ?? (audit.numericUnit === "byte" ? audit.numericValue : undefined);
  if (typeof bytes !== "number" || bytes <= 0) return null;
  return Math.round(bytes / 1024);
}

export async function POST(req: NextRequest) {
  const guard = guardRequest(req);
  if (guard.blocked) {
    return NextResponse.json({ success: false, error: guard.reason }, { status: 403 });
  }

  const { url, strategy = "mobile", mode } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ success: false, error: "Bitte gib eine gültige URL ein." }, { status: 400 });
  }
  const device = strategy === "desktop" ? "desktop" : "mobile";
  // "anon" mode: Anon-User auf /scan/results — eigenes Rate-Limit, kein
  // KI-Diagnose-Text (Token sparen), schlankes JSON.
  const anonMode = mode === "anon";

  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

  // Anon-Rate-Limit nur für nicht-eingeloggte User. Eingeloggte kommen am
  // Limit vorbei (sie haben ein Abo-Kontingent über andere Quellen).
  const sessionPre = await auth().catch(() => null);
  if (!sessionPre?.user?.id) {
    const ip = (req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "0.0.0.0").trim();
    const rl = await checkIpRateLimitPsi(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: rl.reason ?? "Rate-Limit erreicht.", errorCode: rl.errorCode },
        { status: rl.errorCode === "RATE_LIMITED" ? 429 : 400 },
      );
    }
  }

  try {
    // PageSpeed Insights API
    const apiKey = process.env.PAGESPEED_API_KEY ?? "";
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${device}&category=performance&category=accessibility&category=seo&category=best-practices${apiKey ? `&key=${apiKey}` : ""}`;

    const res = await fetch(apiUrl, { next: { revalidate: 0 } });
    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json({ success: false, error: "Google PageSpeed API Rate-Limit erreicht. Bitte warte 1–2 Minuten und versuche es erneut." }, { status: 429 });
      }
      throw new Error(`PageSpeed API Fehler: ${res.status}`);
    }
    const data = await res.json();

    const cats = data.lighthouseResult?.categories as Record<string, LighthouseCategory> | undefined;
    const audits = data.lighthouseResult?.audits as Record<string, LighthouseAudit> | undefined;

    const scores = {
      performance: Math.round((cats?.performance?.score ?? 0) * 100),
      accessibility: Math.round((cats?.accessibility?.score ?? 0) * 100),
      seo: Math.round((cats?.seo?.score ?? 0) * 100),
      bestPractices: Math.round((cats?.["best-practices"]?.score ?? 0) * 100),
    };

    const vitals = {
      lcp: audits?.["largest-contentful-paint"]?.displayValue ?? "—",
      cls: audits?.["cumulative-layout-shift"]?.displayValue ?? "—",
      tbt: audits?.["total-blocking-time"]?.displayValue ?? "—",
      fcp: audits?.["first-contentful-paint"]?.displayValue ?? "—",
      si:  audits?.["speed-index"]?.displayValue ?? "—",
      lcpScore: audits?.["largest-contentful-paint"]?.score ?? null,
      clsScore: audits?.["cumulative-layout-shift"]?.score ?? null,
    };

    // Top Optimierungsmöglichkeiten — inkl. konkreter KB-Ersparnis bei
    // Byte-Saving-Audits (Unused CSS/JS, Bilder, Text-Compression).
    // PSI liefert details.overallSavingsBytes, das wir auf KB runden und
    // direkt im Dashboard anzeigen — sehr viel überzeugender als generische
    // Lighthouse-displayValue-Strings.
    const auditsWithIds = Object.entries(audits ?? {}) as [string, LighthouseAudit][];
    const opportunities = auditsWithIds
      .filter(([, a]) => a.score !== null && a.score < 0.9 && a.displayValue)
      .sort((a, b) => (a[1].score ?? 1) - (b[1].score ?? 1))
      .slice(0, 6)
      .map(([id, a]) => ({
        id,
        title: a.title,
        displayValue: a.displayValue,
        score: a.score,
        kbSavings: BYTE_SAVING_AUDITS.has(id) ? extractKbSavings(a) : null,
      }));

    // Anon-Mode (Button auf /scan/results): keine KI-Diagnose, kein
    // Persistieren — schlankes JSON für die 4 Scores + 3 Vitals. Spart
    // Tokens + Latenz. TBT als Lab-Proxy für INP (Lighthouse liefert
    // keine echten INP-Lab-Werte; echtes INP käme aus dem CrUX-Field-Data).
    if (anonMode) {
      const tbtScore = (audits?.["total-blocking-time"]?.score ?? null) as number | null;
      return NextResponse.json({
        success: true,
        url: targetUrl,
        scores: {
          performance:   scores.performance,
          accessibility: scores.accessibility,
          bestPractices: scores.bestPractices,
          seo:           scores.seo,
        },
        vitals: {
          lcp:      vitals.lcp,
          cls:      vitals.cls,
          tbt:      vitals.tbt,
          lcpScore: vitals.lcpScore,
          clsScore: vitals.clsScore,
          tbtScore: tbtScore,
        },
      });
    }

    // KI-Diagnose
    const prompt = `Du bist ein freundlicher Website-Performance-Experte.

Website: ${targetUrl}

Google PageSpeed Insights Ergebnisse (Mobile):
- Performance Score: ${scores.performance}/100
- Accessibility Score: ${scores.accessibility}/100
- SEO Score: ${scores.seo}/100
- Best Practices: ${scores.bestPractices}/100

Core Web Vitals:
- LCP (Ladezeit Hauptinhalt): ${vitals.lcp}
- CLS (Layout-Verschiebung): ${vitals.cls}
- TBT (Blockierzeit): ${vitals.tbt}
- FCP (Erster Inhalt): ${vitals.fcp}
- Speed Index: ${vitals.si}

Top Probleme:
${opportunities.map((o) => `- ${o.title}: ${o.displayValue}`).join("\n")}

Erstelle eine klare Diagnose auf Deutsch:

## Zusammenfassung
2-3 Sätze: Gesamtzustand der Performance. Ist die Seite schnell genug für Google und Nutzer?

## Bewertung

**[🔴/🟡/🟢]** Performance (${scores.performance}/100)
Kurze Erklärung was das bedeutet.

**[🔴/🟡/🟢]** Core Web Vitals
LCP und CLS sind die wichtigsten Google-Ranking-Faktoren.

**[🔴/🟡/🟢]** SEO-Score (${scores.seo}/100)
Was Google über die technische SEO denkt.

## Die 3 wichtigsten Verbesserungen
1. ...
2. ...
3. ...

Schreib einfach und verständlich, keine Fachbegriffe ohne Erklärung.`;

    const message = await client.messages.create({
      model: MODELS.SCAN,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const diagnose = message.content[0].type === "text" ? message.content[0].text : "";

    // Speichern
    try {
      const session = await auth();
      if (session?.user?.id) {
        const sql = neon(process.env.DATABASE_URL!);
        const issueCount = [scores.performance < 50, scores.seo < 80, vitals.lcpScore !== null && vitals.lcpScore < 0.5].filter(Boolean).length;
        await sql`
          INSERT INTO scans (user_id, url, type, issue_count, result)
          VALUES (${session.user.id}, ${targetUrl}, 'performance', ${issueCount}, ${diagnose})
        `;
      }
    } catch { /* optional */ }

    return NextResponse.json({ success: true, url: targetUrl, scores, vitals, opportunities, diagnose });

  } catch (err) {
    console.error("Performance-Scan-Fehler:", err);
    return NextResponse.json({ success: false, error: "Scan fehlgeschlagen. Bitte versuche es erneut." }, { status: 500 });
  }
}
