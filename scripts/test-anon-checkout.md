# Stripe Test-Mode E2E — Anon Pay-per-Guide

Lokales End-to-End-Test der anonymen Pay-per-Guide-Strecke (9,90 €). Klärt vor jedem Deploy ab, dass Webhook → Token-Insert → Resend-Mail komplett durchlaufen.

## Voraussetzungen

1. **Stripe-CLI** installiert: https://docs.stripe.com/stripe-cli
2. In Test-Mode eingeloggt:
   ```sh
   stripe login
   ```
3. Lokaler Dev-Server läuft: `npm run dev` (Port 3000)
4. ENV-Vars im `.env.local`:
   - `STRIPE_SECRET_KEY=sk_test_…`
   - `STRIPE_WEBHOOK_SECRET=whsec_…` (kommt aus `stripe listen` unten)
   - `RESEND_API_KEY=re_test_…` (optional — wenn nicht gesetzt, wird die Mail geskipt und es bleibt nur der Token-Insert)
   - `NEXTAUTH_URL=http://localhost:3000`
   - `DATABASE_URL=…` (Neon datapulse)

## Schritt 1 — Webhook-Forwarding starten

In einem **eigenen Terminal**:

```sh
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Output zeigt eine `whsec_…`-Zeile — als `STRIPE_WEBHOOK_SECRET` in `.env.local` einsetzen, Dev-Server neu starten.

Das Terminal lässt du laufen — jedes geforwardete Event wird live geloggt.

## Schritt 2 — Anon-Checkout simulieren

In einem **zweiten Terminal**:

```sh
stripe trigger checkout.session.completed \
  --add checkout_session:mode=payment \
  --add checkout_session:payment_status=paid \
  --add "checkout_session:metadata[kind]=rescue_guide_anon" \
  --add "checkout_session:metadata[guide_id]=hosting-speed" \
  --add "checkout_session:metadata[hoster]=hetzner" \
  --add "checkout_session:customer_details[email]=test@website-fix.com"
```

**Erwartetes Verhalten:**

1. `stripe listen`-Terminal zeigt `checkout.session.completed` → forwarded → 200
2. Dev-Server-Log (`npm run dev`) zeigt:
   ```
   [stripe-webhook] anon guide token issued: guide=hosting-speed email=test@website-fix.com token=ab12cd34…
   ```
3. Bei gesetztem `RESEND_API_KEY` zusätzlich:
   ```
   [stripe-webhook] anon guide email sent to test@website-fix.com (Resend id …)
   ```

## Schritt 3 — Token in DB verifizieren

```sh
psql "$DATABASE_URL" -c "
  SELECT token, guide_id, hoster, email, expires_at, created_at
  FROM guide_access_tokens
  WHERE email = 'test@website-fix.com'
  ORDER BY created_at DESC
  LIMIT 1;
"
```

Erwartet: 1 Row, `expires_at` ≈ NOW + 4 Wochen, `hoster = 'hetzner'`.

## Schritt 4 — Online-Bericht abrufen

URL aus dem Webhook-Log nehmen (oder aus DB):

```
http://localhost:3000/g/<token>
```

Erwartet:
- Heading "Hosting & Performance Fix" (oder Guide-Titel)
- Hoster-Tab "Hetzner" ist gewählt (aus `metadata.hoster`)
- 3 Hetzner-Schritte aus `content_json.variants.hetzner.steps` werden gerendert
- Code-Copy-Buttons funktionieren

## Schritt 5 — Idempotenz testen

Den gleichen `stripe trigger`-Befehl erneut ausführen mit derselben Session-ID. **Erwartet:**
- Webhook returnt 200
- Keine zweite Row in `guide_access_tokens` (ON CONFLICT (stripe_session_id) DO NOTHING)
- Dev-Server-Log zeigt den existierenden Token nochmal (Race-Branch)

## Bekannte Risiken

- **stripe trigger erzeugt eine vollständige synthetische Session** — payment_intent + customer_details kommen aus den `--add`-Overrides. Wenn ein Feld fehlt (z.B. `customer_details.email`), fällt der Code auf `session.metadata.email` zurück.
- **Resend Test-Mode**: Resend liefert Test-Mails nur an die in deren Dashboard verifizierte Adresse. Falls Mail nicht ankommt → Resend-Dashboard → Logs prüfen.
- **PDF-Render-Failure**: Falls `renderGuidePdfBuffer` wirft, wird die Mail trotzdem versendet (ohne Attachment). Im Dev-Server-Log erscheint `[stripe-webhook] PDF-Render failed:` als Hinweis.

## Cleanup nach dem Test

```sh
psql "$DATABASE_URL" -c "
  DELETE FROM guide_access_tokens WHERE email = 'test@website-fix.com';
"
```
