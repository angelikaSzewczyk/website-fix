/**
 * ScoreHistoryChart — Phase-2 Shared-Component.
 *
 * Dünner Re-Export von HistoryChart aus app/dashboard/components/.
 * Pro+ und Agency-Variants konsumieren das hier — Starter rendert
 * das Chart in der aktuellen Phase (Pricing-Modell) gar nicht.
 *
 * Sinn der Indirektion: alle Phase-2-Shared-Components leben unter
 * variants/_shared/. Wenn HistoryChart später erweitert wird (Trend-
 * Indicator, Score-Pro-Kategorie etc.), passiert das in diesem
 * Wrapper, ohne den Original-Import-Pfad zu brechen.
 */

import HistoryChart from "@/app/dashboard/components/history-chart";

type ScanBrief = {
  id:          string;
  created_at:  string;
  issue_count: number | null;
};

export default function ScoreHistoryChart({ scans }: { scans: ScanBrief[] }) {
  return <HistoryChart scans={scans} />;
}
