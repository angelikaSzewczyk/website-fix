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
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 9999,
        maxWidth: 960,
        margin: "0 auto",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,.10)",
        background: "rgba(11,12,16,.82)",
        backdropFilter: "blur(12px)",
        padding: 14,
      }}
      role="dialog"
      aria-label="Cookie-Einstellungen"
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontWeight: 800 }}>Cookies</div>
        <div style={{ opacity: 0.85, lineHeight: 1.45 }}>
          Wir nutzen Google Analytics, um die Website zu verbessern. Du kannst zustimmen oder ablehnen.
          Details in{" "}
          <a href="/datenschutz" style={{ color: "#fff", textDecoration: "underline" }}>
            Datenschutz
          </a>
          .
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={accept}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: 0,
              cursor: "pointer",
              fontWeight: 850,
              background: "linear-gradient(90deg, #8df3d3, #7aa6ff)",
              color: "#0b0c10",
            }}
          >
            Akzeptieren
          </button>

          <button
            onClick={reject}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,.18)",
              background: "rgba(255,255,255,.04)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 750,
            }}
          >
            Ablehnen
          </button>
        </div>
      </div>
    </div>
  );
}
