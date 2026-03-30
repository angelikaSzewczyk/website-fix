"use client";
import Link from "next/link";

export default function BlogClientWrapper({ postData }: { postData: any }) {
  return (
    <section style={{ marginTop: "3rem", marginBottom: "3rem" }}>
      <div className="qcCard">
        <p className="qcBadge" style={{ marginBottom: "1rem" }}>KI-Diagnose · kommt bald</p>
        <h2 className="qcQuestion">Klingt nach deinem Problem?</h2>
        <p className="qcResultText" style={{ marginTop: "0.75rem" }}>
          WebsiteFix analysiert deine Website automatisch — technische Fehler
          UND warum keine Anfragen kommen. Ein Scan, konkrete Antworten, ohne
          Entwickler-Wissen.
        </p>
        <div className="qcActions" style={{ marginTop: "1.5rem" }}>
          <Link href="/#waitlist" className="qcActionBtn qcActionBtnPrimary qcActionLink">
            Frühen Zugang sichern →
          </Link>
        </div>
        <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", opacity: 0.5 }}>
          Kostenlos in der Beta · Keine Kreditkarte · Kein Spam
        </p>
      </div>
    </section>
  );
}
