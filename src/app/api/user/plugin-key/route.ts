/**
 * GET  /api/user/plugin-key  — returns the current user's plugin API key (generates one if missing)
 * POST /api/user/plugin-key  — regenerates the plugin API key (rotates it)
 *
 * Only accessible to Agency plan users.
 */
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { randomBytes } from "crypto";

const AGENCY_PLANS = ["agency-starter", "agency-pro"];

function generateKey(): string {
  return "wf_live_" + randomBytes(24).toString("hex");
}

// Use `any` to sidestep the Neon generic overload incompatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveKey(sql: any, userId: string): Promise<string> {
  const rows = await sql`SELECT plugin_api_key FROM users WHERE id::text = ${userId} LIMIT 1` as { plugin_api_key: string | null }[];
  const existing = rows[0]?.plugin_api_key;
  if (existing) return existing;

  const newKey = generateKey();
  await sql`UPDATE users SET plugin_api_key = ${newKey} WHERE id::text = ${userId}`;
  return newKey;
}

type UserSession = { id?: string; plan?: string };

export async function GET() {
  const session = await auth();
  const user = session?.user as UserSession | undefined;
  if (!user?.id) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  if (!AGENCY_PLANS.includes(user.plan ?? "starter")) {
    return NextResponse.json({ error: "Agency plan required" }, { status: 403 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const key = await resolveKey(sql, String(user.id));
  return NextResponse.json({ key });
}

export async function POST() {
  const session = await auth();
  const user = session?.user as UserSession | undefined;
  if (!user?.id) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  if (!AGENCY_PLANS.includes(user.plan ?? "starter")) {
    return NextResponse.json({ error: "Agency plan required" }, { status: 403 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const newKey = generateKey();
  await sql`UPDATE users SET plugin_api_key = ${newKey} WHERE id::text = ${String(user.id)}`;
  return NextResponse.json({ key: newKey });
}
