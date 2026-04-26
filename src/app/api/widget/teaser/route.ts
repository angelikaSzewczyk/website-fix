/**
 * POST /api/widget/teaser
 *
 * Stage 1 des 2-Stage-Widget-Flows. Führt einen Scan durch und gibt dem Gast
 * sofort eine Teaser-Zusammenfassung zurück (Builder erkannt, DOM-Risk,
 * Google Fonts, WooCommerce, Issue-Count). Kein E-Mail-Pflicht.
 *
 * Speichert einen unvollständigen Lead (visitor_email = NULL) in widget_leads
 * und gibt die lead-id als teaser-token zurück, damit Stage 2 (unlock) den
 * Lead vervollständigen kann.
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import type { TechFingerprint } from "@/lib/tech-detector";

export const maxDuration = 45;

type TeaserPayload = {
  teaserToken: string;
  agencyName:  string;
  agencyColor: string;
  agencyLogo:  string | null;
  // Teaser-Daten — das was Druck erzeugt
  score:       number;
  issueCount:  number;
  redCount:    number;
  yellowCount: number;
  builder:     string | null;
  isWooCommerce: boolean;
  domDepth:      number | null;
  googleFonts:   number;
  // Risk-Flags für die Teaser-UI
  risks: Array<{ label: string; severity: "red" | "yellow"; detail: string }>;
};

function quickScore(data: Record<string, unknown>): number {
  let s = 100;
  if (!data.https)                 s -= 20;
  if (!data.title)                 s -= 8;
  if (!data.metaDescription)       s -= 6;
  if (!data.h1)                    s -= 5;
  if (data.robotsBlockiertAlles)   s -= 15;
  if (!data.sitemapVorhanden)      s -= 4;
  if (Array.isArray(data.brokenLinks) && data.brokenLinks.length > 0) s -= 8;
  if (data.indexierungGesperrt)    s -= 12;
  return Math.max(15, Math.round(s));
}

type BuilderAuditT = {
  builder: string | null; maxDomDepth: number; divCount: number;
  googleFontFamilies: string[]; cssBloatHints: string[]; stylesheetCount: number;
};

export async function POST(req: NextRequest) {
  try {
    const { agencyId, url } = await req.json() as { agencyId: string; url: string };
    if (!agencyId || !url) {
      return NextResponse.json({ error: "Fehlende Felder" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Agentur laden + Branding
    const [agency] = await sql`
      SELECT u.id, u.email, u.name,
             ag.agency_name, ag.logo_url, ag.primary_color
      FROM users u
      LEFT JOIN agency_settings ag ON ag.user_id = u.id
      WHERE u.id::text = ${agencyId}
      LIMIT 1
    ` as { id: string; email: string; name: string; agency_name: string | null; logo_url: string | null; primary_color: string | null }[];
    if (!agency) {
      return NextResponse.json({ error: "Agentur nicht gefunden" }, { status: 404 });
    }

    const agencyName  = agency.agency_name ?? agency.name ?? "WebsiteFix";
    const agencyColor = agency.primary_color ?? "#007BFF";
    const agencyLogo  = agency.logo_url ?? null;

    // Scan durchführen (intern, wir kennen den Host)
    let score       = 50;
    let diagnose    = "";
    let issueCount  = 0;
    let redCount    = 0;
    let yellowCount = 0;
    let builderName: string | null = null;
    let isWooCommerce = false;
    let builderAudit: BuilderAuditT | null = null;

    try {
      const scanRes = await fetch(`${process.env.NEXTAUTH_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const scanData = await scanRes.json();
      if (scanData.success && scanData.scanData) {
        score    = quickScore(scanData.scanData);
        diagnose = scanData.diagnose ?? "";
        issueCount = scanData.issueCount ?? 0;

        // Tech fingerprint + builder audit
        const tf = scanData.scanData.techFingerprint as TechFingerprint | undefined;
        if (tf) {
          if (tf.builder.confidence >= 0.45 && tf.builder.value !== "Nicht eindeutig erkannt") {
            builderName = tf.builder.value;
          }
          isWooCommerce =
            tf.ecommerce.value === "WooCommerce" && tf.ecommerce.confidence >= 0.45;
        }
        builderAudit = (scanData.scanData.builderAudit as BuilderAuditT | null) ?? null;

        // Severity-Counts aus issues_json
        const issues = scanData.issuesJson as Array<{ severity: string; count?: number }> | undefined;
        if (Array.isArray(issues)) {
          for (const i of issues) {
            if (i.severity === "red")    redCount    += i.count ?? 1;
            if (i.severity === "yellow") yellowCount += i.count ?? 1;
          }
        }
      }
    } catch { /* Scan fehlgeschlagen — trotzdem Teaser mit Defaults */ }

    // Risiko-Flags zusammenstellen (Druck-Erzeuger für Teaser-UI)
    const risks: TeaserPayload["risks"] = [];
    const domDepth = builderAudit?.maxDomDepth ?? null;
    const googleFonts = builderAudit?.googleFontFamilies.length ?? 0;

    if (builderName && domDepth !== null && domDepth > 22) {
      risks.push({
        label:    `${builderName} · DOM-Risiko: KRITISCH`,
        severity: "red",
        detail:   `${domDepth} Ebenen Verschachtelung — Render-Stau auf Mobilgeräten wahrscheinlich.`,
      });
    } else if (builderName && domDepth !== null && domDepth > 15) {
      risks.push({
        label:    `${builderName} · DOM-Risiko: HOCH`,
        severity: "yellow",
        detail:   `${domDepth} Ebenen — Google empfiehlt max. 15. Bremst das Layout-Rendering.`,
      });
    }

    if (googleFonts >= 1) {
      risks.push({
        label:    "DSGVO-Risiko: Google Fonts gefunden",
        severity: "red",
        detail:   `${googleFonts} Font-Famil${googleFonts === 1 ? "ie" : "ien"} werden von Google-Servern geladen — LG München 2022: Abmahnrisiko ohne Einwilligung.`,
      });
    }

    if (isWooCommerce) {
      risks.push({
        label:    "WooCommerce-Shop erkannt",
        severity: "yellow",
        detail:   "Für Shops gelten zusätzliche Anforderungen bei Cart-Performance, Upload-Security und Checkout-Konformität.",
      });
    }

    if (redCount > 0) {
      risks.push({
        label:    `${redCount} kritische Fehler gefunden`,
        severity: "red",
        detail:   "Fehler, die sofort wirken — SEO-Sichtbarkeit, Rechtssicherheit oder Nutzererlebnis sind beeinträchtigt.",
      });
    }

    // Teaser-Lead speichern (ohne E-Mail, mit builder-audit für spätere unlock)
    // visitor_email bleibt NULL bis zur E-Mail-Eingabe in Stage 2.
    // diagnose speichert den AI-Text; domain-features landen in notification_sent als false-Marker.
    const [lead] = await sql`
      INSERT INTO widget_leads (agency_user_id, visitor_email, scanned_url, score, diagnose)
      VALUES (${agencyId}, NULL, ${url}, ${score}, ${diagnose})
      RETURNING id::text
    ` as { id: string }[];

    const teaserToken = lead.id;

    const payload: TeaserPayload = {
      teaserToken,
      agencyName,
      agencyColor,
      agencyLogo,
      score,
      issueCount,
      redCount,
      yellowCount,
      builder:       builderName,
      isWooCommerce,
      domDepth,
      googleFonts,
      risks,
    };

    return NextResponse.json({ ok: true, ...payload });
  } catch (err) {
    console.error("Widget teaser error:", err);
    return NextResponse.json({ error: "Scan fehlgeschlagen" }, { status: 500 });
  }
}
