import Link from "next/link";

type Step = {
  done:    boolean;
  label:   string;
  detail:  string;
  href?:   string;
  cta:     string;
};

type Props = {
  brandingDone: boolean;
  slackDone:    boolean;
  clientDone:   boolean;
};

export default function QuickStartGuide({ brandingDone, slackDone, clientDone }: Props) {
  const allDone = brandingDone && slackDone && clientDone;

  // ── All done: slim success banner ──────────────────────────────────────────
  if (allDone) {
    return (
      <div style={{
        marginBottom: 32,
        padding: "14px 22px",
        borderRadius: 12,
        background: "rgba(141,243,211,0.05)",
        border: "1px solid rgba(141,243,211,0.2)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "rgba(141,243,211,0.12)", border: "1px solid rgba(141,243,211,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}>✓</span>
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#8df3d3" }}>
            System bereit –
          </span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginLeft: 6 }}>
            Deine Agentur ist jetzt im Autopilot-Modus!
          </span>
        </div>
      </div>
    );
  }

  // ── Checklist ───────────────────────────────────────────────────────────────
  const steps: Step[] = [
    {
      done:   brandingDone,
      label:  "Branding einrichten",
      detail: "Logo hochladen & Agenturfarben wählen.",
      href:   "/dashboard/settings",
      cta:    "Einstellungen öffnen →",
    },
    {
      done:   slackDone,
      label:  "Slack-Integration",
      detail: "KI-Fehlermeldungen direkt in deinen Channel.",
      href:   "/dashboard/settings",
      cta:    "Slack verbinden →",
    },
    {
      done:   clientDone,
      label:  "Ersten Kunden anlegen",
      detail: "Füge deine erste Website hinzu und starte die Überwachung.",
      href:   "/dashboard/clients",
      cta:    "Website hinzufügen →",
    },
  ];

  const doneCount = steps.filter(s => s.done).length;

  return (
    <div style={{
      marginBottom: 36,
      borderRadius: 14,
      border: "1px solid rgba(0,123,255,0.3)",
      background: "rgba(0,123,255,0.03)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 24px 16px",
        borderBottom: "1px solid rgba(0,123,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Willkommen bei WebsiteFix!
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            In 3 Schritten zum automatisierten Reporting
          </p>
        </div>

        {/* Progress pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                width: 24, height: 4, borderRadius: 2,
                background: s.done ? "#007BFF" : "rgba(255,255,255,0.1)",
                transition: "background 0.2s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
            {doneCount}/3
          </span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: "8px 0" }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 16,
            padding: "14px 24px",
            borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            opacity: step.done ? 0.45 : 1,
            transition: "opacity 0.2s",
          }}>
            {/* Check circle */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 1,
              background: step.done ? "rgba(141,243,211,0.12)" : "rgba(0,123,255,0.1)",
              border: step.done ? "1px solid rgba(141,243,211,0.35)" : "1px solid rgba(0,123,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {step.done ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#8df3d3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#007BFF" }}>{i + 1}</span>
              )}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: step.done ? "rgba(255,255,255,0.5)" : "#fff",
                  textDecoration: step.done ? "line-through" : "none",
                }}>
                  {step.label}
                </span>
                {step.done && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                    background: "rgba(141,243,211,0.1)", color: "#8df3d3",
                    border: "1px solid rgba(141,243,211,0.2)",
                  }}>
                    Erledigt
                  </span>
                )}
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                {step.detail}
              </p>
            </div>

            {/* CTA */}
            {!step.done && step.href && (
              <Link href={step.href} style={{
                flexShrink: 0, alignSelf: "center",
                fontSize: 12, fontWeight: 600, color: "#7aa6ff",
                textDecoration: "none", whiteSpace: "nowrap",
              }}>
                {step.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
