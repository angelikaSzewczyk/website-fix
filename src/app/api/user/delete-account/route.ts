import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    // Delete all user data in order (FK constraints)
    await sql`DELETE FROM scans           WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM saved_websites  WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM accounts        WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM sessions        WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM users           WHERE id      = ${session.user.id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete-account error:", err);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
