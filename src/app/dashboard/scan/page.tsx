import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import DashboardScanClient from "./dashboard-scan-client";

export default async function DashboardScanPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "free";

  // Fetch the active project URL (most recent scan URL for this user)
  let projectUrl: string | null = null;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT url FROM scans
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC LIMIT 1
    ` as { url: string }[];
    if (rows[0]?.url) projectUrl = rows[0].url;
  } catch { /* non-critical */ }

  return (
    <DashboardScanClient
      userName={session.user.name?.split(" ")[0] ?? ""}
      plan={plan}
      projectUrl={projectUrl}
    />
  );
}
