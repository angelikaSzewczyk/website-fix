<?php
/**
 * WFOCO_Optimizer — Apply/Revert-Engine.
 *
 * Schreibt einen Fix als mu-plugin-Datei nach
 * /wp-content/mu-plugins/wf-optimizer-<slug>.php. WordPress lädt mu-plugins
 * automatisch (vor regulären Plugins, ohne Activation), daher greift der
 * Fix sofort nach dem Schreiben — kein Reload-Workaround nötig.
 *
 * Nutzt die WP_Filesystem-API (put_contents/delete/is_writable/rmdir)
 * statt direkter PHP-Filesystem-Calls — WP.org Plugin-Check-Konformität.
 * Berechtigungs-Checks (manage_options) liegen im Admin-Page-Handler,
 * NICHT hier — dieser Layer ist pure I/O.
 */

defined( 'ABSPATH' ) || exit;

class WFOCO_Optimizer {

    /**
     * Singleton-Helper: holt das WP_Filesystem-Instance.
     * Initialisiert es lazy beim ersten Aufruf — admin-include-Pfad
     * muss explizit geladen werden, weil unsere Apply-Handler im
     * admin-post.php-Kontext laufen, wo WP_Filesystem nicht garantiert
     * vorinitialisiert ist.
     *
     * @return WP_Filesystem_Base|false
     */
    private static function fs() {
        global $wp_filesystem;
        if ( ! function_exists( 'WP_Filesystem' ) ) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        if ( ! $wp_filesystem ) {
            WP_Filesystem();
        }
        return $wp_filesystem ?: false;
    }

    /**
     * Aktiviert einen Fix: schreibt die mu-plugin-Datei + trägt in Optionen ein.
     *
     * @return array{ ok: bool, message: string }
     */
    public static function apply( $slug ) {
        $snippet = WFOCO_Snippet_Library::get( $slug );
        if ( ! $snippet ) {
            return array( 'ok' => false, 'message' => sprintf(
                /* translators: %s: snippet slug */
                __( 'Snippet "%s" nicht gefunden.', 'websitefix-one-click-optimizer' ),
                $slug
            ) );
        }

        // mu-plugins/ sicherstellen (flach, kein Subfolder — WordPress lädt
        // nur direkt unter WPMU_PLUGIN_DIR liegende .php-Files)
        if ( ! self::ensure_mu_dir() ) {
            return array( 'ok' => false, 'message' => sprintf(
                /* translators: %s: path to mu-plugins directory */
                __( 'Verzeichnis %s konnte nicht angelegt werden. Bitte Schreibrechte auf wp-content/mu-plugins/ prüfen.', 'websitefix-one-click-optimizer' ),
                WPMU_PLUGIN_DIR
            ) );
        }

        $target  = self::file_path( $slug );
        $content = WFOCO_Snippet_Library::build_file_content( $snippet );

        $fs = self::fs();
        if ( ! $fs ) {
            return array( 'ok' => false, 'message' => __( 'WP_Filesystem konnte nicht initialisiert werden.', 'websitefix-one-click-optimizer' ) );
        }

        // put_contents() schreibt atomar genug — kein separater tmp+rename
        // Pattern nötig, weil WP_Filesystem keine native atomic-rename-API
        // hat und put_contents bei moderner PHP-Filesystem-Layer ohnehin
        // intern als single fopen/fwrite läuft.
        $ok = $fs->put_contents( $target, $content, FS_CHMOD_FILE );
        if ( ! $ok ) {
            return array( 'ok' => false, 'message' => sprintf(
                /* translators: %s: target file path */
                __( 'Konnte %s nicht schreiben. Schreibrechte fehlen?', 'websitefix-one-click-optimizer' ),
                $target
            ) );
        }

        // Optionen aktualisieren
        $active = self::get_active();
        if ( ! in_array( $slug, $active, true ) ) {
            $active[] = $slug;
            update_option( WFOCO_OPTION_KEY, $active, 'no' );
        }

        return array( 'ok' => true, 'message' => sprintf(
            /* translators: %s: snippet title */
            __( '✓ "%s" aktiviert.', 'websitefix-one-click-optimizer' ),
            $snippet['title']
        ) );
    }

    /**
     * Deaktiviert einen Fix: löscht die mu-plugin-Datei + entfernt aus Optionen.
     *
     * @return array{ ok: bool, message: string }
     */
    public static function revert( $slug ) {
        $snippet = WFOCO_Snippet_Library::get( $slug );
        if ( ! $snippet ) {
            return array( 'ok' => false, 'message' => sprintf(
                /* translators: %s: snippet slug */
                __( 'Snippet "%s" nicht gefunden.', 'websitefix-one-click-optimizer' ),
                $slug
            ) );
        }

        $target = self::file_path( $slug );
        $fs     = self::fs();
        if ( ! $fs ) {
            return array( 'ok' => false, 'message' => __( 'WP_Filesystem konnte nicht initialisiert werden.', 'websitefix-one-click-optimizer' ) );
        }

        if ( $fs->exists( $target ) ) {
            // Sicherheits-Check: Datei muss unseren Marker enthalten,
            // sonst löschen wir sie NICHT (User könnte was Eigenes da
            // abgelegt haben mit demselben Slug-Präfix).
            $contents = $fs->get_contents( $target );
            if ( false === $contents || strpos( $contents, 'WebsiteFix One-Click Optimizer' ) === false ) {
                return array( 'ok' => false, 'message' => sprintf(
                    /* translators: %s: file path */
                    __( 'Datei %s gehört nicht zum Optimizer — wird nicht angerührt.', 'websitefix-one-click-optimizer' ),
                    $target
                ) );
            }
            // wp_delete_file ist der WP.org-empfohlene Delete-Pfad.
            wp_delete_file( $target );
            if ( $fs->exists( $target ) ) {
                return array( 'ok' => false, 'message' => sprintf(
                    /* translators: %s: file path */
                    __( 'Konnte %s nicht löschen. Schreibrechte?', 'websitefix-one-click-optimizer' ),
                    $target
                ) );
            }
        }

        // Optionen aktualisieren
        $active = self::get_active();
        $active = array_values( array_diff( $active, array( $slug ) ) );
        update_option( WFOCO_OPTION_KEY, $active, 'no' );

        return array( 'ok' => true, 'message' => sprintf(
            /* translators: %s: snippet title */
            __( '✓ "%s" deaktiviert.', 'websitefix-one-click-optimizer' ),
            $snippet['title']
        ) );
    }

    /**
     * Aktiviert ALLE Snippets in einem Rutsch. Wird vom "Alle aktivieren"-
     * Button im Admin verwendet. Liefert die Anzahl erfolgreich aktivierter.
     */
    public static function apply_all() {
        $ok = 0; $fail = 0; $messages = array();
        foreach ( WFOCO_Snippet_Library::get_all() as $snippet ) {
            $r = self::apply( $snippet['slug'] );
            if ( $r['ok'] ) { $ok++; } else { $fail++; $messages[] = $r['message']; }
        }
        return array( 'ok' => $ok, 'fail' => $fail, 'errors' => $messages );
    }

    /**
     * Deaktiviert ALLE Snippets. Wird auch von uninstall.php aufgerufen.
     */
    public static function revert_all() {
        $ok = 0; $fail = 0;
        foreach ( WFOCO_Snippet_Library::get_all() as $snippet ) {
            $r = self::revert( $snippet['slug'] );
            if ( $r['ok'] ) { $ok++; } else { $fail++; }
        }
        return array( 'ok' => $ok, 'fail' => $fail );
    }

    /**
     * True, wenn der Fix gerade aktiv ist (Datei existiert + in Optionen).
     */
    public static function is_active( $slug ) {
        $fs = self::fs();
        if ( ! $fs ) {
            // Fallback: Option-State allein, wenn Filesystem nicht initialisiert
            return in_array( $slug, self::get_active(), true );
        }
        return in_array( $slug, self::get_active(), true ) && $fs->exists( self::file_path( $slug ) );
    }

    /**
     * Liefert die Liste aktiver Slugs aus den Optionen.
     */
    public static function get_active() {
        $active = get_option( WFOCO_OPTION_KEY, array() );
        return is_array( $active ) ? array_values( array_filter( array_map( 'strval', $active ) ) ) : array();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Pfad zur mu-plugin-Datei eines Slugs.
     *
     * FLACH unter WPMU_PLUGIN_DIR mit Präfix wf-optimizer-, weil WordPress'
     * wp_get_mu_plugins() Subfolder ignoriert.
     */
    public static function file_path( $slug ) {
        $safe = preg_replace( '/[^a-z0-9\-]/', '', strtolower( (string) $slug ) );
        return trailingslashit( WPMU_PLUGIN_DIR ) . WFOCO_FILE_PREFIX . $safe . '.php';
    }

    /**
     * Stellt sicher, dass mu-plugins/ existiert + schreibbar (via WP_Filesystem).
     */
    private static function ensure_mu_dir() {
        $fs = self::fs();
        if ( ! $fs ) {
            return false;
        }
        if ( ! $fs->exists( WPMU_PLUGIN_DIR ) ) {
            if ( ! $fs->mkdir( WPMU_PLUGIN_DIR, FS_CHMOD_DIR ) ) {
                return false;
            }
        }
        return $fs->is_writable( WPMU_PLUGIN_DIR );
    }

    /**
     * Prüft, ob das Plugin überhaupt schreiben darf — für Admin-Page-Warnung.
     */
    public static function is_writable_environment() {
        $fs = self::fs();
        if ( ! $fs ) {
            return false;
        }
        if ( $fs->exists( WPMU_PLUGIN_DIR ) ) {
            return $fs->is_writable( WPMU_PLUGIN_DIR );
        }
        return $fs->is_writable( dirname( WPMU_PLUGIN_DIR ) );
    }
}
