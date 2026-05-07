/**
 * Guide-PDF — Premium-Rescue-Guide als PDF-Anhang.
 *
 * Wird vom Stripe-Webhook bei jedem Pay-per-Fix-Kauf serverseitig gerendert
 * und der Bestätigungs-Mail beigefügt. Damit hat der Käufer den Guide
 * "physisch" im Postfach — unabhängig von WebsiteFix-Server-Status. Echter
 * Lebenslang-Zugriff: solange die Mail im Postfach ist, kann der User die
 * Anleitung lesen.
 *
 * Render-Reihenfolge entspricht der UI-Guide-Page (guide-renderer.tsx):
 *   1. Cover mit Titel + TL;DR
 *   2. Säule 1: Sofort-Fix (band_aid)
 *   3. Säule 2: Diagnose
 *   4. Säule 3: Profi-Skripte (pro_tools)
 *   5. Hoster-spezifische Steps (falls ausgewählt)
 *   6. Default-Steps (Backup-Anleitung)
 *   7. Notfall-Fallschirm (not_solved)
 *   8. Checkliste
 *   9. Footer mit Lebenslang-Hinweis
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type {
  RescueGuide,
  GuideStep,
  GuideChecklistItem,
} from "@/lib/rescue-guides";

// ─── Print-Theme ──────────────────────────────────────────────────────────────
const T = {
  primary:  "#7C3AED",
  amber:    "#D97706",
  green:    "#16A34A",
  cyan:     "#0891B2",
  red:      "#DC2626",
  text:     "#0F172A",
  textSub:  "#475569",
  textMuted:"#94A3B8",
  border:   "#E2E8F0",
  divider:  "#F1F5F9",
  bg:       "#F8FAFC",
  bgPurple: "#F5F3FF",
  bgGold:   "#FFFBEB",
  bgGreen:  "#F0FDF4",
  bgCyan:   "#ECFEFF",
  codeBg:   "#0F172A",
  codeText: "#E2E8F0",
} as const;

const styles = StyleSheet.create({
  page: {
    paddingTop:    40,
    paddingBottom: 50,
    paddingLeft:   46,
    paddingRight:  46,
    fontSize:      10.5,
    color:         T.text,
    fontFamily:    "Helvetica",
    backgroundColor: "#FFFFFF",
    lineHeight:    1.5,
  },
  // Cover
  coverHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  coverBrand:  { fontSize: 14, fontWeight: 700, color: T.primary },
  coverHoster: { fontSize: 9, color: T.textMuted, fontFamily: "Helvetica-Oblique" },

  guideKicker: { fontSize: 9, fontWeight: 700, color: T.primary, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 },
  guideTitle:  { fontSize: 24, fontWeight: 700, color: T.text, marginBottom: 8 },
  guideIntro:  { fontSize: 11, color: T.textSub, lineHeight: 1.65, marginBottom: 16 },

  tldrBox: {
    padding: "14 18",
    backgroundColor: T.bgPurple,
    border: `1pt solid ${T.primary}`,
    borderRadius: 6,
    marginBottom: 22,
  },
  tldrLabel: { fontSize: 8.5, fontWeight: 700, color: T.primary, letterSpacing: 1.5, marginBottom: 4 },
  tldrText:  { fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1.5 },

  // Sections
  sectionHeader: { marginTop: 14, marginBottom: 12, paddingBottom: 8, borderBottom: `0.5pt solid ${T.border}` },
  sectionNumBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: T.primary, color: "#fff",
    fontSize: 11, fontWeight: 700,
    textAlign: "center", paddingTop: 4,
    marginRight: 8,
  },
  sectionKicker: { fontSize: 8.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" },
  sectionTitle:  { fontSize: 16, fontWeight: 700, color: T.text, marginTop: 4 },
  sectionRow:    { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },

  // Step cards
  step: {
    marginBottom: 12, padding: "12 14",
    backgroundColor: T.bg,
    borderLeft: `2pt solid ${T.primary}`,
    borderRadius: 4,
  },
  stepHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  stepNum: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: T.primary, color: "#fff",
    fontSize: 9, fontWeight: 700, textAlign: "center", paddingTop: 4,
    marginRight: 8,
  },
  stepTitle: { fontSize: 12, fontWeight: 700, color: T.text, flex: 1 },
  stepBody:  { fontSize: 10, color: T.textSub, lineHeight: 1.55, marginLeft: 26 },

  // Code blocks
  codeWrap: {
    marginTop: 8, marginLeft: 26,
    padding: "8 10",
    backgroundColor: T.codeBg,
    borderRadius: 4,
  },
  codeLang: { fontSize: 7.5, color: "#94A3B8", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  codeText: { fontSize: 9, fontFamily: "Courier", color: T.codeText, lineHeight: 1.45 },

  // Diagnosis box
  diagBox: {
    padding: "14 16", marginBottom: 14,
    backgroundColor: T.bgGold,
    border: `0.5pt solid ${T.amber}`,
    borderRadius: 4,
  },
  diagText: { fontSize: 10.5, color: T.textSub, lineHeight: 1.65 },
  pluginHint: {
    marginTop: 10, padding: "10 12",
    backgroundColor: "#FFFFFF",
    border: `0.5pt dashed ${T.green}`,
    borderRadius: 4,
  },
  pluginHintLabel: { fontSize: 8.5, fontWeight: 700, color: T.green, letterSpacing: 1.5, marginBottom: 4 },
  pluginHintText:  { fontSize: 10, color: T.textSub, lineHeight: 1.55 },

  // Pro-Tools
  proTool: {
    marginBottom: 12, padding: "10 14",
    backgroundColor: T.bgCyan,
    borderLeft: `2pt solid ${T.cyan}`,
    borderRadius: 4,
  },
  proToolHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  proToolBadge: {
    fontSize: 7.5, fontWeight: 700, color: T.cyan,
    backgroundColor: "#FFFFFF", border: `0.5pt solid ${T.cyan}`,
    borderRadius: 8, padding: "2 6", letterSpacing: 1, textTransform: "uppercase",
    marginRight: 6,
  },
  proToolLabel: { fontSize: 11, fontWeight: 700, color: T.text, flex: 1 },
  proToolNote:  { fontSize: 9, color: T.textMuted, fontFamily: "Helvetica-Oblique", marginTop: 4, lineHeight: 1.4 },

  // Hoster section
  hosterIntro: {
    padding: "10 14", marginBottom: 12,
    backgroundColor: T.bgPurple,
    border: `0.5pt solid ${T.primary}`,
    borderRadius: 4,
  },
  hosterIntroLabel: { fontSize: 8.5, fontWeight: 700, color: T.primary, letterSpacing: 1.5, marginBottom: 4 },
  hosterIntroTitle: { fontSize: 12, fontWeight: 700, color: T.text },

  // Not solved
  notSolved: {
    marginTop: 14, padding: "12 14",
    backgroundColor: "#FEF2F2",
    border: `0.5pt dashed ${T.red}`,
    borderRadius: 4,
  },
  notSolvedTitle: { fontSize: 10.5, fontWeight: 700, color: T.red, marginBottom: 4 },
  notSolvedBody:  { fontSize: 10, color: T.textSub, lineHeight: 1.55 },

  // Checklist
  checklistTitle: { fontSize: 13, fontWeight: 700, color: T.text, marginTop: 14, marginBottom: 8 },
  checklistItem:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  checkBox:       { width: 10, height: 10, border: `0.7pt solid ${T.text}`, borderRadius: 2, marginRight: 8, marginTop: 2 },
  checkLabel:     { fontSize: 10, color: T.textSub, flex: 1 },

  // Closing
  closeBox: {
    marginTop: 14, padding: "14 16",
    backgroundColor: T.bgGreen,
    border: `0.5pt solid ${T.green}`,
    borderRadius: 4,
  },
  closeText: { fontSize: 10, color: T.textSub, lineHeight: 1.6 },

  // Footer
  footer: {
    position: "absolute", bottom: 24, left: 46, right: 46,
    flexDirection: "row", justifyContent: "space-between",
    fontSize: 8, color: T.textMuted,
    paddingTop: 8, borderTop: `0.3pt solid ${T.border}`,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────
export type GuidePdfProps = {
  guide:  RescueGuide;
  hoster: string;
  /** Verifizierte Email — wird im Footer als Lebenslang-Marker referenziert. */
  buyerEmail?: string;
  /** Stripe-Session-ID — als Beleg im Footer. */
  stripeSessionId?: string;
};

export function GuidePdf({ guide, hoster, buyerEmail, stripeSessionId }: GuidePdfProps) {
  const c = guide.content_json;
  const today = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  const hosterLabel = ((): string => {
    const map: Record<string, string> = {
      strato: "Strato", ionos: "IONOS / 1&1", "all-inkl": "All-Inkl",
      hostinger: "Hostinger", default: "Anderer Hoster",
    };
    return map[hoster] ?? hoster;
  })();

  const hosterSteps: GuideStep[] = hoster !== "default" && c.variants?.[hoster]?.steps
    ? c.variants[hoster].steps
    : [];
  const defaultSteps: GuideStep[] = c.variants?.default?.steps ?? [];
  const checklist: GuideChecklistItem[] = c.checklist ?? [];

  return (
    <Document
      title={guide.title}
      author="WebsiteFix"
      subject={guide.problem_label}
    >
      {/* ═══ Page 1 — Cover + TL;DR ═══════════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverHeader}>
          <Text style={styles.coverBrand}>WebsiteFix · Rescue-Guide</Text>
          {hoster !== "default" && (
            <Text style={styles.coverHoster}>für {hosterLabel}</Text>
          )}
        </View>

        <Text style={styles.guideKicker}>{guide.problem_label}</Text>
        <Text style={styles.guideTitle}>{guide.title}</Text>
        {c.intro && <Text style={styles.guideIntro}>{c.intro}</Text>}

        {c.tldr && (
          <View style={styles.tldrBox}>
            <Text style={styles.tldrLabel}>⚡ TL;DR</Text>
            <Text style={styles.tldrText}>{c.tldr}</Text>
          </View>
        )}

        {/* SÄULE 1 — SOFORT-FIX */}
        {c.pillars?.band_aid && (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionNumBadge}>1</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionKicker, { color: T.primary }]}>Sofort-Fix · Band-Aid</Text>
                  <Text style={styles.sectionTitle}>{c.pillars.band_aid.title}</Text>
                </View>
              </View>
            </View>
            {c.pillars.band_aid.steps.map((step, i) => (
              <StepBlock key={i} num={i + 1} step={step} accent={T.primary} />
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Seite {/* react-pdf-Counter folgt unten */}</Text>
          <Text>{guide.title} · {today}</Text>
        </View>
      </Page>

      {/* ═══ Page 2 — Diagnose + Pro-Tools ════════════════════════════════ */}
      <Page size="A4" style={styles.page}>
        {/* SÄULE 2 — DIAGNOSE */}
        {c.pillars?.diagnosis && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionNumBadge, { backgroundColor: T.amber }]}>2</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionKicker, { color: T.amber }]}>Diagnose · Was wirklich passiert</Text>
                  <Text style={styles.sectionTitle}>{c.pillars.diagnosis.title}</Text>
                </View>
              </View>
            </View>
            <View style={styles.diagBox}>
              <Text style={styles.diagText}>{c.pillars.diagnosis.body}</Text>
              {c.pillars.diagnosis.plugin_hint && (
                <View style={styles.pluginHint}>
                  <Text style={styles.pluginHintLabel}>🔍 MIT PLUGIN: 100 % STATT VERMUTUNG</Text>
                  <Text style={styles.pluginHintText}>{c.pillars.diagnosis.plugin_hint}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* SÄULE 3 — PRO-TOOLS */}
        {c.pillars?.pro_tools && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionNumBadge, { backgroundColor: T.cyan }]}>3</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionKicker, { color: T.cyan }]}>Profi-Skripte · Senior-Dev-Toolset</Text>
                  <Text style={styles.sectionTitle}>{c.pillars.pro_tools.title}</Text>
                </View>
              </View>
            </View>
            {c.pillars.pro_tools.items.map((item, i) => (
              <View key={i} style={styles.proTool}>
                <View style={styles.proToolHeader}>
                  <Text style={styles.proToolBadge}>{item.language}</Text>
                  <Text style={styles.proToolLabel}>{item.label}</Text>
                </View>
                <View style={styles.codeWrap}>
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
                {item.note && <Text style={styles.proToolNote}>Hinweis: {item.note}</Text>}
              </View>
            ))}
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>WebsiteFix · {today}</Text>
          <Text>{guide.title}</Text>
        </View>
      </Page>

      {/* ═══ Page 3 — Hoster + Checklist + Closing ════════════════════════ */}
      <Page size="A4" style={styles.page}>
        {/* HOSTER-VARIANTS (falls ausgewählt) */}
        {hosterSteps.length > 0 && (
          <>
            <View style={styles.hosterIntro}>
              <Text style={styles.hosterIntroLabel}>Speziell für {hosterLabel}</Text>
              <Text style={styles.hosterIntroTitle}>Klick-Pfade in deinem Hosting-Backend</Text>
            </View>
            {hosterSteps.map((step, i) => (
              <StepBlock key={`h${i}`} num={i + 1} step={step} accent={T.primary} prefix={hosterLabel.charAt(0)} />
            ))}
          </>
        )}

        {/* DEFAULT-STEPS (kompakter Backup-Pfad) */}
        {defaultSteps.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { fontSize: 14, marginTop: hosterSteps.length > 0 ? 14 : 0 }]}>
              Anleitung — {defaultSteps.length} Schritte (Standard-Pfad)
            </Text>
            {defaultSteps.map((step, i) => (
              <StepBlock key={`d${i}`} num={i + 1} step={step} accent={T.textMuted} compact />
            ))}
          </>
        )}

        {/* NOT SOLVED */}
        {c.not_solved && (
          <View style={styles.notSolved}>
            <Text style={styles.notSolvedTitle}>🪂 {c.not_solved.title}</Text>
            <Text style={styles.notSolvedBody}>{c.not_solved.body}</Text>
          </View>
        )}

        {/* CHECKLIST */}
        {checklist.length > 0 && (
          <>
            <Text style={styles.checklistTitle}>Deine Fortschritts-Checkliste</Text>
            {checklist.map((item, i) => (
              <View key={i} style={styles.checklistItem}>
                <View style={styles.checkBox} />
                <Text style={styles.checkLabel}>{item.text}</Text>
              </View>
            ))}
          </>
        )}

        {/* PSYCHOLOGICAL CLOSE */}
        {c.psychological_close && (
          <View style={styles.closeBox}>
            <Text style={styles.closeText}>🛡️  {c.psychological_close}</Text>
          </View>
        )}

        {/* Footer mit Lebenslang-Hinweis */}
        <View style={styles.footer} fixed>
          <Text>WebsiteFix · {buyerEmail ?? "anonym"}</Text>
          <Text>{stripeSessionId ? `Beleg: ${stripeSessionId.slice(0, 18)}…` : ""}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Step-Block-Helper ────────────────────────────────────────────────────────
function StepBlock({
  num, step, accent, prefix, compact = false,
}: {
  num:     number;
  step:    GuideStep;
  accent:  string;
  prefix?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.step, { borderLeftColor: accent, marginBottom: compact ? 8 : 12 }]}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepNum, { backgroundColor: accent }]}>
          {prefix ? `${prefix}${num}` : num}
        </Text>
        <Text style={styles.stepTitle}>{step.title}</Text>
      </View>
      <Text style={styles.stepBody}>{step.body}</Text>
      {step.code && step.code.snippet && (
        <View style={styles.codeWrap}>
          <Text style={styles.codeLang}>{step.code.language}</Text>
          <Text style={styles.codeText}>{step.code.snippet}</Text>
        </View>
      )}
    </View>
  );
}
