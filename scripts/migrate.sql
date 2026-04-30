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
