/**
 * POST /api/agency-settings/verify-domain
 *
 * Verifiziert dass die in agency_settings.custom_domain eingetragene Domain
 * einen CNAME auf den konfigurierten Target-Endpunkt (process.env.CUSTOM_DOMAIN_TARGET,
 * default "portal.website-fix.com") gesetzt hat. Bei Erfolg → setzt
 * agency_settings.custom_domain_verified_at = NOW().
 *
 * Pricing-Card-Versprechen "Kunden-Portal unter Custom-Domain (Q3 — Bestandskunden
 * behalten Preis)": der Verify-Schritt ist die User-Vorbereitung; das tatsächliche
 * Routing kommt mit Phase 3 (Middleware + Vercel-Domain-Setup).
 *
 * DNS-Resolution läuft serverseitig (Node-Runtime, nicht Edge) via node:dns.
 * Lookup-Order: resolveCname → falls leer/error → 400 mit precise reason.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { isAgency } from "@/lib/plans";
import { promises as dns } from "node:dns";

export const runtime = "nodejs";
export const maxDuration = 10;

function getTarget(): string {
  return (process.env.CUSTOM_DOMAIN_TARGET ?? "portal.website-fix.com").toLowerCase();
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Custom-Domain-Verifikation ist ein Agency-Feature — Starter/Pro haben
  // den Bullet nicht auf der Card.
  const plan = (session.user as { plan?: string }).plan;
  if (!isAgency(plan)) return NextResponse.json({ error: "Forbidden — Agency-Plan erforderlich" }, { status: 403 });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT custom_domain
    FROM agency_settings
    WHERE user_id = ${session.user.id}
    LIMIT 1
  ` as Array<{ custom_domain: string | null }>;

  const domain = rows[0]?.custom_domain?.trim().toLowerCase();
  if (!domain) {
    return NextResponse.json({
      error: "no_domain",
      message: "Trage zuerst eine Custom-Domain in den Settings ein.",
    }, { status: 400 });
  }

  const target = getTarget();
  let resolvedCnames: string[] = [];
  try {
    resolvedCnames = await dns.resolveCname(domain);
  } catch (err) {
    // ENOTFOUND / ENODATA / ESERVFAIL — alle als "CNAME nicht gesetzt" behandeln.
    const code = (err as NodeJS.ErrnoException).code ?? "";
    const expected = ["ENOTFOUND", "ENODATA", "ESERVFAIL", "ETIMEOUT", "EREFUSED"];
    if (!expected.includes(code)) {
      console.error("[verify-domain] unexpected dns error:", err);
    }
    return NextResponse.json({
      verified: false,
      domain,
      target,
      reason: "no_cname",
      message: `Für ${domain} ist kein CNAME-Record gesetzt. Richte einen CNAME → ${target} bei deinem DNS-Provider ein.`,
    }, { status: 400 });
  }

  // CNAME-Match: case-insensitive, trailing-dot tolerant.
  const targetClean = target.replace(/\.$/, "").toLowerCase();
  const isMatch = resolvedCnames.some(c => c.replace(/\.$/, "").toLowerCase() === targetClean);

  if (!isMatch) {
    return NextResponse.json({
      verified: false,
      domain,
      target,
      reason: "wrong_target",
      currentCnames: resolvedCnames,
      message: `${domain} zeigt aktuell auf ${resolvedCnames.join(", ")} — erwartet ${target}.`,
    }, { status: 400 });
  }

  // CNAME passt → verified_at setzen.
  await sql`
    UPDATE agency_settings
    SET custom_domain_verified_at = NOW()
    WHERE user_id = ${session.user.id}
  `;

  return NextResponse.json({
    verified: true,
    domain,
    target,
    verifiedAt: new Date().toISOString(),
    message: "Domain verifiziert. Routing wird mit dem Q3-Release automatisch aktiviert — bis dahin nutzt das Lead-Capture-Widget die Domain bereits für Origin-Sicherheit.",
  });
}
