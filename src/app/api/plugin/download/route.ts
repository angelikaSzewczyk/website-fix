/**
 * GET /api/plugin/download
 *
 * Liefert die Plugin-ZIP nach Auth-Check. Hinter dieser Route liegt das
 * eigentliche WordPress-Plugin — kein direkter Public-Asset-Pfad mehr.
 *
 * Auth-Stufen:
 *   - nicht eingeloggt → 401
 *   - eingeloggt + bezahlter Plan → 200 + ZIP-Stream
 *   - eingeloggt aber Free-Tier → 403 (Pricing-Hinweis im Body)
 *
 * Der Plan-Check ist bewusst non-blocking via isPaidPlan(): das Plugin
 * ist ab Starter inklusive — egal welcher Plan, Hauptsache zahlend.
 *
 * Response-Header setzen ein Content-Disposition mit Filename inkl.
 * Plugin-Version, damit der Browser-Save-Dialog "websitefix-connector-
 * 1.2.1.zip" vorschlägt.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPaidPlan } from "@/lib/plans";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const PLUGIN_VERSION = "1.2.1";
const ZIP_FILENAME   = "websitefix-connector.zip";

export async function GET() {
  const session = await auth();
  const user = session?.user as { plan?: string } | undefined;

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "login_required", hint: "Bitte einloggen, um das Plugin herunterzuladen." },
      { status: 401 },
    );
  }

  if (!isPaidPlan(user.plan)) {
    return NextResponse.json(
      {
        ok: false,
        error: "paid_plan_required",
        hint: "Das Plugin ist ab Starter (29 €/Monat) inklusive. Wähle einen Plan auf /fuer-agenturen#pricing.",
        upgrade_url: "/fuer-agenturen#pricing",
      },
      { status: 403 },
    );
  }

  // Resolve from CWD — outputFileTracingIncludes in next.config.js packt
  // private-assets/plugin/ in den Function-Bundle, sodass der Pfad auch
  // auf Vercel auflöst.
  const filePath = path.join(process.cwd(), "private-assets", "plugin", ZIP_FILENAME);

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch {
    return NextResponse.json(
      { ok: false, error: "asset_missing", hint: "Plugin-Asset nicht gefunden — Support kontaktieren." },
      { status: 500 },
    );
  }

  // Buffer → Uint8Array, weil NextResponse das Node-Buffer-Type nicht
  // direkt akzeptiert (BodyInit-Constraint im Web-Stream-Standard).
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":        "application/zip",
      "Content-Disposition": `attachment; filename="websitefix-connector-${PLUGIN_VERSION}.zip"`,
      "Content-Length":      String(buffer.length),
      "Cache-Control":       "private, max-age=0, must-revalidate",
      "X-Plugin-Version":    PLUGIN_VERSION,
    },
  });
}
