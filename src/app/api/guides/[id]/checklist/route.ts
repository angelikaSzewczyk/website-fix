/**
 * PATCH /api/guides/[id]/checklist — Toggle-Endpoint für die interaktive
 * Checkliste im Guide-Renderer. Speichert state in user_unlocked_guides.
 * checklist_state (JSONB).
 *
 * Body: { itemId: string, checked: boolean }
 *
 * Owner-Check: Update nur wenn der User den Guide unlocked hat.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { id: guideId } = await params;
  const { itemId, checked } = await req.json().catch(() => ({})) as {
    itemId?: string; checked?: boolean;
  };
  if (!itemId || typeof checked !== "boolean") {
    return NextResponse.json({ error: "itemId und checked sind Pflicht" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // jsonb_set für atomaren Update — kein Read-Modify-Write nötig
  const rows = await sql`
    UPDATE user_unlocked_guides
    SET checklist_state = jsonb_set(
      COALESCE(checklist_state, '{}'::jsonb),
      ARRAY[${itemId}],
      ${JSON.stringify(checked)}::jsonb
    )
    WHERE user_id = ${session.user.id}::int AND guide_id = ${guideId}
    RETURNING id
  ` as Array<{ id: number }>;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Guide nicht freigeschaltet" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
