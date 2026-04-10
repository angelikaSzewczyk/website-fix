import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import BillingPortalButton from "../components/billing-portal-button";

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

// ─── Plan → Layout mapping ──────────────────────────────────────────────────────
function getLayout(plan: string): "single" | "agency" | "enterprise" {
  if (plan === "enterprise")                return "enterprise";
  if (plan === "agentur" || plan === "pro") return "agency";
  return "single";
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

// ─── Types ─────────────────────────────────────────────────────────────────────
type Scan = {
  id: string; url: string; type: string;
  created_at: string; issue_count: number | null;
  result?: string | null;
};
type CriticalSite = {
  id: string; url: string; name: string | null;
  last_check_status: string; last_check_at: string;
  ssl_days_left: number | null; security_score: number | null;
  alerts: { level: string; message: string }[] | null;
};

const PLAN_BADGE = {
  free:       { label: "Free",          color: C.textMuted,  bg: "#F1F5F9",  border: C.border },
  pro:        { label: "Agency Starter",color: "#059669",    bg: "#ECFDF5",  border: "#A7F3D0" },
  agentur:    { label: "Agency Pro",    color: C.blue,       bg: C.blueBg,   border: C.blueBorder },
  enterprise: { label: "Enterprise",   color: "#7C3AED",    bg: "#F5F3FF",  border: "#DDD6FE" },
} as const;

const DUMMY_CLIENTS = [
  { id: "1", name: "Autohaus Müller GmbH",       contact: "Hans Müller",       initials: "AM", color: "#2563EB", domains: ["autohaus-mueller.de","gebrauchtwagen-mueller.de"], status: "warning"  as const, lastScan: "08. Apr 2026" },
  { id: "2", name: "Kanzlei Schneider & Partner", contact: "Dr. Anna Schneider", initials: "KS", color: "#16A34A", domains: ["kanzlei-schneider.de"],                             status: "ok"       as const, lastScan: "09. Apr 2026" },
  { id: "3", name: "Bäckerei Hoffmann",           contact: "Klaus Hoffmann",    initials: "BH", color: "#D97706", domains: ["baeckerei-hoffmann.de","hoffmann-catering.de","hoffmann-shop.de"], status: "critical" as const, lastScan: "07. Apr 2026" },
  { id: "4", name: "TechStart Berlin UG",         contact: "Lena Vogel",        initials: "TB", color: "#7C3AED", domains: ["techstart.berlin"],                                   status: "ok"       as const, lastScan: "10. Apr 2026" },
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

// ─── Agency Sidebar ─────────────────────────────────────────────────────────────
function AgencySidebar({ firstName, plan, planBadge, domainCount, domainLimit, isEnterprise }: {
  firstName: string; plan: string;
  planBadge: { label: string; color: string; bg: string; border: string };
  domainCount: number; domainLimit: number; isEnterprise: boolean;
}) {
  const navItems = [
    { label: "Übersicht",     href: "/dashboard",          active: true,  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { label: "Kunden",        href: "/dashboard/clients",  active: false, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: "Deep-Audits",   href: "/dashboard/scan",     active: false, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
    { label: "Berichte",      href: "/dashboard/reports",  active: false, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { label: "Team",          href: "/dashboard/team",     active: false, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    ...(isEnterprise ? [{ label: "Admin / Rechte", href: "/dashboard/admin", active: false, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }] : []),
  ];
  return (
    <aside style={{ width: 230, flexShrink: 0, minHeight: "calc(100vh - 45px)", borderRight: `1px solid ${C.border}`, background: C.card, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 18px 16px", borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: C.blue }}>
            {firstName[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstName}</div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, color: planBadge.color, background: planBadge.bg, border: `1px solid ${planBadge.border}` }}>{planBadge.label}</span>
          </div>
        </div>
        <BillingPortalButton />
      </div>
      <nav style={{ flex: 1, padding: "8px 0" }}>
        {navItems.map(item => (
          <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", background: item.active ? C.blueBg : "transparent", color: item.active ? C.blue : C.textSub, fontSize: 13, fontWeight: item.active ? 700 : 500, borderLeft: item.active ? `3px solid ${C.blue}` : "3px solid transparent" }}>
              {item.icon}
              {item.label}
              {item.label === "Admin / Rechte" && (
                <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 4, background: "#F5F3FF", color: "#7C3AED", border: "1px solid #DDD6FE" }}>ENT</span>
              )}
            </div>
          </Link>
        ))}
      </nav>
      <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.divider}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>Domains</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{domainCount} <span style={{ color: C.textMuted, fontWeight: 400 }}>/ {domainLimit}</span></span>
        </div>
        <div style={{ height: 4, borderRadius: 99, background: C.divider, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, width: `${Math.min(100, (domainCount / domainLimit) * 100)}%`, background: domainCount / domainLimit > 0.8 ? C.red : C.blue }} />
        </div>
      </div>
    </aside>
  );
}

function ClientRow({ client, last }: { client: typeof DUMMY_CLIENTS[0]; last: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 1fr 180px", gap: 16, alignItems: "center", padding: "13px 20px", borderBottom: last ? "none" : `1px solid ${C.divider}`, background: "transparent" }}>
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
  const isAgency  = layout === "agency" || layout === "enterprise";

  // ── Scans ──
  const scans = await sql`
    SELECT id, url, type, created_at, issue_count
    FROM scans WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC LIMIT 20
  ` as Scan[];

  // ── Agency data ──
  let criticalSites: CriticalSite[] = [];
  let domainCount = DUMMY_CLIENTS.reduce((s, c) => s + c.domains.length, 0);
  const domainLimit = plan === "agentur" ? 50 : plan === "pro" ? 20 : 1;

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

  // ── Free: last scan with result for issue parsing ──
  let lastScanResult: string | null = null;
  const lastScan = scans[0] ?? null;
  if (!isAgency && lastScan) {
    try {
      const rows = await sql`SELECT result FROM scans WHERE id = ${lastScan.id} AND user_id = ${session.user.id}` as { result: string | null }[];
      lastScanResult = rows[0]?.result ?? null;
    } catch {}
  }

  // Monthly scan count
  const now = new Date();
  const monthlyScans = scans.filter(s => {
    const d = new Date(s.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const SCAN_LIMIT = 3;

  // Parse issues from last scan
  const issues: ParsedIssue[] = lastScanResult ? parseIssues(lastScanResult) : [];
  const cms = lastScanResult ? detectCMS(lastScanResult, lastScan?.url) : { label: "–" };

  const redIssues    = issues.filter(i => i.severity === "red");
  const yellowIssues = issues.filter(i => i.severity === "yellow");
  const rechtIssues  = issues.filter(i => i.category === "recht");
  const speedIssues  = issues.filter(i => i.category === "speed");
  const techIssues   = issues.filter(i => i.category === "technik");

  const bfsgOk     = rechtIssues.length === 0;
  const speedScore = Math.max(10, 100 - speedIssues.length * 15 - yellowIssues.length * 8);
  const overallOk  = redIssues.length === 0;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        a { text-decoration: none; }
        .dash-row:hover  { background: ${C.divider} !important; }
        .fix-details summary { cursor: pointer; user-select: none; }
        .fix-details summary::-webkit-details-marker { display: none; }
        .issue-row:hover { background: #F8FAFC !important; }
      `}</style>

      <ProgressBar plan={plan} />

      {/* ══════════════════════════════════════════════════════════
          FREE / SINGLE LAYOUT
          ══════════════════════════════════════════════════════════ */}
      {!isAgency && (
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 100px" }}>

          {/* ── Top Bar ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, color: C.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Dein Audit-Dashboard</p>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.025em" }}>
                Hallo, {firstName} 👋
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Scan counter */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 20, background: monthlyScans >= SCAN_LIMIT ? C.redBg : C.card, border: `1px solid ${monthlyScans >= SCAN_LIMIT ? "#FECACA" : C.border}` }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={monthlyScans >= SCAN_LIMIT ? C.red : C.textSub} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: monthlyScans >= SCAN_LIMIT ? C.red : C.text }}>
                  {monthlyScans} / {SCAN_LIMIT}
                </span>
                <span style={{ fontSize: 11, color: C.textMuted }}>Scans</span>
              </div>
              {/* Upgrade CTA */}
              <Link href="/preise" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, background: C.yellow, color: "#0a0a0a", fontWeight: 800, fontSize: 12, boxShadow: "0 2px 10px rgba(234,179,8,0.35)", whiteSpace: "nowrap" }}>
                ⚡ Upgrade auf Smart-Guard
              </Link>
            </div>
          </div>

          {/* ── No Scan State ── */}
          {!lastScan && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, boxShadow: C.shadowMd, padding: "52px 40px", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: C.blueBg, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: C.text }}>Starte deinen ersten Audit</h2>
              <p style={{ margin: "0 auto 20px", fontSize: 14, color: C.textSub, lineHeight: 1.7, maxWidth: 440 }}>
                Finde in 60 Sekunden heraus, warum Google dich nicht findet, welche Rechtsfehler auf Abmahnungen warten und was deine Conversion-Rate blockiert.
              </p>

              {/* URL Input Form */}
              <form action="/dashboard/scan" method="GET" style={{ display: "flex", gap: 10, maxWidth: 500, margin: "0 auto 16px", flexWrap: "wrap", justifyContent: "center" }}>
                <input
                  name="url"
                  type="url"
                  placeholder="https://deine-website.de"
                  required
                  style={{
                    flex: 1, minWidth: 260,
                    padding: "12px 16px", borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    fontSize: 14, color: C.text, background: C.bg,
                    outline: "none", fontFamily: "inherit",
                  }}
                />
                <button type="submit" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", borderRadius: 10,
                  background: C.blue, color: "#fff", fontWeight: 800, fontSize: 14,
                  border: "none", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
                  fontFamily: "inherit",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Kostenlos scannen
                </button>
              </form>

              <p style={{ margin: "0 0 0", fontSize: 11, color: C.textMuted }}>Keine Kreditkarte · 3 Scans pro Monat gratis</p>
            </div>
          )}

          {/* ── Has Scan: Full Dashboard ── */}
          {lastScan && (
            <>

              {/* ── System Detection Bar ── */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", boxShadow: C.shadow }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>System</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{cms.label}{cms.version ? ` ${cms.version}` : ""}</span>
                </div>
                <div style={{ width: 1, height: 16, background: C.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Domain</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.textSub, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastScan.url}</span>
                </div>
                <div style={{ width: 1, height: 16, background: C.border }} />
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Befunde</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: redIssues.length > 0 ? C.red : C.green }}>
                    {redIssues.length} kritisch · {yellowIssues.length} Warnung
                  </span>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Link href={`/dashboard/scans/${lastScan.id}`} style={{ fontSize: 12, fontWeight: 700, color: C.blue, display: "flex", alignItems: "center", gap: 4 }}>
                    Vollständiger Bericht →
                  </Link>
                </div>
              </div>

              {/* ── BFSG Banner ── */}
              <div style={{
                background: bfsgOk ? C.greenBg : C.redBg,
                border: `1px solid ${bfsgOk ? "#A7F3D0" : "#FECACA"}`,
                borderRadius: 12, padding: "13px 18px", marginBottom: 20,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: bfsgOk ? "#16A34A20" : "#DC262620", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {bfsgOk
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: bfsgOk ? C.green : C.red }}>
                    Barrierefreiheit-Status: {bfsgOk ? "KONFORM (BFSG 2025)" : `KRITISCH — Nicht konform mit BFSG 2025`}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: bfsgOk ? "#166534" : "#991B1B", lineHeight: 1.5 }}>
                    {bfsgOk
                      ? "Keine kritischen Barrierefreiheits-Verstöße gefunden. Weiter so!"
                      : `${rechtIssues.length} Rechts- und Barrierefreiheitsfehler gefunden. Abmahnrisiko ab 28. Juni 2025.`
                    }
                  </p>
                </div>
                {!bfsgOk && (
                  <Link href={`/dashboard/scans/${lastScan.id}`} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 8, background: C.red, color: "#fff", fontWeight: 700, fontSize: 12 }}>
                    Jetzt beheben →
                  </Link>
                )}
              </div>

              {/* ── 3 Problem Tiles ── */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>

                {/* Tile 1: Sichtbarkeit */}
                {((): React.ReactNode => {
                  const seoIssues = issues.filter(i => /meta|title|h1|sitemap|robots|index|canonical|seo/.test(i.title.toLowerCase()));
                  const status    = seoIssues.filter(i => i.severity === "red").length > 0 ? "red" : seoIssues.length > 0 ? "amber" : "green";
                  const bg        = status === "green" ? C.greenBg : status === "amber" ? C.amberBg : C.redBg;
                  const border    = status === "green" ? "#A7F3D0" : status === "amber" ? "#FDE68A" : "#FECACA";
                  const color     = status === "green" ? C.green   : status === "amber" ? C.amber   : C.red;
                  const label     = status === "green" ? "Gut indexiert" : status === "amber" ? "Verbesserbar" : "Kritisch";
                  return (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.shadow }}>
                      <div style={{ height: 3, background: color }} />
                      <div style={{ padding: "18px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color, padding: "2px 8px", borderRadius: 5, background: bg, border: `1px solid ${border}` }}>{label}</span>
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: C.text }}>Sichtbarkeit</p>
                        <p style={{ margin: "0 0 12px", fontSize: 11, color: C.textSub, lineHeight: 1.5 }}>Warum findet Google mich nicht?</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                          {[
                            { label: "Indexierung", ok: seoIssues.filter(i => /index/.test(i.title.toLowerCase())).length === 0 },
                            { label: "Meta-Tags",   ok: seoIssues.filter(i => /meta|title/.test(i.title.toLowerCase())).length === 0 },
                            { label: "Sitemap",     ok: seoIssues.filter(i => /sitemap/.test(i.title.toLowerCase())).length === 0 },
                          ].map(item => (
                            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, color: item.ok ? C.green : C.red }}>{item.ok ? "●" : "●"}</span>
                              <span style={{ fontSize: 11, color: C.textSub }}>{item.label}</span>
                              <span style={{ fontSize: 10, marginLeft: "auto", fontWeight: 700, color: item.ok ? C.green : C.red }}>{item.ok ? "OK" : "⚠"}</span>
                            </div>
                          ))}
                        </div>
                        <Link href={`/dashboard/scans/${lastScan.id}`} style={{ display: "block", textAlign: "center", padding: "6px 0", borderRadius: 7, background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue, fontSize: 11, fontWeight: 700 }}>
                          Details →
                        </Link>
                      </div>
                    </div>
                  );
                })()}

                {/* Tile 2: Stabilität */}
                {((): React.ReactNode => {
                  const critical = redIssues.length;
                  const status   = critical > 2 ? "red" : critical > 0 ? "amber" : "green";
                  const bg       = status === "green" ? C.greenBg : status === "amber" ? C.amberBg : C.redBg;
                  const border   = status === "green" ? "#A7F3D0" : status === "amber" ? "#FDE68A" : "#FECACA";
                  const color    = status === "green" ? C.green   : status === "amber" ? C.amber   : C.red;
                  const label    = status === "green" ? "Stabil" : status === "amber" ? "Warnung" : "Kritisch";
                  return (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.shadow }}>
                      <div style={{ height: 3, background: color }} />
                      <div style={{ padding: "18px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color, padding: "2px 8px", borderRadius: 5, background: bg, border: `1px solid ${border}` }}>{label}</span>
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: C.text }}>Stabilität</p>
                        <p style={{ margin: "0 0 12px", fontSize: 11, color: C.textSub, lineHeight: 1.5 }}>Kritische Fehler & System</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                          {[
                            { label: "System erkannt", ok: cms.label !== "–" },
                            { label: "Kritische Fehler", ok: critical === 0, val: critical > 0 ? `${critical}×` : undefined },
                            { label: "Tech-Fehler",      ok: techIssues.filter(i => i.severity === "red").length === 0 },
                          ].map(item => (
                            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, color: item.ok ? C.green : C.red }}>●</span>
                              <span style={{ fontSize: 11, color: C.textSub }}>{item.label}</span>
                              <span style={{ fontSize: 10, marginLeft: "auto", fontWeight: 700, color: item.ok ? C.green : C.red }}>{item.val ?? (item.ok ? "OK" : "⚠")}</span>
                            </div>
                          ))}
                        </div>
                        <Link href={`/dashboard/scans/${lastScan.id}`} style={{ display: "block", textAlign: "center", padding: "6px 0", borderRadius: 7, background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue, fontSize: 11, fontWeight: 700 }}>
                          Details →
                        </Link>
                      </div>
                    </div>
                  );
                })()}

                {/* Tile 3: Umsatz / Performance */}
                {((): React.ReactNode => {
                  const status = speedScore >= 70 ? "green" : speedScore >= 50 ? "amber" : "red";
                  const bg     = status === "green" ? C.greenBg : status === "amber" ? C.amberBg : C.redBg;
                  const border = status === "green" ? "#A7F3D0" : status === "amber" ? "#FDE68A" : "#FECACA";
                  const color  = status === "green" ? C.green   : status === "amber" ? C.amber   : C.red;
                  const label  = status === "green" ? "Schnell" : status === "amber" ? "Optimierbar" : "Zu langsam";
                  const loss   = speedScore < 70 ? Math.round((70 - speedScore) * 0.4) : 0;
                  return (
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.shadow }}>
                      <div style={{ height: 3, background: color }} />
                      <div style={{ padding: "18px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color, padding: "2px 8px", borderRadius: 5, background: bg, border: `1px solid ${border}` }}>{label}</span>
                        </div>
                        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: C.text }}>Umsatz / Speed</p>
                        <p style={{ margin: "0 0 12px", fontSize: 11, color: C.textSub, lineHeight: 1.5 }}>Warum keine Anfragen?</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 9, color }}>●</span>
                            <span style={{ fontSize: 11, color: C.textSub }}>Speed-Score</span>
                            <span style={{ fontSize: 10, marginLeft: "auto", fontWeight: 800, color }}>{speedScore}/100</span>
                          </div>
                          {loss > 0 && (
                            <div style={{ fontSize: 10, color: C.red, background: C.redBg, border: "1px solid #FECACA", borderRadius: 5, padding: "4px 8px", lineHeight: 1.5, marginTop: 2 }}>
                              ~{loss}% der Besucher verlassen deine Seite vor dem Laden.
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 9, color: bfsgOk ? C.green : C.red }}>●</span>
                            <span style={{ fontSize: 11, color: C.textSub }}>BFSG 2025</span>
                            <span style={{ fontSize: 10, marginLeft: "auto", fontWeight: 700, color: bfsgOk ? C.green : C.red }}>{bfsgOk ? "OK" : "⚠"}</span>
                          </div>
                        </div>
                        <Link href={`/dashboard/scans/${lastScan.id}`} style={{ display: "block", textAlign: "center", padding: "6px 0", borderRadius: 7, background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue, fontSize: 11, fontWeight: 700 }}>
                          Details →
                        </Link>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* ── Fehler-Liste mit Fix-Anleitungen ── */}
              {issues.length > 0 && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: C.shadow, marginBottom: 20 }}>

                  {/* Header */}
                  <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Vollständige Fehlerliste</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.red, background: C.redBg, border: "1px solid #FECACA", padding: "2px 7px", borderRadius: 5 }}>{redIssues.length} Kritisch</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.amber, background: C.amberBg, border: "1px solid #FDE68A", padding: "2px 7px", borderRadius: 5 }}>{yellowIssues.length} Warnung</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: C.textMuted }}>System: {cms.label}</span>
                  </div>

                  {/* Categories */}
                  {[
                    { key: "recht", label: "Recht & BFSG", items: rechtIssues, color: C.red, bg: C.redBg, border: "#FECACA" },
                    { key: "speed", label: "Performance & Speed", items: speedIssues, color: C.amber, bg: C.amberBg, border: "#FDE68A" },
                    { key: "technik", label: "Technik", items: techIssues, color: C.blue, bg: C.blueBg, border: C.blueBorder },
                  ].filter(cat => cat.items.length > 0).map(cat => (
                    <div key={cat.key}>
                      <div style={{ padding: "8px 20px", background: C.bg, borderTop: `1px solid ${C.divider}`, borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: cat.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{cat.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: cat.bg, border: `1px solid ${cat.border}`, color: cat.color }}>{cat.items.length}</span>
                      </div>
                      {cat.items.map((issue, i) => {
                        const sevColor = issue.severity === "red" ? C.red : issue.severity === "yellow" ? C.amber : C.green;
                        const fix = getFixGuide(issue.title, cms.label);
                        return (
                          <details key={i} className="fix-details" style={{ borderBottom: i < cat.items.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                            <summary style={{ padding: "12px 20px", display: "flex", alignItems: "flex-start", gap: 12, listStyle: "none", cursor: "pointer" }} className="issue-row">
                              <span style={{ flexShrink: 0, fontSize: 14, marginTop: 1 }}>{issue.severity === "red" ? "🔴" : issue.severity === "yellow" ? "🟡" : "🟢"}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{issue.title}</p>
                                {issue.body && <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textSub, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{issue.body.substring(0, 90)}…</p>}
                              </div>
                              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6, background: issue.severity === "red" ? C.redBg : issue.severity === "yellow" ? C.amberBg : C.greenBg, color: sevColor, border: `1px solid ${issue.severity === "red" ? "#FECACA" : issue.severity === "yellow" ? "#FDE68A" : "#A7F3D0"}` }}>
                                  {issue.severity === "red" ? "Kritisch" : issue.severity === "yellow" ? "Warnung" : "Info"}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: C.blue, whiteSpace: "nowrap" }}>Wie fix ich das? ▾</span>
                              </div>
                            </summary>
                            <div style={{ padding: "0 20px 14px 20px", background: "#FAFCFF", borderTop: `1px solid ${C.divider}` }}>
                              {issue.body && <p style={{ margin: "12px 0 8px", fontSize: 12, color: C.textSub, lineHeight: 1.6 }}>{issue.body}</p>}
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 8, background: "#EFF6FF", border: `1px solid ${C.blueBorder}`, marginTop: 8 }}>
                                <svg style={{ flexShrink: 0, marginTop: 2 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                <p style={{ margin: 0, fontSize: 12, color: "#1E40AF", lineHeight: 1.65 }}>
                                  <strong>Fix für {cms.label}:</strong> {fix}
                                </p>
                              </div>
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Locked: 24/7 Monitoring ── */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: C.shadow, marginBottom: 14 }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.textMuted }}>24/7 Live-Überwachung</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#F1F5F9", color: C.textMuted, border: `1px solid ${C.border}` }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Gesperrt
                  </span>
                </div>
                <div style={{ padding: "18px 20px", opacity: 0.5, pointerEvents: "none", filter: "grayscale(0.4)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {["Stündliche Prüfung", "SSL-Ablauf Alarm", "Downtime-Alarm"].map(item => (
                      <div key={item} style={{ padding: "12px 14px", borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.textMuted, display: "block", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: C.textSub }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.divider}`, background: "#FAFAFA", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontSize: 12, color: C.textSub, flex: 1, lineHeight: 1.5 }}>
                    Du hast diesen Scan manuell gestartet. Möchtest du, dass wir deine Seite <strong>jede Stunde automatisch prüfen</strong> und dich bei Fehlern warnen?
                  </p>
                  <Link href="/preise" style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 8, background: C.yellow, color: "#0a0a0a", fontWeight: 800, fontSize: 12, boxShadow: "0 2px 8px rgba(234,179,8,0.3)" }}>
                    Smart-Guard aktivieren →
                  </Link>
                </div>
              </div>

              {/* ── Locked: PDF Export ── */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14, boxShadow: C.shadow }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "#F1F5F9", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textMuted }}>Bericht als PDF herunterladen</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textMuted }}>White-Label PDF-Export ist im Smart-Guard Plan verfügbar.</p>
                </div>
                <Link href="/preise" style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 8, background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue, fontWeight: 700, fontSize: 12 }}>
                  Freischalten →
                </Link>
              </div>

              {/* ── New Scan CTA ── */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <Link href="/dashboard/scan" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 10, background: C.card, color: C.blue, fontWeight: 700, fontSize: 13, border: `1px solid ${C.blueBorder}`, boxShadow: C.shadow }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Neuen Scan starten ({SCAN_LIMIT - monthlyScans} verbleibend)
                </Link>
              </div>

            </>
          )}

          {/* ── Upgrade Banner ── */}
          <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)", borderRadius: 18, padding: "28px 32px", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", boxShadow: "0 8px 32px rgba(15,23,42,0.25)" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: C.yellow, textTransform: "uppercase", letterSpacing: "0.1em" }}>⚡ Maximaler Schutz</p>
              <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>
                Maximaler Schutz mit<br />Smart-Guard — automatisch.
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                Echtzeit-Monitoring · BFSG-Watchdog · PDF-Export · unbegrenzte Scans<br />
                <strong style={{ color: "rgba(255,255,255,0.9)" }}>39 €/Monat · jederzeit kündbar</strong>
              </p>
            </div>
            <Link href="/preise" style={{ flexShrink: 0, padding: "12px 28px", borderRadius: 12, background: C.yellow, color: "#0a0a0a", fontWeight: 800, fontSize: 14, boxShadow: "0 4px 16px rgba(234,179,8,0.45)" }}>
              Smart-Guard aktivieren →
            </Link>
          </div>

        </main>
      )}

      {/* ══════════════════════════════════════════════════════════
          AGENCY LAYOUT  (plan: pro / agentur / enterprise)
          ══════════════════════════════════════════════════════════ */}
      {isAgency && (
        <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto" }}>
          <AgencySidebar firstName={firstName} plan={plan} planBadge={badge} domainCount={domainCount} domainLimit={domainLimit} isEnterprise={layout === "enterprise"} />
          <main style={{ flex: 1, minWidth: 0, padding: "32px 32px 80px" }}>
            <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 11, color: C.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Willkommen zurück</p>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.025em" }}>{firstName}</h1>
              </div>
              <Link href="/dashboard/clients/new" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, background: C.blue, color: "#fff", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Neuen Kunden anlegen
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
              {[
                { value: DUMMY_CLIENTS.length,                                      label: "Kunden gesamt",     color: C.blue },
                { value: DUMMY_CLIENTS.reduce((s, c) => s + c.domains.length, 0),  label: "Domains",           color: C.green },
                { value: DUMMY_CLIENTS.filter(c => c.status === "critical").length, label: "Kritisch",          color: C.red },
                { value: scans.length,                                              label: "Scans gesamt",      color: C.textSub },
              ].map(s => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: C.shadow }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-0.025em", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: C.shadow, overflow: "hidden" }}>
              <div style={{ padding: "13px 20px", borderBottom: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Kunden-Übersicht</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>{DUMMY_CLIENTS.length} Kunden · Dummy-Daten</span>
                  <Link href="/dashboard/clients" style={{ fontSize: 12, color: C.blue, fontWeight: 600 }}>Alle →</Link>
                </div>
              </div>
              <div style={{ padding: "8px 20px", background: C.bg, borderBottom: `1px solid ${C.divider}`, display: "grid", gridTemplateColumns: "2fr 1.4fr 100px 1fr 180px", gap: 16 }}>
                {["Kunde / Logo", "Domains", "Status", "Letzter Scan", "Quick-Actions"].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</span>
                ))}
              </div>
              {DUMMY_CLIENTS.map((client, i) => (
                <ClientRow key={client.id} client={client} last={i === DUMMY_CLIENTS.length - 1} />
              ))}
            </div>
          </main>
        </div>
      )}

    </div>
  );
}
