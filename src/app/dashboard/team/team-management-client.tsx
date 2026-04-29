/**
 * Team-Management UI (Phase 8).
 *
 * Client-Component für die Member-Verwaltung. Initial-Daten kommen SSR von
 * der Page; Invite/Remove gehen via fetch an /api/team und triggern
 * router.refresh() für eine frische SSR-Pass — kein lokales State-Drift.
 *
 * Branding: nutzt --agency-accent-* aus dashboard/layout.tsx (Phase-8-Cleanup,
 * Single-Source-of-Truth für Agency-Brand-Farben).
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type Member = {
  id:           string;
  member_email: string;
  invited_at:   string | null;
  joined_at:    string | null;
  last_seen_at: string | null;
  scans_today:  number | null;
  scans_total:  number | null;
};

export type AuditEntry = {
  action:       string;       // 'team.invite' | 'team.remove' | 'team.invite_resent' | 'team.join'
  member_email: string | null;
  created_at:   string;
  metadata:     unknown;
};

type Props = {
  initialMembers: Member[];
  maxSeats:       number;
  highlightEmail: string | null;
  auditLog:       AuditEntry[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function deriveInitials(email: string): string {
  const local = (email.split("@")[0] ?? "").toLowerCase();
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const base = local.replace(/[^a-z0-9]/gi, "");
  return (base.slice(0, 2) || "??").toUpperCase();
}

function deriveDisplayName(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .filter(Boolean)
    .map(s => s[0].toUpperCase() + s.slice(1).toLowerCase())
    .join(" ") || email;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

function formatLastSeen(iso: string | null, now: number): string {
  if (!iso) return "Nie eingeloggt";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = now - t;
  if (diff < ONLINE_WINDOW_MS) return "Online";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `vor ${min} Min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} ${d === 1 ? "Tag" : "Tagen"}`;
  return formatDate(iso);
}

function isOnline(iso: string | null, now: number): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return now - t < ONLINE_WINDOW_MS;
}

function isJoined(m: Member): boolean {
  return !!m.joined_at;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TeamManagementClient({ initialMembers, maxSeats, highlightEmail, auditLog }: Props) {
  const router = useRouter();

  // Local-state-of-truth ist der initialMembers-Snapshot vom Server. Jede
  // Mutation (invite/remove/resend) feuert router.refresh() → Server liefert
  // neuen Snapshot → Next.js übergibt ihn als neue Props → effect synct lokal.
  const [members, setMembers] = useState<Member[]>(initialMembers);
  useEffect(() => { setMembers(initialMembers); }, [initialMembers]);

  // 60-Sekunden-Tick für Online-Status-Drift-Korrektur (siehe team-widget).
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Phase-10-Split: Aktive Member (joined_at gesetzt) und Pending Invites
  // (joined_at == null) werden in zwei Sektionen gerendert. Visuelle Trennung
  // signalisiert dem Owner, was "läuft" und was "auf Bestätigung wartet".
  const activeMembers  = members.filter(m =>  isJoined(m));
  const pendingMembers = members.filter(m => !isJoined(m));

  const usedSeats = members.length;
  const seatsLeft = Math.max(0, maxSeats - usedSeats);

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "40px 24px 80px", color: "#0F172A" }}>
      <style>{`
        @keyframes wf-tm-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
          70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .wf-tm-online { animation: wf-tm-pulse 2s infinite; position: relative; z-index: 0; }
        .wf-tm-row { transition: background 0.15s ease; }
        .wf-tm-row:hover { background: #F8FAFC; }
        .wf-tm-row[data-highlight="true"] {
          background: var(--agency-accent-bg);
          border-color: var(--agency-accent-border);
          box-shadow: 0 0 0 2px var(--agency-accent-glow-soft);
        }
        @keyframes wf-tm-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <Header usedSeats={usedSeats} maxSeats={maxSeats} />

      {/* ── Invite-Form (immer sichtbar wenn noch Plätze frei sind) ──────── */}
      {seatsLeft > 0 && <InviteForm onInvited={() => router.refresh()} />}

      {/* ── Aktive Mitglieder ────────────────────────────────────────────── */}
      {activeMembers.length > 0 && (
        <Section title="Aktive Mitglieder" count={activeMembers.length}>
          <MemberList
            members={activeMembers}
            highlightEmail={highlightEmail}
            nowTick={nowTick}
            onRemoved={() => router.refresh()}
            mode="active"
          />
        </Section>
      )}

      {/* ── Offene Einladungen ───────────────────────────────────────────── */}
      {pendingMembers.length > 0 && (
        <Section title="Offene Einladungen" count={pendingMembers.length} subtle>
          <MemberList
            members={pendingMembers}
            highlightEmail={highlightEmail}
            nowTick={nowTick}
            onRemoved={() => router.refresh()}
            mode="pending"
          />
        </Section>
      )}

      {/* ── Empty-State wenn weder aktiv noch pending ────────────────────── */}
      {members.length === 0 && <EmptyState />}

      {/* ── Activity-Feed: letzte 10 Audit-Einträge ──────────────────────── */}
      {auditLog.length > 0 && <ActivityFeed entries={auditLog} />}

      {/* ── Seat-Limit-Hint wenn voll ────────────────────────────────────── */}
      {seatsLeft === 0 && members.length > 0 && (
        <div style={{
          marginTop: 18, padding: "12px 16px", borderRadius: 9,
          background: "var(--agency-accent-bg)",
          border: "1px solid var(--agency-accent-border)",
          fontSize: 12.5, color: "#0F172A",
        }}>
          <strong>Seat-Limit erreicht.</strong>{" "}
          <span style={{ color: "#475569" }}>
            Dein Plan erlaubt {maxSeats} Mitglieder zusätzlich zum Owner.
            Entferne ein Mitglied oder kontaktiere uns für Custom-Seats.
          </span>
        </div>
      )}
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Header({ usedSeats, maxSeats }: { usedSeats: number; maxSeats: number }) {
  return (
    <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div>
        <Link href="/dashboard" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12, fontWeight: 600, color: "#64748B",
          textDecoration: "none", marginBottom: 10,
        }}>
          ← Zurück zur Kommandozentrale
        </Link>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Team-Verwaltung
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
          Mitglieder einladen, Aktivität prüfen, Zugriff entziehen.
        </p>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20,
        background: "var(--agency-accent-bg)",
        color: "var(--agency-accent)",
        border: "1px solid var(--agency-accent-border)",
        letterSpacing: "0.04em",
      }}>
        {usedSeats} / {maxSeats} MITGLIEDER
      </span>
    </div>
  );
}

function InviteForm({ onInvited }: { onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setSuccess(false);
    setPending(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Fehler ${res.status}`);
        return;
      }
      setEmail("");
      setSuccess(true);
      onInvited();
      window.setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} style={{
      marginBottom: 24,
      padding: "16px 18px",
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-start",
    }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 5, letterSpacing: "0.04em" }}>
          E-MAIL DES MITGLIEDS
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="kollege@deine-agentur.de"
          disabled={pending}
          style={{
            width: "100%", padding: "10px 13px",
            background: "#F8FAFC", border: "1px solid #E2E8F0",
            borderRadius: 8, fontSize: 13, color: "#0F172A",
            outline: "none", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>
      <button
        type="submit"
        disabled={pending || !email.trim()}
        style={{
          alignSelf: "flex-end",
          padding: "10px 20px", borderRadius: 8,
          background: "var(--agency-accent)",
          color: "#fff", border: "none",
          fontSize: 13, fontWeight: 700, cursor: pending ? "wait" : "pointer",
          fontFamily: "inherit",
          boxShadow: "0 2px 10px var(--agency-accent-glow-soft)",
          opacity: pending || !email.trim() ? 0.65 : 1,
          display: "inline-flex", alignItems: "center", gap: 7,
        }}
      >
        {pending && <Spinner />}
        {pending ? "Lädt…" : success ? "Eingeladen ✓" : "Einladen →"}
      </button>
      {error && (
        <p style={{ margin: 0, width: "100%", fontSize: 12, color: "#DC2626" }}>{error}</p>
      )}
    </form>
  );
}

function Section({ title, count, subtle, children }: {
  title: string;
  count: number;
  subtle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, padding: "0 2px" }}>
        <h2 style={{
          margin: 0, fontSize: 12, fontWeight: 700,
          color: subtle ? "#94A3B8" : "#475569",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          {title}
        </h2>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: "1px 8px", borderRadius: 20,
          background: subtle ? "#F1F5F9" : "var(--agency-accent-bg)",
          color: subtle ? "#94A3B8" : "var(--agency-accent)",
          border: `1px solid ${subtle ? "#E2E8F0" : "var(--agency-accent-border)"}`,
        }}>
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function MemberList({
  members, highlightEmail, nowTick, onRemoved, mode,
}: {
  members: Member[];
  highlightEmail: string | null;
  nowTick: number;
  onRemoved: () => void;
  mode: "active" | "pending";
}) {
  // Layout-Varianten:
  //   active  → 5-Spalten-Grid mit Status/Login/Scans (volle Activity-Daten)
  //   pending → 4-Spalten-Grid mit "Eingeladen"/"Aktion" (kein Activity-Sinn)
  const cols = mode === "active"
    ? "minmax(180px, 2fr) 110px 110px 130px 130px"
    : "minmax(180px, 2fr) 1fr 220px";

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "10px 18px", background: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
        display: "grid",
        gridTemplateColumns: cols,
        gap: 12, fontSize: 10, fontWeight: 700, color: "#64748B",
        letterSpacing: "0.07em", textTransform: "uppercase",
      }}>
        <span>Mitglied</span>
        {mode === "active" ? (
          <>
            <span>Status</span>
            <span>Letzter Login</span>
            <span style={{ textAlign: "right" }}>Scans (heute / total)</span>
            <span style={{ textAlign: "right" }}>Aktion</span>
          </>
        ) : (
          <>
            <span>Einladung</span>
            <span style={{ textAlign: "right" }}>Aktion</span>
          </>
        )}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {members.map(m => (
          <MemberRow
            key={m.id}
            m={m}
            highlight={highlightEmail === m.member_email.toLowerCase()}
            nowTick={nowTick}
            onRemoved={onRemoved}
            mode={mode}
            cols={cols}
          />
        ))}
      </ul>
    </div>
  );
}

function MemberRow({ m, highlight, nowTick, onRemoved, mode, cols }: {
  m: Member;
  highlight: boolean;
  nowTick: number;
  onRemoved: () => void;
  mode: "active" | "pending";
  cols: string;
}) {
  const [removing, setRemoving] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentFlash, setResentFlash] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const online      = isOnline(m.last_seen_at, nowTick);
  const joined      = isJoined(m);
  const initials    = deriveInitials(m.member_email);
  const displayName = deriveDisplayName(m.member_email);
  const lastSeenLbl = formatLastSeen(m.last_seen_at, nowTick);
  const today       = m.scans_today ?? 0;
  const total       = m.scans_total ?? 0;

  async function resend() {
    if (resending) return;
    setError(null);
    setResending(true);
    try {
      const res = await fetch("/api/team/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Konnte nicht erneut versendet werden");
        return;
      }
      setResentFlash(true);
      window.setTimeout(() => setResentFlash(false), 3000);
      onRemoved(); // re-fetch trigger — Token + token_expires_at sind frisch in DB
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
    } finally {
      setResending(false);
    }
  }

  // Auto-Scroll wenn Drill-Down auf diesen Member zeigt.
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (highlight && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlight]);

  async function remove() {
    if (removing) return;
    setError(null);
    setRemoving(true);
    try {
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.deleted === false) {
        setError(data?.error ?? "Konnte nicht entfernt werden");
        setRemoving(false);
        return;
      }
      onRemoved();
      // setRemoving false wird durch nachfolgenden Re-Fetch ersetzt
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
      setRemoving(false);
    }
  }

  const statusKind: "online" | "joined" | "invited" =
    online ? "online" : joined ? "joined" : "invited";
  const statusLabel =
    online ? "Online" : joined ? "Offline" : "Eingeladen";
  const statusDotColor =
    online ? "#22C55E" : joined ? "#94A3B8" : "#F59E0B";

  // Action-Buttons als wiederverwendbares Stück — die zwei Modi haben jeweils
  // unterschiedliche Aktionen, aber teilen die Confirm-Dialog-Logik für Remove.
  const removeButton = !confirmOpen ? (
    <button
      type="button"
      onClick={() => setConfirmOpen(true)}
      disabled={removing}
      title="Mitglied aus dem Team entfernen"
      style={{
        padding: "6px 12px", borderRadius: 7,
        background: "transparent", border: "1px solid #E2E8F0",
        color: "#64748B", fontSize: 12, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit",
      }}
    >
      Entfernen
    </button>
  ) : (
    <>
      <button
        type="button"
        onClick={remove}
        disabled={removing}
        style={{
          padding: "6px 12px", borderRadius: 7,
          background: "#DC2626", border: "1px solid #DC2626",
          color: "#fff", fontSize: 12, fontWeight: 700,
          cursor: removing ? "wait" : "pointer", fontFamily: "inherit",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}
      >
        {removing && <Spinner />}
        {removing ? "…" : "Bestätigen"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(false)}
        disabled={removing}
        style={{
          padding: "6px 10px", borderRadius: 7,
          background: "transparent", border: "1px solid #E2E8F0",
          color: "#64748B", fontSize: 12, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        ×
      </button>
    </>
  );

  // Resend-Button: Brand-color background, success-Flash. Triggert serverseitig
  // einen neuen Token + frische Mail; alter Link wird invalide.
  const resendButton = (
    <button
      type="button"
      onClick={resend}
      disabled={resending}
      title="Neuen Einladungs-Link generieren und per E-Mail versenden"
      style={{
        padding: "6px 12px", borderRadius: 7,
        background: resentFlash ? "var(--agency-accent)" : "var(--agency-accent-bg)",
        border:     `1px solid ${resentFlash ? "var(--agency-accent)" : "var(--agency-accent-border)"}`,
        color:      resentFlash ? "#fff" : "var(--agency-accent)",
        fontSize: 12, fontWeight: 700,
        cursor: resending ? "wait" : "pointer", fontFamily: "inherit",
        display: "inline-flex", alignItems: "center", gap: 5,
        transition: "background 0.18s ease, color 0.18s ease",
      }}
    >
      {resending && <Spinner />}
      {resending  ? "Sende…" :
       resentFlash ? "Versendet ✓" :
                     "↻ Erneut senden"}
    </button>
  );

  return (
    <li
      ref={ref}
      data-highlight={highlight ? "true" : "false"}
      className="wf-tm-row"
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: 12, alignItems: "center",
        padding: "12px 18px",
        borderBottom: "1px solid #F1F5F9",
        borderLeft: "3px solid transparent",
      }}
    >
      {/* Spalte 1 — Mitglied (Avatar + Name + Email) — beide Modi gleich */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <div aria-hidden="true" style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: "var(--agency-accent-bg)",
          border: "1px solid var(--agency-accent-border)",
          color: "var(--agency-accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12.5, fontWeight: 800,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {m.member_email}
          </div>
        </div>
      </div>

      {/* Mode-spezifische Spalten */}
      {mode === "active" ? (
        <>
          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span
              className={statusKind === "online" ? "wf-tm-online" : undefined}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: statusDotColor, flexShrink: 0,
                opacity: statusKind === "invited" ? 0.7 : 1,
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
              {statusLabel}
            </span>
          </div>

          {/* Letzter Login */}
          <div style={{ fontSize: 12, color: "#64748B" }}>
            {joined ? lastSeenLbl : `Eingeladen ${formatDate(m.invited_at)}`}
          </div>

          {/* Scans heute / total */}
          <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: today > 0 ? "var(--agency-accent)" : "#0F172A" }}>
              {today} / {total}
            </div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>
              heute / gesamt
            </div>
          </div>

          {/* Action: Remove */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
            {removeButton}
          </div>
        </>
      ) : (
        <>
          {/* Pending: Eingeladen am … */}
          <div style={{ fontSize: 12, color: "#64748B" }}>
            Eingeladen {formatDate(m.invited_at)}
          </div>

          {/* Pending-Action: Resend + Remove nebeneinander */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
            {resendButton}
            {removeButton}
          </div>
        </>
      )}

      {error && (
        <div style={{ gridColumn: "1 / -1", marginTop: 4, fontSize: 11.5, color: "#DC2626" }}>
          {error}
        </div>
      )}
    </li>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: "60px 28px", textAlign: "center",
      background: "#FFFFFF",
      border: "1px solid #E2E8F0",
      borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "var(--agency-accent-bg)",
        border: "1px solid var(--agency-accent-border)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--agency-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800 }}>Noch keine Mitglieder</h2>
      <p style={{ margin: "0 auto", fontSize: 13, color: "#64748B", lineHeight: 1.55, maxWidth: 360 }}>
        Lade Kollegen über das Formular oben ein. Sie bekommen eine E-Mail
        mit einem Login-Link und können danach an Audits und Berichten mitarbeiten.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
      style={{ animation: "wf-tm-spin 0.85s linear infinite" }}>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ── Activity-Feed (Phase 10) ──────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { verb: string; tone: "info" | "success" | "warn" | "danger" }> = {
  "team.invite":         { verb: "wurde eingeladen",                tone: "info"    },
  "team.invite_resent":  { verb: "Einladung wurde erneut gesendet", tone: "info"    },
  "team.join":           { verb: "ist dem Team beigetreten",        tone: "success" },
  "team.remove":         { verb: "wurde aus dem Team entfernt",     tone: "danger"  },
};

const TONE_COLORS: Record<"info" | "success" | "warn" | "danger", { bg: string; dot: string }> = {
  info:    { bg: "var(--agency-accent-bg)", dot: "var(--agency-accent)" },
  success: { bg: "rgba(34,197,94,0.10)",    dot: "#22C55E" },
  warn:    { bg: "rgba(251,191,36,0.10)",   dot: "#F59E0B" },
  danger:  { bg: "rgba(220,38,38,0.08)",    dot: "#DC2626" },
};

/** Relativer Zeit-Ausdruck für Audit-Einträge — "vor 5 Min", "vor 2 Std",
 *  "Heute, 14:32", "Gestern", oder Datum für ältere Einträge. */
function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diffMs = Date.now() - t;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 2) return "gestern";
  if (diffD < 7) return `vor ${diffD} Tagen`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

function ActivityFeed({ entries }: { entries: AuditEntry[] }) {
  return (
    <section style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, padding: "0 2px" }}>
        <h2 style={{
          margin: 0, fontSize: 12, fontWeight: 700, color: "#475569",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          Activity-Feed
        </h2>
        <span style={{
          fontSize: 10, fontWeight: 700,
          padding: "1px 8px", borderRadius: 20,
          background: "#F1F5F9", color: "#94A3B8", border: "1px solid #E2E8F0",
        }}>
          letzte {entries.length}
        </span>
      </div>

      <ul style={{
        margin: 0, padding: 0, listStyle: "none",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        {entries.map((e, i) => {
          const config = ACTION_LABELS[e.action] ?? { verb: e.action, tone: "info" as const };
          const colors = TONE_COLORS[config.tone];
          const isLast = i === entries.length - 1;
          return (
            <li key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 16px",
              borderBottom: isLast ? "none" : "1px solid #F1F5F9",
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                background: colors.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: colors.dot,
                }} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.4 }}>
                  <strong style={{ fontWeight: 700 }}>
                    {e.member_email ?? "Unbekanntes Mitglied"}
                  </strong>
                  <span style={{ color: "#475569" }}>
                    {" "}{config.verb}.
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap", flexShrink: 0 }}>
                {relativeTime(e.created_at)}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
