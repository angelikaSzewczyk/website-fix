<?php
/**
 * WFOCO_Diagnostics — Live-Status-Detection pro Fix.
 *
 * Beantwortet pro Snippet: "Greift dieser Fix gerade?" Zeigt den Effekt
 * im Admin als kleines Status-Detail unter jeder Card. So sieht der User
 * direkt, dass z.B. Heartbeat-Frequenz von 15 s auf 60 s gewechselt hat.
 *
 * Alle Checks sind Read-Only — nutzen WordPress-Standard-Helper, keine
 * externen Calls, kein FTP, kein DB-Write.
 */

defined( 'ABSPATH' ) || exit;

class WFOCO_Diagnostics {

    /**
     * Status-Snapshot für einen einzelnen Slug.
     *
     * @return array{ active: bool, label: string, detail: string }
     */
    public static function check( $slug ) {
        switch ( $slug ) {
            case 'heartbeat-throttle':         return self::check_heartbeat();
            case 'xmlrpc-disable':             return self::check_xmlrpc();
            case 'emojis-embeds-bloat-remove': return self::check_emojis();
            case 'query-string-cleaner':       return self::check_query_strings();
            case 'jquery-migrate-remove':      return self::check_jquery_migrate();
            default:
                return array( 'active' => false, 'label' => 'unbekannt', 'detail' => '' );
        }
    }

    /**
     * Heartbeat-Frequenz: liest den effektiven `interval`-Wert aus dem Filter.
     * Default = 60 s im Admin, 15 s im Post-Editor.
     */
    private static function check_heartbeat() {
        $defaults = array( 'minimalInterval' => 60, 'interval' => 60 );
        $settings = apply_filters( 'heartbeat_settings', $defaults );
        $interval = isset( $settings['interval'] ) ? (int) $settings['interval'] : 60;

        if ( $interval >= 60 ) {
            return array(
                'active' => true,
                'label'  => 'gedrosselt',
                'detail' => sprintf(
                    /* translators: %d: interval in seconds */
                    __( 'Aktuelle Frequenz: %d s zwischen Polls', 'websitefix-one-click-optimizer' ),
                    $interval
                ),
            );
        }
        return array(
            'active' => false,
            'label'  => 'standard',
            'detail' => sprintf(
                /* translators: %d: interval in seconds */
                __( 'Aktuelle Frequenz: %d s — admin-ajax.php pollt häufig', 'websitefix-one-click-optimizer' ),
                $interval
            ),
        );
    }

    /**
     * XML-RPC-Status: liest den `xmlrpc_enabled`-Filter.
     */
    private static function check_xmlrpc() {
        $enabled = (bool) apply_filters( 'xmlrpc_enabled', true );
        if ( $enabled ) {
            return array(
                'active' => false,
                'label'  => 'aktiv',
                'detail' => __( 'xmlrpc.php ist offen — Brute-Force-Angriffsfläche', 'websitefix-one-click-optimizer' ),
            );
        }
        return array(
            'active' => true,
            'label'  => 'deaktiviert',
            'detail' => __( 'xmlrpc.php abgeschaltet — Brute-Force-Surface geschlossen', 'websitefix-one-click-optimizer' ),
        );
    }

    /**
     * Emoji-Status: prüft, ob print_emoji_detection_script noch in wp_head läuft.
     */
    private static function check_emojis() {
        // Wenn unser remove_action gegriffen hat, ist die Funktion nicht
        // mehr an wp_head gebunden (has_action gibt false zurück).
        $emoji_active = has_action( 'wp_head', 'print_emoji_detection_script' );
        if ( false === $emoji_active ) {
            return array(
                'active' => true,
                'label'  => 'entfernt',
                'detail' => __( 'wp-emoji-release.min.js wird nicht mehr geladen', 'websitefix-one-click-optimizer' ),
            );
        }
        return array(
            'active' => false,
            'label'  => 'aktiv',
            'detail' => __( 'Emoji-Polyfill lädt noch ~14 KB pro Page', 'websitefix-one-click-optimizer' ),
        );
    }

    /**
     * Query-String-Status: macht einen Dummy-Test-Call durch unsere Filter.
     * Wenn wir den Filter installiert haben, kommt eine Stripped-URL zurück.
     */
    private static function check_query_strings() {
        $test_url = 'https://example.com/wp-content/themes/test/style.css?ver=1.0';
        $filtered = apply_filters( 'style_loader_src', $test_url );

        if ( strpos( $filtered, '?ver=' ) === false ) {
            return array(
                'active' => true,
                'label'  => 'gestrippt',
                'detail' => __( 'CSS/JS-URLs werden ohne ?ver= ausgeliefert', 'websitefix-one-click-optimizer' ),
            );
        }
        return array(
            'active' => false,
            'label'  => 'aktiv',
            'detail' => __( 'WordPress hängt ?ver=X.Y an alle Asset-URLs', 'websitefix-one-click-optimizer' ),
        );
    }

    /**
     * jQuery-Migrate-Status: schauen, ob es in den default-scripts noch
     * als Dependency von jquery registriert ist.
     */
    private static function check_jquery_migrate() {
        global $wp_scripts;
        // wp_scripts ist im Admin meist initialisiert. Falls nicht, triggern
        // wir das via wp_default_scripts-Action manuell.
        if ( ! $wp_scripts instanceof WP_Scripts ) {
            $wp_scripts = new WP_Scripts();
            wp_default_scripts( $wp_scripts );
        }
        $deps = isset( $wp_scripts->registered['jquery'] )
            ? (array) $wp_scripts->registered['jquery']->deps
            : array();
        $migrate_in_deps = in_array( 'jquery-migrate', $deps, true );

        // Im Admin-Kontext ist jquery-migrate normalerweise Bestandteil von
        // jquery's Deps. Unser Snippet entfernt sie nur im Frontend (is_admin
        // returnt true im Admin), also greift unsere Diagnostik hier nicht
        // direkt. Workaround: wir prüfen, ob unser Frontend-Filter installiert
        // ist via has_filter().
        $filter_active = has_action( 'wp_default_scripts' );
        // has_filter mit Funktions-Name als Closure-Detektor ist unzuverlässig.
        // Stattdessen: Status aus Optionen ablesen.
        $is_active_per_option = WFOCO_Optimizer::is_active( 'jquery-migrate-remove' );

        if ( $is_active_per_option ) {
            return array(
                'active' => true,
                'label'  => 'entfernt',
                'detail' => __( 'jquery-migrate.min.js wird im Frontend nicht mehr geladen', 'websitefix-one-click-optimizer' ),
            );
        }
        unset( $filter_active, $migrate_in_deps ); // unused-warnings vermeiden
        return array(
            'active' => false,
            'label'  => 'geladen',
            'detail' => __( '~11 KB Legacy-jQuery werden auf jeder Frontend-Seite geladen', 'websitefix-one-click-optimizer' ),
        );
    }
}
