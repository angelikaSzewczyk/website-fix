import { neon } from "@neondatabase/serverless";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import WidgetReportClient from "./widget-report-client";

export const metadata: Metadata = {
  title: "Dein Website-Analyse Report — WebsiteFix",
  robots: { index: false },
};

export default async function WidgetReportPage({
  params,
}: {
  params: { agencyId: string; leadId: string };
}) {
  const { agencyId, leadId } = params;

  const sql = neon(process.env.DATABASE_URL!);

  const [leadRow, brandingRow] = await Promise.all([
    sql`
      SELECT id::text, visitor_email, scanned_url, score, diagnose, created_at::text
      FROM widget_leads
      WHERE id::text = ${leadId}
        AND agency_user_id = ${agencyId}
      LIMIT 1
    `,
    sql`
      SELECT u.name, ag.agency_name, ag.logo_url, ag.primary_color
      FROM users u
      LEFT JOIN agency_settings ag ON ag.user_id = u.id
      WHERE u.id::text = ${agencyId}
      LIMIT 1
    `,
  ]);

  if (!leadRow.length) notFound();

  const lead = leadRow[0] as {
    id: string;
    visitor_email: string;
    scanned_url: string;
    score: number;
    diagnose: string | null;
    created_at: string;
  };
  const branding = brandingRow[0] as {
    name: string;
    agency_name: string | null;
    logo_url: string | null;
    primary_color: string | null;
  } | undefined;

  return (
    <WidgetReportClient
      leadId={lead.id}
      email={lead.visitor_email}
      url={lead.scanned_url}
      score={lead.score}
      diagnose={lead.diagnose ?? ""}
      scannedAt={lead.created_at}
      agencyName={branding?.agency_name ?? branding?.name ?? "Deine Agentur"}
      agencyColor={branding?.primary_color ?? "#007BFF"}
      agencyLogo={branding?.logo_url ?? null}
    />
  );
}
