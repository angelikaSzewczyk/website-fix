/**
 * /api/admin — protected admin endpoint.
 * GET  → returns all dashboard stats
 * POST → mutations: add_credits | rescan
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) return null;
  return session;
}

// ── MRR table ─────────────────────────────────────────────────────────────────
const PLAN_MRR: Record<string, number> = {
  free: 0, pro: 19, freelancer: 19,
  agentur: 49, agency_core: 79, agency_scale: 149,
};

// ── GET — full stats ──────────────────────────────────────────────────────────
export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  const [kpi, scanCounts, growth, users, cacheStats, widgetStats, scanLogs] = await Promise.all([
    // KPI: users by plan
    sql`
      SELECT plan, COUNT(*) AS cnt
      FROM users
      GROUP BY plan
    `,

    // Scan counts: today / week / month / total
    sql`
      SELECT
        COUNT(*)                                                      AS total,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day')   AS today,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')  AS week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS month
      FROM scans
    `,

    // Growth: signups per day for last 30 days
    sql`
      SELECT DATE(created_at)::text AS date, COUNT(*) AS cnt
      FROM users
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `,

    // Users with scan counts
    sql`
      SELECT
        u.id::text, u.email, u.name, u.plan,
        u.created_at::text,
        COALESCE(u.bonus_scans, 0) AS bonus_scans,
        COUNT(s.id)::int            AS scan_count
      FROM users u
      LEFT JOIN scans s ON s.user_id = u.id
      GROUP BY u.id, u.email, u.name, u.plan, u.created_at, u.bonus_scans
      ORDER BY u.created_at DESC
      LIMIT 500
    `,

    // Cache stats
    sql`
      SELECT
        COUNT(*) FILTER (WHERE url NOT LIKE 'fullsite:%')  AS regular,
        COUNT(*) FILTER (WHERE url LIKE 'fullsite:%')      AS fullsite
      FROM scan_cache
    `,

    // Widget leads total
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
  for (const row of kpi) {
    planCounts[row.plan as string] = Number(row.cnt);
    totalUsers += Number(row.cnt);
  }

  const mrr = Object.entries(planCounts).reduce(
    (acc, [plan, cnt]) => acc + (PLAN_MRR[plan] ?? 0) * cnt,
    0,
  );

  return NextResponse.json({
    kpi: {
      totalUsers,
      planCounts,
      mrr,
      scans: scanCounts[0],
    },
    growth,
    users,
    cache: cacheStats[0],
    widgetLeads: widgetStats[0]?.total ?? 0,
    scanLogs,
  });
}

// ── POST — mutations ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    action: "add_credits" | "rescan";
    userId?: string;
    credits?: number;
    url?: string;
  };

  const sql = neon(process.env.DATABASE_URL!);

  if (body.action === "add_credits") {
    if (!body.userId || body.credits == null) {
      return NextResponse.json({ error: "userId and credits required" }, { status: 400 });
    }
    await sql`
      UPDATE users
      SET bonus_scans = COALESCE(bonus_scans, 0) + ${body.credits}
      WHERE id::text = ${body.userId}
    `;
    return NextResponse.json({ ok: true });
  }

  if (body.action === "rescan") {
    if (!body.url) return NextResponse.json({ error: "url required" }, { status: 400 });
    const baseUrl = process.env.NEXTAUTH_URL ?? "https://website-fix.com";
    const res = await fetch(`${baseUrl}/api/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-rescan": "1" },
      body: JSON.stringify({ url: body.url, forceRefresh: true }),
    });
    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
