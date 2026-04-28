import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAtLeastProfessional } from "@/lib/plans";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * POST /api/integrations/test-webhook
 *
 * Sendet eine simulierte `websitefix.scan_complete` Test-Payload an die
 * eingegebene Webhook-URL und meldet zurück, ob der Endpoint sauber
 * antwortet. Ermöglicht User, ihre Slack/Zapier/Generic-Integration
 * vor dem Speichern zu validieren.
 *
 * Body: { provider: "slack" | "zapier" | "generic", url: string }
 * Response: { ok: boolean, error?: string, status?: number }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: "Nicht eingeloggt" }, { status: 401 });
  }

  const plan = (session.user as { plan?: string }).plan;
  if (!isAtLeastProfessional(plan)) {
    return NextResponse.json({ ok: false, error: "Nur für Professional+ verfügbar" }, { status: 403 });
  }

  let body: { provider?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const provider = String(body.provider ?? "generic");
  const url      = String(body.url ?? "").trim();

  if (!url || !/^https:\/\/.+/i.test(url)) {
    return NextResponse.json({ ok: false, error: "URL muss mit https:// beginnen" }, { status: 400 });
  }

  // Provider-spezifisches Test-Payload-Format.
  // Slack erwartet `text` + optional `blocks` für reichhaltige Darstellung.
  // Zapier/Generic bekommen das echte websitefix.scan_complete-Schema mit
  // `test: true`-Flag, damit der Empfänger es als Test erkennen kann.
  const slackPayload = {
    text: "🧪 *Test-Ping von WebsiteFix* — Deine Slack-Integration ist verbunden.",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🧪 Test-Ping von WebsiteFix*\nDeine Slack-Integration ist verbunden — du erhältst hier künftig Scan-Zusammenfassungen und Monitoring-Alerts.",
        },
      },
    ],
  };

  const genericPayload = {
    event:     "websitefix.scan_complete",
    test:      true,
    timestamp: new Date().toISOString(),
    scan: {
      id:           "test-scan-id",
      url:          "https://example.com",
      score:        87,
      issue_count:  4,
      red_count:    1,
      yellow_count: 3,
    },
    technology: {
      is_wordpress:    true,
      is_woocommerce:  false,
      builder:         "Elementor",
      full_fingerprint: null,
    },
    woo_audit:     null,
    builder_audit: { maxDomDepth: 14, googleFontFamilies: ["Inter"], cssBloatHints: [], stylesheetCount: 6 },
  };

  const payload = provider === "slack" ? slackPayload : genericPayload;

  // 5s-Timeout via AbortController — verhindert dass Test-Button minutenlang
  // hängt wenn die URL DNS-resolved, aber nichts antwortet.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({
        ok:     false,
        error:  `Webhook-Endpoint antwortete mit HTTP ${res.status}`,
        status: res.status,
      });
    }

    return NextResponse.json({ ok: true, status: res.status });
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error
      ? (err.name === "AbortError" ? "Timeout nach 5 Sekunden" : err.message)
      : "Unbekannter Fehler";
    return NextResponse.json({ ok: false, error: `URL nicht erreichbar — ${msg}` });
  }
}
