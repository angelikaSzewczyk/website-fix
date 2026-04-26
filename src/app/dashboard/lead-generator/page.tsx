import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import LeadGeneratorClient from "./lead-generator-client";
import { isAgency } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Lead-Generator — WebsiteFix",
  robots: { index: false },
};

export type LeadRow = {
  id: string;
  visitor_email: string;
  scanned_url: string;
  score: number | null;
  status: string;
  created_at: string;
  pdf_downloaded_at: string | null;
  notification_sent: boolean;
};

export default async function LeadGeneratorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isAgency(plan)) redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);
  const agencyId = String(session.user.id);

  const [leads, settings] = await Promise.all([
    sql`
      SELECT
        id::text, visitor_email, scanned_url, score, status,
        created_at::text,
        pdf_downloaded_at::text,
        COALESCE(notification_sent, false) AS notification_sent
      FROM widget_leads
      WHERE agency_user_id = ${agencyId}
      ORDER BY created_at DESC
      LIMIT 500
    ` as unknown as LeadRow[],

    sql`
      SELECT
        COALESCE(primary_color, '#007BFF')  AS primary_color,
        COALESCE(agency_name, '')           AS agency_name,
        COALESCE(logo_url, '')              AS logo_url,
        COALESCE(widget_views, 0)::int      AS widget_views
      FROM agency_settings
      WHERE user_id = ${session.user.id}
      LIMIT 1
    `,
  ]);

  const branding = (settings[0] as {
    primary_color: string;
    agency_name: string;
    logo_url: string;
    widget_views: number;
  }) ?? { primary_color: "#007BFF", agency_name: "", logo_url: "", widget_views: 0 };

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://website-fix.com";
  const embedUrl = `${baseUrl}/widget/${agencyId}`;

  return (
    <LeadGeneratorClient
      agencyId={agencyId}
      leads={leads}
      branding={branding}
      embedUrl={embedUrl}
    />
  );
}
