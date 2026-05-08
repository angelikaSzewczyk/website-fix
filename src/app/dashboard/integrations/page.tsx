/**
 * /dashboard/integrations — Server-Wrapper.
 *
 * Layout-Wrapper (./layout.tsx) checkt Pro+-Gate. Diese Page liest den
 * frischen Plan aus der DB und reicht ihn an die Client-Component, die
 * dann die Hybrid-Tier-Logik rendert:
 *   - Pro+    → Slack-Alerts freigeschaltet
 *   - Pro     → Workflow-API-Cards mit Lock (Agency Scale upgraden)
 *   - Agency  → alle Cards freigeschaltet
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import IntegrationsClient from "./integrations-client";

export default async function IntegrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as { plan: string | null }[];
  const plan = rows[0]?.plan ?? null;

  return <IntegrationsClient plan={plan} />;
}
