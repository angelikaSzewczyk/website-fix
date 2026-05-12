<?php
/**
 * WFHC_Quick_Check — die 5 differenzierten Kennzahlen fürs Dashboard-Widget.
 *
 * Strategische Position: das Plugin soll NICHT mit dem WordPress-Core-
 * Site-Health-Tool austauschbar sein. Wir messen genau die Werte, die
 * zeigen, ob Hoster oder eigene Konfiguration die Site bremsen:
 *
 *   1. TTFB (Server-Response)            — Hoster-Engpass-Indikator
 *   2. Heartbeat-Frequenz                — admin-ajax.php-Polling-Last
 *   3. Datenbank-Größe + Bloat-Tabelle   — DB-CPU + Disk-Druck
 *   4. PHP-Memory-Limit + Peak-Auslastung — Hoster-Plan-Drosselung sichtbar
 *   5. Update-Backlog                    — kritisch vs. regulär getrennt
 *
 * Strikt Read-Only: alle Werte aus PHP-Built-Ins, $wpdb-SELECTs auf
 * information_schema, und EINEM wp_remote_get auf home_url() für TTFB.
 * Kein DB-Write, kein FTP, keine externe API (außer optional PSI später).
 */

defined( 'ABSPATH' ) || exit;

class WFHC_Quick_Check {

    /**
     * Hauptmethode: liefert das vollständige Health-Set als Array.
     */
    public static function get_all() {
        return array(
            'ttfb'      => self::check_ttfb(),
            'heartbeat' => self::check_heartbeat(),
            'database'  => self::check_database(),
            'memory'    => self::check_memory(),
            'updates'   => self::check_updates(),
        );
    }

    /**
     * TTFB: Server-Response-Zeit in Millisekunden via wp_remote_get
     * auf home_url(). Misst, wie lange der Hoster braucht, bevor das erste
     * Byte HTML rauskommt. Hauptindikator für Hosting-Engpässe oder
     * Bootstrap-Bremsen (zu viele autoloaded Options, schwere Plugins).
     *
     * Schwellen (basierend auf Web-Vitals + Hosting-Branchenstandards):
     *   < 200 ms   → ausgezeichnet (Premium-Hosting oder leere Site)
     *   200-500 ms → okay (Shared-Hosting-Mittelfeld)
     *   500-800 ms → grenzwertig (Performance-Optimierung sinnvoll)
     *   > 800 ms   → problematisch (Hoster oder Site-Code zu langsam)
     */
    private static function check_ttfb() {
        $url      = home_url( '/' );
        $start    = microtime( true );

        $response = wp_remote_get( $url, array(
            'timeout'     => 6,
            'redirection' => 3,
            'sslverify'   => false, // lokale Dev-Umgebungen haben oft selbst-signierte Certs
            'user-agent'  => 'WebsiteFix-Health-Check/' . WFHC_VERSION,
            'blocking'    => true,
        ) );

        $elapsed_ms = (int) round( ( microtime( true ) - $start ) * 1000 );

        if ( is_wp_error( $response ) ) {
            return array(
                'ms'         => null,
                'ok'         => false,
                'value_text' => 'n/v',
                'hint'       => 'Home-URL nicht erreichbar: ' . $response->get_error_message(),
            );
        }

        $code = (int) wp_remote_retrieve_response_code( $response );
        if ( $code >= 400 ) {
            return array(
                'ms'         => $elapsed_ms,
                'ok'         => false,
                'value_text' => "HTTP {$code}",
                'hint'       => 'Home-URL liefert Fehler — Site-Health prüfen',
            );
        }

        // Klassifizierung
        if ( $elapsed_ms < 200 ) {
            return array(
                'ms'         => $elapsed_ms,
                'ok'         => true,
                'value_text' => "{$elapsed_ms} ms",
                'hint'       => 'Ausgezeichnet — Server antwortet schnell',
            );
        }
        if ( $elapsed_ms < 500 ) {
            return array(
                'ms'         => $elapsed_ms,
                'ok'         => true,
                'value_text' => "{$elapsed_ms} ms",
                'hint'       => 'Im Branchen-Mittelfeld für Shared-Hosting',
            );
        }
        if ( $elapsed_ms < 800 ) {
            return array(
                'ms'         => $elapsed_ms,
                'ok'         => false,
                'value_text' => "{$elapsed_ms} ms",
                'hint'       => 'Grenzwertig — Hoster oder Plugins drosseln',
            );
        }
        return array(
            'ms'         => $elapsed_ms,
            'ok'         => false,
            'value_text' => "{$elapsed_ms} ms",
            'hint'       => 'Hoster oder Site-Code zu langsam — Optimierung dringend',
        );
    }

    /**
     * Heartbeat-Frequenz: liest den effektiven `interval`-Wert für den
     * Admin-Kontext aus, durch Anwendung des Filters `heartbeat_settings`
     * mit dem WordPress-Default als Startwert.
     *
     * Schwellen:
     *   ≥ 60 s  → optimiert (gedrosselt von User/Plugin)
     *   15-59 s → Standard (WordPress-Default = 15 im Editor, 60 sonst)
     *   < 15 s  → aggressiv (CPU-Risiko, Plugin-Konflikt?)
     *
     * Liefert den Wert für den allgemeinen Admin-Kontext (NICHT Post-Editor),
     * weil der Editor-Wert separat von Plugins überschrieben wird und
     * weniger als Hoster-Drossel-Indikator taugt.
     */
    private static function check_heartbeat() {
        // WordPress-Default-Settings für die Admin-Heartbeat-Frequenz
        $defaults = array(
            'minimalInterval' => 60,
            'interval'        => 60,
        );

        // Filter anwenden — wenn ein Plugin oder Snippet die Frequenz
        // anpasst, sehen wir hier den effektiven Wert.
        $settings = apply_filters( 'heartbeat_settings', $defaults );
        $interval = isset( $settings['interval'] ) ? (int) $settings['interval'] : 60;

        // Polls pro Stunde, hochgerechnet
        $polls_per_hour = $interval > 0 ? (int) round( 3600 / $interval ) : 0;

        if ( $interval >= 60 ) {
            return array(
                'interval_s'     => $interval,
                'polls_per_hour' => $polls_per_hour,
                'ok'             => true,
                'value_text'     => "{$interval} s",
                'hint'           => "Optimiert — ~{$polls_per_hour} Polls/h pro eingeloggtem Admin",
            );
        }
        if ( $interval >= 15 ) {
            return array(
                'interval_s'     => $interval,
                'polls_per_hour' => $polls_per_hour,
                'ok'             => false,
                'value_text'     => "{$interval} s",
                'hint'           => "Standard-WordPress — auf 60 s drosseln spart CPU",
            );
        }
        return array(
            'interval_s'     => $interval,
            'polls_per_hour' => $polls_per_hour,
            'ok'             => false,
            'value_text'     => "{$interval} s",
            'hint'           => "Aggressiv — ~{$polls_per_hour} Polls/h treiben die CPU-Last",
        );
    }

    /**
     * Datenbank-Größe + größte Tabelle. Nutzt information_schema, wie der
     * Connector-Plugin. Bei Hostern, die information_schema sperren
     * (Strato Shared, manche All-Inkl-Pläne), fallen wir auf "n/v" zurück.
     *
     * Schwellen für gesunde Site:
     *   < 200 MB   → gesund
     *   200-500 MB → moderat
     *   > 500 MB   → Bloat-Verdacht (autoloaded Options, verwaiste Transients)
     */
    private static function check_database() {
        global $wpdb;
        $size_mb       = null;
        $largest_table = null;
        $largest_mb    = null;

        if ( $wpdb ) {
            try {
                $size_row = $wpdb->get_row( $wpdb->prepare(
                    "SELECT ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 1) AS size_mb
                     FROM information_schema.TABLES WHERE TABLE_SCHEMA = %s",
                    DB_NAME
                ), ARRAY_A );
                if ( $size_row && isset( $size_row['size_mb'] ) ) {
                    $size_mb = (float) $size_row['size_mb'];
                }

                $largest_row = $wpdb->get_row( $wpdb->prepare(
                    "SELECT TABLE_NAME AS name,
                            ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 1) AS size_mb
                     FROM information_schema.TABLES
                     WHERE TABLE_SCHEMA = %s
                     ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC LIMIT 1",
                    DB_NAME
                ), ARRAY_A );
                if ( $largest_row && isset( $largest_row['name'] ) ) {
                    $largest_table = (string) $largest_row['name'];
                    $largest_mb    = (float) $largest_row['size_mb'];
                }
            } catch ( Throwable $e ) {
                // Hoster sperrt information_schema → null zurück
            }
        }

        if ( $size_mb === null ) {
            return array(
                'size_mb'       => null,
                'largest_table' => null,
                'ok'            => true, // unbekannt = nicht negativ markieren
                'value_text'    => 'n/v',
                'hint'          => 'Hoster sperrt information_schema — Größe nicht abrufbar',
            );
        }

        $size_str = $size_mb < 1
            ? '< 1 MB'
            : ( $size_mb < 1024 ? rtrim( rtrim( number_format( $size_mb, 1, ',', '.' ), '0' ), ',' ) . ' MB' : number_format( $size_mb / 1024, 1, ',', '.' ) . ' GB' );

        $largest_hint = $largest_table
            ? sprintf( 'Größte Tabelle: %s (%s MB)', $largest_table, rtrim( rtrim( number_format( (float) $largest_mb, 1, ',', '.' ), '0' ), ',' ) )
            : '';

        if ( $size_mb < 200 ) {
            return array(
                'size_mb'       => $size_mb,
                'largest_table' => $largest_table,
                'largest_mb'    => $largest_mb,
                'ok'            => true,
                'value_text'    => $size_str,
                'hint'          => $largest_hint ?: 'Gesunde Größe',
            );
        }
        if ( $size_mb < 500 ) {
            return array(
                'size_mb'       => $size_mb,
                'largest_table' => $largest_table,
                'largest_mb'    => $largest_mb,
                'ok'            => true,
                'value_text'    => $size_str,
                'hint'          => $largest_hint . ' · moderat',
            );
        }
        return array(
            'size_mb'       => $size_mb,
            'largest_table' => $largest_table,
            'largest_mb'    => $largest_mb,
            'ok'            => false,
            'value_text'    => $size_str,
            'hint'          => $largest_hint . ' · Bloat-Verdacht',
        );
    }

    /**
     * PHP-Memory: Limit aus ini_get + Peak-Auslastung. Schlüssel-Indikator
     * für „Hoster hat dir zu wenig Memory zugewiesen" oder „deine Plugins
     * fressen mehr als der Plan hergibt".
     *
     * Schwellen für Peak-Auslastung:
     *   < 60 %   → entspannt
     *   60-85 %  → eng (bei Last-Spitzen drohen 500er)
     *   > 85 %   → kritisch (Allowed memory size exhausted ist nah)
     */
    private static function check_memory() {
        $limit_str = (string) ini_get( 'memory_limit' );
        $limit_b   = self::parse_size( $limit_str );
        $peak_b    = function_exists( 'memory_get_peak_usage' ) ? (int) memory_get_peak_usage( true ) : 0;
        $current_b = function_exists( 'memory_get_usage' )      ? (int) memory_get_usage( true )      : 0;

        $peak_mb  = $peak_b  > 0 ? round( $peak_b  / 1024 / 1024, 1 ) : 0;
        $limit_mb = $limit_b > 0 ? round( $limit_b / 1024 / 1024, 1 ) : 0;

        // -1 = unlimited (kommt selten vor, vor allem auf Dev-Systemen)
        if ( $limit_b <= 0 ) {
            return array(
                'limit_mb'   => null,
                'peak_mb'    => $peak_mb,
                'usage_pct'  => null,
                'ok'         => true,
                'value_text' => 'unbegrenzt',
                'hint'       => sprintf( 'Peak: %s MB · kein Memory-Limit gesetzt', number_format( $peak_mb, 1, ',', '.' ) ),
            );
        }

        $usage_pct = $limit_b > 0 ? (int) round( ( $peak_b / $limit_b ) * 100 ) : 0;

        $value_text = sprintf(
            '%s · Peak %s MB',
            $limit_str,
            number_format( $peak_mb, 1, ',', '.' )
        );

        if ( $usage_pct < 60 ) {
            return array(
                'limit_mb'   => $limit_mb,
                'peak_mb'    => $peak_mb,
                'usage_pct'  => $usage_pct,
                'ok'         => true,
                'value_text' => $value_text,
                'hint'       => "Auslastung {$usage_pct} % — entspannt",
            );
        }
        if ( $usage_pct < 85 ) {
            return array(
                'limit_mb'   => $limit_mb,
                'peak_mb'    => $peak_mb,
                'usage_pct'  => $usage_pct,
                'ok'         => false,
                'value_text' => $value_text,
                'hint'       => "Auslastung {$usage_pct} % — eng bei Last-Spitzen",
            );
        }
        return array(
            'limit_mb'   => $limit_mb,
            'peak_mb'    => $peak_mb,
            'usage_pct'  => $usage_pct,
            'ok'         => false,
            'value_text' => $value_text,
            'hint'       => "Auslastung {$usage_pct} % — Memory-Exhausted-Fehler droht",
        );
    }

    /**
     * Update-Backlog: getrennt nach „kritisch" (Security/Auto-Update-Flag)
     * und „regulär" (normale Updates).
     *
     * „Kritisch" hier konservativ definiert: Core-Update wegen Security-
     * Release ODER ≥ 5 ausstehende Plugin-Updates (Indiz für vernachlässigte
     * Wartung, das ist real ein Risiko).
     */
    private static function check_updates() {
        if ( ! function_exists( 'get_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Core-Updates
        $core_updates = function_exists( 'get_core_updates' ) ? get_core_updates( array( 'dismissed' => false ) ) : array();
        $core_pending = is_array( $core_updates ) && ! empty( $core_updates[0] ) && ( $core_updates[0]->response !== 'latest' );

        // Plugin-Updates
        $plugin_updates = function_exists( 'get_plugin_updates' ) ? get_plugin_updates() : array();
        $plugin_count   = is_array( $plugin_updates ) ? count( $plugin_updates ) : 0;

        // Theme-Updates
        $theme_updates = function_exists( 'get_theme_updates' ) ? get_theme_updates() : array();
        $theme_count   = is_array( $theme_updates ) ? count( $theme_updates ) : 0;

        $total    = (int) $core_pending + $plugin_count + $theme_count;
        $critical = $core_pending ? 1 : 0;
        if ( $plugin_count >= 5 ) {
            // 5+ ausstehende Plugin-Updates = vernachlässigte Wartung,
            // als kritisch markieren (Security-Surface vergrößert sich)
            $critical += $plugin_count;
        }

        if ( $total === 0 ) {
            return array(
                'total'       => 0,
                'critical'    => 0,
                'core'        => false,
                'plugins'     => 0,
                'themes'      => 0,
                'ok'          => true,
                'value_text'  => 'alles aktuell',
                'hint'        => 'Core, Plugins und Themes sind auf dem neuesten Stand',
            );
        }

        $parts = array();
        if ( $core_pending )       $parts[] = 'Core';
        if ( $plugin_count > 0 )   $parts[] = sprintf( '%d Plugin%s', $plugin_count, $plugin_count === 1 ? '' : 's' );
        if ( $theme_count > 0 )    $parts[] = sprintf( '%d Theme%s',  $theme_count,  $theme_count  === 1 ? '' : 's' );

        $value_text = sprintf( '%d offen', $total );
        $hint       = implode( ' · ', $parts );

        if ( $critical > 0 ) {
            return array(
                'total'      => $total,
                'critical'   => $critical,
                'core'       => $core_pending,
                'plugins'    => $plugin_count,
                'themes'     => $theme_count,
                'ok'         => false,
                'value_text' => $value_text,
                'hint'       => $hint . ' · kritisch',
            );
        }

        return array(
            'total'      => $total,
            'critical'   => 0,
            'core'       => $core_pending,
            'plugins'    => $plugin_count,
            'themes'     => $theme_count,
            'ok'         => false, // Update offen = "Achtung", nicht "OK"
            'value_text' => $value_text,
            'hint'       => $hint,
        );
    }

    /**
     * Helper: parsed ini_get('memory_limit')-Werte wie "128M", "1G", "256K"
     * in Bytes. Standard-PHP-Konvention.
     */
    private static function parse_size( string $size ): int {
        $size = trim( $size );
        if ( $size === '' || $size === '-1' ) return 0;

        $unit = strtolower( substr( $size, -1 ) );
        $num  = (float) $size;

        switch ( $unit ) {
            case 'g': return (int) ( $num * 1024 * 1024 * 1024 );
            case 'm': return (int) ( $num * 1024 * 1024 );
            case 'k': return (int) ( $num * 1024 );
            default:  return (int) $num;
        }
    }
}
