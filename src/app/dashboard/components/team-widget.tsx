/**
 * TeamWidget — Mitglieder-Übersicht für Agency-Plan-Inhaber.
 *
 * Liest /api/team (auth+plan-gegated), rendert eine kompakte Liste der
 * eingeladenen und beigetretenen Team-Members. Layout-Position: rechte
 * Sidebar im Agency-Dashboard, neben der Kunden-Matrix.
 *
 * Design-Decisions (siehe Phase-5-Konzept):
 *   - Avatar = Initialen aus E-Mail-Username, Bubble in var(--agency-accent-bg)
 *     mit var(--agency-accent)-Schrift → automatisches Branding-Color-Match.
 *   - Pulsierender grüner Dot bei joined-Members, statischer amber Dot bei
 *     invited-but-not-joined. Kein fake "online seit X Min" — joined ≈ aktiver
 *     Account, das ist die ehrlichste Approximation mit aktuellem Schema.
 *   - Sort: joined (joined_at DESC) → invited (invited_at DESC). Spec-Order
 *     "Online → kürzlich aktiv → Offline" wird damit am besten approximiert,
 *     bis ein echtes last_seen_at-Heartbeat-Feld existiert.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RawMember = {
  id:            number | string;
  member_email:  string;
  status:        string | null;
  invited_at:    string | null;
  joined_at:     string | null;
  last_seen_at:  string | null;   // Phase 7A: Heartbeat-Timestamp
  scans_today:   number | null;   // Phase 7B: Aktivitäts-Aggregat
};

type ApiResponse = {
  members:  RawMember[];
  maxSeats: number;
};

type DerivedMember = {
  id:          number | string;
  email:       string;
  initials:    string;
  displayName: string;
  joined:      boolean;
  online:      boolean;             // last_seen_at innerhalb 5 Min
  scansToday:  number;
  // ISO-Datum, nach dem sortiert wird; last_seen_at > joined_at > invited_at
  pivotAt:     string | null;
};

// Online-Schwelle: 5 Minuten. Match zur Heartbeat-Throttle-Frequenz von 60 s
// → ein aktiver User setzt last_seen_at mindestens alle 60 s, fällt also
// frühestens 5 Min nach letzter Aktivität aus dem "online"-Fenster.
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────────────────────

function deriveInitials(email: string): string {
  const local = (email.split("@")[0] ?? "").toLowerCase();
  // Bevorzugt: split auf "." (z.B. "angelika.szewczyk" → "AS")
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  // Fallback: erste zwei Buchstaben des Usernames ("max@…" → "MA")
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

// joined-Status ist authoritative; status-String hat unklare Semantik
// und wird bewusst ignoriert.
function isJoined(m: RawMember): boolean {
  return !!m.joined_at;
}

/** Online = letzter Heartbeat innerhalb von ONLINE_WINDOW_MS.
 *  Wird einmal beim deriveMember-Zeitpunkt evaluiert; Drift während eines
 *  langen Tab-Aufenthalts wird per nowTick (siehe Component) behoben. */
function deriveOnline(lastSeenAt: string | null, now: number): boolean {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t < ONLINE_WINDOW_MS;
}

function deriveMember(m: RawMember, now: number): DerivedMember {
  const online = deriveOnline(m.last_seen_at, now);
  return {
    id:          m.id,
    email:       m.member_email,
    initials:    deriveInitials(m.member_email),
    displayName: deriveDisplayName(m.member_email),
    joined:      isJoined(m),
    online,
    scansToday:  m.scans_today ?? 0,
    // pivotAt: bevorzugt last_seen_at (frischer als joined_at), Fallback joined_at,
    // dann invited_at. Genutzt als Tiebreak in sortMembers.
    pivotAt:     m.last_seen_at ?? m.joined_at ?? m.invited_at,
  };
}

/** Sortier-Reihenfolge:
 *    1. Online (Pulse) zuerst
 *    2. Joined (offline) danach
 *    3. Invited (kein Account) zuletzt
 *  Innerhalb jeder Gruppe:
 *    a) scans_today DESC (aktivere zuerst)
 *    b) pivotAt DESC (kürzlich aktiv > länger inaktiv)
 */
function sortMembers(a: DerivedMember, b: DerivedMember): number {
  if (a.online !== b.online) return a.online ? -1 : 1;
  if (a.joined !== b.joined) return a.joined ? -1 : 1;
  if (a.scansToday !== b.scansToday) return b.scansToday - a.scansToday;
  const at = a.pivotAt ?? "";
  const bt = b.pivotAt ?? "";
  return bt.localeCompare(at);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: "var(--agency-accent-bg)",
        border: "1px solid var(--agency-accent-border)",
        color: "var(--agency-accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

/** StatusDot drei Varianten:
 *   - online   → grüner Pulse-Dot (last_seen_at < 5 Min)
 *   - joined   → grauer statischer Dot (Account vorhanden, aber gerade nicht da)
 *   - invited  → amber statischer Dot (Einladung ausstehend) */
function StatusDot({ kind }: { kind: "online" | "joined" | "invited" }) {
  if (kind === "online") {
    return (
      <span
        title="Online · letzte Aktivität < 5 Min"
        className="wf-team-pulse"
        style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "#22C55E",
          flexShrink: 0,
        }}
      />
    );
  }
  if (kind === "joined") {
    return (
      <span
        title="Offline · Account aktiv, gerade nicht eingeloggt"
        style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "rgba(255,255,255,0.30)",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <span
      title="Einladung ausstehend"
      style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#F59E0B",
        opacity: 0.7,
        flexShrink: 0,
      }}
    />
  );
}

/** Activity-Text-Logik (Spec 7B):
 *   - Online + scans > 0  →  "X Scans heute"
 *   - Online + scans = 0  →  "Bereit"
 *   - Joined-offline + scans > 0  →  "X Scans heute"
 *   - Joined-offline + scans = 0  →  "Keine Scans heute"
 *   - Invited (noch kein Account) →  "Eingeladen am DD.MM.YYYY" */
function activityText(m: DerivedMember): string {
  if (!m.joined) return `Eingeladen am ${formatDate(m.pivotAt)}`;
  if (m.scansToday > 0) {
    return `${m.scansToday} ${m.scansToday === 1 ? "Scan" : "Scans"} heute`;
  }
  return m.online ? "Bereit" : "Keine Scans heute";
}

function MemberRow({ m }: { m: DerivedMember }) {
  const dotKind: "online" | "joined" | "invited" =
    m.online ? "online" : m.joined ? "joined" : "invited";

  // Drill-Down: Klick führt zu /dashboard/team mit ?email=… als Highlight-Hint.
  // Email URL-encoded — robust gegen "+" und andere Sonderzeichen in Adressen.
  const drillHref = `/dashboard/team?email=${encodeURIComponent(m.email)}`;

  return (
    <li style={{ listStyle: "none" }}>
      <Link
        href={drillHref}
        title={`${m.displayName} öffnen`}
        style={{
          display: "flex", alignItems: "center", gap: 11,
          padding: "10px 14px",
          borderRadius: 9,
          textDecoration: "none",
          color: "inherit",
          transition: "background 0.15s ease",
        }}
        className="wf-team-row"
      >
        <Avatar initials={m.initials} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.92)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              minWidth: 0,
            }}>
              {m.displayName}
            </span>
            <StatusDot kind={dotKind} />
          </div>
          <div style={{
            fontSize: 11,
            // Aktivere Members optisch nach vorn — wenn jemand heute Scans
            // gemacht hat, leicht prominenter rendern als "Bereit"/"Keine Scans".
            color: m.scansToday > 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.40)",
            fontWeight: m.scansToday > 0 ? 600 : 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {activityText(m)}
          </div>
        </div>
        {/* Chevron-Hint, dass die Row klickbar ist. */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.25)"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0 }} aria-hidden="true">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </Link>
    </li>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "4px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 14px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: "60%", height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginBottom: 6 }} />
            <div style={{ width: "40%", height: 10, background: "rgba(255,255,255,0.04)", borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InviteCta({ tone = "primary" as "primary" | "secondary", href = "/dashboard/team" }: { tone?: "primary" | "secondary"; href?: string }) {
  const isPrimary = tone === "primary";
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
        padding: isPrimary ? "10px 18px" : "8px 14px",
        borderRadius: 9,
        background: isPrimary ? "var(--agency-accent)" : "transparent",
        color:      isPrimary ? "#fff" : "var(--agency-accent)",
        border:     isPrimary ? "1px solid var(--agency-accent)" : "1px dashed var(--agency-accent-border)",
        fontSize: 12.5, fontWeight: 700, textDecoration: "none",
        boxShadow: isPrimary ? "0 2px 10px var(--agency-accent-glow-soft)" : "none",
        transition: "filter 0.15s ease",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Mitglied einladen
    </Link>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function TeamWidget() {
  const [data,  setData]  = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // nowTick: zwingt alle 60 s ein Re-Eval der Online-Status-Berechnung,
  // damit der Pulse-Dot bei einem 10-Minuten-Tab-Aufenthalt nicht ewig grün
  // bleibt nachdem der Member offline gegangen ist. Daten selbst werden NICHT
  // re-fetched (das wäre eine separate Polling-Strategie). Eine reine
  // Client-side-Drift-Korrektur, basierend auf der bestehenden last_seen_at-
  // Snapshot.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let aborted = false;
    fetch("/api/team")
      .then(async r => {
        if (!r.ok) throw new Error(r.status === 403 ? "Upgrade erforderlich" : `Fehler ${r.status}`);
        return r.json() as Promise<ApiResponse>;
      })
      .then(d => { if (!aborted) { setData(d); setLoading(false); } })
      .catch(err => {
        if (aborted) return;
        setError(err instanceof Error ? err.message : "Verbindungsfehler");
        setLoading(false);
      });
    return () => { aborted = true; };
  }, []);

  const members  = data?.members
    ? data.members.map(m => deriveMember(m, nowTick)).sort(sortMembers)
    : [];
  const maxSeats = data?.maxSeats ?? 0;
  const usedSeats = members.length;
  const isEmpty  = !loading && !error && usedSeats === 0;

  return (
    <aside
      aria-label="Team-Mitglieder"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        boxShadow: "none",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes wf-team-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
          70%  { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        /* Pulse-Element: kleines Stacking-Fenster mit z-index:0 — verhindert,
           dass die nach außen wandernde box-shadow visuell über später
           gerenderte UI-Elemente (Member-Action-Dropdowns, Tooltips, Modals)
           kriecht. Eigenes Stacking + low-priority. */
        .wf-team-pulse {
          position: relative;
          z-index: 0;
          animation: wf-team-pulse-ring 2s infinite;
        }
        /* Liste isoliert ihren Stacking-Context. Selbst wenn ein Pulse-Ring
           über die Row-Bounds tritt, bleibt er innerhalb der Aside (deren
           overflow:hidden ihn final clippt). Defense-in-depth gegen jede
           künftige Dropdown-Erweiterung im Widget-Body. */
        .wf-team-list {
          isolation: isolate;
        }
        .wf-team-row:hover { background: rgba(255,255,255,0.04); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>Team</span>
          {!loading && !error && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: "2px 9px", borderRadius: 20,
              background: "var(--agency-accent-bg)",
              color: "var(--agency-accent)",
              border: "1px solid var(--agency-accent-border)",
              letterSpacing: "0.04em", whiteSpace: "nowrap",
            }}>
              {usedSeats} / {maxSeats} MITGLIEDER
            </span>
          )}
        </div>
      </div>

      {/* Body — flex column. Empty-/Error-State bekommen flex:1 +
          justifyContent:center, damit sie sich vertikal zentrieren wenn
          die Card vom Grid hochgezogen wird (alignItems:stretch). Liste
          (usedSeats > 0) bleibt top-aligned (default flex-column). */}
      <div style={{ flex: 1, padding: "8px", minHeight: 140, display: "flex", flexDirection: "column" }}>
        {loading && <Skeleton />}

        {!loading && error && (
          <div style={{ flex: 1, padding: "20px 14px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#f87171", lineHeight: 1.5 }}>
              {error}
            </p>
          </div>
        )}

        {isEmpty && (
          <div style={{ flex: 1, padding: "28px 16px 22px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 11,
              background: "var(--agency-accent-bg)",
              border: "1px solid var(--agency-accent-border)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--agency-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                Noch keine Mitglieder
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, maxWidth: 220 }}>
                Lade Kollegen ein, damit sie an Audits und Berichten mitarbeiten können.
              </p>
            </div>
            <InviteCta tone="primary" />
          </div>
        )}

        {!loading && !error && usedSeats > 0 && (
          <ul className="wf-team-list" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
            {members.map(m => <MemberRow key={String(m.id)} m={m} />)}
          </ul>
        )}
      </div>

      {/* Footer-CTA — nur wenn Mitglieder vorhanden UND noch Platz im Plan */}
      {!loading && !error && usedSeats > 0 && usedSeats < maxSeats && (
        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <InviteCta tone="secondary" />
        </div>
      )}
    </aside>
  );
}
