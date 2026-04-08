"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginClient() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", {
      email, password, redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("E-Mail oder Passwort falsch.");
    } else {
      window.location.href = "/dashboard";
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setForgotSent(true);
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  if (mode === "forgot") {
    return (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.025em", color: "#0F172A" }}>
          Passwort vergessen
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 32px", lineHeight: 1.6 }}>
          Gib deine E-Mail ein — wir schicken dir einen Reset-Link.
        </p>

        {forgotSent ? (
          <div style={{ padding: "18px 20px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 10, marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#15803D", fontWeight: 500 }}>
              Falls ein Account existiert, erhältst du in Kürze eine E-Mail mit dem Reset-Link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <InputField label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="du@agentur.de" />
            {error && <ErrorMsg msg={error} />}
            <SubmitButton loading={loading} label="Reset-Link senden" />
          </form>
        )}

        <button onClick={() => { setMode("login"); setForgotSent(false); }} style={{ marginTop: 20, background: "none", border: "none", color: "#2563EB", fontSize: 14, cursor: "pointer", padding: 0, fontWeight: 500 }}>
          ← Zurück zum Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.025em", color: "#0F172A" }}>
        Willkommen zurück
      </h1>
      <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 32px", lineHeight: 1.6 }}>
        Meld dich an, um auf dein Dashboard zuzugreifen.
      </p>

      {/* Google */}
      <button onClick={handleGoogle} disabled={loading} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
        background: "#fff", color: "#0F172A", cursor: "pointer",
        border: "1.5px solid #E2E8F0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        marginBottom: 20,
      }}>
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.5-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.5 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
        Mit Google anmelden
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
        <span style={{ fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>oder mit E-Mail</span>
        <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
      </div>

      {/* Credentials form */}
      <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <InputField label="E-Mail" type="email" value={email} onChange={setEmail} placeholder="du@agentur.de" />
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Passwort</label>
            <button type="button" onClick={() => setMode("forgot")} style={{ fontSize: 12, color: "#2563EB", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>
              Passwort vergessen?
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mindestens 8 Zeichen"
            required
            style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 14, color: "#0F172A", outline: "none", background: "#FAFBFC", boxSizing: "border-box" }}
          />
        </div>

        {error && <ErrorMsg msg={error} />}
        <SubmitButton loading={loading} label="Anmelden" />
      </form>

      <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#64748B" }}>
        Noch kein Account?{" "}
        <Link href="/register" style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}>
          Kostenlos registrieren
        </Link>
      </p>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #F1F5F9", display: "flex", gap: 16, justifyContent: "center" }}>
        {["WCAG 2.1", "BFSG-ready", "White-Label"].map(badge => (
          <span key={badge} style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            ✓ {badge}
          </span>
        ))}
      </div>
    </div>
  );
}

function InputField({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required
        style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 14, color: "#0F172A", outline: "none", background: "#FAFBFC", boxSizing: "border-box" }}
      />
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>
      {msg}
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: "100%", padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
      background: loading ? "#93C5FD" : "#2563EB",
      color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
      boxShadow: "0 4px 14px rgba(37,99,235,0.25)",
      transition: "background 0.15s",
    }}>
      {loading ? "Bitte warten…" : label}
    </button>
  );
}
