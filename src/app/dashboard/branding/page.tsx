"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function BrandingPage() {
  const [agencyName, setAgencyName]   = useState("");
  const [logoUrl, setLogoUrl]         = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [status, setStatus]           = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    fetch("/api/agency/settings")
      .then(r => r.json())
      .then(d => {
        setAgencyName(d.agencyName ?? "");
        setLogoUrl(d.logoUrl ?? "");
        setPrimaryColor(d.primaryColor ?? "#2563EB");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/agency/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyName, logoUrl, primaryColor }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B", textDecoration: "none", marginBottom: 24 }}>
          ← Zurück zum Dashboard
        </Link>

        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#0F172A" }}>White-Label Branding</h1>
        <p style={{ margin: "0 0 32px", fontSize: 14, color: "#64748B" }}>
          Ersetze das WebsiteFix-Logo durch dein eigenes und passe die Primärfarbe an.
          Verfügbar ab Agency Starter.
        </p>

        {loading ? (
          <div style={{ fontSize: 14, color: "#94A3B8" }}>Lade Einstellungen…</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Agenturname / Markenname
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  placeholder="z.B. Meine Agentur GmbH"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Logo-URL (https://)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://deine-domain.de/logo.svg"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A", outline: "none", boxSizing: "border-box" }}
                />
                {logoUrl && (
                  <div style={{ marginTop: 10, padding: "12px 16px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Vorschau</p>
                    <img src={logoUrl} alt="Logo Vorschau" style={{ height: 36, maxWidth: 200, objectFit: "contain" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Primärfarbe
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    style={{ width: 44, height: 44, border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", padding: 2 }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    placeholder="#2563EB"
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A", outline: "none", fontFamily: "monospace" }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{ padding: "12px 24px", borderRadius: 10, background: "#2563EB", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Wird gespeichert…" : "Einstellungen speichern"}
            </button>

            {status === "ok" && (
              <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 8, fontSize: 13, color: "#16A34A", fontWeight: 600 }}>
                Einstellungen gespeichert. Änderungen sind nach dem nächsten Seitenaufruf sichtbar.
              </div>
            )}
            {status === "error" && (
              <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>
                Fehler beim Speichern. Bitte prüfe die URL und versuche es erneut.
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
