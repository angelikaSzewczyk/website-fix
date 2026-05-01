/**
 * WebsiteFix — Security Audit Test Suite
 *
 * Drei Härtungs-Tests gegen die Sprint-12-Backend-Säulen:
 *
 *   1. Encryption Audit  — encrypt() mit Key A, decrypt() mit Key B muss werfen.
 *                          Beweis, dass AES-256-GCM ohne korrekten WF_SECRET_KEY
 *                          NICHT entschlüsselbar ist.
 *
 *   2. Rate-Limit Test   — 100 Requests in <1s gegen /api/wp-bridge müssen
 *                          spätestens nach 30 erfolgreichen Vorabprüfungen mit
 *                          429 abriegeln (in-memory Bucket, 30/min).
 *
 *   3. Schema-Validierung — INSERT eines großen JSONB-Payloads (~1.5 MB) in
 *                           website_alerts, Read-Back, dann DELETE. Beweis,
 *                           dass die Neon-Verbindung beim Auto-Heal-POST nicht
 *                           abreißt.
 *
 * Usage:
 *   npx tsx scripts/audit-security.ts                  # Test 1 + Test 3 (offline)
 *   npx tsx scripts/audit-security.ts --live           # zusätzlich Test 2 gegen :3000
 *   BASE=https://staging.website-fix.com npx tsx scripts/audit-security.ts --live
 *
 * ENV:
 *   DATABASE_URL    Pflicht für Test 3
 *   WF_SECRET_KEY   wird für Test 1 NICHT benötigt (wir generieren zwei eigene)
 *   BASE            Default http://localhost:3000 (für Test 2)
 */

import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

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

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — ENCRYPTION AUDIT
// ─────────────────────────────────────────────────────────────────────────────
//
// Dupliziert das Format aus src/lib/crypto.ts (v1:iv:tag:ct, AES-256-GCM)
// damit wir es bewusst MIT FALSCHEM SCHLÜSSEL entschlüsseln können — das
// Original-Modul liest den Key aus process.env und kann nicht mit zwei Keys
// gleichzeitig arbeiten. Wir bauen die identische Crypto-Logik nach und
// beweisen: GCM-Auth-Tag-Check fängt jeden Wrong-Key-Versuch ab.
// ─────────────────────────────────────────────────────────────────────────────
const ALGO    = "aes-256-gcm";
const IV_LEN  = 12;
const TAG_LEN = 16;

function rawEncrypt(plain: string, keyHex: string): string {
  const key = Buffer.from(keyHex, "hex");
  const iv  = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct  = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

function rawDecrypt(payload: string, keyHex: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") throw new Error("invalid format");
  const [, ivHex, tagHex, ctHex] = parts;
  const iv  = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ct  = Buffer.from(ctHex, "hex");
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) throw new Error("iv/tag length mismatch");
  const key = Buffer.from(keyHex, "hex");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

async function testEncryption() {
  head("TEST 1 — Encryption Audit (AES-256-GCM, Wrong-Key-Attack)");

  const plain    = "smtp-master-pwd-7Hk!2qX$8z";
  const correct  = randomBytes(32).toString("hex");
  const wrong1   = randomBytes(32).toString("hex");
  const wrong2   = correct.replace(/.$/, c => (c === "0" ? "1" : "0")); // 1 char flip

  console.log(D(`  Plain:        "${plain}"`));
  console.log(D(`  Correct key:  ${correct.slice(0, 16)}…${correct.slice(-8)}`));
  console.log(D(`  Wrong key #1: ${wrong1.slice(0, 16)}…${wrong1.slice(-8)}  (random)`));
  console.log(D(`  Wrong key #2: ${wrong2.slice(0, 16)}…${wrong2.slice(-8)}  (1 hex-char flip)`));

  // ── 1a: Round-Trip mit korrektem Key muss funktionieren ──
  const blob = rawEncrypt(plain, correct);
  console.log(D(`  Ciphertext:   ${blob.slice(0, 60)}… (${blob.length} chars)`));
  let recovered: string | null = null;
  try {
    recovered = rawDecrypt(blob, correct);
  } catch (e) {
    fail(`Round-trip mit korrektem Key warf Error: ${(e as Error).message}`);
  }
  if (recovered === plain)
    ok("Round-trip mit korrektem Key liefert identischen Klartext");
  else if (recovered !== null)
    fail(`Round-trip lieferte falschen Klartext: "${recovered}"`);

  // ── 1b: Falscher Random-Key MUSS werfen ──
  let threw1 = false;
  let recovered1: string | null = null;
  try {
    recovered1 = rawDecrypt(blob, wrong1);
  } catch (e) {
    threw1 = true;
    console.log(D(`  Wrong key #1 → Error: "${(e as Error).message}"`));
  }
  if (threw1)
    ok("Random-Wrong-Key wirft Auth-Tag-Error (GCM-Tampering-Schutz aktiv)");
  else
    fail(`Wrong-Key-Decrypt lief OHNE Error durch — Klartext: "${recovered1}" — KRITISCHER FEHLER`);

  // ── 1c: 1-Char-Flip-Key (worst case, "fast richtig") MUSS werfen ──
  let threw2 = false;
  let recovered2: string | null = null;
  try {
    recovered2 = rawDecrypt(blob, wrong2);
  } catch (e) {
    threw2 = true;
    console.log(D(`  Wrong key #2 → Error: "${(e as Error).message}"`));
  }
  if (threw2)
    ok("1-Hex-Char-Flip-Key wirft Error (kein Bit-Drift möglich)");
  else
    fail(`1-Char-Flip lief durch — Klartext: "${recovered2}" — KRITISCHER FEHLER`);

  // ── 1d: Manipulierter Ciphertext (Tampering-Test) MUSS werfen ──
  // Flip 1 Bit im Ciphertext-Teil → Auth-Tag muss anschlagen.
  const tampered = blob.replace(/.$/, c => (c === "0" ? "1" : "0"));
  let threw3 = false;
  try {
    rawDecrypt(tampered, correct);
  } catch (e) {
    threw3 = true;
    console.log(D(`  Tampered CT  → Error: "${(e as Error).message}"`));
  }
  if (threw3)
    ok("Manipulierter Ciphertext wirft Error (Auth-Tag-Integrität)");
  else
    fail("Manipulation am Ciphertext NICHT erkannt — KRITISCHER FEHLER");

  // ── 1e: Ohne ENV WF_SECRET_KEY darf das Original-Modul gar nicht erst encrypten ──
  const savedEnv = process.env.WF_SECRET_KEY;
  delete process.env.WF_SECRET_KEY;
  try {
    const cryptoMod = await import("../src/lib/crypto");
    let envThrew = false;
    try { cryptoMod.encrypt("test"); } catch { envThrew = true; }
    if (envThrew) ok("crypto.encrypt() wirft, wenn WF_SECRET_KEY fehlt (Fail-Closed)");
    else          fail("crypto.encrypt() läuft ohne ENV durch — Fail-Open ist UNERLAUBT");
  } catch (e) {
    warn(`Konnte src/lib/crypto.ts nicht laden: ${(e as Error).message} — Fail-Closed-Check übersprungen`);
  } finally {
    if (savedEnv !== undefined) process.env.WF_SECRET_KEY = savedEnv;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2a — RATE-LIMIT OFFLINE-SIMULATION (Bucket-Logik in-process)
// ─────────────────────────────────────────────────────────────────────────────
//
// Re-Implementation des Rate-Limiters aus src/app/api/wp-bridge/route.ts —
// IDENTISCHER Algorithmus, IDENTISCHE Konstanten. Erlaubt deterministischen
// Beweis ohne Dev-Server.
function testRateLimitOffline() {
  head("TEST 2a — Rate-Limit Offline-Simulation (Bucket-Logik)");

  const RATE_WINDOW_MS = 60_000;
  const RATE_MAX       = 30;
  const buckets = new Map<string, { count: number; resetAt: number }>();
  const checkRate = (key: string): boolean => {
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || now > b.resetAt) { buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS }); return true; }
    if (b.count >= RATE_MAX) return false;
    b.count += 1;
    return true;
  };

  const fakeKey = "wfak_" + randomBytes(32).toString("hex");
  const BURST = 100;

  let allowed = 0, blocked = 0;
  for (let i = 0; i < BURST; i++) {
    if (checkRate(fakeKey)) allowed++; else blocked++;
  }
  console.log(`  ${BURST} aufeinanderfolgende checkRate(${fakeKey.slice(0, 12)}…) Aufrufe:`);
  console.log(`    allowed: ${allowed}  blocked: ${blocked}`);

  if (allowed === RATE_MAX && blocked === BURST - RATE_MAX)
    ok(`Bucket riegelte exakt nach ${RATE_MAX} Requests ab — Throttle korrekt`);
  else
    fail(`Bucket-Verhalten falsch — erwartet allowed=${RATE_MAX}/blocked=${BURST - RATE_MAX}, war ${allowed}/${blocked}`);

  // ── Per-Key-Isolation ──
  const otherKey = "wfak_" + randomBytes(32).toString("hex");
  const otherAllowed = checkRate(otherKey);
  if (otherAllowed) ok("Anderer Key kommt durch (Bucket ist per-Key, kein globaler Pool)");
  else              fail("Anderer Key auch geblockt — Bucket-Isolation defekt");

  // ── Reset-Window-Test (simuliert Zeit-Vorrücken) ──
  // Wir manipulieren den Bucket-Eintrag direkt, um den 60-s-Reset zu beweisen
  // ohne 60 s zu warten.
  const b = buckets.get(fakeKey)!;
  b.resetAt = Date.now() - 1; // "Window ist abgelaufen"
  if (checkRate(fakeKey)) ok("Nach Window-Reset wird Bucket frisch initialisiert (1/min beginnt neu)");
  else                    fail("Bucket öffnet sich NICHT nach Window-Reset — DOS-Risiko");
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2b — RATE-LIMIT LIVE (gegen laufenden Dev-Server)
// ─────────────────────────────────────────────────────────────────────────────
async function testRateLimit() {
  head("TEST 2b — Rate-Limit Live (Burst 100 req → 30/min Cap)");

  // Format-valider Key — wird die isReadableSlug-Hürde passieren und
  // genau so im rateBuckets-Map landen, wie ein echter Plugin-Call.
  // Der Key ist FREI ERFUNDEN (existiert nicht in DB) → wir testen die
  // Rate-Lane vor dem DB-Lookup (genau das soll auch passieren).
  const fakeKey = "wfak_" + randomBytes(32).toString("hex");
  console.log(D(`  Test-Key: ${fakeKey.slice(0, 12)}…${fakeKey.slice(-6)}`));

  const url = `${BASE}/api/wp-bridge`;
  const BURST = 100;

  console.log(`  Sende ${BURST} parallele GETs an ${url} …`);

  const t0 = Date.now();
  const responses = await Promise.allSettled(
    Array.from({ length: BURST }, () =>
      fetch(url, {
        method: "GET",
        headers: { "X-WF-API-Key": fakeKey },
      }).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) }))
    )
  );
  const elapsed = Date.now() - t0;

  const out = responses
    .filter(r => r.status === "fulfilled")
    .map(r => (r as PromiseFulfilledResult<{ status: number; body: { error?: string } }>).value);

  const status401  = out.filter(r => r.status === 401).length;  // erfolgreicher Pre-Check, Key ungültig
  const status429  = out.filter(r => r.status === 429).length;  // Rate-Limit getroffen
  const status500  = out.filter(r => r.status === 500).length;  // sollte 0 sein
  const statusOther = out.filter(r => ![401, 429, 500].includes(r.status));

  console.log(`  Resolved: ${out.length}/${BURST} in ${elapsed}ms`);
  console.log(`    401 (key invalid, rate-allowed): ${status401}`);
  console.log(`    429 (rate-limited):              ${status429}`);
  console.log(`    500 (server error):              ${status500}`);
  if (statusOther.length > 0)
    console.log(D(`    Other statuses: ${statusOther.map(r => r.status).join(", ")}`));

  // Erwartung: Maximal 30 Requests bekommen 401 (rate-pass), Rest 429.
  if (status401 <= 30 && status429 >= BURST - 30 - statusOther.length - status500)
    ok(`Rate-Limiter griff korrekt: ≤30 passiert (${status401}), ${status429} blockiert`);
  else if (status401 > 30)
    fail(`Rate-Limiter LÄSST ${status401} Requests durch — erwartet ≤30. Throttle defekt.`);
  else
    warn(`Verteilung ungewöhnlich: 401=${status401} 429=${status429} other=${statusOther.length}`);

  if (status500 === 0)
    ok("Keine 5xx-Errors unter Burst — Endpoint ist stabil");
  else
    fail(`${status500} Server-Errors unter Burst — wp-bridge crashed`);

  const sample429 = out.find(r => r.status === 429);
  if (sample429?.body?.error && /Rate-Limit/i.test(sample429.body.error))
    ok(`429-Body trägt korrekte Fehlermeldung: "${sample429.body.error}"`);
  else if (status429 > 0)
    warn("429 zurückgegeben, aber Body-Format unerwartet");

  // ── 2b: Bucket-Recovery nach Reset-Window prüfen — minimaler Sanity-Check ──
  // Wir warten NICHT 60 s. Stattdessen zeigen wir nur, dass weitere Requests
  // mit anderem Key sofort wieder durchgehen (Per-Key-Bucket).
  console.log(`  Per-Key-Isolation: Request mit zweitem Key …`);
  const otherKey = "wfak_" + randomBytes(32).toString("hex");
  const r2 = await fetch(url, { method: "GET", headers: { "X-WF-API-Key": otherKey } });
  if (r2.status === 401)
    ok("Anderer Key kommt durch (Bucket ist per-Key, nicht global)");
  else if (r2.status === 429)
    fail("Anderer Key auch geblockt — Rate-Limiter ist GLOBAL statt per-Key");
  else
    warn(`Zweiter Key gab unerwarteten Status ${r2.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — SCHEMA-VALIDIERUNG (website_alerts mit großem JSON-Payload)
// ─────────────────────────────────────────────────────────────────────────────
async function testSchema() {
  head("TEST 3 — Schema-Validierung (website_alerts + großes JSONB)");

  if (!process.env.DATABASE_URL) {
    warn("DATABASE_URL nicht gesetzt — Test 3 übersprungen.");
    return;
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);

  // ── 3a: Tabellenstruktur prüfen ──
  type ColRow = { column_name: string; data_type: string; is_nullable: string };
  let cols: ColRow[] = [];
  try {
    cols = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'website_alerts'
      ORDER BY ordinal_position
    ` as ColRow[];
  } catch (e) {
    fail(`Schema-Lookup fehlgeschlagen: ${(e as Error).message}`);
    return;
  }

  if (cols.length === 0) {
    fail("Tabelle website_alerts existiert NICHT — Migration nicht ausgerollt");
    return;
  }

  const expected: Record<string, string> = {
    id:              "integer",
    user_id:         "integer",
    website_id:      "uuid",
    alert_type:      "text",
    severity:        "text",
    title:           "text",
    message:         "text",
    payload:         "jsonb",
    acknowledged_at: "timestamp with time zone",
    created_at:      "timestamp with time zone",
  };

  const haveCols = new Map(cols.map(c => [c.column_name, c.data_type]));
  let schemaOk = true;
  for (const [name, type] of Object.entries(expected)) {
    const got = haveCols.get(name);
    if (!got) { fail(`Spalte fehlt: ${name}`); schemaOk = false; }
    else if (got !== type) { fail(`Spalte ${name}: erwarteter Typ ${type}, gefunden ${got}`); schemaOk = false; }
  }
  if (schemaOk) ok(`Alle ${Object.keys(expected).length} erwarteten Spalten vorhanden mit korrekten Typen`);

  // ── 3b: Indizes prüfen ──
  type IdxRow = { indexname: string };
  const idxs = await sql`
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'website_alerts'
  ` as IdxRow[];
  const idxNames = new Set(idxs.map(i => i.indexname));
  if (idxNames.has("website_alerts_user_unack_idx"))
    ok("Partial-Index user_unack vorhanden (acknowledged_at IS NULL)");
  else
    fail("website_alerts_user_unack_idx fehlt — offene-Alarme-Query wird Fullscan");
  if (idxNames.has("website_alerts_website_idx"))
    ok("Index website_id vorhanden");
  else
    warn("website_alerts_website_idx fehlt — pro-Site-Query langsam");

  // ── 3c: User für Test-Insert finden ──
  const users = await sql`SELECT id FROM users ORDER BY id LIMIT 1` as Array<{ id: number }>;
  if (users.length === 0) {
    warn("Keine User in users-Tabelle — Insert/Read-Back-Test übersprungen");
    return;
  }
  const userId = users[0].id;
  console.log(D(`  Test-User-ID: ${userId}`));

  // ── 3d: Synthetisches Auto-Heal-Payload (1.5 MB JSONB) ──
  // Realistischer Worst-Case: WP-Plugin meldet 5 000 alt-fixes auf einem
  // großen Bilder-Heavy-Shop. Jeder Eintrag ~250 Byte.
  const applied = Array.from({ length: 5_000 }, (_, i) => ({
    kind: "alt",
    page_url: `https://kunde-shop.de/produkte/produkt-${i}`,
    image_url: `https://kunde-shop.de/wp-content/uploads/2026/05/produkt-${i}-hero-1920x1080.jpg`,
    suggestion: `Produktbild ${i} — hochauflösendes Hauptbild`,
    applied_at: new Date().toISOString(),
  }));
  const payload = { applied, count: applied.length };
  const payloadJson = JSON.stringify(payload);
  console.log(D(`  Payload: ${(payloadJson.length / 1024 / 1024).toFixed(2)} MB / ${applied.length} Items`));

  let insertedId: number | null = null;
  try {
    const t0 = Date.now();
    const ins = await sql`
      INSERT INTO website_alerts (user_id, website_id, alert_type, severity, title, message, payload)
      VALUES (
        ${userId}, NULL, 'auto_heal', 'info',
        ${"AUDIT-TEST: " + applied.length + " Korrekturen via Plugin"},
        'Synthetic load test — sicher zu löschen',
        ${payloadJson}::jsonb
      )
      RETURNING id
    ` as Array<{ id: number }>;
    insertedId = ins[0]?.id ?? null;
    const insertMs = Date.now() - t0;

    if (insertedId === null) {
      fail("INSERT lief ohne Fehler durch, aber RETURNING id leer");
      return;
    }
    ok(`INSERT mit 1.5 MB JSONB in ${insertMs}ms erfolgreich (id=${insertedId})`);

    // ── 3e: Read-Back & Integritäts-Check ──
    const t1 = Date.now();
    const back = await sql`
      SELECT alert_type, severity, payload->>'count' AS count_str,
             jsonb_array_length(payload->'applied') AS applied_len,
             pg_column_size(payload) AS bytes
      FROM website_alerts WHERE id = ${insertedId}
    ` as Array<{ alert_type: string; severity: string; count_str: string; applied_len: number; bytes: number }>;
    const readMs = Date.now() - t1;

    const row = back[0];
    if (!row) {
      fail("Read-Back lieferte 0 Zeilen — Insert war nicht durable");
    } else {
      if (row.applied_len === applied.length)
        ok(`Read-Back: applied[] hat erwartete Länge ${row.applied_len} (${readMs}ms)`);
      else
        fail(`Read-Back: applied[] hat ${row.applied_len}, erwartet ${applied.length}`);

      if (Number(row.count_str) === applied.length)
        ok(`Read-Back: payload.count = ${row.count_str} ist korrekt`);
      else
        fail(`Read-Back: payload.count = ${row.count_str}, erwartet ${applied.length}`);

      console.log(D(`  pg_column_size(payload) = ${(row.bytes / 1024).toFixed(0)} KB (TOAST-komprimiert)`));
    }

    // ── 3f: Größerer Burst (5 MB) — Connection-Stabilität ──
    const giant = Array.from({ length: 18_000 }, (_, i) => ({
      kind: "alt", page_url: `https://kunde.de/p${i}`, image_url: `https://kunde.de/img${i}.jpg`,
      suggestion: "x".repeat(200),
    }));
    const giantJson = JSON.stringify({ applied: giant, count: giant.length });
    console.log(D(`  Burst-Payload: ${(giantJson.length / 1024 / 1024).toFixed(2)} MB / ${giant.length} Items`));

    let giantId: number | null = null;
    try {
      const t2 = Date.now();
      const ins2 = await sql`
        INSERT INTO website_alerts (user_id, alert_type, severity, title, payload)
        VALUES (${userId}, 'auto_heal', 'info', 'AUDIT-TEST giant', ${giantJson}::jsonb)
        RETURNING id
      ` as Array<{ id: number }>;
      giantId = ins2[0]?.id ?? null;
      ok(`5 MB-Burst-INSERT in ${Date.now() - t2}ms — Neon-Connection bleibt stabil`);
    } catch (e) {
      fail(`5 MB-Burst-INSERT fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      if (giantId !== null) {
        await sql`DELETE FROM website_alerts WHERE id = ${giantId}`;
      }
    }
  } catch (e) {
    fail(`INSERT fehlgeschlagen: ${(e as Error).message}`);
  } finally {
    // ── Cleanup ── unbedingt aufräumen, sonst bleiben Test-Daten zurück
    if (insertedId !== null) {
      try {
        await sql`DELETE FROM website_alerts WHERE id = ${insertedId}`;
        console.log(D(`  Cleanup: Test-Zeile id=${insertedId} gelöscht`));
      } catch (e) {
        warn(`Cleanup von id=${insertedId} fehlgeschlagen: ${(e as Error).message}`);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log(B("\n╔══════════════════════════════════════════════╗"));
  console.log(B("║   WebsiteFix Security Audit Test Suite       ║"));
  console.log(B("╚══════════════════════════════════════════════╝"));
  console.log(`  Base URL: ${BASE}`);
  console.log(`  Mode:     ${process.argv.includes("--live") ? "live (incl. Test 2)" : "offline (Test 1 + 3)"}\n`);

  await testEncryption();

  testRateLimitOffline();

  if (process.argv.includes("--live")) {
    await testRateLimit();
  } else {
    console.log(Y("\n  Test 2b (Live-Rate-Limit) übersprungen — mit --live + laufendem Dev-Server aktivieren."));
  }

  await testSchema();

  console.log(B("\n══ RESULTS ══"));
  console.log(G(`  Passed:   ${passed}`));
  if (warned > 0) console.log(Y(`  Warnings: ${warned}`));
  if (failed > 0) console.log(R(`  Failed:   ${failed}`));

  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error(R("\nFatal: " + e)); process.exit(1); });
