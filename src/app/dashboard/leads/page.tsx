import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import LeadsClient from "./leads-client";

export const metadata: Metadata = {
  title: "Lead-Management — WebsiteFix",
  robots: { index: false },
};

export type Lead = {
  id: string;
  visitor_email: string;
  scanned_url: string;
  score: number | null;
  status: string;
  created_at: string;
};

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "free";
  if (!["agentur", "agency_core", "agency_scale"].includes(plan)) redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);

  const leads = (await sql`
    SELECT id::text, visitor_email, scanned_url, score, status, created_at
    FROM widget_leads
    WHERE agency_user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 500
  `) as Lead[];

  // Embed snippet
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

  return <LeadsClient leads={leads} embedSnippet={embedSnippet} embedUrl={embedUrl} />;
}
