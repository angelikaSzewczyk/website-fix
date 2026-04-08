"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import type { Metadata } from "next";

// Note: metadata not exported from client components — set in layout or use generateMetadata workaround
// Title is handled via head tag approach below

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Registrierung fehlgeschlagen.");
      return;
    }

    // Auto sign-in after registration
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.ok) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login";
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* LEFT panel */}
      <div style={{
        width: "42%", flexShrink: 0,
        background: "linear-gradient(160deg, #060d1a 0%, #0a1628 50%, #071020 100%)",
        padding: "48px 40px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }} className="hide-sm">
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <Link href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #2563EB, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.02em" }}>
            Website<span style={{ color: "#2563EB" }}>Fix</span>
          </span>
        </Link>

        <div>
          <h2 style={{ fontSize: "clamp(22px, 2.5vw, 30px)", fontWeight: 800, color: "#fff", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Starte dein Agentur-Business<br />auf Autopilot.
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 36px", lineHeight: 1.7 }}>
            Kostenlos starten. Keine Kreditkarte nötig.
          </p>
          {[
            "White-Label Reports ab Agency Core",
            "BFSG 2025 automatisch überwacht",
            "Jira · Trello · Asana direkt verbunden",
            "ROI ab dem ersten Monat",
          ].map(item => (
            <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E", flexShrink: 0, marginTop: 2 }}>✓</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Schon dabei:</p>
          <div style={{ display: "flex", gap: -8 }}>
            {["M", "S", "T"].map((l, i) => (
              <div key={l} style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${220 + i * 30}, 70%, 50%)`, border: "2px solid #0b0c10", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", marginLeft: i > 0 ? -8 : 0 }}>{l}</div>
            ))}
            <span style={{ marginLeft: 10, fontSize: 13, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>
              Agenturen nutzen WebsiteFix
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT panel */}
      <div style={{ flex: 1, background: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 40px", minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <Link href="/" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none" }}>← Zurück</Link>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            Schon registriert?{" "}
            <Link href="/login" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>Anmelden</Link>
          </span>
        </div>

        <div style={{ maxWidth: 380, width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.025em", color: "#0F172A" }}>
            Account erstellen
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 32px", lineHeight: 1.6 }}>
            Kostenlos starten — kein Plan nötig.
          </p>

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
            background: "#fff", color: "#0F172A", cursor: "pointer",
            border: "1.5px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Mit Google registrieren
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            <span style={{ fontSize: 12, color: "#94A3B8" }}>oder mit E-Mail</span>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          </div>

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Name", type: "text", value: name, set: setName, ph: "Dein Name" },
              { label: "E-Mail", type: "email", value: email, set: setEmail, ph: "du@agentur.de" },
              { label: "Passwort", type: "password", value: password, set: setPassword, ph: "Mindestens 8 Zeichen" },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                <input
                  type={f.type} value={f.value} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph} required
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 14, color: "#0F172A", outline: "none", background: "#FAFBFC", boxSizing: "border-box" }}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: loading ? "#93C5FD" : "#2563EB",
              color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
            }}>
              {loading ? "Bitte warten…" : "Account erstellen →"}
            </button>

            <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", lineHeight: 1.5 }}>
              Mit der Registrierung stimmst du unseren{" "}
              <Link href="/agb" style={{ color: "#2563EB", textDecoration: "none" }}>AGB</Link>
              {" "}und der{" "}
              <Link href="/datenschutz" style={{ color: "#2563EB", textDecoration: "none" }}>Datenschutzerklärung</Link>
              {" "}zu.
            </p>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[{ label: "Impressum", href: "/impressum" }, { label: "Datenschutz", href: "/datenschutz" }, { label: "AGB", href: "/agb" }].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 12, color: "#94A3B8", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#CBD5E1" }}>{`© ${new Date().getFullYear()} website-fix.com`}</p>
        </div>
      </div>
    </div>
  );
}
