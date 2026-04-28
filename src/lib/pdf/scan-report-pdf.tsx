/**
 * Scan-Report-PDF — Executive Summary für Agentur- und Pro-Kunden.
 *
 * Server-only React-Komponente — wird per `renderToBuffer` aus der
 * /api/export/pdf-Route in einen PDF-Buffer übersetzt. Keine Hooks,
 * kein State, keine Browser-APIs.
 *
 * White-Label: Wenn `agency` übergeben wird, ersetzt das Agentur-Logo +
 * Primärfarbe das WebsiteFix-Branding. Initial nicht aktiv — der
 * Route-Handler übergibt aktuell nur Defaults; die Verdrahtung mit
 * /api/agency-settings folgt in einem Folge-Commit.
 */

import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { CATEGORY_META, DISPLAY_CATEGORIES, type DisplayCategory } from "@/lib/issue-categories";

// ─── Domain-Modell (was die Route übergibt) ─────────────────────────────────
export type PdfScanIssue = {
  severity: "red" | "yellow" | "green";
  title:    string;
  body?:    string;
  category: "recht" | "speed" | "technik" | "shop" | "builder";
  count:    number;
};

export type PdfAgencyBranding = {
  name?:         string;
  /** Absolute https-URL zum Logo. Muss extern erreichbar sein (PDF-Renderer fetcht). */
  logoUrl?:      string;
  primaryColor?: string;
};

export type ScanReportPdfProps = {
  url:          string;
  scannedAt:    string;          // ISO date string
  speedScore:   number;          // 0-100
  issueCount:   number;
  totalPages:   number | null;
  /** TTFB in ms — null wenn vor TTFB-Feature gemessen */
  ttfbMs:       number | null;
  /** "6.5" / "6.7.1" — null wenn aus dem Generator-Tag nicht extrahierbar */
  wpVersion:    string | null;
  topIssues:    PdfScanIssue[];  // bereits sortiert + auf 5 gekappt
  /** Phase-3: 4 Display-Kategorie-Scores (0-100 je Bucket). */
  categoryScores?: Record<DisplayCategory, number>;
  /** Anzahl Issues je Kategorie — für die Kategorie-Übersicht. */
  categoryIssueCounts?: Record<DisplayCategory, number>;
  agency?:      PdfAgencyBranding;
};

// ─── Design-Tokens (print-friendly, nicht das dunkle Dashboard) ─────────────
const TOKENS = {
  primary:   "#007BFF",
  text:      "#0F172A",
  textSub:   "#475569",
  textMuted: "#94A3B8",
  border:    "#E2E8F0",
  divider:   "#F1F5F9",
  bg:        "#F8FAFC",
  red:       "#DC2626",
  amber:     "#D97706",
  green:     "#16A34A",
} as const;

// ─── Stylesheets (bleiben in einer Konstante — react-pdf hat keine className-API) ─
const styles = StyleSheet.create({
  page: {
    paddingTop:    36,
    paddingBottom: 48,
    paddingLeft:   42,
    paddingRight:  42,
    fontSize:      10,
    color:         TOKENS.text,
    fontFamily:    "Helvetica",
    backgroundColor: "#FFFFFF",
  },

  // Header
  header:         { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, paddingBottom: 14, borderBottom: `1pt solid ${TOKENS.border}` },
  brand:          { flexDirection: "row", alignItems: "center", gap: 8 },
  brandLogo:      { width: 24, height: 24, objectFit: "contain" },
  brandName:      { fontSize: 13, fontWeight: 700, color: TOKENS.text },
  brandAccent:    { fontWeight: 800 },
  reportLabel:    { fontSize: 8, color: TOKENS.textMuted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 },
  reportDate:     { fontSize: 9, color: TOKENS.textSub },

  // Title
  titleBlock:     { marginBottom: 22 },
  pageTitle:      { fontSize: 22, fontWeight: 700, marginBottom: 4, color: TOKENS.text, letterSpacing: -0.4 },
  pageSubtitle:   { fontSize: 11, color: TOKENS.textSub },

  // Score block
  scoreCard:      { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 6, backgroundColor: TOKENS.bg, border: `1pt solid ${TOKENS.border}`, marginBottom: 18 },
  scoreNumberWrap:{ flexDirection: "row", alignItems: "baseline", marginRight: 18 },
  scoreNumber:    { fontSize: 42, fontWeight: 800, letterSpacing: -1.5 },
  scoreOutOf:     { fontSize: 14, color: TOKENS.textMuted, marginLeft: 4, fontWeight: 600 },
  scoreText:      { flex: 1 },
  scoreTitle:     { fontSize: 12, fontWeight: 700, marginBottom: 2 },
  scoreSub:       { fontSize: 9, color: TOKENS.textSub, lineHeight: 1.5 },

  // Metrics grid
  metricsGrid:    { flexDirection: "row", flexWrap: "wrap", marginBottom: 22, gap: 8 },
  metricCard:     { flexBasis: "48%", padding: 12, borderRadius: 5, border: `1pt solid ${TOKENS.border}`, backgroundColor: "#FFFFFF" },
  metricLabel:    { fontSize: 8, color: TOKENS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 4 },
  metricValue:    { fontSize: 16, fontWeight: 700, color: TOKENS.text },
  metricUnit:     { fontSize: 9, fontWeight: 500, color: TOKENS.textSub, marginLeft: 3 },

  // Section heading
  sectionTitle:   { fontSize: 13, fontWeight: 700, color: TOKENS.text, marginBottom: 10, paddingBottom: 6, borderBottom: `1pt solid ${TOKENS.border}` },

  // Category overview (4 mini-cards)
  catGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 22 },
  catCard:        { flexBasis: "23%", flexGrow: 1, padding: "10pt 12pt", borderRadius: 5, border: `1pt solid ${TOKENS.border}`, backgroundColor: "#FFFFFF" },
  catLabel:       { fontSize: 8, color: TOKENS.textMuted, textTransform: "uppercase", letterSpacing: 0.7, fontWeight: 700, marginBottom: 5 },
  catScoreRow:    { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
  catScore:       { fontSize: 18, fontWeight: 800 },
  catScoreUnit:   { fontSize: 9, color: TOKENS.textMuted, marginLeft: 3, fontWeight: 600 },
  catBar:         { height: 3, borderRadius: 2, backgroundColor: TOKENS.divider, marginBottom: 4, overflow: "hidden" },
  catMeta:        { fontSize: 8, color: TOKENS.textSub },

  // Quality badge (next to KPI)
  qualityBadge:   { fontSize: 7, fontWeight: 800, padding: "2pt 5pt", borderRadius: 3, marginLeft: 5, textTransform: "uppercase", letterSpacing: 0.4 },

  // Issue rows
  issueRow:       { flexDirection: "row", alignItems: "flex-start", paddingVertical: 9, paddingHorizontal: 4, borderBottom: `0.5pt solid ${TOKENS.divider}` },
  severityDot:    { width: 6, height: 6, borderRadius: 3, marginTop: 5, marginRight: 9, flexShrink: 0 },
  issueBody:      { flex: 1 },
  issueTitle:     { fontSize: 10, fontWeight: 600, color: TOKENS.text, marginBottom: 2 },
  issueMeta:      { fontSize: 8, color: TOKENS.textMuted },
  issueCount:     { fontSize: 9, fontWeight: 700, color: TOKENS.textSub, marginLeft: 8, flexShrink: 0 },

  // Footer
  footer:         { position: "absolute", bottom: 24, left: 42, right: 42, flexDirection: "row", justifyContent: "space-between", paddingTop: 10, borderTop: `0.5pt solid ${TOKENS.divider}` },
  footerText:     { fontSize: 8, color: TOKENS.textMuted },
});

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

function scoreColor(score: number): string {
  if (score >= 80) return TOKENS.green;
  if (score >= 50) return TOKENS.amber;
  return TOKENS.red;
}

function scoreVerdict(score: number): { title: string; sub: string } {
  if (score >= 80) return { title: "Solide Basis",      sub: "Die Website performt überdurchschnittlich. Feinjustierung statt Überarbeitung." };
  if (score >= 50) return { title: "Optimierungspotenzial", sub: "Mehrere Sichtbarkeits-Hebel sind nicht ausgeschöpft. Lösbar in 3–5 Tagen." };
  return                 { title: "Akuter Handlungsbedarf", sub: "Mehrere kritische Findings — vor allem bei Sichtbarkeit und Konversion." };
}

function severityHex(sev: "red" | "yellow" | "green"): string {
  if (sev === "red")    return TOKENS.red;
  if (sev === "yellow") return TOKENS.amber;
  return TOKENS.green;
}

function categoryLabel(cat: PdfScanIssue["category"]): string {
  // Phase-3-Begriffe — Datenkategorie 'recht' fasst Compliance + A11y zusammen,
  // im PDF-Display als "Barrierefreiheit" gelabelt (synchron mit Dashboard).
  if (cat === "recht")   return "Barrierefreiheit";
  if (cat === "speed")   return "Performance";
  if (cat === "shop")    return "Shop";
  if (cat === "builder") return "Page-Builder";
  return "Technik";
}

function ttfbDisplay(ttfbMs: number | null): { value: string; color: string; badge: string | null; badgeColor: string; badgeBg: string } {
  if (ttfbMs === null) {
    return { value: "—", color: TOKENS.textMuted, badge: null, badgeColor: TOKENS.textMuted, badgeBg: TOKENS.divider };
  }
  if (ttfbMs < 200) {
    return { value: `${ttfbMs} ms`, color: TOKENS.green, badge: "Schnell", badgeColor: TOKENS.green, badgeBg: "#DCFCE7" };
  }
  if (ttfbMs < 600) {
    return { value: `${ttfbMs} ms`, color: TOKENS.amber, badge: "OK", badgeColor: TOKENS.amber, badgeBg: "#FEF3C7" };
  }
  return { value: `${ttfbMs} ms`, color: TOKENS.red, badge: "Langsam", badgeColor: TOKENS.red, badgeBg: "#FEE2E2" };
}

/** "6.7" → aktuell, "6.5" / "6.6" → Update verfügbar, < 6.5 → veraltet. */
function wpVersionBadge(wpVersion: string | null): { badge: string; color: string; bg: string } | null {
  if (!wpVersion) return null;
  const [majStr, minStr] = wpVersion.split(".");
  const maj = parseInt(majStr ?? "", 10);
  const min = parseInt(minStr ?? "0", 10);
  if (Number.isNaN(maj)) return null;
  // Aktuell: 6.7+
  if (maj > 6 || (maj === 6 && min >= 7)) return { badge: "Aktuell", color: TOKENS.green, bg: "#DCFCE7" };
  // Update verfügbar: 6.5/6.6
  if (maj === 6 && min >= 5) return { badge: "Update verfügbar", color: TOKENS.amber, bg: "#FEF3C7" };
  // Veraltet: < 6.5
  return { badge: "Veraltet", color: TOKENS.red, bg: "#FEE2E2" };
}

// ─── Document ───────────────────────────────────────────────────────────────
export function ScanReportPdf({
  url, scannedAt, speedScore, issueCount, totalPages, ttfbMs, wpVersion, topIssues,
  categoryScores, categoryIssueCounts, agency,
}: ScanReportPdfProps) {
  const accent     = agency?.primaryColor ?? TOKENS.primary;
  const brandName  = agency?.name ?? "WebsiteFix";
  const brandLogo  = agency?.logoUrl;
  const verdict    = scoreVerdict(speedScore);
  const ttfb       = ttfbDisplay(ttfbMs);
  const sColor     = scoreColor(speedScore);
  const wpBadge    = wpVersionBadge(wpVersion);

  return (
    <Document title={`Website-Audit ${url}`} author="WebsiteFix" creator="WebsiteFix Scanner">
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.brand}>
            {brandLogo && <Image src={brandLogo} style={styles.brandLogo} />}
            <Text style={styles.brandName}>
              {brandName === "WebsiteFix" ? (
                <>Website<Text style={[styles.brandAccent, { color: accent }]}>Fix</Text></>
              ) : brandName}
            </Text>
          </View>
          <View>
            <Text style={styles.reportLabel}>Executive Summary</Text>
            <Text style={styles.reportDate}>{formatDate(scannedAt)}</Text>
          </View>
        </View>

        {/* ── Title ── */}
        <View style={styles.titleBlock}>
          <Text style={styles.pageTitle}>Website-Audit</Text>
          <Text style={styles.pageSubtitle}>{url}</Text>
        </View>

        {/* ── Score Block ── */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreNumberWrap}>
            <Text style={[styles.scoreNumber, { color: sColor }]}>{speedScore}</Text>
            <Text style={styles.scoreOutOf}>/ 100</Text>
          </View>
          <View style={styles.scoreText}>
            <Text style={styles.scoreTitle}>{verdict.title}</Text>
            <Text style={styles.scoreSub}>{verdict.sub}</Text>
          </View>
        </View>

        {/* ── Metrics Grid (4 KPIs) — mit Quality-Badges ── */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Server-Antwortzeit (TTFB)</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={[styles.metricValue, { color: ttfb.color }]}>{ttfb.value}</Text>
              {ttfb.badge && (
                <Text style={[styles.qualityBadge, { color: ttfb.badgeColor, backgroundColor: ttfb.badgeBg }]}>
                  {ttfb.badge}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>WordPress-Version</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={styles.metricValue}>{wpVersion ?? "Nicht erkannt"}</Text>
              {wpBadge && (
                <Text style={[styles.qualityBadge, { color: wpBadge.color, backgroundColor: wpBadge.bg }]}>
                  {wpBadge.badge}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Gescannte Seiten</Text>
            <Text style={styles.metricValue}>{totalPages ?? "—"}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Gefundene Findings</Text>
            <Text style={[styles.metricValue, { color: issueCount > 0 ? TOKENS.red : TOKENS.green }]}>{issueCount}</Text>
          </View>
        </View>

        {/* ── Phase-3: 4 Power-Kategorien-Übersicht ── */}
        {categoryScores && (
          <>
            <Text style={styles.sectionTitle}>Kategorien-Übersicht</Text>
            <View style={styles.catGrid}>
              {DISPLAY_CATEGORIES.map((cat) => {
                const score = categoryScores[cat];
                const meta  = CATEGORY_META[cat];
                const issuesInCat = categoryIssueCounts?.[cat] ?? 0;
                const sCol = scoreColor(score);
                return (
                  <View key={cat} style={styles.catCard}>
                    <Text style={styles.catLabel}>{meta.label}</Text>
                    <View style={styles.catScoreRow}>
                      <Text style={[styles.catScore, { color: sCol }]}>{score}</Text>
                      <Text style={styles.catScoreUnit}>/ 100</Text>
                    </View>
                    <View style={styles.catBar}>
                      <View style={{ height: "100%", width: `${score}%`, backgroundColor: sCol }} />
                    </View>
                    <Text style={styles.catMeta}>
                      {issuesInCat === 0 ? "Keine Findings" : `${issuesInCat} ${issuesInCat === 1 ? "Finding" : "Findings"}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Top 5 Wachstums-Bremsen ── */}
        <Text style={styles.sectionTitle}>Top 5 Wachstums-Bremsen</Text>
        {topIssues.length === 0 ? (
          <Text style={[styles.issueMeta, { paddingVertical: 12 }]}>
            Keine kritischen Wachstums-Bremsen gefunden — die Basis stimmt.
          </Text>
        ) : (
          topIssues.map((issue, i) => (
            <View key={i} style={[styles.issueRow, i === topIssues.length - 1 ? { borderBottomWidth: 0 } : {}]}>
              <View style={[styles.severityDot, { backgroundColor: severityHex(issue.severity) }]} />
              <View style={styles.issueBody}>
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueMeta}>{categoryLabel(issue.category)}</Text>
              </View>
              {issue.count > 1 && (
                <Text style={styles.issueCount}>×{issue.count}</Text>
              )}
            </View>
          ))
        )}

        {/* ── Footer (fixed bottom) ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {brandName === "WebsiteFix"
              ? "WebsiteFix · Automatisierte Website-Diagnose"
              : `${brandName} · powered by WebsiteFix`}
          </Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages: tp }) => `Seite ${pageNumber} / ${tp}`} />
        </View>
      </Page>
    </Document>
  );
}

// Suppress @react-pdf/renderer's font warning for default Helvetica usage.
// Helvetica is built-in; no external font registration needed.
Font.registerHyphenationCallback((word: string) => [word]);
