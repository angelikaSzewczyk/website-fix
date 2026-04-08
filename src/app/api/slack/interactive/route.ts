import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { neon } from "@neondatabase/serverless";
import type { ButtonContext, AlertType } from "@/lib/slack";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── Slack signature verification ────────────────────────────────────────────

async function verifySignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) return true; // allow in local dev without secret

  const ts  = req.headers.get("x-slack-request-timestamp");
  const sig = req.headers.get("x-slack-signature");
  if (!ts || !sig) return false;

  // Replay attack guard — reject requests older than 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(ts)) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const signed    = await crypto.subtle.sign("HMAC", key, enc.encode(`v0:${ts}:${rawBody}`));
  const computed  = "v0=" + Buffer.from(signed).toString("hex");

  return computed === sig;
}

// ─── Slack thread reply helper ────────────────────────────────────────────────

async function postThread(channelId: string, threadTs: string, text: string): Promise<void> {
  const botToken = process.env.SLACK_BOT_TOKEN!;
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${botToken}` },
    body: JSON.stringify({ channel: channelId, thread_ts: threadTs, text }),
  });
}

// ─── Handler: KI-Lösungsvorschlag ────────────────────────────────────────────

const AI_PROMPT_BY_TYPE: Record<AlertType, string> = {
  website_down: "Die Website antwortet nicht mehr. Analysiere mögliche Ursachen und gib konkrete Sofortmaßnahmen.",
  ssl_expiring: "Das SSL-Zertifikat läuft bald ab. Erkläre wie man es erneuert — für Let's Encrypt, cPanel und manuelle Setups.",
  security_issue: "Es wurde ein Sicherheitsproblem erkannt. Analysiere die Gefahr und beschreibe die Absicherung Schritt für Schritt.",
  performance_drop: "Die Website-Performance ist eingebrochen. Analysiere wahrscheinliche Ursachen und nenne konkrete Optimierungsmaßnahmen.",
  wcag_violation: "Es wurde ein Barrierefreiheits-Verstoß (WCAG 2.1) erkannt. Beschreibe die Behebung mit konkretem Code.",
};

async function logActivity(ctx: ButtonContext, actionType: string, detail: string, jiraKey?: string) {
  if (!ctx.uid) return;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO activity_log (user_id, action_type, project_name, project_url, alert_type, detail, jira_key)
      VALUES (${ctx.uid}, ${actionType}, ${ctx.name}, ${ctx.url}, ${ctx.type}, ${detail}, ${jiraKey ?? null})
    `;
  } catch (err) {
    console.error("activity_log insert error:", err);
  }
}

async function handleAiSuggest(ctx: ButtonContext, channelId: string, threadTs: string): Promise<void> {
  await postThread(channelId, threadTs, "🤖 _KI analysiert das Problem..._");

  const client = new Anthropic();
  const typePrompt = AI_PROMPT_BY_TYPE[ctx.type];

  const msg = await client.messages.create({
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
    channelId,
    threadTs,
    `*🤖 KI-Lösungsvorschlag für ${ctx.name}*\n\n${suggestion}\n\n_Generiert von WebsiteFix AI · <${ctx.dash}|Dashboard öffnen>_`,
  );

  await logActivity(ctx, "ai_suggest", `KI-Lösung für ${ctx.name} generiert (${ALERT_LABEL[ctx.type]})`);
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
  const host    = process.env.JIRA_HOST;        // e.g. mycompany.atlassian.net
  const email   = process.env.JIRA_EMAIL;       // jira user email
  const token   = process.env.JIRA_API_TOKEN;   // API token from id.atlassian.com
  const project = process.env.JIRA_PROJECT_KEY; // e.g. WEB

  if (!host || !email || !token || !project) {
    await postThread(
      channelId, threadTs,
      "❌ Jira ist nicht konfiguriert. Bitte `JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN` und `JIRA_PROJECT_KEY` in Vercel eintragen.",
    );
    return;
  }

  const label    = ALERT_LABEL[ctx.type];
  const priority = JIRA_PRIORITY[ctx.type];
  let issueType  = JIRA_ISSUE_TYPE[ctx.type];

  const body = {
    fields: {
      project:     { key: project },
      summary:     `[WebsiteFix] ${label}: ${ctx.name}`,
      description: {
        type: "doc", version: 1,
        content: [{
          type: "paragraph",
          content: [{ type: "text", text: [
            `Automatisch erkannt von WebsiteFix Monitoring.`,
            ``,
            `Website: ${ctx.url}`,
            `Problem: ${ctx.desc}`,
            ``,
            `Dashboard: ${ctx.dash}`,
          ].join("\n") }],
        }],
      },
      issuetype: { name: issueType },
      priority:  { name: priority },
      labels:    ["websitefix", "monitoring", ctx.type.replace("_", "-")],
    },
  };

  const res = await fetch(`https://${host}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
    },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const issue = await res.json() as { key: string; id: string };
    await postThread(
      channelId, threadTs,
      `✅ *Jira Ticket erstellt:* <https://${host}/browse/${issue.key}|${issue.key}>\n${label} · ${ctx.name} · Priorität: ${priority}`,
    );
    await logActivity(ctx, "jira_create", `Jira Ticket ${issue.key} erstellt: ${label} — ${ctx.name}`, issue.key);
  } else {
    // Jira may reject issueType names that don't exist in the project — retry with Bug
    if (res.status === 400 && issueType !== "Bug") {
      issueType = "Bug";
      body.fields.issuetype = { name: "Bug" };
      const retry = await fetch(`https://${host}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
        },
        body: JSON.stringify(body),
      });
      if (retry.ok) {
        const issue = await retry.json() as { key: string };
        await postThread(channelId, threadTs, `✅ *Jira Ticket erstellt:* <https://${host}/browse/${issue.key}|${issue.key}> · ${label}: ${ctx.name}`);
        await logActivity(ctx, "jira_create", `Jira Ticket ${issue.key} erstellt: ${label} — ${ctx.name}`, issue.key);
        return;
      }
    }
    const errText = await res.text().catch(() => String(res.status));
    console.error("Jira error:", errText);
    await postThread(channelId, threadTs, `❌ Jira Ticket konnte nicht erstellt werden (HTTP ${res.status}). Bitte manuell anlegen.`);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const valid = await verifySignature(req, rawBody);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  // Slack sends payload as URL-encoded form data
  const params     = new URLSearchParams(rawBody);
  const payloadRaw = params.get("payload");
  if (!payloadRaw) return NextResponse.json({ error: "No payload" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slackPayload: any = JSON.parse(payloadRaw);
  const action = slackPayload.actions?.[0];
  if (!action) return new NextResponse(null, { status: 200 });

  const channelId = slackPayload.channel?.id as string | undefined;
  const threadTs  = slackPayload.message?.ts as string | undefined;

  if (!channelId || !threadTs || !process.env.SLACK_BOT_TOKEN) {
    // Fallback: use response_url (works without bot token, replaces original message)
    const responseUrl = slackPayload.response_url as string | undefined;
    if (responseUrl) {
      await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "⚠️ Thread-Antworten benötigen `SLACK_BOT_TOKEN` und `SLACK_CHANNEL_ID` — bitte in Vercel konfigurieren.",
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

  // Acknowledge Slack immediately — must respond within 3 seconds.
  // Node.js event loop stays alive while the background promises are pending.
  if (action.action_id === "ai_suggest") {
    handleAiSuggest(ctx, channelId, threadTs).catch(err =>
      console.error("ai_suggest error:", err)
    );
  } else if (action.action_id === "jira_create") {
    handleJiraCreate(ctx, channelId, threadTs).catch(err =>
      console.error("jira_create error:", err)
    );
  }

  return new NextResponse(null, { status: 200 });
}
