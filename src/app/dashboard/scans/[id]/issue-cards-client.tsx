"use client";

import { useState } from "react";
import { CopyCodeButton, JiraExportButton, ResolvedButton } from "./issue-actions";

const C = {
  card:       "#FFFFFF",
  border:     "#E2E8F0",
  divider:    "#F1F5F9",
  shadow:     "0 1px 4px rgba(0,0,0,0.07)",
  text:       "#0F172A",
  textSub:    "#475569",
  textMuted:  "#94A3B8",
  blue:       "#2563EB",
  blueBg:     "#EFF6FF",
  blueBorder: "#BFDBFE",
  green:      "#16A34A",
  greenBg:    "#F0FDF4",
  amber:      "#D97706",
  amberBg:    "#FFFBEB",
  amberBorder:"#FDE68A",
  red:        "#DC2626",
  redBg:      "#FEF2F2",
  redBorder:  "#FCA5A5",
};

export type IssueBlock = {
  severity: "red" | "yellow" | "green";
  emoji: string;
  title: string;
  body: string[];
  steps: string[];
};

function IssueCard({ issue }: { issue: IssueBlock }) {
  const [open, setOpen] = useState(false);
  const isRed    = issue.severity === "red";
  const isYellow = issue.severity === "yellow";

  const stripeColor  = isRed ? C.red    : isYellow ? C.amber    : C.green;
  const badgeColor   = isRed ? C.red    : isYellow ? C.amber    : C.green;
  const badgeBg      = isRed ? C.redBg  : isYellow ? C.amberBg  : C.greenBg;
  const badgeBorder  = isRed ? C.redBorder : isYellow ? C.amberBorder : "#A7F3D0";
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
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <JiraExportButton title={issue.title} description={descText} />
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
          {red    > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10, background: C.redBg,  color: C.red   }}>🔴 {red}</span>}
          {yellow > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10, background: C.amberBg, color: C.amber }}>🟡 {yellow}</span>}
          {green  > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 10, background: C.greenBg, color: C.green }}>🟢 {green}</span>}
        </div>
        <span style={{ fontSize: 11, color: C.textMuted }}>Klicken zum Aufklappen</span>
      </div>

      {issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
    </div>
  );
}
