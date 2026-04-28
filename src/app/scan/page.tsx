"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "../components/BrandLogo";
import MobileNav from "../components/MobileNav";
import NavAuthLink from "../components/nav-auth-link";
import SiteFooter from "../components/SiteFooter";
import { saveScanToStorage } from "@/lib/scan-storage";

// ── Types ────────────────────────────────────────────────────────────────────
type ScanPhase =
  | "idle"
  | "step1"         // Crawl startet
  | "step2"         // Sitemap / Link-Discovery
  | "step3"         // Technische Barrieren (crawl counter shown here)
  | "step4"         // KI-Diagnose
  | "done"
  | "error"
  | "not_wordpress"; // Seite erreichbar, aber kein WordPress erkannt

type ScanResult = {
  diagnose: string;
  pagesScanned: number;
};

const FREE_SCAN_KEY = "wf_free_scan_ts";
const FREE_SCAN_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 Stunden
const MAX_FREE_PAGES = 10;

// ── Progress steps data ───────────────────────────────────────────────────────
const STEPS: { phase: ScanPhase; label: string; sub?: string }[] = [
  { phase: "step1", label: "Startseite & Sub-Pages werden geladen…", sub: "Crawler verbindet sich mit der Zieldomain" },
  { phase: "step2", label: "Builder-Detection läuft",                 sub: "Elementor, Divi, Astra, WPBakery · DOM-Tiefe wird gemessen" },
  { phase: "step3", label: "WooCommerce & DSGVO-Check",              sub: "Shop-Performance, Cart-Fragments, Google Fonts, externe Embeds…" },
  { phase: "step4", label: "BFSG, SEO & KI-Befund-Aggregation",      sub: "Alt-Texte, Meta-Daten, Barrierefreiheit · Optimierungs-Plan wird erstellt" },
];

const PHASE_ORDER: ScanPhase[] = ["idle","step1","step2","step3","step4","done","error"];

// ── Benefit cards (footer) ────────────────────────────────────────────────────
const BENEFITS = [
  {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    label: "Mehrwert für Kunden",
    title: "Fertige Checkliste statt Rätselraten",
    desc: "Nutze die Reports als fertige Checkliste für deine Website-Projekte — sofort verständlich, sofort einsetzbar.",
  },
  {
    color: "#7aa6ff",
    bg: "rgba(122,166,255,0.08)",
    border: "rgba(122,166,255,0.2)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    label: "Schutz vor Abmahnungen",
    title: "BFSG 2025 — dokumentiert & nachweisbar",
    desc: "Dokumentiere die Barrierefreiheit deiner Seite gemäß BFSG 2025 — lückenlos und griffbereit für den Ernstfall.",
  },
  {
    color: "#c084fc",
    bg: "rgba(192,132,252,0.08)",
    border: "rgba(192,132,252,0.2)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    label: "Profi-Reports",
    title: "Dein Logo. Dein Bericht. Ein Klick.",
    desc: "Erstelle mit einem Klick verständliche PDF-Auswertungen mit deinem eigenen Logo — ohne Aufwand, professionell.",
  },
];

// ── Diagnose renderer ─────────────────────────────────────────────────────────
function renderDiagnose(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return (
      <h3 key={i} style={{ fontSize: 16, margin: "22px 0 8px", fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8 }}>
        {line.replace("## ", "")}
      </h3>
    );
    if (line.startsWith("**🔴")) return <div key={i} style={{ margin: "10px 0 3px", fontWeight: 600, color: "#ff6b6b", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟡")) return <div key={i} style={{ margin: "10px 0 3px", fontWeight: 600, color: "#ffd93d", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟢")) return <div key={i} style={{ margin: "10px 0 3px", fontWeight: 600, color: "#8df3d3", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.match(/^\d+\./)) return <div key={i} style={{ margin: "4px 0", paddingLeft: 16, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.7 }}>{line}</div>;
    if (line.startsWith("# ") || line.trim() === "") return <div key={i} style={{ height: line.trim() ? 0 : 5 }} />;
    return <p key={i} style={{ margin: "3px 0", color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7 }}>{line}</p>;
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTimeRemaining(nextScanMs: number): string {
  const remaining = nextScanMs - Date.now();
  if (remaining <= 0) return "0h 0m";
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ScanPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [crawlCounter, setCrawlCounter] = useState(0);
  const [scanBlocked, setScanBlocked] = useState<{ blocked: boolean; nextScanMs: number }>({ blocked: false, nextScanMs: 0 });
  const [timeRemaining, setTimeRemaining] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activityFeed, setActivityFeed] = useState<{ level: string; msg: string; color: string }[]>([]);
  const [notifyNextJs, setNotifyNextJs] = useState(false);
  const [showSystemInput, setShowSystemInput] = useState(false);
  const [systemInput, setSystemInput] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crawlIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const apiDone = useRef(false);
  const scanStartRef = useRef<number>(0);
  const phaseRef = useRef<ScanPhase>("idle");

  // ── Check localStorage 24h gate on mount ───────────────────
  useEffect(() => {
    try {
      const ts = localStorage.getItem(FREE_SCAN_KEY);
      if (ts) {
        const elapsed = Date.now() - parseInt(ts);
        if (elapsed < FREE_SCAN_LIMIT_MS) {
          const nextMs = parseInt(ts) + FREE_SCAN_LIMIT_MS;
          setScanBlocked({ blocked: true, nextScanMs: nextMs });
          setTimeRemaining(formatTimeRemaining(nextMs));
        }
      }
    } catch { /* localStorage not available */ }
    setMounted(true);
  }, []);

  // ── Countdown ticker when blocked ──────────────────────────
  useEffect(() => {
    if (!scanBlocked.blocked) return;
    const id = setInterval(() => {
      const remaining = scanBlocked.nextScanMs - Date.now();
      if (remaining <= 0) {
        setScanBlocked({ blocked: false, nextScanMs: 0 });
        setTimeRemaining("");
        clearInterval(id);
      } else {
        setTimeRemaining(formatTimeRemaining(scanBlocked.nextScanMs));
      }
    }, 1_000);
    return () => clearInterval(id);
  }, [scanBlocked]);

  // ── Crawl counter during step3 ──────────────────────────────
  useEffect(() => {
    if (phase === "step3") {
      setCrawlCounter(1);
      crawlIntervalRef.current = setInterval(() => {
        setCrawlCounter(prev => {
          if (prev >= MAX_FREE_PAGES) {
            if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
            return MAX_FREE_PAGES;
          }
          return prev + 1;
        });
      }, 400);
    } else {
      if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
      if (phase === "idle") setCrawlCounter(0);
    }
    return () => {
      if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
    };
  }, [phase]);

  // ── Keep phaseRef in sync (avoids stale closure in polling interval) ──────
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ── Dynamic browser-tab title during scan ──────────────────
  useEffect(() => {
    const scanning = phase === "step1" || phase === "step2" || phase === "step3" || phase === "step4";
    if (scanning) {
      let secs = 60;
      document.title = `🔍 Scan läuft... (${secs}s) | WebsiteFix`;
      const id = setInterval(() => {
        secs = Math.max(1, secs - 1);
        document.title = `🔍 Scan läuft... (${secs}s) | WebsiteFix`;
      }, 1000);
      return () => clearInterval(id);
    }
    if (phase === "done") {
      const domain = (() => { try { return new URL(url).hostname; } catch { return url; } })();
      document.title = `✅ Audit bereit: ${domain} | WebsiteFix`;
      return;
    }
    document.title = "WebsiteFix | Compliance-Plattform für WordPress-Agenturen";
  }, [phase, url]);

  // ── Activity Feed — fires timed messages during scan ───────
  function startActivityFeed(scanUrl: string) {
    const domain = (() => { try { return new URL(scanUrl).hostname; } catch { return scanUrl; } })();
    // Status-Zeilen erwähnen explizit die neuen Prüfpunkte (Builder, WooCommerce,
    // DSGVO, DOM-Tiefe, Google Fonts) — vermittelt dem User die Wertigkeit.
    const messages: { delay: number; level: string; msg: string; color: string }[] = [
      { delay: 800,   level: "INFO",     color: "#8df3d3", msg: `Crawler verbindet sich mit ${domain}…` },
      { delay: 2200,  level: "INFO",     color: "#8df3d3", msg: "Startseite geladen · Meta-Daten & interne Links analysiert" },
      { delay: 3800,  level: "BUILDER",  color: "#7aa6ff", msg: "Page-Builder-Detection: Elementor / Divi / Astra / WPBakery…" },
      { delay: 5600,  level: "BUILDER",  color: "#7aa6ff", msg: "DOM-Verschachtelungstiefe wird gemessen (Google-Limit: 15 Ebenen)" },
      { delay: 7400,  level: "SHOP",     color: "#C084B8", msg: "WooCommerce-Detection · Cart-Performance & Database-Bloat" },
      { delay: 9200,  level: "DSGVO",    color: "#c084fc", msg: "DSGVO-Check: Google Fonts, Maps, YouTube, Pixel-Trackers…" },
      { delay: 11000, level: "LEGAL",    color: "#c084fc", msg: "BFSG-Konformität der Startseite wird geprüft…" },
      { delay: 13000, level: "CRITICAL", color: "#ff6b6b", msg: `Alt-Texte & Screenreader-Tauglichkeit auf ${domain} geprüft` },
      { delay: 15500, level: "WARN",     color: "#fbbf24", msg: "Performance-Snapshot: Ladezeit & mobile Darstellung analysiert" },
      { delay: 18500, level: "INFO",     color: "#10B981", msg: "Optimierungs-Plan wird aus Befunden generiert…" },
      { delay: 21500, level: "INFO",     color: "#7aa6ff", msg: "KI-Analyse: Snapshot-Befunde werden aggregiert…" },
    ];
    setActivityFeed([]);
    activityTimers.current.forEach(t => clearTimeout(t));
    activityTimers.current = messages.map(({ delay, level, msg, color }) =>
      setTimeout(() => {
        setActivityFeed(prev => [...prev, { level, msg, color }]);
      }, delay)
    );
  }

  function clearTimers() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
  }

  function advanceToPhase(target: ScanPhase, delay: number) {
    timerRef.current = setTimeout(() => {
      if (!apiDone.current) setPhase(target);
    }, delay);
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || phase !== "idle") return;

    // Fresh localStorage check — catches stale component state (e.g. after SSR hydration)
    try {
      const ts = localStorage.getItem(FREE_SCAN_KEY);
      if (ts) {
        const elapsed = Date.now() - parseInt(ts);
        if (elapsed < FREE_SCAN_LIMIT_MS) {
          const nextMs = parseInt(ts) + FREE_SCAN_LIMIT_MS;
          setScanBlocked({ blocked: true, nextScanMs: nextMs });
          setTimeRemaining(formatTimeRemaining(nextMs));
          return;
        }
      }
    } catch { /* localStorage unavailable */ }

    if (scanBlocked.blocked) return;

    clearTimers();
    apiDone.current = false;
    setPhase("step1");
    setResult(null);
    setErrorMsg("");
    setShowOverlay(false);

    // ── Real polling: phase advancement + early-done detection ──────────────
    // Replaces hardcoded timeouts — phases now advance relative to actual
    // API-call start time and stop the moment the API responds.
    const scanUrl = url; // capture at call time (url state won't change while scanning)
    scanStartRef.current = Date.now();
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      if (apiDone.current) {
        if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
        return;
      }
      const elapsed = Date.now() - scanStartRef.current;
      const cur = phaseRef.current;

      // Phase advancement — still time-based but anchored to real API call start
      if (elapsed >= 5000  && cur === "step1") setPhase("step2");
      if (elapsed >= 12000 && (cur === "step1" || cur === "step2")) setPhase("step3");
      if (elapsed >= 22000 && (cur === "step1" || cur === "step2" || cur === "step3")) setPhase("step4");

      // Early done detection via cache — fast sites may finish before next poll tick
      if (elapsed >= 6000) {
        try {
          const r = await fetch(`/api/scan/cached?url=${encodeURIComponent(scanUrl)}`);
          const d = await r.json() as { found: boolean };
          if (d.found && !apiDone.current) {
            // Scan is cached → advance to step4 to signal final-phase while
            // the main await resolves and fires setPhase("done")
            const c = phaseRef.current;
            if (c === "step1" || c === "step2" || c === "step3") setPhase("step4");
          }
        } catch { /* ignore poll errors */ }
      }
    }, 2000);

    // Start live activity feed
    startActivityFeed(url);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      clearTimers();
      apiDone.current = true;

      if (data.success) {
        // Save scan timestamp to localStorage for 24h gate + update in-component state
        try {
          const now = Date.now();
          localStorage.setItem(FREE_SCAN_KEY, now.toString());
          const nextMs = now + FREE_SCAN_LIMIT_MS;
          setScanBlocked({ blocked: true, nextScanMs: nextMs });
          setTimeRemaining(formatTimeRemaining(nextMs));
        } catch { /* ignore */ }

        setPhase("done");
        // Store scan result for /scan/results (canonical writer)
        saveScanToStorage(url, data);

        // Redirect to results page after a brief "done" flash
        setTimeout(() => {
          router.push(`/scan/results?url=${encodeURIComponent(url)}`);
        }, 900);
      } else if (data.errorCode === "RATE_LIMITED") {
        // Server confirmed the IP is rate-limited — sync localStorage + blocked state
        clearTimers();
        apiDone.current = true;
        const now = Date.now();
        const nextMs = data.retryAfterMs ? now + data.retryAfterMs : now + FREE_SCAN_LIMIT_MS;
        try { localStorage.setItem(FREE_SCAN_KEY, (nextMs - FREE_SCAN_LIMIT_MS).toString()); } catch { /* ignore */ }
        setScanBlocked({ blocked: true, nextScanMs: nextMs });
        setTimeRemaining(formatTimeRemaining(nextMs));
        setPhase("idle");
      } else if (data.errorCode === "ERR_NOT_WORDPRESS") {
        clearTimers();
        apiDone.current = true;
        setPhase("not_wordpress");
      } else if (data.errorCode === "SITE_UNREACHABLE") {
        clearTimers();
        apiDone.current = true;
        setErrorMsg("Diese Website konnte nicht erreicht werden. Bitte prüfe die URL auf Tippfehler.");
        setPhase("error");
      } else {
        setErrorMsg(data.error ?? "Etwas ist schiefgelaufen.");
        setPhase("error");
      }
    } catch {
      clearTimers();
      apiDone.current = true;
      setErrorMsg("Verbindungsfehler. Bitte versuche es erneut.");
      setPhase("error");
    }
  }

  function reset() {
    clearTimers(); // also clears pollIntervalRef
    if (crawlIntervalRef.current) clearInterval(crawlIntervalRef.current);
    activityTimers.current.forEach(t => clearTimeout(t));
    apiDone.current = false;
    setPhase("idle");
    setUrl("");
    setResult(null);
    setErrorMsg("");
    setShowOverlay(false);
    setCrawlCounter(0);
    setActivityFeed([]);
    setNotifyNextJs(false);
    setShowSystemInput(false);
    setSystemInput("");
  }

  const isScanning = phase === "step1" || phase === "step2" || phase === "step3" || phase === "step4";
  const currentStepIdx = isScanning ? PHASE_ORDER.indexOf(phase) - 1 : -1;
  const pagesAtLimit = result && result.pagesScanned >= MAX_FREE_PAGES;

  return (
    <>
      {/* ── NAV — gleiche Struktur wie Home-Seite ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          height: 58, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Left — Logo */}
          <BrandLogo />

          {/* Center + Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>

            {/* Center links — hidden on mobile */}
            <div className="hide-sm" style={{ display: "flex", gap: 24 }}>
              {[
                { href: "/#pricing",       label: "Preise" },
                { href: "/fuer-agenturen", label: "Für Agenturen" },
                { href: "/blog",           label: "Blog" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} style={{
                  fontSize: 14, color: "rgba(255,255,255,0.5)",
                  textDecoration: "none", transition: "color 0.15s",
                }}
                  className="wf-nav-link"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Auth-aware: zeigt 'Dashboard →' wenn eingeloggt, 'Preise' wenn nicht */}
              <NavAuthLink />
              <Link href="/login" className="hide-sm" style={{
                fontSize: 13, padding: "7px 16px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                textDecoration: "none",
              }}>
                Anmelden
              </Link>
              {/* Burger-Menü — nur auf Mobile */}
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main>
        <section style={{ maxWidth: 760, margin: "0 auto", padding: "96px 24px 64px", textAlign: "center" }}>

          {/* Deep Scan badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 28,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid rgba(141,243,211,0.25)",
            background: "rgba(141,243,211,0.06)",
            fontSize: 12, color: "#8df3d3", fontWeight: 700, letterSpacing: "0.08em",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#8df3d3", flexShrink: 0,
              boxShadow: "0 0 6px #8df3d3",
              animation: "pulseDot 1.5s ease-in-out infinite",
            }} />
            Deep-Scan
          </div>

          <h1 style={{
            fontSize: "clamp(28px, 4.5vw, 50px)", fontWeight: 800, lineHeight: 1.1,
            margin: "0 0 16px", letterSpacing: "-0.035em",
          }}>
            Professionelle System-Analyse:{" "}
            <span style={{ background: "linear-gradient(90deg,#7aa6ff,#8df3d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Sichtbarkeits-Blocker aufdecken.
            </span>
          </h1>

          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: 580, margin: "0 auto 40px" }}>
            Analysiere Ranking-Blocker und BFSG-Konformität in Echtzeit.{" "}
            <span style={{ color: "rgba(255,255,255,0.75)" }}>Erhalte eine detaillierte Vorschau deines Potenzials</span>{" "}
            — bis zu 25 Seiten, Ergebnis in 60 Sekunden.
          </p>

          {/* ── INPUT FORM / BLOCKED STATE ── */}
          {phase === "idle" && !mounted && (
            <div style={{ height: 72 }} />
          )}
          {phase === "idle" && mounted && (
            <>
              {scanBlocked.blocked ? (
                /* ── 24h limit reached — Glassmorphism + Home-CTA-Glow ── */
                <div style={{ maxWidth: 520, margin: "0 auto 14px", position: "relative" }}>

                  {/* Outer ambient glow — same radial as home CTA banner */}
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "120%", height: "220%",
                    background: "radial-gradient(ellipse, rgba(0,123,255,0.14) 0%, transparent 65%)",
                    pointerEvents: "none", zIndex: 0,
                  }} />

                  {/* Glass card */}
                  <div style={{
                    position: "relative", zIndex: 1,
                    padding: "44px 36px 36px",
                    background: "rgba(13,21,32,0.72)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border: "1px solid rgba(0,123,255,0.22)",
                    borderRadius: 22,
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.5)",
                    textAlign: "center",
                    overflow: "hidden",
                  }}>

                    {/* Inner top-edge highlight */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 1,
                      background: "linear-gradient(90deg, transparent, rgba(0,123,255,0.4), transparent)",
                      pointerEvents: "none",
                    }} />

                    {/* Icon — Sanduhr */}
                    <div style={{
                      width: 56, height: 56, borderRadius: 16,
                      margin: "0 auto 24px",
                      background: "rgba(0,123,255,0.1)",
                      border: "1px solid rgba(0,123,255,0.28)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 0 24px rgba(0,123,255,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 2h14"/>
                        <path d="M5 22h14"/>
                        <path d="M5 2l7 10-7 10"/>
                        <path d="M19 2l-7 10 7 10"/>
                      </svg>
                    </div>

                    {/* Headline */}
                    <div style={{
                      fontWeight: 800, fontSize: 19, color: "#fff",
                      marginBottom: 10, letterSpacing: "-0.02em", lineHeight: 1.3,
                    }}>
                      Gast-Limit erreicht
                    </div>

                    {/* Subtext */}
                    <p style={{
                      margin: "0 auto 24px", fontSize: 14,
                      color: "rgba(255,255,255,0.42)", lineHeight: 1.75,
                      maxWidth: 340,
                    }}>
                      Sichere dir jetzt vollen Zugriff auf alle Reports und den Smart-Fix Guide.
                    </p>

                    {/* Kontingent-Visual — "2 von 2 Scans verwendet" */}
                    <div style={{
                      margin: "0 auto 28px",
                      maxWidth: 300,
                      padding: "14px 16px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10,
                    }}>
                      <div style={{
                        display: "flex", justifyContent: "space-between",
                        marginBottom: 8, fontSize: 11,
                        color: "rgba(255,255,255,0.3)",
                        fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                      }}>
                        <span>Anonyme Scans (pro 24 Stunden)</span>
                        <span style={{ color: "#7aa6ff" }}>2 / 2 verwendet</span>
                      </div>
                      {/* Progress bar — 100 % filled */}
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: "100%",
                          background: "linear-gradient(90deg, #007BFF, #8df3d3)",
                          borderRadius: 999,
                          boxShadow: "0 0 8px rgba(0,123,255,0.6)",
                        }} />
                      </div>
                    </div>

                    {/* CTA — focal point with strong glow */}
                    <div style={{ position: "relative", display: "inline-block" }}>
                      {/* Glow bloom behind button */}
                      <div style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "140%", height: "300%",
                        background: "radial-gradient(ellipse, rgba(0,123,255,0.5) 0%, transparent 65%)",
                        pointerEvents: "none",
                      }} />
                      <Link href="/fuer-agenturen#pricing" style={{
                        position: "relative",
                        display: "inline-block",
                        padding: "15px 36px", borderRadius: 11, fontSize: 15, fontWeight: 800,
                        background: "linear-gradient(90deg, #007BFF, #0057b8)",
                        color: "#fff", textDecoration: "none",
                        boxShadow: "0 4px 32px rgba(0,123,255,0.55), 0 0 60px rgba(0,123,255,0.20)",
                        letterSpacing: "-0.01em",
                      }}>
                        Report sichern &amp; optimieren →
                      </Link>
                    </div>

                    {/* Countdown pill */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      margin: "18px auto 0",
                      padding: "5px 13px", borderRadius: 20,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 12, color: "rgba(255,255,255,0.28)",
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Freigabe in {timeRemaining}
                    </div>

                    {/* Login link */}
                    <div style={{ marginTop: 14 }}>
                      <Link href="/login" className="wf-footer-link" style={{
                        fontSize: 12, textDecoration: "none", color: "rgba(255,255,255,0.35)",
                      }}>
                        Bereits Kunde? <span style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>Hier anmelden</span>
                      </Link>
                    </div>

                  </div>
                </div>
              ) : (
                /* Normal scan form */
                <form onSubmit={handleScan} style={{ position: "relative", maxWidth: 580, margin: "0 auto" }}>
                  <div style={{
                    display: "flex",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: "0 0 0 0 rgba(0,123,255,0)",
                    transition: "box-shadow 0.2s",
                  }}>
                    <label htmlFor="scan-url" className="sr-only">Website-URL</label>
                    <input
                      id="scan-url"
                      type="text" value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://kunden-website.de"
                      style={{
                        flex: 1, background: "transparent",
                        border: "none", outline: "none",
                        padding: "16px 20px", color: "#fff", fontSize: 16,
                      }}
                      autoFocus
                    />
                    <button type="submit" disabled={!url} style={{
                      padding: "14px 24px", background: url ? "#007BFF" : "rgba(255,255,255,0.08)",
                      border: "none", color: url ? "#fff" : "rgba(255,255,255,0.3)",
                      fontWeight: 700, fontSize: 14, cursor: url ? "pointer" : "default",
                      whiteSpace: "nowrap", transition: "background 0.15s",
                      borderLeft: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      Analyse starten →
                    </button>
                  </div>

                  {/* Trust chips */}
                  <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
                    {[
                      "Bis zu 25 Unterseiten",
                      "Inkl. BFSG-Check",
                      "Sofortergebnis",
                    ].map(t => (
                      <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 5 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Pricing hint */}
                  <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(255,255,255,0.22)", textAlign: "center" }}>
                    Voller Report und Smart-Fix Guides ab{" "}
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>29€/Monat</span>
                  </p>
                </form>
              )}
            </>
          )}
        </section>

        {/* ── LIVE PROGRESS ── */}
        {isScanning && (
          <section style={{ maxWidth: 600, margin: "0 auto 48px", padding: "0 24px", animation: "wfFadeIn 0.35s ease both" }}>
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                padding: "14px 22px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(0,123,255,0.05)",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#007BFF", flexShrink: 0,
                  boxShadow: "0 0 8px #007BFF",
                  animation: "pulseDot 1.5s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                  Deep-Scan — {url}
                </span>
              </div>

              {/* Steps */}
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 0 }}>
                {STEPS.map((step, i) => {
                  const isDone = i < currentStepIdx;
                  const isActive = i === currentStepIdx;
                  return (
                    <div key={step.phase} style={{
                      display: "flex", gap: 14, alignItems: "flex-start",
                      paddingBottom: i < STEPS.length - 1 ? 16 : 0,
                      position: "relative",
                    }}>
                      {/* Connector line */}
                      {i < STEPS.length - 1 && (
                        <div style={{
                          position: "absolute", left: 9, top: 22,
                          width: 2, height: 16,
                          background: isDone ? "rgba(141,243,211,0.4)" : "rgba(255,255,255,0.07)",
                          transition: "background 0.5s",
                        }} />
                      )}
                      {/* Dot */}
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                        background: isDone
                          ? "rgba(141,243,211,0.15)"
                          : isActive
                            ? "rgba(0,123,255,0.2)"
                            : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${isDone ? "#8df3d3" : isActive ? "#007BFF" : "rgba(255,255,255,0.1)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.4s",
                      }}>
                        {isDone ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : isActive ? (
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: "#007BFF",
                            animation: "pulseDot 1.2s ease-in-out infinite",
                          }} />
                        ) : null}
                      </div>
                      {/* Text */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 14, fontWeight: isActive ? 600 : 400,
                          color: isDone ? "#8df3d3" : isActive ? "#fff" : "rgba(255,255,255,0.25)",
                          transition: "color 0.4s",
                        }}>
                          {step.label}
                        </div>
                        {isActive && (
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                            {/* Crawl counter shown during step3 */}
                            {step.phase === "step3" && crawlCounter > 0
                              ? `Analysiere Seite ${crawlCounter} von ${MAX_FREE_PAGES}…`
                              : step.sub}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div style={{ height: 2, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${((currentStepIdx + 1) / STEPS.length) * 100}%`,
                  background: "linear-gradient(90deg, #007BFF, #8df3d3)",
                  transition: "width 0.6s ease",
                }} />
              </div>
            </div>

            {/* Activity Feed */}
            {activityFeed.length > 0 && (
              <div style={{
                marginTop: 12,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex", flexDirection: "column", gap: 7,
                fontFamily: "monospace",
              }}>
                {activityFeed.map((entry, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11 }}>
                    <span style={{
                      flexShrink: 0, padding: "1px 6px", borderRadius: 4,
                      background: `${entry.color}15`, border: `1px solid ${entry.color}30`,
                      color: entry.color, fontWeight: 700, letterSpacing: "0.04em",
                    }}>
                      {entry.level}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── NOT WORDPRESS ── */}
        {phase === "not_wordpress" && (
          <section style={{ maxWidth: 600, margin: "0 auto 48px", padding: "0 24px" }}>
            <div style={{
              padding: "26px 24px 22px",
              background: "rgba(10,8,18,0.70)",
              border: "1px solid rgba(122,166,255,0.18)",
              borderRadius: 14,
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: "radial-gradient(ellipse at 90% 30%, rgba(99,102,241,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14, position: "relative" }}>
                <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px", marginBottom: 4 }}>Spezialisierter WordPress-Check</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.6, maxWidth: 460 }}>
                    WebsiteFix ist exklusiv auf WordPress-Architekturen optimiert. Die Ziel-URL nutzt eine andere Technologie (z.&nbsp;B. Next.js, React oder ein statisches CMS). Möchten Sie eine WordPress-Seite testen?
                  </div>
                </div>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 0 18px" }} />
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
                <button onClick={reset} style={{ fontSize: 13, fontWeight: 600, color: "#fff", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)", borderRadius: 8, cursor: "pointer", padding: "8px 16px" }}>
                  Eingabe leeren →
                </button>
                {!notifyNextJs ? (
                  !showSystemInput ? (
                    <button
                      onClick={() => setShowSystemInput(true)}
                      style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.35)", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", padding: "8px 14px" }}
                    >
                      Support für mein System anfragen
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        placeholder="z. B. Joomla, Shopify, Next.js…"
                        value={systemInput}
                        onChange={(e) => setSystemInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && systemInput.trim()) {
                            setNotifyNextJs(true);
                            try { localStorage.setItem("wf_system_request", systemInput.trim()); } catch {}
                          }
                        }}
                        autoFocus
                        style={{ fontSize: 12, padding: "7px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#fff", outline: "none", width: 200 }}
                      />
                      <button
                        onClick={() => {
                          if (!systemInput.trim()) return;
                          setNotifyNextJs(true);
                          try { localStorage.setItem("wf_system_request", systemInput.trim()); } catch {}
                        }}
                        style={{ fontSize: 12, fontWeight: 600, color: "#818cf8", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, cursor: "pointer", padding: "7px 12px" }}
                      >
                        Absenden →
                      </button>
                    </div>
                  )
                ) : (
                  <span style={{ fontSize: 12, color: "rgba(141,243,211,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8df3d3" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Gemerkt — wir melden uns!
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <section style={{ maxWidth: 600, margin: "0 auto 48px", padding: "0 24px" }}>
            <div style={{
              padding: "18px 22px",
              background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)",
              borderRadius: 12,
            }}>
              <p style={{ margin: "0 0 12px", color: "#ff6b6b", fontSize: 14 }}>{errorMsg}</p>
              <button onClick={reset} style={{
                fontSize: 13, padding: "8px 16px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
                background: "none", cursor: "pointer",
              }}>
                Erneut versuchen
              </button>
            </div>
          </section>
        )}

        {/* ── RESULTS ── */}
        {phase === "done" && result && (
          <section style={{ maxWidth: 740, margin: "0 auto 64px", padding: "0 24px" }}>

            {/* Result header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#8df3d3", boxShadow: "0 0 6px #8df3d3",
                }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                  Scan abgeschlossen
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                  {result.pagesScanned} Seite{result.pagesScanned !== 1 ? "n" : ""} analysiert · {url}
                </span>
              </div>
              <button onClick={reset} style={{
                fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                cursor: "pointer", padding: "6px 14px",
              }}>
                Neue URL
              </button>
            </div>

            {/* Truncation notice */}
            {pagesAtLimit && (
              <div style={{
                marginBottom: 16, padding: "14px 18px",
                background: "rgba(122,166,255,0.06)",
                border: "1px solid rgba(122,166,255,0.2)",
                borderRadius: 10,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                  Tiefen-Analyse der ersten <strong style={{ color: "#fff" }}>{MAX_FREE_PAGES} Seiten</strong> abgeschlossen.
                  Für einen vollständigen Scan aller Seiten{" "}
                  <Link href="/fuer-agenturen#pricing" style={{ color: "#7aa6ff", textDecoration: "none", fontWeight: 600 }}>wähle einen Pro-Plan →</Link>
                </p>
              </div>
            )}

            {/* Diagnose */}
            <div style={{
              position: "relative",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, overflow: "hidden",
              marginBottom: 16,
            }}>
              <div style={{ padding: "28px 32px" }}>
                {renderDiagnose(result.diagnose)}
              </div>

              {/* Blur + Upgrade Overlay */}
              {showOverlay && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "45%",
                  background: "linear-gradient(to bottom, transparent 0%, rgba(11,12,16,0.92) 40%, rgba(11,12,16,0.98) 100%)",
                  display: "flex", alignItems: "flex-end",
                  padding: "0 32px 28px",
                }}>
                  <div style={{
                    width: "100%",
                    padding: "22px 26px", borderRadius: 14,
                    background: "rgba(0,123,255,0.08)",
                    border: "1px solid rgba(0,123,255,0.25)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#7aa6ff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      Vollständigen Scan freischalten
                    </div>
                    <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      Schalte den vollständigen Report mit{" "}
                      <strong style={{ color: "#fff" }}>allen Unterseiten</strong>, Smart-Fix Guides und PDF-Export frei.
                    </p>
                    <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                      <Link href="/fuer-agenturen#pricing" style={{
                        padding: "11px 24px", borderRadius: 9, fontSize: 14, fontWeight: 700,
                        background: "linear-gradient(90deg, #007BFF, #0057b8)",
                        color: "#fff", textDecoration: "none",
                        boxShadow: "0 4px 16px rgba(0,123,255,0.4)",
                      }}>
                        Plan wählen &amp; freischalten →
                      </Link>
                      <button onClick={() => setShowOverlay(false)} style={{
                        padding: "11px 18px", borderRadius: 9, fontSize: 13,
                        border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)",
                        background: "none", cursor: "pointer",
                      }}>
                        Report lesen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </section>
        )}

        {/* ── BENEFITS FOOTER ── */}
        <section style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "64px 24px 80px",
        }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ textAlign: "center", margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Warum Agenturen WebsiteFix nutzen
            </p>
            <h2 style={{ textAlign: "center", margin: "0 0 48px", fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em", color: "#fff" }}>
              Mehr Umsatz. Weniger Haftung. Bessere Marge.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {BENEFITS.map(b => (
                <div key={b.label} style={{
                  padding: "26px 24px",
                  background: b.bg,
                  border: `1px solid ${b.border}`,
                  borderRadius: 16,
                  display: "flex", flexDirection: "column", gap: 14,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${b.color}15`,
                    border: `1px solid ${b.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {b.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: b.color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                      {b.label}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>
                      {b.title}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                      {b.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 40 }}>
              <Link href="/fuer-agenturen#pricing" style={{
                display: "inline-block",
                padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(90deg, #007BFF, #0057b8)",
                color: "#fff", textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,123,255,0.35)",
              }}>
                Plan wählen &amp; starten →
              </Link>
              <p style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                Ab 29€/Monat · Jederzeit kündbar
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <SiteFooter />

      {/* CSS animations */}
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes wfFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
