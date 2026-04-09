"use client";

import { useState } from "react";
import Link from "next/link";

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
    background: "rgba(51,65,85,0.5)",       // slate-700/50
    border: `1.5px solid ${focused ? "#EAB308" : "#334155"}`,
    borderRadius: 10, padding: "13px 16px",
    color: "#F8FAFC", fontSize: 14, outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: focused ? "0 0 0 3px rgba(234,179,8,0.15)" : "none",
    resize: rows ? "vertical" : undefined,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{
        fontSize: 12, fontWeight: 700,
        color: "#94A3B8",
        letterSpacing: "0.07em", textTransform: "uppercase",
      }}>
        {label}{required && <span style={{ color: "#EAB308", marginLeft: 3 }}>*</span>}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="wf-field"
          style={{ ...inputStyle, minHeight: 130 }}
        />
      ) : (
        <input id={id} type={type} placeholder={placeholder}
          value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="wf-field"
          style={inputStyle}
        />
      )}
    </div>
  );
}

// ── Success ───────────────────────────────────────────────────────────────────
function SuccessCard() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 22, padding: "60px 40px", textAlign: "center",
    }}>
      <div style={{
        width: 76, height: 76, borderRadius: "50%",
        background: "rgba(234,179,8,0.1)", border: "2px solid rgba(234,179,8,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 28px rgba(234,179,8,0.2)",
      }}>
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path d="M 8,17 L 14,23 L 26,11"
            stroke="#EAB308" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: "#F8FAFC", letterSpacing: "-0.025em" }}>
          Nachricht gesendet!
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: "#64748B", lineHeight: 1.75 }}>
          Danke! Wir melden uns in Kürze bei dir.
        </p>
      </div>
      <Link href="/" style={{
        marginTop: 6, padding: "12px 28px", borderRadius: 10,
        background: "#EAB308", color: "#0F172A",
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !subject || !message || loading) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
      minHeight: "100vh", background: "#0F172A", color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        .wf-field::placeholder { color: #475569; }
        .wf-field:focus { outline: none; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(15,23,42,0.95)",
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
            background: "#EAB308", color: "#0F172A",
            boxShadow: "0 2px 16px rgba(234,179,8,0.35)",
          }}>
            Jetzt scannen →
          </Link>
        </div>
      </nav>

      {/* ── Content ── */}
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px 100px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h1 style={{
            fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 800,
            letterSpacing: "-0.035em", lineHeight: 1.1, margin: "0 0 14px",
            color: "#F8FAFC",
          }}>
            Kontakt
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "#64748B", lineHeight: 1.75 }}>
            Fragen, Feedback oder Partneranfragen? Schreib uns — wir melden uns
            in der Regel innerhalb von{" "}
            <span style={{ color: "#EAB308", fontWeight: 600 }}>24&nbsp;Stunden</span>.
          </p>
        </div>

        {/* Form card — slate-900 with shadow-2xl */}
        <div style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: 24,
          boxShadow: "0 25px 50px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}>
          {sent ? <SuccessCard /> : (
            <form onSubmit={handleSubmit} style={{
              padding: "40px 36px",
              display: "flex", flexDirection: "column", gap: 22,
            }}>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field id="name" label="Name" placeholder="Dein Name"
                  value={name} onChange={setName} required />
                <Field id="email" label="E-Mail" type="email" placeholder="du@beispiel.de"
                  value={email} onChange={setEmail} required />
              </div>

              <Field id="subject" label="Betreff" placeholder="Worum geht es?"
                value={subject} onChange={setSubject} required />

              <Field id="message" label="Nachricht" placeholder="Deine Nachricht..."
                value={message} onChange={setMessage} required rows={6} />

              {error && (
                <div style={{
                  padding: "12px 16px", borderRadius: 9,
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  fontSize: 13, color: "#F87171",
                }}>
                  {error}
                </div>
              )}

              {/* Always-yellow CTA */}
              <div>
                <button type="submit" disabled={loading} style={{
                  padding: "14px 32px", borderRadius: 10, border: "none",
                  background: loading ? "#92400E" : "#EAB308",
                  color: "#0F172A", fontWeight: 700, fontSize: 15,
                  cursor: loading ? "default" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(234,179,8,0.4)",
                  transition: "background 0.15s, box-shadow 0.15s",
                  letterSpacing: "-0.01em",
                }}>
                  {loading ? "Wird gesendet…" : "Nachricht senden →"}
                </button>
              </div>

            </form>
          )}
        </div>

        {/* Direct email */}
        {!sent && (
          <p style={{ marginTop: 28, textAlign: "center", fontSize: 13, color: "#475569" }}>
            Oder direkt:{" "}
            <a href="mailto:support@website-fix.com" style={{
              color: "#EAB308", textDecoration: "none", fontWeight: 600,
            }}>
              support@website-fix.com
            </a>
          </p>
        )}

      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "28px 24px", textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 2 }}>
          {`© ${new Date().getFullYear()} website-fix.com`}
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          <Link href="/impressum" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Impressum</Link>
          <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
          <Link href="/datenschutz" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Datenschutz</Link>
        </p>
      </footer>
    </div>
  );
}
