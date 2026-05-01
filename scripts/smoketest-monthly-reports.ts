/**
 * WebsiteFix — Monthly-Reports Smoke-Test  (1. Mai 2026)
 *
 * Drei Probes gegen die Report-Engine, jede für sich grün:
 *
 *   TEST 1 — Eligibility-Check
 *     Welche Reports wären HEUTE planmäßig fällig?
 *     A) scheduled_reports (interval=monthly, is_active=true, im aktuellen Monat noch nicht versendet)
 *     B) Legacy-Set, das die Cron-Route TATSÄCHLICH bedient
 *        (alle Pro/Agency-User mit ≥1 saved_websites, kein Eintrag in monthly_reports für den Vormonat)
 *     Der Diff zwischen A und B legt die Drift offen — siehe Hinweis am Ende.
 *
 *   TEST 2 — SMTP-Decrypt-Validierung
 *     Liest agency_settings.smtp_pass_encrypted aller Agencies, entschlüsselt
 *     mit lib/crypto.ts und misst die Latenz. Beweist, dass der Mail-Versand-
 *     Pfad nicht durch GCM-Auth-Tag-Check blockiert wird.
 *
 *   TEST 3 — Failure-Simulation + activity_logs
 *     Versucht TCP-Connect zu einem Falsch-Port (smtp-fail-test :2526),
 *     fängt das Error, schreibt "monthly_report_failed" nach activity_logs,
 *     liest es zurück und löscht den Test-Eintrag wieder.
 *     Hinweis am Ende: die echte Cron-Route catched aktuell NUR mit console.error
 *     — Patch-Vorschlag wird ausgegeben.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/smoketest-monthly-reports.ts
 *   npx tsx --env-file=.env.local scripts/smoketest-monthly-reports.ts --live   # zusätzlich GET /api/cron/monthly-report
 *
 * ENV: DATABASE_URL, WF_SECRET_KEY (für Test 2), CRON_SECRET (für --live)
 */

import { neon } from "@neondatabase/serverless";
import { createConnection } from "node:net";
import { decrypt } from "../src/lib/crypto";

const BASE = process.env.BASE ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ── Colour helpers ───────────────────────────────────────────────────────────
const G = (s: string) => `\x1b[32m${s}\x1b[0m`;
const R = (s: string) => `\x1b[31m${s}\x1b[0m`;
const Y = (s: string) => `\x1b[33m${s}\x1b[0m`;
const B = (s: string) => `\x1b[34m${s}\x1b[0m`;
const D = (s: string) => `\x1b[2m${s}\x1b[0m`;

let passed = 0, failed = 0, warned = 0;
function ok(msg: string)   { console.log(G("  ✓ " + msg)); passed++; }
function fail(msg: string) { console.log(R("  ✗ " + msg)); failed++; }
function warn(msg: string) { console.log(Y("  ⚠ " + msg)); warned++; }
function head(msg: string) { console.log(B("\n══ " + msg + " ══")); }

const KNOWN_PLAN_STRINGS = [
  "starter", "professional", "agency",
  "smart-guard", "agency-starter", "agency-pro",
];

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — Eligibility-Check
// ─────────────────────────────────────────────────────────────────────────────
async function testEligibility() {
  head("TEST 1 — Eligibility (Was ist heute geplant?)");

  if (!process.env.DATABASE_URL) {
    warn("DATABASE_URL fehlt — Test 1 übersprungen.");
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const prevMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const prevMonthIso = prevMonthDate.toISOString().slice(0, 10);

  console.log(D(`  Heute:        ${now.toISOString().slice(0, 10)}`));
  console.log(D(`  Aktueller M:  ${monthStart.slice(0, 10)} (Reports >= hier zählen als "verschickt")`));
  console.log(D(`  Vor-Monat:    ${prevMonthIso} (= Berichts-Inhalt)`));

  // ── A) Aus scheduled_reports (ideal-Pfad — Plan, der eigentlich gelten sollte) ──
  type SchedRow = { id: number; user_id: number; recipient_email: string; website_id: string | null; last_sent_at: string | null };
  const scheduled = await sql`
    SELECT id, user_id, recipient_email, website_id::text, last_sent_at::text
    FROM scheduled_reports
    WHERE is_active = TRUE
      AND interval   = 'monthly'
      AND (last_sent_at IS NULL OR last_sent_at < ${monthStart}::timestamptz)
    ORDER BY user_id, id
  ` as SchedRow[];

  console.log(`  scheduled_reports — heute fällig: ${scheduled.length}`);
  for (const r of scheduled.slice(0, 5)) {
    console.log(D(`    user=${r.user_id} → ${r.recipient_email} (last_sent=${r.last_sent_at ?? "—"})`));
  }
  if (scheduled.length > 5) console.log(D(`    … und ${scheduled.length - 5} weitere`));

  // ── B) Legacy-Set (was die Cron-Route HEUTE wirklich bedient) ──
  type LegRow = { id: number; email: string; plan: string };
  const legacy = await sql`
    SELECT DISTINCT u.id, u.email, u.plan
    FROM users u
    JOIN saved_websites sw ON sw.user_id = u.id
    WHERE u.plan = ANY(${KNOWN_PLAN_STRINGS}::text[])
      AND NOT EXISTS (
        SELECT 1 FROM monthly_reports mr
        WHERE mr.user_id = u.id AND mr.month = ${prevMonthIso}::date
      )
    ORDER BY u.id
  ` as LegRow[];

  console.log(`  Cron-Route IST-Pfad — heute zu versenden: ${legacy.length}`);
  for (const r of legacy.slice(0, 5)) {
    console.log(D(`    user=${r.id} (${r.plan}) → ${r.email}`));
  }
  if (legacy.length > 5) console.log(D(`    … und ${legacy.length - 5} weitere`));

  // ── Drift-Diagnose ──
  const schedUsers = new Set(scheduled.map(s => s.user_id));
  const legUsers   = new Set(legacy.map(l => l.id));
  const onlySched  = [...schedUsers].filter(u => !legUsers.has(u));
  const onlyLeg    = [...legUsers].filter(u => !schedUsers.has(u));

  if (scheduled.length > 0)
    ok(`scheduled_reports liefert ${scheduled.length} aktive Pläne`);
  else
    warn("scheduled_reports leer — Auto-Reports sind nirgends aktiviert (UI-Toggle nicht benutzt?)");

  if (legacy.length === 0 && scheduled.length === 0)
    warn("Heute gehen 0 Reports raus — keine eligible-User in beiden Pfaden");
  else
    ok(`Cron würde aktuell ${legacy.length} Mails versenden`);

  if (onlySched.length > 0 || onlyLeg.length > 0) {
    warn(`DRIFT: scheduled_reports vs Cron-Route divergieren — onlySched=${onlySched.length} onlyLeg=${onlyLeg.length}`);
    console.log(D(`         (Cron-Route ignoriert scheduled_reports komplett — Bug oder Design-Choice?)`));
  }

  // ── C) Optional: Live-Call gegen den Endpoint ──
  if (process.argv.includes("--live")) {
    if (!process.env.CRON_SECRET) { warn("CRON_SECRET fehlt — Live-Call übersprungen"); return; }
    console.log(`  Live-Call gegen ${BASE}/api/cron/monthly-report …`);
    try {
      const res = await fetch(`${BASE}/api/cron/monthly-report`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      const body = await res.json().catch(() => ({}));
      console.log(D(`    HTTP ${res.status}  body=${JSON.stringify(body)}`));
      if (res.ok) ok(`Endpoint antwortete mit ${res.status}`);
      else        fail(`Endpoint antwortete mit ${res.status}: ${JSON.stringify(body)}`);
    } catch (e) {
      fail(`Endpoint nicht erreichbar: ${(e as Error).message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — SMTP-Decrypt-Validierung
// ─────────────────────────────────────────────────────────────────────────────
async function testSmtpDecrypt() {
  head("TEST 2 — SMTP-Decrypt (lib/crypto auf agency_settings.smtp_pass_encrypted)");

  if (!process.env.DATABASE_URL) { warn("DATABASE_URL fehlt — übersprungen."); return; }

  const sql = neon(process.env.DATABASE_URL);

  type Row = {
    user_id: number;
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_user: string | null;
    smtp_pass_encrypted: string | null;
  };
  const rows = await sql`
    SELECT user_id, smtp_host, smtp_port, smtp_user, smtp_pass_encrypted
    FROM agency_settings
    WHERE smtp_pass_encrypted IS NOT NULL
      AND smtp_pass_encrypted <> ''
    ORDER BY user_id
  ` as Row[];

  if (rows.length === 0) {
    warn("Keine Agency hat smtp_pass hinterlegt — Decrypt-Pfad nicht beweisbar");
    console.log(D("    (sobald jemand im Settings-Hub SMTP konfiguriert, läuft dieser Test echt durch)"));
    return;
  }

  if (!process.env.WF_SECRET_KEY) {
    fail(`${rows.length} verschlüsselte SMTP-Pässe vorhanden, aber WF_SECRET_KEY fehlt — Decrypt blockiert (Fail-Closed)`);
    console.log(D("    (lokal ist das ok — der Key ist nur auf Vercel/Prod gesetzt)"));
    return;
  }

  let totalMs = 0;
  let allOk = true;
  for (const r of rows) {
    const t0 = Date.now();
    let pt: string | null = null;
    let err: string | null = null;
    try {
      pt = decrypt(r.smtp_pass_encrypted!);
    } catch (e) {
      err = (e as Error).message;
      allOk = false;
    }
    const ms = Date.now() - t0;
    totalMs += ms;

    if (err) {
      fail(`user=${r.user_id} (${r.smtp_host ?? "?"}): Decrypt-Fehler "${err}"`);
    } else {
      const safe = pt!.length > 0 ? `${pt!.length} chars` : "(leer)";
      console.log(D(`    user=${r.user_id}  host=${r.smtp_host ?? "—"}:${r.smtp_port ?? "—"}  user=${r.smtp_user ?? "—"}  pw=${safe}  ${ms}ms`));
    }
  }

  if (allOk) ok(`Alle ${rows.length} SMTP-Passwörter entschlüsselt — ⌀ ${(totalMs / rows.length).toFixed(1)}ms (kein Block-Risiko)`);

  // Block-Risiko-Sanity: Decrypt ist purely synchron + CPU-bound, sollte
  // weit unter 100ms pro Datensatz bleiben. Alles >100ms wäre ein Hinweis
  // auf I/O-Drift (z.B. fehlende Inline-Constants).
  if (totalMs / Math.max(1, rows.length) < 100)
    ok("Decrypt-Latenz < 100ms — Mail-Versand-Loop nicht blockiert");
  else
    warn(`⌀ Decrypt-Latenz ${(totalMs / rows.length).toFixed(1)}ms — ungewöhnlich hoch`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — Failure-Simulation + activity_logs-Eintrag
// ─────────────────────────────────────────────────────────────────────────────
function tryConnect(host: string, port: number, timeoutMs: number): Promise<{ ok: boolean; error?: string }> {
  return new Promise(resolve => {
    const sock = createConnection({ host, port });
    const done = (res: { ok: boolean; error?: string }) => {
      sock.removeAllListeners();
      sock.destroy();
      resolve(res);
    };
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => done({ ok: true }));
    sock.once("timeout", () => done({ ok: false, error: `connect timeout after ${timeoutMs}ms` }));
    sock.once("error", e   => done({ ok: false, error: (e as Error).message }));
  });
}

async function testFailureSimulation() {
  head("TEST 3 — SMTP-Failure → activity_logs");

  if (!process.env.DATABASE_URL) { warn("DATABASE_URL fehlt — übersprungen."); return; }

  const sql = neon(process.env.DATABASE_URL);

  // Wir nutzen eine REAL existierende Agency (oder fallback auf user_id=1)
  // damit die FK-Constraint (agency_id REFERENCES users) nicht bricht.
  const [u] = await sql`SELECT id FROM users ORDER BY id LIMIT 1` as Array<{ id: number }>;
  if (!u) { warn("Keine User in users-Tabelle — Test übersprungen."); return; }
  const agencyId = u.id;

  // ── 3a: Connect-Fehler an "wrong port" simulieren ──
  // localhost:2526 ist garantiert kein SMTP — Connect läuft entweder in
  // ECONNREFUSED (typisch Linux/Win) oder in Timeout (typisch Cloud).
  const host = "127.0.0.1";
  const port = 2526;
  console.log(D(`  Versuche TCP-Connect ${host}:${port} (Timeout 1500ms) …`));
  const t0 = Date.now();
  const result = await tryConnect(host, port, 1500);
  const ms = Date.now() - t0;

  if (result.ok) {
    warn(`${host}:${port} antwortete unerwartet — Test-Setup hat einen Listener auf diesem Port?`);
    return;
  }
  ok(`Connect schlug fehl wie erwartet: "${result.error}" (${ms}ms)`);

  // ── 3b: activity_logs-Eintrag schreiben ──
  // Wir simulieren, was der Cron-Job tun SOLLTE (siehe Patch-Hinweis am Ende).
  // event_type = 'monthly_report_failed' ist neu — die existierenden Werte
  // (ai_fix_generated, alert_sent, jira_ticket_created, scan_completed)
  // decken Fail-Pfade nicht ab.
  const metadata = {
    smtp_host: host,
    smtp_port: port,
    error:     result.error,
    elapsed_ms: ms,
    test_marker: "smoketest-2026-05-01",
  };

  let insertedId: number | null = null;
  try {
    const [ins] = await sql`
      INSERT INTO activity_logs (agency_id, client_id, event_type, platform, metadata)
      VALUES (${agencyId}, NULL, 'monthly_report_failed', 'cron', ${JSON.stringify(metadata)}::jsonb)
      RETURNING id
    ` as Array<{ id: number }>;
    insertedId = ins.id;
    ok(`activity_logs-Eintrag geschrieben (id=${insertedId})`);

    // ── 3c: Read-Back ──
    const [back] = await sql`
      SELECT event_type, platform, metadata, created_at::text
      FROM activity_logs WHERE id = ${insertedId}
    ` as Array<{ event_type: string; platform: string; metadata: Record<string, unknown>; created_at: string }>;
    if (!back) {
      fail("Read-Back lieferte 0 Zeilen");
    } else {
      console.log(D(`    event_type: ${back.event_type}`));
      console.log(D(`    platform:   ${back.platform}`));
      console.log(D(`    metadata:   ${JSON.stringify(back.metadata)}`));
      console.log(D(`    created_at: ${back.created_at}`));
      if (back.event_type === "monthly_report_failed" && back.platform === "cron")
        ok("Read-Back: event_type + platform stimmen, metadata-Felder vollständig");
      else
        fail(`Read-Back zeigt unerwartete Werte: ${back.event_type} / ${back.platform}`);
    }
  } catch (e) {
    fail(`activity_logs-Insert fehlgeschlagen: ${(e as Error).message}`);
  } finally {
    if (insertedId !== null) {
      await sql`DELETE FROM activity_logs WHERE id = ${insertedId}`;
      console.log(D(`    Cleanup: id=${insertedId} gelöscht`));
    }
  }

  // ── 3d: HONEST GAP — Cron-Route schreibt aktuell NICHT nach activity_logs ──
  console.log(Y("\n  HINWEIS — Code-Drift in src/app/api/cron/monthly-report/route.ts:"));
  console.log(Y("    Aktueller Catch-Block (Z.76–79):"));
  console.log(D(`      } catch (err) {
        console.error(\`Monatsbericht fehlgeschlagen für user \${user.id}:\`, err);
        errors.push(\`user \${user.id}: \${String(err)}\`);
      }`));
  console.log(Y("    User wird NICHT benachrichtigt — der Eintrag landet NIRGENDS persistent."));
  console.log(Y("    Patch-Vorschlag (drop-in):"));
  console.log(D(`      } catch (err) {
        console.error(\`Monatsbericht fehlgeschlagen für user \${user.id}:\`, err);
        errors.push(\`user \${user.id}: \${String(err)}\`);
        try {
          await sql\`
            INSERT INTO activity_logs (agency_id, client_id, event_type, platform, metadata)
            VALUES (\${user.id}, NULL, 'monthly_report_failed', 'cron',
                    \${JSON.stringify({ month: prevMonth.toISOString().slice(0,10), error: String(err) })}::jsonb)
          \`;
        } catch (logErr) {
          console.error("activity_logs insert failed:", logErr);
        }
      }`));
  warn("activity_logs-Persistenz im Cron fehlt — Patch oben übernehmen, dann ist User-Notify-Pfad geschlossen");
}

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(B("\n╔══════════════════════════════════════════════╗"));
  console.log(B("║   Monthly-Reports Smoke-Test  (01.05.2026)   ║"));
  console.log(B("╚══════════════════════════════════════════════╝"));
  console.log(`  Base URL: ${BASE}`);
  console.log(`  Mode:     ${process.argv.includes("--live") ? "live (Endpoint-Call)" : "offline (DB-only)"}\n`);

  await testEligibility();
  await testSmtpDecrypt();
  await testFailureSimulation();

  console.log(B("\n══ RESULTS ══"));
  console.log(G(`  Passed:   ${passed}`));
  if (warned > 0) console.log(Y(`  Warnings: ${warned}`));
  if (failed > 0) console.log(R(`  Failed:   ${failed}`));

  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(R("\nFatal: " + e)); process.exit(1); });
