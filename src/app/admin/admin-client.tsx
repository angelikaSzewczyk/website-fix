"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Flame, Ticket, Server, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import type { AdminUser, ScanLogRow, SupportTicket, DbStats } from "./page";
import { PLAN_MRR, PLAN_COLOR, PLAN_LABEL, PLAN_KEYS } from "@/lib/plans";

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:       "#08090D",
  surface:  "#0F111A",
  border:   "rgba(255,255,255,0.07)",
  text:     "#F0F2F8",
  sub:      "rgba(255,255,255,0.45)",
  muted:    "rgba(255,255,255,0.22)",
  blue:     "#4F8EF7",
  blueBg:   "rgba(79,142,247,0.1)",
  green:    "#22C55E",
  greenBg:  "rgba(34,197,94,0.1)",
  amber:    "#F59E0B",
  amberBg:  "rgba(245,158,11,0.1)",
  red:      "#EF4444",
  redBg:    "rgba(239,68,68,0.1)",
  violet:   "#8B5CF6",
  violetBg: "rgba(139,92,246,0.1)",
};

const PAGE_SIZE = 50;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) + " " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s; }

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, trend }: {
  label: string; value: string | number; sub?: string; accent?: string; trend?: string;
}) {
  return (
    <div style={{
      padding: "20px 22px",
      background: D.surface,
      border: `1px solid ${D.border}`,
      borderRadius: 12,
    }}>
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 600, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </p>
      <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, color: accent ?? D.text, letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: D.muted }}>{sub}</p>}
      {trend && <p style={{ margin: "6px 0 0", fontSize: 11, color: D.green }}>{trend}</p>}
    </div>
  );
}

// ── SVG Line Chart (growth) ───────────────────────────────────────────────────
function LineChart({ data }: { data: { date: string; cnt: number }[] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: D.muted, fontSize: 13 }}>Noch keine Signup-Daten</p>
      </div>
    );
  }

  // Fill gaps with 0 for last 30 days
  const today = new Date();
  const filled: { date: string; cnt: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find(r => r.date === key);
    filled.push({ date: key, cnt: found?.cnt ?? 0 });
  }

  const maxCnt = Math.max(...filled.map(d => d.cnt), 1);
  const W = 100, H = 50; // viewBox units
  const pts = filled.map((d, i) => {
    const x = (i / (filled.length - 1)) * W;
    const y = H - (d.cnt / maxCnt) * (H * 0.85) - H * 0.05;
    return `${x},${y}`;
  }).join(" ");

  const areaBottom = `${W},${H} 0,${H}`;
  const area = `0,${H - (filled[0].cnt / maxCnt) * (H * 0.85) - H * 0.05} ${pts} ${areaBottom}`;

  return (
    <div style={{ width: "100%", height: 160, position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={D.blue} stopOpacity="0.3" />
            <stop offset="100%" stopColor={D.blue} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#lineGrad)" />
        <polyline
          points={pts}
          fill="none"
          stroke={D.blue}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots for non-zero days */}
        {filled.map((d, i) => d.cnt > 0 ? (
          <circle
            key={i}
            cx={(i / (filled.length - 1)) * W}
            cy={H - (d.cnt / maxCnt) * (H * 0.85) - H * 0.05}
            r="1"
            fill={D.blue}
          />
        ) : null)}
      </svg>
      {/* Y-axis label */}
      <div style={{ position: "absolute", top: 4, left: 4, fontSize: 9, color: D.muted }}>{maxCnt}</div>
      {/* X-axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: D.muted }}>{filled[0]?.date.slice(5)}</span>
        <span style={{ fontSize: 10, color: D.muted }}>{filled[29]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

// ── SVG Donut Chart (cache) ───────────────────────────────────────────────────
function DonutChart({ fresh, cached, label }: { fresh: number; cached: number; label: string }) {
  const total = fresh + cached;
  if (total === 0) return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <p style={{ color: D.muted, fontSize: 13 }}>Keine Daten</p>
    </div>
  );

  const R = 40, CX = 60, CY = 60, STROKE = 12;
  const circ = 2 * Math.PI * R;
  const cachedFrac = cached / total;
  const freshFrac  = fresh  / total;
  const cachedDash = cachedFrac * circ;
  const freshDash  = freshFrac  * circ;
  const cachedOffset = 0;
  const freshOffset  = cachedDash;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={D.border} strokeWidth={STROKE} />
        {/* Cached arc */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={D.blue} strokeWidth={STROKE}
          strokeDasharray={`${cachedDash} ${circ - cachedDash}`}
          strokeDashoffset={-cachedOffset}
          strokeLinecap="butt"
          style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px` }}
        />
        {/* Fresh arc */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={D.amber} strokeWidth={STROKE}
          strokeDasharray={`${freshDash} ${circ - freshDash}`}
          strokeDashoffset={-(freshOffset)}
          strokeLinecap="butt"
          style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px` }}
        />
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={D.text}>{total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9" fill={D.muted}>Scans total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: D.blue, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{cached}</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: D.muted }}>Cache-Hits · Gespart: ~{Math.round(cached * 0.003 * 100) / 100}€</p>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: D.amber, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{fresh}</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: D.muted }}>Fresh Scans · KI-Kosten: ~{Math.round(fresh * 0.012 * 100) / 100}€</p>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: D.green }}>
          Cache spart {total > 0 ? Math.round((cached / total) * 100) : 0}% der KI-Kosten
        </p>
      </div>
    </div>
  );
}

// ── Plan breakdown bar ────────────────────────────────────────────────────────
function PlanBar({ planCounts, totalUsers }: { planCounts: Record<string, number>; totalUsers: number }) {
  const plans = PLAN_KEYS.map(key => ({
    key,
    label: PLAN_LABEL[key] ?? key,
    color: PLAN_COLOR[key] ?? D.muted,
  }));

  return (
    <div>
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
        {plans.map(p => {
          const pct = totalUsers > 0 ? ((planCounts[p.key] ?? 0) / totalUsers) * 100 : 0;
          if (pct === 0) return null;
          return <div key={p.key} style={{ width: `${pct}%`, background: p.color }} />;
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {plans.map(p => {
          const cnt = planCounts[p.key] ?? 0;
          const mrr = cnt * (PLAN_MRR[p.key] ?? 0);
          return (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: D.sub }}>
                {p.label}: <strong style={{ color: D.text }}>{cnt}</strong>
                {mrr > 0 && <span style={{ color: D.muted }}> · {mrr}€/mo</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, fromCache }: { status: string; fromCache?: boolean }) {
  const cfg =
    status === "error"   ? { color: D.red,   bg: D.redBg,   label: "ERROR"  } :
    fromCache            ? { color: D.blue,  bg: D.blueBg,  label: "CACHED" } :
    status === "cached"  ? { color: D.blue,  bg: D.blueBg,  label: "CACHED" } :
                           { color: D.green, bg: D.greenBg, label: "OK"     };
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
      color: cfg.color, background: cfg.bg,
      letterSpacing: "0.07em",
    }}>
      {cfg.label}
    </span>
  );
}

// ── Main Admin Client ─────────────────────────────────────────────────────────
type Props = {
  kpi: { totalUsers: number; planCounts: Record<string, number>; mrr: number; scans: Record<string, number> };
  growth: { date: string; cnt: number }[];
  users: AdminUser[];
  cache: { regular: number; fullsite: number };
  widgetLeads: number;
  scanLogs: ScanLogRow[];
  tickets: SupportTicket[];
  dbStats: DbStats;
};

export default function AdminClient({ kpi, growth, users, cache, widgetLeads, scanLogs: initialLogs, tickets: initialTickets, dbStats }: Props) {
  const [tab, setTab] = useState<"overview" | "users" | "incidents" | "support" | "infra">("overview");
  const [userSearch, setUserSearch]         = useState("");
  const [scanLogs, setScanLogs]             = useState(initialLogs);
  const [creditsInput, setCreditsInput]     = useState<Record<string, string>>({});
  const [creditsLoading, setCreditsLoading] = useState<string | null>(null);
  const [creditsDone, setCreditsDone]       = useState<string | null>(null);
  const [planInput, setPlanInput]           = useState<Record<string, string>>({});
  const [planLoading, setPlanLoading]       = useState<string | null>(null);
  const [planDone, setPlanDone]             = useState<string | null>(null);
  const [userPage, setUserPage]             = useState(0);
  const [rescanUrl, setRescanUrl]           = useState<string | null>(null);
  const [rescanResult, setRescanResult]     = useState<string | null>(null);
  const [refreshing, setRefreshing]         = useState(false);
  const [tickets, setTickets]               = useState(initialTickets);
  const [openTicket, setOpenTicket]         = useState<SupportTicket | null>(null);
  const [replyText, setReplyText]           = useState("");
  const [replying, setReplying]             = useState(false);
  const [impersonating, setImpersonating]   = useState<string | null>(null);

  // ── Rate Limit Tool ───────────────────────────────────────────────────────
  const [rateLimitRows, setRateLimitRows]       = useState<{ ip_hash: string; first_scan_at: string; last_scan_at: string; scan_count: number }[] | null>(null);
  const [rateLimitLoading, setRateLimitLoading] = useState(false);
  const [rateLimitMsg, setRateLimitMsg]         = useState<string | null>(null);

  // ── Manueller Guide-Unlock (Notfall bei Webhook-Hänger) ────────────────────
  // Schreibt einen user_unlocked_guides-Eintrag, als hätte Stripe den Webhook
  // erfolgreich verarbeitet. ON CONFLICT DO NOTHING auf API-Seite — wiederholbar.
  const [unlockEmail,   setUnlockEmail]   = useState("");
  const [unlockGuideId, setUnlockGuideId] = useState("");
  const [unlockHoster,  setUnlockHoster]  = useState("default");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockMsg,     setUnlockMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  const unlockGuide = useCallback(async () => {
    setUnlockLoading(true);
    setUnlockMsg(null);
    try {
      const res = await fetch("/api/admin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action:  "unlock_guide",
          email:   unlockEmail.trim(),
          guideId: unlockGuideId.trim(),
          hoster:  unlockHoster.trim() || "default",
        }),
      });
      const data = await res.json() as { ok?: boolean; created?: boolean; userId?: string; error?: string };
      if (!res.ok) {
        setUnlockMsg({ ok: false, text: data.error ?? "Unbekannter Fehler" });
      } else {
        setUnlockMsg({
          ok: true,
          text: data.created
            ? `✓ Guide ${unlockGuideId} freigeschaltet für User ${data.userId} (${unlockEmail})`
            : `ℹ Guide ${unlockGuideId} war bereits unlocked für User ${data.userId} (idempotent)`,
        });
        setUnlockEmail("");
        setUnlockGuideId("");
      }
    } catch (err) {
      setUnlockMsg({ ok: false, text: `Netzwerkfehler: ${err instanceof Error ? err.message : "unknown"}` });
    } finally {
      setUnlockLoading(false);
    }
  }, [unlockEmail, unlockGuideId, unlockHoster]);

  const loadRateLimits = useCallback(async () => {
    setRateLimitLoading(true);
    try {
      const res  = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list_rate_limits" }) });
      const data = await res.json();
      setRateLimitRows(data.rows ?? []);
    } finally {
      setRateLimitLoading(false);
    }
  }, []);

  const resetRateLimit = useCallback(async (ipHash?: string) => {
    setRateLimitLoading(true);
    setRateLimitMsg(null);
    try {
      const body = ipHash ? { action: "reset_rate_limit", ip: ipHash } : { action: "reset_rate_limit" };
      const res  = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      setRateLimitMsg(data.ok ? (ipHash ? "Eintrag gelöscht." : "Alle Einträge gelöscht.") : "Fehler.");
      await loadRateLimits();
    } finally {
      setRateLimitLoading(false);
    }
  }, [loadRateLimits]);

  const filteredUsers = userSearch
    ? users.filter(u =>
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.name ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
        u.plan.toLowerCase().includes(userSearch.toLowerCase()))
    : users;
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice(userPage * PAGE_SIZE, (userPage + 1) * PAGE_SIZE);

  // ── Credits ──────────────────────────────────────────────────────────────
  const addCredits = useCallback(async (userId: string) => {
    const n = parseInt(creditsInput[userId] ?? "0", 10);
    if (!n || isNaN(n)) return;
    setCreditsLoading(userId);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_credits", userId, credits: n }),
      });
      setCreditsDone(userId);
      setTimeout(() => setCreditsDone(null), 2000);
      setCreditsInput(prev => ({ ...prev, [userId]: "" }));
    } finally {
      setCreditsLoading(null);
    }
  }, [creditsInput]);

  // ── Plan-Change ───────────────────────────────────────────────────────────
  const changePlan = useCallback(async (userId: string) => {
    const newPlan = planInput[userId];
    if (!newPlan) return;
    setPlanLoading(userId);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_plan", userId, plan: newPlan }),
      });
      setPlanDone(userId);
      setTimeout(() => setPlanDone(null), 2500);
      setPlanInput(prev => ({ ...prev, [userId]: "" }));
    } finally {
      setPlanLoading(null);
    }
  }, [planInput]);

  // ── Re-scan ───────────────────────────────────────────────────────────────
  const rerun = useCallback(async (url: string) => {
    setRescanUrl(url);
    setRescanResult("Scan läuft…");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rescan", url }),
      });
      const d = await res.json();
      setRescanResult(d.ok ? "✓ Scan erfolgreich — Cache aktualisiert." : `Fehler: ${d.error ?? "unbekannt"}`);
      // Refresh scan log
      const fresh = await fetch("/api/admin");
      const data = await fresh.json();
      if (data.scanLogs) setScanLogs(data.scanLogs);
    } catch {
      setRescanResult("Verbindungsfehler");
    }
  }, []);

  // ── Data refresh ──────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        if (data.scanLogs) setScanLogs(data.scanLogs);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ── Impersonate ───────────────────────────────────────────────────────────
  const loginAsUser = useCallback(async (userId: string, email: string) => {
    setImpersonating(userId);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (!data.token) { alert(data.error ?? "Fehler"); return; }
      window.open(`/api/admin/impersonate/callback?token=${data.token}`, `_imp_${email}`);
    } finally {
      setImpersonating(null);
    }
  }, []);

  // ── Ticket reply ──────────────────────────────────────────────────────────
  const sendReply = useCallback(async () => {
    if (!openTicket || !replyText.trim()) return;
    setReplying(true);
    try {
      await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", ticketId: openTicket.id, reply: replyText }),
      });
      setTickets(prev => prev.map(t =>
        t.id === openTicket.id
          ? { ...t, status: "replied" as const, admin_reply: replyText, replied_at: new Date().toISOString() }
          : t
      ));
      setOpenTicket(prev => prev ? { ...prev, status: "replied" as const, admin_reply: replyText } : null);
      setReplyText("");
    } finally {
      setReplying(false);
    }
  }, [openTicket, replyText]);

  const resolveTicket = useCallback(async (ticketId: string) => {
    await fetch("/api/admin/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve", ticketId }),
    });
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "resolved" as const } : t));
    if (openTicket?.id === ticketId) setOpenTicket(prev => prev ? { ...prev, status: "resolved" as const } : null);
  }, [openTicket]);

  const reopenTicket = useCallback(async (ticketId: string) => {
    await fetch("/api/admin/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen", ticketId }),
    });
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: "open" as const, admin_reply: null } : t));
    if (openTicket?.id === ticketId) setOpenTicket(prev => prev ? { ...prev, status: "open" as const, admin_reply: null } : null);
  }, [openTicket]);

  const openCount  = tickets.filter(t => t.status === "open").length;

  const TABS = [
    { key: "overview",  label: "Übersicht",                                                              icon: <LayoutDashboard size={14} /> },
    { key: "users",     label: `Users (${kpi.totalUsers})`,                                              icon: <Users size={14} /> },
    { key: "incidents", label: `Incidents (${scanLogs.filter(l => l.status === "error").length})`,       icon: <Flame size={14} /> },
    { key: "support",   label: `Support${openCount > 0 ? ` (${openCount})` : ""}`,                      icon: <Ticket size={14} /> },
    { key: "infra",     label: "Infrastruktur",                                                          icon: <Server size={14} /> },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: D.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Top nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(8,9,13,0.95)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${D.border}`,
      }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 24px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{ textDecoration: "none", color: D.text, fontWeight: 700, fontSize: 15 }}>
              Website<span style={{ color: D.amber }}>Fix</span>
            </Link>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.15)", color: D.red, fontWeight: 700, letterSpacing: "0.1em" }}>
              ADMIN
            </span>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 2, marginLeft: 16 }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                  background: tab === t.key ? "rgba(255,255,255,0.08)" : "transparent",
                  color: tab === t.key ? D.text : D.sub,
                  transition: "all 0.15s",
                }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: "5px 14px", borderRadius: 7,
                border: `1px solid ${D.border}`, background: "transparent",
                color: D.sub, fontSize: 12, cursor: "pointer",
                opacity: refreshing ? 0.5 : 1,
              }}
            >
              <RefreshCw size={12} style={{ marginRight: 5, display: "inline" }} />{refreshing ? "Lädt…" : "Refresh"}
            </button>
            <Link href="/dashboard" style={{ fontSize: 12, color: D.muted, textDecoration: "none" }}>
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ── OVERVIEW TAB ────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <>
            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
              <KpiCard label="MRR" value={`${kpi.mrr}€`} sub={`ARR: ${kpi.mrr * 12}€`} accent={D.green} />
              <KpiCard label="Nutzer gesamt" value={kpi.totalUsers} sub="registriert" />
              <KpiCard label="Scans heute" value={kpi.scans?.today ?? 0} sub={`Woche: ${kpi.scans?.week ?? 0}`} accent={D.blue} />
              <KpiCard label="Scans Monat" value={kpi.scans?.month ?? 0} sub={`Gesamt: ${kpi.scans?.total ?? 0}`} accent={D.violet} />
              <KpiCard label="Widget-Leads" value={widgetLeads} sub="via Agentur-Widgets" accent={D.amber} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "start" }}>

              {/* Growth chart */}
              <div style={{
                padding: "22px 24px", background: D.surface,
                border: `1px solid ${D.border}`, borderRadius: 14,
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Signups — letzte 30 Tage
                </p>
                <p style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 700, color: D.text }}>
                  {growth.reduce((a, d) => a + d.cnt, 0)} neue User
                </p>
                <LineChart data={growth} />
              </div>

              {/* Plan distribution */}
              <div style={{
                padding: "22px 24px", background: D.surface,
                border: `1px solid ${D.border}`, borderRadius: 14,
              }}>
                <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Plan-Verteilung
                </p>
                <PlanBar planCounts={kpi.planCounts} totalUsers={kpi.totalUsers} />

                {/* Per-plan MRR — aus plans.ts, nur bezahlte Pläne */}
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {PLAN_KEYS.filter(k => (PLAN_MRR[k] ?? 0) > 0).map(key => {
                    const cnt = kpi.planCounts[key] ?? 0;
                    if (!cnt) return null;
                    const color = PLAN_COLOR[key] ?? D.muted;
                    return (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: D.sub }}>{PLAN_LABEL[key] ?? key}</span>
                        <div style={{ display: "flex", gap: 12 }}>
                          <span style={{ fontSize: 12, color: D.text, fontWeight: 600 }}>{cnt}×</span>
                          <span style={{ fontSize: 12, color, fontWeight: 700 }}>
                            {cnt * (PLAN_MRR[key] ?? 0)}€
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ height: 1, background: D.border, margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>MRR gesamt</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: D.green }}>{kpi.mrr}€</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── USERS TAB ────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Suche nach E-Mail, Name oder Plan…"
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
                style={{
                  flex: 1, maxWidth: 400, padding: "9px 14px",
                  background: D.surface, border: `1px solid ${D.border}`,
                  borderRadius: 9, color: D.text, fontSize: 13, outline: "none",
                }}
              />
              <span style={{ fontSize: 12, color: D.muted }}>
                {filteredUsers.length} von {users.length} Usern
              </span>
            </div>

            <div style={{
              background: D.surface, border: `1px solid ${D.border}`,
              borderRadius: 14, overflow: "hidden",
            }}>
              {/* Table header — Phase 3 Sprint 4: + Sites + Last Login */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 55px 50px 50px 95px 175px 200px",
                padding: "10px 20px",
                borderBottom: `1px solid ${D.border}`,
              }}>
                {["User / E-Mail", "Plan", "Scans", "Sites", "Credits", "Letzter Login", "Plan ändern", "Aktionen"].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {h}
                  </span>
                ))}
              </div>

              {pagedUsers.map((user, i) => {
                const col = PLAN_COLOR[user.plan] ?? D.muted;
                return (
                  <div key={user.id} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 55px 50px 50px 95px 175px 200px",
                    padding: "12px 20px",
                    alignItems: "center",
                    borderBottom: i < pagedUsers.length - 1 ? `1px solid ${D.border}` : "none",
                  }}>
                    {/* Email + name + reg-date als sub-line (created_at zog von eigener Spalte hierher) */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </div>
                      <div style={{ fontSize: 11, color: D.muted }}>
                        {user.name ? `${user.name} · ` : ""}reg. {fmtDate(user.created_at)}
                      </div>
                    </div>

                    {/* Plan badge + Stripe-Status (Sprint 06.05.2026):
                        Subscription-aktiv = grüner "✓ Stripe"-Hinweis darunter.
                        Pay-per-Fix-only Käufer haben customer_id aber keine sub.
                        Grandfathered/manuell = beides null. */}
                    <div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                        color: col, background: `${col}18`,
                        border: `1px solid ${col}35`,
                      }}>
                        {user.plan}
                      </span>
                      <div
                        title={user.stripe_customer_id ? `cus: ${user.stripe_customer_id}${user.stripe_subscription_id ? ` · sub: ${user.stripe_subscription_id}` : ""}` : "Kein Stripe-Eintrag"}
                        style={{
                          fontSize: 9, marginTop: 4, fontWeight: 700, letterSpacing: "0.04em",
                          color: user.stripe_subscription_id ? D.green : user.stripe_customer_id ? D.amber : D.muted,
                        }}
                      >
                        {user.stripe_subscription_id ? "✓ Sub aktiv"
                          : user.stripe_customer_id     ? "● One-Time"
                          : "—"}
                      </div>
                    </div>

                    {/* Scan count */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: user.scan_count > 0 ? D.text : D.muted }}>
                      {user.scan_count}
                    </div>

                    {/* Saved-Websites count (Phase 3 Sprint 4) */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: user.saved_websites_count > 0 ? D.text : D.muted }}>
                      {user.saved_websites_count}
                    </div>

                    {/* Bonus scans */}
                    <div style={{ fontSize: 13, color: user.bonus_scans > 0 ? D.amber : D.muted }}>
                      {user.bonus_scans > 0 ? `+${user.bonus_scans}` : "—"}
                    </div>

                    {/* Letzter Login (Phase 3 Sprint 4) */}
                    <div style={{ fontSize: 12, color: D.muted }}>
                      {user.last_login_at ? fmtDate(user.last_login_at) : "—"}
                    </div>

                    {/* Plan ändern */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <select
                        value={planInput[user.id] ?? ""}
                        onChange={e => setPlanInput(prev => ({ ...prev, [user.id]: e.target.value }))}
                        style={{
                          flex: 1, padding: "4px 6px",
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${D.border}`,
                          borderRadius: 6, color: D.text, fontSize: 11,
                          outline: "none",
                        }}
                      >
                        <option value="">— wählen —</option>
                        {PLAN_KEYS.map(k => (
                          <option key={k} value={k} style={{ background: "#0F111A" }}>
                            {PLAN_LABEL[k] ?? k}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => changePlan(user.id)}
                        disabled={planLoading === user.id || !planInput[user.id]}
                        style={{
                          padding: "4px 8px", borderRadius: 6,
                          border: `1px solid ${D.green}40`,
                          background: planDone === user.id ? D.greenBg : "transparent",
                          color: planDone === user.id ? D.green : D.sub,
                          fontSize: 11, cursor: "pointer",
                          opacity: !planInput[user.id] ? 0.35 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {planDone === user.id ? "✓" : planLoading === user.id ? "…" : "Setzen"}
                      </button>
                    </div>

                    {/* Aktionen */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {/* Zeile 1: Login-as-User */}
                      <button
                        onClick={() => loginAsUser(user.id, user.email)}
                        disabled={impersonating === user.id}
                        title={`Als ${user.email} einloggen — siehst sein Dashboard`}
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: `1px solid ${D.amber}35`,
                          background: "rgba(245,158,11,0.06)",
                          color: D.amber, cursor: "pointer",
                          opacity: impersonating === user.id ? 0.5 : 1,
                          whiteSpace: "nowrap", textAlign: "left",
                        }}
                      >
                        {impersonating === user.id ? "…" : "👁 Als User einloggen"}
                      </button>
                      {/* Zeile 2: Credits gutschreiben */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <input
                          type="number"
                          min="1" max="999"
                          placeholder="Anzahl"
                          value={creditsInput[user.id] ?? ""}
                          onChange={e => setCreditsInput(prev => ({ ...prev, [user.id]: e.target.value }))}
                          style={{
                            flex: 1, minWidth: 0, padding: "4px 6px",
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${D.border}`,
                            borderRadius: 6, color: D.text, fontSize: 11,
                            outline: "none",
                          }}
                        />
                        <button
                          onClick={() => addCredits(user.id)}
                          disabled={creditsLoading === user.id || !creditsInput[user.id]}
                          title="Bonus-Scans gutschreiben"
                          style={{
                            padding: "4px 10px", borderRadius: 6,
                            border: `1px solid ${D.border}`,
                            background: creditsDone === user.id ? D.greenBg : "rgba(255,255,255,0.04)",
                            color: creditsDone === user.id ? D.green : D.sub,
                            fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                            opacity: (!creditsInput[user.id]) ? 0.4 : 1,
                          }}
                        >
                          {creditsDone === user.id ? "✓ Gut" : creditsLoading === user.id ? "…" : "+ Credits"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 14 }}>
                <button
                  onClick={() => setUserPage(p => Math.max(0, p - 1))}
                  disabled={userPage === 0}
                  style={{
                    padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${D.border}`, background: "transparent",
                    color: userPage === 0 ? D.muted : D.sub, cursor: userPage === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Zurück
                </button>
                <span style={{ fontSize: 12, color: D.muted }}>
                  Seite <strong style={{ color: D.text }}>{userPage + 1}</strong> von {totalPages}
                  <span style={{ marginLeft: 8, color: D.muted }}>({filteredUsers.length} User gesamt)</span>
                </span>
                <button
                  onClick={() => setUserPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={userPage >= totalPages - 1}
                  style={{
                    padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${D.border}`, background: "transparent",
                    color: userPage >= totalPages - 1 ? D.muted : D.sub,
                    cursor: userPage >= totalPages - 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Weiter →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── INCIDENTS TAB ─────────────────────────────────────────────────── */}
        {tab === "incidents" && (
          <>
            {/* Re-scan result toast */}
            {rescanResult && (
              <div style={{
                padding: "12px 18px", marginBottom: 16, borderRadius: 10,
                background: rescanResult.startsWith("✓") ? D.greenBg : D.redBg,
                border: `1px solid ${rescanResult.startsWith("✓") ? D.green : D.red}40`,
                color: rescanResult.startsWith("✓") ? D.green : D.red,
                fontSize: 13, fontWeight: 600,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span>{rescanResult}</span>
                <button onClick={() => { setRescanResult(null); setRescanUrl(null); }} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            )}

            {/* Stats strip */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: "Gesamt",  value: scanLogs.length, color: D.text },
                { label: "OK",      value: scanLogs.filter(l => l.status === "success").length, color: D.green },
                { label: "Cached",  value: scanLogs.filter(l => l.status === "cached" || l.from_cache).length, color: D.blue },
                { label: "Errors",  value: scanLogs.filter(l => l.status === "error").length, color: D.red },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "10px 16px", borderRadius: 9,
                  background: D.surface, border: `1px solid ${D.border}`,
                }}>
                  <span style={{ fontSize: 11, color: D.muted }}>{s.label} </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>

            {scanLogs.length === 0 ? (
              <div style={{
                padding: "60px 24px", textAlign: "center",
                border: `2px dashed ${D.border}`, borderRadius: 14,
              }}>
                <p style={{ color: D.muted, fontSize: 14 }}>
                  Noch keine Scan-Logs — werden ab jetzt automatisch aufgezeichnet.
                </p>
              </div>
            ) : (
              <div style={{
                background: D.surface, border: `1px solid ${D.border}`,
                borderRadius: 14, overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 100px 80px 80px 120px 90px",
                  padding: "10px 20px", borderBottom: `1px solid ${D.border}`,
                }}>
                  {["Status", "URL", "Typ", "User", "Dauer", "Zeit", "Aktion"].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {h}
                    </span>
                  ))}
                </div>

                {scanLogs.map((log, i) => (
                  <div key={log.id} style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 100px 80px 80px 120px 90px",
                    padding: "11px 20px",
                    alignItems: "center",
                    borderBottom: i < scanLogs.length - 1 ? `1px solid ${D.border}` : "none",
                    background: log.status === "error" ? "rgba(239,68,68,0.03)" : "transparent",
                  }}>
                    <div><StatusBadge status={log.status} fromCache={log.from_cache} /></div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: D.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {truncate(log.url, 55)}
                      </div>
                      {log.error_msg && (
                        <div style={{ fontSize: 11, color: D.red, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {log.error_msg}
                        </div>
                      )}
                    </div>

                    <div>
                      <span style={{ fontSize: 10, color: D.muted, background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 4 }}>
                        {log.scan_type}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: D.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.user_email ? log.user_email.split("@")[0] : "anon"}
                    </div>

                    <div style={{ fontSize: 12, color: D.muted }}>
                      {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "—"}
                    </div>

                    <div style={{ fontSize: 11, color: D.muted }}>
                      {fmtDateTime(log.created_at)}
                    </div>

                    <div>
                      <button
                        onClick={() => rerun(log.url)}
                        disabled={rescanUrl === log.url}
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: `1px solid ${D.blue}40`,
                          background: rescanUrl === log.url ? D.blueBg : "transparent",
                          color: D.blue, cursor: "pointer",
                          opacity: rescanUrl === log.url ? 0.6 : 1,
                        }}
                      >
                        {rescanUrl === log.url ? "…" : "Re-Run"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── SUPPORT TAB ──────────────────────────────────────────────────── */}
        {tab === "support" && (
          <div style={{ display: "grid", gridTemplateColumns: openTicket ? "320px 1fr" : "1fr", gap: 16, alignItems: "start" }}>

            {/* Ticket list */}
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Stats strip */}
              <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${D.border}` }}>
                {[
                  { label: "Offen",      value: tickets.filter(t => t.status === "open").length,     color: D.amber },
                  { label: "Beantwortet", value: tickets.filter(t => t.status === "replied").length,  color: D.blue },
                  { label: "Gelöst",      value: tickets.filter(t => t.status === "resolved").length, color: D.green },
                ].map((s, i) => (
                  <div key={s.label} style={{
                    flex: 1, padding: "10px 14px", textAlign: "center",
                    borderRight: i < 2 ? `1px solid ${D.border}` : "none",
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: D.muted, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {tickets.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <div style={{ marginBottom: 8, color: D.muted }}><Ticket size={32} /></div>
                  <p style={{ color: D.muted, fontSize: 13 }}>Noch keine Support-Anfragen.</p>
                </div>
              ) : (
                tickets.map((t, i) => {
                  const statusColor = t.status === "open" ? D.amber : t.status === "replied" ? D.blue : D.green;
                  const isActive = openTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => { setOpenTicket(t); setReplyText(""); }}
                      style={{
                        padding: "14px 18px",
                        borderBottom: i < tickets.length - 1 ? `1px solid ${D.border}` : "none",
                        cursor: "pointer",
                        background: isActive ? "rgba(79,142,247,0.06)" : "transparent",
                        borderLeft: isActive ? `3px solid ${D.blue}` : "3px solid transparent",
                        transition: "background 0.1s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: D.text, flex: 1, marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.subject}
                        </span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                          color: statusColor, background: `${statusColor}18`, flexShrink: 0,
                        }}>
                          {t.status === "open" ? "OFFEN" : t.status === "replied" ? "BEANTW." : "GESCHL."}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: D.muted }}>{t.user_email}</div>
                      <div style={{ fontSize: 11, color: D.muted, marginTop: 2 }}>{fmtDateTime(t.created_at)}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Ticket detail */}
            {openTicket && (
              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, padding: "24px" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: D.text }}>{openTicket.subject}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: D.muted }}>
                      Von <strong style={{ color: D.sub }}>{openTicket.user_email}</strong> · {fmtDateTime(openTicket.created_at)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {openTicket.status === "resolved" ? (
                      <button
                        onClick={() => reopenTicket(openTicket.id)}
                        style={{
                          padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                          border: `1px solid ${D.border}`, background: "transparent",
                          color: D.muted, cursor: "pointer",
                        }}
                      >
                        Wieder öffnen
                      </button>
                    ) : (
                      <button
                        onClick={() => resolveTicket(openTicket.id)}
                        style={{
                          padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                          border: `1px solid ${D.green}40`,
                          background: D.greenBg,
                          color: D.green, cursor: "pointer",
                        }}
                      >
                        <CheckCircle size={12} style={{ marginRight: 4, display: "inline" }} />Gelöst
                      </button>
                    )}
                    <button onClick={() => setOpenTicket(null)} style={{
                      padding: "5px 10px", borderRadius: 7, fontSize: 13,
                      border: `1px solid ${D.border}`, background: "transparent",
                      color: D.muted, cursor: "pointer",
                    }}>×</button>
                  </div>
                </div>

                {/* User message */}
                <div style={{
                  padding: "16px 18px", background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${D.border}`, borderRadius: 10, marginBottom: 20,
                }}>
                  <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Nutzer-Nachricht
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: D.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {openTicket.message}
                  </p>
                </div>

                {/* Metadata strip */}
                {openTicket.metadata && (openTicket.metadata.activeProjectUrl || openTicket.metadata.lastErrorLog || openTicket.metadata.plan) && (
                  <div style={{
                    padding: "12px 16px", background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${D.border}`, borderRadius: 9, marginBottom: 16,
                    fontSize: 12,
                  }}>
                    <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Automatische Metadaten
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {openTicket.metadata.activeProjectUrl && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ color: D.muted, flexShrink: 0 }}>🔗 Projekt</span>
                          <a href={openTicket.metadata.activeProjectUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color: D.blue, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {openTicket.metadata.activeProjectUrl}
                          </a>
                        </div>
                      )}
                      {openTicket.metadata.plan && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ color: D.muted, flexShrink: 0 }}>📦 Plan</span>
                          <span style={{ color: D.text }}>{openTicket.metadata.plan}</span>
                        </div>
                      )}
                      {openTicket.metadata.lastErrorLog && (
                        <div>
                          <div style={{ color: D.muted, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}><AlertTriangle size={12} /> Letzter Scan-Log:</div>
                          <div style={{
                            padding: "8px 10px", background: "rgba(239,68,68,0.06)",
                            border: `1px solid rgba(239,68,68,0.12)`, borderRadius: 7,
                            fontSize: 11, color: "rgba(248,113,113,0.8)", lineHeight: 1.5,
                            maxHeight: 80, overflowY: "auto", whiteSpace: "pre-wrap",
                          }}>
                            {openTicket.metadata.lastErrorLog}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Existing reply */}
                {openTicket.admin_reply && (
                  <div style={{
                    padding: "16px 18px", background: "rgba(79,142,247,0.05)",
                    border: `1px solid ${D.blue}30`, borderRadius: 10, marginBottom: 20,
                  }}>
                    <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: D.blue, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Admin-Antwort · {openTicket.replied_at ? fmtDateTime(openTicket.replied_at) : ""}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: D.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {openTicket.admin_reply}
                    </p>
                  </div>
                )}

                {/* Reply box */}
                {openTicket.status !== "resolved" && (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {openTicket.admin_reply ? "Neue Antwort" : "Antworten"}
                    </p>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Deine Antwort an den Nutzer…"
                      rows={5}
                      style={{
                        width: "100%", padding: "12px 14px", boxSizing: "border-box",
                        background: "rgba(255,255,255,0.03)",
                        border: `1px solid ${D.border}`, borderRadius: 9,
                        color: D.text, fontSize: 13, lineHeight: 1.6,
                        outline: "none", resize: "vertical",
                        fontFamily: "inherit",
                      }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                      <button
                        onClick={sendReply}
                        disabled={replying || !replyText.trim()}
                        style={{
                          padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                          background: replyText.trim() ? D.blue : "rgba(79,142,247,0.2)",
                          color: "#fff", border: "none", cursor: replyText.trim() ? "pointer" : "not-allowed",
                          opacity: replying ? 0.6 : 1,
                        }}
                      >
                        {replying ? "Senden…" : "Antwort senden"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── INFRA TAB ────────────────────────────────────────────────────── */}
        {tab === "infra" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* DB Stats */}
            <div style={{ gridColumn: "1 / -1", padding: "24px", background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Datenbank · System-Stats
                  </p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: D.text }}>
                    {dbStats.db_size}
                    <span style={{ fontSize: 13, fontWeight: 400, color: D.muted, marginLeft: 10 }}>Gesamtgröße</span>
                  </p>
                </div>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(34,197,94,0.1)", color: D.green, fontWeight: 700 }}>
                  Neon · Frankfurt
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                {dbStats.tables.map(t => (
                  <div key={t.table_name} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "9px 13px", background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${D.border}`, borderRadius: 8,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: D.text }}>{t.table_name}</div>
                      <div style={{ fontSize: 11, color: D.muted }}>{t.rows.toLocaleString("de-DE")} Zeilen</div>
                    </div>
                    <span style={{ fontSize: 11, color: D.blue, fontWeight: 600 }}>{t.size}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cache performance */}
            <div style={{
              padding: "24px", background: D.surface,
              border: `1px solid ${D.border}`, borderRadius: 14,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Cache-Performance
              </p>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: D.sub }}>
                Eingesparste KI-Kosten durch Cache-Hits
              </p>
              <DonutChart
                fresh={cache.regular ?? 0}
                cached={cache.fullsite ?? 0}
                label="Scan-Cache"
              />

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: D.sub }}>
                  <span>Regular Cache-Einträge</span>
                  <span style={{ color: D.text, fontWeight: 600 }}>{cache.regular ?? 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: D.sub }}>
                  <span>Full-Site Cache-Einträge</span>
                  <span style={{ color: D.text, fontWeight: 600 }}>{cache.fullsite ?? 0}</span>
                </div>
                <div style={{ height: 1, background: D.border }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: D.sub }}>
                  <span>Gesch. ersparte KI-Kosten</span>
                  <span style={{ color: D.green, fontWeight: 700 }}>
                    ~{Math.round(((cache.regular ?? 0) + (cache.fullsite ?? 0)) * 0.003 * 100) / 100}€
                  </span>
                </div>
              </div>
            </div>

            {/* Widget Stats */}
            <div style={{
              padding: "24px", background: D.surface,
              border: `1px solid ${D.border}`, borderRadius: 14,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Widget-Statistiken
              </p>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: D.sub }}>
                Lead-Generierung über alle Agency-Widgets
              </p>

              <div style={{ fontSize: 52, fontWeight: 800, color: D.amber, letterSpacing: "-0.03em", marginBottom: 8 }}>
                {widgetLeads}
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: D.sub }}>
                Leads gesamt via Agency-Widgets
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Durchschn. Leads/Agentur", value: ((kpi.planCounts["agency"] ?? 0) + (kpi.planCounts["agency-starter"] ?? 0) + (kpi.planCounts["agency-pro"] ?? 0)) > 0
                    ? Math.round(widgetLeads / Math.max(1, (kpi.planCounts["agency"] ?? 0) + (kpi.planCounts["agency-starter"] ?? 0) + (kpi.planCounts["agency-pro"] ?? 0)))
                    : 0 },
                  { label: "Agency-User mit Widget", value: (kpi.planCounts["agency"] ?? 0) + (kpi.planCounts["agency-starter"] ?? 0) + (kpi.planCounts["agency-pro"] ?? 0) },
                ].map(s => (
                  <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: D.sub }}>
                    <span>{s.label}</span>
                    <span style={{ color: D.text, fontWeight: 700 }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scan type distribution */}
            <div style={{
              padding: "24px", background: D.surface,
              border: `1px solid ${D.border}`, borderRadius: 14,
            }}>
              <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Scan-Typen (letzte 50)
              </p>
              {(() => {
                const counts: Record<string, number> = {};
                for (const log of scanLogs) {
                  counts[log.scan_type] = (counts[log.scan_type] ?? 0) + 1;
                }
                return Object.entries(counts).map(([type, cnt]) => (
                  <div key={type} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: D.sub }}>{type}</span>
                    <span style={{ color: D.text, fontWeight: 600 }}>{cnt}</span>
                  </div>
                ));
              })()}
              {scanLogs.length === 0 && <p style={{ color: D.muted, fontSize: 13 }}>Noch keine Logs.</p>}
            </div>

            {/* Manueller Guide-Unlock (Notfall) ─────────────────────────────
                Wird gebraucht wenn ein Stripe-Webhook hängt (Resend-Domain
                nicht verifiziert, Stripe-Endpoint Fehler etc.) und der Käufer
                seinen Guide nicht bekommt. Wir suchen per Email den User,
                schreiben den Unlock manuell. ON CONFLICT DO NOTHING — Action
                ist wiederholbar wenn unklar ob Webhook doch noch durchkam. */}
            <div style={{
              gridColumn: "1 / -1",
              padding: "24px", background: D.surface,
              border: `1px solid ${D.border}`, borderRadius: 14,
              marginBottom: 16,
            }}>
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Notfall · Guide manuell freischalten
                </p>
                <p style={{ margin: 0, fontSize: 12, color: D.sub }}>
                  Wenn ein Stripe-Webhook hängt: User-Email + Guide-ID eingeben → schreibt user_unlocked_guides direkt. Idempotent.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr auto", gap: 10, alignItems: "stretch" }}>
                <input
                  type="email"
                  value={unlockEmail}
                  onChange={e => setUnlockEmail(e.target.value)}
                  placeholder="käufer@email.de"
                  style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: "#fff", outline: "none" }}
                />
                <input
                  type="text"
                  value={unlockGuideId}
                  onChange={e => setUnlockGuideId(e.target.value)}
                  placeholder="guide-id (z.B. wp-critical-error)"
                  style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: "#fff", outline: "none", fontFamily: "monospace" }}
                />
                <select
                  value={unlockHoster}
                  onChange={e => setUnlockHoster(e.target.value)}
                  style={{ padding: "9px 12px", fontSize: 13, borderRadius: 8, border: `1px solid ${D.border}`, background: "rgba(0,0,0,0.3)", color: "#fff", outline: "none" }}
                >
                  <option value="default">Anderer Hoster</option>
                  <option value="strato">Strato</option>
                  <option value="ionos">IONOS</option>
                  <option value="all-inkl">All-Inkl</option>
                  <option value="hostinger">Hostinger</option>
                </select>
                <button
                  onClick={unlockGuide}
                  disabled={unlockLoading || !unlockEmail || !unlockGuideId}
                  style={{
                    padding: "0 18px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
                    background: "rgba(74,222,128,0.15)", color: "#4ade80",
                    border: "1px solid rgba(74,222,128,0.3)", cursor: "pointer",
                    opacity: (unlockLoading || !unlockEmail || !unlockGuideId) ? 0.4 : 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {unlockLoading ? "läuft…" : "Freischalten"}
                </button>
              </div>
              {unlockMsg && (
                <div style={{
                  marginTop: 12, padding: "8px 12px", borderRadius: 7,
                  fontSize: 12,
                  background: unlockMsg.ok ? "rgba(74,222,128,0.10)" : "rgba(239,68,68,0.10)",
                  border:     unlockMsg.ok ? "1px solid rgba(74,222,128,0.30)" : "1px solid rgba(239,68,68,0.30)",
                  color:      unlockMsg.ok ? "#4ade80" : "#fca5a5",
                }}>
                  {unlockMsg.text}
                </div>
              )}
            </div>

            {/* Rate Limit Manager */}
            <div style={{
              gridColumn: "1 / -1",
              padding: "24px", background: D.surface,
              border: `1px solid ${D.border}`, borderRadius: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Rate Limit Manager
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: D.sub }}>
                    IP-basierte Scan-Limits einsehen und zurücksetzen (für Tests &amp; Support)
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={loadRateLimits}
                    disabled={rateLimitLoading}
                    style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${D.border}`, background: "transparent",
                      color: D.sub, cursor: "pointer", opacity: rateLimitLoading ? 0.5 : 1,
                    }}
                  >
                    {rateLimitLoading ? "Lädt…" : rateLimitRows === null ? "Laden" : "Aktualisieren"}
                  </button>
                  <button
                    onClick={() => {
                      try { localStorage.removeItem("wf_free_scan_ts"); } catch { /* ignore */ }
                      setRateLimitMsg("Browser-Sperre aufgehoben — localStorage gelöscht.");
                    }}
                    style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${D.amber}40`, background: D.amberBg,
                      color: D.amber, cursor: "pointer",
                    }}
                  >
                    localStorage löschen
                  </button>
                  <a
                    href="/api/admin/test-bypass?action=enable"
                    style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                      border: `1px solid ${D.green}40`, background: D.greenBg,
                      color: D.green, cursor: "pointer", textDecoration: "none",
                      display: "inline-flex", alignItems: "center",
                    }}
                    title="Setzt Cookie wf_admin_test — umgeht IP-Rate-Limit beim Scan (4h)"
                  >
                    Test-Modus aktivieren
                  </a>
                  <a
                    href="/api/admin/test-bypass?action=disable"
                    style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                      border: `1px solid ${D.border}`, background: "transparent",
                      color: D.muted, cursor: "pointer", textDecoration: "none",
                      display: "inline-flex", alignItems: "center",
                    }}
                  >
                    Test-Modus deaktivieren
                  </a>
                  <button
                    onClick={() => { if (confirm("Wirklich ALLE Rate-Limit-Einträge löschen?")) resetRateLimit(); }}
                    disabled={rateLimitLoading || !rateLimitRows?.length}
                    style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                      border: `1px solid ${D.red}40`, background: D.redBg,
                      color: D.red, cursor: "pointer",
                      opacity: (!rateLimitRows?.length || rateLimitLoading) ? 0.4 : 1,
                    }}
                  >
                    Alle löschen (DB)
                  </button>
                </div>
              </div>

              {rateLimitMsg && (
                <div style={{
                  padding: "8px 14px", marginBottom: 12, borderRadius: 8,
                  background: D.greenBg, border: `1px solid ${D.green}40`,
                  color: D.green, fontSize: 12, fontWeight: 600,
                }}>
                  {rateLimitMsg}
                </div>
              )}

              {rateLimitRows === null ? (
                <p style={{ color: D.muted, fontSize: 13 }}>Klicke auf "Laden" um die aktuellen Einträge zu sehen.</p>
              ) : rateLimitRows.length === 0 ? (
                <p style={{ color: D.green, fontSize: 13 }}>Keine aktiven Rate-Limit-Einträge — alle können scannen.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  {/* Table header */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 160px 160px 80px 90px",
                    padding: "8px 12px", borderBottom: `1px solid ${D.border}`,
                  }}>
                    {["IP-Hash (SHA-256)", "Erster Scan", "Letzter Scan", "Anzahl", "Aktion"].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                    ))}
                  </div>
                  {rateLimitRows.map((row, i) => (
                    <div key={row.ip_hash} style={{
                      display: "grid", gridTemplateColumns: "1fr 160px 160px 80px 90px",
                      padding: "10px 12px", alignItems: "center",
                      borderBottom: i < rateLimitRows.length - 1 ? `1px solid ${D.border}` : "none",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                    }}>
                      <span style={{ fontSize: 11, fontFamily: "monospace", color: D.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.ip_hash.slice(0, 16)}…
                      </span>
                      <span style={{ fontSize: 12, color: D.sub }}>{fmtDateTime(row.first_scan_at)}</span>
                      <span style={{ fontSize: 12, color: D.sub }}>{fmtDateTime(row.last_scan_at)}</span>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: row.scan_count >= 2 ? D.red : D.amber,
                      }}>
                        {row.scan_count}/2
                      </span>
                      <button
                        onClick={() => resetRateLimit(row.ip_hash)}
                        disabled={rateLimitLoading}
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: `1px solid ${D.red}35`, background: "transparent",
                          color: D.red, cursor: "pointer", opacity: rateLimitLoading ? 0.5 : 1,
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div style={{
              padding: "24px", background: D.surface,
              border: `1px solid ${D.border}`, borderRadius: 14,
            }}>
              <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: D.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Quick Links
              </p>
              {[
                { label: "Neon DB Console", href: "https://console.neon.tech" },
                { label: "Vercel Deployments", href: "https://vercel.com/dashboard" },
                { label: "Stripe Dashboard", href: "https://dashboard.stripe.com" },
                { label: "Resend Logs", href: "https://resend.com/emails" },
                { label: "Anthropic Console", href: "https://console.anthropic.com" },
              ].map(link => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: `1px solid ${D.border}`,
                  textDecoration: "none", color: D.sub, fontSize: 13,
                  transition: "color 0.1s",
                }}>
                  {link.label}
                  <span style={{ color: D.muted, fontSize: 11 }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
