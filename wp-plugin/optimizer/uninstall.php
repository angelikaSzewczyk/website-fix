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

// ── 1. Flache Files unter mu-plugins/ mit wf-optimizer-Präfix ──────────
if ( is_dir( WPMU_PLUGIN_DIR ) ) {
    $flat_files = glob( WPMU_PLUGIN_DIR . '/' . WFOCO_FILE_PREFIX . '*.php' );
    if ( is_array( $flat_files ) ) {
        foreach ( $flat_files as $file ) {
            // Marker-Check: nur löschen, wenn die Datei wirklich von uns ist.
            $contents = @file_get_contents( $file );
            if ( $contents && strpos( $contents, $wfoco_marker ) !== false ) {
                @unlink( $file );
            }
        }
    }
}

// ── 2. Legacy: v0.1.0-Files im wf-optimizer/-Unterordner ───────────────
$legacy_dir = trailingslashit( WPMU_PLUGIN_DIR ) . 'wf-optimizer';
if ( is_dir( $legacy_dir ) ) {
    $legacy_files = glob( $legacy_dir . '/*.php' );
    if ( is_array( $legacy_files ) ) {
        foreach ( $legacy_files as $file ) {
            $contents = @file_get_contents( $file );
            if ( $contents && strpos( $contents, $wfoco_marker ) !== false ) {
                @unlink( $file );
            }
        }
    }
    if ( count( glob( $legacy_dir . '/*' ) ?: array() ) === 0 ) {
        @rmdir( $legacy_dir );
    }
}

// ── 3. Optionen ────────────────────────────────────────────────────────
delete_option( WFOCO_OPTION_KEY );
