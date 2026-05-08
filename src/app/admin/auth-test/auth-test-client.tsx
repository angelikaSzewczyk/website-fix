"use client";

import { useState } from "react";

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; reportTo: string; sentAt: string; hint: string; sentTo: string }
  | { kind: "error"; message: string };

export default function AuthTestClient({ adminEmail }: { adminEmail: string }) {
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [target, setTarget] = useState<string>("check-auth@verifier.port25.com");

  async function trigger() {
    setResult({ kind: "loading" });
    try {
      const res = await fetch("/api/admin/auth-test", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ to: target }),
      });
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
        sentTo:   data.sentTo,
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
          Mail-Auth-Test
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
          Schickt eine Test-Mail an einen Auth-Verifier deiner Wahl. Empfohlen:{" "}
          <strong style={{ color: "#fff" }}>dkimvalidator.com</strong> — der Report erscheint im
          Browser ohne Mail-Reply (umgeht Reply-Probleme bei jungen Domains).
        </p>

        {/* Empfänger-Auswahl */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)",
                      letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Empfänger
          </p>
          <input
            type="email"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="z.B. abc123@dkimvalidator.com"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 9,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#fff", fontSize: 13.5,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          />
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setTarget("check-auth@verifier.port25.com")}
              style={presetBtn(target === "check-auth@verifier.port25.com")}
            >
              Port25
            </button>
            <a
              href="https://dkimvalidator.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "5px 11px", borderRadius: 6,
                background: "rgba(122,166,255,0.12)",
                border: "1px solid rgba(122,166,255,0.30)",
                color: "#7aa6ff", fontSize: 11, fontWeight: 700,
                textDecoration: "none",
              }}
            >
              dkimvalidator.com → Adresse holen ↗
            </a>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>
            Workflow für dkimvalidator: Tab öffnen → eindeutige Wegwerf-Adresse kopieren → hier eintragen → Test-Mail senden → zurück zu dkimvalidator → "View Results".
          </p>
        </div>

        <button
          onClick={trigger}
          disabled={result.kind === "loading" || !target.includes("@")}
          style={{
            padding: "12px 24px", borderRadius: 10,
            background: (result.kind === "loading" || !target.includes("@"))
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(90deg, #7C3AED, #A78BFA)",
            color: "#fff", fontSize: 14, fontWeight: 800,
            border: "none",
            cursor: result.kind === "loading" ? "wait" : "pointer",
            fontFamily: "inherit",
            opacity: (result.kind === "loading" || !target.includes("@")) ? 0.5 : 1,
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
              ✓ Mail verschickt an {result.sentTo}
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

function presetBtn(active: boolean): React.CSSProperties {
  return {
    padding: "5px 11px", borderRadius: 6,
    background: active ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? "rgba(167,139,250,0.40)" : "rgba(255,255,255,0.10)"}`,
    color: active ? "#a78bfa" : "rgba(255,255,255,0.55)",
    fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  };
}
