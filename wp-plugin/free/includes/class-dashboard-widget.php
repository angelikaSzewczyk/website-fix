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
 * v0.3.0 (13.05.2026): Die 5 Werte sind jetzt differenziert positioniert
 * als "siehst du, ob dein Hoster dich bremst" — TTFB, Heartbeat, DB-Bloat,
 * PHP-Memory, Update-Backlog. Ersetzt die generischen v0.2.0-Werte
 * (PHP-Version, SSL, WP-Core, Plugin-Updates, SEO-Basics), die mit dem
 * eingebauten WordPress-Site-Health zu stark überlappten.
 *
 * Alle Strings escaped via esc_html / esc_attr / esc_url.
 */

defined( 'ABSPATH' ) || exit;

class WFHC_Dashboard_Widget {

    public static function render() {
        $data = WFHC_Quick_Check::get_all();

        echo '<div class="wfhc-widget" style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;">';

        echo '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">';
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

        // ── Footer mit dezentem Link statt Hero-Button ──
        // Read-Only-Statement ist die wichtige Trust-Aussage; der CTA ist
        // sekundär und wird als Inline-Link gerendert.
        $report_url = esc_url( WFHC_BASEURL . WFHC_REPORT_PATH . WFHC_UTM );

        echo '<div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.6;">';
        echo '<p style="margin: 0 0 6px;">';
        echo '<strong style="color: #374151;">' . esc_html__( 'Read-Only Check', 'websitefix-health-check' ) . '</strong> · ';
        echo esc_html__( 'Diese 5 Werte zeigen dir, wo dein Hoster oder deine Konfiguration die Site bremst. Lokal erhoben, keine Daten verlassen deine Site.', 'websitefix-health-check' );
        echo '</p>';
        echo '<p style="margin: 0;">';
        // $report_url is already esc_url()-prepared at the top of the method;
        // re-escape via esc_attr for the href context to satisfy strict
        // Plugin-Check (it scans context-by-context, not data-flow).
        printf(
            /* translators: %s: link to the full audit report on WebsiteFix.com */
            esc_html__( 'Tiefer-Audit (92 Parameter inkl. DB-Bloat, PHP-Error-Trace, Hook-Chain-Analyse): %s', 'websitefix-health-check' ),
            '<a href="' . esc_url( $report_url ) . '" target="_blank" rel="noopener" style="color: #15803d; font-weight: 600; text-decoration: none;">WebsiteFix.com →</a>'
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
