<?php
/**
 * Plugin Name:       WebsiteFix One-Click Performance Optimizer
 * Plugin URI:        https://website-fix.com/plugin
 * Description:       Aktiviere 7 kuratierte WordPress-Performance- und Security-Fixes mit einem Klick: Heartbeat drosseln, XML-RPC abschalten, Emojis & oEmbed entfernen, Query-Strings strippen, jQuery-Migrate aus dem Frontend werfen, Author-Archive blockieren, WordPress-Version verstecken. Jeder Fix kommt mit Safety-Check + sofortiger Rückgängig-Möglichkeit.
 * Version:           0.3.1
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            WebsiteFix
 * Author URI:        https://website-fix.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       websitefix-one-click-performance-optimizer
 */

defined( 'ABSPATH' ) || exit;

// ── Konstanten ─────────────────────────────────────────────────────────────
define( 'WFOCO_VERSION',     '0.3.1' );
define( 'WFOCO_SLUG',        'websitefix-one-click-performance-optimizer' );
define( 'WFOCO_PATH',        plugin_dir_path( __FILE__ ) );
define( 'WFOCO_URL',         plugin_dir_url( __FILE__ ) );
define( 'WFOCO_OPTION_KEY',  'wfoco_active_fixes' ); // Array of active slugs
define( 'WFOCO_FILE_PREFIX', 'wf-optimizer-' );      // Präfix für unsere mu-plugin-Files

// WordPress lädt mu-plugins NUR flach aus WPMU_PLUGIN_DIR — Subfolder werden
// ignoriert (siehe wp_get_mu_plugins() in wp-includes/load.php). Deshalb
// schreiben wir flach mit Präfix, statt in einen Unterordner.
if ( ! defined( 'WPMU_PLUGIN_DIR' ) ) {
    define( 'WPMU_PLUGIN_DIR', WP_CONTENT_DIR . '/mu-plugins' );
}
// LEGACY: v0.1.0 hat in diesen Unterordner geschrieben — Uninstall räumt ihn
// noch auf, damit Upgrader keine Reste-Dateien behalten.
define( 'WFOCO_LEGACY_MU_DIR', trailingslashit( WPMU_PLUGIN_DIR ) . 'wf-optimizer' );

// ── Includes ───────────────────────────────────────────────────────────────
require_once WFOCO_PATH . 'includes/class-snippet-library.php';
require_once WFOCO_PATH . 'includes/class-optimizer.php';
require_once WFOCO_PATH . 'includes/class-diagnostics.php';
require_once WFOCO_PATH . 'includes/class-admin-page.php';

// ── Activation ─────────────────────────────────────────────────────────────
register_activation_hook( __FILE__, 'wfoco_activate' );

function wfoco_activate() {
    // mu-plugins-Verzeichnis sicherstellen — bei vielen WP-Installs existiert
    // es noch nicht, weil noch nie ein mu-plugin angelegt wurde. wp_mkdir_p
    // legt es bei Schreibrechten auf wp-content/ automatisch an.
    if ( ! file_exists( WPMU_PLUGIN_DIR ) ) {
        @wp_mkdir_p( WPMU_PLUGIN_DIR );
    }

    // Optionen mit leerer Liste vorbelegen, autoload=no für niedrige Memory-
    // Last (wird erst beim Admin-Page-Aufruf geladen).
    if ( false === get_option( WFOCO_OPTION_KEY ) ) {
        add_option( WFOCO_OPTION_KEY, array(), '', 'no' );
    }
}

// ── Deactivation ───────────────────────────────────────────────────────────
// Wir entfernen NICHT die mu-plugin-Dateien bei Deactivation — der User
// hat die Fixes bewusst aktiviert, sie sollen weiterlaufen. Wenn der User
// das Plugin wirklich aufräumen will, nutzt er Uninstall.
register_deactivation_hook( __FILE__, 'wfoco_deactivate' );

function wfoco_deactivate() {
    // Keine Aktion — Fixes bleiben aktiv, User-Entscheidung.
}

// ── Uninstall ──────────────────────────────────────────────────────────────
// register_uninstall_hook funktioniert nicht zuverlässig für statische
// Funktionen aus dem Plugin-File — daher zusätzlich eine uninstall.php
// im Plugin-Root (siehe gleichnamige Datei). Hier dokumentieren wir nur
// den Aufruf-Pfad.
register_uninstall_hook( __FILE__, 'wfoco_uninstall' );

function wfoco_uninstall() {
    // Alle aktivierten Fixes entfernen + Optionen aufräumen.
    if ( class_exists( 'WFOCO_Optimizer' ) ) {
        WFOCO_Optimizer::revert_all();
    }
    delete_option( WFOCO_OPTION_KEY );

    // Legacy: wf-optimizer/-Unterordner aus v0.1.0 entfernen, falls vorhanden.
    // Wird über WP_Filesystem-API gemacht (WP.org-Konformität).
    if ( ! function_exists( 'WP_Filesystem' ) ) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
    }
    global $wp_filesystem;
    WP_Filesystem();
    if ( $wp_filesystem && $wp_filesystem->is_dir( WFOCO_LEGACY_MU_DIR ) ) {
        $wfoco_legacy_files = glob( WFOCO_LEGACY_MU_DIR . '/*.php' );
        if ( is_array( $wfoco_legacy_files ) ) {
            foreach ( $wfoco_legacy_files as $wfoco_file ) {
                wp_delete_file( $wfoco_file );
            }
        }
        $wfoco_remaining = glob( WFOCO_LEGACY_MU_DIR . '/*' );
        if ( is_array( $wfoco_remaining ) && count( $wfoco_remaining ) === 0 ) {
            $wp_filesystem->rmdir( WFOCO_LEGACY_MU_DIR );
        }
    }
}

// ── Admin-Page registrieren ─────────────────────────────────────────────────
add_action( 'admin_menu', array( 'WFOCO_Admin_Page', 'register' ) );
add_action( 'admin_enqueue_scripts', array( 'WFOCO_Admin_Page', 'enqueue_assets' ) );
add_action( 'admin_post_wfoco_apply',  array( 'WFOCO_Admin_Page', 'handle_apply' ) );
add_action( 'admin_post_wfoco_revert', array( 'WFOCO_Admin_Page', 'handle_revert' ) );

// ── Plugin-Listing-Action-Link ──────────────────────────────────────────────
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'wfoco_action_links' );

function wfoco_action_links( $links ) {
    $settings_url = admin_url( 'tools.php?page=' . WFOCO_SLUG );
    array_unshift( $links, '<a href="' . esc_url( $settings_url ) . '">' . esc_html__( 'Einstellungen', 'websitefix-one-click-performance-optimizer' ) . '</a>' );
    return $links;
}
