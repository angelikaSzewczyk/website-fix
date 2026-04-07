"use client";

import { useState } from "react";
import Link from "next/link";
import NavAuthLink from "../components/nav-auth-link";

type ScanState = "idle" | "scanning" | "done" | "error";
type ActiveTab = "website" | "wcag";

const WEBSITE_CHECKS = [
  { label: "WordPress-Fehler", desc: "Critical Error, White Screen, 500er" },
  { label: "SEO Grundlagen", desc: "Title, Meta, H1, Canonical, Indexierung" },
  { label: "robots.txt & Sitemap", desc: "Vorhanden und korrekt konfiguriert?" },
  { label: "HTTPS", desc: "Verschlüsselte Verbindung aktiv?" },
  { label: "Formular-Check", desc: "Kontaktformular vorhanden?" },
  { label: "Erreichbarkeit", desc: "Lädt die Seite überhaupt?" },
];

const WCAG_CHECKS = [
  { label: "Alt-Texte", desc: "Bilder ohne Beschreibung für Screenreader" },
  { label: "Formular-Labels", desc: "Eingabefelder korrekt beschriftet?" },
  { label: "HTML lang-Attribut", desc: "Sprache für Screenreader definiert?" },
  { label: "Tastatur-Navigation", desc: "Alle Links und Buttons erreichbar?" },
  { label: "Heading-Struktur", desc: "Überschriften logisch strukturiert?" },
  { label: "Button-Namen", desc: "Alle Buttons haben aussagekräftige Labels?" },
];

const MANUAL_CHECKS = [
  { title: "Alt-Text Qualität", desc: "Macht der Alt-Text im Kontext wirklich Sinn?" },
  { title: "Tab-Reihenfolge", desc: "Ist die Tastatur-Navigation logisch und intuitiv?" },
  { title: "Screenreader-Bedienbarkeit", desc: "Formulare und Dialoge mit echtem Screenreader testen." },
  { title: "Video-Untertitel", desc: "Sind Videos mit korrekten Untertiteln versehen?" },
  { title: "Sprache & Verständlichkeit", desc: "Verständlich für Menschen mit kognitiven Einschränkungen?" },
  { title: "Fokus-Sichtbarkeit", desc: "Ist der Fokus-Ring bei allen Elementen klar sichtbar?" },
  { title: "Animationen", desc: "Animationen mit prefers-reduced-motion Support?" },
];

function renderDiagnose(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h3 key={i} style={{ fontSize: 16, margin: "20px 0 8px", fontWeight: 700, color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8 }}>{line.replace("## ", "")}</h3>;
    if (line.startsWith("**🔴")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: "#ff6b6b", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟡")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: "#ffd93d", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.startsWith("**🟢")) return <div key={i} style={{ margin: "10px 0 4px", fontWeight: 600, color: "#8df3d3", fontSize: 14 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.match(/^\d+\./)) return <div key={i} style={{ margin: "4px 0", paddingLeft: 16, color: "rgba(255,255,255,0.75)", fontSize: 14, lineHeight: 1.7 }}>{line}</div>;
    if (line.startsWith("# ")) return null;
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    return <p key={i} style={{ margin: "3px 0", color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7 }}>{line}</p>;
  });
}

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("website");

  const [url, setUrl] = useState("");
  const [state, setState] = useState<ScanState>("idle");
  const [diagnose, setDiagnose] = useState("");
  const [error, setError] = useState("");

  const [wcagUrl, setWcagUrl] = useState("");
  const [wcagState, setWcagState] = useState<ScanState>("idle");
  const [wcagDiagnose, setWcagDiagnose] = useState("");
  const [wcagViolationCount, setWcagViolationCount] = useState(0);
  const [wcagError, setWcagError] = useState("");

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!url || state === "scanning") return;
    setState("scanning"); setDiagnose(""); setError("");
    try {
      const res = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (data.success) { setDiagnose(data.diagnose); setState("done"); }
      else { setError(data.error || "Etwas ist schiefgelaufen."); setState("error"); }
    } catch { setError("Verbindungsfehler. Bitte versuche es erneut."); setState("error"); }
  }

  async function handleWcagScan(e: React.FormEvent) {
    e.preventDefault();
    if (!wcagUrl || wcagState === "scanning") return;
    setWcagState("scanning"); setWcagDiagnose(""); setWcagError(""); setWcagViolationCount(0);
    try {
      const res = await fetch("/api/wcag-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: wcagUrl }) });
      const data = await res.json();
      if (data.success) { setWcagDiagnose(data.diagnose); setWcagViolationCount(data.violationCount); setWcagState("done"); }
      else { setWcagError(data.error || "Etwas ist schiefgelaufen."); setWcagState("error"); }
    } catch { setWcagError("Verbindungsfehler."); setWcagState("error"); }
  }

  const inputStyle = {
    flex: 1, minWidth: 260,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "12px 16px", color: "#fff" as const, fontSize: 15, outline: "none",
  };

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <NavAuthLink />
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* HERO */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
            Website scannen
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            URL eingeben — KI erklärt was kaputt ist. Kostenlos, ohne Anmeldung.
          </p>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {([
            { key: "website" as ActiveTab, label: "Website-Check" },
            { key: "wcag" as ActiveTab, label: "Barrierefreiheit (WCAG)" },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.35)",
              borderBottom: activeTab === tab.key ? "2px solid #fff" : "2px solid transparent",
              marginBottom: -1,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* WEBSITE-CHECK */}
        {activeTab === "website" && (
          <>
            <form onSubmit={handleScan} style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
              <label htmlFor="scan-url" className="sr-only">Website-URL eingeben</label>
              <input id="scan-url" type="text" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://deine-website.de" disabled={state === "scanning"} style={inputStyle} />
              <button type="submit" disabled={state === "scanning" || !url} style={{
                padding: "12px 24px", borderRadius: 10, border: "none",
                background: !url || state === "scanning" ? "rgba(255,255,255,0.08)" : "#fff",
                color: !url || state === "scanning" ? "rgba(255,255,255,0.3)" : "#0b0c10",
                fontWeight: 700, fontSize: 14, cursor: !url || state === "scanning" ? "not-allowed" : "pointer",
              }}>
                {state === "scanning" ? "Scannt..." : "Jetzt scannen"}
              </button>
            </form>

            {state === "scanning" && (
              <div style={{ padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 24 }}>
                {["Website abrufen...", "HTML analysieren...", "SEO & Technik prüfen...", "KI erstellt Diagnose..."].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: i < 3 ? 10 : 0 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#8df3d3", flexShrink: 0 }} />
                    {s}
                  </div>
                ))}
              </div>
            )}

            {state === "error" && (
              <div style={{ padding: "14px 18px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 10, marginBottom: 24 }}>
                <p style={{ margin: 0, color: "#ff6b6b", fontSize: 14 }}>{error}</p>
              </div>
            )}

            {state === "done" && diagnose && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8df3d3" }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>Scan abgeschlossen — {url}</span>
                  </div>
                  <button onClick={() => { setState("idle"); setUrl(""); setDiagnose(""); }} style={{
                    fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", padding: "6px 14px",
                  }}>
                    Neuer Scan
                  </button>
                </div>

                <div style={{ padding: "28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 16 }}>
                  {renderDiagnose(diagnose)}
                </div>

                <div style={{ padding: "24px 28px", border: "1px solid rgba(141,243,211,0.15)", borderRadius: 12, background: "rgba(141,243,211,0.02)" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#8df3d3", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mehr Scans & Historie</p>
                  <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                    Mit einem kostenlosen Account speicherst du alle Scans und kannst Websites regelmäßig überwachen.
                  </p>
                  <Link href="/login" style={{
                    display: "inline-block", padding: "10px 20px", borderRadius: 9, textDecoration: "none",
                    background: "#fff", color: "#0b0c10", fontWeight: 700, fontSize: 14,
                  }}>
                    Kostenlos registrieren
                  </Link>
                </div>
              </div>
            )}

            {state === "idle" && (
              <div style={{ marginTop: 40 }}>
                <p style={{ margin: "0 0 20px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Was geprüft wird</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                  {WEBSITE_CHECKS.map((item, i) => (
                    <div key={i} style={{ padding: "20px 24px", background: "#0b0c10" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#8df3d3", marginBottom: 12 }} />
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* WCAG */}
        {activeTab === "wcag" && (
          <>
            <div style={{ marginBottom: 20, padding: "5px 12px", display: "inline-block", borderRadius: 16, border: "1px solid rgba(141,243,211,0.2)", fontSize: 12, color: "#8df3d3", fontWeight: 600 }}>
              WCAG 2.1 AA · axe-core · BFSG-relevant
            </div>

            <form onSubmit={handleWcagScan} style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
              <label htmlFor="wcag-url" className="sr-only">Website-URL für WCAG-Scan</label>
              <input id="wcag-url" type="text" value={wcagUrl} onChange={e => setWcagUrl(e.target.value)}
                placeholder="https://deine-website.de" disabled={wcagState === "scanning"} style={inputStyle} />
              <button type="submit" disabled={wcagState === "scanning" || !wcagUrl} style={{
                padding: "12px 24px", borderRadius: 10, border: "none",
                background: !wcagUrl || wcagState === "scanning" ? "rgba(255,255,255,0.08)" : "#fff",
                color: !wcagUrl || wcagState === "scanning" ? "rgba(255,255,255,0.3)" : "#0b0c10",
                fontWeight: 700, fontSize: 14, cursor: !wcagUrl || wcagState === "scanning" ? "not-allowed" : "pointer",
              }}>
                {wcagState === "scanning" ? "Scannt..." : "Jetzt prüfen"}
              </button>
            </form>

            {wcagState === "scanning" && (
              <div style={{ padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 24 }}>
                {["HTML abrufen...", "WCAG 2.1 Scan starten (50+ Kriterien)...", "Alt-Texte, Labels, Kontrast prüfen...", "KI erstellt Diagnose..."].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: i < 3 ? 10 : 0 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#8df3d3", flexShrink: 0 }} />
                    {s}
                  </div>
                ))}
              </div>
            )}

            {wcagState === "error" && (
              <div style={{ padding: "14px 18px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: 10, marginBottom: 24 }}>
                <p style={{ margin: 0, color: "#ff6b6b", fontSize: 14 }}>{wcagError}</p>
              </div>
            )}

            {wcagState === "done" && wcagDiagnose && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: wcagViolationCount === 0 ? "#8df3d3" : "#ff6b6b" }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      {wcagViolationCount === 0 ? "Keine WCAG-Verstöße gefunden" : `${wcagViolationCount} WCAG-Verstöße gefunden`}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>— {wcagUrl}</span>
                  </div>
                  <button onClick={() => { setWcagState("idle"); setWcagUrl(""); setWcagDiagnose(""); }} style={{
                    fontSize: 13, color: "rgba(255,255,255,0.4)", background: "none",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", padding: "6px 14px",
                  }}>
                    Neue Website
                  </button>
                </div>

                <div style={{ padding: "28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 16 }}>
                  {renderDiagnose(wcagDiagnose)}
                </div>

                {/* Manuelle Checks */}
                <div style={{ padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Transparenz</p>
                  <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Was dieser Scan nicht prüfen kann</h3>
                  <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                    Automatische Tools finden ~30–40% aller WCAG-Probleme. Diese Punkte brauchen einen manuellen Check:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {MANUAL_CHECKS.map((item, i) => (
                      <div key={i} style={{
                        padding: "12px 0",
                        borderBottom: i < MANUAL_CHECKS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        display: "flex", gap: 16,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.2)", paddingTop: 2, flexShrink: 0, width: 20 }}>0{i + 1}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: "16px 0 0", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                    Für vollständige BFSG-Konformität empfiehlt sich ein manueller Audit ergänzend zum automatischen Scan.
                  </p>
                </div>

                <Link href="/login" style={{
                  display: "inline-block", padding: "10px 20px", borderRadius: 9, textDecoration: "none",
                  background: "#fff", color: "#0b0c10", fontWeight: 700, fontSize: 14,
                }}>
                  Scan-Historie im Dashboard speichern
                </Link>
              </div>
            )}

            {wcagState === "idle" && (
              <div style={{ marginTop: 8 }}>
                <p style={{ margin: "0 0 20px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Was geprüft wird</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                  {WCAG_CHECKS.map((item, i) => (
                    <div key={i} style={{ padding: "20px 24px", background: "#0b0c10" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#8df3d3", marginBottom: 12 }} />
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                  Basiert auf axe-core — dem Standard-Tool für WCAG 2.1 AA. Seit dem 28. Juni 2025 gilt das BFSG in Deutschland.{" "}
                  <Link href="/blog/bfsg-2025-was-webagenturen-wissen-muessen" style={{ color: "#8df3d3" }}>Mehr erfahren</Link>
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{`© ${new Date().getFullYear()} website-fix.com`}</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Startseite</Link>
            <Link href="/impressum" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Impressum</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
