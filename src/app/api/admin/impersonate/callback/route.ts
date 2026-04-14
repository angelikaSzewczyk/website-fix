/**
 * GET /api/admin/impersonate/callback?token=...
 * Validates token and signs in as the target user via the impersonate provider.
 * Redirects to /dashboard after sign-in.
 */
import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/admin?error=missing_token", req.url));
  }

  try {
    await signIn("impersonate", {
      token,
      redirectTo: "/dashboard?impersonating=1",
    });
  } catch (err) {
    // NextAuth throws a redirect — that's expected
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("NEXT_REDIRECT")) throw err;
    return NextResponse.redirect(new URL("/admin?error=invalid_token", req.url));
  }

  // signIn handles the redirect, this line is never reached
  return NextResponse.redirect(new URL("/dashboard?impersonating=1", req.url));
}
