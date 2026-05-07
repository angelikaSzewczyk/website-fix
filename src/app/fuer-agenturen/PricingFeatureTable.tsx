/**
 * PricingFeatureTable — Feature-by-Feature Vergleich Professional vs. Agency Scale.
 *
 * Direkte Umsetzung des Pricing-Screenshots (07.05.2026): zwei-spaltiges
 * Grid mit Lock-Icons in der Pro-Spalte und kräftigen Checks in der Agency-
 * Scale-Spalte. Die Agency-Spalte enthält zusätzlich eine gold-akzentuierte
 * "Wartungs-Marge verdoppeln"-Box (50 Mandanten → 9.750 € Ersparnis/Mo) als
 * Profit-Anker.
 *
 * Server-Component — kein Interaktivitätsbedarf, der CTA ist ein Stripe-
 * Checkout-Button (existierender CheckoutButton-Wrapper). Wird in der
 * Pricing-Sektion direkt unter den drei Plan-Cards angezeigt.
 */

import { Lock, Check, Wallet, Sparkles } from "lucide-react";
import CheckoutButton from "../components/checkout-button";

const T = {
  card:        "rgba(255,255,255,0.025)",
  cardDark:    "rgba(0,0,0,0.32)",
  border:      "rgba(255,255,255,0.08)",
  borderStr:   "rgba(255,255,255,0.14)",
  text:        "#fff",
  textSub:     "rgba(255,255,255,0.65)",
  textMuted:   "rgba(255,255,255,0.42)",
  textFaint:   "rgba(255,255,255,0.28)",
  amber:       "#FBBF24",
  amberStrong: "#F59E0B",
  amberBg:     "rgba(251,191,36,0.10)",
  amberBorder: "rgba(251,191,36,0.32)",
  amberGlow:   "rgba(251,191,36,0.40)",
  scale:       "#A78BFA",
  scaleBg:     "rgba(167,139,250,0.10)",
  scaleBorder: "rgba(167,139,250,0.34)",
} as const;

type FeatureRow = {
  /** Feature-Label (linke Spalte). */
  label: string;
  /** Optionales Pill rechts vom Label, z.B. "Prewermode" oder "Limited". */
  pill?: { text: string; tone: "info" | "limited" };
  /** Render-Modus für die Pro-Spalte. "lock" = Schloss, "check" = ✓, "limited" = ✓ + Pill. */
  pro: "lock" | "check" | "limited";
  /** Render-Modus für die Agency-Spalte. "premium" → mit Sparkle-Glanz. */
  agency: "check" | "premium";
  /** Optionale Sub-Punkte unter Agency-Check (z.B. White-Label-Optionen). */
  agencySubBullets?: string[];
};

const ROWS: FeatureRow[] = [
  {
    label:  "Hybrid-Scan-Modi (Blackbox vs. Röntgen)",
    pro:    "lock",
    agency: "check",
  },
  {
    label:  "Smart-Fix-Drawer & Diagnosetiefe",
    pill:   { text: "Premium-Mode", tone: "info" },
    pro:    "lock",
    agency: "check",
  },
  {
    label:  "Lead-Gen Widget auf eigener Website",
    pill:   { text: "Limited", tone: "limited" },
    pro:    "lock",
    agency: "check",
  },
  {
    label:  "White-Label Branding",
    pill:   { text: "Limited", tone: "limited" },
    pro:    "lock",
    agency: "check",
    agencySubBullets: [
      "Premium-Branding & Subdomain",
      "White-Label Auto-Reports",
      "White-Label Mandanten-Portal",
    ],
  },
  {
    label:  "Team-Rollen (Admin / Dev / Viewer)",
    pro:    "lock",
    agency: "check",
  },
  {
    label:  "Delegations-Workflow",
    pro:    "lock",
    agency: "check",
  },
  {
    label:  "Malware-Pattern Analyse",
    pro:    "lock",
    agency: "premium",
  },
];

function CellPro({ mode }: { mode: FeatureRow["pro"] }) {
  if (mode === "check") {
    return (
      <span aria-label="enthalten" style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 8,
        background: "rgba(255,255,255,0.04)",
        color: T.textSub,
      }}>
        <Check size={14} strokeWidth={3} />
      </span>
    );
  }
  // lock
  return (
    <span
      aria-label="nicht enthalten — Agency Scale erforderlich"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 32, height: 28, borderRadius: 8,
        background: "rgba(0,0,0,0.40)",
        border: "1px solid rgba(251,191,36,0.18)",
        color: T.amber,
      }}
    >
      <Lock size={13} strokeWidth={2.4} />
    </span>
  );
}

function CellAgency({ mode }: { mode: FeatureRow["agency"] }) {
  return (
    <span
      aria-label="enthalten"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 8,
        background: mode === "premium" ? T.amberBg : "rgba(34,197,94,0.10)",
        border: `1px solid ${mode === "premium" ? T.amberBorder : "rgba(34,197,94,0.32)"}`,
        color: mode === "premium" ? T.amber : "#22C55E",
      }}
    >
      {mode === "premium" ? <Sparkles size={13} strokeWidth={2.4} /> : <Check size={14} strokeWidth={3} />}
    </span>
  );
}

function Pill({ text, tone }: NonNullable<FeatureRow["pill"]>) {
  const isLimited = tone === "limited";
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 800,
      padding: "2px 8px", borderRadius: 999,
      background: isLimited ? "rgba(255,255,255,0.05)" : T.scaleBg,
      border: `1px solid ${isLimited ? T.border : T.scaleBorder}`,
      color: isLimited ? T.textMuted : T.scale,
      letterSpacing: "0.06em", textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {text}
    </span>
  );
}

export default function PricingFeatureTable() {
  return (
    <section style={{ maxWidth: 1100, margin: "56px auto 0", padding: "0 24px" }}>
      {/* ── Header-CTA "Agentur-Marge jetzt skalieren →" ─────────────────── */}
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <CheckoutButton
          plan="agency"
          label="Agentur-Marge jetzt skalieren →"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 28px", borderRadius: 12,
            background: "linear-gradient(90deg,#7C3AED,#A78BFA)",
            color: "#fff", fontSize: 14, fontWeight: 800,
            border: "none", cursor: "pointer",
            boxShadow: "0 10px 30px rgba(124,58,237,0.55)",
          }}
        />
        <p style={{ margin: "10px 0 0", fontSize: 11.5, color: T.textFaint, letterSpacing: "0.04em" }}>
          Professional-Plan upgraden
        </p>
      </div>

      {/* ── Tabelle ──────────────────────────────────────────────────────── */}
      <div style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 18, overflow: "hidden",
      }}>
        {/* Header-Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1.4fr) minmax(160px, 1fr) minmax(220px, 1.4fr)",
          padding: "16px 22px",
          borderBottom: `1px solid ${T.border}`,
          background: "rgba(255,255,255,0.015)",
          alignItems: "baseline", gap: 12,
        }}>
          <div />
          <div style={{
            fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "-0.01em",
            display: "flex", alignItems: "baseline", gap: 8,
          }}>
            Professional
            <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 700 }}>89 €/Mo</span>
          </div>
          <div style={{
            position: "relative",
            padding: "10px 14px", margin: "-10px -14px",
            borderRadius: 12,
            background: "rgba(251,191,36,0.04)",
            border: `1px solid ${T.amberBorder}`,
            display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10,
            boxShadow: `0 0 24px ${T.amberGlow}`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.amber, letterSpacing: "-0.01em" }}>
              Agency Scale
            </span>
            <span style={{ fontSize: 12, color: T.amber, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
              249 €/Mo
            </span>
          </div>
        </div>

        {/* Wartungs-Marge-Box im Agency-Header (visueller ROI-Anker) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 1.4fr) minmax(160px, 1fr) minmax(220px, 1.4fr)",
          padding: "0 22px",
          gap: 12, alignItems: "stretch",
        }}>
          <div />
          <div />
          <div style={{
            margin: "14px 0",
            padding: "14px 16px", borderRadius: 12,
            background: "linear-gradient(135deg, rgba(251,191,36,0.16), rgba(245,158,11,0.06))",
            border: `1px solid ${T.amberBorder}`,
            boxShadow: `0 6px 24px rgba(251,191,36,0.18)`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span aria-hidden="true" style={{
              flexShrink: 0,
              width: 36, height: 36, borderRadius: 10,
              background: T.amberBg, border: `1px solid ${T.amberBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: T.amberStrong,
            }}>
              <Wallet size={18} strokeWidth={2.2} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 12, fontWeight: 800, color: T.amber,
                letterSpacing: "-0.01em", marginBottom: 2,
              }}>
                Wartungs-Marge verdoppeln:
              </div>
              <div style={{ fontSize: 11.5, color: T.textSub, lineHeight: 1.45, fontVariantNumeric: "tabular-nums" }}>
                50 Mandanten · ≈ <strong style={{ color: T.amberStrong, fontWeight: 800 }}>9.750 €</strong> Ersparnis/Monat
              </div>
            </div>
          </div>
        </div>

        {/* Feature-Rows */}
        <div>
          {ROWS.map((row, i) => {
            const isLast = i === ROWS.length - 1;
            return (
              <div
                key={row.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 1.4fr) minmax(160px, 1fr) minmax(220px, 1.4fr)",
                  padding: "16px 22px",
                  borderTop: `1px solid ${T.border}`,
                  borderBottom: isLast ? "none" : undefined,
                  alignItems: "center", gap: 12,
                }}
              >
                {/* Feature-Label */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: "-0.01em" }}>
                    {row.label}
                  </span>
                  {row.pill && <Pill text={row.pill.text} tone={row.pill.tone} />}
                </div>

                {/* Pro-Spalte */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <CellPro mode={row.pro} />
                </div>

                {/* Agency-Spalte */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexDirection: "column" }}>
                  <CellAgency mode={row.agency} />
                  {row.agencySubBullets && (
                    <ul style={{
                      margin: "2px 0 0 4px", padding: 0, listStyle: "none",
                      display: "flex", flexDirection: "column", gap: 4,
                    }}>
                      {row.agencySubBullets.map(b => (
                        <li key={b} style={{
                          fontSize: 11.5, color: T.textMuted, lineHeight: 1.5,
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          <span aria-hidden="true" style={{ color: T.amber, fontWeight: 800 }}>—</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p style={{
        margin: "16px auto 0", maxWidth: 680, textAlign: "center",
        fontSize: 11.5, color: T.textFaint, lineHeight: 1.6,
      }}>
        🔒 = im Professional-Plan nicht enthalten · ✓ = im Agency-Scale-Plan voll enthalten ·
        Premium-Features (✦) sind Agency-Scale-exklusiv.
      </p>
    </section>
  );
}
