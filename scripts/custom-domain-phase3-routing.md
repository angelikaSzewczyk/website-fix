# Custom-Domain Phase 3 — Middleware-Routing (deferred)

Phase 1 (DB-Schema `agency_settings.custom_domain_verified_at` + Settings-UI mit Status-Pill) und Phase 2 (`/api/agency-settings/verify-domain` mit DNS-CNAME-Lookup) sind live seit 12.05.2026. Was hier folgt ist Phase 3 — der eigentliche Request-Rewrite, der Custom-Domain-Hostnames auf die Kunden-Portal-Sicht routet.

## Was Phase 3 braucht

1. **Vercel-Domain-Anbindung** (Production-Konfiguration)
   - Vercel Project → Domains → Wildcard-CNAME oder explizite Domain-Add via Vercel REST-API
   - VERCEL_TOKEN als ENV-Secret
   - SSL-Cert wird automatisch von Vercel via Let's Encrypt erzeugt (sobald CNAME stimmt)
   - Multi-Tenant-Routing-Strategie: alle Custom-Domains zeigen via CNAME auf denselben Vercel-Endpoint (z.B. `portal.website-fix.com`), Next.js erkennt den `Host`-Header

2. **Middleware-Lookup**
   - `src/middleware.ts` erweitern: Wenn Hostname nicht `website-fix.com` und nicht `*.website-fix.com`:
     - Tenant-Lookup-API rufen: `GET /api/tenant/by-domain?host=<hostname>` (Node-Runtime, mit Cache)
     - Bei Match → `req.nextUrl.rewrite()` auf `/view/[token]?tenant=<user_id>` oder eigene `/_portal/[token]`-Route
     - Bei No-Match → `NextResponse.next()` (404 oder Public-Redirect)

3. **Tenant-Lookup-Endpoint** (NEU)
   - `src/app/api/tenant/by-domain/route.ts` (Node-Runtime — Edge kann nicht direkt Neon)
   - Cached via `unstable_cache` mit ~5-Min-TTL (Custom-Domain-Mapping ändert sich selten)
   - SELECT user_id, primary_color, logo_url FROM agency_settings WHERE custom_domain = lower(host) AND custom_domain_verified_at IS NOT NULL

4. **Edge-Caching**
   - Vercel Edge Config oder In-Memory-Map mit TTL (~5 Min)
   - Begrenzt DB-Roundtrips pro Custom-Domain-Request

## Sicherheits-Anforderungen

- **Cross-Tenant-Isolation**: `/view/[token]` muss zusätzlich `scan.user_id = <tenant>` prüfen, damit kein Endkunde via cross-posted Token einen Scan einer anderen Agency öffnen kann.
- **Strict Origin-Validation für `/api/leads/capture`**: schon implementiert (Z29 in `api/leads/capture/route.ts`), aber Re-Audit nötig wenn Multi-Domain-Routing aktiv wird.
- **Subdomain-Hijacking-Schutz**: Vercel-Project sollte _nicht_ als Wildcard-Domain-Catcher fungieren, sonst kann ein Angreifer eigene Domain auf unseren Endpoint richten ohne dass wir den CNAME erwarten würden — die `custom_domain_verified_at IS NOT NULL`-Bedingung im Lookup ist hier der zentrale Schutz.

## Test-Plan vor Deploy

1. **Lokales Testing** über `/etc/hosts`-Mapping:
   ```
   127.0.0.1  portal.test-agency.local
   ```
   Dann `dev`-Server auf 3000, Browser auf `http://portal.test-agency.local:3000/<token>`. Middleware sollte Hostname erkennen + rewrite.

2. **Staging-Verifikation**: Eine Test-Domain (z.B. `portal-staging.website-fix.com`) mit CNAME auf einen Staging-Vercel-Endpoint setzen, vollen Flow durchspielen.

3. **Production-Smoke-Test mit echtem Agency-Kunden**: Eine Bestandskunden-Agency darf ihre eigene Custom-Domain produktiv testen, bevor wir das Feature breit ankündigen.

## Pricing-Card-Verbindung

Das Versprechen lautet aktuell: **"Kunden-Portal unter Ihrer Custom-Domain (Q3 — Bestandskunden behalten Preis)"**. Phase 1+2 liefern bereits die User-Vorbereitung (Domain eintragen + verifizieren); Phase 3 ist der eigentliche Q3-Release.

FAQ-Eintrag in `fuer-agenturen/page.tsx` Z187 ist abgestimmt: _"Wir aktivieren das Routing in Q3 und benachrichtigen Sie per E-Mail mit den DNS-CNAME-Anweisungen."_ — Phase 1+2 erfüllen genau diesen Vorbereitungs-Step.

## Abhängigkeiten / Blocker

- ENV-Var `CUSTOM_DOMAIN_TARGET` produktiv setzen (default `portal.website-fix.com`, könnte auch `cname.vercel-dns.com` werden — je nach Vercel-Setup)
- VERCEL_TOKEN für Domains-API-Calls
- Entscheidung: 1 Vercel-Project mit Multi-Tenant-Middleware vs. separates Vercel-Project für Portal-Subdomain. Empfehlung: 1 Project, Middleware-Routing.

## Aufwand-Schätzung

- Tenant-Lookup-API: ~2h
- Middleware-Erweiterung + Edge-Caching: ~3h
- Vercel-Domain-API-Wrapper für automatisches Add bei Verifikation: ~3h
- Test-Setup (lokal + staging): ~2h
- Total: ~1 Arbeitstag, davon ~3h Production-Konfiguration (Vercel + DNS-CNAME-Target abstimmen)
