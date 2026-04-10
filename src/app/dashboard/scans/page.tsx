import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import ScansClient from "./scans-client";

export const metadata: Metadata = {
  title: "Berichte — WebsiteFix",
  robots: { index: false },
};

const SCAN_LIMIT = 3;

export default async function ScansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? "User";

  let scans: { id: string; url: string; created_at: string; issue_count: number | null }[] = [];
  let monthlyScans = 0;

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const [scanRows, countRow] = await Promise.all([
      sql`
        SELECT id::text, url, created_at::text, issue_count
        FROM scans
        WHERE user_id = ${session.user.id}
        ORDER BY created_at DESC
        LIMIT 20
      ` as Promise<typeof scans>,
      sql`
        SELECT COUNT(*)::int AS cnt
        FROM scans
        WHERE user_id = ${session.user.id}
          AND created_at >= date_trunc('month', NOW())
      ` as Promise<{ cnt: number }[]>,
    ]);

    scans = scanRows;
    monthlyScans = countRow[0]?.cnt ?? 0;
  } catch { /* non-critical */ }

  return (
    <ScansClient
      firstName={firstName}
      monthlyScans={monthlyScans}
      scanLimit={SCAN_LIMIT}
      scans={scans}
    />
  );
}
