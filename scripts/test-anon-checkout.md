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

In einem **zweiten Terminal**.

### PowerShell (Windows)

```powershell
stripe trigger checkout.session.completed `
  --add "checkout_session:metadata[kind]=rescue_guide_anon" `
  --add "checkout_session:metadata[guide_id]=hosting-speed" `
  --add "checkout_session:metadata[hoster]=hetzner" `
  --add "checkout_session:metadata[email]=test@website-fix.com"
```

### Bash (macOS/Linux)

```sh
stripe trigger checkout.session.completed \
  --add "checkout_session:metadata[kind]=rescue_guide_anon" \
  --add "checkout_session:metadata[guide_id]=hosting-speed" \
  --add "checkout_session:metadata[hoster]=hetzner" \
  --add "checkout_session:metadata[email]=test@website-fix.com"
```

**Warum keine `customer_details[email]`, `mode=payment` oder `payment_status=paid`-Overrides?**
Stripe API (Stand 2026-01-28.clover) rejected `customer_details` und `payment_status` als Create-Parameter — beides wird vom Backend gesetzt, nicht vom Client. `mode=payment` ist Default der Trigger-Fixture, Override-Versuche kollidieren mit der `payment_method`-Confirm-Phase. Wir lassen die Default-Fixture laufen und überschreiben nur die `metadata`, die unser Webhook-Branch-Routing braucht.

**Erwartetes Verhalten:**

1. `stripe listen`-Terminal zeigt `checkout.session.completed` → forwarded → 200 (plus `[200]` für `product.created`, `price.created`, `payment_intent.*`, `charge.*` — alle Events durchlaufen den Webhook, fallen aber durch alle Type-Klauseln und returnen sauber `received: true`).
2. Dev-Server-Log (`npm run dev`) zeigt:
   ```
   [stripe-webhook] anon guide token issued: guide=hosting-speed email=stripe@example.com token=ab12cd34…
   ```
   Die E-Mail ist `stripe@example.com` (Stripe-Default-Customer aus der Trigger-Fixture), nicht `test@website-fix.com`. Der Webhook-Code (`route.ts:74`) hat `session.customer_details?.email` Vorrang vor `session.metadata.email` — die Fixture setzt eigenes `customer_details`. Für den Code-Pfad-Test irrelevant: Token wird erzeugt, Online-Bericht rendert.
3. Bei gesetztem `RESEND_API_KEY` zusätzlich:
   ```
   [stripe-webhook] anon guide email sent to stripe@example.com (Resend id …)
   ```

## Schritt 3 — Token in DB verifizieren

Auf Windows ohne lokales `psql`: im Neon-Dashboard → SQL Editor:

```sql
SELECT token, guide_id, hoster, email, expires_at, created_at
FROM guide_access_tokens
WHERE email = 'stripe@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

Auf macOS/Linux mit `psql`:

```sh
psql "$DATABASE_URL" -c "
  SELECT token, guide_id, hoster, email, expires_at, created_at
  FROM guide_access_tokens
  WHERE email = 'stripe@example.com'
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

`stripe trigger` erzeugt jedes Mal eine **neue** Session-ID — daher entsteht bei jedem Aufruf eine neue Row. Echte Idempotenz testet man, indem man dasselbe Event mit derselben Session-ID nochmal an den Endpoint feuert:

```powershell
stripe events resend <evt_id-aus-stripe-listen>
```

**Erwartet bei Resend desselben Events:**
- Webhook returnt 200
- Keine zweite Row in `guide_access_tokens` (ON CONFLICT (stripe_session_id) DO NOTHING)
- Dev-Server-Log zeigt den existierenden Token nochmal (Race-Branch)

Für reine Happy-Path-Verifikation kann dieser Schritt übersprungen werden.

## Häufige Stolperfallen

- **Alle Events kriegen `[400]`**: Signatur-Verifikation gescheitert. Ursache praktisch immer entweder (a) `STRIPE_WEBHOOK_SECRET` in `.env.local` ist leer/falsch oder (b) Dev-Server wurde nach `.env.local`-Update nicht neu gestartet. `stripe listen` generiert bei JEDEM Start ein neues ephemeres `whsec_…` — alte Werte sind sofort tot.
- **Vercel ENV ≠ `.env.local`**: lokales `npm run dev` liest ausschließlich `.env.local`. Vercel ENV ist nur für Production-Deploys auf website-fix.com. Niemals den `whsec_…` von `stripe listen` in Vercel ENV eintragen — das ist nur ein lokaler Test-Secret.
- **Resend Test-Mode**: Resend liefert Test-Mails nur an die in deren Dashboard verifizierte Adresse. Falls Mail nicht ankommt → Resend-Dashboard → Logs prüfen.
- **PDF-Render-Failure**: Falls `renderGuidePdfBuffer` wirft, wird die Mail trotzdem versendet (ohne Attachment). Im Dev-Server-Log erscheint `[stripe-webhook] PDF-Render failed:` als Hinweis.
- **`stripe trigger` schlägt mit `parameter_unknown` fehl**: vermutlich überschreibst du `customer_details`, `payment_status`, oder ähnliche Backend-managed Felder — Stripe API rejected die seit 2024. Halte dich an die Metadata-Only-Variante in Schritt 2.

## Cleanup nach dem Test

Im Neon SQL Editor:

```sql
DELETE FROM guide_access_tokens WHERE email = 'stripe@example.com';
```

Plus: Terminals A und B mit `Ctrl+C` beenden.
