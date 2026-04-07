"use client";
import Link from "next/link";

export default function BlogClientWrapper({ postData }: { postData: Record<string, unknown> }) {
  void postData;
  return (
    <div style={{
      margin: "40px 0",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "28px 28px 24px",
      background: "rgba(141,243,211,0.04)",
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#8df3d3", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
        KI-Diagnose · Kostenlos · 60 Sekunden
      </p>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
        Klingt nach deinem Problem?
      </h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 20px" }}>
        WebsiteFix analysiert deine Website automatisch — technische Fehler UND warum keine Anfragen kommen. Ein Scan, konkrete Antworten.
      </p>
      <Link href="/scan" style={{
        display: "inline-block",
        padding: "11px 22px", borderRadius: 9,
        background: "#fff", color: "#0b0c10",
        fontWeight: 700, fontSize: 14, textDecoration: "none",
      }}>
        Jetzt kostenlos scannen →
      </Link>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "10px 0 0" }}>
        Kostenlos · Keine Anmeldung · Keine Kreditkarte
      </p>
    </div>
  );
}
