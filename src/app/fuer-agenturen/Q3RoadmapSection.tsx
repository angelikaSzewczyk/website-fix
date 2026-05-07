/**
 * Q3RoadmapSection — Roadmap-Stripe unter dem Pricing-Vergleich.
 *
 * Drei Roadmap-Karten in Timeline-Form mit verbindender vertikaler Linie:
 *   1. Core-Checksum-Audit (WP.org-Hash-Vergleich)
 *   2. 60-Sekunden-Watchdog (Echtzeit-Ausfall-Monitor)
 *   3. Visual-Regression-Archive (Vorher-Nachher-Screenshots)
 *
 * Beta-Hook am Ende: "Sichere dir jetzt den Tarif, Bestandskunden behalten
 * den Preis nach dem Update". Nutzt den existierenden CheckoutButton für
 * direkten Stripe-Flow auf den Agency-Plan.
 *
 * Server-Component — keine Interaktion. Wird in /fuer-agenturen direkt
 * unter PricingFeatureTable eingebettet.
 */

import { ShieldCheck, Activity, ImageDown } from "lucide-react";
import CheckoutButton from "../components/checkout-button";

const T = {
  text:        "#fff",
  textSub:     "rgba(255,255,255,0.65)",
  textMuted:   "rgba(255,255,255,0.42)",
  textFaint:   "rgba(255,255,255,0.28)",
  card:        "rgba(255,255,255,0.025)",
  cardSolid:   "#0f1623",
  border:      "rgba(255,255,255,0.08)",
  borderStr:   "rgba(255,255,255,0.14)",
  scale:       "#A78BFA",
  scaleBg:     "rgba(167,139,250,0.10)",
  scaleBorder: "rgba(167,139,250,0.32)",
  amber:       "#FBBF24",
  amberBg:     "rgba(251,191,36,0.10)",
  amberBorder: "rgba(251,191,36,0.32)",
} as const;

type RoadmapItem = {
  quarter: string;
  Icon:    typeof ShieldCheck;
  iconBg:  string;
  iconBd:  string;
  iconFg:  string;
  title:   string;
  body:    string;
  bullets: string[];
};

const ITEMS: RoadmapItem[] = [
  {
    quarter: "Q3 / 2026",
    Icon:    ShieldCheck,
    iconBg:  "rgba(34,197,94,0.14)",
    iconBd:  "rgba(34,197,94,0.34)",
    iconFg:  "#22c55e",
    title:   "Core-Checksum-Audit",
    body:    "Vergleicht jede Datei deiner WordPress-Installation gegen die offiziellen Hashes von WordPress.org — Hack-Detection auf Datei-Ebene.",
    bullets: [
      "Prüft wp-includes/, wp-admin/, Core-Themes",
      "Erkennt manipulierte Core-Files (typisches Backdoor-Pattern)",
      "Diff-Liste der modifizierten Bytes pro Datei",
    ],
  },
  {
    quarter: "Q3 / 2026",
    Icon:    Activity,
    iconBg:  "rgba(167,139,250,0.14)",
    iconBd:  "rgba(167,139,250,0.34)",
    iconFg:  "#a78bfa",
    title:   "60-Sekunden-Watchdog",
    body:    "Echtzeit-Monitoring statt 12-Stunden-Heartbeat. Slack/E-Mail-Alarm bei Ausfall innerhalb von 60 Sekunden.",
    bullets: [
      "HTTP-HEAD-Probe alle 60 s aus drei Regionen",
      "Multi-Channel-Alerts (Slack, E-Mail, später WhatsApp)",
      "Incident-Log mit Downtime-MTTR pro Mandant",
    ],
  },
  {
    quarter: "Q3 / 2026",
    Icon:    ImageDown,
    iconBg:  "rgba(251,191,36,0.14)",
    iconBd:  "rgba(251,191,36,0.34)",
    iconFg:  "#fbbf24",
    title:   "Visual-Regression-Archive",
    body:    "Vorher-Nachher-Screenshots deiner Wartungsarbeiten — als Beleg gegenüber Endkunden, dass Updates nichts gebrochen haben.",
    bullets: [
      "Auto-Screenshot bei jedem Plugin-/Theme-Update",
      "Side-by-Side-Diff im Dashboard",
      "PDF-Export als Wartungsbeleg für den Kunden",
    ],
  },
];

export default function Q3RoadmapSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "72px auto 0", padding: "0 24px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36, maxWidth: 720, marginInline: "auto" }}>
        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: "0.10em", textTransform: "uppercase" }}>
          WebsiteFix Roadmap · Q3 / 2026
        </p>
        <h2 style={{ margin: "0 0 14px", fontSize: "clamp(24px, 3.2vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.18, color: T.text }}>
          Was im Q3 freigeschaltet wird
        </h2>
        <p style={{ margin: 0, fontSize: 14.5, color: T.textSub, lineHeight: 1.65 }}>
          Drei Erweiterungen, die exklusiv im Agency-Scale-Tarif aktiviert werden.
          Aktuell sind <strong style={{ color: T.text }}>92 Deep-Checks</strong> live — diese drei
          Module bringen den Counter auf 100+.
        </p>
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
        {/* Vertikale Verbindungslinie (versteckt sich auf mobile) */}
        <div className="wf-roadmap-line" aria-hidden="true" style={{
          position: "absolute",
          left: 27, top: 32, bottom: 32, width: 1,
          background: `linear-gradient(180deg, ${T.scaleBorder}, ${T.amberBorder})`,
        }} />

        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 18 }}>
          {ITEMS.map((item, i) => {
            const Icon = item.Icon;
            return (
              <li key={item.title} style={{
                position: "relative",
                paddingLeft: 76,
              }}>
                {/* Icon-Bubble */}
                <span aria-hidden="true" style={{
                  position: "absolute", left: 0, top: 8,
                  width: 56, height: 56, borderRadius: 14,
                  background: item.iconBg,
                  border: `1px solid ${item.iconBd}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: item.iconFg, zIndex: 2,
                }}>
                  <Icon size={24} strokeWidth={2.2} />
                </span>

                {/* Card */}
                <div style={{
                  padding: "20px 22px", borderRadius: 14,
                  background: T.cardSolid,
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: "2px 9px", borderRadius: 999,
                      background: T.amberBg, color: T.amber,
                      border: `1px solid ${T.amberBorder}`,
                      letterSpacing: "0.10em", textTransform: "uppercase",
                    }}>
                      {item.quarter}
                    </span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: "2px 9px", borderRadius: 999,
                      background: T.scaleBg, color: T.scale,
                      border: `1px solid ${T.scaleBorder}`,
                      letterSpacing: "0.10em", textTransform: "uppercase",
                    }}>
                      Agency Scale exklusiv
                    </span>
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
                    {item.title}
                  </h3>
                  <p style={{ margin: "0 0 12px", fontSize: 13.5, color: T.textSub, lineHeight: 1.65 }}>
                    {item.body}
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                    {item.bullets.map(b => (
                      <li key={b} style={{
                        fontSize: 12.5, color: T.textMuted, lineHeight: 1.6,
                        display: "flex", gap: 8,
                      }}>
                        <span aria-hidden="true" style={{ color: item.iconFg, fontWeight: 800, flexShrink: 0 }}>—</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Connector hidden für letztes Item */}
                {i === ITEMS.length - 1 && null}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Beta-Hook */}
      <div style={{
        marginTop: 36, padding: "22px 26px", borderRadius: 16,
        background: `linear-gradient(135deg, ${T.scaleBg}, ${T.amberBg})`,
        border: `1px solid ${T.amberBorder}`,
        boxShadow: "0 12px 40px rgba(251,191,36,0.10)",
        display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap",
        maxWidth: 720, marginInline: "auto",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: T.amberBg, border: `1px solid ${T.amberBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: T.amber, fontSize: 22, fontWeight: 800,
        }} aria-hidden="true">
          🔒
        </div>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: T.amber, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 4 }}>
            Beta-Vorteil — nur jetzt
          </div>
          <p style={{ margin: 0, fontSize: 14, color: T.text, lineHeight: 1.6 }}>
            Sichere dir jetzt den <strong>Agency-Scale-Tarif zu 249 €/Monat</strong>. Bestandskunden
            behalten den aktuellen Preis, auch wenn nach dem Q3-Update die Preise für Neukunden steigen.
          </p>
        </div>
        <CheckoutButton
          plan="agency"
          label="Preis sichern →"
          style={{
            flexShrink: 0,
            padding: "12px 22px", borderRadius: 11,
            background: "linear-gradient(90deg,#7C3AED,#A78BFA)",
            color: "#fff", fontSize: 13.5, fontWeight: 800,
            border: "none", cursor: "pointer",
            boxShadow: "0 6px 22px rgba(124,58,237,0.42)",
          }}
        />
      </div>

      {/* Mobile-Stylesheet — Linie ausblenden auf engen Viewports */}
      <style>{`
        @media (max-width: 540px) {
          .wf-roadmap-line { display: none !important; }
        }
      `}</style>
    </section>
  );
}
