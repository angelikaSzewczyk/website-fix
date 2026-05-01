import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import { isAgency } from "@/lib/plans";
import { cmsContextLabel } from "@/lib/fix-guides";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kunden-Portfolio — WebsiteFix",
  robots: { index: false },
};

// ─── Dark-Mode tokens (mirrored from variants/_shared) ───────────────────────
const T = {
  page:       "#0b0c10",
  card:       "rgba(255,255,255,0.025)",
  border:     "rgba(255,255,255,0.08)",
  borderMid:  "rgba(255,255,255,0.12)",
  divider:    "rgba(255,255,255,0.06)",
  text:       "rgba(255,255,255,0.92)",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.4)",
  textFaint:  "rgba(255,255,255,0.25)",
  green:      "#4ade80",
  greenBg:    "rgba(74,222,128,0.10)",
  greenBdr:   "rgba(74,222,128,0.28)",
  amber:      "#fbbf24",
  amberBg:    "rgba(251,191,36,0.10)",
  amberBdr:   "rgba(251,191,36,0.28)",
  red:        "#f87171",
  redBg:      "rgba(248,113,113,0.10)",
  redBdr:     "rgba(248,113,113,0.28)",
  purple:     "#a78bfa",
  purpleBg:   "rgba(124,58,237,0.18)",
  purpleBdr:  "rgba(124,58,237,0.40)",
  purpleSolid:"rgba(124,58,237,0.85)",
};

type Website = {
  id: string;
  url: string;
  name: string | null;
  last_check_at: string | null;
  last_check_status: string | null;
  ssl_days_left: number | null;
  security_score: number | null;
  platform: string | null;
  cms_context: string | null;
  response_time_ms: number | null;
  last_issue_count: number | null;
  last_scan_at: string | null;
  last_scan_type: string | null;
  scan_count: number;
};

const statusColor = (s: string | null) =>
  s === "ok" ? T.green : s === "warning" ? T.amber : s === "critical" ? T.red : T.textFaint;
const statusLabel = (s: string | null) =>
  s === "ok" ? "OK" : s === "warning" ? "Warnung" : s === "critical" ? "Kritisch" : "—";
const sslColor = (d: number | null) =>
  d === null ? T.textFaint : d <= 7 ? T.red : d <= 30 ? T.amber : T.green;
const scoreColor = (n: number | null) =>
  n === null ? T.textFaint : n >= 80 ? T.green : n >= 50 ? T.amber : T.red;

const SCAN_TYPE_LABEL: Record<string, string> = {
  website: "Website-Check",
  wcag:    "WCAG",
  performance: "Performance",
};

// CMS-Filter — Werte matchen die Strings, die der Scanner in
// website_checks.cms_context schreibt (siehe lib/fix-guides cmsContextLabel).
const CMS_FILTERS = [
  { value: "",          label: "Alle Systeme" },
  { value: "gutenberg", label: "Gutenberg" },
  { value: "elementor", label: "Elementor" },
  { value: "divi",      label: "Divi" },
  { value: "astra",     label: "Astra" },
  { value: "classic",   label: "Klassisch" },
] as const;

const STATUS_FILTERS = [
  { value: "",            label: "Alle Status" },
  { value: "ok",          label: "OK" },
  { value: "warning",     label: "Warnung" },
  { value: "critical",    label: "Kritisch" },
  { value: "unmonitored", label: "Nicht überwacht" },
] as const;

const TABLE_GRID = "1.6fr 1.4fr 100px 90px 110px 130px 110px";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms?: string; status?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan;
  if (!isAgency(plan)) redirect("/dashboard");

  const sp = (await searchParams) ?? {};
  const cmsFilter    = sp.cms?.trim()    || "";
  const statusFilter = sp.status?.trim() || "";
  const search       = sp.q?.trim()      || "";

  const sql = neon(process.env.DATABASE_URL!);

  // SQL-seitiges Filtern — performant und stabil bei großen Portfolios.
  // CMS- und Status-Filter werden direkt in den WHERE-Block hinein geliefert,
  // q-Suche per ILIKE auf Name + URL.
  const allWebsites = (await sql`
    SELECT
      sw.id::text,
      sw.url,
      sw.name,
      sw.last_check_at,
      sw.last_check_status,
      wc.ssl_days_left,
      wc.security_score,
      wc.platform,
      wc.cms_context,
      wc.response_time_ms,
      s_latest.issue_count   AS last_issue_count,
      s_latest.created_at    AS last_scan_at,
      s_latest.type          AS last_scan_type,
      (SELECT COUNT(*)::int FROM scans WHERE url = sw.url AND user_id = sw.user_id) AS scan_count
    FROM saved_websites sw
    LEFT JOIN LATERAL (
      SELECT ssl_days_left, security_score, platform, response_time_ms, cms_context
      FROM website_checks
      WHERE website_id = sw.id AND user_id = sw.user_id
      ORDER BY checked_at DESC
      LIMIT 1
    ) wc ON true
    LEFT JOIN LATERAL (
      SELECT issue_count, created_at, type
      FROM scans
      WHERE url = sw.url AND user_id = sw.user_id
      ORDER BY created_at DESC
      LIMIT 1
    ) s_latest ON true
    WHERE sw.user_id = ${session.user.id}
    ORDER BY GREATEST(sw.last_check_at, s_latest.created_at) DESC NULLS LAST
  `) as Website[];

  // Filter-Application — in JS, weil die Filter clientseitig im URL liegen
  // und die Tabellen-Größen so klein sind, dass SQL-Roundtrip-Komplexität
  // nicht lohnt (das gesamte Portfolio passt easy in einen Roundtrip).
  const websites = allWebsites.filter(w => {
    if (cmsFilter && w.cms_context !== cmsFilter) return false;
    if (statusFilter) {
      if (statusFilter === "unmonitored") {
        if (w.last_check_at !== null) return false;
      } else if (w.last_check_status !== statusFilter) {
        return false;
      }
    }
    if (search) {
      const haystack = `${w.name ?? ""} ${w.url}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const totalAll = allWebsites.length;
  const totalShown = websites.length;
  const filtersActive = !!(cmsFilter || statusFilter || search);

  return (
    <main style={{ padding: "32px 32px 80px", color: T.text, maxWidth: 1280, margin: "0 auto" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, flexWrap: "wrap",
        marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${T.divider}`,
      }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Agency · Technische Inventur
          </p>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
            Kunden-Portfolio
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: T.textSub, maxWidth: 620, lineHeight: 1.55 }}>
            Vollständige Liste deiner Kunden-Sites — CMS, SSL-Restlaufzeit, Security-Score
            und Issue-Stand auf einen Blick. Filter eingrenzen, dann pro Zeile direkt
            Re-Scan starten.
          </p>
        </div>
        <Link href="/dashboard#modal-new-client" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "11px 22px", borderRadius: 10,
          background: T.purpleSolid,
          border: "1px solid rgba(167,139,250,0.55)",
          color: "#fff",
          fontWeight: 700, fontSize: 13, textDecoration: "none",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Neuen Kunden anlegen
        </Link>
      </div>

      {/* ── Filter-Bar ─────────────────────────────────────────────────────── */}
      <form
        method="GET"
        action="/dashboard/clients"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 200px 200px auto",
          gap: 10,
          marginBottom: 18,
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={T.textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Nach Name oder Domain suchen…"
            defaultValue={search}
            style={{
              width: "100%",
              padding: "10px 14px 10px 34px",
              borderRadius: 10,
              background: T.card,
              border: `1px solid ${T.border}`,
              color: T.text,
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <select
          name="cms"
          defaultValue={cmsFilter}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: T.card,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontSize: 13,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {CMS_FILTERS.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#0b0c10" }}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          name="status"
          defaultValue={statusFilter}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: T.card,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontSize: 13,
            outline: "none",
            cursor: "pointer",
          }}
        >
          {STATUS_FILTERS.map(o => (
            <option key={o.value} value={o.value} style={{ background: "#0b0c10" }}>
              {o.label}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{
            padding: "10px 18px", borderRadius: 10,
            background: T.purpleBg,
            border: `1px solid ${T.purpleBdr}`,
            color: T.purple,
            fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap",
          }}>Filter anwenden</button>
          {filtersActive && (
            <Link href="/dashboard/clients" style={{
              display: "inline-flex", alignItems: "center",
              padding: "10px 14px", borderRadius: 10,
              background: T.card,
              border: `1px solid ${T.border}`,
              color: T.textSub,
              fontWeight: 600, fontSize: 12.5, textDecoration: "none", whiteSpace: "nowrap",
            }}>Zurücksetzen</Link>
          )}
        </div>
      </form>

      {/* ── Filter-Status-Hint (wenn aktiv) ────────────────────────────────── */}
      {filtersActive && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          fontSize: 11.5, color: T.textSub,
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: 6,
            background: T.purpleBg, border: `1px solid ${T.purpleBdr}`,
            color: T.purple, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.purple }} />
            FILTER AKTIV
          </span>
          <span>{totalShown} von {totalAll} Kunden sichtbar.</span>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, overflow: "hidden",
        backdropFilter: "blur(8px)",
      }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 880 }}>

            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: TABLE_GRID, gap: 14,
              padding: "12px 22px",
              borderBottom: `1px solid ${T.divider}`,
              background: "rgba(255,255,255,0.015)",
            }}>
              {["Kunde", "Domain", "CMS", "Status", "SSL", "Security", "Aktion"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {h}
                </span>
              ))}
            </div>

            {websites.length === 0 ? (
              filtersActive ? (
                /* No-Match-State — Filter zu eng */
                <div style={{ padding: "40px 28px", textAlign: "center" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: T.text }}>
                    Keine Treffer für die aktuelle Auswahl
                  </h3>
                  <p style={{ margin: "0 auto 18px", fontSize: 12.5, color: T.textSub, maxWidth: 420 }}>
                    Lockere die Filter oder setze sie zurück, um wieder das gesamte Portfolio zu sehen.
                  </p>
                  <Link href="/dashboard/clients" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 8,
                    background: T.purpleBg, border: `1px solid ${T.purpleBdr}`,
                    color: T.purple, fontWeight: 700, fontSize: 12, textDecoration: "none",
                  }}>Filter zurücksetzen</Link>
                </div>
              ) : (
                /* Empty State — Quick-Start */
                <div style={{ padding: "48px 28px", textAlign: "center" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, marginBottom: 18,
                    background: T.purpleBg,
                    border: `1px solid ${T.purpleBdr}`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
                      <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
                      <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
                      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeDasharray="2.5 2"/>
                    </svg>
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
                    Noch keine Kunden im Portfolio
                  </h3>
                  <p style={{ margin: "0 auto 22px", fontSize: 12.5, color: T.textSub, lineHeight: 1.65, maxWidth: 480 }}>
                    Pro Kunde speicherst du Domain, Branding-Hinweise und behältst SSL/Security/Scan-
                    Historie an einem Ort. Beim ersten Scan landet die Domain automatisch hier.
                  </p>
                  <Link href="/dashboard#modal-new-client" style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "11px 22px", borderRadius: 10,
                    background: T.purpleSolid,
                    border: "1px solid rgba(167,139,250,0.55)",
                    color: "#fff",
                    fontWeight: 700, fontSize: 13, textDecoration: "none",
                    boxShadow: "0 4px 18px rgba(124,58,237,0.35)",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Ersten Kunden anlegen
                  </Link>
                </div>
              )
            ) : (
              websites.map((site, i) => {
                const dot = statusColor(site.last_check_status);
                const issueColor = site.last_issue_count === 0 ? T.green : T.amber;
                const displayName = site.name ?? (() => { try { return new URL(site.url).hostname.replace(/^www\./, ""); } catch { return site.url; } })();
                return (
                  <div key={site.id} className="agency-portfolio-row" style={{
                    display: "grid", gridTemplateColumns: TABLE_GRID, gap: 14,
                    padding: "14px 22px", alignItems: "center",
                    borderBottom: i < websites.length - 1 ? `1px solid ${T.divider}` : "none",
                  }}>
                    {/* Kunde — Name + last-scan-meta darunter */}
                    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: dot, flexShrink: 0,
                        boxShadow: site.last_check_status ? `0 0 6px ${dot}80` : "none",
                      }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {displayName}
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                          {site.last_scan_at
                            ? `${SCAN_TYPE_LABEL[site.last_scan_type ?? ""] ?? site.last_scan_type} · ${new Date(site.last_scan_at).toLocaleDateString("de-DE")}`
                            : "Noch nicht gescannt"}
                          {site.last_issue_count !== null && (
                            <> · <span style={{ color: issueColor }}>{site.last_issue_count === 0 ? "Keine Probleme" : `${site.last_issue_count} Issues`}</span></>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Domain */}
                    <div style={{ fontSize: 12, color: T.textSub, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {site.url}
                      {site.platform && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 700,
                          padding: "1px 7px", borderRadius: 8,
                          background: T.card, border: `1px solid ${T.border}`,
                          color: T.textMuted, letterSpacing: "0.04em",
                        }}>
                          {site.platform}
                        </span>
                      )}
                    </div>

                    {/* CMS */}
                    <div style={{ minWidth: 0 }}>
                      {site.cms_context ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 10.5, fontWeight: 700,
                          padding: "3px 9px", borderRadius: 8,
                          background: T.purpleBg,
                          border: `1px solid ${T.purpleBdr}`,
                          color: T.purple, letterSpacing: "0.04em",
                          whiteSpace: "nowrap",
                        }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/>
                          </svg>
                          {cmsContextLabel(site.cms_context)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: T.textFaint }}>—</span>
                      )}
                    </div>

                    {/* Status */}
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "3px 9px", borderRadius: 6,
                      color: dot,
                      background: site.last_check_status ? `${dot}1a` : "transparent",
                      border: `1px solid ${dot}3a`,
                      justifySelf: "start",
                      whiteSpace: "nowrap",
                    }}>
                      {statusLabel(site.last_check_status)}
                    </span>

                    {/* SSL */}
                    <div style={{ fontSize: 11, color: sslColor(site.ssl_days_left), fontWeight: 700 }}>
                      {site.ssl_days_left !== null ? `${site.ssl_days_left}d` : "—"}
                      {site.response_time_ms !== null && (
                        <span style={{ display: "block", color: T.textMuted, fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                          {site.response_time_ms} ms
                        </span>
                      )}
                    </div>

                    {/* Security */}
                    <div style={{ fontSize: 11, color: scoreColor(site.security_score), fontWeight: 700 }}>
                      {site.security_score !== null ? `${site.security_score}/100` : "—"}
                      <span style={{ display: "block", color: T.textMuted, fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                        {site.scan_count} {site.scan_count === 1 ? "Scan" : "Scans"}
                      </span>
                    </div>

                    {/* Aktion */}
                    <Link href={`/dashboard/scan?url=${encodeURIComponent(site.url)}`} style={{
                      justifySelf: "start",
                      padding: "6px 12px", borderRadius: 7, textDecoration: "none",
                      fontSize: 11.5, fontWeight: 700,
                      background: T.purpleBg,
                      border: `1px solid ${T.purpleBdr}`,
                      color: T.purple,
                      whiteSpace: "nowrap",
                    }}>
                      Re-Scan →
                    </Link>
                  </div>
                );
              })
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
