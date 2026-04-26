import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import DashboardScanClient from "./dashboard-scan-client";

const SCAN_LIMIT = 3;

export default async function DashboardScanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";

  let projectUrl: string | null = null;
  let monthlyScans = 0;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [urlRows, countRows] = await Promise.all([
      sql`
        SELECT url FROM scans
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC LIMIT 1
      ` as unknown as Promise<{ url: string }[]>,
      sql`
        SELECT COUNT(*)::int AS cnt
        FROM scans
        WHERE user_id = ${session.user.id}
          AND created_at >= date_trunc('month', NOW())
      ` as unknown as Promise<{ cnt: number }[]>,
    ]);
    if (urlRows[0]?.url) projectUrl = urlRows[0].url;
    monthlyScans = countRows[0]?.cnt ?? 0;
  } catch { /* non-critical */ }

  return (
    <DashboardScanClient
      userName={session.user.name?.split(" ")[0] ?? ""}
      plan={plan}
      projectUrl={projectUrl}
      monthlyScans={monthlyScans}
      scanLimit={SCAN_LIMIT}
    />
  );
}
