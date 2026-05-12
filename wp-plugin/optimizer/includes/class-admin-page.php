<?php
/**
 * WFOCO_Admin_Page — Settings-Page mit 5 Optimizer-Cards.
 *
 * Liegt unter Tools → WebsiteFix Optimizer (statt Settings →, weil das
 * eher "ich erledige was"- als "ich konfiguriere"-Charakter hat).
 *
 * Jede Card zeigt:
 *   - Titel + 1-Satz-Tagline
 *   - Erwarteter Effekt
 *   - Status-Pille (aktiv / inaktiv) mit Live-Diagnostic-Detail
 *   - Apply-Button oder Revert-Button (je nach Status)
 *   - "Code anzeigen"-Toggle (zeigt den exakten PHP-Code, der geschrieben wird)
 *   - Optionaler Warning-Hinweis (Kompat)
 *
 * Form-Submits gehen an admin-post.php mit Nonce + Capability-Check.
 */

defined( 'ABSPATH' ) || exit;

class WFOCO_Admin_Page {

    /**
     * Menu-Registrierung — hooked on admin_menu.
     */
    public static function register() {
        add_management_page(
            __( 'WebsiteFix Optimizer', 'websitefix-one-click-optimizer' ),
            __( 'WebsiteFix Optimizer', 'websitefix-one-click-optimizer' ),
            'manage_options',
            WFOCO_SLUG,
            array( __CLASS__, 'render' )
        );
    }

    /**
     * Form-Handler: Apply. Hooked on admin_post_wfoco_apply.
     */
    public static function handle_apply() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Keine Berechtigung.', 'websitefix-one-click-optimizer' ) );
        }
        check_admin_referer( 'wfoco_action' );

        $slug = isset( $_POST['slug'] ) ? sanitize_key( wp_unslash( $_POST['slug'] ) ) : '';
        if ( $slug === 'all' ) {
            $result = WFOCO_Optimizer::apply_all();
            $msg = sprintf(
                /* translators: 1: success count, 2: total */
                __( '%1$d von %2$d Fixes aktiviert.', 'websitefix-one-click-optimizer' ),
                $result['ok'],
                $result['ok'] + $result['fail']
            );
            set_transient( 'wfoco_admin_notice', array( 'type' => $result['fail'] === 0 ? 'success' : 'warning', 'message' => $msg ), 30 );
        } else {
            $r = WFOCO_Optimizer::apply( $slug );
            set_transient( 'wfoco_admin_notice', array( 'type' => $r['ok'] ? 'success' : 'error', 'message' => $r['message'] ), 30 );
        }

        wp_safe_redirect( admin_url( 'tools.php?page=' . WFOCO_SLUG ) );
        exit;
    }

    /**
     * Form-Handler: Revert.
     */
    public static function handle_revert() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Keine Berechtigung.', 'websitefix-one-click-optimizer' ) );
        }
        check_admin_referer( 'wfoco_action' );

        $slug = isset( $_POST['slug'] ) ? sanitize_key( wp_unslash( $_POST['slug'] ) ) : '';
        if ( $slug === 'all' ) {
            $result = WFOCO_Optimizer::revert_all();
            $msg = sprintf(
                /* translators: 1: success count, 2: total */
                __( '%1$d von %2$d Fixes deaktiviert.', 'websitefix-one-click-optimizer' ),
                $result['ok'],
                $result['ok'] + $result['fail']
            );
            set_transient( 'wfoco_admin_notice', array( 'type' => 'info', 'message' => $msg ), 30 );
        } else {
            $r = WFOCO_Optimizer::revert( $slug );
            set_transient( 'wfoco_admin_notice', array( 'type' => $r['ok'] ? 'info' : 'error', 'message' => $r['message'] ), 30 );
        }

        wp_safe_redirect( admin_url( 'tools.php?page=' . WFOCO_SLUG ) );
        exit;
    }

    /**
     * Haupt-Render.
     */
    public static function render() {
        if ( ! current_user_can( 'manage_options' ) ) return;

        $snippets    = WFOCO_Snippet_Library::get_all();
        $active_list = WFOCO_Optimizer::get_active();
        $writable    = WFOCO_Optimizer::is_writable_environment();
        $notice      = get_transient( 'wfoco_admin_notice' );
        if ( $notice ) {
            delete_transient( 'wfoco_admin_notice' );
        }
        ?>
        <div class="wrap wfoco-wrap">
            <h1 style="display:flex;align-items:center;gap:10px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9px;background:rgba(74,222,128,0.10);border:1px solid rgba(74,222,128,0.32);">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
                    </svg>
                </span>
                <?php esc_html_e( 'WebsiteFix One-Click Optimizer', 'websitefix-one-click-optimizer' ); ?>
            </h1>
            <p class="description" style="max-width: 720px; font-size: 13.5px; color: #475569; line-height: 1.65; margin: 8px 0 24px;">
                <?php esc_html_e( '5 kuratierte WordPress-Performance-Fixes mit einem Klick. Jeder Fix kommt mit Safety-Check (erkennt konfligierende Plugins und greift dann nicht ein) und sofortiger Rückgängig-Möglichkeit. Snippets werden als Must-Use-Plugin-Datei in /wp-content/mu-plugins/wf-optimizer/ abgelegt — kein Theme-Edit, kein Reload-Workaround.', 'websitefix-one-click-optimizer' ); ?>
            </p>

            <?php if ( $notice ) : ?>
                <div class="notice notice-<?php echo esc_attr( $notice['type'] ); ?> is-dismissible">
                    <p><?php echo esc_html( $notice['message'] ); ?></p>
                </div>
            <?php endif; ?>

            <?php if ( ! $writable ) : ?>
                <div class="notice notice-error">
                    <p><strong><?php esc_html_e( 'Schreibrechte fehlen.', 'websitefix-one-click-optimizer' ); ?></strong>
                       <?php
                       printf(
                           /* translators: %s: full path to mu-plugins directory */
                           esc_html__( 'Das Verzeichnis %s ist nicht schreibbar. Bitte CHMOD oder Hosting-Support kontaktieren — sonst können wir keine Fixes aktivieren.', 'websitefix-one-click-optimizer' ),
                           '<code>' . esc_html( WFOCO_MU_DIR ) . '</code>'
                       );
                       ?>
                    </p>
                </div>
            <?php endif; ?>

            <!-- Master-Bar: "Alle aktivieren" / "Alle deaktivieren" -->
            <div style="margin: 0 0 20px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="margin:0;">
                    <?php wp_nonce_field( 'wfoco_action' ); ?>
                    <input type="hidden" name="action" value="wfoco_apply" />
                    <input type="hidden" name="slug"   value="all" />
                    <button type="submit" class="button button-primary" <?php disabled( ! $writable ); ?>>
                        ⚡ <?php esc_html_e( 'Alle 5 Fixes auf einmal aktivieren', 'websitefix-one-click-optimizer' ); ?>
                    </button>
                </form>
                <?php if ( count( $active_list ) > 0 ) : ?>
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="margin:0;">
                        <?php wp_nonce_field( 'wfoco_action' ); ?>
                        <input type="hidden" name="action" value="wfoco_revert" />
                        <input type="hidden" name="slug"   value="all" />
                        <button type="submit" class="button"
                            onclick="return confirm('<?php echo esc_js( __( 'Wirklich alle Fixes deaktivieren? Die mu-plugin-Dateien werden gelöscht — Standard-WordPress-Verhalten kehrt zurück.', 'websitefix-one-click-optimizer' ) ); ?>')">
                            <?php esc_html_e( 'Alle deaktivieren', 'websitefix-one-click-optimizer' ); ?>
                        </button>
                    </form>
                <?php endif; ?>
                <span style="font-size: 12px; color: #64748b;">
                    <?php
                    printf(
                        /* translators: %1$d: number of active fixes, %2$d: total fixes */
                        esc_html__( '%1$d von %2$d Fixes aktiv', 'websitefix-one-click-optimizer' ),
                        count( $active_list ),
                        count( $snippets )
                    );
                    ?>
                </span>
            </div>

            <!-- Cards-Grid -->
            <div class="wfoco-grid">
                <?php foreach ( $snippets as $snippet ) :
                    $is_active = WFOCO_Optimizer::is_active( $snippet['slug'] );
                    $diag      = WFOCO_Diagnostics::check( $snippet['slug'] );
                ?>
                <div class="wfoco-card <?php echo $is_active ? 'is-active' : ''; ?>">
                    <div class="wfoco-card-head">
                        <h2 class="wfoco-card-title"><?php echo esc_html( $snippet['title'] ); ?></h2>
                        <span class="wfoco-status-pill <?php echo $is_active ? 'is-on' : 'is-off'; ?>">
                            <?php echo $is_active
                                ? '● ' . esc_html__( 'aktiv', 'websitefix-one-click-optimizer' )
                                : '○ ' . esc_html__( 'inaktiv', 'websitefix-one-click-optimizer' ); ?>
                        </span>
                    </div>
                    <p class="wfoco-card-tagline"><?php echo esc_html( $snippet['tagline'] ); ?></p>
                    <div class="wfoco-meta-row">
                        <span class="wfoco-pill wfoco-pill-problem">
                            <?php echo esc_html( $snippet['problem_tag'] ); ?>
                        </span>
                        <span class="wfoco-pill wfoco-pill-scope">
                            <?php echo esc_html( $snippet['hoster_scope'] ); ?> · <?php echo esc_html( $snippet['effect_scope'] ); ?>
                        </span>
                    </div>
                    <p class="wfoco-effect">
                        <strong><?php esc_html_e( 'Erwarteter Effekt:', 'websitefix-one-click-optimizer' ); ?></strong>
                        <?php echo esc_html( $snippet['effect'] ); ?>
                    </p>

                    <?php if ( ! empty( $snippet['warning'] ) ) : ?>
                    <div class="wfoco-warning">
                        <strong>⚠ <?php esc_html_e( 'Hinweis:', 'websitefix-one-click-optimizer' ); ?></strong>
                        <?php echo esc_html( $snippet['warning'] ); ?>
                    </div>
                    <?php endif; ?>

                    <!-- Live-Diagnostic -->
                    <p class="wfoco-diag">
                        <strong><?php esc_html_e( 'Aktueller Status:', 'websitefix-one-click-optimizer' ); ?></strong>
                        <code><?php echo esc_html( $diag['label'] ); ?></code> —
                        <?php echo esc_html( $diag['detail'] ); ?>
                    </p>

                    <!-- Code-Preview -->
                    <details class="wfoco-preview">
                        <summary><?php esc_html_e( 'Code anzeigen, der bei Apply geschrieben wird', 'websitefix-one-click-optimizer' ); ?></summary>
                        <p class="wfoco-preview-path">
                            <?php
                            printf(
                                /* translators: %s: target file path */
                                esc_html__( 'Zieldatei: %s', 'websitefix-one-click-optimizer' ),
                                '<code>' . esc_html( WFOCO_Optimizer::file_path( $snippet['slug'] ) ) . '</code>'
                            );
                            ?>
                        </p>
                        <pre class="wfoco-code"><code><?php echo esc_html( WFOCO_Snippet_Library::build_file_content( $snippet ) ); ?></code></pre>
                    </details>

                    <!-- Action-Form -->
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" class="wfoco-form">
                        <?php wp_nonce_field( 'wfoco_action' ); ?>
                        <input type="hidden" name="action" value="<?php echo $is_active ? 'wfoco_revert' : 'wfoco_apply'; ?>" />
                        <input type="hidden" name="slug"   value="<?php echo esc_attr( $snippet['slug'] ); ?>" />
                        <?php if ( $is_active ) : ?>
                            <button type="submit" class="button button-secondary"
                                onclick="return confirm('<?php echo esc_js( sprintf(
                                    /* translators: %s: snippet title */
                                    __( '"%s" wirklich deaktivieren? Die mu-plugin-Datei wird gelöscht.', 'websitefix-one-click-optimizer' ),
                                    $snippet['title']
                                ) ); ?>')">
                                <?php esc_html_e( 'Fix deaktivieren', 'websitefix-one-click-optimizer' ); ?>
                            </button>
                        <?php else : ?>
                            <button type="submit" class="button button-primary" <?php disabled( ! $writable ); ?>>
                                ⚡ <?php esc_html_e( 'Fix aktivieren', 'websitefix-one-click-optimizer' ); ?>
                            </button>
                        <?php endif; ?>
                    </form>
                </div>
                <?php endforeach; ?>
            </div>

            <p style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
                <strong><?php esc_html_e( 'Technische Details:', 'websitefix-one-click-optimizer' ); ?></strong>
                <?php esc_html_e( 'Aktivierte Fixes liegen als einzelne PHP-Dateien in /wp-content/mu-plugins/wf-optimizer/. WordPress lädt mu-plugins automatisch vor regulären Plugins — kein Activation-Workflow nötig. Deaktivieren = Datei wird gelöscht. Standard-WordPress-Verhalten ist sofort wieder aktiv.', 'websitefix-one-click-optimizer' ); ?>
                <br/>
                <a href="https://website-fix.com/smart-fix-library?utm_source=wp-plugin&utm_medium=optimizer&utm_campaign=lab-link" target="_blank" rel="noopener noreferrer">
                    <?php esc_html_e( 'Hintergrund-Lab zu den Snippets auf website-fix.com →', 'websitefix-one-click-optimizer' ); ?>
                </a>
            </p>
        </div>

        <?php self::inline_styles(); ?>
        <?php
    }

    /**
     * Inline-CSS — gezielt klein gehalten, keine externen Assets.
     */
    private static function inline_styles() {
        ?>
        <style>
        .wfoco-wrap { max-width: 1100px; }
        .wfoco-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 16px;
        }
        .wfoco-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px 22px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .wfoco-card.is-active {
            border-color: rgba(22,163,74,0.32);
            background: linear-gradient(180deg, #f0fdf4 0%, #fff 80%);
        }
        .wfoco-card-head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
        }
        .wfoco-card-title {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.01em;
        }
        .wfoco-status-pill {
            flex-shrink: 0;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 999px;
            letter-spacing: 0.04em;
        }
        .wfoco-status-pill.is-on  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
        .wfoco-status-pill.is-off { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
        .wfoco-card-tagline {
            margin: 0;
            font-size: 13px;
            color: #475569;
            line-height: 1.55;
        }
        .wfoco-meta-row {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .wfoco-pill {
            font-size: 10.5px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            letter-spacing: 0.02em;
        }
        .wfoco-pill-problem { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .wfoco-pill-scope   { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        .wfoco-effect {
            margin: 6px 0 0;
            font-size: 12.5px;
            color: #475569;
            line-height: 1.6;
        }
        .wfoco-warning {
            margin: 0;
            padding: 9px 12px;
            background: #fffbeb;
            border-left: 3px solid #f59e0b;
            border-radius: 0 6px 6px 0;
            font-size: 12px;
            color: #78350f;
            line-height: 1.55;
        }
        .wfoco-diag {
            margin: 6px 0;
            font-size: 12px;
            color: #475569;
            line-height: 1.55;
        }
        .wfoco-diag code {
            padding: 1px 6px;
            background: #f1f5f9;
            border-radius: 4px;
            font-size: 11px;
            color: #0f172a;
        }
        .wfoco-preview {
            margin: 4px 0;
            font-size: 12px;
        }
        .wfoco-preview summary {
            cursor: pointer;
            color: #2563eb;
            font-weight: 600;
            user-select: none;
        }
        .wfoco-preview-path {
            margin: 8px 0 6px;
            font-size: 11px;
            color: #64748b;
        }
        .wfoco-preview-path code {
            font-size: 10.5px;
            background: #f1f5f9;
            padding: 1px 6px;
            border-radius: 3px;
        }
        .wfoco-code {
            margin: 0;
            padding: 12px 14px;
            background: #0f172a;
            color: #e2e8f0;
            border-radius: 8px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 11px;
            line-height: 1.55;
            overflow-x: auto;
            max-height: 280px;
        }
        .wfoco-code code {
            color: inherit;
            background: transparent;
        }
        .wfoco-form {
            margin-top: 6px;
        }
        </style>
        <?php
    }
}
