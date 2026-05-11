=== WebsiteFix Health Check & Deep Audit ===
Contributors: websitefix
Tags: health check, audit, performance, seo, debug, php errors, security, diagnostics, database, deep audit
Requires at least: 5.9
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 0.2.0
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A read-only WordPress health check that shows PHP version, SSL status, core/plugin updates and SEO basics directly in your dashboard. Optional deep audit on WebsiteFix.com.

== Description ==

**WebsiteFix Health Check & Deep Audit** adds a non-intrusive widget to your WordPress dashboard that runs five quick local checks and shows you, at a glance, whether your site is in good technical shape — without leaving the admin area.

= What you see in the dashboard widget =

* **PHP version** — verified against current recommendations (8.1+).
* **TLS / SSL status** — is `is_ssl()` returning true on the current request?
* **WordPress core version** — and whether a core update is available.
* **Active plugins & pending updates** — counted from the WordPress cache, no external API call.
* **SEO basics on the homepage** — `<title>` length and `<meta name="description">` presence, fetched once via `wp_remote_get()` with a 4-second timeout.

Each result is shown with a clear pill (OK / Attention) plus a short, technical explanation — no marketing copy, no upsell banners.

= What the plugin does NOT do =

* It does **not write** to the database.
* It does **not modify** any files on your server.
* It does **not transmit** your data to any external service.
* It does **not require** an account, API key, or connection setup.

If you want the full 92-parameter audit (database autoload analysis, PHP error log parsing with file + line numbers, hook-chain conflict detection, OPcache & slow-query statistics), you can opt in via the link at the bottom of the widget. That opt-in is explicit and leaves your WordPress installation.

= For developers and reviewers — Technical Details =

The plugin uses **non-destructive read-only queries** to ensure your database and system files remain untouched. Specifically:

* No `INSERT`, `UPDATE`, `DELETE` or `ALTER` statements are executed.
* No `wp_options` writes (we don't even store an activation flag).
* No cron jobs are scheduled (the widget reads on every dashboard load, but only as a `GET`-style operation).
* No file system writes (`fwrite`, `file_put_contents`, etc. — none of these are called).
* No remote POST/PUT requests. The single outbound HTTP call is a `wp_remote_get()` to the site's own `home_url()` to evaluate `<title>` and the meta-description tag.
* All output is escaped via `esc_html()`, `esc_attr()`, and `esc_url()`.
* Widget rendering is gated by `current_user_can( 'manage_options' )` — only administrators see it.
* No JavaScript, no third-party libraries, no remote-loaded assets.

The complete source is GPL-licensed and available on the WordPress.org plugin repository.

= Why we built it =

We're a WordPress diagnostic SaaS at [WebsiteFix.com](https://website-fix.com). Many issues we see in the field — auto-loaded option bloat, PHP fatal errors on uncrawled routes, slow-query logs, plugin hook conflicts — are invisible to external scanners like Lighthouse or GTmetrix. This free plugin offers a tiny first-line check inside WordPress itself; the optional cloud audit goes deeper.

== Installation ==

1. Upload the plugin ZIP via **Plugins → Add New → Upload Plugin**, or unpack it into `/wp-content/plugins/websitefix-health-check/`.
2. Activate the plugin via the **Plugins** screen.
3. Visit your **Dashboard** — the widget appears at the top right (administrators only).

== Frequently Asked Questions ==

= Does this plugin store or transmit my data? =

No. All five checks are local PHP/WordPress queries. The single outbound HTTP request is a `wp_remote_get()` to your own home URL to read the `<title>` and meta-description tags. Nothing is sent to WebsiteFix.com or any third party from this plugin.

= Will it slow down my dashboard? =

The widget renders on dashboard load and runs the five checks each time. The most expensive operation is the single `wp_remote_get()` to your homepage (4-second timeout). On a healthy site this adds 50–500 ms to the dashboard render. If your homepage is unreachable, the widget shows an "URL nicht prüfbar" hint instead of hanging.

= Does it auto-fix problems? =

No. This plugin is diagnosis-only. There is no "click to fix" button, no Auto-Updater, no remote configuration. Any fixes happen on your end with our optional online guides (linked from the widget).

= What does the optional WebsiteFix.com audit do beyond what I see here? =

92 parameters total. The cloud audit reads your `/wp-content/debug.log`, the MySQL slow-query log, the `wp_options` autoload structure, the active plugin hook chain in `functions.php`, the OPcache status, and more — none of which are accessible from a browser-based scanner like Lighthouse. The deep audit is opt-in and requires an email registration (which the widget link starts).

= Does it support multisite? =

Yes. The widget renders per-site on each subsite's dashboard. There is no network-level admin page.

= Is this plugin GDPR-compliant? =

The plugin itself processes no personal data — it reads only PHP environment, WordPress core state, and your homepage HTML. If you opt in to the cloud audit on WebsiteFix.com, that service operates from Frankfurt, Hessen (EU), with a DSGVO/GDPR DPA (AVV) template available in the account settings.

== Screenshots ==

1. The dashboard widget with five health checks and the optional deep-audit link.

== Changelog ==

= 0.2.0 =
* Plugin renamed to "WebsiteFix Health Check & Deep Audit".
* Dashboard widget redesigned to a calmer, information-first table layout.
* Deep-audit link now routes to the dedicated `/plugin-report` landing page with proper UTM tracking.
* Read-only constraint explicitly documented in the widget footer and in `readme.txt`.

= 0.1.0 =
* Initial release. Five quick checks (PHP, SSL, WP core, plugins, SEO) in a dashboard widget. Read-only by design.

== Upgrade Notice ==

= 0.2.0 =
Renamed plugin and calmer widget layout. No breaking changes.
