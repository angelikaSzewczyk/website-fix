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
  { label: "HTTPS & SSL", desc: "Verschlüsselung aktiv und gültig?" },
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

const WEBSITE_STEPS = ["Website abrufen...", "HTML analysieren...", "SEO & Technik prüfen...", "KI erstellt Diagnose..."];
const WCAG_STEPS = ["HTML abrufen...", "WCAG 2.1 Scan starten (50+ Kriterien)...", "Alt-Texte, Labels, Kontrast prüfen...", "KI erstellt Diagnose..."];

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

function ChecksGrid({ checks }: { checks: { label: string; desc: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
      {checks.map((item, i) => (
        <div key={i} style={{
          padding: "18px 20px",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10,
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8df3d3", marginBottom: 10 }} />
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: "#fff" }}>{item.label}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{item.desc}</div>
        </div>
      ))}
    </div>
  );
}

function ScanningState({ steps }: { steps: string[] }) {
  return (
    <div style={{ padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 24 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: i < steps.length - 1 ? 10 : 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#8df3d3", flexShrink: 0 }} />
          {s}
        </div>
      ))}
    </div>
  );
}

function LoginCta() {
  return (
    <div style={{
      padding: "24px 28px",
      border: "1px solid rgba(141,243,211,0.15)",
      borderRadius: 12,
      background: "rgba(141,243,211,0.02)",
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#8df3d3", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Mehr Scans & Historie
      </p>
      <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
        Mit einem kostenlosen Account speicherst du alle Scans und kannst Websites regelmäßig überwachen.
      </p>
      <Link href="/login" style={{
        display: "inline-block", padding: "10px 20px", borderRadius: 9, textDecoration: "none",
        background: "#fff", color: "#0b0c10", fontWeight: 700, fontSize: 14,
      }}>
        Kostenlos registrieren
      </Link>
    </div>
  );
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

  const inputStyle: React.CSSProperties = {
    flex: 1, minWidth: 240,
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10, padding: "13px 18px", color: "#fff", fontSize: 15, outline: "none",
  };

  const TABS: { key: ActiveTab; label: string; badge?: string }[] = [
    { key: "website", label: "Website-Check" },
    { key: "wcag", label: "Barrierefreiheit", badge: "WCAG 2.1" },
  ];

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

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* HERO */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{
            display: "inline-block", marginBottom: 20,
            padding: "5px 16px", borderRadius: 20,
            border: "1px solid rgba(141,243,211,0.3)",
            background: "rgba(141,243,211,0.06)",
            fontSize: 12, color: "#8df3d3", fontWeight: 700, letterSpacing: "0.06em",
          }}>
            WCAG · SEO · Performance · Kostenlos
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 700, margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Website kostenlos scannen
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", margin: "0 auto", maxWidth: 480, lineHeight: 1.7 }}>
            KI erklärt jeden Fehler auf Deutsch und liefert den konkreten Fix. Ohne Anmeldung.
          </p>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28, justifyContent: "center" }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "10px 22px", border: "1px solid", cursor: "pointer", borderRadius: 9,
              fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
              background: activeTab === tab.key ? "#fff" : "transparent",
              color: activeTab === tab.key ? "#0b0c10" : "rgba(255,255,255,0.6)",
              borderColor: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.15)",
              transition: "all 0.15s",
            }}>
              {tab.label}
              {tab.badge && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  background: activeTab === tab.key ? "rgba(0,0,0,0.12)" : "rgba(141,243,211,0.12)",
                  color: activeTab === tab.key ? "#0b0c10" : "#8df3d3",
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* WEBSITE-CHECK */}
        {activeTab === "website" && (
          <>
            <form onSubmit={handleScan} style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <label htmlFor="scan-url" className="sr-only">Website-URL eingeben</label>
              <input
                id="scan-url" type="text" value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://deine-website.de"
                disabled={state === "scanning"} style={inputStyle}
              />
              <button type="submit" disabled={state === "scanning" || !url} style={{
                padding: "13px 28px", borderRadius: 10, border: "none",
                background: "#fff",
                color: "#0b0c10",
                opacity: !url || state === "scanning" ? 0.45 : 1,
                fontWeight: 700, fontSize: 14, cursor: !url || state === "scanning" ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}>
                {state === "scanning" ? "Scannt..." : "Jetzt scannen"}
              </button>
            </form>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 36, textAlign: "center" }}>
              Kostenlos · Keine Anmeldung · Ergebnis in unter 60 Sekunden
            </p>

            {state === "scanning" && <ScanningState steps={WEBSITE_STEPS} />}

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
                    fontSize: 13, color: "rgba(255,255,255,0.65)", background: "none",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", padding: "6px 14px",
                  }}>
                    Neuer Scan
                  </button>
                </div>
                <div style={{ padding: "28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 16 }}>
                  {renderDiagnose(diagnose)}
                </div>
                <LoginCta />
              </div>
            )}

            {state === "idle" && (
              <div>
                <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Was geprüft wird
                </p>
                <ChecksGrid checks={WEBSITE_CHECKS} />
              </div>
            )}
          </>
        )}

        {/* WCAG */}
        {activeTab === "wcag" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <span style={{ padding: "4px 12px", display: "inline-block", borderRadius: 16, border: "1px solid rgba(141,243,211,0.2)", fontSize: 12, color: "#8df3d3", fontWeight: 600 }}>
                WCAG 2.1 AA · axe-core · BFSG-relevant
              </span>
            </div>

            <form onSubmit={handleWcagScan} style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <label htmlFor="wcag-url" className="sr-only">Website-URL für WCAG-Scan</label>
              <input
                id="wcag-url" type="text" value={wcagUrl}
                onChange={e => setWcagUrl(e.target.value)}
                placeholder="https://deine-website.de"
                disabled={wcagState === "scanning"} style={inputStyle}
              />
              <button type="submit" disabled={wcagState === "scanning" || !wcagUrl} style={{
                padding: "13px 28px", borderRadius: 10, border: "none",
                background: "#fff",
                color: "#0b0c10",
                opacity: !wcagUrl || wcagState === "scanning" ? 0.45 : 1,
                fontWeight: 700, fontSize: 14, cursor: !wcagUrl || wcagState === "scanning" ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}>
                {wcagState === "scanning" ? "Scannt..." : "Jetzt prüfen"}
              </button>
            </form>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 36, textAlign: "center" }}>
              Kostenlos · Keine Anmeldung · Ergebnis in unter 60 Sekunden
            </p>

            {wcagState === "scanning" && <ScanningState steps={WCAG_STEPS} />}

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
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>— {wcagUrl}</span>
                  </div>
                  <button onClick={() => { setWcagState("idle"); setWcagUrl(""); setWcagDiagnose(""); }} style={{
                    fontSize: 13, color: "rgba(255,255,255,0.65)", background: "none",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", padding: "6px 14px",
                  }}>
                    Neue Website
                  </button>
                </div>

                <div style={{ padding: "28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 16 }}>
                  {renderDiagnose(wcagDiagnose)}
                </div>

                <div style={{ padding: "24px 28px", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Transparenz</p>
                  <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Was dieser Scan nicht prüfen kann</h3>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                    Automatische Tools finden ~30–40% aller WCAG-Probleme. Diese Punkte brauchen einen manuellen Check:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {MANUAL_CHECKS.map((item, i) => (
                      <div key={i} style={{
                        padding: "12px 0",
                        borderBottom: i < MANUAL_CHECKS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                        display: "flex", gap: 16, alignItems: "flex-start",
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", paddingTop: 2, flexShrink: 0, width: 20 }}>0{i + 1}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: "16px 0 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Für vollständige BFSG-Konformität empfiehlt sich ein manueller Audit ergänzend zum automatischen Scan.
                  </p>
                </div>

                <LoginCta />
              </div>
            )}

            {wcagState === "idle" && (
              <div>
                <p style={{ margin: "0 0 16px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Was geprüft wird
                </p>
                <ChecksGrid checks={WCAG_CHECKS} />
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginTop: 16 }}>
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
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{`© ${new Date().getFullYear()} website-fix.com`}</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/" style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Startseite</Link>
            <Link href="/impressum" style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>Impressum</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
