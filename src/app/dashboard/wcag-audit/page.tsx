import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import WcagAuditClient from "./wcag-audit-client";

export const metadata: Metadata = {
  title: "Echte WCAG-Prüfung — WebsiteFix",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function WcagAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ url?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=%2Fdashboard%2Fwcag-audit");

  const sp = await searchParams;
  return <WcagAuditClient initialUrl={sp?.url ?? ""} />;
}
