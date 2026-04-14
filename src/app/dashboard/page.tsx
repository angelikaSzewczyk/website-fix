import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import FreeDashboardClient from "./free-dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — WebsiteFix",
  robots: { index: false },
};

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:          "#F8FAFC",
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  divider:     "#F1F5F9",
  shadow:      "0 1px 3px rgba(0,0,0,0.06)",
  shadowMd:    "0 4px 16px rgba(0,0,0,0.08)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenDot:    "#22C55E",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberDot:    "#F59E0B",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redDot:      "#EF4444",
  yellow:      "#EAB308",
} as const;

// ─── Plan → Layout ──────────────────────────────────────────────────────────────
// DB plan values: "free" | "single" | "pro" (Agency Starter) | "agentur" (Agency Pro)
function getLayout(plan: string): "free" | "single" | "agency" {
  if (["agency-pro", "agency-starter", "agentur", "pro", "agency_core", "agency_scale"].includes(plan)) return "agency";
  if (plan === "single" || plan === "smart-guard" || plan === "freelancer") return "single";
  return "free";
}

// ─── CMS Detection ──────────────────────────────────────────────────────────────
function detectCMS(text: string, url?: string): { label: string; version?: string } {
  const t = (text + " " + (url ?? "")).toLowerCase();
  if (/wp-content|wp-admin|wp-json|wordpress/.test(t)) return { label: "WordPress", version: "6.x" };
  if (/next\.js|nextjs|\/_next\//.test(t))             return { label: "Next.js" };
  if (/shopify/.test(t))                               return { label: "Shopify" };
  if (/webflow/.test(t))                               return { label: "Webflow" };
  if (/wix\.com/.test(t))                              return { label: "Wix" };
  if (/typo3/.test(t))                                 return { label: "TYPO3" };
  if (/joomla/.test(t))                                return { label: "Joomla" };
  if (/drupal/.test(t))                                return { label: "Drupal" };
  if (/react/.test(t))                                 return { label: "React" };
  return { label: "Custom" };
}

// ─── Issue Parsing ─────────────────────────────────────────────────────────────
type ParsedIssue = {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik";
};

function parseIssues(text: string): ParsedIssue[] {
  const issues: ParsedIssue[] = [];
  let current: ParsedIssue | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("# ") || line.startsWith("## ")) {
      if (current) { issues.push(current); current = null; }
      continue;
    }
    let sev: "red" | "yellow" | "green" | null = null;
    if (line.startsWith("**🔴")) sev = "red";
    else if (line.startsWith("**🟡")) sev = "yellow";
    else if (line.startsWith("**🟢")) sev = "green";
    if (sev) {
      if (current) issues.push(current);
      const title = line.replace(/\*\*/g, "").replace(/^[🔴🟡🟢]\s*/, "").trim();
      const tl = title.toLowerCase();
      const category: ParsedIssue["category"] =
        /bfsg|wcag|barriere|impressum|datenschutz|cookie|dsgvo|recht|abmahn/.test(tl) ? "recht" :
        /speed|lcp|cls|fid|ladezeit|performance|pagespeed|core web/.test(tl) ? "speed" : "technik";
      current = { severity: sev, title, body: "", category };
    } else if (current && !line.match(/^\d+\./) && current.body.length < 120) {
      current.body += (current.body ? " " : "") + line;
    }
  }
  if (current) issues.push(current);
  return issues.slice(0, 30);
}

// ─── Fix Guide per CMS ─────────────────────────────────────────────────────────
function getFixGuide(title: string, cms: string): string {
  const t = title.toLowerCase();
  const isWP = cms === "WordPress";
  if (/alt.?text|alt-text/.test(t))
    return isWP ? "WordPress: Medien → Bild auswählen → Feld 'Alternativer Text' ausfüllen. Kurz & beschreibend halten." : "Füge im HTML-Tag img das Attribut alt='Beschreibung' hinzu.";
  if (/meta.?desc|beschreibung/.test(t))
    return isWP ? "Yoast SEO / RankMath: Seite bearbeiten → SEO-Vorschau → Meta-Beschreibung eingeben (150–160 Zeichen)." : "Füge <meta name='description' content='...'> im <head> ein.";
  if (/h1|überschrift/.test(t))
    return "Jede Seite sollte genau eine H1-Überschrift haben. Sie beschreibt das Hauptthema der Seite.";
  if (/ssl|https|zertifikat/.test(t))
    return "Aktiviere SSL in deinem Hosting-Kontrollpanel (kostenlos via Let's Encrypt). Danach HTTP → HTTPS Weiterleitungen einrichten.";
  if (/sitemap/.test(t))
    return isWP ? "Yoast SEO: Einstellungen → XML-Sitemaps aktivieren. Dann in Google Search Console einreichen." : "Erstelle eine sitemap.xml und reiche sie in der Google Search Console ein.";
  if (/robots\.txt/.test(t))
    return "Die robots.txt muss erreichbar sein unter deinedomain.de/robots.txt und darf wichtige Seiten nicht blockieren.";
  if (/cookie|einwilligung/.test(t))
    return "Ein DSGVO-konformes Cookie-Consent-Tool ist Pflicht (z.B. Cookiebot, Borlabs Cookie). Vor dem Laden von Tracking-Skripten Einwilligung einholen.";
  if (/impressum/.test(t))
    return "Das Impressum muss von jeder Seite erreichbar sein. Pflichtangaben: Name, Adresse, E-Mail, Tel. (§ 5 TMG).";
  if (/ladezeit|speed|pagespeed|performance/.test(t))
    return isWP ? "WP Rocket oder LiteSpeed Cache installieren. Bilder in WebP konvertieren. Hosting-Paket ggf. upgraden." : "Bilder komprimieren, CSS/JS minimieren, CDN einsetzen (z.B. Cloudflare).";
  return "Prüfe den vollständigen Bericht für detaillierte Handlungsempfehlungen zu diesem Punkt.";
}

// ─── SVG History Chart ─────────────────────────────────────────────────────────
type ScanBrief = { id: string; url: string; type: string; created_at: string; issue_count: number | null };

function HistoryChart({ scans }: { scans: ScanBrief[] }) {
  const last7 = scans.slice(0, 7).reverse();
  const rawScores = last7.map(s => Math.max(10, 100 - (s.issue_count ?? 5) * 8));
  // Pad to at least 2 points
  while (rawScores.length < 2) rawScores.unshift(rawScores[0] ?? 72);
  const n = rawScores.length;

  const W = 520, H = 56, PX = 10, PY = 8;
  const minV = Math.min(...rawScores);
  const maxV = Math.max(...rawScores);
  const range = Math.max(maxV - minV, 20);

  const pts = rawScores.map((s, i) => ({
    x: PX + (i / (n - 1)) * (W - PX * 2),
    y: PY + (1 - (s - minV) / range) * (H - PY * 2),
    s,
  }));

  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area     = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} ` +
                   pts.slice(1).map(p => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
                   ` L${pts[n-1].x.toFixed(1)},${(H - PY).toFixed(1)} L${pts[0].x.toFixed(1)},${(H - PY).toFixed(1)} Z`;

  const latest = rawScores[n - 1];
  const prev   = rawScores[n - 2];
  const delta  = latest - prev;
  const color  = latest >= 70 ? C.green : latest >= 50 ? C.amber : C.red;
  const dates  = last7.map(s => {
    const d = new Date(s.created_at);
    return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}`;
  });

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 20px 10px", marginBottom: 16, boxShadow: C.shadow }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Score-Verlauf · 7 Tage</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 4, background: "#ECFDF5", color: C.green, border: "1px solid #A7F3D0" }}>
            LIVE MONITORING
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.03em", lineHeight: 1 }}>{latest}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? C.green : C.red }}>
            {delta >= 0 ? "↑" : "↓"}{Math.abs(delta)}
          </span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", height: 52, overflow: "visible" }}>
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#hg)" />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5"
            fill={i === n - 1 ? color : C.card}
            stroke={color} strokeWidth="1.5" />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {dates.map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: C.textMuted, fontVariantNumeric: "tabular-nums" }}>{d}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Scan = ScanBrief & { result?: string | null };
type CriticalSite = {
  id: string; url: string; name: string | null;
  last_check_status: string; last_check_at: string;
  ssl_days_left: number | null; security_score: number | null;
  alerts: { level: string; message: string }[] | null;
};

// Agency Starter = DB plan "pro" (99€)  |  Agency Pro = DB plan "agentur" (199€)
const PLAN_BADGE = {
  free:    { label: "Free",           color: C.textMuted, bg: "#F1F5F9", border: C.border },
  single:  { label: "Smart-Guard",    color: "#059669",   bg: "#ECFDF5", border: "#A7F3D0" },
  pro:     { label: "Agency Starter", color: C.blue,      bg: C.blueBg,  border: C.blueBorder },
  agentur: { label: "Agency Pro",     color: "#7C3AED",   bg: "#F5F3FF", border: "#DDD6FE" },
} as const;

const DUMMY_CLIENTS = [
  { id: "1", name: "Autohaus Müller GmbH",       contact: "Hans Müller",       initials: "AM", color: "#2563EB", domains: ["autohaus-mueller.de","gebrauchtwagen-mueller.de"], status: "warning"  as const, lastScan: "08. Apr 2026", assignee: "JS", autoReport: true,  clientLogin: true  },
  { id: "2", name: "Kanzlei Schneider & Partner", contact: "Dr. Anna Schneider", initials: "KS", color: "#16A34A", domains: ["kanzlei-schneider.de"],                             status: "ok"       as const, lastScan: "09. Apr 2026", assignee: "MK", autoReport: true,  clientLogin: true  },
  { id: "3", name: "Bäckerei Hoffmann",           contact: "Klaus Hoffmann",    initials: "BH", color: "#D97706", domains: ["baeckerei-hoffmann.de","hoffmann-catering.de","hoffmann-shop.de"], status: "critical" as const, lastScan: "07. Apr 2026", assignee: "JS", autoReport: false, clientLogin: false },
  { id: "4", name: "TechStart Berlin UG",         contact: "Lena Vogel",        initials: "TB", color: "#7C3AED", domains: ["techstart.berlin"],                                   status: "ok"       as const, lastScan: "10. Apr 2026", assignee: "AW", autoReport: true,  clientLogin: true  },
];

// ─── Shared helpers ─────────────────────────────────────────────────────────────
function PdfIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
  );
}

function StatusBadge({ status }: { status: "ok" | "warning" | "critical" | string }) {
  const conf = {
    ok:       { label: "OK",       color: C.green, bg: C.greenBg, dot: C.greenDot, border: "#A7F3D0" },
    warning:  { label: "Warnung",  color: C.amber, bg: C.amberBg, dot: C.amberDot, border: "#FDE68A" },
    critical: { label: "Kritisch", color: C.red,   bg: C.redBg,   dot: C.redDot,   border: "#FECACA" },
  }[status] ?? { label: "—", color: C.textMuted, bg: C.divider, dot: C.textMuted, border: C.border };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, color: conf.color, background: conf.bg, border: `1px solid ${conf.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: conf.dot, display: "inline-block" }} />
      {conf.label}
    </span>
  );
}

function ProgressBar({ plan }: { plan: string }) {
  const badge = PLAN_BADGE[plan as keyof typeof PLAN_BADGE] ?? PLAN_BADGE.free;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "8px 28px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, whiteSpace: "nowrap", letterSpacing: "0.08em", textTransform: "uppercase" }}>Setup</span>
        <div style={{ flex: 1, height: 5, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "35%", borderRadius: 99, background: C.yellow }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.yellow, whiteSpace: "nowrap" }}>35%</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
          {badge.label}
        </span>
        {plan === "free" && (
          <Link href="/preise" style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, textDecoration: "none", background: "#FFFBEB", border: "1px solid #FDE68A", color: "#D97706" }}>
            Upgrade →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Agency Top Bar ─────────────────────────────────────────────────────────────
function AgencyTopBar({ badge, usedSlots, slotsLabel, clientSlotLimit }: {
  badge: { label: string; color: string; bg: string; border: string };
  usedSlots: number; slotsLabel: string; clientSlotLimit: number;
}) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 30, background: "#fff", borderBottom: `1px solid ${C.border}`, padding: "8px 28px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.text, whiteSpace: "nowrap" }}>Kommandozentrale</span>
        <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
          Plan: {badge.label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 12px", borderRadius: 20, background: usedSlots >= clientSlotLimit ? C.redBg : C.divider, border: `1px solid ${usedSlots >= clientSlotLimit ? "#FECACA" : C.border}` }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={usedSlots >= clientSlotLimit ? C.red : C.textSub} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: usedSlots >= clientSlotLimit ? C.red : C.text, whiteSpace: "nowrap" }}>
            Slots: {usedSlots} / {slotsLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function ClientRow({ client, last }: { client: typeof DUMMY_CLIENTS[0]; last: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 1fr 180px", gap: 16, alignItems: "center", padding: "13px 20px", borderBottom: last ? "none" : `1px solid ${C.divider}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: `${client.color}18`, border: `1px solid ${client.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: client.color }}>{client.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>{client.contact}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {client.domains.slice(0, 2).map(d => <span key={d} style={{ fontSize: 11, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d}</span>)}
        {client.domains.length > 2 && <span style={{ fontSize: 10, color: C.textMuted }}>+{client.domains.length - 2} weitere</span>}
      </div>
      <StatusBadge status={client.status} />
      <span style={{ fontSize: 11, color: C.textMuted }}>{client.lastScan}</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#F0FDF4", border: "1px solid #A7F3D0", color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer" }}><PdfIcon /> PDF</button>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#F5F3FF", border: "1px solid #DDD6FE", color: "#7C3AED", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          <svg width="11" height="11" viewBox="0 0 24 24"><g fill="#7C3AED"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></g></svg>
        </button>
        <button style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          <svg width="11" height="11" viewBox="0 0 24 24"><g fill={C.blue}><path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.001 1.001 0 0 0-1.021-1.005zM23.013 0H11.459a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.019 12.49V1.005A1.001 1.001 0 0 0 23.013 0z"/></g></svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sql       = neon(process.env.DATABASE_URL!);
  const plan      = ((session.user as { plan?: string }).plan ?? "free") as keyof typeof PLAN_BADGE;
  const badge     = PLAN_BADGE[plan] ?? PLAN_BADGE.free;
  const firstName = session.user.name?.split(" ")[0] ?? "Dashboard";
  const layout    = getLayout(plan);
  const isAgency  = layout === "agency";
  const isSingle  = layout === "single";   // Smart-Guard plan
  const isFree    = layout === "free";

  const scans = await sql`
    SELECT id, url, type, created_at, issue_count
    FROM scans WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC LIMIT 20
  ` as Scan[];

  // Agency data
  let criticalSites: CriticalSite[] = [];
  let domainCount = DUMMY_CLIENTS.reduce((s, c) => s + c.domains.length, 0);
  const domainLimit = plan === "agentur" ? 999 : 10;
  if (isAgency) {
    try {
      criticalSites = await sql`
        SELECT sw.id::text, sw.url, sw.name, sw.last_check_status, sw.last_check_at,
               wc.ssl_days_left, wc.security_score, wc.alerts
        FROM saved_websites sw
        LEFT JOIN LATERAL (
          SELECT ssl_days_left, security_score, alerts FROM website_checks
          WHERE website_id = sw.id AND user_id = sw.user_id
          ORDER BY checked_at DESC LIMIT 1
        ) wc ON true
        WHERE sw.user_id = ${session.user.id}
        ORDER BY sw.last_check_at DESC NULLS LAST LIMIT 10
      ` as CriticalSite[];
      domainCount = criticalSites.length;
    } catch { /* table may not exist yet */ }
  }

  // Free/Single: last scan result for issue parsing + tech fingerprint
  let lastScanResult: string | null = null;
  let techFingerprint: import("@/lib/tech-detector").TechFingerprint | null = null;
  const lastScan = scans[0] ?? null;
  if (!isAgency && lastScan) {
    try {
      const rows = await sql`
        SELECT result, tech_fingerprint
        FROM scans WHERE id = ${lastScan.id} AND user_id = ${session.user.id}
      ` as { result: string | null; tech_fingerprint: unknown }[];
      lastScanResult = rows[0]?.result ?? null;
      techFingerprint = (rows[0]?.tech_fingerprint as import("@/lib/tech-detector").TechFingerprint | null) ?? null;
    } catch {}
  }

  // Monthly scan counter (Free only)
  const now = new Date();
  const monthlyScans = scans.filter(s => {
    const d = new Date(s.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const SCAN_LIMIT = 3;

  // Parse issues
  const issues: ParsedIssue[] = lastScanResult ? parseIssues(lastScanResult) : [];
  const cms = lastScanResult ? detectCMS(lastScanResult, lastScan?.url) : { label: "–" };

  const redIssues    = issues.filter(i => i.severity === "red");
  const yellowIssues = issues.filter(i => i.severity === "yellow");
  const rechtIssues  = issues.filter(i => i.category === "recht");
  const speedIssues  = issues.filter(i => i.category === "speed");
  const techIssues   = issues.filter(i => i.category === "technik");

  const bfsgOk     = rechtIssues.length === 0;
  const speedScore = Math.max(10, 100 - speedIssues.length * 15 - yellowIssues.length * 8);

  // Agency slots: Starter = 10, Pro = unlimited
  const clientSlotLimit = plan === "agentur" ? 999 : 10;
  const usedSlots       = DUMMY_CLIENTS.length;
  const slotsLabel      = plan === "agentur" ? "∞" : String(clientSlotLimit);

  return (
    <div style={{ background: isAgency ? C.bg : "#080C14", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        a { text-decoration: none; }
        .dash-row:hover  { background: ${C.divider} !important; }
        .fix-details summary { cursor: pointer; user-select: none; }
        .fix-details summary::-webkit-details-marker { display: none; }
        .issue-row:hover { background: #F8FAFC !important; }
        /* Agency: new-client modal via CSS :target */
        .agency-modal { display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.5); z-index: 200; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .agency-modal:target { display: flex; }
        .agency-client-row:hover { background: #F8FAFC !important; }
        /* Smart-Guard: checkbox-based done state via :has() */
        .fix-details:has(.fix-done:checked) { background: #F0FDF4 !important; }
        .fix-details:has(.fix-done:checked) > summary .issue-title { text-decoration: line-through; color: ${C.textMuted} !important; }
        /* Pulse animation for monitoring dot */
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .pulse-dot { animation: pulse-ring 2s infinite; }
        /* Glassmorphism lock overlay for Free-plan locked features */
        .lock-glass { position: absolute; inset: 0; background: rgba(248,250,252,0.9); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; border-radius: 14px; padding: 24px; text-align: center; z-index: 2; }
        /* Auto-Report CSS toggle (server component, no JS) */
        .ar-cb { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
        .ar-track { display: inline-flex; width: 36px; height: 20px; border-radius: 10px; background: #CBD5E1; position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
        .ar-thumb { display: block; width: 14px; height: 14px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        .ar-wrap:has(.ar-cb:checked) .ar-track { background: #16A34A; }
        .ar-wrap:has(.ar-cb:checked) .ar-thumb { left: 19px; }
      `}</style>

      {isAgency && <AgencyTopBar badge={badge} usedSlots={usedSlots} slotsLabel={slotsLabel} clientSlotLimit={clientSlotLimit} />}

      {/* ══════════════════════════════════════════════════════════
          FREE / SINGLE (Smart-Guard) LAYOUT — PREMIUM DARK
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (
        <FreeDashboardClient
          firstName={firstName}
          plan={plan}
          lastScan={lastScan}
          lastScanResult={lastScanResult}
          issues={issues}
          redCount={redIssues.length}
          yellowCount={yellowIssues.length}
          rechtIssues={rechtIssues}
          speedIssues={speedIssues}
          techIssues={techIssues}
          cms={cms}
          bfsgOk={bfsgOk}
          speedScore={speedScore}
          scans={scans}
          monthlyScans={monthlyScans}
          scanLimit={SCAN_LIMIT}
          fingerprint={techFingerprint}
        />
      )}

{/* ══════════════════════════════════════════════════════════
          AGENCY LAYOUT  (plan: pro = Agency Starter | agentur = Agency Pro)
          ══════════════════════════════════════════════════════════ */}
      {isAgency && (()=> {
        // Agency Pro gets Indigo/Violet accent; Starter stays blue
        const accent       = plan === "agentur" ? "#7C3AED" : C.blue;
        const accentBg     = plan === "agentur" ? "#F5F3FF" : C.blueBg;
        const accentBorder = plan === "agentur" ? "#DDD6FE" : C.blueBorder;

        const healthScore = (status: string) =>
          status === "ok" ? 88 : status === "warning" ? 61 : 34;

        const lastScanId = scans[0]?.id ?? null;

        return (
          <main style={{ padding: "28px 32px 80px" }}>

              {/* ── Header ── */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em" }}>Kommandozentrale</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {/* Plan badge */}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: "nowrap" }}>
                    Plan: {badge.label}
                  </span>
                  {/* Slots */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: usedSlots >= clientSlotLimit ? C.redBg : C.divider, border: `1px solid ${usedSlots >= clientSlotLimit ? "#FECACA" : C.border}` }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={usedSlots >= clientSlotLimit ? C.red : C.textSub} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: usedSlots >= clientSlotLimit ? C.red : C.text, whiteSpace: "nowrap" }}>
                      Slots: {usedSlots} / {slotsLabel}
                    </span>
                  </div>
                  {/* Branding badge — differs by plan tier */}
                  {plan === "agentur" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: "#F5F3FF", border: "1px solid #DDD6FE", color: "#7C3AED", whiteSpace: "nowrap" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Full White-Label aktiv
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 20, background: "#F0FDF4", border: "1px solid #A7F3D0", color: "#16A34A", whiteSpace: "nowrap" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Neutrales Branding aktiv
                    </span>
                  )}
                  {/* CTA */}
                  <a href="#modal-new-client" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: C.yellow, color: "#0a0a0a", fontWeight: 800, fontSize: 13, textDecoration: "none", boxShadow: "0 2px 12px rgba(234,179,8,0.35)", whiteSpace: "nowrap" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    + Neuen Kunden
                  </a>
                </div>
              </div>

              {/* ── Stat Strip ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { value: DUMMY_CLIENTS.length,                                          label: "Aktive Kunden",     color: C.blue,    icon: "👥" },
                  { value: DUMMY_CLIENTS.reduce((s, c) => s + c.domains.length, 0),       label: "Domains gesamt",   color: C.green,   icon: "🌐" },
                  { value: DUMMY_CLIENTS.filter(c => c.status === "critical").length,      label: "Handlungsbedarf",  color: C.red,     icon: "🔴" },
                  { value: scans.length,                                                   label: "Scans gesamt",     color: C.textSub, icon: "📊" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: C.shadow, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.025em", lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Kunden-Matrix ── */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadowMd }}>

                {/* Table header */}
                <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Kunden-Matrix</span>
                    {plan === "agentur" && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, letterSpacing: "0.04em" }}>
                        UNLIMITIERT
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{DUMMY_CLIENTS.length} Projekte · Demo-Daten</span>
                </div>

                {/* Column headers — 7 cols */}
                <div style={{ padding: "9px 22px", background: C.bg, borderBottom: `1px solid ${C.divider}`, display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 110px 68px 72px 130px", gap: 12, alignItems: "center" }}>
                  {["Kunde", "Domain", "Status", "Health", "Zuständig", "Login", "Aktion"].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                  ))}
                </div>

                {/* Rows */}
                <div style={{ overflowX: "auto" }}>
                {DUMMY_CLIENTS.map((client, i) => {
                  const score  = healthScore(client.status);
                  const isOk   = client.status === "ok";
                  const isCrit = client.status === "critical";
                  const statusConf = isOk
                    ? { label: "Sicher",          color: C.green, bg: C.greenBg, border: "#A7F3D0" }
                    : isCrit
                    ? { label: "Kritisch",        color: C.red,   bg: C.redBg,   border: "#FECACA" }
                    : { label: "Prüfen",          color: C.amber, bg: C.amberBg, border: "#FDE68A" };
                  const scoreColor = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
                  const detailHref = lastScanId ? `/dashboard/scans/${lastScanId}` : "/dashboard/scan";
                  const cbId = `ar-${client.id}`;

                  return (
                    <div key={client.id} className="agency-client-row" style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 110px 68px 72px 130px", gap: 12, alignItems: "center", padding: "13px 22px", borderBottom: i < DUMMY_CLIENTS.length - 1 ? `1px solid ${C.divider}` : "none", background: "transparent" }}>

                      {/* Kunde */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${client.color}14`, border: `1px solid ${client.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: client.color }}>
                          {client.initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                          <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.contact}</div>
                        </div>
                      </div>

                      {/* Domain */}
                      <div style={{ minWidth: 0 }}>
                        {client.domains.slice(0, 2).map((d, di) => (
                          <a key={d} href={`https://${d}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", fontSize: 12, color: accent, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: di === 0 && client.domains.length > 1 ? 2 : 0 }}>
                            {d}
                          </a>
                        ))}
                        {client.domains.length > 2 && <span style={{ fontSize: 10, color: C.textMuted }}>+{client.domains.length - 2} weitere</span>}
                      </div>

                      {/* Status */}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "4px 9px", borderRadius: 20, color: statusConf.color, background: statusConf.bg, border: `1px solid ${statusConf.border}`, whiteSpace: "nowrap" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusConf.color, display: "inline-block", flexShrink: 0 }} />
                        {statusConf.label}
                      </span>

                      {/* Health-Score */}
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor, letterSpacing: "-0.02em", lineHeight: 1 }}>{score}</span>
                          <span style={{ fontSize: 10, color: C.textMuted }}>/100</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 99, width: `${score}%`, background: scoreColor }} />
                        </div>
                      </div>

                      {/* Verantwortlich */}
                      <div title={`Zuständig: ${client.assignee}`} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: accentBg, border: `1px solid ${accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: accent }}>
                          {client.assignee}
                        </div>
                      </div>

                      {/* Kunden-Login */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {client.clientLogin ? (
                          <span title="Kunden-Login aktiv" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </span>
                        ) : (
                          <span title="Kein Kunden-Login" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: C.divider, border: `1px solid ${C.border}` }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </span>
                        )}
                      </div>

                      {/* Auto-Report toggle + Bericht-Button */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* CSS-only toggle (no JS) */}
                        <div className="ar-wrap" style={{ display: "flex", alignItems: "center", gap: 5, position: "relative" }} title="Auto-Report">
                          <input type="checkbox" className="ar-cb" id={cbId} defaultChecked={client.autoReport} />
                          <label htmlFor={cbId} className="ar-track" aria-label="Auto-Report">
                            <span className="ar-thumb" />
                          </label>
                        </div>
                        <Link href={detailHref} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, background: accent, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap", boxShadow: `0 1px 6px ${accent}40` }}>
                          Bericht →
                        </Link>
                      </div>

                    </div>
                  );
                })}
                </div>

              </div>
          </main>
        );
      })()}

      {/* ── New Client Modal (CSS :target, no JS) ── */}
      <div id="modal-new-client" className="agency-modal">
        <div style={{ background: C.card, borderRadius: 20, padding: "32px", maxWidth: 480, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", position: "relative" }}>
          <a href="#" style={{ position: "absolute", top: 16, right: 20, fontSize: 22, color: C.textMuted, textDecoration: "none", lineHeight: 1 }}>×</a>
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: C.blue, textTransform: "uppercase", letterSpacing: "0.08em" }}>Neues Projekt</p>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Kunden anlegen</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textSub }}>Füge einen neuen Kunden zur Kunden-Matrix hinzu.</p>
          </div>
          <form action="/dashboard/scan" method="GET" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 5 }}>Kundenname</label>
              <input name="clientName" type="text" placeholder="z.B. Autohaus Müller GmbH" style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.bg, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 5 }}>Website-URL</label>
              <input name="url" type="url" placeholder="https://kunde-website.de" required style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text, background: C.bg, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button type="submit" style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: C.blue, color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
                Ersten Scan starten →
              </button>
              <a href="#" style={{ padding: "11px 18px", borderRadius: 10, background: C.bg, border: `1px solid ${C.border}`, color: C.textSub, fontWeight: 700, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center" }}>
                Abbrechen
              </a>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
