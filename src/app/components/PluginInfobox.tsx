/**
 * PluginInfobox — Read-Only-Plugin-Verkaufsblock.
 *
 * Wird auf / und /fuer-agenturen vor oder nach dem Pricing eingesetzt, um
 * das Read-Only-Plugin als Kern-Differenzierung gegenüber billigen Online-
 * Scannern zu positionieren. Pure Server-Component (kein State), KEEP
 * SYNCED zwischen den beiden Pages.
 *
 * Tone-of-Voice: technische Klarheit + Sicherheit. Hauptbotschaft:
 * "Kein Passwort-Stress" + "Keine Schreibrechte" + "Tiefere Daten".
 */

import Link from "next/link";

export default function PluginInfobox() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px" }}>
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, rgba(34,197,94,0.06), rgba(122,166,255,0.04))",
        border: "1px solid rgba(34,197,94,0.28)",
        borderRadius: 18,
        padding: "32px 32px",
        boxShadow: "0 12px 40px rgba(34,197,94,0.08)",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center", flexWrap: "wrap" }}>

          {/* Shield-Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 16, flexShrink: 0,
            background: "rgba(34,197,94,0.14)",
            border: "1px solid rgba(34,197,94,0.36)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }} aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>

          {/* Text-Block */}
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "3px 11px", borderRadius: 999, marginBottom: 10, background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.34)" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Read-Only · Ab Starter inklusive
              </span>
            </div>
            <h2 style={{ margin: "0 0 10px", fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.25 }}>
              Kein Passwort-Stress mehr.
            </h2>
            <p style={{ margin: 0, fontSize: 14.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.7, maxWidth: 600 }}>
              Installiere unser <strong style={{ color: "#fff" }}>Read-Only-Plugin</strong> für Deep-Insights ohne Sicherheitsrisiko.
              Wir lesen PHP-Fehler, Plugin-Konflikte und Datenbank-Bottlenecks aus —
              <strong style={{ color: "#fff" }}> ohne dass du uns dein WP-Passwort gibst</strong> und
              <strong style={{ color: "#fff" }}> ohne Schreibzugriff auf deine Datenbank</strong>.
              Genau das unterscheidet uns von billigen Online-Scannern, die nur die Außenseite prüfen.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
              {[
                { icon: "🔒", text: "Kein WP-Login nötig" },
                { icon: "✕",  text: "Kein Schreibzugriff" },
                { icon: "📊", text: "PHP + DB + Plugin-Diagnose" },
              ].map(b => (
                <span key={b.text} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "5px 12px", borderRadius: 9,
                  background: "rgba(0,0,0,0.30)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12, color: "rgba(255,255,255,0.65)",
                }}>
                  <span aria-hidden="true">{b.icon}</span>
                  {b.text}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/plugin"
            style={{
              flexShrink: 0,
              padding: "12px 26px", borderRadius: 11,
              background: "linear-gradient(90deg,#16A34A,#22c55e)",
              color: "#fff", fontSize: 14, fontWeight: 800,
              textDecoration: "none", whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(34,197,94,0.40)",
            }}
          >
            Plugin-Details →
          </Link>
        </div>
      </div>
    </section>
  );
}
