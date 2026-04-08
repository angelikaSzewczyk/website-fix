// app/components/consent-banner.tsx
"use client";

import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/track";
import { useEffect, useState } from "react";

export default function ConsentBanner() {
  const [state, setState] = useState<"granted" | "denied" | "unset">("unset");

  useEffect(() => {
    setState(getAnalyticsConsent());
  }, []);

  if (state !== "unset") return null;

  const accept = () => {
    setAnalyticsConsent(true);
    setState("granted");
    window.dispatchEvent(new Event("wf:consent"));
  };

  const reject = () => {
    setAnalyticsConsent(false);
    setState("denied");
    window.dispatchEvent(new Event("wf:consent"));
  };

  return (
    <div
      className="no-print"
      role="dialog"
      aria-label="Cookie-Einstellungen"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 9999,
        width: 340,
        maxWidth: "calc(100vw - 32px)",
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        padding: "18px 20px",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, #007BFF, #0057b8)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
          Cookie-Einstellungen
        </span>
      </div>

      {/* Body */}
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
        Wir nutzen Google Analytics, um die Website zu verbessern. Details in unserer{" "}
        <a href="/datenschutz" style={{ color: "#2563EB", textDecoration: "none", fontWeight: 500 }}>
          Datenschutzerklärung
        </a>
        .
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={accept}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            background: "#2563EB",
            color: "#ffffff",
            boxShadow: "0 2px 6px rgba(37,99,235,0.3)",
            transition: "background 0.15s",
            fontFamily: "inherit",
          }}
        >
          Alle akzeptieren
        </button>

        <button
          onClick={reject}
          style={{
            flex: 1,
            padding: "9px 14px",
            borderRadius: 9,
            border: "1px solid #E2E8F0",
            background: "#F8FAFC",
            color: "#64748B",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "background 0.15s",
            fontFamily: "inherit",
          }}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}
