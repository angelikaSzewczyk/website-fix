/**
 * plugin-status.ts — Server-seitiger Helper für die Hybrid-Scan-Logik.
 *
 * Entscheidet ob ein User im "External Mode" (Basis-Scan, kein Plugin)
 * oder im "Deep Scan Mode" (Plugin verbunden, Deep-Data verfügbar) läuft.
 * Wird vom Dashboard-Page-Loader aufgerufen und durch die Variants in
 * IssueDetailDrawer / HybridScanBanner / XrayCompareCard hineingereicht.
 *
 * Der Check ist konservativ: ein altes Heartbeat-Pulsieren reicht nicht,
 * wir wollen einen echten Handshake innerhalb der letzten 7 Tage. Damit
 * vermeiden wir, dass ein längst deaktiviertes Plugin "Deep-Scan aktiv"
 * vortäuscht.
 */
import { neon } from "@neondatabase/serverless";

/** Schema-Best-Effort — Plugin-Versionen können Felder ergänzen / weglassen. */
export type DeepData = {
  php?: {
    version?: string;
    memory_limit?: string;
    max_execution_time?: number;
    upload_max_filesize?: string;
  };
  wp?: {
    version?: string;
    debug?: boolean;
    multisite?: boolean;
  };
  db?: {
    engine?: string;
    version?: string;
    size_mb?: number;
    slow_query_log?: boolean;
    slow_queries_24h?: number;
  };
  server?: {
    os?: string;
    webserver?: string;
  };
  logs?: {
    php_errors_24h?: number;
    last_fatal?: string;
    sample?: string;
  };
  plugins_active?: number;
  /** Anzahl der Parameter, die das Plugin aus dem Inneren prüfen kann.
   *  Für die "Röntgen"-Vergleichsgrafik vs. der externen Crawler-Zahl. */
  parameters_checked?: number;
  captured_at?: string;
};

export type PluginStatus = {
  /** Mindestens eine aktive Installation mit Handshake < 7d alt? */
  pluginActive: boolean;
  /** Anzahl aktiver, kürzlich gesehen Installationen. */
  installations: number;
  /** Letzter Handshake-Zeitstempel über alle Installationen. */
  lastHandshakeAt: string | null;
  /** Deep-Data der zuletzt aktiven Installation (falls vorhanden). */
  deepData: DeepData | null;
};

const FRESH_HANDSHAKE_DAYS = 7;

/** "External Crawler"-Parameter — Anzahl, die der Basis-Scan von außen prüft.
 *  Hardcoded, weil das eine Konstante des Scan-Engines ist (Title, Meta,
 *  H1-H6, Alt, robots.txt, Sitemap, SSL, TTFB, …). 12 deckt sich mit der
 *  ScanModeBanner-Texterung "Geprüfte Parameter von außen: 12". */
export const EXTERNAL_PARAMETER_COUNT = 12;
export const PLUGIN_PARAMETER_COUNT   = 85;

const EMPTY: PluginStatus = {
  pluginActive:    false,
  installations:   0,
  lastHandshakeAt: null,
  deepData:        null,
};

export async function getPluginStatus(userId: string | number | undefined | null): Promise<PluginStatus> {
  if (!userId) return EMPTY;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    // FRESH_HANDSHAKE_DAYS als ms-Cutoff im JS-Layer berechnen — Neon-Serverless
    // unterstützt kein dynamisches INTERVAL-Literal, und ein hardcoded Interval
    // wäre fragil bei späterer Anpassung der Konstante.
    const cutoffMs = Date.now() - FRESH_HANDSHAKE_DAYS * 24 * 60 * 60 * 1000;
    const cutoff   = new Date(cutoffMs).toISOString();
    const rows = await sql`
      SELECT
        last_handshake_at,
        deep_data,
        active
      FROM plugin_installations
      WHERE user_id = ${userId}::integer
        AND active = true
        AND last_handshake_at IS NOT NULL
        AND last_handshake_at > ${cutoff}
      ORDER BY last_handshake_at DESC
      LIMIT 5
    ` as Array<{ last_handshake_at: string | null; deep_data: unknown; active: boolean }>;

    if (rows.length === 0) return EMPTY;

    const top = rows[0];
    const deepData = (top.deep_data && typeof top.deep_data === "object")
      ? top.deep_data as DeepData
      : null;

    return {
      pluginActive:    true,
      installations:   rows.length,
      lastHandshakeAt: top.last_handshake_at,
      deepData,
    };
  } catch {
    return EMPTY;
  }
}
