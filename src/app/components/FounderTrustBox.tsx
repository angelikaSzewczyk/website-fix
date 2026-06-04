import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/**
 * FounderTrustBox — kleine Vertrauens-Box, die unter den 3 Notfall-Karten
 * auf der Homepage steht. Persönlicher Anker gegen den „glatten KI-SaaS"-
 * Eindruck: Erste-Person-Aussage + WP.org-Plugin als harter Trust-Proof.
 *
 * Bewusst klein gehalten (keine eigene Section, keine großen CTAs) — die
 * Notfall-Karten sind der primäre Action-Anker, diese Box ist der ruhige
 * „du bist hier richtig"-Beweis daneben.
 */
export default function FounderTrustBox() {
  return (
    <div style={{
      maxWidth: 760,
      margin: "44px auto 0",
      padding: "20px 24px",
      borderRadius: 14,
      background: "rgba(34,197,94,0.04)",
      border: "1px solid rgba(34,197,94,0.22)",
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
    }}>
      <div style={{
        flexShrink: 0,
        width: 38, height: 38, borderRadius: 10,
        background: "rgba(34,197,94,0.12)",
        border: "1px solid rgba(34,197,94,0.30)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#22C55E",
      }}>
        <ShieldCheck size={18} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 6px",
          fontSize: 11, fontWeight: 800,
          color: "#22C55E",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}>
          Keine Blackbox
        </p>
        <p style={{
          margin: 0,
          fontSize: 14.5,
          color: "rgba(255,255,255,0.78)",
          lineHeight: 1.65,
        }}>
          Hinter WebsiteFix steckt kein anonymes KI-Skript. Ich bin Angelika, Entwicklerin aus Frankfurt
          — und alles hier habe ich selbst gebaut. Mein Free-Plugin{" "}
          <Link
            href="/plugin/optimizer"
            style={{
              color: "#22C55E",
              textDecoration: "none",
              fontWeight: 700,
              borderBottom: "1px solid rgba(34,197,94,0.40)",
            }}
          >
            WebsiteFix Optimizer
          </Link>
          {" "}hat das manuelle Code-Review der WordPress.org-Moderatoren bestanden: GPL Open Source,
          jeder Snippet einzeln nachlesbar, kein Datenbank-Schreibzugriff. Eine Sache, sauber gemacht.
        </p>
      </div>
    </div>
  );
}
