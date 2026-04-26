import { auth } from "@/auth-edge";
import { NextResponse } from "next/server";

// Pfade, die NIE durch die Middleware-Logik laufen — egal welche Query-Parameter
// (plan=agency, trial=7, etc.) gesetzt sind. Verhindert Redirect-Loops bei
// Auth-Flows und der öffentlichen Scan-Ergebnis-Seite.
const ALWAYS_BYPASS = [
  "/register",
  "/login",
  "/api/auth",
  "/scan/results",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // ── HARDER BYPASS: Auth + öffentliche Ergebnis-Seite ──────────────────
  // Steht VOR jeder anderen Logik. Auch wenn der Matcher unten erweitert wird,
  // kommen diese Pfade hier nie an Plan-/Auth-Checks vorbei.
  for (const prefix of ALWAYS_BYPASS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return NextResponse.next();
    }
  }

  // Eingeloggte User auf /scan → /dashboard/scan weiterleiten
  if (pathname === "/scan" && req.auth?.user) {
    return NextResponse.redirect(new URL("/dashboard/scan", req.url));
  }

  // /dashboard/* — nur Login-Pflicht (eingeloggt oder nicht?)
  // Plan-Prüfung erfolgt im Dashboard-Layout via frischer DB-Abfrage (nicht JWT)
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
