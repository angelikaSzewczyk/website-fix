/**
 * SSL-Cert-Inspection via tls.connect (Phase A3.1).
 *
 * Stellt eine TLS-Verbindung zum Host her, liest das peer-Certificate aus
 * und gibt Ablaufdatum + verbleibende Tage zurück. Wird vom /api/full-scan
 * (und später /api/scan) im SiteContext-Builder einmal pro Scan aufgerufen.
 *
 * Performance:
 *   - Strikte Timeout-Bremse (default 5s) — eine hängende TLS-Verbindung
 *     darf den Scan nicht blockieren.
 *   - Nur EIN tls.connect pro Scan — der Cert ist site-weit, kein per-Page-Probe.
 *
 * Sicherheit:
 *   - rejectUnauthorized=false — wir wollen auch Sites mit Self-Signed-Certs
 *     prüfen können (sie produzieren ein eigenes Issue, kein Crash).
 *   - servername = SNI-Header — sonst kriegen wir bei Multi-Tenant-Hosts
 *     (Cloudflare, AWS) das Default-Cert statt das User-Cert.
 *
 * Output:
 *   - non-https URL          → { isHttps: false, expiresAt: null, … }
 *   - Connection-Failure     → { error: "...", expiresAt: null }
 *   - Cert valid             → { expiresAt, daysLeft, error: null }
 */

import * as tls from "node:tls";

export type SslCheckResult = {
  isHttps:   boolean;
  /** ISO-Datum-String oder null wenn unbekannt. */
  expiresAt: string | null;
  /** Tage bis Ablauf, gerundet abwärts. Negativ wenn schon abgelaufen. */
  daysLeft:  number | null;
  /** Fehlermeldung wenn Probe fehlschlug, sonst null. */
  error:     string | null;
};

export async function checkSslCert(url: string, timeoutMs = 5000): Promise<SslCheckResult> {
  if (!url.startsWith("https://")) {
    return { isHttps: false, expiresAt: null, daysLeft: null, error: null };
  }

  let host: string;
  let port: number;
  try {
    const u = new URL(url);
    host = u.hostname;
    port = u.port ? parseInt(u.port, 10) : 443;
  } catch {
    return { isHttps: true, expiresAt: null, daysLeft: null, error: "invalid-url" };
  }

  return new Promise<SslCheckResult>((resolve) => {
    let resolved = false;
    const finish = (result: SslCheckResult) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    const socket = tls.connect({
      host,
      port,
      servername:           host,    // SNI für Multi-Tenant-Hosts
      rejectUnauthorized:   false,   // Self-Signed-Certs werfen kein Error
      timeout:              timeoutMs,
    });

    const timer = setTimeout(() => {
      socket.destroy();
      finish({ isHttps: true, expiresAt: null, daysLeft: null, error: "timeout" });
    }, timeoutMs);

    socket.once("secureConnect", () => {
      clearTimeout(timer);
      const cert = socket.getPeerCertificate();
      socket.end();

      if (!cert || !cert.valid_to) {
        finish({ isHttps: true, expiresAt: null, daysLeft: null, error: "no-cert" });
        return;
      }

      const expiresAt = new Date(cert.valid_to);
      if (Number.isNaN(expiresAt.getTime())) {
        finish({ isHttps: true, expiresAt: null, daysLeft: null, error: "invalid-expiry" });
        return;
      }

      const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / 86_400_000);
      finish({
        isHttps:   true,
        expiresAt: expiresAt.toISOString(),
        daysLeft,
        error:     null,
      });
    });

    socket.once("error", (err) => {
      clearTimeout(timer);
      finish({ isHttps: true, expiresAt: null, daysLeft: null, error: err.message });
    });

    socket.once("timeout", () => {
      clearTimeout(timer);
      socket.destroy();
      finish({ isHttps: true, expiresAt: null, daysLeft: null, error: "socket-timeout" });
    });
  });
}
