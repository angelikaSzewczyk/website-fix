<?php
/**
 * WFHC_Quick_Check — Erhebt die 5 Basis-Werte fürs Dashboard-Widget.
 *
 * Strikt Read-Only: alle Werte kommen aus PHP-Built-Ins, WordPress-
 * Helper-Funktionen oder einem einzigen $_SERVER-Request auf die Home-URL.
 * Kein DB-Write, kein FTP, keine externe API.
 */

defined( 'ABSPATH' ) || exit;

class WFHC_Quick_Check {

    /**
     * Hauptmethode: liefert das vollständige Health-Set als Array.
     *
     * @return array {
     *   php:     array{ version: string, ok: bool, hint: string },
     *   ssl:     array{ active: bool, hint: string },
     *   wp:      array{ version: string, latest: string|null, up_to_date: bool, hint: string },
     *   plugins: array{ active: int, updates: int, hint: string },
     *   seo:     array{ title_ok: bool, meta_ok: bool, hint: string, scanned_url: string },
     * }
     */
    public static function get_all() {
        return array(
            'php'     => self::check_php(),
            'ssl'     => self::check_ssl(),
            'wp'      => self::check_wp(),
            'plugins' => self::check_plugins(),
            'seo'     => self::check_seo_quick(),
        );
    }

    /**
     * PHP-Version — empfohlen ≥ 8.1 (WordPress-Empfehlung 2026).
     * Werte unter 7.4 sind End-of-Life und werden als kritisch markiert.
     */
    private static function check_php() {
        $version = PHP_VERSION;

        if ( version_compare( $version, '8.1', '>=' ) ) {
            return array( 'version' => $version, 'ok' => true,  'hint' => 'aktuell' );
        }
        if ( version_compare( $version, '7.4', '>=' ) ) {
            return array( 'version' => $version, 'ok' => false, 'hint' => 'Update auf 8.1+ empfohlen' );
        }
        return array( 'version' => $version, 'ok' => false, 'hint' => 'End-of-Life — Security-Risiko' );
    }

    /**
     * SSL-Status — prüft, ob die aktuelle Site über HTTPS ausgeliefert wird.
     * is_ssl() schaut auf $_SERVER['HTTPS'] und Port 443.
     */
    private static function check_ssl() {
        $active = is_ssl();
        return array(
            'active' => $active,
            'hint'   => $active ? 'HTTPS aktiv' : 'Kein HTTPS — Google-Ranking-Penalty + Browser-Warnung',
        );
    }

    /**
     * WordPress-Version vs neuestes verfügbares Release.
     * get_core_updates() liefert WordPress-eigene Update-Info; wir fragen
     * keine externe API ab.
     */
    private static function check_wp() {
        global $wp_version;
        $latest     = null;
        $up_to_date = true;

        if ( function_exists( 'get_core_updates' ) ) {
            $updates = get_core_updates( array( 'dismissed' => false ) );
            if ( ! empty( $updates[0]->current ) ) {
                $latest     = (string) $updates[0]->current;
                $up_to_date = ( $updates[0]->response === 'latest' );
            }
        }

        $hint = $up_to_date
            ? 'aktuell'
            : ( $latest ? "Update auf {$latest} verfügbar" : 'Update verfügbar' );

        return array(
            'version'    => (string) $wp_version,
            'latest'     => $latest,
            'up_to_date' => $up_to_date,
            'hint'       => $hint,
        );
    }

    /**
     * Aktive Plugins + Anzahl mit ausstehenden Updates.
     * Keine externe API — get_plugin_updates() nutzt den WordPress-Cache,
     * der vom Core regelmäßig refreshed wird.
     */
    private static function check_plugins() {
        if ( ! function_exists( 'get_plugins' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $active_count = count( (array) get_option( 'active_plugins', array() ) );

        $update_count = 0;
        if ( function_exists( 'get_plugin_updates' ) ) {
            $updates = get_plugin_updates();
            $update_count = is_array( $updates ) ? count( $updates ) : 0;
        }

        $hint = $update_count === 0
            ? 'Alle aktuell'
            : sprintf( '%d Update%s verfügbar', $update_count, $update_count === 1 ? '' : 's' );

        return array(
            'active'  => $active_count,
            'updates' => $update_count,
            'hint'    => $hint,
        );
    }

    /**
     * SEO-Quick-Check: liest die Home-URL, prüft <title> und <meta
     * name="description">. Bewusst minimal — der 92-Punkt-Audit lebt
     * auf WebsiteFix.com. Hier nur 2 binäre Trust-Signale.
     *
     * Timeout 4s damit das Dashboard nicht hängt wenn die Site selbst
     * langsam antwortet. Fail → ok=false, hint="prüfen".
     */
    private static function check_seo_quick() {
        $url      = home_url( '/' );
        $title_ok = false;
        $meta_ok  = false;
        $error    = '';

        $response = wp_remote_get( $url, array(
            'timeout'    => 4,
            'redirection' => 3,
            'sslverify'   => false, // lokale Dev-Umgebungen haben oft selbst-signierte Certs
            'user-agent'  => 'WebsiteFix-Health-Check/' . WFHC_VERSION,
        ) );

        if ( is_wp_error( $response ) ) {
            $error = $response->get_error_message();
        } else {
            $code = (int) wp_remote_retrieve_response_code( $response );
            $body = (string) wp_remote_retrieve_body( $response );
            if ( $code >= 400 ) {
                $error = "HTTP {$code}";
            } else {
                // <title>-Tag vorhanden + nicht leer + nicht nur Site-Name?
                if ( preg_match( '/<title>(.*?)<\/title>/is', $body, $m ) ) {
                    $title_text = trim( wp_strip_all_tags( $m[1] ) );
                    $title_ok   = ( strlen( $title_text ) >= 10 && strlen( $title_text ) <= 70 );
                }
                // <meta name="description" content="...">
                if ( preg_match( '/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']{20,})["\']/i', $body, $m2 ) ) {
                    $meta_ok = true;
                }
            }
        }

        if ( $error ) {
            $hint = "Home-URL nicht prüfbar ({$error})";
        } elseif ( $title_ok && $meta_ok ) {
            $hint = 'Title + Meta-Description gesetzt';
        } elseif ( ! $title_ok && ! $meta_ok ) {
            $hint = 'Title-Tag UND Meta-Description fehlen / zu kurz';
        } elseif ( ! $title_ok ) {
            $hint = 'Title-Tag fehlt oder ungeeignet (10–70 Zeichen empfohlen)';
        } else {
            $hint = 'Meta-Description fehlt oder zu kurz';
        }

        return array(
            'title_ok'    => $title_ok,
            'meta_ok'     => $meta_ok,
            'hint'        => $hint,
            'scanned_url' => $url,
        );
    }
}
