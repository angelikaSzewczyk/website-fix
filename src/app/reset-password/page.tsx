"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwörter stimmen nicht überein."); return; }
    if (password.length < 8) { setError("Mindestens 8 Zeichen erforderlich."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Fehler beim Zurücksetzen."); return; }
    setDone(true);
  }

  return (
    <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2563EB,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 17, color: "#0F172A", letterSpacing: "-0.02em" }}>WebsiteFix</span>
      </div>

      {done ? (
        <div>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F0FDF4", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Passwort gesetzt</h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px", lineHeight: 1.6 }}>Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
          <Link href="/login" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 10, background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            Zum Login →
          </Link>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Neues Passwort</h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 28px", lineHeight: 1.6 }}>Gib dein neues Passwort ein.</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Neues Passwort", value: password, set: setPassword },
              { label: "Passwort bestätigen", value: confirm, set: setConfirm },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{f.label}</label>
                <input type="password" value={f.value} onChange={e => f.set(e.target.value)} placeholder="Mindestens 8 Zeichen" required
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 9, border: "1.5px solid #E2E8F0", fontSize: 14, color: "#0F172A", outline: "none", background: "#FAFBFC", boxSizing: "border-box" }} />
              </div>
            ))}
            {error && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626" }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: loading ? "#93C5FD" : "#2563EB", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Bitte warten…" : "Passwort speichern →"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Suspense fallback={<div style={{ color: "#64748B" }}>Lade…</div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
