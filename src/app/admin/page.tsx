import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import AdminClient from "./admin-client";

export const metadata: Metadata = {
  title: "Command Center — WebsiteFix Admin",
  robots: { index: false, follow: false },
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "angelika.szewczyk87@gmail.com";

const PLAN_MRR: Record<string, number> = {
  free: 0, pro: 19, freelancer: 19,
  agentur: 49, agency_core: 79, agency_scale: 149,
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  created_at: string;
  bonus_scans: number;
  scan_count: number;
};

export type ScanLogRow = {
  id: string;
  url: string;
  scan_type: string;
  status: "success" | "cached" | "error";
  error_msg: string | null;
  from_cache: boolean;
  duration_ms: number | null;
  created_at: string;
  user_email: string | null;
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    redirect("/login");
  }

  const sql = neon(process.env.DATABASE_URL!);

  const [kpiRows, scanCounts, growth, users, cacheStats, widgetStats, scanLogs] =
    await Promise.all([
      // Plan distribution
      sql`SELECT plan, COUNT(*)::int AS cnt FROM users GROUP BY plan ORDER BY cnt DESC`,

      // Scan counts
      sql`
        SELECT
          COUNT(*)::int                                                        AS total,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day')::int  AS today,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS week,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::int AS month
        FROM scans
      `,

      // Signup growth last 30 days
      sql`
        SELECT DATE(created_at)::text AS date, COUNT(*)::int AS cnt
        FROM users
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
      `,

      // All users with scan count
      sql`
        SELECT
          u.id::text, u.email, u.name, u.plan,
          u.created_at::text,
          COALESCE(u.bonus_scans, 0)::int AS bonus_scans,
          COUNT(s.id)::int                AS scan_count
        FROM users u
        LEFT JOIN scans s ON s.user_id = u.id
        GROUP BY u.id, u.email, u.name, u.plan, u.created_at, u.bonus_scans
        ORDER BY u.created_at DESC
        LIMIT 500
      `,

      // Cache stats
      sql`
        SELECT
          COUNT(*) FILTER (WHERE url NOT LIKE 'fullsite:%')::int  AS regular,
          COUNT(*) FILTER (WHERE url LIKE 'fullsite:%')::int      AS fullsite
        FROM scan_cache
      `,

      // Widget leads
      sql`SELECT COUNT(*)::int AS total FROM widget_leads`,

      // Scan log — last 50
      sql`
        SELECT
          sl.id::text, sl.url, sl.scan_type, sl.status,
          sl.error_msg, sl.from_cache, sl.duration_ms,
          sl.created_at::text,
          u.email AS user_email
        FROM scan_log sl
        LEFT JOIN users u ON u.id = sl.user_id
        ORDER BY sl.created_at DESC
        LIMIT 50
      `,
    ]);

  // Aggregate KPI
  const planCounts: Record<string, number> = {};
  let totalUsers = 0;
  for (const row of kpiRows) {
    planCounts[row.plan as string] = Number(row.cnt);
    totalUsers += Number(row.cnt);
  }
  const mrr = Object.entries(planCounts).reduce(
    (acc, [plan, cnt]) => acc + (PLAN_MRR[plan] ?? 0) * cnt, 0,
  );

  return (
    <AdminClient
      kpi={{
        totalUsers,
        planCounts,
        mrr,
        scans: scanCounts[0] as Record<string, number>,
      }}
      growth={growth as { date: string; cnt: number }[]}
      users={users as AdminUser[]}
      cache={cacheStats[0] as { regular: number; fullsite: number }}
      widgetLeads={Number((widgetStats[0] as { total: number }).total)}
      scanLogs={scanLogs as ScanLogRow[]}
    />
  );
}
