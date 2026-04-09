"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type Branding = {
  agencyName: string;
  agencyColor: string;
  agencyLogo: string | null;
};

export default function WidgetPage() {
  const params   = useParams();
  const router   = useRouter();
  const agencyId = params.agencyId as string;

  const [branding, setBranding]   = useState<Branding | null>(null);
  const [url, setUrl]             = useState("");
  const [email, setEmail]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Fetch agency branding from a lightweight endpoint
  useEffect(() => {
    fetch(`/api/widget/branding?agencyId=${encodeURIComponent(agencyId)}`)
      .then(r => r.json())
      .then(d => {
        if (d.agencyName) setBranding(d);
      })
      .catch(() => null);
  }, [agencyId]);

  const primary = branding?.agencyColor ?? "#007BFF";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url || !email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/widget/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, url, email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Fehler beim Scan"); return; }
      // Redirect to thank-you page with result
      const params = new URLSearchParams({
        score:       String(data.score ?? 0),
        agency:      data.agencyName ?? "",
        color:       data.agencyColor ?? primary,
        url,
      });
      router.push(`/widget/${agencyId}/thank-you?${params.toString()}`);
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  const name = branding?.agencyName ?? "Deine Agentur";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0c10",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, overflow: "hidden",
        boxShadow: `0 0 60px ${primary}18`,
      }}>

        {/* Header */}
        <div style={{
          padding: "28px 28px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: `linear-gradient(135deg, ${primary}18, transparent)`,
        }}>
          {branding?.agencyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.agencyLogo} alt={name} style={{ height: 32, marginBottom: 16, objectFit: "contain" }} />
          ) : (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16,
              padding: "5px 14px", borderRadius: 20,
              background: `${primary}18`, border: `1px solid ${primary}35`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: primary }}>{name}</span>
            </div>
          )}
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            Gratis Barrierefreiheits-Check
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            KI-Analyse deiner Website in Sekunden — kostenlos und unverbindlich.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px 28px" }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Website-URL
            </label>
            <input
              type="url"
              placeholder="https://deine-website.de"
              value={url}
              onChange={e => setUrl(e.target.value)}
              required
              style={{
                width: "100%", padding: "11px 14px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${url ? `${primary}40` : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10, color: "#fff", fontSize: 14,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Deine E-Mail (für den Bericht)
            </label>
            <input
              type="email"
              placeholder="name@beispiel.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "11px 14px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${email ? `${primary}40` : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10, color: "#fff", fontSize: 14,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 14, padding: "10px 14px", borderRadius: 8,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              fontSize: 13, color: "#ef4444",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px",
              background: loading ? "rgba(255,255,255,0.05)" : primary,
              color: loading ? "rgba(255,255,255,0.3)" : "#fff",
              border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : `0 4px 16px ${primary}40`,
              transition: "all 0.15s",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "rgba(255,255,255,0.6)",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                Analyse läuft…
              </span>
            ) : "Kostenlos analysieren →"}
          </button>

          <p style={{ margin: "14px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6 }}>
            Kein Spam. Deine Daten werden nur für die Analyse verwendet.
          </p>
        </form>

        {/* Footer */}
        <div style={{
          padding: "12px 28px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Powered by</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>WebsiteFix</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
