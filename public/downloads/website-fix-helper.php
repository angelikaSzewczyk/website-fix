<?php
/**
 * Plugin Name:       WebsiteFix Helper
 * Plugin URI:        https://website-fix.com
 * Description:       Verbindet deine WordPress-Website mit deinem WebsiteFix Agency-Dashboard. Empfängt Remote-Fix-Befehle und sendet Status-Berichte zurück.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            WebsiteFix
 * Author URI:        https://website-fix.com
 * License:           Proprietary
 * Text Domain:       websitefix-helper
 */

defined( 'ABSPATH' ) || exit;

// ── Constants ────────────────────────────────────────────────
define( 'WF_HELPER_VERSION',  '1.0.0' );
define( 'WF_HELPER_API_BASE', 'https://website-fix.com/api' );
define( 'WF_HELPER_SLUG',     'websitefix-helper' );
define( 'WF_OPTION_KEY',      'wf_plugin_api_key' );
define( 'WF_OPTION_STATUS',   'wf_plugin_connection_status' );
define( 'WF_OPTION_AGENCY',   'wf_plugin_agency_data' );

// ── Activation / Deactivation ────────────────────────────────
register_activation_hook(   __FILE__, 'wf_helper_activate' );
register_deactivation_hook( __FILE__, 'wf_helper_deactivate' );

function wf_helper_activate() {
    add_option( WF_OPTION_KEY,    '' );
    add_option( WF_OPTION_STATUS, 'disconnected' );
    // Register REST namespace so WordPress knows about our endpoints
    flush_rewrite_rules();
}

function wf_helper_deactivate() {
    delete_option( WF_OPTION_STATUS );
}

// ── Admin menu ───────────────────────────────────────────────
add_action( 'admin_menu', 'wf_helper_admin_menu' );

function wf_helper_admin_menu() {
    add_options_page(
        'WebsiteFix Helper',
        'WebsiteFix',
        'manage_options',
        WF_HELPER_SLUG,
        'wf_helper_settings_page'
    );
}

// ── Settings page ────────────────────────────────────────────
function wf_helper_settings_page() {
    // Handle form submission
    if ( isset( $_POST['wf_save_key'] ) && check_admin_referer( 'wf_save_key_action' ) ) {
        $raw_key = sanitize_text_field( wp_unslash( $_POST['wf_api_key'] ?? '' ) );
        if ( str_starts_with( $raw_key, 'wf_live_' ) && strlen( $raw_key ) >= 20 ) {
            update_option( WF_OPTION_KEY, $raw_key );
            $verify = wf_helper_verify_key( $raw_key );
            if ( $verify['valid'] ) {
                update_option( WF_OPTION_STATUS, 'connected' );
                update_option( WF_OPTION_AGENCY,  $verify );
                echo '<div class="notice notice-success"><p><strong>✓ Verbindung erfolgreich!</strong> Agency: ' . esc_html( $verify['agency_name'] ?? '—' ) . '</p></div>';
            } else {
                update_option( WF_OPTION_STATUS, 'error' );
                echo '<div class="notice notice-error"><p><strong>✗ Ungültiger API-Key</strong>: ' . esc_html( $verify['error'] ?? 'Unbekannter Fehler' ) . '</p></div>';
            }
        } else {
            echo '<div class="notice notice-warning"><p>Bitte gib einen gültigen WebsiteFix API-Key ein (beginnt mit <code>wf_live_</code>).</p></div>';
        }
    }

    // Handle disconnect
    if ( isset( $_POST['wf_disconnect'] ) && check_admin_referer( 'wf_save_key_action' ) ) {
        update_option( WF_OPTION_KEY,    '' );
        update_option( WF_OPTION_STATUS, 'disconnected' );
        delete_option( WF_OPTION_AGENCY );
    }

    $current_key    = get_option( WF_OPTION_KEY, '' );
    $status         = get_option( WF_OPTION_STATUS, 'disconnected' );
    $agency         = get_option( WF_OPTION_AGENCY, [] );
    $masked_key     = $current_key ? substr( $current_key, 0, 12 ) . str_repeat( '•', 16 ) : '';
    $is_connected   = $status === 'connected';
    $status_color   = $is_connected ? '#22c55e' : ( $status === 'error' ? '#ef4444' : '#94a3b8' );
    $status_label   = $is_connected ? 'Verbunden' : ( $status === 'error' ? 'Fehler' : 'Nicht verbunden' );
    ?>
    <div class="wrap">
        <h1 style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">🔌</span>
            WebsiteFix Helper
            <span style="font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;
                background:<?php echo esc_attr($status_color); ?>22;
                color:<?php echo esc_attr($status_color); ?>;
                border:1px solid <?php echo esc_attr($status_color); ?>55;">
                <?php echo esc_html($status_label); ?>
            </span>
        </h1>

        <p style="color:#64748b;max-width:560px;margin-bottom:24px;">
            Verbinde diese WordPress-Installation mit deinem <strong>WebsiteFix Agency-Dashboard</strong>.
            Nach der Verbindung kann dein Dashboard Fixes direkt per API übertragen.
        </p>

        <?php if ( $is_connected && ! empty( $agency ) ) : ?>
        <!-- Connected status card -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;max-width:560px;margin-bottom:24px;">
            <p style="margin:0 0 6px;font-weight:700;color:#16a34a;">✓ Verbunden mit WebsiteFix</p>
            <p style="margin:0;color:#374151;font-size:13px;">
                Agency: <strong><?php echo esc_html( $agency['agency_name'] ?? '—' ); ?></strong>
                &nbsp;·&nbsp; Plan: <strong><?php echo esc_html( $agency['plan'] ?? '—' ); ?></strong>
                &nbsp;·&nbsp; API-Key: <code style="font-size:12px;"><?php echo esc_html($masked_key); ?></code>
            </p>
            <?php if ( ! empty( $agency['features']['remote_fix'] ) ) : ?>
            <p style="margin:8px 0 0;font-size:12px;color:#16a34a;">✓ Remote-Fix aktiv &nbsp; ✓ Bulk-Scan aktiv &nbsp; ✓ White-Label aktiv</p>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <form method="post" action="">
            <?php wp_nonce_field( 'wf_save_key_action' ); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="wf_api_key">API-Key</label></th>
                    <td>
                        <input
                            type="text"
                            id="wf_api_key"
                            name="wf_api_key"
                            value="<?php echo esc_attr( $current_key ); ?>"
                            placeholder="wf_live_••••••••••••••••••••••••••••••••••••••••••••••••"
                            style="width:440px;font-family:monospace;"
                            class="regular-text"
                        />
                        <p class="description">
                            Den API-Key findest du in deinem
                            <a href="https://website-fix.com/dashboard" target="_blank" rel="noopener noreferrer">WebsiteFix Dashboard</a>
                            unter <strong>WP-Plugin Anbindung</strong>.
                        </p>
                    </td>
                </tr>
            </table>
            <p class="submit" style="display:flex;gap:10px;align-items:center;">
                <input type="submit" name="wf_save_key" class="button button-primary" value="Verbindung testen &amp; speichern" />
                <?php if ( $is_connected ) : ?>
                <input type="submit" name="wf_disconnect" class="button button-secondary"
                    value="Trennen"
                    onclick="return confirm('API-Key wirklich entfernen?');" />
                <?php endif; ?>
            </p>
        </form>

        <hr style="margin:32px 0 24px;">

        <h2>REST API — Remote Fix Endpoint</h2>
        <p style="color:#64748b;max-width:560px;">
            Das Plugin registriert folgenden WordPress-REST-Endpunkt, über den das Dashboard Fixes übertragen kann:
        </p>
        <code style="display:block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:13px;max-width:560px;word-break:break-all;">
            POST <?php echo esc_html( get_rest_url( null, 'websitefix/v1/apply-fix' ) ); ?>
        </code>
        <p style="color:#94a3b8;font-size:12px;margin-top:8px;">
            Authentifizierung: Bearer <code>wf_live_...</code> im Authorization-Header.
            Nur gültige Agency-API-Keys werden akzeptiert.
        </p>

        <h3 style="margin-top:24px;">Unterstützte Fix-Typen</h3>
        <ul style="color:#64748b;font-size:13px;max-width:560px;line-height:1.8;">
            <li>🖼 <strong>alt_text</strong> — Alt-Texte für Bilder automatisch setzen</li>
            <li>📝 <strong>meta_description</strong> — Meta-Beschreibungen für Seiten setzen</li>
            <li>🔗 <strong>broken_link</strong> — Kaputte Links markieren / entfernen</li>
            <li>📋 <strong>noindex_remove</strong> — noindex-Tag von Seiten entfernen</li>
        </ul>

        <p style="margin-top:24px;font-size:12px;color:#94a3b8;">
            WebsiteFix Helper v<?php echo esc_html( WF_HELPER_VERSION ); ?> &nbsp;·&nbsp;
            <a href="https://website-fix.com/docs/plugin" target="_blank" rel="noopener noreferrer" style="color:#94a3b8;">Dokumentation</a>
        </p>
    </div>
    <?php
}

// ── REST API: Remote Fix endpoint ────────────────────────────
add_action( 'rest_api_init', 'wf_helper_register_routes' );

function wf_helper_register_routes() {
    register_rest_route( 'websitefix/v1', '/apply-fix', [
        'methods'             => 'POST',
        'callback'            => 'wf_helper_apply_fix',
        'permission_callback' => 'wf_helper_check_bearer',
    ] );

    register_rest_route( 'websitefix/v1', '/status', [
        'methods'             => 'GET',
        'callback'            => 'wf_helper_get_status',
        'permission_callback' => 'wf_helper_check_bearer',
    ] );
}

/**
 * Bearer token auth: reads Authorization header, compares against stored key,
 * then re-verifies with the WebsiteFix backend.
 */
function wf_helper_check_bearer( WP_REST_Request $request ): bool {
    $auth_header = $request->get_header( 'authorization' );
    if ( ! $auth_header || ! str_starts_with( $auth_header, 'Bearer ' ) ) return false;

    $token       = substr( $auth_header, 7 );
    $stored_key  = get_option( WF_OPTION_KEY, '' );

    // Fast path: compare locally first
    if ( ! hash_equals( $stored_key, $token ) ) return false;

    // Slow path: re-verify with backend (cached for 5 min via transient)
    $cache_key = 'wf_verify_' . md5( $token );
    $cached    = get_transient( $cache_key );
    if ( $cached !== false ) return (bool) $cached;

    $result = wf_helper_verify_key( $token );
    $valid  = (bool) ( $result['valid'] ?? false );
    set_transient( $cache_key, $valid, 5 * MINUTE_IN_SECONDS );
    return $valid;
}

/**
 * GET /wp-json/websitefix/v1/status
 * Returns basic site info for the dashboard health check.
 */
function wf_helper_get_status(): WP_REST_Response {
    return new WP_REST_Response( [
        'ok'            => true,
        'site_url'      => get_site_url(),
        'wp_version'    => get_bloginfo( 'version' ),
        'plugin_version'=> WF_HELPER_VERSION,
        'connected_at'  => get_option( 'wf_connected_at', null ),
    ] );
}

/**
 * POST /wp-json/websitefix/v1/apply-fix
 *
 * Expected body: { fix_type: string, target_id: int, value: string }
 * fix_type: "alt_text" | "meta_description" | "broken_link" | "noindex_remove"
 */
function wf_helper_apply_fix( WP_REST_Request $request ): WP_REST_Response {
    $fix_type  = sanitize_key( $request->get_param( 'fix_type' ) );
    $target_id = absint( $request->get_param( 'target_id' ) );
    $value     = sanitize_text_field( $request->get_param( 'value' ) ?? '' );

    $result = [ 'applied' => false, 'fix_type' => $fix_type, 'target_id' => $target_id ];

    switch ( $fix_type ) {

        case 'alt_text':
            // Set alt text on an attachment
            if ( $target_id && wp_attachment_is_image( $target_id ) ) {
                update_post_meta( $target_id, '_wp_attachment_image_alt', $value );
                $result['applied'] = true;
                $result['message'] = 'Alt-Text gesetzt.';
            } else {
                $result['error'] = 'Attachment nicht gefunden oder kein Bild.';
            }
            break;

        case 'meta_description':
            // Works with Yoast SEO or RankMath if installed
            if ( $target_id && get_post( $target_id ) ) {
                if ( defined( 'WPSEO_VERSION' ) ) {
                    // Yoast
                    update_post_meta( $target_id, '_yoast_wpseo_metadesc', $value );
                    $result['applied'] = true;
                    $result['message'] = 'Meta-Beschreibung via Yoast gesetzt.';
                } elseif ( class_exists( 'RankMath' ) ) {
                    // RankMath
                    update_post_meta( $target_id, 'rank_math_description', $value );
                    $result['applied'] = true;
                    $result['message'] = 'Meta-Beschreibung via RankMath gesetzt.';
                } else {
                    $result['error'] = 'Kein SEO-Plugin gefunden (Yoast / RankMath erforderlich).';
                }
            } else {
                $result['error'] = 'Post nicht gefunden.';
            }
            break;

        case 'noindex_remove':
            // Remove noindex from Yoast
            if ( $target_id && get_post( $target_id ) ) {
                if ( defined( 'WPSEO_VERSION' ) ) {
                    update_post_meta( $target_id, '_yoast_wpseo_meta-robots-noindex', '0' );
                    $result['applied'] = true;
                    $result['message'] = 'noindex via Yoast entfernt.';
                } else {
                    $result['error'] = 'Yoast SEO nicht gefunden.';
                }
            }
            break;

        case 'broken_link':
            // Log for review — actual link removal requires content parsing
            $result['applied'] = true;
            $result['message'] = 'Kaputte-Link-Meldung empfangen. Manuelle Prüfung empfohlen.';
            break;

        default:
            return new WP_REST_Response( [ 'error' => 'Unbekannter fix_type: ' . $fix_type ], 400 );
    }

    // Log fix application
    wf_helper_log_fix( $fix_type, $target_id, $result['applied'], $result['message'] ?? $result['error'] ?? '' );

    return new WP_REST_Response( $result, $result['applied'] ? 200 : 422 );
}

// ── Helper: verify key against WebsiteFix backend ────────────
function wf_helper_verify_key( string $api_key ): array {
    $response = wp_remote_post( WF_HELPER_API_BASE . '/plugin/verify', [
        'timeout'     => 10,
        'headers'     => [ 'Content-Type' => 'application/json' ],
        'body'        => wp_json_encode( [
            'api_key' => $api_key,
            'domain'  => get_site_url(),
        ] ),
        'data_format' => 'body',
    ] );

    if ( is_wp_error( $response ) ) {
        return [ 'valid' => false, 'error' => $response->get_error_message() ];
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    if ( ! is_array( $body ) ) {
        return [ 'valid' => false, 'error' => 'Ungültige API-Antwort' ];
    }

    if ( $body['valid'] ?? false ) {
        update_option( 'wf_connected_at', gmdate( 'c' ) );
    }

    return $body;
}

// ── Helper: simple fix log (wp_options based, lightweight) ───
function wf_helper_log_fix( string $type, int $target_id, bool $ok, string $msg ): void {
    $log   = get_option( 'wf_fix_log', [] );
    $log[] = [
        'time'      => gmdate( 'c' ),
        'type'      => $type,
        'target_id' => $target_id,
        'ok'        => $ok,
        'msg'       => $msg,
    ];
    // Keep last 100 entries
    if ( count( $log ) > 100 ) {
        $log = array_slice( $log, -100 );
    }
    update_option( 'wf_fix_log', $log );
}
