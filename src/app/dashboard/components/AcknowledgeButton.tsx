"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * AcknowledgeButton — schließt einen Live-Monitor-Alarm.
 *
 * Kleiner ✓-Button rechts in jedem Alarm-Item. Klick → POST
 * /api/alerts/acknowledge → router.refresh() lädt die Mission Control
 * mit gefiltertem website_alerts-Set neu (acknowledged_at IS NULL).
 *
 * stopPropagation + preventDefault, weil der Item-Wrapper ein <Link> ist
 * — sonst würde der Klick zusätzlich zur Drill-Down-Page navigieren.
 */
export default function AcknowledgeButton({
  alertId,
  size = 22,
}: {
  alertId: number | string;
  size?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/alerts/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId }),
      });
      if (res.ok) {
        // Server-Component-Refresh lädt website_alerts neu — der
        // bestätigte Alarm verschwindet aus dem Live-Monitor.
        startTransition(() => router.refresh());
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title="Alarm bestätigen (aus Live-Monitor entfernen)"
      aria-label="Alarm bestätigen"
      style={{
        flexShrink: 0,
        width: size, height: size, borderRadius: 6, padding: 0,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.55)",
        cursor: busy ? "wait" : "pointer",
        opacity: busy ? 0.5 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
      }}
      className="agency-ack-btn"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </button>
  );
}
