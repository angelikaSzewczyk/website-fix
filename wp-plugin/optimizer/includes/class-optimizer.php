<?php
/**
 * WFOCO_Optimizer — Apply/Revert-Engine.
 *
 * Schreibt einen Fix als mu-plugin-Datei nach
 * /wp-content/mu-plugins/wf-optimizer-<slug>.php. WordPress lädt mu-plugins
 * automatisch (vor regulären Plugins, ohne Activation), daher greift der
 * Fix sofort nach dem Schreiben — kein Reload-Workaround nötig.
 *
 * Schreibt mit der WP-Filesystem-API, wenn möglich. Fallback auf direkte
 * Filesystem-Funktionen, wenn die API nicht initialisiert ist (z.B.
 * im Setup-Wizard). Berechtigungs-Checks (manage_options) liegen im
 * Admin-Page-Handler, NICHT hier — dieser Layer ist pure I/O.
 */

defined( 'ABSPATH' ) || exit;

class WFOCO_Optimizer {

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

        $target = self::file_path( $slug );
        $content = WFOCO_Snippet_Library::build_file_content( $snippet );

        // Atomic write: erst in .tmp schreiben, dann rename. Verhindert
        // halb-geschriebene Dateien, falls der Write mittendrin abbricht.
        $tmp = $target . '.tmp';
        $bytes = @file_put_contents( $tmp, $content, LOCK_EX );
        if ( false === $bytes ) {
            return array( 'ok' => false, 'message' => sprintf(
                /* translators: %s: target file path */
                __( 'Konnte %s nicht schreiben. Schreibrechte fehlen?', 'websitefix-one-click-optimizer' ),
                $target
            ) );
        }
        if ( ! @rename( $tmp, $target ) ) {
            @unlink( $tmp );
            return array( 'ok' => false, 'message' => __( 'Rename-Operation fehlgeschlagen.', 'websitefix-one-click-optimizer' ) );
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
        if ( file_exists( $target ) ) {
            // Sicherheits-Check: Datei muss unseren Marker enthalten,
            // sonst löschen wir sie NICHT (User könnte was Eigenes da
            // abgelegt haben mit demselben Slug).
            $contents = @file_get_contents( $target );
            if ( false === $contents || strpos( $contents, 'WebsiteFix One-Click Optimizer' ) === false ) {
                return array( 'ok' => false, 'message' => sprintf(
                    /* translators: %s: file path */
                    __( 'Datei %s gehört nicht zum Optimizer — wird nicht angerührt.', 'websitefix-one-click-optimizer' ),
                    $target
                ) );
            }
            if ( ! @unlink( $target ) ) {
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
     * Aktiviert ALLE 5 Snippets in einem Rutsch. Wird vom "Alle aktivieren"-
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
     * Deaktiviert ALLE 5 Snippets. Wird auch von uninstall.php aufgerufen.
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
        return in_array( $slug, self::get_active(), true ) && file_exists( self::file_path( $slug ) );
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
     * wp_get_mu_plugins() Subfolder ignoriert (siehe wp-includes/load.php).
     * Wenn wir in einen Unterordner schreiben würden, würde keine Datei je
     * von WordPress geladen werden — die Fixes wären tot.
     */
    public static function file_path( $slug ) {
        $safe = preg_replace( '/[^a-z0-9\-]/', '', strtolower( (string) $slug ) );
        return trailingslashit( WPMU_PLUGIN_DIR ) . WFOCO_FILE_PREFIX . $safe . '.php';
    }

    /**
     * Stellt sicher, dass mu-plugins/ existiert + schreibbar.
     */
    private static function ensure_mu_dir() {
        if ( ! file_exists( WPMU_PLUGIN_DIR ) ) {
            if ( ! @wp_mkdir_p( WPMU_PLUGIN_DIR ) ) {
                return false;
            }
        }
        return is_writable( WPMU_PLUGIN_DIR );
    }

    /**
     * Prüft, ob das Plugin überhaupt schreiben darf — für Admin-Page-Warnung.
     */
    public static function is_writable_environment() {
        if ( file_exists( WPMU_PLUGIN_DIR ) ) {
            return is_writable( WPMU_PLUGIN_DIR );
        }
        return is_writable( dirname( WPMU_PLUGIN_DIR ) );
    }
}
