import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import Link from "next/link";
import type { Metadata } from "next";
import MonitoringClient from "./monitoring-client";
import { normalizePlan } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Automatisches Monitoring — WebsiteFix",
  robots: { index: false },
};

export type ScheduledScan = {
  id: string;
  url: string;
  type: string;
  frequency: string;
  active: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  notify_email: boolean;
  created_at: string;
  last_issue_count: number | null;
};

export default async function MonitoringPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (normalizePlan(plan) === null) redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);

  const schedules = (await sql`
    SELECT
      ss.id::text,
      ss.url,
      ss.type,
      ss.frequency,
      ss.active,
      ss.next_run_at,
      ss.last_run_at,
      ss.notify_email,
      ss.created_at,
      s.issue_count AS last_issue_count
    FROM scheduled_scans ss
    LEFT JOIN LATERAL (
      SELECT issue_count FROM scans
      WHERE url = ss.url AND user_id = ss.user_id
      ORDER BY created_at DESC LIMIT 1
    ) s ON true
    WHERE ss.user_id = ${session.user.id}
    ORDER BY ss.created_at DESC
  `) as ScheduledScan[];

  return <MonitoringClient schedules={schedules} />;
}
