export default function NotFound() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "60px 20px" }}>
      <h1>404 – Seite nicht gefunden</h1>
      <p>Die angeforderte Seite existiert nicht.</p>
      <a href="/" style={{ textDecoration: "underline" }}>
        Zur Startseite
      </a>
    </main>
  );
}
