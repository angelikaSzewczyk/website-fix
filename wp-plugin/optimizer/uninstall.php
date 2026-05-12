<?php
/**
 * Uninstall-Routine — wird aufgerufen, wenn der User das Plugin permanent
 * löscht ("Delete" im Plugins-Bildschirm, nicht "Deactivate").
 *
 * Räumt alle aktiven mu-plugin-Dateien auf, die wir geschrieben haben,
 * und löscht die Optionen. Das ist die einzige Stelle, an der wir Fixes
 * automatisch revert-en — bei Deactivation bleiben sie aktiv.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

// Diese Konstanten brauchen wir, weil das Plugin nicht mehr geladen ist.
if ( ! defined( 'WFOCO_OPTION_KEY' ) ) {
    define( 'WFOCO_OPTION_KEY', 'wfoco_active_fixes' );
}
if ( ! defined( 'WFOCO_MU_SUBDIR' ) ) {
    define( 'WFOCO_MU_SUBDIR', 'wf-optimizer' );
}
if ( ! defined( 'WPMU_PLUGIN_DIR' ) ) {
    define( 'WPMU_PLUGIN_DIR', WP_CONTENT_DIR . '/mu-plugins' );
}
$wfoco_mu_dir = trailingslashit( WPMU_PLUGIN_DIR ) . WFOCO_MU_SUBDIR;

// Alle Dateien im wf-optimizer/-Ordner löschen (nur Dateien, die WIR
// geschrieben haben — keine Anderen, kein Recursive).
if ( is_dir( $wfoco_mu_dir ) ) {
    $files = glob( $wfoco_mu_dir . '/*.php' );
    if ( is_array( $files ) ) {
        foreach ( $files as $file ) {
            // Sicherheits-Check: Datei-Header muss unseren Marker enthalten.
            $contents = @file_get_contents( $file );
            if ( $contents && strpos( $contents, 'WebsiteFix One-Click Optimizer' ) !== false ) {
                @unlink( $file );
            }
        }
    }
    // Ordner entfernen, falls leer.
    if ( count( glob( $wfoco_mu_dir . '/*' ) ?: array() ) === 0 ) {
        @rmdir( $wfoco_mu_dir );
    }
}

// Optionen aufräumen.
delete_option( WFOCO_OPTION_KEY );
