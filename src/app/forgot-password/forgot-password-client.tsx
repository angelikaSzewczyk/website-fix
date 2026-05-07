"use client";

/**
 * /forgot-password — zwei UX-Modi in einer Page:
 *
 *  1. Anonymous-Pay-per-Fix-Bridge: kommt mit ?email=<käuferemail> aus der
 *     Stripe-Success-Page. Wir feuern automatisch einen forgot-password-Call,
 *     zeigen direkt "Wir haben dir eine Mail geschickt" — User muss seine
 *     Email NICHT erneut eintippen.
 *
 *  2. Klassischer Reset-Flow: User landet ohne URL-Param, gibt seine Email
 *     ein, klickt "Reset-Link senden" → Mail kommt, Page zeigt Bestätigung.
 *
 * Backend: /api/auth/forgot-password antwortet IMMER mit {ok:true} (silent
 * gegen Email-Enumeration). Wir vertrauen drauf und zeigen Erfolg, auch
 * wenn die Email gar nicht in der DB ist.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const T = {
  bg:        "#0b0c10",
  card:      "rgba(255,255,255,0.03)",
  border:    "rgba(255,255,255,0.10)",
  borderStr: "rgba(255,255,255,0.18)",
  text:      "rgba(255,255,255,0.92)",
  textSub:   "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.42)",
  green:     "#22c55e",
  greenBg:   "rgba(34,197,94,0.10)",
  greenBdr:  "rgba(34,197,94,0.32)",
  red:       "#f87171",
} as const;

export default function ForgotPasswordClient() {
  const params  = useSearchParams();
  const initial = params.get("email")?.trim() ?? "";

  const [email,    setEmail]    = useState(initial);
  const [state,    setState]    = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-Submit wenn ?email= aus dem Anon-Pay-per-Fix-Flow kommt.
  // User soll keine Email zwei Mal eintippen müssen.
  useEffect(() => {
    if (initial && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(initial)) {
      void submit(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(targetEmail: string) {
    if (state === "sending") return;
    setState("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok === false) {
        setErrorMsg(data.error ?? `HTTP ${res.status}`);
        setState("error");
        return;
      }
      setState("sent");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Verbindungsfehler");
      setState("error");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    void submit(email.trim());
  }

  return (
    <main style={{
      background: T.bg, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "48px 24px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: T.text,
    }}>
      <div style={{ maxWidth: 460, width: "100%" }}>

        {/* ── Erfolg-State ───────────────────────────────────────────────── */}
        {state === "sent" && (
          <div style={{
            padding: "32px 28px", borderRadius: 16,
            background: T.greenBg, border: `1px solid ${T.greenBdr}`,
            boxShadow: "0 0 32px rgba(34,197,94,0.10)",
            textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
              background: "rgba(34,197,94,0.16)", border: `1px solid ${T.greenBdr}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.green}
                   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>
              Mail unterwegs
            </h1>
            <p style={{ margin: "0 0 20px", fontSize: 13.5, color: T.textSub, lineHeight: 1.65 }}>
              Wir haben dir an <strong style={{ color: T.text }}>{email}</strong> einen Link geschickt,
              um dein Passwort zu setzen. Schau auch in den Spam-Ordner —
              kommt meistens innerhalb von 30 Sekunden.
            </p>
            <p style={{ margin: "0 0 22px", fontSize: 11.5, color: T.textMuted, lineHeight: 1.55 }}>
              Der Link ist 1 Stunde gültig. Falls keine Mail ankommt:{" "}
              <button
                type="button"
                onClick={() => submit(email)}
                style={{
                  background: "none", border: "none", padding: 0,
                  color: T.green, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                  textDecoration: "underline",
                }}
              >
                erneut senden
              </button>
              {" "}oder{" "}
              <a href="mailto:support@website-fix.com" style={{ color: T.green, fontWeight: 700 }}>
                Support kontaktieren
              </a>.
            </p>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 9,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${T.borderStr}`,
              color: T.text, fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>
              Zum Login
            </Link>
          </div>
        )}

        {/* ── Form-State (idle / sending / error) ────────────────────────── */}
        {state !== "sent" && (
          <div style={{
            padding: "32px 28px", borderRadius: 16,
            background: T.card, border: `1px solid ${T.border}`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          }}>
            <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", textAlign: "center" }}>
              {initial ? "Passwort setzen" : "Passwort zurücksetzen"}
            </h1>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: T.textSub, lineHeight: 1.6, textAlign: "center" }}>
              {initial
                ? "Wir senden einen Link an deine Email — Klick darauf, vergibt ein Passwort, fertig."
                : "Trag deine Email ein — wir schicken dir einen Link zum Passwort-Reset."}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted,
                              letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Email-Adresse
              </label>
              <input
                type="email"
                required
                autoFocus
                disabled={state === "sending"}
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dein@email.de"
                style={{
                  padding: "11px 14px", borderRadius: 9, fontSize: 14, fontFamily: "inherit",
                  background: "rgba(0,0,0,0.32)",
                  border: `1px solid ${T.border}`,
                  color: T.text, outline: "none",
                }}
              />

              <button
                type="submit"
                disabled={state === "sending" || !email.trim()}
                style={{
                  marginTop: 6,
                  padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 800,
                  background: state === "sending"
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(90deg,#059669,#10B981)",
                  color: state === "sending" ? T.textMuted : "#fff",
                  border: "none", cursor: state === "sending" ? "default" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: state === "sending" ? "none" : "0 4px 14px rgba(16,185,129,0.32)",
                }}
              >
                {state === "sending" ? "Sende Link…" : "Reset-Link senden"}
              </button>

              {state === "error" && errorMsg && (
                <p style={{
                  margin: 0, padding: "9px 12px", borderRadius: 8,
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.30)",
                  color: T.red, fontSize: 12, lineHeight: 1.55,
                }}>
                  {errorMsg}
                </p>
              )}
            </form>

            <p style={{
              margin: "20px 0 0", fontSize: 11.5, color: T.textMuted,
              textAlign: "center", lineHeight: 1.55,
            }}>
              <Link href="/login" style={{ color: T.textSub, textDecoration: "none", fontWeight: 600 }}>
                ← Zurück zum Login
              </Link>
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
