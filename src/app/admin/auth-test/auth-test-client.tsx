"use client";

import { useState } from "react";

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; reportTo: string; sentAt: string; hint: string }
  | { kind: "error"; message: string };

export default function AuthTestClient({ adminEmail }: { adminEmail: string }) {
  const [result, setResult] = useState<Result>({ kind: "idle" });

  async function trigger() {
    setResult({ kind: "loading" });
    try {
      const res = await fetch("/api/admin/auth-test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? "Unknown error" });
        return;
      }
      setResult({
        kind:     "ok",
        reportTo: data.reportTo,
        sentAt:   data.sentAt,
        hint:     data.hint,
      });
    } catch (err) {
      setResult({
        kind:    "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <main style={{
      minHeight: "100vh", background: "#0b0c10", color: "rgba(255,255,255,0.92)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "60px 24px",
    }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Mail-Auth-Test (Port25 Verifier)
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
          Schickt eine Test-Mail an <code style={mono}>check-auth@verifier.port25.com</code>.
          Port25 antwortet ~1 Min später mit einem kompletten SPF/DKIM/DMARC-Report — der
          Bericht landet in deinem Postfach unter <strong style={{ color: "#fff" }}>{adminEmail}</strong>.
        </p>

        <button
          onClick={trigger}
          disabled={result.kind === "loading"}
          style={{
            padding: "12px 24px", borderRadius: 10,
            background: result.kind === "loading"
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(90deg, #7C3AED, #A78BFA)",
            color: "#fff", fontSize: 14, fontWeight: 800,
            border: "none",
            cursor: result.kind === "loading" ? "wait" : "pointer",
            fontFamily: "inherit",
            opacity: result.kind === "loading" ? 0.5 : 1,
          }}
        >
          {result.kind === "loading" ? "Sende Test-Mail…" : "Test-Mail senden"}
        </button>

        {result.kind === "ok" && (
          <div style={{
            marginTop: 24, padding: "20px 22px", borderRadius: 12,
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.30)",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#4ade80" }}>
              ✓ Mail an Port25 verschickt
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              {result.hint}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
              Sent: {result.sentAt}<br/>
              Report-To: {result.reportTo}
            </p>
          </div>
        )}

        {result.kind === "error" && (
          <div style={{
            marginTop: 24, padding: "20px 22px", borderRadius: 12,
            background: "rgba(248,113,113,0.06)",
            border: "1px solid rgba(248,113,113,0.30)",
          }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#fca5a5" }}>
              ✗ Fehler
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              {result.message}
            </p>
          </div>
        )}

        <div style={{
          marginTop: 36, padding: "16px 18px", borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 11.5, fontWeight: 800, color: "rgba(255,255,255,0.6)",
                      letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Was im Report drinsteht
          </p>
          <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
            <li>SPF check (pass / fail / softfail)</li>
            <li>DKIM signature validation</li>
            <li>DKIM-Author alignment (DMARC requirement)</li>
            <li>SpamAssassin Score (Ziel: &lt; 5.0)</li>
            <li>Sender-ID, Reverse-DNS, Connection-Info</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

const mono: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 4, padding: "1px 6px",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12.5,
};
