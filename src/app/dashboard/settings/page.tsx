import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import SettingsClient from "./settings-client";
import FreeSettingsClient from "./free-settings-client";

export const metadata: Metadata = {
  title: "Einstellungen — WebsiteFix",
  robots: { index: false },
};

const SCAN_LIMIT = 3;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "free";

  // ── Agency plans → existing white-label settings ──────────────────────────
  if (plan === "agency-pro") {
    const sql = neon(process.env.DATABASE_URL!);
    const [row] = await sql`
      SELECT agency_name, logo_url, primary_color
      FROM agency_settings
      WHERE user_id = ${session.user.id}
      LIMIT 1
    ` as { agency_name: string | null; logo_url: string | null; primary_color: string | null }[];

    return <SettingsClient initial={{
      agency_name:   row?.agency_name   ?? "",
      logo_url:      row?.logo_url      ?? "",
      primary_color: row?.primary_color ?? "#8df3d3",
    }} />;
  }

  // ── Free / single plans → new settings page ───────────────────────────────
  const sql = neon(process.env.DATABASE_URL!);

  const [projectRows, countRow] = await Promise.all([
    sql`
      SELECT url FROM scans
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC LIMIT 1
    ` as unknown as Promise<{ url: string }[]>,
    sql`
      SELECT COUNT(*)::int AS cnt FROM scans
      WHERE user_id = ${session.user.id}
        AND created_at >= date_trunc('month', NOW())
    ` as unknown as Promise<{ cnt: number }[]>,
  ]);

  return (
    <FreeSettingsClient
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
      plan={plan}
      projectUrl={projectRows[0]?.url ?? ""}
      monthlyScans={countRow[0]?.cnt ?? 0}
      scanLimit={SCAN_LIMIT}
    />
  );
}
