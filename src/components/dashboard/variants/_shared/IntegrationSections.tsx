"use client";

/**
 * IntegrationSections — Phase-2-Iter-3 Shared-Sektionen.
 *
 * Drei plan-spezifische Render-Sektionen für die Variants:
 *   - WordPressPluginsBlock: Plugin-Erkennung mit Status-Indikatoren
 *   - WooCommerceSection: Shop-Performance-Audit
 *   - BuilderIntelligenceSection: Page-Builder-Analyse (Elementor/Divi/etc)
 *
 * Vorher in jedem Variant dupliziert. Single-Source jetzt hier.
 */

import { useState } from "react";
import Link from "next/link";
import { D, Card, SectionLabel, SectionHead, LockIco, hexToRgb } from "./UIHelpers";
import { getBuilderTheme } from "./builder-utils";
import type { BuilderAuditProp, WooAuditProp } from "./builder-utils";
import type { ParsedIssueProp } from "./dashboard-types";
import { isAtLeastProfessional, isPaidPlan } from "@/lib/plans";
import { CONFIDENCE_THRESHOLD } from "@/lib/tech-detector";

// ─── WordPress-Expert-Mode ────────────────────────────────────────────────────
// Starter → einfache Aufzählung | Professional/Agency → Icons + Status-Indikator
export type PluginDetected = { value: string; confidence: number; evidence: string[] };

export function WordPressPluginsBlock({ plugins, plan }: { plugins: PluginDetected[]; plan: string }) {
  const pro = isAtLeastProfessional(plan);
  const visible = plugins.filter(p => p.confidence >= CONFIDENCE_THRESHOLD);
  if (visible.length === 0) return null;

  // Status-Heuristik für Pro/Agency — mappt Plugin → Status-Hinweis
  const STATUS: Record<string, { kind: "ok" | "warn" | "action"; note: string }> = {
    "WP Rocket":        { kind: "warn",   note: "Cache aktiv — prüfe Lazy-Load & Critical CSS für +20 PageSpeed" },
    "WP Fastest Cache": { kind: "warn",   note: "Cache aktiv — Minification aktivieren für weitere Speed-Gains" },
    "W3 Total Cache":   { kind: "warn",   note: "Veraltetes Caching-Plugin — WP Rocket oder LiteSpeed empfohlen" },
    "LiteSpeed Cache":  { kind: "ok",     note: "Server-Cache aktiv — optimale Konfiguration für WordPress" },
    "Yoast SEO":        { kind: "ok",     note: "SEO-Plugin erkannt — stelle sicher, dass XML-Sitemap aktiv ist" },
    "Rank Math":        { kind: "ok",     note: "Modernes SEO-Plugin — Schema-Markup automatisch aktiv" },
    "All in One SEO":   { kind: "ok",     note: "SEO-Plugin erkannt — prüfe Meta-Descriptions auf jeder Seite" },
    "Contact Form 7":   { kind: "action", note: "Kein Honeypot-Schutz aktiv — Spam-Risiko. Plugin 'CF7 Honeypot' empfohlen" },
    "WPForms":          { kind: "ok",     note: "Form-Plugin mit integriertem Spam-Schutz" },
    "Wordfence":        { kind: "ok",     note: "Firewall aktiv — empfohlen: 2FA aktivieren, Scan-Interval auf täglich" },
    "Jetpack":          { kind: "warn",   note: "Jetpack verbraucht Ressourcen — prüfe welche Module wirklich nötig sind" },
    "Akismet":          { kind: "ok",     note: "Spam-Filter aktiv" },
    "Smush":            { kind: "ok",     note: "Bild-Optimierung aktiv" },
    "ShortPixel":       { kind: "ok",     note: "Bild-Optimierung aktiv" },
    "Borlabs Cookie":   { kind: "ok",     note: "DSGVO-konformer Cookie-Banner aktiv" },
    "Complianz GDPR":   { kind: "ok",     note: "DSGVO-Banner aktiv — automatische Cookie-Scans laufen" },
  };

  const statusColor = { ok: "#4ade80", warn: "#fbbf24", action: "#fb923c" } as const;
  const statusBg    = { ok: "rgba(74,222,128,0.08)", warn: "rgba(251,191,36,0.08)", action: "rgba(251,146,60,0.08)" } as const;
  const statusBdr   = { ok: "rgba(74,222,128,0.22)", warn: "rgba(251,191,36,0.28)", action: "rgba(251,146,60,0.28)" } as const;
  const statusLabel = { ok: "OK", warn: "Optimieren", action: "Handlungsbedarf" } as const;

  return (
    <div style={{
      marginBottom: 28, padding: "18px 20px", borderRadius: D.radiusSm,
      background: "rgba(255,255,255,0.02)", border: `1px solid ${D.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            background: "rgba(0,115,170,0.15)", border: "1px solid rgba(0,115,170,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#21759b",
          }}>W</span>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: D.text }}>
            WordPress-Plugins · {visible.length} erkannt
          </h3>
        </div>
        {!pro && (
          <Link href="/fuer-agenturen#pricing" style={{
            fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
            color: "#10B981", textDecoration: "none",
          }}>
            Plugin-Optimierung freischalten →
          </Link>
        )}
      </div>

      {!pro && (
        <>
          {/* STARTER: einfache Aufzählung */}
          <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 13, color: D.textSub, lineHeight: 1.9 }}>
            {visible.map(p => (
              <li key={p.value} style={{ color: D.textSub }}>
                <span style={{ color: D.text, fontWeight: 600 }}>{p.value}</span>
              </li>
            ))}
          </ul>
          <div style={{
            marginTop: 14, padding: "10px 12px", borderRadius: 7,
            background: "rgba(16,185,129,0.04)", border: "1px dashed rgba(16,185,129,0.22)",
            fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.55,
          }}>
            <strong style={{ color: "#10B981" }}>Professional-Feature:</strong> Sieh pro Plugin, was konkret optimiert werden muss — z.B. „WP Rocket: Lazy-Load für +20 PageSpeed aktivieren".
          </div>
        </>
      )}

      {pro && (
        <>
          {/* PRO / AGENCY: Icons + Status-Indikator */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {visible.map(p => {
              const s = STATUS[p.value] ?? { kind: "ok" as const, note: "Plugin erkannt, keine spezifischen Hinweise" };
              return (
                <div key={p.value} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 8,
                  background: statusBg[s.kind],
                  border: `1px solid ${statusBdr[s.kind]}`,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                    background: "rgba(0,115,170,0.15)", border: "1px solid rgba(0,115,170,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 800, color: "#21759b",
                  }}>
                    {p.value.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{p.value}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10,
                        background: `rgba(${hexToRgb(statusColor[s.kind])},0.12)`,
                        color: statusColor[s.kind],
                        border: `1px solid ${statusBdr[s.kind]}`,
                        letterSpacing: "0.04em",
                      }}>
                        {statusLabel[s.kind]}
                      </span>
                      <span style={{ fontSize: 10, color: D.textMuted }}>
                        Confidence {Math.round(p.confidence * 100)}%
                      </span>
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: D.textSub, lineHeight: 1.5 }}>
                      {s.note}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── WooCommerce — E-Commerce & Shop-Performance Sektion ──────────────────────
// Starter: Nur Badge + Lock-Hint. Professional/Agency: Volle Deep-Checks.

export function WooCommerceSection({ plan, shopIssues, audit }: {
  plan: string;
  shopIssues: ParsedIssueProp[];
  audit?: WooAuditProp | null;
}) {
  // Shop-Auditor ist für ALLE zahlenden Pläne offen (Starter+).
  // Pro/Agency bekommen den USP über Auto-Fix-Generator + Executive Summary.
  const pro = isPaidPlan(plan);

  // WooCommerce-Brand-Farbe (official plum) + Accent-Variations
  const WOO = {
    primary:  "#7F54B3",
    primaryBg:"rgba(127,84,179,0.10)",
    primaryBd:"rgba(127,84,179,0.32)",
    magenta:  "#C084B8",
  };

  return (
    <div style={{
      marginBottom: 28, borderRadius: D.radius, overflow: "hidden",
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${WOO.primaryBd}`,
      boxShadow: `0 0 0 1px ${WOO.primaryBg}`,
    }}>
      {/* Section-Header */}
      <div style={{
        padding: "14px 20px",
        background: `linear-gradient(90deg, ${WOO.primaryBg} 0%, transparent 100%)`,
        borderBottom: `1px solid ${WOO.primaryBd}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            background: WOO.primary, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none">
              <path d="M21 5H3a1 1 0 0 0-1 1v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a1 1 0 0 0-1-1zM4 13l1.5 7h13l1.5-7H4zm6 2h4v3h-4v-3z"/>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: D.text, letterSpacing: "-0.01em" }}>
              E-Commerce & Shop-Performance
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: D.textMuted }}>
              WooCommerce-spezifische Optimierungen
            </p>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
          background: WOO.primary, color: "#fff", letterSpacing: "0.06em",
        }}>
          {pro ? "SHOP-AUDIT AKTIV" : "SHOP ERKANNT"}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 20px" }}>
        {/* Agentur-Textbaustein — immer sichtbar */}
        <div style={{
          padding: "12px 14px", borderRadius: 8, marginBottom: pro ? 16 : 14,
          background: WOO.primaryBg,
          border: `1px solid ${WOO.primaryBd}`,
        }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>
            <strong style={{ color: WOO.magenta }}>Dieser Shop nutzt WooCommerce.</strong>{" "}
            {pro
              ? shopIssues.length > 0
                ? `Optimierungspotenzial bei der Datenbank-Struktur und am Checkout-Prozess gefunden — ${shopIssues.length} ${shopIssues.length === 1 ? "Empfehlung" : "Empfehlungen"} unten.`
                : "Der Shop läuft technisch sauber. Keine kritischen Performance- oder Security-Fragmente im HTML gefunden."
              : "Für jeden WooCommerce-Shop gibt es spezifische Performance- und Datenbank-Optimierungen. Im Professional-Plan wird dein Shop auf Cart-Fragments, Database-Bloat und Upload-Security geprüft."}
          </p>
        </div>

        {/* STARTER: Locked-Preview — zeigt WAS geprüft wird, nicht das Ergebnis */}
        {!pro && (
          <>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 14,
            }}>
              {[
                { title: "Cart-Fragments-Check",  sub: "wc-ajax=get_refreshed_fragments Ladezeit-Killer" },
                { title: "Database-Bloat-Analyse", sub: "wp_options & verwaiste Cart-Sessions" },
                { title: "Upload-Verzeichnis",     sub: "/wp-content/uploads/woocommerce_uploads Security" },
                { title: "Secure-Cookies-Audit",   sub: "PCI-DSS-Konformität am Checkout" },
              ].map(check => (
                <div key={check.title} style={{
                  padding: "10px 12px", borderRadius: 7,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.12)",
                  opacity: 0.65, position: "relative",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <LockIco size={11} color={D.textMuted} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{check.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: D.textMuted, lineHeight: 1.45 }}>{check.sub}</p>
                </div>
              ))}
            </div>
            <div style={{
              padding: "14px 16px", borderRadius: 8,
              background: "linear-gradient(90deg, rgba(16,185,129,0.08), rgba(251,191,36,0.05))",
              border: "1px solid rgba(16,185,129,0.25)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ flex: "1 1 auto", minWidth: 200 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#10B981" }}>
                  Shop-Audit im Professional-Plan
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                  Konkrete Handlungsempfehlungen für Cart-Performance, DB-Bloat und Checkout-Security — ab 89 €/Monat.
                </p>
              </div>
              <Link href="/fuer-agenturen#pricing" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 8,
                background: "linear-gradient(90deg, #059669, #10B981)",
                color: "#fff", fontSize: 12, fontWeight: 700,
                textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 3px 10px rgba(16,185,129,0.28)",
              }}>
                Shop-Audit freischalten →
              </Link>
            </div>
          </>
        )}

        {/* PROFESSIONAL / AGENCY: Deep-Checks mit konkreten Befunden */}
        {pro && (
          <>
            {/* ═══ E-COMMERCE BUSINESS AUDITOR ═══════════════════════════════ */}
            {audit && (
              <div style={{ marginBottom: 16 }}>
                {/* Sub-Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20,
                    background: "linear-gradient(90deg, rgba(16,185,129,0.15), rgba(251,191,36,0.1))",
                    color: "#10B981", border: "1px solid rgba(16,185,129,0.3)", letterSpacing: "0.08em",
                  }}>
                    BUSINESS AUDITOR
                  </span>
                  <span style={{ fontSize: 10, color: D.textMuted, letterSpacing: "0.04em" }}>
                    Revenue-Impact & UX-Performance
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                  {/* ── Revenue-at-Risk ──────────────────────────────────────── */}
                  {(() => {
                    const risk = audit.revenueRiskPct;
                    const riskColor = risk >= 25 ? "#f87171" : risk >= 15 ? "#fbbf24" : risk > 0 ? "#fbbf24" : "#4ade80";
                    const riskBg    = risk >= 25 ? "rgba(239,68,68,0.08)" : risk >= 15 ? "rgba(251,191,36,0.08)" : risk > 0 ? "rgba(251,191,36,0.05)" : "rgba(74,222,128,0.08)";
                    const riskBd    = risk >= 25 ? "rgba(239,68,68,0.25)" : risk >= 15 ? "rgba(251,191,36,0.28)" : risk > 0 ? "rgba(251,191,36,0.22)" : "rgba(74,222,128,0.22)";
                    const verdict =
                      risk >= 25 ? "Kritischer Conversion-Verlust"
                      : risk >= 15 ? "Messbarer Umsatzverlust"
                      : risk >= 5 ? "Leichte Bremse"
                      : "Shop läuft optimal";
                    return (
                      <div style={{
                        padding: "14px 16px", borderRadius: 10,
                        background: riskBg, border: `1px solid ${riskBd}`,
                      }}>
                        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: D.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          Revenue-at-Risk
                        </p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 28, fontWeight: 900, color: riskColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                            {risk}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: riskColor }}>%</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11.5, color: D.textSub, lineHeight: 1.5 }}>
                          {risk > 0
                            ? `Bei dieser Ladezeit riskieren Sie ${risk} % Ihrer Conversion-Rate. ${verdict}.`
                            : verdict}
                        </p>
                      </div>
                    );
                  })()}

                  {/* ── UX Quick-Check: Add-to-Cart Buttons ───────────────────── */}
                  {(() => {
                    const n       = audit.addToCartButtons;
                    const blocked = audit.cartButtonsBlocked;
                    const okColor = n === 0 ? "#94a3b8" : blocked ? "#fbbf24" : "#4ade80";
                    const okBg    = n === 0 ? "rgba(148,163,184,0.06)" : blocked ? "rgba(251,191,36,0.08)" : "rgba(74,222,128,0.08)";
                    const okBd    = n === 0 ? "rgba(148,163,184,0.18)" : blocked ? "rgba(251,191,36,0.28)" : "rgba(74,222,128,0.22)";
                    return (
                      <div style={{
                        padding: "14px 16px", borderRadius: 10,
                        background: okBg, border: `1px solid ${okBd}`,
                      }}>
                        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: D.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          UX Quick-Check
                        </p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 28, fontWeight: 900, color: okColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                            {n}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: okColor }}>
                            Buttons
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11.5, color: D.textSub, lineHeight: 1.5 }}>
                          {n === 0
                            ? "Keine add_to_cart-Buttons auf dieser Seite gefunden."
                            : blocked
                              ? "Blockierendes JavaScript in Button-Nähe — TTI-Verzögerung bei Interaktion."
                              : "Buttons laden asynchron — optimale Reaktionszeit beim Klick."}
                        </p>
                      </div>
                    );
                  })()}

                  {/* ── Template-Status ────────────────────────────────────── */}
                  <div style={{
                    padding: "14px 16px", borderRadius: 10,
                    background: audit.outdatedTemplates ? "rgba(239,68,68,0.08)" : "rgba(74,222,128,0.08)",
                    border: `1px solid ${audit.outdatedTemplates ? "rgba(239,68,68,0.25)" : "rgba(74,222,128,0.22)"}`,
                  }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: D.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Template-Status
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke={audit.outdatedTemplates ? "#f87171" : "#4ade80"}
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {audit.outdatedTemplates
                          ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                          : <polyline points="20 6 9 17 4 12"/>}
                      </svg>
                      <span style={{ fontSize: 14, fontWeight: 800, color: audit.outdatedTemplates ? "#f87171" : "#4ade80" }}>
                        {audit.outdatedTemplates ? "Veraltete Overrides" : "Templates aktuell"}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: D.textSub, lineHeight: 1.5 }}>
                      {audit.outdatedTemplates
                        ? "Theme überschreibt veraltete WooCommerce-Templates — Darstellungsfehler nach Updates wahrscheinlich."
                        : "Keine Theme-Overrides auf veralteten WooCommerce-Template-Versionen erkannt."}
                    </p>
                  </div>
                </div>

                {/* ── Plugin-Impact-Score (Top 3) ─────────────────────────── */}
                {audit.pluginImpact.length > 0 && (
                  <div style={{
                    marginTop: 10, padding: "14px 16px", borderRadius: 10,
                    background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.22)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: D.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        Plugin-Impact · Top {audit.pluginImpact.length}
                      </p>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                        Geschätzter TTI-Impact auf diese Seite
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {audit.pluginImpact.map(p => {
                        const barPct   = Math.round((p.impactScore / 10) * 100);
                        const barColor = p.impactScore >= 8 ? "#f87171" : p.impactScore >= 6 ? "#fbbf24" : "#fb923c";
                        return (
                          <div key={p.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: D.text, marginBottom: 2 }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: D.textMuted, lineHeight: 1.4 }}>{p.reason}</div>
                              <div style={{ height: 3, borderRadius: 99, marginTop: 5, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${barPct}%`, background: barColor, borderRadius: 99 }} />
                              </div>
                            </div>
                            <span style={{
                              fontSize: 12, fontWeight: 800, padding: "4px 9px", borderRadius: 10,
                              background: `rgba(${hexToRgb(barColor)},0.12)`,
                              color: barColor, border: `1px solid rgba(${hexToRgb(barColor)},0.28)`,
                              fontVariantNumeric: "tabular-nums", minWidth: 48, textAlign: "center",
                            }}>
                              {p.impactScore}/10
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.5 }}>
                      <strong style={{ color: "#A78BFA" }}>Empfehlung:</strong> Mit "Asset CleanUp" oder "Perfmatters" die obigen Plugins selektiv nur auf Shop-Seiten laden — typisch –40 % TTI auf Nicht-Shop-Seiten.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ Befunde (Issues) ═══════════════════════════════════════════ */}
            {shopIssues.length === 0 ? (
              <div style={{
                padding: "14px 16px", borderRadius: 8,
                background: D.greenBg, border: `1px solid ${D.greenBorder}`,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={D.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p style={{ margin: 0, fontSize: 13, color: D.green, fontWeight: 600 }}>
                  Shop technisch sauber — keine kritischen Befunde bei Cart-Fragments, Upload-Security und Session-Cookies.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {shopIssues.map((issue, idx) => {
                  const isRed   = issue.severity === "red";
                  const bg      = isRed ? D.redBg      : D.amberBg;
                  const bd      = isRed ? D.redBorder  : D.amberBorder;
                  const clr     = isRed ? D.red        : D.amber;
                  return (
                    <div key={idx} style={{
                      padding: "12px 14px", borderRadius: 8,
                      background: bg, border: `1px solid ${bd}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10,
                          background: `rgba(${hexToRgb(clr)},0.15)`,
                          color: clr, border: `1px solid ${bd}`, letterSpacing: "0.05em",
                        }}>
                          {isRed ? "HANDLUNGSBEDARF" : "OPTIMIERUNG"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>
                          {issue.title}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: D.textSub, lineHeight: 1.6 }}>
                        {issue.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Builder-Intelligence Sektion (Elementor / Divi / Astra / WPBakery) ──────

export function BuilderIntelligenceSection({ plan, audit, builderIssues, onGeneratePlan }: {
  plan: string;
  audit: BuilderAuditProp;
  builderIssues: ParsedIssueProp[];
  onGeneratePlan: () => void;
}) {
  // Builder-Intelligence ist für ALLE zahlenden Pläne offen (Starter+).
  const pro = isPaidPlan(plan);
  const theme = getBuilderTheme(audit.builder);
  const depthCritical = audit.maxDomDepth > 22;
  const depthWarning  = audit.maxDomDepth > 15 && !depthCritical;
  const fontsHigh     = audit.googleFontFamilies.length > 2;

  return (
    <div style={{
      marginBottom: 28, borderRadius: D.radius, overflow: "hidden",
      background: "rgba(255,255,255,0.02)", border: `1px solid ${theme.bd}`,
      boxShadow: `0 0 0 1px ${theme.bg}`,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 20px",
        background: `linear-gradient(90deg, ${theme.bg} 0%, transparent 100%)`,
        borderBottom: `1px solid ${theme.bd}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            background: theme.primary, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 900, color: "#fff",
          }}>
            {theme.logo}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: D.text, letterSpacing: "-0.01em" }}>
              Builder- & Theme-Analyse
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: D.textMuted }}>
              {audit.builder ?? "Kein Page-Builder"} · DOM-Struktur, Fonts, CSS-Bloat
            </p>
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
          background: theme.primary, color: "#fff", letterSpacing: "0.06em",
        }}>
          {audit.builder ? audit.builder.toUpperCase() + " ERKANNT" : "KEIN BUILDER"}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "18px 20px" }}>
        {/* STARTER: Locked-Preview */}
        {!pro && (
          <>
            <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
              <strong style={{ color: theme.primary }}>{audit.builder ?? "Page-Builder"} erkannt.</strong>{" "}
              Für Page-Builder-Seiten gibt es spezifische Optimierungen: DOM-Verschachtelung, Font-Auswahl, Asset-Bloat. Im Professional-Plan wird deine Seite auf alle drei Dimensionen geprüft und liefert einen fertigen Optimierungs-Plan zum Export.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 14 }}>
              {[
                { title: "DOM-Depth Analyzer",    sub: "Verschachtelungstiefe + Render-Impact" },
                { title: "Google-Font Tracker",   sub: "DSGVO-Check + Performance-Bewertung" },
                { title: "CSS-Bloat Heuristik",   sub: "Ungenutzte Builder-Styles identifizieren" },
                { title: "Optimierungs-Plan PDF", sub: "Fertige Checkliste für Kunden-Export" },
              ].map(check => (
                <div key={check.title} style={{
                  padding: "10px 12px", borderRadius: 7,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.12)",
                  opacity: 0.65,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <LockIco size={11} color={D.textMuted} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{check.title}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: D.textMuted, lineHeight: 1.45 }}>{check.sub}</p>
                </div>
              ))}
            </div>
            <div style={{
              padding: "14px 16px", borderRadius: 8,
              background: "linear-gradient(90deg, rgba(16,185,129,0.08), rgba(251,191,36,0.05))",
              border: "1px solid rgba(16,185,129,0.25)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            }}>
              <div style={{ flex: "1 1 auto", minWidth: 200 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#10B981" }}>
                  Builder-Intelligence im Professional-Plan
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                  Tiefere Analysen und exportierbarer Optimierungs-Plan für deine Kunden — ab 89 €/Monat.
                </p>
              </div>
              <Link href="/fuer-agenturen#pricing" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 16px", borderRadius: 8,
                background: "linear-gradient(90deg, #059669, #10B981)",
                color: "#fff", fontSize: 12, fontWeight: 700,
                textDecoration: "none", whiteSpace: "nowrap",
                boxShadow: "0 3px 10px rgba(16,185,129,0.28)",
              }}>
                Builder-Intelligence freischalten →
              </Link>
            </div>
          </>
        )}

        {/* PROFESSIONAL / AGENCY: Volle Analyse + Plan-Button */}
        {pro && (
          <>
            {/* 3-Spalten-KPI-Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 10, marginBottom: 14,
            }}>
              {/* DOM-Depth */}
              <div style={{
                padding: "14px 16px", borderRadius: 10,
                background: depthCritical ? D.redBg : depthWarning ? D.amberBg : D.greenBg,
                border: `1px solid ${depthCritical ? D.redBorder : depthWarning ? D.amberBorder : D.greenBorder}`,
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: D.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  DOM-Tiefe
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 28, fontWeight: 900,
                    color: depthCritical ? D.red : depthWarning ? D.amber : D.green,
                    lineHeight: 1, fontVariantNumeric: "tabular-nums",
                  }}>
                    {audit.maxDomDepth}
                  </span>
                  <span style={{ fontSize: 11, color: D.textMuted }}>Ebenen</span>
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: D.textSub, lineHeight: 1.45 }}>
                  {depthCritical ? "Kritisch — Render-Stau auf mobilen Geräten wahrscheinlich."
                   : depthWarning ? "Google empfiehlt ≤ 15 — Optimierung spürbar."
                   : "Im grünen Bereich — saubere DOM-Struktur."}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 10.5, color: D.textMuted }}>
                  {audit.divCount} &lt;div&gt;-Tags gesamt
                </p>
              </div>

              {/* Google Fonts */}
              <div style={{
                padding: "14px 16px", borderRadius: 10,
                background: fontsHigh ? D.amberBg : audit.googleFontFamilies.length > 0 ? D.amberBg : D.greenBg,
                border: `1px solid ${fontsHigh ? D.amberBorder : audit.googleFontFamilies.length > 0 ? D.amberBorder : D.greenBorder}`,
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: D.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Google Fonts
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 28, fontWeight: 900,
                    color: fontsHigh ? D.amber : audit.googleFontFamilies.length > 0 ? D.amber : D.green,
                    lineHeight: 1, fontVariantNumeric: "tabular-nums",
                  }}>
                    {audit.googleFontFamilies.length}
                  </span>
                  <span style={{ fontSize: 11, color: D.textMuted }}>
                    Famil{audit.googleFontFamilies.length === 1 ? "ie" : "ien"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: D.textSub, lineHeight: 1.45, wordBreak: "break-word" }}>
                  {audit.googleFontFamilies.length === 0
                    ? "Keine externen Google Fonts erkannt — top."
                    : audit.googleFontFamilies.slice(0, 3).join(", ") + (audit.googleFontFamilies.length > 3 ? ", …" : "")}
                </p>
                {audit.googleFontFamilies.length > 0 && (
                  <p style={{ margin: "4px 0 0", fontSize: 10.5, color: D.textMuted }}>DSGVO-Check empfohlen</p>
                )}
              </div>

              {/* CSS-Bloat */}
              <div style={{
                padding: "14px 16px", borderRadius: 10,
                background: audit.cssBloatHints.length > 0 ? D.amberBg : D.greenBg,
                border: `1px solid ${audit.cssBloatHints.length > 0 ? D.amberBorder : D.greenBorder}`,
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: D.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  CSS-Bloat
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 28, fontWeight: 900,
                    color: audit.cssBloatHints.length > 0 ? D.amber : D.green,
                    lineHeight: 1, fontVariantNumeric: "tabular-nums",
                  }}>
                    {audit.cssBloatHints.length}
                  </span>
                  <span style={{ fontSize: 11, color: D.textMuted }}>Hinweise</span>
                </div>
                <p style={{ margin: 0, fontSize: 11.5, color: D.textSub, lineHeight: 1.45 }}>
                  {audit.cssBloatHints.length === 0
                    ? "Keine ungenutzten Builder-Styles erkannt."
                    : audit.cssBloatHints[0].slice(0, 90) + (audit.cssBloatHints[0].length > 90 ? "…" : "")}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 10.5, color: D.textMuted }}>
                  {audit.stylesheetCount} Stylesheets insgesamt
                </p>
              </div>
            </div>

            {/* Befunde (Builder-Issues) */}
            {builderIssues.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {builderIssues.map((issue, idx) => {
                  const isRed = issue.severity === "red";
                  return (
                    <div key={idx} style={{
                      padding: "10px 12px", borderRadius: 8,
                      background: isRed ? D.redBg : D.amberBg,
                      border: `1px solid ${isRed ? D.redBorder : D.amberBorder}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10,
                          background: `rgba(${hexToRgb(isRed ? D.red : D.amber)},0.15)`,
                          color: isRed ? D.red : D.amber,
                          border: `1px solid ${isRed ? D.redBorder : D.amberBorder}`,
                          letterSpacing: "0.05em",
                        }}>
                          {isRed ? "HANDLUNGSBEDARF" : "OPTIMIERUNG"}
                        </span>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: D.text }}>{issue.title}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 11.5, color: D.textSub, lineHeight: 1.55 }}>{issue.body}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Generate-Plan Button */}
            <button
              onClick={onGeneratePlan}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800,
                background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}DD)`,
                color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
                boxShadow: `0 4px 14px ${theme.bg}`,
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="15" y2="11"/>
              </svg>
              Optimierungs-Plan generieren
            </button>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: D.textMuted }}>
              Exportierbare Checkliste mit 3–5 Handlungspunkten, abgeleitet aus DOM-Tiefe, Fonts, Shop-Status und erkannten Plugins.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
