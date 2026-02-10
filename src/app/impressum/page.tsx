import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", color: "#fff" }}>
      <h1 style={{ marginTop: 0 }}>Impressum</h1>

      <p><strong>WebsiteFix</strong></p>

      <p>
        <strong>Kontakt</strong><br />
        E-Mail: hello.websitefix.team@web.de
      </p>

      <p style={{ opacity: 0.8 }}>
        ⚠️ Platzhalter: Ergänze hier deine vollständigen Impressumsdaten (Name/Firma, Anschrift,
        Vertretungsberechtigte, Register/ID, ggf. USt-IdNr.).
      </p>

      <p>
        <a href="/" style={{ color: "#fff", textDecoration: "underline" }}>← Zur Startseite</a>
      </p>
    </main>
  );
}
