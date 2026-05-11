<?php
/**
 * WFHC_Dashboard_Widget — rendert das WP-Admin-Dashboard-Widget.
 *
 * Design-Prinzip "informativ statt Sales" (Sprint 2, 11.05.2026):
 * - Zurückhaltende Farbpalette (kein dominantes Grün-CTA, kein lauter
 *   Gradient-Button)
 * - Tabellarische Werte mit dezenter Status-Anzeige
 * - CTA als Inline-Link am Ende, nicht als Hero-Button
 * - Read-Only-Hinweis als technisches Trust-Statement, nicht als Werbung
 *
 * Alle Strings escaped via esc_html / esc_attr / esc_url.
 */

defined( 'ABSPATH' ) || exit;

class WFHC_Dashboard_Widget {

    public static function render() {
        $data = WFHC_Quick_Check::get_all();

        // Tabellen-Container — wir nutzen den WP-Standard-Look, keine fancy Cards
        echo '<div class="wfhc-widget" style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;">';

        // ── Statusliste als technische Tabelle ──
        echo '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">';
        echo '<tbody>';

        self::row(
            __( 'PHP-Version', 'websitefix-health-check' ),
            esc_html( $data['php']['version'] ),
            $data['php']['ok'],
            $data['php']['hint']
        );
        self::row(
            __( 'TLS / SSL', 'websitefix-health-check' ),
            $data['ssl']['active'] ? __( 'aktiv', 'websitefix-health-check' ) : __( 'inaktiv', 'websitefix-health-check' ),
            $data['ssl']['active'],
            $data['ssl']['hint']
        );
        self::row(
            __( 'WordPress-Core', 'websitefix-health-check' ),
            esc_html( $data['wp']['version'] ),
            $data['wp']['up_to_date'],
            $data['wp']['hint']
        );
        self::row(
            __( 'Aktive Plugins', 'websitefix-health-check' ),
            sprintf(
                /* translators: 1: Anzahl aktive Plugins, 2: Anzahl Updates */
                __( '%1$d aktiv · %2$d Updates verfügbar', 'websitefix-health-check' ),
                (int) $data['plugins']['active'],
                (int) $data['plugins']['updates']
            ),
            $data['plugins']['updates'] === 0,
            $data['plugins']['hint']
        );
        self::row(
            __( 'SEO-Basics (Home)', 'websitefix-health-check' ),
            ( $data['seo']['title_ok'] && $data['seo']['meta_ok'] )
                ? __( 'OK', 'websitefix-health-check' )
                : __( 'Lücken erkannt', 'websitefix-health-check' ),
            $data['seo']['title_ok'] && $data['seo']['meta_ok'],
            $data['seo']['hint']
        );

        echo '</tbody>';
        echo '</table>';

        // ── Footer mit dezentem Link statt Hero-Button ──
        // Read-Only-Statement ist die wichtige Trust-Aussage; der CTA ist
        // sekundär und wird als Inline-Link gerendert.
        $report_url = esc_url( WFHC_BASEURL . WFHC_REPORT_PATH . WFHC_UTM );

        echo '<div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.6;">';
        echo '<p style="margin: 0 0 6px;">';
        echo '<strong style="color: #374151;">' . esc_html__( 'Read-Only Check', 'websitefix-health-check' ) . '</strong> · ';
        echo esc_html__( 'Diese 5 Werte werden lokal ohne Schreibzugriff auf Dateisystem oder Datenbank erhoben. Keine Daten verlassen deine Site.', 'websitefix-health-check' );
        echo '</p>';
        echo '<p style="margin: 0;">';
        printf(
            /* translators: %s: link to the full audit report on WebsiteFix.com */
            esc_html__( 'Tiefer-Audit (92 Parameter inkl. DB-Bloat, PHP-Error-Trace, Hook-Chain-Analyse): %s', 'websitefix-health-check' ),
            '<a href="' . $report_url . '" target="_blank" rel="noopener" style="color: #15803d; font-weight: 600; text-decoration: none;">WebsiteFix.com →</a>'
        );
        echo '</p>';
        echo '</div>';

        echo '</div>';
    }

    /**
     * Render-Helper: eine Tabellenzeile.
     * Status wird als dezente Pille rechts angezeigt — kein dominanter
     * Farb-Background pro Zeile (das wäre Sales-Optik).
     */
    private static function row( $label, $value, $ok, $hint ) {
        $pill_color  = $ok ? '#15803d' : '#b91c1c';
        $pill_bg     = $ok ? '#dcfce7' : '#fee2e2';
        $pill_border = $ok ? '#bbf7d0' : '#fecaca';
        $pill_label  = $ok ? __( 'OK', 'websitefix-health-check' ) : __( 'Achtung', 'websitefix-health-check' );

        echo '<tr style="border-top: 1px solid #f3f4f6;">';

        // Label
        echo '<td style="padding: 10px 12px 10px 0; vertical-align: top; width: 35%;">';
        echo '<div style="font-size: 12.5px; font-weight: 600; color: #111827;">';
        echo esc_html( $label );
        echo '</div>';
        echo '<div style="font-size: 11px; color: #6b7280; margin-top: 2px; line-height: 1.45;">';
        echo esc_html( $hint );
        echo '</div>';
        echo '</td>';

        // Value
        echo '<td style="padding: 10px 12px; vertical-align: top; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #374151;">';
        echo esc_html( $value );
        echo '</td>';

        // Status-Pille
        echo '<td style="padding: 10px 0 10px 12px; vertical-align: top; text-align: right; width: 1%; white-space: nowrap;">';
        echo '<span style="display: inline-block; padding: 2px 9px; border-radius: 999px; ';
        echo 'font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; ';
        echo 'color: ' . esc_attr( $pill_color ) . '; ';
        echo 'background: ' . esc_attr( $pill_bg ) . '; ';
        echo 'border: 1px solid ' . esc_attr( $pill_border ) . ';">';
        echo esc_html( $pill_label );
        echo '</span>';
        echo '</td>';

        echo '</tr>';
    }
}
