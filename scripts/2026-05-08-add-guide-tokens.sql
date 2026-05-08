-- ─────────────────────────────────────────────────────────────────────────────
-- 2026-05-08: Pay-per-Fix Token-basierter Zugriff
--
-- Bisher: 9,90 €-Käufer wird via Webhook als User mit password_hash=NULL
-- angelegt → User landet im Starter-Dashboard (29 €/Mo-Optik). Verwirrend,
-- konzeptionell falsch.
--
-- Neu: Käufer bekommt 4-Wochen-Online-Token + dauerhaftes PDF im Postfach.
-- Kein Konto, kein Login, kein Dashboard.
--
-- Diese Migration ist additiv — bestehende user_unlocked_guides bleiben für
-- eingeloggte Pro/Agency-Käufer aktiv.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guide_access_tokens (
  token             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id          TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  hoster            TEXT        NOT NULL DEFAULT 'default',
  stripe_session_id TEXT        NOT NULL,
  paid_amount_cents INTEGER     NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '28 days')
);

CREATE UNIQUE INDEX IF NOT EXISTS guide_access_tokens_stripe_session_uniq
  ON guide_access_tokens (stripe_session_id);

-- Verify:
SELECT
  column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'guide_access_tokens'
ORDER BY ordinal_position;
