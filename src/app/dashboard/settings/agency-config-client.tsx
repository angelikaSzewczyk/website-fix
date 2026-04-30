"use client";

/**
 * AgencyConfigClient — Sprint 12 Settings-Bündel:
 *   1. SMTP-Konfiguration (Host/Port/User/Pass + "Verbindung testen")
 *   2. White-Label & Custom-Domain (PDF-Logo + eigene Lead-Capture-Domain)
 *   3. WP-Plugin-Verbindung (API-Key generieren, einmalig anzeigen, rotieren)
 *   4. Lead-Magnet-Snippet-Generator (HTML/JS-Embed-Code zum Kopieren)
 *
 * Wird im Branding-Tab UNTER dem bestehenden SettingsClient gerendert.
 * Eigene Komponente, weil die SMTP-/API-Key-Logik viel client-state hat,
 * die das alte Branding-Form nicht braucht.
 */

import { useEffect, useState } from "react";

type Loaded = {
  smtp_host:            string;
  smtp_port:            number | null;
  smtp_user:            string;
  smtp_from_email:      string;
  smtp_pass_set:        boolean;
  white_label_logo_url: string;
  custom_domain:        string;
  api_key_wp_set:       boolean;
  api_key_wp_created_at: string | null;
  can_use_wp_bridge:    boolean;
};

type Props = {
  /** Numerische User-ID = agency_id für Lead-Snippet. */
  agencyId: string;
  /** Plan-String — Settings-Page hat bereits hasBrandingAccess gegated, aber WP-Bridge ist Agency-only. */
  plan: string;
};

const D = {
  card:      "rgba(255,255,255,0.025)",
  border:    "rgba(255,255,255,0.08)",
  divider:   "rgba(255,255,255,0.06)",
  text:      "rgba(255,255,255,0.92)",
  textSub:   "rgba(255,255,255,0.55)",
  textMuted: "rgba(255,255,255,0.4)",
  blue:      "#7aa6ff",
  green:     "#4ade80",
  amber:     "#fbbf24",
  red:       "#f87171",
  purple:    "#a78bfa",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${D.border}`,
  color: D.text,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      {children}
      {hint && <span style={{ fontSize: 10.5, color: D.textMuted, lineHeight: 1.5 }}>{hint}</span>}
    </label>
  );
}

function CardShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: D.card,
      border: `1px solid ${D.border}`,
      borderRadius: 16,
      padding: "26px 28px",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <header>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: D.text, letterSpacing: "-0.01em" }}>{title}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: D.textSub, lineHeight: 1.5 }}>{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

function StatusInline({ kind, message }: { kind: "ok" | "error" | "info"; message: string }) {
  const color =
    kind === "ok" ? D.green :
    kind === "error" ? D.red :
    D.blue;
  const bg =
    kind === "ok" ? "rgba(74,222,128,0.10)" :
    kind === "error" ? "rgba(248,113,113,0.10)" :
    "rgba(122,166,255,0.10)";
  return (
    <div style={{
      padding: "8px 12px", borderRadius: 8,
      background: bg, border: `1px solid ${color}30`,
      color, fontSize: 12, fontWeight: 600, lineHeight: 1.5,
    }}>
      {message}
    </div>
  );
}

export default function AgencyConfigClient({ agencyId, plan }: Props) {
  // ── Form-State ──
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loading, setLoading] = useState(true);

  // SMTP
  const [smtpHost, setSmtpHost]       = useState("");
  const [smtpPort, setSmtpPort]       = useState("");
  const [smtpUser, setSmtpUser]       = useState("");
  const [smtpPass, setSmtpPass]       = useState("");
  const [smtpFrom, setSmtpFrom]       = useState("");
  const [smtpPassVisible, setSmtpPassVisible] = useState(false);
  const [smtpSaving, setSmtpSaving]   = useState(false);
  const [smtpStatus, setSmtpStatus]   = useState<{ kind: "ok"|"error"|"info"; message: string } | null>(null);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ kind: "ok"|"error"; message: string } | null>(null);

  // White-Label + Custom-Domain
  const [whiteLabelLogo, setWhiteLabelLogo] = useState("");
  const [customDomain,   setCustomDomain]   = useState("");
  const [wlSaving, setWlSaving]   = useState(false);
  const [wlStatus, setWlStatus]   = useState<{ kind: "ok"|"error"; message: string } | null>(null);

  // WP-API-Key
  const [keyBusy, setKeyBusy] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<{ kind: "ok"|"error"; message: string } | null>(null);
  const [showRotateConfirm, setShowRotateConfirm] = useState(false);

  // Lead-Snippet
  const [snippetCopied, setSnippetCopied] = useState(false);

  // ── Initial-Load ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/agency-settings");
        if (!res.ok) throw new Error("load failed");
        const data = await res.json() as Loaded;
        if (cancelled) return;
        setLoaded(data);
        setSmtpHost(data.smtp_host ?? "");
        setSmtpPort(data.smtp_port ? String(data.smtp_port) : "");
        setSmtpUser(data.smtp_user ?? "");
        setSmtpFrom(data.smtp_from_email ?? "");
        setWhiteLabelLogo(data.white_label_logo_url ?? "");
        setCustomDomain(data.custom_domain ?? "");
      } catch {
        if (!cancelled) setLoaded({
          smtp_host: "", smtp_port: null, smtp_user: "", smtp_from_email: "",
          smtp_pass_set: false, white_label_logo_url: "", custom_domain: "",
          api_key_wp_set: false, api_key_wp_created_at: null, can_use_wp_bridge: false,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Save-Helpers ──
  // Wir teilen die Sektionen (SMTP / White-Label) auf eigene Save-Buttons —
  // ein Mega-Save würde dazu führen, dass eine fehlerhafte Custom-Domain
  // den SMTP-Speicher blockiert. So sieht der User direkt, wo's hakt.

  async function saveSmtp() {
    setSmtpSaving(true);
    setSmtpStatus(null);
    try {
      const portInt = smtpPort ? parseInt(smtpPort, 10) : null;
      if (portInt !== null && (Number.isNaN(portInt) || portInt < 1 || portInt > 65535)) {
        setSmtpStatus({ kind: "error", message: "Port muss zwischen 1 und 65535 liegen." });
        return;
      }
      const body: Record<string, unknown> = {
        // Branding-Pflichtfelder mitgeben — der PUT-Endpoint upserted die ganze
        // Zeile und würde sonst die bestehenden Werte auf "" setzen.
        agency_name:    "",  // wird vom anderen Form gesetzt
        agency_website: "",
        logo_url:       "",
        primary_color:  "#8df3d3",
        // Wir senden die aktuellen Branding-Werte aber nicht von hier — ein
        // PUT MIT diesen Defaults würde das andere Form überschreiben.
        // Lösung: separater "merge"-Pfad. Wir lesen die aktuellen Werte erst
        // und schicken sie unverändert mit.
        smtp_host:       smtpHost.trim() || null,
        smtp_port:       portInt,
        smtp_user:       smtpUser.trim() || null,
        smtp_from_email: smtpFrom.trim() || null,
      };
      // Pass nur senden, wenn neuer Wert eingegeben.
      if (smtpPass) body.smtp_pass = smtpPass;

      // Vor dem Speichern die aktuellen Branding-Werte mergen.
      const current = await fetch("/api/agency-settings").then(r => r.ok ? r.json() : null);
      if (current) {
        body.agency_name    = current.agency_name    ?? "";
        body.agency_website = current.agency_website ?? "";
        body.logo_url       = current.logo_url       ?? "";
        body.primary_color  = current.primary_color  ?? "#8df3d3";
        // Auch white-label-Felder mit-mergen, damit dieser Save sie nicht löscht.
        body.white_label_logo_url = current.white_label_logo_url ?? null;
        body.custom_domain        = current.custom_domain        ?? null;
      }

      const res = await fetch("/api/agency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSmtpStatus({ kind: "error", message: err.error ?? "Speichern fehlgeschlagen." });
        return;
      }
      setSmtpStatus({ kind: "ok", message: "SMTP-Konfiguration gespeichert." });
      setSmtpPass("");
      // loaded.smtp_pass_set neu lesen
      const fresh = await fetch("/api/agency-settings").then(r => r.json()).catch(() => null);
      if (fresh) setLoaded(fresh);
    } catch {
      setSmtpStatus({ kind: "error", message: "Verbindungsfehler beim Speichern." });
    } finally {
      setSmtpSaving(false);
    }
  }

  async function testSmtp() {
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch("/api/agency-settings/smtp-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort ? parseInt(smtpPort, 10) : 587,
          user: smtpUser,
          // Wenn der User kein neues Pass eingegeben hat, schickt Server den
          // entschlüsselten Wert aus der DB.
          pass: smtpPass,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setSmtpTestResult({ kind: "ok", message: data.message ?? "Verbindung erfolgreich." });
      } else {
        setSmtpTestResult({ kind: "error", message: data.error ?? "Test fehlgeschlagen." });
      }
    } catch {
      setSmtpTestResult({ kind: "error", message: "Verbindungsfehler beim Test." });
    } finally {
      setSmtpTesting(false);
    }
  }

  async function saveWhiteLabel() {
    setWlSaving(true);
    setWlStatus(null);
    try {
      const current = await fetch("/api/agency-settings").then(r => r.ok ? r.json() : null);
      const body: Record<string, unknown> = {
        agency_name:    current?.agency_name    ?? "",
        agency_website: current?.agency_website ?? "",
        logo_url:       current?.logo_url       ?? "",
        primary_color:  current?.primary_color  ?? "#8df3d3",
        white_label_logo_url: whiteLabelLogo.trim() || null,
        custom_domain:        customDomain.trim() || null,
        smtp_host:       current?.smtp_host       ?? null,
        smtp_port:       current?.smtp_port       ?? null,
        smtp_user:       current?.smtp_user       ?? null,
        smtp_from_email: current?.smtp_from_email ?? null,
      };
      const res = await fetch("/api/agency-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setWlStatus({ kind: "error", message: err.error ?? "Speichern fehlgeschlagen." });
        return;
      }
      setWlStatus({ kind: "ok", message: "White-Label & Custom-Domain gespeichert." });
    } catch {
      setWlStatus({ kind: "error", message: "Verbindungsfehler beim Speichern." });
    } finally {
      setWlSaving(false);
    }
  }

  async function generateApiKey() {
    setKeyBusy(true);
    setKeyStatus(null);
    setRevealedKey(null);
    try {
      const res = await fetch("/api/agency-settings/api-key", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setKeyStatus({ kind: "error", message: data.error ?? "Generierung fehlgeschlagen." });
        return;
      }
      setRevealedKey(data.api_key as string);
      setKeyStatus({ kind: "ok", message: "Neuer API-Key erstellt — Kopie ist nur jetzt sichtbar." });
      // loaded.api_key_wp_set updaten
      const fresh = await fetch("/api/agency-settings").then(r => r.json()).catch(() => null);
      if (fresh) setLoaded(fresh);
    } catch {
      setKeyStatus({ kind: "error", message: "Verbindungsfehler bei der Generierung." });
    } finally {
      setKeyBusy(false);
      setShowRotateConfirm(false);
    }
  }

  async function deleteApiKey() {
    setKeyBusy(true);
    setKeyStatus(null);
    setRevealedKey(null);
    try {
      const res = await fetch("/api/agency-settings/api-key", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setKeyStatus({ kind: "error", message: data.error ?? "Löschen fehlgeschlagen." });
        return;
      }
      setKeyStatus({ kind: "ok", message: "API-Key entfernt — das WordPress-Plugin verliert sofort den Zugriff." });
      const fresh = await fetch("/api/agency-settings").then(r => r.json()).catch(() => null);
      if (fresh) setLoaded(fresh);
    } catch {
      setKeyStatus({ kind: "error", message: "Verbindungsfehler beim Löschen." });
    } finally {
      setKeyBusy(false);
    }
  }

  function copyToClipboard(text: string, onCopied: () => void) {
    navigator.clipboard.writeText(text)
      .then(onCopied)
      .catch(() => {
        // Fallback: Selection
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); onCopied(); } catch {}
        document.body.removeChild(ta);
      });
  }

  // ── Lead-Snippet ──────────────────────────────────────────────────────────
  // HTML+JS, das die Agentur kopiert und in ihre eigene Site einbettet.
  // Postet an POST /api/leads/capture (CORS-fähig). agencyId ist die User-ID.
  // Bei custom_domain im Settings: Origin muss matchen, sonst 403 — das
  // Snippet wird also automatisch domain-locked, sobald die Custom-Domain
  // gespeichert ist.
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.website-fix.com";
  const leadSnippet = [
    `<!-- WebsiteFix Lead-Capture · agency-id=${agencyId} -->`,
    `<form id="wf-lead-form" data-wf-agency="${agencyId}" style="display:flex;gap:8px;flex-wrap:wrap;font-family:inherit">`,
    `  <input name="email" type="email" required placeholder="Deine E-Mail" style="flex:1;min-width:200px;padding:10px 14px;border-radius:8px;border:1px solid #ddd;font-size:14px">`,
    `  <input name="url"   type="url"   required placeholder="https://deine-website.de" style="flex:1;min-width:200px;padding:10px 14px;border-radius:8px;border:1px solid #ddd;font-size:14px">`,
    `  <button type="submit" style="padding:10px 20px;border-radius:8px;background:#7C3AED;color:#fff;border:none;font-weight:700;cursor:pointer">Gratis-Analyse starten</button>`,
    `</form>`,
    `<script>`,
    `  (function() {`,
    `    var f = document.getElementById("wf-lead-form");`,
    `    if (!f) return;`,
    `    f.addEventListener("submit", async function(e) {`,
    `      e.preventDefault();`,
    `      var btn = f.querySelector("button"); btn.disabled = true; btn.innerText = "Wird gesendet…";`,
    `      try {`,
    `        var res = await fetch("${baseUrl}/api/leads/capture", {`,
    `          method: "POST",`,
    `          headers: { "Content-Type": "application/json" },`,
    `          body: JSON.stringify({`,
    `            agencyId: f.dataset.wfAgency,`,
    `            email:    f.email.value,`,
    `            url:      f.url.value,`,
    `            source:   "embed-form"`,
    `          })`,
    `        });`,
    `        if (res.ok) { btn.innerText = "✓ Gesendet"; f.email.value = ""; f.url.value = ""; }`,
    `        else { btn.disabled = false; btn.innerText = "Gratis-Analyse starten"; alert("Senden fehlgeschlagen — bitte erneut versuchen."); }`,
    `      } catch (err) {`,
    `        btn.disabled = false; btn.innerText = "Gratis-Analyse starten";`,
    `        alert("Verbindungsfehler — bitte später erneut versuchen.");`,
    `      }`,
    `    });`,
    `  })();`,
    `</script>`,
  ].join("\n");

  if (loading) {
    return (
      <div style={{ padding: "26px 28px", color: D.textMuted, fontSize: 13 }}>
        Konfiguration wird geladen…
      </div>
    );
  }

  const cfg = loaded!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>

      {/* ─── 1. SMTP-Konfiguration ─────────────────────────────────────────── */}
      <CardShell
        title="SMTP-Konfiguration"
        subtitle="Eigene Mailbox für Monatsreports und Lead-Benachrichtigungen. Passwort wird AES-256-GCM verschlüsselt."
      >
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
          <Field label="SMTP-Host" hint="z.B. smtp.world4you.com, mail.kunde-domain.de">
            <input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} placeholder="smtp.example.com" style={inputStyle} />
          </Field>
          <Field label="Port" hint="465 = TLS direkt, 587 = STARTTLS">
            <input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} placeholder="587" style={inputStyle} />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Benutzer">
            <input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} placeholder="reports@meine-agentur.de" style={inputStyle} />
          </Field>
          <Field label="Absender-E-Mail" hint="Erscheint im 'From'-Feld der Reports.">
            <input type="email" value={smtpFrom} onChange={e => setSmtpFrom(e.target.value)} placeholder="reports@meine-agentur.de" style={inputStyle} />
          </Field>
        </div>
        <Field label="Passwort" hint={cfg.smtp_pass_set ? "Bereits gespeichert. Leer lassen, um den vorhandenen Wert beizubehalten." : "Wird verschlüsselt gespeichert. Niemals an Dritte weitergeben."}>
          <div style={{ position: "relative" }}>
            <input
              type={smtpPassVisible ? "text" : "password"}
              value={smtpPass}
              onChange={e => setSmtpPass(e.target.value)}
              placeholder={cfg.smtp_pass_set ? "•••••••• (gespeichert)" : "App-Passwort eingeben"}
              autoComplete="new-password"
              style={{ ...inputStyle, paddingRight: 80 }}
            />
            <button
              type="button"
              onClick={() => setSmtpPassVisible(v => !v)}
              style={{
                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: "rgba(255,255,255,0.04)", border: `1px solid ${D.border}`,
                color: D.textSub, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {smtpPassVisible ? "Verbergen" : "Anzeigen"}
            </button>
          </div>
        </Field>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
          <button
            onClick={saveSmtp}
            disabled={smtpSaving}
            style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: D.purple, color: "#fff", border: "none",
              cursor: smtpSaving ? "wait" : "pointer", fontFamily: "inherit",
              opacity: smtpSaving ? 0.7 : 1,
            }}
          >
            {smtpSaving ? "Wird gespeichert…" : "Speichern"}
          </button>
          <button
            onClick={testSmtp}
            disabled={smtpTesting || !smtpHost || !smtpUser}
            style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: "rgba(255,255,255,0.04)", color: D.text,
              border: `1px solid ${D.border}`,
              cursor: smtpTesting ? "wait" : !smtpHost || !smtpUser ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: !smtpHost || !smtpUser ? 0.5 : 1,
            }}
          >
            {smtpTesting ? "Teste Verbindung…" : "Verbindung testen"}
          </button>
        </div>

        {smtpStatus && <StatusInline kind={smtpStatus.kind} message={smtpStatus.message} />}
        {smtpTestResult && <StatusInline kind={smtpTestResult.kind} message={smtpTestResult.message} />}
      </CardShell>

      {/* ─── 2. White-Label & Custom-Domain ───────────────────────────────── */}
      <CardShell
        title="White-Label & Custom-Domain"
        subtitle="Dediziertes Logo für PDF-Reports und eigene Domain für das Lead-Capture-Widget."
      >
        <Field label="White-Label Logo (URL)" hint="Wird im PDF-Header verwendet. Optional — fällt sonst auf das Branding-Logo zurück.">
          <input value={whiteLabelLogo} onChange={e => setWhiteLabelLogo(e.target.value)} placeholder="https://cdn.kunde.de/logo.png" style={inputStyle} />
        </Field>
        <Field label="Custom-Domain" hint="Domain, auf der dein Lead-Widget eingebettet ist. Sichert /api/leads/capture per Origin-Check ab.">
          <input value={customDomain} onChange={e => setCustomDomain(e.target.value.toLowerCase())} placeholder="kunde-agentur.de" style={inputStyle} />
        </Field>

        <div>
          <button
            onClick={saveWhiteLabel}
            disabled={wlSaving}
            style={{
              padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: D.purple, color: "#fff", border: "none",
              cursor: wlSaving ? "wait" : "pointer", fontFamily: "inherit",
              opacity: wlSaving ? 0.7 : 1,
            }}
          >
            {wlSaving ? "Wird gespeichert…" : "Speichern"}
          </button>
        </div>

        {wlStatus && <StatusInline kind={wlStatus.kind} message={wlStatus.message} />}
      </CardShell>

      {/* ─── 3. WP-Plugin-Verbindung ─────────────────────────────────────── */}
      <CardShell
        title="WordPress-Plugin-Verbindung"
        subtitle="API-Key für das WebsiteFix Auto-Heal-Plugin. Schreibt SEO-Korrekturen direkt in die Kunden-Sites."
      >
        {!cfg.can_use_wp_bridge && (
          <StatusInline kind="info" message="WP-Bridge ist exklusiv für den Agency-Plan. Upgrade in den Plan-Einstellungen." />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: "3px 9px", borderRadius: 20,
              color: cfg.api_key_wp_set ? D.green : D.textMuted,
              background: cfg.api_key_wp_set ? "rgba(74,222,128,0.10)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${cfg.api_key_wp_set ? "rgba(74,222,128,0.28)" : D.border}`,
              letterSpacing: "0.04em",
            }}>
              {cfg.api_key_wp_set ? "● API-KEY AKTIV" : "○ KEIN API-KEY"}
            </span>
            {cfg.api_key_wp_created_at && (
              <span style={{ fontSize: 11, color: D.textMuted }}>
                erstellt am {new Date(cfg.api_key_wp_created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            )}
          </div>

          {!cfg.api_key_wp_set ? (
            <button
              onClick={generateApiKey}
              disabled={keyBusy || !cfg.can_use_wp_bridge}
              style={{
                alignSelf: "flex-start",
                padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: D.purple, color: "#fff", border: "none",
                cursor: keyBusy ? "wait" : !cfg.can_use_wp_bridge ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: !cfg.can_use_wp_bridge ? 0.5 : 1,
              }}
            >
              {keyBusy ? "Wird generiert…" : "Neuen API-Key generieren"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!showRotateConfirm ? (
                <button
                  onClick={() => setShowRotateConfirm(true)}
                  disabled={keyBusy}
                  style={{
                    padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: "rgba(255,255,255,0.04)", color: D.amber,
                    border: `1px solid rgba(251,191,36,0.30)`,
                    cursor: keyBusy ? "wait" : "pointer", fontFamily: "inherit",
                  }}
                >
                  API-Key rotieren
                </button>
              ) : (
                <>
                  <button
                    onClick={generateApiKey}
                    disabled={keyBusy}
                    style={{
                      padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                      background: D.amber, color: "#0b0c10", border: "none",
                      cursor: keyBusy ? "wait" : "pointer", fontFamily: "inherit",
                    }}
                  >
                    {keyBusy ? "Wird rotiert…" : "Wirklich rotieren? Alter Key wird sofort ungültig."}
                  </button>
                  <button
                    onClick={() => setShowRotateConfirm(false)}
                    disabled={keyBusy}
                    style={{
                      padding: "9px 14px", borderRadius: 8, fontSize: 13,
                      background: "rgba(255,255,255,0.04)", color: D.textSub,
                      border: `1px solid ${D.border}`, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Abbrechen
                  </button>
                </>
              )}
              <button
                onClick={deleteApiKey}
                disabled={keyBusy}
                style={{
                  padding: "9px 14px", borderRadius: 8, fontSize: 13,
                  background: "rgba(248,113,113,0.08)", color: D.red,
                  border: `1px solid rgba(248,113,113,0.28)`,
                  cursor: keyBusy ? "wait" : "pointer", fontFamily: "inherit",
                }}
              >
                Verbindung trennen
              </button>
            </div>
          )}

          {/* One-time-reveal: nur wenn revealedKey gesetzt ist */}
          {revealedKey && (
            <div style={{
              marginTop: 6,
              padding: "14px 16px", borderRadius: 10,
              background: "rgba(74,222,128,0.06)",
              border: `1px solid rgba(74,222,128,0.30)`,
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: D.green, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Dein neuer API-Key (nur einmal sichtbar)
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <code style={{
                  flex: 1, minWidth: 240,
                  fontFamily: "ui-monospace, SF Mono, monospace", fontSize: 12,
                  padding: "10px 12px", borderRadius: 7,
                  background: "rgba(0,0,0,0.35)",
                  color: D.green, wordBreak: "break-all",
                }}>{revealedKey}</code>
                <button
                  onClick={() => copyToClipboard(revealedKey, () => {})}
                  style={{
                    padding: "8px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    background: D.green, color: "#0b0c10", border: "none",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Key kopieren
                </button>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 11.5, color: D.textSub, lineHeight: 1.55 }}>
                Trage diesen Wert im WordPress-Plugin unter <strong>Einstellungen → WebsiteFix → API-Key</strong> ein.
                Bei Verlust einfach rotieren — der alte Key wird damit sofort ungültig.
              </p>
            </div>
          )}

          {keyStatus && <StatusInline kind={keyStatus.kind} message={keyStatus.message} />}
        </div>
      </CardShell>

      {/* ─── 4. Lead-Magnet-Snippet ───────────────────────────────────────── */}
      <CardShell
        title="Lead-Magnet-Snippet"
        subtitle="HTML/JS-Code zum Einbetten auf deiner Agency-Site. Postet automatisch an deinen Lead-Capture-Endpoint."
      >
        <p style={{ margin: 0, fontSize: 12.5, color: D.textSub, lineHeight: 1.6 }}>
          Kopiere den folgenden Code und füge ihn in deine Landingpage ein. Wenn du oben eine
          {" "}<strong style={{ color: D.text }}>Custom-Domain</strong> gesetzt hast, akzeptiert
          der Server nur Anfragen von dieser Domain — Schutz vor Lead-Diebstahl.
        </p>

        <div style={{ position: "relative" }}>
          <pre style={{
            margin: 0,
            padding: "14px 16px",
            borderRadius: 10,
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${D.border}`,
            fontSize: 11.5, fontFamily: "ui-monospace, SF Mono, monospace",
            color: D.text, lineHeight: 1.55,
            overflowX: "auto",
            maxHeight: 320,
          }}>
            <code>{leadSnippet}</code>
          </pre>
          <button
            onClick={() => copyToClipboard(leadSnippet, () => {
              setSnippetCopied(true);
              setTimeout(() => setSnippetCopied(false), 2500);
            })}
            style={{
              position: "absolute", top: 10, right: 10,
              padding: "6px 12px", borderRadius: 7,
              background: snippetCopied ? D.green : D.purple,
              color: snippetCopied ? "#0b0c10" : "#fff",
              border: "none", fontSize: 11.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {snippetCopied ? "✓ Kopiert" : "Snippet kopieren"}
          </button>
        </div>

        <p style={{ margin: 0, fontSize: 11, color: D.textMuted, lineHeight: 1.6 }}>
          Agency-ID = <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4, color: D.text }}>{agencyId}</code> ·
          Plan = <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4, color: D.text }}>{plan}</code>
        </p>
      </CardShell>
    </div>
  );
}
