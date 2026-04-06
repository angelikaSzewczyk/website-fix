import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Bitte gib eine gültige E-Mail-Adresse ein." },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    await sql`
      INSERT INTO waitlist (email, source)
      VALUES (${email.toLowerCase().trim()}, 'scan')
      ON CONFLICT (email) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist-Fehler:", err);
    return NextResponse.json(
      { success: false, error: "Etwas ist schiefgelaufen. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}
