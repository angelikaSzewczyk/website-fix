/**
 * /dashboard/lead-generator — Wachstums-Maschine.
 *
 * Konsolidiert die früheren /widget-config + /leads + /lead-generator-Mockup
 * Pages in EINEN Hub. Linke Spalte: Widget-Snippet (zum Einbauen auf der
 * Agentur-Site). Rechte Spalte: Leads-Liste mit Lead-to-Client-Button.
 *
 * Lead-to-Client (Server-Action in actions.ts): überführt einen widget_lead
 * mit einem Klick als is_customer_project=TRUE in saved_websites — ohne
 * erneute manuelle URL-Eingabe.
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import { isAgency } from "@/lib/plans";
import LeadGeneratorHub, { type Lead } from "./lead-generator-hub";

export const metadata: Metadata = {
  title: "Lead-Generator — WebsiteFix",
  robots: { index: false },
};

export default async function LeadGeneratorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isAgency(plan)) redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);

  const [leadsRaw, statsRowRaw] = await Promise.all([
    sql`
      SELECT id::text, visitor_email, scanned_url, score, status, created_at::text, pdf_downloaded_at::text
      FROM widget_leads
      WHERE agency_user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 500
    `,
    sql`
      SELECT
        COUNT(*)::int                                                                AS total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int        AS last_30,
        COUNT(*) FILTER (WHERE status = 'converted')::int                            AS converted
      FROM widget_leads
      WHERE agency_user_id = ${session.user.id}
    `,
  ]);

  const leads    = leadsRaw   as unknown as Lead[];
  const statsRow = statsRowRaw as unknown as Array<{ total: number; last_30: number; converted: number }>;
  const stats    = statsRow[0] ?? { total: 0, last_30: 0, converted: 0 };

  const agencyId   = session.user.id;
  const embedUrl   = `${process.env.NEXTAUTH_URL ?? "https://website-fix.com"}/widget/${agencyId}`;
  const embedSnippet = `<iframe
  src="${embedUrl}"
  width="460"
  height="520"
  frameborder="0"
  style="border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.3)"
  title="Kostenloser Website-Check"
></iframe>`;

  return (
    <LeadGeneratorHub
      initialLeads={leads}
      embedSnippet={embedSnippet}
      embedUrl={embedUrl}
      stats={stats}
      agencyId={String(agencyId)}
    />
  );
}
