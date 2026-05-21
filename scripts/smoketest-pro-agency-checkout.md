# Smoke-Test — Pro & Agency Checkout in Production

End-to-End-Check, dass ein zahlender Pro- oder Agency-Käufer in unter 5 Minuten vom Klick bis ins Dashboard kommt — inklusive Plan-Aktivierung, Welcome-Mail, Stripe-Portal und Feature-Zugang. **Vor jedem größeren Deploy einmal durchklicken.**

Dauer: ~5 Min pro Plan. Kosten: 0 € (100%-Coupon).

---

## Schritt 0 — Vorbereitung (einmalig)

### 0.1 Coupon in Stripe Live anlegen

Stripe Dashboard → **Products → Coupons → New**:

- Type: **Percentage discount**
- Percent off: **100**
- Duration: **Once**
- Code: `SMOKETEST-<DATUM>` (z.B. `SMOKETEST-2026-05-21`)
- Redeem by: **heute + 1 Tag** (kurze TTL — falls vergessen zu löschen, expired er selbst)
- Max redemptions: **3** (1× Pro + 1× Agency + 1 Puffer)

### 0.2 Test-Email vorbereiten

Eine Email-Adresse, auf die du Zugriff hast und die **noch nicht** in `users` steht. Empfehlung: Gmail-Alias mit `+`, z.B. `angelika.szewczyk87+smoketest-2026-05-21@gmail.com` — landet in deinem normalen Postfach, ist aber für die DB ein neuer User.

### 0.3 Stripe-Live-Mode bestätigen

Oben rechts in Stripe Dashboard: **"Live mode"** (nicht "Test mode") — sonst feuert kein Production-Webhook.

---

## Schritt 1 — Professional (89 €/Monat)

### 1.1 Checkout durchlaufen

1. **Inkognito-Browser** (sauberer State, keine Session).
2. `https://website-fix.com/fuer-agenturen` → bei Professional **"Professional starten"** klicken.
3. Auf `/register?plan=professional`: Account mit Test-Email + 8-Zeichen-Passwort erstellen.
4. Wird automatisch zu Stripe-Checkout weitergeleitet. **Coupon-Code eingeben** → Zwischensumme muss **0,00 €** zeigen.
5. Test-Kreditkarte: Wenn Stripe trotz 100%-Coupon nach Karte fragt (manche Setups), eine eigene private Karte nehmen — wird nicht belastet bei 0€-Total.
6. Bezahlen.

### 1.2 Post-Checkout-Verifikation

Erwartetes Verhalten:

- [ ] **/checkout-success** zeigt Lade-Spinner → grüner Haken → "Professional aktiviert" → 3-Sekunden-Countdown.
- [ ] Automatische Weiterleitung auf **/dashboard**.
- [ ] Sidebar zeigt grünes Pro-Theme (nicht starter-blau, nicht agency-violett).
- [ ] **Welcome-Mail** kommt innerhalb 1–2 Min ("Willkommen bei WebsiteFix Professional ✓"). Bei web.de/GMX ggf. Spam-Ordner checken.

### 1.3 Plan-Features stichprobenartig prüfen

- [ ] **/dashboard/settings** → Plan-Badge zeigt "Professional · 89€/Monat".
- [ ] **Stripe-Kundenportal öffnen →** Button funktioniert, öffnet Stripe-hosted-Portal mit aktivem Abo.
- [ ] **/dashboard/scan** → URL eingeben, Scan starten → läuft durch (kein 402-Limit-Reached).
- [ ] Im Scan-Result-Drawer auf einen Issue klicken → **KI-Auto-Fix-Snippets** werden geladen (kein 403). Wenn 403: JWT noch stale → einmal aus- und wieder einloggen.
- [ ] **/dashboard/agency-branding** → Logo-Upload + Farbpicker funktionieren (`hasBrandingAccess`-Gate offen).
- [ ] **/dashboard/reports** → mindestens eine "Executive Summary"-Button-Action ist klickbar (nicht locked).

### 1.4 DB-Verifikation (optional, aber empfohlen)

Neon SQL Editor:

```sql
SELECT id, email, plan, stripe_customer_id, stripe_subscription_id, created_at
FROM users
WHERE email = '<deine-test-email>';
```

Erwartet: `plan = 'professional'`, `stripe_customer_id` startet mit `cus_`, `stripe_subscription_id` startet mit `sub_`.

---

## Schritt 2 — Agency Scale (249 €/Monat)

### 2.1 Checkout

Identisch zu 1.1, aber mit **anderer Test-Email** (z.B. `…+smoketest-agency-2026-05-21@gmail.com`) und **"Agentur-Marge jetzt skalieren"** statt Professional. Coupon erneut nutzen.

### 2.2 Post-Checkout-Verifikation

- [ ] /checkout-success zeigt **"Agency aktiviert"**.
- [ ] Dashboard hat **violettes Agency-Theme** + andere Sidebar (`SidebarNav` statt `FreeSidebar`).
- [ ] Welcome-Mail: "Willkommen bei WebsiteFix Agency ✓".

### 2.3 Agency-only-Features

- [ ] **/dashboard/clients** ist erreichbar (Pro-User sieht das nicht).
- [ ] **/dashboard/lead-generator** lädt + Embed-Snippet-Generator funktioniert.
- [ ] **/dashboard/team** lädt + "Teammitglied einladen"-Form ist sichtbar.
- [ ] **/dashboard/settings** → Custom-Domain-Feld + Verify-Button sichtbar (Pro hat das nicht).
- [ ] **/dashboard/agency-branding** → SMTP-Config-Section sichtbar; "SMTP testen" feuert ohne 403.
- [ ] DB-Check: `SELECT plan FROM users WHERE email = '…';` → `agency`.

---

## Schritt 3 — Cancel-Flow (1× ausreichend, an einem der beiden Accounts)

### 3.1 Subscription kündigen

1. Im Test-Account: **/dashboard/settings → Stripe-Kundenportal öffnen**.
2. Im Stripe-Portal: "Subscription kündigen" → "Sofort kündigen" (nicht "am Ende der Periode" — schneller verifizierbar).
3. Zurück zur App.

### 3.2 Erwartetes Verhalten

- [ ] Innerhalb ~10 Sek: Stripe feuert `customer.subscription.deleted` an den Webhook.
- [ ] DB: `SELECT plan, stripe_subscription_id FROM users WHERE email = '…';` → **`plan = NULL`**, `stripe_subscription_id = NULL`. (Kein silent-Downgrade auf "starter"!)
- [ ] **/dashboard** aufrufen → Redirect auf `/fuer-agenturen?wall=no_plan` (Pricing-Wall, kein Gratis-Zugriff).

---

## Schritt 4 — Cleanup

### 4.1 Coupon entfernen

Stripe Dashboard → Coupons → `SMOKETEST-<DATUM>` → **Delete**. (Oder via `Redeem by` automatisch expiren lassen.)

### 4.2 Test-User aus DB entfernen (optional)

```sql
DELETE FROM users WHERE email LIKE '%+smoketest-%@gmail.com';
```

Zugehörige `scans`, `saved_websites`, `agency_settings` werden per `ON DELETE CASCADE` mit-gelöscht (falls FK so konfiguriert) — sonst explizit löschen.

### 4.3 Stripe-Customer löschen (optional)

Im Stripe Dashboard → Customers → Test-Email suchen → **Delete customer**. Stripe behält die Sub-Historie zu Reporting-Zwecken, der Kunde wird aber als gelöscht markiert.

---

## Was tun bei Fehlern

| Symptom | Wahrscheinliche Ursache | Fix |
|---|---|---|
| `/checkout-success` zeigt rotes "Etwas ist schiefgelaufen" | Webhook-Sig invalid oder `STRIPE_WEBHOOK_SECRET` leer | Vercel-ENV checken (`feedback_prod_env_verify`). Send-Test-Webhook im Stripe-Dashboard. |
| Welcome-Mail kommt nicht | `RESEND_API_KEY` leer oder Resend-Domain nicht verifiziert | Vercel-ENV + Resend-Dashboard checken. |
| Dashboard redirected zurück auf `/fuer-agenturen?wall=no_plan` trotz erfolgreichem Stripe-Kauf | Webhook hat Plan nicht gesetzt **und** verify-checkout-Fallback hat auch nicht gegriffen | Stripe-Logs prüfen, ob Webhook 200 zurückgegeben hat. Bei 4xx/5xx: Server-Logs in Vercel. |
| KI-Auto-Fix oder Executive Summary gibt 403 trotz Pro-Plan | JWT-Token noch stale (Plan steht in DB, nicht im Session-Token) | Aus- und wieder einloggen. Wenn dauerhaft: `auth.ts:78` (jwt-callback) liest aus DB — sollte beim Login frisch sein. |
| `STRIPE_PRICE_STARTER` Fehlerseite | Vercel-ENV fehlt | Stripe Live → Products → 29€-Price-ID kopieren → in Vercel als `STRIPE_PRICE_STARTER` anlegen → redeploy. |

---

## Checkliste-Kurzversion (für Folge-Tests)

```
Pro-Pfad:
□ Coupon erstellt, Inkognito offen
□ /fuer-agenturen → Pro → /register → Stripe (100%-Coupon) → /checkout-success
□ Dashboard lädt, Pro-Theme, Welcome-Mail kommt
□ Settings → Plan-Badge Pro, Stripe-Portal-Button öffnet
□ Scan läuft durch, KI-Snippets laden, Agency-Branding erreichbar
□ DB: plan = 'professional', stripe_customer_id gesetzt

Agency-Pfad:
□ Wie oben, andere Email, Agency-CTA
□ Clients / Lead-Generator / Team / Custom-Domain / SMTP alle erreichbar
□ DB: plan = 'agency'

Cancel:
□ Stripe-Portal → Sub kündigen
□ DB: plan = NULL, /dashboard → /fuer-agenturen?wall=no_plan

Cleanup:
□ Coupon gelöscht, Test-User aus DB entfernt
```
