=== WebsiteFix Connector ===
Contributors: websitefix
Tags: monitoring, diagnostics, audit, agency, white-label
Requires at least: 5.9
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 1.2.1
License: Proprietary
License URI: https://website-fix.com/lizenz

Der offizielle Connector für WebsiteFix. Schalte den Deep-Scan (Röntgenblick) für dein Dashboard frei — Read-Only, sicher, DSGVO-konform.

== Description ==

Dieses Plugin verbindet deine WordPress-Seite sicher mit deinem WebsiteFix-Dashboard. Im Gegensatz zu herkömmlichen Scannern von außen ermöglicht dieser Connector einen **Read-Only-Einblick** in deine System-Konfiguration — PHP-Logs, Datenbank-Status, Plugin-Konflikte. Genau die Signale, die ein externer Crawler nie sieht.

**Vorteile des Connectors:**

* **Präzisions-Diagnose:** Findet Fehler in PHP-Logs und Datenbanken, die von außen unsichtbar sind.
* **Smart-Fix-Guides:** Erhalte exakte Code-Snippets, die auf deine Server-Umgebung zugeschnitten sind (z.B. konkretes `memory_limit`-Setting für deine `wp-config.php`).
* **Sicherheit:** Das Plugin arbeitet im Read-Only-Modus. Es werden keine Änderungen an deiner Seite vorgenommen — das Plugin liest nur Status-Werte.
* **White-Label für Agenturen:** Mit dem Agency-Scale-Plan ersetzt das Plugin im WordPress-Backend das WebsiteFix-Branding durch dein Agentur-Logo + Namen.

**Was wird übertragen?**

Der Connector sendet folgende technische Telemetrie an dein Dashboard:

* PHP-Version, Memory-Limit, Max-Execution-Time
* WordPress-Version, Debug-Status, Multisite-Flag
* Datenbank-Engine + -Version
* Liste der aktiven Plugins inkl. Versionsnummern
* Anzahl + Sample der letzten PHP-Fehler aus dem Debug-Log (max. 1 KB, gefiltert)

**Was wird NICHT übertragen:**

* Keine Inhalte von Posts, Seiten, Custom Post Types
* Keine Benutzerdaten, E-Mail-Adressen, Passwörter
* Keine Cookies oder Session-Daten
* Keine Dateipfade oder Stack-Traces aus Logs

== Installation ==

1. Lade den Ordner `websitefix-connector` in das Verzeichnis `/wp-content/plugins/` hoch — alternativ kannst du die `.zip`-Datei direkt über das WordPress-Backend installieren (Plugins → Installieren → Plugin hochladen).
2. Aktiviere das Plugin über die Plugin-Liste in WordPress.
3. Gehe zu **Einstellungen → Website Exzellenz** (oder zum White-Label-Namen, wenn dein Agency-Plan aktiv ist).
4. Gib deinen API-Key ein — den findest du in deinem WebsiteFix-Dashboard unter **Plugin-Setup → Dein API-Key**.
5. Klicke auf **"Speichern & verbinden"**. Das Plugin sendet sofort einen Handshake, dein Dashboard schaltet auf **"Full System Audit aktiv"** um.

== Frequently Asked Questions ==

= Ist das Plugin sicher? =

Ja. Der Connector liest lediglich Systemdaten aus, um Diagnosen zu erstellen. Er hat keine Berechtigung, Dateien zu löschen oder Einstellungen zu verändern. Die einzige Schreib-Aktion ist die optionale Remote-Fix-Funktion (Alt-Texte, Meta-Descriptions etc.) — diese wird ausschließlich auf explizite Anweisung aus deinem Dashboard ausgelöst.

= Wo finde ich meinen API-Key? =

Dein Key wird dir in deinem WebsiteFix-Dashboard unter **Plugin-Setup** angezeigt. Er beginnt mit `wf_live_` und ist mindestens 40 Zeichen lang.

= Wie oft synchronisiert das Plugin mit meinem Dashboard? =

Automatisch alle 12 Stunden via WP-Cron. Bei Fehler erfolgt nach 6 Stunden ein Retry. Du kannst jederzeit manuell über den **"Jetzt synchronisieren"**-Button im Plugin-Settings einen Sofort-Sync auslösen.

= Was passiert, wenn ich das Plugin deaktiviere? =

Beide WP-Cron-Hooks (Heartbeat + Handshake) werden entfernt, der Verbindungsstatus wird auf "disconnected" gesetzt. Im Dashboard kippt der Banner nach maximal 7 Tagen (Frische-Cutoff) zurück auf "Oberflächen-Check aktiv". Der gespeicherte API-Key bleibt erhalten — nach Reaktivierung läuft alles direkt weiter.

= Funktioniert das Plugin auf einer WordPress-Multisite? =

Ja. Pro Subsite ist eine eigene API-Key-Konfiguration nötig (Per-Site-Activation). Network-weite Aktivierung ist in einer kommenden Version geplant.

= Mein Hoster blockiert ausgehende HTTP-Requests — was tun? =

Whiteliste in deinem Hoster-Backend folgenden Hostnamen für `wp_remote_post`-Calls: `website-fix.com` (Port 443, HTTPS). Bei Strato, IONOS und All-Inkl ist das standardmäßig erlaubt.

== Changelog ==

= 1.2.1 =
* White-Label-Config als Array am Datei-Anfang (agency_name + custom_logo_url)
* API-Key + Agency-Daten mit `autoload=no` gespeichert (Memory-Hardening)
* Settings-Page zeigt Datum + Status des letzten Handshakes
* Manueller "Jetzt synchronisieren"-Button für Sofort-Resync

= 1.2.0 =
* Neue Funktion `wfc_collect_deep_data()` für PHP/WP/DB/Logs-Snapshot
* Neuer 12h-Cron `wfc_handshake_event` für Deep-Data-Sync
* `wfc_send_handshake()` mit 6h-Retry bei Fehler
* Pre-Connect-White-Label via `WF_AGENCY_LABEL` / `WF_AGENCY_LOGO`-Konstanten

= 1.1.0 =
* Initialer öffentlicher Release
* REST-Endpoints für Remote-Fix (Alt-Text, Meta, Title, Noindex, Post-Meta)
* 12h-Heartbeat
* Settings-Page mit API-Key-Verifikation

== Upgrade Notice ==

= 1.2.1 =
Empfohlen für alle Agency-Scale-Kunden — bringt das White-Label-Config-Array, das du brauchst, um das Plugin unter deiner eigenen Marke an Mandanten auszurollen.

= 1.2.0 =
Wichtig: aktiviert den Hybrid-Scan-Mode in deinem Dashboard. Ohne dieses Update bleibt dein Dashboard im "Oberflächen-Check"-Modus.

== Privacy Policy ==

Das Plugin überträgt ausschließlich technische Server-Konfiguration an `https://website-fix.com/api/plugin/handshake`. Es werden **keine personenbezogenen Daten** übertragen. Die Verbindung ist TLS-verschlüsselt, die Verarbeitung erfolgt auf Servern in Frankfurt (Vercel + Neon EU-Region). Details siehe `https://website-fix.com/datenschutz`.
