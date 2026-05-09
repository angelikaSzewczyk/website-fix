/**
 * CmsStackCard — 09.05.2026.
 *
 * Renders die "CMS-Stack-Analyse"-Kachel mit 6 Reihen:
 *   - WordPress (+ Version-Pill)
 *   - XML-RPC-Schnittstelle
 *   - Sitemap (sitemap.xml vs. sitemap_index.xml)
 *   - robots.txt-Status
 *   - SEO-Plugin (Yoast / Rank Math)
 *   - SSL-Zertifikat (+ Ablaufdatum)
 *
 * Quelle: meta_json.site_context, ergänzt durch ScanResult.siteContext (siehe
 * scan-engine/types.ts). Wird aktuell von StarterDashboard, ProDashboard und
 * der Scan-Detail-Page (/dashboard/scans/[id]) gerendert.
 *
 * Pricing-Strict-Hintergrund: zahlende Starter sahen die Card vorher nicht,
 * der gratis Anon-Scan zeigt sie aber prominent. Diese Komponente schließt
 * den DELTA — alle eingeloggten User bekommen mindestens das, was Anon zeigt.
 */

import type { SiteContext } from "@/lib/scan-engine/types";

const C = {
  text:       "rgba(255,255,255,0.92)",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.40)",
  divider:    "rgba(255,255,255,0.06)",
  blueSoft:   "#7aa6ff",
} as const;

type StackItem = { label: string; ok: boolean; detail: string; risk: string | null };

function buildItems(siteContext: SiteContext): StackItem[] {
  return [
    {
      label: "WordPress erkannt",
      ok:    true,
      detail: siteContext.wpVersion
        ? `Version ${siteContext.wpVersion} im Generator-Tag`
        : "Version nicht öffentlich sichtbar",
      risk: siteContext.wpVersion
        ? "Version öffentlich: Angreifer können gezielt bekannte Lücken suchen"
        : null,
    },
    {
      label: "XML-RPC Schnittstelle",
      ok:    !siteContext.xmlRpcOpen,
      detail: siteContext.xmlRpcOpen
        ? "/xmlrpc.php antwortet (Angriffsfläche offen)"
        : "/xmlrpc.php blockiert",
      risk: siteContext.xmlRpcOpen
        ? "Sicherheitsrisiko: XML-RPC ermöglicht Brute-Force-Attacken & DDoS-Amplification"
        : null,
    },
    {
      label: "Sitemap gefunden",
      ok:    !!siteContext.sitemapVorhanden,
      detail: siteContext.sitemapIndexFound
        ? "sitemap_index.xml vorhanden"
        : siteContext.sitemapVorhanden
          ? "sitemap.xml vorhanden"
          : "Keine Sitemap gefunden",
      risk: !siteContext.sitemapVorhanden
        ? "Google findet neue Seiten langsamer — SEO-Indexierungsverzögerung"
        : null,
    },
    {
      label: "robots.txt Status",
      ok:    !siteContext.robotsBlockiertAlles,
      detail: siteContext.robotsBlockiertAlles
        ? "Disallow: / — alle Crawler gesperrt"
        : "Crawler erlaubt",
      risk: siteContext.robotsBlockiertAlles
        ? "Kritisch: Seite komplett deindexiert — kein organischer Traffic"
        : null,
    },
    {
      label: "SEO-Plugin",
      ok:    !!(siteContext.hasRankMath || siteContext.hasYoast),
      detail: siteContext.hasRankMath
        ? "Rank Math erkannt — strukturierte SEO-Daten aktiv"
        : siteContext.hasYoast
          ? "Yoast SEO erkannt — strukturierte SEO-Daten aktiv"
          : "Kein SEO-Plugin erkannt",
      risk: !(siteContext.hasRankMath || siteContext.hasYoast)
        ? "Schema-Markup & Sitemap-Generierung möglicherweise nicht optimiert"
        : null,
    },
    {
      label: "SSL-Zertifikat",
      ok:    !!siteContext.https,
      detail: siteContext.sslExpiresAt
        ? `Gültig bis ${new Date(siteContext.sslExpiresAt).toLocaleDateString("de-DE")}`
        : siteContext.https
          ? "HTTPS aktiv"
          : "Kein HTTPS",
      risk: !siteContext.https
        ? "Mixed-Content + Browser-Warnungen — SEO-Penalty"
        : null,
    },
  ];
}

export default function CmsStackCard({
  siteContext,
  pluginActive = false,
  showPluginHint = true,
  marginBottom = 20,
}: {
  siteContext: SiteContext | null | undefined;
  /** Wenn true, wird der "Mit Plugin: PHP-Logs/DB-Last/…"-Hinweis NICHT gerendert
   *  (Plugin ist schon verbunden, der Hinweis wäre redundant). */
  pluginActive?: boolean;
  /** Hinweis ganz unterdrücken — nützlich auf der Scan-Detail-Page wo der
   *  Plugin-CTA bereits an anderer Stelle prominent steht. */
  showPluginHint?: boolean;
  marginBottom?: number;
}) {
  if (!siteContext) return null;
  const items = buildItems(siteContext);

  return (
    <div style={{
      background:   "rgba(255,255,255,0.025)",
      border:       "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding:      "20px 22px",
      marginBottom,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 14, flexWrap: "wrap",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: "rgba(33,117,218,0.12)", border: "1px solid rgba(33,117,218,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.blueSoft}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.textMuted,
            textTransform: "uppercase", letterSpacing: "0.09em",
          }}>
            CMS-Stack-Analyse
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            WordPress erkannt — tiefgehende Prüfung
          </div>
        </div>
        {siteContext.wpVersion && (
          <div style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 20,
            background: "rgba(122,166,255,0.08)",
            border:     "1px solid rgba(122,166,255,0.2)",
          }}>
            <span style={{ fontSize: 11, color: C.textMuted }}>WordPress</span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.blueSoft,
              fontFamily: "monospace",
            }}>
              v{siteContext.wpVersion}
            </span>
          </div>
        )}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 10,
      }}>
        {items.map(item => {
          const borderColor = !item.ok ? "rgba(251,191,36,0.25)" : "rgba(34,197,94,0.18)";
          const bgColor    = !item.ok ? "rgba(251,191,36,0.05)" : "rgba(34,197,94,0.04)";
          const dotColor   = !item.ok ? "#fbbf24" : "#22c55e";
          return (
            <div key={item.label} style={{
              padding: "12px 14px", borderRadius: 10,
              background: bgColor, border: `1px solid ${borderColor}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={dotColor}
                  strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0 }} aria-hidden="true">
                  {item.ok
                    ? <polyline points="20 6 9 17 4 12"/>
                    : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  }
                </svg>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: "rgba(255,255,255,0.78)",
                }}>
                  {item.label}
                </span>
              </div>
              <div style={{
                fontSize: 11, color: C.textMuted,
                fontFamily: "monospace", lineHeight: 1.45,
                marginBottom: item.risk ? 6 : 0,
              }}>
                {item.detail}
              </div>
              {item.risk && (
                <div style={{
                  fontSize: 10, color: dotColor,
                  lineHeight: 1.45, opacity: 0.9,
                }}>
                  {item.risk}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showPluginHint && !pluginActive && (
        <div style={{
          marginTop: 14, padding: "10px 12px", borderRadius: 8,
          background: "rgba(167,139,250,0.05)",
          border:     "1px solid rgba(167,139,250,0.20)",
          fontSize: 11, color: C.textSub, lineHeight: 1.55,
        }}>
          <strong style={{ color: "#a78bfa" }}>Mit Plugin:</strong> zusätzlich PHP-Error-Logs,
          DB-Last, Cron-Health, Plugin-Versionen + Sicherheits-Indikatoren — diese Daten
          kann ein externer Crawler nicht sehen.
        </div>
      )}
    </div>
  );
}
