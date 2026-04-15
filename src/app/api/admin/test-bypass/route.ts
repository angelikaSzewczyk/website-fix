/**
 * /api/admin/test-bypass
 * GET  ?action=enable  → setzt wf_admin_test Cookie (umgeht IP-Rate-Limit beim Scan)
 * GET  ?action=disable → löscht das Cookie
 *
 * Nur für Admins zugänglich.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const email   = session?.user?.email ?? "";
  const adminEmail = process.env.ADMIN_EMAIL ?? "";

  if (!adminEmail || email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const action = req.nextUrl.searchParams.get("action") ?? "enable";
  const secret = process.env.ADMIN_BYPASS_SECRET ?? "";

  if (!secret) {
    return NextResponse.json({ error: "ADMIN_BYPASS_SECRET not set in env" }, { status: 500 });
  }

  const res = NextResponse.redirect(new URL("/", req.url));

  if (action === "disable") {
    res.cookies.delete("wf_admin_test");
  } else {
    res.cookies.set("wf_admin_test", secret, {
      httpOnly: false,          // muss auch clientseitig lesbar sein (kein HttpOnly)
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 4,     // 4 Stunden
    });
  }

  return res;
}
