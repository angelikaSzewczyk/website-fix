"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

// ─── Design tokens — matches dashboard dark theme ──────────────────────────────
const D = {
  page:         "#0b0c10",
  card:         "rgba(255,255,255,0.03)",
  cardHover:    "rgba(255,255,255,0.045)",
  border:       "rgba(255,255,255,0.07)",
  borderMid:    "rgba(255,255,255,0.11)",
  borderStrong: "rgba(255,255,255,0.16)",
  text:         "#ffffff",
  textSub:      "rgba(255,255,255,0.5)",
  textMuted:    "rgba(255,255,255,0.3)",
  blue:         "#007BFF",
  blueSoft:     "#7aa6ff",
  blueBg:       "rgba(0,123,255,0.08)",
  blueBorder:   "rgba(0,123,255,0.25)",
  blueGlow:     "0 2px 14px rgba(0,123,255,0.35)",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.08)",
  greenBorder:  "rgba(74,222,128,0.22)",
  amber:        "#fbbf24",
  amberBg:      "rgba(251,191,36,0.08)",
  amberBorder:  "rgba(251,191,36,0.22)",
  red:          "#f87171",
  redBg:        "rgba(239,68,68,0.08)",
  redBorder:    "rgba(239,68,68,0.22)",
  radius:       12,
  radiusSm:     8,
  radiusXs:     6,
} as const;

// ─── Shared sub-components ────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: D.card,
      border: `1px solid ${D.border}`,
      borderRadius: D.radius,
      padding: "24px 28px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: D.text, letterSpacing: "-0.01em" }}>
        {label}
      </h2>
      {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: D.textMuted }}>{sub}</p>}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: D.textSub, marginBottom: 6, letterSpacing: "0.03em" }}>
      {children}
    </label>
  );
}

function Input({ value, onChange, type = "text", placeholder, disabled }: {
  value: string; onChange?: (v: string) => void;
  type?: string; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        display: "block", width: "100%", boxSizing: "border-box",
        padding: "9px 12px",
        background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${D.border}`,
        borderRadius: D.radiusSm,
        color: disabled ? D.textMuted : D.text,
        fontSize: 14, fontFamily: "inherit",
        outline: "none",
        cursor: disabled ? "default" : "text",
        transition: "border-color 0.15s",
      }}
      onFocus={e => { if (!disabled) (e.target as HTMLInputElement).style.borderColor = D.blueBorder; }}
      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = D.border; }}
    />
  );
}

function SaveBtn({ loading, saved, onClick }: { loading: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "9px 20px", borderRadius: D.radiusSm,
        background: saved ? D.greenBg : D.blue,
        border: `1px solid ${saved ? D.greenBorder : "transparent"}`,
        color: saved ? D.green : "#fff",
        fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer",
        fontFamily: "inherit",
        boxShadow: saved ? "none" : D.blueGlow,
        transition: "all 0.2s",
      }}>
      {loading ? "Speichern…" : saved ? "✓ Gespeichert" : "Speichern"}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface FreeSettingsProps {
  name:         string;
  email:        string;
  plan:         string;
  projectUrl:   string;
  monthlyScans: number;
  scanLimit:    number;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FreeSettingsClient({
  name: initialName,
  email: initialEmail,
  plan,
  projectUrl: initialProjectUrl,
  monthlyScans,
  scanLimit,
}: FreeSettingsProps) {
  // Account section
  const [name,  setName]  = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved,   setProfileSaved]   = useState(false);
  const [profileError,   setProfileError]   = useState("");
  const [pwResetSent,    setPwResetSent]    = useState(false);
  const [pwResetLoading, setPwResetLoading] = useState(false);

  // Project section
  const [projectUrl,       setProjectUrl]       = useState(initialProjectUrl);
  const [projectLoading,   setProjectLoading]   = useState(false);
  const [projectSaved,     setProjectSaved]     = useState(false);
  const [projectError,     setProjectError]     = useState("");

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const planLabel  = plan === "starter" ? "Starter" : plan === "agency" || plan === "agency-starter" || plan === "agency-pro" ? "Agency" : "Professional";
  const scansUsed  = Math.min(monthlyScans, scanLimit);
  const scanPct    = Math.round((scansUsed / scanLimit) * 100);

  async function sendPasswordReset() {
    setPwResetLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || initialEmail }),
      });
      setPwResetSent(true);
    } finally {
      setPwResetLoading(false);
    }
  }

  async function saveProfile() {
    setProfileLoading(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Fehler beim Speichern.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function saveProject() {
    if (!projectUrl.trim()) return;
    setProjectLoading(true);
    setProjectError("");
    setProjectSaved(false);
    try {
      const url = projectUrl.trim().startsWith("http")
        ? projectUrl.trim()
        : `https://${projectUrl.trim()}`;
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectUrl: url }),
        credentials: "include",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
      setProjectSaved(true);
      setTimeout(() => setProjectSaved(false), 3000);
    } catch (e) {
      setProjectError(e instanceof Error ? e.message : "Fehler beim Speichern.");
    } finally {
      setProjectLoading(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await fetch("/api/user/delete-account", { method: "DELETE", credentials: "include" });
      await signOut({ callbackUrl: "/" });
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: D.page, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: D.text }}>
      <style>{`
        .wf-settings-input:focus { border-color: ${D.blueBorder} !important; outline: none; }
        .wf-danger-link { transition: color 0.15s; }
        .wf-danger-link:hover { color: ${D.red} !important; }
        .wf-save-btn:hover:not(:disabled) { filter: brightness(1.1); }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "44px 24px 80px" }}>

        {/* ── PAGE HEADER ─────────────────────────────────── */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Dashboard
          </p>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.025em" }}>
            Einstellungen
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: D.textSub }}>
            Verwalte dein Konto und deine Projekte
          </p>
        </div>

        {/* ═══════════════════════════════════════════
            SEKTION 1 — ACCOUNT
        ═══════════════════════════════════════════ */}
        <Card style={{ marginBottom: 16 }}>
          <SectionHeader label="Account" sub="Name und E-Mail-Adresse ändern" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={setName} placeholder="Dein Name" />
            </div>
            <div>
              <Label>E-Mail-Adresse</Label>
              <Input value={email} onChange={setEmail} type="email" placeholder="deine@email.de" />
            </div>
          </div>

          {profileError && (
            <p style={{ margin: "0 0 14px", fontSize: 12, color: D.red }}>{profileError}</p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <SaveBtn loading={profileLoading} saved={profileSaved} onClick={saveProfile} />
            <button
              onClick={sendPasswordReset}
              disabled={pwResetLoading || pwResetSent}
              style={{
                background: "none", border: "none", cursor: pwResetSent ? "default" : "pointer",
                fontSize: 13, fontFamily: "inherit",
                color: pwResetSent ? D.green : D.textSub,
                fontWeight: 500, padding: 0,
              }}>
              {pwResetSent
                ? "✓ Reset-Link gesendet"
                : pwResetLoading
                ? "Wird gesendet…"
                : "Passwort ändern →"}
            </button>
          </div>
        </Card>

        {/* ═══════════════════════════════════════════
            SEKTION 2 — PROJEKT
        ═══════════════════════════════════════════ */}
        <Card style={{ marginBottom: 16 }}>
          <SectionHeader
            label="Aktives Projekt"
            sub="Diese Domain wird im Dashboard und beim Scan vorausgefüllt"
          />

          <div style={{ marginBottom: 20 }}>
            <Label>Website-URL</Label>
            <Input
              value={projectUrl}
              onChange={v => { setProjectUrl(v); setProjectSaved(false); }}
              placeholder="https://deine-website.de"
            />
            <p style={{ margin: "6px 0 0", fontSize: 11, color: D.textMuted }}>
              Muss eine vollständige URL sein (https://…)
            </p>
          </div>

          {projectError && (
            <p style={{ margin: "0 0 14px", fontSize: 12, color: D.red }}>{projectError}</p>
          )}

          <SaveBtn loading={projectLoading} saved={projectSaved} onClick={saveProject} />
        </Card>

        {/* ═══════════════════════════════════════════
            SEKTION 3 — PLAN & NUTZUNG
        ═══════════════════════════════════════════ */}
        <Card style={{ marginBottom: 16 }}>
          <SectionHeader label="Plan & Nutzung" />

          {/* Plan badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              color: D.blueSoft, letterSpacing: "0.05em",
            }}>
              {planLabel.toUpperCase()}
            </span>
            <span style={{ fontSize: 13, color: D.textSub }}>Aktueller Plan</span>
          </div>

          {/* Scan usage bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: D.text }}>
                Gratis-Scans diesen Monat
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: scansUsed >= scanLimit ? D.red : D.textSub,
              }}>
                {scansUsed} / {scanLimit}
              </span>
            </div>
            {/* Track */}
            <div style={{
              height: 6, borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${D.border}`,
              overflow: "hidden",
            }}>
              {/* Fill */}
              <div style={{
                height: "100%",
                width: `${scanPct}%`,
                borderRadius: 10,
                background: scansUsed >= scanLimit
                  ? `linear-gradient(90deg, ${D.red}, #fb923c)`
                  : scansUsed >= scanLimit * 0.67
                  ? `linear-gradient(90deg, ${D.amber}, #f59e0b)`
                  : `linear-gradient(90deg, ${D.blue}, ${D.blueSoft})`,
                transition: "width 0.5s ease",
              }} />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: D.textMuted }}>
              {scansUsed >= scanLimit
                ? "Scan-Limit erreicht — wird am 1. des Monats zurückgesetzt"
                : `${scanLimit - scansUsed} Scan${scanLimit - scansUsed !== 1 ? "s" : ""} verbleibend`}
            </p>
          </div>

          {/* Upsell info box — shown for Starter users */}
          {plan === "starter" && (
            <div style={{
              padding: "14px 16px",
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.22)",
              borderRadius: D.radiusSm,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: D.text }}>
                  Du nutzt den Starter-Plan.
                </p>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>
                  Upgrade auf Professional für automatische PDF-Berichte, Full-Site Crawls und White-Label-Berichte.
                </p>
                <Link href="/fuer-agenturen#pricing" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 16px", borderRadius: D.radiusXs,
                  background: "#10B981", color: "#fff",
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}>
                  Auf Professional upgraden →
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* ═══════════════════════════════════════════
            SEKTION 4 — GEFAHRENZONE
        ═══════════════════════════════════════════ */}
        <Card>
          <SectionHeader label="Gefahrenzone" />

          {!deleteConfirm ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: D.text }}>
                  Konto löschen
                </p>
                <p style={{ margin: 0, fontSize: 12, color: D.textMuted }}>
                  Dein Konto und alle Scandaten werden unwiderruflich gelöscht.
                </p>
              </div>
              <button
                className="wf-danger-link"
                onClick={() => setDeleteConfirm(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13, color: D.textMuted, fontFamily: "inherit",
                  textDecoration: "underline", textDecorationColor: "transparent",
                  padding: 0, flexShrink: 0,
                }}>
                Konto und alle Scandaten unwiderruflich löschen
              </button>
            </div>
          ) : (
            <div style={{
              padding: "16px", borderRadius: D.radiusSm,
              background: D.redBg, border: `1px solid ${D.redBorder}`,
            }}>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: D.red }}>
                Bist du sicher? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={deleteAccount}
                  disabled={deleting}
                  style={{
                    padding: "8px 18px", borderRadius: D.radiusXs,
                    background: D.red, border: "none",
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: deleting ? "wait" : "pointer",
                    fontFamily: "inherit",
                  }}>
                  {deleting ? "Wird gelöscht…" : "Ja, Konto löschen"}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  style={{
                    padding: "8px 18px", borderRadius: D.radiusXs,
                    background: "transparent",
                    border: `1px solid ${D.border}`,
                    color: D.textSub, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
