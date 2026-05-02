-- NextAuth required tables
CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  plan VARCHAR(20) DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: add stripe_subscription_id to existing deployments
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Scan history
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'website',
  issue_count INTEGER,
  result TEXT,
  issues_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add issues_json to existing tables (safe, idempotent)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS issues_json JSONB;

CREATE INDEX IF NOT EXISTS scans_user_id_idx ON scans(user_id);
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3 / Sprint 3: Multi-Tenancy für Agency-User
-- ─────────────────────────────────────────────────────────────────────────────
-- Trennt eigene Projekte von Kunden-Projekten + bereitet Per-Projekt-
-- White-Label vor (Custom-Logo pro Kunde, ergänzt das Agentur-weite
-- agency_settings).
ALTER TABLE saved_websites ADD COLUMN IF NOT EXISTS is_customer_project BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE saved_websites ADD COLUMN IF NOT EXISTS client_label TEXT;
ALTER TABLE saved_websites ADD COLUMN IF NOT EXISTS client_logo_url TEXT;

-- Index für den Power-Switcher: schnelles Filtern nach Kunden-Marker.
CREATE INDEX IF NOT EXISTS saved_websites_is_customer_idx
  ON saved_websites(user_id, is_customer_project);

-- Phase 3 / Sprint 4: last_login_at für Admin-User-Liste.
-- Wird im NextAuth-jwt-Callback bei jedem Login auf NOW() gesetzt.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Phase 3 / Sprint 5: Plan-Strings auf kanonische Werte normalisieren.
-- Der Code (lib/plans.ts) kennt 3 Canonical-Keys: starter, professional, agency.
-- Legacy-Aliase aus Vor-Migrations-Phasen ('smart-guard', 'pro', 'agency-pro',
-- 'agency-starter') werden hier hart umgesetzt — verhindert Drift in jedem
-- Code-Pfad, der noch strict-equality nutzt (z.B. dashboard/layout.tsx).
-- Idempotent: WHERE-Filter machen das Statement sicher mehrfach ausführbar.
UPDATE users SET plan = 'professional' WHERE plan IN ('smart-guard', 'pro');
UPDATE users SET plan = 'agency'       WHERE plan IN ('agency-pro', 'agency-starter');

-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3 / Sprint 11 — ARCHITECTURAL REBUILD
-- ─────────────────────────────────────────────────────────────────────────────

-- Cache-Isolation: scan_cache cache_key wird url + plan_tier + max_depth.
-- Vorher war der Cache plan-agnostisch → "197 → 9 Issues"-Drift, weil ein
-- Starter-Scan (50 Seiten) den Agency-Cache (10000 Seiten) überschrieben hat.
-- Mit dieser Migration kann das nicht mehr passieren: jede Plan-Tier-Stufe
-- hat ihre eigene Cache-Zeile.
ALTER TABLE scan_cache ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'anon';
ALTER TABLE scan_cache ADD COLUMN IF NOT EXISTS max_depth INTEGER NOT NULL DEFAULT 10;

-- Alte UNIQUE-Constraint (url) entfernen, neue composite-UNIQUE setzen.
-- DROP IF EXISTS ist idempotent — produziert NOTICE statt Error wenn
-- bereits gedroppt wurde.
DO $$
BEGIN
  -- Drop old single-column unique index/constraint if present
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scan_cache_url_key'
  ) THEN
    ALTER TABLE scan_cache DROP CONSTRAINT scan_cache_url_key;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'scan_cache_url_key' AND schemaname = 'public'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.scan_cache_url_key';
  END IF;
END $$;

-- Composite-UNIQUE: (url, plan_tier, max_depth). Alle Cache-Reads/Writes
-- in lib/scan-cache.ts treffen genau diese Kombination.
CREATE UNIQUE INDEX IF NOT EXISTS scan_cache_composite_key
  ON scan_cache(url, plan_tier, max_depth);

-- Depth-Validation: scans.is_superseded markiert Scans, die durch einen
-- tieferen Scan derselben URL "überholt" wurden. Die UI rendert dann den
-- tieferen Scan als "letzten Scan", nicht den jüngeren-aber-flacheren.
-- Schützt vor: Agency-User scant 197 Issues → Starter-Account des selben
-- Users (über JWT-Drift) scant 9 → Dashboard zeigt 9. Mit is_superseded
-- bleibt der 197-Scan die Wahrheit.
ALTER TABLE scans ADD COLUMN IF NOT EXISTS is_superseded BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS scans_url_user_supersede_idx
  ON scans(user_id, url, created_at DESC)
  WHERE is_superseded = FALSE;

-- scheduled_reports: persistente Auto-Monthly-Reports.
-- Ersetzt den Mock-Toggle in /dashboard/reports. Cron-Job (separater Worker)
-- liest is_active=TRUE Zeilen und versendet am 1. jeden Monats.
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES saved_websites(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  interval TEXT NOT NULL DEFAULT 'monthly',
  branding_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Eine Konfiguration pro (user, website) — Upsert auf POST. NULL website_id
-- = Account-weiter Default-Report (alle Sites gebündelt). Partial-Index,
-- weil UNIQUE-Constraints NULL-Werte als unique behandeln (jede NULL ist
-- eine eigene Zeile) — wir wollen aber: eine NULL-website-Zeile pro user.
CREATE UNIQUE INDEX IF NOT EXISTS scheduled_reports_user_website_idx
  ON scheduled_reports(user_id, website_id)
  WHERE website_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS scheduled_reports_user_default_idx
  ON scheduled_reports(user_id)
  WHERE website_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3 / Sprint 12 — WP-EXZELLENZ + LIVE-MONITOR + CMS-CONTEXT
-- ─────────────────────────────────────────────────────────────────────────────

-- CMS-Context: lib/fix-guides.ts liest diese Spalte, um kontextspezifische
-- Anleitungen zu rendern (Elementor / Gutenberg / Divi / Astra / Klassisch).
-- Wert wird beim Scan aus tech_fingerprint.builder gesetzt — Single-Source
-- der Site-Architektur.
ALTER TABLE website_checks ADD COLUMN IF NOT EXISTS cms_context TEXT;

-- Plugins-Detected: Snapshot der erkannten WordPress-Plugins/Builder pro
-- Check. Cron vergleicht aufeinanderfolgende Snapshots — neue Einträge
-- triggern einen Plugin-Diff-Alarm in website_alerts.
ALTER TABLE website_checks ADD COLUMN IF NOT EXISTS plugins_detected JSONB;

-- WP-Health-Score: cached Aggregat aus lib/wp-health.computeWpHealthScore.
-- Erlaubt der Kunden-Matrix, den Score ohne Re-Computation zu rendern.
ALTER TABLE website_checks ADD COLUMN IF NOT EXISTS wp_health_score INTEGER;

-- website_alerts: persistente Live-Monitor-Alarme. Cron-Job /api/cron/monitor
-- schreibt hier rein, AgencyDashboard 2.0 rendert die offenen (acknowledged_at IS NULL)
-- als Live-Monitor-Widget.
--
-- alert_type:
--   plugin_added       — neues Plugin/Builder erkannt seit letztem Check
--   plugin_removed     — Plugin verschwunden (Deaktivierung / Plugin-Update bricht Detection)
--   speed_drop         — security_score oder Response-Time signifikant verschlechtert
--   wp_outdated        — WordPress-Version zu alt
--   ssl_expiring       — SSL läuft in <14d ab
--   site_offline       — Seite nicht erreichbar
CREATE TABLE IF NOT EXISTS website_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  website_id UUID REFERENCES saved_websites(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  message TEXT,
  payload JSONB,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Häufigster Query: "alle offenen Alarme dieses Users, neueste zuerst".
-- Partial-Index reduziert Index-Größe drastisch (nur unack rows).
CREATE INDEX IF NOT EXISTS website_alerts_user_unack_idx
  ON website_alerts(user_id, created_at DESC)
  WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS website_alerts_website_idx
  ON website_alerts(website_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3 / Sprint 12 — agency_settings: SMTP + WP-API-Key + Custom-Domain
-- ─────────────────────────────────────────────────────────────────────────────
-- Backend-Säulen für den Agency-Plan: eigene SMTP-Mailbox (damit
-- Monatsreports vom Kunden-Absender kommen), WordPress-API-Key (für die
-- "Heilung im Backend" — WP-Plugin liest die bereinigten SEO-Daten
-- via /api/wp-bridge ab), Custom-Domain (white-label-Hosting des
-- Lead-Widgets).
--
-- Sicherheits-relevante Felder werden ENCRYPTED gespeichert:
--   smtp_pass_encrypted, api_key_wp_encrypted   = AES-256-GCM (lib/crypto)
--
-- Der Lookup-Index für /api/wp-bridge geht via api_key_wp_hash (SHA-256),
-- weil verschlüsselte Werte keine deterministische WHERE-Suche erlauben.
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS smtp_host             TEXT;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS smtp_port             INTEGER;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS smtp_user             TEXT;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS smtp_pass_encrypted   TEXT;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS smtp_from_email       TEXT;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS white_label_logo_url  TEXT;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS custom_domain         TEXT;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS api_key_wp_encrypted  TEXT;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS api_key_wp_hash       TEXT;
ALTER TABLE agency_settings ADD COLUMN IF NOT EXISTS api_key_wp_created_at TIMESTAMPTZ;

-- Hash-Index für constant-time WP-Plugin-Lookup (vergleiche /api/wp-bridge).
-- Der Hash leakt keinen Pre-Image und ist schnell durchsuchbar.
CREATE UNIQUE INDEX IF NOT EXISTS agency_settings_api_key_wp_hash_idx
  ON agency_settings(api_key_wp_hash)
  WHERE api_key_wp_hash IS NOT NULL;

-- Custom-Domain: muss UNIQUE sein (sonst zwei Agencies auf derselben Domain).
-- WHERE-Klausel macht NULL ≠ NULL — Agencies ohne Custom-Domain kollidieren nicht.
CREATE UNIQUE INDEX IF NOT EXISTS agency_settings_custom_domain_idx
  ON agency_settings(LOWER(custom_domain))
  WHERE custom_domain IS NOT NULL AND custom_domain <> '';

-- ─────────────────────────────────────────────────────────────────────────────
-- WP-Rescue-Guides — Pay-per-Guide-Monetarisierung (Phase 1, 03.05.2026)
-- ─────────────────────────────────────────────────────────────────────────────
-- Einzelunternehmer im Starter-Plan haben akute Probleme (Hosting langsam,
-- Google findet sie nicht, WordPress kritischer Fehler). Statt sie per
-- Plan-Upgrade abzukassieren, verkaufen wir 5-15-Min-Anleitungen für
-- 9,90 € pro Guide (One-Time-Payment via Stripe Checkout).
--
-- Datenmodell:
--   1. rescue_guides         — Globale Guide-Library (Admin-pflegbar)
--   2. rescue_guide_triggers — Issue → Guide-Mapping (welcher Guide passt
--                              zu welchem Scan-Befund)
--   3. user_unlocked_guides  — Welche Guides hat ein User schon gekauft

CREATE TABLE IF NOT EXISTS rescue_guides (
  id              TEXT PRIMARY KEY,             -- "hosting-speed", "google-visibility", ...
  title           TEXT NOT NULL,
  problem_label   TEXT NOT NULL,                -- "Dein Hosting ist langsam"
  preview         TEXT,                         -- 1-2 Sätze Teaser für das Modal
  price_cents     INTEGER NOT NULL,             -- 990 = 9,90 €
  stripe_price_id TEXT,                         -- Stripe-Price-ID (one-time)
  estimated_minutes INTEGER,                    -- "5" — fürs "5-Min-Anleitung"-Wording
  content_json    JSONB NOT NULL,               -- Steps + Hoster-Variants + Checkliste
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Issue → Guide-Mapping (1 Issue kann mehrere Guides triggern via priority).
-- match_type:
--   'title_keyword' — issue.title enthält match_value (case-insensitive)
--   'pillar'        — issue gehört zu einer der 3 Säulen (visibility/health/speed)
--   'category'      — issue.category === match_value (z.B. "speed")
CREATE TABLE IF NOT EXISTS rescue_guide_triggers (
  id            SERIAL PRIMARY KEY,
  guide_id      TEXT NOT NULL REFERENCES rescue_guides(id) ON DELETE CASCADE,
  match_type    TEXT NOT NULL DEFAULT 'title_keyword',
  match_value   TEXT NOT NULL,
  priority      INTEGER NOT NULL DEFAULT 100
);

CREATE INDEX IF NOT EXISTS rescue_guide_triggers_guide_idx
  ON rescue_guide_triggers(guide_id);

-- User-Unlocks: persistenter Zugriff nach erfolgreichem Stripe-Payment.
-- UNIQUE (user_id, guide_id) verhindert Doppel-Käufe; checklist_state
-- speichert welche Items der User abgehakt hat (interaktive Checkliste
-- im Guide-Renderer).
CREATE TABLE IF NOT EXISTS user_unlocked_guides (
  id                INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guide_id          TEXT NOT NULL REFERENCES rescue_guides(id),
  stripe_session_id TEXT,
  paid_amount_cents INTEGER NOT NULL,
  hoster            TEXT,                       -- vom User im Modal gewählt: "strato", "ionos", ...
  checklist_state   JSONB DEFAULT '{}'::jsonb,  -- { "step-1": true, "step-2": false }
  unlocked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, guide_id)
);

CREATE INDEX IF NOT EXISTS user_unlocked_guides_user_idx
  ON user_unlocked_guides(user_id);

-- ── Seed: Erster Guide "hosting-speed" ──
-- Content ist Stub — User schreibt den finalen Text in Phase 2.
-- Hoster-Variants (default, strato, ionos, all-inkl, hostinger) sind als
-- Slot vorbereitet; Phase 2 füllt die spezifischen Screenshots/Schritte.
INSERT INTO rescue_guides (id, title, problem_label, preview, price_cents, estimated_minutes, content_json)
VALUES (
  'hosting-speed',
  '5-Minuten-Hosting-Tuning',
  'Dein Hosting bremst dich aus',
  'Dein Server antwortet zu langsam — das kostet dich Besucher und Google-Ranking. Diese Anleitung zeigt dir die 5 typischen Stellschrauben, mit denen du die Antwortzeit halbierst.',
  990,
  5,
  $${
    "intro": "Dein Server antwortet zu langsam — hier die typischen Stellschrauben, mit denen du die Antwortzeit halbierst.",
    "variants": {
      "default": {
        "steps": [
          { "title": "PHP-Version prüfen", "body": "Veraltete PHP-Versionen sind oft 30-50% langsamer. Update auf PHP 8.2+.", "screenshot": null },
          { "title": "GZIP/Brotli aktivieren", "body": "Komprimiert HTML/CSS/JS um 60-80%, reduziert Ladezeit drastisch.", "screenshot": null },
          { "title": "Caching konfigurieren", "body": "WordPress-Plugin wie WP Rocket oder W3 Total Cache aktivieren.", "screenshot": null },
          { "title": "Bilder optimieren", "body": "WebP-Format + lazy-loading reduzieren Bandbreite um Faktor 3-5.", "screenshot": null },
          { "title": "DNS-TTL anpassen", "body": "Niedrige TTL (300s) für schnelle Updates, hohe TTL (3600s+) für Performance.", "screenshot": null }
        ]
      },
      "strato": {
        "steps": [
          { "title": "Strato-Login öffnen", "body": "Logge dich auf https://www.strato.de/apps/CustomerService ein.", "screenshot": null },
          { "title": "PHP-Version-Wechsel", "body": "Hosting → Domain auswählen → PHP-Version → 8.2 wählen → Speichern.", "screenshot": null },
          { "title": "GZIP via .htaccess", "body": "Im File-Manager .htaccess editieren, mod_deflate-Block hinzufügen.", "screenshot": null }
        ]
      },
      "ionos": {
        "steps": [
          { "title": "IONOS-Cloud-Panel", "body": "Login via https://login.ionos.de", "screenshot": null }
        ]
      },
      "all-inkl": {
        "steps": [
          { "title": "All-Inkl-KAS öffnen", "body": "https://kas.all-inkl.com — Login mit Kunden-ID.", "screenshot": null }
        ]
      },
      "hostinger": {
        "steps": [
          { "title": "Hostinger hPanel", "body": "https://hpanel.hostinger.com", "screenshot": null }
        ]
      }
    },
    "checklist": [
      { "id": "php-update",   "text": "PHP-Version auf 8.2 oder höher aktualisiert" },
      { "id": "gzip",         "text": "GZIP/Brotli-Kompression aktiviert" },
      { "id": "cache",        "text": "Caching-Plugin installiert und konfiguriert" },
      { "id": "images",       "text": "Bilder zu WebP konvertiert, lazy-loading aktiv" },
      { "id": "dns-ttl",      "text": "DNS-TTL geprüft und angepasst" }
    ]
  }$$::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Trigger für hosting-speed: bei TTFB- oder Speed-Issues vorschlagen.
INSERT INTO rescue_guide_triggers (guide_id, match_type, match_value, priority) VALUES
  ('hosting-speed', 'title_keyword', 'ttfb',         200),
  ('hosting-speed', 'title_keyword', 'antwortzeit',  180),
  ('hosting-speed', 'title_keyword', 'response time',150),
  ('hosting-speed', 'title_keyword', 'langsam',      120),
  ('hosting-speed', 'category',      'speed',        100)
ON CONFLICT DO NOTHING;
