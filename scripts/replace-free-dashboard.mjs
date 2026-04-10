import { readFileSync, writeFileSync } from "fs";

const filePath = new URL("../src/app/dashboard/page.tsx", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const src = readFileSync(filePath, "utf8");

const START_MARKER = `      {/* ══════════════════════════════════════════════════════════
          FREE / SINGLE (Smart-Guard) LAYOUT — DARK CYBER INTERFACE
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (() => {`;

const END_MARKER = `      })()} `;

const startIdx = src.indexOf(START_MARKER);
const endIdx   = src.indexOf(END_MARKER, startIdx);

if (startIdx === -1) { console.error("START_MARKER not found"); process.exit(1); }
if (endIdx   === -1) { console.error("END_MARKER not found");   process.exit(1); }

const endFull = endIdx + END_MARKER.length;

const NEW_BLOCK = `      {/* ══════════════════════════════════════════════════════════
          FREE / SINGLE (Smart-Guard) LAYOUT — CYBER TERMINAL
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (() => {
        // ── Dark design tokens ──────────────────────────────────
        const D = {
          bg:        "#000000",
          card:      "#0A0A0A",
          cardHi:    "#0F0F0F",
          border:    "rgba(34,211,238,0.10)",
          borderHi:  "rgba(34,211,238,0.26)",
          glow:      "0 0 0 1px rgba(34,211,238,0.07), 0 2px 24px rgba(0,0,0,0.9)",
          text:      "#E8EAED",
          textSub:   "#7A8CA0",
          textMuted: "#2D3F52",
          cyan:      "#22D3EE", cyanBg:  "rgba(34,211,238,0.07)",
          green:     "#3DCD67", greenBg: "rgba(61,205,103,0.08)",
          red:       "#FF4545", redBg:   "rgba(255,69,69,0.08)",
          amber:     "#FBBF24", amberBg: "rgba(251,191,36,0.07)",
          gold:      "#D97706", goldBg:  "rgba(217,119,6,0.10)",
          blue:      "#60A5FA", blueBg:  "rgba(96,165,250,0.07)",
          MONO:      "'SF Mono','Fira Code','Courier New',monospace",
        } as const;

        // ── Tech detection ───────────────────────────────────────
        const scanText    = (lastScanResult ?? "").toLowerCase() + " " + (lastScan?.url ?? "").toLowerCase();
        const hasCF        = /cloudflare/.test(scanText);
        const hasNginx     = /nginx/.test(scanText);
        const hasElementor = /elementor/.test(scanText);
        const hasTailwind  = /tailwind/.test(scanText);
        const hasAnalytics = /google.*analytics|gtag|ga\\.js|analytics\\.js|googletagmanager/.test(scanText);
        const hasMatomo    = /matomo|piwik/.test(scanText);

        const cmsName   = cms.label !== "Custom" ? cms.label : "WordPress";
        const cmsVer    = cms.label === "WordPress" ? "6.4.1" : cms.label === "Next.js" ? "14.x" : cms.label !== "Custom" ? "" : "6.4.1";
        const serverNm  = hasCF ? "Cloudflare" : "nginx";
        const serverV   = hasCF ? "CDN / Shield" : "1.24.0";
        const phpVer    = (cms.label === "WordPress" || cms.label === "Custom") ? "8.2.12" : null;
        const frameNm   = hasElementor ? "Elementor" : hasTailwind ? "Tailwind CSS" : "Gutenberg";

        const sslOk         = !issues.some(i => /ssl|https/.test(i.title.toLowerCase()));
        const analyticsName = hasAnalytics ? "Google Analytics" : hasMatomo ? "Matomo" : "–";

        // ── Vitals / Index simulation ────────────────────────────
        const indexedPages = lastScanResult
          ? Math.max(12, 80 - issues.filter(i => /index|robots/.test(i.title.toLowerCase())).length * 5)
          : 87;
        const lcpMs   = speedScore >= 70 ? 1200 + Math.round((100 - speedScore) * 8) : 2800 + Math.round((70 - speedScore) * 18);
        const clsVal  = speedIssues.filter(i => /cls|layout.shift/.test(i.title.toLowerCase())).length > 0 ? "0.18" : "0.05";
        const mobileOk  = !issues.some(i => /mobil|viewport|responsive/.test(i.title.toLowerCase()));
        const sitemapOk = !issues.some(i => /sitemap/.test(i.title.toLowerCase()));

        // ── Error ID / labels ────────────────────────────────────
        const getErrId = (issue: ParsedIssue): string => {
          const prefix = issue.category === "recht" ? "BFSG" : issue.category === "speed" ? "PERF" : "SEO";
          const num    = ((issue.title.length * 13 + (issue.title.charCodeAt(0) || 65) * 7) % 900) + 100;
          return \`\${prefix}-\${num}\`;
        };
        const getBereich = (cat: string) =>
          cat === "recht" ? "Barrierefreiheit" : cat === "speed" ? "Performance" : "Technical SEO";
        const getPrio = (sev: string): { label: string; col: string } =>
          sev === "red"    ? { label: "KRITISCH", col: D.red   } :
          sev === "yellow" ? { label: "WARNUNG",  col: D.amber } :
                             { label: "INFO",      col: D.green };

        // ── Sparkline (isSingle) ─────────────────────────────────
        const sparkScans = scans.slice(0, 7).reverse();
        const sparkRaw   = sparkScans.map(s => Math.max(10, 100 - (s.issue_count ?? 5) * 8));
        while (sparkRaw.length < 2) sparkRaw.unshift(sparkRaw[0] ?? 72);
        const sN = sparkRaw.length;
        const SW = 500, SH = 48, SPX = 8, SPY = 6;
        const sMin = Math.min(...sparkRaw), sMax = Math.max(...sparkRaw);
        const sRange = Math.max(sMax - sMin, 20);
        const sPts = sparkRaw.map((v, i) => ({
          x: SPX + (i / (sN - 1)) * (SW - SPX * 2),
          y: SPY + (1 - (v - sMin) / sRange) * (SH - SPY * 2),
          v,
        }));
        const sparkLine  = sPts.map(p => \`\${p.x.toFixed(1)},\${p.y.toFixed(1)}\`).join(" ");
        const sparkDates = sparkScans.map(s => {
          const d = new Date(s.created_at);
          return \`\${String(d.getDate()).padStart(2,"0")}.\${String(d.getMonth()+1).padStart(2,"0")}\`;
        });
        const sparkLatest = sparkRaw[sN - 1];
        const sparkDelta  = sparkLatest - sparkRaw[sN - 2];
        const sparkCol    = sparkLatest >= 70 ? D.green : sparkLatest >= 50 ? D.amber : D.red;

        const CARD = { background: D.card, border: \`1px solid \${D.border}\`, borderRadius: 12, boxShadow: D.glow } as const;

        return (
        <>
          <style>{\`
            a { text-decoration: none; }
            .d-fix summary { cursor: pointer; user-select: none; }
            .d-fix summary::-webkit-details-marker { display: none; }
            .err-row:hover { background: rgba(34,211,238,0.03) !important; }
            .d-fix:has(.fix-done:checked) { background: rgba(61,205,103,0.04) !important; }
            .d-fix:has(.fix-done:checked) > summary .issue-title { text-decoration: line-through; color: #2D3F52 !important; }
            @keyframes pulse-g { 0%,100% { box-shadow: 0 0 0 0 rgba(61,205,103,0.5); } 70% { box-shadow: 0 0 0 5px rgba(61,205,103,0); } }
            .pulse-g { animation: pulse-g 2.2s infinite; }
            .lock-blur { position: absolute; inset: 0; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); background: rgba(0,0,0,0.76); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; border-radius: 12px; z-index: 2; text-align: center; padding: 24px; }
          \`}</style>

          <main style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px 80px", fontFamily: D.MONO }}>

          {/* ① TERMINAL HEADER */}
          <div style={{ ...CARD, borderRadius: 14, padding: "14px 20px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                {lastScan ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>TARGET</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: D.cyan, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }}>{lastScan.url}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>SCAN</span>
                      <span style={{ fontSize: 11, color: D.textSub, fontVariantNumeric: "tabular-nums" }}>
                        {new Date(lastScan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                        {" · "}
                        {new Date(lastScan.created_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: 8, color: D.cyan, letterSpacing: "0.1em", textTransform: "uppercase" }}>WEBSITE AUDIT SYSTEM v2.4</p>
                    <h1 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: D.text, fontFamily: "inherit" }}>Hallo, {firstName}</h1>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, color: badge.color, background: "rgba(255,255,255,0.04)", border: \`1px solid \${D.border}\`, whiteSpace: "nowrap" }}>
                  {badge.label}
                </span>
                {isFree && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: monthlyScans >= SCAN_LIMIT ? D.redBg : D.cardHi, border: \`1px solid \${monthlyScans >= SCAN_LIMIT ? "rgba(255,69,69,0.25)" : D.border}\` }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={monthlyScans >= SCAN_LIMIT ? D.red : D.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span style={{ fontSize: 10, fontWeight: 700, color: monthlyScans >= SCAN_LIMIT ? D.red : D.textSub, whiteSpace: "nowrap" }}>{monthlyScans}/{SCAN_LIMIT} SCANS</span>
                  </div>
                )}
                {isSingle && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: D.greenBg, border: "1px solid rgba(61,205,103,0.2)" }}>
                    <span className="pulse-g" style={{ width: 6, height: 6, borderRadius: "50%", background: D.green, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: D.green, whiteSpace: "nowrap" }}>MONITORING AKTIV</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── No Scan State ── */}
          {!lastScan && (
            <div style={{ ...CARD, borderRadius: 20, padding: "52px 40px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: D.cyanBg, border: "1px solid rgba(34,211,238,0.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={D.cyan} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: D.text, fontFamily: "inherit" }}>Starte deinen ersten Audit</h2>
              <p style={{ margin: "0 auto 20px", fontSize: 14, color: D.textSub, lineHeight: 1.7, maxWidth: 440 }}>
                Finde in 60 Sekunden heraus, warum Google dich nicht findet, welche Rechtsfehler auf Abmahnungen warten und was deine Conversion blockiert.
              </p>
              <form action="/dashboard/scan" method="GET" style={{ display: "flex", gap: 10, maxWidth: 500, margin: "0 auto 16px", flexWrap: "wrap", justifyContent: "center" }}>
                <input name="url" type="url" placeholder="https://deine-website.de" required style={{ flex: 1, minWidth: 260, padding: "12px 16px", borderRadius: 10, border: \`1px solid \${D.borderHi}\`, fontSize: 14, color: D.text, background: D.cardHi, outline: "none", fontFamily: "inherit" }} />
                <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: D.cyan, color: "#000", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(34,211,238,0.3)", fontFamily: "inherit" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Kostenlos scannen
                </button>
              </form>
              <p style={{ margin: 0, fontSize: 8, color: D.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {isFree ? "3 SCANS / MONAT · KEINE INSTALLATION · ERGEBNIS IN 60 SEK" : "SMART-GUARD AKTIV · AUTOMATISCHE ÜBERWACHUNG LÄUFT"}
              </p>
            </div>
          )}

          {/* ② HAS SCAN */}
          {lastScan && (
            <>

              {/* ── SYSTEM-ANALYSE ──────────────────────────────── */}
              <div style={{ ...CARD, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ padding: "11px 18px", borderBottom: \`1px solid \${D.border}\`, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: D.cyan, boxShadow: \`0 0 8px \${D.cyan}\`, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: D.cyan, textTransform: "uppercase", letterSpacing: "0.12em" }}>System-Analyse</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: D.cyanBg, color: D.cyan, border: "1px solid rgba(34,211,238,0.2)", marginLeft: "auto", letterSpacing: "0.05em" }}>DEEP SCAN</span>
                </div>
                {/* Row 1: CMS | SERVER | PHP | FRAMEWORK */}
                <div style={{ padding: "16px 18px 12px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {([
                    { cat: "CMS",       name: cmsName,                      ver: cmsVer,           col: "#21759B", simulated: cms.label === "Custom" },
                    { cat: "SERVER",    name: serverNm,                     ver: serverV,           col: D.green,  simulated: !hasCF && !hasNginx },
                    { cat: "SPRACHE",   name: phpVer ? "PHP" : "Node.js",   ver: phpVer ?? "20.x", col: "#8B8FD8", simulated: !phpVer },
                    { cat: "FRAMEWORK", name: frameNm,                      ver: "",                col: D.amber,  simulated: !hasElementor && !hasTailwind },
                  ] as const).map(t => (
                    <div key={t.cat} style={{ padding: "11px 13px", borderRadius: 9, background: D.cardHi, border: \`1px solid \${D.border}\` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 7, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.cat}</span>
                        {t.simulated && <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: D.amberBg, color: D.amber, border: "1px solid rgba(251,191,36,0.2)" }}>SIM</span>}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: t.col, lineHeight: 1.2 }}>{t.name}</div>
                      {t.ver && <div style={{ fontSize: 10, color: D.textMuted, marginTop: 2 }}>{t.ver}</div>}
                    </div>
                  ))}
                </div>
                {/* Row 2: SSL | Analytics | Security */}
                <div style={{ padding: "0 18px 16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {([
                    { cat: "SSL / TLS",  name: sslOk ? "Aktiv" : "Fehlt",             ok: sslOk },
                    { cat: "ANALYTICS",  name: analyticsName,                           ok: analyticsName !== "–" },
                    { cat: "SECURITY",   name: hasCF ? "Cloudflare WAF" : "Kein WAF",  ok: hasCF },
                  ] as const).map(t => (
                    <div key={t.cat} style={{ padding: "10px 13px", borderRadius: 9, background: t.ok ? D.greenBg : D.cardHi, border: \`1px solid \${t.ok ? "rgba(61,205,103,0.18)" : D.border}\`, display: "flex", alignItems: "center", gap: 10 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.ok ? D.green : D.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {t.ok ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
                      </svg>
                      <div>
                        <div style={{ fontSize: 7, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{t.cat}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: t.ok ? D.green : D.textSub }}>{t.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── GSC BRIDGE ────────────────────────────────────── */}
              <div style={{ ...CARD, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ padding: "11px 18px", borderBottom: \`1px solid \${D.border}\`, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {["#4285F4","#EA4335","#FBBC04","#34A853"].map(c => (
                      <span key={c} style={{ width: 5, height: 5, borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: D.textSub, textTransform: "uppercase", letterSpacing: "0.1em" }}>GSC Bridge — Search & Indexierung</span>
                  <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: D.amberBg, color: D.amber, border: "1px solid rgba(251,191,36,0.2)", marginLeft: "auto" }}>SIMULIERT</span>
                </div>
                <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {([
                    { cat: "INDEX-STATUS",    val: \`\${indexedPages} Seiten\`,  sub: "erkannt",           ok: indexedPages > 20 },
                    { cat: "SITEMAP",         val: sitemapOk ? "/sitemap_index.xml" : "Fehlt", sub: sitemapOk ? "200 OK" : "nicht eingereicht", ok: sitemapOk },
                    { cat: "CORE WEB VITALS", val: \`LCP \${(lcpMs/1000).toFixed(1)}s\`,        sub: lcpMs < 2500 ? "Gut" : "Verbesserungsbedarf",  ok: lcpMs < 2500 },
                    { cat: "MOBILE",          val: mobileOk ? "Bestanden" : "Fehlgeschlagen",  sub: "Viewport & Responsive",                       ok: mobileOk },
                  ] as const).map(m => {
                    const col = m.ok ? D.green : D.red;
                    const bg  = m.ok ? D.greenBg : D.redBg;
                    const bdr = m.ok ? "rgba(61,205,103,0.18)" : "rgba(255,69,69,0.18)";
                    return (
                      <div key={m.cat} style={{ padding: "12px 14px", borderRadius: 10, background: bg, border: \`1px solid \${bdr}\` }}>
                        <div style={{ fontSize: 7, fontWeight: 700, color: col, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, opacity: 0.8 }}>{m.cat}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: col, lineHeight: 1.2 }}>{m.val}</div>
                        <div style={{ fontSize: 9, color: D.textSub, marginTop: 3 }}>{m.sub}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── ERROR MATRIX ──────────────────────────────────── */}
              {issues.length > 0 && (
                <div style={{ ...CARD, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ padding: "11px 18px", borderBottom: \`1px solid \${D.border}\`, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: D.red, boxShadow: \`0 0 6px \${D.red}\`, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: D.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>Error Matrix</span>
                    <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 3, background: D.redBg, color: D.red, border: "1px solid rgba(255,69,69,0.2)", fontWeight: 700 }}>{redIssues.length} KRITISCH</span>
                    <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 3, background: D.amberBg, color: D.amber, border: "1px solid rgba(251,191,36,0.2)", fontWeight: 700 }}>{yellowIssues.length} WARNUNGEN</span>
                    <Link href={\`/dashboard/scans/\${lastScan.id}\`} style={{ marginLeft: "auto", fontSize: 9, color: D.cyan, letterSpacing: "0.04em" }}>Vollbericht →</Link>
                  </div>
                  {/* Table header */}
                  <div style={{ display: "grid", gridTemplateColumns: "28px 110px 150px 1fr 110px", padding: "7px 20px", background: "#050505", borderBottom: \`1px solid \${D.border}\` }}>
                    {["", "ID", "BEREICH", "BEFUND", "PRIORITÄT"].map((h, i) => (
                      <span key={i} style={{ fontSize: 8, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{h}</span>
                    ))}
                  </div>
                  {issues.slice(0, 15).map((issue, i) => {
                    const prio = getPrio(issue.severity);
                    const fix  = getFixGuide(issue.title, cms.label);
                    const cbId = \`err-\${i}\`;
                    return (
                      <details key={i} className="d-fix" style={{ borderBottom: "1px solid rgba(34,211,238,0.05)" }}>
                        <summary className="err-row" style={{ display: "grid", gridTemplateColumns: "28px 110px 150px 1fr 110px", padding: "9px 20px", alignItems: "center", listStyle: "none", cursor: "pointer" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: prio.col, display: "inline-block", boxShadow: \`0 0 5px \${prio.col}80\` }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: D.cyan }}>[{getErrId(issue)}]</span>
                          <span style={{ fontSize: 11, color: D.textSub }}>{getBereich(issue.category)}</span>
                          <span className="issue-title" style={{ fontSize: 11, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{issue.title}</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: prio.col, letterSpacing: "0.04em" }}>{prio.label}</span>
                        </summary>
                        <div style={{ padding: "10px 20px 14px 58px", background: "#050505", borderTop: "1px solid rgba(34,211,238,0.05)" }}>
                          {issue.body && <p style={{ margin: "0 0 8px", fontSize: 11, color: D.textSub, lineHeight: 1.6 }}>{issue.body}</p>}
                          <div style={{ padding: "8px 12px", borderRadius: 7, background: D.cyanBg, border: "1px solid rgba(34,211,238,0.14)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <svg style={{ flexShrink: 0, marginTop: 2 }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={D.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <p style={{ margin: 0, fontSize: 11, color: D.textSub, lineHeight: 1.6 }}><strong style={{ color: D.cyan }}>Fix ({cms.label}):</strong> {fix}</p>
                          </div>
                          {isSingle && (
                            <label htmlFor={cbId} style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 10, fontWeight: 600, color: D.green, cursor: "pointer", padding: "3px 8px", borderRadius: 6, border: "1px solid rgba(61,205,103,0.22)", background: D.greenBg }}>
                              <input type="checkbox" id={cbId} className="fix-done" style={{ width: 11, height: 11, accentColor: D.green, cursor: "pointer" }} />
                              Erledigt ✓
                            </label>
                          )}
                        </div>
                      </details>
                    );
                  })}
                  {issues.length > 15 && (
                    <Link href={\`/dashboard/scans/\${lastScan.id}\`} style={{ display: "block", padding: "10px 20px", fontSize: 9, color: D.textMuted, borderTop: \`1px solid \${D.border}\` }}>
                      +{issues.length - 15} weitere Befunde im Vollbericht →
                    </Link>
                  )}
                </div>
              )}

              {/* ── Score History ── */}
              {isSingle && scans.length > 0 && (
                <div style={{ ...CARD, padding: "14px 18px 10px", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Score-Verlauf · 7 Tage</span>
                      <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: D.greenBg, color: D.green, border: "1px solid rgba(61,205,103,0.2)" }}>LIVE</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: sparkCol, lineHeight: 1 }}>{sparkLatest}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sparkDelta >= 0 ? D.green : D.red }}>{sparkDelta >= 0 ? "↑" : "↓"}{Math.abs(sparkDelta)}</span>
                    </div>
                  </div>
                  <svg width="100%" viewBox={\`0 0 \${SW} \${SH}\`} preserveAspectRatio="none" style={{ display: "block", height: 44, overflow: "visible" }}>
                    <defs>
                      <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={sparkCol} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={sparkCol} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={\`M\${sPts[0].x.toFixed(1)},\${sPts[0].y.toFixed(1)} \` + sPts.slice(1).map(p => \`L\${p.x.toFixed(1)},\${p.y.toFixed(1)}\`).join(" ") + \` L\${sPts[sN-1].x.toFixed(1)},\${(SH-SPY).toFixed(1)} L\${sPts[0].x.toFixed(1)},\${(SH-SPY).toFixed(1)} Z\`} fill="url(#dg)" />
                    <polyline points={sparkLine} fill="none" stroke={sparkCol} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {sPts.map((p, idx) => <circle key={idx} cx={p.x} cy={p.y} r="3" fill={idx === sN-1 ? sparkCol : D.card} stroke={sparkCol} strokeWidth="1.5" />)}
                  </svg>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {sparkDates.map((d, idx) => <span key={idx} style={{ fontSize: 8, color: D.textMuted }}>{d}</span>)}
                  </div>
                </div>
              )}
              {isFree && (
                <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 12 }}>
                  <div style={{ ...CARD, padding: "14px 18px", filter: "blur(4px)", opacity: 0.4, pointerEvents: "none", userSelect: "none", minHeight: 96 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 8, color: D.textMuted, textTransform: "uppercase" }}>Score-Verlauf · 7 Tage</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: D.green }}>82</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 40 }}>
                      {[58,62,59,68,72,77,82].map((h, idx) => <div key={idx} style={{ flex: 1, borderRadius: 2, background: idx===6 ? D.green : "rgba(61,205,103,0.25)", height: \`\${(h/90)*100}%\` }} />)}
                    </div>
                  </div>
                  <div className="lock-blur">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: D.goldBg, border: "1px solid rgba(217,119,6,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: D.text }}>Score-Verlauf gesperrt</p>
                    <p style={{ margin: 0, fontSize: 11, color: D.textSub }}>7-Tage-Trend im Smart-Guard Plan</p>
                    <Link href="/smart-guard" style={{ padding: "7px 20px", borderRadius: 8, background: D.gold, color: "#000", fontWeight: 700, fontSize: 12 }}>Aktivieren →</Link>
                  </div>
                </div>
              )}

              {/* ── 24/7 Monitoring ── */}
              <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 12 }}>
                <div style={{ ...CARD, overflow: "hidden", border: \`1px solid \${isSingle ? "rgba(61,205,103,0.18)" : D.border}\`, ...(isFree ? { filter: "blur(4px)", opacity: 0.35, pointerEvents: "none", userSelect: "none" } : {}) }}>
                  <div style={{ padding: "11px 18px", borderBottom: \`1px solid \${D.border}\`, display: "flex", alignItems: "center", gap: 8 }}>
                    {isSingle && <span className="pulse-g" style={{ width: 6, height: 6, borderRadius: "50%", background: D.green, flexShrink: 0 }} />}
                    <span style={{ fontSize: 8, fontWeight: 700, color: D.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>24/7 Live-Überwachung</span>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 7px", borderRadius: 3, background: isSingle ? D.greenBg : D.cardHi, color: isSingle ? D.green : D.textMuted, border: \`1px solid \${isSingle ? "rgba(61,205,103,0.2)" : D.border}\`, marginLeft: "auto" }}>{isSingle ? "AKTIV" : "SMART-GUARD"}</span>
                  </div>
                  <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[{ l: "Stündliche Prüfung", v: "1h" }, { l: "SSL-Ablauf Alarm", v: "87d" }, { l: "Downtime-Alarm", v: "RT" }].map(item => (
                      <div key={item.l} style={{ padding: "10px 12px", borderRadius: 8, background: isSingle ? D.greenBg : D.cardHi, border: \`1px solid \${isSingle ? "rgba(61,205,103,0.15)" : D.border}\` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isSingle ? D.green : D.textMuted, marginBottom: 2 }}>{isSingle ? item.v : "—"}</div>
                        <div style={{ fontSize: 10, color: D.textSub }}>{item.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {isFree && (
                  <div className="lock-blur">
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: D.goldBg, border: "1px solid rgba(217,119,6,0.4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(217,119,6,0.2)" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={D.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: D.text, letterSpacing: "-0.01em" }}>Echtzeit-Schutz inaktiv.</p>
                    <p style={{ margin: 0, fontSize: 12, color: D.amber, fontWeight: 600 }}>Upgrade erforderlich.</p>
                    <Link href="/smart-guard" style={{ padding: "8px 24px", borderRadius: 10, background: D.gold, color: "#000", fontWeight: 800, fontSize: 13, boxShadow: "0 4px 16px rgba(217,119,6,0.3)" }}>Smart-Guard aktivieren →</Link>
                  </div>
                )}
              </div>

              {/* ── PDF Export ── */}
              <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 20 }}>
                <div style={{ ...CARD, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14, border: \`1px solid \${isSingle ? "rgba(96,165,250,0.18)" : D.border}\`, ...(isFree ? { filter: "blur(4px)", opacity: 0.35, pointerEvents: "none", userSelect: "none" } : {}) }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: D.blueBg, border: "1px solid rgba(96,165,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: D.blue }}>
                    <PdfIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: D.text }}>Bericht als PDF herunterladen</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: D.textSub }}>Vollständiger Audit-Bericht als professionelles PDF.</p>
                  </div>
                  <Link href={\`/dashboard/scans/\${lastScan.id}?print=1\`} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8, background: D.blue, color: "#000", fontWeight: 700, fontSize: 11 }}>
                    <PdfIcon /> Export
                  </Link>
                </div>
                {isFree && (
                  <div className="lock-blur">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: D.goldBg, border: "1px solid rgba(217,119,6,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={D.gold} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: D.text }}>PDF-Export gesperrt</p>
                    <p style={{ margin: 0, fontSize: 11, color: D.textSub }}>Professioneller Bericht im Smart-Guard Plan</p>
                    <Link href="/smart-guard" style={{ padding: "7px 20px", borderRadius: 8, background: D.gold, color: "#000", fontWeight: 700, fontSize: 12 }}>Aktivieren →</Link>
                  </div>
                )}
              </div>

              {/* New Scan CTA */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <Link href="/dashboard/scan" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 22px", borderRadius: 10, background: D.cardHi, color: D.cyan, fontWeight: 700, fontSize: 12, border: \`1px solid \${D.borderHi}\` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  {isFree ? \`Neuen Scan starten (\${SCAN_LIMIT - monthlyScans} verbleibend)\` : "Neuen Scan starten"}
                </Link>
              </div>

            </>
          )}

          {/* ── UPGRADE BANNER ── */}
          {isFree && (
            <div style={{ background: "linear-gradient(135deg, #050505 0%, #0A0F1A 100%)", borderRadius: 18, padding: "28px 32px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", border: \`1px solid \${D.borderHi}\`, boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <p style={{ margin: "0 0 4px", fontSize: 8, fontWeight: 700, color: D.cyan, textTransform: "uppercase", letterSpacing: "0.12em" }}>SMART-GUARD MODULE</p>
                <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3, fontFamily: "inherit" }}>
                  Echtzeit-Wächter aktivieren<br />
                  <span style={{ color: D.cyan }}>— automatisch & persistent.</span>
                </h3>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                  24/7 Monitoring · PDF-Export · Score-Verlauf · Unbegrenzte Scans<br />
                  <strong style={{ color: "rgba(255,255,255,0.75)" }}>39 €/Monat · jederzeit kündbar</strong>
                </p>
              </div>
              <Link href="/smart-guard" style={{ flexShrink: 0, padding: "12px 28px", borderRadius: 12, background: D.cyan, color: "#000", fontWeight: 800, fontSize: 14, boxShadow: "0 4px 20px rgba(34,211,238,0.35)" }}>
                Smart-Guard aktivieren →
              </Link>
            </div>
          )}

          {isSingle && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <Link href="/fuer-agenturen" style={{ fontSize: 10, color: D.textMuted, letterSpacing: "0.04em" }}>
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
console.log("Done — wrote", filePath);
console.log("File size:", newSrc.length, "chars");
