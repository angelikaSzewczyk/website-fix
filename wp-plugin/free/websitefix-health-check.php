<?php
/**
 * Plugin Name:       WebsiteFix Health Check & Deep Audit
 * Plugin URI:        https://website-fix.com
 * Description:       5 Kennzahlen, die zeigen wo dein Hoster bremst: Server-Response (TTFB), Heartbeat-API-Last, Datenbank-Größe + Bloat-Tabelle, PHP-Memory-Auslastung, Update-Backlog. Read-Only — keine Schreibzugriffe auf Dateisystem oder Datenbank. Für den vollständigen 92-Punkt-Deep-Audit (DB-Bloat, PHP-Error-Trace, Hook-Chain-Analyse): WebsiteFix.com.
 * Version:           0.3.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            WebsiteFix
 * Author URI:        https://website-fix.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       websitefix-health-check
 */

// Direct File Access verhindern (WordPress-Konvention)
defined( 'ABSPATH' ) || exit;

// ── Konstanten ─────────────────────────────────────────────────────────────
define( 'WFHC_VERSION',  '0.3.0' );
define( 'WFHC_SLUG',     'websitefix-health-check' );
define( 'WFHC_BASEURL',  'https://website-fix.com' );
define( 'WFHC_UTM',      '?utm_source=wp-plugin&utm_medium=marketplace&utm_campaign=health-check' );
// Lead-Capture-Landingpage statt direktem /scan-Sprung — leitet User durch
// die Email-Wall, sodass wir den Plugin-Kanal sauber tracken können.
define( 'WFHC_REPORT_PATH', '/plugin-report' );
define( 'WFHC_PATH',     plugin_dir_path( __FILE__ ) );

// ── Includes ───────────────────────────────────────────────────────────────
require_once WFHC_PATH . 'includes/class-quick-check.php';
require_once WFHC_PATH . 'includes/class-dashboard-widget.php';

// ── Activation / Deactivation ──────────────────────────────────────────────
register_activation_hook( __FILE__, 'wfhc_activate' );
register_deactivation_hook( __FILE__, 'wfhc_deactivate' );

/**
 * Activation-Hook. Wir setzen keinen DB-Eintrag und keine Cron-Jobs —
 * das Plugin ist Read-Only und stateless. Einziger Side-Effect:
 * Plugin meldet sich beim ersten Aufruf an seine eigene Telemetry-URL
 * für Install-Counter (anonyme Aggregat-Statistik, kein PII). Sprint 4.
 */
function wfhc_activate() {
    // Sprint 1: keine Aktionen nötig — wir merken uns nicht mal das Aktivierungs-
    // Datum. Read-Only-Versprechen heißt: wir berühren die DB nicht.
}

/**
 * Deactivation-Hook. Da wir nichts geschrieben haben, ist auch nichts
 * aufzuräumen.
 */
function wfhc_deactivate() {
    // No-op — siehe wfhc_activate().
}

// ── Dashboard-Widget registrieren ──────────────────────────────────────────
add_action( 'wp_dashboard_setup', 'wfhc_register_dashboard_widget' );

function wfhc_register_dashboard_widget() {
    // Nur User mit manage_options-Capability (Admins) bekommen das Widget.
    // Editoren / Autoren sehen es nicht — Health-Check ist Admin-Aufgabe.
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }

    wp_add_dashboard_widget(
        WFHC_SLUG . '-widget',
        __( 'WebsiteFix · Health Check & Deep Audit', 'websitefix-health-check' ),
        array( 'WFHC_Dashboard_Widget', 'render' )
    );
}
