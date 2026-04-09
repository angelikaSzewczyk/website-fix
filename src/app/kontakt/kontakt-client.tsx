"use client";

import { useState } from "react";
import Link from "next/link";

// ── Brand mark ────────────────────────────────────────────────────────────────
function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
      style={{ background: "#0D1117", borderRadius: 7, padding: 3, flexShrink: 0 }}>
      <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.65)"
        strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 7,20 L 13,25 L 24,6" stroke="#EAB308"
        strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({
  label, id, type = "text", placeholder, value, onChange, required, rows,
}: {
  label: string; id: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean; rows?: number;
}) {
  const [focused, setFocused] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(30,41,59,0.8)",
    border: `1px solid ${focused ? "#EAB308" : "rgba(234,179,8,0.15)"}`,
    borderRadius: 10, padding: "13px 16px",
    color: "#fff", fontSize: 14, outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
    boxShadow: focused ? "0 0 0 3px rgba(234,179,8,0.12), inset 0 1px 2px rgba(0,0,0,0.3)" : "inset 0 1px 2px rgba(0,0,0,0.3)",
    resize: rows ? "vertical" : undefined,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label htmlFor={id} style={{
        fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)",
        letterSpacing: "0.07em", textTransform: "uppercase",
      }}>
        {label}{required && <span style={{ color: "#EAB308", marginLeft: 3 }}>*</span>}
      </label>
      {rows ? (
        <textarea
          id={id} rows={rows} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="wf-contact-input"
          style={{ ...inputStyle, minHeight: 140 }}
        />
      ) : (
        <input
          id={id} type={type} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="wf-contact-input"
          style={inputStyle}
        />
      )}
    </div>
  );
}

// ── Success state ─────────────────────────────────────────────────────────────
function SuccessCard() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 24, padding: "60px 40px", textAlign: "center",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "rgba(234,179,8,0.1)",
        border: "2px solid rgba(234,179,8,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 32px rgba(234,179,8,0.2)",
      }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M 8,18 L 15,25 L 28,11"
            stroke="#EAB308" strokeWidth="2.8"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h2 style={{
          margin: "0 0 12px", fontSize: 26, fontWeight: 800,
          letterSpacing: "-0.025em",
          background: "linear-gradient(135deg, #fff 40%, #EAB308)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Nachricht gesendet!
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>
          Danke! Wir melden uns in Kürze bei dir.
        </p>
      </div>
      <Link href="/" style={{
        marginTop: 4, padding: "12px 28px", borderRadius: 10, border: "none",
        background: "#EAB308", color: "#0a0a0a",
        fontWeight: 700, fontSize: 14, textDecoration: "none",
        boxShadow: "0 4px 20px rgba(234,179,8,0.35)",
      }}>
        Zurück zur Startseite →
      </Link>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function KontaktClient() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  const allFilled = !!(name && email && subject && message);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFilled || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.ok) setSent(true);
      else setError(data.error ?? "Etwas ist schiefgelaufen.");
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* placeholder color */}
      <style>{`
        .wf-contact-input::placeholder { color: rgba(234,179,8,0.3); }
        .wf-contact-input:focus { outline: none; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(10,10,10,0.95)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
            <BrandMark />
            <span style={{ fontWeight: 300, fontSize: 16, color: "#fff", letterSpacing: "-0.01em" }}>
              Website<span style={{ fontWeight: 800, color: "#EAB308" }}>Fix</span>
            </span>
          </Link>
          <Link href="/scan" style={{
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            padding: "8px 18px", borderRadius: 9,
            background: "#EAB308", color: "#0a0a0a",
            boxShadow: "0 2px 12px rgba(234,179,8,0.35)",
          }}>
            Jetzt scannen →
          </Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <main style={{ maxWidth: "44rem", margin: "0 auto", padding: "80px 24px 120px" }}>

        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(36px, 6vw, 52px)", fontWeight: 800,
            letterSpacing: "-0.035em", lineHeight: 1.1, margin: "0 0 18px",
            background: "linear-gradient(135deg, #fff 30%, #EAB308 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Kontakt
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.75, maxWidth: "30rem", marginInline: "auto" }}>
            Fragen, Feedback oder Partneranfragen? Schreib uns — wir melden uns
            in der Regel innerhalb von{" "}
            <span style={{ color: "#EAB308", fontWeight: 600 }}>24&nbsp;Stunden</span>.
          </p>
        </div>

        {/* Glowing card */}
        <div style={{
          background: "rgba(17,24,39,0.9)",
          border: "1px solid rgba(234,179,8,0.2)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 0 40px rgba(234,179,8,0.12), 0 0 80px rgba(234,179,8,0.06), 0 20px 60px rgba(0,0,0,0.5)",
        }}>
          {sent ? <SuccessCard /> : (
            <form onSubmit={handleSubmit} style={{
              padding: "40px 36px",
              display: "flex", flexDirection: "column", gap: 24,
            }}>

              {/* Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <Field id="name" label="Name" placeholder="Dein Name"
                  value={name} onChange={setName} required />
                <Field id="email" label="E-Mail" type="email" placeholder="du@beispiel.de"
                  value={email} onChange={setEmail} required />
              </div>

              <Field id="subject" label="Betreff" placeholder="Worum geht es?"
                value={subject} onChange={setSubject} required />

              <Field id="message" label="Nachricht" placeholder="Deine Nachricht..."
                value={message} onChange={setMessage} required rows={6} />

              {/* Error */}
              {error && (
                <div style={{
                  padding: "12px 16px", borderRadius: 9,
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  fontSize: 13, color: "#F87171",
                }}>
                  {error}
                </div>
              )}

              {/* Submit — always yellow */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "14px 32px", borderRadius: 10, border: "none",
                    background: loading ? "rgba(234,179,8,0.5)" : "#EAB308",
                    color: "#0a0a0a",
                    fontWeight: 700, fontSize: 15,
                    cursor: loading ? "default" : "pointer",
                    transition: "background 0.15s, box-shadow 0.15s",
                    boxShadow: loading ? "none" : "0 4px 20px rgba(234,179,8,0.4)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {loading ? "Wird gesendet..." : "Nachricht senden →"}
                </button>
              </div>

            </form>
          )}
        </div>

        {/* Email link — centered, yellow */}
        {!sent && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Oder direkt: </span>
            <a href="mailto:support@website-fix.com" style={{
              fontSize: 13, fontWeight: 600,
              color: "#EAB308", textDecoration: "none",
              letterSpacing: "-0.01em",
            }}>
              support@website-fix.com
            </a>
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "32px 24px", textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 2 }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          <Link href="/impressum" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Impressum</Link>
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          <Link href="/datenschutz" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>Datenschutz</Link>
        </p>
      </footer>
    </div>
  );
}
