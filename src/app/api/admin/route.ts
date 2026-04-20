/**
 * /api/admin — protected admin endpoint.
 * GET  → returns all dashboard stats
 * POST → mutations: add_credits | rescan
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { PLAN_MRR, PLAN_KEYS } from "@/lib/plans";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) return null;
  return session;
}

// ── Audit helper — schreibt in admin_audit_log + console ─────────────────────
async function auditLog(
  action: string,
  adminEmail: string,
  targetUserId: string | null,
  detail: Record<string, unknown>,
) {
  console.info(`[ADMIN AUDIT] ${adminEmail} → ${action}`, detail);
  try {
    const auditSql = neon(process.env.DATABASE_URL!);
    await auditSql`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id             SERIAL PRIMARY KEY,
        action         TEXT NOT NULL,
        admin_email    TEXT NOT NULL,
        target_user_id TEXT,
        detail         JSONB,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await auditSql`
      INSERT INTO admin_audit_log (action, admin_email, target_user_id, detail)
      VALUES (${action}, ${adminEmail}, ${targetUserId}, ${JSON.stringify(detail)})
    `;
  } catch (err) {
    console.error("[ADMIN AUDIT] DB write failed:", err);
  }
}

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
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const adminEmail = session.user?.email ?? "unknown";

  const body = await req.json() as {
    action: "add_credits" | "change_plan" | "rescan" | "reset_rate_limit" | "list_rate_limits";
    userId?: string;
    credits?: number;
    plan?: string;
    url?: string;
    ip?: string;
  };

  const sql = neon(process.env.DATABASE_URL!);

  // ── change_plan ───────────────────────────────────────────────────────────
  if (body.action === "change_plan") {
    if (!body.userId || !body.plan) {
      return NextResponse.json({ error: "userId and plan required" }, { status: 400 });
    }
    if (!PLAN_KEYS.includes(body.plan as never)) {
      return NextResponse.json({ error: `Invalid plan key: ${body.plan}` }, { status: 400 });
    }
    // Fetch previous plan for audit
    const prev = await sql`SELECT plan FROM users WHERE id::text = ${body.userId} LIMIT 1`;
    const prevPlan = prev[0]?.plan ?? "unknown";
    await sql`UPDATE users SET plan = ${body.plan} WHERE id::text = ${body.userId}`;
    await auditLog("change_plan", adminEmail, body.userId, { from: prevPlan, to: body.plan });
    return NextResponse.json({ ok: true });
  }

  // ── add_credits ───────────────────────────────────────────────────────────
  if (body.action === "add_credits") {
    if (!body.userId || body.credits == null) {
      return NextResponse.json({ error: "userId and credits required" }, { status: 400 });
    }
    await sql`
      UPDATE users
      SET bonus_scans = COALESCE(bonus_scans, 0) + ${body.credits}
      WHERE id::text = ${body.userId}
    `;
    await auditLog("add_credits", adminEmail, body.userId, { credits: body.credits });
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

  // ── list_rate_limits — alle IP-Einträge anzeigen ─────────────────────────
  if (body.action === "list_rate_limits") {
    const rows = await sql`
      SELECT ip_hash, first_scan_at::text, last_scan_at::text, scan_count
      FROM free_scan_limits
      ORDER BY last_scan_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ ok: true, rows });
  }

  // ── reset_rate_limit — einzelne IP oder alle zurücksetzen ─────────────────
  if (body.action === "reset_rate_limit") {
    if (body.ip) {
      // Einzelnen Eintrag per IP-Hash-Präfix oder exakten Hash löschen
      await sql`
        DELETE FROM free_scan_limits
        WHERE ip_hash = ${body.ip}
      `;
      return NextResponse.json({ ok: true, deleted: "one" });
    }
    // Alle löschen (nur wenn kein ip übergeben)
    const result = await sql`DELETE FROM free_scan_limits`;
    return NextResponse.json({ ok: true, deleted: "all", count: result.length ?? 0 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
