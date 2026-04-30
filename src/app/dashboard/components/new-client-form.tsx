"use client";

/**
 * NewClientForm — der einzige Eingang in saved_websites für Agency-User.
 *
 * Phase 3 Sprint 11 Refactor: vorher war das Modal ein <form action="/dashboard/scan"
 * method="GET">. Effekt: clientName landete als URL-Parameter — wurde aber
 * NIE in der DB gespeichert. Beim Scan tauchte die URL zwar in scans + saved_websites
 * auf, aber ohne den eingegebenen Namen. UI zeigte stattdessen den Hostname als
 * Fallback. "Kundenname"-Feld war reine Optik.
 *
 * Jetzt:
 *   1. POST /api/websites mit url + name + isCustomerProject=true.
 *      Server upsertet, gibt RETURNING id zurück.
 *   2. Bei Erfolg redirect zu /dashboard/scan?websiteId=<id>&url=<url>.
 *      Damit hat der Scan-Flow vom ersten Moment an die persistierte ID
 *      und kann sie an scans.url-Joins binden.
 *
 * Der Server speichert is_customer_project=true automatisch, damit der
 * Power-Switcher und die Kunden-Matrix den Eintrag direkt als Kundenprojekt
 * sehen.
 */

import { useState } from "react";
import ModalCloseButton from "./ModalCloseButton";

const C = {
  bg:        "#0b0c10",
  card:      "rgba(255,255,255,0.025)",
  border:    "rgba(255,255,255,0.08)",
  text:      "rgba(255,255,255,0.92)",
  textSub:   "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.4)",
  blue:      "#7aa6ff",
  red:       "#f87171",
};

export default function NewClientForm() {
  const [name, setName]       = useState("");
  const [url, setUrl]         = useState("");
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    let cleanUrl    = url.trim();
    if (!cleanUrl) {
      setError("Bitte eine Website-URL eintragen.");
      return;
    }
    if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = "https://" + cleanUrl;

    setBusy(true);
    try {
      const res = await fetch("/api/websites", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          url:               cleanUrl,
          name:              cleanName || null,
          isCustomerProject: true,
          clientLabel:       cleanName || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(typeof err.error === "string" ? err.error : "Speichern fehlgeschlagen.");
        setBusy(false);
        return;
      }

      const data = await res.json() as { website?: { id: string; url: string } };
      const id   = data.website?.id ?? null;

      // Redirect: id wenn vorhanden, sonst nur url als Fallback. Beide Pfade
      // führen zu einer funktionierenden Scan-Page; mit id kann der Scanner
      // direkt das saved_websites-Tupel verlinken.
      const params = new URLSearchParams();
      if (id) params.set("websiteId", id);
      params.set("url", cleanUrl);
      window.location.href = `/dashboard/scan?${params.toString()}`;
    } catch {
      setError("Verbindung zum Server unterbrochen.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 5 }}>
          Kundenname
        </label>
        <input
          name="clientName"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="z.B. Autohaus Müller GmbH"
          autoComplete="off"
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 9,
            border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text,
            background: C.bg, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 5 }}>
          Website-URL
        </label>
        <input
          name="url"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://kunde-website.de"
          required
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 9,
            border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text,
            background: C.bg, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>
      {error && (
        <div style={{
          padding: "8px 12px", borderRadius: 8,
          background: "rgba(248,113,113,0.10)",
          border: "1px solid rgba(248,113,113,0.28)",
          color: C.red, fontSize: 12, fontWeight: 600,
        }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          type="submit"
          disabled={busy || !url.trim()}
          style={{
            flex: 1, padding: "11px 0", borderRadius: 10,
            background: busy ? "rgba(122,166,255,0.55)" : C.blue,
            color: "#fff", fontWeight: 800, fontSize: 14,
            border: "none",
            cursor: busy || !url.trim() ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            boxShadow: "0 2px 12px rgba(37,99,235,0.3)",
            opacity: !url.trim() ? 0.6 : 1,
          }}
        >
          {busy ? "Speichern…" : "Ersten Scan starten →"}
        </button>
        <ModalCloseButton style={{
          padding: "11px 18px", borderRadius: 10,
          background: C.bg, border: `1px solid ${C.border}`,
          color: C.textSub, fontWeight: 700, fontSize: 13,
          display: "flex", alignItems: "center",
        }}>
          Abbrechen
        </ModalCloseButton>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>
        Der Kundenname wird sofort gespeichert — du findest ihn anschließend in der Kunden-Matrix wieder.
      </p>
    </form>
  );
}
