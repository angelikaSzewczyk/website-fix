import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";
import { renderGuidePdfBuffer } from "@/lib/pdf/render-guide-pdf";
import type { RescueGuide } from "@/lib/rescue-guides";

/** Invalidiert den scan_cache für alle URLs, die dieser User schonmal gescannt hat.
 *  Wird bei JEDEM Plan-Wechsel gerufen — sonst sieht ein frisch upgegradeter
 *  Agency-Kunde noch bis zu 24h den alten 10-Subpages-Scan aus dem Cache.
 *  Failure-Mode: silently — Plan-Upgrade darf nicht hängen wenn Cache-Tabelle
 *  fehlt oder Berechtigungen fehlen. Nächster Scan füllt den Cache eh neu.
 *  Hinweis: erstellt eine neue neon-Instance — neon poolt intern, daher
 *  kein Performance-Issue durch wiederholte Connections pro Webhook-Event. */
async function invalidateScanCacheForUser(userId: string): Promise<void> {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      DELETE FROM scan_cache
      WHERE url IN (SELECT DISTINCT url FROM scans WHERE user_id = ${userId})
    `;
  } catch (err) {
    console.warn(`[stripe-webhook] scan_cache invalidation failed for user ${userId}:`, err);
  }
}

/** Returns the plan key for a Stripe price ID, or null if unknown.
 *  null = abort the DB update — we never silently downgrade to "free" on a mystery price. */
function priceIdToPlan(priceId: string | undefined): string | null {
  if (!priceId) return null;
  if (process.env.STRIPE_PRICE_STARTER        && priceId === process.env.STRIPE_PRICE_STARTER)        return "starter";
  if (process.env.STRIPE_PRICE_PROFESSIONAL   && priceId === process.env.STRIPE_PRICE_PROFESSIONAL)   return "professional";
  if (process.env.STRIPE_PRICE_SMART_GUARD    && priceId === process.env.STRIPE_PRICE_SMART_GUARD)    return "professional"; // legacy alias
  if (process.env.STRIPE_PRICE_AGENCY         && priceId === process.env.STRIPE_PRICE_AGENCY)         return "agency";
  if (process.env.STRIPE_PRICE_AGENCY_STARTER && priceId === process.env.STRIPE_PRICE_AGENCY_STARTER) return "agency"; // legacy alias
  // CRITICAL: unknown price — log loudly and abort. Never fall back to "free".
  console.error(
    `[stripe-webhook] CRITICAL: Unknown priceId '${priceId}' — plan upgrade ABORTED.` +
    ` Check STRIPE_PRICE_* env vars in Vercel. No DB update performed.`
  );
  return null;
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // ── Anon-Guide-Branch (Pay-per-Fix, kein Konto) ───────────────────
    // 9,90-€-Käufer bekommt einen 4-Wochen-Online-Token + dauerhaftes PDF
    // im Postfach. KEIN User-Konto — sonst landet er in einem 29 €/Mo
    // Starter-Dashboard, was konzeptionell falsch ist (Einmalkauf vs. Abo).
    //
    // Idempotenz: UNIQUE(stripe_session_id) auf guide_access_tokens. Bei
    // doppelter Webhook-Delivery liefert der INSERT … ON CONFLICT … RETURNING
    // einen leeren Result-Set, dann fischen wir den existierenden Token raus.
    if (session.mode === "payment" && session.metadata?.kind === "rescue_guide_anon") {
      const guideId   = session.metadata.guide_id;
      const hoster    = session.metadata.hoster ?? "default";
      const paidCents = session.amount_total ?? 0;
      const buyerEmail = (session.customer_details?.email ?? session.metadata.email ?? "")
        .trim().toLowerCase();

      if (!guideId || !buyerEmail) {
        console.error("[stripe-webhook] CRITICAL: rescue_guide_anon missing guideId or email", {
          sessionId: session.id, hasGuideId: Boolean(guideId), hasEmail: Boolean(buyerEmail),
        });
        return NextResponse.json({ error: "missing_metadata", sessionId: session.id }, { status: 400 });
      }

      try {
        // Token-Insert race-safe via UNIQUE(stripe_session_id).
        // RETURNING token, expires_at — wir brauchen beide für die Mail.
        const tokenInsert = await sql`
          INSERT INTO guide_access_tokens
            (guide_id, email, hoster, stripe_session_id, paid_amount_cents)
          VALUES
            (${guideId}, ${buyerEmail}, ${hoster}, ${session.id}, ${paidCents})
          ON CONFLICT (stripe_session_id) DO NOTHING
          RETURNING token, expires_at
        ` as Array<{ token: string; expires_at: string }>;

        let tokenValue:    string;
        let tokenExpires:  string;
        if (tokenInsert[0]?.token) {
          tokenValue   = tokenInsert[0].token;
          tokenExpires = tokenInsert[0].expires_at;
        } else {
          // Race oder Re-Delivery: existierender Token holen.
          const existing = await sql`
            SELECT token, expires_at FROM guide_access_tokens
            WHERE stripe_session_id = ${session.id}
            LIMIT 1
          ` as Array<{ token: string; expires_at: string }>;
          if (!existing[0]?.token) {
            throw new Error(`anon token resolution failed for session=${session.id}`);
          }
          tokenValue   = existing[0].token;
          tokenExpires = existing[0].expires_at;
        }

        console.log(`[stripe-webhook] anon guide token issued: guide=${guideId} email=${buyerEmail} token=${tokenValue.slice(0,8)}…`);

        if (process.env.RESEND_API_KEY) {
          try {
            const baseUrl   = process.env.NEXTAUTH_URL ?? "https://website-fix.com";
            const guideUrl  = `${baseUrl}/g/${tokenValue}`;
            const expiresOn = new Date(tokenExpires).toLocaleDateString("de-DE", {
              day: "2-digit", month: "long", year: "numeric",
            });

            // PDF-Anhang generieren (best-effort) — der dauerhafte Beleg.
            let pdfAttachment: { filename: string; content: Buffer } | null = null;
            try {
              const guideRows = await sql`
                SELECT id, title, problem_label, preview, price_cents,
                       stripe_price_id, estimated_minutes, content_json, active
                FROM rescue_guides WHERE id = ${guideId} LIMIT 1
              ` as Array<RescueGuide>;
              if (guideRows[0]) {
                const buffer = await renderGuidePdfBuffer({
                  guide:           guideRows[0],
                  hoster,
                  buyerEmail,
                  stripeSessionId: session.id,
                });
                const safeId = guideId.replace(/[^a-z0-9-]/gi, "");
                pdfAttachment = {
                  filename: `WebsiteFix-Guide-${safeId}.pdf`,
                  content:  buffer,
                };
              }
            } catch (pdfErr) {
              console.error("[stripe-webhook] anon guide PDF render failed:", pdfErr);
              // Admin-Alert bei PDF-Render-Failure — sonst silent. Best-effort
              // (alerting darf den Webhook-Response nicht blockieren). Pricing-
              // Card verspricht "PDF dauerhaft im Postfach" — wenn das systematisch
              // versagt (z.B. Font-Asset fehlt nach Deploy), wollen wir es am
              // Launch-Tag sofort wissen, nicht via Support-Ticket. (12.05.2026 Y2)
              try {
                const adminEmail = process.env.ADMIN_EMAIL;
                if (adminEmail && process.env.RESEND_API_KEY) {
                  const adminResend = new Resend(process.env.RESEND_API_KEY);
                  const errMsg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
                  await adminResend.emails.send({
                    from:    "WebsiteFix Alerts <noreply@website-fix.com>",
                    to:      adminEmail,
                    subject: `[ALERT] PDF-Render fehlgeschlagen — Guide ${guideId}`,
                    html: `<p>Stripe-Webhook konnte für Käufer <code>${buyerEmail}</code> kein PDF für Guide <code>${guideId}</code> rendern.</p>
                           <p>Käufer hat den Online-Link erhalten, das PDF im Mail-Anhang fehlt.</p>
                           <p><strong>Fehler:</strong> <code>${errMsg.slice(0, 500)}</code></p>
                           <p>Session: <code>${session.id}</code></p>`,
                  }).catch(() => { /* alerting failure ist non-fatal */ });
                }
              } catch { /* alerting failure ist non-fatal */ }
            }

            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from:    "WebsiteFix <noreply@website-fix.com>",
              to:      buyerEmail,
              subject: "Dein Fix-Guide ist da ✓",
              html: `
                <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F172A;">
                  <h2 style="margin:0 0 12px;font-size:20px;">Dein Fix-Guide ist da.</h2>
                  <p style="margin:0 0 16px;line-height:1.6;color:#475569;">
                    Vielen Dank für deinen Kauf. Du hast deinen Fix-Guide auf zwei Wegen — <strong>kein Konto, kein Login</strong> nötig:
                  </p>
                  ${pdfAttachment ? `
                  <div style="margin:14px 0 18px;padding:14px 16px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#166534;">
                      📎 1. PDF im Anhang dieser Mail
                    </p>
                    <p style="margin:0;font-size:13px;color:#166534;line-height:1.55;">
                      Der komplette Guide zum Speichern oder Drucken — bleibt dauerhaft in deinem Postfach, auch in Jahren noch.
                    </p>
                  </div>
                  ` : ""}
                  <div style="margin:0 0 18px;padding:14px 16px;background:#F5F3FF;border:1px solid #DDD6FE;border-radius:8px;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#5B21B6;">
                      🔗 ${pdfAttachment ? "2. " : ""}Online-Bericht (4 Wochen aktiv)
                    </p>
                    <p style="margin:0 0 12px;font-size:13px;color:#5B21B6;line-height:1.55;">
                      Eine Online-Version mit Code-Copy-Buttons und Klick-Pfaden für deinen Hoster — verfügbar bis <strong>${expiresOn}</strong>.
                    </p>
                    <a href="${guideUrl}" style="display:inline-block;padding:11px 22px;background:#7C3AED;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:13.5px;">
                      Online-Bericht öffnen →
                    </a>
                  </div>
                  <p style="margin:0 0 6px;font-size:12px;color:#64748B;line-height:1.55;">
                    Brauchst du dauerhaften Online-Zugriff plus alle 7 Guides?
                    <a href="${baseUrl}/fuer-agenturen?upgrade=professional#pricing" style="color:#10B981;font-weight:700;text-decoration:none;">Professional ansehen →</a>
                  </p>
                  <p style="margin:20px 0 6px;padding:10px 12px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;font-size:11.5px;color:#92400E;line-height:1.5;">
                    💡 <strong>Damit du keine Mails verpasst:</strong> bitte
                    <strong>noreply@website-fix.com</strong> zu deinen Kontakten hinzufügen
                    oder als „kein Spam" markieren — vor allem bei web.de/GMX-Postfächern.
                  </p>
                  <p style="margin:14px 0 0;font-size:12px;color:#94A3B8;">
                    Beleg: Stripe-Session ${session.id} · Betrag ${(paidCents/100).toFixed(2).replace(".",",")} €
                  </p>
                </div>
              `,
              attachments: pdfAttachment ? [pdfAttachment] : undefined,
            });
          } catch (mailErr) {
            console.error("[stripe-webhook] anon guide mail failed:", mailErr);
          }
        }
      } catch (err) {
        console.error("[stripe-webhook] anon guide token issue failed:", err);
        return NextResponse.json({ error: "anon_token_failed", sessionId: session.id }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }

    // ── Branch-Routing per metadata.kind ──────────────────────────────
    // mode === "payment" + metadata.kind === "rescue_guide" → User-Unlock
    // mode === "subscription" → klassischer Plan-Upgrade (siehe unten)
    if (session.mode === "payment" && session.metadata?.kind === "rescue_guide") {
      const guideId = session.metadata.guide_id;
      const userId  = session.metadata.user_id;
      const hoster  = session.metadata.hoster ?? "default";
      const paidCents = session.amount_total ?? 0;

      if (!guideId || !userId) {
        // 400 statt 200 — Stripe retried den Webhook bei 4xx/5xx automatisch
        // (Dunning-Flow, ~3 Tage). Bei 200 wäre der Unlock SILENT verloren.
        // Wenn die metadata wirklich fehlen (Stripe-Console-Manipulation,
        // Bug im checkout.create), wollen wir das in den Stripe-Logs sehen.
        console.error("[stripe-webhook] CRITICAL: rescue_guide payment missing metadata — returning 400 to trigger Stripe retry", {
          sessionId: session.id,
          hasGuideId: Boolean(guideId),
          hasUserId:  Boolean(userId),
        });
        return NextResponse.json(
          { error: "missing_metadata", sessionId: session.id },
          { status: 400 },
        );
      }

      try {
        await sql`
          INSERT INTO user_unlocked_guides (user_id, guide_id, stripe_session_id, paid_amount_cents, hoster)
          VALUES (${userId}::int, ${guideId}, ${session.id}, ${paidCents}, ${hoster})
          ON CONFLICT (user_id, guide_id) DO NOTHING
        `;
        console.log(`[stripe-webhook] guide unlocked: user=${userId} guide=${guideId} hoster=${hoster}`);

        // Auch eingeloggte Käufer bekommen die Mail mit PDF-Anhang —
        // Lebenslang-Beleg unabhängig vom Server-Status.
        if (process.env.RESEND_API_KEY) {
          try {
            const userRows = await sql`
              SELECT email FROM users WHERE id = ${userId}::int LIMIT 1
            ` as Array<{ email: string }>;
            const buyerEmail = userRows[0]?.email;
            if (!buyerEmail) {
              console.warn(`[stripe-webhook] no email for user=${userId} — skipping confirmation mail`);
            } else {
              const baseUrl = process.env.NEXTAUTH_URL ?? "https://website-fix.com";
              let pdfAttachment: { filename: string; content: Buffer } | null = null;
              try {
                const guideRows = await sql`
                  SELECT id, title, problem_label, preview, price_cents,
                         stripe_price_id, estimated_minutes, content_json, active
                  FROM rescue_guides WHERE id = ${guideId} LIMIT 1
                ` as Array<RescueGuide>;
                if (guideRows[0]) {
                  const buffer = await renderGuidePdfBuffer({
                    guide:           guideRows[0],
                    hoster,
                    buyerEmail,
                    stripeSessionId: session.id,
                  });
                  const safeId = guideId.replace(/[^a-z0-9-]/gi, "");
                  pdfAttachment = {
                    filename: `WebsiteFix-Guide-${safeId}.pdf`,
                    content:  buffer,
                  };
                }
              } catch (pdfErr) {
                console.error("[stripe-webhook] guide PDF render failed:", pdfErr);
              }

              const resend = new Resend(process.env.RESEND_API_KEY);
              await resend.emails.send({
                from:    "WebsiteFix <noreply@website-fix.com>",
                to:      buyerEmail,
                subject: "Dein Fix-Guide ist freigeschaltet ✓",
                html: `
                  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0F172A;">
                    <h2 style="margin:0 0 12px;font-size:20px;">Dein Fix-Guide ist bereit.</h2>
                    <p style="margin:0 0 16px;line-height:1.6;color:#475569;">
                      Vielen Dank für deinen Kauf. Der Guide ist in deinem Dashboard freigeschaltet.
                    </p>
                    ${pdfAttachment ? `
                    <div style="margin:14px 0 18px;padding:12px 14px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;">
                      <p style="margin:0;font-size:13px;color:#166534;">
                        📎 <strong>Anbei als PDF:</strong> die komplette Anleitung zum Speichern oder Drucken.
                        Online-Zugriff über das Dashboard bleibt unbegrenzt erhalten.
                      </p>
                    </div>
                    ` : ""}
                    <a href="${baseUrl}/dashboard/guides/${guideId}" style="display:inline-block;padding:12px 22px;background:#10B981;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">
                      Zum Guide →
                    </a>
                    <p style="margin:20px 0 6px;padding:10px 12px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;font-size:11.5px;color:#92400E;line-height:1.5;">
                      💡 <strong>Damit du keine Mails verpasst:</strong> bitte
                      <strong>noreply@website-fix.com</strong> zu deinen Kontakten hinzufügen
                      oder als „kein Spam" markieren — vor allem bei web.de/GMX-Postfächern.
                    </p>
                    <p style="margin:14px 0 0;font-size:12px;color:#94A3B8;">
                      Beleg: Stripe-Session ${session.id} · Betrag ${(paidCents/100).toFixed(2).replace(".",",")} €
                    </p>
                  </div>
                `,
                attachments: pdfAttachment ? [pdfAttachment] : undefined,
              });
            }
          } catch (mailErr) {
            console.error("[stripe-webhook] guide confirmation mail failed:", mailErr);
          }
        }
      } catch (err) {
        console.error("[stripe-webhook] guide unlock failed:", err);
      }
      return NextResponse.json({ received: true });
    }

    // ── Subscription-Pfad (Plan-Upgrade) ──────────────────────────────
    const email = session.customer_details?.email;
    if (!email) return NextResponse.json({ received: true });

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });
    const priceId = fullSession.line_items?.data?.[0]?.price?.id;
    const plan = priceIdToPlan(priceId);
    if (!plan) return NextResponse.json({ received: true }); // unknown price — already logged

    const subscriptionId = (session.subscription as string | null) ?? null;
    const updated = await sql`
      UPDATE users
      SET plan = ${plan},
          stripe_customer_id = ${session.customer as string},
          stripe_subscription_id = ${subscriptionId}
      WHERE email = ${email.toLowerCase()}
      RETURNING id
    ` as { id: string }[];

    // Cache-Invalidierung: Plan-Wechsel muss sofort wirksam sein, sonst
    // läuft der nächste Scan in den 24h-Cache vom alten Plan.
    if (updated[0]?.id) {
      await invalidateScanCacheForUser(updated[0].id);
    }

    console.log(`[stripe-webhook] Plan upgraded: ${email} → ${plan} (sub: ${subscriptionId})`);
  }

  if (event.type === "customer.subscription.deleted") {
    // Subscription endgültig beendet (nach Period-End oder Failed-Payment-Final).
    // Plan auf NULL setzen — Dashboard zeigt Pricing-Wall, kein Geschenk-
    // Downgrade auf 'starter' (was wieder ein zahlpflichtiger Plan wäre).
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const updated = await sql`
      UPDATE users SET plan = NULL, stripe_subscription_id = NULL
      WHERE stripe_customer_id = ${customerId}
      RETURNING id
    ` as { id: string }[];
    if (updated[0]?.id) await invalidateScanCacheForUser(updated[0].id);
    console.log(`[stripe-webhook] subscription deleted → plan=NULL for customer=${customerId}`);
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const status = sub.status;
    if (status === "active") {
      const priceId = sub.items.data[0]?.price?.id;
      const plan = priceIdToPlan(priceId);
      if (!plan) return NextResponse.json({ received: true }); // unknown price — already logged
      const updated = await sql`
        UPDATE users SET plan = ${plan} WHERE stripe_customer_id = ${customerId}
        RETURNING id
      ` as { id: string }[];
      if (updated[0]?.id) await invalidateScanCacheForUser(updated[0].id);
    } else if (status === "canceled" || status === "unpaid") {
      // Selbe Logik wie subscription.deleted: Plan auf NULL → Pricing-Wall.
      const updated = await sql`
        UPDATE users SET plan = NULL, stripe_subscription_id = NULL
        WHERE stripe_customer_id = ${customerId}
        RETURNING id
      ` as { id: string }[];
      if (updated[0]?.id) await invalidateScanCacheForUser(updated[0].id);
      console.log(`[stripe-webhook] subscription ${status} → plan=NULL for customer=${customerId}`);
    }
  }

  // Fehlgeschlagene Abo-Erneuerung (z. B. Karte abgelaufen, Limit erschöpft).
  // Stripe versucht es automatisch 3–4× über mehrere Tage (Smart Retries / Dunning).
  // Erst beim finalen Fehlschlag feuert customer.subscription.deleted → Plan → free.
  // Hier loggen wir den ersten Fehlschlag für Monitoring und optionale E-Mail.
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = invoice.customer as string;
    if (invoice.billing_reason === "subscription_cycle") {
      console.warn(`Abo-Zahlung fehlgeschlagen: customer=${customerId}, invoice=${invoice.id}, attempt=${invoice.attempt_count}`);
      // TODO: Resend-E-Mail an Nutzer schicken ("Ihre Zahlung ist fehlgeschlagen")
      // Erst nach subscription.deleted den Plan auf 'free' setzen — nicht hier.
    }
  }

  return NextResponse.json({ received: true });
}
