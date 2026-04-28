"use client";

import Link from "next/link";

type ParsedIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  category: "recht" | "speed" | "technik" | "shop" | "builder";
  count?: number;
};

type WooAuditT = {
  addToCartButtons: number; cartButtonsBlocked: boolean;
  pluginImpact: Array<{ name: string; impactScore: number; reason: string }>;
  outdatedTemplates: boolean; revenueRiskPct: number;
} | null;

type BuilderAuditT = {
  builder: string | null; maxDomDepth: number; divCount: number;
  googleFontFamilies: string[]; cssBloatHints: string[]; stylesheetCount: number;
} | null;

type ScanSnapshot = {
  id:           string;
  url:          string;
  createdAt:    string;
  issueCount:   number;
  speedScore:   number;
  issues:       ParsedIssue[];
  techFingerprint: {
    cms?: { value?: string; confidence?: number };
    builder?: { value?: string; confidence?: number };
    ecommerce?: { value?: string; confidence?: number };
  } | null;
  wooAudit:     WooAuditT;
  builderAudit: BuilderAuditT;
};

// Design tokens — dark theme
const D = {
  page:        "#0b0c10",
  card:        "rgba(255,255,255,0.03)",
  border:      "rgba(255,255,255,0.07)",
  text:        "#ffffff",
  textSub:     "rgba(255,255,255,0.55)",
  textMuted:   "rgba(255,255,255,0.3)",
  green:       "#4ade80",
  greenBg:     "rgba(74,222,128,0.09)",
  greenBorder: "rgba(74,222,128,0.28)",
  red:         "#f87171",
  redBg:       "rgba(239,68,68,0.08)",
  redBorder:   "rgba(239,68,68,0.22)",
  amber:       "#fbbf24",
  amberBg:     "rgba(251,191,36,0.08)",
  amberBorder: "rgba(251,191,36,0.22)",
  blueSoft:    "#7aa6ff",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Delta Arrow ────────────────────────────────────────────────────────────
function DeltaArrow({ delta, better }: { delta: number; better: "up" | "down" }) {
  // "better up" = größere Zahl ist besser (z.B. speedScore)
  // "better down" = kleinere Zahl ist besser (z.B. DOM-Tiefe, Issues)
  if (delta === 0) {
    return <span style={{ fontSize: 12, fontWeight: 700, color: D.textMuted }}>= 0</span>;
  }
  const isBetter = better === "up" ? delta > 0 : delta < 0;
  const color    = isBetter ? D.green : D.red;
  const sign     = delta > 0 ? "+" : "";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 13, fontWeight: 800, color, fontVariantNumeric: "tabular-nums",
    }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {isBetter
          ? <><polyline points="18 15 12 9 6 15"/></>
          : <><polyline points="6 9 12 15 18 9"/></>}
      </svg>
      {sign}{delta}
    </span>
  );
}

// ── Metric Card: Before → After ────────────────────────────────────────────
function MetricRow({ label, before, after, unit, better, improved }: {
  label:    string;
  before:   number;
  after:    number;
  unit?:    string;
  better:   "up" | "down"; // direction where higher is better
  improved?: boolean;
}) {
  const delta     = after - before;
  const isBetter  = better === "up" ? delta > 0 : delta < 0;
  const showGlow  = improved ?? isBetter;
  return (
    <div style={{
      padding: "14px 18px", borderRadius: 10,
      background: showGlow && delta !== 0 ? D.greenBg : D.card,
      border: `1px solid ${showGlow && delta !== 0 ? D.greenBorder : D.border}`,
      display: "grid", gridTemplateColumns: "1.2fr 1fr auto 1fr", gap: 16,
      alignItems: "center",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{label}</div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: D.textMuted, marginBottom: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>Vorher</div>
        <div style={{ fontSize: 19, fontWeight: 800, color: D.textSub, fontVariantNumeric: "tabular-nums" }}>
          {before}{unit ? <span style={{ fontSize: 12, color: D.textMuted, marginLeft: 2 }}>{unit}</span> : null}
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: D.textMuted, marginBottom: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>Nachher</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: showGlow ? D.green : D.text, fontVariantNumeric: "tabular-nums" }}>
            {after}{unit ? <span style={{ fontSize: 12, color: D.textMuted, marginLeft: 2 }}>{unit}</span> : null}
          </span>
          <DeltaArrow delta={delta} better={better} />
        </div>
      </div>
    </div>
  );
}

// ── Diff List (issues that disappeared / appeared) ─────────────────────────
function issueKey(i: ParsedIssue): string {
  // Normalize URLs out of titles for stable comparison
  return i.title
    .replace(/\s+auf\s+\S+/i, "")
    .replace(/\s*\(https?:[^)]+\)/i, "")
    .trim()
    .toLowerCase();
}

function diffIssues(before: ParsedIssue[], after: ParsedIssue[]) {
  const beforeKeys = new Map(before.map(i => [issueKey(i), i]));
  const afterKeys  = new Map(after.map(i => [issueKey(i), i]));
  const fixed:     ParsedIssue[] = [];
  const newIssues: ParsedIssue[] = [];
  for (const [k, issue] of beforeKeys) if (!afterKeys.has(k)) fixed.push(issue);
  for (const [k, issue] of afterKeys)  if (!beforeKeys.has(k)) newIssues.push(issue);
  return { fixed, newIssues };
}

export default function CompareClient({ before, after }: { before: ScanSnapshot; after: ScanSnapshot }) {
  const { fixed, newIssues } = diffIssues(before.issues, after.issues);

  // Issue-Count je Kategorie
  function byCategory(issues: ParsedIssue[], cat: ParsedIssue["category"]): number {
    return issues.filter(i => i.category === cat).reduce((a, i) => a + (i.count ?? 1), 0);
  }

  const daysBetween = Math.max(1, Math.round(
    (new Date(after.createdAt).getTime() - new Date(before.createdAt).getTime()) / 86400000,
  ));

  // Builder-Audit Deltas
  const domBefore   = before.builderAudit?.maxDomDepth ?? 0;
  const domAfter    = after.builderAudit?.maxDomDepth ?? 0;
  const fontsBefore = before.builderAudit?.googleFontFamilies.length ?? 0;
  const fontsAfter  = after.builderAudit?.googleFontFamilies.length ?? 0;
  const cssBefore   = before.builderAudit?.stylesheetCount ?? 0;
  const cssAfter    = after.builderAudit?.stylesheetCount ?? 0;

  // Woo Deltas
  const wooRiskBefore = before.wooAudit?.revenueRiskPct ?? 0;
  const wooRiskAfter  = after.wooAudit?.revenueRiskPct ?? 0;

  const totalImproved =
    (after.issueCount < before.issueCount ? 1 : 0) +
    (after.speedScore > before.speedScore ? 1 : 0) +
    (domAfter < domBefore ? 1 : 0) +
    (fontsAfter < fontsBefore ? 1 : 0) +
    (wooRiskAfter < wooRiskBefore ? 1 : 0);

  const overallVerdict =
    totalImproved >= 3 ? { label: "Substanzielle Verbesserung", color: D.green, bg: D.greenBg, bd: D.greenBorder }
    : totalImproved >= 1 ? { label: "Teilverbesserung", color: D.amber, bg: D.amberBg, bd: D.amberBorder }
    : { label: "Kein Fortschritt messbar", color: D.red, bg: D.redBg, bd: D.redBorder };

  return (
    <main style={{ minHeight: "100vh", background: D.page, color: D.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>

        {/* Back link */}
        <Link href="/dashboard/scans" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, color: D.textMuted, textDecoration: "none", marginBottom: 18,
        }}>
          ← Zurück zu den Berichten
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 800, color: D.blueSoft, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Proof of Work · {daysBetween} {daysBetween === 1 ? "Tag" : "Tage"} Optimierung
          </p>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, letterSpacing: "-0.025em" }}>
            Vorher / Nachher · <span style={{ color: D.blueSoft }}>{new URL(after.url).hostname.replace(/^www\./, "")}</span>
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: D.textSub }}>
            {fmtDate(before.createdAt)} &nbsp;→&nbsp; {fmtDate(after.createdAt)}
          </p>
        </div>

        {/* Verdict */}
        <div style={{
          padding: "16px 20px", borderRadius: 12, marginBottom: 22,
          background: overallVerdict.bg, border: `1px solid ${overallVerdict.bd}`,
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: `${overallVerdict.color}22`, border: `1px solid ${overallVerdict.color}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={overallVerdict.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {totalImproved >= 1 ? <polyline points="20 6 9 17 4 12"/> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: overallVerdict.color, marginBottom: 2 }}>
              {overallVerdict.label}
            </div>
            <div style={{ fontSize: 12.5, color: D.textSub, lineHeight: 1.5 }}>
              {totalImproved >= 1
                ? `${totalImproved} von 5 Kerngrößen (Issues, Speed, DOM, Fonts, Shop-Risk) haben sich verbessert. Dieser Bericht dient als Nachweis der durchgeführten Arbeit.`
                : "Die Metriken zeigen keine messbare Verbesserung. Erneute Analyse oder Intervention empfohlen."}
            </div>
          </div>
          <button
            onClick={() => window.print()}
            style={{
              padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(255,255,255,0.05)", color: D.text,
              border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Als PDF exportieren
          </button>
        </div>

        {/* Kernmetriken — Before/After */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: D.text, letterSpacing: "-0.01em" }}>
            Kernmetriken
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <MetricRow label="Gefundene Optimierungen" before={before.issueCount} after={after.issueCount} better="down" />
            <MetricRow label="Speed Score (Technik)" before={before.speedScore} after={after.speedScore} unit="/100" better="up" />
            {(before.builderAudit || after.builderAudit) && (
              <MetricRow label="DOM-Verschachtelungstiefe" before={domBefore} after={domAfter} better="down" />
            )}
            {(before.builderAudit || after.builderAudit) && (
              <MetricRow label="Google-Font-Familien" before={fontsBefore} after={fontsAfter} better="down" />
            )}
            {(before.builderAudit || after.builderAudit) && (
              <MetricRow label="Externe Stylesheets" before={cssBefore} after={cssAfter} better="down" />
            )}
            {(before.wooAudit || after.wooAudit) && (
              <MetricRow label="Revenue-at-Risk" before={wooRiskBefore} after={wooRiskAfter} unit="%" better="down" />
            )}
          </div>
        </section>

        {/* Issue-Kategorien */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: D.text, letterSpacing: "-0.01em" }}>
            Issues nach Kategorie
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
            {(["technik", "recht", "speed", "shop", "builder"] as const).map(cat => {
              const b = byCategory(before.issues, cat);
              const a = byCategory(after.issues, cat);
              if (b === 0 && a === 0) return null;
              const delta = a - b;
              const label = cat === "technik" ? "Technik" : cat === "recht" ? "Barrierefreiheit & Recht" : cat === "speed" ? "Speed" : cat === "shop" ? "Shop" : "Builder";
              return (
                <div key={cat} style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: D.card, border: `1px solid ${D.border}`,
                }}>
                  <div style={{ fontSize: 10, color: D.textMuted, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: delta < 0 ? D.green : delta > 0 ? D.red : D.text, fontVariantNumeric: "tabular-nums" }}>{a}</span>
                    <span style={{ fontSize: 11, color: D.textMuted }}>vorher {b}</span>
                    <span style={{ marginLeft: "auto" }}>
                      <DeltaArrow delta={delta} better="down" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Behobene Issues */}
        {fixed.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: D.green, letterSpacing: "-0.01em", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {fixed.length} Problem{fixed.length !== 1 ? "e" : ""} behoben
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {fixed.slice(0, 20).map((issue, idx) => (
                <div key={idx} style={{
                  padding: "9px 14px", borderRadius: 8,
                  background: D.greenBg, border: `1px solid ${D.greenBorder}`,
                  display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: D.textSub,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ textDecoration: "line-through", color: D.textMuted }}>{issue.title}</span>
                </div>
              ))}
              {fixed.length > 20 && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: D.textMuted }}>… und {fixed.length - 20} weitere behobene Befunde.</p>
              )}
            </div>
          </section>
        )}

        {/* Neu aufgetretene Issues */}
        {newIssues.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 800, color: D.amber, letterSpacing: "-0.01em" }}>
              {newIssues.length} neu aufgetretene{newIssues.length !== 1 ? "s" : ""} Problem{newIssues.length !== 1 ? "e" : ""}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {newIssues.slice(0, 12).map((issue, idx) => (
                <div key={idx} style={{
                  padding: "9px 14px", borderRadius: 8,
                  background: issue.severity === "red" ? D.redBg : D.amberBg,
                  border: `1px solid ${issue.severity === "red" ? D.redBorder : D.amberBorder}`,
                  fontSize: 12.5, color: D.textSub,
                }}>
                  {issue.title}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Agency-Zertifikat-Baustein */}
        <div style={{
          padding: "18px 22px", borderRadius: 12,
          background: "linear-gradient(90deg, rgba(16,185,129,0.08), rgba(251,191,36,0.05))",
          border: "1px solid rgba(16,185,129,0.25)",
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: D.green, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Zertifikat der durchgeführten Arbeit
          </p>
          <p style={{ margin: 0, fontSize: 13, color: D.textSub, lineHeight: 1.65 }}>
            Dieser Before/After-Bericht belegt messbare technische Verbesserungen an der Website{" "}
            <strong style={{ color: D.text }}>{new URL(after.url).hostname.replace(/^www\./, "")}</strong>{" "}
            im Zeitraum von {daysBetween} {daysBetween === 1 ? "Tag" : "Tagen"}. Geeignet als Anhang zur monatlichen Wartungs-Rechnung.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: #fff !important; }
          main { background: #fff !important; color: #0b0c10 !important; }
          main *:not(svg):not(svg *) { color: #0b0c10 !important; }
          main button, main a[href^="/dashboard"] { display: none !important; }
        }
      `}</style>
    </main>
  );
}
