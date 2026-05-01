/**
 * /dashboard/settings — Account, Abo, Passwort.
 *
 * STRIKT account-fokussiert. Branding, SMTP, Domain, API-Key und Workflow-
 * Integrationen leben in /dashboard/agency-branding (eigene Route, kein
 * Tab-Switcher). Kein Cross-Linking zwischen den beiden Pages.
 *
 * Plan-Routing:
 *   - Free/Starter:   FreeSettingsClient (eigenständige minimal-Variante)
 *   - Pro/Agency:     ProfileSettingsClient (Account/Abo/Passwort)
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import type { Metadata } from "next";
import ProfileSettingsClient from "./profile-settings-client";
import FreeSettingsClient from "./free-settings-client";
import { hasBrandingAccess } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Einstellungen — WebsiteFix",
  robots: { index: false },
};

const SCAN_LIMIT = 3;

export default async function SettingsPage() {
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error("[settings] auth() threw:", err);
    redirect("/login");
  }
  if (!session?.user) redirect("/login");

  const plan   = (session.user as { plan?: string }).plan ?? "starter";
  const userId = session.user.id;

  // ── Pro+ / Agency: minimaler Account-Hub. KEIN Branding hier. ──
  if (hasBrandingAccess(plan)) {
    // brandColor wird für den Stripe-Button-Style genutzt — wir lesen
    // nur primary_color aus agency_settings, sonst nichts. Defensives
    // try/catch, damit ein DB-Fehler nicht die Settings-Page killt.
    let brandColor = "#8df3d3";
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`
        SELECT primary_color FROM agency_settings WHERE user_id = ${userId} LIMIT 1
      ` as Array<{ primary_color: string | null }>;
      if (rows[0]?.primary_color && /^#[0-9a-fA-F]{6}$/.test(rows[0].primary_color)) {
        brandColor = rows[0].primary_color;
      }
    } catch (err) {
      console.error("[settings] brand color query failed:", err);
    }

    return (
      <ProfileSettingsClient
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        plan={plan}
        brandColor={brandColor}
      />
    );
  }

  // ── Starter / Free: eigenständige Settings-Seite ──
  let projectUrl   = "";
  let monthlyScans = 0;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const [projectRows, countRow] = await Promise.all([
      sql`
        SELECT url FROM scans
        WHERE user_id = ${userId}
        ORDER BY created_at DESC LIMIT 1
      ` as unknown as Promise<{ url: string }[]>,
      sql`
        SELECT COUNT(*)::int AS cnt FROM scans
        WHERE user_id = ${userId}
          AND created_at >= date_trunc('month', NOW())
      ` as unknown as Promise<{ cnt: number }[]>,
    ]);
    projectUrl   = projectRows[0]?.url ?? "";
    monthlyScans = countRow[0]?.cnt ?? 0;
  } catch (err) {
    console.error("[settings] free-plan query failed:", err);
  }

  return (
    <FreeSettingsClient
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
      plan={plan}
      projectUrl={projectUrl}
      monthlyScans={monthlyScans}
      scanLimit={SCAN_LIMIT}
    />
  );
}
