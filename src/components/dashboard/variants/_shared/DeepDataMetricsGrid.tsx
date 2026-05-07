/**
 * DeepDataMetricsGrid — Plugin-only Detail-Metriken + Q3-Coming-Soon-Cards.
 *
 * Wird unter dem XrayCompareCard im Dashboard gerendert. Zeigt im Locked-State
 * (kein Plugin) alle vier Live-Karten als Schloss-Skeleton via LockedMetricCard.
 * Im Deep-Scan-Mode rendert jede Karte den echten Wert + farb-codierten Status.
 *
 * Live-Karten (mit Plugin verfügbar):
 *   1. PHP-Logs        — php_errors_24h, last_fatal-Hint
 *   2. Datenbank       — size_mb, slow_queries_total, größte Tabelle
 *   3. WP-Cron-Health  — overdue/total, DISABLE_WP_CRON-Flag
 *   4. Sicherheit      — Brute-Force, Theme-Integrität, Malware-Patterns
 *
 * Coming-Q3-Karten (PERMANENT locked, mit "Q3"-Badge):
 *   5. Core-Checksum   — WP.org-Hash-Vergleich pro Datei
 *   6. Watchdog 60s    — Echtzeit-Ausfall-Monitor statt 12h-Heartbeat
 *
 * Diese Q3-Karten sind absichtlich auch im Deep-Scan-Mode noch gesperrt —
 * sie verkaufen die Roadmap, nicht den Status quo.
 */

import Link from "next/link";
import LockedMetricCard from "./LockedMetricCard";
import type { DeepData } from "@/lib/plugin-status";

type Props = {
  pluginActive: boolean;
  deepData?:    DeepData | null;
};

const C = {
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.62)",
  textMuted:   "rgba(255,255,255,0.42)",
  border:      "rgba(255,255,255,0.08)",
  card:        "rgba(255,255,255,0.025)",
  green:       "#22c55e",
  greenBg:     "rgba(34,197,94,0.10)",
  greenBorder: "rgba(34,197,94,0.30)",
  amber:       "#fbbf24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberBorder: "rgba(251,191,36,0.30)",
  red:         "#f87171",
  redBg:       "rgba(248,113,113,0.10)",
  redBorder:   "rgba(248,113,113,0.30)",
  textCode:    "#94a3b8",
} as const;

type Status = "ok" | "warn" | "alert";

function statusColors(s: Status) {
  if (s === "alert") return { fg: C.red, bg: C.redBg, bd: C.redBorder };
  if (s === "warn")  return { fg: C.amber, bg: C.amberBg, bd: C.amberBorder };
  return { fg: C.green, bg: C.greenBg, bd: C.greenBorder };
}

function MetricCard({
  title, status, headline, lines,
}: {
  title:    string;
  status:   Status;
  headline: string;
  lines:    Array<string | null | undefined>;
}) {
  const c = statusColors(status);
  const visible = lines.filter((l): l is string => Boolean(l));
  return (
    <div style={{
      padding: "16px 18px", borderRadius: 12,
      background: C.card, border: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </span>
        <span style={{
          fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
          background: c.bg, border: `1px solid ${c.bd}`, color: c.fg,
          letterSpacing: "0.10em", textTransform: "uppercase",
        }}>
          {status === "ok" ? "OK" : status === "warn" ? "Warnung" : "Alarm"}
        </span>
      </div>
      <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
        {headline}
      </p>
      {visible.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
          {visible.map((l, i) => (
            <li key={i} style={{ fontSize: 11.5, color: C.textSub, lineHeight: 1.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
              {l}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Card-Logik (statusgekippte Werte) ────────────────────────────────────────

function PhpLogsCard({ deepData }: { deepData: DeepData }) {
  const errs   = deepData.logs?.php_errors_24h ?? 0;
  const fatal  = deepData.logs?.last_fatal;
  const status: Status = errs > 20 ? "alert" : errs > 5 ? "warn" : "ok";
  return (
    <MetricCard
      title="PHP-Error-Log (24 h)"
      status={status}
      headline={errs === 0 ? "Sauber — keine Fehler" : `${errs} Fehler-Eintr${errs === 1 ? "ag" : "äge"}`}
      lines={[
        fatal ? `Letzter Fatal: ${fatal.length > 80 ? fatal.slice(0, 80) + "…" : fatal}` : null,
        deepData.wp?.debug ? "WP_DEBUG aktiv" : "WP_DEBUG aus — aktivieren für Stack-Traces",
      ]}
    />
  );
}

function DatabaseCard({ deepData }: { deepData: DeepData }) {
  const size = deepData.db?.size_mb ?? 0;
  const slow = deepData.db?.slow_queries_total ?? 0;
  const top  = deepData.db?.largest_tables?.[0];
  const status: Status = size > 500 || slow > 500 ? "alert" : size > 200 || slow > 100 ? "warn" : "ok";
  return (
    <MetricCard
      title="Datenbank-Status"
      status={status}
      headline={`${size.toFixed(1)} MB · ${deepData.db?.engine ?? "mysql"} ${deepData.db?.version ?? ""}`.trim()}
      lines={[
        slow > 0 ? `${slow.toLocaleString("de-DE")} Slow-Queries kumulativ` : "Slow-Query-Log: keine Treffer",
        top   ? `Größte Tabelle: ${top.name} (${top.size_mb} MB)` : null,
        deepData.db?.slow_query_log === false ? "slow_query_log: OFF" : null,
      ]}
    />
  );
}

function CronHealthCard({ deepData }: { deepData: DeepData }) {
  const total    = deepData.cron?.total ?? 0;
  const overdue  = deepData.cron?.overdue ?? 0;
  const disabled = deepData.cron?.wp_cron_disabled === true;
  const status: Status = (disabled && overdue > 3) || overdue > 5 ? "alert" : overdue > 0 ? "warn" : "ok";
  return (
    <MetricCard
      title="WP-Cron-Health"
      status={status}
      headline={overdue === 0 ? `${total} Events · alle pünktlich` : `${overdue}/${total} Events überfällig`}
      lines={[
        disabled ? "DISABLE_WP_CRON ist gesetzt — Server-Cron erforderlich" : null,
        deepData.cron?.sample?.[0]
          ? `Nächster Hook: ${deepData.cron.sample[0].hook}`
          : null,
      ]}
    />
  );
}

function SecurityCard({ deepData }: { deepData: DeepData }) {
  const bf       = deepData.security?.brute_force_attempts_24h;
  const themeOk  = deepData.security?.theme_integrity_ok;
  const malware  = deepData.security?.malware_suspects;

  const status: Status =
    (malware?.count ?? 0) > 0       ? "alert"
    : themeOk === false             ? "alert"
    : (bf ?? 0) > 50                ? "alert"
    : (bf ?? 0) > 10                ? "warn"
    : "ok";

  const headlineParts: string[] = [];
  if (malware?.count) headlineParts.push(`${malware.count}× Malware-Verdacht`);
  if (themeOk === false) headlineParts.push("Theme defekt");
  if (bf != null && bf > 0) headlineParts.push(`${bf} Brute-Force-Treffer`);
  const headline = headlineParts.length > 0 ? headlineParts.join(" · ") : "Sauber";

  return (
    <MetricCard
      title="Sicherheits-Indikatoren"
      status={status}
      headline={headline}
      lines={[
        malware?.sample && malware.sample.length > 0
          ? `Match: ${malware.sample[0]}`
          : null,
        themeOk === false ? "Theme: validate_file meldet Fehler"
          : themeOk === true ? "Theme: strukturell valide"
          : null,
        bf == null ? "Brute-Force-Plugin nicht installiert (Wordfence empfohlen)" : null,
      ]}
    />
  );
}

// ─── Coming-Q3-Card ───────────────────────────────────────────────────────────
// Permanent locked — "Coming Q3 · Reserviert für Agency Scale". Verlinkt
// zur Roadmap-Section auf /fuer-agenturen für den Beta-Pricing-Hook.
function ComingQ3Card({
  metric, title, description, icon,
}: {
  metric: string;
  title: string;
  description: string;
  icon: React.ReactElement;
}) {
  return (
    <div
      data-testid={`coming-q3-${metric}`}
      style={{
        position: "relative",
        padding: "16px 18px", borderRadius: 12,
        background: "linear-gradient(135deg, rgba(167,139,250,0.06), rgba(251,191,36,0.04))",
        border: "1px dashed rgba(167,139,250,0.30)",
        overflow: "hidden",
      }}
    >
      {/* Q3-Badge oben-rechts */}
      <span style={{
        position: "absolute", top: 10, right: 10,
        fontSize: 9.5, fontWeight: 800,
        padding: "2px 8px", borderRadius: 999,
        background: "rgba(251,191,36,0.14)",
        border: "1px solid rgba(251,191,36,0.32)",
        color: "#FBBF24",
        letterSpacing: "0.10em", textTransform: "uppercase",
      }}>
        Q3 · Agency
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span aria-hidden="true" style={{
          width: 24, height: 24, borderRadius: 6,
          background: "rgba(167,139,250,0.14)",
          border: "1px solid rgba(167,139,250,0.30)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#A78BFA",
          flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.42)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Coming Q3
        </span>
      </div>

      <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800,
                   color: "rgba(255,255,255,0.55)", letterSpacing: "-0.01em" }}>
        {title}
      </h4>
      <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.55 }}>
        {description}
      </p>

      {/* Skeleton-Bars als visueller Andeutung */}
      <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {[64, 88, 36].map((w, i) => (
          <div key={i} style={{
            height: 5, width: `${w}%`, borderRadius: 99,
            background: "rgba(167,139,250,0.10)",
            border: "1px solid rgba(167,139,250,0.14)",
          }} />
        ))}
      </div>

      <Link href="/fuer-agenturen#pricing" style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11, fontWeight: 700,
        color: "#A78BFA", textDecoration: "none",
      }}>
        Beta-Preis sichern →
      </Link>
    </div>
  );
}

// ─── Main Grid ────────────────────────────────────────────────────────────────

// SVG-Icons für die Coming-Q3-Karten
const ICON_CHECKSUM = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12l2 2 4-4"/>
    <path d="M21 12c0 4.97-3.582 9-8 9s-8-4.03-8-9c0-4.97 3.582-9 8-9s8 4.03 8 9z"/>
  </svg>
);
const ICON_WATCHDOG = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 15 14"/>
  </svg>
);

export default function DeepDataMetricsGrid({ pluginActive, deepData }: Props) {
  const liveCards = !pluginActive || !deepData ? (
    <>
      <LockedMetricCard
        pluginActive={false}
        metric="php-logs"
        title="PHP-Error-Log (24 h)"
        description="Wir zählen Fatal/Warning/Notice-Errors aus deinem debug.log und zeigen den letzten Stack-Trace."
      ><div /></LockedMetricCard>
      <LockedMetricCard
        pluginActive={false}
        metric="db-load"
        title="Datenbank-Status"
        description="DB-Größe, Slow-Query-Counter und die drei größten Tabellen — wo wirklich gespart werden kann."
      ><div /></LockedMetricCard>
      <LockedMetricCard
        pluginActive={false}
        metric="cron-health"
        title="WP-Cron-Health"
        description="Welche Scheduled Events überfällig sind — Backup-Plugins, Auto-Updates, Newsletter, alles."
      ><div /></LockedMetricCard>
      <LockedMetricCard
        pluginActive={false}
        metric="security"
        title="Sicherheits-Indikatoren"
        description="Brute-Force-Welle, Theme-Integrität, Malware-Pattern-Scan über alle Plugin/Theme-Dateien."
      ><div /></LockedMetricCard>
    </>
  ) : (
    <>
      <PhpLogsCard     deepData={deepData} />
      <DatabaseCard    deepData={deepData} />
      <CronHealthCard  deepData={deepData} />
      <SecurityCard    deepData={deepData} />
    </>
  );

  return (
    <section
      id="deep-data-section"
      data-testid={pluginActive && deepData ? "deep-data-grid" : "deep-data-grid-locked"}
      style={{
        marginBottom: 18,
        display: "grid", gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        scrollMarginTop: 80, // damit der Sticky-Header beim Anker-Scroll nicht überdeckt
      }}
    >
      {liveCards}

      {/* Coming-Q3-Karten — IMMER sichtbar (auch mit Plugin), permanent
          locked, mit Beta-Preis-Hook auf /fuer-agenturen#pricing. */}
      <ComingQ3Card
        metric="core-checksum"
        title="Core-File-Checksum"
        description="Vergleicht jede WP-Core-Datei gegen WordPress.org-Hashes. Erkennt manipulierte wp-includes-Files (typisches Backdoor-Pattern)."
        icon={ICON_CHECKSUM}
      />
      <ComingQ3Card
        metric="watchdog-60s"
        title="60-Sekunden-Watchdog"
        description="Echtzeit-Ausfall-Monitoring statt 12h-Heartbeat. Slack/E-Mail-Alarm innerhalb von 60 Sekunden bei Down-Time."
        icon={ICON_WATCHDOG}
      />
    </section>
  );
}
