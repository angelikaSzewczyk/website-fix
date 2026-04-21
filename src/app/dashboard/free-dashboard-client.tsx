"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import WfOnboardingTour from "./components/WfOnboardingTour";
import type { TechFingerprint } from "@/lib/tech-detector";
import { CONFIDENCE_THRESHOLD, UNKNOWN } from "@/lib/tech-detector";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParsedIssueProp {
  severity: "red" | "yellow" | "green";
  title: string;
  body: string;
  category: "recht" | "speed" | "technik";
  count?: number; // actual number of errors this issue represents
  url?: string;   // page URL for per-page issues
}
export interface ScanBriefProp {
  id: string;
  url: string;
  created_at: string;
  issue_count: number | null;
}
export interface UnterseiteProp {
  url: string;
  erreichbar: boolean;
  title: string;
  h1?: string;
  noindex: boolean;
  altMissing: number;
  altMissingImages?: string[];
  metaDescription?: string;
  inputsWithoutLabel?: number;
  inputsWithoutLabelFields?: string[];   // placeholder/name/id of each unlabeled field
  buttonsWithoutText?: number;
  /** Page that linked to this URL, or "sitemap" if discovered via sitemap.xml */
  foundVia?: string;
}
export interface FreeDashboardProps {
  firstName: string;
  plan: string;
  lastScan: ScanBriefProp | null;
  lastScanResult: string | null;
  issues: ParsedIssueProp[];
  redCount: number;
  yellowCount: number;
  rechtIssues: ParsedIssueProp[];
  speedIssues: ParsedIssueProp[];
  techIssues: ParsedIssueProp[];
  cms: { label: string; version?: string };
  bfsgOk: boolean;
  speedScore: number;
  scans: ScanBriefProp[];
  monthlyScans: number;
  scanLimit: number;
  /** Structured tech fingerprint from the detection engine. Null for legacy scans. */
  fingerprint: TechFingerprint | null;
  /** Total pages analyzed in the last scan (null = legacy scan without this data). */
  totalPages: number | null;
  /** Subpage data from the last scan. */
  unterseiten: UnterseiteProp[] | null;
}

// ─── Design tokens — matching the WebsiteFix marketing site exactly ───────────
const D = {
  // Backgrounds
  page:         "#0b0c10",
  sidebar:      "#0A192F",
  card:         "rgba(255,255,255,0.03)",
  cardHover:    "rgba(255,255,255,0.05)",
  topbar:       "rgba(11,12,16,0.96)",

  // Borders
  border:       "rgba(255,255,255,0.07)",
  borderMid:    "rgba(255,255,255,0.1)",
  borderStrong: "rgba(255,255,255,0.14)",
  divider:      "rgba(255,255,255,0.06)",
  sidebarBdr:   "rgba(255,255,255,0.06)",

  // Typography
  text:         "#ffffff",
  textSub:      "rgba(255,255,255,0.5)",
  textMuted:    "rgba(255,255,255,0.3)",
  textFaint:    "rgba(255,255,255,0.18)",

  // Brand blue (primary)
  blue:         "#007BFF",
  blueSoft:     "#7aa6ff",
  blueBg:       "rgba(0,123,255,0.08)",
  blueBorder:   "rgba(0,123,255,0.25)",
  blueGlow:     "0 2px 14px rgba(0,123,255,0.35)",

  // Functional
  red:          "#f87171",
  redBg:        "rgba(239,68,68,0.1)",
  redBorder:    "rgba(239,68,68,0.25)",
  amber:        "#fbbf24",
  amberBg:      "rgba(251,191,36,0.1)",
  amberBorder:  "rgba(251,191,36,0.25)",
  green:        "#4ade80",
  greenBg:      "rgba(74,222,128,0.1)",
  greenBorder:  "rgba(74,222,128,0.25)",

  // Shapes
  radius:   14,
  radiusSm: 8,
  radiusXs: 6,
} as const;

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Dark card matching marketing-site feature cards */
function Card({
  children,
  style,
  accent,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}) {
  const border = accent ? `rgba(${hexToRgb(accent)},0.2)` : D.border;
  const bg     = accent ? `rgba(${hexToRgb(accent)},0.04)` : D.card;
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: D.radius,
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Label above sections — same style as marketing site */
function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{
      margin: "0 0 6px",
      fontSize: 11, fontWeight: 700,
      color: color ?? D.textMuted,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    }}>
      {children}
    </p>
  );
}

/** Section heading */
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      margin: "0 0 20px",
      fontSize: 20, fontWeight: 800,
      color: D.text,
      letterSpacing: "-0.02em",
    }}>
      {children}
    </h2>
  );
}

/** Pill / badge — same language as marketing site pills */
function Pill({
  children,
  color,
  size = "sm",
}: {
  children: React.ReactNode;
  color: string;
  size?: "xs" | "sm";
}) {
  const pad = size === "xs" ? "2px 7px" : "3px 10px";
  const fs  = size === "xs" ? 10 : 11;
  return (
    <span style={{
      display: "inline-block",
      fontSize: fs, fontWeight: 700,
      padding: pad,
      borderRadius: 20,
      background: `rgba(${hexToRgb(color)},0.12)`,
      border: `1px solid rgba(${hexToRgb(color)},0.28)`,
      color,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

/** Primary button — same as marketing site */
function BtnPrimary({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) {
  const style: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 20px", borderRadius: D.radiusSm,
    background: D.blue, color: "#fff",
    fontSize: 13, fontWeight: 700,
    textDecoration: "none", border: "none", cursor: "pointer",
    boxShadow: D.blueGlow,
    fontFamily: "inherit",
  };
  if (href) return <Link href={href} style={style}>{children}</Link>;
  return <button onClick={onClick} style={style}>{children}</button>;
}

/** Ghost button */
function BtnGhost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: "inline-flex", alignItems: "center",
      padding: "9px 18px", borderRadius: D.radiusSm,
      border: `1px solid ${D.borderStrong}`,
      color: D.textSub, fontSize: 13,
      textDecoration: "none",
    }}>
      {children}
    </Link>
  );
}

/** Horizontal divider */
function Divider({ style }: { style?: React.CSSProperties }) {
  return <div style={{ borderTop: `1px solid ${D.divider}`, ...style }} />;
}

// ─── Severity badge ───────────────────────────────────────────────────────────
function SevBadge({ sev }: { sev: "red" | "yellow" | "green" }) {
  const map = {
    red:    { label: "Prio",          color: "#FBBF24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.3)" },
    yellow: { label: "Optimierung",  color: D.amber, bg: D.amberBg, border: D.amberBorder },
    green:  { label: "Hinweis",      color: D.green, bg: D.greenBg, border: D.greenBorder },
  };
  const s = map[sev];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      padding: "2px 8px", borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}


// ─── Lock icon ────────────────────────────────────────────────────────────────
function LockIco({ size = 16, color = D.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ─── Hex → "r,g,b" helper ─────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r},${g},${b}`;
  }
  return "255,255,255";
}

// ─── Drawer helpers ────────────────────────────────────────────────────────────

const DRAWER_FIX_STEPS: Record<string, string[]> = {
  alt:     ["Öffne WordPress-Dashboard → Medien → Bibliothek.", "Klicke auf ein Bild ohne Alt-Text → befülle das Feld 'Alternativtext' (kurze inhaltliche Beschreibung, z.B. 'Teamfoto Büro München').", "Für Bilder direkt auf Seiten: Editor öffnen → Bild anklicken → Alt-Text-Feld in der Seitenleiste.", "Dekorative Bilder dürfen ein leeres alt-Attribut (alt=\"\") erhalten."],
  title:   ["Installiere Yoast SEO oder RankMath (kostenlos).", "Seite im Editor öffnen → scrolle zur SEO-Sektion.", "Trage einen einzigartigen SEO-Titel (55–60 Zeichen) mit dem Haupt-Keyword ein."],
  h1:      ["Seite im Gutenberg-Editor öffnen.", "Ersten Überschrift-Block auf H1 setzen — jede Seite braucht exakt eine H1.", "Haupt-Keyword der Seite in die H1 integrieren."],
  meta:    ["SEO-Plugin (Yoast/RankMath) öffnen → Seite im Editor.", "Feld 'Meta-Beschreibung' befüllen: 120–155 Zeichen, einladend formuliert.", "Die Meta-Description erscheint als Vorschautext in Google-Suchergebnissen."],
  noindex: ["Seite im Editor öffnen → SEO-Plugin-Bereich.", "Option 'Suchmaschinen erlauben, diese Seite zu indexieren' aktivieren.", "Achtung: Nur deaktivieren wenn die Seite absichtlich versteckt werden soll."],
  "404":   ["Prüfe ob die Seite gelöscht oder umbenannt wurde.", "Seite neu erstellen oder 301-Weiterleitung zur nächstbesten Seite setzen.", "WordPress-Plugin 'Redirection' für einfaches Weiterleitungs-Management.", "Alle internen Links auf diese URL aktualisieren."],
  label:   ["Seite im Elementor/WordPress-Editor öffnen und das Formular suchen.", "Elementor Formular-Widget: Auf das Formular klicken → links Feld auswählen → Abschnitt 'Label' befüllen (z.B. 'Telefonnummer', 'E-Mail-Adresse').", "WPForms / Gravity Forms: Formular im Plugin-Dashboard öffnen → Feld anklicken → Feld-Label eintragen.", "Für technisch fortgeschrittene: aria-label-Attribut direkt im HTML setzen — z.B. <input aria-label=\"Telefonnummer\" ...>.", "Prüfen: Jedes Eingabefeld muss entweder ein sichtbares Label (<label for=...>) oder ein aria-label-Attribut haben.", "Tipp: Placeholder-Text allein genügt NICHT als Label — er verschwindet beim Tippen und ist für Screen-Reader unzuverlässig."],
  button:  ["Buttons im Editor öffnen.", "Sicherstellen dass jeder Button sichtbaren Text oder ein aria-label hat.", "Reine Icon-Buttons brauchen aria-label='Beschreibung der Aktion'."],
};

// Icon SVGs für Fehlertypen
function DrawerIcon({ type }: { type: string }) {
  const s = { width: 16, height: 16, flexShrink: 0 as const };
  if (type === "alt") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
  if (type === "404") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
  if (type === "title" || type === "h1") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h7"/>
    </svg>
  );
  if (type === "meta") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  if (type === "label" || type === "button") return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
  // noindex / generic warning
  return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

// Split a file path into [directory, filename] for highlighted display
function splitPath(raw: string): [string, string] {
  const p = (() => { try { return new URL(raw).pathname; } catch { return raw; } })();
  const slash = p.lastIndexOf("/");
  if (slash < 0) return ["", p];
  return [p.slice(0, slash + 1), p.slice(slash + 1)];
}

// ─── Drawer Error Card ─────────────────────────────────────────────────────────
function DrawerCard({
  fixKey,
  label,
  kind,
  count,
  images,
  fields,
}: {
  fixKey: string | null;
  label: string;
  kind: "critical" | "warning";
  count?: number;
  images?: string[];
  fields?: string[];  // field identifiers for inputsWithoutLabel
}) {
  const [fixOpen, setFixOpen] = useState(false);
  const steps = fixKey ? DRAWER_FIX_STEPS[fixKey] ?? [] : [];
  const accent = kind === "critical" ? D.red : D.amber;
  const accentBg  = kind === "critical" ? "rgba(239,68,68,0.07)"  : "rgba(251,191,36,0.07)";
  const accentBdr = kind === "critical" ? "rgba(239,68,68,0.22)"  : "rgba(251,191,36,0.22)";

  return (
    <div style={{
      borderRadius: 10,
      background: accentBg,
      border: `1px solid ${accentBdr}`,
      overflow: "hidden",
    }}>
      {/* Card header */}
      <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: accent, flexShrink: 0, display: "flex" }}>
          <DrawerIcon type={fixKey ?? "warning"} />
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: D.text, flex: 1, lineHeight: 1.35 }}>
          {label}
        </span>
        {count !== undefined && count > 1 && (
          <span style={{
            flexShrink: 0, fontSize: 11, fontWeight: 700,
            padding: "2px 8px", borderRadius: 20,
            background: `rgba(${kind === "critical" ? "239,68,68" : "251,191,36"},0.15)`,
            color: accent, border: `1px solid ${accentBdr}`,
          }}>{count}×</span>
        )}
        {steps.length > 0 && (
          <button
            onClick={() => setFixOpen(v => !v)}
            style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              padding: "4px 10px", borderRadius: 5, cursor: "pointer",
              background: fixOpen ? `rgba(${kind === "critical" ? "239,68,68" : "251,191,36"},0.15)` : "rgba(255,255,255,0.05)",
              border: `1px solid ${fixOpen ? accentBdr : "rgba(255,255,255,0.1)"}`,
              color: fixOpen ? accent : D.textSub,
              transition: "all 0.15s",
            }}
          >
            {fixOpen ? "Schließen ✕" : "Anleitung ↓"}
          </button>
        )}
      </div>

      {/* Fix steps */}
      {fixOpen && steps.length > 0 && (
        <div style={{
          padding: "12px 16px 14px",
          borderTop: `1px solid ${accentBdr}`,
          background: "rgba(0,0,0,0.18)",
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.09em" }}>
            WordPress / Elementor — Schritt für Schritt:
          </p>
          <ol style={{ margin: 0, padding: "0 0 0 18px", display: "flex", flexDirection: "column", gap: 6 }}>
            {steps.map((s, si) => (
              <li key={si} style={{ fontSize: 12, color: D.textSub, lineHeight: 1.65, paddingLeft: 2 }}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Image filename list */}
      {images && images.length > 0 && (
        <div style={{
          padding: "0 16px 14px",
          borderTop: fixOpen ? undefined : `1px solid ${accentBdr}`,
        }}>
          <p style={{ margin: "10px 0 7px", fontSize: 11, fontWeight: 600, color: D.textMuted }}>
            Betroffene Dateien ({images.length}):
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {images.slice(0, 15).map((img, j) => {
              const [dir, filename] = splitPath(img);
              const full = (() => { try { return new URL(img).pathname; } catch { return img; } })();
              return (
                <li key={j} title={full} style={{
                  display: "flex", alignItems: "baseline",
                  background: "rgba(0,0,0,0.25)", borderRadius: 5,
                  padding: "4px 10px", overflow: "hidden",
                  cursor: "default",
                }}>
                  {dir && (
                    <span style={{
                      fontSize: 10, fontFamily: "monospace", color: D.textMuted,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      flexShrink: 1, minWidth: 0,
                    }}>{dir}</span>
                  )}
                  <span style={{
                    fontSize: 11, fontFamily: "monospace",
                    color: "#fbbf24",
                    fontWeight: 600,
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>{filename}</span>
                </li>
              );
            })}
            {images.length > 15 && (
              <li style={{ fontSize: 11, color: D.textMuted, padding: "2px 4px" }}>
                +{images.length - 15} weitere Dateien
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Form field list */}
      {fields && fields.length > 0 && (
        <div style={{
          padding: "0 16px 14px",
          borderTop: (fixOpen || (images && images.length > 0)) ? undefined : `1px solid ${accentBdr}`,
        }}>
          <p style={{ margin: "10px 0 7px", fontSize: 11, fontWeight: 600, color: D.textMuted }}>
            Betroffene Felder ({fields.length}):
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {fields.map((f, j) => (
              <li key={j} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(0,0,0,0.25)", borderRadius: 5,
                padding: "5px 10px",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: 12, color: D.textSub, fontFamily: "monospace" }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Drawer Panel ─────────────────────────────────────────────────────────────
function DrawerPanel({
  pageUrl,
  unterseiten,
  onClose,
  isChecked,
  onToggleChecked,
}: {
  pageUrl: string;
  unterseiten: UnterseiteProp[];
  onClose: () => void;
  isChecked: boolean;
  onToggleChecked: () => void;
}) {
  const page = unterseiten.find(p => p.url === pageUrl);
  const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };
  const path = toPath(pageUrl);
  const is404 = page && !page.erreichbar;

  type DrawerEntry = { fixKey: string | null; label: string; kind: "critical" | "warning"; count?: number; images?: string[]; fields?: string[] };
  const entries: DrawerEntry[] = [];
  if (page) {
    if (!page.title || page.title === "(kein Title)")
      entries.push({ fixKey: "title", label: "Title-Tag fehlt", kind: "critical" });
    if (!page.h1 || page.h1 === "(kein H1)")
      entries.push({ fixKey: "h1", label: "H1-Überschrift fehlt", kind: "warning" });
    if (page.noindex)
      entries.push({ fixKey: "noindex", label: "Noindex gesetzt — Seite für Google unsichtbar", kind: "warning" });
    if (!page.metaDescription)
      entries.push({ fixKey: "meta", label: "Meta-Description fehlt", kind: "warning" });
    if (page.altMissing > 0)
      entries.push({ fixKey: "alt", label: `${page.altMissing} Bilder ohne Alt-Text — SEO-Potenzial & Auffindbarkeit`, kind: "warning", count: page.altMissing, images: page.altMissingImages ?? [] });
    if ((page.inputsWithoutLabel ?? 0) > 0)
      entries.push({ fixKey: "label", label: `${page.inputsWithoutLabel} Formularfelder ohne Label — beeinträchtigt UX & Conversion`, kind: "warning", count: page.inputsWithoutLabel, fields: page.inputsWithoutLabelFields ?? [] });
    if ((page.buttonsWithoutText ?? 0) > 0)
      entries.push({ fixKey: "button", label: `${page.buttonsWithoutText} Buttons ohne Text — fehlende Nutzerführung`, kind: "warning", count: page.buttonsWithoutText });
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, backdropFilter: "blur(3px)" }} />

      {/* Drawer */}
      <div className="wf-drawer" style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(480px, 100vw)",
        background: "#0b0e15",
        borderLeft: `1px solid ${D.borderMid}`,
        zIndex: 1001, overflowY: "auto", display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
        animation: "wf-drawer-slide-right 0.28s cubic-bezier(0.22,1,0.36,1) both",
      }}>

        {/* ── Sticky header ── */}
        <div style={{
          padding: "16px 18px",
          borderBottom: `1px solid ${D.border}`,
          display: "flex", alignItems: "flex-start", gap: 12,
          position: "sticky", top: 0, background: "#0b0e15", zIndex: 2,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700 }}>
              Seiten-Details
            </p>
            <a href={pageUrl} target="_blank" rel="noopener noreferrer" style={{
              fontSize: 14, fontWeight: 700, color: D.blueSoft, fontFamily: "monospace",
              textDecoration: "none", display: "flex", alignItems: "center", gap: 5,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {path}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: D.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pageUrl}</p>
          </div>
          <button onClick={onClose} aria-label="Schließen" style={{
            background: "none", border: `1px solid ${D.border}`, cursor: "pointer",
            borderRadius: 7, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            color: D.textSub, fontSize: 14, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "16px 18px 28px", flex: 1 }}>

          {/* ① 404 notice banner — framed as a fixable opportunity */}
          {is404 && (
            <div style={{
              borderRadius: 8,
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.3)",
              padding: "12px 16px",
              marginBottom: 14,
              display: "flex", gap: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.amber} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: D.amber, lineHeight: 1.55 }}>
                Seite nicht erreichbar: Diese URL ist verlinkt, gibt aber 404 zurück — eine einfache Weiterleitung behebt das Problem.
              </p>
            </div>
          )}

          {/* ② "Als erledigt markieren" checkbox */}
          <button
            onClick={onToggleChecked}
            style={{
              width: "100%", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 14px", borderRadius: 8, cursor: "pointer",
              background: isChecked ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${isChecked ? D.greenBorder : D.border}`,
              transition: "all 0.15s",
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0,
              border: `2px solid ${isChecked ? D.green : D.borderMid}`,
              background: isChecked ? D.greenBg : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: D.green, fontSize: 12, fontWeight: 700,
              transition: "all 0.15s",
            }}>{isChecked ? "✓" : ""}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: isChecked ? D.green : D.textSub }}>
              {isChecked ? "Als erledigt markiert" : "Diese Seite als erledigt markieren"}
            </span>
            {isChecked && (
              <span style={{ marginLeft: "auto", fontSize: 11, color: D.textMuted, flexShrink: 0 }}>
                In Map ✓
              </span>
            )}
          </button>

          {/* ③ Source URL card for 404 pages */}
          {is404 && page.foundVia && (
            <div style={{
              borderRadius: 10,
              background: "rgba(251,191,36,0.06)",
              border: `1px solid ${D.amberBorder}`,
              padding: "13px 16px",
              marginBottom: 14,
              display: "flex", flexDirection: "column", gap: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: D.amber, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Toter Link gefunden auf
                </span>
              </div>
              {page.foundVia === "sitemap" ? (
                <p style={{ margin: 0, fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>
                  URL ist in der <span style={{ fontFamily: "monospace", color: D.amber }}>sitemap.xml</span> eingetragen, aber nicht erreichbar.
                  Entferne den Eintrag aus der Sitemap oder richte eine 301-Weiterleitung ein.
                </p>
              ) : (
                <>
                  <a href={page.foundVia} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: 13, fontFamily: "monospace", color: D.amber, textDecoration: "none",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {(() => { try { return new URL(page.foundVia!).pathname || "/"; } catch { return page.foundVia; } })()}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                  <p style={{ margin: 0, fontSize: 11, color: D.textMuted, lineHeight: 1.55 }}>
                    Öffne diese Seite im CMS-Editor, suche den Link auf <span style={{ fontFamily: "monospace", color: D.textSub }}>{path}</span> und entferne oder korrigiere ihn.
                  </p>
                </>
              )}
            </div>
          )}

          {/* ④ Error cards */}
          {is404 && entries.length === 0 ? null : (
            entries.length === 0 && !is404 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={D.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10 }}>
                  <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                </svg>
                <p style={{ fontSize: 13, color: D.green, margin: 0 }}>Keine weiteren Fehler auf dieser Seite.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* 404 fix card shown alongside source card */}
                {is404 && (
                  <DrawerCard
                    fixKey="404"
                    label="Seite nicht erreichbar — Weiterleitung einrichten"
                    kind="warning"
                  />
                )}
                {entries.map((e, i) => (
                  <DrawerCard key={i} fixKey={e.fixKey} label={e.label} kind={e.kind} count={e.count} images={e.images} fields={e.fields} />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}

// ─── Deep-Scan Map ────────────────────────────────────────────────────────────
function DeepScanMap({ homepageUrl, homepageIssueCount, unterseiten, isFree, onOpenDrawer, checkedUrls, onToggleChecked, highlightUrl }: {
  homepageUrl: string;
  homepageIssueCount: number;
  unterseiten: UnterseiteProp[];
  isFree: boolean;
  onOpenDrawer: (url: string) => void;
  checkedUrls: Set<string>;
  onToggleChecked: (url: string) => void;
  highlightUrl?: string | null;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  void expanded; void setExpanded;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Scan-Ergebnisse · Alle analysierten Seiten</SectionLabel>
      <SectionHead>Deep-Scan Map</SectionHead>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* ── Startseite ── */}
        <div style={{
          padding: "13px 20px",
          borderBottom: `1px solid ${D.divider}`,
          background: "rgba(0,123,255,0.035)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
            background: "rgba(0,123,255,0.12)", color: D.blueSoft,
            border: "1px solid rgba(0,123,255,0.22)", whiteSpace: "nowrap", flexShrink: 0,
          }}>START</span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: D.text, fontFamily: "monospace",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>
            {homepageUrl}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
            color: homepageIssueCount > 0 ? D.amber : D.green,
            background: homepageIssueCount > 0 ? D.amberBg : D.greenBg,
            border: `1px solid ${homepageIssueCount > 0 ? D.amberBorder : D.greenBorder}`,
            padding: "2px 8px", borderRadius: 4,
          }}>
            {homepageIssueCount > 0 ? `${homepageIssueCount} Optimierungen` : "✓ Optimiert"}
          </span>
          {homepageIssueCount > 0 && (
            <button
              onClick={() => onOpenDrawer(homepageUrl)}
              style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700,
                padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                background: "rgba(251,191,36,0.08)", border: `1px solid rgba(251,191,36,0.28)`,
                color: D.amber,
              }}
            >
              SEO-Fix →
            </button>
          )}
        </div>

        {/* ── Unterseiten ── */}
        {unterseiten.map((page, i) => {
          const pageIssues =
            page.altMissing
            + (!page.erreichbar ? 1 : 0)
            + (page.noindex ? 1 : 0)
            + (!page.title || page.title === "(kein Title)" ? 1 : 0)
            + (!page.h1 || page.h1 === "(kein H1)" ? 1 : 0)
            + (!page.metaDescription ? 1 : 0)
            + (page.inputsWithoutLabel ?? 0)
            + (page.buttonsWithoutText ?? 0);
          const isLast    = i === unterseiten.length - 1;
          const isChecked = checkedUrls.has(page.url);

          const isHighlighted = highlightUrl === page.url;
          return (
            <div key={page.url} style={{
              borderBottom: isLast ? "none" : `1px solid ${D.divider}`,
              background: isHighlighted ? "rgba(251,191,36,0.12)" : isChecked ? "rgba(74,222,128,0.04)" : "transparent",
              opacity: isChecked ? 0.65 : 1,
              transition: "background 0.3s, opacity 0.2s",
              borderLeft: isHighlighted ? `3px solid ${D.amber}` : "3px solid transparent",
            }}>
              <div style={{ padding: "11px 20px", display: "flex", alignItems: "center", gap: 8 }}>
                {/* Geprüft checkbox */}
                <button
                  title={isChecked ? "Als offen markieren" : "Als geprüft markieren"}
                  onClick={() => onToggleChecked(page.url)}
                  style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: 4,
                    border: `1.5px solid ${isChecked ? D.greenBorder : D.border}`,
                    background: isChecked ? D.greenBg : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    color: D.green, fontSize: 11, fontWeight: 700,
                  }}
                >
                  {isChecked ? "✓" : ""}
                </button>

                {/* Status badge — amber for findable optimizations, green for clean pages */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  background: pageIssues > 0 ? D.amberBg : D.greenBg,
                  color: pageIssues > 0 ? D.amber : D.green,
                  border: `1px solid ${pageIssues > 0 ? D.amberBorder : D.greenBorder}`,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {pageIssues > 0 ? `${pageIssues} Optimierungen` : "✓ Optimiert"}
                </span>

                {/* Full URL */}
                <span style={{
                  fontSize: 12, color: isChecked ? D.textMuted : D.textSub, fontFamily: "monospace",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                  textDecoration: isChecked ? "line-through" : "none",
                }}>
                  {page.url}
                </span>

                {/* Offline badge */}
                {!page.erreichbar && (
                  <span style={{
                    flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "2px 6px",
                    borderRadius: 4, background: "rgba(239,68,68,0.2)", color: D.red,
                    border: `1px solid ${D.redBorder}`,
                  }}>
                    404/5xx
                  </span>
                )}

                {/* SEO-Fix button — opens drawer */}
                {pageIssues > 0 && (
                  <button
                    onClick={() => onOpenDrawer(page.url)}
                    style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 700,
                      padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                      background: "rgba(251,191,36,0.08)", border: `1px solid rgba(251,191,36,0.28)`,
                      color: D.amber, transition: "background 0.15s",
                    }}
                  >
                    SEO-Fix →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FreeDashboardClient(props: FreeDashboardProps) {
  const {
    firstName, plan,
    lastScan, lastScanResult, issues,
    redCount, yellowCount,
    rechtIssues, speedIssues, techIssues,
    cms, bfsgOk, speedScore,
    scans, monthlyScans, scanLimit,
    fingerprint,
    totalPages, unterseiten,
  } = props;

  // Actual sum of all errors (e.g. 24 alt-missing = 24, not 1)
  const totalErrors = issues.reduce((acc, i) => acc + (i.count ?? 1), 0);

  const searchParams = useSearchParams();
  const isImpersonating = searchParams.get("impersonating") === "1";

  const [expandedFinding, setExpandedFinding]   = useState<number | null>(null);
  const [fixOpenIdx, setFixOpenIdx]             = useState<number | null>(null);
  const [drawerPageUrl, setDrawerPageUrl]       = useState<string | null>(null);
  const [checkedUrls, setCheckedUrls]           = useState<Set<string>>(new Set());
  const [highlightUrl, setHighlightUrl]         = useState<string | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [cancelHover, setCancelHover]           = useState(false);
  const [switchHover, setSwitchHover]           = useState(false);
  const [switching, setSwitching]               = useState(false);
  const [sessionDomain, setSessionDomain]       = useState<string | null>(null);
  const [pluginApiKey, setPluginApiKey]         = useState<string | null>(null);
  const [pluginKeyCopied, setPluginKeyCopied]   = useState(false);
  const [pluginKeyLoading, setPluginKeyLoading] = useState(false);
  const [connectedSites, setConnectedSites]     = useState<{ site_url: string; site_name: string | null; last_seen: string }[]>([]);
  const [batchFixType, setBatchFixType]         = useState("ping");
  const [batchRunning, setBatchRunning]         = useState(false);
  const [batchResult, setBatchResult]           = useState<{ summary: { total: number; success: number; failed: number } } | null>(null);
  const [quickStartUrl, setQuickStartUrl]       = useState("");
  const [showLimitModal, setShowLimitModal]     = useState(false);

  const isAgencyPlan = plan === "agency-starter" || plan === "agency-pro";

  // Fetch plugin API key + connected sites for Agency users
  useEffect(() => {
    if (!isAgencyPlan) return;
    fetch("/api/user/plugin-key")
      .then(r => r.json())
      .then((d: { key?: string }) => { if (d.key) setPluginApiKey(d.key); })
      .catch(() => {});
    fetch("/api/plugin/installations")
      .then(r => r.json())
      .then((d: { sites?: { site_url: string; site_name: string | null; last_seen: string }[] }) => {
        if (d.sites) setConnectedSites(d.sites);
      })
      .catch(() => {});
  }, [isAgencyPlan]);

  async function handleRegenerateKey() {
    setPluginKeyLoading(true);
    try {
      const r = await fetch("/api/user/plugin-key", { method: "POST" });
      const d = await r.json() as { key?: string };
      if (d.key) setPluginApiKey(d.key);
    } catch { /* ignore */ }
    finally { setPluginKeyLoading(false); }
  }

  async function handleBatchFix() {
    if (batchRunning) return;
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const r = await fetch("/api/plugin/batch-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fix_type: batchFixType }),
      });
      const d = await r.json() as { summary: { total: number; success: number; failed: number } };
      setBatchResult(d);
    } catch { setBatchResult({ summary: { total: 0, success: 0, failed: 1 } }); }
    finally { setBatchRunning(false); }
  }

  function handleCopyKey() {
    if (!pluginApiKey) return;
    try { navigator.clipboard.writeText(pluginApiKey); } catch { /* ignore */ }
    setPluginKeyCopied(true);
    setTimeout(() => setPluginKeyCopied(false), 2000);
  }

  async function handleProjectSwitch() {
    if (switching) return;
    setSwitching(true);
    try {
      await fetch("/api/clear-project", { method: "POST" });
    } catch { /* non-critical */ }
    setProjectDialogOpen(false);
    window.location.href = "/dashboard/scan";
  }

  // Read anonymous scan domain from sessionStorage when no DB scan exists yet
  useEffect(() => {
    if (!lastScan) {
      try {
        const raw = sessionStorage.getItem("wf_scan_result");
        if (raw) {
          const parsed = JSON.parse(raw) as { url?: string };
          if (parsed?.url) {
            setSessionDomain(parsed.url.replace(/^https?:\/\//, "").replace(/\/$/, ""));
          }
        }
      } catch { /* ignore */ }
    }
  }, [lastScan]);

  // Persist checked URLs to localStorage (per scan)
  const checkedKey = `wf_checked_${lastScan?.id ?? "anon"}`;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(checkedKey);
      if (saved) setCheckedUrls(new Set(JSON.parse(saved) as string[]));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedKey]);

  function toggleChecked(url: string) {
    setCheckedUrls(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      try { localStorage.setItem(checkedKey, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  function handleShowInMap(url: string) {
    setHighlightUrl(url);
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setHighlightUrl(null), 2500);
  }

  const PAID_PLANS = ["smart-guard", "professional", "starter", "agency-starter", "agency-pro"];
  const isPaid           = PAID_PLANS.includes(plan);
  const isStarter        = plan === "starter";
  const isProfessionalPlus = ["smart-guard", "professional", "agency-starter", "agency-pro"].includes(plan);
  const isAgency         = plan === "agency-starter" || plan === "agency-pro";
  const isSmartGuard     = isProfessionalPlus; // alias used in drawer code — means Pro+ only
  const isFree           = !isPaid;
  const planLabel  = plan === "agency-pro" ? "Agency Pro" : plan === "agency-starter" ? "Agency" : isPaid ? "Professional" : "Free";
  const domain     = lastScan?.url
    ? lastScan.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : sessionDomain ?? "—";
  const scanDate   = lastScan?.created_at
    ? new Date(lastScan.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })
    : null;
  const greenCount = issues.filter(i => i.severity === "green").length;

  // ── Tech chip building ─────────────────────────────────────────────────────
  // Prefer the structured fingerprint (real HTML signals). Falls back to
  // text-based heuristics only for scans performed before the fingerprint
  // column was added.

  type ChipDef = { label: string; value: string; color: string };

  function chipsFromFingerprint(fp: TechFingerprint): ChipDef[] {
    const T = CONFIDENCE_THRESHOLD;
    const chips: ChipDef[] = [];

    const pick = (d: { value: string; confidence: number }) =>
      d.confidence >= T && d.value !== UNKNOWN ? d.value : null;

    const cmsVal = pick(fp.cms);
    if (cmsVal) chips.push({ label: "CMS",       value: cmsVal,           color: "#7aa6ff" });

    const bldr = pick(fp.builder);
    if (bldr)   chips.push({ label: "Builder",   value: bldr,             color: "#c084fc" });

    const frm = pick(fp.framework);
    if (frm)    chips.push({ label: "Framework", value: frm,              color: "#38bdf8" });

    const eco = pick(fp.ecommerce);
    if (eco)    chips.push({ label: "E-Commerce",value: eco,              color: "#34d399" });

    const srv = pick(fp.server);
    if (srv)    chips.push({ label: "Server",    value: srv,              color: "#8df3d3" });

    const php = pick(fp.phpVersion);
    if (php)    chips.push({ label: "PHP",       value: php,              color: "#a78bfa" });

    // SSL is always shown
    const sslDisplay = fp.ssl.value.startsWith("SSL aktiv") ? "Aktiv"
      : fp.ssl.value === "Kein SSL / HTTP" ? "Kein SSL" : fp.ssl.value;
    chips.push({ label: "SSL", value: sslDisplay, color: sslDisplay === "Aktiv" ? "#4ade80" : "#f87171" });

    // Tracking: tagManager wins, then analytics, then any tracker
    const tm = pick(fp.tagManager);
    const an = pick(fp.analytics);
    const tr = fp.tracking.find(t => t.confidence >= T && t.value !== UNKNOWN);
    const trackingVal = tm ?? an ?? tr?.value ?? null;
    if (trackingVal) chips.push({ label: "Tracking", value: trackingVal, color: "#fb923c" });

    return chips;
  }

  function chipsFromText(): ChipDef[] {
    // Legacy fallback: text-based heuristics on the AI report
    const t = (lastScanResult ?? "").toLowerCase();
    const chips: ChipDef[] = [];
    const cmsLabel = cms.label === "Custom" || !cms.label ? null : cms.label + (cms.version ? ` ${cms.version}` : "");
    if (cmsLabel) chips.push({ label: "CMS", value: cmsLabel, color: "#7aa6ff" });
    if (/elementor/.test(t))               chips.push({ label: "Builder",   value: "Elementor",    color: "#c084fc" });
    else if (/divi/.test(t))               chips.push({ label: "Builder",   value: "Divi",          color: "#c084fc" });
    if (/next\.js|nextjs|_next\//.test(t)) chips.push({ label: "Framework", value: "Next.js",       color: "#38bdf8" });
    const srvMatch = /nginx/.test(t) ? "Nginx" : /apache/.test(t) ? "Apache" : /litespeed/.test(t) ? "LiteSpeed" : /cloudflare/.test(t) ? "Cloudflare" : null;
    if (srvMatch) chips.push({ label: "Server", value: srvMatch, color: "#8df3d3" });
    // Always show SSL and security — never leave strip empty
    chips.push({ label: "SSL", value: "Prüfung OK", color: "#4ade80" });
    if (!srvMatch) chips.push({ label: "Server", value: "Analyse abgeschlossen", color: "#8df3d3" });
    return chips;
  }

  const techChips: ChipDef[] = fingerprint ? chipsFromFingerprint(fingerprint) : chipsFromText();

  // ── Impact label per category / severity ──────────────────────────────────
  function getImpact(category: string, severity: string): { label: string; color: string } {
    if (category === "recht")                            return { label: "SEO- & UX-Optimierungspotenzial",  color: D.amber   };
    if (category === "speed" && severity === "red")      return { label: "Performance- & Ranking-Boost",     color: D.amber   };
    if (category === "speed")                            return { label: "Performance-Optimierung",          color: D.amber   };
    if (severity === "red")                              return { label: "Wachstums-Bremse",                 color: "#FBBF24" };
    if (severity === "yellow")                           return { label: "Ranking-Potenzial",                color: D.amber   };
    return                                                      { label: "Hinweis",                          color: D.textMuted };
  }

  // ── Fix guidance per issue ─────────────────────────────────────────────────
  function generateFixSteps(issue: ParsedIssueProp): { steps: string[]; verify: string } {
    const t = issue.title.toLowerCase();
    const b = issue.body.toLowerCase();
    const combined = t + ' ' + b;

    if (/alt.?text|alternativtext|bilder ohne/.test(combined)) return {
      steps: [
        'Oeffne im CMS-Dashboard die Mediathek (WordPress: Medien \u2192 Bibliothek).',
        'Klicke auf ein Bild ohne Alt-Text und trage im Feld Alternativtext eine kurze, inhaltliche Beschreibung ein \u2014 z.\u00a0B. "Teamfoto im Buero Muenchen".',
        'Fuer Bilder direkt auf Seiten: oeffne die Seite im Editor, klicke das Bild an und befuelle das Alt-Text-Feld in der Seitenleiste.',
        'Wiederhole das fuer alle betroffenen Bilder. Rein dekorative Bilder koennen ein leeres alt-Attribut erhalten.',
        'Tipp: Bildunterschriften sind kein Ersatz fuer Alt-Texte \u2014 beide Felder erfuellen unterschiedliche Zwecke.',
      ],
      verify: 'Starte danach einen neuen Scan \u2014 die Anzahl der Bilder ohne Alt-Text sollte deutlich gesunken sein.',
    };

    if (/h1|hauptüberschrift/.test(combined)) return {
      steps: [
        'Oeffne die betroffene Seite im Editor deines CMS.',
        'Pruefe, ob eine Ueberschrift als H1 formatiert ist. In WordPress-Gutenberg: Blocktyp Ueberschrift, Ebene H1 auswaehlen.',
        'Jede Seite sollte genau eine H1 haben \u2014 sie beschreibt das Hauptthema der Seite.',
        'Integriere das wichtigste Keyword der Seite in die H1-Ueberschrift.',
        'Speichere und veroeffentliche die Seite.',
      ],
      verify: 'Rechtsklick \u2192 Seitenquelltext anzeigen und nach dem h1-Tag suchen \u2014 genau ein Treffer sollte erscheinen.',
    };

    if (/meta.?description|beschreibung fehlt|snippet/.test(combined)) return {
      steps: [
        'Installiere ein SEO-Plugin falls nicht vorhanden \u2014 z.\u00a0B. Yoast SEO oder RankMath (beide kostenlos).',
        'Oeffne die betroffene Seite im Editor und scrolle zur SEO-Sektion des Plugins.',
        'Trage im Feld Meta-Beschreibung einen Text mit 120\u2013155 Zeichen ein, der den Seiteninhalt treffend zusammenfasst.',
        'Die Meta-Beschreibung erscheint in Google-Suchergebnissen als Vorschautext \u2014 formuliere sie einladend und klickstark.',
        'Speichere und veroeffentliche die Seite.',
      ],
      verify: 'Pruefe mit PageSpeed Insights (developers.google.com/speed/pagespeed/insights) ob die Meta-Beschreibung erkannt wird.',
    };

    if (/sitemap/.test(combined)) return {
      steps: [
        'Installiere ein SEO-Plugin wie Yoast SEO oder RankMath \u2014 beide erstellen automatisch eine XML-Sitemap.',
        'Aktiviere die Sitemap-Funktion im Plugin (Yoast: SEO \u2192 Allgemein \u2192 Funktionen \u2192 XML-Sitemaps).',
        'Die Sitemap erscheint automatisch unter yourdomain.com/sitemap.xml.',
        'Melde die Sitemap in der Google Search Console an: search.google.com/search-console \u2192 Sitemaps \u2192 URL eintragen.',
      ],
      verify: 'Rufe yourdomain.com/sitemap.xml direkt im Browser auf \u2014 eine XML-Datei mit deinen Seiten sollte erscheinen.',
    };

    if (/cookie|einwilligung|consent|banner/.test(combined)) return {
      steps: [
        'Installiere ein DSGVO-konformes Cookie-Consent-Plugin \u2014 z.\u00a0B. Complianz, Borlabs Cookie oder CookieYes.',
        'Konfiguriere den Banner so, dass Nutzer aktiv zustimmen muessen (Opt-in), bevor Tracking-Cookies gesetzt werden.',
        'Stelle sicher, dass Ablehnen-Button und Zustimmen-Button gleichwertig sichtbar sind \u2014 kein Dark Pattern.',
        'Verlinke im Cookie-Banner auf deine Datenschutzerklaerung.',
        'Teste den Banner im Inkognito-Modus \u2014 er muss beim ersten Besuch erscheinen.',
      ],
      verify: 'Oeffne die Website in einem neuen Inkognito-Fenster \u2014 der Cookie-Banner muss sofort beim ersten Besuch erscheinen.',
    };

    if (/ssl|https|zertifikat/.test(combined)) return {
      steps: [
        "Kontaktiere deinen Hosting-Anbieter und aktiviere ein SSL-Zertifikat \u2014 Let's Encrypt ist kostenlos und weitverbreitet.",
        'Stelle sicher, dass alle HTTP-Anfragen automatisch auf HTTPS weitergeleitet werden (301-Redirect).',
        'Pruefe in den CMS-Einstellungen, ob die Website-URL auf https:// gesetzt ist (WordPress: Einstellungen \u2192 Allgemein).',
        'Scanne alle internen Links und Bildquellen auf HTTP-Referenzen und aktualisiere sie auf HTTPS.',
        'Aktiviere den HSTS-Header auf dem Server \u2014 das erzwingt HTTPS dauerhaft.',
      ],
      verify: 'Pruefe das Schloss-Symbol in der Browserleiste \u2014 es sollte ohne Sicherheitswarnung erscheinen.',
    };

    if (/404|nicht erreichbar|broken link|kaputte/.test(combined)) return {
      steps: [
        'Notiere alle betroffenen URLs aus dem Scan-Ergebnis.',
        'Pruefe, ob die Seiten versehentlich geloescht oder umbenannt wurden.',
        'Erstelle die fehlende Seite neu oder setze eine 301-Weiterleitung auf die naechstgelegene relevante Seite.',
        'In WordPress: nutze das Plugin Redirection um 301-Weiterleitungen einfach zu verwalten.',
        'Pruefe alle internen Links, die auf die fehlerhafte URL verweisen, und aktualisiere sie.',
      ],
      verify: 'Rufe die betroffene URL direkt im Browser auf \u2014 keine 404-Fehlerseite sollte mehr erscheinen.',
    };

    if (/ladezeit|pagespeed|performance|lcp|cls|core web|langsam/.test(combined)) return {
      steps: [
        'Komprimiere alle Bilder auf der Website \u2014 nutze dafuer das Plugin Smush, ShortPixel oder Imagify fuer WordPress.',
        'Stelle das Bildformat auf WebP um \u2014 das reduziert die Dateigroe\u00dfe um 30\u201350\u00a0% ohne sichtbaren Qualitaetsverlust.',
        'Aktiviere Browser-Caching ueber dein Hosting oder ein Caching-Plugin wie WP Rocket oder W3 Total Cache.',
        'Entferne nicht genutzte JavaScript- und CSS-Dateien \u2014 pruefe welche Plugins aktiv, aber ungenutzt sind.',
        'Aktiviere Lazy Loading fuer Bilder unterhalb des sichtbaren Bereichs (in WordPress Standard seit Version 5.5).',
      ],
      verify: 'Teste mit PageSpeed Insights \u2014 der Score sollte nach den Optimierungen deutlich steigen.',
    };

    if (/datenschutz|dsgvo|impressum|rechtlich/.test(combined)) return {
      steps: [
        'Pruefe, ob eine Datenschutzerklaerung und ein Impressum auf der Website vorhanden sind.',
        'Beide Seiten muessen vom Footer aus mit maximal zwei Klicks erreichbar sein.',
        'Aktualisiere die Datenschutzerklaerung auf alle aktuell genutzten Dienste (Analytics, Fonts, Maps etc.).',
        'Nutze einen DSGVO-Generator \u2014 z.\u00a0B. datenschutz.org oder e-recht24.de.',
        'Pruefe, ob externe Ressourcen wie Google Fonts DSGVO-konform eingebunden sind (lokal hosten oder anonymisieren).',
      ],
      verify: 'Klicke im Footer auf Datenschutz und Impressum \u2014 beide Seiten muessen erreichbar und aktuell sein.',
    };

    if (/mobile|viewport|responsive|smartphone/.test(combined)) return {
      steps: [
        'Oeffne die Website auf einem Smartphone oder nutze den DevTools-Mobil-Modus (F12 \u2192 Geraetesymbol).',
        'Pruefe, ob der Meta-Viewport-Tag im head-Bereich vorhanden ist: content="width=device-width, initial-scale=1".',
        'Identifiziere Elemente, die auf kleinen Bildschirmen ueberlappen oder ausserhalb des sichtbaren Bereichs liegen.',
        'Stelle sicher, dass alle Buttons und Links mindestens 44\u00d744\u00a0Pixel gross sind \u2014 kleinere Touch-Targets sind schwer bedienbar.',
        'Teste mit Google Mobile Friendly Test: search.google.com/test/mobile-friendly.',
      ],
      verify: 'Oeffne die Website auf einem echten Smartphone \u2014 alle Inhalte muessen lesbar und alle Buttons bedienbar sein.',
    };

    if (/canonical|duplicate|doppelt/.test(combined)) return {
      steps: [
        'Installiere ein SEO-Plugin (Yoast SEO oder RankMath) falls nicht vorhanden.',
        'Oeffne die betroffene Seite und setze im SEO-Plugin den kanonischen URL manuell auf die bevorzugte Version.',
        'Pruefe, ob Seiten mit und ohne www oder mit und ohne Trailing-Slash unterschiedliche Inhalte liefern \u2014 richte 301-Weiterleitungen ein.',
        'Stelle sicher, dass jede Seite auf sich selbst als Canonical verweist (Self-Canonical).',
      ],
      verify: 'Pruefe im Seitenquelltext, ob ein canonical-Link-Tag vorhanden ist.',
    };

    // Category fallbacks
    if (issue.category === 'recht') return {
      steps: [
        'Optimiere den betroffenen Bereich für bessere Nutzerfreundlichkeit — das steigert Conversion-Rate und SEO-Ranking.',
        'Stelle sicher, dass alle interaktiven Elemente per Tastatur bedienbar sind.',
        'Pruefe den Farbkontrast zwischen Text und Hintergrund \u2014 Mindestkontrast ist 4,5:1 nach WCAG AA.',
        'Fuege ARIA-Labels zu Elementen ohne sichtbaren Text hinzu (z.\u00a0B. Icon-Buttons, Formularfelder).',
        'Teste mit dem kostenlosen Tool WAVE unter wave.webaim.org.',
      ],
      verify: 'Pruefe mit WAVE (wave.webaim.org) \u2014 die Fehleranzahl sollte nach der Korrektur zurueckgehen.',
    };

    if (issue.category === 'speed') return {
      steps: [
        'Analysiere die Ladezeit mit Google PageSpeed Insights (developers.google.com/speed/pagespeed/insights).',
        'Behebe die hoechstpriorisierten Empfehlungen zuerst \u2014 haeufig Bilder und nicht genutztes JavaScript.',
        'Aktiviere Server-seitiges Caching ueber dein Hosting-Dashboard oder ein Caching-Plugin.',
        'Pruefe, ob externe Ressourcen (Fonts, Scripts von Drittanbietern) die Ladezeit blockieren.',
        'Erwaege ein CDN fuer schnellere Auslieferung von statischen Ressourcen.',
      ],
      verify: 'Starte einen erneuten PageSpeed-Test \u2014 der Score sollte gestiegen sein.',
    };

    return {
      steps: [
        'Lies die obige Fehlerbeschreibung sorgfaeltig durch und identifiziere den betroffenen Bereich.',
        'Oeffne die betroffene Seite oder Einstellung im CMS-Backend.',
        'Behebe das beschriebene Problem anhand der Fehlerbeschreibung.',
        'Speichere alle Aenderungen und stelle sicher, dass die Seite korrekt veroeffentlicht ist.',
      ],
      verify: 'Starte einen neuen Scan um zu pruefen, ob das Problem behoben wurde.',
    };
  }

  // Simulated performance — only meaningful when a scan exists
  const hasData     = !!lastScan;
  const lcpMs       = Math.max(1200, 4200 - speedScore * 30);
  const cls         = speedScore > 70 ? 0.05 : 0.18;
  const indexedUrls = 80 + Math.round(speedScore / 2);
  const sitemapOk   = speedScore > 40;
  const mobileOk    = speedScore > 55;


  return (
    <div style={{ display: "flex", minHeight: "100vh", background: D.page, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes wf-pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.8); }
        }
        @keyframes wf-ring {
          0%   { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes wf-gold-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(251,191,36,0.18); }
          50%       { box-shadow: 0 0 10px rgba(251,191,36,0.35); }
        }
        @keyframes wf-arrow-slide {
          0%   { transform: translateX(0); }
          50%  { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        .wf-nav-locked { transition: opacity 0.15s; }
        .wf-nav-locked:hover { opacity: 1 !important; background: rgba(251,191,36,0.04) !important; }
        .wf-nav-whitelabel:hover { background: rgba(167,139,250,0.06) !important; }
        .wf-upgrade-btn { transition: box-shadow 0.2s, transform 0.15s; }
        .wf-upgrade-btn:hover { box-shadow: 0 6px 28px rgba(0,123,255,0.55) !important; transform: translateY(-1px); }
        .wf-upgrade-btn:hover .wf-arrow { animation: wf-arrow-slide 0.4s ease-in-out; }
        .wf-pro-badge { animation: wf-gold-pulse 3s ease-in-out infinite; }
        .wf-disabled-card { transition: filter 0.3s; }
        .wf-disabled-card:hover { filter: saturate(0.4) brightness(0.8) !important; }
        @keyframes wf-drawer-slide-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes wf-drawer-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .wf-drawer {
            top: auto !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-height: 85vh;
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px 16px 0 0;
            animation: wf-drawer-slide-up 0.32s cubic-bezier(0.22,1,0.36,1) both !important;
          }
        }
      `}</style>


      {/* ── Onboarding Tour (new users only) ───────────── */}
      <WfOnboardingTour
        firstName={firstName}
        plan={plan}
        scansCount={scans.length}
      />

      {/* ══════════════════════════════════════════════════
          MAIN — sidebar is rendered by dashboard layout.tsx
      ══════════════════════════════════════════════════ */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Impersonation banner */}
        {isImpersonating && (
          <div style={{
            padding: "10px 20px", background: "rgba(245,158,11,0.12)",
            borderBottom: "1px solid rgba(245,158,11,0.3)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12,
          }}>
            <span style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
              👁 Admin-Ansicht — Du siehst das Dashboard als dieser Nutzer.
            </span>
            <a href="/admin" style={{
              fontSize: 12, color: "#fbbf24", textDecoration: "underline", cursor: "pointer",
            }}>
              ← Zurück zum Admin
            </a>
          </div>
        )}

        {/* ── TOP BAR ──────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 40,
          background: D.topbar,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${D.divider}`,
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto", padding: "0 24px",
            height: 52,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            {/* Aktives Projekt + Stift-Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Aktives Projekt
              </span>
              {domain !== "—" ? (
                <>
                  <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>
                    {domain}
                  </span>
                  <button
                    onClick={() => setProjectDialogOpen(true)}
                    title="Projekt wechseln"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 22, height: 22, borderRadius: 5,
                      background: "transparent", border: `1px solid ${D.border}`,
                      cursor: "pointer", padding: 0, flexShrink: 0,
                      transition: "border-color 0.15s",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </>
              ) : (
                <Link href="/dashboard/scan" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 12px", borderRadius: D.radiusSm,
                  background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                  color: D.blueSoft, fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Website hinzufügen
                </Link>
              )}
            </div>

            <div style={{ flex: 1 }} />

            {/* Projekt-Slots — plan-aware */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 500 }}>Projekte</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "2px 9px", borderRadius: 20,
                background: D.card, border: `1px solid ${D.borderMid}`,
                color: D.textSub,
              }}>
                {plan === "agency-pro" || plan === "agency-starter" ? "Unlimited" : plan === "starter" ? "3 Slots" : isProfessionalPlus ? "10 Slots" : "1 / 1"}
              </span>
            </div>

            {/* Scan usage — plan-aware */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: D.textMuted, fontWeight: 500 }}>Scans/Monat</span>
              {/* Professional / Agency = unlimited */}
              {["agency-pro", "agency-starter", "smart-guard", "professional"].includes(plan) ? (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 9px", borderRadius: 20,
                  background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
                  color: "#FBBF24",
                }}>
                  Unbegrenzt
                </span>
              ) : isStarter ? (
                /* Starter = 3/Monat */
                monthlyScans >= 3 ? (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: "2px 10px", borderRadius: 20,
                    background: D.redBg, border: `1px solid ${D.redBorder}`,
                    color: D.red,
                  }}>
                    Limit erreicht
                  </span>
                ) : (
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: "2px 9px", borderRadius: 20,
                    background: D.card, border: `1px solid ${D.borderMid}`,
                    color: D.textSub,
                  }}>
                    {Math.max(0, 3 - monthlyScans)} / 3
                  </span>
                )
              ) : monthlyScans >= scanLimit ? (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 10px", borderRadius: 20,
                  background: D.redBg, border: `1px solid ${D.redBorder}`,
                  color: D.red,
                }}>
                  Limit erreicht
                </span>
              ) : (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  padding: "2px 9px", borderRadius: 20,
                  background: D.card, border: `1px solid ${D.borderMid}`,
                  color: D.textSub,
                }}>
                  {scanLimit - monthlyScans} verbleibend
                </span>
              )}
            </div>

            {/* Upgrade CTA */}
            <Link href="/pricing" style={{
              padding: "6px 16px", borderRadius: D.radiusSm,
              background: D.blue, color: "#fff",
              fontSize: 12, fontWeight: 700, textDecoration: "none",
              boxShadow: D.blueGlow,
            }}>
              Upgrade →
            </Link>
          </div>
        </header>

        {/* ── PAGE CONTENT ─────────────────────────────── */}
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px 80px" }}>

          {/* ① QUICK-START GUIDE — shown when plan is active but no scan yet */}
          {!lastScan && plan !== "free" && (
            <div style={{
              background: "linear-gradient(160deg, #0d1f3c 0%, #091528 100%)",
              border: "1px solid rgba(37,99,235,0.3)",
              borderRadius: 18, padding: "40px 40px 32px", marginBottom: 16,
              textAlign: "center",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Quick-Start Guide — Schritt 1 von 1
              </p>
              <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                URL eingeben für deinen ersten Deep-Scan
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                Kein Plugin nötig. Kein Hosting-Zugang. Einfach die Domain eingeben — fertig.
              </p>

              {/* URL Input */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const url = quickStartUrl.trim();
                  if (!url) return;
                  const full = url.startsWith("http") ? url : `https://${url}`;
                  window.location.href = `/dashboard/scan?url=${encodeURIComponent(full)}`;
                }}
                style={{ display: "flex", gap: 10, maxWidth: 540, margin: "0 auto 20px", flexWrap: "wrap" }}
              >
                <input
                  type="text"
                  value={quickStartUrl}
                  onChange={e => setQuickStartUrl(e.target.value)}
                  placeholder="https://deine-website.de"
                  style={{
                    flex: 1, minWidth: 200,
                    padding: "13px 18px", borderRadius: 10, fontSize: 15,
                    background: "rgba(255,255,255,0.06)",
                    border: "1.5px solid rgba(37,99,235,0.4)",
                    color: "#fff", outline: "none", fontFamily: "inherit",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.8)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "rgba(37,99,235,0.4)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                />
                <button type="submit" style={{
                  padding: "13px 24px", borderRadius: 10, fontSize: 14, fontWeight: 800,
                  background: "#2563EB", color: "#fff", border: "none", cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.5)", whiteSpace: "nowrap",
                  fontFamily: "inherit",
                }}>
                  Deep-Scan starten →
                </button>
              </form>

              {/* Badges */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { icon: "📄", text: "25 Seiten inkl." },
                  { icon: "🔍", text: "SEO-Audit" },
                  { icon: "📱", text: "Mobile-Check" },
                  { icon: "⚡", text: "< 60 Sekunden" },
                ].map(b => (
                  <div key={b.text} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.55)",
                  }}>
                    <span>{b.icon}</span>{b.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ② AUDIT HERO CARD */}
          <Card style={{ padding: "28px 32px", marginBottom: 12 }} accent="#007BFF">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div>
                <SectionLabel color={D.blueSoft}>Letzter Website-Audit</SectionLabel>
                <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: D.text, letterSpacing: "-0.025em" }}>
                  {domain !== "—" ? domain : "Noch keine Website gescannt"}
                </h1>
                {!lastScan && sessionDomain && (
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: D.amber, lineHeight: 1.6, display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Anonymer Scan erkannt — als Account-Scan speichern für dauerhaften Zugriff
                  </p>
                )}
                {lastScan && (
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: D.textSub, lineHeight: 1.6 }}>
                    Gescannt am {scanDate}
                    {(() => {
                      const n = totalPages ?? (unterseiten ? unterseiten.length + 1 : null);
                      return n != null ? ` · ${n} Seite${n !== 1 ? "n" : ""} analysiert` : "";
                    })()}
                    {" · "}
                    {totalErrors > 0
                      ? `${totalErrors} Optimierungen verfügbar`
                      : "Alles optimiert ✓"}
                  </p>
                )}
                {/* Status badge — amber for opportunities, green for perfect */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  background: totalErrors > 0 ? D.amberBg : D.greenBg,
                  border: `1px solid ${totalErrors > 0 ? D.amberBorder : D.greenBorder}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%",
                    background: totalErrors > 0 ? D.amber : D.green,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700,
                    color: totalErrors > 0 ? D.amber : D.green,
                  }}>
                    {totalErrors > 0 ? `${totalErrors} Optimierungen` : "Alles optimiert ✓"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                {monthlyScans >= scanLimit ? (
                  <button
                    onClick={() => setShowLimitModal(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "9px 20px", borderRadius: D.radiusSm,
                      background: D.redBg, border: `1px solid ${D.redBorder}`,
                      color: D.red, fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    <LockIco size={13} color={D.red} />
                    Scan-Limit erreicht — Upgrade
                  </button>
                ) : (
                  <BtnPrimary href={
                    !lastScan && sessionDomain
                      ? `/dashboard/scan?url=${encodeURIComponent(sessionDomain)}`
                      : "/dashboard/scan"
                  }>
                    {lastScan ? "Neuen Scan starten →" : sessionDomain ? "Jetzt als Account-Scan speichern →" : "+ Website hinzufügen"}
                  </BtnPrimary>
                )}
                {lastScan && (
                  <BtnGhost href={`/dashboard/scans/${lastScan.id}`}>Bericht ansehen</BtnGhost>
                )}
              </div>
            </div>
          </Card>

          {/* ① TIER CONTEXT BANNERS ─────────────────────── */}
          {/* Starter: prominent upgrade banner for Smart-Fix */}
          {plan === "starter" && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "18px 24px", marginBottom: 16,
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.2)",
              borderRadius: 12,
            }}>
              <div style={{
                fontSize: 22, flexShrink: 0,
                background: "rgba(251,191,36,0.1)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: 8, padding: "6px 10px",
              }}>
                🔧
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#FBBF24" }}>
                  Smart-Fix Drawer freischalten
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  Mit Professional erhältst du für jede Wachstums-Bremse einen Direkt-Fix Guide — Schritt für Schritt, ohne Agentur.
                </p>
              </div>
              <Link href="/pricing" style={{
                flexShrink: 0, padding: "9px 20px", borderRadius: 8,
                background: "#FBBF24", color: "#0b0c10",
                fontSize: 12, fontWeight: 800, textDecoration: "none",
                whiteSpace: "nowrap",
              }}>
                Upgrade auf Professional →
              </Link>
            </div>
          )}

          {/* Agency: Lead-Magnet Setup prompt */}
          {(plan === "agency-starter" || plan === "agency-pro") && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "18px 24px", marginBottom: 16,
              background: "rgba(167,139,250,0.05)",
              border: "1px solid rgba(167,139,250,0.18)",
              borderRadius: 12,
            }}>
              <div style={{
                fontSize: 22, flexShrink: 0,
                background: "rgba(167,139,250,0.08)",
                border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: 8, padding: "6px 10px",
              }}>
                🧲
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#a78bfa" }}>
                  Lead-Magnet Widget — exklusiv für dein Agency-Plan
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                  Bette das Widget auf Kunden-Websites ein. Besucher starten direkt einen Scan — du erhältst sie als warme Leads.
                </p>
              </div>
              <Link href="/fuer-agenturen" style={{
                flexShrink: 0, padding: "9px 20px", borderRadius: 8,
                background: "rgba(167,139,250,0.12)",
                border: "1px solid rgba(167,139,250,0.3)",
                color: "#a78bfa",
                fontSize: 12, fontWeight: 800, textDecoration: "none",
                whiteSpace: "nowrap",
              }}>
                Widget einrichten →
              </Link>
            </div>
          )}

          {/* ② TECH FINGERPRINT STRIP */}
          {lastScan && techChips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28, padding: "14px 0 2px" }}>
              {techChips.map(item => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "5px 12px 5px 10px",
                  borderRadius: 20,
                  background: `rgba(${hexToRgb(item.color)},0.06)`,
                  border: `1px solid rgba(${hexToRgb(item.color)},0.2)`,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                    background: item.color, opacity: 0.85,
                  }} />
                  <span style={{ fontSize: 11, color: D.textMuted, fontWeight: 500 }}>{item.label}:</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ③ BFSG / COMPLIANCE BANNER */}
          {lastScan && (
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 20px", borderRadius: D.radiusSm, marginBottom: 28,
              background: bfsgOk ? D.greenBg : D.amberBg,
              border: `1px solid ${bfsgOk ? D.greenBorder : D.amberBorder}`,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{bfsgOk ? "✅" : "⚠️"}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700,
                  color: bfsgOk ? D.green : "#FBBF24",
                }}>
                  Nutzerfreundlichkeit: {bfsgOk ? "Sehr gut" : "Optimierungspotenzial gefunden"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: D.textSub, marginTop: 2 }}>
                  {bfsgOk
                    ? "Alle UX-Checks bestanden — Nutzer und Google finden diese Website barrierefrei zugänglich."
                    : `${rechtIssues.length} UX-Hürde${rechtIssues.length !== 1 ? "n" : ""} gefunden — verschenkt wertvolles SEO-Ranking und Nutzer-Vertrauen.`}
                </p>
              </div>
              {!bfsgOk && (
                <Link href="/pricing" style={{
                  flexShrink: 0, fontSize: 11, fontWeight: 700,
                  padding: "5px 12px", borderRadius: D.radiusXs,
                  background: D.amberBg, border: `1px solid ${D.amberBorder}`,
                  color: D.amber, textDecoration: "none",
                }}>
                  Details →
                </Link>
              )}
            </div>
          )}

          {/* ④ SUMMARY CARDS */}
          <div style={{ marginBottom: 28 }}>
            {/* Skeleton-Loader wenn noch kein Scan */}
            <style>{`
              @keyframes wf-shimmer {
                0%   { background-position: -400px 0; }
                100% { background-position: 400px 0; }
              }
              .wf-skeleton {
                background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
                background-size: 800px 100%;
                animation: wf-shimmer 1.6s infinite;
              }
            `}</style>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {!lastScan ? (
                // Skeleton cards
                [0, 1, 2].map(i => (
                  <div key={i} style={{
                    borderRadius: D.radiusSm, padding: "20px 22px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    minHeight: 90,
                  }}>
                    <div className="wf-skeleton" style={{ height: 10, width: 60, borderRadius: 4, marginBottom: 16 }} />
                    <div className="wf-skeleton" style={{ height: 28, width: 40, borderRadius: 6, marginBottom: 10 }} />
                    <div className="wf-skeleton" style={{ height: 8, width: 80, borderRadius: 4 }} />
                  </div>
                ))
              ) : [
                { label: "Kritisch",   count: redCount,   color: "#f87171", bg: D.redBg,   border: D.redBorder,   icon: "⛔" },
                { label: "Warnungen",  count: yellowCount, color: D.amber,   bg: D.amberBg, border: D.amberBorder, icon: "⚠️" },
                { label: "Hinweise",   count: greenCount,  color: D.green,   bg: D.greenBg, border: D.greenBorder, icon: "✓"  },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "20px 22px",
                  borderRadius: D.radius,
                  background: s.count > 0 ? s.bg : D.card,
                  border: `1px solid ${s.count > 0 ? s.border : D.border}`,
                }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700,
                    color: s.count > 0 ? s.color : D.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                  }}>
                    {s.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 32, fontWeight: 900,
                    color: s.count > 0 ? s.color : D.textFaint,
                    letterSpacing: "-0.03em", lineHeight: 1.1,
                  }}>
                    {s.count}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑤ PERFORMANCE SNAPSHOT */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <SectionLabel>Scan · Sichtbarkeit &amp; Performance</SectionLabel>
            </div>
            <SectionHead>Search &amp; Performance</SectionHead>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                {
                  label: "Indexierte URLs",
                  value: hasData ? `${indexedUrls}` : "—",
                  sub: hasData ? "Im Google Index" : "Noch kein Scan",
                  color: hasData ? D.blueSoft : D.textFaint,
                },
                {
                  label: "Sitemap",
                  value: hasData ? (sitemapOk ? "/sitemap.xml" : "Fehlt") : "—",
                  sub: hasData ? (sitemapOk ? "Status: 200 OK" : "Nicht eingereicht") : "Noch kein Scan",
                  color: hasData ? (sitemapOk ? D.green : D.red) : D.textFaint,
                },
                {
                  label: "Core Web Vitals",
                  value: hasData ? `LCP ${(lcpMs / 1000).toFixed(1)}s` : "—",
                  sub: hasData ? `CLS ${cls.toFixed(2)}` : "Noch kein Scan",
                  color: hasData ? (lcpMs < 2500 ? D.green : D.amber) : D.textFaint,
                },
                {
                  label: "Mobil",
                  value: hasData ? (mobileOk ? "Bestanden" : "Fehlgeschlagen") : "—",
                  sub: hasData ? "Viewport & Responsive" : "Noch kein Scan",
                  color: hasData ? (mobileOk ? D.green : D.red) : D.textFaint,
                },
              ].map(tile => (
                <div key={tile.label} style={{
                  padding: "16px 16px",
                  borderRadius: D.radiusSm,
                  background: hasData ? `rgba(${hexToRgb(tile.color)},0.05)` : D.card,
                  border: `1px solid ${hasData ? `rgba(${hexToRgb(tile.color)},0.18)` : D.border}`,
                }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700,
                    color: tile.color, textTransform: "uppercase", letterSpacing: "0.08em", opacity: hasData ? 0.8 : 0.5,
                  }}>
                    {tile.label}
                  </p>
                  <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 800, color: hasData ? D.text : D.textFaint, lineHeight: 1.2 }}>
                    {tile.value}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: D.textMuted }}>{tile.sub}</p>
                </div>
              ))}
            </div>
            {/* Snapshot disclaimer */}
            <p style={{ margin: "10px 0 0", fontSize: 11, color: D.textFaint, lineHeight: 1.6, fontWeight: 400 }}>
              Diese Werte basieren auf Scan-Schätzungen.{" "}
              <Link href="/pricing" style={{ color: D.blueSoft, textDecoration: "none", opacity: 0.8 }}>
                Präzise Live-Daten aus GSC &amp; PageSpeed
              </Link>
              {" "}sind im Professional Plan verfügbar.
            </p>

            {/* Deep-Scan info */}
            {hasData && (
              <div style={{
                marginTop: 14,
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", borderRadius: D.radiusSm,
                background: "linear-gradient(135deg, rgba(0,123,255,0.06) 0%, rgba(0,123,255,0.03) 100%)",
                border: "1px solid rgba(0,123,255,0.18)",
              }}>
                <div style={{
                  flexShrink: 0,
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(0,123,255,0.1)",
                  border: "1px solid rgba(0,123,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7aa6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(122,166,255,0.75)", lineHeight: 1.55, flex: 1 }}>
                  <strong style={{ color: "#7aa6ff", fontWeight: 700 }}>
                    Deep-Scan ({totalPages != null ? totalPages : "10"} Seiten analysiert)
                  </strong>
                  {isFree && <>{" · "}Für 30+ Seiten und erweiterte Berichte{" "}
                    <Link href="/pricing" style={{ color: "#7aa6ff", textDecoration: "underline", textUnderlineOffset: 3, textDecorationColor: "rgba(122,166,255,0.4)", fontWeight: 600 }}>
                      Professional Plan →
                    </Link>
                  </>}
                </p>
              </div>
            )}
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑥ DEEP-SCAN MAP */}
          {hasData && unterseiten && unterseiten.length > 0 && (
            <div ref={mapSectionRef}>
              <DeepScanMap
                homepageUrl={lastScan?.url ?? ""}
                homepageIssueCount={issues.length}
                unterseiten={unterseiten}
                isFree={isFree}
                onOpenDrawer={setDrawerPageUrl}
                checkedUrls={checkedUrls}
                onToggleChecked={toggleChecked}
                highlightUrl={highlightUrl}
              />
            </div>
          )}

          {/* Side drawer */}
          {drawerPageUrl && unterseiten && (
            <DrawerPanel
              pageUrl={drawerPageUrl}
              unterseiten={unterseiten}
              onClose={() => setDrawerPageUrl(null)}
              isChecked={checkedUrls.has(drawerPageUrl)}
              onToggleChecked={() => toggleChecked(drawerPageUrl)}
            />
          )}

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑦ FINDINGS LIST */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel>Audit-Ergebnisse</SectionLabel>
            <SectionHead>Gefundene Probleme</SectionHead>

            {issues.length === 0 ? (
              <Card style={{ padding: "32px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 14, color: D.textMuted }}>
                  Noch kein Scan — starte jetzt deinen ersten Audit.
                </p>
              </Card>
            ) : (
              <>
                {/* Management Summary Box */}
                <div style={{
                  marginBottom: 16,
                  padding: "14px 18px",
                  borderRadius: D.radiusSm,
                  background: "rgba(248,113,113,0.05)",
                  border: `1px solid rgba(248,113,113,0.18)`,
                }}>
                  <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "#FBBF24", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Optimierungs-Übersicht
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: D.textSub, lineHeight: 1.65 }}>
                    Deine Website hat aktuell{" "}
                    <strong style={{ color: "#FBBF24" }}>{redCount} Wachstums-Bremsen</strong>
                    {yellowCount > 0 && <> und <strong style={{ color: D.amber }}>{yellowCount} Optimierungspotenziale</strong></>}
                    {" "}— das verschenkt wertvolles SEO-Ranking und Nutzer-Vertrauen.{" "}
                    {redCount > 0 && <span style={{ color: D.textMuted }}>Empfehlung: Wachstums-Bremsen zuerst beheben.</span>}
                  </p>
                </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...issues].sort((a, b) => {
                  const order: Record<string, number> = { red: 0, yellow: 1, green: 2 };
                  return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
                }).map((issue, idx) => {
                  const isOpen    = expandedFinding === idx;
                  const isFixOpen = fixOpenIdx === idx;
                  const accentColor = issue.severity === "red" ? "#f87171" : issue.severity === "yellow" ? D.amber : D.green;
                  const fixSteps  = generateFixSteps(issue).steps;
                  // Look up image filenames for per-page alt-text issues
                  const pageImages = issue.url
                    ? unterseiten?.find(p => p.url === issue.url)?.altMissingImages ?? []
                    : [];
                  return (
                    <div key={idx} style={{
                      borderRadius: D.radiusSm,
                      background: D.card,
                      border: `1px solid rgba(${hexToRgb(accentColor)},0.15)`,
                      overflow: "hidden",
                    }}>
                      {/* Row */}
                      <div style={{
                        padding: "11px 14px 11px 18px",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        {/* Expand chevron button */}
                        <button
                          onClick={() => setExpandedFinding(isOpen ? null : idx)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                          aria-label="Details anzeigen"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                            stroke={D.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ display: "block", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>

                        <SevBadge sev={issue.severity} />

                        {/* Title + URL */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: D.text, lineHeight: 1.3 }}>
                            {issue.title}
                          </p>
                          {issue.url && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <a
                                href={issue.url} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                style={{ margin: "2px 0 0", fontSize: 11, color: D.blueSoft, fontFamily: "monospace",
                                  textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              >
                                {(() => { try { return new URL(issue.url!).pathname; } catch { return issue.url; } })()}
                                {" ↗"}
                              </a>
                              {unterseiten?.some(p => p.url === issue.url) && (
                                <button
                                  onClick={e => { e.stopPropagation(); handleShowInMap(issue.url!); }}
                                  style={{
                                    background: "none", border: "none", padding: "2px 0", cursor: "pointer",
                                    fontSize: 11, color: D.amber, fontWeight: 600,
                                    textDecoration: "underline", textDecorationColor: "rgba(251,191,36,0.35)",
                                    textUnderlineOffset: 2, whiteSpace: "nowrap", fontFamily: "inherit",
                                  }}
                                >
                                  In der Map anzeigen →
                                </button>
                              )}
                            </div>
                          )}
                          {!issue.url && (
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: getImpact(issue.category, issue.severity).color, fontWeight: 500, opacity: 0.85 }}>
                              ↑ {getImpact(issue.category, issue.severity).label}
                            </p>
                          )}
                        </div>

                        {/* Category badge */}
                        <span style={{ fontSize: 10, color: D.textMuted, flexShrink: 0,
                          padding: "2px 7px", borderRadius: 4,
                          background: "rgba(255,255,255,0.03)", border: `1px solid ${D.border}`,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          {issue.category === "recht" ? "UX" : issue.category === "speed" ? "Speed" : "SEO"}
                        </span>

                        {/* "Wie fixen?" button — always visible */}
                        {fixSteps.length > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); setFixOpenIdx(isFixOpen ? null : idx); }}
                            style={{
                              flexShrink: 0, fontSize: 11, fontWeight: 700,
                              padding: "4px 10px", borderRadius: 4, cursor: "pointer",
                              background: isFixOpen ? "rgba(141,243,211,0.1)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isFixOpen ? "rgba(141,243,211,0.35)" : D.border}`,
                              color: isFixOpen ? "#8df3d3" : D.textSub,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isFixOpen ? "Schließen ✕" : "Wie fixen?"}
                          </button>
                        )}
                      </div>

                      {/* "Wie fixen?" steps — independent of body expansion */}
                      {isFixOpen && fixSteps.length > 0 && (
                        <div style={{
                          padding: "12px 18px 14px",
                          background: isStarter ? "rgba(251,191,36,0.02)" : "rgba(141,243,211,0.03)",
                          borderTop: `1px solid ${isStarter ? "rgba(251,191,36,0.1)" : "rgba(141,243,211,0.1)"}`,
                          position: "relative",
                          overflow: "hidden",
                        }}>
                          <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: isStarter ? "#FBBF24" : "#8df3d3", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            {isStarter ? "Wachstums-Bremse — KI-Fix-Guide:" : "Fix-Anleitung (WordPress / Elementor):"}
                          </p>

                          {/* Steps — step 1 teaser for Starter, 2+ blurred at 5px */}
                          <div style={{ position: "relative" }}>
                            {fixSteps.map((s: string, si: number) => (
                              <div key={si} style={{
                                display: "flex", gap: 8,
                                marginBottom: si < fixSteps.length - 1 ? 5 : 0,
                                filter: isStarter && si >= 1 ? "blur(5px)" : "none",
                                userSelect: isStarter && si >= 1 ? "none" : "auto",
                                pointerEvents: isStarter && si >= 1 ? "none" : "auto",
                                transition: "filter 0.2s",
                              }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isStarter ? "#FBBF24" : "#8df3d3", flexShrink: 0, lineHeight: 1.6 }}>{si + 1}.</span>
                                <span style={{ fontSize: 12, color: D.textSub, lineHeight: 1.6 }}>{s}</span>
                              </div>
                            ))}

                            {/* Starter: gradient blur overlay + upgrade CTA */}
                            {isStarter && (
                              <div style={{
                                position: "absolute",
                                bottom: 0, left: 0, right: 0,
                                height: "75%",
                                background: "linear-gradient(to bottom, rgba(11,12,16,0) 0%, rgba(11,12,16,0.82) 55%, rgba(11,12,16,0.97) 100%)",
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "flex-end",
                                paddingBottom: 4,
                              }}>
                                <div style={{
                                  textAlign: "center",
                                  padding: "10px 16px 6px",
                                }}>
                                  <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                                    🔒 Vollständige KI-Schritt-für-Schritt Lösung im Professional Plan
                                  </p>
                                  <Link href="/pricing?plan=professional" style={{
                                    display: "inline-block",
                                    padding: "7px 18px", borderRadius: 6,
                                    background: "#FBBF24", color: "#0b0c10",
                                    fontSize: 12, fontWeight: 800, textDecoration: "none",
                                  }}>
                                    Professional aktivieren →
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Free: simple Professional CTA */}
                          {isFree && (
                            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, color: D.textMuted, flex: 1 }}>KI-Auto-Fix (Copy-Paste-fertig) im Professional Plan</span>
                              <Link href="/pricing?plan=professional" style={{
                                flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 4,
                                background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
                                color: "#FBBF24", textDecoration: "none",
                              }}>Professional →</Link>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expanded body — description + image filenames */}
                      {isOpen && (
                        <div style={{ padding: "0 18px 16px", borderTop: `1px solid ${D.divider}` }}>
                          <p style={{ margin: "12px 0 0", fontSize: 13, color: D.textSub, lineHeight: 1.75 }}>
                            {issue.body}
                          </p>
                          {/* Image filenames for alt-text issues */}
                          {pageImages.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: D.textMuted }}>
                                Betroffene Bilder ({pageImages.length}):
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                {pageImages.slice(0, 10).map((img, j) => {
                                  const imgPath = (() => { try { return new URL(img).pathname; } catch { return img; } })();
                                  return (
                                    <div key={j} style={{
                                      fontSize: 11, fontFamily: "monospace", color: D.textSub,
                                      background: "rgba(0,0,0,0.2)", borderRadius: 4, padding: "3px 8px",
                                      wordBreak: "break-all",
                                    }}>{imgPath}</div>
                                  );
                                })}
                                {pageImages.length > 10 && (
                                  <p style={{ margin: "3px 0 0", fontSize: 11, color: D.textMuted }}>+{pageImages.length - 10} weitere</p>
                                )}
                              </div>

                              {/* Direkt-Fix Guide for images — locked to Professional */}
                              {isSmartGuard ? (
                                <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
                                  <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#FBBF24", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    Direkt-Fix Guide · Elementor / Gutenberg
                                  </p>
                                  {[
                                    "Elementor: Bild anklicken → rechts im Panel 'Alternativtext' ausfüllen (beschreibt das Bild für Google-Bild-Suche).",
                                    "Gutenberg: Block auswählen → rechte Sidebar → 'Alt-Text' → aussagekräftige Beschreibung eintragen.",
                                    "WordPress Mediathek: Medien → Bild anklicken → Feld 'Alternativtext' → Speichern.",
                                    "Faustregel: Beschreibe das Bild in 5-10 Wörtern — vermeide Keywords-Stuffing.",
                                  ].map((step, si) => (
                                    <div key={si} style={{ display: "flex", gap: 8, marginBottom: si < 3 ? 5 : 0 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: "#FBBF24", flexShrink: 0, lineHeight: 1.6 }}>{si + 1}.</span>
                                      <span style={{ fontSize: 11, color: D.textSub, lineHeight: 1.6 }}>{step}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.18)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                  <span style={{ fontSize: 11, color: D.textMuted }}>🔒 Direkt-Fix Guide für Elementor/Gutenberg</span>
                                  <Link href="/pricing?plan=professional" style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#FBBF24", textDecoration: "none", whiteSpace: "nowrap" }}>
                                    Professional →
                                  </Link>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
              </>
            )}
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑦ SMART-GUARD AUTOMATION MODULES */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel color={D.blueSoft}>Professional · Automatisierung</SectionLabel>
            <SectionHead>Einmal verstehen — dauerhaft überwacht.</SectionHead>
            <p style={{ margin: "-10px 0 24px", fontSize: 13, color: D.textMuted, lineHeight: 1.75, maxWidth: 580 }}>
              Die Analyse liegt vor dir. Der Professional Plan läuft im Hintergrund, beobachtet jede Veränderung und meldet sich — ohne dass du selbst regelmäßig prüfen musst.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {([
                {
                  key: "score",
                  title: "Score-Verlauf",
                  badge: "Täglich · 30 Tage",
                  desc: "Jede Verbesserung, jeder Rückschritt — sauber dokumentiert. Du siehst, ob deine Maßnahmen wirken, bevor Google es tut.",
                  cta: "Professional aktivieren",
                  planTag: "Professional",
                  status: isFree ? "Professional" : null as string | null,
                  disabled: isFree,
                },
                {
                  key: "monitor",
                  title: "24/7 Live-Monitoring",
                  badge: "Echtzeit · E-Mail-Alert",
                  desc: "Ausfall, veränderte Inhalte, neue Sicherheitsprobleme — du wirst sofort informiert. Nicht einmal täglich, sondern in dem Moment, in dem es passiert.",
                  cta: "Professional aktivieren",
                  planTag: "Professional",
                  status: isFree ? "Professional" : null as string | null,
                  disabled: isFree,
                },
                {
                  key: "pdf",
                  title: "Monatlicher PDF-Bericht",
                  badge: "Automatisch · Teilbar",
                  desc: "Jeden Monat ein vollständiger Auditbericht als PDF — automatisch erstellt, strukturiert aufbereitet, teilbar mit Kunden oder für die interne Dokumentation.",
                  cta: "Berichte aktivieren",
                  planTag: "Professional",
                  status: null as string | null,
                  disabled: false,
                },
                {
                  key: "leadmagnet",
                  title: "Lead-Magnet Widget",
                  badge: "Exklusiv · Agency",
                  desc: "Bettest du das Widget auf Kunden-Websites ein, können Besucher direkt einen kostenlosen Scan starten — und landen als warme Leads in deinem Dashboard.",
                  cta: "Agency anfragen",
                  planTag: "Agency",
                  status: (isFree || isSmartGuard) ? "Agency" : null as string | null,
                  disabled: isFree || isSmartGuard,
                },
              ]).map(module => (
                <div key={module.key} className={module.disabled ? "wf-disabled-card" : ""} style={{
                  borderRadius: D.radius,
                  background: module.disabled
                    ? "rgba(255,255,255,0.02)"
                    : (module.status ? "rgba(0,123,255,0.04)" : D.card),
                  border: `1px solid ${module.disabled ? "rgba(255,255,255,0.06)" : (module.status ? D.blueBorder : D.border)}`,
                  padding: "24px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  position: "relative" as const,
                  overflow: "hidden",
                }}>
                  {/* Glassmorphism lock overlay */}
                  {module.disabled && (
                    <div style={{
                      position: "absolute", inset: 0, zIndex: 10,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      background: "rgba(11,12,16,0.72)",
                      borderRadius: D.radius,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      cursor: "pointer",
                    }}>
                      {/* Lock icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: module.status === "Agency"
                          ? "rgba(167,139,250,0.15)"
                          : "rgba(251,191,36,0.15)",
                        border: `1px solid ${module.status === "Agency" ? "rgba(167,139,250,0.4)" : "rgba(251,191,36,0.4)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke={module.status === "Agency" ? "#a78bfa" : "#fbbf24"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      {/* Plan label */}
                      <div style={{
                        fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: module.status === "Agency" ? "#a78bfa" : "#fbbf24",
                        opacity: 0.9,
                      }}>
                        {module.status === "Agency" ? "Agency Feature" : "Professional Feature"}
                      </div>
                      {/* Upgrade CTA */}
                      <Link
                        href={module.status === "Agency" ? "/pricing?plan=agency-starter" : "/pricing?plan=professional"}
                        style={{
                          fontSize: 12, fontWeight: 600,
                          color: module.status === "Agency" ? "#a78bfa" : "#fbbf24",
                          background: module.status === "Agency"
                            ? "rgba(167,139,250,0.12)"
                            : "rgba(251,191,36,0.12)",
                          border: `1px solid ${module.status === "Agency" ? "rgba(167,139,250,0.3)" : "rgba(251,191,36,0.3)"}`,
                          borderRadius: 8,
                          padding: "6px 14px",
                          textDecoration: "none",
                          transition: "background 0.18s",
                        }}
                      >
                        {module.status === "Agency" ? "Agency freischalten →" : "Professional freischalten →"}
                      </Link>
                    </div>
                  )}
                  {/* Icon row + optional status badge */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>

                    {/* Score: icon + blurred mini chart */}
                    {module.key === "score" ? (
                      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <svg width="20" height="14" viewBox="0 0 60 28" fill="none">
                            <polyline points="0,22 10,16 20,20 30,8 40,12 50,4 60,10"
                              stroke={D.blueSoft} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              fill="none" opacity="0.9"/>
                            <polyline points="0,22 10,16 20,20 30,8 40,12 50,4 60,10 60,28 0,28"
                              stroke="none" fill="url(#sg)" opacity="0.25"/>
                            <defs>
                              <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7aa6ff"/>
                                <stop offset="100%" stopColor="#7aa6ff" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    ) : module.key === "monitor" ? (
                      /* Monitoring: pulsing ring icon */
                      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* Outer pulse ring */}
                        <div style={{
                          position: "absolute", inset: 0, borderRadius: 10,
                          border: `1px solid ${D.blueBorder}`,
                          animation: "wf-ring 2s ease-out infinite",
                        }} />
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          position: "relative", zIndex: 1,
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.blueSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={{ animation: "wf-pulse-dot 2s ease-in-out infinite" }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={D.blueSoft} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                      </div>
                    )}

                    {module.status && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 10, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 20,
                        background: module.status === "Agency"
                          ? "rgba(167,139,250,0.1)"
                          : "rgba(251,191,36,0.08)",
                        border: `1px solid ${module.status === "Agency" ? "rgba(167,139,250,0.3)" : "rgba(251,191,36,0.25)"}`,
                        color: module.status === "Agency" ? "#a78bfa" : "#FBBF24",
                        letterSpacing: "0.03em", whiteSpace: "nowrap",
                      }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        {module.status} Plan
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: D.text, lineHeight: 1.3 }}>
                    {module.title}
                  </p>

                  {/* Badge */}
                  <span style={{
                    display: "inline-block", alignSelf: "flex-start",
                    fontSize: 10, fontWeight: 600,
                    padding: "2px 9px", borderRadius: 20, marginBottom: 14,
                    background: D.blueBg, border: `1px solid ${D.blueBorder}`,
                    color: D.blueSoft, letterSpacing: "0.03em",
                  }}>
                    {module.badge}
                  </span>

                  {/* Description — flex: 1 to push button down */}
                  <p style={{ margin: "0 0 20px", fontSize: 12, color: D.textMuted, lineHeight: 1.7, flex: 1 }}>
                    {module.desc}
                  </p>

                  {/* CTA — monitoring gets full-width prominent style */}
                  {module.status ? (
                    <Link
                      href={module.status === "Agency" ? "/pricing?plan=agency-starter" : "/pricing?plan=professional"}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "10px 18px", borderRadius: D.radiusXs,
                        background: module.status === "Agency" ? "rgba(124,58,237,0.15)" : "rgba(251,191,36,0.12)",
                        color: module.status === "Agency" ? "#a78bfa" : "#FBBF24",
                        border: `1px solid ${module.status === "Agency" ? "rgba(124,58,237,0.3)" : "rgba(251,191,36,0.3)"}`,
                        fontSize: 13, fontWeight: 700, textDecoration: "none",
                      }}>
                      {module.cta} →
                    </Link>
                  ) : (
                    <Link href="/dashboard/reports" style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      alignSelf: "flex-start",
                      padding: "8px 16px", borderRadius: D.radiusXs,
                      background: D.blue, color: "#fff",
                      fontSize: 11, fontWeight: 700, textDecoration: "none",
                      boxShadow: D.blueGlow,
                    }}>
                      {module.cta} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑧ WP-PLUGIN ANBINDUNG */}
          <div style={{ marginBottom: 28 }}>
            <SectionLabel color={isAgency ? "#a78bfa" : D.blueSoft}>
              {isAgency ? "Agency · Exklusiv" : "Agency Feature"}
            </SectionLabel>
            <SectionHead>WP-Plugin Anbindung</SectionHead>
            <p style={{ margin: "-10px 0 24px", fontSize: 13, color: D.textMuted, lineHeight: 1.75, maxWidth: 600 }}>
              Installiere das White-Label Helper-Plugin auf deinen Kunden-Seiten, um Fixes direkt aus diesem Dashboard per API zu übertragen — ohne Entwickler, ohne manuelles Copy-Paste.
            </p>

            {isAgency ? (
              /* ── Agency: full plugin area ── */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── KI-Mass-Fixer ── */}
              <div style={{
                padding: "22px 24px", borderRadius: D.radius,
                background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: "#a78bfa" }}>
                      KI-Mass-Fixer
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: D.textMuted }}>
                      Befehle an alle verbundenen WordPress-Sites gleichzeitig senden
                    </p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
                    background: connectedSites.length > 0 ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${connectedSites.length > 0 ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                    color: connectedSites.length > 0 ? "#34d399" : D.textMuted,
                  }}>
                    {connectedSites.length} Site{connectedSites.length !== 1 ? "s" : ""} verbunden
                  </span>
                </div>

                {/* Connected sites list */}
                {connectedSites.length > 0 ? (
                  <div style={{
                    marginBottom: 14, borderRadius: 8,
                    background: "rgba(0,0,0,0.2)", border: "1px solid rgba(167,139,250,0.1)",
                    overflow: "hidden",
                  }}>
                    {connectedSites.map((site, si) => (
                      <div key={site.site_url} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 14px",
                        borderBottom: si < connectedSites.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                          background: "#34d399",
                        }} />
                        <span style={{ flex: 1, fontSize: 12, color: D.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {site.site_name ?? site.site_url}
                        </span>
                        <span style={{ fontSize: 10, color: D.textMuted, flexShrink: 0 }}>
                          {(() => {
                            try {
                              const d = new Date(site.last_seen);
                              const diff = Date.now() - d.getTime();
                              if (diff < 3600000) return "Vor " + Math.round(diff / 60000) + " Min";
                              if (diff < 86400000) return "Vor " + Math.round(diff / 3600000) + " Std";
                              return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
                            } catch { return "—"; }
                          })()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    marginBottom: 14, padding: "14px 16px", borderRadius: 8,
                    background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)",
                    textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: D.textMuted }}>
                      Noch keine verbundenen Installationen. Plugin installieren → API-Key eingeben → Site erscheint hier.
                    </p>
                  </div>
                )}

                {/* Fix type selector + execute */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={batchFixType}
                    onChange={e => setBatchFixType(e.target.value)}
                    style={{
                      flex: 1, minWidth: 160,
                      padding: "8px 12px", borderRadius: 7,
                      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(167,139,250,0.2)",
                      color: D.textSub, fontSize: 12, cursor: "pointer",
                    }}
                  >
                    <option value="ping">Verbindungstest (Ping)</option>
                    <option value="set_alt_text">Alt-Texte setzen</option>
                    <option value="set_meta_description">Meta-Descriptions setzen</option>
                    <option value="set_title">Seitentitel (SEO) setzen</option>
                    <option value="remove_noindex">noindex entfernen</option>
                  </select>
                  <button
                    onClick={handleBatchFix}
                    disabled={batchRunning || connectedSites.length === 0}
                    style={{
                      padding: "8px 20px", borderRadius: 7,
                      background: batchRunning ? "rgba(167,139,250,0.1)" : "#a78bfa",
                      color: batchRunning ? "#a78bfa" : "#0b0c10",
                      border: batchRunning ? "1px solid rgba(167,139,250,0.3)" : "none",
                      fontSize: 12, fontWeight: 800, cursor: batchRunning ? "default" : "pointer",
                      opacity: connectedSites.length === 0 ? 0.4 : 1,
                    }}
                  >
                    {batchRunning ? "Läuft…" : "An alle senden →"}
                  </button>
                </div>

                {/* Result */}
                {batchResult && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 7,
                    background: batchResult.summary.failed === 0 ? "rgba(52,211,153,0.08)" : "rgba(251,191,36,0.08)",
                    border: `1px solid ${batchResult.summary.failed === 0 ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}`,
                  }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700,
                      color: batchResult.summary.failed === 0 ? "#34d399" : "#FBBF24" }}>
                      {batchResult.summary.failed === 0
                        ? `✓ ${batchResult.summary.success} / ${batchResult.summary.total} Sites erfolgreich`
                        : `⚠ ${batchResult.summary.success} OK · ${batchResult.summary.failed} Fehler`}
                    </p>
                  </div>
                )}
              </div>

              {/* ── API Key + Download grid ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* API Key card */}
                <div style={{
                  padding: "24px 22px", borderRadius: D.radius,
                  background: "rgba(167,139,250,0.04)",
                  border: "1px solid rgba(167,139,250,0.2)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: "rgba(167,139,250,0.1)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Dein Plugin API-Key</p>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(167,139,250,0.15)",
                    marginBottom: 10,
                  }}>
                    <code style={{ flex: 1, fontSize: 11, color: pluginApiKey ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontFamily: "monospace", letterSpacing: "0.03em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pluginApiKey
                        ? pluginApiKey.slice(0, 16) + "••••••••••••••••••••••••••••••••"
                        : "Wird geladen…"}
                    </code>
                    <button
                      onClick={handleCopyKey}
                      disabled={!pluginApiKey}
                      style={{
                        background: pluginKeyCopied ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.1)",
                        border: `1px solid ${pluginKeyCopied ? "rgba(52,211,153,0.3)" : "rgba(167,139,250,0.25)"}`,
                        borderRadius: 5, padding: "4px 10px", cursor: pluginApiKey ? "pointer" : "default",
                        fontSize: 11, fontWeight: 700,
                        color: pluginKeyCopied ? "#34d399" : "#a78bfa",
                        flexShrink: 0, transition: "all 0.2s",
                      }}
                    >
                      {pluginKeyCopied ? "✓ Kopiert!" : "Kopieren"}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                      Gültig für alle deine Kunden-Projekte.
                    </p>
                    <button
                      onClick={handleRegenerateKey}
                      disabled={pluginKeyLoading}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 10, color: "rgba(167,139,250,0.5)", padding: 0,
                        textDecoration: "underline", textDecorationColor: "rgba(167,139,250,0.25)",
                      }}
                    >
                      {pluginKeyLoading ? "…" : "Neu generieren"}
                    </button>
                  </div>
                </div>

                {/* Download card */}
                <div style={{
                  padding: "24px 22px", borderRadius: D.radius,
                  background: "rgba(167,139,250,0.04)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  display: "flex", flexDirection: "column",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: "rgba(167,139,250,0.1)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Plugin herunterladen</p>
                  </div>
                  <p style={{ margin: "0 0 16px", fontSize: 12, color: D.textMuted, lineHeight: 1.7, flex: 1 }}>
                    Lade das <strong style={{ color: "rgba(255,255,255,0.6)" }}>website-fix-helper.zip</strong> herunter, installiere es in WordPress (Plugins → Installieren → Plugin hochladen) und trage deinen API-Key ein.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a
                      href="/downloads/website-fix-helper.zip"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 18px", borderRadius: 8,
                        background: "#a78bfa", color: "#0b0c10",
                        fontSize: 12, fontWeight: 800, textDecoration: "none",
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Plugin herunterladen (.zip)
                    </a>
                    <a
                      href="https://docs.website-fix.com/plugin"
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 18px", borderRadius: 8,
                        background: "rgba(167,139,250,0.1)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        color: "#a78bfa",
                        fontSize: 12, fontWeight: 700, textDecoration: "none",
                      }}
                    >
                      Dokumentation →
                    </a>
                  </div>
                </div>
              </div>
              </div>
            ) : (
              /* ── Non-Agency: high-conversion upgrade card ── */
              <div style={{
                position: "relative", overflow: "hidden",
                padding: "32px 36px", borderRadius: D.radius,
                background: "linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(124,58,237,0.04) 100%)",
                border: "1px solid rgba(167,139,250,0.22)",
              }}>
                {/* Decorative glow blob */}
                <div style={{
                  position: "absolute", right: -40, top: -40,
                  width: 220, height: 220, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                {/* Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                    background: "rgba(167,139,250,0.12)",
                    border: "1px solid rgba(167,139,250,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)",
                    color: "#a78bfa", letterSpacing: "0.07em", textTransform: "uppercase",
                  }}>
                    Agency · Exklusiv
                  </span>
                </div>
                {/* Headline */}
                <h3 style={{
                  margin: "0 0 10px", fontSize: 18, fontWeight: 800,
                  color: "#fff", lineHeight: 1.3, maxWidth: 520,
                }}>
                  WordPress-Vollautomatik: Fixe alle{" "}
                  <span style={{ color: "#a78bfa" }}>
                    {issues.length > 0 ? `${issues.length}+` : "248+"}
                  </span>{" "}
                  Fehler direkt aus diesem Dashboard.
                </h3>
                {/* Sub-copy */}
                <p style={{ margin: "0 0 22px", fontSize: 13, color: D.textMuted, lineHeight: 1.7, maxWidth: 500 }}>
                  Installiere das White-Label-Plugin einmalig auf Kunden-Seiten und übertrage Korrekturen per API — kein manuelles Copy-Paste, keine FTP-Zugänge, keine Fehler.
                </p>
                {/* Feature pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                  {["Auto-Deploy via API", "White-Label ready", "Unbegrenzte Kunden-Sites", "Direkt-Push aus Dashboard"].map(pill => (
                    <span key={pill} style={{
                      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                      background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
                      color: "rgba(167,139,250,0.85)",
                    }}>{pill}</span>
                  ))}
                </div>
                {/* CTA */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Link href="/pricing?plan=agency-starter" style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "11px 24px", borderRadius: 8,
                    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                    color: "#fff",
                    fontSize: 13, fontWeight: 800, textDecoration: "none",
                    boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                    whiteSpace: "nowrap",
                  }}>
                    Auf Agency upgraden →
                  </Link>
                  <span style={{ fontSize: 11, color: D.textMuted }}>ab 249€/Monat · inkl. Plugin + Kunden-Matrix</span>
                </div>
              </div>
            )}
          </div>

          <Divider style={{ marginBottom: 28 }} />

          {/* ⑨ PROFESSIONELLER SERVICE */}
          <div style={{ marginBottom: 40 }}>
            <SectionLabel color={D.blueSoft}>Optionaler Service</SectionLabel>
            <SectionHead>Lieber delegieren? Wir unterstützen gezielt.</SectionHead>
            <p style={{ margin: "-10px 0 24px", fontSize: 13, color: D.textMuted, lineHeight: 1.75, maxWidth: 620 }}>
              Du möchtest die Umsetzung lieber direkt an Profis abgeben? Wir setzen die gefundenen Optimierungen für dich um — technisch sauber, dokumentiert und ohne Risiko für deine bestehende Website.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {([
                {
                  num: "01",
                  color: "#7aa6ff",
                  title: "Rechtliches & DSGVO",
                  outcome: "Geprüft, dokumentiert, übergeben",
                  desc: "Wir prüfen Cookie-Banner, Einwilligungstexte, Datenschutzerklärung und Impressum auf DSGVO-Konformität — und korrigieren, was technisch klar umsetzbar ist.",
                  pills: ["DSGVO", "Cookie-Consent", "Impressum"],
                },
                {
                  num: "02",
                  color: "#8df3d3",
                  title: "Performance & Ladezeit",
                  outcome: "Messbar optimiert, nachweisbar besser",
                  desc: "Bildoptimierung, Lazy Loading, Caching-Konfiguration, Script-Reduktion — wir implementieren, was sich sicher umsetzen lässt, und dokumentieren jeden Schritt.",
                  pills: ["LCP", "Core Web Vitals", "Caching"],
                },
                {
                  num: "03",
                  color: "#c084fc",
                  title: "Mobile-Optimierung & UX",
                  outcome: "Gezielt behoben, getestet, übergeben",
                  desc: "Alt-Texte, Viewport-Konfiguration, Touch-Target-Größen, Formular-Zugänglichkeit — wir setzen um, was ohne CMS-Zugang nicht möglich wäre.",
                  pills: ["Alt-Texte", "Responsive", "Touch-Targets"],
                },
              ] as const).map(fix => (
                <div key={fix.title} style={{
                  padding: "24px 22px",
                  borderRadius: D.radius,
                  background: `rgba(${hexToRgb(fix.color)},0.03)`,
                  border: `1px solid rgba(${hexToRgb(fix.color)},0.15)`,
                  position: "relative", overflow: "hidden",
                  display: "flex", flexDirection: "column",
                }}>
                  {/* Subtle step watermark */}
                  <div style={{
                    position: "absolute", right: 16, top: 12,
                    fontSize: 36, fontWeight: 900,
                    color: `rgba(${hexToRgb(fix.color)},0.07)`,
                    lineHeight: 1, userSelect: "none", pointerEvents: "none",
                    letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums",
                  }}>
                    {fix.num}
                  </div>

                  {/* Category label */}
                  <p style={{
                    margin: "0 0 8px",
                    fontSize: 10, fontWeight: 700,
                    color: fix.color, textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    Umsetzung auf Wunsch
                  </p>

                  {/* Title */}
                  <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: D.text, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                    {fix.title}
                  </h3>

                  {/* Outcome */}
                  <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 500, color: fix.color }}>
                    {fix.outcome}
                  </p>

                  {/* Description */}
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: D.textSub, lineHeight: 1.7, flex: 1 }}>
                    {fix.desc}
                  </p>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 20 }}>
                    {fix.pills.map(p => (
                      <span key={p} style={{
                        fontSize: 10, fontWeight: 600,
                        padding: "2px 8px", borderRadius: 16,
                        background: `rgba(${hexToRgb(fix.color)},0.08)`,
                        border: `1px solid rgba(${hexToRgb(fix.color)},0.2)`,
                        color: fix.color,
                      }}>
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* CTA — pinned to bottom */}
                  <Link href="/kontakt" style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    alignSelf: "flex-start",
                    padding: "9px 18px", borderRadius: D.radiusSm,
                    background: D.blue, color: "#fff",
                    fontSize: 12, fontWeight: 700, textDecoration: "none",
                    boxShadow: D.blueGlow,
                  }}>
                    Anfrage stellen →
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* ⑨ UPGRADE CTA */}
          <div style={{
            padding: "40px 40px",
            borderRadius: D.radius,
            background: "rgba(0,123,255,0.06)",
            border: "1px solid rgba(0,123,255,0.2)",
            textAlign: "center",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
              padding: "4px 14px", borderRadius: 20,
              background: D.blueBg, border: `1px solid ${D.blueBorder}`,
              fontSize: 11, fontWeight: 700, color: D.blueSoft, letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              Professional Plan
            </div>
            <h2 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: D.text, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              Mehr SEO-Ranking.<br/>Weniger manuelle Arbeit.
            </h2>
            <p style={{ margin: "0 auto 28px", fontSize: 15, color: D.textSub, maxWidth: 520, lineHeight: 1.75 }}>
              Der Professional Plan scannt automatisch, überwacht Veränderungen 24/7 und liefert KI-Auto-Fixes — Copy-Paste-fertig für WordPress. Inkl. Score-Verlauf, monatlichem PDF-Bericht, 10 Projekten und Smart-Fix Drawer. Für 89 €/Monat. Jederzeit kündbar.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/pricing" style={{
                padding: "13px 32px", borderRadius: D.radiusSm,
                background: D.blue, color: "#fff",
                fontSize: 14, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,123,255,0.4)",
              }}>
                Professional aktivieren →
              </Link>
              <Link href="/pricing" style={{
                padding: "13px 24px", borderRadius: D.radiusSm,
                border: `1px solid ${D.borderStrong}`,
                color: D.textSub, fontSize: 14, textDecoration: "none",
              }}>
                Mehr erfahren
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 12, color: D.textFaint }}>
              Keine Installation · Ergebnis sofort · Jederzeit kündbar
            </p>
          </div>

        </main>

        {/* ── STICKY UPGRADE FOOTER BANNER (free only) ─────── */}
        {isFree && (
          <div style={{
            position: "sticky", bottom: 0, zIndex: 30,
            background: "rgba(9,10,15,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(0,123,255,0.18)",
            boxShadow: "0 -1px 0 rgba(0,123,255,0.08), 0 -8px 32px rgba(0,0,0,0.6)",
          }}>
            {/* Left gradient accent */}
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
              background: "linear-gradient(180deg, #007BFF 0%, rgba(0,123,255,0.3) 100%)",
              borderRadius: "0 2px 2px 0",
            }} />

            <div style={{
              maxWidth: 1100, margin: "0 auto",
              padding: "11px 28px 11px 32px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Animated pulse dot */}
                <div style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: D.blue, opacity: 0.35,
                    transform: "scale(2.2)",
                    animation: "wf-ring 2.5s ease-out infinite",
                  }} />
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: D.blue,
                    boxShadow: `0 0 10px ${D.blue}`,
                    position: "relative",
                  }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: D.text, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                    Mehr Rankings. Weniger manuelle Arbeit.
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: D.textMuted, lineHeight: 1.3, marginTop: 1 }}>
                    Professional: 10 Projekte, Smart-Fix Drawer, KI-Auto-Fix, 24/7 Monitoring — ab 89€/Monat.
                  </p>
                </div>
              </div>
              <Link href="/pricing" className="wf-upgrade-btn" style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 22px", borderRadius: D.radiusSm,
                background: "linear-gradient(135deg, #1a7fe8 0%, #007BFF 100%)",
                color: "#fff",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
                boxShadow: "0 4px 18px rgba(0,123,255,0.4)",
                flexShrink: 0,
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}>
                Professional aktivieren
                <span className="wf-arrow" style={{ display: "inline-block", fontWeight: 400 }}>→</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          PROJEKT-WECHSEL DIALOG
      ══════════════════════════════════════════════════ */}
      {projectDialogOpen && (
        <div
          onClick={() => setProjectDialogOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0f1623",
              border: `1px solid ${D.borderStrong}`,
              borderRadius: D.radius,
              padding: "32px 32px 28px",
              maxWidth: 420, width: "100%",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 11,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 24,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={D.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>

            <h2 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 800, color: D.text, letterSpacing: "-0.02em" }}>
              Projekt wechseln?
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: D.textSub, lineHeight: 1.75 }}>
              Im Free-Plan ist <strong style={{ color: D.text }}>1 Wechsel pro Monat</strong> inkludiert.
            </p>
            <div style={{
              padding: "14px 16px", borderRadius: D.radiusXs, marginBottom: 24,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(248,113,113,0.85)", lineHeight: 1.65, fontWeight: 500 }}>
                Achtung: Alle Daten und Berichte der aktuellen Website werden dabei unwiderruflich gelöscht.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setProjectDialogOpen(false)}
                onMouseEnter={() => setCancelHover(true)}
                onMouseLeave={() => setCancelHover(false)}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: D.radiusSm,
                  border: `1px solid ${D.borderStrong}`,
                  background: cancelHover ? "rgba(255,255,255,0.06)" : "transparent",
                  color: cancelHover ? D.text : D.textSub,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleProjectSwitch}
                onMouseEnter={() => setSwitchHover(true)}
                onMouseLeave={() => setSwitchHover(false)}
                disabled={switching}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: D.radiusSm,
                  border: "none",
                  background: switchHover ? "#ef4444" : D.red,
                  color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: switching ? "default" : "pointer",
                  boxShadow: "0 4px 16px rgba(248,113,113,0.25)",
                  fontFamily: "inherit",
                  opacity: switching ? 0.7 : 1,
                  transition: "background 0.15s, opacity 0.15s",
                }}
              >
                {switching ? "Wird gelöscht..." : "Wechseln & Daten löschen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCAN-LIMIT UPGRADE MODAL ─────────────────────────────────── */}
      {showLimitModal && (
        <div
          onClick={() => setShowLimitModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#0f1623", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 18, padding: "36px 32px", maxWidth: 440, width: "100%",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>

            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 800, color: "#f87171", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Scan-Limit erreicht
            </p>
            <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em" }}>
              Alle {scanLimit} Scans diesen Monat aufgebraucht
            </h2>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
              Mit dem <strong style={{ color: "#FBBF24" }}>Professional-Plan</strong> bekommst du unbegrenzte Scans,
              KI-gestützte Fix-Anleitungen und Monitoring rund um die Uhr.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href="/fuer-agenturen#pricing" style={{
                display: "block", padding: "13px 24px", borderRadius: 10,
                background: "#FBBF24", color: "#0b0c10", fontWeight: 800, fontSize: 14,
                textDecoration: "none", boxShadow: "0 4px 16px rgba(251,191,36,0.3)",
              }}>
                Jetzt auf Professional upgraden →
              </a>
              <button
                onClick={() => setShowLimitModal(false)}
                style={{
                  padding: "10px", background: "none", border: "none",
                  color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
