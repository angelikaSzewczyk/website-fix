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
