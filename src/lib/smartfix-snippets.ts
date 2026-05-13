/**
 * SmartFix-Library — Statische Bibliothek universeller WordPress-Snippets.
 *
 * Existiert PARALLEL zur dynamischen `SmartFixSection.tsx`:
 *   - SmartFixSection: deep-data-gesteuert, pro Befund, "der Chirurg"
 *   - SmartFix-Library: kuratiert, browsbar, SEO-Einstiegspunkt, "die Hausapotheke"
 *
 * Jedes Snippet:
 *   - hat den standardisierten WebsiteFix-Sicherheits-Wrapper (per `buildSnippet`)
 *   - ist read-only nach Default, schreibende Operationen sind explizit markiert
 *   - kommt mit 1-2-3 Install-Anleitung + Code-Snippets-Plugin-Alternative
 *   - dokumentiert Hoster-Kompat + Effekt-Scope
 *
 * Neue Snippets ergänzen: `Snippet`-Schema befüllen + an `SNIPPETS` anhängen.
 * Der UI-Layer (`SmartFixCard.tsx`) iteriert automatisch.
 */

export interface Snippet {
  /** URL-Slug, stabil — wird auch fürs Anchor-Routing genutzt. */
  slug:        string;
  /** Anzeigename in der Card-Headline. */
  title:       string;
  /** 1-Satz-Was-tut-es-Beschreibung. */
  description: string;
  /** Problem-Tag (Pill im Header). */
  problemTag:  string;
  /** Typ-Klassifizierung für den Wrapper-Header (z.B. "Performance-Optimierung"). */
  fixType:     string;
  /** Hoster-Kompatibilität (Info im UI + Wrapper-Sub-Line). */
  hosterScope: string;
  /** Effekt-Scope (Backend / Frontend / beides). */
  effectScope: string;
  /** Optionaler Warnhinweis, der über dem Code steht. */
  warning?:    string;
  /** Optionaler Auto-Safety-Check (PHP-Code), der dem Body vorangestellt wird.
   *  Prüft die WordPress-Umgebung zur Laufzeit (z.B. WP_DEBUG, konfligierende
   *  Plugins) und bricht ggf. mit return; ab — damit ein versehentlicher
   *  Einbau in einer ungeeigneten Umgebung kein Frontend killt. */
  safetyCheck?: string;
  /** Body OHNE Wrapper — `buildSnippet()` schreibt den Wrapper + Safety-Check drumherum. */
  body:        string;
  /** 1-2-3 Install-Anleitung (genau 3 Steps). */
  installSteps: readonly [string, string, string];
  /** Rollback-Anweisung. */
  rollback?:   string;
  /** Optionaler Pillar-Blog-Post, der das Snippet vertieft erklärt.
   *  Wenn gesetzt, rendert SmartFixCard eine "Detail-Guide"-CTA-Pille und
   *  speist gleichzeitig den HowTo-Schema-Verweis. Verlinkt im SEO-Cluster
   *  Library → Blog (Outbound-Hub). Anchor-Text muss pro Snippet eindeutig
   *  sein — keine Wiederholung von "Heartbeat-Drossel-Snippet" o.ä. */
  blogPost?: {
    /** Slug unter /blog/<slug>. */
    slug:       string;
    /** Anchor-Text für die CTA-Pille — pro Snippet anders formuliert. */
    anchorText: string;
  };
}

/**
 * Wraps a Snippet-Body in den `WebsiteFix Smart-Fix`-Sicherheits-Wrapper.
 * Single source of truth — UI ruft das vor Anzeige + Kopieren auf.
 */
export function buildSnippet(s: Snippet): string {
  const safetyBlock = s.safetyCheck
    ? `\n// ── Auto-Safety-Check ──\n${s.safetyCheck.trim()}\n`
    : "";
  return `if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly
/**
 * WebsiteFix Smart-Fix: ${s.title}
 * Status: Safe-Mode geprüft | Typ: ${s.fixType}
 * Hoster: ${s.hosterScope} | Wirkt auf: ${s.effectScope}
 */
${safetyBlock}
${s.body.trim()}
`;
}

// ════════════════════════════════════════════════════════════════════════════
//   5 BASIS-SNIPPETS (PHP)
// ════════════════════════════════════════════════════════════════════════════

export const SNIPPETS: ReadonlyArray<Snippet> = [
  // ────────────────────────────────────────────────────────────────────────
  // 1. Heartbeat-Drosselung
  // ────────────────────────────────────────────────────────────────────────
  {
    slug:        "heartbeat-drosselung",
    title:       "Heartbeat-API kontextabhängig drosseln",
    description: "Reduziert die WordPress-Heartbeat-Frequenz pro Bereich: 60 s im Admin, 120 s im Post-Editor (statt 15 s), Frontend praktisch aus.",
    problemTag:  "Hoher TTFB · CPU-Last",
    fixType:     "Performance-Optimierung",
    hosterScope: "Alle Hoster",
    effectScope: "Backend & Frontend",
    safetyCheck: `// Konfligierende Plugins erkennen — wenn "Heartbeat Control" oder WP Rocket
// die Heartbeat-API bereits verwaltet, vermeiden wir doppelte Drosselung.
$wf_active = (array) get_option( 'active_plugins' );
if ( in_array( 'heartbeat-control/heartbeat-control.php', $wf_active, true )
  || in_array( 'wp-rocket/wp-rocket.php',                  $wf_active, true ) ) {
    if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
        error_log( 'WebsiteFix Smart-Fix [heartbeat]: skipped — collision detected.' );
    }
    return;
}`,
    body: `add_filter( 'heartbeat_settings', function( $settings ) {
    // Kontextabhängige Frequenz statt Standard-15 s.
    if ( is_admin() ) {
        $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
        if ( $screen && in_array( $screen->base, array( 'post', 'page' ), true ) ) {
            $settings['interval'] = 120; // Post-Editor: Autosave alle 2 Min reicht
        } else {
            $settings['interval'] = 60;  // Rest des Admins: 1 Min
        }
    } else {
        $settings['interval'] = 300;     // Frontend: Heartbeat fast aus (5 Min)
    }
    return $settings;
}, 10, 1 );

add_action( 'init', function() {
    // Heartbeat auf öffentlichen Seiten komplett deaktivieren.
    // NICHT aktivieren wenn ein Plugin Live-Cart oder Live-Notifications
    // im Frontend braucht (z.B. WooCommerce-Cart-Sync, BuddyPress).
    if ( ! is_admin() ) {
        wp_deregister_script( 'heartbeat' );
    }
}, 1 );`,
    installSteps: [
      "Kopiere das Snippet (Copy-Button rechts oben).",
      "Füge es in die functions.php deines aktiven Child-Themes ein, oder lege es als neues Snippet im Plugin „Code Snippets“ an.",
      "Speichern. Site einmal neu laden, im Network-Tab prüfen: admin-ajax.php-Calls verschwinden im Frontend.",
    ],
    rollback: "Codeblock löschen — Default-Heartbeat (15 s) ist sofort wieder aktiv.",
    blogPost: {
      slug:       "wordpress-heartbeat-drosseln",
      anchorText: "Detail-Guide: warum 60/120/300 s die richtige Drosselung ist",
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 2. XML-RPC & Pingback Disabler
  // ────────────────────────────────────────────────────────────────────────
  {
    slug:        "xmlrpc-disable",
    title:       "XML-RPC & Pingbacks deaktivieren",
    description: "Schließt den XML-RPC-Endpoint (Brute-Force-Angriffsfläche) und schaltet ausgehende Pingbacks ab. Erkennt automatisch ein aktives Jetpack und greift dann NICHT ein.",
    problemTag:  "Brute-Force-Schutz · Anti-Spam",
    fixType:     "Security-Hardening",
    hosterScope: "Alle Hoster",
    effectScope: "Backend",
    warning:     "Wenn du die WordPress-Mobile-App, ein externes Publishing-Tool oder eine Marketing-Suite nutzt, die via XML-RPC schreibt: ein Test in der Staging-Umgebung empfohlen.",
    safetyCheck: `// Jetpack kommuniziert mit WordPress.com via XML-RPC — wenn aktiv, abbrechen.
// Ebenso bei Wordfence/Sucuri, die teilweise eigene XML-RPC-Hardening-Regeln setzen.
$wf_active = (array) get_option( 'active_plugins' );
foreach ( array( 'jetpack/jetpack.php', 'wordfence/wordfence.php', 'sucuri-scanner/sucuri.php' ) as $wf_skip ) {
    if ( in_array( $wf_skip, $wf_active, true ) ) {
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            error_log( 'WebsiteFix Smart-Fix [xmlrpc]: skipped — security plugin manages this (' . $wf_skip . ').' );
        }
        return;
    }
}`,
    body: `// XML-RPC vollständig deaktivieren
add_filter( 'xmlrpc_enabled', '__return_false' );

// Pingback-Methoden zusätzlich entfernen (Defense-in-Depth)
add_filter( 'xmlrpc_methods', function( $methods ) {
    unset( $methods['pingback.ping'] );
    unset( $methods['pingback.extensions.getPingbacks'] );
    return $methods;
}, 10, 1 );

// Ausgehende Pingbacks abschalten
add_filter( 'pre_option_default_pingback_flag', '__return_zero' );

// X-Pingback-Header aus den ausgelieferten HTTP-Headern entfernen
add_filter( 'wp_headers', function( $headers ) {
    unset( $headers['X-Pingback'] );
    return $headers;
}, 10, 1 );

// Optional: REST-API User-Enumeration vor anonymen Anfragen schützen
add_filter( 'rest_authentication_errors', function( $result ) {
    if ( ! is_user_logged_in() && ! empty( $_SERVER['REQUEST_URI'] )
         && false !== strpos( wp_unslash( $_SERVER['REQUEST_URI'] ), '/wp-json/wp/v2/users' ) ) {
        return new WP_Error( 'rest_not_logged_in', 'Anmeldung erforderlich.', array( 'status' => 401 ) );
    }
    return $result;
}, 10, 1 );`,
    installSteps: [
      "Snippet kopieren.",
      "In functions.php oder Code-Snippets-Plugin einfügen.",
      "Speichern. Testen: `https://deine-domain.de/xmlrpc.php` aufrufen — sollte deaktiviert antworten.",
    ],
    rollback: "Codeblock löschen — XML-RPC ist sofort wieder aktiv.",
    blogPost: {
      slug:       "xmlrpc-deaktivieren-wordpress",
      anchorText: "Defense-in-Depth: warum Wordfence-Block oft nicht reicht",
    },
  },

  // ────────────────────────────────────────────────────────────────────────
  // 3. Emojis & Embeds Bloat-Remove
  // ────────────────────────────────────────────────────────────────────────
  {
    slug:        "emojis-embeds-bloat-remove",
    title:       "Emojis & oEmbed-Discovery entfernen",
    description: "Entfernt die WordPress-Emoji-Polyfill-Scripte (wp-emoji-release.min.js, ~14 KB) und die oEmbed-Auto-Discovery-Routen — beide spart auf den meisten Seiten 2-3 zusätzliche HTTP-Requests.",
    problemTag:  "Frontend-Bloat · Render-Blocking",
    fixType:     "Performance-Optimierung",
    hosterScope: "Alle Hoster",
    effectScope: "Frontend",
    safetyCheck: `// Disable-Emojis-Plugin oder Perfmatters managen diese Optimierung bereits.
$wf_active = (array) get_option( 'active_plugins' );
if ( in_array( 'disable-emojis/disable-emojis.php', $wf_active, true )
  || in_array( 'perfmatters/perfmatters.php',        $wf_active, true ) ) {
    if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
        error_log( 'WebsiteFix Smart-Fix [emojis]: skipped — handled by existing plugin.' );
    }
    return;
}`,
    body: `// ── 1. Emoji-Scripte + Styles aus dem Frontend entfernen ──
remove_action( 'wp_head',             'print_emoji_detection_script', 7 );
remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
remove_action( 'wp_print_styles',     'print_emoji_styles' );
remove_action( 'admin_print_styles',  'print_emoji_styles' );
remove_filter( 'the_content_feed',    'wp_staticize_emoji' );
remove_filter( 'comment_text_rss',    'wp_staticize_emoji' );
remove_filter( 'wp_mail',             'wp_staticize_emoji_for_email' );

// DNS-Prefetch für s.w.org (Emoji-CDN) ebenfalls deaktivieren
add_filter( 'wp_resource_hints', function( $urls, $relation_type ) {
    if ( 'dns-prefetch' === $relation_type ) {
        return array_diff( wp_list_pluck( $urls, 'href' ), array( 'https://s.w.org' ) );
    }
    return $urls;
}, 10, 2 );

// ── 2. oEmbed-Auto-Discovery-Routen entfernen ──
// Endprodukt unterstützt weiterhin URL-Embeds (https://...-Paste im Editor),
// aber externe Seiten können DEINE Site nicht mehr per oEmbed crawlen.
remove_action( 'rest_api_init',         'wp_oembed_register_route' );
remove_filter( 'oembed_dataparse',      'wp_filter_oembed_result', 10 );
remove_action( 'wp_head',               'wp_oembed_add_discovery_links' );
remove_action( 'wp_head',               'wp_oembed_add_host_js' );

// REST-API-Route /oembed/1.0/embed bleibt für Editor-Funktionalität aktiv,
// nur die öffentliche Discovery wird abgeschaltet.`,
    installSteps: [
      "Snippet kopieren.",
      "In functions.php oder Code-Snippets-Plugin einfügen.",
      "Speichern. Frontend neu laden → wp-emoji-release.min.js und der oEmbed-Discovery-Link sind aus dem Quelltext verschwunden.",
    ],
    rollback: "Codeblock löschen — Emojis & oEmbed-Discovery sind sofort wieder aktiv.",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 4. Query-String-Cleaner
  // ────────────────────────────────────────────────────────────────────────
  {
    slug:        "query-string-cleaner",
    title:       "Query-Strings aus statischen Assets entfernen",
    description: "Strippt `?ver=…` und vergleichbare Cache-Buster aus CSS/JS-Pfaden, damit Proxy- und CDN-Caches (Cloudflare, Strato-Cache) die Assets sauber cachen können — ohne dass Asset-Updates verloren gehen.",
    problemTag:  "CDN-Cache-Hit-Rate · Wasted Bandwidth",
    fixType:     "Performance-Optimierung",
    hosterScope: "Alle Hoster (besonders sinnvoll mit Cloudflare / Hoster-Cache)",
    effectScope: "Frontend",
    warning:     "Wenn du Plugins/Themes oft updatest und KEIN Cache-Plugin nutzt, kann ein einzelner Hard-Refresh nötig sein, bis ein CSS-Update beim User ankommt. Mit WP Rocket / W3 Total Cache greift deren Cache-Versioning trotzdem.",
    safetyCheck: `// Caching-Plugins erledigen Query-String-Stripping bereits — kein Doppel-Apply.
$wf_active = (array) get_option( 'active_plugins' );
foreach ( array(
    'wp-rocket/wp-rocket.php',
    'w3-total-cache/w3-total-cache.php',
    'wp-super-cache/wp-cache.php',
) as $wf_cache ) {
    if ( in_array( $wf_cache, $wf_active, true ) ) {
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            error_log( 'WebsiteFix Smart-Fix [query-strings]: skipped — handled by ' . $wf_cache . '.' );
        }
        return;
    }
}`,
    body: `// Query-Strings aus statischen Asset-URLs entfernen.
// Greift in src/href, auch wenn das Plugin/Theme ?ver=X.Y anhängt.
function wf_smartfix_strip_ver_from_assets( $src ) {
    if ( strpos( $src, '?ver=' ) !== false ) {
        $src = remove_query_arg( 'ver', $src );
    }
    return $src;
}
add_filter( 'style_loader_src',  'wf_smartfix_strip_ver_from_assets', 10, 1 );
add_filter( 'script_loader_src', 'wf_smartfix_strip_ver_from_assets', 10, 1 );

// Hinweis für CDN-Setups (Cloudflare etc.):
// In Cache-Rules eine Regel "Cache Everything" für /wp-content/* + /wp-includes/*
// hinzufügen, dann purgest du nach jedem Plugin-Update einmal manuell den Cache.
// Alternativ: Plugin "Cache Buster" für File-Modify-Time-basierte Versionierung.`,
    installSteps: [
      "Snippet kopieren.",
      "In functions.php oder Code-Snippets-Plugin einfügen.",
      "Speichern. Quelltext der Site prüfen — `<link href=\"...style.css\">` statt `...style.css?ver=6.4.3`.",
    ],
    rollback: "Codeblock löschen — WordPress hängt wieder `?ver=X.Y` an.",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 5. jQuery-Migrate-Drosselung
  // ────────────────────────────────────────────────────────────────────────
  {
    slug:        "jquery-migrate-drosseln",
    title:       "jQuery-Migrate aus dem Frontend entfernen",
    description: "Entfernt `jquery-migrate.min.js` (~11 KB) aus dem Frontend, lässt sie im Admin aber aktiv. Auf den meisten modernen Themes ist Migrate seit Jahren überflüssig — falls ein altes Plugin doch noch jQuery-1.x-Syntax nutzt, fällt es nur im Frontend auf.",
    problemTag:  "Frontend-Bloat · Legacy-Code",
    fixType:     "Performance-Optimierung",
    hosterScope: "Alle Hoster",
    effectScope: "Frontend",
    warning:     "Bei Themes älter als 2020 oder Custom-Code mit Konstrukten wie `$.browser` / `$.live()` vor dem Aktivieren in einer Staging-Umgebung testen — diese Patterns würden ohne Migrate brechen.",
    safetyCheck: `// "Disable jQuery Migrate" / Perfmatters managen das schon. Außerdem:
// im WP_DEBUG-Modus loggen wir den Disable, damit Migrate-Console-Warnings
// in Staging-Tests nicht als Plugin-Bug fehlgedeutet werden.
$wf_active = (array) get_option( 'active_plugins' );
foreach ( array(
    'disable-jquery-migrate/disable-jquery-migrate.php',
    'perfmatters/perfmatters.php',
) as $wf_skip ) {
    if ( in_array( $wf_skip, $wf_active, true ) ) {
        if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
            error_log( 'WebsiteFix Smart-Fix [jquery-migrate]: skipped — handled by ' . $wf_skip . '.' );
        }
        return;
    }
}
if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
    error_log( 'WebsiteFix Smart-Fix [jquery-migrate]: aktiv — jQuery-Migrate aus Frontend entfernt.' );
}`,
    body: `// jQuery-Migrate nur im Frontend rauswerfen.
// Im Admin bleibt es geladen, weil dort ältere Plugins (Gutenberg-Blöcke,
// Builder) gelegentlich noch darauf bauen.
add_action( 'wp_default_scripts', function( $scripts ) {
    if ( is_admin() ) {
        return;
    }
    if ( ! empty( $scripts->registered['jquery'] ) ) {
        $deps = $scripts->registered['jquery']->deps;
        // Migrate aus den jQuery-Dependencies entfernen
        $scripts->registered['jquery']->deps = array_diff(
            (array) $deps,
            array( 'jquery-migrate' )
        );
    }
}, 1, 1 );

// Optional: jQuery-Migrate-Console-Warnings unterdrücken,
// falls ein Plugin sie im Admin-Footer ausgibt.
add_filter( 'script_loader_tag', function( $tag, $handle ) {
    if ( 'jquery-migrate' === $handle && ! is_admin() ) {
        return '';
    }
    return $tag;
}, 10, 2 );`,
    installSteps: [
      "Snippet kopieren.",
      "In functions.php oder Code-Snippets-Plugin einfügen.",
      "Speichern. Frontend laden, Browser-DevTools → Console: kein jQuery-Migrate-Warning mehr, kein migrate.min.js im Network-Tab.",
    ],
    rollback: "Codeblock löschen — Migrate ist sofort wieder im Frontend aktiv.",
    blogPost: {
      slug:       "jquery-migrate-wordpress-entfernen",
      anchorText: "Frontend-only vs. Plugin-Total-Off — der Unterschied im Detail",
    },
  },
];

/** Slug → Snippet-Lookup. */
export function getSnippet(slug: string): Snippet | null {
  return SNIPPETS.find(s => s.slug === slug) ?? null;
}
