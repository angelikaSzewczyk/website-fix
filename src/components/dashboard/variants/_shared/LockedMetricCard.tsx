/**
 * LockedMetricCard — Lock-Overlay für Plugin-gegated Detail-Metriken.
 *
 * Wird über Karten gelegt, die nur mit Deep-Data sinnvoll sind (PHP-Logs,
 * DB-Last, Slow-Query-Counter, Plugin-Konflikt-Matrix). Bei pluginActive=true
 * wird {children} ungehindert gerendert; sonst eine ausgegraute Skeleton-Card
 * mit 🔒-Icon und Plugin-CTA.
 *
 * Ergänzt — nicht ersetzt — LockedSection (das ist plan-gated, nicht
 * plugin-gated). Beide können verschachtelt werden:
 *   <LockedSection required="professional" …>
 *     <LockedMetricCard pluginActive={…}>
 *       <PhpLogsWidget />
 *     </LockedMetricCard>
 *   </LockedSection>
 */

import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  pluginActive: boolean;
  /** Title der gelockten Karte, z.B. "PHP-Error-Log (24h)" */
  title:        string;
  /** Sub-Text — was der User sieht, wenn das Plugin verbunden ist */
  description:  string;
  /** Slug für data-testid (z.B. "php-logs", "db-load") */
  metric:       string;
  href?:        string;
  children:     ReactNode;
};

export default function LockedMetricCard({
  pluginActive, title, description, metric, href = "/plugin", children,
}: Props) {
  if (pluginActive) return <>{children}</>;

  return (
    <div
      data-testid={`locked-metric-${metric}`}
      style={{
        position: "relative",
        padding: "20px 22px", borderRadius: 12,
        background: "rgba(255,255,255,0.025)",
        border: "1px dashed rgba(255,255,255,0.16)",
        overflow: "hidden",
      }}
    >
      {/* Schloss-Icon prominent oben-rechts */}
      <span aria-hidden="true" style={{
        position: "absolute", top: 14, right: 14,
        width: 28, height: 28, borderRadius: 7,
        background: "rgba(251,191,36,0.10)",
        border: "1px solid rgba(251,191,36,0.28)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24"
             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </span>

      <p style={{ margin: 0, fontSize: 9.5, fontWeight: 800, color: "#fbbf24",
                  textTransform: "uppercase", letterSpacing: "0.10em" }}>
        Plugin erforderlich
      </p>
      <h4 style={{ margin: "4px 0 6px", fontSize: 14, fontWeight: 800,
                   color: "rgba(255,255,255,0.55)", letterSpacing: "-0.01em" }}>
        {title}
      </h4>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.55, maxWidth: 360 }}>
        {description}
      </p>

      {/* Skeleton-Bars als visueller Andeutung des Inhalts. */}
      <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {[78, 56, 84, 42].map((w, i) => (
          <div key={i} style={{
            height: 7, width: `${w}%`, borderRadius: 99,
            background: "rgba(255,255,255,0.05)",
          }} />
        ))}
      </div>

      <Link href={href} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 14px", borderRadius: 7,
        background: "rgba(34,197,94,0.10)",
        border: "1px solid rgba(34,197,94,0.30)",
        color: "#22c55e", fontSize: 11.5, fontWeight: 800,
        textDecoration: "none",
      }}>
        🔒 Plugin verbinden
      </Link>
    </div>
  );
}
