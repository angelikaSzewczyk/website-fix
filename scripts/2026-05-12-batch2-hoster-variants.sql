-- ════════════════════════════════════════════════════════════════════════════
-- Batch2-Hoster-Variants (12.05.2026)
--
-- Pre-Launch-Audit deckte auf: Landing verspricht 5-Hoster-Klick-Pfade,
-- aber 4 Batch2-Guides (bfsg-accessibility, security-hardening, mobile-
-- performance, dsgvo-compliance) hatten nur `default`-Variants.
-- Pricing-Strict-Verstoss bei Anon-Käufern.
--
-- Diese Migration ergänzt 5 Hoster × 4 Guides = 20 Step-Blöcke.
-- Hoster: strato, ionos, all-inkl, hostinger, hetzner.
-- Pattern pro Variant: 3 Steps (Login + Hoster-Backend → Action → Verifikation).
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1) bfsg-accessibility — Barrierefreiheit / WCAG-Compliance
-- ────────────────────────────────────────────────────────────────────────────

UPDATE rescue_guides
SET content_json = content_json
  || jsonb_build_object('variants', (content_json->'variants') || jsonb_build_object(
    'strato', $${
      "steps": [
        { "title": "Strato KundenLogin öffnen", "body": "https://www.strato.de/apps/CustomerService — Kunden-ID + Master-Passwort. Hosting → Domain auswählen → File-Manager.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato KundenLogin-Maske" },
        { "title": "PHP-Version auf 8.2 setzen", "body": "Hosting → Domain → PHP-Version → 8.2 wählen. BFSG-Accessibility-Plugins (WP Accessibility, One Click Accessibility) brauchen mindestens PHP 8.0 — auf älteren Versionen lädt das Plugin gar nicht oder generiert PHP-Notices.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato Hosting-Verwaltung mit PHP-Versions-Dropdown" },
        { "title": ".htaccess Cache-Control für Plugin-CSS", "body": "Im File-Manager .htaccess editieren: `<FilesMatch \"\\.(css|js)$\">Header set Cache-Control \"no-cache, must-revalidate\"</FilesMatch>` einfügen, damit Accessibility-Plugin-Updates im Browser sofort sichtbar sind (sonst zeigt der Cache die alte Version mit fehlenden alt-Texten).", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato File-Manager mit .htaccess-Editor" }
      ]
    }$$::jsonb,
    'ionos', $${
      "steps": [
        { "title": "IONOS Cloud-Panel öffnen", "body": "https://login.ionos.de → Hosting & WordPress → entsprechendes Hosting-Paket → WordPress-Manager.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Cloud-Panel" },
        { "title": "WP Accessibility via IONOS-Plugin-Manager", "body": "WordPress-Manager → Plugins → WP Accessibility installieren. IONOS-Manager-Installation hält Plugin via Auto-Update aktuell und versionssicher.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS WordPress-Plugin-Manager" },
        { "title": "PHP-Version + OPcache", "body": "Hosting → PHP-Einstellungen → Version 8.2 + OPcache-Haken setzen. Accessibility-Plugins parsen jeden Request — ohne OPcache ist die Performance spürbar schlechter.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS PHP-Einstellungen mit OPcache-Toggle" }
      ]
    }$$::jsonb,
    'all-inkl', $${
      "steps": [
        { "title": "All-Inkl KAS öffnen", "body": "https://kas.all-inkl.com — Kunden-ID + Passwort. Tools → Datei-Manager.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl KAS-Login" },
        { "title": "PHP-Version auf 8.2 FastCGI", "body": "KAS → Domain → PHP-Version → 8.2 (FastCGI). Wichtig: FastCGI, nicht CGI — CGI-Modus blockiert manche Accessibility-Plugins durch Memory-Limit.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl PHP-Version-Auswahl mit FastCGI" },
        { "title": ".htaccess für Plugin-CSS-Freshness", "body": "KAS → Tools → Datei-Manager → public_html/.htaccess: Cache-Control-Header für /wp-content/plugins/wp-accessibility/*.css setzen, sonst zeigt der KAS-Proxy alte Plugin-Versionen.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl Datei-Manager mit .htaccess" }
      ]
    }$$::jsonb,
    'hostinger', $${
      "steps": [
        { "title": "Hostinger hPanel öffnen", "body": "https://hpanel.hostinger.com → Website-Card → Erweitert → PHP-Konfiguration.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger hPanel" },
        { "title": "PHP 8.2 + OPcache + Memory-Limit 256M", "body": "PHP-Konfiguration → Version 8.2 → OPcache aktivieren → memory_limit auf 256M setzen. Accessibility-Plugins mit Screen-Reader-Test-Tools brauchen mehr Memory als Standard 128M.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger PHP-Konfiguration mit Memory-Limit-Feld" },
        { "title": "LiteSpeed Cache: Plugin-CSS nicht cachen", "body": "WordPress → LiteSpeed Cache → Cache → Excludes → URI: /wp-content/plugins/wp-accessibility/* hinzufügen. Sonst zeigt der LiteSpeed-Cache veraltetes CSS bei Plugin-Updates.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "LiteSpeed Cache Exclude-URI-Settings" }
      ]
    }$$::jsonb,
    'hetzner', $${
      "steps": [
        { "title": "Hetzner KonsoleH öffnen", "body": "https://konsoleh.hetzner.com — Vertragsnummer + Passwort. Tools → WebFTP für Datei-Manager-Zugriff.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH-Login" },
        { "title": "PHP-Version 8.2 + OPcache", "body": "Tools → Skriptsprachen → PHP-Version 8.2 wählen → OPcache-Checkbox aktivieren → Speichern.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH PHP-Versions-Selector" },
        { "title": ".htaccess Cache-Control für Plugin-CSS", "body": "WebFTP → public_html/.htaccess editieren: `Header set Cache-Control \"no-cache, must-revalidate\"` für Plugin-Verzeichnisse. Hetzner-HTTP-Cache zeigt sonst veraltete CSS bei Accessibility-Plugin-Updates.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner WebFTP mit .htaccess-Editor" }
      ]
    }$$::jsonb
  ))
WHERE id = 'bfsg-accessibility';

-- ────────────────────────────────────────────────────────────────────────────
-- 2) security-hardening — Login, 2FA, Brute-Force-Schutz, SSL
-- ────────────────────────────────────────────────────────────────────────────

UPDATE rescue_guides
SET content_json = content_json
  || jsonb_build_object('variants', (content_json->'variants') || jsonb_build_object(
    'strato', $${
      "steps": [
        { "title": "Strato KundenLogin + 2FA", "body": "https://www.strato.de/apps/CustomerService → Mein Strato → Zwei-Faktor-Authentifizierung aktivieren (SMS oder Authenticator). Schützt deinen Hoster-Account vor Account-Takeover.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato 2FA-Einstellungen" },
        { "title": ".htaccess: wp-login + xmlrpc härten", "body": "File-Manager → .htaccess editieren: xmlrpc.php blockieren (`<Files xmlrpc.php>Order allow,deny\\nDeny from all</Files>`) und wp-login.php auf IP-Whitelist begrenzen. Verhindert 95% der Brute-Force-Versuche.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato File-Manager mit .htaccess-Editor" },
        { "title": "SSL-Zertifikat-Status verifizieren", "body": "Hosting → Domain → SSL: Let's Encrypt-Zertifikat muss aktiv + auto-renewal eingeschaltet sein. Ohne SSL = Browser-Warnung + Google-SEO-Penalty.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato SSL-Zertifikat-Übersicht" }
      ]
    }$$::jsonb,
    'ionos', $${
      "steps": [
        { "title": "IONOS Security-Center öffnen", "body": "https://login.ionos.de → Hosting → Security-Center. IONOS bietet Web Application Firewall (WAF) und Malware-Scanner — beide standardmäßig im Hosting-Paket enthalten.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Security-Center" },
        { "title": "WAF + Malware-Scanner aktivieren", "body": "Security-Center → Web Application Firewall → Aktivieren. Malware-Scanner → Tägliche Prüfung → Alarm-Mail einrichten. Erkennt 90% gängiger WordPress-Exploits automatisch.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS WAF-Aktivierung" },
        { "title": "SSH-Key statt Passwort (Cloud-Server)", "body": "Bei IONOS Cloud-Server: Cloud-Panel → Server → SSH-Keys → eigenen Public-Key hochladen. Dann in /etc/ssh/sshd_config: PasswordAuthentication no. Verhindert SSH-Brute-Force komplett.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Cloud-Panel SSH-Key-Management" }
      ]
    }$$::jsonb,
    'all-inkl', $${
      "steps": [
        { "title": "KAS Verzeichnisschutz auf wp-admin", "body": "KAS → Domain → Tools → Verzeichnisschutz → /wp-admin/ schützen mit HTTP-Basic-Auth. Zweite Login-Schicht vor WordPress-Login = Brute-Force-Schutz auf Server-Ebene.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl KAS Verzeichnisschutz" },
        { "title": "SoftSecurity (Brute-Force-Sperre)", "body": "KAS → Tools → SoftSecurity → aktivieren. Sperrt IPs automatisch nach X fehlgeschlagenen Login-Versuchen — All-Inkl-internes Tool, kein zusätzliches Plugin nötig.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl SoftSecurity-Settings" },
        { "title": "SSL erzwingen via .htaccess", "body": "Datei-Manager → public_html/.htaccess: HTTP → HTTPS-Redirect-Rules (RewriteEngine On / RewriteCond %{HTTPS} off / RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]). Erzwingt verschlüsselte Verbindung.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl Datei-Manager mit .htaccess" }
      ]
    }$$::jsonb,
    'hostinger', $${
      "steps": [
        { "title": "Hostinger Login-Aktivität prüfen", "body": "hPanel → Sicherheit → Login-Aktivität → ungewöhnliche IPs/Locations identifizieren. Sofortige Aktion bei verdächtigen Einträgen: Hostinger-Passwort + 2FA aktivieren.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger hPanel Login-Aktivität" },
        { "title": "Patchstack-Integration (kostenlos)", "body": "hPanel → Sicherheit → Patchstack → Aktivieren. Hostinger-Integration ist kostenlos und scannt täglich auf bekannte WordPress-Plugin-Schwachstellen. Mailing bei Funden inkl. Fix-Anleitung.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger Patchstack-Integration" },
        { "title": "SSL + HSTS aktivieren", "body": "hPanel → SSL → Lifetime-SSL aktivieren + HSTS-Header setzen. HSTS macht Man-in-the-Middle-Angriffe (Downgrade auf HTTP) unmöglich, ist in Sicherheits-Audits Pflicht.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger SSL + HSTS-Settings" }
      ]
    }$$::jsonb,
    'hetzner', $${
      "steps": [
        { "title": "Hetzner KonsoleH 2FA", "body": "https://accounts.hetzner.com → Sicherheit → Zwei-Faktor-Authentifizierung (TOTP-App). Schützt vor Account-Takeover, der bei Hosting-Providern hochfrequent ist.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner Account 2FA-Einstellungen" },
        { "title": "KonsoleH Passwortschutz auf /wp-admin", "body": "KonsoleH → Domain → Passwortschutz → /wp-admin/ schützen. Server-Level HTTP-Basic-Auth vor WordPress-Login = zusätzliche Hürde gegen Brute-Force-Bots.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH Passwortschutz" },
        { "title": "Login-Path ändern via WPS Hide Login", "body": "WordPress → Plugins → WPS Hide Login installieren → /wp-admin auf z.B. /admin-x9k2 ändern. Bots scannen nur /wp-login.php — eine geänderte URL eliminiert 99% automatisierter Angriffe.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "WPS Hide Login-Plugin-Settings" }
      ]
    }$$::jsonb
  ))
WHERE id = 'security-hardening';

-- ────────────────────────────────────────────────────────────────────────────
-- 3) mobile-performance — Caching, Image-Compression, HTTP/2, CDN
-- ────────────────────────────────────────────────────────────────────────────

UPDATE rescue_guides
SET content_json = content_json
  || jsonb_build_object('variants', (content_json->'variants') || jsonb_build_object(
    'strato', $${
      "steps": [
        { "title": "Strato CDN aktivieren (kostenlos)", "body": "Hosting → Domain → CDN → Aktivieren. Strato bietet ein kostenloses CDN über Edge-Server in EU. Reduziert Latenz bei Mobile-Usern um 200-400 ms.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato CDN-Aktivierung" },
        { "title": "GZIP + Browser-Cache via .htaccess", "body": "File-Manager → .htaccess: mod_deflate für GZIP (`AddOutputFilterByType DEFLATE text/html text/css application/javascript`) + mod_expires für Browser-Cache (1 Jahr für Bilder, 1 Monat für CSS/JS). Reduziert Mobile-Traffic-Last um 60-80%.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato File-Manager .htaccess-Editor" },
        { "title": "PHP 8.2 + OPcache", "body": "Hosting → PHP-Version 8.2 + OPcache aktivieren. WordPress-Render-Zeit halbiert sich auf Mobile durch OPcache-aware Object-Cache.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato PHP-Versions-Selector" }
      ]
    }$$::jsonb,
    'ionos', $${
      "steps": [
        { "title": "IONOS High-Performance-Cache", "body": "Hosting → Performance → High-Performance-Cache → Aktivieren. IONOS-spezifischer Server-Cache vor Apache — reduziert TTFB auf Mobile um durchschnittlich 50%.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Performance-Cache-Toggle" },
        { "title": "PHP 8.2 + OPcache + memory_limit", "body": "Hosting → PHP-Einstellungen → Version 8.2 + OPcache + memory_limit 256M. WordPress mit vielen Plugins braucht 256M minimum für stabile Mobile-Performance.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS PHP-Einstellungen" },
        { "title": "Cloudflare-CDN über IONOS-DNS", "body": "Domain → DNS → Nameserver auf Cloudflare ändern (kostenloser Plan). Cloudflare-Edge-Cache + Mobile-Image-Optimization sind die billigste Mobile-Performance-Verbesserung.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS DNS-Nameserver-Einstellungen" }
      ]
    }$$::jsonb,
    'all-inkl', $${
      "steps": [
        { "title": "All-Inkl HTTP/2 + OPcache", "body": "KAS → Domain → HTTP/2 aktivieren + KAS → Tools → PHP-OPcache aktivieren. HTTP/2 sendet mehrere Resources parallel — auf Mobile-3G/4G-Netzen ein deutlicher Boost.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl KAS HTTP/2-Aktivierung" },
        { "title": "GZIP via .htaccess (mod_deflate)", "body": "KAS → Datei-Manager → public_html/.htaccess: mod_deflate-Block für text/html, text/css, application/javascript einfügen. Komprimiert Mobile-Traffic deutlich.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl Datei-Manager mit mod_deflate" },
        { "title": "PHP 8.2 FastCGI", "body": "KAS → Domain → PHP-Version → 8.2 (FastCGI) — nicht CGI. FastCGI hält PHP-Prozesse im Memory, reduziert Mobile-Render-Zeit um 30-40%.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl PHP-Version mit FastCGI" }
      ]
    }$$::jsonb,
    'hostinger', $${
      "steps": [
        { "title": "LiteSpeed Cache Setup-Wizard", "body": "hPanel → Performance → LiteSpeed Cache → Setup-Wizard. Hostinger nutzt LiteSpeed-Server, das passende Plugin ist optimiert auf den Stack. Aktiviert Page-Cache + Browser-Cache + Mobile-Cache automatisch.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger LiteSpeed Setup-Wizard" },
        { "title": "LiteSpeed Image-Optimization", "body": "WordPress → LiteSpeed Cache → Image Optimization → 'Optimize all'. Konvertiert alle Bilder zu WebP + komprimiert. Mobile-Bildgrößen reduzieren sich um 60-80%.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "LiteSpeed Image-Optimization-Panel" },
        { "title": "Mobile-Cache + Lazy-Loading", "body": "LiteSpeed Cache → Cache → Mobile-Cache aktivieren + Page Optimization → VPI (Viewport Image Lazy Loading). LiteSpeed liefert separate gecachte Versionen für Mobile + Desktop.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "LiteSpeed Mobile-Cache-Settings" }
      ]
    }$$::jsonb,
    'hetzner', $${
      "steps": [
        { "title": "Hetzner HTTP/2 + HTTP-Cache", "body": "KonsoleH → Tools → HTTP/2 aktivieren + HTTP-Cache aktivieren. Hetzner-spezifischer Reverse-Proxy-Cache reduziert Origin-Last und beschleunigt Mobile-Requests deutlich.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH HTTP/2-Toggle" },
        { "title": "GZIP + mod_expires via WebFTP", "body": "Tools → WebFTP → public_html/.htaccess: mod_deflate (GZIP) + mod_expires (Browser-Cache 1y für Bilder). Mobile-Traffic-Volume halbiert sich.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner WebFTP mit .htaccess-Editor" },
        { "title": "PHP 8.2 + OPcache + memory_limit", "body": "Tools → Skriptsprachen → PHP 8.2 + OPcache-Checkbox + php.ini → memory_limit 256M. Hetzner-Default-Memory ist oft zu niedrig für moderne WP-Themes.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH PHP-Settings" }
      ]
    }$$::jsonb
  ))
WHERE id = 'mobile-performance';

-- ────────────────────────────────────────────────────────────────────────────
-- 4) dsgvo-compliance — AVV, Server-Standort, Tracking, Cookie-Banner
-- ────────────────────────────────────────────────────────────────────────────

UPDATE rescue_guides
SET content_json = content_json
  || jsonb_build_object('variants', (content_json->'variants') || jsonb_build_object(
    'strato', $${
      "steps": [
        { "title": "Strato AVV herunterladen", "body": "Mein Strato → Verträge → AVV (Auftragsverarbeitungs-Vertrag) → PDF herunterladen. Strato bietet den AVV standardmäßig im Account — keine Extra-Anfrage nötig. Pflicht für DSGVO-Compliance gegenüber deinen Kunden.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato Mein-Account mit Verträge-Bereich" },
        { "title": "Server-Standort verifizieren (DE)", "body": "Strato hostet ausschließlich in Deutschland (Karlsruhe + Berlin). Im AVV-PDF ist das explizit dokumentiert. Wichtig für DSGVO-konformes Hosting ohne Schrems-II-Risiko.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato AVV-PDF mit Server-Standort-Angabe" },
        { "title": "Privacy-Settings: Log-Aufbewahrung", "body": "Hosting → Webspace → Privacy → Log-Aufbewahrungs-Dauer auf 7 Tage setzen (Default 30 Tage). Reduziert Datenschutz-Footprint, kürzeste rechtlich vertretbare Dauer.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Strato Webspace Privacy-Settings" }
      ]
    }$$::jsonb,
    'ionos', $${
      "steps": [
        { "title": "IONOS Data Privacy Center", "body": "https://login.ionos.de → Data Privacy Center → AVV automatisch generiert + DSGVO-Anfragen-Management. IONOS ist hier am vorbildlichsten unter den deutschen Hostern — eigenes dediziertes DSGVO-Modul.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Data Privacy Center" },
        { "title": "Server-Region EU-Frankfurt", "body": "Cloud-Panel → Server → Region → 'eu-central-1' (Frankfurt) verifizieren. Bei Migration aus älterem Tarif: manchmal stehen Server noch in UK-Region → manuelle Migration erforderlich.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS Cloud-Panel Server-Region" },
        { "title": "AVV-Vertrag aus DPC herunterladen", "body": "Data Privacy Center → Vertrag-Verwaltung → AVV als PDF + Annex mit Sub-Auftragsverarbeitern. Beides dem Kunden via Wartungsvertrag mitgeben.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "IONOS DPC AVV-Download" }
      ]
    }$$::jsonb,
    'all-inkl', $${
      "steps": [
        { "title": "All-Inkl AVV im Datenschutz-Bereich", "body": "KAS → Datenschutz → AVV (Auftragsverarbeitungs-Vertrag) herunterladen. All-Inkl hostet 100% in Deutschland (Friedersdorf bei Berlin) — explizit im AVV dokumentiert.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl KAS Datenschutz-Bereich" },
        { "title": "Backup-Verschlüsselung aktivieren", "body": "KAS → Tools → Datensicherung → Backup-Verschlüsselung aktivieren. Verschlüsselte Backups sind DSGVO-Best-Practice — Article 32 verlangt 'angemessene technische Maßnahmen'.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl Backup-Verschlüsselungs-Settings" },
        { "title": "TLS-Min-Version auf 1.3", "body": "KAS → Domain → SSL → TLS-Mindestversion auf TLS 1.3 setzen (Default 1.2 ist DSGVO-konform, 1.3 ist aktueller Standard). Veraltete TLS-Versionen sind in Sicherheits-Audits ein Mangel.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "All-Inkl TLS-Versions-Settings" }
      ]
    }$$::jsonb,
    'hostinger', $${
      "steps": [
        { "title": "Hostinger AVV via Support anfordern", "body": "hPanel → Support → Live-Chat → AVV (Auftragsverarbeitungs-Vertrag) anfordern. Hostinger hat keinen Self-Service-Download — Support liefert PDF innerhalb 24h. Wichtig: 'EU-Region' explizit angeben.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger hPanel Support-Chat" },
        { "title": "Server-Region auf EU-Frankfurt", "body": "hPanel → Hosting → Server-Region prüfen. Bei Bedarf via Support auf eu-central (Frankfurt) migrieren — Hostinger bietet Migration kostenlos. Wichtig bei DSGVO-sensitiven Kundendaten.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger Server-Region-Auswahl" },
        { "title": "SSL erzwingen (HTTPS-only)", "body": "hPanel → Sicherheit → HTTPS erzwingen aktivieren. DSGVO Article 32 verlangt verschlüsselte Datenübertragung — HTTPS-only ist hier Mindest-Standard.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hostinger HTTPS-Erzwingung" }
      ]
    }$$::jsonb,
    'hetzner', $${
      "steps": [
        { "title": "Hetzner AVV im Kundenbereich", "body": "https://accounts.hetzner.com → Verträge → Auftragsverarbeitungs-Vertrag (AVV) automatisch im Account-Bereich. Hetzner ist 100% Deutschland (Falkenstein, Nürnberg) — eines der DSGVO-saubersten Hosting-Setups.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner Account Verträge-Bereich" },
        { "title": "KonsoleH SSL erzwingen", "body": "KonsoleH → Domain → SSL-Einstellungen → HTTPS-Redirect aktivieren. Verschlüsselte Übertragung ist Pflicht nach DSGVO Article 32.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH SSL-Settings" },
        { "title": "Log-Aufbewahrungs-Policy", "body": "KonsoleH → Statistik → Log-Aufbewahrung → auf 7 Tage reduzieren (Default 30 Tage). Minimiert IP-Logging-Footprint — DSGVO-Best-Practice.", "screenshot": null, "screenshot_url": null, "screenshot_alt": "Hetzner KonsoleH Log-Settings" }
      ]
    }$$::jsonb
  ))
WHERE id = 'dsgvo-compliance';
