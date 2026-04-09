"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ThankYouInner() {
  const params     = useSearchParams();
  const score      = parseInt(params.get("score") ?? "0", 10);
  const agencyName = params.get("agency") ?? "Deine Agentur";
  const color      = params.get("color") ?? "#007BFF";
  const url        = params.get("url") ?? "";

  const scoreColor  = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";
  const scoreLabel  = score >= 80 ? "Solide" : score >= 55 ? "Ausbaufähig" : "Kritisch";
  const domain      = (() => { try { return new URL(url).host; } catch { return url; } })();

  // Donut ring
  const r = 44, circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0c10",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>

        {/* Score ring */}
        <div style={{
          width: 120, height: 120, margin: "0 auto 28px",
          position: "relative",
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle cx="60" cy="60" r={r} fill="none" stroke={scoreColor} strokeWidth="10"
              strokeDasharray={`${filled} ${circ - filled}`}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${scoreColor}80)` }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}%</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Score</span>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20,
          padding: "5px 14px", borderRadius: 20,
          background: `${scoreColor}14`, border: `1px solid ${scoreColor}35`,
          fontSize: 12, fontWeight: 700, color: scoreColor,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: scoreColor, boxShadow: `0 0 6px ${scoreColor}` }} />
          {scoreLabel} · {domain}
        </div>

        <h1 style={{
          margin: "0 0 14px", fontSize: "clamp(22px, 5vw, 30px)",
          fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2,
        }}>
          Dein Ergebnis ist bereit!
        </h1>

        <p style={{ margin: "0 0 28px", fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>
          <strong style={{ color: color }}>{agencyName}</strong> hat deinen vollständigen Report erhalten
          und wird sich in Kürze mit konkreten Verbesserungsvorschlägen bei dir melden.
        </p>

        {/* Info boxes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
          {[
            { icon: "📋", label: "Vollständiger Report", desc: "Alle Befunde & Lösungen" },
            { icon: "🛡️", label: "BFSG-Analyse",        desc: "Barrierefreiheits-Check" },
            { icon: "🔍", label: "KI-Diagnose",          desc: "Code-genaue Fixes" },
            { icon: "📞", label: "Persönliche Beratung", desc: `Von ${agencyName}` },
          ].map(item => (
            <div key={item.label} style={{
              padding: "14px 16px", borderRadius: 12, textAlign: "left",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          padding: "20px 24px", borderRadius: 14,
          background: `linear-gradient(135deg, ${color}14, transparent)`,
          border: `1px solid ${color}30`,
          marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Möchtest du selbst aktiv werden? Erstelle einen kostenlosen Account für vollständige Einblicke.
          </p>
          <Link href="/register" style={{
            display: "inline-block", padding: "11px 28px",
            background: color, color: "#fff",
            textDecoration: "none", borderRadius: 10,
            fontWeight: 700, fontSize: 13,
            boxShadow: `0 4px 16px ${color}40`,
          }}>
            Kostenlosen Account erstellen →
          </Link>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.15)" }}>
          Powered by WebsiteFix · KI-gestützte Website-Analyse
        </p>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense>
      <ThankYouInner />
    </Suspense>
  );
}
