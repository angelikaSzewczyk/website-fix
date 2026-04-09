"use client";

import { useState } from "react";
import Link from "next/link";

// ── Brand mark (same as LegalLayout) ─────────────────────────────────────────
function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
      style={{ background: "#0D1117", borderRadius: 7, padding: 3, flexShrink: 0 }}>
      <path d="M 4,5 L 13,14 L 7,20" stroke="rgba(255,255,255,0.65)"
        strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M 7,20 L 13,25 L 24,6" stroke="#F59E0B"
        strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Input component ────────────────────────────────────────────────────────────
function Field({
  label, id, type = "text", placeholder, value, onChange, required, rows,
}: {
  label: string; id: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const base: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${focused ? "#F59E0B" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 10, padding: "13px 16px",
    color: "#fff", fontSize: 15, outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "inherit",
    resize: rows ? "vertical" : undefined,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label htmlFor={id} style={{
        fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)",
        letterSpacing: "0.01em",
      }}>
        {label}{required && <span style={{ color: "#F59E0B", marginLeft: 3 }}>*</span>}
      </label>
      {rows ? (
        <textarea
          id={id} rows={rows} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...base, minHeight: 120 }}
        />
      ) : (
        <input
          id={id} type={type} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={base}
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
      gap: 20, padding: "52px 32px", textAlign: "center",
    }}>
      {/* Checkmark circle */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(245,158,11,0.12)",
        border: "2px solid rgba(245,158,11,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M 7,16 L 13,22 L 25,10"
            stroke="#F59E0B" strokeWidth="2.6"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
          Nachricht gesendet!
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
          Danke! Wir melden uns in Kürze bei dir.
        </p>
      </div>
      <Link href="/" style={{
        marginTop: 8, padding: "10px 24px", borderRadius: 10,
        background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
        color: "#0a0a0a", fontWeight: 700, fontSize: 14, textDecoration: "none",
      }}>
        Zurück zur Startseite
      </Link>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function KontaktClient() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
      } else {
        setError(data.error ?? "Etwas ist schiefgelaufen.");
      }
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
              Website<span style={{ fontWeight: 800, color: "#F59E0B" }}>Fix</span>
            </span>
          </Link>
          <Link href="/scan" style={{
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            padding: "8px 18px", borderRadius: 9,
            background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
            color: "#0a0a0a",
            boxShadow: "0 2px 12px rgba(245,158,11,0.3)",
          }}>
            Jetzt scannen →
          </Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <main style={{ maxWidth: "42rem", margin: "0 auto", padding: "72px 24px 120px" }}>

        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800,
            letterSpacing: "-0.03em", lineHeight: 1.15,
            color: "#fff", margin: "0 0 14px",
          }}>
            Kontakt
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
            Fragen, Feedback oder Partneranfragen? Schreib uns — wir melden uns in der Regel innerhalb von 24&nbsp;Stunden.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}>
          {sent ? (
            <SuccessCard />
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: "36px 32px", display: "flex", flexDirection: "column", gap: 22 }}>

              {/* Name + Email row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field
                  id="name" label="Name" placeholder="Dein Name"
                  value={name} onChange={setName} required
                />
                <Field
                  id="email" label="E-Mail" type="email" placeholder="du@beispiel.de"
                  value={email} onChange={setEmail} required
                />
              </div>

              <Field
                id="subject" label="Betreff" placeholder="Worum geht es?"
                value={subject} onChange={setSubject} required
              />

              <Field
                id="message" label="Nachricht" placeholder="Deine Nachricht..."
                value={message} onChange={setMessage} required rows={6}
              />

              {/* Error */}
              {error && (
                <div style={{
                  padding: "12px 16px", borderRadius: 9,
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                  fontSize: 13, color: "#F87171",
                }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !name || !email || !subject || !message}
                style={{
                  padding: "14px 28px", borderRadius: 10, border: "none",
                  background: loading || !name || !email || !subject || !message
                    ? "rgba(255,255,255,0.08)"
                    : "linear-gradient(90deg, #F59E0B, #FBBF24)",
                  color: loading || !name || !email || !subject || !message
                    ? "rgba(255,255,255,0.3)"
                    : "#0a0a0a",
                  fontWeight: 700, fontSize: 15,
                  cursor: loading || !name || !email || !subject || !message ? "not-allowed" : "pointer",
                  transition: "background 0.15s, color 0.15s",
                  boxShadow: loading || !name || !email || !subject || !message
                    ? "none"
                    : "0 4px 16px rgba(245,158,11,0.3)",
                  alignSelf: "flex-start",
                }}
              >
                {loading ? "Wird gesendet..." : "Nachricht senden →"}
              </button>

            </form>
          )}
        </div>

        {/* Meta links */}
        <div style={{ marginTop: 40, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Oder direkt:</span>
          <a href="mailto:support@website-fix.com" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
            support@website-fix.com
          </a>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "32px 24px", textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 2 }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          <Link href="/impressum" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Impressum</Link>
          <span style={{ margin: "0 10px", opacity: 0.3 }}>·</span>
          <Link href="/datenschutz" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Datenschutz</Link>
        </p>
      </footer>
    </div>
  );
}
