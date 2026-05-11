"use client";

/**
 * TokenGuideView — Client-Component für /g/[token].
 *
 * Read-only Public-Render des Guides. Unterscheidet sich vom Dashboard-
 * Renderer (/dashboard/guides/[id]) in folgenden Punkten:
 *
 *   - Kein "Zurück zum Dashboard" — User hat kein Konto.
 *   - Kein Server-Polling, kein Locked-Branch — Token-Validation ist
 *     bereits server-seitig erfolgt (Page liefert nur unlocked Guides).
 *   - Header: "Dein Online-Bericht — Online-Zugriff bis [date]" Hinweis.
 *   - Footer: PDF-Reminder + Soft-Upsell auf Professional (alle Guides
 *     dauerhaft + Plugin).
 *   - Checklist rendert mit lokalem useState — kein /api/guides/.../checklist
 *     Sync, weil kein userId verfügbar.
 *
 * Render-Helpers (SectionHeader, PremiumStep, ProToolItem, CodeBlock) sind
 * inline dupliziert vom Dashboard-Renderer — pre-launch akzeptabel, sauberer
 * Refactor zu shared component später.
 */

import { useState } from "react";
import Link from "next/link";
import type { RescueGuide, GuideStep } from "@/lib/rescue-guides";
import { humanize } from "@/lib/humanize";

const T = {
  text:       "rgba(255,255,255,0.92)",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.40)",
  border:     "rgba(255,255,255,0.10)",
  divider:    "rgba(255,255,255,0.06)",
  card:       "rgba(255,255,255,0.025)",
  green:      "#4ade80",
  greenBg:    "rgba(74,222,128,0.10)",
  greenBdr:   "rgba(74,222,128,0.28)",
  amber:      "#fbbf24",
  blue:       "#7aa6ff",
  purple:     "#a78bfa",
  purpleBg:   "rgba(124,58,237,0.18)",
  purpleBdr:  "rgba(124,58,237,0.40)",
};

export default function TokenGuideView({
  guide,
  hoster,
  expiresAt,
}: {
  guide:     RescueGuide;
  hoster:    string;
  expiresAt: string;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const expiresAtDate = new Date(expiresAt);
  const expiresLabel = expiresAtDate.toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const daysRemaining = Math.max(0, Math.ceil((expiresAtDate.getTime() - Date.now()) / 86400000));

  function toggleItem(itemId: string) {
    setChecked(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  const defaultSteps: GuideStep[] = guide.content_json.variants["default"]?.steps ?? [];
  const hosterVariantSteps: GuideStep[] =
    hoster !== "default" && guide.content_json.variants[hoster]?.steps
      ? guide.content_json.variants[hoster].steps
      : [];
  const checklist = guide.content_json.checklist ?? [];
  const checkedCount = checklist.filter(c => checked[c.id]).length;
  const progress = checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0;

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <style>{`
          @media (max-width: 450px) {
            .wf-default-step,
            .wf-hoster-step {
              padding: 14px 14px !important;
            }
            .wf-default-step > div,
            .wf-hoster-step > div {
              flex-direction: column !important;
              gap: 10px !important;
            }
            .wf-default-step h3,
            .wf-hoster-step h3 {
              font-size: 15px !important;
            }
            .wf-default-step p,
            .wf-hoster-step p {
              font-size: 13px !important;
            }
          }
          @media print {
            body { background: #fff !important; color: #0b0c10 !important; }
            .wf-guide-no-print { display: none !important; }
            main { padding: 0 !important; background: #fff !important; color: #0b0c10 !important; }
            * {
              color: #0b0c10 !important;
              background-color: #fff !important;
              border-color: #ccc !important;
              box-shadow: none !important;
            }
            pre, code {
              background: #f1f5f9 !important;
              color: #0f172a !important;
              border: 1px solid #cbd5e1 !important;
              page-break-inside: avoid;
            }
            h1, h2, h3 { color: #0b0c10 !important; page-break-after: avoid; }
            section, .wf-default-step, .wf-hoster-step { page-break-inside: avoid; }
          }
        `}</style>

        {/* ── Top-Bar: Brand + Print-Button (kein Dashboard-Link) ───────── */}
        <div className="wf-guide-no-print" style={{
          marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
        }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontSize: 14, fontWeight: 800, color: T.text,
            textDecoration: "none",
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: 7,
              background: "linear-gradient(135deg, #A78BFA, #FBBF24)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#0b0c10", fontSize: 13, fontWeight: 900,
            }}>W</span>
            WebsiteFix
          </Link>
          <button
            onClick={() => window.print()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12.5, fontWeight: 700, color: T.text,
              padding: "7px 16px", borderRadius: 8,
              background: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(251,191,36,0.10))",
              border: `1px solid ${T.purpleBdr}`,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Drucken / Speichern
          </button>
        </div>

        {/* ── Online-Zugriff-Banner ──────────────────────────────────────── */}
        <div className="wf-guide-no-print" style={{
          marginBottom: 22, padding: "11px 16px", borderRadius: 10,
          background: "rgba(167,139,250,0.08)",
          border: "1px solid rgba(167,139,250,0.26)",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 16 }}>⏱</span>
          <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, lineHeight: 1.55, flex: "1 1 240px" }}>
            <strong style={{ color: T.text }}>Online-Zugriff bis {expiresLabel}</strong>
            {daysRemaining > 0 && (
              <span style={{ color: T.textMuted }}> · noch {daysRemaining} {daysRemaining === 1 ? "Tag" : "Tage"}</span>
            )}
            <br/>
            <span style={{ fontSize: 11.5 }}>
              Das PDF in deinem Postfach bleibt dauerhaft nutzbar — unabhängig von dieser Online-Ansicht.
            </span>
          </p>
        </div>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: `1px solid ${T.divider}` }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Rescue-Guide
            {hoster !== "default" && <span style={{ color: T.textMuted }}> · für {hosterLabel(hoster)}</span>}
          </p>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
            {guide.title}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: T.textSub, lineHeight: 1.6 }}>
            {humanize(guide.content_json.intro)}
          </p>
        </div>

        {/* ── TL;DR ────────────────────────────────────────────────────────── */}
        {guide.content_json.tldr && (
          <div style={{
            marginBottom: 28, padding: "16px 20px", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(167,139,250,0.10), rgba(251,191,36,0.06))",
            border: `1px solid ${T.purpleBdr}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 9.5, fontWeight: 800,
                padding: "2px 10px", borderRadius: 999,
                background: "linear-gradient(135deg, rgba(167,139,250,0.20), rgba(251,191,36,0.18))",
                border: `1px solid ${T.purpleBdr}`,
                color: T.purple,
                letterSpacing: "0.10em", textTransform: "uppercase",
              }}>
                ⚡ TL;DR
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text, lineHeight: 1.6 }}>
              {humanize(guide.content_json.tldr)}
            </p>
          </div>
        )}

        {/* ── Premium 3-Säulen ──────────────────────────────────────────── */}
        {guide.content_json.pillars && (
          <>
            <SectionHeader num={1} kicker="Sofort-Fix · Band-Aid"
                           title={guide.content_json.pillars.band_aid.title} accent={T.purple} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
              {guide.content_json.pillars.band_aid.steps.map((step, i) => (
                <PremiumStep key={i} index={i + 1} step={step} accent={T.purple} />
              ))}
            </div>

            <SectionHeader num={2} kicker="Diagnose · Was wirklich passiert"
                           title={guide.content_json.pillars.diagnosis.title} accent={T.amber} />
            <div style={{
              marginBottom: 32, padding: "20px 22px", borderRadius: 12,
              background: "rgba(251,191,36,0.05)",
              border: "1px solid rgba(251,191,36,0.22)",
            }}>
              <p style={{ margin: 0, fontSize: 13.5, color: T.textSub, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {humanize(guide.content_json.pillars.diagnosis.body)}
              </p>
              {guide.content_json.pillars.diagnosis.plugin_hint && (
                <div style={{
                  marginTop: 14, padding: "12px 14px", borderRadius: 9,
                  background: "rgba(34,197,94,0.06)",
                  border: "1px dashed rgba(34,197,94,0.30)",
                }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: T.green,
                              letterSpacing: "0.10em", textTransform: "uppercase" }}>
                    🔍 Mit Plugin: 100 % statt Vermutung
                  </p>
                  <p style={{ margin: 0, fontSize: 12.5, color: T.textSub, lineHeight: 1.6 }}>
                    {humanize(guide.content_json.pillars.diagnosis.plugin_hint)}
                  </p>
                </div>
              )}
            </div>

            <SectionHeader num={3} kicker="Profi-Skripte · Senior-Dev-Toolset"
                           title={guide.content_json.pillars.pro_tools.title} accent="#22D3EE" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
              {guide.content_json.pillars.pro_tools.items.map((item, i) => (
                <ProToolItem key={i} item={item} />
              ))}
            </div>
          </>
        )}

        {/* ── Default-Steps ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: hosterVariantSteps.length > 0 ? 28 : 36 }}>
          <h2 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Anleitung — {defaultSteps.length} Schritte
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {defaultSteps.map((step, i) => (
              <div key={i} className="wf-default-step" style={{
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "20px 22px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: 9,
                    background: T.purpleBg, border: `1px solid ${T.purpleBdr}`,
                    color: T.purple,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: T.text }}>
                      {humanize(step.title)}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13.5, color: T.textSub, lineHeight: 1.65, whiteSpace: "pre-line" }}>
                      {humanize(step.body)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Hoster-Steps ───────────────────────────────────────────────── */}
        {hosterVariantSteps.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{
              padding: "14px 18px", marginBottom: 14, borderRadius: 10,
              background: T.purpleBg, border: `1px solid ${T.purpleBdr}`,
            }}>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 800, color: T.purple, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Speziell für {hosterLabel(hoster)}
              </p>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text }}>
                Klick-Pfade in deinem Hosting-Backend
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {hosterVariantSteps.map((step, i) => (
                <div key={`hv-${i}`} className="wf-hoster-step" style={{
                  background: T.card, border: `1px solid ${T.purpleBdr}`,
                  borderLeft: `3px solid ${T.purple}`,
                  borderRadius: 12, padding: "20px 22px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: 9,
                      background: T.purpleBg, border: `1px solid ${T.purpleBdr}`,
                      color: T.purple,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800,
                    }}>
                      {hosterLabel(hoster).slice(0, 1).toUpperCase()}{i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: T.text }}>
                        {humanize(step.title)}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13.5, color: T.textSub, lineHeight: 1.65, whiteSpace: "pre-line" }}>
                        {humanize(step.body)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Not-Solved ─────────────────────────────────────────────────── */}
        {guide.content_json.not_solved && (
          <div style={{
            marginBottom: 24, padding: "18px 22px", borderRadius: 12,
            background: "rgba(248,113,113,0.05)",
            border: "1px dashed rgba(248,113,113,0.32)",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: "#f87171",
                        letterSpacing: "0.10em", textTransform: "uppercase" }}>
              🪂 {humanize(guide.content_json.not_solved.title)}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.65, whiteSpace: "pre-line" }}>
              {humanize(guide.content_json.not_solved.body)}
            </p>
          </div>
        )}

        {/* ── Psychological Close ────────────────────────────────────────── */}
        {guide.content_json.psychological_close && (
          <div style={{
            marginBottom: 24, padding: "18px 22px", borderRadius: 12,
            background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(122,166,255,0.04))",
            border: "1px solid rgba(16,185,129,0.30)",
            display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center",
          }}>
            <span aria-hidden="true" style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: 10,
              background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#10b981", fontSize: 18,
            }}>🛡️</span>
            <p style={{ margin: 0, flex: "1 1 280px", fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>
              {humanize(guide.content_json.psychological_close)}
            </p>
            <Link href="/fuer-agenturen?upgrade=professional#pricing"
                  className="wf-guide-no-print"
                  style={{
                    flexShrink: 0,
                    padding: "9px 18px", borderRadius: 9,
                    background: "linear-gradient(90deg,#059669,#10B981)",
                    color: "#fff", fontSize: 12.5, fontWeight: 800,
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(16,185,129,0.32)",
                  }}>
              Professional ansehen →
            </Link>
          </div>
        )}

        {/* ── Checkliste (lokaler State) ─────────────────────────────────── */}
        {checklist.length > 0 && (
          <div style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "22px 24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Deine Fortschritts-Checkliste
              </h2>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: progress === 100 ? T.green : T.purple }}>
                {checkedCount} / {checklist.length} erledigt · {progress}%
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: T.divider, overflow: "hidden", marginBottom: 18 }}>
              <div style={{
                height: "100%", width: `${progress}%`,
                background: progress === 100 ? T.green : T.purple,
                borderRadius: 99, transition: "width 0.4s ease",
              }} />
            </div>
            <p className="wf-guide-no-print" style={{
              margin: "0 0 14px", fontSize: 11, color: T.textMuted, lineHeight: 1.55,
            }}>
              Hinweis: Der Status wird nur in deinem Browser gespeichert — bei Seitenwechsel
              startet die Liste leer.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {checklist.map(item => {
                const isChecked = !!checked[item.id];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 14px", borderRadius: 9,
                        background: isChecked ? T.greenBg : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isChecked ? T.greenBdr : T.border}`,
                        color: T.text, fontFamily: "inherit",
                        cursor: "pointer", transition: "background 0.15s ease",
                      }}
                    >
                      <span style={{
                        flexShrink: 0, width: 20, height: 20, borderRadius: 5,
                        background: isChecked ? T.green : "transparent",
                        border: `1.5px solid ${isChecked ? T.green : T.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {isChecked && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0b0c10" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </span>
                      <span style={{
                        fontSize: 13.5, fontWeight: 600,
                        textDecoration: isChecked ? "line-through" : "none",
                        opacity: isChecked ? 0.6 : 1,
                      }}>
                        {item.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* ── Footer-Reminder ────────────────────────────────────────────── */}
        <div className="wf-guide-no-print" style={{
          marginTop: 32, padding: "18px 22px", borderRadius: 12,
          background: T.card, border: `1px solid ${T.border}`,
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: T.textSub,
                      letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Tipp
          </p>
          <p style={{ margin: 0, fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>
            Speichere dir die <strong style={{ color: T.text }}>PDF-Anlage</strong> aus deinem Postfach
            — sie enthält den kompletten Guide und ist dauerhaft nutzbar, auch nach Ablauf des
            Online-Zugriffs am {expiresLabel}.
          </p>
        </div>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh", background: "#0b0c10", color: T.text,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  padding: "32px 32px 80px",
};
const containerStyle: React.CSSProperties = {
  maxWidth: 920, margin: "0 auto",
};

function hosterLabel(value: string): string {
  const map: Record<string, string> = {
    strato:    "Strato",
    ionos:     "IONOS / 1&1",
    "all-inkl": "All-Inkl",
    hostinger: "Hostinger",
    hetzner:   "Hetzner",
    default:   "anderer Hoster",
  };
  return map[value] ?? value;
}

function SectionHeader({ num, kicker, title, accent }: {
  num:    number;
  kicker: string;
  title:  string;
  accent: string;
}) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.divider}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: `${accent}1a`, border: `1px solid ${accent}55`,
          color: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800,
        }}>{num}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: accent,
                       letterSpacing: "0.10em", textTransform: "uppercase" }}>
          {kicker}
        </span>
      </div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
        {title}
      </h2>
    </div>
  );
}

function PremiumStep({ index, step, accent }: {
  index:  number;
  step:   GuideStep;
  accent: string;
}) {
  return (
    <div style={{
      padding: "18px 22px", borderRadius: 12,
      background: T.card, border: `1px solid ${T.border}`,
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          flexShrink: 0, width: 30, height: 30, borderRadius: 8,
          background: `${accent}1a`, border: `1px solid ${accent}45`,
          color: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12.5, fontWeight: 800,
        }}>{index}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 800, color: T.text }}>
            {humanize(step.title)}
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: T.textSub, lineHeight: 1.65, whiteSpace: "pre-line" }}>
            {humanize(step.body)}
          </p>
          {step.code && step.code.snippet && (
            <CodeBlock language={step.code.language} snippet={step.code.snippet} />
          )}
        </div>
      </div>
    </div>
  );
}

function CodeBlock({ language, snippet, note }: { language: string; snippet: string; note?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ position: "relative" }}>
        <pre style={{
          margin: 0, padding: "12px 14px",
          background: "rgba(0,0,0,0.40)",
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          fontSize: 12, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: "#cbd5e1", lineHeight: 1.6,
          overflowX: "auto", whiteSpace: "pre",
        }}>
          <code>{snippet}</code>
        </pre>
        <button
          onClick={copy}
          className="wf-guide-no-print"
          style={{
            position: "absolute", top: 6, right: 6,
            padding: "4px 10px", borderRadius: 6,
            background: copied ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${copied ? "rgba(34,197,94,0.40)" : T.border}`,
            color: copied ? T.green : T.textSub,
            fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          {copied ? "✓ Kopiert" : `Copy ${language}`}
        </button>
      </div>
      {note && (
        <p style={{ margin: "6px 2px 0", fontSize: 11, color: T.textMuted, lineHeight: 1.55, fontStyle: "italic" }}>
          {note}
        </p>
      )}
    </div>
  );
}

function ProToolItem({ item }: {
  item: { label: string; code: string; language: string; note?: string };
}) {
  return (
    <div style={{
      padding: "16px 20px", borderRadius: 12,
      background: "rgba(34,211,238,0.04)",
      border: "1px solid rgba(34,211,238,0.22)",
      borderLeft: "3px solid #22D3EE",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999,
          background: "rgba(34,211,238,0.12)",
          border: "1px solid rgba(34,211,238,0.30)",
          color: "#22D3EE",
          letterSpacing: "0.10em", textTransform: "uppercase",
        }}>
          {item.language}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
          {humanize(item.label)}
        </span>
      </div>
      <CodeBlock language={item.language} snippet={item.code} note={item.note} />
    </div>
  );
}
