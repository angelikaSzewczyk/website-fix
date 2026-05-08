/**
 * /dashboard/agency-branding/avv — Druckbare AVV-Vorlage.
 *
 * Pricing-Card-Versprechen #9 (Agency Scale): "DSGVO-AVV, Audit-Log + Haftungs-
 * Dokumentation". Diese Server-Page rendert eine vorgefertigte Auftragsverarbeitungs-
 * Vereinbarung gem. Art. 28 DSGVO mit Agency-Daten vorbefüllt. User druckt sie
 * via Browser-Print als PDF.
 *
 * Auth: nur Agency-Plan. Pro+/Starter werden auf /dashboard?wall=agency_only
 * redirected. Dashboard-Layout-Wrapper greift via plan-Check oben.
 *
 * Hinweis im Footer: "Vor Verwendung von Fachanwalt prüfen lassen" — wir liefern
 * eine sehr generische Standard-Vorlage, kein juristisches Maßgeschneidert-Doku.
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import { isAgency } from "@/lib/plans";
import AvvPrintClient from "./avv-print-client";

type AgencyData = {
  agency_name:    string | null;
  agency_website: string | null;
  custom_domain:  string | null;
};

export default async function AvvPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql  = neon(process.env.DATABASE_URL!);
  const userRow = await sql`SELECT plan FROM users WHERE id = ${session.user.id} LIMIT 1` as { plan: string | null }[];
  const plan = userRow[0]?.plan ?? null;
  if (!isAgency(plan)) redirect("/dashboard?wall=agency_only");

  const settingsRows = await sql`
    SELECT agency_name, agency_website, custom_domain
    FROM agency_settings
    WHERE user_id = ${session.user.id}
    LIMIT 1
  ` as AgencyData[];

  const agency: AgencyData = settingsRows[0] ?? {
    agency_name: session.user.name ?? null,
    agency_website: null,
    custom_domain: null,
  };

  return <AvvPrintClient agency={agency} contactEmail={session.user.email ?? ""} />;
}
