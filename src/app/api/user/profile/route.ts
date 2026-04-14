import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json() as { name?: string; email?: string; projectUrl?: string };
  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (body.name !== undefined || body.email !== undefined) {
      await sql`
        UPDATE users
        SET
          name  = COALESCE(${body.name  ?? null}, name),
          email = COALESCE(${body.email ?? null}, email)
        WHERE id = ${session.user.id}
      `;
    }

    if (body.projectUrl !== undefined) {
      const url = body.projectUrl.trim();
      if (url) {
        // Upsert into saved_websites as the primary project
        await sql`
          INSERT INTO saved_websites (user_id, url, name)
          VALUES (${session.user.id}, ${url}, 'Aktives Projekt')
          ON CONFLICT (user_id, url) DO NOTHING
        `;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("profile update error:", err);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
