/**
 * IssueActionBar — Inline-Aktionsleiste pro Befund.
 *
 * Pro-Workflow-UX (Spec §2.2): jeder Issue im Bericht bekommt zwei Buttons,
 * mit denen der User den Befund direkt in seinen Workflow exportiert,
 * statt erst manuell ins Tool zu wechseln.
 *
 * Verhalten:
 *   - Provider verbunden (status[provider] === true) → Button aktiv,
 *     Klick feuert API-Call, Button cycled durch idle → loading → success/error.
 *   - Provider NICHT verbunden → dezenter Empty-State-Link "Provider verbinden →"
 *     mit Deep-Link in den Settings-Hub (?open=<provider>#integrationen).
 *
 * Branding:
 *   - Buttons nutzen var(--agency-accent) für Active/Success-State, fallen
 *     in single-layout (kein CSS-Var) auf den Default-Emerald (#10B981) zurück.
 *     Damit fügen sie sich in Agency-Branding ein UND sehen für Pro-User
 *     im Dark-Layout konsistent aus.
 */

"use client";

import { useState } from "react";
import Link from "next/link";

export type IssueForAction = {
  severity: "red" | "yellow" | "green";
  title:    string;
  body:     string;
  count?:   number;
};

type ProviderStatus = {
  asana: boolean;
  slack: boolean;
};

type Props = {
  issue:     IssueForAction;
  status:    ProviderStatus;
  scanUrl:   string;
  scanId?:   string | null;
};

type ActionState = "idle" | "loading" | "success" | "error";

const SETTINGS_HREF: Record<keyof ProviderStatus, string> = {
  asana: "/dashboard/settings?open=asana#integrationen",
  slack: "/dashboard/settings?open=slack#integrationen",
};

export default function IssueActionBar({ issue, status, scanUrl, scanId }: Props) {
  return (
    <div
      role="group"
      aria-label="Issue-Aktionen"
      style={{
        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
        marginTop: 10, paddingTop: 10,
        borderTop: "1px dashed rgba(255,255,255,0.06)",
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>
        Exportieren →
      </span>

      <ActionButton
        provider="asana"
        connected={status.asana}
        issue={issue}
        scanUrl={scanUrl}
        scanId={scanId}
        label="Asana"
        icon={<AsanaGlyph />}
      />
      <ActionButton
        provider="slack"
        connected={status.slack}
        issue={issue}
        scanUrl={scanUrl}
        scanId={scanId}
        label="Slack"
        icon={<SlackGlyph />}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────

function ActionButton({
  provider, connected, issue, scanUrl, scanId, label, icon,
}: {
  provider: keyof ProviderStatus;
  connected: boolean;
  issue:   IssueForAction;
  scanUrl: string;
  scanId?: string | null;
  label:   string;
  icon:    React.ReactNode;
}) {
  const [state,    setState]    = useState<ActionState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Empty-State: nicht verbunden → Deep-Link in den Settings-Hub.
  // Dezenter ghost-style Link, KEIN Button — visuelles Signal für "noch
  // einrichten" statt "Aktion bereit".
  if (!connected) {
    return (
      <Link
        href={SETTINGS_HREF[provider]}
        title={`${label} verbinden, dann Issues mit einem Klick exportieren.`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 7,
          background: "transparent",
          border: "1px dashed rgba(255,255,255,0.14)",
          color: "rgba(255,255,255,0.42)",
          fontSize: 11.5, fontWeight: 600, textDecoration: "none",
          fontFamily: "inherit",
        }}
      >
        {icon}
        {label} verbinden →
      </Link>
    );
  }

  // Connected-State: Button mit Cycle idle → loading → success → idle (3s).
  async function fire() {
    if (state === "loading") return;
    setState("loading");
    setErrorMsg(null);
    try {
      const res = provider === "asana"
        ? await fetch("/api/integrations/export-task", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title:       issue.title,
              description: issue.body,
              priority:    issue.severity,
              url:         scanUrl,
              scanId:      scanId ?? undefined,
              source:      "manual",
              meta:        issue.count != null ? { count: issue.count } : undefined,
              preferred:   "asana",
            }),
          })
        : await fetch("/api/integrations/issue-to-slack", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title:    issue.title,
              body:     issue.body,
              severity: issue.severity,
              count:    issue.count ?? null,
              scanUrl,
              scanId:   scanId ?? null,
            }),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        const msg = data?.error ?? `Fehler ${res.status}`;
        setState("error");
        setErrorMsg(msg);
        // Error-State 4s sichtbar lassen, dann zurück auf idle
        window.setTimeout(() => { setState("idle"); setErrorMsg(null); }, 4000);
        return;
      }
      setState("success");
      window.setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Netzwerkfehler");
      window.setTimeout(() => { setState("idle"); setErrorMsg(null); }, 4000);
    }
  }

  // Branding-aware Style: Success → var(--agency-accent), Idle → neutraler
  // Pro-Emerald-Hint. Damit greift der CSS-Variable-Override im Agency-Layout
  // automatisch, ohne dass die Component etwas vom Plan wissen muss.
  const bg = state === "success" ? "var(--agency-accent, #10B981)"  // success: full brand
           : state === "error"   ? "rgba(248,113,113,0.12)"
           :                       "var(--agency-accent-bg, rgba(16,185,129,0.08))";
  const border = state === "success" ? "var(--agency-accent, #10B981)"
               : state === "error"   ? "rgba(248,113,113,0.32)"
               :                       "var(--agency-accent-border, rgba(16,185,129,0.28))";
  const fg = state === "success" ? "#fff"
           : state === "error"   ? "#f87171"
           :                       "var(--agency-accent, #10B981)";

  const labelText = state === "loading" ? `Sende an ${label}…`
                  : state === "success" ? `${label} ✓`
                  : state === "error"   ? `Fehler · ${label}`
                  :                       `→ ${label}`;

  return (
    <button
      type="button"
      onClick={fire}
      disabled={state === "loading"}
      title={errorMsg ?? `Diesen Befund nach ${label} exportieren`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7,
        background: bg, border: `1px solid ${border}`, color: fg,
        fontSize: 11.5, fontWeight: 700,
        cursor: state === "loading" ? "wait" : "pointer",
        fontFamily: "inherit",
        transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
        opacity: state === "loading" ? 0.75 : 1,
      }}
    >
      {state === "loading" ? <Spinner /> : icon}
      {labelText}
    </button>
  );
}

// ── Glyphs ─────────────────────────────────────────────────────────────────────
function AsanaGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12"   cy="16.5" r="3.5" fill="currentColor"/>
      <circle cx="6.7"  cy="7.5"  r="3.5" fill="currentColor"/>
      <circle cx="17.3" cy="7.5"  r="3.5" fill="currentColor"/>
    </svg>
  );
}
function SlackGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 15a2.5 2.5 0 1 1 0-5h2.5v5H5zm3.75-2.5h2.5V18a2.5 2.5 0 1 1-5 0v-2.5h2.5zM9 5a2.5 2.5 0 1 1 5 0v2.5H9V5zm2.5 3.75H6a2.5 2.5 0 1 1 0-5h5.5v5zM19 9a2.5 2.5 0 1 1 0 5h-2.5V9H19zm-3.75 2.5h-2.5V6a2.5 2.5 0 1 1 5 0v2.5h-2.5zM15 19a2.5 2.5 0 1 1-5 0v-2.5h5V19zm-2.5-3.75H18a2.5 2.5 0 1 1 0 5h-5.5v-5z"/>
    </svg>
  );
}
function Spinner() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
      style={{ animation: "wf-spin 0.85s linear infinite" }}>
      <path d="M12 2a10 10 0 0 1 10 10" />
      <style>{`@keyframes wf-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
