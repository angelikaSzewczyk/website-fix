/**
 * tech-detector/rules.ts
 *
 * Technology rule registry — the authoritative pattern database.
 *
 * Design principles:
 * - Rules are purely declarative data (no logic inside rules themselves)
 * - Each rule contributes a weight to a category+value bucket
 * - Multiple matching rules for the same value stack (capped at 1.0)
 * - Weights reflect signal reliability:
 *     1.0 = definitive (dedicated API endpoint, unique header)
 *     0.8 = strong     (unique path, generator meta tag)
 *     0.6 = medium     (script URL pattern, class name)
 *     0.4 = weak       (generic keyword, ambiguous pattern)
 *
 * To add a new technology: just push a DetectionRule into RULES.
 */

import type { DetectionRule } from "./types";

export const RULES: DetectionRule[] = [

  // ══════════════════════════════════════════════════════════════
  // CMS
  // ══════════════════════════════════════════════════════════════

  // ── WordPress ────────────────────────────────────────────────
  {
    category: "cms", value: "WordPress", source: "html",
    pattern: /\/wp-content\//,
    weight: 0.85, evidence: "WordPress-Pfad /wp-content/ im HTML gefunden",
  },
  {
    category: "cms", value: "WordPress", source: "html",
    pattern: /\/wp-includes\//,
    weight: 0.75, evidence: "WordPress-Pfad /wp-includes/ im HTML gefunden",
  },
  {
    category: "cms", value: "WordPress", source: "html",
    pattern: /wp-json/,
    weight: 0.80, evidence: "WordPress REST API (wp-json) referenziert",
  },
  {
    category: "cms", value: "WordPress", source: "meta",
    key: "generator", pattern: /wordpress/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'WordPress'",
  },
  {
    category: "cms", value: "WordPress", source: "header",
    key: "x-powered-by", pattern: /wordpress/i,
    weight: 0.90, evidence: "X-Powered-By-Header enthält 'WordPress'",
  },
  {
    category: "cms", value: "WordPress", source: "script-url",
    pattern: /\/wp-content\/plugins\//,
    weight: 0.80, evidence: "WordPress Plugin-Skript geladen",
  },
  {
    category: "cms", value: "WordPress", source: "script-url",
    pattern: /\/wp-includes\/js\//,
    weight: 0.75, evidence: "WordPress Core-Skript geladen",
  },

  // ── Shopify ──────────────────────────────────────────────────
  {
    category: "cms", value: "Shopify", source: "html",
    pattern: /cdn\.shopify\.com/,
    weight: 0.95, evidence: "Shopify CDN-Domain im HTML gefunden",
  },
  {
    category: "cms", value: "Shopify", source: "html",
    pattern: /shopify\.com\/s\//,
    weight: 0.90, evidence: "Shopify Asset-URL gefunden",
  },
  {
    category: "cms", value: "Shopify", source: "header",
    key: "x-shopify-stage", pattern: /.+/,
    weight: 1.0, evidence: "Shopify-Header 'x-shopify-stage' vorhanden",
  },
  {
    category: "cms", value: "Shopify", source: "header",
    key: "x-shardid", pattern: /.+/,
    weight: 0.85, evidence: "Shopify Shard-Header gefunden",
  },
  {
    category: "cms", value: "Shopify", source: "html",
    pattern: /shopify\.Checkout/,
    weight: 0.85, evidence: "Shopify Checkout-Objekt im HTML gefunden",
  },
  {
    category: "cms", value: "Shopify", source: "meta",
    key: "generator", pattern: /shopify/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'Shopify'",
  },

  // ── Wix ──────────────────────────────────────────────────────
  {
    category: "cms", value: "Wix", source: "html",
    pattern: /wixstatic\.com/,
    weight: 0.95, evidence: "Wix Static Asset CDN gefunden",
  },
  {
    category: "cms", value: "Wix", source: "html",
    pattern: /wix\.com\/lpviral/,
    weight: 0.85, evidence: "Wix-Domain im HTML gefunden",
  },
  {
    category: "cms", value: "Wix", source: "html",
    pattern: /"site-assets\.wix\.com/,
    weight: 0.90, evidence: "Wix Site Assets CDN gefunden",
  },
  {
    category: "cms", value: "Wix", source: "header",
    key: "x-wix-request-id", pattern: /.+/,
    weight: 1.0, evidence: "Wix Request-ID-Header vorhanden",
  },
  {
    category: "cms", value: "Wix", source: "meta",
    key: "generator", pattern: /wix\.com/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'wix.com'",
  },

  // ── Webflow ──────────────────────────────────────────────────
  {
    category: "cms", value: "Webflow", source: "html",
    pattern: /webflow\.com/,
    weight: 0.90, evidence: "Webflow-Domain im HTML gefunden",
  },
  {
    category: "cms", value: "Webflow", source: "html",
    pattern: /data-wf-page/,
    weight: 0.95, evidence: "Webflow Seiten-Attribut 'data-wf-page' gefunden",
  },
  {
    category: "cms", value: "Webflow", source: "html",
    pattern: /data-wf-site/,
    weight: 0.90, evidence: "Webflow Site-Attribut 'data-wf-site' gefunden",
  },
  {
    category: "cms", value: "Webflow", source: "meta",
    key: "generator", pattern: /webflow/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'Webflow'",
  },

  // ── Squarespace ──────────────────────────────────────────────
  {
    category: "cms", value: "Squarespace", source: "html",
    pattern: /squarespace\.com/,
    weight: 0.85, evidence: "Squarespace-Domain im HTML gefunden",
  },
  {
    category: "cms", value: "Squarespace", source: "html",
    pattern: /data-squarespace-/,
    weight: 0.95, evidence: "Squarespace Data-Attribut gefunden",
  },
  {
    category: "cms", value: "Squarespace", source: "meta",
    key: "generator", pattern: /squarespace/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'Squarespace'",
  },

  // ── TYPO3 ────────────────────────────────────────────────────
  {
    category: "cms", value: "TYPO3", source: "html",
    pattern: /\/typo3\//,
    weight: 0.80, evidence: "TYPO3-Pfad im HTML gefunden",
  },
  {
    category: "cms", value: "TYPO3", source: "html",
    pattern: /id="typo3-/,
    weight: 0.75, evidence: "TYPO3-Element-ID gefunden",
  },
  {
    category: "cms", value: "TYPO3", source: "meta",
    key: "generator", pattern: /typo3/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'TYPO3'",
  },
  {
    category: "cms", value: "TYPO3", source: "html",
    pattern: /typo3conf/,
    weight: 0.85, evidence: "TYPO3-Konfigurationspfad gefunden",
  },

  // ── Joomla ───────────────────────────────────────────────────
  {
    category: "cms", value: "Joomla", source: "meta",
    key: "generator", pattern: /joomla/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'Joomla'",
  },
  {
    category: "cms", value: "Joomla", source: "html",
    pattern: /\/components\/com_/,
    weight: 0.80, evidence: "Joomla Komponenten-Pfad gefunden",
  },
  {
    category: "cms", value: "Joomla", source: "html",
    pattern: /\/modules\/mod_/,
    weight: 0.75, evidence: "Joomla Modul-Pfad gefunden",
  },

  // ── Drupal ───────────────────────────────────────────────────
  {
    category: "cms", value: "Drupal", source: "meta",
    key: "generator", pattern: /drupal/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'Drupal'",
  },
  {
    category: "cms", value: "Drupal", source: "html",
    pattern: /drupal\.settings/,
    weight: 0.90, evidence: "Drupal.settings Objekt gefunden",
  },
  {
    category: "cms", value: "Drupal", source: "html",
    pattern: /\/sites\/default\/files\//,
    weight: 0.85, evidence: "Drupal Standard-Dateipfad gefunden",
  },
  {
    category: "cms", value: "Drupal", source: "header",
    key: "x-generator", pattern: /drupal/i,
    weight: 0.95, evidence: "X-Generator-Header enthält 'Drupal'",
  },

  // ── Ghost ────────────────────────────────────────────────────
  {
    category: "cms", value: "Ghost", source: "meta",
    key: "generator", pattern: /ghost/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'Ghost'",
  },
  {
    category: "cms", value: "Ghost", source: "html",
    pattern: /ghost\.io/,
    weight: 0.85, evidence: "Ghost.io Domain im HTML gefunden",
  },
  {
    category: "cms", value: "Ghost", source: "script-url",
    pattern: /\/ghost\/api\//,
    weight: 0.90, evidence: "Ghost API-Pfad gefunden",
  },

  // ── Jimdo ────────────────────────────────────────────────────
  {
    category: "cms", value: "Jimdo", source: "html",
    pattern: /jimdo\.com/,
    weight: 0.85, evidence: "Jimdo-Domain im HTML gefunden",
  },
  {
    category: "cms", value: "Jimdo", source: "meta",
    key: "generator", pattern: /jimdo/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'Jimdo'",
  },

  // ══════════════════════════════════════════════════════════════
  // PAGE BUILDERS
  // ══════════════════════════════════════════════════════════════

  // ── Elementor ────────────────────────────────────────────────
  {
    category: "builder", value: "Elementor", source: "html",
    pattern: /data-elementor-type/,
    weight: 0.95, evidence: "Elementor Typ-Attribut 'data-elementor-type' gefunden",
  },
  {
    category: "builder", value: "Elementor", source: "html",
    pattern: /class="elementor/,
    weight: 0.85, evidence: "Elementor CSS-Klasse gefunden",
  },
  {
    category: "builder", value: "Elementor", source: "html",
    pattern: /elementor-widget-container/,
    weight: 0.80, evidence: "Elementor Widget-Container-Klasse gefunden",
  },
  {
    category: "builder", value: "Elementor", source: "script-url",
    pattern: /\/plugins\/elementor\//,
    weight: 0.90, evidence: "Elementor Plugin-Skript geladen",
  },
  {
    category: "builder", value: "Elementor", source: "link-url",
    pattern: /\/plugins\/elementor\//,
    weight: 0.85, evidence: "Elementor Plugin-Stylesheet geladen",
  },

  // ── Divi ─────────────────────────────────────────────────────
  {
    category: "builder", value: "Divi", source: "html",
    pattern: /data-et-multi-view/,
    weight: 0.90, evidence: "Divi Multi-View-Attribut gefunden",
  },
  {
    category: "builder", value: "Divi", source: "html",
    pattern: /class="et_pb_/,
    weight: 0.85, evidence: "Divi 'et_pb_'-Klasse gefunden",
  },
  {
    category: "builder", value: "Divi", source: "html",
    pattern: /et-db\.js/,
    weight: 0.80, evidence: "Divi Frontend-Skript gefunden",
  },
  {
    category: "builder", value: "Divi", source: "script-url",
    pattern: /divi\/js\//,
    weight: 0.85, evidence: "Divi Theme-Skript geladen",
  },

  // ── WPBakery ─────────────────────────────────────────────────
  {
    category: "builder", value: "WPBakery", source: "html",
    pattern: /class="vc_row/,
    weight: 0.85, evidence: "WPBakery 'vc_row'-Klasse gefunden",
  },
  {
    category: "builder", value: "WPBakery", source: "html",
    pattern: /class="wpb_wrapper/,
    weight: 0.85, evidence: "WPBakery Wrapper-Klasse gefunden",
  },
  {
    category: "builder", value: "WPBakery", source: "script-url",
    pattern: /js_composer/,
    weight: 0.90, evidence: "WPBakery Composer-Skript geladen",
  },

  // ── Beaver Builder ───────────────────────────────────────────
  {
    category: "builder", value: "Beaver Builder", source: "html",
    pattern: /class="fl-row/,
    weight: 0.85, evidence: "Beaver Builder 'fl-row'-Klasse gefunden",
  },
  {
    category: "builder", value: "Beaver Builder", source: "html",
    pattern: /class="fl-builder/,
    weight: 0.90, evidence: "Beaver Builder CSS-Klasse gefunden",
  },
  {
    category: "builder", value: "Beaver Builder", source: "script-url",
    pattern: /fl-builder\.min\.js/,
    weight: 0.90, evidence: "Beaver Builder Skript geladen",
  },

  // ── Avada ────────────────────────────────────────────────────
  {
    category: "builder", value: "Avada", source: "html",
    pattern: /class="fusion-/,
    weight: 0.85, evidence: "Avada Fusion-Klasse gefunden",
  },
  {
    category: "builder", value: "Avada", source: "script-url",
    pattern: /avada\//,
    weight: 0.85, evidence: "Avada Theme-Skript geladen",
  },
  {
    category: "builder", value: "Avada", source: "html",
    pattern: /avada-fusion-builder/,
    weight: 0.90, evidence: "Avada Fusion Builder Markup gefunden",
  },

  // ── Gutenberg ────────────────────────────────────────────────
  {
    category: "builder", value: "Gutenberg", source: "html",
    pattern: /class="wp-block-/,
    weight: 0.80, evidence: "Gutenberg Block-Klasse 'wp-block-' gefunden",
  },
  {
    category: "builder", value: "Gutenberg", source: "html",
    pattern: /class="wp-container-/,
    weight: 0.75, evidence: "Gutenberg Container-Klasse gefunden",
  },
  {
    category: "builder", value: "Gutenberg", source: "html",
    pattern: /<!-- wp:/,
    weight: 0.90, evidence: "Gutenberg Block-Kommentare im HTML gefunden",
  },

  // ── Bricks ───────────────────────────────────────────────────
  {
    category: "builder", value: "Bricks", source: "html",
    pattern: /class="bricks-/,
    weight: 0.90, evidence: "Bricks Builder Klasse gefunden",
  },
  {
    category: "builder", value: "Bricks", source: "script-url",
    pattern: /bricks\/assets\//,
    weight: 0.90, evidence: "Bricks Builder Skript geladen",
  },

  // ── Oxygen ───────────────────────────────────────────────────
  {
    category: "builder", value: "Oxygen", source: "html",
    pattern: /class="ct-section/,
    weight: 0.85, evidence: "Oxygen Builder 'ct-section'-Klasse gefunden",
  },
  {
    category: "builder", value: "Oxygen", source: "script-url",
    pattern: /oxygen\/component-framework\//,
    weight: 0.90, evidence: "Oxygen Component Framework geladen",
  },

  // ══════════════════════════════════════════════════════════════
  // FRONTEND FRAMEWORKS
  // ══════════════════════════════════════════════════════════════

  // ── Next.js ──────────────────────────────────────────────────
  {
    category: "framework", value: "Next.js", source: "html",
    pattern: /__next_data__/i,
    weight: 1.0, evidence: "Next.js __NEXT_DATA__ Skript-Tag gefunden",
  },
  {
    category: "framework", value: "Next.js", source: "script-url",
    pattern: /\/_next\/static\//,
    weight: 0.95, evidence: "Next.js Static-Asset-Pfad '/_next/' gefunden",
  },
  {
    category: "framework", value: "Next.js", source: "header",
    key: "x-powered-by", pattern: /next\.js/i,
    weight: 1.0, evidence: "X-Powered-By-Header enthält 'Next.js'",
  },
  {
    category: "framework", value: "Next.js", source: "html",
    pattern: /next\/dist\/client/,
    weight: 0.90, evidence: "Next.js Client Bundle-Referenz gefunden",
  },

  // ── Nuxt.js ──────────────────────────────────────────────────
  {
    category: "framework", value: "Nuxt.js", source: "html",
    pattern: /__nuxt__/i,
    weight: 1.0, evidence: "Nuxt.js __NUXT__ Objekt gefunden",
  },
  {
    category: "framework", value: "Nuxt.js", source: "script-url",
    pattern: /\/_nuxt\//,
    weight: 0.95, evidence: "Nuxt.js Asset-Pfad '/_nuxt/' gefunden",
  },

  // ── React (standalone) ───────────────────────────────────────
  {
    category: "framework", value: "React", source: "html",
    pattern: /data-reactroot/,
    weight: 0.85, evidence: "React 'data-reactroot' Attribut gefunden",
  },
  {
    category: "framework", value: "React", source: "script-url",
    pattern: /react[-.]dom\./,
    weight: 0.85, evidence: "React DOM Skript geladen",
  },

  // ── Vue.js ───────────────────────────────────────────────────
  {
    category: "framework", value: "Vue.js", source: "html",
    pattern: /__vue_app__/,
    weight: 0.95, evidence: "Vue.js __vue_app__ Objekt gefunden",
  },
  {
    category: "framework", value: "Vue.js", source: "html",
    pattern: / data-v-[0-9a-f]{7}/,
    weight: 0.75, evidence: "Vue.js Scoped-CSS Attribut gefunden",
  },

  // ── Angular ──────────────────────────────────────────────────
  {
    category: "framework", value: "Angular", source: "html",
    pattern: /ng-version=/,
    weight: 0.95, evidence: "Angular ng-version Attribut gefunden",
  },
  {
    category: "framework", value: "Angular", source: "html",
    pattern: / _nghost-/,
    weight: 0.85, evidence: "Angular Component-Host Attribut gefunden",
  },

  // ── Svelte ───────────────────────────────────────────────────
  {
    category: "framework", value: "Svelte", source: "html",
    pattern: /__svelte/,
    weight: 0.90, evidence: "Svelte Internalname gefunden",
  },

  // ── Astro ────────────────────────────────────────────────────
  {
    category: "framework", value: "Astro", source: "html",
    pattern: /astro-island/,
    weight: 0.95, evidence: "Astro Island-Komponente gefunden",
  },
  {
    category: "framework", value: "Astro", source: "header",
    key: "x-astro-cache-status", pattern: /.+/,
    weight: 1.0, evidence: "Astro Cache-Header gefunden",
  },

  // ── Gatsby ───────────────────────────────────────────────────
  {
    category: "framework", value: "Gatsby", source: "html",
    pattern: /gatsby-focus-wrapper/,
    weight: 0.95, evidence: "Gatsby Focus-Wrapper gefunden",
  },
  {
    category: "framework", value: "Gatsby", source: "script-url",
    pattern: /\/static\/gatsby\//,
    weight: 0.90, evidence: "Gatsby Static-Skript gefunden",
  },

  // ══════════════════════════════════════════════════════════════
  // E-COMMERCE
  // ══════════════════════════════════════════════════════════════

  {
    category: "ecommerce", value: "WooCommerce", source: "html",
    pattern: /class="woocommerce/,
    weight: 0.90, evidence: "WooCommerce CSS-Klasse gefunden",
  },
  {
    category: "ecommerce", value: "WooCommerce", source: "html",
    pattern: /is-woocommerce/,
    weight: 0.85, evidence: "WooCommerce Body-Klasse gefunden",
  },
  {
    category: "ecommerce", value: "WooCommerce", source: "script-url",
    pattern: /woocommerce\//,
    weight: 0.85, evidence: "WooCommerce Skript geladen",
  },
  {
    category: "ecommerce", value: "Magento", source: "html",
    pattern: /mage\./,
    weight: 0.75, evidence: "Magento 'Mage.' Objekt gefunden",
  },
  {
    category: "ecommerce", value: "Magento", source: "html",
    pattern: /\/skin\/frontend\//,
    weight: 0.85, evidence: "Magento Skin-Pfad gefunden",
  },
  {
    category: "ecommerce", value: "PrestaShop", source: "meta",
    key: "generator", pattern: /prestashop/i,
    weight: 1.0, evidence: "Meta-Generator-Tag enthält 'PrestaShop'",
  },
  {
    category: "ecommerce", value: "PrestaShop", source: "html",
    pattern: /prestashop/i,
    weight: 0.65, evidence: "PrestaShop-Bezeichner im HTML gefunden",
  },

  // ══════════════════════════════════════════════════════════════
  // SERVER
  // ══════════════════════════════════════════════════════════════

  {
    category: "server", value: "Nginx", source: "header",
    key: "server", pattern: /nginx/i,
    weight: 1.0, evidence: "Server-Header enthält 'nginx'",
  },
  {
    category: "server", value: "Apache", source: "header",
    key: "server", pattern: /apache/i,
    weight: 1.0, evidence: "Server-Header enthält 'Apache'",
  },
  {
    category: "server", value: "LiteSpeed", source: "header",
    key: "server", pattern: /litespeed/i,
    weight: 1.0, evidence: "Server-Header enthält 'LiteSpeed'",
  },
  {
    category: "server", value: "Cloudflare", source: "header",
    key: "server", pattern: /cloudflare/i,
    weight: 1.0, evidence: "Server-Header enthält 'cloudflare'",
  },
  {
    category: "server", value: "Cloudflare", source: "header",
    key: "cf-ray", pattern: /.+/,
    weight: 0.95, evidence: "Cloudflare CF-Ray-Header vorhanden",
  },
  {
    category: "server", value: "Microsoft IIS", source: "header",
    key: "server", pattern: /microsoft-iis|iis\//i,
    weight: 1.0, evidence: "Server-Header enthält 'Microsoft-IIS'",
  },
  {
    category: "server", value: "OpenResty", source: "header",
    key: "server", pattern: /openresty/i,
    weight: 1.0, evidence: "Server-Header enthält 'OpenResty'",
  },
  {
    category: "server", value: "Caddy", source: "header",
    key: "server", pattern: /caddy/i,
    weight: 1.0, evidence: "Server-Header enthält 'Caddy'",
  },
  {
    category: "server", value: "Node.js", source: "header",
    key: "x-powered-by", pattern: /express/i,
    weight: 0.85, evidence: "X-Powered-By-Header enthält 'Express'",
  },

  // ══════════════════════════════════════════════════════════════
  // PHP VERSION
  // ══════════════════════════════════════════════════════════════

  {
    category: "phpVersion", value: "PHP 8.3", source: "header",
    key: "x-powered-by", pattern: /php\/8\.3/i,
    weight: 1.0, evidence: "X-Powered-By gibt PHP 8.3 an",
  },
  {
    category: "phpVersion", value: "PHP 8.2", source: "header",
    key: "x-powered-by", pattern: /php\/8\.2/i,
    weight: 1.0, evidence: "X-Powered-By gibt PHP 8.2 an",
  },
  {
    category: "phpVersion", value: "PHP 8.1", source: "header",
    key: "x-powered-by", pattern: /php\/8\.1/i,
    weight: 1.0, evidence: "X-Powered-By gibt PHP 8.1 an",
  },
  {
    category: "phpVersion", value: "PHP 8.0", source: "header",
    key: "x-powered-by", pattern: /php\/8\.0/i,
    weight: 1.0, evidence: "X-Powered-By gibt PHP 8.0 an",
  },
  {
    category: "phpVersion", value: "PHP 7.4", source: "header",
    key: "x-powered-by", pattern: /php\/7\.4/i,
    weight: 1.0, evidence: "X-Powered-By gibt PHP 7.4 an",
  },
  {
    category: "phpVersion", value: "PHP 7.x", source: "header",
    key: "x-powered-by", pattern: /php\/7\./i,
    weight: 0.95, evidence: "X-Powered-By gibt PHP 7.x an",
  },
  {
    category: "phpVersion", value: "PHP 8.x", source: "header",
    key: "x-powered-by", pattern: /php\/8\./i,
    weight: 0.90, evidence: "X-Powered-By gibt PHP 8.x an",
  },
  // Infer PHP from WordPress + server context (lower confidence)
  {
    category: "phpVersion", value: "PHP (aktiv)", source: "html",
    pattern: /\/wp-content\//,
    weight: 0.40, evidence: "WordPress erkannt — PHP wird vorausgesetzt",
  },

  // ══════════════════════════════════════════════════════════════
  // HOSTING
  // ══════════════════════════════════════════════════════════════

  {
    category: "hosting", value: "Vercel", source: "header",
    key: "x-vercel-id", pattern: /.+/,
    weight: 1.0, evidence: "Vercel Deployment-ID-Header gefunden",
  },
  {
    category: "hosting", value: "Vercel", source: "header",
    key: "x-vercel-cache", pattern: /.+/,
    weight: 0.95, evidence: "Vercel Cache-Header gefunden",
  },
  {
    category: "hosting", value: "Netlify", source: "header",
    key: "x-nf-request-id", pattern: /.+/,
    weight: 1.0, evidence: "Netlify Request-ID-Header gefunden",
  },
  {
    category: "hosting", value: "Netlify", source: "header",
    key: "server", pattern: /netlify/i,
    weight: 0.95, evidence: "Server-Header enthält 'Netlify'",
  },
  {
    category: "hosting", value: "AWS / CloudFront", source: "header",
    key: "x-amz-cf-id", pattern: /.+/,
    weight: 0.95, evidence: "AWS CloudFront ID-Header gefunden",
  },
  {
    category: "hosting", value: "AWS / CloudFront", source: "header",
    key: "via", pattern: /cloudfront/i,
    weight: 0.90, evidence: "Via-Header enthält 'CloudFront'",
  },
  {
    category: "hosting", value: "Kinsta", source: "header",
    key: "x-kinsta-cache", pattern: /.+/,
    weight: 1.0, evidence: "Kinsta Cache-Header gefunden",
  },
  {
    category: "hosting", value: "WP Engine", source: "header",
    key: "x-cache", pattern: /wpe\s/i,
    weight: 0.90, evidence: "WP Engine Cache-Header gefunden",
  },
  {
    category: "hosting", value: "Flywheel", source: "header",
    key: "x-ah-environment", pattern: /.+/,
    weight: 0.85, evidence: "Flywheel Environment-Header gefunden",
  },
  {
    category: "hosting", value: "Cloudflare Pages", source: "header",
    key: "cf-ray", pattern: /.+/,
    weight: 0.60, evidence: "Cloudflare Header gefunden (möglicherweise Cloudflare Pages)",
  },

  // ══════════════════════════════════════════════════════════════
  // ANALYTICS
  // ══════════════════════════════════════════════════════════════

  {
    category: "analytics", value: "Google Analytics 4", source: "script-url",
    pattern: /googletagmanager\.com\/gtag\/js/,
    weight: 0.90, evidence: "Google Analytics 4 gtag.js geladen",
  },
  {
    category: "analytics", value: "Google Analytics 4", source: "html",
    pattern: /gtag\('config',\s*'g-[a-z0-9]+'/i,
    weight: 0.95, evidence: "GA4 Measurement-ID im HTML gefunden",
  },
  {
    category: "analytics", value: "Google Analytics (UA)", source: "script-url",
    pattern: /google-analytics\.com\/analytics\.js/,
    weight: 0.95, evidence: "Google Analytics Universal (analytics.js) geladen",
  },
  {
    category: "analytics", value: "Google Analytics (UA)", source: "html",
    pattern: /ua-\d{4,}-\d+/i,
    weight: 0.85, evidence: "Google Analytics UA-Tracking-ID im HTML gefunden",
  },
  {
    category: "analytics", value: "Matomo", source: "script-url",
    pattern: /matomo\.js|piwik\.js/,
    weight: 0.95, evidence: "Matomo Analytics-Skript geladen",
  },
  {
    category: "analytics", value: "Plausible Analytics", source: "script-url",
    pattern: /plausible\.io\/js\//,
    weight: 1.0, evidence: "Plausible Analytics Skript geladen",
  },
  {
    category: "analytics", value: "Fathom Analytics", source: "script-url",
    pattern: /cdn\.usefathom\.com/,
    weight: 1.0, evidence: "Fathom Analytics Skript geladen",
  },

  // ══════════════════════════════════════════════════════════════
  // TAG MANAGER
  // ══════════════════════════════════════════════════════════════

  {
    category: "tagManager", value: "Google Tag Manager", source: "script-url",
    pattern: /googletagmanager\.com\/gtm\.js/,
    weight: 1.0, evidence: "Google Tag Manager Skript geladen",
  },
  {
    category: "tagManager", value: "Google Tag Manager", source: "html",
    pattern: /gtm-[a-z0-9]+/i,
    weight: 0.80, evidence: "Google Tag Manager Container-ID gefunden",
  },

  // ══════════════════════════════════════════════════════════════
  // TRACKING / ADVERTISING PIXELS
  // ══════════════════════════════════════════════════════════════

  {
    category: "tracking", value: "Meta Pixel", source: "script-url",
    pattern: /connect\.facebook\.net/,
    weight: 0.95, evidence: "Meta/Facebook Pixel Skript geladen",
  },
  {
    category: "tracking", value: "Meta Pixel", source: "html",
    pattern: /fbevents\.js/,
    weight: 0.90, evidence: "Facebook Events Skript referenziert",
  },
  {
    category: "tracking", value: "Hotjar", source: "script-url",
    pattern: /static\.hotjar\.com/,
    weight: 1.0, evidence: "Hotjar Tracking-Skript geladen",
  },
  {
    category: "tracking", value: "Hotjar", source: "html",
    pattern: /hjid:/,
    weight: 0.85, evidence: "Hotjar Site-ID im HTML gefunden",
  },
  {
    category: "tracking", value: "Microsoft Clarity", source: "script-url",
    pattern: /clarity\.ms/,
    weight: 1.0, evidence: "Microsoft Clarity Skript geladen",
  },
  {
    category: "tracking", value: "LinkedIn Insight", source: "script-url",
    pattern: /snap\.licdn\.com|linkedin\.com\/px\//,
    weight: 1.0, evidence: "LinkedIn Insight Tag geladen",
  },
  {
    category: "tracking", value: "TikTok Pixel", source: "script-url",
    pattern: /analytics\.tiktok\.com/,
    weight: 1.0, evidence: "TikTok Pixel Skript geladen",
  },
  {
    category: "tracking", value: "Pinterest Tag", source: "script-url",
    pattern: /pintrk/,
    weight: 0.90, evidence: "Pinterest Tag referenziert",
  },
];

/**
 * Returns all rules for a specific category.
 * Useful for targeted detection or unit testing.
 */
export function rulesForCategory(category: DetectionRule["category"]): DetectionRule[] {
  return RULES.filter(r => r.category === category);
}
