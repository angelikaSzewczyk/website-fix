<?php
/**
 * WFHC_Dashboard_Widget — rendert das WP-Admin-Dashboard-Widget.
 *
 * Layout: 5 Health-Werte in 2 Spalten, klare Farbsemantik (grün/rot),
 * darunter prominenter CTA-Button zum Vollscan auf WebsiteFix.com mit
 * UTM-Tracking. Alle Strings escaped via esc_html / esc_attr / esc_url.
 */

defined( 'ABSPATH' ) || exit;

class WFHC_Dashboard_Widget {

    public static function render() {
        $data = WFHC_Quick_Check::get_all();

        echo '<div class="wfhc-widget" style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;">';

        // ── Grid der 5 Werte ──
        echo '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">';

        self::row(
            __( 'PHP-Version', 'websitefix-health-check' ),
            esc_html( $data['php']['version'] ),
            $data['php']['ok'],
            $data['php']['hint']
        );
        self::row(
            __( 'SSL / HTTPS', 'websitefix-health-check' ),
            $data['ssl']['active'] ? __( 'Aktiv', 'websitefix-health-check' ) : __( 'Inaktiv', 'websitefix-health-check' ),
            $data['ssl']['active'],
            $data['ssl']['hint']
        );
        self::row(
            __( 'WordPress', 'websitefix-health-check' ),
            esc_html( $data['wp']['version'] ),
            $data['wp']['up_to_date'],
            $data['wp']['hint']
        );
        self::row(
            __( 'Aktive Plugins', 'websitefix-health-check' ),
            sprintf( '%d (%s Updates)', (int) $data['plugins']['active'], (int) $data['plugins']['updates'] ),
            $data['plugins']['updates'] === 0,
            $data['plugins']['hint']
        );
        self::row(
            __( 'SEO-Basics', 'websitefix-health-check' ),
            ( $data['seo']['title_ok'] && $data['seo']['meta_ok'] ) ? __( 'OK', 'websitefix-health-check' ) : __( 'Lücken', 'websitefix-health-check' ),
            $data['seo']['title_ok'] && $data['seo']['meta_ok'],
            $data['seo']['hint']
        );

        echo '</div>';

        // ── CTA-Block ──
        $cta_url = esc_url( WFHC_BASEURL . '/scan' . WFHC_UTM );
        $blog_url = esc_url( WFHC_BASEURL . WFHC_UTM );

        echo '<div style="padding: 14px 16px; background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.25); border-radius: 8px;">';
        echo '<p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #16a34a; letter-spacing: 0.06em; text-transform: uppercase;">' . esc_html__( 'Tiefer-Scan', 'websitefix-health-check' ) . '</p>';
        echo '<p style="margin: 0 0 12px; font-size: 13px; color: #1f2937; line-height: 1.55;">';
        echo esc_html__( 'Dies sind 5 von 92 Parametern. Der vollständige Bericht inkl. wp_options-Bloat, PHP-Error-Log und Plugin-Konflikten lebt auf WebsiteFix.com.', 'websitefix-health-check' );
        echo '</p>';
        echo '<a href="' . $cta_url . '" target="_blank" rel="noopener" style="display: inline-block; padding: 8px 16px; background: #16a34a; color: #fff; border-radius: 6px; font-size: 13px; font-weight: 700; text-decoration: none;">';
        echo esc_html__( 'Vollständigen 92-Punkt-Bericht ansehen →', 'websitefix-health-check' );
        echo '</a>';
        echo '</div>';

        // ── Footer-Hinweis ──
        echo '<p style="margin: 12px 0 0; font-size: 11px; color: #6b7280; line-height: 1.6;">';
        printf(
            /* translators: %s: Link to WebsiteFix.com */
            esc_html__( 'Read-Only-Check · keine Daten verlassen deine Seite · powered by %s', 'websitefix-health-check' ),
            '<a href="' . $blog_url . '" target="_blank" rel="noopener" style="color: #16a34a; text-decoration: none;">WebsiteFix.com</a>'
        );
        echo '</p>';

        echo '</div>';
    }

    /**
     * Render-Helper: eine Zeile im Health-Grid.
     */
    private static function row( $label, $value, $ok, $hint ) {
        $color   = $ok ? '#16a34a' : '#dc2626';
        $bg      = $ok ? 'rgba(34,197,94,0.07)' : 'rgba(220,38,38,0.07)';
        $border  = $ok ? 'rgba(34,197,94,0.25)' : 'rgba(220,38,38,0.30)';

        echo '<div style="padding: 10px 12px; background: ' . esc_attr( $bg ) . '; border: 1px solid ' . esc_attr( $border ) . '; border-radius: 6px;">';
        echo '<div style="font-size: 10.5px; font-weight: 700; color: #6b7280; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 4px;">';
        echo esc_html( $label );
        echo '</div>';
        echo '<div style="font-size: 15px; font-weight: 800; color: ' . esc_attr( $color ) . '; line-height: 1.2;">';
        echo esc_html( $value );
        echo '</div>';
        echo '<div style="font-size: 11px; color: #4b5563; margin-top: 4px; line-height: 1.4;">';
        echo esc_html( $hint );
        echo '</div>';
        echo '</div>';
    }
}
