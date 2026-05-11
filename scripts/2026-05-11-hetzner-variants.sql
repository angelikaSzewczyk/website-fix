-- ════════════════════════════════════════════════════════════════════════════
-- Hetzner-Hoster-Variants für die 3 Premium-Guides (11.05.2026)
--
-- Pricing-Card-Versprechen auf Landing + Agentur-Seite listet Hetzner als
-- einen der 5 Top-Hoster mit eigenen Klick-Pfaden — content_json.variants
-- hatte aber bisher keinen hetzner-Block. Pfade beziehen sich auf Hetzner
-- KonsoleH (Shared Webhosting), weil das der häufigste Anon-Käufer-Use-Case
-- ist; Cloud-Server-User finden sich über SSH-Konfiguration zurecht.
--
-- jsonb_set mit Pfad {variants,hetzner} fügt den Block ein, ohne die
-- bestehenden Variants (default/strato/ionos/all-inkl/hostinger) zu
-- überschreiben.
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1) hosting-speed: PHP, GZIP, Caching
-- ────────────────────────────────────────────────────────────────────────────
UPDATE rescue_guides
SET content_json = jsonb_set(
  content_json,
  '{variants,hetzner}',
  $$
  {
    "steps": [
      { "title": "Hetzner KonsoleH öffnen", "body": "https://konsoleh.hetzner.com — Login mit Vertragsnummer + Kundenpasswort. Im Menü links Webspace → entsprechende Domain auswählen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH-Login-Maske" },
      { "title": "PHP-Version anpassen", "body": "Tools → Skriptsprachen → PHP-Version → 8.2 wählen → OPcache-Checkbox aktivieren → Speichern. Greift binnen 1-2 Min, kein Restart nötig.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH PHP-Versions-Dropdown" },
      { "title": "GZIP via .htaccess + Hetzner-Cache", "body": "Tools → WebFTP → public_html/.htaccess editieren → mod_deflate-Block aus dem Sofort-Fix oben einfügen. Zusätzlich KonsoleH → Tools → HTTP-Cache aktivieren — Hetzner-spezifischer Reverse-Proxy-Cache vor Apache.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH WebFTP mit .htaccess-Editor" }
    ]
  }
  $$::jsonb
)
WHERE id = 'hosting-speed';

-- ────────────────────────────────────────────────────────────────────────────
-- 2) google-visibility: DNS, robots, Wartungsmodus
-- ────────────────────────────────────────────────────────────────────────────
UPDATE rescue_guides
SET content_json = jsonb_set(
  content_json,
  '{variants,hetzner}',
  $$
  {
    "steps": [
      { "title": "Hetzner KonsoleH + Domain-Übersicht", "body": "https://konsoleh.hetzner.com → Login → Domains → entsprechende Domain anklicken. DNS-Records sind unter Domain-Verwaltung → DNS direkt editierbar.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH Domain-Übersicht" },
      { "title": "DNS-Records prüfen", "body": "Domain → DNS → Records-Tabelle. A-Record auf Hetzner-Webspace-IP (steht in der Vertrags-Mail), CNAME für www auf Hauptdomain. Hetzner setzt bei Neuanlage manchmal eine Parking-IP — die muss überschrieben werden.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH DNS-Records-Editor" },
      { "title": "robots-Block in .htaccess entfernen", "body": "Tools → WebFTP → public_html/.htaccess öffnen. Falls X-Robots-Tag noindex oder Header set X-Robots-Tag drin: Zeile entfernen + Speichern. Zusätzlich prüfen: KonsoleH → Domain → Passwortschutz darf NICHT aktiv sein, sonst kommt Google an einen 401.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner WebFTP .htaccess-Editor mit X-Robots-Tag-Zeile" }
    ]
  }
  $$::jsonb
)
WHERE id = 'google-visibility';

-- ────────────────────────────────────────────────────────────────────────────
-- 3) wp-critical-error: Backup-Restore, Plugin-Deaktivierung
-- ────────────────────────────────────────────────────────────────────────────
UPDATE rescue_guides
SET content_json = jsonb_set(
  content_json,
  '{variants,hetzner}',
  $$
  {
    "steps": [
      { "title": "Hetzner KonsoleH Backup-Center", "body": "https://konsoleh.hetzner.com → Webspace → Backup-Center. Hetzner hält 14 Tage tägliche Snapshots automatisch — gratis im Standard-Webhosting enthalten.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH Backup-Übersicht mit Snapshot-Liste" },
      { "title": "Snapshot vor dem Crash zurückspielen", "body": "Im Backup-Center den letzten gesunden Tag wählen → Wiederherstellen klicken. Hetzner erlaubt File-only oder Database+File-Restore — bei Plugin-Crash reicht File-only (Datenbank bleibt intakt).", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner Snapshot-Wiederherstellungs-Dialog mit Optionen" },
      { "title": "PHP-Version + Auto-Updates absichern", "body": "Tools → Skriptsprachen → PHP-Version 8.2 mit OPcache wählen. Dann in WordPress: Einstellungen → Allgemein → Automatische Updates auf NUR Security setzen — verhindert dass ein weiterer Plugin-Auto-Update den Wiederherstellungs-Stand erneut crasht.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH PHP-Version-Selector mit OPcache-Checkbox" }
    ]
  }
  $$::jsonb
)
WHERE id = 'wp-critical-error';
