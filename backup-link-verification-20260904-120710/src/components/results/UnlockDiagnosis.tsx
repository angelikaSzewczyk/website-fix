import Link from "next/link";

export default function UnlockDiagnosis() {
  return (
    <section className="wf-results-unlock" id="diagnose-vertiefen">
      <div>
        <span className="wf-results-eyebrow">Diagnose vertiefen</span>
        <h2>Vom Befund zum konkreten nächsten Schritt.</h2>
        <p>
          Schalte Ursachen, konkrete WordPress-Schritte und eine tiefere Diagnose
          frei. Ohne WordPress-Passwort und ohne automatische Änderungen an deiner
          Website.
        </p>
      </div>

      <div className="wf-results-unlock-actions">
        <Link className="wf-results-button-secondary" href="/scan/checkout">
          Einzel-Diagnose · 9,90 €
        </Link>
        <Link className="wf-results-button-primary" href="/register?plan=starter">
          Starter · 29 €/Monat →
        </Link>
      </div>

      <small>Monatlich kündbar · Read-only Plugin · kein WordPress-Passwort erforderlich</small>
    </section>
  );
}
