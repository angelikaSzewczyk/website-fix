<?php
/**
 * WFHC_Dashboard_Widget — rendert das WP-Admin-Dashboard-Widget.
 *
 * v0.4.1 (04.06.2026): Inline-Styles migriert zu wp_add_inline_style
 * (gleicher Pattern wie One-Click Performance Optimizer, vom WP.org-
 * Reviewer beim Optimizer-Submission-Cycle als korrekter Weg bestätigt).
 *
 * Alle Strings escaped via esc_html / esc_attr / esc_url.
 */

defined( 'ABSPATH' ) || exit;

class WFHC_Dashboard_Widget {

    /**
     * Asset-Enqueue — hooked on admin_enqueue_scripts.
     *
     * Hook-Suffix-Check stellt sicher, dass das CSS nur auf der
     * Dashboard-Hauptseite landet (`index.php`), nicht in jedem Admin-Screen.
     *
     * @param string $hook_suffix WordPress admin page hook.
     */
    public static function enqueue_assets( $hook_suffix ) {
        if ( $hook_suffix !== 'index.php' ) {
            return;
        }
        wp_register_style( 'wfhc-widget', false, array(), WFHC_VERSION );
        wp_enqueue_style( 'wfhc-widget' );
        wp_add_inline_style( 'wfhc-widget', self::get_widget_css() );
    }

    public static function render() {
        $data = WFHC_Quick_Check::get_all();

        echo '<div class="wfhc-widget">';

        echo '<table class="wfhc-widget__table">';
        echo '<tbody>';

        // ── 1. TTFB — Server-Response ──
        self::row(
            __( 'Server-Response (TTFB)', 'websitefix-health-check' ),
            $data['ttfb']['value_text'],
            $data['ttfb']['ok'],
            $data['ttfb']['hint']
        );

        // ── 2. Heartbeat-Frequenz ──
        self::row(
            __( 'Heartbeat-API-Last', 'websitefix-health-check' ),
            $data['heartbeat']['value_text'],
            $data['heartbeat']['ok'],
            $data['heartbeat']['hint']
        );

        // ── 3. Datenbank-Größe + Top-Tabelle ──
        self::row(
            __( 'Datenbank-Größe', 'websitefix-health-check' ),
            $data['database']['value_text'],
            $data['database']['ok'],
            $data['database']['hint']
        );

        // ── 4. PHP-Memory ──
        self::row(
            __( 'PHP-Memory', 'websitefix-health-check' ),
            $data['memory']['value_text'],
            $data['memory']['ok'],
            $data['memory']['hint']
        );

        // ── 5. Update-Backlog ──
        self::row(
            __( 'Update-Backlog', 'websitefix-health-check' ),
            $data['updates']['value_text'],
            $data['updates']['ok'],
            $data['updates']['hint']
        );

        echo '</tbody>';
        echo '</table>';

        $report_url = esc_url( WFHC_BASEURL . WFHC_REPORT_PATH . WFHC_UTM );

        echo '<div class="wfhc-widget__footer">';
        echo '<p class="wfhc-widget__footer-line">';
        echo '<strong class="wfhc-widget__badge">' . esc_html__( 'Read-Only Check', 'websitefix-health-check' ) . '</strong> · ';
        echo esc_html__( 'Diese 5 Werte zeigen dir, wo dein Hoster oder deine Konfiguration die Site bremst. Lokal erhoben, keine Daten verlassen deine Site.', 'websitefix-health-check' );
        echo '</p>';
        echo '<p class="wfhc-widget__footer-cta">';
        printf(
            /* translators: %s: link to the full audit report on WebsiteFix.com */
            esc_html__( 'Tiefer-Audit (92 Parameter inkl. DB-Bloat, PHP-Error-Trace, Hook-Chain-Analyse): %s', 'websitefix-health-check' ),
            '<a class="wfhc-widget__cta-link" href="' . esc_url( $report_url ) . '" target="_blank" rel="noopener">WebsiteFix.com →</a>'
        );
        echo '</p>';
        echo '</div>';

        echo '</div>';
    }

    /**
     * Render-Helper: eine Tabellenzeile.
     */
    private static function row( $label, $value, $ok, $hint ) {
        $pill_class = $ok ? 'wfhc-widget__pill wfhc-widget__pill--ok' : 'wfhc-widget__pill wfhc-widget__pill--warn';
        $pill_label = $ok ? __( 'OK', 'websitefix-health-check' ) : __( 'Achtung', 'websitefix-health-check' );

        echo '<tr class="wfhc-widget__row">';

        // Label
        echo '<td class="wfhc-widget__label-cell">';
        echo '<div class="wfhc-widget__label">';
        echo esc_html( $label );
        echo '</div>';
        echo '<div class="wfhc-widget__hint">';
        echo esc_html( $hint );
        echo '</div>';
        echo '</td>';

        // Value
        echo '<td class="wfhc-widget__value-cell">';
        echo esc_html( $value );
        echo '</td>';

        // Status-Pille
        echo '<td class="wfhc-widget__pill-cell">';
        echo '<span class="' . esc_attr( $pill_class ) . '">';
        echo esc_html( $pill_label );
        echo '</span>';
        echo '</td>';

        echo '</tr>';
    }

    /**
     * Widget-CSS — gezielt klein gehalten, keine externen Assets.
     * Wird über wp_add_inline_style() an das Handle 'wfhc-widget' gehängt.
     */
    private static function get_widget_css() {
        return '
        .wfhc-widget { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .wfhc-widget__table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .wfhc-widget__row { border-top: 1px solid #f3f4f6; }
        .wfhc-widget__label-cell { padding: 10px 12px 10px 0; vertical-align: top; width: 35%; }
        .wfhc-widget__label { font-size: 12.5px; font-weight: 600; color: #111827; }
        .wfhc-widget__hint { font-size: 11px; color: #6b7280; margin-top: 2px; line-height: 1.45; }
        .wfhc-widget__value-cell { padding: 10px 12px; vertical-align: top; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #374151; }
        .wfhc-widget__pill-cell { padding: 10px 0 10px 12px; vertical-align: top; text-align: right; width: 1%; white-space: nowrap; }
        .wfhc-widget__pill { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; }
        .wfhc-widget__pill--ok   { color: #15803d; background: #dcfce7; border: 1px solid #bbf7d0; }
        .wfhc-widget__pill--warn { color: #b91c1c; background: #fee2e2; border: 1px solid #fecaca; }
        .wfhc-widget__footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.6; }
        .wfhc-widget__footer-line { margin: 0 0 6px; }
        .wfhc-widget__footer-cta  { margin: 0; }
        .wfhc-widget__badge { color: #374151; }
        .wfhc-widget__cta-link { color: #15803d; font-weight: 600; text-decoration: none; }
        ';
    }
}
