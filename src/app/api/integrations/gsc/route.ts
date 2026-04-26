/**
 * GET /api/integrations/gsc
 *
 * Liefert die letzten 28 Tage Impressions/Clicks der gesetzten GSC-Site
 * zurück — für die Dashboard-GSC-Card.
 *
 * Authentifizierung via Service-Account JWT → Google OAuth2 Access-Token
 * → Search Console API v1. Nur die Summen-Werte, kein Query-Breakdown.
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isAtLeastProfessional } from "@/lib/plans";
import { getIntegrationSettings } from "@/lib/integrations";
import { createHmac, createSign } from "crypto";

type GscTotals = {
  impressions: number;
  clicks:      number;
  ctr:         number; // fraction, 0..1
  position:    number | null;
  range:       { startDate: string; endDate: string };
};

// JWT-Sign für Google Service-Account (RS256)
function base64url(input: string | Buffer): string {
  const b = typeof input === "string" ? Buffer.from(input) : input;
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
void createHmac;

async function getAccessToken(serviceAccountJson: string, scope: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as { client_email: string; private_key: string };
  const now  = Math.floor(Date.now() / 1000);
  const header  = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    iss:   sa.client_email,
    scope,
    aud:   "https://oauth2.googleapis.com/token",
    exp:   now + 3600,
    iat:   now,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const sig = signer.sign(sa.private_key);
  const jwt = `${header}.${payload}.${base64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (session.user as { plan?: string }).plan ?? "";
  if (!isAtLeastProfessional(plan)) {
    return NextResponse.json({ connected: false, reason: "plan" });
  }

  const settings = await getIntegrationSettings(session.user.id as string);
  if (!settings.gsc_site_url || !settings.gsc_service_account) {
    return NextResponse.json({ connected: false, reason: "not_configured" });
  }

  try {
    const token = await getAccessToken(
      settings.gsc_service_account,
      "https://www.googleapis.com/auth/webmasters.readonly",
    );

    const end   = new Date();
    const start = new Date(end.getTime() - 28 * 86400000);
    const fmt   = (d: Date) => d.toISOString().slice(0, 10);

    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(settings.gsc_site_url)}/searchAnalytics/query`,
      {
        method:  "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          startDate:  fmt(start),
          endDate:    fmt(end),
          dimensions: [],
          rowLimit:   1,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ connected: true, ok: false, error: `GSC ${res.status}: ${text.slice(0, 160)}` });
    }
    const data = await res.json() as { rows?: Array<{ clicks: number; impressions: number; ctr: number; position: number }> };
    const r = data.rows?.[0];
    const totals: GscTotals = {
      impressions: r?.impressions ?? 0,
      clicks:      r?.clicks      ?? 0,
      ctr:         r?.ctr         ?? 0,
      position:    r?.position    ?? null,
      range:       { startDate: fmt(start), endDate: fmt(end) },
    };
    return NextResponse.json({ connected: true, ok: true, totals });
  } catch (err) {
    return NextResponse.json({ connected: true, ok: false, error: String(err).slice(0, 200) });
  }
}
