/**
 * GET /api/scan/cached?url=<encoded-url>
 *
 * Returns the cached scan payload (scanData + diagnose) from the scan_cache
 * table — NO new scan, NO DB write, NO scan-token consumed.
 * Used by /scan/results as a fallback when sessionStorage is empty (e.g. after
 * page reload or opening the results URL in a new tab).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCachedScan } from "@/lib/scan-cache";
import { isUrlAllowed } from "@/lib/scan-guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ found: false });

  let target = decodeURIComponent(url).trim();
  if (!target.startsWith("http")) target = "https://" + target;
  if (!isUrlAllowed(target)) return NextResponse.json({ found: false });

  // Cache-Isolation: User-Plan einlesen, damit getCachedScan den richtigen
  // (url:plan_tier:depth)-Slot trifft. Anonyme User → planTierKey = "anon".
  const session = await auth();
  const userPlan = (session?.user as { plan?: string } | undefined)?.plan ?? null;

  // Try both non-www and www variants in case the cache was stored under either
  const tryUrls = [target];
  try {
    const u = new URL(target);
    const alt = u.host.startsWith("www.")
      ? `${u.protocol}//${u.host.replace(/^www\./, "")}`
      : `${u.protocol}//www.${u.host}`;
    tryUrls.push(alt);
  } catch { /* malformed URL — skip alt */ }

  for (const candidate of tryUrls) {
    const cached = await getCachedScan(candidate, userPlan);
    if (cached) {
      return NextResponse.json({ found: true, scanData: cached.scanData, diagnose: cached.diagnose, cachedAt: cached.cachedAt });
    }
  }

  return NextResponse.json({ found: false });
}
