/**
 * /api/onboarding — User-Onboarding-State persistieren + Auto-Detection.
 *
 * Schema-Shape (users.onboarding_state JSONB, default '{}'):
 *   {
 *     completed_steps: string[],   // Array von Step-IDs ("plugin", "scan", ...)
 *     dismissed:       boolean,    // User hat "Verstanden" geklickt → Card weg
 *     completed_at:    string|null // ISO-Timestamp wenn alle Steps done
 *   }
 *
 * Frontend ruft:
 *   GET  /api/onboarding?plan=<key>                   → liefert state + auto-detected Steps
 *   POST /api/onboarding {action:"complete_step", stepId} → markiert Step
 *   POST /api/onboarding {action:"dismiss"}           → Card permanent ausblenden
 *
 * Auto-Detection: GET prüft user-DB-Status (Logo gesetzt? Team da? Erster
 * Scan? mehrere Sites?) und schreibt diese Steps direkt in die DB, sodass
 * sie cross-device synchron sind. Idempotent — duplicate complete ist no-op.
 *
 * Schema-Ensure (ALTER TABLE … IF NOT EXISTS) läuft pro Server-Instanz einmal.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { normalizeOnboardingPlan, type OnboardingPlanKey } from "@/lib/onboarding-steps";

export const runtime = "nodejs";

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  // Eigene neon-Instance statt Param — sonst TS-Generic-Mismatch
  // (NeonQueryFunction<false,false> vs <boolean,boolean>). neon poolt
  // intern, also kein Performance-Overhead.
  const sql = neon(process.env.DATABASE_URL!);
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_state JSONB NOT NULL DEFAULT '{}'::jsonb`;
  schemaReady = true;
}

export type OnboardingState = {
  completed_steps: string[];
  dismissed:       boolean;
  completed_at:    string | null;
};

const EMPTY_STATE: OnboardingState = {
  completed_steps: [],
  dismissed:       false,
  completed_at:    null,
};

function normalizeState(raw: unknown): OnboardingState {
  if (!raw || typeof raw !== "object") return EMPTY_STATE;
  const obj = raw as Record<string, unknown>;
  return {
    completed_steps: Array.isArray(obj.completed_steps)
      ? obj.completed_steps.filter((x): x is string => typeof x === "string")
      : [],
    dismissed:    typeof obj.dismissed    === "boolean" ? obj.dismissed    : false,
    completed_at: typeof obj.completed_at === "string"  ? obj.completed_at : null,
  };
}

/** Erkenne plan-spezifische Steps anhand des aktuellen DB-Stands. */
async function detectAutoCompletions(
  userId: string,
  plan: OnboardingPlanKey,
): Promise<string[]> {
  const sql = neon(process.env.DATABASE_URL!);
  const detected: string[] = [];

  if (plan === "starter") {
    try {
      const scans = await sql`SELECT 1 FROM scans WHERE user_id = ${userId} LIMIT 1` as Array<unknown>;
      if (scans.length > 0) detected.push("starter_first_scan");
    } catch { /* graceful */ }
  }

  if (plan === "professional") {
    try {
      const sites = await sql`
        SELECT COUNT(*)::int AS cnt FROM saved_websites WHERE user_id = ${userId}
      ` as Array<{ cnt: number }>;
      if ((sites[0]?.cnt ?? 0) >= 2) detected.push("pro_bulk_import");
    } catch { /* skip */ }
  }

  if (plan === "agency") {
    try {
      const branding = await sql`
        SELECT agency_logo_url FROM agency_settings WHERE user_id = ${userId} LIMIT 1
      ` as Array<{ agency_logo_url: string | null }>;
      if (branding[0]?.agency_logo_url) detected.push("agency_branding");
    } catch { /* skip */ }
    try {
      const team = await sql`
        SELECT 1 FROM team_members WHERE owner_id = ${userId}::int LIMIT 1
      ` as Array<unknown>;
      if (team.length > 0) detected.push("agency_team_invite");
    } catch { /* skip */ }
  }

  return detected;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await ensureSchema();
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT onboarding_state FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as Array<{ onboarding_state: unknown }>;
  let state = normalizeState(rows[0]?.onboarding_state);

  // Auto-Detection wenn ?plan-Param mitgegeben — nur Steps hinzufügen die
  // noch nicht in completed_steps stehen, dann gleich persistieren.
  const planParam = normalizeOnboardingPlan(req.nextUrl.searchParams.get("plan"));
  if (planParam && !state.dismissed) {
    const detected = await detectAutoCompletions(String(session.user.id), planParam);
    const missing  = detected.filter(id => !state.completed_steps.includes(id));
    if (missing.length > 0) {
      state = { ...state, completed_steps: [...state.completed_steps, ...missing] };
      await sql`
        UPDATE users SET onboarding_state = ${JSON.stringify(state)}::jsonb
        WHERE id = ${session.user.id}
      `;
    }
  }

  return NextResponse.json({ state });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    action?: "complete_step" | "dismiss" | "reset";
    stepId?: string;
  };
  if (!body.action) return NextResponse.json({ error: "action required" }, { status: 400 });

  await ensureSchema();
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`
    SELECT onboarding_state FROM users WHERE id = ${session.user.id} LIMIT 1
  ` as Array<{ onboarding_state: unknown }>;
  const current = normalizeState(rows[0]?.onboarding_state);
  let next: OnboardingState = current;

  if (body.action === "complete_step") {
    if (!body.stepId || typeof body.stepId !== "string") {
      return NextResponse.json({ error: "stepId required" }, { status: 400 });
    }
    if (current.completed_steps.includes(body.stepId)) {
      return NextResponse.json({ state: current, alreadyCompleted: true });
    }
    next = {
      ...current,
      completed_steps: [...current.completed_steps, body.stepId],
    };
  } else if (body.action === "dismiss") {
    next = {
      ...current,
      dismissed:    true,
      completed_at: current.completed_at ?? new Date().toISOString(),
    };
  } else if (body.action === "reset") {
    next = EMPTY_STATE;
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  await sql`
    UPDATE users SET onboarding_state = ${JSON.stringify(next)}::jsonb
    WHERE id = ${session.user.id}
  `;

  return NextResponse.json({ state: next });
}
