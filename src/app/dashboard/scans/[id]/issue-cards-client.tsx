"use client";

import { useState, useRef, useEffect } from "react";
import { CopyCodeButton, ResolvedButton } from "./issue-actions";

const C = {
  card:        "#FFFFFF",
  border:      "#E2E8F0",
  divider:     "#F1F5F9",
  shadow:      "0 1px 4px rgba(0,0,0,0.07)",
  text:        "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  blue:        "#2563EB",
  blueBg:      "#EFF6FF",
  blueBorder:  "#BFDBFE",
  green:       "#16A34A",
  greenBg:     "#F0FDF4",
  greenBorder: "#A7F3D0",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  amberBorder: "#FDE68A",
  red:         "#DC2626",
  redBg:       "#FEF2F2",
  redBorder:   "#FCA5A5",
  violet:      "#7C3AED",
  violetBg:    "#F5F3FF",
  violetBorder:"#DDD6FE",
};

export type IssueBlock = {
  severity: "red" | "yellow" | "green";
  emoji: string;
  title: string;
  body: string[];
  steps: string[];
};

// ─── Send to dropdown ──────────────────────────────────────────────────────────
const TOOLS = [
  { id: "jira",   label: "Jira",   board: "WebsiteFix-Backlog", color: "#0052CC", bg: "#E8F0FB" },
  { id: "trello", label: "Trello", board: "Web-Pflege",          color: "#0079BF", bg: "#E4F0F6" },
  { id: "asana",  label: "Asana",  board: "Website-Tasks",       color: "#F06A6A", bg: "#FEF0F0" },
];

function ToolIcon({ id, color, size = 12 }: { id: string; color: string; size?: number }) {
  if (id === "jira") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.757a5.215 5.215 0 0 0 5.214 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.762a1.001 1.001 0 0 0-1.021-1.005zM23.013 0H11.459a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24.019 12.49V1.005A1.001 1.001 0 0 0 23.013 0z"/>
    </svg>
  );
  if (id === "trello") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.645-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-6c0 .794-.645 1.44-1.44 1.44H15c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.62z"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm-3.5 14.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm7 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm-3.5-7a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>
    </svg>
  );
}

function SendToDropdown({ title, description }: { title: string; description: string }) {
  const [open, setOpen]     = useState(false);
  const [sent, setSent]     = useState<{ label: string; board: string } | null>(null);
  const ref                 = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (sent) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7,
        background: C.greenBg, border: `1px solid ${C.greenBorder}`,
        color: C.green, fontSize: 12, fontWeight: 600,
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Karte in {sent.label}-Board [{sent.board}] erstellt
      </span>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 7,
          border: `1px solid ${C.border}`, background: "#fff",
          color: C.textSub, fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        Senden an
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          overflow: "hidden", minWidth: 190,
        }}>
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                setOpen(false);
                setSent({ label: tool.label, board: tool.board });
                setTimeout(() => setSent(null), 4000);
              }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", border: "none", background: "transparent",
                color: C.text, fontSize: 13, fontWeight: 500, cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.divider)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                background: tool.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ToolIcon id={tool.id} color={tool.color} />
              </div>
              <span>{tool.label}</span>
              <span style={{ fontSize: 11, color: C.textMuted, marginLeft: "auto" }}>{tool.board}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AutoFixButton() {
  const [state, setState] = useState<"idle" | "tooltip" | "clicked">("idle");

  if (state === "clicked") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7,
        background: C.violetBg, border: `1px solid ${C.violetBorder}`,
        color: C.violet, fontSize: 12, fontWeight: 600,
      }}>
        Plugin nicht installiert — kommt bald ✨
      </span>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setState("clicked")}
        onMouseEnter={() => setState("tooltip")}
        onMouseLeave={() => setState("idle")}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 7,
          border: `1px solid ${C.violetBorder}`,
          background: C.violetBg,
          color: C.violet, fontSize: 12, fontWeight: 600, cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Auto-Fix (via Plugin)
      </button>

      {state === "tooltip" && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: C.text, color: "#fff",
          padding: "6px 10px", borderRadius: 7,
          fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 40,
          pointerEvents: "none",
        }}>
          WordPress / Webflow Plugin — in Kürze verfügbar
          <div style={{
            position: "absolute", top: "100%", left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `5px solid ${C.text}`,
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Issue card ────────────────────────────────────────────────────────────────
function IssueCard({ issue }: { issue: IssueBlock }) {
  const [open, setOpen] = useState(false);
  const isRed    = issue.severity === "red";
  const isYellow = issue.severity === "yellow";

  const stripeColor   = isRed ? C.red    : isYellow ? C.amber    : C.green;
  const badgeColor    = isRed ? C.red    : isYellow ? C.amber    : C.green;
  const badgeBg       = isRed ? C.redBg  : isYellow ? C.amberBg  : C.greenBg;
  const badgeBorder   = isRed ? C.redBorder : isYellow ? C.amberBorder : C.greenBorder;
  const priorityLabel = isRed ? "Kritisch" : isYellow ? "Warnung" : "OK";

  const codeContent = issue.steps.join("\n");
  const descText    = issue.body.join(" ");

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      boxShadow: C.shadow,
      overflow: "hidden",
    }}>
      {/* Color stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${stripeColor}, ${stripeColor}66)` }} />

      <div style={{ padding: "20px 24px" }}>
        {/* Clickable header — toggles accordion */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: 12, padding: 0, textAlign: "left",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
                background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`,
                letterSpacing: "0.04em",
              }}>
                {issue.emoji} {priorityLabel}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.35, letterSpacing: "-0.01em" }}>
              {issue.title}
            </h3>
          </div>
          {/* Chevron */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: C.textMuted, marginTop: 2,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>

        {/* Description — always visible */}
        {descText && (
          <p style={{ margin: "10px 0 0", fontSize: 14, color: C.textSub, lineHeight: 1.75 }}>
            {descText}
          </p>
        )}

        {/* Accordion: AI Fix + Actions */}
        {open && (
          <div style={{ marginTop: 16 }}>
            {/* AI Fix block */}
            {codeContent && (
              <div style={{
                background: C.blueBg,
                border: `1px solid ${C.blueBorder}`,
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      KI-Diagnose & Lösung
                    </span>
                  </div>
                  <CopyCodeButton code={codeContent} />
                </div>
                {/* Dark code block */}
                <div style={{ background: "#0F172A", borderRadius: 8, padding: "14px 16px", overflow: "auto" }}>
                  <pre style={{
                    margin: 0, fontSize: 12, lineHeight: 1.7, color: "#e2e8f0",
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {codeContent}
                  </pre>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <SendToDropdown title={issue.title} description={descText} />
              <AutoFixButton />
              <ResolvedButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IssueCardsClient({ issues }: { issues: IssueBlock[] }) {
  const red    = issues.filter(i => i.severity === "red").length;
  const yellow = issues.filter(i => i.severity === "yellow").length;
  const green  = issues.filter(i => i.severity === "green").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Summary row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {issues.length} Befund{issues.length !== 1 ? "e" : ""}
        </span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <div style={{ display: "flex", gap: 8 }}>
          {red    > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10, background: C.redBg,   color: C.red   }}>🔴 {red}</span>}
          {yellow > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10, background: C.amberBg, color: C.amber }}>🟡 {yellow}</span>}
          {green  > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10, background: C.greenBg, color: C.green }}>🟢 {green}</span>}
        </div>
        <span style={{ fontSize: 11, color: C.textMuted }}>Klicken zum Aufklappen</span>
      </div>

      {issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
    </div>
  );
}
