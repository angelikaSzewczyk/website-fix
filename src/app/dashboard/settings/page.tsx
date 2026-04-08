import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: "Einstellungen — WebsiteFix",
  robots: { index: false },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan;
  if (plan !== "agentur") redirect("/dashboard");

  const sql = neon(process.env.DATABASE_URL!);

  const [row] = await sql`
    SELECT agency_name, logo_url, primary_color
    FROM agency_settings
    WHERE user_id = ${session.user.id}
    LIMIT 1
  ` as { agency_name: string | null; logo_url: string | null; primary_color: string | null }[];

  const initial = {
    agency_name:   row?.agency_name   ?? "",
    logo_url:      row?.logo_url      ?? "",
    primary_color: row?.primary_color ?? "#8df3d3",
  };

  return <SettingsClient initial={initial} />;
}
