/**
 * ScoreRingSection — Phase-2 Shared-Component.
 *
 * Rendert die 4 Performance/SEO/BP/A11y-Score-Rings + Detail-Slider
 * (Top-N Deductions je Kategorie). Implementierung delegiert an die
 * IssueList-Komponente, die in Phase-2-Iter-1 schon den Score-Ring-
 * Render-Block kapselt — wir setzen `hideIssueGroups` und reuse die
 * komplette Berechnungs-/Render-Pipeline.
 *
 * Architektur-Hinweis: Phase-3 könnte den Score-Ring-Block sauber aus
 * IssueList in dieses File verschieben (mit Helpers in dashboard-scores.ts).
 * Solange IssueList die Single-Source-of-Truth für die Deduction-Logik
 * ist, vermeiden wir Duplizierung — beide Komponenten liefern garantiert
 * identische Scores.
 *
 * Variants verwenden:
 *   <MetricPillBar size="lg" ... />
 *   <ScoreRingSection {...issueListProps} />
 *   <IssueList {...issueListProps} hideScoreRings lockExpertFix={...} />
 */

import IssueList, { type IssueProp, type IssueActionStatus } from "./IssueList";
import type { BuilderName } from "@/lib/expert-guidance";

type Props = {
  issues:        IssueProp[];
  redCount:      number;
  yellowCount:   number;
  speedScore:    number;
  plan:          string;
  lastScan:      boolean;
  focusMode?:    boolean;
  scanId?:       string;
  isWooCommerce?: boolean;
  builderName?:   string | null;
  builderForGuidance?: BuilderName;
  integrationsStatus?: IssueActionStatus | null;
  scanUrl?:      string;
};

export default function ScoreRingSection(props: Props) {
  // hideIssueGroups=true → IssueList rendert nur Score-Card + Exec-Summary,
  // keine rote/gelbe Aufgaben-Liste, keinen Focus-Mode-Back-Button.
  return <IssueList {...props} hideIssueGroups />;
}
