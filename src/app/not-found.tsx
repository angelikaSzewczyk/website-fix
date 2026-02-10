export default function NotFound() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px", color: "#fff" }}>
      <h1 style={{ marginTop: 0 }}>404 – Seite nicht gefunden</h1>
      <p style={{ opacity: 0.85 }}>Die Seite existiert nicht (oder wurde verschoben).</p>
      <p>
        <a href="/" style={{ color: "#fff", textDecoration: "underline" }}>
          ← Zur Startseite
        </a>
      </p>
    </main>
  );
}
