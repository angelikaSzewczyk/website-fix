import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`DELETE FROM scans WHERE user_id = ${session.user.id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("clear-project error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
