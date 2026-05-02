/**
 * lib/rescue-guides.ts — Pay-per-Guide-Service-Layer.
 *
 * Verbindet die scan_engine-Output (issues) mit der rescue_guides-Library
 * via rescue_guide_triggers. Pro Scan-Result ermitteln wir die Top-N
 * matchenden Guides und reichern sie um den Unlock-Status des Users an.
 */

import { neon } from "@neondatabase/serverless";

export type RescueGuide = {
  id:                string;
  title:             string;
  problem_label:     string;
  preview:           string | null;
  price_cents:       number;
  stripe_price_id:   string | null;
  estimated_minutes: number | null;
  content_json:      RescueGuideContent;
  active:            boolean;
};

export type RescueGuideContent = {
  intro:    string;
  variants: Record<string, { steps: GuideStep[] }>;
  checklist: GuideChecklistItem[];
};

export type GuideStep = {
  title:      string;
  body:       string;
  screenshot: string | null;
};

export type GuideChecklistItem = {
  id:   string;
  text: string;
};

export type GuideMatch = {
  guide:     RescueGuide;
  relevance: number;
  unlocked:  boolean;
  unlockId?: number;
};

export type ScanIssueLike = {
  title:    string;
  body?:    string;
  category?: string;
  severity?: string;
};

/** Hoster-Optionen für die Modal-Auswahl. Bei Erweiterung der Library auch
 *  die content_json.variants-Keys ergänzen. */
export const HOSTER_OPTIONS = [
  { value: "default",    label: "Anderer Hoster" },
  { value: "strato",     label: "Strato" },
  { value: "ionos",      label: "IONOS / 1&1" },
  { value: "all-inkl",   label: "All-Inkl" },
  { value: "hostinger",  label: "Hostinger" },
] as const;

export type HosterValue = typeof HOSTER_OPTIONS[number]["value"];

/**
 * Findet alle Guides, die auf die scan-Issues passen, sortiert nach Relevanz.
 * Severity-Boost: rote Issues bekommen +50, gelbe +20.
 */
export async function matchGuidesForIssues(
  issues: ScanIssueLike[],
  userId: string | number,
): Promise<GuideMatch[]> {
  if (issues.length === 0) return [];

  const sql = neon(process.env.DATABASE_URL!);

  type TriggerRow = { guide_id: string; match_type: string; match_value: string; priority: number };
  const triggers = await sql`
    SELECT guide_id, match_type, match_value, priority
    FROM rescue_guide_triggers
    WHERE guide_id IN (SELECT id FROM rescue_guides WHERE active = TRUE)
  ` as TriggerRow[];

  // Pro guide_id den höchsten relevance-Score finden
  const relevance = new Map<string, number>();
  for (const issue of issues) {
    const haystack = `${issue.title} ${issue.body ?? ""}`.toLowerCase();
    const severityBoost = issue.severity === "red" ? 50 : issue.severity === "yellow" ? 20 : 0;

    for (const t of triggers) {
      let matched = false;
      if (t.match_type === "title_keyword" && haystack.includes(t.match_value.toLowerCase())) matched = true;
      else if (t.match_type === "category" && issue.category === t.match_value)             matched = true;

      if (matched) {
        const score = t.priority + severityBoost;
        const prev  = relevance.get(t.guide_id) ?? 0;
        if (score > prev) relevance.set(t.guide_id, score);
      }
    }
  }

  if (relevance.size === 0) return [];

  // Lade die matchenden Guide-Records + Unlock-Status des Users
  const guideIds = Array.from(relevance.keys());
  const guides = await sql`
    SELECT id, title, problem_label, preview, price_cents, stripe_price_id,
           estimated_minutes, content_json, active
    FROM rescue_guides
    WHERE id = ANY(${guideIds}::text[]) AND active = TRUE
  ` as Array<{
    id: string; title: string; problem_label: string; preview: string | null;
    price_cents: number; stripe_price_id: string | null;
    estimated_minutes: number | null; content_json: RescueGuideContent;
    active: boolean;
  }>;

  const unlocks = await sql`
    SELECT id, guide_id FROM user_unlocked_guides
    WHERE user_id = ${userId} AND guide_id = ANY(${guideIds}::text[])
  ` as Array<{ id: number; guide_id: string }>;
  const unlockMap = new Map(unlocks.map(u => [u.guide_id, u.id]));

  return guides
    .map(g => ({
      guide:     g as RescueGuide,
      relevance: relevance.get(g.id) ?? 0,
      unlocked:  unlockMap.has(g.id),
      unlockId:  unlockMap.get(g.id),
    }))
    .sort((a, b) => b.relevance - a.relevance);
}

/**
 * Lädt einen Guide per ID inkl. Unlock-Status für den aktuellen User.
 * Returnt null wenn der Guide nicht existiert oder inactive ist.
 */
export async function getGuideForUser(
  guideId: string,
  userId: string | number,
): Promise<{
  guide:           RescueGuide;
  unlocked:        boolean;
  unlockId:        number | null;
  hoster:          string | null;
  checklistState:  Record<string, boolean>;
} | null> {
  const sql = neon(process.env.DATABASE_URL!);

  const guides = await sql`
    SELECT id, title, problem_label, preview, price_cents, stripe_price_id,
           estimated_minutes, content_json, active
    FROM rescue_guides
    WHERE id = ${guideId} AND active = TRUE
    LIMIT 1
  ` as Array<{
    id: string; title: string; problem_label: string; preview: string | null;
    price_cents: number; stripe_price_id: string | null;
    estimated_minutes: number | null; content_json: RescueGuideContent;
    active: boolean;
  }>;

  if (guides.length === 0) return null;

  const unlocks = await sql`
    SELECT id, hoster, checklist_state
    FROM user_unlocked_guides
    WHERE user_id = ${userId} AND guide_id = ${guideId}
    LIMIT 1
  ` as Array<{ id: number; hoster: string | null; checklist_state: Record<string, boolean> | null }>;

  return {
    guide: guides[0] as RescueGuide,
    unlocked: unlocks.length > 0,
    unlockId: unlocks[0]?.id ?? null,
    hoster:   unlocks[0]?.hoster ?? null,
    checklistState: unlocks[0]?.checklist_state ?? {},
  };
}
