"use client";

import { useState } from "react";
import Link from "next/link";

type WaitlistState = "idle" | "loading" | "done" | "error";

type ScanState = "idle" | "scanning" | "done" | "error";

export default function ScanPage() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [diagnose, setDiagnose] = useState("");
  const [error, setError] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<WaitlistState>("idle");

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!waitlistEmail || waitlistState === "loading") return;
    setWaitlistState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail }),
      });
      const data = await res.json();
      setWaitlistState(data.success ? "done" : "error");
    } catch {
      setWaitlistState("error");
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || state === "scanning") return;

    setState("scanning");
    setDiagnose("");
    setError("");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (data.success) {
        setDiagnose(data.diagnose);
        setState("done");
      } else {
        setError(data.error || "Etwas ist schiefgelaufen.");
        setState("error");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuche es erneut.");
      setState("error");
    }
  }

  // Markdown-ähnliche Diagnose einfach rendern
  function renderDiagnose(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return <h2 key={i} style={{ fontSize: 18, margin: "0 0 16px", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>{line.replace("# ", "")}</h2>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} style={{ fontSize: 20, margin: "28px 0 10px", fontWeight: 700 }}>{line.replace("## ", "")}</h2>;
      }
      if (line.startsWith("**🔴")) {
        return <div key={i} style={{ margin: "14px 0 4px", fontWeight: 700, color: "#ff6b6b" }}>{line.replace(/\*\*/g, "")}</div>;
      }
      if (line.startsWith("**🟡")) {
        return <div key={i} style={{ margin: "14px 0 4px", fontWeight: 700, color: "#ffd93d" }}>{line.replace(/\*\*/g, "")}</div>;
      }
      if (line.startsWith("**🟢")) {
        return <div key={i} style={{ margin: "14px 0 4px", fontWeight: 700, color: "#8df3d3" }}>{line.replace(/\*\*/g, "")}</div>;
      }
      if (line.match(/^\d+\./)) {
        return <div key={i} style={{ margin: "6px 0", paddingLeft: 20, color: "rgba(255,255,255,0.85)" }}>{line}</div>;
      }
      if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
      return <p key={i} style={{ margin: "4px 0", color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.6 }}>{line}</p>;
    });
  }

  return (
    <>
      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17 }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <Link href="/#waitlist" className="cta ctaSmall">Zur Warteliste</Link>
        </div>
      </nav>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="badge">Beta · Kostenlos · KI-Diagnose in unter 60 Sekunden</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", lineHeight: 1.1, margin: "0 0 16px" }}>
            Website scannen —{" "}
            <span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              KI erklärt was kaputt ist.
            </span>
          </h1>
          <p className="muted" style={{ fontSize: 17, marginBottom: 32, maxWidth: 520 }}>
            URL eingeben, fertig. Keine Anmeldung, kein Plugin, kein Technik-Wissen nötig.
          </p>

          {/* INPUT FORM */}
          <form onSubmit={handleScan} style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 600 }}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://deine-website.de"
              disabled={state === "scanning"}
              style={{
                flex: 1, minWidth: 260,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 12, padding: "14px 18px",
                color: "#fff", fontSize: 16, outline: "none",
              }}
            />
            <button
              type="submit"
              className="cta"
              disabled={state === "scanning" || !url}
              style={{ fontSize: 15, padding: "14px 28px", whiteSpace: "nowrap" }}
            >
              {state === "scanning" ? "Scannt..." : "Jetzt scannen"}
            </button>
          </form>
        </section>

        {/* SCANNING ANIMATION */}
        {state === "scanning" && (
          <div className="card" style={{ marginTop: 8, padding: "28px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "Website abrufen und Erreichbarkeit prüfen...",
                "HTML analysieren: Title, Meta, H1, Canonical...",
                "WordPress-Fehler und Indexierungsprobleme prüfen...",
                "robots.txt und Sitemap checken...",
                "KI erstellt Diagnose auf Deutsch...",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                  <span style={{ color: "#8df3d3" }}>⟳</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === "error" && (
          <div className="card" style={{ marginTop: 8, borderColor: "rgba(255,107,107,0.3)", background: "rgba(255,107,107,0.08)" }}>
            <p style={{ margin: 0, color: "#ff6b6b" }}>{error}</p>
          </div>
        )}

        {/* ERGEBNISSE */}
        {state === "done" && diagnose && (
          <div style={{ marginTop: 8 }}>
            <div className="card" style={{ padding: "28px 28px" }}>
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Scan abgeschlossen</span>
                <span className="muted" style={{ fontSize: 13 }}>— {url}</span>
              </div>
              <div>{renderDiagnose(diagnose)}</div>
            </div>

            {/* WAITLIST CTA */}
            <div style={{
              marginTop: 24,
              background: "rgba(141,243,211,0.04)",
              border: "1px solid rgba(141,243,211,0.15)",
              borderRadius: 16, padding: "28px 28px",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Hat dir das geholfen?
              </p>
              <h3 style={{ margin: "0 0 10px", fontSize: 20 }}>
                Willst du dass wir das für dich reparieren?
              </h3>
              <p className="muted" style={{ margin: "0 0 20px", fontSize: 14 }}>
                Trag dich ein — wir melden uns wenn die automatische Reparatur startet. Kostenlos in der Beta.
              </p>

              {waitlistState === "done" ? (
                <p style={{ color: "#8df3d3", fontWeight: 600, margin: 0 }}>
                  ✓ Du bist auf der Liste! Wir melden uns.
                </p>
              ) : (
                <form onSubmit={handleWaitlist} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="deine@email.de"
                    required
                    disabled={waitlistState === "loading"}
                    style={{
                      flex: 1, minWidth: 220,
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: 12, padding: "13px 16px",
                      color: "#fff", fontSize: 15, outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    className="cta"
                    disabled={waitlistState === "loading" || !waitlistEmail}
                    style={{ fontSize: 15, padding: "13px 24px", whiteSpace: "nowrap" }}
                  >
                    {waitlistState === "loading" ? "..." : "Auf die Liste"}
                  </button>
                </form>
              )}

              {waitlistState === "error" && (
                <p style={{ color: "#ff6b6b", fontSize: 13, margin: "8px 0 0" }}>
                  Etwas ist schiefgelaufen. Bitte versuche es erneut.
                </p>
              )}

              <button
                onClick={() => { setState("idle"); setUrl(""); }}
                className="ghost"
                style={{ fontSize: 13, marginTop: 16, padding: "8px 0", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
              >
                Neue Website scannen →
              </button>
            </div>
          </div>
        )}

        {/* INFO SECTION (nur wenn idle) */}
        {state === "idle" && (
          <section className="section">
            <h2>Was geprüft wird</h2>
            <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginTop: 22 }}>
              {[
                { icon: "🔴", label: "WordPress Fehler", desc: "Critical Error, White Screen, 500er" },
                { icon: "🔍", label: "SEO Grundlagen", desc: "Title, Meta, H1, Canonical, Indexierung" },
                { icon: "🗺️", label: "robots.txt & Sitemap", desc: "Vorhanden und korrekt konfiguriert?" },
                { icon: "🔒", label: "HTTPS", desc: "Verschlüsselte Verbindung aktiv?" },
                { icon: "📋", label: "Formular-Check", desc: "Kontaktformular vorhanden?" },
                { icon: "🌐", label: "Erreichbarkeit", desc: "Lädt die Seite überhaupt?" },
              ].map((item) => (
                <div key={item.label} className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 22 }}>{item.icon}</div>
                  <div style={{ fontWeight: 650, fontSize: 15 }}>{item.label}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "32px 20px", textAlign: "center" }}>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          {`© ${new Date().getFullYear()} website-fix.com · `}
          <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Startseite</Link>
        </p>
      </footer>
    </>
  );
}
