import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ReportPrintButton from "./report-print-button";

// ─── Mock data ────────────────────────────────────────────────────────────────
const REPORT = {
  client:   "Muster GmbH – Sanitär & Heizung",
  website:  "www.muster-sanitaer.de",
  period:   "April 2026",
  agency:   "WebsiteFix Agentur",
  preparedBy: "Deine Agentur GmbH",

  summary: {
    headline: "Deine Website ist sicher und barrierefrei.",
    subline:  "Alle kritischen Prüfpunkte bestanden. Keine offenen Sicherheitslücken.",
  },

  highlights: [
    { icon: "🔒", value: "4",    label: "Sicherheitslücken geschlossen" },
    { icon: "♿", value: "12",   label: "Alt-Attribute optimiert" },
    { icon: "⬆",  value: "100%", label: "Uptime im April" },
    { icon: "⚡",  value: "98",   label: "Health Score (↑ +33)" },
  ],

  healthHistory: [
    { month: "Nov",  score: 65 },
    { month: "Dez",  score: 70 },
    { month: "Jan",  score: 74 },
    { month: "Feb",  score: 81 },
    { month: "Mär",  score: 89 },
    { month: "Apr",  score: 98 },
  ],

  bfsg: {
    passed: true,
    checks: [
      { label: "WCAG 2.1 AA Konformität",         ok: true },
      { label: "Alt-Texte für alle Bilder",         ok: true },
      { label: "Kontrastverhältnis ≥ 4.5:1",       ok: true },
      { label: "Tastaturnavigation vollständig",    ok: true },
      { label: "Screenreader-kompatibel",           ok: true },
      { label: "ARIA-Labels vorhanden",             ok: true },
    ],
  },

  openIssues: 0,
  closedIssues: 4,
  scansThisMonth: 8,
};

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  text:      "#0F172A",
  textSub:   "#475569",
  textMuted: "#94A3B8",
  border:    "#E2E8F0",
  divider:   "#F1F5F9",
  blue:      "#2563EB",
  blueBg:    "#EFF6FF",
  blueBorder:"#BFDBFE",
  green:     "#16A34A",
  greenBg:   "#F0FDF4",
  greenBorder:"#A7F3D0",
  amber:     "#D97706",
  amberBg:   "#FFFBEB",
  red:       "#DC2626",
  redBg:     "#FEF2F2",
};

// ─── SVG line chart ───────────────────────────────────────────────────────────
function HealthChart({ data }: { data: typeof REPORT.healthHistory }) {
  const W = 520, H = 140, PAD = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const minY = 50, maxY = 100;

  const px = (i: number) => PAD.left + (i / (data.length - 1)) * innerW;
  const py = (v: number) => PAD.top + (1 - (v - minY) / (maxY - minY)) * innerH;

  const points = data.map((d, i) => `${px(i)},${py(d.score)}`).join(" ");
  const areaPath = `M${px(0)},${py(data[0].score)} ` +
    data.slice(1).map((d, i) => `L${px(i + 1)},${py(d.score)}`).join(" ") +
    ` L${px(data.length - 1)},${PAD.top + innerH} L${px(0)},${PAD.top + innerH} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", maxWidth: "100%" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.blue} stopOpacity="0.15" />
          <stop offset="100%" stopColor={C.blue} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis gridlines */}
      {[60, 70, 80, 90, 100].map(v => (
        <g key={v}>
          <line
            x1={PAD.left} y1={py(v)} x2={PAD.left + innerW} y2={py(v)}
            stroke={C.border} strokeWidth="1" strokeDasharray="3,3"
          />
          <text x={PAD.left - 6} y={py(v) + 4} textAnchor="end" fontSize="9" fill={C.textMuted}>
            {v}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#chartGrad)" />

      {/* Line */}
      <polyline points={points} fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Data points + labels */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={px(i)} cy={py(d.score)} r="4" fill="#fff" stroke={C.blue} strokeWidth="2.5" />
          <text x={px(i)} y={PAD.top + innerH + 16} textAnchor="middle" fontSize="10" fill={C.textMuted}>
            {d.month}
          </text>
          {/* score label above last dot */}
          {i === data.length - 1 && (
            <text x={px(i) + 8} y={py(d.score) - 8} fontSize="10" fontWeight="700" fill={C.blue}>
              {d.score}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ReportPreviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const r = REPORT;

  return (
    <div style={{ background: "#F0F4F8", minHeight: "100vh", padding: "32px 24px 64px" }}>

      {/* Toolbar */}
      <div className="no-print" style={{
        maxWidth: 860, margin: "0 auto 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 12, color: C.textMuted }}>Vorschau</p>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>Kunden-Report: {r.period}</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/dashboard/reports" style={{
            padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none",
            border: `1px solid ${C.border}`, color: C.textSub, background: "#fff",
          }}>
            ← Berichte
          </a>
          <ReportPrintButton />
        </div>
      </div>

      {/* ── DOCUMENT ── */}
      <div id="report-document" style={{
        maxWidth: 860, margin: "0 auto",
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 4px 32px rgba(0,0,0,0.10)",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}>

        {/* ══ HEADER BAND ══ */}
        <div style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
          padding: "32px 40px",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24,
        }}>
          {/* Left: client info */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Website-Report · {r.period}
            </p>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
              {r.client}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {r.website}
            </p>
          </div>

          {/* Right: Agency logo placeholder */}
          <div style={{
            minWidth: 120, padding: "10px 18px", borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            textAlign: "center",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, margin: "0 auto 8px",
              background: "linear-gradient(135deg, #007BFF, #0057b8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#fff" }}>{r.preparedBy}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Erstellt von</p>
          </div>
        </div>

        {/* ══ EXECUTIVE SUMMARY ══ */}
        <div style={{ padding: "32px 40px 24px", borderBottom: `1px solid ${C.divider}` }}>
          <div style={{
            background: C.greenBg,
            border: `1px solid ${C.greenBorder}`,
            borderRadius: 14,
            padding: "22px 28px",
            display: "flex", alignItems: "flex-start", gap: 18,
          }}>
            {/* Big checkmark */}
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: C.green,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Executive Summary
              </p>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
                {r.summary.headline}
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: C.textSub, lineHeight: 1.65 }}>
                {r.summary.subline}
              </p>
            </div>
          </div>
        </div>

        {/* ══ HIGHLIGHTS ══ */}
        <div style={{ padding: "28px 40px", borderBottom: `1px solid ${C.divider}` }}>
          <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Erfolge diesen Monat
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {r.highlights.map((h) => (
              <div key={h.label} style={{
                background: C.divider,
                borderRadius: 12, padding: "18px 16px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{h.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {h.value}
                </div>
                <div style={{ fontSize: 11, color: C.textSub, marginTop: 6, lineHeight: 1.4 }}>
                  {h.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ HEALTH SCORE CHART ══ */}
        <div style={{ padding: "28px 40px", borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Health Score Verlauf
              </p>
              <p style={{ margin: 0, fontSize: 13, color: C.textSub }}>
                November 2025 – April 2026
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Start</div>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: C.red,
                  background: C.redBg, borderRadius: 8, padding: "4px 12px",
                }}>65</div>
              </div>
              <div style={{ color: C.textMuted, fontSize: 18 }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Jetzt</div>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: C.green,
                  background: C.greenBg, borderRadius: 8, padding: "4px 12px",
                }}>98</div>
              </div>
              <div style={{
                padding: "6px 14px", borderRadius: 20,
                background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                fontSize: 13, fontWeight: 700, color: C.green,
              }}>
                ↑ +33 Punkte
              </div>
            </div>
          </div>

          <div style={{ background: C.divider, borderRadius: 12, padding: "20px 16px 12px" }}>
            <HealthChart data={r.healthHistory} />
          </div>
        </div>

        {/* ══ BFSG 2025 ══ */}
        <div style={{ padding: "28px 40px", borderBottom: `1px solid ${C.divider}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: C.blueBg, border: `1px solid ${C.blueBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                BFSG 2025 Compliance
              </p>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>
                Barrierefreiheitsstärkungsgesetz — Alle Anforderungen erfüllt ✓
              </h3>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {r.bfsg.checks.map((check) => (
              <div key={check.label} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 9,
                background: check.ok ? C.greenBg : C.redBg,
                border: `1px solid ${check.ok ? C.greenBorder : "#FCA5A5"}`,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: check.ok ? C.green : C.red,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    {check.ok
                      ? <polyline points="20 6 9 17 4 12"/>
                      : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{check.label}</span>
              </div>
            ))}
          </div>

          {/* Legal note */}
          <div style={{
            marginTop: 16, padding: "12px 16px", borderRadius: 9,
            background: C.blueBg, border: `1px solid ${C.blueBorder}`,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.65 }}>
              <strong style={{ color: C.blue }}>Rechtliche Absicherung:</strong>{" "}
              Ab dem 28. Juni 2025 sind alle kommerziellen Websites nach dem BFSG verpflichtet,
              WCAG 2.1 AA zu erfüllen. Deine Website ist vollständig konform und damit rechtlich abgesichert.
            </p>
          </div>
        </div>

        {/* ══ ACTIVITY SUMMARY ══ */}
        <div style={{ padding: "24px 40px", borderBottom: `1px solid ${C.divider}` }}>
          <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Aktivitäten im {r.period}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: `${r.scansThisMonth} automatisierte Scans`,  color: C.blue,  bg: C.blueBg,  border: C.blueBorder },
              { label: `${r.closedIssues} Probleme behoben`,         color: C.green, bg: C.greenBg, border: C.greenBorder },
              { label: `${r.openIssues} offene Probleme`,            color: r.openIssues > 0 ? C.amber : C.green, bg: r.openIssues > 0 ? C.amberBg : C.greenBg, border: r.openIssues > 0 ? "#FDE68A" : C.greenBorder },
              { label: "100% Uptime",                                 color: C.green, bg: C.greenBg, border: C.greenBorder },
            ].map((pill) => (
              <span key={pill.label} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                color: pill.color, background: pill.bg, border: `1px solid ${pill.border}`,
              }}>
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <div style={{
          padding: "20px 40px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          background: C.divider,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: C.textMuted }}>
            Erstellt von <strong style={{ color: C.textSub }}>{r.agency}</strong> · {r.period} · Automatisch generiert
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              background: "linear-gradient(135deg, #007BFF, #0057b8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.textSub }}>
              Website<span style={{ color: "#007BFF" }}>Fix</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
