/**
 * POST /api/integrations/issue-to-slack
 *
 * Postet einen einzelnen Issue aus dem Dashboard-Bericht in den Slack-Channel
 * der konfigurierten Webhook-URL des Users. Pro+-Feature — Schicht-1-Gate
 * (Plan-aus-Session) und Schicht-2-Gate (Webhook nur des Users).
 *
 * Body: { title, body, severity, count?, scanUrl, scanId? }
 * Response: { ok: true } | { ok: false, error: string }  (502 wenn Slack ablehnt)
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isAtLeastProfessional } from "@/lib/plans";
import { getIntegrationSettings } from "@/lib/integrations";
import { postIssueToSlack } from "@/lib/slack";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) {
    return NextResponse.json({ error: "Professional- oder Agency-Plan erforderlich" }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as {
    title?:    string;
    body?:     string;
    severity?: "red" | "yellow" | "green";
    count?:    number | null;
    scanUrl?:  string;
    scanId?:   string | null;
  } | null;

  if (!body?.title || !body?.body || !body?.scanUrl) {
    return NextResponse.json({ error: "title, body und scanUrl sind Pflicht" }, { status: 400 });
  }
  const sev = body.severity ?? "yellow";
  if (sev !== "red" && sev !== "yellow" && sev !== "green") {
    return NextResponse.json({ error: "Ungültige severity" }, { status: 400 });
  }

  // Settings sind session-gegated über getIntegrationSettings(userId).
  // Webhook-URL gehört dem User, nicht dem Anfragenden — Cross-User-Posting
  // ist damit ausgeschlossen.
  const settings = await getIntegrationSettings(session.user.id as string);
  if (!settings.slack_webhook_url) {
    return NextResponse.json({ ok: false, error: "Kein Slack-Webhook konfiguriert" }, { status: 409 });
  }

  const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://website-fix.com";

  const result = await postIssueToSlack({
    webhookUrl:   settings.slack_webhook_url,
    severity:     sev,
    title:        body.title.slice(0, 240),
    body:         body.body,
    count:        body.count ?? null,
    projectUrl:   body.scanUrl,
    scanId:       body.scanId ?? null,
    dashboardUrl,
  });

  if (!result.ok) {
    // 502 = Bad Gateway — wir sind erreichbar, aber der Slack-Hook lehnt ab.
    return NextResponse.json({ ok: false, error: result.error ?? "Slack-Fehler" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
