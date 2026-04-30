"use client";

/**
 * WebsiteSettingsModal — Phase 3 Sprint 4.
 *
 * Editor für Multi-Tenancy-Felder pro Projekt:
 *   - is_customer_project: Toggle (eigenes vs. Kunden-Projekt)
 *   - client_label:        Optional Anzeige-Name des Endkunden
 *   - client_logo_url:     Optional URL zum Kunden-Logo (für White-Label-Reports)
 *
 * Wird von DashboardShell aus dem Power-Switcher aufgerufen, sobald der
 * User auf das Stift-Icon einer Project-Row klickt. Schickt PATCH an
 * /api/websites und ruft onSaved zurück, damit der Switcher die Liste
 * aktualisiert.
 */

import { useState, useEffect } from "react";

const D = {
  text:        "rgba(255,255,255,0.92)",
  textSub:     "rgba(255,255,255,0.55)",
  textMuted:   "rgba(255,255,255,0.4)",
  border:      "rgba(255,255,255,0.08)",
  borderStrong:"rgba(255,255,255,0.16)",
  divider:     "rgba(255,255,255,0.06)",
  blue:        "#007BFF",
  blueBg:      "rgba(0,123,255,0.10)",
  blueBorder:  "rgba(0,123,255,0.22)",
  red:         "#EF4444",
  radius:      14,
  radiusSm:    8,
};

export type WebsiteSettingsTarget = {
  id:                  string;
  url:                 string;
  name:                string | null;
  is_customer_project: boolean;
  client_label:        string | null;
  client_logo_url:     string | null;
};

type Props = {
  target:    WebsiteSettingsTarget;
  onClose:   () => void;
  /** Wird nach erfolgreichem Save mit dem aktualisierten Projekt aufgerufen.
   *  Parent (Power-Switcher) fetcht typischerweise die ganze Liste neu. */
  onSaved:   (updated: WebsiteSettingsTarget) => void;
};

export default function WebsiteSettingsModal({ target, onClose, onSaved }: Props) {
  const [isCustomer, setIsCustomer] = useState(target.is_customer_project);
  const [label, setLabel]           = useState(target.client_label ?? "");
  const [logoUrl, setLogoUrl]       = useState(target.client_logo_url ?? "");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // ESC-to-close — gängige Modal-UX.
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  let displayDomain = target.url;
  try { displayDomain = new URL(target.url).hostname.replace(/^www\./, ""); } catch { /* keep raw */ }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/websites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          is_customer_project: isCustomer,
          client_label:        label.trim() || null,
          client_logo_url:     logoUrl.trim() || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Speichern fehlgeschlagen");
        setSaving(false);
        return;
      }
      onSaved({
        ...target,
        is_customer_project: d.project.is_customer_project,
        client_label:        d.project.client_label,
        client_logo_url:     d.project.client_logo_url,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerk-Fehler");
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 250,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0f1623",
          border: `1px solid ${D.borderStrong}`,
          borderRadius: D.radius,
          padding: "24px 26px 22px",
          maxWidth: 480, width: "100%",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column", gap: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: D.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Projekt-Einstellungen
            </p>
            <h2 style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 800, color: D.text, letterSpacing: "-0.01em" }}>
              {target.name ?? displayDomain}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: D.textMuted }}>{displayDomain}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: "transparent", border: `1px solid ${D.border}`,
              color: D.textMuted, cursor: "pointer", padding: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Toggle: is_customer_project */}
        <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <button
            type="button"
            role="switch"
            aria-checked={isCustomer}
            onClick={() => setIsCustomer(v => !v)}
            style={{
              flexShrink: 0,
              width: 38, height: 22, borderRadius: 11,
              background: isCustomer ? "rgba(124,58,237,0.40)" : "rgba(255,255,255,0.10)",
              border: `1px solid ${isCustomer ? "rgba(124,58,237,0.6)" : D.border}`,
              cursor: "pointer", padding: 0, position: "relative",
              transition: "background 0.18s, border-color 0.18s",
            }}
          >
            <span style={{
              position: "absolute", top: 2, left: isCustomer ? 18 : 2,
              width: 16, height: 16, borderRadius: "50%",
              background: isCustomer ? "#a78bfa" : "rgba(255,255,255,0.55)",
              transition: "left 0.18s, background 0.18s",
            }} />
          </button>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: D.text, display: "block" }}>
              Als Kunden-Projekt markieren
            </span>
            <span style={{ fontSize: 11, color: D.textMuted, lineHeight: 1.5 }}>
              Erscheint im Power-Switcher unter „Kunden". Erforderlich für individuelles White-Label.
            </span>
          </div>
        </label>

        {/* Client label */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: D.textSub, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Kunden-Name (optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="z. B. Müller GmbH"
            disabled={!isCustomer}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px", borderRadius: D.radiusSm,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${D.border}`,
              color: isCustomer ? D.text : D.textMuted,
              fontSize: 13, fontFamily: "inherit", outline: "none",
              opacity: isCustomer ? 1 : 0.5,
            }}
          />
          <p style={{ margin: "5px 0 0", fontSize: 10.5, color: D.textMuted }}>
            Wird im Power-Switcher und in PDF-Reports statt der Domain angezeigt.
          </p>
        </div>

        {/* Client logo URL */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: D.textSub, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Kunden-Logo URL (optional)
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://kunde.de/logo.svg"
            disabled={!isCustomer}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "9px 12px", borderRadius: D.radiusSm,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${D.border}`,
              color: isCustomer ? D.text : D.textMuted,
              fontSize: 13, fontFamily: "inherit", outline: "none",
              opacity: isCustomer ? 1 : 0.5,
            }}
          />
          <p style={{ margin: "5px 0 0", fontSize: 10.5, color: D.textMuted }}>
            Direktlink (PNG/SVG/JPG). Wird im Print-Header der White-Label-Reports verwendet.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: "9px 12px", borderRadius: 8,
            background: "rgba(239,68,68,0.10)",
            border: "1px solid rgba(239,68,68,0.28)",
            fontSize: 12, color: "rgba(248,113,113,0.95)",
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4, borderTop: `1px solid ${D.divider}` }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 16px", borderRadius: D.radiusSm,
              background: "transparent",
              border: `1px solid ${D.borderStrong}`,
              color: D.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 18px", borderRadius: D.radiusSm,
              background: D.blue, border: "none", color: "#fff",
              fontSize: 13, fontWeight: 700,
              cursor: saving ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 2px 14px rgba(0,123,255,0.3)",
            }}
          >
            {saving ? "Speichere…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
