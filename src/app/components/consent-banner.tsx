"use client";

import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/track";
import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo";

export default function ConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] =
    useState<"granted" | "denied" | "unset">("unset");

  useEffect(() => {
    setState(getAnalyticsConsent());
    setMounted(true);
  }, []);

  // Auf Server + erstem Client-Render absolut identisch: nichts rendern.
  if (!mounted || state !== "unset") {
    return null;
  }

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
      className="no-print wf-cookie-banner"
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
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)",
        padding: "22px 24px",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginBottom: 10,
        }}
      >
        <BrandLogo size="sm" theme="light" />

        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0F172A",
            marginLeft: 4,
          }}
        >
          Cookie-Einstellungen
        </span>
      </div>

      <p
        style={{
          margin: "0 0 16px",
          fontSize: 12,
          color: "#64748B",
          lineHeight: 1.6,
        }}
      >
        Wir nutzen Google Analytics, um die Website zu verbessern. Details in
        unserer{" "}
        <a
          href="/datenschutz"
          style={{
            color: "#2563EB",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Datenschutzerklärung
        </a>
        .
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
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
            fontFamily: "inherit",
          }}
        >
          Alle akzeptieren
        </button>

        <button
          type="button"
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
            fontFamily: "inherit",
          }}
        >
          Ablehnen
        </button>
      </div>
    </div>
  );
}