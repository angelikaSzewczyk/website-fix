"use client";

import { useState } from "react";
import Link from "next/link";
import IssueList, { type IssueProp } from "@/components/dashboard/variants/_shared/IssueList";
import { DrawerPanel } from "@/components/dashboard/variants/_shared/IssueDetailDrawer";
import type { UnterseiteProp } from "@/components/dashboard/variants/_shared/dashboard-types";
import DiagnoseReport from "../../scan/diagnose-report";
import PrintButton from "./print-button";

interface Props {
  url: string;
  createdAt: string;
  plan: string;
  issues: IssueProp[];
  redCount: number;
  yellowCount: number;
  speedScore: number;
  scanId: string;
  integrationsStatus?: { asana: boolean; slack: boolean } | null;
  unterseiten?: UnterseiteProp[];
  /** KI-Diagnose-Text (scan.result) — wird als Hero gerendert wie auf der
   *  Live-Scan-Page direkt nach dem Scan. Vorher fehlte dieser Pfad: User
   *  musste im Activity-Feed navigieren und sah dort eine andere View
   *  (nur IssueList ohne Score-Ring). */
  diagnose?: string;
  totalPages?: number;
  issueCount?: number;
}

const T = {
  text:      "rgba(255,255,255,0.92)",
  textSub:   "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.40)",
  textFaint: "rgba(255,255,255,0.25)",
  border:    "rgba(255,255,255,0.08)",
  divider:   "rgba(255,255,255,0.06)",
  card:      "rgba(255,255,255,0.025)",
  red:       "#f87171",
  amber:     "#fbbf24",
  green:     "#4ade80",
  purple:    "#a78bfa",
  purpleBg:  "rgba(124,58,237,0.18)",
  purpleBdr: "rgba(124,58,237,0.40)",
};

/** Pro-Subpage einen Issue-Count berechnen, damit wir nur die Seiten mit
 *  Findings in der Liste zeigen. */
function pageIssueCount(p: UnterseiteProp): number {
  let n = 0;
  if (!p.title || p.title === "(kein Title)") n++;
  if (!p.h1    || p.h1    === "(kein H1)")    n++;
  if (p.noindex)                              n++;
  if (!p.metaDescription)                     n++;
  n += p.altMissing ?? 0;
  n += p.inputsWithoutLabel ?? 0;
  n += p.buttonsWithoutText ?? 0;
  if (!p.erreichbar)                          n++;
  return n;
}

/**
 * HTML-Entity-Decode für vom Crawler raw gelesene Title/Meta-Strings.
 * Der Auditor extrahiert Strings direkt aus DOM-Text und rendert sie
 * weiter — Browser dekodieren `&amp;` etc. automatisch beim Anzeigen,
 * aber unsere Server-Persistierung nicht. Ergebnis ohne diese Funktion:
 * "ZODA Picture | Foto- &amp; Videoproduktion" statt "Foto- & Videoproduktion".
 *
 * Wir behandeln die häufigsten benannten Entities + numerische Form. Für
 * Edge-Case-Entities (`&hellip;` etc.) nutzen wir DOMParser, der natürlich
 * NUR im Browser verfügbar ist — daher das typeof-window-Guard.
 */
function decodeHtmlEntities(s: string | undefined | null): string {
  if (!s) return "";
  // Schnellpfad: ohne `&` ist nichts zu decoden.
  if (!s.includes("&")) return s;
  if (typeof window !== "undefined" && window.document) {
    const ta = document.createElement("textarea");
    ta.innerHTML = s;
    return ta.value;
  }
  // SSR-Fallback: nur die häufigsten Entities — der Drawer ist Client-only,
  // kommt also gar nicht hierhin. Defensive für ggf. Future-SSR-Pfade.
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Normalisiert die unterseiten-Liste, die direkt aus scans.unterseiten_json
 * kommt — der Auditor speichert PageAudit-Tupel mit `ok: boolean`, aber der
 * UI-Code (DrawerPanel) erwartet `erreichbar: boolean`. Ohne dieses Mapping
 * ist `page.erreichbar` IMMER undefined → `!undefined === true` → der
 * Drawer rendert für JEDE Seite "Seite nicht erreichbar". Plus:
 * Title/H1/Meta werden HTML-decoded.
 */
function normalizeUnterseiten(raw: UnterseiteProp[]): UnterseiteProp[] {
  return raw.map(p => {
    const okFlag = (p as { ok?: boolean }).ok;
    return {
      ...p,
      erreichbar: typeof p.erreichbar === "boolean"
        ? p.erreichbar
        : typeof okFlag === "boolean" ? okFlag : true,
      title:           decodeHtmlEntities(p.title),
      h1:              p.h1 ? decodeHtmlEntities(p.h1) : p.h1,
      metaDescription: p.metaDescription ? decodeHtmlEntities(p.metaDescription) : p.metaDescription,
    };
  });
}

export default function ScanDetailClient({
  url, createdAt, plan, issues, redCount, yellowCount, speedScore, scanId,
  integrationsStatus = null,
  unterseiten: rawUnterseiten = [],
  diagnose = "",
  totalPages,
  issueCount,
}: Props) {
  const [drawerPageUrl, setDrawerPageUrl] = useState<string | null>(null);
  const [checkedUrls, setCheckedUrls] = useState<Set<string>>(new Set());

  const date = new Date(createdAt).toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  // Normalisierung — fixt zwei Bugs auf einmal:
  //   1. erreichbar wird aus PageAudit.ok abgeleitet (war vorher undefined
  //      → "Seite nicht erreichbar" für jede Subpage)
  //   2. Title/H1/Meta werden HTML-decoded ("&amp;" → "&")
  const unterseiten = normalizeUnterseiten(rawUnterseiten);

  function toggleChecked(u: string) {
    setCheckedUrls(prev => {
      const next = new Set(prev);
      if (next.has(u)) next.delete(u); else next.add(u);
      return next;
    });
  }

  // Subpages mit ≥1 Issue, sortiert nach Issue-Count desc
  const subpagesWithIssues = unterseiten
    .map(p => ({ page: p, count: pageIssueCount(p) }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count);

  // Domain für die Hero-Headline (kürzer als die volle URL).
  const domain = (() => {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return url; }
  })();

  // Severity-Counts für die Hero-Pills
  const totalIssues = redCount + yellowCount;
  const scoreColor  = speedScore >= 80 ? T.green : speedScore >= 60 ? T.amber : T.red;
  const scoreLabel  = speedScore >= 80 ? "Gut aufgestellt" : speedScore >= 60 ? "Verbesserungspotenzial" : "Kritisch";

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", color: T.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 32px 80px" }}>

        {/* ── Top-Bar: zurück + Aktionen ────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <Link href="/dashboard/scans" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12.5, fontWeight: 600, color: T.textSub,
            textDecoration: "none", padding: "7px 14px", borderRadius: 8,
            background: T.card, border: `1px solid ${T.border}`,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Zurück zur Übersicht
          </Link>

          <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Link href={`/dashboard/scan?url=${encodeURIComponent(url)}`} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, textDecoration: "none", fontSize: 12.5, fontWeight: 700,
              background: T.purpleBg, border: `1px solid ${T.purpleBdr}`, color: T.purple,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Re-Scan
            </Link>
            <PrintButton url={url} type="WordPress-Audit" date={date} scanId={scanId} plan={plan} />
          </div>
        </div>

        {/* ── Hero: Domain + Stats-Strip ─────────────────────────────────
            Premium-Header analog zur Kommandozentrale: Eyebrow-Pre-Text,
            Domain als prominentes h1, full URL + Datum als Sub-Line, Stats
            als 4-Spalten-Strip darunter (Pages / Issues / Score / Datum). */}
        <div style={{
          marginBottom: 24, paddingBottom: 20,
          borderBottom: `1px solid ${T.divider}`,
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Audit-Bericht
          </p>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.025em", wordBreak: "break-all" }}>
            {domain}
          </h1>
          <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
            {url}
          </p>
        </div>

        {/* ── Stat-Strip ──────────────────────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
          marginBottom: 24,
        }}>
          {[
            { label: "Seiten analysiert", value: String(totalPages ?? unterseiten.length), color: T.purple },
            { label: "Issues gesamt",     value: String(totalIssues),                      color: totalIssues >= 10 ? T.red : totalIssues >= 3 ? T.amber : T.green },
            { label: "Score",             value: `${speedScore}/100`,                     color: scoreColor, sub: scoreLabel },
            { label: "Scan-Datum",        value: new Date(createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" }), color: T.textSub, sub: new Date(createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) },
          ].map(s => (
            <div key={s.label} style={{
              padding: "16px 18px", borderRadius: 14,
              background: T.card, border: `1px solid ${T.border}`,
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5, letterSpacing: "0.02em" }}>
                {s.label}
              </div>
              {s.sub && (
                <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── KI-Site-Report (Hero) ──────────────────────────────────────
            Identisch zur Live-Scan-Result-Page — Score-Ring + AI-Diagnose
            + Stats (Pages / Issues). Vorher fehlte der ganze Block auf der
            archivierten Detail-Page; der User sah nur die Issue-Liste,
            keinen KI-Bericht und keinen Score. */}
        {diagnose && (
          <div style={{ marginTop: 24 }}>
            <DiagnoseReport
              diagnose={diagnose}
              url={url}
              totalPages={totalPages}
              issueCount={issueCount}
              scannedAt={createdAt}
            />
          </div>
        )}

        {/* Results panel */}
        <IssueList
          issues={issues}
          redCount={redCount}
          yellowCount={yellowCount}
          speedScore={speedScore}
          plan={plan}
          lastScan={true}
          scanId={scanId}
          integrationsStatus={integrationsStatus}
          scanUrl={url}
        />

        {/* ── Subpage-Drilldown ─────────────────────────────────────────────
            Pro Subpage mit Issues ein Eintrag — Klick öffnet den DrawerPanel
            mit konkreten Bildern (Alt-Text fehlt) und Form-Feldern (Label
            fehlt). Vorher gab es diesen Drilldown-Pfad nur im ProDashboard,
            nicht auf der archivierten Scan-Detail-Page. */}
        {subpagesWithIssues.length > 0 && (
          <div style={{
            marginTop: 28, background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 20px", borderBottom: `1px solid ${T.divider}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: "-0.01em" }}>
                  Detail-Analyse pro Seite
                </p>
                <p style={{ margin: 0, fontSize: 11, color: T.textMuted }}>
                  Klick öffnet die Liste der konkreten Elemente (Bilder ohne Alt-Text,
                  Formularfelder ohne Label, Buttons ohne Text)
                </p>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 700,
                padding: "3px 9px", borderRadius: 6,
                background: T.purpleBg, border: `1px solid ${T.purpleBdr}`,
                color: T.purple, letterSpacing: "0.04em",
              }}>
                {subpagesWithIssues.length} {subpagesWithIssues.length === 1 ? "Seite" : "Seiten"}
              </span>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {subpagesWithIssues.map(({ page, count }, i) => {
                const path = (() => { try { return new URL(page.url).pathname || "/"; } catch { return page.url; } })();
                const isChecked = checkedUrls.has(page.url);
                return (
                  <li key={page.url} style={{
                    borderBottom: i < subpagesWithIssues.length - 1 ? `1px solid ${T.divider}` : "none",
                  }}>
                    <button
                      type="button"
                      onClick={() => setDrawerPageUrl(page.url)}
                      style={{
                        width: "100%", textAlign: "left",
                        padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
                        background: "transparent", border: "none", cursor: "pointer",
                        color: "inherit", fontFamily: "inherit",
                        transition: "background 0.15s ease",
                      }}
                      className="agency-subpage-row"
                    >
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: !page.erreichbar ? T.red : count >= 3 ? T.amber : T.green,
                        boxShadow: `0 0 6px ${(!page.erreichbar ? T.red : count >= 3 ? T.amber : T.green)}80`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {page.title && page.title !== "(kein Title)" ? page.title : path}
                        </div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                          {path}
                        </div>
                      </div>
                      {isChecked && (
                        <span title="Erledigt-Markierung gesetzt" style={{
                          fontSize: 10, fontWeight: 700,
                          padding: "2px 8px", borderRadius: 6,
                          background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.28)",
                          color: T.green,
                        }}>
                          ✓ erledigt
                        </span>
                      )}
                      <span style={{
                        fontSize: 11, fontWeight: 800,
                        padding: "3px 10px", borderRadius: 6,
                        background: count >= 3 ? "rgba(248,113,113,0.10)" : "rgba(251,191,36,0.10)",
                        border: `1px solid ${count >= 3 ? "rgba(248,113,113,0.28)" : "rgba(251,191,36,0.28)"}`,
                        color: count >= 3 ? T.red : T.amber,
                        whiteSpace: "nowrap",
                      }}>
                        {count} {count === 1 ? "Issue" : "Issues"}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* DrawerPanel (rendert nur wenn drawerPageUrl gesetzt). Backdrop +
            ESC werden vom Panel selbst gehandhabt. */}
        {drawerPageUrl && unterseiten.length > 0 && (
          <DrawerPanel
            pageUrl={drawerPageUrl}
            unterseiten={unterseiten}
            onClose={() => setDrawerPageUrl(null)}
            isChecked={checkedUrls.has(drawerPageUrl)}
            onToggleChecked={() => toggleChecked(drawerPageUrl)}
          />
        )}

        <style>{`
          .agency-subpage-row:hover {
            background: rgba(255,255,255,0.025);
          }
        `}</style>
      </main>
    </div>
  );
}
