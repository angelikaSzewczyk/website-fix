/**
 * POST /api/guides/anon-match
 *
 * Liefert die für die übergebenen Scan-Issues passenden Guides — ohne
 * Auth-Pflicht. Wird von /scan/checkout verwendet, damit ein anonymer
 * Besucher die zum gerade durchgeführten Scan passenden 9,90-€-Guides
 * sehen und einzeln kaufen kann.
 *
 * Body: { issues: Array<{ title, body?, category?, severity? }> }
 * Resp: { guides: Array<{ id, title, problem_label, preview, price_cents, estimated_minutes }> }
 *
 * Sicherheits-Logik:
 *  - Pure Read-Only — kein DB-Write, kein Stripe.
 *  - Keine User-Daten werden zurückgegeben (nur die generischen Guide-
 *    Inhalte). Auch ein bösartiger Aufruf liefert nur die Library-Liste.
 *  - Issue-Limit (max 20) verhindert Abuse als Trigger-Mining-Tool.
 */

import { NextRequest, NextResponse } from "next/server";
import { matchGuidesForIssuesAnon } from "@/lib/rescue-guides";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  type Issue = { title?: string; body?: string; category?: string; severity?: string };
  const body = await req.json().catch(() => ({})) as { issues?: Issue[] };

  const issues = (body.issues ?? [])
    .slice(0, 20)
    .filter(i => typeof i?.title === "string" && i.title.length > 0)
    .map(i => ({
      title:    i.title!,
      body:     typeof i.body     === "string" ? i.body     : undefined,
      category: typeof i.category === "string" ? i.category : undefined,
      severity: typeof i.severity === "string" ? i.severity : undefined,
    }));

  if (issues.length === 0) {
    return NextResponse.json({ guides: [] });
  }

  try {
    const matches = await matchGuidesForIssuesAnon(issues);
    return NextResponse.json({
      guides: matches.map(m => ({
        id:                m.guide.id,
        title:             m.guide.title,
        problem_label:     m.guide.problem_label,
        preview:           m.guide.preview,
        price_cents:       m.guide.price_cents,
        estimated_minutes: m.guide.estimated_minutes,
        relevance:         m.relevance,
      })),
    });
  } catch (err) {
    console.error("[guides/anon-match] failed:", err);
    return NextResponse.json({ guides: [] });
  }
}
