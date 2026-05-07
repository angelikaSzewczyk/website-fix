/**
 * DeepDataMetricsGrid — vier Plugin-only Detail-Metriken in einem Grid.
 *
 * Wird unter dem XrayCompareCard im Dashboard gerendert. Zeigt im Locked-State
 * (kein Plugin) alle vier Karten als Schloss-Skeleton via LockedMetricCard.
 * Im Deep-Scan-Mode rendert jede Karte den echten Wert + farb-codierten Status.
 *
 * Karten:
 *   1. PHP-Logs        — php_errors_24h, last_fatal-Hint
 *   2. Datenbank       — size_mb, slow_queries_total, größte Tabelle
 *   3. WP-Cron-Health  — overdue/total, DISABLE_WP_CRON-Flag
 *   4. Sicherheit      — Brute-Force, Theme-Integrität, Malware-Patterns
 */

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

// ─── Main Grid ────────────────────────────────────────────────────────────────

export default function DeepDataMetricsGrid({ pluginActive, deepData }: Props) {
  // Im Locked-State: vier LockedMetricCards mit Schloss-Skeleton.
  if (!pluginActive || !deepData) {
    return (
      <section
        data-testid="deep-data-grid-locked"
        style={{
          marginBottom: 18,
          display: "grid", gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
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
      </section>
    );
  }

  // Deep-Scan-Mode: alle 4 Cards mit echten Werten.
  return (
    <section
      data-testid="deep-data-grid"
      style={{
        marginBottom: 18,
        display: "grid", gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      }}
    >
      <PhpLogsCard     deepData={deepData} />
      <DatabaseCard    deepData={deepData} />
      <CronHealthCard  deepData={deepData} />
      <SecurityCard    deepData={deepData} />
    </section>
  );
}
