/**
 * /dashboard/guides/[id] — Renderer für einen freigeschalteten Rescue-Guide.
 *
 * Render-Pfad:
 *   1. Auth + getGuideForUser → unlock-status + content_json + hoster
 *   2. Wenn nicht unlocked + ?session_id → GuidePollingShell (verifiziert
 *      Stripe-Session, mounted dann Guide oder zeigt Wait-State)
 *   3. Wenn unlocked → GuideRenderer (Steps + interaktive Checkliste)
 *   4. Wenn nicht unlocked + kein session_id → Redirect zu /dashboard
 */

import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuideForUser } from "@/lib/rescue-guides";
import GuideRenderer from "./guide-renderer";

export const metadata: Metadata = {
  title: "Rescue-Guide — WebsiteFix",
  robots: { index: false },
};

export default async function GuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id: guideId } = await params;
  const sp = (await searchParams) ?? {};

  const data = await getGuideForUser(guideId, session.user.id);
  if (!data) notFound();

  return (
    <GuideRenderer
      guide={data.guide}
      unlocked={data.unlocked}
      hoster={data.hoster ?? "default"}
      checklistState={data.checklistState}
      pendingSessionId={!data.unlocked ? sp.session_id ?? null : null}
    />
  );
}
