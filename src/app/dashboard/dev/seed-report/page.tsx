import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SeedReportClient from "./seed-report-client";

/**
 * Dev-Seed-Tool: erstellt Test-Daten in Live-DB. ZWINGEND admin-only.
 * Vor diesem Fix war die Page nur "use client" ohne Server-Auth-Check —
 * jeder eingeloggte User konnte seeden.
 */
export default async function SeedReportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || session.user.email !== adminEmail) {
    redirect("/dashboard");
  }

  return <SeedReportClient />;
}
