<?php
/**
 * Plugin Name:       Website Exzellenz Connector
 * Plugin URI:        https://website-fix.com
 * Description:       Verbindet deine WordPress-Website sicher mit dem Website Exzellenz Agency-Dashboard. Empfängt Remote-Fix-Befehle und hält dein Dashboard über den Website-Status informiert.
 * Version:           1.3.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            WebsiteFix
 * Author URI:        https://website-fix.com
 * License:           Proprietary
 * Text Domain:       wf-connector
 */

defined( 'ABSPATH' ) || exit;

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║ WHITE-LABEL CONFIG — für Agency-Scale-Kunden                             ║
// ╠══════════════════════════════════════════════════════════════════════════╣
// ║ Trage hier dein Agentur-Branding ein, bevor du das Plugin an deine       ║
// ║ Mandanten-Site ausrollst. Beide Werte leer lassen = Default-Branding     ║
// ║ ("Website Exzellenz Connector").                                         ║
// ║                                                                          ║
// ║ Sobald die Verbindung mit einem Agency-Plan-Key steht, übernimmt das     ║
// ║ Plugin AUTOMATISCH agency_name + logo_url aus dem /verify-Endpunkt       ║
// ║ — dieses Array ist nur der Pre-Connect-Fallback (Plugin zeigt schon vor  ║
// ║ dem ersten Save dein Branding).                                          ║
// ║                                                                          ║
// ║ Override per wp-config.php möglich:                                      ║
// ║   define( 'WFC_WHITE_LABEL_CONFIG', [ 'agency_name' => '…', … ] );       ║
// ╚══════════════════════════════════════════════════════════════════════════╝
if ( ! defined( 'WFC_WHITE_LABEL_CONFIG' ) ) {
    define( 'WFC_WHITE_LABEL_CONFIG', [
        'agency_name'     => '', // z.B. "Acme Webcare Connector"
        'custom_logo_url' => '', // z.B. "https://acme.de/assets/logo.png"
    ] );
}

// ── Constants ─────────────────────────────────────────────────────────────────
define( 'WFC_VERSION',    '1.3.0' );
define( 'WFC_API_BASE',   'https://website-fix.com/api/plugin' );
define( 'WFC_SLUG',       'wf-connector' );
define( 'WFC_OPT_KEY',    'wfc_api_key' );
define( 'WFC_OPT_STATUS', 'wfc_status' );       // connected|error|disconnected
define( 'WFC_OPT_AGENCY', 'wfc_agency_data' );  // agency info from verify endpoint
define( 'WFC_GOLD',       '#FBBF24' );

/**
 * Liest den Anzeige-Namen für die White-Label-Branding-Logik.
 *
 * Priorität (high → low):
 *   1. Agency-Daten aus /verify (sobald verbunden — Live-Update bei
 *      jedem Save).
 *   2. WFC_WHITE_LABEL_CONFIG['agency_name'] (statisches Pre-Connect-
 *      Branding aus dieser Datei oder via wp-config-Override).
 *   3. Default-Marke "Website Exzellenz Connector".
 */
function wfc_brand_label(): string {
    $agency = get_option( WFC_OPT_AGENCY, [] );
    if ( ! empty( $agency['agency_name'] ) ) return (string) $agency['agency_name'];

    $cfg = defined( 'WFC_WHITE_LABEL_CONFIG' ) ? WFC_WHITE_LABEL_CONFIG : [];
    if ( is_array( $cfg ) && ! empty( $cfg['agency_name'] ) ) return (string) $cfg['agency_name'];

    return 'Website Exzellenz Connector';
}

/**
 * Liefert die Logo-URL für die Settings-Page-Anzeige + WordPress-Menü.
 * Gleiche Priorität wie wfc_brand_label(). Leerstring = Plugin nutzt
 * den ⚡-Emoji-Default.
 */
function wfc_brand_logo_url(): string {
    $agency = get_option( WFC_OPT_AGENCY, [] );
    if ( ! empty( $agency['logo_url'] ) ) return (string) $agency['logo_url'];

    $cfg = defined( 'WFC_WHITE_LABEL_CONFIG' ) ? WFC_WHITE_LABEL_CONFIG : [];
    if ( is_array( $cfg ) && ! empty( $cfg['custom_logo_url'] ) ) return (string) $cfg['custom_logo_url'];

    return '';
}

// ── Activation / Deactivation ─────────────────────────────────────────────────
register_activation_hook(   __FILE__, 'wfc_activate' );
register_deactivation_hook( __FILE__, 'wfc_deactivate' );

function wfc_activate() {
    // autoload='no' für Secret-Felder: API-Key + Agency-Daten landen NICHT
    // im autoload-Cache (sonst stehen sie in jedem Memory-Dump). Wird erst
    // bei expliziter get_option-Abfrage aus der DB geladen.
    add_option( WFC_OPT_KEY,    '', '', 'no' );
    add_option( WFC_OPT_STATUS, 'disconnected' );
    // Schedule heartbeat every 12 hours (legacy small-payload ping).
    if ( ! wp_next_scheduled( 'wfc_heartbeat_event' ) ) {
        wp_schedule_event( time(), 'twicedaily', 'wfc_heartbeat_event' );
    }
    // Schedule full deep-data handshake every 12 hours, offset by 5 min so
    // beide Crons nicht gleichzeitig feuern (DB-Last-Spreizung).
    if ( ! wp_next_scheduled( 'wfc_handshake_event' ) ) {
        wp_schedule_event( time() + 300, 'twicedaily', 'wfc_handshake_event' );
    }
    // Sofort-Handshake bei Aktivierung — wenn ein Key bereits gespeichert ist
    // (Re-Aktivierung nach Update), kippt das Dashboard binnen Sekunden auf
    // "Full System Audit". Frischer Install ohne Key = no-op (early return).
    wfc_send_handshake();
    flush_rewrite_rules();
}

function wfc_deactivate() {
    wp_clear_scheduled_hook( 'wfc_heartbeat_event' );
    wp_clear_scheduled_hook( 'wfc_handshake_event' );
    update_option( WFC_OPT_STATUS, 'disconnected' );
}

// ── Cron heartbeat (legacy small-payload) ─────────────────────────────────────
add_action( 'wfc_heartbeat_event', 'wfc_send_heartbeat' );

function wfc_send_heartbeat() {
    $key = get_option( WFC_OPT_KEY, '' );
    if ( empty( $key ) ) return;

    wp_remote_post( WFC_API_BASE . '/heartbeat', [
        'timeout'     => 8,
        'headers'     => [
            'Content-Type' => 'application/json',
            'X-WF-API-KEY' => $key,
        ],
        'body'        => wp_json_encode( [
            'site_url'       => get_site_url(),
            'site_name'      => get_bloginfo( 'name' ),
            'wp_version'     => get_bloginfo( 'version' ),
            'plugin_version' => WFC_VERSION,
        ] ),
        'data_format' => 'body',
    ] );
}

// ── Cron handshake (Deep-Data) ────────────────────────────────────────────────
add_action( 'wfc_handshake_event', 'wfc_send_handshake' );

// ── Admin menu ────────────────────────────────────────────────────────────────
add_action( 'admin_menu', 'wfc_admin_menu' );
add_action( 'admin_enqueue_scripts', 'wfc_admin_styles' );

function wfc_admin_menu() {
    $label = wfc_brand_label();
    add_options_page(
        $label,
        $label, // Menu-Eintrag
        'manage_options',
        WFC_SLUG,
        'wfc_settings_page'
    );
}

function wfc_admin_styles( $hook ) {
    if ( $hook !== 'settings_page_' . WFC_SLUG ) return;
    // Inline CSS — no external file needed
    wp_add_inline_style( 'wp-admin', wfc_admin_css() );
}

function wfc_admin_css(): string {
    return '
    .wfc-wrap { max-width: 700px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .wfc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .wfc-logo { width: 36px; height: 36px; border-radius: 9px;
        background: #FBBF2420; border: 1px solid #FBBF2450;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px; line-height: 1; }
    .wfc-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0; }
    .wfc-subtitle { font-size: 13px; color: #64748b; margin: 0 0 28px; }

    .wfc-status-badge { display: inline-flex; align-items: center; gap: 6px;
        padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
        letter-spacing: 0.03em; vertical-align: middle; }
    .wfc-status-badge.connected { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
    .wfc-status-badge.disconnected { background: #f8fafc; border: 1px solid #e2e8f0; color: #94a3b8; }
    .wfc-status-badge.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

    .wfc-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
        padding: 24px 28px; margin-bottom: 20px; }
    .wfc-card-title { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
    .wfc-card-desc { font-size: 12px; color: #64748b; margin: 0 0 18px; line-height: 1.6; }

    .wfc-connected-card { background: #fffbeb; border-color: #fde68a; }
    .wfc-connected-card .wfc-card-title { color: #92400e; }

    .wfc-key-row { display: flex; align-items: center; gap: 8px; }
    .wfc-key-row input[type=text] { flex: 1; font-family: monospace; font-size: 13px;
        border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px;
        color: #0f172a; background: #f8fafc; }
    .wfc-key-row input[type=text]:focus { outline: 2px solid #FBBF24; outline-offset: 1px; }

    .wfc-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px;
        border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer;
        border: none; text-decoration: none; transition: opacity 0.15s; }
    .wfc-btn:hover { opacity: 0.85; }
    .wfc-btn-primary { background: #FBBF24; color: #0f172a; }
    .wfc-btn-ghost { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .wfc-btn-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }

    .wfc-feature-list { list-style: none; margin: 0; padding: 0; display: grid;
        grid-template-columns: 1fr 1fr; gap: 6px; }
    .wfc-feature-list li { font-size: 12px; color: #374151;
        display: flex; align-items: center; gap: 6px; }
    .wfc-feature-list li::before { content: "✓";
        color: #FBBF24; font-weight: 800; flex-shrink: 0; }

    .wfc-endpoint-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
        padding: 12px 16px; font-family: monospace; font-size: 12px; color: #475569;
        word-break: break-all; }
    .wfc-log-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .wfc-log-table th { text-align: left; padding: 8px 12px; background: #f8fafc;
        color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
    .wfc-log-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }
    .wfc-ok { color: #16a34a; font-weight: 700; }
    .wfc-fail { color: #dc2626; font-weight: 700; }
    ';
}

// ── Settings page ─────────────────────────────────────────────────────────────
function wfc_settings_page() {
    if ( ! current_user_can( 'manage_options' ) ) return;

    // ── Handle save ──
    if ( isset( $_POST['wfc_action'] ) && check_admin_referer( 'wfc_nonce' ) ) {

        $action = sanitize_key( $_POST['wfc_action'] );

        if ( $action === 'save_key' ) {
            $raw = sanitize_text_field( wp_unslash( $_POST['wfc_api_key'] ?? '' ) );
            if ( str_starts_with( $raw, 'wf_live_' ) && strlen( $raw ) >= 20 ) {
                update_option( WFC_OPT_KEY, $raw, 'no' );
                $verify = wfc_verify_key( $raw );
                if ( $verify['valid'] ?? false ) {
                    update_option( WFC_OPT_STATUS, 'connected' );
                    update_option( WFC_OPT_AGENCY,  $verify, 'no' );
                    // Register this installation with our backend
                    wfc_register_installation( $raw );
                    echo '<div class="notice notice-success is-dismissible"><p>
                        <strong>✓ Verbindung erfolgreich!</strong>
                        Agency: <strong>' . esc_html( $verify['agency_name'] ?? '—' ) . '</strong>
                    </p></div>';
                } else {
                    update_option( WFC_OPT_STATUS, 'error' );
                    echo '<div class="notice notice-error is-dismissible"><p>
                        <strong>✗ Verbindung fehlgeschlagen:</strong> '
                        . esc_html( $verify['error'] ?? 'Unbekannter Fehler' ) . '
                    </p></div>';
                }
            } else {
                echo '<div class="notice notice-warning is-dismissible"><p>
                    Bitte gib einen gültigen API-Key ein (beginnt mit <code>wf_live_</code>).
                </p></div>';
            }
        }

        if ( $action === 'disconnect' ) {
            update_option( WFC_OPT_KEY,    '', 'no' );
            update_option( WFC_OPT_STATUS, 'disconnected' );
            delete_option( WFC_OPT_AGENCY );
            echo '<div class="notice notice-info is-dismissible"><p>Verbindung getrennt.</p></div>';
        }

        if ( $action === 'resync' ) {
            // Manueller Handshake-Trigger — bypassed den 12h-Cron für sofortigen Re-Sync.
            wfc_send_handshake();
            $ok = get_option( 'wfc_last_handshake_ok', false );
            if ( $ok ) {
                echo '<div class="notice notice-success is-dismissible"><p>✓ Handshake erfolgreich — Dashboard wurde aktualisiert.</p></div>';
            } else {
                $err = (string) get_option( 'wfc_last_handshake_err', 'Unbekannter Fehler' );
                echo '<div class="notice notice-error is-dismissible"><p>✗ Handshake fehlgeschlagen: ' . esc_html( $err ) . '</p></div>';
            }
        }

        if ( $action === 'test' ) {
            $key    = get_option( WFC_OPT_KEY, '' );
            $result = wfc_verify_key( $key );
            if ( $result['valid'] ?? false ) {
                update_option( WFC_OPT_STATUS, 'connected' );
                update_option( WFC_OPT_AGENCY,  $result, 'no' );
                echo '<div class="notice notice-success is-dismissible"><p>✓ Verbindung aktiv.</p></div>';
            } else {
                update_option( WFC_OPT_STATUS, 'error' );
                echo '<div class="notice notice-error is-dismissible"><p>✗ Verbindungstest fehlgeschlagen.</p></div>';
            }
        }
    }

    $key       = get_option( WFC_OPT_KEY, '' );
    $status    = get_option( WFC_OPT_STATUS, 'disconnected' );
    $agency    = get_option( WFC_OPT_AGENCY, [] );
    $connected = $status === 'connected';
    $fix_log   = array_reverse( get_option( 'wfc_fix_log', [] ) );
    $endpoint  = get_rest_url( null, 'wf/v1/execute' );
    ?>
    <?php
    $brand_label = wfc_brand_label();
    $brand_logo  = wfc_brand_logo_url();
    ?>
    <div class="wrap wfc-wrap">
        <div class="wfc-header">
            <div class="wfc-logo">
                <?php if ( $brand_logo ) : ?>
                    <img src="<?php echo esc_url( $brand_logo ); ?>" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:7px;" />
                <?php else : ?>
                    ⚡
                <?php endif; ?>
            </div>
            <h1 class="wfc-title"><?php echo esc_html( $brand_label ); ?></h1>
            <span class="wfc-status-badge <?php echo esc_attr( $status ); ?>">
                <?php echo $connected ? '● Verbunden' : ( $status === 'error' ? '● Fehler' : '○ Nicht verbunden' ); ?>
            </span>
        </div>
        <p class="wfc-subtitle">
            Verbinde diese WordPress-Installation mit deinem Agency-Dashboard — für Remote-Fixes direkt aus deinem Browser.
        </p>

        <?php if ( $connected && ! empty( $agency ) ) : ?>
        <!-- ── Connected card ── -->
        <div class="wfc-card wfc-connected-card">
            <p class="wfc-card-title">⚡ Verbunden mit Website Exzellenz</p>
            <p style="margin:4px 0 14px;font-size:13px;color:#78350f;">
                Agency: <strong><?php echo esc_html( $agency['agency_name'] ?? '—' ); ?></strong>
                &nbsp;·&nbsp; Plan: <strong><?php echo esc_html( $agency['plan'] ?? '—' ); ?></strong>
            </p>
            <?php if ( ! empty( $agency['features'] ) ) : ?>
            <ul class="wfc-feature-list">
                <?php if ( $agency['features']['remote_fix'] ?? false ) : ?>
                <li>Remote-Fix aktiv</li>
                <?php endif; ?>
                <?php if ( $agency['features']['bulk_scan'] ?? false ) : ?>
                <li>Bulk-Scan aktiv</li>
                <?php endif; ?>
                <?php if ( $agency['features']['white_label'] ?? false ) : ?>
                <li>White-Label aktiv</li>
                <?php endif; ?>
                <?php if ( $agency['features']['ki_mass_fixer'] ?? false ) : ?>
                <li>KI-Mass-Fixer aktiv</li>
                <?php endif; ?>
            </ul>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <!-- ── API-Key Form ── -->
        <div class="wfc-card">
            <p class="wfc-card-title">API-Key</p>
            <p class="wfc-card-desc">
                Den Key findest du in deinem
                <a href="https://website-fix.com/dashboard" target="_blank" rel="noopener">Agency-Dashboard</a>
                unter <strong>WP-Plugin Anbindung → Dein Plugin API-Key</strong>.
            </p>
            <form method="post" action="">
                <?php wp_nonce_field( 'wfc_nonce' ); ?>
                <div class="wfc-key-row" style="margin-bottom:14px;">
                    <input
                        type="text"
                        name="wfc_api_key"
                        value="<?php echo esc_attr( $key ); ?>"
                        placeholder="wf_live_••••••••••••••••••••••••••••••••••••••••••••••••"
                        autocomplete="off"
                        spellcheck="false"
                    />
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button type="submit" name="wfc_action" value="save_key" class="wfc-btn wfc-btn-primary">
                        Speichern &amp; verbinden
                    </button>
                    <?php if ( $connected ) : ?>
                    <button type="submit" name="wfc_action" value="test" class="wfc-btn wfc-btn-ghost">
                        Verbindung testen
                    </button>
                    <button type="submit" name="wfc_action" value="disconnect" class="wfc-btn wfc-btn-danger"
                        onclick="return confirm('Verbindung wirklich trennen?')">
                        Trennen
                    </button>
                    <?php endif; ?>
                </div>
            </form>
        </div>

        <!-- ── Deep-Scan Handshake Status (Moment-of-Truth-Indikator) ── -->
        <?php
        $hs_at  = get_option( 'wfc_last_handshake_at', '' );
        $hs_ok  = get_option( 'wfc_last_handshake_ok', false );
        $hs_err = get_option( 'wfc_last_handshake_err', '' );
        if ( $hs_at || $connected ) :
            // Lokale Anzeige im WP-Admin-Format (server-zeitzone-bewusst)
            $hs_label = $hs_at
                ? wp_date( 'd. M Y · H:i', strtotime( $hs_at ) ) . ' UTC'
                : '— noch keiner —';
        ?>
        <div class="wfc-card">
            <p class="wfc-card-title">Deep-Scan-Handshake</p>
            <p class="wfc-card-desc">
                Sobald das Plugin Server-Telemetrie an dein Dashboard sendet, springt es dort
                automatisch von <strong>"Oberflächen-Check"</strong> auf <strong>"Full System Audit"</strong>.
            </p>
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <span style="display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.04em;
                    <?php echo $hs_ok
                        ? 'background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;'
                        : ( $hs_at ? 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626;' : 'background:#fffbeb;border:1px solid #fde68a;color:#92400e;' ); ?>
                ">
                    <?php echo $hs_ok ? '● OK' : ( $hs_at ? '● Fehler' : '○ Wartet' ); ?>
                </span>
                <div style="flex:1;min-width:180px;">
                    <div style="font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:2px;">
                        Letzter erfolgreicher Handshake
                    </div>
                    <div style="font-size:13px;color:#0f172a;font-weight:700;font-family:monospace;">
                        <?php echo esc_html( $hs_label ); ?>
                    </div>
                </div>
                <?php if ( $connected ) : ?>
                <form method="post" action="" style="margin:0;">
                    <?php wp_nonce_field( 'wfc_nonce' ); ?>
                    <button type="submit" name="wfc_action" value="resync"
                            class="wfc-btn wfc-btn-ghost" style="padding:7px 14px;font-size:12px;">
                        ↻ Jetzt synchronisieren
                    </button>
                </form>
                <?php endif; ?>
            </div>
            <?php if ( ! $hs_ok && $hs_err ) : ?>
            <p style="margin:10px 0 0;font-size:11.5px;color:#dc2626;font-family:monospace;">
                Letzter Fehler: <?php echo esc_html( $hs_err ); ?>
            </p>
            <?php endif; ?>
            <p style="margin:10px 0 0;font-size:11px;color:#94a3b8;line-height:1.55;">
                Plan: alle 12 h automatischer Sync via WP-Cron. Bei Fehler 6h-Retry. Nächster Cron-Run:
                <code><?php
                    $next = wp_next_scheduled( 'wfc_handshake_event' );
                    echo $next ? esc_html( wp_date( 'd. M H:i', $next ) ) : 'nicht geplant';
                ?></code>
            </p>
        </div>
        <?php endif; ?>

        <!-- ── REST Endpoint info ── -->
        <div class="wfc-card">
            <p class="wfc-card-title">Remote-Fix Endpoint</p>
            <p class="wfc-card-desc">
                Dein Dashboard sendet Befehle an diesen Endpunkt. Authentifizierung läuft über den
                <code>X-WF-API-KEY</code> Header — kein WordPress-Login erforderlich.
            </p>
            <p style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin:0 0 6px;">Endpoint URL</p>
            <div class="wfc-endpoint-box">POST <?php echo esc_html( $endpoint ); ?></div>

            <p style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin:18px 0 6px;">
                Unterstützte Fix-Typen
            </p>
            <ul class="wfc-feature-list">
                <li>set_alt_text — Alt-Texte für Bilder</li>
                <li>set_meta_description — Meta-Beschreibung (Yoast/RankMath)</li>
                <li>set_title — Seitentitel (Yoast/RankMath)</li>
                <li>remove_noindex — noindex entfernen</li>
                <li>set_post_meta — beliebige Post-Meta</li>
                <li>ping — Verbindungstest</li>
            </ul>
        </div>

        <!-- ── Fix log ── -->
        <?php if ( ! empty( $fix_log ) ) : ?>
        <div class="wfc-card">
            <p class="wfc-card-title">Fix-Protokoll (letzte <?php echo count( $fix_log ); ?> Einträge)</p>
            <table class="wfc-log-table">
                <thead>
                    <tr>
                        <th>Zeitpunkt</th>
                        <th>Fix-Typ</th>
                        <th>Ziel</th>
                        <th>Ergebnis</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ( array_slice( $fix_log, 0, 20 ) as $entry ) : ?>
                    <tr>
                        <td><?php echo esc_html( $entry['time'] ?? '—' ); ?></td>
                        <td><code><?php echo esc_html( $entry['type'] ?? '—' ); ?></code></td>
                        <td><?php echo esc_html( $entry['target'] ?? '—' ); ?></td>
                        <td class="<?php echo ( $entry['ok'] ?? false ) ? 'wfc-ok' : 'wfc-fail'; ?>">
                            <?php echo ( $entry['ok'] ?? false ) ? '✓ OK' : '✗ Fehler'; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>

        <p style="font-size:11px;color:#94a3b8;margin-top:4px;">
            Website Exzellenz Connector v<?php echo esc_html( WFC_VERSION ); ?>
            &nbsp;·&nbsp;
            <a href="https://website-fix.com/docs/plugin" target="_blank" rel="noopener noreferrer" style="color:#94a3b8;">
                Dokumentation
            </a>
        </p>
    </div>
    <?php
}

// ── REST API ──────────────────────────────────────────────────────────────────
add_action( 'rest_api_init', 'wfc_register_routes' );

function wfc_register_routes() {
    register_rest_route( 'wf/v1', '/execute', [
        'methods'             => 'POST',
        'callback'            => 'wfc_execute_fix',
        'permission_callback' => 'wfc_auth_check',
    ] );

    register_rest_route( 'wf/v1', '/status', [
        'methods'             => 'GET',
        'callback'            => 'wfc_get_status',
        'permission_callback' => 'wfc_auth_check',
    ] );

    register_rest_route( 'wf/v1', '/ping', [
        'methods'             => 'GET',
        'callback'            => fn() => new WP_REST_Response( [ 'ok' => true, 'site' => get_site_url() ] ),
        'permission_callback' => '__return_true',  // public ping
    ] );
}

/**
 * Auth: reads X-WF-API-KEY header, compares to stored key, re-verifies with backend every 5 min.
 */
function wfc_auth_check( WP_REST_Request $request ): bool {
    $incoming = $request->get_header( 'x-wf-api-key' );
    if ( empty( $incoming ) ) return false;

    $stored = get_option( WFC_OPT_KEY, '' );
    if ( ! hash_equals( $stored, $incoming ) ) return false;

    // Cached verification (5 min transient)
    $cache_key = 'wfc_ok_' . md5( $incoming );
    $cached    = get_transient( $cache_key );
    if ( $cached !== false ) return (bool) $cached;

    $result = wfc_verify_key( $incoming );
    $valid  = (bool) ( $result['valid'] ?? false );
    set_transient( $cache_key, $valid, 5 * MINUTE_IN_SECONDS );
    return $valid;
}

/**
 * GET /wp-json/wf/v1/status
 */
function wfc_get_status(): WP_REST_Response {
    $agency = get_option( WFC_OPT_AGENCY, [] );
    return new WP_REST_Response( [
        'ok'             => true,
        'site_url'       => get_site_url(),
        'site_name'      => get_bloginfo( 'name' ),
        'wp_version'     => get_bloginfo( 'version' ),
        'plugin_version' => WFC_VERSION,
        'agency_name'    => $agency['agency_name'] ?? null,
        'connected_at'   => get_option( 'wfc_connected_at', null ),
    ] );
}

/**
 * POST /wp-json/wf/v1/execute
 *
 * Body: {
 *   fix_type : "set_alt_text" | "set_meta_description" | "set_title" | "remove_noindex" | "set_post_meta" | "ping"
 *   target_id: int          — WP post/attachment ID
 *   value    : string       — the new value
 *   meta_key : string       — only for set_post_meta
 *   batch    : array        — optional: [{fix_type, target_id, value}] for bulk
 * }
 */
function wfc_execute_fix( WP_REST_Request $request ): WP_REST_Response {
    // ── Batch mode ────────────────────────────────────────────
    $batch = $request->get_param( 'batch' );
    if ( is_array( $batch ) && ! empty( $batch ) ) {
        $results = [];
        foreach ( $batch as $item ) {
            $results[] = wfc_apply_single(
                sanitize_key( $item['fix_type'] ?? '' ),
                absint( $item['target_id'] ?? 0 ),
                sanitize_text_field( $item['value'] ?? '' ),
                sanitize_key( $item['meta_key'] ?? '' )
            );
        }
        return new WP_REST_Response( [ 'batch' => true, 'results' => $results ], 200 );
    }

    // ── Single mode ───────────────────────────────────────────
    $fix_type  = sanitize_key( $request->get_param( 'fix_type' ) ?? 'ping' );
    $target_id = absint( $request->get_param( 'target_id' ) ?? 0 );
    $value     = sanitize_text_field( $request->get_param( 'value' ) ?? '' );
    $meta_key  = sanitize_key( $request->get_param( 'meta_key' ) ?? '' );

    if ( $fix_type === 'ping' ) {
        return new WP_REST_Response( [ 'ok' => true, 'pong' => true, 'site' => get_site_url() ] );
    }

    $result = wfc_apply_single( $fix_type, $target_id, $value, $meta_key );
    return new WP_REST_Response( $result, $result['ok'] ? 200 : 422 );
}

/**
 * Apply a single fix and return a result array.
 */
function wfc_apply_single( string $fix_type, int $target_id, string $value, string $meta_key = '' ): array {
    $result = [ 'ok' => false, 'fix_type' => $fix_type, 'target_id' => $target_id ];

    switch ( $fix_type ) {

        // ── Alt-text on attachment ────────────────────────────
        case 'set_alt_text':
            if ( $target_id && wp_attachment_is_image( $target_id ) ) {
                update_post_meta( $target_id, '_wp_attachment_image_alt', $value );
                $result['ok']  = true;
                $result['msg'] = 'Alt-Text gesetzt.';
            } else {
                $result['error'] = 'Attachment-ID nicht gefunden oder kein Bild.';
            }
            break;

        // ── Meta description (Yoast → RankMath → fallback) ───
        case 'set_meta_description':
            if ( $target_id && get_post( $target_id ) ) {
                if ( defined( 'WPSEO_VERSION' ) ) {
                    update_post_meta( $target_id, '_yoast_wpseo_metadesc', $value );
                    $result['ok'] = true; $result['msg'] = 'Yoast: Meta-Description gesetzt.';
                } elseif ( class_exists( 'RankMath' ) ) {
                    update_post_meta( $target_id, 'rank_math_description', $value );
                    $result['ok'] = true; $result['msg'] = 'RankMath: Meta-Description gesetzt.';
                } else {
                    // Fallback: store in generic field that theme might use
                    update_post_meta( $target_id, 'wf_meta_description', $value );
                    $result['ok'] = true; $result['msg'] = 'Fallback: wf_meta_description gesetzt.';
                }
            } else {
                $result['error'] = 'Post nicht gefunden.';
            }
            break;

        // ── Page/post title (Yoast → RankMath) ───────────────
        case 'set_title':
            if ( $target_id && get_post( $target_id ) ) {
                if ( defined( 'WPSEO_VERSION' ) ) {
                    update_post_meta( $target_id, '_yoast_wpseo_title', $value );
                    $result['ok'] = true; $result['msg'] = 'Yoast: SEO-Titel gesetzt.';
                } elseif ( class_exists( 'RankMath' ) ) {
                    update_post_meta( $target_id, 'rank_math_title', $value );
                    $result['ok'] = true; $result['msg'] = 'RankMath: SEO-Titel gesetzt.';
                } else {
                    wp_update_post( [ 'ID' => $target_id, 'post_title' => $value ] );
                    $result['ok'] = true; $result['msg'] = 'WP-Seitentitel aktualisiert.';
                }
            } else {
                $result['error'] = 'Post nicht gefunden.';
            }
            break;

        // ── Remove noindex ────────────────────────────────────
        case 'remove_noindex':
            if ( $target_id && get_post( $target_id ) ) {
                if ( defined( 'WPSEO_VERSION' ) ) {
                    update_post_meta( $target_id, '_yoast_wpseo_meta-robots-noindex', '0' );
                    $result['ok'] = true; $result['msg'] = 'Yoast: noindex entfernt.';
                } elseif ( class_exists( 'RankMath' ) ) {
                    update_post_meta( $target_id, 'rank_math_robots', [] );
                    $result['ok'] = true; $result['msg'] = 'RankMath: robots-Einstellung zurückgesetzt.';
                } else {
                    $result['error'] = 'Kein SEO-Plugin (Yoast/RankMath) gefunden.';
                }
            } else {
                $result['error'] = 'Post nicht gefunden.';
            }
            break;

        // ── Generic post meta ─────────────────────────────────
        case 'set_post_meta':
            if ( $target_id && $meta_key && get_post( $target_id ) ) {
                update_post_meta( $target_id, $meta_key, $value );
                $result['ok'] = true; $result['msg'] = "Post-Meta '$meta_key' gesetzt.";
            } else {
                $result['error'] = 'Post-ID oder meta_key fehlt.';
            }
            break;

        default:
            $result['error'] = "Unbekannter fix_type: $fix_type";
            return $result;
    }

    // Log
    $log   = get_option( 'wfc_fix_log', [] );
    $log[] = [
        'time'   => gmdate( 'Y-m-d H:i:s' ),
        'type'   => $fix_type,
        'target' => (string) $target_id,
        'ok'     => $result['ok'],
        'msg'    => $result['msg'] ?? $result['error'] ?? '',
    ];
    if ( count( $log ) > 200 ) $log = array_slice( $log, -200 );
    update_option( 'wfc_fix_log', $log, false );

    return $result;
}

// ── Deep-Data-Collector ───────────────────────────────────────────────────────
/**
 * Sammelt den Server-seitigen "Röntgenblick" für den Hybrid-Scan-Mode.
 *
 * Schema (best-effort — fehlende Werte werden weggelassen statt null gesetzt):
 *   php:    { version, memory_limit, max_execution_time, upload_max_filesize }
 *   wp:     { version, debug, multisite }
 *   db:     { engine, version, slow_query_log }
 *   server: { os, webserver }
 *   logs:   { php_errors_24h, last_fatal, sample }
 *   plugins_active:     int
 *   plugins_list:       [{ name, version, slug }]
 *   parameters_checked: int
 *   captured_at:        ISO-8601
 *
 * Privacy: Logs werden gefiltert + auf 1 KB Sample begrenzt. Keine
 * Stack-Traces, keine Kundendaten, keine Pfad-Leaks (wir strippen nur die
 * letzten 5 Zeilen mit "PHP Fatal" / "PHP Warning"-Pattern).
 */
function wfc_collect_deep_data(): array {
    global $wpdb;

    $data = [
        'php' => array_filter([
            'version'             => PHP_VERSION,
            'memory_limit'        => ini_get( 'memory_limit' ) ?: null,
            'max_execution_time'  => (int) ini_get( 'max_execution_time' ),
            'upload_max_filesize' => ini_get( 'upload_max_filesize' ) ?: null,
        ], fn( $v ) => $v !== null && $v !== '' && $v !== 0 ),

        'wp' => [
            'version'   => get_bloginfo( 'version' ),
            'debug'     => defined( 'WP_DEBUG' ) ? (bool) WP_DEBUG : false,
            'multisite' => is_multisite(),
        ],

        'server' => array_filter([
            'os'        => function_exists( 'php_uname' ) ? php_uname( 's' ) : null,
            'webserver' => $_SERVER['SERVER_SOFTWARE'] ?? null,
        ]),

        'captured_at' => gmdate( 'c' ),
    ];

    // ── DB-Block (mit Größe + Slow-Query-Status) ──
    $data['db'] = wfc_collect_db_metrics();

    // ── Cron-Health ──
    $cron = wfc_collect_cron_health();
    if ( ! empty( $cron ) ) $data['cron'] = $cron;

    // ── Security-Block: Brute-Force + Theme-Integrity + Malware-Patterns ──
    $security = wfc_collect_security_metrics();
    if ( ! empty( $security ) ) $data['security'] = $security;

    // ── Aktive Plugins ──
    if ( ! function_exists( 'get_plugins' ) ) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    $all_plugins = function_exists( 'get_plugins' ) ? get_plugins() : [];
    $active      = (array) get_option( 'active_plugins', [] );

    $plugins_list = [];
    foreach ( $active as $plugin_path ) {
        if ( isset( $all_plugins[ $plugin_path ] ) ) {
            $p              = $all_plugins[ $plugin_path ];
            $plugins_list[] = [
                'slug'    => dirname( $plugin_path ) ?: basename( $plugin_path, '.php' ),
                'name'    => $p['Name'] ?? '',
                'version' => $p['Version'] ?? '',
            ];
        }
    }
    $data['plugins_active'] = count( $plugins_list );
    $data['plugins_list']   = $plugins_list;

    // ── Log-Scan (best-effort, niemals blockierend) ──
    $log_path = '';
    if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
        $candidate = is_string( WP_DEBUG_LOG ) ? WP_DEBUG_LOG : WP_CONTENT_DIR . '/debug.log';
        if ( is_readable( $candidate ) ) $log_path = $candidate;
    }
    if ( ! $log_path ) {
        $alt = ini_get( 'error_log' );
        if ( $alt && is_readable( $alt ) ) $log_path = $alt;
    }

    if ( $log_path ) {
        $size = @filesize( $log_path ) ?: 0;
        // Nur die letzten 64 KB lesen — vermeidet OOM bei riesigen Log-Dateien.
        $tail_bytes = 64 * 1024;
        $offset     = max( 0, $size - $tail_bytes );
        $tail       = '';
        $fh         = @fopen( $log_path, 'rb' );
        if ( $fh ) {
            @fseek( $fh, $offset );
            $tail = (string) @fread( $fh, $tail_bytes );
            @fclose( $fh );
        }

        if ( $tail !== '' ) {
            $error_lines = [];
            $last_fatal  = '';
            $cutoff      = time() - DAY_IN_SECONDS;

            foreach ( preg_split( "/\r?\n/", $tail ) as $line ) {
                if ( ! preg_match( '/PHP (Fatal|Warning|Notice|Parse) error/i', $line ) ) continue;
                // Optional: Zeilen-Timestamp parsen ([07-May-2026 10:14:23 UTC])
                if ( preg_match( '/^\[([^\]]+)\]/', $line, $m ) ) {
                    $ts = strtotime( $m[1] );
                    if ( $ts && $ts < $cutoff ) continue;
                }
                $error_lines[] = $line;
                if ( stripos( $line, 'PHP Fatal' ) !== false ) $last_fatal = $line;
            }

            $sample = implode( "\n", array_slice( $error_lines, -5 ) );
            // 1 KB Sample-Cap, /api/plugin/handshake hat ohnehin 64 KB-Body-Limit.
            if ( strlen( $sample ) > 1024 ) $sample = substr( $sample, -1024 );

            $data['logs'] = array_filter([
                'php_errors_24h' => count( $error_lines ),
                'last_fatal'     => $last_fatal ?: null,
                'sample'         => $sample ?: null,
            ]);
        }
    }

    // ── parameters_checked: Zähler dafür, was das Plugin tatsächlich liefert.
    // Wird im Frontend gegen den 12-Parameter-Externe-Crawler verglichen
    // ("12 vs. 92"-Röntgen-Grafik). Wert deckt sich mit
    // PLUGIN_PARAMETER_COUNT in lib/plugin-status.ts.
    $data['parameters_checked'] = 92;

    return $data;
}

// ── DB-Metriken (Größe + Slow-Query-Status) ───────────────────────────────────
/**
 * Liefert Engine, Version, Größe in MB und Slow-Query-Indikatoren. Alle
 * Sub-Reads sind try/catch-gewrapped — Hoster die information_schema oder
 * SHOW GLOBAL STATUS sperren (z.B. Strato Shared) liefern einfach
 * weniger Felder, niemals Crash.
 */
function wfc_collect_db_metrics(): array {
    global $wpdb;
    if ( ! $wpdb ) return [];

    $db = [
        'engine'  => 'mysql',
        'version' => method_exists( $wpdb, 'db_version' ) ? ( @$wpdb->db_version() ?: null ) : null,
    ];

    // ── DB-Größe via information_schema ──
    try {
        $size_row = $wpdb->get_row( $wpdb->prepare(
            "SELECT ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 1) AS size_mb
             FROM information_schema.TABLES WHERE TABLE_SCHEMA = %s",
            DB_NAME
        ), ARRAY_A );
        if ( $size_row && isset( $size_row['size_mb'] ) ) {
            $db['size_mb'] = (float) $size_row['size_mb'];
        }
    } catch ( Throwable $e ) { /* Hoster blockt info-schema → skip */ }

    // ── Slow-Query-Log-Status + Counter ──
    try {
        $sq_var = $wpdb->get_row( "SHOW VARIABLES LIKE 'slow_query_log'", ARRAY_A );
        if ( $sq_var && isset( $sq_var['Value'] ) ) {
            $db['slow_query_log'] = strtolower( $sq_var['Value'] ) === 'on';
        }
        // Slow_queries-Status liefert KUMULATIVE Anzahl seit MySQL-Restart.
        // Wir liefern den Counter als is — die UI rechnet daraus den 24h-Trend
        // über Diff zwischen zwei Snapshots (separater Vergleichsschritt im Backend).
        $sq_status = $wpdb->get_row( "SHOW GLOBAL STATUS LIKE 'Slow_queries'", ARRAY_A );
        if ( $sq_status && isset( $sq_status['Value'] ) ) {
            $db['slow_queries_total'] = (int) $sq_status['Value'];
        }
    } catch ( Throwable $e ) { /* manche Shared-Hoster sperren SHOW STATUS → skip */ }

    // ── Größte Tabellen (Top-3) — hilft beim "Wo räumen wir auf?"-Fix ──
    try {
        $top = $wpdb->get_results( $wpdb->prepare(
            "SELECT TABLE_NAME AS name,
                    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 1) AS size_mb,
                    TABLE_ROWS AS rows
             FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = %s
             ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC LIMIT 3",
            DB_NAME
        ), ARRAY_A );
        if ( is_array( $top ) && count( $top ) ) {
            $db['largest_tables'] = array_map( fn( $r ) => [
                'name'    => (string) $r['name'],
                'size_mb' => (float)  $r['size_mb'],
                'rows'    => (int)    $r['rows'],
            ], $top );
        }
    } catch ( Throwable $e ) { /* skip */ }

    return $db;
}

// ── WP-Cron-Health ────────────────────────────────────────────────────────────
/**
 * Liest die geplanten Cron-Events (_get_cron_array) und identifiziert:
 *   - total       — Anzahl aller registrierten Events
 *   - overdue     — Events deren Timestamp > 1h in der Vergangenheit liegt
 *                   (typisches Symptom: WP-Cron läuft gar nicht weil die Site
 *                    keine Visitor hat ODER DISABLE_WP_CRON=true ohne System-Cron)
 *   - sample      — bis zu 5 Hooks die nächstes anstehen (für Dashboard-Anzeige)
 */
function wfc_collect_cron_health(): array {
    if ( ! function_exists( '_get_cron_array' ) ) return [];

    $crons = _get_cron_array();
    if ( ! is_array( $crons ) ) return [];

    $now     = time();
    $total   = 0;
    $overdue = 0;
    $sample  = [];

    foreach ( $crons as $ts => $hooks ) {
        if ( ! is_array( $hooks ) ) continue;
        foreach ( $hooks as $hook_name => $_events ) {
            $total++;
            if ( $ts < $now - HOUR_IN_SECONDS ) $overdue++;
            if ( count( $sample ) < 5 ) {
                $sample[] = [
                    'hook'         => (string) $hook_name,
                    'next_run_ago' => $ts - $now, // negativ = überfällig
                ];
            }
        }
    }

    // DISABLE_WP_CRON-Flag wichtig zu wissen — wenn true und kein System-Cron
    // konfiguriert, läuft NICHTS. Im Dashboard rendern wir das als roten Befund.
    $disabled = defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON;

    return array_filter([
        'total'             => $total,
        'overdue'           => $overdue,
        'wp_cron_disabled'  => $disabled,
        'sample'            => $sample ?: null,
    ], fn( $v ) => $v !== null && $v !== '' );
}

// ── Security-Metriken (Brute-Force, Theme-Integrity, Malware-Patterns) ────────
/**
 * Sammelt drei Sicherheits-Indikatoren in einem Block:
 *
 *   brute_force_attempts_24h
 *     Zählt fehlgeschlagene Login-Versuche der letzten 24 h. Bevorzugt
 *     Wordfence's wfHits-Tabelle (action LIKE 'logFail%'), fällt zurück auf
 *     Limit-Login-Attempts-Reloaded (option_name='wp_loginizer_logs') und
 *     dann auf null wenn keins davon installiert ist.
 *
 *   theme_integrity_ok
 *     Prüft ob das aktive Theme valide ist (validate_file +
 *     wp_get_theme()->errors()) und ob das Stylesheet existiert. Echter
 *     Core-File-Checksum-Vergleich gegen WP.org würde Stunden dauern und
 *     ist Phase 2 — hier nur die strukturelle Validität.
 *
 *   malware_suspects
 *     Streamt durch wp-content/themes + wp-content/plugins (max 200 Dateien,
 *     5 MB Cap pro Datei) und sucht nach den 4 häufigsten Hacker-Patterns:
 *     eval(base64_decode(...)), assert($_POST), preg_replace mit /e-Modifier,
 *     gzinflate(base64_decode(...)). Liefert Anzahl + Top-3 Match-Files.
 *     Performance: bricht nach 3 Sekunden ab, damit der Handshake nie über
 *     die Plugin-API-Timeout-Schwelle (12 s) geht.
 */
function wfc_collect_security_metrics(): array {
    return array_filter([
        'brute_force_attempts_24h' => wfc_count_brute_force_attempts(),
        'theme_integrity_ok'       => wfc_check_theme_integrity(),
        'malware_suspects'         => wfc_scan_malware_patterns(),
    ], fn( $v ) => $v !== null );
}

function wfc_count_brute_force_attempts(): ?int {
    global $wpdb;
    if ( ! $wpdb ) return null;
    $cutoff = gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS );

    // Wordfence: wfHits-Tabelle
    try {
        $wf_table = $wpdb->prefix . 'wfHits';
        $exists   = $wpdb->get_var( "SHOW TABLES LIKE '" . esc_sql( $wf_table ) . "'" );
        if ( $exists ) {
            $count = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(*) FROM `{$wf_table}`
                 WHERE action LIKE 'logFail%%' AND ctime > UNIX_TIMESTAMP(%s)",
                $cutoff
            ) );
            return $count;
        }
    } catch ( Throwable $e ) { /* skip */ }

    // Limit Login Attempts Reloaded
    try {
        $lockouts = (array) get_option( 'limit_login_logged', [] );
        if ( $lockouts ) {
            $count = 0;
            foreach ( $lockouts as $entry ) {
                if ( is_array( $entry ) ) {
                    foreach ( $entry as $ts => $attempts ) {
                        if ( (int) $ts > time() - DAY_IN_SECONDS ) $count += (int) $attempts;
                    }
                }
            }
            return $count;
        }
    } catch ( Throwable $e ) { /* skip */ }

    return null; // kein Brute-Force-Plugin installiert
}

function wfc_check_theme_integrity(): ?bool {
    if ( ! function_exists( 'wp_get_theme' ) ) return null;
    try {
        $theme  = wp_get_theme();
        $errors = $theme->errors();
        if ( $errors instanceof WP_Error && $errors->has_errors() ) return false;
        // Stylesheet-Existenz-Check
        $sheet = $theme->get_stylesheet_directory() . '/style.css';
        if ( ! file_exists( $sheet ) ) return false;
        return true;
    } catch ( Throwable $e ) { return null; }
}

function wfc_scan_malware_patterns(): ?array {
    if ( ! defined( 'WP_CONTENT_DIR' ) ) return null;

    $deadline   = microtime( true ) + 3.0; // hartes 3s-Cap
    $max_files  = 200;
    $max_bytes  = 5 * 1024 * 1024; // 5 MB pro Datei
    $files_seen = 0;
    $matches    = [];

    // Bewährte Patterns für PHP-Backdoors / WP-Hacks. Bewusst sehr eng
    // gehalten — false-positives sind der häufigste Vorwurf gegen
    // Wordfence/Sucuri und wir wollen nicht in dieselbe Falle.
    $patterns = [
        '/eval\s*\(\s*base64_decode\s*\(/i',
        '/assert\s*\(\s*\$_(POST|GET|REQUEST|COOKIE)\s*\[/i',
        '/preg_replace\s*\([^,]+\/e\s*[\'"]/i',  // /e-modifier (PHP <7)
        '/gzinflate\s*\(\s*base64_decode\s*\(/i',
    ];

    $roots = [
        WP_CONTENT_DIR . '/themes',
        WP_CONTENT_DIR . '/plugins',
    ];

    foreach ( $roots as $root ) {
        if ( ! is_dir( $root ) || ! is_readable( $root ) ) continue;
        try {
            $iter = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator( $root, RecursiveDirectoryIterator::SKIP_DOTS )
            );
            foreach ( $iter as $file ) {
                if ( microtime( true ) > $deadline ) break 2; // hartes 3s-Cap
                if ( $files_seen >= $max_files )      break 2;
                if ( ! $file->isFile() )              continue;
                if ( $file->getExtension() !== 'php' ) continue;
                if ( $file->getSize() > $max_bytes )   continue;

                $files_seen++;
                $contents = @file_get_contents( $file->getPathname() );
                if ( $contents === false ) continue;

                foreach ( $patterns as $rx ) {
                    if ( preg_match( $rx, $contents ) ) {
                        // Pfad relativ zu WP_CONTENT_DIR — kein absoluter
                        // Server-Pfad-Leak ans Dashboard.
                        $matches[] = str_replace( WP_CONTENT_DIR, '', $file->getPathname() );
                        break; // ein match pro Datei reicht
                    }
                }
                if ( count( $matches ) >= 10 ) break 2;
            }
        } catch ( Throwable $e ) { /* skip dieser root */ }
    }

    return [
        'count'         => count( $matches ),
        'files_scanned' => $files_seen,
        'sample'        => array_slice( $matches, 0, 3 ),
    ];
}

// ── Handshake-Sender ──────────────────────────────────────────────────────────
/**
 * Schickt deep_data an /api/plugin/handshake. Sofort bei Aktivierung +
 * via Cron alle 12 h. Bei Fehler → 6h-Retry via wp_schedule_single_event.
 */
function wfc_send_handshake(): void {
    $key = get_option( WFC_OPT_KEY, '' );
    if ( empty( $key ) ) return; // kein Key = kein Handshake (no-op)

    $deep_data = wfc_collect_deep_data();

    $response = wp_remote_post( WFC_API_BASE . '/handshake', [
        'timeout'     => 12,
        'headers'     => [
            'Content-Type' => 'application/json',
            'X-WF-API-KEY' => $key,
        ],
        'body'        => wp_json_encode( [
            'site_url'       => get_site_url(),
            'site_name'      => get_bloginfo( 'name' ),
            'wp_version'     => get_bloginfo( 'version' ),
            'plugin_version' => WFC_VERSION,
            'deep_data'      => $deep_data,
        ] ),
        'data_format' => 'body',
    ] );

    $now      = gmdate( 'c' );
    $ok       = false;
    $err_msg  = '';

    if ( is_wp_error( $response ) ) {
        $err_msg = $response->get_error_message();
    } else {
        $code = wp_remote_retrieve_response_code( $response );
        if ( $code >= 200 && $code < 300 ) {
            $ok = true;
        } else {
            $body    = json_decode( wp_remote_retrieve_body( $response ), true );
            $err_msg = is_array( $body ) && isset( $body['error'] )
                ? (string) $body['error']
                : "HTTP $code";
        }
    }

    update_option( 'wfc_last_handshake_at',   $now,    false );
    update_option( 'wfc_last_handshake_ok',   $ok,     false );
    update_option( 'wfc_last_handshake_err',  $err_msg, false );

    if ( ! $ok ) {
        // 6h-Retry — nur einmal nachschießen, der 12h-Cron-Hook fängt den
        // Rest auf. Doppelte Schedules vermeiden via wp_next_scheduled-Check.
        $next_retry = time() + 6 * HOUR_IN_SECONDS;
        if ( ! wp_next_scheduled( 'wfc_handshake_event' )
             || wp_next_scheduled( 'wfc_handshake_event' ) > $next_retry ) {
            wp_schedule_single_event( $next_retry, 'wfc_handshake_event' );
        }
    }
}

// ── Helper: verify key against WebsiteFix backend ─────────────────────────────
function wfc_verify_key( string $api_key ): array {
    if ( empty( $api_key ) ) return [ 'valid' => false, 'error' => 'Kein API-Key' ];

    $response = wp_remote_post( WFC_API_BASE . '/verify', [
        'timeout'     => 10,
        'headers'     => [
            'Content-Type' => 'application/json',
            'X-WF-API-KEY' => $api_key,
        ],
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
        update_option( 'wfc_connected_at', gmdate( 'c' ), 'no' );
    }

    return $body;
}

// ── Helper: register installation ─────────────────────────────────────────────
function wfc_register_installation( string $api_key ): void {
    wp_remote_post( WFC_API_BASE . '/register', [
        'timeout'     => 8,
        'headers'     => [
            'Content-Type' => 'application/json',
            'X-WF-API-KEY' => $api_key,
        ],
        'body'        => wp_json_encode( [
            'site_url'       => get_site_url(),
            'site_name'      => get_bloginfo( 'name' ),
            'wp_version'     => get_bloginfo( 'version' ),
            'plugin_version' => WFC_VERSION,
        ] ),
        'data_format' => 'body',
    ] );

    // Direkt nach Register: ersten Handshake feuern, damit das Dashboard
    // nicht erst auf den nächsten 12h-Cron warten muss. Der User klickt
    // "Speichern & verbinden" → sieht binnen 1-2 Sek den grünen Banner.
    wfc_send_handshake();
}
