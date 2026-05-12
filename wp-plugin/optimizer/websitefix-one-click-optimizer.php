<?php
/**
 * Plugin Name:       WebsiteFix One-Click Performance Optimizer
 * Plugin URI:        https://website-fix.com/plugin
 * Description:       Aktiviere 5 kuratierte WordPress-Performance-Fixes mit einem Klick: Heartbeat drosseln, XML-RPC abschalten, Emojis & oEmbed entfernen, Query-Strings strippen, jQuery-Migrate aus dem Frontend werfen. Jeder Fix kommt mit Safety-Check + sofortiger Rückgängig-Möglichkeit.
 * Version:           0.1.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            WebsiteFix
 * Author URI:        https://website-fix.com
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       websitefix-one-click-optimizer
 */

defined( 'ABSPATH' ) || exit;

// ── Konstanten ─────────────────────────────────────────────────────────────
define( 'WFOCO_VERSION',     '0.1.0' );
define( 'WFOCO_SLUG',        'websitefix-one-click-optimizer' );
define( 'WFOCO_PATH',        plugin_dir_path( __FILE__ ) );
define( 'WFOCO_URL',         plugin_dir_url( __FILE__ ) );
define( 'WFOCO_OPTION_KEY',  'wfoco_active_fixes' ); // Array of active slugs
define( 'WFOCO_MU_SUBDIR',   'wf-optimizer' );       // Unter-Ordner in /mu-plugins/

// Pfad zum mu-plugins/wf-optimizer/-Ordner, in dem wir unsere Fix-Dateien
// ablegen. WPMU_PLUGIN_DIR ist seit WP 3.0 immer definiert — Standard ist
// WP_CONTENT_DIR . '/mu-plugins'. Falls in wp-config überschrieben, greifen
// wir die User-Konstante korrekt.
if ( ! defined( 'WPMU_PLUGIN_DIR' ) ) {
    define( 'WPMU_PLUGIN_DIR', WP_CONTENT_DIR . '/mu-plugins' );
}
define( 'WFOCO_MU_DIR', trailingslashit( WPMU_PLUGIN_DIR ) . WFOCO_MU_SUBDIR );

// ── Includes ───────────────────────────────────────────────────────────────
require_once WFOCO_PATH . 'includes/class-snippet-library.php';
require_once WFOCO_PATH . 'includes/class-optimizer.php';
require_once WFOCO_PATH . 'includes/class-diagnostics.php';
require_once WFOCO_PATH . 'includes/class-admin-page.php';

// ── Activation ─────────────────────────────────────────────────────────────
register_activation_hook( __FILE__, 'wfoco_activate' );

function wfoco_activate() {
    // mu-plugins/wf-optimizer/-Verzeichnis anlegen, falls noch nicht da.
    // Schreibrechte testen wir aktiv — bei Failed-Permission soll User es
    // wissen, bevor er einen Fix aktiviert.
    if ( ! file_exists( WFOCO_MU_DIR ) ) {
        @wp_mkdir_p( WFOCO_MU_DIR );
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

    // mu-plugins/wf-optimizer/-Ordner entfernen, falls leer.
    if ( is_dir( WFOCO_MU_DIR ) && count( glob( WFOCO_MU_DIR . '/*' ) ?: array() ) === 0 ) {
        @rmdir( WFOCO_MU_DIR );
    }
}

// ── Admin-Page registrieren ─────────────────────────────────────────────────
add_action( 'admin_menu', array( 'WFOCO_Admin_Page', 'register' ) );
add_action( 'admin_post_wfoco_apply',  array( 'WFOCO_Admin_Page', 'handle_apply' ) );
add_action( 'admin_post_wfoco_revert', array( 'WFOCO_Admin_Page', 'handle_revert' ) );

// ── Plugin-Listing-Action-Link ──────────────────────────────────────────────
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'wfoco_action_links' );

function wfoco_action_links( $links ) {
    $settings_url = admin_url( 'tools.php?page=' . WFOCO_SLUG );
    array_unshift( $links, '<a href="' . esc_url( $settings_url ) . '">' . esc_html__( 'Einstellungen', 'websitefix-one-click-optimizer' ) . '</a>' );
    return $links;
}
