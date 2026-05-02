"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { HOSTER_OPTIONS } from "@/lib/rescue-guides";

type GuideMeta = {
  id:                string;
  title:             string;
  problem_label:     string;
  preview:           string | null;
  price_cents:       number;
  estimated_minutes: number | null;
  /** Liste der Checklist-Items als Vorschau */
  checklistPreview?: string[];
};

const T = {
  text:       "rgba(255,255,255,0.92)",
  textSub:    "rgba(255,255,255,0.55)",
  textMuted:  "rgba(255,255,255,0.40)",
  border:     "rgba(255,255,255,0.10)",
  divider:    "rgba(255,255,255,0.06)",
  green:      "#4ade80",
  greenBg:    "rgba(74,222,128,0.12)",
  greenBdr:   "rgba(74,222,128,0.30)",
  red:        "#f87171",
  redBg:      "rgba(248,113,113,0.12)",
  cardSolid:  "linear-gradient(135deg, #0f1623 0%, #0d1520 100%)",
};

/**
 * Premium-Modal für den Guide-Kauf-Pfad.
 *   1. Preview des Guides (Title, Problem-Label, Checklist-Items)
 *   2. Hoster-Auswahl (Strato / Ionos / All-Inkl / Hostinger / Anderer)
 *   3. Preis + "Jetzt freischalten" → POST /api/guides/[id]/checkout
 *   4. Bei alreadyUnlocked → direkter Redirect zur Guide-Page
 *
 * ESC + Overlay-Click + ×-Button schließen das Modal (alle drei).
 */
export default function GuideUnlockModal({
  guide,
  onClose,
}: {
  guide: GuideMeta;
  onClose: () => void;
}) {
  const [hoster, setHoster] = useState<string>("default");
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const priceLabel = (guide.price_cents / 100).toFixed(2).replace(".", ",") + " €";

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/guides/${guide.id}/checkout`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hoster }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout fehlgeschlagen");
        setBusy(false);
        return;
      }
      // Redirect zu Stripe (oder direkt zur Guide-Page wenn alreadyUnlocked)
      if (data.url) window.location.href = data.url;
      else { setError("Keine Checkout-URL erhalten"); setBusy(false); }
    } catch {
      setError("Verbindungsfehler — bitte erneut versuchen");
      setBusy(false);
    }
  }

  const overlayStyle: CSSProperties = {
    position: "fixed", inset: 0, zIndex: 1100,
    background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 24,
  };
  const modalStyle: CSSProperties = {
    width: "min(540px, calc(100vw - 32px))",
    maxHeight: "calc(100vh - 64px)", overflowY: "auto",
    background: T.cardSolid,
    border: "1px solid rgba(124,58,237,0.30)",
    borderRadius: 18, padding: "32px 30px 26px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
    color: T.text,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    animation: "wf-guide-modal-in 0.25s cubic-bezier(0.22,1,0.36,1) both",
  };

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={modalStyle} role="dialog" aria-modal="true">
        <style>{`
          @keyframes wf-guide-modal-in {
            from { opacity: 0; transform: translateY(8px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)   scale(1);    }
          }
        `}</style>

        {/* × Button */}
        <button
          onClick={onClose}
          aria-label="Modal schließen"
          style={{
            position: "absolute", top: 14, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: T.textMuted, fontSize: 22, lineHeight: 1, padding: 4,
            fontFamily: "inherit",
          }}
        >×</button>

        {/* Eyebrow */}
        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          🚨 Sofort-Fix
        </p>

        {/* Title */}
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.025em" }}>
          {guide.title}
        </h2>

        {/* Problem-Label + Estimated Minutes */}
        <p style={{ margin: "0 0 18px", fontSize: 13, color: T.textSub, lineHeight: 1.55 }}>
          <strong style={{ color: T.text }}>{guide.problem_label}</strong>
          {guide.estimated_minutes && (
            <span style={{ color: T.textMuted }}> · {guide.estimated_minutes} Minuten</span>
          )}
        </p>

        {/* Preview-Text */}
        {guide.preview && (
          <p style={{ margin: "0 0 22px", fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>
            {guide.preview}
          </p>
        )}

        {/* Was ist drin? — Checklist-Preview */}
        {guide.checklistPreview && guide.checklistPreview.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Was du in der Anleitung lernst
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
              {guide.checklistPreview.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Hoster-Auswahl */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: T.textSub, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Wo ist deine Site gehostet?
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            {HOSTER_OPTIONS.map(opt => {
              const selected = hoster === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHoster(opt.value)}
                  style={{
                    padding: "10px 12px", borderRadius: 9,
                    background: selected ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${selected ? "rgba(124,58,237,0.45)" : T.border}`,
                    color: selected ? "#a78bfa" : T.textSub,
                    fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "background 0.15s ease, border-color 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
            Damit zeigen wir dir die Klick-Pfade in DEINEM Hosting-Backend.
          </p>
        </div>

        {/* Trust-Row */}
        <div style={{
          display: "flex", gap: 14, marginBottom: 20,
          padding: "10px 14px", borderRadius: 9,
          background: "rgba(74,222,128,0.05)", border: `1px solid ${T.greenBdr}`,
          fontSize: 11, color: T.green, fontWeight: 600,
        }}>
          <span>✓ Sofortiger Zugriff</span>
          <span>✓ Lebenslang verfügbar</span>
          <span>✓ Sichere Stripe-Zahlung</span>
        </div>

        {/* Price + CTA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {priceLabel}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>
              einmalig · inkl. MwSt
            </div>
          </div>
          <button
            type="button"
            onClick={unlock}
            disabled={busy}
            style={{
              padding: "12px 24px", borderRadius: 10,
              background: "rgba(124,58,237,0.85)",
              border: "1px solid rgba(167,139,250,0.55)",
              color: "#fff",
              fontSize: 14, fontWeight: 800,
              cursor: busy ? "wait" : "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 18px rgba(124,58,237,0.45)",
              opacity: busy ? 0.7 : 1,
              minWidth: 220, whiteSpace: "nowrap",
            }}
          >
            {busy ? "Weiterleitung zu Stripe…" : "Jetzt freischalten →"}
          </button>
        </div>

        {error && (
          <p style={{ marginTop: 14, padding: "8px 12px", borderRadius: 7, background: T.redBg, border: `1px solid rgba(248,113,113,0.30)`, fontSize: 12, color: T.red, fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
