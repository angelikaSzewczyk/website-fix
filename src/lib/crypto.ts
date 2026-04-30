/**
 * Symmetric AES-256-GCM crypto wrapper.
 *
 * Verwendet für: agency_settings.smtp_pass_encrypted, agency_settings.api_key_wp_encrypted.
 * Diese Werte sind sensibel (SMTP-Passwort, REST-API-Key) und dürfen NIE in
 * Plain-Text in der DB landen — sonst hat ein DB-Leak sofort Mail-Account-
 * Übernahme + WP-Plugin-Übernahme zur Folge.
 *
 * ENV: WF_SECRET_KEY = 64-stelliger Hex-String (= 32 Byte). Generierung einmalig:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Format des Output-Strings:
 *   v1:<iv-hex>:<authtag-hex>:<ciphertext-hex>
 *
 * Versions-Prefix erlaubt späteren Algorithmus-Wechsel ohne Brüche an
 * bestehenden Datensätzen — encrypt() schreibt v1, decrypt() routet anhand
 * des Prefixes. Plain-Text-Strings (kein Prefix) werden defensiv abgelehnt,
 * damit keine versehentlich unverschlüsselten Werte zurückgegeben werden.
 */

import { randomBytes, createCipheriv, createDecipheriv, timingSafeEqual, createHash } from "node:crypto";

const ALGO    = "aes-256-gcm";
const IV_LEN  = 12;       // 96-bit IV ist GCM-Standard
const TAG_LEN = 16;       // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.WF_SECRET_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("[crypto] WF_SECRET_KEY must be a 64-char hex string (32 bytes). Generate via `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"`.");
  }
  return Buffer.from(hex, "hex");
}

/**
 * Verschlüsselt einen Plain-Text-String. Liefert ein selbsterklärendes
 * Format zurück, das alle Crypto-Parameter enthält. Bei leerem Input wird
 * ein leerer String zurückgegeben — vereinfacht "value optional"-Schreibweise
 * im Caller (kein extra null-Check).
 */
export function encrypt(plain: string): string {
  if (!plain) return "";
  const key  = getKey();
  const iv   = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

/**
 * Entschlüsselt einen mit encrypt() erzeugten String. Wirft, wenn der Input
 * nicht das erwartete Format hat ODER der Auth-Tag-Check schlägt fehl
 * (Tampering-Schutz). Caller sollte den Throw fangen — meistens reicht
 * "Wert nicht entschlüsselbar → Feld in UI als 'nicht gesetzt' rendern".
 */
export function decrypt(payload: string): string {
  if (!payload) return "";
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("[crypto] invalid ciphertext format (expected v1:iv:tag:ct)");
  }
  const [, ivHex, tagHex, ctHex] = parts;
  const iv  = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ct  = Buffer.from(ctHex, "hex");
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) {
    throw new Error("[crypto] iv/tag length mismatch");
  }
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/**
 * Versucht decrypt(), gibt null zurück wenn der Input nicht entschlüsselbar
 * ist (statt zu werfen). Für Listen-Render-Pfade nützlich.
 */
export function tryDecrypt(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    return decrypt(payload);
  } catch {
    return null;
  }
}

/**
 * Generiert einen kryptographisch sicheren API-Key (32 Byte, hex-codiert).
 * Format: "wfak_" + 64 hex-chars. Prefix erleichtert das Erkennen im Log
 * + erlaubt einen späteren Self-Identifier-Pfad ("wfsk_" für Server-Keys etc.).
 */
export function generateApiKey(): string {
  return "wfak_" + randomBytes(32).toString("hex");
}

/**
 * Constant-time-Vergleich für Secrets (verhindert Timing-Attacken bei
 * API-Key-Validierung). Beide Strings müssen gleich lang sein, sonst kommt
 * sofort false zurück (also indirekt schon timing-leakable: Längen-Info,
 * aber das ist akzeptabel für 64+ Zeichen-Keys).
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * SHA-256-Hash eines Wertes als hex-String. Wird für Lookup-Indices auf
 * verschlüsselten Spalten genutzt: encrypt() erzeugt unterschiedliche
 * Ciphertexte für denselben Plain-Text (durch random IV), eine WHERE-Suche
 * auf der encrypted-Spalte liefert daher nichts. Stattdessen halten wir
 * api_key_wp_hash als deterministischer SHA-Index — der WP-Plugin-Aufruf
 * sucht via Hash, dann erst entschlüsseln wir den Originalwert (nicht nötig
 * für Validierung — Hash-Match reicht), und der Hash leakt keinen Pre-Image.
 */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
