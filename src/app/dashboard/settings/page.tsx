"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AgencySettings = {
  agency_name: string;
  logo_url: string;
  primary_color: string;
};

type TeamMember = {
  id: number;
  member_email: string;
  status: string;
  invited_at: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AgencySettings>({ agency_name: "", logo_url: "", primary_color: "#8df3d3" });
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [inviteState, setInviteState] = useState<"idle" | "loading" | "error">("idle");
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    fetch("/api/agency-settings").then(r => r.json()).then(setSettings);
    fetch("/api/team").then(r => r.json()).then(setMembers);
  }, []);

  async function handleSave() {
    setSaveState("saving");
    const res = await fetch("/api/agency-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaveState(res.ok ? "saved" : "error");
    setTimeout(() => setSaveState("idle"), 2500);
  }

  async function handleInvite() {
    setInviteError("");
    setInviteState("loading");
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail }),
    });
    if (res.ok) {
      const updated = await fetch("/api/team").then(r => r.json());
      setMembers(updated);
      setNewEmail("");
      setInviteState("idle");
    } else {
      const data = await res.json();
      setInviteError(data.error ?? "Fehler beim Einladen.");
      setInviteState("error");
    }
  }

  async function handleRemove(id: number) {
    await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setMembers(prev => prev.filter(m => m.id !== id));
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff", outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block", fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6,
  };

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,12,16,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: 17 }}>
            Website<span style={{ background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Fix</span>
          </Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "52px 20px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>Agentur-Einstellungen</h1>
        <p style={{ margin: "0 0 48px", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
          White-Label Branding für deine Reports und Team-Verwaltung.
        </p>

        {/* WHITE-LABEL */}
        <section style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "28px 28px", marginBottom: 28,
        }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>🏷️ White-Label Branding</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={labelStyle}>Agentur-Name</label>
              <input
                style={inputStyle}
                placeholder="z.B. Meine Digitalagentur GmbH"
                value={settings.agency_name}
                onChange={e => setSettings(s => ({ ...s, agency_name: e.target.value }))}
              />
            </div>

            <div>
              <label style={labelStyle}>Logo-URL (öffentlich zugänglich, PNG/SVG)</label>
              <input
                style={inputStyle}
                placeholder="https://deine-agentur.de/logo.png"
                value={settings.logo_url}
                onChange={e => setSettings(s => ({ ...s, logo_url: e.target.value }))}
              />
              {settings.logo_url && (
                <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.logo_url} alt="Logo Vorschau" style={{ height: 32, objectFit: "contain" }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Vorschau</span>
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Akzentfarbe (Hex)</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                  style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer", borderRadius: 8 }}
                />
                <input
                  style={{ ...inputStyle, width: 120 }}
                  value={settings.primary_color}
                  onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saveState === "saving"}
              style={{
                padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: "linear-gradient(90deg,#8df3d3,#7aa6ff)", color: "#0b0c10",
                border: "none", cursor: "pointer",
              }}
            >
              {saveState === "saving" ? "Speichern..." : saveState === "saved" ? "✓ Gespeichert" : "Speichern"}
            </button>
            {saveState === "error" && <span style={{ fontSize: 13, color: "#ff6b6b" }}>Fehler beim Speichern.</span>}
          </div>
        </section>

        {/* TEAM */}
        <section style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "28px 28px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>👥 Team-Zugang</h2>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              {members.length + 1} / 3 Seats genutzt
            </span>
          </div>

          {/* Owner */}
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 10,
            background: "rgba(141,243,211,0.05)", border: "1px solid rgba(141,243,211,0.15)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>Du (Owner)</span>
            <span style={{ fontSize: 12, color: "#8df3d3" }}>Admin</span>
          </div>

          {/* Members */}
          {members.map(m => (
            <div key={m.id} style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 10,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{m.member_email}</span>
                <span style={{
                  marginLeft: 10, fontSize: 11, padding: "2px 8px", borderRadius: 6,
                  background: m.status === "pending" ? "rgba(255,211,77,0.1)" : "rgba(141,243,211,0.1)",
                  color: m.status === "pending" ? "#ffd93d" : "#8df3d3",
                }}>
                  {m.status === "pending" ? "Einladung ausstehend" : "Aktiv"}
                </span>
              </div>
              <button
                onClick={() => handleRemove(m.id)}
                style={{ fontSize: 12, color: "rgba(255,107,107,0.7)", background: "none", border: "none", cursor: "pointer" }}
              >
                Entfernen
              </button>
            </div>
          ))}

          {/* Invite */}
          {members.length < 2 && (
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="kollegin@agentur.de"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
              />
              <button
                onClick={handleInvite}
                disabled={inviteState === "loading" || !newEmail}
                style={{
                  padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  border: "1px solid rgba(141,243,211,0.3)", color: "#8df3d3",
                  background: "rgba(141,243,211,0.06)", cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {inviteState === "loading" ? "..." : "Einladen"}
              </button>
            </div>
          )}
          {inviteError && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#ff6b6b" }}>{inviteError}</p>}
          {members.length >= 2 && (
            <p style={{ margin: "16px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              Maximale Teamgröße (3 Seats) erreicht.
            </p>
          )}
        </section>
      </main>
    </>
  );
}
