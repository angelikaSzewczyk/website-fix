/**
 * /dashboard/integrations layout — Plan-Gate für Pro+ only.
 *
 * Die existing page.tsx ist "use client" mit useState — kann selbst keinen
 * server-seitigen Auth-Check machen. Dieser Layout-Wrapper holt den Plan
 * frisch aus der DB und routet Starter (oder NULL-Plan) auf das Dashboard
 * zurück, bevor die Client-Page überhaupt mountet.
 *
 * Versprechen-Begründung: Pricing-Card "Workflow-API: Jira, Trello, Asana,
 * Zapier" ist ein Agency-Feature (technisch ab Pro freigegeben — Slack-Alerts,
 * GA4, GSC können auch Pro-User nutzen). Starter-Card sagt explizit "Keine
 * Workflow-Integration · Pro startet ab 89 €/Mo" → Page muss gesperrt sein.
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import { isAtLeastProfessional } from "@/lib/plans";
import type { ReactNode } from "react";

export default async function IntegrationsLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as { plan: string | null }[];
  const plan = rows[0]?.plan ?? null;

  if (!isAtLeastProfessional(plan)) {
    redirect("/dashboard?upgrade=integrations");
  }

  return <>{children}</>;
}
