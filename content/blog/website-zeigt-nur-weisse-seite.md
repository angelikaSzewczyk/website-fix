---
title: "Website zeigt nur eine weiße Seite? Der komplette Leitfaden zum White Screen of Death"
description: "Ihre Website ist plötzlich weiß? Keine Panik — Ihre Daten sind fast immer noch da. Die häufigsten Ursachen, Schritt-für-Schritt-Lösungen und wann Sie den Debug-Modus brauchen."
date: "2026-04-01"
category: "compliance"
tags: ["weiße seite", "white screen", "wordpress fehler", "website kaputt", "website reparieren", "wsod", "php error"]
status: "published"
---

# Website zeigt nur eine weiße Seite?

Sie öffnen Ihre Website — und sehen nichts. Keine Fehlermeldung. Keine Inhalte. Nur eine leere, weiße Fläche.

In der Fachwelt nennt man das den **White Screen of Death (WSoD)**. Er ist besonders frustrierend, weil WordPress standardmäßig keine Fehlermeldung ausgibt — nur gähnende Leere.

**Die gute Nachricht:** In den allermeisten Fällen sind Ihre Texte, Bilder und Inhalte vollständig vorhanden — nur ein einzelner technischer Fehler verhindert, dass die Seite lädt. Wie ein Sicherungskasten der ausgelöst hat, während das Haus selbst völlig in Ordnung ist.

---

## Typische Symptome

- Weder Frontend noch Backend (Admin-Bereich) laden
- Nur eine komplett weiße Fläche im Browser
- Keine Fehlermeldung sichtbar
- Manchmal nur einzelne Seiten betroffen, manchmal die gesamte Website

---

## Das Wichtigste zuerst: Nichts übereilt anfassen

Wenn Ihre Website weiß ist, ist der größte Fehler: einfach drauf los klicken, Einstellungen ändern, Dinge ausprobieren. Jede unüberlegte Änderung kann das Problem verschlimmern oder einen neuen Fehler erzeugen.

Gehen Sie diese Schritte der Reihe nach durch.

---

## Schritt 1: E-Mail-Postfach prüfen (auch Spam)

WordPress schickt bei vielen Fehlern automatisch eine E-Mail mit einem speziellen **Recovery-Link** — einem direkten Zugang ins Backend, der auch bei weißer Seite funktioniert.

Suchen Sie nach einer Mail von Ihrer eigenen Website-Adresse oder mit dem Betreff „Recovery Mode". Wenn Sie diesen Link haben: einloggen und direkt sehen, welches Plugin den Fehler verursacht.

---

## Schritt 2: Letzte Änderung zurückverfolgen

Das ist oft die schnellste Diagnose. Eine weiße Seite taucht fast nie aus dem Nichts auf. In 8 von 10 Fällen wurde kurz davor etwas verändert:

- Ein Plugin wurde installiert oder aktualisiert
- Ein Theme wurde gewechselt
- WordPress selbst hat ein automatisches Update durchgeführt
- Jemand hat etwas im Code geändert

Wenn Sie wissen, was zuletzt geändert wurde, wissen Sie auch, wo das Problem liegt.

---

## Schritt 3: Hoster kontaktieren

Ihr Hosting-Anbieter (Strato, IONOS, All-Inkl., Hostinger etc.) hat Zugriff auf die **Server-Logs** — ein automatisches Protokoll, das aufzeichnet, was auf Ihrer Website schief gelaufen ist.

Der Support kann Ihnen in wenigen Minuten sagen, welcher Fehler aufgetreten ist — oft auch welches Plugin oder welche Datei schuld ist. Das kostet nichts extra und viele Hoster haben 24/7-Support.

---

## Die 6 häufigsten Ursachen (und ihre Lösungen)

### 1. Plugin-Konflikt — tritt in ~80 % der Fälle auf

Ein Plugin verträgt sich nicht mit einem anderen Plugin, mit dem Theme oder mit der aktuellen WordPress-Version. Passiert besonders oft nach Updates.

**Fix (mit Backend-Zugang):** *Plugins → Installierte Plugins → Alle deaktivieren*, dann einzeln reaktivieren bis der Fehler wieder auftritt.

**Fix (ohne Backend-Zugang, via FTP):** Den Ordner `/wp-content/plugins/` via FTP umbenennen (z. B. in `plugins_deaktiviert`). WordPress deaktiviert damit automatisch alle Plugins. Anschließend den Ordner zurückbenennen und Plugins einzeln reaktivieren.

### 2. Theme-Fehler

Ein Fehler im aktiven Theme — zum Beispiel nach einer Anpassung oder einem Update.

**Fix:** In WordPress gibt es immer Standard-Themes (z. B. „Twenty Twenty-Four"). Wenn Sie ins Backend kommen, wechseln Sie das Theme und prüfen, ob die weiße Seite verschwindet.

### 3. WordPress-Update fehlgeschlagen

WordPress aktualisiert sich manchmal automatisch. Wenn das Update unterbrochen wird oder inkompatibel ist, kann die weiße Seite entstehen.

**Fix:** Hoster kontaktieren — die können ein Backup von gestern oder letzter Woche einspielen.

### 4. Syntax-Fehler im Code

Ein falsch gesetztes Zeichen (z. B. ein Komma) in der `functions.php` oder einer anderen PHP-Datei reicht aus, um das gesamte System lahmzulegen.

**Fix:** Die zuletzt bearbeitete Datei via FTP oder dem Hosting-Dateimanager auf den letzten Stand zurücksetzen. Wenn Sie wissen, welche Zeile geändert wurde, diese Änderung rückgängig machen.

### 5. PHP-Memory-Limit erschöpft

Ihre Website braucht mehr Arbeitsspeicher als Ihr Hosting-Paket bereitstellt. Passiert oft, wenn die Website über Zeit größer geworden ist oder ein schweres Plugin/Theme geladen wird.

**Fix:** Hoster fragen, ob das Memory Limit erhöht werden kann — das geht oft mit einem Klick im Hosting-Panel. Alternativ können Sie in der `wp-config.php` folgenden Wert setzen:

```php
define('WP_MEMORY_LIMIT', '256M');
```

### 6. Fehler nach manueller Code-Änderung

Jemand hat in der `functions.php` oder einer anderen Datei etwas geändert — manchmal reicht ein einziges falsch gesetztes Zeichen, um die komplette Seite lahmzulegen.

**Fix:** Wenn Sie wissen, was geändert wurde, diese Änderung rückgängig machen. Wenn nicht: Hoster nach einem Backup fragen.

---

## Debug-Modus aktivieren (wenn Sie nicht weiterkommen)

Wenn Sie die Ursache nicht finden, zeigt der WordPress-Debug-Modus die echte Fehlermeldung direkt im Browser.

Öffnen Sie die Datei `wp-config.php` (via FTP oder Hosting-Panel) und suchen Sie diese Zeile:

```php
define( 'WP_DEBUG', false );
```

Ändern Sie `false` zu `true`:

```php
define( 'WP_DEBUG', true );
```

Jetzt zeigt die weiße Seite den genauen Pfad zum fehlerhaften Plugin oder zur fehlerhaften Datei an. **Wichtig:** Nach der Diagnose den Wert unbedingt wieder auf `false` setzen.

---

## Was tun, wenn Sie gar nicht weiterkommen?

Wenn Sie alle Schritte probiert haben und immer noch eine weiße Seite sehen — oder wenn Sie Angst haben, etwas falsch zu machen — dann ist es Zeit für professionelle Hilfe.

Genau dafür entsteht **WebsiteFix**: Sie geben Ihre Website-URL ein, die KI analysiert automatisch, was kaputt ist, und erklärt auf Deutsch, was zu tun ist — ohne Entwickler-Wissen, ohne Fachjargon.

👉 **[Frühen Zugang sichern →](/#waitlist)**
Kostenlos in der Beta. Keine Kreditkarte.

---

## Häufige Fragen

**Sind meine Daten weg?**
Fast nie. Eine weiße Seite bedeutet meistens, dass WordPress einen Fehler hat — nicht Ihre Datenbank. Texte, Bilder und Seiten sind fast immer noch vollständig vorhanden.

**Wie lange dauert es, die weiße Seite zu beheben?**
Wenn die Ursache bekannt ist (z. B. das letzte Plugin-Update): oft unter 10 Minuten. Wenn die Ursache erst gefunden werden muss: 30 Minuten bis einige Stunden.

**Muss ich einen Entwickler beauftragen?**
Nicht unbedingt. Viele Fälle lassen sich mit den Schritten oben selbst lösen. Erst wenn Sie nicht weiterkommen oder das Problem nach mehreren Versuchen bleibt, lohnt sich externe Hilfe.

**Verliere ich meine Daten durch den Fehler?**
In der Regel nicht. Meistens blockiert nur ein fehlerhafter Code den Zugriff auf die Datenbank. Ihre Inhalte sind fast immer noch sicher vorhanden.
