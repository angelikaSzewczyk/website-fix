import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import { isAgency } from "@/lib/plans";
import WidgetConfigClient from "./widget-config-client";

export const metadata: Metadata = {
  title: "Widget-Konfigurator — WebsiteFix",
  robots: { index: false },
};

export default async function WidgetConfigPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isAgency(plan)) redirect("/dashboard");

  const agencyId = String(session.user.id);

  // Aktuelle Widget-Settings laden (Farbe, widget_views)
  const sql = neon(process.env.DATABASE_URL!);
  const [agency] = await sql`
    SELECT agency_name, primary_color, COALESCE(widget_views, 0)::int AS widget_views
    FROM agency_settings
    WHERE user_id = ${session.user.id}
    LIMIT 1
  ` as { agency_name: string | null; primary_color: string | null; widget_views: number }[];

  // Lead-Count total (gibt der Agentur das Gefühl, dass es läuft)
  const [leadStats] = await sql`
    SELECT
      COUNT(*)::int                                               AS total,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS last_30,
      COUNT(*) FILTER (WHERE visitor_email IS NOT NULL)::int      AS converted
    FROM widget_leads
    WHERE agency_user_id = ${session.user.id}
  ` as { total: number; last_30: number; converted: number }[];

  return (
    <WidgetConfigClient
      agencyId={agencyId}
      agencyName={agency?.agency_name ?? ""}
      currentColor={agency?.primary_color ?? "#007BFF"}
      widgetViews={agency?.widget_views ?? 0}
      leadStats={leadStats ?? { total: 0, last_30: 0, converted: 0 }}
    />
  );
}
