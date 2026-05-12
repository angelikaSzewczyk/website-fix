<?php
/**
 * Uninstall-Routine — wird aufgerufen, wenn der User das Plugin permanent
 * löscht ("Delete" im Plugins-Bildschirm, nicht "Deactivate").
 *
 * Räumt alle mu-plugin-Dateien auf, die wir geschrieben haben — sowohl
 * die neuen flachen Files (wf-optimizer-<slug>.php direkt unter
 * mu-plugins/) als auch die Legacy-Files aus v0.1.0, die noch im
 * wf-optimizer/-Unterordner liegen könnten.
 *
 * Plus: Optionen aufräumen.
 *
 * Alle lokalen Variablen mit $wfoco_-Präfix, um WP.org Plugin-Check
 * Global-Variable-Naming-Convention zu erfüllen.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

if ( ! defined( 'WFOCO_OPTION_KEY' ) ) {
    define( 'WFOCO_OPTION_KEY', 'wfoco_active_fixes' );
}
if ( ! defined( 'WFOCO_FILE_PREFIX' ) ) {
    define( 'WFOCO_FILE_PREFIX', 'wf-optimizer-' );
}
if ( ! defined( 'WPMU_PLUGIN_DIR' ) ) {
    define( 'WPMU_PLUGIN_DIR', WP_CONTENT_DIR . '/mu-plugins' );
}

$wfoco_marker = 'WebsiteFix One-Click Optimizer';

// WP_Filesystem initialisieren
if ( ! function_exists( 'WP_Filesystem' ) ) {
    require_once ABSPATH . 'wp-admin/includes/file.php';
}
global $wp_filesystem;
WP_Filesystem();

// ── 1. Flache Files unter mu-plugins/ mit wf-optimizer-Präfix ──────────
if ( $wp_filesystem && $wp_filesystem->is_dir( WPMU_PLUGIN_DIR ) ) {
    $wfoco_flat_files = glob( WPMU_PLUGIN_DIR . '/' . WFOCO_FILE_PREFIX . '*.php' );
    if ( is_array( $wfoco_flat_files ) ) {
        foreach ( $wfoco_flat_files as $wfoco_file ) {
            // Marker-Check: nur löschen, wenn die Datei wirklich von uns ist.
            $wfoco_contents = $wp_filesystem->get_contents( $wfoco_file );
            if ( $wfoco_contents && strpos( $wfoco_contents, $wfoco_marker ) !== false ) {
                wp_delete_file( $wfoco_file );
            }
        }
    }
}

// ── 2. Legacy: v0.1.0-Files im wf-optimizer/-Unterordner ───────────────
$wfoco_legacy_dir = trailingslashit( WPMU_PLUGIN_DIR ) . 'wf-optimizer';
if ( $wp_filesystem && $wp_filesystem->is_dir( $wfoco_legacy_dir ) ) {
    $wfoco_legacy_files = glob( $wfoco_legacy_dir . '/*.php' );
    if ( is_array( $wfoco_legacy_files ) ) {
        foreach ( $wfoco_legacy_files as $wfoco_file ) {
            $wfoco_contents = $wp_filesystem->get_contents( $wfoco_file );
            if ( $wfoco_contents && strpos( $wfoco_contents, $wfoco_marker ) !== false ) {
                wp_delete_file( $wfoco_file );
            }
        }
    }
    // Leeren Ordner via WP_Filesystem entfernen
    $wfoco_remaining = glob( $wfoco_legacy_dir . '/*' );
    if ( is_array( $wfoco_remaining ) && count( $wfoco_remaining ) === 0 ) {
        $wp_filesystem->rmdir( $wfoco_legacy_dir );
    }
}

// ── 3. Optionen ────────────────────────────────────────────────────────
delete_option( WFOCO_OPTION_KEY );
