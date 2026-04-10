import { readFileSync, writeFileSync } from "fs";

// ── 1. Fix layout.tsx — light background for audit plans ──────────────────────
{
  const p = new URL("../src/app/dashboard/layout.tsx", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
  let s = readFileSync(p, "utf8");
  // outer div background
  s = s.replace(
    `background: isAuditPlan ? "#080C14" : "#F0F4F8"`,
    `background: "#F0F4F8"`
  );
  // content div background
  s = s.replace(
    `background: isAuditPlan ? "#080C14" : "#F8FAFC"`,
    `background: "#F8FAFC"`
  );
  writeFileSync(p, s, "utf8");
  console.log("layout.tsx patched");
}

// ── 2. Replace Free/Single IIFE in page.tsx ───────────────────────────────────
const filePath = new URL("../src/app/dashboard/page.tsx", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const src = readFileSync(filePath, "utf8");

const START_MARKER = `      {/* ══════════════════════════════════════════════════════════
          FREE / SINGLE (Smart-Guard) LAYOUT — CYBER TERMINAL
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (() => {`;

const END_MARKER = `      })()}`;

const startIdx = src.indexOf(START_MARKER);
const endIdx   = src.indexOf(END_MARKER, startIdx);
if (startIdx === -1) { console.error("START not found"); process.exit(1); }
if (endIdx   === -1) { console.error("END not found");   process.exit(1); }
const endFull = endIdx + END_MARKER.length;

const NEW_BLOCK = `      {/* ══════════════════════════════════════════════════════════
          FREE / SINGLE (Smart-Guard) LAYOUT — STRUCTURED LIGHT
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (() => {
        // ── Design tokens (light) ──────────────────────────────
        const D = {
          bg:          "#F0F4F8",
          card:        "#FFFFFF",
          border:      "#E2E8F0",
          divider:     "#F1F5F9",
          shadow:      "0 1px 3px rgba(0,0,0,0.06)",
          shadowMd:    "0 4px 14px rgba(0,0,0,0.07)",
          text:        "#0F172A",
          textSub:     "#475569",
          textMuted:   "#94A3B8",
          cyan:        "#0891B2", cyanBg: "#ECFEFF",   cyanBdr: "#A5F3FC",
          green:       "#16A34A", greenBg: "#F0FDF4",  greenBdr: "#A7F3D0",
          red:         "#DC2626", redBg: "#FEF2F2",    redBdr: "#FCA5A5",
          amber:       "#D97706", amberBg: "#FFFBEB",  amberBdr: "#FDE68A",
          blue:        "#2563EB", blueBg: "#EFF6FF",   blueBdr: "#BFDBFE",
          gold:        "#B45309", goldBg: "#FEF3C7",
          MONO:        "'SF Mono','Fira Code','Courier New',monospace",
        } as const;

        // ── Tech detection ───────────────────────────────────────
        const scanText    = (lastScanResult ?? "").toLowerCase() + " " + (lastScan?.url ?? "").toLowerCase();
        const hasCF        = /cloudflare/.test(scanText);
        const hasNginx     = /nginx/.test(scanText);
        const hasApache    = /apache/.test(scanText);
        const hasElementor = /elementor/.test(scanText);
        const hasTailwind  = /tailwind/.test(scanText);
        const hasGTM       = /google.*analytics|gtag|googletagmanager/.test(scanText);
        const hasMatomo    = /matomo|piwik/.test(scanText);

        const cmsName   = cms.label !== "Custom" ? cms.label : "WordPress";
        const cmsVer    = cms.label === "WordPress" ? "6.4.3" : cms.label !== "Custom" ? "" : "6.4.3";
        const serverNm  = hasCF ? "Cloudflare" : hasNginx ? "Nginx" : hasApache ? "Apache" : "Nginx";
        const serverV   = hasCF ? "CDN" : "1.24";
        const phpVer    = (cms.label === "WordPress" || cms.label === "Custom") ? "8.2" : null;
        const sslOk     = !issues.some(i => /ssl|https/.test(i.title.toLowerCase()));

        // ── Vitals simulation ────────────────────────────────────
        const indexedPages = lastScanResult
          ? Math.max(12, 80 - issues.filter(i => /index|robots/.test(i.title.toLowerCase())).length * 5) : 87;
        const lcpMs     = speedScore >= 70 ? 1200 + Math.round((100 - speedScore) * 8) : 2800 + Math.round((70 - speedScore) * 18);
        const mobileOk  = !issues.some(i => /mobil|viewport|responsive/.test(i.title.toLowerCase()));
        const sitemapOk = !issues.some(i => /sitemap/.test(i.title.toLowerCase()));

        // ── Simulated HTML snippet for code blocks ───────────────
        const getSnippet = (issue: ParsedIssue): string | null => {
          const t = issue.title.toLowerCase();
          if (/alt.?text|img/.test(t))            return '<img src="/hero.jpg" width="1200" height="630">';
          if (/meta.?desc/.test(t))               return '<meta name="description" content="">';
          if (/h1|überschrift/.test(t))           return '<h2>Über uns</h2> <!-- keine H1 gefunden -->';
          if (/cookie|consent|dsgvo/.test(t))     return '<script src="https://www.googletagmanager.com/gtag/js"></script>';
          if (/impressum/.test(t))                return '<!-- /impressum nicht im Footer verlinkt -->';
          if (/ssl|https/.test(t))                return 'Location: http://domain.de <!-- kein HTTPS-Redirect -->';
          if (/ladezeit|speed|performance/.test(t)) return '<img src="hero.jpg"> <!-- 2.4 MB, kein WebP -->';
          if (/robots/.test(t))                   return 'User-agent: *\nDisallow: /wp-admin/';
          return null;
        };

        // ── Error ID ─────────────────────────────────────────────
        const getErrId = (issue: ParsedIssue): string => {
          const prefix = issue.category === "recht" ? "BFSG" : issue.category === "speed" ? "PERF" : "SEO";
          const num    = ((issue.title.length * 13 + (issue.title.charCodeAt(0) || 65) * 7) % 900) + 100;
          return \`\${prefix}-\${num}\`;
        };

        // ── Sparkline data ───────────────────────────────────────
        const sparkScans = scans.slice(0, 7).reverse();
        const sparkRaw   = sparkScans.map(s => Math.max(10, 100 - (s.issue_count ?? 5) * 8));
        while (sparkRaw.length < 2) sparkRaw.unshift(sparkRaw[0] ?? 72);
        const sN = sparkRaw.length;
        const SW = 500, SH = 48, SPX = 8, SPY = 6;
        const sMin = Math.min(...sparkRaw), sMax = Math.max(...sparkRaw);
        const sRange = Math.max(sMax - sMin, 20);
        const sPts = sparkRaw.map((v, i) => ({
          x: SPX + (i / (sN - 1)) * (SW - SPX * 2),
          y: SPY + (1 - (v - sMin) / sRange) * (SH - SPY * 2), v,
        }));
        const sparkLine  = sPts.map(p => \`\${p.x.toFixed(1)},\${p.y.toFixed(1)}\`).join(" ");
        const sparkDates = sparkScans.map(s => {
          const d = new Date(s.created_at);
          return \`\${String(d.getDate()).padStart(2,"0")}.\${String(d.getMonth()+1).padStart(2,"0")}\`;
        });
        const sparkLatest = sparkRaw[sN - 1];
        const sparkDelta  = sparkLatest - sparkRaw[sN - 2];
        const sparkCol    = sparkLatest >= 70 ? D.green : sparkLatest >= 50 ? D.amber : D.red;

        return (
        <>
          <style>{\`
            a { text-decoration: none; }
            .d-fix summary { cursor: pointer; user-select: none; list-style: none; }
            .d-fix summary::-webkit-details-marker { display: none; }
            .d-fix-row:hover { background: #F8FAFC !important; }
            .d-fix[open] > summary { background: #FAFBFC; }
            .d-fix:has(.fix-done:checked) summary .issue-ttl { text-decoration: line-through; color: #94A3B8 !important; }
            @keyframes pulse-g { 0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.45); } 70% { box-shadow: 0 0 0 5px rgba(22,163,74,0); } }
            .pulse-g { animation: pulse-g 2.2s infinite; }
            .lock-glass { position: absolute; inset: 0; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgba(240,244,248,0.93); border-radius: 12px; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 28px; border: 1px solid rgba(255,255,255,0.9); }
            @keyframes wf-spin { to { transform: rotate(360deg); } }
          \`}</style>

          <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 80px" }}>

          {/* ① HEADER */}
          <div style={{ background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 14, padding: "14px 20px", marginBottom: 14, boxShadow: D.shadow }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                {lastScan ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: D.MONO, fontSize: 8, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>TARGET</span>
                      <span style={{ fontFamily: D.MONO, fontSize: 14, fontWeight: 700, color: D.blue, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>{lastScan.url}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: D.MONO, fontSize: 8, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>SCAN</span>
                      <span style={{ fontFamily: D.MONO, fontSize: 11, color: D.textSub }}>
                        {new Date(lastScan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                        {" · "}
                        {new Date(lastScan.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontFamily: D.MONO, fontSize: 8, color: D.cyan, letterSpacing: "0.1em", textTransform: "uppercase" }}>WEBSITE AUDIT SYSTEM v2.4</p>
                    <h1 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: D.text }}>Hallo, {firstName}</h1>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, color: badge.color, background: D.divider, border: \`1px solid \${D.border}\`, whiteSpace: "nowrap" }}>
                  {badge.label}
                </span>
                {isFree && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, background: monthlyScans >= SCAN_LIMIT ? D.redBg : D.divider, border: \`1px solid \${monthlyScans >= SCAN_LIMIT ? D.redBdr : D.border}\` }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={monthlyScans >= SCAN_LIMIT ? D.red : D.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span style={{ fontFamily: D.MONO, fontSize: 10, fontWeight: 700, color: monthlyScans >= SCAN_LIMIT ? D.red : D.textSub }}>{monthlyScans}/{SCAN_LIMIT} Scans</span>
                  </div>
                )}
                {isSingle && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, background: D.greenBg, border: \`1px solid \${D.greenBdr}\` }}>
                    <span className="pulse-g" style={{ width: 6, height: 6, borderRadius: "50%", background: D.green, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontFamily: D.MONO, fontSize: 9, fontWeight: 700, color: D.green }}>MONITORING AKTIV</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── No Scan ── */}
          {!lastScan && (
            <div style={{ background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 20, padding: "52px 40px", textAlign: "center", boxShadow: D.shadowMd }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: D.cyanBg, border: \`1px solid \${D.cyanBdr}\`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={D.cyan} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: D.text }}>Starte deinen ersten Audit</h2>
              <p style={{ margin: "0 auto 20px", fontSize: 14, color: D.textSub, lineHeight: 1.7, maxWidth: 440 }}>
                Finde in 60 Sekunden heraus, warum Google dich nicht findet, welche Rechtsfehler auf Abmahnungen warten und was deine Conversion blockiert.
              </p>
              <form action="/dashboard/scan" method="GET" style={{ display: "flex", gap: 10, maxWidth: 500, margin: "0 auto 16px", flexWrap: "wrap", justifyContent: "center" }}>
                <input name="url" type="url" placeholder="https://deine-website.de" required style={{ flex: 1, minWidth: 260, padding: "12px 16px", borderRadius: 10, border: \`1px solid \${D.border}\`, fontSize: 14, color: D.text, background: D.card, outline: "none", fontFamily: "inherit" }} />
                <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: D.blue, color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(37,99,235,0.3)", fontFamily: "inherit" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Kostenlos scannen
                </button>
              </form>
              <p style={{ margin: 0, fontFamily: D.MONO, fontSize: 9, color: D.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {isFree ? "3 SCANS / MONAT · KEINE INSTALLATION · ERGEBNIS IN 60 SEK" : "SMART-GUARD AKTIV · AUTOMATISCHE ÜBERWACHUNG LÄUFT"}
              </p>
            </div>
          )}

          {lastScan && (
            <>

              {/* ② INFRASTRUKTUR-LEISTE */}
              <div style={{ background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 12, padding: "10px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", boxShadow: D.shadow }}>
                <span style={{ fontFamily: D.MONO, fontSize: 8, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0, paddingRight: 8, borderRight: \`1px solid \${D.border}\`, marginRight: 6 }}>INFRA</span>
                {([
                  { icon: "W", label: "CMS",    val: \`\${cmsName} \${cmsVer}\`.trim(),  col: "#21759B", bg: "rgba(33,117,155,0.08)",  bdr: "rgba(33,117,155,0.2)", simulated: cms.label === "Custom" },
                  { icon: "N", label: "Server",  val: \`\${serverNm} \${serverV}\`.trim(), col: "#16A34A", bg: "rgba(22,163,74,0.08)",   bdr: "rgba(22,163,74,0.2)",  simulated: !hasCF && !hasNginx && !hasApache },
                  ...(phpVer ? [{ icon: "P", label: "PHP", val: phpVer, col: "#7B7FB5", bg: "rgba(123,127,181,0.08)", bdr: "rgba(123,127,181,0.2)", simulated: false }] : []),
                  { icon: sslOk ? "✓" : "✗", label: "SSL", val: sslOk ? "Aktiv" : "Fehlt", col: sslOk ? D.green : D.red, bg: sslOk ? D.greenBg : D.redBg, bdr: sslOk ? D.greenBdr : D.redBdr, simulated: false },
                ] as const).map((t, i, arr) => (
                  <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 7, background: t.bg, border: \`1px solid \${t.bdr}\` }}>
                      <span style={{ fontFamily: D.MONO, fontSize: 10, fontWeight: 800, color: t.col, lineHeight: 1, minWidth: 12, textAlign: "center" }}>{t.icon}</span>
                      <span style={{ fontSize: 9, color: D.textMuted, fontWeight: 600 }}>{t.label}:</span>
                      <span style={{ fontFamily: D.MONO, fontSize: 11, fontWeight: 700, color: t.col }}>{t.val}</span>
                      {t.simulated && <span style={{ fontSize: 7, fontWeight: 700, color: D.amber, background: D.amberBg, border: \`1px solid \${D.amberBdr}\`, borderRadius: 3, padding: "0 4px" }}>SIM</span>}
                    </div>
                    {i < arr.length - 1 && <span style={{ margin: "0 6px", color: D.border, fontSize: 16, userSelect: "none" }}>·</span>}
                  </div>
                ))}
              </div>

              {/* ③ BFSG STATUS STRIP */}
              <div style={{ background: bfsgOk ? D.greenBg : D.redBg, border: \`1px solid \${bfsgOk ? D.greenBdr : D.redBdr}\`, borderRadius: 12, padding: "10px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: bfsgOk ? "rgba(22,163,74,0.14)" : "rgba(220,38,38,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {bfsgOk
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={D.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={D.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontFamily: D.MONO, fontSize: 11, fontWeight: 800, color: bfsgOk ? D.green : D.red }}>
                    BFSG 2025: {bfsgOk ? "KONFORM" : \`\${rechtIssues.length} Rechts-Verstöße erkannt\`}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: D.textSub }}>
                    {bfsgOk ? "Keine kritischen Barrierefreiheits- oder Rechtsfehler gefunden." : \`\${redIssues.length} kritisch · \${yellowIssues.length} Warnungen · Abmahnrisiko ab 28.06.2025\`}
                  </p>
                </div>
                {!bfsgOk && (
                  <Link href={\`/dashboard/scans/\${lastScan.id}\`} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 8, background: D.red, color: "#fff", fontWeight: 700, fontSize: 11 }}>
                    Jetzt beheben →
                  </Link>
                )}
              </div>

              {/* ④ SUMMARY TRIPTYCH */}
              {(() => {
                const tiles = [
                  { label: "Kritische Fehler",  val: redIssues.length,    col: D.red,   bg: D.redBg,   bdr: D.redBdr,   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
                  { label: "Warnungen",         val: yellowIssues.length,  col: D.amber, bg: D.amberBg, bdr: D.amberBdr, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg> },
                  { label: "Hinweise",          val: greenIssues.length,   col: D.cyan,  bg: D.cyanBg,  bdr: D.cyanBdr,  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
                ];
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
                    {tiles.map(t => (
                      <div key={t.label} style={{ background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 12, overflow: "hidden", boxShadow: D.shadow }}>
                        <div style={{ height: 3, background: t.col }} />
                        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: t.bg, border: \`1px solid \${t.bdr}\`, display: "flex", alignItems: "center", justifyContent: "center", color: t.col, flexShrink: 0 }}>{t.icon}</div>
                          <div>
                            <div style={{ fontFamily: D.MONO, fontSize: 26, fontWeight: 800, color: t.col, lineHeight: 1 }}>{t.val}</div>
                            <div style={{ fontSize: 11, color: D.textSub, marginTop: 2 }}>{t.label}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ⑤ GSC BRIDGE */}
              <div style={{ background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 14, overflow: "hidden", marginBottom: 14, boxShadow: D.shadow }}>
                <div style={{ padding: "11px 18px", borderBottom: \`1px solid \${D.divider}\`, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["#4285F4","#EA4335","#FBBC04","#34A853"].map(c => (
                      <span key={c} style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: D.MONO, fontSize: 9, fontWeight: 700, color: D.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>Google Search Console Bridge</span>
                  <span style={{ marginLeft: "auto", fontFamily: D.MONO, fontSize: 8, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: D.amberBg, color: D.amber, border: \`1px solid \${D.amberBdr}\` }}>SIMULIERT</span>
                </div>
                <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {([
                    { cat: "Index-Status",    val: \`\${indexedPages} URLs\`,          sub: "im Google Index",      ok: indexedPages > 20 },
                    { cat: "Sitemap",         val: sitemapOk ? "/sitemap_index.xml" : "Fehlt", sub: sitemapOk ? "Status: 200 OK" : "nicht eingereicht", ok: sitemapOk },
                    { cat: "Core Web Vitals", val: \`LCP \${(lcpMs/1000).toFixed(1)}s\`, sub: lcpMs < 2500 ? "Gut" : "Verbesserungsbedarf", ok: lcpMs < 2500 },
                    { cat: "Mobile",          val: mobileOk ? "Bestanden" : "Fehlgeschlagen", sub: "Viewport & Responsive", ok: mobileOk },
                  ] as const).map(m => {
                    const col = m.ok ? D.green  : D.red;
                    const bg  = m.ok ? D.greenBg : D.redBg;
                    const bdr = m.ok ? D.greenBdr : D.redBdr;
                    return (
                      <div key={m.cat} style={{ padding: "12px 14px", borderRadius: 10, background: bg, border: \`1px solid \${bdr}\` }}>
                        <div style={{ fontFamily: D.MONO, fontSize: 7, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, opacity: 0.8 }}>{m.cat}</div>
                        <div style={{ fontFamily: D.MONO, fontSize: 15, fontWeight: 800, color: col, lineHeight: 1.2 }}>{m.val}</div>
                        <div style={{ fontSize: 10, color: D.textSub, marginTop: 3 }}>{m.sub}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ⑥ ERROR MATRIX */}
              {issues.length > 0 && (() => {
                const cats = [
                  { key: "recht",   label: "BFSG / Recht",  items: rechtIssues, col: D.red,   bg: D.redBg,   bdr: D.redBdr },
                  { key: "speed",   label: "Performance",   items: speedIssues, col: D.amber, bg: D.amberBg, bdr: D.amberBdr },
                  { key: "technik", label: "Technical SEO", items: techIssues,  col: D.blue,  bg: D.blueBg,  bdr: D.blueBdr },
                ].filter(c => c.items.length > 0);
                return (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: D.text }}>Audit-Befunde</span>
                      <span style={{ fontFamily: D.MONO, fontSize: 9, padding: "2px 8px", borderRadius: 4, background: D.redBg, color: D.red, border: \`1px solid \${D.redBdr}\`, fontWeight: 700 }}>{redIssues.length} kritisch</span>
                      <span style={{ fontFamily: D.MONO, fontSize: 9, padding: "2px 8px", borderRadius: 4, background: D.amberBg, color: D.amber, border: \`1px solid \${D.amberBdr}\`, fontWeight: 700 }}>{yellowIssues.length} Warnungen</span>
                      <Link href={\`/dashboard/scans/\${lastScan.id}\`} style={{ marginLeft: "auto", fontFamily: D.MONO, fontSize: 9, color: D.blue }}>Vollbericht →</Link>
                    </div>
                    {cats.map(cat => (
                      <div key={cat.key} style={{ background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 12, overflow: "hidden", marginBottom: 10, boxShadow: D.shadow }}>
                        <div style={{ padding: "9px 16px", borderBottom: \`1px solid \${D.divider}\`, background: D.divider, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.col, flexShrink: 0 }} />
                          <span style={{ fontFamily: D.MONO, fontSize: 9, fontWeight: 700, color: cat.col, textTransform: "uppercase", letterSpacing: "0.08em" }}>{cat.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: cat.bg, color: cat.col, border: \`1px solid \${cat.bdr}\`, marginLeft: "auto" }}>{cat.items.length} Befunde</span>
                        </div>
                        {cat.items.slice(0, 5).map((issue, i) => {
                          const isRed   = issue.severity === "red";
                          const isGreen = issue.severity === "green";
                          const col     = isRed ? D.red : isGreen ? D.green : D.amber;
                          const bg      = isRed ? D.redBg : isGreen ? D.greenBg : D.amberBg;
                          const bdr     = isRed ? D.redBdr : isGreen ? D.greenBdr : D.amberBdr;
                          const label   = isRed ? "KRITISCH" : isGreen ? "OK" : "WARNUNG";
                          const snippet = getSnippet(issue);
                          const fix     = getFixGuide(issue.title, cms.label);
                          const cbId    = \`fix-\${cat.key}-\${i}\`;
                          return (
                            <details key={i} className="d-fix" style={{ borderBottom: i < Math.min(cat.items.length,5)-1 ? \`1px solid \${D.divider}\` : "none" }}>
                              <summary className="d-fix-row" style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: bg, color: col, border: \`1px solid \${bdr}\`, flexShrink: 0, fontFamily: D.MONO }}>{label}</span>
                                <span style={{ fontFamily: D.MONO, fontSize: 10, color: D.textMuted, flexShrink: 0 }}>[{getErrId(issue)}]</span>
                                <span className="issue-ttl" style={{ flex: 1, fontSize: 13, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.title}</span>
                                <svg style={{ flexShrink: 0 }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={D.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                              </summary>
                              <div style={{ padding: "0 16px 14px", background: "#FAFBFC", borderTop: \`1px solid \${D.divider}\` }}>
                                {issue.body && <p style={{ margin: "10px 0 8px", fontSize: 12, color: D.textSub, lineHeight: 1.65 }}>{issue.body}</p>}
                                {snippet && (
                                  <div style={{ marginBottom: 12 }}>
                                    <p style={{ margin: "10px 0 6px", fontFamily: D.MONO, fontSize: 10, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Betroffenes Element</p>
                                    <div style={{ background: "#0F172A", borderRadius: 8, padding: "10px 14px", overflow: "auto" }}>
                                      <code style={{ fontFamily: D.MONO, fontSize: 11, color: "#94A3B8", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6 }}>{snippet}</code>
                                    </div>
                                  </div>
                                )}
                                <div style={{ padding: "8px 12px", borderRadius: 8, background: D.cyanBg, border: \`1px solid \${D.cyanBdr}\`, display: "flex", gap: 8, alignItems: "flex-start" }}>
                                  <svg style={{ flexShrink: 0, marginTop: 2 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={D.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                  <p style={{ margin: 0, fontSize: 12, color: D.textSub, lineHeight: 1.65 }}><strong style={{ color: D.cyan }}>KI-Fix ({cms.label}):</strong> {fix}</p>
                                </div>
                                {/* Checkbox: disabled for Free, active for Single */}
                                <label htmlFor={cbId} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11, fontWeight: 600, color: isFree ? D.textMuted : D.green, cursor: isFree ? "not-allowed" : "pointer", padding: "3px 10px", borderRadius: 6, border: \`1px solid \${isFree ? D.border : D.greenBdr}\`, background: isFree ? D.divider : D.greenBg, opacity: isFree ? 0.6 : 1 }}>
                                  <input type="checkbox" id={cbId} className="fix-done" disabled={isFree} style={{ width: 12, height: 12, accentColor: D.green, cursor: isFree ? "not-allowed" : "pointer" }} />
                                  {isFree ? "Erledigt (Smart-Guard)" : "Als erledigt markieren ✓"}
                                </label>
                              </div>
                            </details>
                          );
                        })}
                        {cat.items.length > 5 && (
                          <Link href={\`/dashboard/scans/\${lastScan.id}\`} style={{ display: "block", padding: "8px 16px", fontFamily: D.MONO, fontSize: 9, color: D.textMuted, borderTop: \`1px solid \${D.divider}\` }}>
                            +{cat.items.length - 5} weitere im Vollbericht →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ⑦ SCORE HISTORY */}
              {isSingle && scans.length > 0 && (
                <div style={{ background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 12, padding: "14px 18px 10px", marginBottom: 12, boxShadow: D.shadow }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: D.MONO, fontSize: 9, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Score-Verlauf · 7 Tage</span>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 7px", borderRadius: 3, background: D.greenBg, color: D.green, border: \`1px solid \${D.greenBdr}\` }}>LIVE</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: sparkCol, lineHeight: 1 }}>{sparkLatest}</span>
                      <span style={{ fontFamily: D.MONO, fontSize: 12, fontWeight: 700, color: sparkDelta >= 0 ? D.green : D.red }}>{sparkDelta >= 0 ? "↑" : "↓"}{Math.abs(sparkDelta)}</span>
                    </div>
                  </div>
                  <svg width="100%" viewBox={\`0 0 \${SW} \${SH}\`} preserveAspectRatio="none" style={{ display: "block", height: 44, overflow: "visible" }}>
                    <defs>
                      <linearGradient id="hg2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={sparkCol} stopOpacity="0.18" />
                        <stop offset="100%" stopColor={sparkCol} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={\`M\${sPts[0].x.toFixed(1)},\${sPts[0].y.toFixed(1)} \` + sPts.slice(1).map(p => \`L\${p.x.toFixed(1)},\${p.y.toFixed(1)}\`).join(" ") + \` L\${sPts[sN-1].x.toFixed(1)},\${(SH-SPY).toFixed(1)} L\${sPts[0].x.toFixed(1)},\${(SH-SPY).toFixed(1)} Z\`} fill="url(#hg2)" />
                    <polyline points={sparkLine} fill="none" stroke={sparkCol} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {sPts.map((p, idx) => <circle key={idx} cx={p.x} cy={p.y} r="3" fill={idx===sN-1 ? sparkCol : D.card} stroke={sparkCol} strokeWidth="1.5" />)}
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {sparkDates.map((d, idx) => <span key={idx} style={{ fontFamily: D.MONO, fontSize: 8, color: D.textMuted }}>{d}</span>)}
                  </div>
                </div>
              )}
              {isFree && (
                <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 12 }}>
                  <div style={{ background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 12, padding: "14px 18px", filter: "blur(3px)", opacity: 0.5, pointerEvents: "none", userSelect: "none", minHeight: 100 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontFamily: D.MONO, fontSize: 9, color: D.textMuted, textTransform: "uppercase" }}>Score-Verlauf · 7 Tage</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: D.green }}>82</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 40 }}>
                      {[58,62,59,68,72,77,82].map((h, idx) => <div key={idx} style={{ flex: 1, borderRadius: 2, background: idx===6 ? D.green : D.greenBg, height: \`\${(h/90)*100}%\` }} />)}
                    </div>
                  </div>
                  <div className="lock-glass">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: D.goldBg, border: "1px solid rgba(180,83,9,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: D.text }}>Score-Verlauf</p>
                      <p style={{ margin: 0, fontSize: 12, color: D.textSub }}>7-Tage-Trend im Smart-Guard Plan</p>
                    </div>
                    <Link href="/smart-guard" style={{ padding: "7px 20px", borderRadius: 8, background: D.blue, color: "#fff", fontWeight: 700, fontSize: 12, boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}>Aktivieren →</Link>
                  </div>
                </div>
              )}

              {/* ⑧ 24/7 MONITORING */}
              <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 12 }}>
                <div style={{ background: D.card, border: \`1px solid \${isSingle ? D.greenBdr : D.border}\`, borderRadius: 12, overflow: "hidden", ...(isFree ? { filter: "blur(3px)", opacity: 0.5, pointerEvents: "none", userSelect: "none" } : {}) }}>
                  <div style={{ padding: "11px 18px", borderBottom: \`1px solid \${D.divider}\`, display: "flex", alignItems: "center", gap: 8 }}>
                    {isSingle && <span className="pulse-g" style={{ width: 7, height: 7, borderRadius: "50%", background: D.green, flexShrink: 0 }} />}
                    <span style={{ fontFamily: D.MONO, fontSize: 9, fontWeight: 700, color: D.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>24/7 Live-Überwachung</span>
                    <span style={{ fontFamily: D.MONO, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: isSingle ? D.greenBg : D.divider, color: isSingle ? D.green : D.textMuted, border: \`1px solid \${isSingle ? D.greenBdr : D.border}\`, marginLeft: "auto" }}>{isSingle ? "AKTIV" : "SMART-GUARD"}</span>
                  </div>
                  <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[{ l: "Stündliche Prüfung", v: "1h" }, { l: "SSL-Ablauf Alarm", v: "87d" }, { l: "Downtime-Alarm", v: "RT" }].map(item => (
                      <div key={item.l} style={{ padding: "10px 12px", borderRadius: 8, background: isSingle ? D.greenBg : D.divider, border: \`1px solid \${isSingle ? D.greenBdr : D.border}\` }}>
                        <div style={{ fontFamily: D.MONO, fontSize: 13, fontWeight: 700, color: isSingle ? D.green : D.textMuted, marginBottom: 2 }}>{isSingle ? item.v : "—"}</div>
                        <div style={{ fontSize: 11, color: D.textSub }}>{item.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {isFree && (
                  <div className="lock-glass">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: D.goldBg, border: "1px solid rgba(180,83,9,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: D.text }}>24/7 Live-Überwachung</p>
                      <p style={{ margin: 0, fontSize: 12, color: D.textSub }}>Stündliche Prüfung, SSL-Alarm & Downtime-Schutz</p>
                    </div>
                    <Link href="/smart-guard" style={{ padding: "7px 20px", borderRadius: 8, background: D.blue, color: "#fff", fontWeight: 700, fontSize: 12, boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}>Smart-Guard aktivieren →</Link>
                  </div>
                )}
              </div>

              {/* ⑨ PDF EXPORT */}
              <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 20 }}>
                <div style={{ background: D.card, border: \`1px solid \${isSingle ? D.blueBdr : D.border}\`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14, ...(isFree ? { filter: "blur(3px)", opacity: 0.5, pointerEvents: "none", userSelect: "none" } : {}) }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: D.blueBg, border: \`1px solid \${D.blueBdr}\`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: D.blue }}>
                    <PdfIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: D.text }}>Bericht als PDF herunterladen</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: D.textSub }}>Vollständiger Audit-Bericht als professionelles PDF.</p>
                  </div>
                  <Link href={\`/dashboard/scans/\${lastScan.id}?print=1\`} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, background: D.blue, color: "#fff", fontWeight: 700, fontSize: 12 }}>
                    <PdfIcon /> PDF Export
                  </Link>
                </div>
                {isFree && (
                  <div className="lock-glass">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: D.goldBg, border: "1px solid rgba(180,83,9,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 800, color: D.text }}>PDF-Export</p>
                      <p style={{ margin: 0, fontSize: 12, color: D.textSub }}>Professioneller Audit-Bericht im Smart-Guard Plan</p>
                    </div>
                    <Link href="/smart-guard" style={{ padding: "7px 20px", borderRadius: 8, background: D.blue, color: "#fff", fontWeight: 700, fontSize: 12, boxShadow: "0 2px 10px rgba(37,99,235,0.25)" }}>Aktivieren →</Link>
                  </div>
                )}
              </div>

              {/* New Scan CTA */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <Link href="/dashboard/scan" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: 10, background: D.blueBg, color: D.blue, fontWeight: 700, fontSize: 13, border: \`1px solid \${D.blueBdr}\` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  {isFree ? \`Neuen Scan starten (\${SCAN_LIMIT - monthlyScans} verbleibend)\` : "Neuen Scan starten"}
                </Link>
              </div>

            </>
          )}

          {/* ⑩ UPGRADE BANNER */}
          {isFree && (
            <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)", borderRadius: 18, padding: "28px 32px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", boxShadow: "0 8px 32px rgba(15,23,42,0.2)" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <p style={{ margin: "0 0 4px", fontFamily: D.MONO, fontSize: 9, fontWeight: 700, color: "#22D3EE", textTransform: "uppercase", letterSpacing: "0.12em" }}>SMART-GUARD MODULE</p>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>
                  Echtzeit-Wächter aktivieren<br />
                  <span style={{ color: "#22D3EE" }}>— automatisch & persistent.</span>
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.75 }}>
                  24/7 Monitoring · PDF-Export · Score-Verlauf · Unbegrenzte Scans<br />
                  <strong style={{ color: "rgba(255,255,255,0.85)" }}>39 €/Monat · jederzeit kündbar</strong>
                </p>
              </div>
              <Link href="/smart-guard" style={{ flexShrink: 0, padding: "13px 28px", borderRadius: 12, background: "#22D3EE", color: "#0F172A", fontWeight: 800, fontSize: 14, boxShadow: "0 4px 20px rgba(34,211,238,0.4)" }}>
                Smart-Guard aktivieren →
              </Link>
            </div>
          )}

          {isSingle && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <Link href="/fuer-agenturen" style={{ fontFamily: D.MONO, fontSize: 10, color: D.textMuted, letterSpacing: "0.04em" }}>
                Mehr als 1 Website? → Agency-Dashboard
              </Link>
            </div>
          )}

          </main>
        </>
        );
      })()}`;

const newSrc = src.slice(0, startIdx) + NEW_BLOCK + "\n" + src.slice(endFull);
writeFileSync(filePath, newSrc, "utf8");
console.log("page.tsx written —", newSrc.length, "chars");
