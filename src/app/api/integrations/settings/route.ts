import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isAtLeastProfessional } from "@/lib/plans";
import { getIntegrationSettings, saveIntegrationSettings, connectionStatus, type IntegrationSettings } from "@/lib/integrations";

// GET: aktuelle Settings + Connection-Status für das UI.
// Tokens werden maskiert zurückgegeben (nur die letzten 4 Zeichen sichtbar),
// damit das Frontend den "verbunden"-Zustand anzeigen kann, ohne Klartext-Secrets.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) {
    return NextResponse.json({ error: "Professional- oder Agency-Plan erforderlich" }, { status: 403 });
  }

  const raw      = await getIntegrationSettings(session.user.id as string);
  const status   = connectionStatus(raw);

  function mask(v: string | null): string | null {
    if (!v) return null;
    if (v.length <= 6) return "••••";
    return "••••" + v.slice(-4);
  }

  // Nicht-geheime Felder (URLs, Projekt-Keys, E-Mail) klar, Secrets maskiert.
  const safe = {
    slack_webhook_url:    raw.slack_webhook_url ? "✓ verbunden" : null,
    zapier_webhook_url:   raw.zapier_webhook_url ? "✓ verbunden" : null,
    asana_webhook_url:    raw.asana_webhook_url ? "✓ verbunden" : null,
    jira_domain:          raw.jira_domain,
    jira_email:           raw.jira_email,
    jira_api_token:       mask(raw.jira_api_token),
    jira_project_key:     raw.jira_project_key,
    trello_api_key:       mask(raw.trello_api_key),
    trello_token:         mask(raw.trello_token),
    trello_list_id:       raw.trello_list_id,
    gsc_site_url:         raw.gsc_site_url,
    gsc_service_account:  raw.gsc_service_account ? "✓ hinterlegt" : null,
    ga_property_id:       raw.ga_property_id,
  };

  return NextResponse.json({ settings: safe, status });
}

// PUT: Settings aktualisieren. Leere Strings werden als "unchanged" interpretiert
// (Benutzer muss Feld explizit mit "clear:true" zurücksetzen — einfacher Weg:
// "" heißt leeren, undefined heißt unverändert).
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) {
    return NextResponse.json({ error: "Professional- oder Agency-Plan erforderlich" }, { status: 403 });
  }

  const body = await req.json() as Partial<IntegrationSettings>;

  // Basic URL-Validation für Webhook-Felder
  const urlFields: Array<keyof IntegrationSettings> = ["slack_webhook_url", "zapier_webhook_url", "asana_webhook_url"];
  for (const key of urlFields) {
    const v = body[key];
    if (v && typeof v === "string" && v.trim() !== "" && !/^https?:\/\//.test(v.trim())) {
      return NextResponse.json({ error: `${key}: muss mit https:// beginnen` }, { status: 400 });
    }
  }
  if (body.jira_domain && !/^[a-z0-9-]+\.atlassian\.net$/i.test(body.jira_domain.trim())) {
    return NextResponse.json({ error: "jira_domain: Format muss 'xxx.atlassian.net' sein" }, { status: 400 });
  }

  // Empty strings → null (explizites Zurücksetzen)
  const patch: Partial<IntegrationSettings> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue;
    (patch as Record<string, string | null>)[k] = typeof v === "string" && v.trim() === "" ? null : String(v).trim();
  }

  await saveIntegrationSettings(session.user.id as string, patch);
  const updated = await getIntegrationSettings(session.user.id as string);
  return NextResponse.json({ ok: true, status: connectionStatus(updated) });
}
