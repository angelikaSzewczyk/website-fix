/**
 * DelegationWidget — der „Beweis"-Block im Agency-Dashboard.
 *
 * Zeigt dem Inhaber auf einen Blick:
 *   1. Wie viele Issues derzeit offen sind
 *   2. Wie viele davon ein Junior/Werkstudent über Smart-Fix-Guides
 *      erledigen kann
 *   3. Wie hoch die monatliche Lohnkosten-Ersparnis dadurch ist
 *
 * Keine Mock-Zahlen — Stats kommen aus computeDelegationStats() (lib/issue-
 * delegation.ts), das jedes Issue konservativ klassifiziert. Wenn unklar
 * → senior, damit wir keine zu hohen Versprechen machen.
 *
 * Render-Bedingung: nur einblenden, wenn totalIssues > 0. Ohne Issues
 * gäbe es nichts zu delegieren — der Widget-Effekt ("Aha, ich spare X €")
 * funktioniert nicht.
 */

import Link from "next/link";
import { DELEGATION_ASSUMPTIONS, type DelegationStats } from "@/lib/issue-delegation";

const C = {
  bg:      "rgba(124,58,237,0.06)",
  border:  "rgba(167,139,250,0.30)",
  accent:  "#a78bfa",
  amber:   "#fbbf24",
  amberBg: "rgba(251,191,36,0.10)",
  text:    "rgba(255,255,255,0.92)",
  textSub: "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.4)",
} as const;

function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(value);
}

export default function DelegationWidget({ stats }: { stats: DelegationStats }) {
  if (stats.totalIssues === 0) return null;

  const ratioPct = Math.round(stats.juniorRatio * 100);
  const savings  = stats.monthlySavingsEur;

  return (
    <section
      aria-label="Delegations-Übersicht"
      style={{
        background: `linear-gradient(135deg, ${C.bg}, rgba(251,191,36,0.04))`,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "22px 26px",
        marginBottom: 16,
        boxShadow: "0 0 36px rgba(124,58,237,0.10)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ minWidth: 0, flex: "1 1 240px" }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Delegations-Hebel
          </p>
          <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
            Was dein Junior heute übernehmen kann
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.55, maxWidth: 520 }}>
            Wir markieren jeden Befund nach Senior- oder Junior-Niveau —
            basiert auf Smart-Fix-Guides, die ohne Code-Zugang im WordPress-
            Backend funktionieren. So siehst du, wie viel Senior-Zeit du
            jeden Monat zurückbekommst.
          </p>
        </div>

        {/* Hauptzahl: monatliche Ersparnis */}
        <div style={{
          flexShrink: 0,
          background: C.amberBg,
          border: `1px solid rgba(251,191,36,0.35)`,
          borderRadius: 12,
          padding: "12px 18px",
          minWidth: 200,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.amber, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 4 }}>
            Lohnkosten-Ersparnis · Monat
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#fbbf24", letterSpacing: "-0.03em", lineHeight: 1 }}>
            ≈ {formatEur(savings)} €
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5, lineHeight: 1.4 }}>
            bei {DELEGATION_ASSUMPTIONS.seniorHourlyEur} €/h Senior · {DELEGATION_ASSUMPTIONS.juniorHourlyEur} €/h Junior · 1 h pro Fix
          </div>
        </div>
      </div>

      {/* Detail-Bar: 3 Counter */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {stats.totalIssues}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Issues offen · alle Kunden</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.22)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#4ade80", lineHeight: 1, letterSpacing: "-0.02em" }}>
              {stats.juniorSolvableCount}
            </span>
            <span style={{ fontSize: 12, color: "rgba(74,222,128,0.7)", fontWeight: 700 }}>· {ratioPct} %</span>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>davon durch Junior lösbar</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.20)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#f87171", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {stats.seniorRequiredCount}
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>brauchen Senior-Zeit</div>
        </div>
      </div>

      {/* Visueller Balken (Senior vs Junior Anteil) */}
      <div aria-hidden="true" style={{ height: 6, borderRadius: 4, background: "rgba(248,113,113,0.18)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{
          width: `${ratioPct}%`, height: "100%",
          background: "linear-gradient(90deg, #4ade80 0%, #22c55e 100%)",
          transition: "width 0.6s ease",
        }} />
      </div>

      {/* CTA-Zeile */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5, maxWidth: 540 }}>
          Tipp: Lade einen Junior als <strong style={{ color: C.text, fontWeight: 700 }}>Editor</strong> in dein Team ein — er sieht nur Issues + Smart-Fix-Guides, kein Billing, keine Kundenverwaltung.
        </div>
        <Link
          href="/dashboard/team"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 18px", borderRadius: 9,
            background: "rgba(167,139,250,0.18)", border: `1px solid ${C.border}`,
            color: C.accent, fontSize: 12.5, fontWeight: 800,
            textDecoration: "none", whiteSpace: "nowrap",
          }}
        >
          Team-Einladung verwalten →
        </Link>
      </div>
    </section>
  );
}
