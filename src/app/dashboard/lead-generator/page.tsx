/**
 * Dashboard → Lead-Generator (Widget) — Placeholder.
 *
 * Diese Seite ist die Landing für das kommende White-Label Scan-Widget.
 * Aktueller Stand: Placeholder mit Mockup, bis das Embed-Script
 * generiert + ausgeliefert wird.
 *
 * Hinweis: Im selben Verzeichnis liegt `lead-generator-client.tsx`
 * mit der bereits gebauten Lead-Liste. Die wird später wieder
 * eingebunden, sobald die Widget-Pipeline live ist — entweder hier
 * unterhalb des Mockups (wenn Leads vorhanden) oder als eigene
 * Sub-Route /dashboard/lead-generator/leads.
 */

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { isAgency } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Lead-Generator (Widget) — WebsiteFix",
  robots: { index: false },
};

// Design-Tokens, damit die Seite mit dem dunklen Dashboard harmoniert.
const C = {
  bg:        "#080C14",
  card:      "rgba(255,255,255,0.03)",
  cardSolid: "#0F1623",
  border:    "rgba(255,255,255,0.07)",
  borderMid: "rgba(255,255,255,0.11)",
  text:      "#FFFFFF",
  textSub:   "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.35)",
  accent:    "#A78BFA",     // Agency-Violet (matched zur Sidebar)
  accentBg:  "rgba(167,139,250,0.10)",
  accentBd:  "rgba(167,139,250,0.30)",
  amber:     "#F59E0B",
  amberBg:   "rgba(245,158,11,0.12)",
  amberBd:   "rgba(245,158,11,0.30)",
} as const;

export default async function LeadGeneratorPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const plan = (session.user as { plan?: string }).plan ?? "starter";
  if (!isAgency(plan)) redirect("/dashboard");

  return (
    <main style={{ minHeight: "100vh", background: C.bg, padding: "40px 32px 80px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* ── Coming-Soon Pill ── */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 99, background: C.amberBg, border: `1px solid ${C.amberBd}`, marginBottom: 18 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.amber, boxShadow: `0 0 6px ${C.amber}` }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: C.amber, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            In Entwicklung
          </span>
        </div>

        {/* ── Title ── */}
        <h1 style={{ margin: "0 0 14px", fontSize: 34, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
          Dein persönliches White-Label Scan-Widget
        </h1>
        <p style={{ margin: "0 0 36px", fontSize: 16, color: C.textSub, lineHeight: 1.6, maxWidth: 680 }}>
          Generiere SEO-Leads direkt auf deiner Agentur-Website. Wir bereiten
          dein individuelles Embed-Script aktuell vor. Als Agency-Partner wirst
          du benachrichtigt, sobald dein Code aktiv ist.
        </p>

        {/* ── Mockup: Browser-Frame mit eingebettetem Widget ── */}
        <div
          aria-label="Mockup: Beispielhafte Einbettung des Scan-Widgets auf einer Agentur-Website"
          style={{
            position: "relative",
            background: C.cardSolid,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(167,139,250,0.06)",
            marginBottom: 36,
          }}
        >
          {/* Browser-Chrome */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px",
            background: "rgba(255,255,255,0.04)",
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E" }} />
              <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840" }} />
            </div>
            <div style={{
              flex: 1, padding: "5px 14px", borderRadius: 7,
              background: "rgba(0,0,0,0.35)",
              fontSize: 11, color: C.textMuted, fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
              border: `1px solid ${C.border}`,
            }}>
              https://deine-agentur.de
            </div>
          </div>

          {/* Page-Content (vereinfachtes Hero-Mockup) */}
          <div style={{ padding: "56px 48px 64px", position: "relative" }}>
            {/* Dezente Page-Skeleton-Elemente, damit das Widget herausschaut */}
            <div style={{ width: 220, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 14 }} />
            <div style={{ width: 380, height: 28, borderRadius: 5, background: "rgba(255,255,255,0.10)", marginBottom: 12 }} />
            <div style={{ width: 320, height: 12, borderRadius: 4, background: "rgba(255,255,255,0.04)", marginBottom: 8 }} />
            <div style={{ width: 290, height: 12, borderRadius: 4, background: "rgba(255,255,255,0.04)", marginBottom: 32 }} />

            {/* DAS EINGEBETTETE SCAN-WIDGET */}
            <div style={{
              maxWidth: 480,
              padding: "22px 22px 18px",
              borderRadius: 14,
              background: "linear-gradient(180deg, rgba(167,139,250,0.08), rgba(167,139,250,0.02))",
              border: `1.5px solid ${C.accentBd}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(167,139,250,0.10)",
              position: "relative",
            }}>
              {/* "Powered by" Badge oben rechts (Whitelabel-Indikator) */}
              <div style={{
                position: "absolute", top: -10, right: 16,
                fontSize: 9, fontWeight: 700, padding: "3px 9px",
                borderRadius: 99,
                background: C.accentBg,
                border: `1px solid ${C.accentBd}`,
                color: C.accent,
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Whitelabel
              </div>

              {/* Widget-Header */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Kostenlose SEO-Diagnose
                </p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: "-0.015em" }}>
                  Wie schneidet deine Website ab?
                </p>
              </div>

              {/* Input + Button */}
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  flex: 1, padding: "11px 14px", borderRadius: 9,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${C.borderMid}`,
                  fontSize: 13, color: C.textMuted,
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                }}>
                  https://kunde-website.de
                </div>
                <div style={{
                  padding: "11px 18px", borderRadius: 9,
                  background: C.accent,
                  color: "#0a0a0a", fontWeight: 800, fontSize: 13,
                  display: "flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap",
                  boxShadow: `0 4px 16px ${C.accent}55`,
                }}>
                  Jetzt scannen
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </div>

              {/* Trust-Row */}
              <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 10, color: C.textMuted }}>
                <span>· DSGVO-konform</span>
                <span>· 60 Sekunden</span>
                <span>· Keine Anmeldung</span>
              </div>
            </div>

            {/* Caption unter dem Widget */}
            <p style={{ marginTop: 20, fontSize: 11, color: C.textMuted, fontStyle: "italic" }}>
              ↑ So wird das Widget auf deiner Agentur-Website aussehen. Farbe + Logo dynamisch aus deinen Branding-Settings.
            </p>
          </div>
        </div>

        {/* ── Feature-Liste ── */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: "24px 28px",
          marginBottom: 28,
        }}>
          <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Was du bekommst
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {[
              { title: "1-Klick-Embed",     body: "Ein <script>-Snippet auf jeder Kundenseite — fertig." },
              { title: "Eigene Branding-Farbe", body: "Logo + Primärfarbe aus den Agency-Settings übernommen." },
              { title: "Lead-Capture",      body: "E-Mail-Eingabe für PDF-Report, Leads landen im Dashboard." },
              { title: "Conversion-Tracking", body: "Sieh, welche Embed-Position auf welcher Seite konvertiert." },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent, boxShadow: `0 0 6px ${C.accent}` }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.title}</span>
                </div>
                <span style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5, paddingLeft: 13 }}>
                  {f.body}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA-Hinweis ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderRadius: 12, background: C.accentBg, border: `1px solid ${C.accentBd}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>
              Du wirst automatisch benachrichtigt
            </div>
            <div style={{ fontSize: 12, color: C.textSub }}>
              Sobald dein individuelles Embed-Script aktiv ist, erhältst du eine E-Mail an die hinterlegte Account-Adresse mit Setup-Anleitung.
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
