import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import type { ButtonContext, AlertType } from "@/lib/slack";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── Slack signature verification ────────────────────────────────────────────

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return true; // skip verification in local dev

  const ts  = req.headers.get("x-slack-request-timestamp");
  const sig = req.headers.get("x-slack-signature");
  if (!ts || !sig) return false;

  if (Math.abs(Date.now() / 1000 - parseInt(ts)) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signed   = await crypto.subtle.sign("HMAC", key, enc.encode(`v0:${ts}:${rawBody}`));
  const computed = "v0=" + Buffer.from(signed).toString("hex");
  return computed === sig;
}

// ─── activity_logs writer ─────────────────────────────────────────────────────

type EventType = "ai_fix_generated" | "jira_ticket_created";

async function writeActivityLog(
  ctx: ButtonContext,
  eventType: EventType,
  metadata: Record<string, unknown>,
): Promise<void> {
  if (!ctx.uid) return;
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Resolve client_id from saved_websites (best-effort, null if not found)
    const [site] = await sql`
      SELECT id FROM saved_websites
      WHERE url = ${ctx.url} AND user_id = ${ctx.uid}
      LIMIT 1
    ` as { id: number }[];

    await sql`
      INSERT INTO activity_logs (agency_id, client_id, event_type, platform, metadata)
      VALUES (
        ${ctx.uid},
        ${site?.id ?? null},
        ${eventType},
        'slack',
        ${JSON.stringify({
          project_name: ctx.name,
          project_url:  ctx.url,
          alert_type:   ctx.type,
          dashboard_url: ctx.dash,
          ...metadata,
        })}
      )
    `;
  } catch (err) {
    console.error("activity_logs insert error:", err);
  }
}

// ─── Thread reply helper ──────────────────────────────────────────────────────

async function postThread(channelId: string, threadTs: string, text: string): Promise<void> {
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({ channel: channelId, thread_ts: threadTs, text }),
  });
}

// ─── Handler: KI-Lösungsvorschlag ────────────────────────────────────────────

const AI_PROMPT_BY_TYPE: Record<AlertType, string> = {
  website_down:     "Die Website antwortet nicht mehr. Analysiere mögliche Ursachen und gib konkrete Sofortmaßnahmen.",
  ssl_expiring:     "Das SSL-Zertifikat läuft bald ab. Erkläre wie man es erneuert — für Let's Encrypt, cPanel und manuelle Setups.",
  security_issue:   "Es wurde ein Sicherheitsproblem erkannt. Analysiere die Gefahr und beschreibe die Absicherung Schritt für Schritt.",
  performance_drop: "Die Website-Performance ist eingebrochen. Analysiere wahrscheinliche Ursachen und nenne konkrete Optimierungsmaßnahmen.",
  wcag_violation:   "Es wurde ein Barrierefreiheits-Verstoß (WCAG 2.1) erkannt. Beschreibe die Behebung mit konkretem Code.",
};

async function handleAiSuggest(ctx: ButtonContext, channelId: string, threadTs: string): Promise<void> {
  await postThread(channelId, threadTs, "🤖 _KI analysiert das Problem..._");

  const anthropic  = new Anthropic();
  const typePrompt = AI_PROMPT_BY_TYPE[ctx.type];

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    messages: [{
      role: "user",
      content: `Du bist ein erfahrener Webentwickler. ${typePrompt}

Website: ${ctx.url}
Erkanntes Problem: ${ctx.desc}

Antworte in diesem Format (Markdown für Slack):
*1. Ursache*
[1-2 präzise Sätze]

*2. Sofortmaßnahme*
[Was jetzt konkret tun]

*3. Code-Snippet* (nur wenn relevant)
\`\`\`
[Code hier]
\`\`\`

*4. Prävention*
[1 Satz für die Zukunft]

Antworte auf Deutsch. Direkt, technisch, kein Fülltext.`,
    }],
  });

  const suggestion = (msg.content[0] as { type: string; text: string }).text;

  await postThread(
    channelId, threadTs,
    `*🤖 KI-Optimierungsvorschlag für ${ctx.name}*\n\n${suggestion}\n\n_Generiert von WebsiteFix AI · <${ctx.dash}|Dashboard öffnen>_`,
  );

  await writeActivityLog(ctx, "ai_fix_generated", {
    fix_summary: suggestion.substring(0, 500),
  });
}

// ─── Handler: Jira Ticket erstellen ──────────────────────────────────────────

const JIRA_PRIORITY: Record<AlertType, string> = {
  website_down:     "Highest",
  ssl_expiring:     "High",
  security_issue:   "High",
  performance_drop: "Medium",
  wcag_violation:   "Medium",
};

const JIRA_ISSUE_TYPE: Record<AlertType, string> = {
  website_down:     "Incident",
  ssl_expiring:     "Task",
  security_issue:   "Bug",
  performance_drop: "Task",
  wcag_violation:   "Bug",
};

const ALERT_LABEL: Record<AlertType, string> = {
  website_down:     "Website nicht erreichbar",
  ssl_expiring:     "SSL-Zertifikat läuft ab",
  security_issue:   "Sicherheitsproblem erkannt",
  performance_drop: "Performance-Einbruch",
  wcag_violation:   "Barrierefreiheit-Verstoß",
};

async function handleJiraCreate(ctx: ButtonContext, channelId: string, threadTs: string): Promise<void> {
  const host    = process.env.JIRA_HOST;
  const email   = process.env.JIRA_EMAIL;
  const token   = process.env.JIRA_API_TOKEN;
  const project = process.env.JIRA_PROJECT_KEY;

  if (!host || !email || !token || !project) {
    await postThread(channelId, threadTs,
      "❌ Jira ist nicht konfiguriert. Bitte `JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN` und `JIRA_PROJECT_KEY` in Vercel eintragen.",
    );
    return;
  }

  const label    = ALERT_LABEL[ctx.type];
  const priority = JIRA_PRIORITY[ctx.type];
  let   issueType = JIRA_ISSUE_TYPE[ctx.type];
  const auth64   = Buffer.from(`${email}:${token}`).toString("base64");

  const buildBody = (type: string) => ({
    fields: {
      project:     { key: project },
      summary:     `[WebsiteFix] ${label}: ${ctx.name}`,
      description: {
        type: "doc", version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text:
          `Automatisch erkannt von WebsiteFix Monitoring.\n\nWebsite: ${ctx.url}\nProblem: ${ctx.desc}\n\nDashboard: ${ctx.dash}`,
        }] }],
      },
      issuetype: { name: type },
      priority:  { name: priority },
      labels:    ["websitefix", "monitoring", ctx.type.replace(/_/g, "-")],
    },
  });

  async function tryCreate(type: string): Promise<{ key: string; id: string } | null> {
    const res = await fetch(`https://${host}/rest/api/3/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth64}` },
      body: JSON.stringify(buildBody(type)),
    });
    if (res.ok) return res.json() as Promise<{ key: string; id: string }>;
    if (res.status === 400 && type !== "Bug") return tryCreate("Bug"); // fallback
    console.error("Jira error:", await res.text().catch(() => res.status));
    return null;
  }

  const issue = await tryCreate(issueType);

  if (issue) {
    const jiraUrl = `https://${host}/browse/${issue.key}`;
    await postThread(channelId, threadTs,
      `✅ *Jira Ticket erstellt:* <${jiraUrl}|${issue.key}>\n${label} · ${ctx.name} · Priorität: ${priority}`,
    );
    await writeActivityLog(ctx, "jira_ticket_created", {
      jira_key:     issue.key,
      jira_url:     jiraUrl,
      jira_id:      issue.id,
      issue_label:  label,
      priority,
    });
  } else {
    await postThread(channelId, threadTs,
      `❌ Jira Ticket konnte nicht erstellt werden. Bitte manuell anlegen.`,
    );
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!await verifySignature(req, rawBody)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params     = new URLSearchParams(rawBody);
  const payloadRaw = params.get("payload");
  if (!payloadRaw) return NextResponse.json({ error: "No payload" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slackPayload: any = JSON.parse(payloadRaw);
  const action     = slackPayload.actions?.[0];
  if (!action) return new NextResponse(null, { status: 200 });

  const channelId = slackPayload.channel?.id as string | undefined;
  const threadTs  = slackPayload.message?.ts  as string | undefined;

  if (!channelId || !threadTs || !process.env.SLACK_BOT_TOKEN) {
    const responseUrl = slackPayload.response_url as string | undefined;
    if (responseUrl) {
      await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "⚠️ Thread-Antworten benötigen `SLACK_BOT_TOKEN` — bitte in Vercel konfigurieren.",
          response_type: "ephemeral",
        }),
      });
    }
    return new NextResponse(null, { status: 200 });
  }

  let ctx: ButtonContext;
  try {
    ctx = JSON.parse(action.value ?? "{}") as ButtonContext;
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  // Acknowledge Slack immediately (< 3s requirement).
  // Background promises keep the Node.js event loop alive on Vercel.
  if (action.action_id === "ai_suggest") {
    handleAiSuggest(ctx, channelId, threadTs).catch(err => console.error("ai_suggest error:", err));
  } else if (action.action_id === "jira_create") {
    handleJiraCreate(ctx, channelId, threadTs).catch(err => console.error("jira_create error:", err));
  }

  return new NextResponse(null, { status: 200 });
}
