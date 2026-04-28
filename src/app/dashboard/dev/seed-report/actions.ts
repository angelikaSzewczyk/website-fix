"use server";

import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { redirect } from "next/navigation";

export type SeedResult = {
  ok:       boolean;
  error?:   string;
  websiteId?: string;
  checks?:  number;
  logs?:    number;
  scans?:   number;
  skipped?: boolean;
};

/** Admin-Gate für Server Actions.
 *
 *  WICHTIG: Page-Level-Gate (redirect in page.tsx) reicht NICHT, weil
 *  Server Actions in Next.js eigene Endpoints mit eigenen URL-Hashes sind.
 *  Ein authentifizierter Nicht-Admin-User könnte den Action-Hash aus dem
 *  Build-Bundle reverse-engineeren und die Action direkt POSTen, OHNE die
 *  Page zu rendern. Daher MUSS jede sensitive Action den Admin-Check
 *  selbst durchführen.
 *
 *  Returns true wenn der aktuelle User der Admin ist, sonst false.
 */
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return false; // Fail-closed wenn ENV fehlt
  return session?.user?.email === adminEmail;
}

export async function seedReportData(): Promise<SeedResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Nicht eingeloggt." };
  if (!(await isAdmin())) return { ok: false, error: "Nicht autorisiert." };

  const userId = Number(session.user.id);
  const sql    = neon(process.env.DATABASE_URL!);

  const SITE_URL  = "https://mueller-soehne-sanitaer.de";
  const SITE_NAME = "Müller & Söhne Sanitär";

  // ── Guard: skip if already seeded ──────────────────────────────────────────
  const [existing] = await sql`
    SELECT id::text FROM saved_websites
    WHERE url = ${SITE_URL} AND user_id = ${userId} LIMIT 1
  ` as { id: string }[];

  if (existing) {
    return { ok: true, skipped: true, websiteId: existing.id };
  }

  // ── 1. Website ──────────────────────────────────────────────────────────────
  const [site] = await sql`
    INSERT INTO saved_websites (user_id, url, name, last_check_at, last_check_status)
    VALUES (${userId}, ${SITE_URL}, ${SITE_NAME}, NOW() - interval '2 hours', 'ok')
    RETURNING id::text
  ` as { id: string }[];

  const websiteId = site.id;

  // ── 2. website_checks — 50 Einträge via generate_series ────────────────────
  // 48 ok + 2 fehler, Response-Zeiten 200–1200ms, über 30 Tage verteilt
  await sql`
    INSERT INTO website_checks
      (website_id, user_id, is_online, response_time_ms,
       ssl_valid, ssl_days_left, security_score, http_status, alerts, checked_at)
    SELECT
      ${websiteId}::uuid,
      ${userId},
      -- 2 Ausfälle bei Check 18 und 35 (0-basiert)
      (n NOT IN (18, 35)),
      -- Response-Zeit: bei Ausfällen null, sonst 200–1200ms
      CASE WHEN n IN (18, 35) THEN NULL
           ELSE (200 + floor(random() * 1000))::int END,
      true,
      -- SSL läuft in ~90 Tagen ab
      90,
      82,
      CASE WHEN n IN (18, 35) THEN NULL ELSE 200 END,
      CASE WHEN n IN (18, 35)
           THEN '[{"level":"critical","message":"Website nicht erreichbar"}]'::jsonb
           ELSE '[]'::jsonb END,
      -- Gleichmäßig über 30 Tage verteilt (alle ~14,4h ein Check)
      NOW() - ((29 - floor(n * 29.0 / 49)) || ' days')::interval
             - ((n * 7) % 24 || ' hours')::interval
    FROM generate_series(0, 49) AS n
  `;

  // ── 3. activity_logs ────────────────────────────────────────────────────────
  type LogEntry = { event_type: string; metadata: object; days_ago: number };

  const logs: LogEntry[] = [
    // ai_fix_generated
    {
      event_type: "ai_fix_generated",
      metadata:   { fix_type: "wcag", issue_label: "Kontrastverhältnis im Header optimiert" },
      days_ago: 25,
    },
    {
      event_type: "ai_fix_generated",
      metadata:   { fix_type: "wcag", issue_label: "Alt-Tags für Produktbilder ergänzt" },
      days_ago: 14,
    },
    // jira_ticket_created
    {
      event_type: "jira_ticket_created",
      metadata:   { jira_key: "WEB-42", issue_label: "PHP-Update auf 8.2 erforderlich" },
      days_ago: 22,
    },
    {
      event_type: "jira_ticket_created",
      metadata:   { jira_key: "WEB-43", issue_label: "SSL-Zertifikat manuell erneuert" },
      days_ago: 8,
    },
    // alert_sent
    {
      event_type: "alert_sent",
      metadata:   { alert_type: "slow_response", message: "Server-Response über 2000ms erkannt" },
      days_ago: 18,
    },
    // scan_completed
    {
      event_type: "scan_completed",
      metadata:   { scan_type: "wcag", issues_found: "7" },
      days_ago: 20,
    },
    {
      event_type: "scan_completed",
      metadata:   { scan_type: "performance", issues_found: "3" },
      days_ago: 10,
    },
  ];

  for (const log of logs) {
    await sql`
      INSERT INTO activity_logs (client_id, agency_id, event_type, metadata, created_at)
      VALUES (
        ${websiteId}::uuid,
        ${userId},
        ${log.event_type},
        ${JSON.stringify(log.metadata)}::jsonb,
        NOW() - ${log.days_ago + " days"}::interval
      )
    `;
  }

  // ── 4. scans ────────────────────────────────────────────────────────────────
  type ScanEntry = { type: string; issue_count: number; days_ago: number };

  const scanEntries: ScanEntry[] = [
    { type: "wcag",        issue_count: 7,  days_ago: 20 },
    { type: "performance", issue_count: 3,  days_ago: 10 },
    { type: "website",     issue_count: 2,  days_ago: 5  },
  ];

  for (const scan of scanEntries) {
    await sql`
      INSERT INTO scans (url, user_id, type, issue_count, created_at)
      VALUES (
        ${SITE_URL},
        ${userId},
        ${scan.type},
        ${scan.issue_count},
        NOW() - ${scan.days_ago + " days"}::interval
      )
    `;
  }

  return {
    ok:       true,
    websiteId,
    checks:   50,
    logs:     logs.length,
    scans:    scanEntries.length,
  };
}

export async function deleteSeedData(): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };
  if (!(await isAdmin())) return { ok: false };

  const userId = Number(session.user.id);
  const sql    = neon(process.env.DATABASE_URL!);
  const SITE_URL = "https://mueller-soehne-sanitaer.de";

  const [site] = await sql`
    SELECT id::text FROM saved_websites
    WHERE url = ${SITE_URL} AND user_id = ${userId} LIMIT 1
  ` as { id: string }[];

  if (!site) return { ok: true };

  await sql`DELETE FROM activity_logs  WHERE client_id = ${site.id}::uuid AND agency_id = ${userId}`;
  await sql`DELETE FROM website_checks WHERE website_id = ${site.id}::uuid AND user_id   = ${userId}`;
  await sql`DELETE FROM scans          WHERE url = ${SITE_URL}             AND user_id   = ${userId}`;
  await sql`DELETE FROM saved_websites WHERE id  = ${site.id}::uuid        AND user_id   = ${userId}`;

  redirect("/dashboard");
}
