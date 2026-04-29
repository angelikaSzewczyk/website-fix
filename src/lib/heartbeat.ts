/**
 * User-Presence-Heartbeat.
 *
 * Phase 7 / Live-Activity:
 *   - Idempotente Schema-Migration: ALTER TABLE … ADD COLUMN IF NOT EXISTS
 *     last_seen_at TIMESTAMPTZ. Pattern aus lib/integrations.ts kopiert
 *     (schemaReady-Flag), damit der ALTER pro Server-Instance nur einmal
 *     gefeuert wird.
 *   - Heartbeat-UPDATE wird vom dashboard/layout.tsx fire-and-forget bei
 *     jedem Dashboard-Request ausgelöst. Throttling passiert in der
 *     WHERE-Clause (nur UPDATE wenn letzte Aktivität > 60 s zurück) →
 *     keine zweite Round-Trip nötig, keine in-memory-Maps die bei
 *     Cold-Starts verloren gehen.
 *
 * KEINE Edge-Runtime — diese Funktionen laufen in Server-Components / Routes.
 * Edge-Middleware kann Neon-HTTP zwar nutzen, aber wir haben schon eine
 * DB-Connection im Layout, also piggyback dort statt eines extra Edge-Hops.
 */

import { neon } from "@neondatabase/serverless";

// Modul-lokales Flag — pro Server-Instanz nur einmal die ALTER-Statements
// schicken. Bei Vercel-Serverless: pro Function-Cold-Start einmal.
let schemaReady = false;

async function ensureLastSeenColumn(): Promise<void> {
  if (schemaReady) return;
  const sql = neon(process.env.DATABASE_URL!);
  // IF NOT EXISTS macht die Migration idempotent — kein Fehler bei wiederholtem
  // Lauf. Funktioniert auch wenn die users-Tabelle noch keine Heartbeat-Spalte
  // hat (Neuanlage) oder bereits eine (Bestand).
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ`;
  schemaReady = true;
}

/**
 * Aktualisiert last_seen_at für den User fire-and-forget.
 * Throttled auf 60 s in der WHERE-Clause: bei aktiver Session-Navigation
 * (mehrere Page-Loads/Min) trifft das UPDATE nur einmal die DB, weitere
 * Calls werden serverseitig zu No-Ops.
 *
 * NIE awaiten — eine hängende DB darf den Dashboard-Render nicht blockieren.
 * Der Caller signalisiert "fire-and-forget" durch das Ignorieren der Promise.
 */
export function touchLastSeen(userId: string | number): void {
  ensureLastSeenColumn()
    .then(() => {
      const sql = neon(process.env.DATABASE_URL!);
      return sql`
        UPDATE users
        SET    last_seen_at = NOW()
        WHERE  id = ${userId}
          AND (last_seen_at IS NULL OR last_seen_at < NOW() - INTERVAL '60 seconds')
      `;
    })
    .catch(err => {
      // Heartbeat-Failure ist non-critical — User sieht es nicht, Logging
      // erlaubt späteres Debugging wenn ein User dauerhaft als "offline" gilt.
      console.error("[heartbeat] touchLastSeen failed:", err);
    });
}
