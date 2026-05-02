import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import { getPlanQuota } from "@/lib/plans";
import DashboardScanClient from "./dashboard-scan-client";

export default async function DashboardScanPage({
  searchParams,
}: {
  searchParams?: Promise<{ websiteId?: string; url?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  const sp   = (await searchParams) ?? {};

  // Single-Source aus PLAN_QUOTAS (lib/plans.ts) — Starter:5, Pro:25, Agency:100.
  const scanLimit = getPlanQuota(plan).monthlyScans;

  // ── projectUrl-Resolver mit klarer Priorität ────────────────────────────
  // 1. ?websiteId=X (vom NewClientForm-Redirect): lade die Site direkt aus
  //    saved_websites — robust gegen URL-Encoding-Edge-Cases.
  // 2. ?url=Y (Fallback wenn keine ID): nutze die URL direkt aus dem Param.
  // 3. Letzter Scan: nur wenn keiner der beiden Params da ist (Direkt-Aufruf
  //    von /dashboard/scan ohne Kontext) — dann zeige den zuletzt gescannten
  //    als "aktives Projekt".
  //
  // Vorher (Bug): Schritt 3 lief IMMER, deshalb zeigte der Header nach
  //               einem Insert-Redirect den vorherigen Kunden statt des
  //               neu angelegten.
  let projectUrl: string | null = null;
  let monthlyScans = 0;

  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (sp.websiteId) {
      const rows = await sql`
        SELECT url FROM saved_websites
        WHERE id = ${sp.websiteId}::uuid AND user_id = ${session.user.id}
        LIMIT 1
      ` as Array<{ url: string }>;
      if (rows[0]?.url) projectUrl = rows[0].url;
    }

    if (!projectUrl && sp.url) {
      // Defensive Sanitization — query-param kommt aus der URL, könnte
      // theoretisch tampered sein. http(s) erzwingen + Länge begrenzen.
      const raw = sp.url.trim().slice(0, 2048);
      if (/^https?:\/\//i.test(raw)) projectUrl = raw;
    }

    if (!projectUrl) {
      const urlRows = await sql`
        SELECT url FROM scans
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC LIMIT 1
      ` as Array<{ url: string }>;
      if (urlRows[0]?.url) projectUrl = urlRows[0].url;
    }

    const countRows = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM scans
      WHERE user_id = ${session.user.id}
        AND created_at >= date_trunc('month', NOW())
    ` as Array<{ cnt: number }>;
    monthlyScans = countRows[0]?.cnt ?? 0;
  } catch { /* non-critical */ }

  return (
    <DashboardScanClient
      userName={session.user.name?.split(" ")[0] ?? ""}
      plan={plan}
      projectUrl={projectUrl}
      monthlyScans={monthlyScans}
      scanLimit={scanLimit}
    />
  );
}
