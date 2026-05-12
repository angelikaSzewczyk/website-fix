=== WebsiteFix Health Check & Deep Audit ===
Contributors: websitefix
Tags: performance, optimization, monitoring, security, diagnostics
Requires at least: 5.9
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.4.0
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Five diagnostic metrics in your WordPress dashboard that reveal whether your host is throttling you: TTFB, Heartbeat load, DB bloat, memory, updates.

== Description ==

You suspect your WordPress site is slower than it should be? Your host keeps reporting "CPU limit exceeded" while there's barely any traffic? Something is running in the background that you can't see?

**WebsiteFix Health Check shows you exactly what's wrong in 60 seconds.** Right in your WordPress dashboard. No sign-up. No account. Read-only — the plugin writes nothing to your site, deactivates nothing, sends no user data to external servers.

= The 5 Metrics That Show Where Your Site Is Losing Performance =

**1. Server Response Time (TTFB)**
How long does your host take to send the first byte of HTML? Values above 800 ms are a warning sign — either your host is overloaded, your plan is too small, or a plugin is eating the first 500 ms of bootstrap time. The widget shows the current value and gives you a diagnosis direction.

**2. Heartbeat API Load**
The WordPress Heartbeat API polls in the background every 15 seconds via admin-ajax.php — on many shared hosting plans, this is the most common reason for host-side CPU throttling. The widget shows the current frequency, projected hourly load, and links to a free PHP snippet that throttles it contextually.

**3. Database Size & Largest Table**
A WordPress database should rarely exceed 100–200 MB. If your site is at 1.2 GB, the widget tells you which table is responsible (typically: `wp_options` with autoload bloat, `wp_postmeta` with orphaned entries, transient caches). You see exactly what's eating storage and DB CPU at your host.

**4. PHP Memory Limit & Current Peak Usage**
Your host gave you 128 MB, 256 MB, or 512 MB? How much does WordPress actually use? When you regularly see 85 %+ usage, you'll hit the dreaded "Allowed memory size exhausted" error during traffic spikes — a host-throttling signal most users notice too late.

**5. Update Backlog (Core · Plugins · Themes)**
How many updates are actually pending? Separated by critical (core update or 5+ pending plugin updates) and regular. You see at a glance which updates are urgent and which can wait — a security and performance debt that standard WordPress only shows as a small red circle.

= What This Plugin Does NOT Do =

* It does not write anything to your database.
* It does not deactivate plugins, themes, or functions.
* It does not transmit personal data to external servers.
* It is not a backup plugin, firewall, or malware scanner.
* It does not replace professional monitoring — it just shows you whether you need one.

= Smart Fix Snippets Instead of Plugin Bloat =

For every weakness identified, the widget links to the free Smart Fix Library on website-fix.com with copy-paste-ready PHP snippets for the most common problems:

* Throttle WordPress Heartbeat API contextually (60s / 120s / 300s)
* Disable xmlrpc.php — safe brute-force protection with Jetpack detection
* Remove jQuery Migrate from the frontend — Lighthouse score boost
* Remove WordPress emojis & oEmbed discovery — eliminate render-blocking
* Strip query strings from static assets — increase CDN cache hit rate

Each snippet ships with a security wrapper and an auto-safety check that automatically detects plugin collisions (e.g., WP Rocket, Heartbeat Control, Wordfence) and does NOT intervene in those cases.

= For Developers — Technical Details =

* **Read-only:** no `INSERT`/`UPDATE`/`DELETE`/`ALTER` statements, no `wp_options` writes, no cron jobs registered.
* **Local calculation:** all 5 values from PHP built-ins (`ini_get`, `memory_get_peak_usage`, `apply_filters('heartbeat_settings', ...)`), `$wpdb` SELECTs on `information_schema`, and one `wp_remote_get` to `home_url()` for TTFB measurement.
* **DB queries cached** via `wp_cache_get`/`wp_cache_set` (1 hour expiry) for object-cache compatibility.
* **No external API calls** — no telemetry ping, no auto-update server, no analytics tracking.
* **Output hardened:** all via `esc_html()`, `esc_attr()`, `esc_url()`.
* **Gated:** widget only renders for `current_user_can('manage_options')` — editors and authors don't see it.
* **Fallback-safe:** hosts that block `information_schema` (some Strato/All-Inkl plans) get "n/a" instead of crashing.

Full source code is GPL-licensed.

= Auf Deutsch / In German =

Dieses Plugin zeigt fünf Kennzahlen direkt im WordPress-Dashboard, die enthüllen, ob dein Hoster deine Site drosselt: Server-Response-Zeit (TTFB), Heartbeat-API-Last, Datenbank-Größe + Bloat-Tabelle, PHP-Memory-Auslastung, Update-Backlog. Read-only — schreibt nichts in deine Site, sendet keine Daten an externe Server. Wenn deine Site sich anfühlt wie Sirup und du nicht weißt warum: das Plugin zeigt dir die Hoster-Drosselung schwarz auf weiß.

== Installation ==

1. Search for "WebsiteFix Health Check" under "Plugins → Add New" in the WordPress admin and activate it.
2. After activation, the widget appears in your dashboard.
3. On first load, the 5 values are calculated live (~1 second).
4. Only administrators see the widget. Editors/authors are not bothered.

== Frequently Asked Questions ==

= How can I see if my host is throttling my WordPress site? =

Three indicators point to host-side throttling: a TTFB value above 800 ms under normal load, regular 503/504 errors during business hours, and emails from your host with the subject "CPU usage increased". The WebsiteFix Health Check widget shows the TTFB value directly in the dashboard and compares it with industry benchmarks for German shared hosting providers (IONOS, Strato, All-Inkl, Hetzner, webgo).

= How do I reduce WordPress Heartbeat API load? =

The Heartbeat API self-calls every 15 seconds in the admin and is one of the most common causes of high CPU load on shared hosting. The plugin shows you the current frequency and hourly polls. For throttling, the widget links to a free PHP snippet that reduces the frequency contextually to 60s in the admin, 120s in the post editor, and 300s on the frontend — typical savings: 75–85 % less admin-ajax.php load.

= How do I disable xmlrpc.php in WordPress? =

xmlrpc.php has been a preferred brute-force attack target for years. If you don't use the WordPress mobile app, Jetpack, or an external publishing tool, you can safely turn it off. The Smart Fix snippet from the library automatically detects active Jetpack/Wordfence/Sucuri and does NOT intervene in those cases — you don't have to choose between security plugin and xmlrpc hardening.

= How big can my WordPress database get? =

Rule of thumb: For a standard WordPress site (blog, corporate website, small WooCommerce installation), healthy database sizes are between 20 MB and 200 MB. It gets larger with multi-site setups, large WooCommerce stores, or membership sites. If your DB is over 500 MB without an obvious reason, it likely has bloat problems: orphaned transients, autoload-laden `wp_options`, deleted posts in `wp_postmeta`. The widget shows the largest table and its size.

= What does a high TTFB value mean in WordPress? =

TTFB (Time to First Byte) measures how long your server takes to send the first byte of HTML to the browser. Values under 200 ms are very good, 200–500 ms okay, 500–800 ms borderline, over 800 ms problematic. High TTFB comes either from the host (overloaded, wrong PHP version, no caching), from WordPress itself (Heartbeat API, too many autoloaded options, heavy plugins), or from the database (slow queries, missing indexes). The widget shows the value and gives a diagnosis direction.

= Does the plugin slow down my dashboard? =

The widget renders on dashboard load and calculates the 5 values each time. The most expensive operation is the `wp_remote_get` call to your home URL (6-second timeout) for TTFB. On a healthy site, this adds 100–800 ms to the dashboard render. If your home URL is unreachable, the widget shows "n/a" instead of hanging. Database metrics are cached for 1 hour via wp_cache_get/set.

= Does the plugin fix problems automatically? =

No. The plugin is diagnosis-only. There's no "click to fix" button, no auto-updater, no remote configuration. Fixes happen via the linked Smart Fix snippets — copy-paste, you stay in control.

= Does the plugin work with WordPress Multisite? =

Yes. In network mode, the widget is shown per-site on each subsite's dashboard. A network-admin overview is planned for a future version.

= Will the plugin work with my host (IONOS, Strato, All-Inkl, Hetzner, webgo)? =

Yes — tested with all of the named German shared hosting providers. With hosts that block `information_schema` (rare — some Strato/All-Inkl plans), the widget shows "n/a" for database size instead of a value; all other metrics continue to work.

= What data is sent to external servers? =

By default: NONE. All calculations happen locally on your WordPress server. The widget makes one outbound HTTP request — and it goes to your own home URL (for TTFB measurement). No telemetry ping, no auto-update server, no analytics. If you later decide to run the Deep Audit on WebsiteFix.com, that's a separate opt-in decision with email registration.

= Is there a paid pro version? =

Yes. On website-fix.com, WebsiteFix offers a Deep Scan with 92 parameters, auto-fix functions, and white-label reports for agencies. The Health Check plugin published here on WordPress.org is completely free, permanently usable, and contains no trial expiration, no nag-screen spam, and no account requirement.

== Screenshots ==

1. The dashboard widget with the 5 metrics at a glance.

== Changelog ==

= 0.4.0 — 2026-05-12 =
* **WP.org Plugin-Check compliance pass:**
  * Database queries now wrapped with `wp_cache_get`/`wp_cache_set` (1 hour expiry).
  * Output escaping audited — `$report_url` is now `esc_url()`-wrapped at the output context.
  * Hook-probe `apply_filters('heartbeat_settings')` annotated with `phpcs:ignore` (legitimate WP-core probe, not a false-prefix).
* Readme now in standard English (WP.org requirement since 2025-07).
* `Tested up to: 6.9` (matches current WordPress release).

= 0.3.0 — 2026-05-13 =
* Strategic repositioning of the 5 metrics: TTFB, Heartbeat API load, database size + top table, PHP memory usage, update backlog. Replaces the generic v0.2.0 values (PHP version, SSL, WP core, plugin updates, SEO basics) that overlapped too much with WordPress's built-in Site Health.
* TTFB measurement via `wp_remote_get` on `home_url()` with industry thresholds (200/500/800 ms).
* Heartbeat frequency read via `apply_filters('heartbeat_settings', ...)` — shows the effective value, including plugin modifications.
* Database size + largest table via `information_schema` query (fallback to "n/a" with blocked hosts).
* PHP memory peak usage in percent — host throttling indicator visible.
* Update backlog separated by critical (core update or 5+ plugin updates) and regular.

= 0.2.0 =
* Plugin renamed to "WebsiteFix Health Check & Deep Audit".
* Dashboard widget redesigned to a calmer, information-first table layout.
* Deep-audit link now routes to the dedicated `/plugin-report` landing page with proper UTM tracking.
* Read-only constraint explicitly documented in the widget footer and in `readme.txt`.

= 0.1.0 =
* Initial release. Five quick checks in a dashboard widget. Read-only by design.

== Upgrade Notice ==

= 0.4.0 =
**Plugin-Check compliance release:** DB queries cached, readme translated to English (WP.org requirement), Tested up to 6.9. No breaking changes.

= 0.3.0 =
Strategic repositioning of the 5 metrics — TTFB, Heartbeat, DB size, memory, update backlog instead of the generic v0.2.0 values. Read-only constraint preserved.

= 0.2.0 =
Renamed plugin and calmer widget layout. No breaking changes.
