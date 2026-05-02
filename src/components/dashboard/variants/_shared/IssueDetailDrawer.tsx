"use client";

/**
 * IssueDetailDrawer — Phase-2-Iter-3 Shared-Drawer-Family.
 *
 * Bündelt alles, was sich rund um die Per-Page-Issue-Detail-Drawer dreht:
 *   - DRAWER_FIX_STEPS: Daten (Issue-Typ → Fix-Schritte)
 *   - DrawerIcon: SVG-Icons je Issue-Typ (alt/title/h1/meta/404/label/button)
 *   - DrawerCard: Issue-Karte im Drawer (Aufklappbare Fix-Schritte)
 *   - DrawerPanel: Side-Drawer mit allen Issues für eine bestimmte Subpage
 *   - OptimizationPlanModal: Builder/WooCommerce-Optimierungsplan-Modal
 *
 * Vorher in jedem Variant dupliziert. Single-Source-of-Truth jetzt hier.
 */

import { useState, useRef } from "react";
import Link from "next/link";
import { D, hexToRgb } from "./UIHelpers";
import { generateOptimizationPlan, getBuilderTheme } from "./builder-utils";
import type { BuilderAuditProp, WooAuditProp } from "./builder-utils";
import type { ParsedIssueProp, UnterseiteProp } from "./dashboard-types";

export const DRAWER_FIX_STEPS: Record<string, string[]> = {
  alt:     ["Öffne WordPress-Dashboard → Medien → Bibliothek.", "Klicke auf ein Bild ohne Alt-Text → befülle das Feld 'Alternativtext' (kurze inhaltliche Beschreibung, z.B. 'Teamfoto Büro München').", "Für Bilder direkt auf Seiten: Editor öffnen → Bild anklicken → Alt-Text-Feld in der Seitenleiste.", "Dekorative Bilder dürfen ein leeres alt-Attribut (alt=\"\") erhalten."],
  title:   ["Installiere Yoast SEO oder RankMath (kostenlos).", "Seite im Editor öffnen → scrolle zur SEO-Sektion.", "Trage einen einzigartigen SEO-Titel (55–60 Zeichen) mit dem Haupt-Keyword ein."],
  h1:      ["Seite im Gutenberg-Editor öffnen.", "Ersten Überschrift-Block auf H1 setzen — jede Seite braucht exakt eine H1.", "Haupt-Keyword der Seite in die H1 integrieren."],
  meta:    ["SEO-Plugin (Yoast/RankMath) öffnen → Seite im Editor.", "Feld 'Meta-Beschreibung' befüllen: 120–155 Zeichen, einladend formuliert.", "Die Meta-Description erscheint als Vorschautext in Google-Suchergebnissen."],
  noindex: ["Seite im Editor öffnen → SEO-Plugin-Bereich.", "Option 'Suchmaschinen erlauben, diese Seite zu indexieren' aktivieren.", "Achtung: Nur deaktivieren wenn die Seite absichtlich versteckt werden soll."],
  "404":   ["Prüfe ob die Seite gelöscht oder umbenannt wurde.", "Seite neu erstellen oder 301-Weiterleitung zur nächstbesten Seite setzen.", "WordPress-Plugin 'Redirection' für einfaches Weiterleitungs-Management.", "Alle internen Links auf diese URL aktualisieren."],
  label:   ["Seite im Elementor/WordPress-Editor öffnen und das Formular suchen.", "Elementor Formular-Widget: Auf das Formular klicken → links Feld auswählen → Abschnitt 'Label' befüllen (z.B. 'Telefonnummer', 'E-Mail-Adresse').", "WPForms / Gravity Forms: Formular im Plugin-Dashboard öffnen → Feld anklicken → Feld-Label eintragen.", "Avada / Custom-Theme-Sonderfall: Wenn der Beschriftungstext SICHTBAR ist (z.B. 'Vorname/Nachname*' steht über dem Feld) aber der Scan trotzdem 'fehlt' meldet → das Theme rendert den Text als <p>-Sibling statt im <label>-Element. Lösung: Form-Template (CF7: contact-form-7/wpcf7.php oder Theme-Override) editieren, damit jeder Input von <label>...</label> umschlossen wird. Beispiel: <label>Vorname/Nachname*<br>[text* your-name]</label>", "Für technisch fortgeschrittene: aria-label-Attribut direkt im HTML setzen — z.B. <input aria-label=\"Telefonnummer\" ...>.", "Prüfen: Jedes Eingabefeld muss entweder (a) ein sichtbares Label im <label>-Element ODER (b) ein aria-label-Attribut haben. Visueller Text neben dem Feld reicht NICHT — Screen-Reader brauchen die HTML-Verknüpfung.", "Tipp: Placeholder-Text allein genügt NICHT als Label — er verschwindet beim Tippen und ist für Screen-Reader unzuverlässig.", "BFSG-Hinweis: Ab 28.06.2025 sind diese Verstöße abmahnfähig — der visuelle Text 'Vorname' ohne <label>-Verknüpfung wird vom Gericht als 'nicht zugänglich' gewertet."],
  button:  ["Buttons im Editor öffnen.", "Sicherstellen dass jeder Button sichtbaren Text oder ein aria-label hat.", "Reine Icon-Buttons brauchen aria-label='Beschreibung der Aktion'."],
};

// Icon SVGs für Fehlertypen
export function DrawerIcon({ type }: { type: string }) {
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
export function DrawerCard({
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
  const accentBg  = kind === "critical" ? "rgba(160,80,80,0.07)"  : "rgba(251,191,36,0.07)";
  const accentBdr = kind === "critical" ? "rgba(160,80,80,0.20)"  : "rgba(251,191,36,0.22)";

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
            background: `rgba(${kind === "critical" ? "160,80,80" : "251,191,36"},0.12)`,
            color: accent, border: `1px solid ${accentBdr}`,
          }}>{count}×</span>
        )}
        {steps.length > 0 && (
          <button
            onClick={() => setFixOpen(v => !v)}
            style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              padding: "4px 10px", borderRadius: 5, cursor: "pointer",
              background: fixOpen ? `rgba(${kind === "critical" ? "160,80,80" : "251,191,36"},0.12)` : "rgba(255,255,255,0.05)",
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
      {images && images.length > 0 && (() => {
        const LIMIT = 15;
        const shown = images.slice(0, LIMIT);
        const hiddenCount = images.length - shown.length; // = total - 15 shown
        return (
        <div style={{
          padding: "0 16px 14px",
          borderTop: fixOpen ? undefined : `1px solid ${accentBdr}`,
        }}>
          <p style={{ margin: "10px 0 7px", fontSize: 11, fontWeight: 600, color: D.textMuted }}>
            Betroffene Dateien ({images.length}):
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
            {shown.map((img, j) => {
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
            {hiddenCount > 0 && (
              <li style={{ fontSize: 11, color: D.textMuted, padding: "2px 4px" }}>
                +{hiddenCount} weitere Dateien
              </li>
            )}
          </ul>
        </div>
        );
      })()}

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
export function DrawerPanel({
  pageUrl,
  unterseiten,
  globalIssues,
  onClose,
  isChecked,
  onToggleChecked,
}: {
  pageUrl: string;
  unterseiten: UnterseiteProp[];
  globalIssues?: ParsedIssueProp[];
  onClose: () => void;
  isChecked: boolean;
  onToggleChecked: () => void;
}) {
  // Swipe-to-close for mobile bottom-sheet
  const touchStartY = useRef<number>(0);
  function handleTouchStart(e: React.TouchEvent) { touchStartY.current = e.touches[0].clientY; }
  function handleTouchMove(e: React.TouchEvent) { if (e.touches[0].clientY - touchStartY.current > 80) onClose(); }
  const page = unterseiten.find(p => p.url === pageUrl);
  const toPath = (u: string) => { try { return new URL(u).pathname || "/"; } catch { return u; } };
  const path = toPath(pageUrl);
  const is404 = page && !page.erreichbar;

  type DrawerEntry = { fixKey: string | null; label: string; kind: "critical" | "warning"; count?: number; images?: string[]; fields?: string[] };
  const entries: DrawerEntry[] = [];

  if (page) {
    // Subpage: build entries from per-page crawl data
    if (!page.title || page.title === "(kein Title)")
      entries.push({ fixKey: "title", label: "Title-Tag fehlt", kind: "critical" });
    if (!page.h1 || page.h1 === "(kein H1)")
      entries.push({ fixKey: "h1", label: "H1-Überschrift fehlt", kind: "warning" });
    if (page.noindex)
      entries.push({ fixKey: "noindex", label: "Noindex gesetzt — Seite für Google unsichtbar", kind: "warning" });
    if (!page.metaDescription)
      entries.push({ fixKey: "meta", label: "Meta-Description fehlt", kind: "warning" });
    if (page.altMissing > 0) {
      // images.length is the authoritative count — it's what the file list actually renders.
      // page.altMissing can differ when altMissingImages was collected globally vs. per-page.
      const imgs = page.altMissingImages ?? [];
      const altCount = imgs.length > 0 ? imgs.length : page.altMissing;
      entries.push({ fixKey: "alt", label: `${altCount} Bilder ohne Alt-Text — SEO-Potenzial & Auffindbarkeit`, kind: "warning", count: altCount, images: imgs });
    }
    if ((page.inputsWithoutLabel ?? 0) > 0) {
      const flds = page.inputsWithoutLabelFields ?? [];
      const labelCount = flds.length > 0 ? flds.length : (page.inputsWithoutLabel ?? 0);
      entries.push({ fixKey: "label", label: `${labelCount} Formularfelder ohne Label — beeinträchtigt UX & Conversion`, kind: "warning", count: labelCount, fields: flds });
    }
    if ((page.buttonsWithoutText ?? 0) > 0)
      entries.push({ fixKey: "button", label: `${page.buttonsWithoutText} Buttons ohne Text — fehlende Nutzerführung`, kind: "warning", count: page.buttonsWithoutText });
  } else if (globalIssues && globalIssues.length > 0) {
    // Homepage (not in unterseiten): show the consolidated scan issues
    for (const issue of globalIssues) {
      entries.push({
        fixKey: null,
        label: issue.count && issue.count > 1
          ? `${issue.title} (${issue.count}×)`
          : issue.title,
        kind: issue.severity === "red" ? "critical" : "warning",
      });
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, backdropFilter: "blur(3px)" }} />

      {/* Drawer */}
      <div
        className="wf-drawer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(480px, 100vw)",
          background: "#0b0e15",
          borderLeft: `1px solid ${D.borderMid}`,
          zIndex: 1001, overflowY: "auto", display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
          animation: "wf-drawer-slide-right 0.28s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* ── Mobile drag handle (only visible on small screens via CSS) ── */}
        <div className="wf-drawer-handle" style={{
          display: "none", justifyContent: "center",
          padding: "10px 0 4px", cursor: "grab", flexShrink: 0,
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
        </div>

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
// ─── Optimierungs-Plan Modal ─────────────────────────────────────────────────
export function OptimizationPlanModal({ onClose, plan, builder, woo, speedScore, redCount, yellowCount, url, scanId }: {
  onClose: () => void;
  plan: string;
  builder: BuilderAuditProp | null;
  woo: WooAuditProp | null;
  speedScore: number;
  redCount: number;
  yellowCount: number;
  url: string;
  scanId?: string;
}) {
  const steps = generateOptimizationPlan({ builder, woo, speedScore, redCount, yellowCount, url });
  const theme = getBuilderTheme(builder?.builder ?? null);
  void plan;

  // Task-Export-State: pro Step-Index zeigen wir "idle | loading | done | error"
  const [exportState, setExportState] = useState<Record<number, "idle" | "loading" | "done" | "error">>({});
  const [exportErr,   setExportErr]   = useState<Record<number, string>>({});
  const [exportLinks, setExportLinks] = useState<Record<number, string>>({});

  async function exportStep(idx: number, step: { title: string; body: string; priority: "red" | "yellow" }) {
    setExportState(p => ({ ...p, [idx]: "loading" }));
    setExportErr(p => ({ ...p, [idx]: "" }));
    try {
      const res = await fetch("/api/integrations/export-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       step.title,
          description: step.body,
          priority:    step.priority,
          url,
          scanId,
          source:      "optimization_plan",
          meta: {
            builder:    builder?.builder ?? null,
            domDepth:   builder?.maxDomDepth ?? null,
            googleFonts: builder?.googleFontFamilies ?? [],
            wooRiskPct: woo?.revenueRiskPct ?? null,
            speedScore,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setExportState(p => ({ ...p, [idx]: "error" }));
        setExportErr(p => ({ ...p, [idx]: data.error ?? "Export fehlgeschlagen" }));
      } else {
        setExportState(p => ({ ...p, [idx]: "done" }));
        if (data.externalUrl) setExportLinks(p => ({ ...p, [idx]: data.externalUrl }));
      }
    } catch {
      setExportState(p => ({ ...p, [idx]: "error" }));
      setExportErr(p => ({ ...p, [idx]: "Verbindungsfehler" }));
    }
  }

  function handlePrint() { window.print(); }
  function handleCopy() {
    const text = [
      `Optimierungs-Plan · ${url}`,
      `Erstellt: ${new Date().toLocaleDateString("de-DE")}`,
      "",
      ...steps.map((s, i) => `${i + 1}. ${s.title}\n   ${s.body}`),
    ].join("\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <>
      <style>{`
        @keyframes wf-opt-spin { to { transform: rotate(360deg); } }
        @media print {
          body > *:not(.wf-opt-plan-root) { display: none !important; }
          .wf-opt-plan-root { position: static !important; background: #fff !important; }
          .wf-opt-plan-card { background: #fff !important; color: #0b0c10 !important; box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
          .wf-opt-plan-card * { color: #0b0c10 !important; }
          .wf-opt-plan-no-print { display: none !important; }
        }
      `}</style>
      <div className="wf-opt-plan-root" onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
        <div className="wf-opt-plan-card" onClick={e => e.stopPropagation()} style={{
          maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 16, background: "#0f1623",
          border: `1px solid ${theme.bd}`, boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        }}>
          {/* Header */}
          <div style={{
            padding: "22px 28px",
            background: `linear-gradient(135deg, ${theme.bg} 0%, transparent 100%)`,
            borderBottom: `1px solid ${theme.bd}`,
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10,
          }}>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.primary }}>
                WebsiteFix · Optimierungs-Plan
              </p>
              <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                {steps.length} Handlungspunkte für {builder?.builder ?? "deine Website"}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                {url} · {new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            <button className="wf-opt-plan-no-print" onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>

          {/* Steps */}
          <div style={{ padding: "22px 28px" }}>
            {steps.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: D.textSub }}>
                Die Seite läuft technisch sauber — derzeit keine priorisierten Handlungspunkte.
              </p>
            ) : (
              <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {steps.map((step, idx) => (
                  <li key={idx} style={{
                    padding: "14px 16px", marginBottom: 10, borderRadius: 10,
                    background: step.priority === "red" ? "rgba(239,68,68,0.06)" : "rgba(251,191,36,0.05)",
                    border: `1px solid ${step.priority === "red" ? "rgba(239,68,68,0.22)" : "rgba(251,191,36,0.22)"}`,
                    display: "flex", gap: 12, alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: 26, height: 26, flexShrink: 0, borderRadius: 7,
                      background: step.priority === "red" ? "#f87171" : "#fbbf24",
                      color: "#0b0c10", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900,
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: "#fff" }}>{step.title}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "1px 7px", borderRadius: 10,
                          background: step.priority === "red" ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
                          color: step.priority === "red" ? "#f87171" : "#fbbf24",
                          border: `1px solid ${step.priority === "red" ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}`,
                          letterSpacing: "0.06em",
                        }}>
                          {step.priority === "red" ? "PRIORITÄT" : "OPTIMIERUNG"}
                        </span>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "rgba(255,255,255,0.62)", lineHeight: 1.6 }}>{step.body}</p>

                      {/* Task-Export-Button — fire-and-forget an Jira/Trello/Zapier */}
                      <div className="wf-opt-plan-no-print" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={() => exportStep(idx, step)}
                          disabled={exportState[idx] === "loading" || exportState[idx] === "done"}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "5px 10px", borderRadius: 6, fontSize: 10.5, fontWeight: 700,
                            background: exportState[idx] === "done" ? "rgba(74,222,128,0.10)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${exportState[idx] === "done" ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.12)"}`,
                            color: exportState[idx] === "done" ? "#4ade80" : "rgba(255,255,255,0.55)",
                            cursor: exportState[idx] === "loading" || exportState[idx] === "done" ? "default" : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {exportState[idx] === "loading" ? (
                            <><span style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", display: "inline-block", animation: "wf-opt-spin 0.7s linear infinite" }} /> Wird exportiert…</>
                          ) : exportState[idx] === "done" ? (
                            <>✓ Als Task exportiert</>
                          ) : (
                            <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Als Task exportieren</>
                          )}
                        </button>
                        {exportState[idx] === "done" && exportLinks[idx] && (
                          <a href={exportLinks[idx]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10.5, color: "#4ade80", textDecoration: "none", fontWeight: 700 }}>
                            Ticket öffnen ↗
                          </a>
                        )}
                        {exportState[idx] === "error" && (
                          <span style={{ fontSize: 10.5, color: "#f87171" }}>
                            {exportErr[idx]}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Footer Actions */}
          <div className="wf-opt-plan-no-print" style={{
            padding: "14px 28px 22px", borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end",
          }}>
            <button onClick={handleCopy} style={{
              padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", cursor: "pointer", fontFamily: "inherit",
            }}>
              Als Text kopieren
            </button>
            <button onClick={handlePrint} style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 800,
              background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}DD)`,
              color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
              boxShadow: `0 3px 10px ${theme.bg}`,
            }}>
              Als PDF exportieren
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

