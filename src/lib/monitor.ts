/**
 * Website Monitor — universelle Health-Checks
 * SSL, Uptime, Security Headers, Platform-Erkennung
 */

export type CheckAlert = {
  level: "critical" | "warning" | "info";
  type: string;
  message: string;
};

export type CheckResult = {
  is_online: boolean;
  response_time_ms: number;
  http_status: number | null;
  ssl_valid: boolean | null;
  ssl_expires_at: string | null;
  ssl_days_left: number | null;
  platform: string | null;
  security_score: number;
  security_headers: Record<string, boolean>;
  alerts: CheckAlert[];
};

const SECURITY_HEADERS = [
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "content-security-policy",
  "referrer-policy",
  "permissions-policy",
];

function detectPlatform(html: string, headers: Headers): string {
  const h = html.toLowerCase();
  const server = headers.get("server")?.toLowerCase() ?? "";
  const powered = headers.get("x-powered-by")?.toLowerCase() ?? "";

  if (h.includes("shopify") || headers.get("x-shopify-stage")) return "Shopify";
  if (h.includes("wp-content") || h.includes("wp-includes")) return "WordPress";
  if (h.includes("woocommerce")) return "WooCommerce";
  if (h.includes("wix.com") || h.includes("wixsite")) return "Wix";
  if (h.includes("squarespace")) return "Squarespace";
  if (h.includes("webflow")) return "Webflow";
  if (h.includes("jimdo")) return "Jimdo";
  if (h.includes("typo3") || h.includes("t3_")) return "TYPO3";
  if (h.includes("joomla")) return "Joomla";
  if (h.includes("drupal")) return "Drupal";
  if (h.includes("__next") || powered.includes("next")) return "Next.js";
  if (h.includes("nuxt")) return "Nuxt.js";
  if (server.includes("apache")) return "Custom (Apache)";
  if (server.includes("nginx")) return "Custom (Nginx)";
  return "Custom";
}

async function checkSSL(hostname: string): Promise<{ valid: boolean; expiresAt: string | null; daysLeft: number | null }> {
  try {
    const res = await fetch(`https://${hostname}`, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    // If fetch succeeds over HTTPS, SSL is valid
    // We approximate expiry via a TLS API (fallback: ssl-checker)
    const sslRes = await fetch(`https://ssl-checker.io/api/v1/check/${hostname}`, {
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    if (sslRes?.ok) {
      const data = await sslRes.json().catch(() => null);
      if (data?.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return { valid: daysLeft > 0, expiresAt: expiresAt.toISOString(), daysLeft };
      }
    }

    return { valid: res.ok || res.status < 500, expiresAt: null, daysLeft: null };
  } catch {
    return { valid: false, expiresAt: null, daysLeft: null };
  }
}

export async function checkWebsite(url: string): Promise<CheckResult> {
  const alerts: CheckAlert[] = [];
  let normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const hostname = new URL(normalizedUrl).hostname;

  // — Uptime + Response Time —
  const start = Date.now();
  let is_online = false;
  let http_status: number | null = null;
  let responseHeaders = new Headers();
  let htmlBody = "";

  try {
    const res = await fetch(normalizedUrl, {
      method: "GET",
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "WebsiteFix-Monitor/1.0" },
    });
    is_online = res.ok || res.status < 500;
    http_status = res.status;
    responseHeaders = res.headers;
    htmlBody = await res.text().catch(() => "");

    if (res.status >= 500) {
      alerts.push({ level: "critical", type: "server_error", message: `Server-Fehler: HTTP ${res.status}` });
    } else if (res.status === 404) {
      alerts.push({ level: "critical", type: "not_found", message: "Startseite gibt 404 zurück" });
    }
  } catch {
    is_online = false;
    alerts.push({ level: "critical", type: "offline", message: "Website nicht erreichbar" });
  }

  const response_time_ms = Date.now() - start;

  if (is_online && response_time_ms > 5000) {
    alerts.push({ level: "warning", type: "slow", message: `Ladezeit sehr hoch: ${(response_time_ms / 1000).toFixed(1)}s` });
  }

  // — SSL —
  const ssl = await checkSSL(hostname);
  if (!ssl.valid) {
    alerts.push({ level: "critical", type: "ssl_invalid", message: "SSL-Zertifikat ungültig oder abgelaufen" });
  } else if (ssl.daysLeft !== null && ssl.daysLeft < 14) {
    alerts.push({ level: "critical", type: "ssl_expiring", message: `SSL läuft in ${ssl.daysLeft} Tagen ab` });
  } else if (ssl.daysLeft !== null && ssl.daysLeft < 30) {
    alerts.push({ level: "warning", type: "ssl_expiring_soon", message: `SSL läuft in ${ssl.daysLeft} Tagen ab` });
  }

  // — Security Headers —
  const securityHeaders: Record<string, boolean> = {};
  let score = 0;

  for (const header of SECURITY_HEADERS) {
    const present = !!responseHeaders.get(header);
    securityHeaders[header] = present;
    if (present) score += Math.floor(100 / SECURITY_HEADERS.length);
  }

  const missingCritical = ["strict-transport-security", "x-content-type-options"].filter(h => !securityHeaders[h]);
  if (missingCritical.length > 0) {
    alerts.push({ level: "warning", type: "security_headers", message: `Sicherheits-Header fehlen: ${missingCritical.join(", ")}` });
  }

  // — Platform —
  const platform = is_online ? detectPlatform(htmlBody, responseHeaders) : null;

  // — WordPress-spezifische Checks —
  if (platform === "WordPress") {
    if (htmlBody.includes("readme.html") || htmlBody.toLowerCase().includes("version 6") || htmlBody.toLowerCase().includes("version 5")) {
      alerts.push({ level: "warning", type: "wp_version_exposed", message: "WordPress-Version öffentlich sichtbar" });
    }
  }

  return {
    is_online,
    response_time_ms,
    http_status,
    ssl_valid: ssl.valid,
    ssl_expires_at: ssl.expiresAt,
    ssl_days_left: ssl.daysLeft,
    platform,
    security_score: score,
    security_headers: securityHeaders,
    alerts,
  };
}
