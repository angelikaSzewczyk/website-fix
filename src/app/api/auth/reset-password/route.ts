import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT email FROM password_reset_tokens
    WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
  ` as { email: string }[];

  if (!rows.length) {
    return NextResponse.json({ error: "Link ungültig oder abgelaufen." }, { status: 400 });
  }

  const { email } = rows[0];
  const hashed = await hash(password, 12);

  await sql`UPDATE users SET password_hash = ${hashed} WHERE email = ${email}`;
  await sql`UPDATE password_reset_tokens SET used = TRUE WHERE token = ${token}`;

  return NextResponse.json({ ok: true });
}
