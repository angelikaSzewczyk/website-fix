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
import Link from "next/link";
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

/** Server-Antwort bei 402 limit_reached — siehe /api/websites/route.ts. */
type LimitReachedPayload = {
  error:        "limit_reached";
  message:      string;
  currentCount: number;
  limit:        number;
  plan:         string;
  upgradeTo:    string;
};

export default function NewClientForm() {
  const [name, setName]               = useState("");
  const [url, setUrl]                 = useState("");
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState<string | null>(null);
  /** Wenn gesetzt, ersetzt das Form das normale Submit durch eine
   *  Upsell-Card. Wird vom 402-Handler befüllt. */
  const [limitInfo, setLimitInfo] = useState<LimitReachedPayload | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLimitInfo(null);

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
        // 402 = Plan-Quota überschritten — statt Generic-Error rendern wir
        // ein attraktives Upsell-Element, damit der User den Pivot sofort
        // versteht und den Upgrade-Pfad direkt klicken kann.
        if (res.status === 402 && err?.error === "limit_reached") {
          setLimitInfo(err as LimitReachedPayload);
          setBusy(false);
          return;
        }
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

  // Upsell-Card statt Form-Submit, wenn Server 402 limit_reached zurückgibt.
  // User sieht sofort den Upgrade-Pfad mit konkreten Vorteilen — kein
  // generischer "Bitte upgrade"-Text. CTA linkt zur Pricing-Sektion.
  if (limitInfo) {
    return (
      <div style={{
        background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(122,166,255,0.04))",
        border: "1px solid rgba(16,185,129,0.32)",
        borderRadius: 14, padding: "26px 24px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 11px", borderRadius: 8, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", alignSelf: "flex-start" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: "#10B981", letterSpacing: "0.06em", textTransform: "uppercase" }}>Limit erreicht</span>
        </div>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
            Bereit für mehr Sites?
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: C.textSub, lineHeight: 1.6 }}>
            Dein Starter-Plan deckt 1 Website ab. Mit <strong style={{ color: C.text }}>Professional (89 €/Monat)</strong> verwaltest du bis zu <strong style={{ color: C.text }}>10 Projekte</strong>, bekommst <strong style={{ color: C.text }}>alle Rescue-Guides inklusive</strong> und nutzt das volle Portfolio-Dashboard.
          </p>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            "10 Projekte statt 1",
            "Alle Smart-Fix-Anleitungen ohne Einzelkauf (sonst 9,90 € pro Stück)",
            "KI-Smart-Fix-Drawer + Score-Verlauf + Asana/Slack-Integration",
            "25 Scans/Monat statt 5",
          ].map(b => (
            <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/?plan=professional#pricing"
            style={{
              flex: 1, minWidth: 200, padding: "12px 18px", borderRadius: 10,
              background: "#10B981", border: "1px solid rgba(16,185,129,0.55)",
              color: "#0b0c10", fontSize: 13.5, fontWeight: 800,
              textAlign: "center", textDecoration: "none",
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
            }}
          >
            Auf Professional upgraden →
          </Link>
          <button
            type="button"
            onClick={() => { setLimitInfo(null); setUrl(""); }}
            style={{
              padding: "12px 16px", borderRadius: 10,
              background: "transparent", border: `1px solid ${C.border}`,
              color: C.textSub, fontSize: 12.5, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Vielleicht später
          </button>
        </div>
      </div>
    );
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
