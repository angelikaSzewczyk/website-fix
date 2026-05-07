/**
 * GET /api/plugin/download/[file]
 *
 * FTP-Fallback-Variante des Haupt-/api/plugin/download-Endpoints. Liefert
 * eine einzelne Datei aus private-assets/plugin/ mit derselben Auth-Logik
 * (Login + bezahlter Plan).
 *
 * Whitelist statt freier Filename-Übergabe — verhindert Path-Traversal
 * (`../../etc/passwd` etc.).
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPaidPlan } from "@/lib/plans";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

const ALLOWED: Record<string, { fileName: string; mime: string; download: string }> = {
  "php": {
    fileName: "website-exzellenz-connector.php",
    mime:     "application/x-httpd-php",
    download: "website-exzellenz-connector.php",
  },
  "readme": {
    fileName: "readme.txt",
    mime:     "text/plain; charset=utf-8",
    download: "readme.txt",
  },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const entry = ALLOWED[file];
  if (!entry) {
    return NextResponse.json({ ok: false, error: "unknown_file" }, { status: 404 });
  }

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
        ok: false, error: "paid_plan_required",
        hint: "Das Plugin ist ab Starter (29 €/Monat) inklusive.",
        upgrade_url: "/fuer-agenturen#pricing",
      },
      { status: 403 },
    );
  }

  const filePath = path.join(process.cwd(), "private-assets", "plugin", entry.fileName);

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch {
    return NextResponse.json({ ok: false, error: "asset_missing" }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":        entry.mime,
      "Content-Disposition": `attachment; filename="${entry.download}"`,
      "Content-Length":      String(buffer.length),
      "Cache-Control":       "private, max-age=0, must-revalidate",
    },
  });
}
