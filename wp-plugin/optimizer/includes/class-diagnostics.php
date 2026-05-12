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
     * Query-String-Status. Liest die Option statt einen Filter-Probe durch
     * fremde Plugin-Handler zu jagen — manche Caching-/Security-Plugins
     * haben Handler auf style_loader_src, die auf synthetische Test-URLs
     * mit Fatal antworten. v0.1.0-Workaround: nur Option-State lesen.
     */
    private static function check_query_strings() {
        if ( WFOCO_Optimizer::is_active( 'query-string-cleaner' ) ) {
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
     * jQuery-Migrate-Status. Selbe Sicherheits-Strategie wie bei Query-Strings:
     * Option-State statt riskante WP_Scripts-Inspektion. Im Admin-Kontext
     * würde new WP_Scripts() + wp_default_scripts() zu Doppel-Registrierungen
     * und Fatal-Errors führen, wenn andere Plugins auf wp_default_scripts hooken.
     */
    private static function check_jquery_migrate() {
        if ( WFOCO_Optimizer::is_active( 'jquery-migrate-remove' ) ) {
            return array(
                'active' => true,
                'label'  => 'entfernt',
                'detail' => __( 'jquery-migrate.min.js wird im Frontend nicht mehr geladen', 'websitefix-one-click-optimizer' ),
            );
        }
        return array(
            'active' => false,
            'label'  => 'geladen',
            'detail' => __( '~11 KB Legacy-jQuery werden auf jeder Frontend-Seite geladen', 'websitefix-one-click-optimizer' ),
        );
    }
}
