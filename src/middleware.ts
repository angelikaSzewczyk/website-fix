import { auth } from "@/auth-edge";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Eingeloggte User auf /scan → /dashboard/scan weiterleiten
  if (pathname === "/scan" && req.auth?.user) {
    return NextResponse.redirect(new URL("/dashboard/scan", req.url));
  }

  // /dashboard/* schützen
  if (pathname.startsWith("/dashboard") && !req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // /admin/* — strenger Guard: ADMIN_EMAIL muss in env gesetzt sein
  if (pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const userEmail  = req.auth?.user?.email;
    // Kein env-Var oder kein Login oder falsche Email → Login
    if (!adminEmail || !userEmail || userEmail !== adminEmail) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
});

export const config = {
  matcher: ["/scan", "/dashboard/:path*", "/admin/:path*"],
};
