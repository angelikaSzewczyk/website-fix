import Link from "next/link";

if (typeof window !== "undefined") {
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("event", "page_404", {
      page_location: window.location.href,
    });
  }
}

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "80px 20px",
        color: "#fff",
        textAlign: "center",
      }}
    >
      <p
        style={{
          opacity: 0.6,
          fontSize: 14,
          marginBottom: 12,
          letterSpacing: 0.5,
        }}
      >
        Fehler 404
      </p>

      <h1 style={{ marginTop: 0, fontSize: 42, lineHeight: 1.15 }}>
        Diese Seite gibt es nicht (mehr)
      </h1>

      <p
        style={{
          marginTop: 18,
          opacity: 0.85,
          fontSize: 18,
          lineHeight: 1.6,
        }}
      >
        Aber kein Stress – wenn etwas auf deiner Website nicht funktioniert,
        fixen wir das für dich.
      </p>

      {/* Trust pills */}
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 26,
        }}
      >
        <span className="trustPill">Fixpreise</span>
        <span className="trustPill">24–72h</span>
        <span className="trustPill">100 % Erstattung, wenn nicht machbar</span>
      </div>

      {/* CTAs */}
      <div
        style={{
          display: "flex",
          gap: 14,
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: 34,
        }}
      >
        <Link href="/#fixes" className="cta">
          Fix auswählen
        </Link>

        <Link href="/#kontakt" className="ghost">
          Anfrage senden
        </Link>
      </div>

      {/* Secondary link */}
      <p style={{ marginTop: 34, opacity: 0.7 }}>
        oder zurück zur{" "}
        <Link href="/" style={{ color: "#fff", textDecoration: "underline" }}>
          Startseite
        </Link>
      </p>
    </main>
  );
}
