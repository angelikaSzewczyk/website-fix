import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Alle Felder sind erforderlich." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Passwort muss mindestens 8 Zeichen haben." }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Ensure password_hash column exists (idempotent)
  await sql`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT
  `;

  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length > 0) {
    // If user exists but has no password yet (Google-only), set password
    const withPwd = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} AND password_hash IS NULL`;
    if (withPwd.length > 0) {
      const hashed = await hash(password, 12);
      await sql`UPDATE users SET password_hash = ${hashed}, name = COALESCE(name, ${name}) WHERE email = ${email.toLowerCase()}`;
      return NextResponse.json({ ok: true, linked: true });
    }
    return NextResponse.json({ error: "E-Mail bereits registriert." }, { status: 409 });
  }

  const hashed = await hash(password, 12);
  await sql`
    INSERT INTO users (name, email, password_hash, email_verified)
    VALUES (${name}, ${email.toLowerCase()}, ${hashed}, NOW())
  `;

  return NextResponse.json({ ok: true });
}
