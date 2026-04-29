import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isAtLeastProfessional } from "@/lib/plans";
import { getIntegrationSettings, exportTask, type TaskExportPayload, type ExportProvider } from "@/lib/integrations";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) {
    return NextResponse.json({ error: "Professional- oder Agency-Plan erforderlich" }, { status: 403 });
  }

  const body = await req.json() as {
    title:       string;
    description: string;
    priority?:   "red" | "yellow" | "green";
    url:         string;
    scanId?:     string;
    source?:     TaskExportPayload["source"];
    meta?:       Record<string, unknown>;
    preferred?:  ExportProvider;  // jira | trello | zapier | asana
  };

  if (!body.title || !body.description || !body.url) {
    return NextResponse.json({ error: "title, description und url sind Pflicht" }, { status: 400 });
  }

  const settings = await getIntegrationSettings(session.user.id as string);
  const result = await exportTask(
    settings,
    {
      title:       body.title.slice(0, 240),
      description: body.description.slice(0, 4000),
      priority:    body.priority ?? "yellow",
      url:         body.url,
      scanId:      body.scanId,
      source:      body.source ?? "manual",
      meta:        body.meta,
    },
    body.preferred,
  );

  return NextResponse.json(result);
}
