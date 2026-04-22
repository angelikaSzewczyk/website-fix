"use client";

import Link from "next/link";
import StarterResultsPanel, { type IssueProp } from "@/app/dashboard/components/StarterResultsPanel";
import PrintButton from "./print-button";

interface Props {
  url: string;
  createdAt: string;
  plan: string;
  issues: IssueProp[];
  redCount: number;
  yellowCount: number;
  speedScore: number;
}

export default function ScanDetailClient({ url, createdAt, plan, issues, redCount, yellowCount, speedScore }: Props) {
  const date = new Date(createdAt).toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          <Link href="/dashboard/scans" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)",
            textDecoration: "none", padding: "7px 14px", borderRadius: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Zurück zur Berichte-Übersicht
          </Link>

          <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/dashboard/scan" style={{
              padding: "9px 20px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700,
              background: "#007BFF", color: "#fff", boxShadow: "0 2px 10px rgba(0,123,255,0.35)",
            }}>
              Neuer Scan →
            </Link>
            <PrintButton url={url} type="Website-Check" date={date} />
          </div>
        </div>

        {/* Scan meta */}
        <div style={{ marginBottom: 4 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Archivierter Bericht
          </p>
          <h1 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", wordBreak: "break-all" }}>
            {url}
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{date}</p>
        </div>

        {/* Results panel */}
        <StarterResultsPanel
          issues={issues}
          redCount={redCount}
          yellowCount={yellowCount}
          speedScore={speedScore}
          plan={plan}
          lastScan={true}
        />
      </div>
    </div>
  );
}
