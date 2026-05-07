/**
 * WhyWebsitefixCard — Onboarding-Reminder im Dashboard.
 *
 * Kompakte Card mit drei Key-Points, die dem User vor Augen halten warum
 * WebsiteFix mehr ist als ein Scan. Wird im Starter- und Pro-Dashboard
 * gerendert (NICHT im Agency-Dashboard — Inhaber kennen das Wertversprechen
 * längst, dort wäre die Card unnötig defensive).
 *
 * Plan-aware: Starter sieht 2 Punkte (Code-Fix + PHP-Logs), Pro zusätzlich
 * den Haftungsschutz-Punkt aus dem Agency-Versprechen — als "Vorgeschmack"
 * auf den Upgrade-Pfad.
 *
 * Server-Component — kein State, kein Tracking-JS.
 */

import { Wrench, ScanSearch, ShieldCheck } from "lucide-react";

type Props = {
  /** Plan-String (kanonisch oder Legacy). Bestimmt, ob Punkt 3 (Haftungsschutz) gerendert wird. */
  plan: string;
};

const C = {
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.62)",
  textMuted:   "rgba(255,255,255,0.42)",
  border:      "rgba(255,255,255,0.08)",
  card:        "linear-gradient(135deg, rgba(167,139,250,0.07), rgba(34,197,94,0.04))",
  cardBorder:  "rgba(167,139,250,0.28)",
  scale:       "#A78BFA",
  green:       "#22c55e",
  amber:       "#FBBF24",
} as const;

type KeyPoint = {
  icon:  typeof Wrench;
  title: string;
  body:  string;
  color: string;
  bg:    string;
};

const POINTS: KeyPoint[] = [
  {
    icon:  Wrench,
    title: "Nicht nur finden, sondern fixen",
    body:  "Wir geben dir den fertigen Code — Copy-Paste-fertig. Andere Tools liefern dir eine Liste und lassen dich allein.",
    color: C.green,
    bg:    "rgba(34,197,94,0.12)",
  },
  {
    icon:  ScanSearch,
    title: "Hinter die Fassade schauen",
    body:  "Unser Plugin liest PHP-Logs, Plugin-Konflikte und Datenbank-Last — Signale, die ein externer Crawler nie sieht.",
    color: C.scale,
    bg:    "rgba(167,139,250,0.14)",
  },
  {
    icon:  ShieldCheck,
    title: "Haftungsschutz",
    body:  "Dokumentierte Sicherheits-Audits + Audit-Log für jeden Fix. Im Streitfall mit dem Endkunden ist die Wartung nachweisbar.",
    color: C.amber,
    bg:    "rgba(251,191,36,0.14)",
  },
];

function isAgency(plan: string): boolean {
  const p = plan.toLowerCase();
  return p === "agency" || p === "agency-pro" || p === "agency-starter";
}

function isAtLeastPro(plan: string): boolean {
  const p = plan.toLowerCase();
  return p === "professional" || p === "smart-guard" || isAgency(plan);
}

export default function WhyWebsitefixCard({ plan }: Props) {
  // Agency-User kennen das Wertversprechen — Card wäre dort defensive Geste.
  if (isAgency(plan)) return null;

  // Pro sieht alle 3 Punkte (auch Haftungsschutz als Vorgeschmack auf Agency).
  // Starter sieht nur die ersten 2 — Punkt 3 mit Agency-only-Pill ergänzt.
  const showAll = isAtLeastPro(plan);
  const visible: Array<KeyPoint & { agencyHint?: boolean }> = showAll
    ? POINTS
    : [POINTS[0], POINTS[1], { ...POINTS[2], agencyHint: true }];

  return (
    <section
      data-testid="why-websitefix-card"
      style={{
        marginBottom: 20,
        padding: "20px 22px", borderRadius: 14,
        background: C.card,
        border: `1px solid ${C.cardBorder}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span aria-hidden="true" style={{
          width: 26, height: 26, borderRadius: 7,
          background: "rgba(167,139,250,0.16)",
          border: `1px solid ${C.cardBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: C.scale, fontSize: 13,
        }}>
          ✦
        </span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>
          Warum du mehr als nur einen Scan hast
        </h3>
      </div>

      <ul style={{
        margin: 0, padding: 0, listStyle: "none",
        display: "grid", gap: 10,
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      }}>
        {visible.map((p, i) => {
          const Icon = p.icon;
          const num  = i + 1;
          return (
            <li key={p.title} style={{
              padding: "12px 14px", borderRadius: 10,
              background: "rgba(0,0,0,0.22)",
              border: `1px solid ${C.border}`,
              display: "flex", gap: 11, alignItems: "flex-start",
              position: "relative",
            }}>
              <span aria-hidden="true" style={{
                flexShrink: 0,
                width: 30, height: 30, borderRadius: 8,
                background: p.bg,
                border: `1px solid ${p.color}33`,
                color: p.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={15} strokeWidth={2.2} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 11.5, fontWeight: 800, color: p.color,
                  letterSpacing: "0.04em", marginBottom: 2,
                }}>
                  {num}. {p.title}
                  {p.agencyHint && (
                    <span style={{
                      marginLeft: 8,
                      fontSize: 9, fontWeight: 800,
                      padding: "1px 7px", borderRadius: 999,
                      background: "rgba(167,139,250,0.16)",
                      border: `1px solid ${C.cardBorder}`,
                      color: C.scale,
                      letterSpacing: "0.10em", textTransform: "uppercase",
                    }}>
                      Agency
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>
                  {p.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
