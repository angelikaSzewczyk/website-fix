=== WebsiteFix One-Click Performance Optimizer ===
Contributors: websitefixcom
Tags: performance, optimization, heartbeat, xmlrpc, jquery
Requires at least: 5.9
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.3.1
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Activate 7 WordPress performance and security fixes with one click. Safe, reversible, no code editing required.

== Description ==

You've heard "you should throttle the Heartbeat API" or "xmlrpc.php should probably be disabled"? But every time you end up in a forum thread with 12 conflicting code snippets, three of which will wreck your site.

**WebsiteFix One-Click Optimizer** solves exactly this problem. Seven hand-curated performance and security fixes, each with auto-safety-check (automatically detects conflicting plugins and does NOT intervene), each one-click-activatable and just as one-click reversible.

= The 7 Fixes =

**1. Throttle the Heartbeat API**
Reduces the WordPress Heartbeat frequency contextually: 60s in the admin, 120s in the post editor (instead of 15s), practically off on the frontend. Typical savings: 75–85% less admin-ajax.php load → lower CPU throttling at your host, significantly lower TTFB value.

**2. Disable XML-RPC & Pingbacks**
Closes the XML-RPC endpoint (by far the most common brute-force attack target on WordPress) and disables outbound pingbacks. Auto-safety-check: if Jetpack, Wordfence, or Sucuri are active, the fix does NOT intervene — you don't have to choose between security plugin and xmlrpc hardening. Plus REST API user enumeration protection for anonymous requests.

**3. Remove Emojis & oEmbed Discovery**
Removes the WordPress emoji polyfill scripts (`wp-emoji-release.min.js`, ~14 KB) and the oEmbed auto-discovery routes. Saves 2–3 HTTP requests per page load. URL embeds in the editor remain functional — only public discovery is turned off.

**4. Strip Query Strings from Static Assets**
Strips `?ver=…` from CSS/JS asset paths. Proxy and CDN caches (Cloudflare, host caches) can now cleanly cache the assets. Auto-safety-check: with WP Rocket / W3 Total Cache / WP Super Cache, the fix does NOT intervene — caching plugins handle this themselves.

**5. Remove jQuery Migrate from Frontend**
Removes `jquery-migrate.min.js` (~11 KB) from the frontend but keeps it active in the admin. On modern themes (2020+), Migrate is unnecessary. Lighthouse Performance score typically increases by 1–3 points.

**6. Block Author Archives (User Enumeration Protection)**
Prevents username discovery via `/?author=N` or `/author/<name>/`. Auto-safety-check: if Yoast already has Author Archives disabled, the fix does not intervene. The most well-known brute-force prep trick is neutralized — calls are 301-redirected to the homepage. Additionally: REST API user-individual endpoints blocked for anonymous calls.

**7. Hide WordPress Version from Frontend**
Removes the `<meta name="generator">` tag from the HTML head, from the RSS feed, and from asset URL `?ver=` strings. External scanners and brute-force bots can no longer directly identify the exact WordPress version — version-specific exploit-sweep attacks become more expensive. Auto-safety-check: if Wordfence / Sucuri / All-in-One Security / Perfmatters are active, the fix does not intervene (they handle this themselves).

= How It Works Technically =

When you activate a fix, the plugin writes a single PHP file to `/wp-content/mu-plugins/wf-optimizer-<fix-slug>.php`. WordPress automatically loads must-use plugins **before all regular plugins** — no activation workflow needed, no reload trick, the fix takes effect immediately.

When you deactivate, the file is deleted. Standard WordPress behavior returns immediately. When you uninstall the plugin itself, ALL fix files are automatically removed.

**We NEVER edit your functions.php.** We do not touch theme files, wp-config.php, or existing plugins. Each fix is isolated in its own file — you can inspect them yourself, and you can just as easily delete them manually if you don't want to use the plugin anymore.

All filesystem operations go through the WordPress WP_Filesystem API (`put_contents`, `delete`, `is_writable`, etc.) — no direct PHP filesystem calls.

= What It Does NOT Do =

* Writes nothing to your database (a single `wp_options` entry with the list of active fixes is the exception — ~50 bytes).
* Modifies no theme files, no functions.php, no wp-config.php.
* Does not automatically deactivate existing plugins — auto-safety-check detects conflicts and skips the fix.
* Sends no user data to external servers. Fully offline-capable.
* Shows no ad banners, no nag screen, no trial expiration.

= Who Is Behind This =

WebsiteFix is a WordPress diagnostic tool developed in Frankfurt, Germany. The seven snippets are ported 1:1 from our free Smart Fix Library at [website-fix.com/smart-fix-library](https://website-fix.com/smart-fix-library). The plugin is open source under GPL. Feedback/bugs: support@website-fix.com.

= Auf Deutsch / In German =

Sieben kuratierte WordPress-Performance- und Security-Fixes mit einem Klick aktivierbar. Jeder Fix kommt mit Safety-Check (erkennt konfligierende Plugins automatisch und greift dann NICHT ein). Aktivierte Fixes werden als Must-Use-Plugin-Datei in `/wp-content/mu-plugins/` mit dem Präfix `wf-optimizer-` abgelegt — kein Theme-Edit, kein Reload-Workaround, sofortige Rückgängig-Möglichkeit. Read-only-Verbindung zu deiner Datenbank — nur ein einziger `wp_options`-Eintrag mit ~50 Bytes wird gespeichert. Die sieben Snippets sind 1:1 aus unserer kostenlosen Smart-Fix-Library auf website-fix.com portiert.

== Installation ==

1. Search for "WebsiteFix One-Click Optimizer" under "Plugins → Add New" in the WordPress admin and activate it.
2. Under "Tools → WebsiteFix Optimizer", you'll find the 7 fix cards.
3. Per card: read the description, optionally expand "Show code" to inspect what will be written, then click "Activate fix".
4. Or click "Activate all 7 fixes at once" at the top for quick setup.
5. Reload the frontend — effects take place immediately.

**Note on file permissions:** The plugin needs write access to `/wp-content/mu-plugins/`. On most German hosts (IONOS, Strato, All-Inkl, Hetzner, webgo), this is standard. If the plugin shows a "write permissions missing" warning: contact hosting support or set CHMOD to 755.

== Frequently Asked Questions ==

= Will my theme or my functions.php be modified? =

No. The plugin writes exclusively to `/wp-content/mu-plugins/` with the prefix `wf-optimizer-` (e.g., `wf-optimizer-heartbeat-throttle.php`). All filesystem operations go through the WordPress WP_Filesystem API. Your theme, your functions.php, your wp-config.php are never touched.

= What happens when I deactivate the plugin? =

The mu-plugin fix files remain active — this is intentional. You activated the optimizations deliberately, so they should keep running even if you don't need the management UI anymore. If you really want to clean everything up: first deactivate all fixes in the admin UI, then uninstall the plugin ("Delete" instead of just "Deactivate").

= What happens when I delete the plugin? =

On delete (uninstall), ALL fix files are automatically removed and the options are cleaned up. Standard WordPress behavior returns.

= How can I see what will be written, BEFORE I click Activate? =

Each card has a "Show code" toggle. Click it and you see exactly the PHP code with all safety checks that will be written to the mu-plugin file. Fully transparent.

= How can I tell if my host is throttling my WordPress site? =

Three indicators: server response time (TTFB) above 800 ms under normal load, regular 503/504 errors during business hours, and emails from the host with subject "CPU usage increased". The most common culprit: the WordPress Heartbeat API. Activate the Heartbeat fix — CPU load usually normalizes within 24 hours.

= How do I reduce WordPress Heartbeat API load? =

Heartbeat self-calls every 15 seconds by default in the admin. The "Throttle Heartbeat API" fix in this plugin reduces the frequency contextually to 60s in the admin, 120s in the post editor, 300s on the frontend. Typical savings: 75–85% less admin-ajax.php load.

= How do I disable xmlrpc.php in WordPress? =

The "Disable XML-RPC & Pingbacks" fix in this plugin safely turns off xmlrpc.php. Auto-safety-check detects active Jetpack, Wordfence, or Sucuri and does NOT intervene in those cases — you don't have to choose between security plugin and xmlrpc hardening.

= Does the plugin work with WordPress Multisite? =

Yes. Since fixes are deposited as must-use plugins, they apply network-wide automatically — a one-time activation is enough for all sites in the network.

= What if I already use Heartbeat Control / WP Rocket / Wordfence? =

Each fix has an auto-safety-check that detects conflicting plugins and then deactivates itself. You don't run into double configurations.

= What data is sent to external servers? =

None. The plugin is fully offline-capable. No telemetry, no auto-update server, no analytics tracking.

= How does the plugin differ from "Heartbeat Control" / "Disable Emojis" / "Disable XML-RPC"? =

These single plugins each solve one thing. We bundle seven common performance and security weaknesses in one tool with consistent UX, per-fix auto-safety-check, transparent code preview before every apply, and an architecture (mu-plugins files) that isn't overwritten at theme-update time. Plus: one plugin in the admin instead of seven.

= Is the plugin GDPR-compliant? =

Yes. It processes no personal data, sends nothing to external servers, and stores only the list of active fix slugs in the WordPress options table (format: `["heartbeat-throttle","xmlrpc-disable"]`, ~50 bytes).

== Screenshots ==

1. The settings page with the 7 fix cards and live status indicators.
2. A single card with the code preview expanded before apply.
3. The master action "Activate all 7 fixes at once".

== Changelog ==

= 0.3.1 — 2026-05-15 =
* **WP.org review feedback applied:**
  * Text domain `websitefix-one-click-optimizer` renamed to `websitefix-one-click-performance-optimizer` to match the plugin slug.
  * Inline `<style>` block in the admin page replaced with `wp_register_style` + `wp_enqueue_style` + `wp_add_inline_style`, loaded only on the plugin's own settings screen via `admin_enqueue_scripts`.
  * Contributors slug corrected (`websitefix` → `websitefixcom`) to match the WordPress.org account.

= 0.3.0 — 2026-05-12 =
* **WP.org Plugin-Check compliance pass:**
  * All filesystem operations migrated from direct PHP calls (`rename`, `unlink`, `is_writable`, `rmdir`) to the WordPress WP_Filesystem API and `wp_delete_file()`.
  * Global variable prefixing — all uninstall.php locals prefixed with `$wfoco_`.
  * Hook probes (`apply_filters('heartbeat_settings')`, `apply_filters('xmlrpc_enabled')`) annotated with `phpcs:ignore` (legitimate WP-core probes, not false-prefixes).
* Readme translated to standard English (WP.org requirement since 2025-07).
* `Tested up to: 6.9` (matches current WordPress release).

= 0.2.0 — 2026-05-12 =
* **Two new fixes:** Block author archives (user enumeration protection) and hide WordPress version from frontend (generator tag, RSS feed generator, and asset `?ver=` strings). Both with auto-safety-check against Yoast, Wordfence, Sucuri, All-in-One Security, and Perfmatters.
* Plugin description updated from "5 fixes" to "7 fixes".
* Diagnostics for the two new slugs added — author-block via option state, version-hide via `has_action` probe on `wp_generator`.

= 0.1.1 — 2026-05-12 =
* **Critical bug fix:** mu-plugin files were written to a subfolder (`mu-plugins/wf-optimizer/`) in v0.1.0, which WordPress doesn't auto-load. Consequence: activated fixes sat on disk but didn't run. Now: flat under `mu-plugins/` with prefix `wf-optimizer-`.
* **Critical error fix:** the live diagnostic for query strings and jQuery migrate triggered a fatal when foreign plugins had handlers on `style_loader_src` or `wp_default_scripts` and reacted to our synthetic test URLs with an exception. Now the diagnostic reads the option state directly — no more filter probe.
* Uninstall now cleans up both the new flat files and legacy files from the v0.1.0 subfolder.

= 0.1.0 — 2026-05-13 =
* Initial public beta.

== Upgrade Notice ==

= 0.3.1 =
**WP.org review feedback:** text domain renamed to match plugin slug, admin CSS migrated to wp_enqueue_style + wp_add_inline_style, contributors slug corrected. No functional changes.

= 0.3.0 =
**Plugin-Check compliance release:** filesystem operations refactored to WP_Filesystem API, readme in English (WP.org requirement), Tested up to 6.9. Submission-ready.

= 0.2.0 =
**Feature release:** Two new fixes (author archive block + WordPress version hide), both with auto-safety-check against conflicting security plugins. Existing 5 fixes unchanged.

= 0.1.1 =
**Bug-fix release:** v0.1.0 had two critical bugs (mu-plugins subfolder not auto-loaded → fixes didn't run, critical error in diagnostics). Both fixed. Upgrade strongly recommended.

= 0.1.0 =
Initial public beta. Actively tested on the five largest German shared hosting providers (IONOS, Strato, All-Inkl, Hetzner, webgo) and under WordPress Multisite.
